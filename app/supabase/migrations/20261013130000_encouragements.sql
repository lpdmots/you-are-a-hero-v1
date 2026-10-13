-- Étape 4 du plan, lot 6 : encouragements de l'enseignant et classement (F07.5).
-- Un tampon tient à la scène et à l'élève qui s'en occupait quand il a été donné ; il ne
-- change ni l'état de la scène ni le livre. Les camarades n'en voient rien : le poste ne lit
-- jamais la table, seulement ce que la fonction du bas veut bien lui rendre.

create table public.encouragements (
  id uuid primary key default gen_random_uuid(),
  scene_id uuid not null,
  projet_id uuid not null,
  enseignant_id uuid not null,
  -- L'élève qui s'occupait de la scène ce jour-là : il garde le tampon si elle change de main (F07-AC78)
  eleve_id uuid not null references public.eleves (id) on delete cascade,
  categorie text not null check (categorie in ('effort', 'plume', 'creativite')),
  donne_le timestamptz not null default now(),
  -- Au plus un tampon de chaque catégorie pour un même élève sur une scène (F07-AC77)
  unique (scene_id, eleve_id, categorie),
  foreign key (scene_id, projet_id) references public.scenes (id, projet_id) on delete cascade,
  foreign key (projet_id, enseignant_id) references public.projets (id, enseignant_id) on delete cascade
);
create index encouragements_projet_idx on public.encouragements (projet_id);
create index encouragements_eleve_idx on public.encouragements (eleve_id);
create index encouragements_enseignant_idx on public.encouragements (enseignant_id);

-- « Montrer le classement aux élèves » : un réglage du projet, éteint par défaut (F07-AC51)
alter table public.projets add column classement_montre boolean not null default false;

-- Donner ou retirer un tampon, à l'élève qui s'occupe de la scène. Dire ce qu'on veut, et
-- non « l'inverse de ce qui est » : deux clics partis ensemble ne se contredisent pas.
create function public.encourager(p_scene uuid, p_categorie text, p_donner boolean) returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  s record;
begin
  select sc.id, sc.projet_id, sc.enseignant_id, sc.prise_par_eleve, sc.prise_par_enseignant, sc.texte_vide
  into s from public.scenes sc
  where sc.id = p_scene and sc.enseignant_id = (select auth.uid()) and sc.supprime_le is null
  for update;
  if not found then
    raise exception 'Cette scène n''existe plus.' using errcode = 'P0001';
  end if;
  if p_categorie is null or p_categorie not in ('effort', 'plume', 'creativite') or p_donner is null then
    raise exception 'Cet encouragement n''existe pas.' using errcode = 'P0001';
  end if;
  if not exists (select 1 from public.projets p where p.id = s.projet_id and p.organisation = 'classe') then
    raise exception 'Un projet personnel n''a pas d''encouragements.' using errcode = 'P0001';
  end if;
  -- Personne à encourager : scène sans élève, ou que l'enseignant s'est attribuée (F07-AC79)
  if s.prise_par_enseignant or s.prise_par_eleve is null then
    raise exception 'Aucun élève ne s''occupe de cette scène.' using errcode = 'P0001';
  end if;
  if not p_donner then
    delete from public.encouragements e
    where e.scene_id = s.id and e.eleve_id = s.prise_par_eleve and e.categorie = p_categorie;
    return jsonb_build_object('eleve', s.prise_par_eleve, 'donne', false);
  end if;
  if s.texte_vide then
    raise exception 'Cette scène n''a pas encore de texte.' using errcode = 'P0001';
  end if;
  insert into public.encouragements (scene_id, projet_id, enseignant_id, eleve_id, categorie)
  values (s.id, s.projet_id, s.enseignant_id, s.prise_par_eleve, p_categorie)
  on conflict (scene_id, eleve_id, categorie) do nothing;
  return jsonb_build_object('eleve', s.prise_par_eleve, 'donne', true);
end
$$;

-- Ce que l'élève du poste voit des encouragements d'un projet de sa classe : ses propres
-- tampons, et rien de ceux d'un camarade (F07-AC82). Quand l'enseignant montre le
-- classement : pour chaque catégorie, les trois meilleurs totaux, ex æquo compris, et rien
-- d'autre — ni la suite, ni le total d'un élève hors de ces trois (F07-AC86). Un élève
-- retiré de la classe garde ses tampons et sort du classement.
create function public.mes_encouragements(p_projet uuid) returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
declare
  v_eleve uuid := (select prive.eleve_au_travail());
  v_classe uuid;
  v_montre boolean;
begin
  if v_eleve is null or not (select prive.projet_du_poste(p_projet)) then
    return null;
  end if;
  select p.classe_id, p.classement_montre into v_classe, v_montre from public.projets p where p.id = p_projet;
  return jsonb_build_object(
    'tampons', (
      select coalesce(jsonb_agg(jsonb_build_object('scene', e.scene_id, 'categorie', e.categorie) order by e.donne_le), '[]'::jsonb)
      from public.encouragements e
      where e.projet_id = p_projet and e.eleve_id = v_eleve
    ),
    'classement', case when v_montre then (
      select coalesce(jsonb_object_agg(x.categorie, x.marches), '{}'::jsonb)
      from (
        select t.categorie, jsonb_agg(jsonb_build_object('total', t.total, 'eleves', t.eleves) order by t.total desc) as marches
        from (
          select c.categorie, c.total, jsonb_agg(c.eleve_id order by c.eleve_id) as eleves,
                 dense_rank() over (partition by c.categorie order by c.total desc) as marche
          from (
            select e.categorie, e.eleve_id, count(*)::integer as total
            from public.encouragements e
            join public.inscriptions i on i.eleve_id = e.eleve_id and i.classe_id = v_classe and i.retire_le is null
            where e.projet_id = p_projet
            group by e.categorie, e.eleve_id
          ) c
          group by c.categorie, c.total
        ) t
        where t.marche <= 3
        group by t.categorie
      ) x
    ) end
  );
end
$$;

-- Droits : l'adulte lit ses encouragements et ne les écrit que par la fonction ; le poste
-- n'a que la sienne.
revoke execute on function public.encourager(uuid, text, boolean), public.mes_encouragements(uuid) from public, anon, authenticated;
grant select on public.encouragements to authenticated;
grant update (classement_montre) on public.projets to authenticated;
grant execute on function public.encourager(uuid, text, boolean) to authenticated, service_role;
grant execute on function public.mes_encouragements(uuid) to poste, service_role;
grant all on public.encouragements to service_role;

alter table public.encouragements enable row level security;
create policy enseignant_lit on public.encouragements
  for select to authenticated using (enseignant_id = (select auth.uid()));
