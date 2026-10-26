-- Bibliothèque publique des livres (F15), lot 6 : « Lire », côté élève.
--
-- 1. Fin d'année : « Lire » reste ouvert (F15-AC16, F01-AC18 révisé). Une classe terminée garde,
--    pour ses élèves, l'accès à « Lire » et à lui seul, jusqu'à ce que l'enseignant la supprime :
--    l'élève s'identifie comme avant et lit les livres partagés « À mes classes », sans rien
--    pouvoir écrire. Le travail reste gardé par `prive.classe_du_poste()`, inchangée, qui exige une
--    année en cours : rien de ce qui écrit ne s'ouvre. Ce qui se lit (la classe, son enseignant, ses
--    élèves, les livres proposés) passe par de nouvelles fonctions « lisibles », qui admettent une
--    classe terminée et refusent une classe supprimée.
--
-- 2. La bibliothèque dans « Lire » (F15-AC20) : après les livres de l'enseignant, ceux de la
--    bibliothèque de l'âge de la classe — l'âge des lecteurs de son projet le plus récent, « 8 à 10
--    ans » sans projet —, jamais un livre « Adultes ». L'enseignant l'éteint dans les réglages de la
--    classe ; allumée par défaut. Un élève identifié donne un cœur par livre pour son profil (le
--    poste partagé d'une classe ne retient pas un seul cœur pour vingt-cinq élèves), et sa lecture
--    est retenue par profil, comme les autres.

-- ——— Ce qui se lit depuis un poste, classe terminée comprise ———

create function prive.classe_lisible_du_poste() returns uuid
language sql stable security definer set search_path = ''
as $$
  select p.classe_id
  from public.postes p
  join public.classes c on c.id = p.classe_id
  where p.id = (select auth.uid())
    and p.ferme_le is null
    and p.expire_le > now()
    and c.supprimee_le is null
    and p.version_acces = c.version_acces
$$;

create function prive.inscription_lisible_du_poste() returns uuid
language sql stable security definer set search_path = ''
as $$
  select i.id
  from public.postes p
  join public.classes c on c.id = p.classe_id
  join public.inscriptions i on i.id = p.inscription_id and i.classe_id = p.classe_id
  where p.id = (select auth.uid())
    and p.ferme_le is null
    and p.expire_le > now()
    and c.supprimee_le is null
    and p.version_acces = c.version_acces
    and i.retire_le is null
    and p.actif_le > now() - interval '2 hours'
$$;

create function prive.enseignant_lisible_du_poste() returns uuid
language sql stable security definer set search_path = ''
as $$
  select c.enseignant_id from public.classes c where c.id = (select prive.classe_lisible_du_poste())
$$;

-- L'élève du poste, pour ses lectures : classe terminée comprise
create or replace function prive.eleve_du_poste() returns uuid
language sql stable security definer set search_path = ''
as $$
  select i.eleve_id from public.inscriptions i where i.id = (select prive.inscription_lisible_du_poste())
$$;

revoke all on function prive.classe_lisible_du_poste() from public, anon, authenticated;
revoke all on function prive.inscription_lisible_du_poste() from public, anon, authenticated;
revoke all on function prive.enseignant_lisible_du_poste() from public, anon, authenticated;
-- Les règles d'accès du poste les appellent : il les exécute, comme `classe_du_poste`
grant execute on function prive.classe_lisible_du_poste(), prive.inscription_lisible_du_poste(), prive.enseignant_lisible_du_poste() to poste, service_role;

-- Le poste lit le nom de sa classe, de son enseignant et de ses élèves, et ses horaires, classe terminée comprise
drop policy poste_lit_son_enseignant on public.enseignants;
create policy poste_lit_son_enseignant on public.enseignants
  for select to poste using (id = (select prive.enseignant_lisible_du_poste()));
drop policy poste_lit_sa_classe on public.classes;
create policy poste_lit_sa_classe on public.classes
  for select to poste using (id = (select prive.classe_lisible_du_poste()));
drop policy poste_lit_ses_horaires on public.horaires;
create policy poste_lit_ses_horaires on public.horaires
  for select to poste using (classe_id = (select prive.classe_lisible_du_poste()));
drop policy poste_lit_les_eleves_de_sa_classe on public.eleves;
create policy poste_lit_les_eleves_de_sa_classe on public.eleves
  for select to poste using (
    exists (
      select 1 from public.inscriptions i
      where i.eleve_id = eleves.id
        and i.classe_id = (select prive.classe_lisible_du_poste())
        and i.retire_le is null
    )
  );
drop policy poste_lit_les_inscriptions_de_sa_classe on public.inscriptions;
create policy poste_lit_les_inscriptions_de_sa_classe on public.inscriptions
  for select to poste
  using (classe_id = (select prive.classe_lisible_du_poste()) and retire_le is null);
drop policy poste_lit_sa_ligne on public.postes;
create policy poste_lit_sa_ligne on public.postes
  for select to poste
  using (id = (select auth.uid()) and classe_id = (select prive.classe_lisible_du_poste()));

-- Ouvrir la classe sur un poste : une classe terminée s'ouvre aussi, pour « Lire » ; une classe supprimée, jamais
create or replace function public.ouvrir_poste(p_classe uuid, p_jeton_hash text) returns uuid
language plpgsql security invoker set search_path = ''
as $$
declare
  v_poste uuid;
begin
  delete from public.postes
  where coalesce(ferme_le, expire_le) < now() - interval '7 days';

  insert into public.postes (classe_id, version_acces, jeton_hash, expire_le)
  select c.id, c.version_acces, p_jeton_hash, prive.fermeture_nocturne(now(), c.fuseau)
  from public.classes c
  where c.id = p_classe and c.supprimee_le is null
  returning id into v_poste;
  return v_poste;
end
$$;

-- L'état d'un poste dit aussi si l'année de sa classe est terminée : l'application n'y ouvre que « Lire »
drop function public.etat_poste(text);
create function public.etat_poste(p_jeton_hash text)
returns table (poste_id uuid, classe_id uuid, inscription_id uuid, eleve_id uuid, terminee boolean)
language plpgsql security invoker set search_path = ''
as $$
begin
  update public.postes p
  set inscription_id = null, identifie_le = null, actif_le = null
  where p.jeton_hash = p_jeton_hash
    and p.inscription_id is not null
    and (
      p.actif_le is null
      or p.actif_le < now() - interval '2 hours'
      or not exists (
        select 1 from public.inscriptions i where i.id = p.inscription_id and i.retire_le is null
      )
    );

  return query
  select p.id, p.classe_id, p.inscription_id, i.eleve_id, c.terminee_le is not null
  from public.postes p
  join public.classes c on c.id = p.classe_id
  left join public.inscriptions i on i.id = p.inscription_id
  where p.jeton_hash = p_jeton_hash
    and p.ferme_le is null
    and p.expire_le > now()
    and c.supprimee_le is null
    and p.version_acces = c.version_acces;
end
$$;
revoke all on function public.etat_poste(text) from public, anon, authenticated, poste;
grant execute on function public.etat_poste(text) to service_role;

-- Les livres de l'enseignant, lus par les classes : classe terminée comprise
create or replace function prive.livre_ouvert_au_poste(p_projet uuid) returns boolean
language sql stable security definer set search_path = ''
as $$
  select (select prive.eleve_du_poste()) is not null and exists (
    select 1
    from public.partages pa
    where pa.projet_id = p_projet
      and pa.aux_classes
      and pa.version is not null
      and pa.enseignant_id = (select prive.enseignant_lisible_du_poste())
  )
$$;

create or replace function public.livres_du_poste()
returns table (projet_id uuid, titre text, a_choix boolean, ligne text, de_ma_classe boolean, passages integer, chapitres integer, image uuid, partage_le timestamptz)
language sql stable security definer set search_path = ''
as $$
  select pa.projet_id,
         pa.version ->> 'titre',
         coalesce((pa.version ->> 'aChoix')::boolean, false),
         nullif(pa.version -> 'presentation' -> 'titre' ->> 'ligne', ''),
         p.classe_id is not distinct from (select prive.classe_lisible_du_poste()),
         jsonb_array_length(pa.version -> 'passages'),
         (select count(*)::integer from jsonb_array_elements(pa.version -> 'passages') x where jsonb_typeof(x -> 'chapitre') = 'object'),
         coalesce(pa.version -> 'presentation' -> 'titre' ->> 'image', pa.version -> 'presentation' -> 'titre' ->> 'illustration')::uuid,
         pa.etat_du
  from public.partages pa
  join public.projets p on p.id = pa.projet_id
  where (select prive.eleve_du_poste()) is not null
    and pa.aux_classes
    and pa.version is not null
    and pa.enseignant_id = (select prive.enseignant_lisible_du_poste())
  order by p.classe_id is not distinct from (select prive.classe_lisible_du_poste()) desc, pa.etat_du desc
$$;

-- ——— La bibliothèque dans « Lire » ———

alter table public.classes add column bibliotheque_dans_lire boolean not null default true;
grant update (bibliotheque_dans_lire) on public.classes to authenticated;
grant select (bibliotheque_dans_lire) on public.classes to poste;

-- L'âge de la classe : celui des lecteurs de son projet le plus récent ; « 8 à 10 ans » sans projet
create function prive.age_de_la_classe(p_classe uuid) returns text
language sql stable security definer set search_path = ''
as $$
  select coalesce((select p.age_des_lecteurs from public.projets p where p.classe_id = p_classe order by p.cree_le desc limit 1), '8-10')
$$;
revoke all on function prive.age_de_la_classe(uuid) from public, anon, authenticated;

-- Un livre de la bibliothèque est-il lisible depuis ce poste ? Réglage allumé, âge de la classe, jamais « Adultes »
create function prive.publication_du_poste(p_adresse text) returns uuid
language sql stable security definer set search_path = ''
as $$
  select pu.projet_id
  from public.publications pu
  join public.classes c on c.id = (select prive.classe_lisible_du_poste())
  where pu.adresse = p_adresse
    and pu.version is not null
    and (select prive.eleve_du_poste()) is not null
    and c.bibliotheque_dans_lire
    and pu.age <> 'adultes'
    and pu.age = (select prive.age_de_la_classe(c.id))
$$;
revoke all on function prive.publication_du_poste(text) from public, anon, authenticated;

-- Les livres de la bibliothèque proposés à l'élève, les plus récents d'abord, sans ceux que son
-- enseignant lui propose déjà ; le cœur de son profil
create function public.bibliotheque_du_poste()
returns table (adresse text, titre text, a_choix boolean, page jsonb, images jsonb, dernier integer, presentation text, age text, coeurs integer, donne boolean, publiee_le timestamptz)
language sql stable security definer set search_path = ''
as $$
  select pu.adresse,
         pu.version ->> 'titre',
         coalesce((pu.version ->> 'aChoix')::boolean, false),
         pu.version -> 'presentation' -> 'titre',
         pu.version -> 'images',
         (pu.version -> 'passages' -> -1 ->> 'numero')::integer,
         pu.presentation,
         pu.age,
         pu.coeurs,
         exists (select 1 from public.coeurs co where co.projet_id = pu.projet_id and co.lecteur = 'e:' || (select prive.eleve_du_poste())::text),
         pu.publiee_le
  from public.publications pu
  join public.classes c on c.id = (select prive.classe_lisible_du_poste())
  where pu.version is not null
    and (select prive.eleve_du_poste()) is not null
    and c.bibliotheque_dans_lire
    and pu.age <> 'adultes'
    and pu.age = (select prive.age_de_la_classe(c.id))
    and not exists (
      select 1 from public.partages pa
      where pa.projet_id = pu.projet_id and pa.aux_classes and pa.version is not null
        and pa.enseignant_id = (select prive.enseignant_lisible_du_poste())
    )
  order by pu.publiee_le desc
$$;

-- Un livre de la bibliothèque : sa version, la lecture que l'élève y a laissée, ses cœurs
create function public.livre_de_la_bibliotheque_du_poste(p_adresse text) returns jsonb
language sql stable security definer set search_path = ''
as $$
  select jsonb_build_object(
    'version', pu.version,
    'projet', pu.projet_id,
    'coeurs', pu.coeurs,
    'donne', exists (select 1 from public.coeurs co where co.projet_id = pu.projet_id and co.lecteur = 'e:' || (select prive.eleve_du_poste())::text),
    'lecture', (select l.lecture from public.lectures_en_cours l where l.projet_id = pu.projet_id and l.eleve_id = (select prive.eleve_du_poste()))
  )
  from public.publications pu
  where pu.projet_id = (select prive.publication_du_poste(p_adresse))
$$;

-- Garder la lecture de l'élève dans un livre de la bibliothèque, pour son profil
create function public.garder_lecture_bibliotheque_du_poste(p_adresse text, p_lecture jsonb) returns boolean
language plpgsql security definer set search_path = ''
as $$
declare
  v_eleve uuid := (select prive.eleve_du_poste());
  v_projet uuid := (select prive.publication_du_poste(p_adresse));
begin
  if v_eleve is null or v_projet is null then
    return false;
  end if;
  insert into public.lectures_en_cours (eleve_id, projet_id, lecture, modifie_le)
  values (v_eleve, v_projet, p_lecture, now())
  on conflict (eleve_id, projet_id) do update set lecture = excluded.lecture, modifie_le = now();
  return true;
end
$$;

-- Le cœur d'un élève identifié, pour son profil ; sans limite réseau, sa classe l'identifie déjà
create function public.coeur_du_poste(p_adresse text, p_oui boolean) returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  v_eleve uuid := (select prive.eleve_du_poste());
  v_projet uuid := (select prive.publication_du_poste(p_adresse));
  v_lecteur text;
begin
  if v_eleve is null or v_projet is null then
    return jsonb_build_object('etat', 'absent');
  end if;
  v_lecteur := 'e:' || v_eleve::text;
  if p_oui then
    insert into public.coeurs (projet_id, lecteur) values (v_projet, v_lecteur) on conflict do nothing;
  else
    delete from public.coeurs where projet_id = v_projet and lecteur = v_lecteur;
  end if;
  return jsonb_build_object(
    'etat', 'fait',
    'coeurs', (select coeurs from public.publications where projet_id = v_projet),
    'donne', exists (select 1 from public.coeurs where projet_id = v_projet and lecteur = v_lecteur)
  );
end
$$;

revoke all on function public.bibliotheque_du_poste() from public, anon, authenticated;
revoke all on function public.livre_de_la_bibliotheque_du_poste(text) from public, anon, authenticated;
revoke all on function public.garder_lecture_bibliotheque_du_poste(text, jsonb) from public, anon, authenticated;
revoke all on function public.coeur_du_poste(text, boolean) from public, anon, authenticated;
grant execute on function public.bibliotheque_du_poste() to poste, service_role;
grant execute on function public.livre_de_la_bibliotheque_du_poste(text) to poste, service_role;
grant execute on function public.garder_lecture_bibliotheque_du_poste(text, jsonb) to poste, service_role;
grant execute on function public.coeur_du_poste(text, boolean) to poste, service_role;
