-- « Texte vide » sans les choix (F06.5, F07.1 ; décidé par le porteur le 10 novembre 2026).
--
-- En construisant le plan dans « Chemins », l'adulte pose des choix dans des scènes que
-- personne n'a encore écrites. Jusqu'ici une phrase de choix comptait comme du texte : ces
-- scènes portaient « En cours », sortaient des textes vides du Suivi et des fiches, et leur
-- suppression demandait confirmation. Une phrase de choix n'est plus du texte de la scène, au
-- même titre qu'une note ou qu'une liaison cachée : la scène qui n'a que des choix reste
-- « Texte vide », ne se remet pas et ne « contient pas de travail ». Une action de jeu et une
-- image comptent toujours.
--
-- Là où un texte est gardé pour ne rien perdre — version précédente, « Ancien texte » d'un
-- échange —, « vide » garde son sens strict : rien du tout. Une scène qui n'a que des choix y
-- est gardée, avec ses choix.

-- Rien du tout : ni mot, ni phrase de choix, ni action de jeu, ni image. C'est le sens que
-- prive.texte_est_vide avait jusqu'ici (20261010210000_ecrire_enregistrer).
create function prive.texte_sans_rien(p_texte jsonb) returns boolean
language sql immutable set search_path = ''
as $$
  select not (
    jsonb_path_exists(p_texte, '$[*] ? (@.type == "choix" || @.type == "action" || @.type == "image")')
    or jsonb_path_exists(p_texte, '$[*] ? (@.type != "note").** ? (@.text like_regex "\\S")')
    or jsonb_path_exists(p_texte, '$[*] ? (@.type != "note").** ? (@.type == "image" || @.type == "image-ligne")')
  )
$$;

-- « Texte vide » : ni mot de récit, ni action de jeu, ni image. Une note de l'enseignant
-- n'est pas du texte de la scène (F05.2) ; une phrase de choix non plus, depuis ce jour.
create or replace function prive.texte_est_vide(p_texte jsonb) returns boolean
language sql immutable set search_path = ''
as $$
  select not (
    jsonb_path_exists(p_texte, '$[*] ? (@.type == "action" || @.type == "image")')
    or jsonb_path_exists(p_texte, '$[*] ? (@.type != "note" && @.type != "choix").** ? (@.text like_regex "\\S")')
    or jsonb_path_exists(p_texte, '$[*] ? (@.type != "note" && @.type != "choix").** ? (@.type == "image" || @.type == "image-ligne")')
  )
$$;

-- ————————————————————————————————————————————————————————————————————————
-- Ce qui garde un texte le garde tant qu'il n'est pas « rien du tout »
-- ————————————————————————————————————————————————————————————————————————

-- Enregistrer (corps de 20261110100000_ajout_du_plan) : la version précédente est gardée dès
-- que le texte d'avant porte quelque chose, des choix seuls compris.
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

-- Retoucher depuis le plan (corps de 20261110100000_ajout_du_plan) : de même.
create or replace function prive.retoucher_texte(p_scene uuid, p_ajoute jsonb, p_retire uuid[]) returns integer
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
  if not prive.texte_sans_rien(s.texte) then
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

-- « Mettre ce texte dans la scène » (corps de 20261010230000_notes_de_l_enseignant) : le texte
-- remplacé devient « Ancien texte de la scène » dès qu'il porte quelque chose. Des choix posés
-- depuis le plan ne disparaissent pas dans un échange.
create or replace function public.mettre_copie_dans_scene(p_copie uuid) returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  c public.copies_recuperation%rowtype;
  s public.scenes%rowtype;
  v_texte jsonb;
begin
  select * into c from public.copies_recuperation x
  where x.id = p_copie and x.enseignant_id = (select auth.uid()) and x.retire_le is null;
  if not found then
    raise exception 'Ce texte n''est plus gardé à part.' using errcode = 'P0001';
  end if;
  select * into s from public.scenes sc where sc.id = c.scene_id for update;
  -- Relu sous le verrou de la scène : deux échanges demandés ensemble ne se croisent pas
  select * into c from public.copies_recuperation x where x.id = p_copie and x.retire_le is null for update;
  if not found then
    raise exception 'Ce texte n''est plus gardé à part.' using errcode = 'P0001';
  end if;
  v_texte := case when c.eleve_id is null then c.texte else prive.remettre_les_notes(s.texte, c.texte) end;
  update public.scenes sc set texte = v_texte, version = sc.version + 1, ecrit_le = now() where sc.id = s.id;
  if prive.texte_sans_rien(s.texte) then
    delete from public.copies_recuperation x where x.id = p_copie;
    return jsonb_build_object('version', s.version + 1, 'ancien', null);
  end if;
  update public.copies_recuperation x
  set texte = s.texte, sorte = 'ancien', eleve_id = null, motif = null, garde_le = now()
  where x.id = p_copie;
  return jsonb_build_object('version', s.version + 1, 'ancien', p_copie);
end
$$;

-- « Mettre ce texte dans la scène », depuis une version précédente (corps de
-- 20261010210000_ecrire_enregistrer) : de même.
create or replace function public.mettre_version_dans_scene(p_version uuid) returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  v public.versions_precedentes%rowtype;
  s public.scenes%rowtype;
  v_fuseau text;
begin
  select * into v from public.versions_precedentes x where x.id = p_version and x.enseignant_id = (select auth.uid());
  if not found then
    raise exception 'Cette version n''existe plus.' using errcode = 'P0001';
  end if;
  select * into s from public.scenes sc where sc.id = v.scene_id for update;
  select * into v from public.versions_precedentes x where x.id = p_version for update;
  if not found then
    raise exception 'Cette version n''existe plus.' using errcode = 'P0001';
  end if;
  update public.scenes sc set texte = v.texte, version = sc.version + 1, ecrit_le = now() where sc.id = s.id;
  if prive.texte_sans_rien(s.texte) then
    delete from public.versions_precedentes x where x.id = p_version;
    return jsonb_build_object('version', s.version + 1);
  end if;
  select coalesce(
    (select c.fuseau from public.projets p join public.classes c on c.id = p.classe_id where p.id = s.projet_id),
    'Europe/Paris') into v_fuseau;
  update public.versions_precedentes x
  set texte = s.texte, sorte = 'remplace', eleve_id = null, de_l_adulte = true,
      jour = (now() at time zone v_fuseau)::date, cree_le = now()
  where x.id = p_version;
  return jsonb_build_object('version', s.version + 1);
end
$$;

revoke execute on function prive.texte_sans_rien(jsonb) from public, anon, authenticated, poste;
grant execute on function prive.texte_sans_rien(jsonb) to service_role;

-- La colonne « texte_vide » est calculée à l'écriture : les scènes déjà en base qui n'ont que
-- des choix la retrouvent ici. Le texte n'est pas changé, ni sa version.
update public.scenes s set texte = s.texte where not s.texte_vide and prive.texte_est_vide(s.texte);
