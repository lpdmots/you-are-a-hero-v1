-- Étape 4 du plan, lot 3 : les scènes d'un élève retiré de la classe ou d'un chapitre.
-- Règles : F01.1 (« Retirer de la classe », F01-AC22, AC23, AC25), F06.3 (un élève retiré
-- d'un chapitre ne s'occupe plus de ses scènes).
--
-- Ce qu'il écrivait encore redevient « En cours », « Pas encore prise », avec son texte.
-- Ce qu'il a remis ou fini garde son prénom : sa scène « À valider » attend la décision de
-- l'enseignant, ses scènes « Validé » et « Prête » ne changent pas.

-- ————————————————————————————————————————————————————————————————————————
-- Un élève qui quitte un chapitre
-- ————————————————————————————————————————————————————————————————————————

-- Quand une attribution disparaît : les scènes que l'élève écrivait encore n'ont plus
-- d'élève, et sa scène « À reprendre » redevient « En cours ». Les autres gardent son
-- prénom comme repère (F01-AC22, AC25).
create or replace function prive.attributions_apres_suppression() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  update public.scenes s
  set prise_par_eleve = null,
      tour = s.tour + case when s.etat = 'reprendre' then 1 else 0 end,
      etat_le = case when s.etat = 'reprendre' then now() else s.etat_le end,
      etat = 'cours'
  where s.chapitre_id = old.chapitre_id and s.prise_par_eleve = old.eleve_id and s.etat in ('cours', 'reprendre');
  return old;
end
$$;

-- ————————————————————————————————————————————————————————————————————————
-- « Retirer de la classe », et « Annuler »
-- ————————————————————————————————————————————————————————————————————————

-- Ce que le retrait a défait, pour pouvoir l'annuler aussitôt : les chapitres de l'élève
-- et les scènes qu'il écrivait
alter table public.inscriptions add column retrait jsonb;

-- Fin de l'inscription : l'élève n'est plus au choix des prénoms et perd ses chapitres
-- dans les projets de cette classe. Son profil reste connu.
create function public.retirer_eleve(p_inscription uuid) returns void
language plpgsql security definer set search_path = ''
as $$
declare
  i record;
  v_defait jsonb;
begin
  select ins.id, ins.classe_id, ins.eleve_id
  into i
  from public.inscriptions ins
  join public.classes c on c.id = ins.classe_id
  where ins.id = p_inscription and ins.enseignant_id = (select auth.uid()) and ins.retire_le is null and c.terminee_le is null
  for update of ins;
  if not found then
    raise exception 'Cet élève n''est plus inscrit dans cette classe.' using errcode = 'P0001';
  end if;

  select jsonb_build_object(
    'attributions', coalesce((
      select jsonb_agg(jsonb_build_object('chapitre', a.chapitre_id, 'projet', a.projet_id, 'profil', a.profil))
      from public.attributions a join public.projets p on p.id = a.projet_id
      where a.eleve_id = i.eleve_id and p.classe_id = i.classe_id), '[]'::jsonb),
    'scenes', coalesce((
      select jsonb_agg(jsonb_build_object('scene', s.id, 'etat', s.etat))
      from public.scenes s join public.projets p on p.id = s.projet_id
      where s.prise_par_eleve = i.eleve_id and p.classe_id = i.classe_id and s.etat in ('cours', 'reprendre')), '[]'::jsonb)
  ) into v_defait;

  -- Le déclencheur des attributions rend ses scènes en cours (plus haut)
  delete from public.attributions a
  using public.projets p
  where p.id = a.projet_id and p.classe_id = i.classe_id and a.eleve_id = i.eleve_id;

  update public.inscriptions ins set retire_le = now(), retrait = v_defait where ins.id = i.id;
end
$$;

-- « Annuler », juste après un retrait : l'élève retrouve ses chapitres, et les scènes qu'il
-- écrivait si personne ne les a prises entre-temps. Pendant une heure au plus.
create function public.annuler_retrait(p_inscription uuid) returns void
language plpgsql security definer set search_path = ''
as $$
declare
  i record;
begin
  select ins.id, ins.eleve_id, ins.enseignant_id, ins.retrait
  into i
  from public.inscriptions ins
  join public.classes c on c.id = ins.classe_id
  where ins.id = p_inscription and ins.enseignant_id = (select auth.uid())
    and ins.retire_le is not null and ins.retire_le > now() - interval '1 hour' and c.terminee_le is null
  for update of ins;
  if not found then
    raise exception 'Ce retrait ne peut plus être annulé. Réinscrivez l''élève depuis « Inscrire des élèves ».' using errcode = 'P0001';
  end if;

  update public.inscriptions ins set retire_le = null, retrait = null where ins.id = i.id;

  insert into public.attributions (chapitre_id, eleve_id, projet_id, enseignant_id, profil)
  select (x ->> 'chapitre')::uuid, i.eleve_id, (x ->> 'projet')::uuid, i.enseignant_id, x ->> 'profil'
  from jsonb_array_elements(coalesce(i.retrait -> 'attributions', '[]'::jsonb)) x
  where exists (select 1 from public.chapitres c where c.id = (x ->> 'chapitre')::uuid and c.enseignant_id = i.enseignant_id)
  on conflict do nothing;

  update public.scenes s
  set prise_par_eleve = i.eleve_id,
      etat = x ->> 'etat',
      tour = s.tour + case when x ->> 'etat' <> s.etat then 1 else 0 end
  from jsonb_array_elements(coalesce(i.retrait -> 'scenes', '[]'::jsonb)) x
  where s.id = (x ->> 'scene')::uuid
    and s.enseignant_id = i.enseignant_id
    and s.prise_par_eleve is null and not s.prise_par_enseignant and s.etat = 'cours'
    and x ->> 'etat' in ('cours', 'reprendre')
    and exists (select 1 from public.attributions a where a.chapitre_id = s.chapitre_id and a.eleve_id = i.eleve_id);
end
$$;

-- ————————————————————————————————————————————————————————————————————————
-- L'état d'une scène dont l'élève n'est plus dans le chapitre
-- ————————————————————————————————————————————————————————————————————————

-- Comme au lot 1, avec un cas de plus : la scène « À valider » d'un élève qui a quitté le
-- chapitre. Validée, elle garde son prénom ; renvoyée — « En cours » ou « À reprendre » —,
-- elle devient « En cours », sans élève (F01-AC25). La remarque est gardée avec la remise.
create or replace function public.changer_etat(p_scene uuid, p_etat text, p_version integer, p_tour integer, p_remarque text default null)
returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  s public.scenes%rowtype;
  v_de_classe boolean;
  v_parti boolean;
  v_remise uuid;
  v_etat text := p_etat;
begin
  select * into s from public.scenes sc
  where sc.id = p_scene and sc.enseignant_id = (select auth.uid()) and sc.supprime_le is null
  for update;
  if not found then
    raise exception 'Cette scène n''existe plus.' using errcode = 'P0001';
  end if;
  if p_etat is null or p_etat not in ('cours', 'reprendre', 'valider', 'valide', 'prete') then
    raise exception 'Cet état n''existe pas.' using errcode = 'P0001';
  end if;
  if p_etat = s.etat then
    return jsonb_build_object('fait', true, 'suspendu', false, 'etat', s.etat, 'version', s.version, 'tour', s.tour);
  end if;

  select p.organisation = 'classe' into v_de_classe from public.projets p where p.id = s.projet_id;
  -- Projet personnel : l'auteur n'a personne à valider (F11-AC99)
  if not v_de_classe and p_etat not in ('cours', 'prete') then
    raise exception 'Dans un projet personnel, une scène est « En cours » ou « Prête ».' using errcode = 'P0001';
  end if;
  -- Scène sans élève : ni remise à relire, ni reprise à demander (F11-AC94)
  if v_de_classe and s.prise_par_eleve is null and p_etat in ('reprendre', 'valider') then
    raise exception 'Personne ne s''occupe de cette scène : elle est « En cours », « Validé » ou « Prête ».' using errcode = 'P0001';
  end if;

  if p_etat in ('valide', 'prete') and (s.version is distinct from p_version or s.tour is distinct from p_tour) then
    return jsonb_build_object('fait', false, 'suspendu', true, 'etat', s.etat, 'version', s.version, 'tour', s.tour);
  end if;

  -- L'élève indiqué a quitté le chapitre : plus personne pour reprendre la scène
  v_parti := s.prise_par_eleve is not null and not exists (
    select 1 from public.attributions a where a.chapitre_id = s.chapitre_id and a.eleve_id = s.prise_par_eleve
  );
  if v_parti and p_etat in ('cours', 'reprendre') then
    v_etat := 'cours';
  end if;

  update public.scenes sc
  set etat = v_etat, tour = sc.tour + 1, etat_le = now(),
      prise_par_eleve = case when v_parti and v_etat = 'cours' then null else sc.prise_par_eleve end
  where sc.id = s.id;

  -- Demander une reprise : la remarque est facultative, la demande est toujours gardée (F07.3)
  if p_etat = 'reprendre' then
    select r.id into v_remise from public.remises r where r.scene_id = s.id order by r.remis_le desc limit 1;
    insert into public.remarques (scene_id, projet_id, enseignant_id, remise_id, eleve_id, texte)
    values (s.id, s.projet_id, s.enseignant_id, v_remise, s.prise_par_eleve, left(btrim(coalesce(p_remarque, '')), 2000));
  end if;

  return jsonb_build_object('fait', true, 'suspendu', false, 'etat', v_etat, 'version', s.version, 'tour', s.tour + 1);
end
$$;

-- ————————————————————————————————————————————————————————————————————————
-- Droits
-- ————————————————————————————————————————————————————————————————————————

revoke execute on function public.retirer_eleve(uuid), public.annuler_retrait(uuid) from public, anon, poste;
grant execute on function public.retirer_eleve(uuid), public.annuler_retrait(uuid) to authenticated, service_role;
