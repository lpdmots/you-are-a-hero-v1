-- Modifier un choix depuis « Chemins » (F03.1, F03-AC70 à AC76 ; F08.1, F08-AC44).
--
-- Depuis « Chemins », l'adulte ouvre un choix et change sa phrase, ses destinations, leur ordre, ou le
-- cache derrière une énigme, sans ouvrir la scène. Les retouches du plan ne savaient que poser un
-- choix à la fin du texte, en retirer un (20261110100000_ajout_du_plan) et lui donner sa destination
-- (20261111120000_relier_depuis_le_plan). Une quatrième sorte est notée ici, la pose : le bloc entier
-- d'un choix, mis à la place de celui qui porte son identité. Elle est rejouée comme les autres sur
-- le texte d'une page en retard : celui qui écrit la scène n'est pas arrêté, et pour un même choix la
-- dernière retouche compte, y compris contre ce qu'il en a fait entre-temps dans sa copie (F03-AC75).
--
-- Deux suites de la même règle :
-- — un choix supprimé depuis « Chemins » revient à sa place par « Annuler » (F03-AC74), et non plus à
--   la fin du texte : la pose porte les voisins du bloc, pour le remettre là où il était ;
-- — « Cacher ce choix (énigme) » et l'onglet « Lien caché » passent aussi par le plan : une liaison
--   cachée s'ajoute, tout à la fin du texte, et se retire comme un choix.

-- ————————————————————————————————————————————————————————————————————————
-- La pose, notée avec les retouches du plan
-- ————————————————————————————————————————————————————————————————————————

-- Chaque pose : { "bloc": la phrase de choix entière, "apres": l'identité du bloc de récit qui la
-- précède, ou null, "avant": celle du bloc qui la suit, ou null }
alter table public.retouches_du_plan
  add column pose jsonb not null default '[]'::jsonb check (jsonb_typeof(pose) = 'array');

-- Poser des blocs à la fin d'un texte (corps de 20261110100000_ajout_du_plan), avec ceci en plus :
-- une liaison cachée qu'on pose va tout à la fin, après celles qui y sont. Les phrases de choix
-- restent à la fin du récit, avant les liaisons.
create or replace function prive.poser_a_la_fin(p_texte jsonb, p_blocs jsonb) returns jsonb
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
    select b.bloc, case when b.bloc ->> 'type' = 'liaison' then 3 else 1 end, b.n
    from jsonb_array_elements(coalesce(p_blocs, '[]'::jsonb)) with ordinality as b (bloc, n)
  )
  select coalesce(jsonb_agg(bloc order by temps, n), '[]'::jsonb) from suite
$$;

-- Poser des phrases de choix dans un texte, à leur place. Le bloc de même identité est remplacé là
-- où il est. S'il n'est plus dans le texte, la phrase se pose après le bloc qui la précédait ; à
-- défaut, avant celui qui la suivait ; à défaut, à la fin du récit. Rien d'autre ne change. La copie
-- ouverte applique la même règle (domaine/copie.ts, « ouPoser »).
create function prive.poser_dans_le_texte(p_texte jsonb, p_pose jsonb) returns jsonb
language plpgsql immutable set search_path = ''
as $$
declare
  v_texte jsonb := coalesce(p_texte, '[]'::jsonb);
  v_pose jsonb;
  v_bloc jsonb;
  v_i integer;
begin
  for v_pose in
    select e.x from jsonb_array_elements(coalesce(p_pose, '[]'::jsonb)) with ordinality as e (x, n) order by e.n
  loop
    v_bloc := v_pose -> 'bloc';
    select (b.n - 1)::integer into v_i from jsonb_array_elements(v_texte) with ordinality as b (bloc, n)
    where lower(b.bloc ->> 'id') = lower(v_bloc ->> 'id') limit 1;
    if v_i is not null then
      v_texte := jsonb_set(v_texte, array[v_i::text], v_bloc);
      continue;
    end if;
    select (b.n - 1)::integer into v_i from jsonb_array_elements(v_texte) with ordinality as b (bloc, n)
    where lower(b.bloc ->> 'id') = lower(v_pose ->> 'apres') limit 1;
    if v_i is not null then
      v_texte := jsonb_insert(v_texte, array[v_i::text], v_bloc, true);
      continue;
    end if;
    select (b.n - 1)::integer into v_i from jsonb_array_elements(v_texte) with ordinality as b (bloc, n)
    where lower(b.bloc ->> 'id') = lower(v_pose ->> 'avant') limit 1;
    if v_i is not null then
      v_texte := jsonb_insert(v_texte, array[v_i::text], v_bloc, false);
      continue;
    end if;
    v_texte := prive.poser_a_la_fin(v_texte, jsonb_build_array(v_bloc));
  end loop;
  return v_texte;
end
$$;

-- ————————————————————————————————————————————————————————————————————————
-- Ce que le plan a fait d'une scène depuis une version
-- ————————————————————————————————————————————————————————————————————————

-- Remplace prive.retouches_depuis et prive.liaisons_depuis. Pour chaque bloc, le dernier geste
-- compte : retiré, il sort du texte ; posé depuis cette version, il est rendu dans « pose », avec son
-- dernier contenu et sa place ; seulement ajouté, dans « ajoute ». Une liaison n'est gardée que si
-- aucun contenu plus récent du même choix ne l'a suivie : la pose porte déjà sa destination.
create function prive.plan_depuis(
  p_scene uuid, p_version integer,
  out nombre integer, out ajoute jsonb, out retire uuid[], out pose jsonb, out relie jsonb
)
language sql stable security definer set search_path = ''
as $$
  with r as (
    select x.version, x.ajoute, x.retire, x.pose, x.relie
    from public.retouches_du_plan x where x.scene_id = p_scene and x.version > p_version
  ), gestes as (
    select lower(b.bloc ->> 'id') as id, r.version, 'ajoute' as sorte, b.bloc, null::jsonb as place, b.n
    from r cross join lateral jsonb_array_elements(r.ajoute) with ordinality as b (bloc, n)
    union all
    select i::text, r.version, 'retire', null::jsonb, null::jsonb, 0::bigint
    from r cross join lateral unnest(r.retire) as i
    union all
    select lower(p.x -> 'bloc' ->> 'id'), r.version, 'pose', p.x -> 'bloc', p.x, p.n
    from r cross join lateral jsonb_array_elements(r.pose) with ordinality as p (x, n)
  ), dernier as (
    -- Dans une même retouche, ce qui est retiré l'est d'abord : un bloc retiré et posé ensemble est là
    select distinct on (g.id) g.id, g.version, g.sorte, g.bloc, g.n
    from gestes g order by g.id, g.version desc, (g.sorte = 'retire')
  ), places as (
    select distinct on (g.id) g.id, g.place from gestes g where g.sorte = 'pose' order by g.id, g.version desc
  ), liaisons as (
    select distinct on (lower(x ->> 'id')) lower(x ->> 'id') as id, x, r.version
    from r cross join lateral jsonb_array_elements(r.relie) as x
    order by lower(x ->> 'id'), r.version desc
  )
  select
    (select count(*)::integer from r),
    (select coalesce(jsonb_agg(d.bloc order by d.version, d.n), '[]'::jsonb)
     from dernier d where d.sorte <> 'retire' and not exists (select 1 from places p where p.id = d.id)),
    (select coalesce(array_agg(d.id::uuid), '{}'::uuid[]) from dernier d where d.sorte = 'retire'),
    (select coalesce(jsonb_agg(
       jsonb_build_object('bloc', d.bloc, 'apres', coalesce(p.place -> 'apres', 'null'::jsonb), 'avant', coalesce(p.place -> 'avant', 'null'::jsonb))
       order by d.version, d.n), '[]'::jsonb)
     from dernier d join places p on p.id = d.id where d.sorte <> 'retire'),
    (select coalesce(jsonb_agg(l.x order by l.version), '[]'::jsonb)
     from liaisons l
     where not exists (
       select 1 from gestes g
       where g.sorte <> 'retire' and g.version > l.version
         and (g.id = l.id or exists (
           select 1
           from jsonb_array_elements(case when jsonb_typeof(g.bloc -> 'children') = 'array' then g.bloc -> 'children' else '[]'::jsonb end) c
           where c ->> 'type' = 'renvoi' and lower(c ->> 'id') = l.id
         ))
     ))
$$;

-- ————————————————————————————————————————————————————————————————————————
-- Retoucher le texte d'une scène depuis le plan
-- ————————————————————————————————————————————————————————————————————————

-- Le corps est celui de 20261110140000_texte_vide_sans_les_choix, avec ceci en plus : des phrases de
-- choix se posent à leur place (« pose »), et une liaison cachée s'ajoute ou se retire comme un
-- choix. Dans l'ordre : ce qui est retiré, ce qui s'ajoute à la fin, ce qui se pose. Le récit n'est
-- jamais touché ; l'état de la scène, qui s'en occupe et qui y a écrit ne changent pas. Rend la
-- version de la scène.
create function prive.retoucher_texte(p_scene uuid, p_ajoute jsonb, p_retire uuid[], p_pose jsonb) returns integer
language plpgsql security definer set search_path = ''
as $$
declare
  s public.scenes%rowtype;
  v_ajoute jsonb;
  v_retire uuid[];
  v_pose jsonb;
  v_texte jsonb;
  v_fuseau text;
  v_uuid constant text := '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
begin
  select * into s from public.scenes sc where sc.id = p_scene and sc.supprime_le is null for update;
  if not found then
    raise exception 'Cette scène n''existe plus.' using errcode = 'P0001';
  end if;

  -- Seulement ce qui change quelque chose : un bloc déjà là ne se pose pas deux fois
  select coalesce(jsonb_agg(b.bloc order by b.n), '[]'::jsonb) into v_ajoute
  from jsonb_array_elements(coalesce(p_ajoute, '[]'::jsonb)) with ordinality as b (bloc, n)
  where b.bloc ->> 'type' in ('choix', 'liaison')
    and b.bloc ->> 'id' ~* v_uuid
    and not exists (select 1 from jsonb_array_elements(s.texte) x where lower(x ->> 'id') = lower(b.bloc ->> 'id'));
  select coalesce(array_agg(i), '{}'::uuid[]) into v_retire
  from unnest(coalesce(p_retire, '{}'::uuid[])) as i
  where exists (select 1 from jsonb_array_elements(s.texte) x where x ->> 'type' in ('choix', 'liaison') and lower(x ->> 'id') = i::text);

  -- Une pose ne remplace qu'une phrase de choix. « present » : la phrase doit encore être dans la
  -- scène — on la modifie ; sans lui, elle y revient si elle n'y est plus — « Annuler »
  if exists (
    select 1 from jsonb_array_elements(coalesce(p_pose, '[]'::jsonb)) p
    where exists (
            select 1 from jsonb_array_elements(s.texte) x
            where lower(x ->> 'id') = lower(p -> 'bloc' ->> 'id') and x ->> 'type' is distinct from 'choix')
       or (p -> 'present' = 'true'::jsonb and not exists (
            select 1 from jsonb_array_elements(s.texte) x where lower(x ->> 'id') = lower(p -> 'bloc' ->> 'id')))
  ) then
    raise exception 'Ce choix n''est plus dans la scène.' using errcode = 'P0001';
  end if;
  -- La place notée : les voisins que la phrase a dans le récit ; pour une phrase qui n'y est plus, ceux qu'on donne
  with recit as (
    select b.bloc ->> 'id' as id,
           lag(b.bloc ->> 'id') over (order by b.n) as apres,
           lead(b.bloc ->> 'id') over (order by b.n) as avant
    from jsonb_array_elements(s.texte) with ordinality as b (bloc, n)
    where b.bloc ->> 'type' is distinct from 'liaison'
  )
  select coalesce(jsonb_agg(jsonb_build_object(
      'bloc', p.x -> 'bloc',
      'apres', case when t.id is not null then coalesce(to_jsonb(lower(t.apres)), 'null'::jsonb)
                    when p.x ->> 'apres' ~* v_uuid then to_jsonb(lower(p.x ->> 'apres')) else 'null'::jsonb end,
      'avant', case when t.id is not null then coalesce(to_jsonb(lower(t.avant)), 'null'::jsonb)
                    when p.x ->> 'avant' ~* v_uuid then to_jsonb(lower(p.x ->> 'avant')) else 'null'::jsonb end
    ) order by p.n), '[]'::jsonb) into v_pose
  from jsonb_array_elements(coalesce(p_pose, '[]'::jsonb)) with ordinality as p (x, n)
  left join recit t on lower(t.id) = lower(p.x -> 'bloc' ->> 'id')
  where p.x -> 'bloc' ->> 'type' = 'choix'
    and p.x -> 'bloc' ->> 'id' ~* v_uuid
    and not exists (select 1 from jsonb_array_elements(s.texte) x where x = p.x -> 'bloc');

  if jsonb_array_length(v_ajoute) = 0 and cardinality(v_retire) = 0 and jsonb_array_length(v_pose) = 0 then
    return s.version;
  end if;
  if jsonb_array_length(s.texte) + jsonb_array_length(v_ajoute) + jsonb_array_length(v_pose) > 2000 then
    raise exception 'Cette scène est trop longue pour recevoir d''autres choix.' using errcode = 'P0001';
  end if;

  v_texte := s.texte;
  -- Une scène que personne n'a encore ouverte reçoit la ligne où écrire, au-dessus des choix :
  -- celle que la copie montre d'elle-même à l'ouverture (texteOuvert, domaine/copie.ts)
  if jsonb_array_length(v_ajoute) + jsonb_array_length(v_pose) > 0
     and not exists (select 1 from jsonb_array_elements(v_texte) x where x ->> 'type' is distinct from 'liaison') then
    v_texte := jsonb_build_array(jsonb_build_object(
      'type', 'p', 'id', '00000000' || substr(p_scene::text, 9), 'children', jsonb_build_array(jsonb_build_object('text', ''))
    )) || v_texte;
  end if;
  v_texte := prive.poser_dans_le_texte(prive.rejouer_retouches(v_texte, v_ajoute, v_retire), v_pose);
  if v_texte = s.texte then
    return s.version;
  end if;

  -- Version précédente : le texte d'avant, comme pour une correction de l'adulte (F08.2)
  if not prive.texte_sans_rien(s.texte) then
    select coalesce(
      (select c.fuseau from public.projets p join public.classes c on c.id = p.classe_id where p.id = s.projet_id),
      'Europe/Paris') into v_fuseau;
    insert into public.versions_precedentes (scene_id, projet_id, enseignant_id, sorte, eleve_id, de_l_adulte, jour, texte)
    values (s.id, s.projet_id, s.enseignant_id, 'avant', null, true, (now() at time zone v_fuseau)::date, s.texte)
    on conflict do nothing;
  end if;

  update public.scenes sc set texte = v_texte, version = sc.version + 1 where sc.id = p_scene;
  insert into public.retouches_du_plan (scene_id, version, projet_id, enseignant_id, ajoute, retire, pose)
  values (s.id, s.version + 1, s.projet_id, s.enseignant_id, v_ajoute, v_retire, v_pose);
  -- Une page restée ouverte un mois sans rien enregistrer retrouve le conflit ordinaire
  delete from public.retouches_du_plan r where r.scene_id = p_scene and r.faite_le < now() - interval '30 days';
  return s.version + 1;
end
$$;

-- Ce qui posait et retirait déjà des choix (public.ajouter_au_plan) passe par la même fonction
create or replace function prive.retoucher_texte(p_scene uuid, p_ajoute jsonb, p_retire uuid[]) returns integer
language sql security definer set search_path = ''
as $$
  select prive.retoucher_texte(p_scene, p_ajoute, p_retire, '[]'::jsonb)
$$;

-- L'adulte, depuis « Chemins » : des choix à la fin d'une de ses scènes, en moins, ou posés à leur
-- place, sans l'ouvrir (F03-AC52, AC53, AC56, AC70 à AC75). En récit à choix seulement. Remplace la
-- fonction à trois paramètres de 20261110100000_ajout_du_plan : les appels qui ne posent rien restent les mêmes.
drop function public.retoucher_depuis_le_plan(uuid, jsonb, uuid[]);
create function public.retoucher_depuis_le_plan(
  p_scene uuid, p_ajoute jsonb default '[]'::jsonb, p_retire uuid[] default '{}'::uuid[], p_pose jsonb default '[]'::jsonb
) returns jsonb
language plpgsql security definer set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.scenes s join public.projets p on p.id = s.projet_id
    where s.id = p_scene and s.enseignant_id = (select auth.uid()) and p.recit = 'choix'
  ) then
    raise exception 'Cette scène n''existe plus.' using errcode = 'P0001';
  end if;
  if jsonb_typeof(coalesce(p_ajoute, '[]'::jsonb)) <> 'array' or jsonb_typeof(coalesce(p_pose, '[]'::jsonb)) <> 'array' then
    raise exception 'Ces choix ne peuvent pas être ajoutés.' using errcode = 'P0001';
  end if;
  return jsonb_build_object('version', prive.retoucher_texte(p_scene, p_ajoute, p_retire, p_pose));
end
$$;

-- ————————————————————————————————————————————————————————————————————————
-- L'enregistrement rejoue aussi les poses
-- ————————————————————————————————————————————————————————————————————————

-- Le corps est celui de 20261111120000_relier_depuis_le_plan, avec ceci en plus : sur le texte d'une
-- page en retard seulement de retouches du plan, les phrases que le plan a posées depuis remplacent
-- celles de la page, à leur place, et la réponse les lui donne pour qu'elle les montre (F03-AC75).
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

  select * into v_plan from prive.plan_depuis(s.id, p_version);
  if v_plan.nombre > 0 then
    -- Les choix retirés et ajoutés d'abord, puis ceux qui se posent à leur place, puis les destinations
    v_texte := prive.relier_dans_le_texte(
      prive.poser_dans_le_texte(prive.rejouer_retouches(p_texte, v_plan.ajoute, v_plan.retire), v_plan.pose),
      v_plan.relie);
    v_du_plan := jsonb_build_object(
      'ajoute', (select coalesce(jsonb_agg(a.bloc order by a.n), '[]'::jsonb)
                 from jsonb_array_elements(v_plan.ajoute) with ordinality as a (bloc, n)
                 where not exists (select 1 from jsonb_array_elements(p_texte) x where lower(x ->> 'id') = lower(a.bloc ->> 'id'))),
      'retire', to_jsonb(v_plan.retire),
      'relie', v_plan.relie,
      -- Seulement les phrases que la page n'a pas déjà telles quelles
      'pose', (select coalesce(jsonb_agg(p.x order by p.n), '[]'::jsonb)
               from jsonb_array_elements(v_plan.pose) with ordinality as p (x, n)
               where not exists (select 1 from jsonb_array_elements(p_texte) x where x = p.x -> 'bloc'))
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
  if not prive.texte_sans_rien(s.texte) then
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
-- 20261111120000_relier_depuis_le_plan) : aussi les poses. Une phrase que le plan a posée, et que la
-- page envoie encore telle qu'elle l'avait, n'est pas un bloc préparé que l'élève aurait modifié.
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
        'retire', to_jsonb(r.retire),
        'relie', r.relie,
        'pose', (select coalesce(jsonb_agg(p -> 'bloc' ->> 'id'), '[]'::jsonb) from jsonb_array_elements(r.pose) p)
      ) order by r.version), '[]'::jsonb)
      from public.retouches_du_plan r where r.scene_id = s.id
    )
  )
  from public.ecritures ec
  join public.postes p on p.id = ec.poste_id
  join public.scenes s on s.id = ec.scene_id
  where ec.id = p_ecriture and p.jeton_hash = p_jeton_hash and ec.close_le is null
$$;

-- Plus rien ne les appelle : prive.plan_depuis les remplace
drop function prive.retouches_depuis(uuid, integer);
drop function prive.liaisons_depuis(uuid, integer);

-- ————————————————————————————————————————————————————————————————————————
-- Droits
-- ————————————————————————————————————————————————————————————————————————

revoke execute on function
  prive.poser_dans_le_texte(jsonb, jsonb), prive.plan_depuis(uuid, integer), prive.retoucher_texte(uuid, jsonb, uuid[], jsonb)
  from public, anon, authenticated, poste;
grant execute on function
  prive.poser_dans_le_texte(jsonb, jsonb), prive.plan_depuis(uuid, integer), prive.retoucher_texte(uuid, jsonb, uuid[], jsonb)
  to service_role;
revoke execute on function public.retoucher_depuis_le_plan(uuid, jsonb, uuid[], jsonb) from public, anon, authenticated, poste;
grant execute on function public.retoucher_depuis_le_plan(uuid, jsonb, uuid[], jsonb) to authenticated, service_role;
