-- Choix en onglets (F03.1, F03-AC67 ; F08.1, F08-AC44) : relier depuis « Chemins » un choix
-- « Sans destination », à sa place dans le texte.
--
-- L'adulte tire l'onglet du choix jusqu'à une scène du chapitre. Le choix garde sa phrase et sa
-- place dans le texte : seule sa destination change. Les retouches du plan
-- (20261110100000_ajout_du_plan) ne savaient que poser un choix à la fin du texte ou en retirer
-- un ; relier avec elles aurait fait passer le choix en dernière position, et son onglet avec, quand
-- les onglets suivent l'ordre du texte. Une troisième sorte de retouche est donc notée, la liaison,
-- et rejouée comme les deux autres sur le texte d'une page en retard : celui qui écrit la scène
-- n'est pas arrêté.

-- ————————————————————————————————————————————————————————————————————————
-- La liaison, notée avec les retouches du plan
-- ————————————————————————————————————————————————————————————————————————

-- Chaque liaison : { "id": l'identité du renvoi, "cible": la scène où il mène, ou null }
alter table public.retouches_du_plan
  add column relie jsonb not null default '[]'::jsonb check (jsonb_typeof(relie) = 'array');

-- Poser des destinations dans un texte, à leur place : le renvoi de chaque liaison — une phrase
-- automatique, ou un renvoi d'une phrase écrite à la main — prend sa destination ; rien d'autre ne
-- change, ni l'ordre des blocs. Un renvoi qui n'est plus dans le texte est ignoré ; pour un même
-- renvoi, la dernière liaison compte.
create function prive.relier_dans_le_texte(p_texte jsonb, p_relie jsonb) returns jsonb
language sql immutable set search_path = ''
as $$
  with l as (
    select distinct on (lower(r.x ->> 'id')) lower(r.x ->> 'id') as id, coalesce(r.x -> 'cible', 'null'::jsonb) as cible
    from jsonb_array_elements(coalesce(p_relie, '[]'::jsonb)) with ordinality as r (x, n)
    order by lower(r.x ->> 'id'), r.n desc
  )
  select coalesce(jsonb_agg(
    case
      when b.bloc ->> 'type' = 'choix' and b.bloc -> 'auto' = 'true'::jsonb then
        coalesce((select jsonb_set(b.bloc, '{cible}', l.cible) from l where l.id = lower(b.bloc ->> 'id')), b.bloc)
      when b.bloc ->> 'type' = 'choix' and jsonb_typeof(b.bloc -> 'children') = 'array' then
        jsonb_set(b.bloc, '{children}', (
          select coalesce(jsonb_agg(
            case when c.e ->> 'type' = 'renvoi'
              then coalesce((select jsonb_set(c.e, '{cible}', l.cible) from l where l.id = lower(c.e ->> 'id')), c.e)
              else c.e
            end order by c.k), '[]'::jsonb)
          from jsonb_array_elements(b.bloc -> 'children') with ordinality as c (e, k)
        ))
      else b.bloc
    end order by b.n), '[]'::jsonb)
  from jsonb_array_elements(coalesce(p_texte, '[]'::jsonb)) with ordinality as b (bloc, n)
$$;

-- Ce que le plan a relié dans une scène depuis une version : pour chaque renvoi, sa dernière liaison
create function prive.liaisons_depuis(p_scene uuid, p_version integer) returns jsonb
language sql stable security definer set search_path = ''
as $$
  select coalesce(jsonb_agg(d.x order by d.version), '[]'::jsonb)
  from (
    select distinct on (lower(x ->> 'id')) x, r.version
    from public.retouches_du_plan r cross join lateral jsonb_array_elements(r.relie) as x
    where r.scene_id = p_scene and r.version > p_version
    order by lower(x ->> 'id'), r.version desc
  ) d
$$;

-- ————————————————————————————————————————————————————————————————————————
-- Relier un choix depuis le plan
-- ————————————————————————————————————————————————————————————————————————

-- Donne sa destination à un choix du texte, ou la lui retire, d'un seul tenant avec la note de la
-- retouche. Le récit n'est jamais touché ; l'état de la scène, qui s'en occupe et qui y a écrit ne
-- changent pas. Rend la version de la scène.
create function prive.relier_texte(p_scene uuid, p_renvoi uuid, p_cible uuid) returns integer
language plpgsql security definer set search_path = ''
as $$
declare
  s public.scenes%rowtype;
  v_relie jsonb;
  v_texte jsonb;
  v_fuseau text;
begin
  select * into s from public.scenes sc where sc.id = p_scene and sc.supprime_le is null for update;
  if not found then
    raise exception 'Cette scène n''existe plus.' using errcode = 'P0001';
  end if;
  -- Un lien caché se règle dans la scène, où se lit son énigme (F03.1)
  if not exists (select 1 from prive.renvois_du_texte(s.texte) r where r.renvoi_id = p_renvoi and not r.cache) then
    raise exception 'Ce choix n''est plus dans la scène.' using errcode = 'P0001';
  end if;
  v_relie := jsonb_build_array(jsonb_build_object('id', p_renvoi, 'cible', p_cible));
  v_texte := prive.relier_dans_le_texte(s.texte, v_relie);
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
  insert into public.retouches_du_plan (scene_id, version, projet_id, enseignant_id, relie)
  values (s.id, s.version + 1, s.projet_id, s.enseignant_id, v_relie);
  -- Une page restée ouverte un mois sans rien enregistrer retrouve le conflit ordinaire
  delete from public.retouches_du_plan r where r.scene_id = p_scene and r.faite_le < now() - interval '30 days';
  return s.version + 1;
end
$$;

-- L'adulte, depuis « Chemins » : il tire l'onglet d'un choix « Sans destination » jusqu'à une scène
-- du chapitre (F03-AC67). Sans destination donnée, le choix redevient sans destination : c'est
-- « Annuler ». En récit à choix seulement.
create function public.relier_depuis_le_plan(p_scene uuid, p_renvoi uuid, p_cible uuid default null) returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  v_chapitre uuid;
begin
  select s.chapitre_id into v_chapitre
  from public.scenes s join public.projets p on p.id = s.projet_id
  where s.id = p_scene and s.enseignant_id = (select auth.uid()) and p.recit = 'choix';
  if not found then
    raise exception 'Cette scène n''existe plus.' using errcode = 'P0001';
  end if;
  if p_cible is not null then
    -- Le schéma ne relie qu'à une scène de son chapitre, et qu'un choix qui n'a pas encore de destination
    if not exists (select 1 from public.scenes c where c.id = p_cible and c.chapitre_id = v_chapitre and c.supprime_le is null) then
      raise exception 'Cette scène n''est plus dans le chapitre.' using errcode = 'P0001';
    end if;
    if exists (
      select 1 from public.scenes s cross join lateral prive.renvois_du_texte(s.texte) r
      where s.id = p_scene and r.renvoi_id = p_renvoi and r.cible is not null
    ) then
      raise exception 'Ce choix a déjà une destination : ouvrez la scène pour la changer.' using errcode = 'P0001';
    end if;
  end if;
  return jsonb_build_object('version', prive.relier_texte(p_scene, p_renvoi, p_cible));
end
$$;

-- ————————————————————————————————————————————————————————————————————————
-- L'enregistrement rejoue aussi les liaisons
-- ————————————————————————————————————————————————————————————————————————

-- Le corps est celui de 20261110140000_texte_vide_sans_les_choix, avec ceci en plus : sur le texte
-- d'une page en retard seulement de retouches du plan, les destinations que le plan a posées
-- depuis se posent aussi, à leur place, et la réponse les lui donne pour qu'elle les montre.
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
  v_relie jsonb;
  v_du_plan jsonb := '{}'::jsonb;
begin
  select * into s from public.scenes sc where sc.id = p_scene for update;
  if not found then
    return jsonb_build_object('etat', 'refuse', 'motif', 'supprimee');
  end if;

  select * into v_plan from prive.retouches_depuis(s.id, p_version);
  if v_plan.nombre > 0 then
    -- Les choix posés et retirés d'abord, puis les destinations : un choix posé puis relié arrive relié
    v_relie := prive.liaisons_depuis(s.id, p_version);
    v_texte := prive.relier_dans_le_texte(prive.rejouer_retouches(p_texte, v_plan.ajoute, v_plan.retire), v_relie);
    v_du_plan := jsonb_build_object(
      'ajoute', (select coalesce(jsonb_agg(a.bloc order by a.n), '[]'::jsonb)
                 from jsonb_array_elements(v_plan.ajoute) with ordinality as a (bloc, n)
                 where not exists (select 1 from jsonb_array_elements(p_texte) x where lower(x ->> 'id') = lower(a.bloc ->> 'id'))),
      'retire', to_jsonb(v_plan.retire),
      'relie', v_relie
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
-- 20261110100000_ajout_du_plan) : aussi les liaisons. Un choix que le plan a relié, et que la page
-- envoie encore sans destination, n'est pas un bloc préparé que l'élève aurait modifié.
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
        'relie', r.relie
      ) order by r.version), '[]'::jsonb)
      from public.retouches_du_plan r where r.scene_id = s.id
    )
  )
  from public.ecritures ec
  join public.postes p on p.id = ec.poste_id
  join public.scenes s on s.id = ec.scene_id
  where ec.id = p_ecriture and p.jeton_hash = p_jeton_hash and ec.close_le is null
$$;

-- ————————————————————————————————————————————————————————————————————————
-- Droits
-- ————————————————————————————————————————————————————————————————————————

revoke execute on function
  prive.relier_dans_le_texte(jsonb, jsonb), prive.liaisons_depuis(uuid, integer), prive.relier_texte(uuid, uuid, uuid)
  from public, anon, authenticated, poste;
grant execute on function
  prive.relier_dans_le_texte(jsonb, jsonb), prive.liaisons_depuis(uuid, integer), prive.relier_texte(uuid, uuid, uuid)
  to service_role;
revoke execute on function public.relier_depuis_le_plan(uuid, uuid, uuid) from public, anon, authenticated, poste;
grant execute on function public.relier_depuis_le_plan(uuid, uuid, uuid) to authenticated, service_role;
