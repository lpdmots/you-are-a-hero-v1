-- Étape 2 du plan : préparer et organiser le récit.
-- Règles : F02 (préparation), F03.1 et F03.2 (parties, chapitres, scènes, corbeille,
-- départ et fins), F06.1 et F06.2 (attribution, profils, lecture), F07.1 (consigne),
-- F10.1 (images de repérage), rubriques du jeu et des phrases de choix (F04.2, F11.6).
--
-- L'adulte écrit ses propres lignes, sous les règles d'accès. Le poste d'un élève lit
-- des colonnes choisies ; ce qu'un élève du profil « écriture et organisation » peut
-- changer passe par des fonctions qui revérifient son attribution à chaque appel.

-- ————————————————————————————————————————————————————————————————————————
-- Tables
-- ————————————————————————————————————————————————————————————————————————

alter table public.projets add constraint projets_id_enseignant_unique unique (id, enseignant_id);

-- Image importée par l'adulte dans un projet (F10.1). Le fichier est dans le stockage ;
-- « chemin » est celui de l'image gardée, « chemin_vignette » celui de sa réduction d'écran.
create table public.images (
  id uuid primary key default gen_random_uuid(),
  projet_id uuid not null,
  enseignant_id uuid not null,
  chemin text not null unique,
  chemin_vignette text not null unique,
  largeur integer not null check (largeur between 1 and 20000),
  hauteur integer not null check (hauteur between 1 and 20000),
  cree_le timestamptz not null default now(),
  unique (id, projet_id),
  foreign key (projet_id, enseignant_id) references public.projets (id, enseignant_id) on delete cascade
);
create index images_projet_idx on public.images (projet_id);
create index images_enseignant_idx on public.images (enseignant_id);

alter table public.projets
  -- Image de repérage : image choisie, sinon visuel proposé choisi, sinon visuel par défaut
  add column image_id uuid,
  add column visuel_defaut text check (visuel_defaut ~ '^[a-z0-9-]{1,40}$'),
  add column visuel_choisi text check (visuel_choisi ~ '^[a-z0-9-]{1,40}$'),
  -- Lecture ouverte de l'histoire aux élèves (F06-AC48), sans objet en mode personnel
  add column lecture_ouverte boolean not null default false,
  -- Scène de départ du livre à choix (F03.2). Elle peut être dans la corbeille : le livre
  -- n'a alors plus de départ, et le retrouve si elle est restaurée (F03-AC33).
  add column depart_scene_id uuid,
  -- Prochaine référence de scène : une référence n'est jamais redonnée (F03-AC30)
  add column reference_suivante integer not null default 1,
  add constraint projets_image_fk foreign key (image_id, id) references public.images (id, projet_id),
  add constraint projets_lecture_ouverte_classe check (organisation = 'classe' or not lecture_ouverte);
create index projets_image_idx on public.projets (image_id);
create index projets_depart_idx on public.projets (depart_scene_id);

create table public.parties (
  id uuid primary key default gen_random_uuid(),
  projet_id uuid not null,
  enseignant_id uuid not null,
  titre text not null check (char_length(btrim(titre)) between 1 and 120),
  rang integer not null default 0,
  image_id uuid,
  visuel_defaut text check (visuel_defaut ~ '^[a-z0-9-]{1,40}$'),
  visuel_choisi text check (visuel_choisi ~ '^[a-z0-9-]{1,40}$'),
  -- Dans la corbeille du projet depuis cet instant (F03.1)
  supprime_le timestamptz,
  cree_le timestamptz not null default now(),
  unique (id, projet_id),
  foreign key (projet_id, enseignant_id) references public.projets (id, enseignant_id) on delete cascade,
  foreign key (image_id, projet_id) references public.images (id, projet_id)
);
create index parties_projet_idx on public.parties (projet_id);
create index parties_enseignant_idx on public.parties (enseignant_id);
create index parties_image_idx on public.parties (image_id);

create table public.chapitres (
  id uuid primary key default gen_random_uuid(),
  partie_id uuid not null,
  projet_id uuid not null,
  enseignant_id uuid not null,
  titre text not null check (char_length(btrim(titre)) between 1 and 120),
  rang integer not null default 0,
  -- Rang dans la palette des huit couleurs de chapitre du design
  couleur smallint not null default 0 check (couleur between 0 and 7),
  -- Intention et déroulement prévu ; lu par les élèves attribués seulement (F02-AC15)
  resume text not null default '' check (char_length(resume) <= 4000),
  image_id uuid,
  visuel_defaut text check (visuel_defaut ~ '^[a-z0-9-]{1,40}$'),
  visuel_choisi text check (visuel_choisi ~ '^[a-z0-9-]{1,40}$'),
  hors_livre boolean not null default false,
  supprime_le timestamptz,
  cree_le timestamptz not null default now(),
  unique (id, projet_id),
  foreign key (partie_id, projet_id) references public.parties (id, projet_id) on delete cascade,
  foreign key (projet_id, enseignant_id) references public.projets (id, enseignant_id) on delete cascade,
  foreign key (image_id, projet_id) references public.images (id, projet_id)
);
create index chapitres_partie_idx on public.chapitres (partie_id);
create index chapitres_projet_idx on public.chapitres (projet_id);
create index chapitres_enseignant_idx on public.chapitres (enseignant_id);
create index chapitres_image_idx on public.chapitres (image_id);

create table public.scenes (
  id uuid primary key default gen_random_uuid(),
  chapitre_id uuid not null,
  projet_id uuid not null,
  enseignant_id uuid not null,
  -- « S017 » : repère stable, propre au projet, jamais redonné
  reference integer not null check (reference > 0),
  titre text check (char_length(btrim(titre)) between 1 and 120),
  -- Consigne d'écriture, facultative (F07.1) ; lue par les élèves attribués seulement
  consigne text not null default '' check (char_length(consigne) <= 4000),
  rang integer not null default 0,
  fin boolean not null default false,
  hors_livre boolean not null default false,
  -- L'élève qui a créé la scène, avec le profil « écriture et organisation » (F06-AC86)
  cree_par_eleve uuid references public.eleves (id) on delete set null,
  supprime_le timestamptz,
  cree_le timestamptz not null default now(),
  unique (projet_id, reference),
  unique (id, projet_id),
  foreign key (chapitre_id, projet_id) references public.chapitres (id, projet_id) on delete cascade,
  foreign key (projet_id, enseignant_id) references public.projets (id, enseignant_id) on delete cascade
);
create index scenes_chapitre_idx on public.scenes (chapitre_id);
create index scenes_enseignant_idx on public.scenes (enseignant_id);
create index scenes_createur_idx on public.scenes (cree_par_eleve);

alter table public.projets
  add constraint projets_depart_fk foreign key (depart_scene_id, id) references public.scenes (id, projet_id);

-- Attribution d'un chapitre à un élève, avec son profil dans ce chapitre (F06.1)
create table public.attributions (
  chapitre_id uuid not null,
  eleve_id uuid not null,
  projet_id uuid not null,
  enseignant_id uuid not null,
  profil text not null default 'propositions' check (profil in ('propositions', 'organisation')),
  cree_le timestamptz not null default now(),
  primary key (chapitre_id, eleve_id),
  foreign key (chapitre_id, projet_id) references public.chapitres (id, projet_id) on delete cascade,
  foreign key (eleve_id, enseignant_id) references public.eleves (id, enseignant_id) on delete cascade,
  foreign key (projet_id, enseignant_id) references public.projets (id, enseignant_id) on delete cascade
);
create index attributions_eleve_idx on public.attributions (eleve_id);
create index attributions_projet_idx on public.attributions (projet_id);
create index attributions_enseignant_idx on public.attributions (enseignant_id);

-- Carnet de préparation (F02) : une ligne par projet, créée avec lui
create table public.preparations (
  projet_id uuid primary key,
  enseignant_id uuid not null,
  univers text not null default '' check (char_length(univers) <= 6000),
  personnages text not null default '' check (char_length(personnages) <= 6000),
  enjeu text not null default '' check (char_length(enjeu) <= 6000),
  -- Rubrique facultative « Objets et formules », ajoutée par l'adulte (F04.2)
  rubrique_jeu boolean not null default false,
  -- Feuille d'aventure : { on, des, sections: [{ id, type, titre, lignes, compteurs }] }
  feuille jsonb not null default '{"on": false, "des": 0, "sections": []}'::jsonb,
  regles text not null default '' check (char_length(regles) <= 6000),
  -- Phrases de choix (F05, F11.5) : formule de renvoi, constructions cochées, marque de fin
  formule_renvoi text not null default 'rends' check (formule_renvoi in ('rends', 'va', 'fleche')),
  constructions text[] not null default '{neutre}'
    check (constructions <@ array['neutre', 'pour', 'si', 'question'] and 'neutre' = any (constructions)),
  marque_fin text not null default 'Fin' check (char_length(marque_fin) <= 40),
  foreign key (projet_id, enseignant_id) references public.projets (id, enseignant_id) on delete cascade
);
create index preparations_enseignant_idx on public.preparations (enseignant_id);

-- Pistes discutées pendant l'atelier, et leur statut (F02-AC17)
create table public.pistes (
  id uuid primary key default gen_random_uuid(),
  projet_id uuid not null,
  enseignant_id uuid not null,
  rubrique text not null check (rubrique in ('univers', 'personnages', 'enjeu', 'etapes')),
  texte text not null check (char_length(btrim(texte)) between 1 and 200),
  etat text not null default 'discuter' check (etat in ('retenue', 'ecartee', 'discuter')),
  cree_le timestamptz not null default now(),
  foreign key (projet_id, enseignant_id) references public.projets (id, enseignant_id) on delete cascade
);
create index pistes_projet_idx on public.pistes (projet_id);
create index pistes_enseignant_idx on public.pistes (enseignant_id);

-- Objets de l'histoire et formules d'action, tenus par l'adulte (F04.2)
create table public.objets (
  id uuid primary key default gen_random_uuid(),
  projet_id uuid not null,
  enseignant_id uuid not null,
  nom text not null check (char_length(btrim(nom)) between 1 and 60),
  description text not null default '' check (char_length(description) <= 120),
  cree_le timestamptz not null default now(),
  foreign key (projet_id, enseignant_id) references public.projets (id, enseignant_id) on delete cascade
);
create index objets_projet_idx on public.objets (projet_id);
create index objets_enseignant_idx on public.objets (enseignant_id);

create table public.formules (
  id uuid primary key default gen_random_uuid(),
  projet_id uuid not null,
  enseignant_id uuid not null,
  texte text not null check (char_length(btrim(texte)) between 1 and 140),
  cree_le timestamptz not null default now(),
  foreign key (projet_id, enseignant_id) references public.projets (id, enseignant_id) on delete cascade
);
create index formules_projet_idx on public.formules (projet_id);
create index formules_enseignant_idx on public.formules (enseignant_id);

-- Les images de repérage : un seau privé. Tout y passe par le serveur de l'application,
-- qui vérifie d'abord dans la base que la personne peut lire l'image.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('images', 'images', false, 8388608, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

-- ————————————————————————————————————————————————————————————————————————
-- Fonctions internes
-- ————————————————————————————————————————————————————————————————————————

-- L'élève identifié sur le poste qui interroge, pendant que le travail est ouvert
-- (F06-AC27). Hors des horaires, le poste ne lit rien du récit.
create function prive.eleve_au_travail() returns uuid
language sql stable security definer set search_path = ''
as $$
  select i.eleve_id
  from public.inscriptions i
  where i.id = (select prive.inscription_du_poste())
    and prive.horaires_ouverts(i.classe_id, now())
$$;

-- Le projet est-il celui de la classe ouverte sur le poste, pour un élève au travail ?
create function prive.projet_du_poste(p_projet uuid) returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.projets p
    where p.id = p_projet
      and p.organisation = 'classe'
      and p.classe_id = (select prive.classe_du_poste())
      and (select prive.eleve_au_travail()) is not null
  )
$$;

-- Un chapitre est dans le plan tant que ni lui ni sa partie ne sont dans la corbeille
create function prive.chapitre_dans_le_plan(p_chapitre uuid) returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.chapitres c
    join public.parties pa on pa.id = c.partie_id
    where c.id = p_chapitre and c.supprime_le is null and pa.supprime_le is null
  )
$$;

-- Profil de l'élève du poste dans ce chapitre, s'il lui est attribué et dans le plan
create function prive.profil_dans(p_chapitre uuid) returns text
language sql stable security definer set search_path = ''
as $$
  select a.profil
  from public.attributions a
  join public.chapitres c on c.id = a.chapitre_id
  where a.chapitre_id = p_chapitre
    and a.eleve_id = (select prive.eleve_au_travail())
    and (select prive.projet_du_poste(c.projet_id))
    and (select prive.chapitre_dans_le_plan(p_chapitre))
$$;

-- L'élève du poste lit-il les scènes de ce chapitre ? Son chapitre, ou toute l'histoire
-- quand l'adulte a ouvert la lecture (F06-AC21, F06-AC48).
create function prive.scenes_lisibles(p_chapitre uuid) returns boolean
language sql stable security definer set search_path = ''
as $$
  select (select prive.profil_dans(p_chapitre)) is not null
    or exists (
      select 1 from public.chapitres c
      join public.projets p on p.id = c.projet_id
      where c.id = p_chapitre
        and p.lecture_ouverte
        and (select prive.projet_du_poste(p.id))
        and (select prive.chapitre_dans_le_plan(p_chapitre))
    )
$$;

-- Une scène contient du travail quand sa copie porte un texte ou une image, qu'un texte
-- est gardé à part pour elle ou qu'elle a déjà été remise (F06.1, 10 octobre 2026).
-- Les textes arrivent à l'étape 3 du plan : d'ici là, aucune scène n'en contient.
create function prive.scene_contient_du_travail(p_scene uuid) returns boolean
language sql stable security definer set search_path = ''
as $$
  select false
$$;

-- L'image est-elle le repère d'un projet, d'une partie ou d'un chapitre que voit le poste ?
create function prive.image_du_poste(p_image uuid) returns boolean
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
      )
  )
$$;

-- Une ligne de préparation pour chaque projet
create function prive.creer_preparation() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.preparations (projet_id, enseignant_id) values (new.id, new.enseignant_id)
  on conflict (projet_id) do nothing;
  return new;
end
$$;
create trigger preparation_a_la_creation
  after insert on public.projets
  for each row execute function prive.creer_preparation();
insert into public.preparations (projet_id, enseignant_id)
select p.id, p.enseignant_id from public.projets p on conflict (projet_id) do nothing;

-- Projets : la classe ne se change plus dès qu'un chapitre est attribué (F01-AC24) ;
-- le départ n'existe que dans un récit à choix (F03.2)
create function prive.projets_avant_maj_recit() returns trigger
language plpgsql set search_path = ''
as $$
begin
  if new.classe_id is distinct from old.classe_id
     and exists (select 1 from public.attributions a where a.projet_id = new.id) then
    raise exception 'Des chapitres sont attribués : la classe de ce projet ne se change plus.' using errcode = 'P0001';
  end if;
  if new.depart_scene_id is not null and new.depart_scene_id is distinct from old.depart_scene_id
     and new.recit <> 'choix' then
    raise exception 'Seul un récit à choix a une scène de départ.' using errcode = 'P0001';
  end if;
  if new.reference_suivante < old.reference_suivante then
    raise exception 'Une référence de scène n''est jamais redonnée.' using errcode = 'P0001';
  end if;
  return new;
end
$$;
create trigger projets_avant_maj_recit
  before update on public.projets
  for each row execute function prive.projets_avant_maj_recit();

-- Ce qui ne change pas : le projet d'une partie, d'un chapitre, d'une scène ; le chapitre
-- d'une scène, son déplacement étant différé (F03.1) ; sa référence et son créateur
create function prive.plan_avant_maj() returns trigger
language plpgsql set search_path = ''
as $$
begin
  if new.projet_id <> old.projet_id or new.enseignant_id <> old.enseignant_id then
    raise exception 'Cet élément ne change pas de projet.' using errcode = 'P0001';
  end if;
  if tg_table_name = 'scenes' then
    if new.chapitre_id <> old.chapitre_id then
      raise exception 'Une scène ne change pas de chapitre.' using errcode = 'P0001';
    end if;
    -- Le créateur s'efface seulement si son profil est supprimé
    if new.reference <> old.reference
       or (new.cree_par_eleve is not null and new.cree_par_eleve is distinct from old.cree_par_eleve) then
      raise exception 'La référence d''une scène et son auteur ne se changent pas.' using errcode = 'P0001';
    end if;
  end if;
  return new;
end
$$;
create trigger parties_avant_maj before update on public.parties
  for each row execute function prive.plan_avant_maj();
create trigger chapitres_avant_maj before update on public.chapitres
  for each row execute function prive.plan_avant_maj();
create trigger scenes_avant_maj before update on public.scenes
  for each row execute function prive.plan_avant_maj();

-- Attribution : un élève inscrit dans la classe du projet, dans un projet de classe (F06.1)
create function prive.attributions_avant_ecriture() returns trigger
language plpgsql set search_path = ''
as $$
begin
  if not exists (
    select 1
    from public.projets p
    join public.inscriptions i on i.classe_id = p.classe_id
    where p.id = new.projet_id and p.organisation = 'classe'
      and i.eleve_id = new.eleve_id and i.retire_le is null
  ) then
    raise exception 'Cet élève n''est pas inscrit dans la classe du projet.' using errcode = 'P0001';
  end if;
  return new;
end
$$;
create trigger attributions_avant_ecriture
  before insert or update on public.attributions
  for each row execute function prive.attributions_avant_ecriture();

-- Rangs resserrés de 0 à n − 1 parmi les éléments qui ne sont pas dans la corbeille
create function prive.resserrer(p_table text, p_parent uuid) returns void
language plpgsql set search_path = ''
as $$
begin
  if p_table = 'parties' then
    update public.parties t set rang = o.r
    from (select id, row_number() over (order by rang, cree_le, id) - 1 as r
          from public.parties where projet_id = p_parent and supprime_le is null) o
    where t.id = o.id and t.rang <> o.r;
  elsif p_table = 'chapitres' then
    update public.chapitres t set rang = o.r
    from (select id, row_number() over (order by rang, cree_le, id) - 1 as r
          from public.chapitres where partie_id = p_parent and supprime_le is null) o
    where t.id = o.id and t.rang <> o.r;
  else
    update public.scenes t set rang = o.r
    from (select id, row_number() over (order by rang, cree_le, id) - 1 as r
          from public.scenes where chapitre_id = p_parent and supprime_le is null) o
    where t.id = o.id and t.rang <> o.r;
  end if;
end
$$;

-- ————————————————————————————————————————————————————————————————————————
-- Fonctions de l'adulte (exécutées avec ses droits : les règles d'accès s'appliquent)
-- ————————————————————————————————————————————————————————————————————————

-- Une partie se crée à la fin du plan, avec son premier chapitre vide (F03-AC10)
create function public.creer_partie(
  p_projet uuid, p_titre text, p_visuel text, p_titre_chapitre text, p_couleur integer, p_visuel_chapitre text
) returns table (partie_id uuid, chapitre_id uuid)
language plpgsql security invoker set search_path = ''
as $$
#variable_conflict use_column
declare
  v_enseignant uuid := (select auth.uid());
  v_partie uuid := gen_random_uuid();
  v_chapitre uuid := gen_random_uuid();
begin
  insert into public.parties (id, projet_id, enseignant_id, titre, rang, visuel_defaut)
  select v_partie, p_projet, v_enseignant, btrim(p_titre),
         coalesce((select max(pa.rang) + 1 from public.parties pa where pa.projet_id = p_projet and pa.supprime_le is null), 0),
         p_visuel;
  insert into public.chapitres (id, partie_id, projet_id, enseignant_id, titre, rang, couleur, visuel_defaut)
  values (v_chapitre, v_partie, p_projet, v_enseignant, btrim(p_titre_chapitre), 0, p_couleur, p_visuel_chapitre);
  return query select v_partie, v_chapitre;
end
$$;

-- Un chapitre se crée à la fin de sa partie, sans scène ni élève (F03-AC11)
create function public.creer_chapitre(p_partie uuid, p_titre text, p_couleur integer, p_visuel text) returns uuid
language plpgsql security invoker set search_path = ''
as $$
declare
  v_id uuid := gen_random_uuid();
  v_projet uuid;
begin
  select pa.projet_id into v_projet from public.parties pa where pa.id = p_partie and pa.supprime_le is null;
  if v_projet is null then
    raise exception 'Cette partie n''existe pas.' using errcode = 'P0001';
  end if;
  insert into public.chapitres (id, partie_id, projet_id, enseignant_id, titre, rang, couleur, visuel_defaut)
  select v_id, p_partie, v_projet, (select auth.uid()), btrim(p_titre),
         coalesce((select max(c.rang) + 1 from public.chapitres c where c.partie_id = p_partie and c.supprime_le is null), 0),
         p_couleur, p_visuel;
  return v_id;
end
$$;

-- Corps commun à la création d'une scène : elle prend la référence suivante du projet,
-- d'un seul tenant, et se place à la fin de son chapitre (F03-AC16, F03-AC30)
create function prive.ajouter_scene(p_chapitre uuid, p_eleve uuid)
returns table (scene_id uuid, reference integer)
language plpgsql set search_path = ''
as $$
#variable_conflict use_column
declare
  v_id uuid := gen_random_uuid();
  v_projet uuid;
  v_enseignant uuid;
  v_reference integer;
begin
  select c.projet_id, c.enseignant_id into v_projet, v_enseignant
  from public.chapitres c
  join public.parties pa on pa.id = c.partie_id
  where c.id = p_chapitre and c.supprime_le is null and pa.supprime_le is null;
  if v_projet is null then
    raise exception 'Ce chapitre n''existe pas.' using errcode = 'P0001';
  end if;
  update public.projets p set reference_suivante = p.reference_suivante + 1
  where p.id = v_projet
  returning p.reference_suivante - 1 into v_reference;
  if v_reference is null then
    raise exception 'Ce chapitre n''existe pas.' using errcode = 'P0001';
  end if;
  insert into public.scenes (id, chapitre_id, projet_id, enseignant_id, reference, rang, cree_par_eleve)
  select v_id, p_chapitre, v_projet, v_enseignant, v_reference,
         coalesce((select max(s.rang) + 1 from public.scenes s where s.chapitre_id = p_chapitre and s.supprime_le is null), 0),
         p_eleve;
  return query select v_id, v_reference;
end
$$;

create function public.creer_scene(p_chapitre uuid)
returns table (scene_id uuid, reference integer)
language sql security invoker set search_path = ''
as $$
  select * from prive.ajouter_scene(p_chapitre, null)
$$;

-- Placer une partie à un rang du plan (glisser-déposer, F03-AC37)
create function public.placer_partie(p_partie uuid, p_position integer) returns void
language plpgsql security invoker set search_path = ''
as $$
declare
  v_projet uuid;
begin
  select pa.projet_id into v_projet from public.parties pa where pa.id = p_partie and pa.supprime_le is null;
  if v_projet is null then
    raise exception 'Cette partie n''existe pas.' using errcode = 'P0001';
  end if;
  -- La position se compte parmi les autres parties : celle qu'on déplace sort d'abord du rang
  update public.parties set rang = 2000000000 where id = p_partie;
  perform prive.resserrer('parties', v_projet);
  update public.parties set rang = rang + 1
  where projet_id = v_projet and supprime_le is null and id <> p_partie and rang >= greatest(p_position, 0);
  update public.parties set rang = greatest(p_position, 0) where id = p_partie;
  perform prive.resserrer('parties', v_projet);
end
$$;

-- Placer un chapitre à un rang de sa partie, ou d'une autre partie du même projet
-- (F03-AC34, F03-AC35). Le seul chapitre d'une partie n'en sort pas (F03-AC36).
create function public.placer_chapitre(p_chapitre uuid, p_partie uuid, p_position integer) returns void
language plpgsql security invoker set search_path = ''
as $$
declare
  v_projet uuid;
  v_depuis uuid;
begin
  select c.projet_id, c.partie_id into v_projet, v_depuis
  from public.chapitres c where c.id = p_chapitre and c.supprime_le is null;
  if v_projet is null
     or not exists (select 1 from public.parties pa where pa.id = p_partie and pa.projet_id = v_projet and pa.supprime_le is null) then
    raise exception 'Ce chapitre ou cette partie n''existe pas.' using errcode = 'P0001';
  end if;
  if v_depuis <> p_partie
     and not exists (select 1 from public.chapitres c where c.partie_id = v_depuis and c.supprime_le is null and c.id <> p_chapitre) then
    raise exception 'Une partie garde au moins un chapitre : celui-ci est le seul de la sienne.' using errcode = 'P0002';
  end if;
  -- La position se compte parmi les autres chapitres de la partie d'arrivée
  update public.chapitres set rang = 2000000000 where id = p_chapitre;
  perform prive.resserrer('chapitres', p_partie);
  update public.chapitres set rang = rang + 1
  where partie_id = p_partie and supprime_le is null and id <> p_chapitre and rang >= greatest(p_position, 0);
  update public.chapitres set partie_id = p_partie, rang = greatest(p_position, 0) where id = p_chapitre;
  perform prive.resserrer('chapitres', p_partie);
  if v_depuis <> p_partie then
    perform prive.resserrer('chapitres', v_depuis);
  end if;
end
$$;

-- Corps commun au déplacement d'une scène dans son chapitre (F03-AC23)
create function prive.ranger_scene(p_scene uuid, p_position integer) returns void
language plpgsql set search_path = ''
as $$
declare
  v_chapitre uuid;
begin
  select s.chapitre_id into v_chapitre from public.scenes s where s.id = p_scene and s.supprime_le is null;
  if v_chapitre is null then
    raise exception 'Cette scène n''existe pas.' using errcode = 'P0001';
  end if;
  -- La position se compte parmi les autres scènes du chapitre
  update public.scenes set rang = 2000000000 where id = p_scene;
  perform prive.resserrer('scenes', v_chapitre);
  update public.scenes set rang = rang + 1
  where chapitre_id = v_chapitre and supprime_le is null and id <> p_scene and rang >= greatest(p_position, 0);
  update public.scenes set rang = greatest(p_position, 0) where id = p_scene;
  perform prive.resserrer('scenes', v_chapitre);
end
$$;

create function public.placer_scene(p_scene uuid, p_position integer) returns void
language sql security invoker set search_path = ''
as $$
  select prive.ranger_scene(p_scene, p_position)
$$;

-- « Supprimer » : l'élément va dans la corbeille du projet, aucun choix ni aucune
-- attribution n'est touché (F03-AC14, F03-AC22). p_sorte : 'partie', 'chapitre' ou 'scene'.
create function public.supprimer_element(p_sorte text, p_id uuid) returns void
language plpgsql security invoker set search_path = ''
as $$
declare
  v_parent uuid;
  v_lignes integer;
begin
  if p_sorte = 'partie' then
    update public.parties set supprime_le = now() where id = p_id and supprime_le is null;
  elsif p_sorte = 'chapitre' then
    select c.partie_id into v_parent from public.chapitres c where c.id = p_id and c.supprime_le is null;
    -- Le seul chapitre d'une partie ne se supprime pas : on supprime la partie (F03.1)
    if v_parent is not null
       and not exists (select 1 from public.chapitres c where c.partie_id = v_parent and c.supprime_le is null and c.id <> p_id) then
      raise exception 'C''est le seul chapitre de sa partie : supprimez la partie.' using errcode = 'P0002';
    end if;
    update public.chapitres set supprime_le = now() where id = p_id and supprime_le is null;
  elsif p_sorte = 'scene' then
    update public.scenes set supprime_le = now() where id = p_id and supprime_le is null;
  else
    raise exception 'Élément inconnu.' using errcode = 'P0001';
  end if;
  get diagnostics v_lignes = row_count;
  if v_lignes = 0 then
    raise exception 'Cet élément n''existe pas, ou il est déjà dans la corbeille.' using errcode = 'P0001';
  end if;
end
$$;

-- « Restaurer » : l'élément revient à son ancien rang, ou à la fin (F03-AC27). Il ne se
-- restaure pas avant son parent (F03-AC31).
create function public.restaurer_element(p_sorte text, p_id uuid) returns void
language plpgsql security invoker set search_path = ''
as $$
declare
  v_parent uuid;
  v_rang integer;
begin
  if p_sorte = 'partie' then
    select pa.projet_id, pa.rang into v_parent, v_rang from public.parties pa where pa.id = p_id and pa.supprime_le is not null;
    if v_parent is null then
      raise exception 'Cet élément n''est pas dans la corbeille.' using errcode = 'P0001';
    end if;
    update public.parties set rang = rang + 1 where projet_id = v_parent and supprime_le is null and rang >= v_rang;
    update public.parties set supprime_le = null where id = p_id;
    perform prive.resserrer('parties', v_parent);
  elsif p_sorte = 'chapitre' then
    select c.partie_id, c.rang into v_parent, v_rang from public.chapitres c where c.id = p_id and c.supprime_le is not null;
    if v_parent is null then
      raise exception 'Cet élément n''est pas dans la corbeille.' using errcode = 'P0001';
    end if;
    if exists (select 1 from public.parties pa where pa.id = v_parent and pa.supprime_le is not null) then
      raise exception 'Restaurez d''abord la partie de ce chapitre.' using errcode = 'P0003';
    end if;
    update public.chapitres set rang = rang + 1 where partie_id = v_parent and supprime_le is null and rang >= v_rang;
    update public.chapitres set supprime_le = null where id = p_id;
    perform prive.resserrer('chapitres', v_parent);
  elsif p_sorte = 'scene' then
    select s.chapitre_id, s.rang into v_parent, v_rang from public.scenes s where s.id = p_id and s.supprime_le is not null;
    if v_parent is null then
      raise exception 'Cet élément n''est pas dans la corbeille.' using errcode = 'P0001';
    end if;
    if not (select prive.chapitre_dans_le_plan(v_parent)) then
      raise exception 'Restaurez d''abord le chapitre de cette scène.' using errcode = 'P0003';
    end if;
    update public.scenes set rang = rang + 1 where chapitre_id = v_parent and supprime_le is null and rang >= v_rang;
    update public.scenes set supprime_le = null where id = p_id;
    perform prive.resserrer('scenes', v_parent);
  else
    raise exception 'Élément inconnu.' using errcode = 'P0001';
  end if;
end
$$;

-- Les élèves d'un chapitre, remplacés d'un seul tenant (F06.1).
-- p_eleves : tableau de { eleve: uuid, profil: 'propositions' | 'organisation' }.
create function public.attribuer_chapitre(p_chapitre uuid, p_eleves jsonb) returns void
language plpgsql security invoker set search_path = ''
as $$
declare
  v_projet uuid;
begin
  select c.projet_id into v_projet from public.chapitres c where c.id = p_chapitre and c.supprime_le is null;
  if v_projet is null then
    raise exception 'Ce chapitre n''existe pas.' using errcode = 'P0001';
  end if;
  delete from public.attributions a
  where a.chapitre_id = p_chapitre
    and a.eleve_id not in (select (e ->> 'eleve')::uuid from jsonb_array_elements(coalesce(p_eleves, '[]'::jsonb)) e);
  insert into public.attributions (chapitre_id, eleve_id, projet_id, enseignant_id, profil)
  select p_chapitre, (e ->> 'eleve')::uuid, v_projet, (select auth.uid()), coalesce(e ->> 'profil', 'propositions')
  from jsonb_array_elements(coalesce(p_eleves, '[]'::jsonb)) e
  on conflict (chapitre_id, eleve_id) do update set profil = excluded.profil;
end
$$;

-- ————————————————————————————————————————————————————————————————————————
-- Fonctions du poste d'un élève
-- ————————————————————————————————————————————————————————————————————————

-- Résumé d'un chapitre attribué (F02-AC15) ; rien pour un chapitre qui n'est pas le sien
create function public.resume_du_chapitre(p_chapitre uuid) returns text
language sql stable security definer set search_path = ''
as $$
  select c.resume from public.chapitres c
  where c.id = p_chapitre and (select prive.profil_dans(p_chapitre)) is not null
$$;

-- Consignes des scènes d'un chapitre attribué. La lecture ouverte n'ouvre pas les
-- consignes (F06-AC48).
create function public.consignes_du_chapitre(p_chapitre uuid)
returns table (scene_id uuid, consigne text)
language sql stable security definer set search_path = ''
as $$
  select s.id, s.consigne from public.scenes s
  where s.chapitre_id = p_chapitre and s.supprime_le is null
    and (select prive.profil_dans(p_chapitre)) is not null
$$;

-- Chemin du fichier d'une image de repérage que le poste peut voir (F10-AC06)
create function public.image_du_poste(p_image uuid) returns table (chemin text, chemin_vignette text)
language sql stable security definer set search_path = ''
as $$
  select i.chemin, i.chemin_vignette from public.images i
  where i.id = p_image and (select prive.image_du_poste(p_image))
$$;

-- Profil « écriture et organisation » : créer une scène dans son chapitre (F06-AC12)
create function public.eleve_creer_scene(p_chapitre uuid)
returns table (scene_id uuid, reference integer)
language plpgsql security definer set search_path = ''
as $$
begin
  if (select prive.profil_dans(p_chapitre)) is distinct from 'organisation' then
    raise exception 'Tu ne peux pas créer de scène dans ce chapitre.' using errcode = 'P0001';
  end if;
  return query select * from prive.ajouter_scene(p_chapitre, (select prive.eleve_au_travail()));
end
$$;

-- … lui donner ou changer son titre (F06-AC89)
create function public.eleve_titrer_scene(p_scene uuid, p_titre text) returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v_chapitre uuid;
begin
  select s.chapitre_id into v_chapitre from public.scenes s where s.id = p_scene and s.supprime_le is null;
  if v_chapitre is null or (select prive.profil_dans(v_chapitre)) is distinct from 'organisation' then
    raise exception 'Tu ne peux pas renommer cette scène.' using errcode = 'P0001';
  end if;
  update public.scenes set titre = nullif(btrim(p_titre), '') where id = p_scene;
end
$$;

-- … changer l'ordre des scènes de son chapitre (F06-AC89)
create function public.eleve_placer_scene(p_scene uuid, p_position integer) returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v_chapitre uuid;
begin
  select s.chapitre_id into v_chapitre from public.scenes s where s.id = p_scene and s.supprime_le is null;
  if v_chapitre is null or (select prive.profil_dans(v_chapitre)) is distinct from 'organisation' then
    raise exception 'Tu ne peux pas déplacer cette scène.' using errcode = 'P0001';
  end if;
  perform prive.ranger_scene(p_scene, p_position);
end
$$;

-- … supprimer une scène qu'il a créée lui-même, tant qu'elle ne contient pas de travail
-- (F06-AC86 à AC88). Elle va dans la corbeille du projet, que seul l'adulte voit.
create function public.eleve_supprimer_scene(p_scene uuid) returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v_chapitre uuid;
  v_createur uuid;
begin
  select s.chapitre_id, s.cree_par_eleve into v_chapitre, v_createur
  from public.scenes s where s.id = p_scene and s.supprime_le is null;
  if v_chapitre is null
     or (select prive.profil_dans(v_chapitre)) is distinct from 'organisation'
     or v_createur is distinct from (select prive.eleve_au_travail())
     or (select prive.scene_contient_du_travail(p_scene)) then
    raise exception 'Tu ne peux pas supprimer cette scène.' using errcode = 'P0001';
  end if;
  update public.scenes set supprime_le = now() where id = p_scene;
end
$$;

-- ————————————————————————————————————————————————————————————————————————
-- Droits
-- ————————————————————————————————————————————————————————————————————————

revoke execute on all functions in schema prive from public, anon, authenticated, poste;
grant execute on function
  prive.classe_du_poste(), prive.inscription_du_poste(), prive.enseignant_du_poste(),
  prive.horaires_ouverts(uuid, timestamptz),
  prive.eleve_au_travail(), prive.projet_du_poste(uuid), prive.chapitre_dans_le_plan(uuid),
  prive.profil_dans(uuid), prive.scenes_lisibles(uuid), prive.image_du_poste(uuid),
  prive.scene_contient_du_travail(uuid)
  to poste, service_role;
grant execute on function prive.classe_en_cours(uuid), prive.chapitre_dans_le_plan(uuid) to authenticated, service_role;
grant execute on function
  prive.resserrer(text, uuid), prive.ajouter_scene(uuid, uuid), prive.ranger_scene(uuid, integer)
  to authenticated, service_role;
grant execute on function prive.fermeture_nocturne(timestamptz, text) to service_role;

-- L'adulte
grant update (titre, classe_id, dernier_onglet, image_id, visuel_defaut, visuel_choisi, lecture_ouverte, depart_scene_id, reference_suivante)
  on public.projets to authenticated;
grant select, insert, delete on public.images to authenticated;
grant select, insert on public.parties, public.chapitres, public.scenes to authenticated;
grant update (titre, rang, image_id, visuel_defaut, visuel_choisi, supprime_le) on public.parties to authenticated;
grant update (titre, rang, partie_id, couleur, resume, image_id, visuel_defaut, visuel_choisi, hors_livre, supprime_le)
  on public.chapitres to authenticated;
grant update (titre, consigne, rang, fin, hors_livre, supprime_le) on public.scenes to authenticated;
grant select, insert, update, delete on public.attributions to authenticated;
grant select, update on public.preparations to authenticated;
grant select, insert, update, delete on public.pistes, public.objets, public.formules to authenticated;
grant execute on function
  public.creer_partie(uuid, text, text, text, integer, text),
  public.creer_chapitre(uuid, text, integer, text),
  public.creer_scene(uuid),
  public.placer_partie(uuid, integer),
  public.placer_chapitre(uuid, uuid, integer),
  public.placer_scene(uuid, integer),
  public.supprimer_element(text, uuid),
  public.restaurer_element(text, uuid),
  public.attribuer_chapitre(uuid, jsonb)
  to authenticated;

-- Le poste : des colonnes choisies, en lecture seule ; ni résumé, ni consigne, ni
-- préparation, ni corbeille
grant select (id, titre, recit, organisation, classe_id, enseignant_id, image_id, visuel_defaut, visuel_choisi, lecture_ouverte)
  on public.projets to poste;
grant select (id, projet_id, titre, rang, image_id, visuel_defaut, visuel_choisi, supprime_le) on public.parties to poste;
grant select (id, partie_id, projet_id, titre, rang, couleur, image_id, visuel_defaut, visuel_choisi, supprime_le)
  on public.chapitres to poste;
grant select (id, chapitre_id, projet_id, reference, titre, rang, cree_par_eleve, supprime_le) on public.scenes to poste;
grant select (chapitre_id, eleve_id, projet_id, profil) on public.attributions to poste;
grant execute on function
  public.resume_du_chapitre(uuid), public.consignes_du_chapitre(uuid), public.image_du_poste(uuid),
  public.eleve_creer_scene(uuid), public.eleve_titrer_scene(uuid, text),
  public.eleve_placer_scene(uuid, integer), public.eleve_supprimer_scene(uuid)
  to poste;

-- Le serveur de l'application
grant all on all tables in schema public to service_role;
grant execute on all functions in schema public to service_role;

-- ————————————————————————————————————————————————————————————————————————
-- Règles d'accès aux lignes
-- ————————————————————————————————————————————————————————————————————————

alter table public.images enable row level security;
alter table public.parties enable row level security;
alter table public.chapitres enable row level security;
alter table public.scenes enable row level security;
alter table public.attributions enable row level security;
alter table public.preparations enable row level security;
alter table public.pistes enable row level security;
alter table public.objets enable row level security;
alter table public.formules enable row level security;

-- L'adulte : ses seules lignes, dans chaque table
do $$
declare
  t text;
begin
  foreach t in array array['images', 'parties', 'chapitres', 'scenes', 'attributions', 'preparations', 'pistes', 'objets', 'formules'] loop
    execute format('create policy enseignant_lit on public.%I for select to authenticated using (enseignant_id = (select auth.uid()))', t);
    execute format('create policy enseignant_cree on public.%I for insert to authenticated with check (enseignant_id = (select auth.uid()))', t);
    execute format('create policy enseignant_modifie on public.%I for update to authenticated using (enseignant_id = (select auth.uid())) with check (enseignant_id = (select auth.uid()))', t);
    execute format('create policy enseignant_supprime on public.%I for delete to authenticated using (enseignant_id = (select auth.uid()))', t);
  end loop;
end
$$;

-- Le poste : le projet de sa classe, pour un élève identifié, pendant les horaires
create policy poste_lit_les_projets_de_sa_classe on public.projets
  for select to poste using ((select prive.projet_du_poste(id)));

-- Les cartes des parties et des chapitres se voient sans attribution (F03-AC15, F06-AC22)
create policy poste_lit_les_parties on public.parties
  for select to poste using (supprime_le is null and (select prive.projet_du_poste(projet_id)));
create policy poste_lit_les_chapitres on public.chapitres
  for select to poste
  using ((select prive.projet_du_poste(projet_id)) and (select prive.chapitre_dans_le_plan(id)));

-- Les scènes : celles de ses chapitres, ou toutes quand la lecture est ouverte (F06-AC21, AC48)
create policy poste_lit_les_scenes on public.scenes
  for select to poste using (supprime_le is null and (select prive.scenes_lisibles(chapitre_id)));

-- Les attributions : les siennes, et celles de ses camarades de chapitre
create policy poste_lit_les_attributions on public.attributions
  for select to poste
  using (
    (select prive.projet_du_poste(projet_id))
    and (eleve_id = (select prive.eleve_au_travail()) or (select prive.profil_dans(chapitre_id)) is not null)
  );
