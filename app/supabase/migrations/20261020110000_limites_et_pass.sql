-- Étape 9, lot 4 : les limites gratuites et le pass (F14, F14-AC12 à AC17).
--
-- Un projet sans pass a deux limites, qui ne valent que « Paiement ouvert » allumé : quarante
-- scènes hors corbeille, et dix images posées dans le livre (images des scènes du livre et des
-- pages de présentation ; ni les images de repérage, ni les visuels par défaut, ni les portraits).
-- Atteintes, elles empêchent seulement de créer une scène ou de poser une image : tout le reste
-- continue. Un projet déjà au-delà garde tout. Le pass, payé une fois pour un projet (ou offert
-- par le porteur), lève ces limites pour toujours et donne ses étoiles ; les projets du porteur
-- n'ont pas de limite.
--
-- Les valeurs de l'offre restent en un seul endroit, les réglages de l'application (F14-AC21).

alter table public.reglages_application
  -- L'interrupteur : éteint, ni limite ni vente (F14-AC12)
  add column paiement_ouvert boolean not null default false,
  add column scenes_gratuites integer not null default 40 check (scenes_gratuites > 0),
  add column images_gratuites integer not null default 10 check (images_gratuites >= 0),
  -- Les prix, en centimes d'euro, et ce qu'ils donnent ; hypothèses à fixer avant d'allumer
  add column prix_du_pass integer not null default 2000 check (prix_du_pass > 0),
  add column etoiles_du_pass integer not null default 400 check (etoiles_du_pass >= 0),
  add column prix_de_la_recharge integer not null default 500 check (prix_de_la_recharge > 0),
  add column etoiles_de_la_recharge integer not null default 100 check (etoiles_de_la_recharge > 0);

-- Le pass d'un projet : un seul, pour toujours
create table public.passes (
  projet_id uuid primary key references public.projets (id) on delete cascade,
  enseignant_id uuid not null references public.enseignants (id) on delete cascade,
  obtenu_le timestamptz not null default now(),
  -- Acheté, ou offert depuis l'administration (F14-AC24)
  origine text not null check (origine in ('achat', 'cadeau'))
);
create index passes_enseignant_idx on public.passes (enseignant_id);

alter table public.passes enable row level security;
create policy enseignant_lit on public.passes for select to authenticated using (enseignant_id = (select auth.uid()));
grant select on public.passes to authenticated;
grant all on public.passes to service_role;

-- Les limites valent-elles pour ce projet ? Interrupteur allumé, sans pass, hors porteur.
create function prive.projet_limite(p_projet uuid) returns boolean
language sql stable security definer set search_path = ''
as $$
  select coalesce((select r.paiement_ouvert from public.reglages_application r), false)
    and not exists (select 1 from public.passes pa where pa.projet_id = p_projet)
    and not exists (
      select 1 from public.projets p join public.enseignants e on e.id = p.enseignant_id
      where p.id = p_projet and e.createur
    )
$$;

-- Les scènes qui comptent : hors corbeille, la leur comme celle de leur chapitre ou de leur partie
create function prive.scenes_du_projet(p_projet uuid) returns integer
language sql stable security definer set search_path = ''
as $$
  select count(*)::integer from public.scenes s
  where s.projet_id = p_projet and s.supprime_le is null and (select prive.chapitre_dans_le_plan(s.chapitre_id))
$$;

-- Les images posées dans le texte d'une scène, hors des notes de l'enseignant, chaque pose comptée
create function prive.poses_d_images(p_texte jsonb) returns integer
language sql immutable set search_path = ''
as $$
  select count(*)::integer
  from jsonb_path_query(
    coalesce(p_texte, '[]'::jsonb),
    '$[*] ? (@.type != "note").** ? (@.type == "image" || @.type == "image-ligne")'
  )
$$;

-- Les images des pages de présentation : une page en image pleine page, ou l'illustration de la
-- page de titre ; une page retirée du livre ne compte pas
create function prive.images_des_pages(p_pages jsonb) returns integer
language sql immutable set search_path = ''
as $$
  select
    (select count(*)::integer from jsonb_path_query(
      coalesce(p_pages, '{}'::jsonb),
      '$.* ? (@.forme == "image" && @.imageId != null && (!exists(@.presente) || @.presente == true))'
    ))
    + (case when jsonb_typeof(p_pages -> 'titre' -> 'illustration') = 'string' then 1 else 0 end)
$$;

-- Les images du livre d'un projet : scènes du livre, hors corbeille, et pages de présentation
-- (F14-AC14). p_sans : une scène à laisser de côté (celle dont on compte le nouveau texte).
create function prive.images_du_livre(p_projet uuid, p_sans uuid default null) returns integer
language sql stable security definer set search_path = ''
as $$
  select
    coalesce((
      select sum(prive.poses_d_images(s.texte))::integer from public.scenes s
      where s.projet_id = p_projet and s.supprime_le is null and not s.hors_livre
        and s.id is distinct from p_sans and (select prive.chapitre_dans_le_plan(s.chapitre_id))
    ), 0)
    + coalesce((select prive.images_des_pages(p.pages_du_livre) from public.projets p where p.id = p_projet), 0)
$$;

-- Ce que l'écran lit : la limite vaut-elle, et où en est le projet (F14-AC13, AC14)
create function public.limites_du_projet(p_projet uuid)
returns table (limite boolean, pass boolean, scenes integer, scenes_gratuites integer, images integer, images_gratuites integer)
language sql stable security invoker set search_path = ''
as $$
  select
    (select prive.projet_limite(p.id)),
    exists (select 1 from public.passes pa where pa.projet_id = p.id),
    (select prive.scenes_du_projet(p.id)),
    r.scenes_gratuites,
    (select prive.images_du_livre(p.id)),
    r.images_gratuites
  from public.projets p cross join public.reglages_application r
  where p.id = p_projet
$$;
grant execute on function public.limites_du_projet(uuid) to authenticated, service_role;

-- Créer une scène au-delà de la limite : refusé, d'où qu'on la crée (adulte, élève, IA).
-- Une scène restaurée de la corbeille n'est pas créée : elle revient.
create function prive.limite_des_scenes() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if (select prive.projet_limite(new.projet_id))
     and (select prive.scenes_du_projet(new.projet_id)) >= (select r.scenes_gratuites from public.reglages_application r) then
    raise exception 'limite_scenes' using errcode = 'LIM01',
      hint = 'Ce livre a atteint la taille du livre gratuit.';
  end if;
  return new;
end
$$;
create trigger scenes_limite
  before insert on public.scenes
  for each row execute function prive.limite_des_scenes();

-- Poser une image au-delà de la limite : refusé. Seul ce qui ajoute une image compte ; un texte
-- qui en garde autant ou en retire passe toujours, même au-delà (F14-AC15).
create function prive.limite_des_images_de_scene() returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  v_avant integer := prive.poses_d_images(old.texte);
  v_apres integer := prive.poses_d_images(new.texte);
begin
  if v_apres > v_avant and not new.hors_livre and new.supprime_le is null
     and (select prive.projet_limite(new.projet_id))
     and (select prive.images_du_livre(new.projet_id, new.id)) + v_apres > (select r.images_gratuites from public.reglages_application r) then
    raise exception 'limite_images' using errcode = 'LIM02',
      hint = 'Ce livre a atteint le nombre d''images du livre gratuit.';
  end if;
  return new;
end
$$;
create trigger scenes_limite_images
  before update of texte on public.scenes
  for each row execute function prive.limite_des_images_de_scene();

create function prive.limite_des_images_des_pages() returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  v_avant integer := prive.images_des_pages(old.pages_du_livre);
  v_apres integer := prive.images_des_pages(new.pages_du_livre);
begin
  if v_apres > v_avant and (select prive.projet_limite(new.id))
     and (select prive.images_du_livre(new.id)) - v_avant + v_apres > (select r.images_gratuites from public.reglages_application r) then
    raise exception 'limite_images' using errcode = 'LIM02',
      hint = 'Ce livre a atteint le nombre d''images du livre gratuit.';
  end if;
  return new;
end
$$;
create trigger projets_limite_images
  before update of pages_du_livre on public.projets
  for each row execute function prive.limite_des_images_des_pages();

revoke execute on function prive.projet_limite(uuid), prive.scenes_du_projet(uuid), prive.images_du_livre(uuid, uuid),
  prive.limite_des_scenes(), prive.limite_des_images_de_scene(), prive.limite_des_images_des_pages() from public, anon, authenticated, poste;
grant execute on function prive.projet_limite(uuid), prive.scenes_du_projet(uuid), prive.images_du_livre(uuid, uuid) to authenticated, poste, service_role;

-- Un pass reçu : le projet n'a plus de limite, et le compte gagne les étoiles du pass (F14-AC16).
-- Appelé par le serveur à la réception du paiement (lot 5) ou par l'administration (lot 6),
-- jamais par l'adulte. Un second pass pour le même projet ne donne rien de plus.
create function public.donner_le_pass(p_projet uuid, p_origine text) returns boolean
language plpgsql security invoker set search_path = ''
as $$
declare
  v_enseignant uuid;
  v_etoiles integer;
begin
  select p.enseignant_id into v_enseignant from public.projets p where p.id = p_projet;
  if v_enseignant is null then
    raise exception 'Ce projet n''existe pas.' using errcode = 'P0001';
  end if;
  insert into public.passes (projet_id, enseignant_id, origine) values (p_projet, v_enseignant, p_origine)
  on conflict (projet_id) do nothing;
  if not found then
    return false;
  end if;
  select r.etoiles_du_pass into v_etoiles from public.reglages_application r;
  if coalesce(v_etoiles, 0) > 0 then
    insert into public.mouvements_etoiles (enseignant_id, nombre, motif, note)
    values (v_enseignant, v_etoiles, 'pass', p_projet::text);
  end if;
  return true;
end
$$;
revoke execute on function public.donner_le_pass(uuid, text) from public, anon, authenticated;
grant execute on function public.donner_le_pass(uuid, text) to service_role;
