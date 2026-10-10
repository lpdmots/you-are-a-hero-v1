-- Étape 3 du plan, lot 2 : phrases de choix, renvois, numéros et chemins.
-- Règles : F05 et F05.2 (choix dans la scène), F11.5 (ordre imprimé, numéro fixé),
-- F03.1 (vue « Chemins »), F06.1 (raccords réservés à l'enseignant).
--
-- Les chemins du récit ne se saisissent pas deux fois : la table des liens se déduit du
-- texte de chaque scène, dans la même opération que son enregistrement. Elle ne passe donc
-- par aucun état intermédiaire.

-- ————————————————————————————————————————————————————————————————————————
-- Ordre imprimé et numéros (F11.5)
-- ————————————————————————————————————————————————————————————————————————

alter table public.projets
  -- L'ordre du livre est établi dès qu'un numéro doit s'afficher, puis gardé (F11-AC19)
  add column ordre_etabli_le timestamptz;

alter table public.scenes
  -- Rang gardé dans le groupe de mélange de la scène
  add column rang_livre integer,
  -- Numéro que la scène doit garder : fixé par l'adulte, ou par une liaison cachée (F05.1)
  add column numero_fixe integer check (numero_fixe between 1 and 9999);
-- Une scène, un numéro fixé ; un numéro, une scène (F05-AC36)
create unique index scenes_numero_fixe_unique on public.scenes (projet_id, numero_fixe) where numero_fixe is not null;

alter table public.parties
  -- Ses scènes sont mélangées avec celles de la partie précédente (F11-AC17)
  add column groupe_avec_precedente boolean not null default false,
  -- Scène d'ouverture choisie par l'adulte ; sinon la première scène de la partie
  add column ouverture_scene_id uuid,
  add constraint parties_ouverture_fk foreign key (ouverture_scene_id, projet_id) references public.scenes (id, projet_id);
create index parties_ouverture_idx on public.parties (ouverture_scene_id);

-- ————————————————————————————————————————————————————————————————————————
-- Les liens du récit, déduits des textes
-- ————————————————————————————————————————————————————————————————————————

create table public.liens (
  -- Scène d'origine
  scene_id uuid not null,
  -- Identité du renvoi dans le texte : celle de la phrase automatique, ou du renvoi lui-même
  renvoi_id uuid not null,
  projet_id uuid not null,
  enseignant_id uuid not null,
  -- Destination ; rien tant qu'elle est « à décider plus tard » (F05-AC17)
  cible_id uuid,
  libelle text not null default '',
  -- Liaison cachée par énigme : un chemin du récit, sans phrase dans le texte (F05.1)
  cache boolean not null default false,
  rang integer not null,
  primary key (scene_id, renvoi_id),
  foreign key (scene_id, projet_id) references public.scenes (id, projet_id) on delete cascade,
  foreign key (cible_id, projet_id) references public.scenes (id, projet_id) on delete cascade,
  foreign key (projet_id, enseignant_id) references public.projets (id, enseignant_id) on delete cascade
);
create index liens_cible_idx on public.liens (cible_id);
create index liens_projet_idx on public.liens (projet_id);
create index liens_enseignant_idx on public.liens (enseignant_id);

-- Les renvois d'un texte, dans l'ordre où ils s'y trouvent. Une phrase automatique porte
-- sa destination sur le bloc ; une phrase personnalisée, sur chacun de ses renvois.
create function prive.renvois_du_texte(p_texte jsonb)
returns table (renvoi_id uuid, cible text, libelle text, cache boolean, rang integer)
language sql immutable set search_path = ''
as $$
  select (b.bloc ->> 'id')::uuid, b.bloc ->> 'cible', coalesce(b.bloc ->> 'libelle', ''), b.bloc ->> 'type' = 'liaison', (b.n * 1000)::integer
  from jsonb_array_elements(p_texte) with ordinality as b (bloc, n)
  where (b.bloc ->> 'type' = 'choix' and b.bloc -> 'auto' = 'true'::jsonb) or b.bloc ->> 'type' = 'liaison'
  union all
  select (r.renvoi ->> 'id')::uuid, r.renvoi ->> 'cible', coalesce(nullif(r.renvoi ->> 'libelle', ''), b.bloc ->> 'libelle', ''), false, (b.n * 1000 + r.k)::integer
  from jsonb_array_elements(p_texte) with ordinality as b (bloc, n)
  cross join lateral jsonb_array_elements(b.bloc -> 'children') with ordinality as r (renvoi, k)
  where b.bloc ->> 'type' = 'choix' and b.bloc -> 'auto' is distinct from 'true'::jsonb and r.renvoi ->> 'type' = 'renvoi'
$$;

-- Refaire les liens d'une scène d'après son texte. Une destination qui n'est pas une scène
-- du projet ne fait pas de lien vers elle : le renvoi reste, sans destination.
create function prive.relier() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' and new.texte = old.texte then
    return new;
  end if;
  delete from public.liens l where l.scene_id = new.id;
  insert into public.liens (scene_id, renvoi_id, projet_id, enseignant_id, cible_id, libelle, cache, rang)
  select distinct on (r.renvoi_id) new.id, r.renvoi_id, new.projet_id, new.enseignant_id,
         (select s.id from public.scenes s where s.id::text = r.cible and s.projet_id = new.projet_id),
         left(r.libelle, 200), r.cache, r.rang
  from prive.renvois_du_texte(new.texte) r
  where r.renvoi_id is not null
  order by r.renvoi_id, r.rang;
  return new;
end
$$;
create trigger scenes_relier
  after insert or update of texte on public.scenes
  for each row execute function prive.relier();

-- ————————————————————————————————————————————————————————————————————————
-- Ordre du livre
-- ————————————————————————————————————————————————————————————————————————

-- Établir l'ordre du livre, une fois : p_rangs donne à chaque scène son rang dans son
-- groupe de mélange. Demandé par l'adulte, ou par le serveur de l'application quand le
-- premier choix est créé par un élève.
create function public.etablir_ordre(p_projet uuid, p_rangs jsonb) returns boolean
language plpgsql security definer set search_path = ''
as $$
declare
  v_enseignant uuid;
  v_fait timestamptz;
begin
  select p.enseignant_id, p.ordre_etabli_le into v_enseignant, v_fait
  from public.projets p where p.id = p_projet and p.recit = 'choix' for update;
  if not found
     or (coalesce((select auth.role()), '') <> 'service_role' and v_enseignant is distinct from (select auth.uid())) then
    return false;
  end if;
  if v_fait is not null then
    return false;
  end if;
  update public.scenes s set rang_livre = (p_rangs ->> s.id::text)::integer
  where s.projet_id = p_projet and p_rangs ? s.id::text;
  -- Une scène que le tirage n'a pas vue prend la suite, dans l'ordre de sa création
  update public.scenes s set rang_livre = o.r
  from (
    select x.id,
           coalesce((select max(y.rang_livre) from public.scenes y where y.projet_id = p_projet), -1)
             + row_number() over (order by x.reference) as r
    from public.scenes x where x.projet_id = p_projet and x.rang_livre is null
  ) o
  where s.id = o.id;
  update public.projets set ordre_etabli_le = now() where id = p_projet;
  return true;
end
$$;

-- Une nouvelle scène prend la suite de son groupe de mélange, une fois l'ordre établi
-- (F11-AC19). Le corps est celui de l'étape 2, avec le rang du livre en plus.
create or replace function prive.ajouter_scene(p_chapitre uuid, p_eleve uuid)
returns table (scene_id uuid, reference integer)
language plpgsql set search_path = ''
as $$
#variable_conflict use_column
declare
  v_id uuid := gen_random_uuid();
  v_projet uuid;
  v_enseignant uuid;
  v_reference integer;
  v_etabli boolean;
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
  returning p.reference_suivante - 1, p.ordre_etabli_le is not null into v_reference, v_etabli;
  if v_reference is null then
    raise exception 'Ce chapitre n''existe pas.' using errcode = 'P0001';
  end if;
  insert into public.scenes (id, chapitre_id, projet_id, enseignant_id, reference, rang, cree_par_eleve, rang_livre)
  select v_id, p_chapitre, v_projet, v_enseignant, v_reference,
         coalesce((select max(s.rang) + 1 from public.scenes s where s.chapitre_id = p_chapitre and s.supprime_le is null), 0),
         p_eleve,
         case when v_etabli then coalesce((select max(s.rang_livre) + 1 from public.scenes s where s.projet_id = v_projet), 0) end;
  return query select v_id, v_reference;
end
$$;

-- « Fixer son numéro… » (F11-AC96). Le départ porte toujours le n° 1 : il ne se fixe pas.
-- Un numéro déjà fixé pour une autre scène est refusé, et cette scène est nommée (F05-AC36).
create function public.fixer_numero(p_scene uuid, p_numero integer) returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  s record;
  autre record;
begin
  select sc.id, sc.projet_id, p.depart_scene_id, p.recit into s
  from public.scenes sc join public.projets p on p.id = sc.projet_id
  where sc.id = p_scene and sc.enseignant_id = (select auth.uid());
  if not found or s.recit <> 'choix' then
    raise exception 'Cette scène n''existe pas.' using errcode = 'P0001';
  end if;
  if s.depart_scene_id = p_scene then
    raise exception 'Le départ du livre porte toujours le n° 1.' using errcode = 'P0001';
  end if;
  if p_numero is null or p_numero < 1 or p_numero > 9999 then
    raise exception 'Écrivez un numéro entre 1 et 9999.' using errcode = 'P0001';
  end if;
  select x.id, x.reference, x.titre into autre
  from public.scenes x where x.projet_id = s.projet_id and x.numero_fixe = p_numero and x.id <> p_scene;
  if found then
    return jsonb_build_object('fixe', false, 'prise', jsonb_build_object('id', autre.id, 'reference', autre.reference, 'titre', autre.titre));
  end if;
  -- Le départ occupe le n° 1
  if p_numero = 1 and s.depart_scene_id is not null then
    select x.id, x.reference, x.titre into autre from public.scenes x where x.id = s.depart_scene_id;
    return jsonb_build_object('fixe', false, 'prise', jsonb_build_object('id', autre.id, 'reference', autre.reference, 'titre', autre.titre));
  end if;
  update public.scenes set numero_fixe = p_numero where id = p_scene;
  return jsonb_build_object('fixe', true);
end
$$;

-- « Libérer le numéro » : le passage prend place à la suite de son groupe (F11-AC97)
create function public.liberer_numero(p_scene uuid) returns void
language plpgsql security definer set search_path = ''
as $$
begin
  update public.scenes s
  set numero_fixe = null,
      rang_livre = case when s.rang_livre is null then null
                        else (select max(y.rang_livre) + 1 from public.scenes y where y.projet_id = s.projet_id) end
  where s.id = p_scene and s.enseignant_id = (select auth.uid()) and s.numero_fixe is not null;
  if not found then
    raise exception 'Cette scène n''a pas de numéro fixé.' using errcode = 'P0001';
  end if;
end
$$;

-- ————————————————————————————————————————————————————————————————————————
-- Fonctions du poste d'un élève
-- ————————————————————————————————————————————————————————————————————————

-- De quoi calculer les numéros du livre : la structure du plan, sans aucun titre ni texte.
-- Un élève lit le numéro d'une destination même hors de son chapitre (F05.2).
create function public.numerotation_du_projet(p_projet uuid) returns jsonb
language sql stable security definer set search_path = ''
as $$
  select jsonb_build_object(
    'depart', p.depart_scene_id,
    'parties', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', pa.id, 'groupe', pa.groupe_avec_precedente, 'ouverture', pa.ouverture_scene_id,
        'chapitres', coalesce((
          select jsonb_agg(jsonb_build_object(
            'hors', c.hors_livre,
            'scenes', coalesce((
              select jsonb_agg(jsonb_build_object('id', s.id, 'hors', s.hors_livre, 'rang', s.rang_livre, 'fixe', s.numero_fixe) order by s.rang, s.cree_le)
              from public.scenes s where s.chapitre_id = c.id and s.supprime_le is null), '[]'::jsonb)
          ) order by c.rang, c.cree_le)
          from public.chapitres c where c.partie_id = pa.id and c.supprime_le is null), '[]'::jsonb)
      ) order by pa.rang, pa.cree_le)
      from public.parties pa where pa.projet_id = p.id and pa.supprime_le is null), '[]'::jsonb)
  )
  from public.projets p
  where p.id = p_projet and p.recit = 'choix' and (select prive.projet_du_poste(p.id))
$$;

-- Les destinations des renvois d'une scène que l'élève lit. Dans ce qu'il peut lire, la
-- référence et le titre ; ailleurs, « autre chapitre » et le titre public de ce chapitre,
-- sans titre ni référence de scène (F05-AC03, F05.2).
create function public.destinations_de_la_scene(p_scene uuid)
returns table (renvoi_id uuid, cible_id uuid, lisible boolean, reference integer, titre text, chapitre text, supprimee boolean)
language sql stable security definer set search_path = ''
as $$
  select l.renvoi_id, l.cible_id,
         (select prive.scenes_lisibles(d.chapitre_id)),
         case when (select prive.scenes_lisibles(d.chapitre_id)) then d.reference end,
         case when (select prive.scenes_lisibles(d.chapitre_id)) then d.titre end,
         c.titre,
         d.supprime_le is not null or not (select prive.chapitre_dans_le_plan(d.chapitre_id))
  from public.liens l
  join public.scenes o on o.id = l.scene_id
  join public.scenes d on d.id = l.cible_id
  join public.chapitres c on c.id = d.chapitre_id
  where l.scene_id = p_scene and not l.cache
    and o.supprime_le is null and (select prive.scenes_lisibles(o.chapitre_id))
  order by l.rang
$$;

-- Les scènes d'un chapitre où l'élève écrit, pour choisir la destination d'un choix : la
-- référence, le titre et le début du texte, sans les notes de l'enseignant (F05-AC47).
create function public.destinations_du_chapitre(p_chapitre uuid)
returns table (id uuid, reference integer, titre text, vide boolean, texte jsonb)
language sql stable security definer set search_path = ''
as $$
  select s.id, s.reference, s.titre, s.texte_vide, jsonb_path_query_array(s.texte, '$[*] ? (@.type == "p")')
  from public.scenes s
  where s.chapitre_id = p_chapitre and s.supprime_le is null
    and (select prive.profil_dans(p_chapitre)) is not null
  order by s.rang
$$;

-- Les liens d'un chapitre que l'élève lit, pour sa vue « Chemins » (F03-AC18). Hors du
-- chapitre, il n'apprend que le titre public du chapitre d'arrivée (F05-AC03).
create function public.liens_du_chapitre(p_chapitre uuid)
returns table (scene_id uuid, renvoi_id uuid, cible_id uuid, libelle text, chapitre_cible text, manque text)
language sql stable security definer set search_path = ''
as $$
  select l.scene_id, l.renvoi_id,
         case when d.chapitre_id = p_chapitre then l.cible_id end,
         l.libelle,
         case when d.chapitre_id <> p_chapitre then c.titre end,
         case when l.cible_id is null then 'sans' when d.id is null then 'supprimee' end
  from public.liens l
  join public.scenes o on o.id = l.scene_id
  left join public.scenes d on d.id = l.cible_id and d.supprime_le is null and (select prive.chapitre_dans_le_plan(d.chapitre_id))
  left join public.chapitres c on c.id = d.chapitre_id
  where o.chapitre_id = p_chapitre and o.supprime_le is null and not l.cache
    and (select prive.scenes_lisibles(p_chapitre))
  order by o.rang, l.rang
$$;

-- Ce que la recherche d'un élève peut trouver (F05-AC48) : les scènes des chapitres qu'il
-- lit, avec leurs mots, sans les notes de l'enseignant ; la consigne, dans ses chapitres
-- seulement. Rien d'un chapitre fermé n'en sort, pas même un titre de scène (F05-AC03).
create function public.scenes_a_chercher()
returns table (id uuid, reference integer, titre text, chapitre_id uuid, chapitre text, couleur smallint, consigne text, mots text)
language sql stable security definer set search_path = ''
as $$
  select s.id, s.reference, s.titre, c.id, c.titre, c.couleur,
         case when (select prive.profil_dans(c.id)) is not null then s.consigne end,
         coalesce((
           select string_agg(m #>> '{}', ' ')
           from jsonb_path_query(s.texte, '$[*] ? (@.type != "note").**.text') m
         ), '') || ' ' || coalesce((
           select string_agg(b ->> 'libelle', ' ')
           from jsonb_array_elements(s.texte) b where b ->> 'type' = 'choix'
         ), '')
  from public.scenes s
  join public.chapitres c on c.id = s.chapitre_id
  join public.parties pa on pa.id = c.partie_id
  where s.supprime_le is null and (select prive.scenes_lisibles(c.id))
  order by pa.rang, c.rang, s.rang
$$;

-- La scène qu'un élève ouvre : comme au lot 1, avec la façon d'annoncer un numéro et les
-- constructions du livre, dont la phrase de choix a besoin pour se composer (F05-AC10).
-- Le reste de la préparation ne lui est pas lu (F02-AC04).
create or replace function public.scene_du_poste(p_scene uuid) returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
declare
  s record;
  v_eleve uuid := (select prive.eleve_au_travail());
  v_profil text;
begin
  select sc.id, sc.chapitre_id, sc.projet_id, sc.reference, sc.titre, sc.consigne, sc.texte, sc.version, sc.texte_vide,
         sc.prise_par_eleve, sc.prise_par_enseignant, sc.fin, sc.numero_fixe
  into s from public.scenes sc where sc.id = p_scene and sc.supprime_le is null;
  if not found or v_eleve is null or not (select prive.scenes_lisibles(s.chapitre_id)) then
    return null;
  end if;
  v_profil := (select prive.profil_dans(s.chapitre_id));
  return jsonb_build_object(
    'id', s.id, 'chapitre', s.chapitre_id, 'projet', s.projet_id, 'reference', s.reference, 'titre', s.titre,
    'consigne', case when v_profil is null then null else s.consigne end,
    'texte', jsonb_path_query_array(s.texte, '$[*] ? (@.type != "note")'),
    'version', s.version, 'vide', s.texte_vide,
    'profil', v_profil,
    'prise_par_eleve', s.prise_par_eleve, 'prise_par_enseignant', s.prise_par_enseignant,
    'marques', (select p.mise_en_forme_eleves from public.projets p where p.id = s.projet_id),
    'recit', (select p.recit from public.projets p where p.id = s.projet_id),
    'formule', (select pr.formule_renvoi from public.preparations pr where pr.projet_id = s.projet_id),
    'constructions', (select to_jsonb(pr.constructions) from public.preparations pr where pr.projet_id = s.projet_id),
    'refus', prive.refus_d_ecrire(s.id, v_eleve)
  );
end
$$;

-- Ce que le serveur relit avant de contrôler le texte d'un élève : comme au lot 1, avec
-- les scènes de son chapitre, hors desquelles un choix est un raccord (F06-AC13)
create or replace function public.ecriture_lire(p_ecriture uuid, p_jeton_hash text) returns jsonb
language sql stable security invoker set search_path = ''
as $$
  select jsonb_build_object(
    'scene', s.id, 'projet', s.projet_id, 'chapitre', s.chapitre_id, 'eleve', ec.eleve_id,
    'texte', s.texte, 'version', s.version,
    'profil', (select a.profil from public.attributions a where a.chapitre_id = s.chapitre_id and a.eleve_id = ec.eleve_id),
    'scenes_du_chapitre', (select coalesce(jsonb_agg(x.id), '[]'::jsonb) from public.scenes x where x.chapitre_id = s.chapitre_id and x.supprime_le is null)
  )
  from public.ecritures ec
  join public.postes p on p.id = ec.poste_id
  join public.scenes s on s.id = ec.scene_id
  where ec.id = p_ecriture and p.jeton_hash = p_jeton_hash and ec.close_le is null
$$;

-- Profil « écriture et organisation » : supprimer aussi la scène qu'il vient de créer depuis
-- un choix annulé passe par eleve_supprimer_scene, inchangée (F05-AC44, F06-AC86).

-- ————————————————————————————————————————————————————————————————————————
-- Droits
-- ————————————————————————————————————————————————————————————————————————

revoke execute on function prive.renvois_du_texte(jsonb), prive.relier() from public, anon, authenticated, poste;
grant execute on function prive.renvois_du_texte(jsonb) to service_role;

grant select on public.liens to authenticated;
grant update (groupe_avec_precedente, ouverture_scene_id) on public.parties to authenticated;
grant execute on function
  public.etablir_ordre(uuid, jsonb), public.fixer_numero(uuid, integer), public.liberer_numero(uuid)
  to authenticated;

grant select (rang_livre, numero_fixe) on public.scenes to poste;
grant execute on function
  public.numerotation_du_projet(uuid), public.destinations_de_la_scene(uuid),
  public.destinations_du_chapitre(uuid), public.liens_du_chapitre(uuid), public.scenes_a_chercher()
  to poste;

grant all on all tables in schema public to service_role;
grant execute on all functions in schema public to service_role;

alter table public.liens enable row level security;
create policy enseignant_lit on public.liens
  for select to authenticated using (enseignant_id = (select auth.uid()));
