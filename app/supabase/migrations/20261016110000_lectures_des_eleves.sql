-- Étape 7, lot 3 : lire, côté élève (F12.3, F12.1, F04.2).
--
-- La lecture par les classes : un élève identifié sur un poste lit les versions partagées que
-- l'enseignant de sa classe ouvre « À mes classes », à toute heure — les horaires ne visent que
-- le travail (F06-AC31). Il n'en reçoit que la version : ni l'atelier, ni les remarques, ni les
-- profils (F12-AC07). Sa lecture et sa feuille d'aventure sont gardées pour lui, d'un poste à
-- l'autre (F12-AC26, F04-AC22 ; V16).
--
-- Aucun accès direct aux tables : quatre fonctions, réservées aux postes, disent ce qui part.

create table public.lectures_en_cours (
  eleve_id uuid not null references public.eleves (id) on delete cascade,
  projet_id uuid not null references public.projets (id) on delete cascade,
  -- Le parcours, les choix déjà lus, la feuille et le dernier lancer, lus et complétés par l'application
  lecture jsonb not null check (jsonb_typeof(lecture) = 'object' and octet_length(lecture::text) <= 65536),
  modifie_le timestamptz not null default now(),
  primary key (eleve_id, projet_id)
);
create index lectures_en_cours_projet_idx on public.lectures_en_cours (projet_id);

alter table public.lectures_en_cours enable row level security;
-- Aucune règle d'accès : seules les fonctions ci-dessous, et la clé de service, la lisent
grant all on public.lectures_en_cours to service_role;

-- L'élève identifié sur le poste qui interroge, sans condition d'horaire
create function prive.eleve_du_poste() returns uuid
language sql stable security definer set search_path = ''
as $$
  select i.eleve_id from public.inscriptions i where i.id = (select prive.inscription_du_poste())
$$;

-- Ce livre est-il ouvert aux classes de l'enseignant de ce poste ? (F12-AC12)
create function prive.livre_ouvert_au_poste(p_projet uuid) returns boolean
language sql stable security definer set search_path = ''
as $$
  select (select prive.eleve_du_poste()) is not null and exists (
    select 1
    from public.partages pa
    where pa.projet_id = p_projet
      and pa.aux_classes
      and pa.version is not null
      and pa.enseignant_id = (select prive.enseignant_du_poste())
  )
$$;

-- Les livres que l'élève peut lire : celui de sa classe d'abord, puis le plus récent
create function public.livres_du_poste()
returns table (projet_id uuid, titre text, a_choix boolean, ligne text, de_ma_classe boolean, passages integer, chapitres integer, image uuid, partage_le timestamptz)
language sql stable security definer set search_path = ''
as $$
  select pa.projet_id,
         pa.version ->> 'titre',
         coalesce((pa.version ->> 'aChoix')::boolean, false),
         nullif(pa.version -> 'presentation' -> 'titre' ->> 'ligne', ''),
         p.classe_id is not distinct from (select prive.classe_du_poste()),
         jsonb_array_length(pa.version -> 'passages'),
         (select count(*)::integer from jsonb_array_elements(pa.version -> 'passages') x where jsonb_typeof(x -> 'chapitre') = 'object'),
         coalesce(pa.version -> 'presentation' -> 'titre' ->> 'image', pa.version -> 'presentation' -> 'titre' ->> 'illustration')::uuid,
         pa.etat_du
  from public.partages pa
  join public.projets p on p.id = pa.projet_id
  where (select prive.eleve_du_poste()) is not null
    and pa.aux_classes
    and pa.version is not null
    and pa.enseignant_id = (select prive.enseignant_du_poste())
  order by p.classe_id is not distinct from (select prive.classe_du_poste()) desc, pa.etat_du desc
$$;

-- Un livre : sa version, et la lecture que l'élève y a laissée
create function public.livre_du_poste(p_projet uuid) returns jsonb
language sql stable security definer set search_path = ''
as $$
  select jsonb_build_object(
    'version', pa.version,
    'lecture', (select l.lecture from public.lectures_en_cours l where l.projet_id = p_projet and l.eleve_id = (select prive.eleve_du_poste()))
  )
  from public.partages pa
  where pa.projet_id = p_projet and (select prive.livre_ouvert_au_poste(p_projet))
$$;

-- Garder la lecture de l'élève ; rien pour un livre qui n'est plus ouvert aux classes
create function public.garder_lecture_du_poste(p_projet uuid, p_lecture jsonb) returns boolean
language plpgsql security definer set search_path = ''
as $$
declare
  v_eleve uuid := (select prive.eleve_du_poste());
begin
  if v_eleve is null or not (select prive.livre_ouvert_au_poste(p_projet)) then
    return false;
  end if;
  insert into public.lectures_en_cours (eleve_id, projet_id, lecture, modifie_le)
  values (v_eleve, p_projet, p_lecture, now())
  on conflict (eleve_id, projet_id) do update set lecture = excluded.lecture, modifie_le = now();
  return true;
end
$$;

-- Une image d'un livre ouvert aux classes : seulement celles que sa version montre
create function public.image_d_un_livre_du_poste(p_projet uuid, p_image uuid)
returns table (chemin text, chemin_vignette text, format text)
language sql stable security definer set search_path = ''
as $$
  select i.chemin, i.chemin_vignette, i.format
  from public.images i
  join public.partages pa on pa.projet_id = i.projet_id
  where i.id = p_image and i.projet_id = p_projet
    and (select prive.livre_ouvert_au_poste(p_projet))
    and pa.version -> 'images' ? p_image::text
$$;

revoke all on function prive.eleve_du_poste() from public, anon, authenticated;
revoke all on function prive.livre_ouvert_au_poste(uuid) from public, anon, authenticated;
revoke all on function public.livres_du_poste() from public, anon, authenticated;
revoke all on function public.livre_du_poste(uuid) from public, anon, authenticated;
revoke all on function public.garder_lecture_du_poste(uuid, jsonb) from public, anon, authenticated;
revoke all on function public.image_d_un_livre_du_poste(uuid, uuid) from public, anon, authenticated;
grant execute on function public.livres_du_poste() to poste, service_role;
grant execute on function public.livre_du_poste(uuid) to poste, service_role;
grant execute on function public.garder_lecture_du_poste(uuid, jsonb) to poste, service_role;
grant execute on function public.image_d_un_livre_du_poste(uuid, uuid) to poste, service_role;
