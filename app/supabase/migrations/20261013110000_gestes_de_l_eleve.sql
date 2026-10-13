-- Étape 4 du plan, lot 2 : ce que l'élève fait de ses scènes.
-- Règles : F06.3 (prendre une scène, la rendre, la reprendre à un camarade, annuler),
-- F07.1 (remettre, retirer la remise), F07.3 (lire la remarque), F08.1 (l'élève arrêté ne
-- prend ni ne rend rien).
--
-- Un poste ne change rien directement : chaque geste passe par une fonction, qui relit
-- sous le verrou de la scène qui est l'élève, s'il est du chapitre, et où en est la scène.

-- ————————————————————————————————————————————————————————————————————————
-- Ce que les gestes laissent dans la base
-- ————————————————————————————————————————————————————————————————————————

-- « J'ai lu, j'écris » : la remarque n'est plus montrée seule à l'élève qui s'occupe de la
-- scène (F07.3, à l'essai)
alter table public.remarques add column lue_le timestamptz;

-- Le dernier geste d'un élève sur « qui s'en occupe » : de quoi l'annuler (F06-AC66).
alter table public.scenes
  -- L'élève qui a pris ou rendu la scène
  add column geste_eleve uuid references public.eleves (id) on delete set null,
  -- Qui s'en occupait avant : lui-même s'il l'a rendue, un camarade s'il la lui a reprise,
  -- personne s'il l'a prise libre
  add column geste_avant uuid references public.eleves (id) on delete set null,
  add column geste_le timestamptz;
create index scenes_geste_eleve_idx on public.scenes (geste_eleve) where geste_eleve is not null;
create index scenes_geste_avant_idx on public.scenes (geste_avant) where geste_avant is not null;

-- Dès que « qui s'en occupe » change autrement que par ce geste — l'enseignant, une
-- remise, un autre élève —, il n'y a plus rien à annuler.
create function prive.scenes_geste_perime() returns trigger
language plpgsql set search_path = ''
as $$
begin
  if (new.prise_par_eleve is distinct from old.prise_par_eleve or new.prise_par_enseignant is distinct from old.prise_par_enseignant)
     and new.geste_le is not distinct from old.geste_le then
    new.geste_eleve := null;
    new.geste_avant := null;
    new.geste_le := null;
  end if;
  return new;
end
$$;
create trigger scenes_geste_perime
  before update on public.scenes
  for each row execute function prive.scenes_geste_perime();

-- ————————————————————————————————————————————————————————————————————————
-- Prendre, rendre, annuler (F06.3)
-- ————————————————————————————————————————————————————————————————————————

-- « Je m'en occupe », sur une ou plusieurs scènes de son chapitre (F06-AC38, AC39), et
-- « M'occuper de cette scène », sur celle d'un camarade (F06-AC42). p_scenes : une liste
-- de { scene, vu }, où « vu » est l'élève que la page montrait sur la scène — personne
-- pour une scène libre. Une scène qui a changé de main entre-temps n'est pas prise : la
-- réponse la nomme, et l'élève reçoit les autres.
-- Rend { prises: [scène…], changees: [{ scene, par, enseignant, etat }…] }.
create function public.eleve_prendre(p_scenes jsonb) returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  v_eleve uuid := (select prive.eleve_au_travail());
  d jsonb;
  s public.scenes%rowtype;
  v_vu uuid;
  v_prises jsonb := '[]'::jsonb;
  v_changees jsonb := '[]'::jsonb;
begin
  if v_eleve is null or p_scenes is null or jsonb_typeof(p_scenes) <> 'array' or jsonb_array_length(p_scenes) not between 1 and 60 then
    raise exception 'Tu ne peux pas faire cela pour le moment.' using errcode = 'P0001';
  end if;
  -- Toujours dans le même ordre : deux élèves qui cochent les mêmes scènes ne se bloquent pas
  for d in select e.value from jsonb_array_elements(p_scenes) e order by e.value ->> 'scene' loop
    select * into s from public.scenes sc
    where sc.id = (d ->> 'scene')::uuid and sc.supprime_le is null
    for update;
    if not found or (select prive.profil_dans(s.chapitre_id)) is null then
      raise exception 'Cette scène n''est pas dans ton chapitre.' using errcode = 'P0001';
    end if;
    v_vu := nullif(d ->> 'vu', '')::uuid;
    if s.prise_par_eleve = v_eleve then
      continue;
    end if;
    -- La scène de l'enseignant ne se reprend pas (F06-AC62) ; une scène remise ou validée
    -- garde son élève (F06.3) ; l'élève arrêté ne prend rien (F08-AC31)
    if s.prise_par_enseignant or s.etat not in ('cours', 'reprendre') or prive.eleve_arrete(s.id, v_eleve)
       or s.prise_par_eleve is distinct from v_vu then
      v_changees := v_changees || jsonb_build_object('scene', s.id, 'par', s.prise_par_eleve, 'enseignant', s.prise_par_enseignant, 'etat', s.etat);
      continue;
    end if;
    update public.scenes sc
    set prise_par_eleve = v_eleve, geste_eleve = v_eleve, geste_avant = s.prise_par_eleve, geste_le = clock_timestamp()
    where sc.id = s.id;
    v_prises := v_prises || to_jsonb(s.id);
  end loop;
  return jsonb_build_object('prises', v_prises, 'changees', v_changees);
end
$$;

-- « Je ne m'en occupe plus » : tant que la scène s'écrit (F06-AC64, AC65). Le texte, les
-- remises et les remarques restent ; les droits du chapitre ne changent pas.
create function public.eleve_rendre(p_scene uuid) returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v_eleve uuid := (select prive.eleve_au_travail());
  s public.scenes%rowtype;
begin
  select * into s from public.scenes sc where sc.id = p_scene and sc.supprime_le is null for update;
  if not found or v_eleve is null or (select prive.profil_dans(s.chapitre_id)) is null
     or s.prise_par_eleve is distinct from v_eleve
     or s.etat not in ('cours', 'reprendre')
     or prive.eleve_arrete(s.id, v_eleve) then
    raise exception 'Tu ne peux pas rendre cette scène.' using errcode = 'P0001';
  end if;
  update public.scenes sc
  set prise_par_eleve = null, geste_eleve = v_eleve, geste_avant = v_eleve, geste_le = clock_timestamp()
  where sc.id = s.id;
end
$$;

-- « Annuler », juste après avoir pris ou rendu une scène : qui s'en occupait est rétabli
-- (F06-AC66). Seulement si rien n'a changé depuis, et pendant une demi-heure au plus : la
-- page ne le propose que tant que l'élève y reste.
create function public.eleve_annuler_geste(p_scene uuid) returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v_eleve uuid := (select prive.eleve_au_travail());
  s public.scenes%rowtype;
  v_rendue boolean;
begin
  select * into s from public.scenes sc where sc.id = p_scene and sc.supprime_le is null for update;
  if not found or v_eleve is null or (select prive.profil_dans(s.chapitre_id)) is null
     or s.geste_eleve is distinct from v_eleve
     or s.geste_le is null or s.geste_le < now() - interval '30 minutes'
     or s.prise_par_enseignant
     or s.etat not in ('cours', 'reprendre') then
    raise exception 'Cela ne peut plus être annulé.' using errcode = 'P0001';
  end if;
  v_rendue := s.geste_avant is not distinct from v_eleve;
  -- Il l'avait rendue : elle doit être restée libre. Il l'avait prise : elle doit être restée à lui.
  if (v_rendue and s.prise_par_eleve is not null) or (not v_rendue and s.prise_par_eleve is distinct from v_eleve) then
    raise exception 'Cela ne peut plus être annulé.' using errcode = 'P0001';
  end if;
  update public.scenes sc
  set prise_par_eleve = case
        when v_rendue then v_eleve
        -- Le camarade à qui il l'avait reprise, s'il est toujours du chapitre
        when exists (select 1 from public.attributions a where a.chapitre_id = s.chapitre_id and a.eleve_id = s.geste_avant) then s.geste_avant
        else null
      end,
      geste_eleve = null, geste_avant = null, geste_le = null
  where sc.id = s.id;
end
$$;

-- ————————————————————————————————————————————————————————————————————————
-- Remettre, retirer la remise (F07.1)
-- ————————————————————————————————————————————————————————————————————————

-- « Remettre à Mme Laurent ». p_version : le texte que la page vient d'enregistrer ; si ce
-- n'est plus celui de la scène, rien n'est remis (F07-AC28, AC29). Le texte remis est
-- conservé tel quel, sans les notes de l'enseignant ; la scène passe « À valider » et le
-- soumetteur s'en occupe (F07-AC07, AC10). Un texte vide ne se remet pas (F07-AC67).
-- Rend { fait, motif, avant } ; « avant » : l'élève qui s'en occupait, si ce n'était pas lui.
create function public.eleve_remettre(p_scene uuid, p_version integer) returns jsonb
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
  if s.version is distinct from p_version then
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

-- « Modifier encore mon texte » : tout élève du chapitre retire la remise tant que la
-- scène n'est pas validée (F07-AC09, AC12). La scène repasse « En cours » ; qui s'en occupe
-- ne change pas, les remises restent. L'élève arrêté n'y a pas droit (F08-AC19).
create function public.eleve_retirer_remise(p_scene uuid) returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v_eleve uuid := (select prive.eleve_au_travail());
  s public.scenes%rowtype;
begin
  select * into s from public.scenes sc where sc.id = p_scene and sc.supprime_le is null for update;
  if not found or v_eleve is null or (select prive.profil_dans(s.chapitre_id)) is null then
    raise exception 'Cette scène n''est pas dans ton chapitre.' using errcode = 'P0001';
  end if;
  if s.etat <> 'valider' or s.prise_par_enseignant or prive.eleve_arrete(s.id, v_eleve) then
    raise exception 'Ce texte ne peut plus être modifié.' using errcode = 'P0001';
  end if;
  update public.scenes sc set etat = 'cours', tour = sc.tour + 1, etat_le = now() where sc.id = s.id;
end
$$;

-- ————————————————————————————————————————————————————————————————————————
-- Ce que l'élève lit de la relecture (F07.3)
-- ————————————————————————————————————————————————————————————————————————

-- Pour un élève du chapitre : l'état de la scène, la dernière remise et la dernière
-- remarque. La remarque se lit pendant la reprise, et après la remise qui la suit ; elle
-- est lisible par tous les élèves du chapitre (F07-AC16). Rien hors de son chapitre.
create function public.relecture_du_poste(p_scene uuid) returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
declare
  v_eleve uuid := (select prive.eleve_au_travail());
  s record;
begin
  select sc.id, sc.chapitre_id, sc.etat, sc.tour, sc.prise_par_eleve
  into s from public.scenes sc where sc.id = p_scene and sc.supprime_le is null;
  if not found or v_eleve is null or (select prive.profil_dans(s.chapitre_id)) is null then
    return null;
  end if;
  return jsonb_build_object(
    'etat', s.etat,
    'tour', s.tour,
    'remise', (
      select jsonb_build_object('par', r.eleve_id, 'le', r.remis_le, 'texte', r.texte)
      from public.remises r where r.scene_id = s.id order by r.remis_le desc limit 1
    ),
    'remarque', case when s.etat in ('reprendre', 'valider') then (
      select jsonb_build_object('texte', q.texte, 'le', q.cree_le, 'lue', q.lue_le is not null)
      from public.remarques q where q.scene_id = s.id order by q.cree_le desc limit 1
    ) end
  );
end
$$;

-- L'élève du poste est-il arrêté sur cette scène ? « refus » répond d'abord « scene » pour
-- une scène remise ou validée : la page doit pourtant savoir qu'il n'y retire pas la
-- remise et n'y prend rien (F08-AC19, AC31).
create function public.suis_je_arrete(p_scene uuid) returns boolean
language sql stable security definer set search_path = ''
as $$
  select prive.eleve_arrete(p_scene, (select prive.eleve_au_travail()))
$$;

-- « J'ai lu, j'écris » : l'élève qui s'occupe de la scène a lu la remarque
create function public.eleve_lire_remarque(p_scene uuid) returns void
language sql security definer set search_path = ''
as $$
  update public.remarques q set lue_le = now()
  where q.id = (select x.id from public.remarques x where x.scene_id = p_scene order by x.cree_le desc limit 1)
    and q.lue_le is null
    and exists (
      select 1 from public.scenes s
      where s.id = p_scene and s.supprime_le is null and s.etat = 'reprendre'
        and s.prise_par_eleve = (select prive.eleve_au_travail())
        and (select prive.profil_dans(s.chapitre_id)) is not null
    )
$$;

-- ————————————————————————————————————————————————————————————————————————
-- Droits
-- ————————————————————————————————————————————————————————————————————————

revoke execute on function prive.scenes_geste_perime() from public, anon, authenticated, poste;
revoke execute on function
  public.eleve_prendre(jsonb), public.eleve_rendre(uuid), public.eleve_annuler_geste(uuid),
  public.eleve_remettre(uuid, integer), public.eleve_retirer_remise(uuid),
  public.relecture_du_poste(uuid), public.eleve_lire_remarque(uuid), public.suis_je_arrete(uuid)
  from public, anon, authenticated;
grant execute on function
  public.eleve_prendre(jsonb), public.eleve_rendre(uuid), public.eleve_annuler_geste(uuid),
  public.eleve_remettre(uuid, integer), public.eleve_retirer_remise(uuid),
  public.relecture_du_poste(uuid), public.eleve_lire_remarque(uuid), public.suis_je_arrete(uuid)
  to poste, service_role;
