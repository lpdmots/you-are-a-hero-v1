-- Étape 2, suite : l'enseignant dit qui s'occupe d'une scène dès la préparation (F06.3).
--
-- Une scène a au plus un élève de référence, ou l'enseignant lui-même : pas de liste de
-- coresponsables. La prise en charge d'un élève est informative ; celle de l'enseignant
-- est exclusive (F06-AC62), ce que l'écriture fera respecter à l'étape 3. Ce que les
-- élèves font eux-mêmes — prendre une scène, la rendre, la reprendre à un camarade —
-- se construit à l'étape 4, sur ces mêmes colonnes.

alter table public.scenes
  -- L'élève qui s'occupe de la scène ; il doit être attribué à son chapitre
  add column prise_par_eleve uuid references public.eleves (id) on delete set null,
  -- L'enseignant s'en occupe lui-même : un élève ne peut ni y écrire ni la reprendre
  add column prise_par_enseignant boolean not null default false,
  add constraint scenes_une_seule_prise check (not (prise_par_enseignant and prise_par_eleve is not null));
create index scenes_prise_idx on public.scenes (prise_par_eleve);

-- L'élève désigné est un élève du chapitre (F06.3) ; un projet personnel n'a personne à désigner
create function prive.scenes_prise_avant_ecriture() returns trigger
language plpgsql set search_path = ''
as $$
begin
  if new.prise_par_eleve is not null
     and (tg_op = 'INSERT' or new.prise_par_eleve is distinct from old.prise_par_eleve)
     and not exists (
       select 1 from public.attributions a
       where a.chapitre_id = new.chapitre_id and a.eleve_id = new.prise_par_eleve
     ) then
    raise exception 'Cet élève n''est pas attribué au chapitre de cette scène.' using errcode = 'P0001';
  end if;
  if new.prise_par_enseignant
     and (tg_op = 'INSERT' or not old.prise_par_enseignant)
     and not exists (select 1 from public.projets p where p.id = new.projet_id and p.organisation = 'classe') then
    raise exception 'Dans un projet personnel, toutes les scènes sont les vôtres.' using errcode = 'P0001';
  end if;
  return new;
end
$$;
create trigger scenes_prise_avant_ecriture
  before insert or update on public.scenes
  for each row execute function prive.scenes_prise_avant_ecriture();

-- Un élève retiré d'un chapitre ne s'occupe plus de ses scènes : elles redeviennent
-- « Pas encore prise », avec tout ce qu'elles contiennent.
create function prive.attributions_apres_suppression() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  update public.scenes set prise_par_eleve = null
  where chapitre_id = old.chapitre_id and prise_par_eleve = old.eleve_id;
  return old;
end
$$;
create trigger attributions_apres_suppression
  after delete on public.attributions
  for each row execute function prive.attributions_apres_suppression();

-- Profil « écriture et organisation » : supprimer une scène qu'il a créée, tant qu'elle
-- ne contient pas de travail et que personne d'autre ne s'en occupe (F06.1)
create or replace function public.eleve_supprimer_scene(p_scene uuid) returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v_chapitre uuid;
  v_createur uuid;
  v_eleve uuid;
  v_enseignant boolean;
begin
  select s.chapitre_id, s.cree_par_eleve, s.prise_par_eleve, s.prise_par_enseignant
  into v_chapitre, v_createur, v_eleve, v_enseignant
  from public.scenes s where s.id = p_scene and s.supprime_le is null;
  if v_chapitre is null
     or (select prive.profil_dans(v_chapitre)) is distinct from 'organisation'
     or v_createur is distinct from (select prive.eleve_au_travail())
     or v_enseignant
     or (v_eleve is not null and v_eleve is distinct from (select prive.eleve_au_travail()))
     or (select prive.scene_contient_du_travail(p_scene)) then
    raise exception 'Tu ne peux pas supprimer cette scène.' using errcode = 'P0001';
  end if;
  update public.scenes set supprime_le = now() where id = p_scene;
end
$$;

revoke execute on function prive.scenes_prise_avant_ecriture(), prive.attributions_apres_suppression() from public, anon, authenticated, poste;

-- L'adulte désigne et retire ; le poste lit qui s'en occupe, dans les scènes qu'il lit déjà
grant update (prise_par_eleve, prise_par_enseignant) on public.scenes to authenticated;
grant select (prise_par_eleve, prise_par_enseignant) on public.scenes to poste;
