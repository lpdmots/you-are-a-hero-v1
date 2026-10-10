-- Étape 3, lot 5 : les images posées dans le texte d'une scène, en bloc ou sur la ligne (F10).
--
-- La même image importée sert aux deux emplois, et aux images de repérage (F10.1). Elle est
-- gardée à la définition de son plus grand emploi. Une image à fond transparent le garde
-- (F10-AC31) : elle n'est donc plus toujours du JPEG, et la base retient son format.

alter table public.images
  add column format text not null default 'jpeg' check (format in ('jpeg', 'png', 'webp'));

-- Un poste lit une image de repère du récit de sa classe (F10-AC06), ou une image posée
-- dans le texte d'une scène qu'il peut lire. Rien d'autre : ni les images importées et pas
-- encore posées, ni celles d'un texte gardé à part ou d'une version précédente.
create or replace function prive.image_du_poste(p_image uuid) returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.images i
    where i.id = p_image
      and (select prive.projet_du_poste(i.projet_id))
      and (
        exists (select 1 from public.projets p where p.id = i.projet_id and p.image_id = i.id)
        or exists (select 1 from public.parties pa where pa.image_id = i.id and pa.supprime_le is null)
        or exists (select 1 from public.chapitres c where c.image_id = i.id and (select prive.chapitre_dans_le_plan(c.id)))
        or exists (
          select 1 from public.scenes s
          where s.projet_id = i.projet_id and s.supprime_le is null
            and (select prive.scenes_lisibles(s.chapitre_id))
            and jsonb_path_exists(
              s.texte,
              '$[*] ? (@.type != "note").** ? ((@.type == "image" || @.type == "image-ligne") && @.image == $image)',
              jsonb_build_object('image', p_image::text)
            )
        )
      )
  )
$$;

-- Ce que le serveur de l'application lit pour servir le fichier : son chemin et son format
drop function public.image_du_poste(uuid);
create function public.image_du_poste(p_image uuid) returns table (chemin text, chemin_vignette text, format text)
language sql stable security definer set search_path = ''
as $$
  select i.chemin, i.chemin_vignette, i.format from public.images i
  where i.id = p_image and (select prive.image_du_poste(p_image))
$$;
revoke all on function public.image_du_poste(uuid) from public, anon, authenticated;
grant execute on function public.image_du_poste(uuid) to poste, service_role;

-- « Rechercher une scène », pour l'élève : la légende d'une image en fait partie, comme
-- pour l'adulte (F10, 10 octobre 2026).
create or replace function public.scenes_a_chercher()
returns table (id uuid, reference integer, titre text, chapitre_id uuid, chapitre text, couleur smallint, consigne text, mots text)
language sql stable security definer set search_path = ''
as $$
  select s.id, s.reference, s.titre, c.id, c.titre, c.couleur,
         case when (select prive.profil_dans(c.id)) is not null then s.consigne end,
         coalesce((
           select string_agg(m #>> '{}', ' ')
           from jsonb_path_query(s.texte, '$[*] ? (@.type != "note").**.text') m
         ), '') || ' ' || coalesce((
           select string_agg(coalesce(b ->> 'libelle', b ->> 'legende'), ' ')
           from jsonb_array_elements(s.texte) b where b ->> 'type' in ('choix', 'image')
         ), '')
  from public.scenes s
  join public.chapitres c on c.id = s.chapitre_id
  join public.parties pa on pa.id = c.partie_id
  where s.supprime_le is null and (select prive.scenes_lisibles(c.id))
  order by pa.rang, c.rang, s.rang
$$;

-- Les images qu'une scène a portées. Un élève ne fait pas entrer dans une scène une image qui
-- n'y était pas (F10-AC33), mais il y déplace une phrase qui en porte une : entre couper et
-- coller, le texte s'enregistre sans l'image. La scène retient donc celles qu'elle a eues.
alter table public.scenes
  add column images_vues uuid[] not null default '{}';

create function prive.images_du_texte(p_texte jsonb) returns uuid[]
language sql immutable set search_path = ''
as $$
  select coalesce(array_agg(distinct (m #>> '{}')::uuid), '{}'::uuid[])
  from jsonb_path_query(coalesce(p_texte, '[]'::jsonb), '$[*].** ? (@.type == "image" || @.type == "image-ligne").image') m
  where (m #>> '{}') ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
$$;

create function prive.retenir_images() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  new.images_vues := (
    select coalesce(array_agg(distinct x), '{}'::uuid[])
    from unnest(coalesce(new.images_vues, '{}'::uuid[]) || prive.images_du_texte(new.texte)) x
  );
  return new;
end
$$;

create trigger scenes_retenir_images
  before insert or update of texte on public.scenes
  for each row execute function prive.retenir_images();

revoke execute on function prive.images_du_texte(jsonb), prive.retenir_images() from public, anon, authenticated, poste;
grant execute on function prive.images_du_texte(jsonb) to service_role;

-- Ce que le serveur lit pour contrôler l'enregistrement d'un élève : aussi les images que la scène a portées
create or replace function public.ecriture_lire(p_ecriture uuid, p_jeton_hash text) returns jsonb
language sql stable security invoker set search_path = ''
as $$
  select jsonb_build_object(
    'scene', s.id, 'projet', s.projet_id, 'chapitre', s.chapitre_id, 'eleve', ec.eleve_id,
    'texte', s.texte, 'version', s.version,
    'profil', (select a.profil from public.attributions a where a.chapitre_id = s.chapitre_id and a.eleve_id = ec.eleve_id),
    'scenes_du_chapitre', (select coalesce(jsonb_agg(x.id), '[]'::jsonb) from public.scenes x where x.chapitre_id = s.chapitre_id and x.supprime_le is null),
    'images_vues', to_jsonb(s.images_vues)
  )
  from public.ecritures ec
  join public.postes p on p.id = ec.poste_id
  join public.scenes s on s.id = ec.scene_id
  where ec.id = p_ecriture and p.jeton_hash = p_jeton_hash and ec.close_le is null
$$;
