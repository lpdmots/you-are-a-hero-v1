-- Construire dans « Chemins », lot 1 : l'ajout venu du plan (F08.1, F08-AC44 ; F03.1).
--
-- Depuis « Chemins », l'adulte pose un choix à la fin du texte d'une scène, ou en retire un,
-- sans ouvrir la scène. Celui qui l'écrit au même moment n'est jamais arrêté : la base note
-- chaque retouche du plan, et quand un enregistrement arrive d'une page qui ne l'a pas vue,
-- elle la rejoue sur le texte reçu au lieu de le refuser. Tout autre changement survenu
-- entre-temps reste un conflit, et le texte est gardé à part comme avant (F08-AC01).

-- ————————————————————————————————————————————————————————————————————————
-- Les retouches du plan
-- ————————————————————————————————————————————————————————————————————————

-- Une ligne par retouche : la version que la scène a prise, les phrases de choix ajoutées et
-- les blocs retirés. Lue et écrite par les seules fonctions ci-dessous.
create table public.retouches_du_plan (
  scene_id uuid not null,
  -- La version de la scène une fois la retouche faite
  version integer not null,
  projet_id uuid not null,
  enseignant_id uuid not null,
  ajoute jsonb not null default '[]'::jsonb check (jsonb_typeof(ajoute) = 'array'),
  retire uuid[] not null default '{}',
  faite_le timestamptz not null default now(),
  primary key (scene_id, version),
  foreign key (scene_id, projet_id) references public.scenes (id, projet_id) on delete cascade,
  foreign key (projet_id, enseignant_id) references public.projets (id, enseignant_id) on delete cascade
);
create index retouches_du_plan_projet_idx on public.retouches_du_plan (projet_id);
create index retouches_du_plan_enseignant_idx on public.retouches_du_plan (enseignant_id);

-- ————————————————————————————————————————————————————————————————————————
-- Poser et retirer des blocs dans un texte
-- ————————————————————————————————————————————————————————————————————————

-- La ligne où l'on écrit : un paragraphe de récit vide, que l'enseignant n'a pas protégé
create function prive.ligne_vide(p_bloc jsonb) returns boolean
language sql immutable set search_path = ''
as $$
  select p_bloc ->> 'type' = 'p'
    and p_bloc -> 'protege' is distinct from 'true'::jsonb
    and not jsonb_path_exists(p_bloc, '$.children[*] ? (@.type == "image-ligne" || @.text != "")')
$$;

-- Poser des blocs à la fin du récit : après le dernier bloc qui n'est pas une ligne vide,
-- avant les liaisons cachées, qui sont hors du récit. Une scène sans rien d'écrit garde sa
-- première ligne au-dessus. La copie ouverte applique la même règle (domaine/copie.ts,
-- « placeALaFin ») : un bloc réservé ne se retrouve jamais après ceux qu'on pose.
create function prive.poser_a_la_fin(p_texte jsonb, p_blocs jsonb) returns jsonb
language sql immutable set search_path = ''
as $$
  with t as (
    select b.bloc, b.n from jsonb_array_elements(coalesce(p_texte, '[]'::jsonb)) with ordinality as b (bloc, n)
  ), ou as (
    select coalesce(
      (select max(t.n) from t where t.bloc ->> 'type' is distinct from 'liaison' and not prive.ligne_vide(t.bloc)),
      least(1, (select count(*) from t where t.bloc ->> 'type' is distinct from 'liaison'))
    ) as apres
  ), suite as (
    select t.bloc, case when t.bloc ->> 'type' is distinct from 'liaison' and t.n <= (select apres from ou) then 0 else 2 end as temps, t.n from t
    union all
    select b.bloc, 1, b.n from jsonb_array_elements(coalesce(p_blocs, '[]'::jsonb)) with ordinality as b (bloc, n)
  )
  select coalesce(jsonb_agg(bloc order by temps, n), '[]'::jsonb) from suite
$$;

-- Rejouer des retouches sur un texte : les blocs retirés en sortent, les blocs ajoutés qui
-- n'y sont pas encore se posent à sa fin
create function prive.rejouer_retouches(p_texte jsonb, p_ajoute jsonb, p_retire uuid[]) returns jsonb
language sql immutable set search_path = ''
as $$
  with garde as (
    select coalesce(jsonb_agg(b.bloc order by b.n), '[]'::jsonb) as texte
    from jsonb_array_elements(coalesce(p_texte, '[]'::jsonb)) with ordinality as b (bloc, n)
    where not (lower(b.bloc ->> 'id') = any (coalesce(p_retire, '{}'::uuid[])::text[]))
       or b.bloc ->> 'id' is null
  )
  select prive.poser_a_la_fin(
    (select texte from garde),
    (select coalesce(jsonb_agg(a.bloc order by a.n), '[]'::jsonb)
     from jsonb_array_elements(coalesce(p_ajoute, '[]'::jsonb)) with ordinality as a (bloc, n)
     where not exists (
       select 1 from jsonb_array_elements((select texte from garde)) x where lower(x ->> 'id') = lower(a.bloc ->> 'id')
     ))
  )
$$;

-- Ce que le plan a fait d'une scène depuis une version : le nombre de retouches, ce qu'elles
-- ont ajouté et qui n'a pas été retiré ensuite, ce qu'elles ont retiré
create function prive.retouches_depuis(p_scene uuid, p_version integer, out nombre integer, out ajoute jsonb, out retire uuid[])
language sql stable security definer set search_path = ''
as $$
  with r as (
    select x.version, x.ajoute, x.retire from public.retouches_du_plan x where x.scene_id = p_scene and x.version > p_version
  ), retires as (
    select coalesce(array_agg(distinct i), '{}'::uuid[]) as ids from r cross join lateral unnest(r.retire) as i
  )
  select
    (select count(*)::integer from r),
    (select coalesce(jsonb_agg(b.bloc order by r.version, b.n), '[]'::jsonb)
     from r cross join lateral jsonb_array_elements(r.ajoute) with ordinality as b (bloc, n)
     where not (lower(b.bloc ->> 'id') = any ((select ids from retires)::text[]))),
    (select ids from retires)
$$;

-- ————————————————————————————————————————————————————————————————————————
-- Retoucher le texte d'une scène depuis le plan
-- ————————————————————————————————————————————————————————————————————————

-- Pose des phrases de choix à la fin du texte, ou en retire, d'un seul tenant avec la note
-- de la retouche. Seules des phrases de choix se posent et se retirent ainsi : le récit
-- n'est jamais touché. L'état de la scène, qui s'en occupe et qui y a écrit ne changent pas.
-- Rend la version de la scène.
create function prive.retoucher_texte(p_scene uuid, p_ajoute jsonb, p_retire uuid[]) returns integer
language plpgsql security definer set search_path = ''
as $$
declare
  s public.scenes%rowtype;
  v_ajoute jsonb;
  v_retire uuid[];
  v_texte jsonb;
  v_fuseau text;
begin
  select * into s from public.scenes sc where sc.id = p_scene and sc.supprime_le is null for update;
  if not found then
    raise exception 'Cette scène n''existe plus.' using errcode = 'P0001';
  end if;

  -- Seulement ce qui change quelque chose : un choix déjà là ne se pose pas deux fois
  select coalesce(jsonb_agg(b.bloc order by b.n), '[]'::jsonb) into v_ajoute
  from jsonb_array_elements(coalesce(p_ajoute, '[]'::jsonb)) with ordinality as b (bloc, n)
  where b.bloc ->> 'type' = 'choix'
    and b.bloc ->> 'id' ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    and not exists (select 1 from jsonb_array_elements(s.texte) x where lower(x ->> 'id') = lower(b.bloc ->> 'id'));
  select coalesce(array_agg(i), '{}'::uuid[]) into v_retire
  from unnest(coalesce(p_retire, '{}'::uuid[])) as i
  where exists (select 1 from jsonb_array_elements(s.texte) x where x ->> 'type' = 'choix' and lower(x ->> 'id') = i::text);
  if jsonb_array_length(v_ajoute) = 0 and cardinality(v_retire) = 0 then
    return s.version;
  end if;
  if jsonb_array_length(s.texte) + jsonb_array_length(v_ajoute) > 2000 then
    raise exception 'Cette scène est trop longue pour recevoir d''autres choix.' using errcode = 'P0001';
  end if;

  v_texte := s.texte;
  -- Une scène que personne n'a encore ouverte reçoit la ligne où écrire, au-dessus des choix :
  -- celle que la copie montre d'elle-même à l'ouverture (texteOuvert, domaine/copie.ts)
  if not exists (select 1 from jsonb_array_elements(v_texte) x where x ->> 'type' is distinct from 'liaison') then
    v_texte := jsonb_build_array(jsonb_build_object(
      'type', 'p', 'id', '00000000' || substr(p_scene::text, 9), 'children', jsonb_build_array(jsonb_build_object('text', ''))
    )) || v_texte;
  end if;
  v_texte := prive.rejouer_retouches(v_texte, v_ajoute, v_retire);

  -- Version précédente : le texte d'avant, comme pour une correction de l'adulte (F08.2)
  if not s.texte_vide then
    select coalesce(
      (select c.fuseau from public.projets p join public.classes c on c.id = p.classe_id where p.id = s.projet_id),
      'Europe/Paris') into v_fuseau;
    insert into public.versions_precedentes (scene_id, projet_id, enseignant_id, sorte, eleve_id, de_l_adulte, jour, texte)
    values (s.id, s.projet_id, s.enseignant_id, 'avant', null, true, (now() at time zone v_fuseau)::date, s.texte)
    on conflict do nothing;
  end if;

  update public.scenes sc set texte = v_texte, version = sc.version + 1 where sc.id = p_scene;
  insert into public.retouches_du_plan (scene_id, version, projet_id, enseignant_id, ajoute, retire)
  values (s.id, s.version + 1, s.projet_id, s.enseignant_id, v_ajoute, v_retire);
  -- Une page restée ouverte un mois sans rien enregistrer retrouve le conflit ordinaire
  delete from public.retouches_du_plan r where r.scene_id = p_scene and r.faite_le < now() - interval '30 days';
  return s.version + 1;
end
$$;

-- L'adulte, depuis « Chemins » : des choix à la fin d'une de ses scènes, ou en moins, sans
-- l'ouvrir (F03-AC52, AC53, AC56). En récit à choix seulement.
create function public.retoucher_depuis_le_plan(p_scene uuid, p_ajoute jsonb default '[]'::jsonb, p_retire uuid[] default '{}'::uuid[])
returns jsonb
language plpgsql security definer set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.scenes s join public.projets p on p.id = s.projet_id
    where s.id = p_scene and s.enseignant_id = (select auth.uid()) and p.recit = 'choix'
  ) then
    raise exception 'Cette scène n''existe plus.' using errcode = 'P0001';
  end if;
  if jsonb_typeof(coalesce(p_ajoute, '[]'::jsonb)) <> 'array' then
    raise exception 'Ces choix ne peuvent pas être ajoutés.' using errcode = 'P0001';
  end if;
  return jsonb_build_object('version', prive.retoucher_texte(p_scene, p_ajoute, p_retire));
end
$$;

-- ————————————————————————————————————————————————————————————————————————
-- L'enregistrement rejoue les retouches du plan
-- ————————————————————————————————————————————————————————————————————————

-- Le corps est celui de 20261010230000_notes_de_l_enseignant, avec ceci en plus : quand la
-- page est en retard sur la scène et que tout ce qui s'est passé depuis vient du plan, son
-- texte est gardé tel quel, les choix ajoutés se posent à sa fin, les choix retirés en
-- sortent, et la réponse les lui donne pour qu'elle les montre (F08-AC44). Un texte renvoyé
-- après une réponse perdue en route est reconnu de la même façon.
create or replace function prive.ecrire_texte(p_scene uuid, p_version integer, p_texte jsonb, p_eleve uuid, p_refus text)
returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  s public.scenes%rowtype;
  v_fuseau text;
  v_refus text := p_refus;
  v_texte jsonb := p_texte;
  v_plan record;
  v_du_plan jsonb := '{}'::jsonb;
begin
  select * into s from public.scenes sc where sc.id = p_scene for update;
  if not found then
    return jsonb_build_object('etat', 'refuse', 'motif', 'supprimee');
  end if;

  select * into v_plan from prive.retouches_depuis(s.id, p_version);
  if v_plan.nombre > 0 then
    v_texte := prive.rejouer_retouches(p_texte, v_plan.ajoute, v_plan.retire);
    v_du_plan := jsonb_build_object(
      'ajoute', (select coalesce(jsonb_agg(a.bloc order by a.n), '[]'::jsonb)
                 from jsonb_array_elements(v_plan.ajoute) with ordinality as a (bloc, n)
                 where not exists (select 1 from jsonb_array_elements(p_texte) x where lower(x ->> 'id') = lower(a.bloc ->> 'id'))),
      'retire', to_jsonb(v_plan.retire)
    );
  end if;
  if p_eleve is not null then
    v_texte := prive.remettre_les_notes(s.texte, v_texte);
  end if;

  -- Rien de neuf : rien à écrire ni à garder. C'est aussi le cas d'une réponse perdue en
  -- route, que la page renvoie : son texte est déjà celui de la scène.
  if s.texte = v_texte then
    if v_refus is not null then
      return jsonb_build_object('etat', 'refuse', 'version', s.version, 'motif', v_refus);
    end if;
    return jsonb_build_object('etat', 'enregistre', 'version', s.version) || v_du_plan;
  end if;

  -- En retard seulement de retouches du plan : ce n'est pas un conflit
  if v_refus is null and s.version <> p_version and v_plan.nombre is distinct from s.version - p_version then
    v_refus := 'conflit';
  end if;
  if v_refus is not null then
    insert into public.copies_recuperation (scene_id, projet_id, enseignant_id, sorte, eleve_id, motif, texte)
    values (s.id, s.projet_id, s.enseignant_id, 'refus', p_eleve, v_refus, p_texte);
    return jsonb_build_object('etat', 'garde', 'version', s.version, 'motif', v_refus);
  end if;

  -- Version précédente : le texte d'avant, une fois par personne et par jour, jamais vide
  if not s.texte_vide then
    select coalesce(
      (select c.fuseau from public.projets p join public.classes c on c.id = p.classe_id where p.id = s.projet_id),
      'Europe/Paris') into v_fuseau;
    insert into public.versions_precedentes (scene_id, projet_id, enseignant_id, sorte, eleve_id, de_l_adulte, jour, texte)
    values (s.id, s.projet_id, s.enseignant_id, 'avant', p_eleve, p_eleve is null, (now() at time zone v_fuseau)::date, s.texte)
    on conflict do nothing;
  end if;

  update public.scenes sc
  set texte = v_texte,
      version = sc.version + 1,
      ecrit_le = now(),
      ecrit_par = case when p_eleve is null or p_eleve = any (sc.ecrit_par) then sc.ecrit_par else sc.ecrit_par || p_eleve end
  where sc.id = p_scene;
  return jsonb_build_object('etat', 'enregistre', 'version', s.version + 1) || v_du_plan;
end
$$;

-- Ce que le serveur lit pour contrôler l'enregistrement d'un élève (corps de
-- 20261010250000_images_dans_la_scene) : aussi les retouches du plan. Le contrôle compare le
-- texte enregistré à celui que la page envoie ; un choix venu du plan, que la page n'a pas
-- encore, n'est pas un bloc préparé que l'élève aurait supprimé.
create or replace function public.ecriture_lire(p_ecriture uuid, p_jeton_hash text) returns jsonb
language sql stable security invoker set search_path = ''
as $$
  select jsonb_build_object(
    'scene', s.id, 'projet', s.projet_id, 'chapitre', s.chapitre_id, 'eleve', ec.eleve_id,
    'texte', s.texte, 'version', s.version,
    'profil', (select a.profil from public.attributions a where a.chapitre_id = s.chapitre_id and a.eleve_id = ec.eleve_id),
    'scenes_du_chapitre', (select coalesce(jsonb_agg(x.id), '[]'::jsonb) from public.scenes x where x.chapitre_id = s.chapitre_id and x.supprime_le is null),
    'images_vues', to_jsonb(s.images_vues),
    'retouches', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'version', r.version,
        'ajoute', (select coalesce(jsonb_agg(b ->> 'id'), '[]'::jsonb) from jsonb_array_elements(r.ajoute) b),
        'retire', to_jsonb(r.retire)
      ) order by r.version), '[]'::jsonb)
      from public.retouches_du_plan r where r.scene_id = s.id
    )
  )
  from public.ecritures ec
  join public.postes p on p.id = ec.poste_id
  join public.scenes s on s.id = ec.scene_id
  where ec.id = p_ecriture and p.jeton_hash = p_jeton_hash and ec.close_le is null
$$;

-- La page est-elle en retard seulement de retouches du plan ?
create function prive.en_retard_du_plan_seul(p_scene uuid, p_version integer, p_courante integer) returns boolean
language sql stable security definer set search_path = ''
as $$
  select p_courante > p_version
    and (select count(*) from public.retouches_du_plan r where r.scene_id = p_scene and r.version > p_version) = p_courante - p_version
$$;

-- « Remettre à Mme Laurent » (corps de 20261013110000_gestes_de_l_eleve) : une page en
-- retard seulement de retouches du plan remet quand même. Sans cela, l'élève qui remet juste
-- après un ajout de l'enseignant, sans avoir rien tapé depuis, verrait sa remise sans effet.
create or replace function public.eleve_remettre(p_scene uuid, p_version integer) returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  v_eleve uuid := (select prive.eleve_au_travail());
  s public.scenes%rowtype;
  v_refus text;
begin
  select * into s from public.scenes sc where sc.id = p_scene and sc.supprime_le is null for update;
  if not found or v_eleve is null then
    return jsonb_build_object('fait', false, 'motif', 'acces');
  end if;
  v_refus := prive.refus_d_ecrire(s.id, v_eleve);
  if v_refus is not null then
    return jsonb_build_object('fait', false, 'motif', v_refus);
  end if;
  if s.version is distinct from p_version and not prive.en_retard_du_plan_seul(s.id, p_version, s.version) then
    return jsonb_build_object('fait', false, 'motif', 'conflit');
  end if;
  if s.texte_vide then
    return jsonb_build_object('fait', false, 'motif', 'vide');
  end if;
  insert into public.remises (scene_id, projet_id, enseignant_id, eleve_id, texte)
  values (s.id, s.projet_id, s.enseignant_id, v_eleve, jsonb_path_query_array(s.texte, '$[*] ? (@.type != "note")'));
  update public.scenes sc
  set etat = 'valider', tour = sc.tour + 1, etat_le = now(), prise_par_eleve = v_eleve
  where sc.id = s.id;
  return jsonb_build_object('fait', true, 'avant', case when s.prise_par_eleve is distinct from v_eleve then s.prise_par_eleve end);
end
$$;

-- ————————————————————————————————————————————————————————————————————————
-- Droits
-- ————————————————————————————————————————————————————————————————————————

revoke execute on function
  prive.ligne_vide(jsonb), prive.poser_a_la_fin(jsonb, jsonb), prive.rejouer_retouches(jsonb, jsonb, uuid[]),
  prive.retouches_depuis(uuid, integer), prive.retoucher_texte(uuid, jsonb, uuid[]),
  prive.en_retard_du_plan_seul(uuid, integer, integer)
  from public, anon, authenticated, poste;
grant execute on function
  prive.ligne_vide(jsonb), prive.poser_a_la_fin(jsonb, jsonb), prive.rejouer_retouches(jsonb, jsonb, uuid[]),
  prive.retouches_depuis(uuid, integer), prive.retoucher_texte(uuid, jsonb, uuid[]),
  prive.en_retard_du_plan_seul(uuid, integer, integer)
  to service_role;
revoke execute on function public.retoucher_depuis_le_plan(uuid, jsonb, uuid[]) from public, anon, authenticated, poste;
grant execute on function public.retoucher_depuis_le_plan(uuid, jsonb, uuid[]) to authenticated, service_role;

-- Aucune règle d'accès : la table ne se lit ni ne s'écrit que par les fonctions de la base
revoke all on public.retouches_du_plan from public, anon, authenticated, poste;
grant all on public.retouches_du_plan to service_role;
alter table public.retouches_du_plan enable row level security;
