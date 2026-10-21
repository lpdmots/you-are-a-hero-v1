-- La bibliothèque d'images (F10.1), décidée par le porteur le 21 octobre 2026.
--
-- Une image créée par l'IA qui ne montre aucun personnage peut rejoindre les visuels proposés à
-- tous les adultes, après la relecture du porteur dans l'administration. Sont candidates les
-- images gardées (`image_posee`) d'une demande marquée `sans_personnage` : toute image de
-- repérage (un lieu et son ambiance, F10.1), et l'image d'une scène demandée sans aucun badge,
-- héros absent des images, non détourée. Les portraits et les images d'objets ne le sont jamais.
-- L'adulte refuse depuis « Mon compte » (`reglages_ia.bibliotheque`, allumé par défaut).
--
-- Une image acceptée est copiée hors des dossiers de son compte (`bibliotheque/…` du même
-- seau) : elle reste dans la bibliothèque si le projet ou le compte d'origine disparaît. Une
-- image refusée garde seulement son identité, pour ne plus être proposée. Ses mots-clés, en
-- français et en anglais, sont tirés de l'image elle-même par l'IA, puis retouchés à la main.
-- Choisie dans un projet, l'image y est copiée comme une image importée.

alter table public.demandes_d_images add column sans_personnage boolean;
-- Les images de repérage déjà créées : un lieu, sans personnage au premier plan
update public.demandes_d_images set sans_personnage = true where cible in ('projet', 'partie', 'chapitre');

create table public.bibliotheque (
  id uuid primary key default gen_random_uuid(),
  -- L'image du projet d'où elle vient : sans clé étrangère, elle survit à son projet
  image_source uuid not null unique,
  etat text not null check (etat in ('acceptee', 'refusee')),
  chemin text unique,
  chemin_vignette text unique,
  format text check (format in ('jpeg', 'png', 'webp')),
  largeur integer check (largeur between 1 and 20000),
  hauteur integer check (hauteur between 1 and 20000),
  mots text[] not null default '{}' check (cardinality(mots) <= 20),
  mots_en text[] not null default '{}' check (cardinality(mots_en) <= 20),
  decide_le timestamptz not null default now(),
  check (etat = 'refusee' or (chemin is not null and chemin_vignette is not null and format is not null and largeur is not null and hauteur is not null))
);
create index bibliotheque_acceptees_idx on public.bibliotheque (decide_le desc) where etat = 'acceptee';

alter table public.bibliotheque enable row level security;
-- Tout adulte voit les images acceptées ; seul le serveur écrit, après avoir vérifié le porteur
create policy adulte_lit_acceptees on public.bibliotheque for select to authenticated using (etat = 'acceptee');
grant select on public.bibliotheque to authenticated;
grant all on public.bibliotheque to service_role;

-- Les images à relire : gardées, sans personnage, d'un adulte qui ne refuse pas, encore là et
-- pas encore décidées ; les plus récentes d'abord
create function public.images_pour_la_bibliotheque(p_limite integer default 60)
returns table (image uuid, cible text, largeur integer, hauteur integer, cree_le timestamptz)
language sql stable security definer set search_path = ''
as $$
  select c.* from (
    select distinct on (i.id) i.id, d.cible, i.largeur, i.hauteur, i.cree_le
    from public.demandes_d_images d
    join public.images i on i.id = d.image_posee
    join public.enseignants e on e.id = d.enseignant_id
    where d.sans_personnage
      and coalesce(e.reglages_ia ->> 'bibliotheque', 'true') <> 'false'
      and not exists (select 1 from public.bibliotheque b where b.image_source = i.id)
    order by i.id
  ) c
  order by c.cree_le desc
  limit greatest(1, least(p_limite, 200))
$$;
revoke execute on function public.images_pour_la_bibliotheque(integer) from public, anon, authenticated;
grant execute on function public.images_pour_la_bibliotheque(integer) to service_role;
