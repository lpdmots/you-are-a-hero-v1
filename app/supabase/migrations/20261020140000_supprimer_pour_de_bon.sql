-- Étape 9, lot 7 : supprimer pour de bon (F14, « Supprimer pour de bon », F14-AC26 à AC29).
--
-- Rien ne s'efface seul, sauf le compte inactif. L'adulte peut vider la corbeille d'un projet
-- ou en supprimer un élément ; supprimer une classe passée ; supprimer son compte (côté
-- serveur, avec les images du stockage). Un compte où personne ne s'est connecté depuis cinq ans
-- reçoit un avis ; sans connexion dans les trente jours, il est supprimé.

-- ————————————————————————————————————————————————————————————————————————
-- La corbeille (F14-AC28)
-- ————————————————————————————————————————————————————————————————————————

-- Supprimer pour de bon un élément de la corbeille, avec ce qu'il contient : une partie emporte
-- ses chapitres et leurs scènes, un chapitre ses scènes. Seul ce qui est à la corbeille se
-- supprime ainsi. Le départ du livre ou l'ouverture d'une partie qui y menait s'oublient.
-- L'adulte n'a pas le droit d'effacer une ligne du récit : la fonction le fait pour lui, après
-- avoir vérifié que l'élément est à lui.
create function public.supprimer_pour_de_bon(p_sorte text, p_id uuid) returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v_scenes uuid[];
  v_lignes integer;
  v_a_lui boolean;
begin
  v_a_lui := case p_sorte
    when 'partie' then exists (select 1 from public.parties x where x.id = p_id and x.enseignant_id = (select auth.uid()))
    when 'chapitre' then exists (select 1 from public.chapitres x where x.id = p_id and x.enseignant_id = (select auth.uid()))
    when 'scene' then exists (select 1 from public.scenes x where x.id = p_id and x.enseignant_id = (select auth.uid()))
    else false end;
  if not v_a_lui then
    raise exception 'Cet élément n''est pas dans la corbeille.' using errcode = 'P0001';
  end if;
  if p_sorte = 'partie' then
    select coalesce(array_agg(s.id), '{}') into v_scenes from public.scenes s join public.chapitres c on c.id = s.chapitre_id
    where c.partie_id = p_id and exists (select 1 from public.parties pa where pa.id = p_id and pa.supprime_le is not null);
  elsif p_sorte = 'chapitre' then
    select coalesce(array_agg(s.id), '{}') into v_scenes from public.scenes s
    where s.chapitre_id = p_id and exists (select 1 from public.chapitres c where c.id = p_id and c.supprime_le is not null);
  elsif p_sorte = 'scene' then
    select coalesce(array_agg(s.id), '{}') into v_scenes from public.scenes s where s.id = p_id and s.supprime_le is not null;
  else
    raise exception 'Élément inconnu.' using errcode = 'P0001';
  end if;

  update public.projets set depart_scene_id = null where depart_scene_id = any (v_scenes);
  update public.parties set ouverture_scene_id = null where ouverture_scene_id = any (v_scenes);

  if p_sorte = 'partie' then
    delete from public.parties where id = p_id and supprime_le is not null;
  elsif p_sorte = 'chapitre' then
    delete from public.chapitres where id = p_id and supprime_le is not null;
  else
    delete from public.scenes where id = p_id and supprime_le is not null;
  end if;
  get diagnostics v_lignes = row_count;
  if v_lignes = 0 then
    raise exception 'Cet élément n''est pas dans la corbeille.' using errcode = 'P0001';
  end if;
end
$$;

-- Vider la corbeille d'un projet : tout ce qui y est, parties d'abord
create function public.vider_la_corbeille(p_projet uuid) returns integer
language plpgsql security invoker set search_path = ''
as $$
declare
  v_element record;
  v_nombre integer := 0;
begin
  -- Les lignes lues ici le sont avec les droits de l'adulte : celles d'un autre n'y sont pas
  for v_element in
    select 'partie' as sorte, pa.id from public.parties pa where pa.projet_id = p_projet and pa.supprime_le is not null
  loop
    perform public.supprimer_pour_de_bon(v_element.sorte, v_element.id);
    v_nombre := v_nombre + 1;
  end loop;
  for v_element in
    select 'chapitre' as sorte, c.id from public.chapitres c where c.projet_id = p_projet and c.supprime_le is not null
  loop
    perform public.supprimer_pour_de_bon(v_element.sorte, v_element.id);
    v_nombre := v_nombre + 1;
  end loop;
  for v_element in
    select 'scene' as sorte, s.id from public.scenes s where s.projet_id = p_projet and s.supprime_le is not null
  loop
    perform public.supprimer_pour_de_bon(v_element.sorte, v_element.id);
    v_nombre := v_nombre + 1;
  end loop;
  return v_nombre;
end
$$;

revoke execute on function public.supprimer_pour_de_bon(text, uuid) from public, anon;
grant execute on function public.supprimer_pour_de_bon(text, uuid), public.vider_la_corbeille(uuid) to authenticated;

-- ————————————————————————————————————————————————————————————————————————
-- Une classe passée (F14-AC27)
-- ————————————————————————————————————————————————————————————————————————

-- La classe effacée reste une ligne sans rien, tant qu'un projet s'y rattache : ses projets
-- gardent leur classe, leurs attributions et leurs scènes, le livre ne change pas. Elle ne se
-- montre plus nulle part.
alter table public.classes add column supprimee_le timestamptz;

-- Supprimer une classe terminée : les codes des élèves, leurs inscriptions, leurs attributions,
-- leurs tampons et leurs lectures sont effacés ; un élève qui n'a pas d'autre classe ne garde que son prénom, qui
-- signe ses textes. Le mot de passe, les horaires et les postes de la classe aussi. Une classe
-- en cours ne se supprime pas ainsi.
create function public.supprimer_la_classe(p_classe uuid) returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v_eleves uuid[];
begin
  if not exists (
    select 1 from public.classes c
    where c.id = p_classe and c.enseignant_id = (select auth.uid()) and c.terminee_le is not null and c.supprimee_le is null
  ) then
    raise exception 'Seule une classe passée se supprime.' using errcode = 'P0001';
  end if;
  select coalesce(array_agg(distinct i.eleve_id), '{}') into v_eleves from public.inscriptions i where i.classe_id = p_classe;

  delete from public.postes where classe_id = p_classe;
  delete from public.horaires where classe_id = p_classe;
  delete from public.classes_secrets where classe_id = p_classe;
  delete from public.encouragements e where e.eleve_id = any (v_eleves)
    and e.projet_id in (select p.id from public.projets p where p.classe_id = p_classe);
  delete from public.lectures_en_cours l where l.eleve_id = any (v_eleves)
    and l.projet_id in (select p.id from public.projets p where p.classe_id = p_classe);
  delete from public.inscriptions where classe_id = p_classe;
  -- Ils quittent leurs chapitres, comme un élève retiré : ce qu'ils écrivaient encore n'a plus
  -- d'élève, ce qu'ils ont remis ou fini garde leur prénom (F01-AC22)
  delete from public.attributions a where a.eleve_id = any (v_eleves)
    and a.projet_id in (select p.id from public.projets p where p.classe_id = p_classe);

  -- Un élève sans autre classe chez cet enseignant : le prénom seul, ni nom ni code
  delete from public.eleves_secrets s where s.eleve_id = any (v_eleves)
    and not exists (select 1 from public.inscriptions i where i.eleve_id = s.eleve_id);
  update public.eleves e set nom = null where e.id = any (v_eleves)
    and not exists (select 1 from public.inscriptions i where i.eleve_id = e.id);

  update public.classes set supprimee_le = now() where id = p_classe;
end
$$;
revoke execute on function public.supprimer_la_classe(uuid) from public, anon;
grant execute on function public.supprimer_la_classe(uuid) to authenticated;

-- ————————————————————————————————————————————————————————————————————————
-- Les comptes inactifs (F14-AC29)
-- ————————————————————————————————————————————————————————————————————————

-- Le dernier passage de l'adulte dans l'application, noté une fois par jour au plus : une
-- session restée ouverte des mois ne se reconnecte pas, mais elle est active
alter table public.enseignants add column vu_le timestamptz;

-- La dernière activité d'un compte : connexion, passage, ou à défaut l'inscription
create function prive.derniere_activite(p_connexion timestamptz, p_vu timestamptz, p_inscription timestamptz) returns timestamptz
language sql immutable set search_path = ''
as $$ select greatest(coalesce(p_connexion, p_inscription), coalesce(p_vu, p_inscription), p_inscription) $$;

-- L'avis envoyé à un compte inactif ; une connexion après lui l'annule
create table public.avis_d_inactivite (
  enseignant_id uuid primary key references public.enseignants (id) on delete cascade,
  envoye_le timestamptz not null default now()
);
alter table public.avis_d_inactivite enable row level security;
grant all on public.avis_d_inactivite to service_role;

-- Les comptes à prévenir (cinq ans sans connexion, sans avis) et ceux à supprimer (avis de plus
-- de trente jours, sans connexion depuis). La dernière connexion, ou l'inscription pour qui ne
-- s'est jamais connecté. Jamais le compte du porteur. Les lectures des livres partagés ne
-- comptent pas : seule la connexion de l'adulte compte.
create function public.comptes_inactifs(p_annees integer default 5, p_jours integer default 30)
returns table (id uuid, courriel text, a_prevenir boolean, a_supprimer boolean, reconnecte boolean)
language sql stable security definer set search_path = ''
as $$
  select u.id, u.email::text,
    a.enseignant_id is null and prive.derniere_activite(u.last_sign_in_at, e.vu_le, u.created_at) < now() - make_interval(years => p_annees),
    a.envoye_le < now() - make_interval(days => p_jours) and prive.derniere_activite(u.last_sign_in_at, e.vu_le, u.created_at) < a.envoye_le,
    a.enseignant_id is not null and prive.derniere_activite(u.last_sign_in_at, e.vu_le, u.created_at) >= a.envoye_le
  from auth.users u
  join public.enseignants e on e.id = u.id and not e.createur
  left join public.avis_d_inactivite a on a.enseignant_id = u.id
  where prive.derniere_activite(u.last_sign_in_at, e.vu_le, u.created_at) < now() - make_interval(years => p_annees)
     or a.enseignant_id is not null
$$;
revoke execute on function public.comptes_inactifs(integer, integer) from public, anon, authenticated;
grant execute on function public.comptes_inactifs(integer, integer) to service_role;

-- L'administration dit la dernière activité, connexion ou passage (révise le lot 6)
create or replace function public.comptes_pour_l_administration()
returns table (
  id uuid, courriel text, inscrit_le timestamptz, connecte_le timestamptz, confirme boolean,
  etoiles integer, createur boolean, projets integer, pass integer
)
language sql stable security definer set search_path = ''
as $$
  select u.id, u.email::text, u.created_at,
         case when u.last_sign_in_at is null and e.vu_le is null then null else prive.derniere_activite(u.last_sign_in_at, e.vu_le, u.created_at) end,
         u.email_confirmed_at is not null,
         e.etoiles, e.createur,
         (select count(*)::integer from public.projets p where p.enseignant_id = u.id),
         (select count(*)::integer from public.passes pa where pa.enseignant_id = u.id)
  from auth.users u
  join public.enseignants e on e.id = u.id
  order by u.created_at desc
$$;
