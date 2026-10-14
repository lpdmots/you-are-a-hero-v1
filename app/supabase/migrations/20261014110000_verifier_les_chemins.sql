-- Étape 5 du plan, lot 2 : « Vérifier les chemins » (F09.2, F11.6).
-- Trois choses : les avertissements que l'adulte a acceptés (« C'est voulu »), le journal des
-- changements de chemins qui dit combien de temps une acceptation tient, et la déclaration
-- « J'ai vérifié les chemins ». Les contrôles eux-mêmes ne sont pas dans la base : ils se
-- calculent d'après le plan et ses liens (src/domaine/controles.ts).

-- ————————————————————————————————————————————————————————————————————————
-- Journal des changements de chemins
-- ————————————————————————————————————————————————————————————————————————

-- Une ligne chaque fois que les chemins qui partent d'une scène changent (« sortie »), ou
-- ceux qui y mènent (« entree ») : un choix ajouté, retiré ou redirigé, une liaison cachée, le
-- repère de fin. Une acceptation tient tant qu'aucune ligne de ses scènes n'est venue après
-- elle (F11-AC75) : ajouter puis retirer un choix rend des chemins identiques, que comparer
-- ne suffirait pas à voir. Une coquille n'en écrit aucune. On n'y fait qu'ajouter des
-- lignes : deux scènes enregistrées ensemble ne s'attendent jamais l'une l'autre.
create table public.chemins_changes (
  id bigint generated always as identity primary key,
  scene_id uuid not null,
  projet_id uuid not null,
  enseignant_id uuid not null,
  sens text not null check (sens in ('entree', 'sortie')),
  le timestamptz not null default clock_timestamp(),
  foreign key (scene_id, projet_id) references public.scenes (id, projet_id) on delete cascade,
  foreign key (projet_id, enseignant_id) references public.projets (id, enseignant_id) on delete cascade
);
create index chemins_changes_projet_idx on public.chemins_changes (projet_id, le);
create index chemins_changes_scene_idx on public.chemins_changes (scene_id);
create index chemins_changes_enseignant_idx on public.chemins_changes (enseignant_id);

-- Refaire les liens d'une scène d'après son texte, comme avant (20261010220000_choix_numeros),
-- et noter ce qui a changé : les chemins de la scène, et l'arrivée de chaque scène qu'un
-- chemin vise désormais, ou ne vise plus.
create or replace function prive.relier() returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  v_avant jsonb;
  v_apres jsonb;
begin
  if tg_op = 'UPDATE' and new.texte = old.texte then
    return new;
  end if;
  select coalesce(jsonb_agg(jsonb_build_object('r', l.renvoi_id, 'c', l.cible_id, 'k', l.cache) order by l.renvoi_id), '[]'::jsonb)
  into v_avant from public.liens l where l.scene_id = new.id;

  delete from public.liens l where l.scene_id = new.id;
  insert into public.liens (scene_id, renvoi_id, projet_id, enseignant_id, cible_id, libelle, cache, rang)
  select distinct on (r.renvoi_id) new.id, r.renvoi_id, new.projet_id, new.enseignant_id,
         (select s.id from public.scenes s where s.id::text = r.cible and s.projet_id = new.projet_id),
         left(r.libelle, 200), r.cache, r.rang
  from prive.renvois_du_texte(new.texte) r
  where r.renvoi_id is not null
  order by r.renvoi_id, r.rang;

  select coalesce(jsonb_agg(jsonb_build_object('r', l.renvoi_id, 'c', l.cible_id, 'k', l.cache) order by l.renvoi_id), '[]'::jsonb)
  into v_apres from public.liens l where l.scene_id = new.id;

  if v_avant <> v_apres then
    insert into public.chemins_changes (scene_id, projet_id, enseignant_id, sens)
    values (new.id, new.projet_id, new.enseignant_id, 'sortie');
    -- Les scènes visées par un chemin qui n'est plus le même, d'un côté ou de l'autre
    insert into public.chemins_changes (scene_id, projet_id, enseignant_id, sens)
    select distinct (x.lien ->> 'c')::uuid, new.projet_id, new.enseignant_id, 'entree'
    from (
      (select e as lien from jsonb_array_elements(v_avant) e except select e from jsonb_array_elements(v_apres) e)
      union
      (select e from jsonb_array_elements(v_apres) e except select e from jsonb_array_elements(v_avant) e)
    ) x
    where x.lien ->> 'c' is not null;
  end if;
  return new;
end
$$;

-- Le repère de fin compte parmi les chemins qui partent d'une scène : une boucle acceptée
-- « sans fin » n'est plus celle qu'on a jugée si l'une de ses scènes devient une fin.
create function prive.noter_fin() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if new.fin is distinct from old.fin then
    insert into public.chemins_changes (scene_id, projet_id, enseignant_id, sens)
    values (new.id, new.projet_id, new.enseignant_id, 'sortie');
  end if;
  return new;
end
$$;
create trigger scenes_noter_fin
  after update of fin on public.scenes
  for each row execute function prive.noter_fin();

-- ————————————————————————————————————————————————————————————————————————
-- Avertissements acceptés
-- ————————————————————————————————————————————————————————————————————————

-- « C'est voulu » : la clé du point (src/domaine/controles.ts), ses scènes telles qu'elles ont
-- été jugées, et le moment. Un problème bloquant ne s'accepte pas ; c'est la page qui ne le
-- propose pas, et une acceptation qui viserait un tel point ne compte pas.
create table public.avertissements_acceptes (
  projet_id uuid not null,
  enseignant_id uuid not null,
  cle text not null check (char_length(cle) between 1 and 40000),
  empreinte text not null check (char_length(empreinte) <= 40000),
  accepte_le timestamptz not null default clock_timestamp(),
  primary key (projet_id, cle),
  foreign key (projet_id, enseignant_id) references public.projets (id, enseignant_id) on delete cascade
);
create index avertissements_acceptes_enseignant_idx on public.avertissements_acceptes (enseignant_id);

-- Accepter, ou accepter de nouveau ce qui a changé : la date est celle de la base
create function public.accepter_avertissement(p_projet uuid, p_cle text, p_empreinte text) returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v_enseignant uuid;
begin
  select p.enseignant_id into v_enseignant from public.projets p where p.id = p_projet and p.enseignant_id = (select auth.uid());
  if not found then
    raise exception 'Ce projet n''existe plus.' using errcode = 'P0001';
  end if;
  insert into public.avertissements_acceptes (projet_id, enseignant_id, cle, empreinte)
  values (p_projet, v_enseignant, p_cle, coalesce(p_empreinte, ''))
  on conflict (projet_id, cle) do update set empreinte = excluded.empreinte, accepte_le = clock_timestamp();
end
$$;

-- ————————————————————————————————————————————————————————————————————————
-- « J'ai vérifié les chemins »
-- ————————————————————————————————————————————————————————————————————————

-- La déclaration de l'adulte, posée ou retirée (F11.6). Elle est gardée quand une scène est
-- rouverte : l'étape perd sa coche et la retrouve sans nouvelle déclaration.
alter table public.projets add column chemins_verifies_le timestamptz;

-- ————————————————————————————————————————————————————————————————————————
-- Droits
-- ————————————————————————————————————————————————————————————————————————

-- L'adulte lit le journal de ses projets et ne l'écrit jamais ; il lit et retire ses
-- acceptations, et n'en pose que par la fonction. Le poste d'un élève n'a rien de tout cela.
revoke execute on function prive.noter_fin() from public, anon, authenticated, poste;
revoke execute on function public.accepter_avertissement(uuid, text, text) from public, anon, authenticated;
grant execute on function public.accepter_avertissement(uuid, text, text) to authenticated, service_role;
grant select on public.chemins_changes to authenticated;
grant select, delete on public.avertissements_acceptes to authenticated;
grant update (chemins_verifies_le) on public.projets to authenticated;
grant all on public.chemins_changes, public.avertissements_acceptes to service_role;

alter table public.chemins_changes enable row level security;
create policy enseignant_lit on public.chemins_changes
  for select to authenticated using (enseignant_id = (select auth.uid()));

alter table public.avertissements_acceptes enable row level security;
create policy enseignant_lit on public.avertissements_acceptes
  for select to authenticated using (enseignant_id = (select auth.uid()));
create policy enseignant_retire on public.avertissements_acceptes
  for delete to authenticated using (enseignant_id = (select auth.uid()));
