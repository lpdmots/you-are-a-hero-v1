-- Étape 1 du plan : compte de l'adulte, projets, classes, élèves, accès de classe.
-- Règles : F01, F01.1, F06.4 et F06.5 (barre du haut, dernier projet ouvert).
--
-- Trois sortes d'accès parlent à cette base :
--   * authenticated : un adulte connecté par Supabase Auth ; il ne voit que ses lignes ;
--   * poste         : un ordinateur où une classe est ouverte ; le jeton est signé par
--                     l'application, ne quitte pas son serveur, et vaut pour le poste dont
--                     l'identifiant est son « sub » ; les règles relisent ce poste à
--                     chaque requête ;
--   * service_role  : le serveur de l'application, pour ouvrir une classe sur un poste et
--                     vérifier un code, avant qu'aucun jeton n'existe.

create schema if not exists prive;

create role poste nologin noinherit;
grant poste to authenticator;

-- ————————————————————————————————————————————————————————————————————————
-- Tables
-- ————————————————————————————————————————————————————————————————————————

create table public.enseignants (
  id uuid primary key references auth.users (id) on delete cascade,
  -- Nom sous lequel les élèves voient l'adulte (F01-AC13) ; vide : « ton enseignant(e) »
  nom_affiche text check (char_length(btrim(nom_affiche)) between 1 and 60),
  dernier_projet_id uuid,
  -- Écrans d'aide que l'adulte ne veut plus voir à l'ouverture (« Ne plus afficher »)
  aides_masquees text[] not null default '{}',
  cree_le timestamptz not null default now()
);

create table public.classes (
  id uuid primary key default gen_random_uuid(),
  enseignant_id uuid not null references public.enseignants (id) on delete cascade,
  nom text not null check (char_length(btrim(nom)) between 1 and 60),
  -- 2026 pour l'année scolaire 2026-2027
  annee_debut smallint not null check (annee_debut between 2000 and 2100),
  -- Année terminée (F01-AC18) : rien n'est supprimé, l'accès de classe ne s'ouvre plus
  terminee_le timestamptz,
  identifiant text not null unique check (identifiant ~ '^[a-z0-9]{3,30}$'),
  -- Tenu par la classe sans être affiché (F06.4, heure de référence)
  fuseau text not null default 'Europe/Paris',
  horaires_limites boolean not null default false,
  -- Change quand le mot de passe est remplacé ou l'année terminée : les postes ouverts
  -- avec une version antérieure sont fermés (F06-AC77, F06-AC78)
  version_acces integer not null default 1,
  cree_le timestamptz not null default now(),
  unique (id, enseignant_id)
);
create index classes_enseignant_idx on public.classes (enseignant_id);

-- Mot de passe de la classe, chiffré par l'application (clé hors de la base)
create table public.classes_secrets (
  classe_id uuid primary key,
  enseignant_id uuid not null,
  mot_de_passe_chiffre text not null,
  foreign key (classe_id, enseignant_id) references public.classes (id, enseignant_id) on delete cascade
);

create table public.horaires (
  id uuid primary key default gen_random_uuid(),
  classe_id uuid not null,
  enseignant_id uuid not null,
  -- 1 = lundi … 7 = dimanche
  jours smallint[] not null check (cardinality(jours) > 0 and jours <@ array[1, 2, 3, 4, 5, 6, 7]::smallint[]),
  de time not null,
  a time not null,
  rang smallint not null default 0,
  check (de < a),
  foreign key (classe_id, enseignant_id) references public.classes (id, enseignant_id) on delete cascade
);
create index horaires_classe_idx on public.horaires (classe_id);

-- Profil élève : commun aux inscriptions successives d'un élève chez un enseignant
create table public.eleves (
  id uuid primary key default gen_random_uuid(),
  enseignant_id uuid not null references public.enseignants (id) on delete cascade,
  prenom text not null check (char_length(btrim(prenom)) between 1 and 40),
  nom text check (char_length(btrim(nom)) between 1 and 60),
  -- Rang de la gommette dans la palette du design
  couleur smallint not null default 0 check (couleur between 0 and 9),
  cree_le timestamptz not null default now(),
  unique (id, enseignant_id)
);
create index eleves_enseignant_idx on public.eleves (enseignant_id);

-- Code personnel chiffré et essais faux (F06-AC73)
create table public.eleves_secrets (
  eleve_id uuid primary key,
  enseignant_id uuid not null,
  code_chiffre text not null,
  essais_faux smallint not null default 0,
  bloque_jusqua timestamptz,
  foreign key (eleve_id, enseignant_id) references public.eleves (id, enseignant_id) on delete cascade
);

create table public.inscriptions (
  id uuid primary key default gen_random_uuid(),
  classe_id uuid not null,
  eleve_id uuid not null,
  enseignant_id uuid not null,
  inscrit_le timestamptz not null default now(),
  -- « Retirer de la classe » : fin de l'inscription, le profil et les textes restent
  retire_le timestamptz,
  unique (classe_id, eleve_id),
  foreign key (classe_id, enseignant_id) references public.classes (id, enseignant_id) on delete cascade,
  foreign key (eleve_id, enseignant_id) references public.eleves (id, enseignant_id) on delete cascade
);
create index inscriptions_eleve_idx on public.inscriptions (eleve_id);
create index inscriptions_enseignant_idx on public.inscriptions (enseignant_id);

create table public.projets (
  id uuid primary key default gen_random_uuid(),
  enseignant_id uuid not null references public.enseignants (id) on delete cascade,
  -- Les deux modes, fixes après la création (F01-AC04)
  organisation text not null check (organisation in ('classe', 'personnel')),
  recit text not null check (recit in ('choix', 'classique')),
  titre text not null check (char_length(btrim(titre)) between 1 and 120),
  classe_id uuid,
  dernier_onglet text not null default 'preparation'
    check (dernier_onglet in ('preparation', 'plan', 'suivi', 'livre')),
  cree_le timestamptz not null default now(),
  -- Un projet personnel n'a pas de classe (F01-AC16)
  check (organisation = 'classe' or classe_id is null),
  foreign key (classe_id, enseignant_id) references public.classes (id, enseignant_id)
);
create index projets_enseignant_idx on public.projets (enseignant_id);
create index projets_classe_idx on public.projets (classe_id);

alter table public.enseignants
  add constraint enseignants_dernier_projet_fk
  foreign key (dernier_projet_id) references public.projets (id) on delete set null;
create index enseignants_dernier_projet_idx on public.enseignants (dernier_projet_id);

-- Classe ouverte sur un ordinateur (accès de classe), puis élève identifié
create table public.postes (
  id uuid primary key default gen_random_uuid(),
  classe_id uuid not null references public.classes (id) on delete cascade,
  version_acces integer not null,
  -- Empreinte du jeton gardé dans le cookie du poste ; le jeton n'est pas stocké
  jeton_hash text not null unique,
  ouvert_le timestamptz not null default now(),
  -- Fermeture nocturne, à 3 h, heure de la classe (F06-AC75, F06-AC82)
  expire_le timestamptz not null,
  ferme_le timestamptz,
  inscription_id uuid references public.inscriptions (id) on delete set null,
  identifie_le timestamptz,
  -- Dernière activité de l'élève : deux heures sans activité terminent son accès (F06-AC76)
  actif_le timestamptz
);
create index postes_classe_idx on public.postes (classe_id);
create index postes_inscription_idx on public.postes (inscription_id);

-- Essais faux à l'entrée de la classe, par navigateur et par adresse réseau
-- (F06-AC74, F06-AC83). La clé est une empreinte, jamais l'adresse elle-même.
create table public.essais_entree (
  cle text primary key,
  essais integer not null default 0,
  debut timestamptz not null default now(),
  bloque_jusqua timestamptz
);

-- ————————————————————————————————————————————————————————————————————————
-- Fonctions internes (schéma non exposé à l'API)
-- ————————————————————————————————————————————————————————————————————————

-- Classe du poste qui interroge, si son accès tient encore
create function prive.classe_du_poste() returns uuid
language sql stable security definer set search_path = ''
as $$
  select p.classe_id
  from public.postes p
  join public.classes c on c.id = p.classe_id
  where p.id = (select auth.uid())
    and p.ferme_le is null
    and p.expire_le > now()
    and c.terminee_le is null
    and p.version_acces = c.version_acces
$$;

-- Inscription de l'élève identifié sur le poste qui interroge
create function prive.inscription_du_poste() returns uuid
language sql stable security definer set search_path = ''
as $$
  select i.id
  from public.postes p
  join public.classes c on c.id = p.classe_id
  join public.inscriptions i on i.id = p.inscription_id and i.classe_id = p.classe_id
  where p.id = (select auth.uid())
    and p.ferme_le is null
    and p.expire_le > now()
    and c.terminee_le is null
    and p.version_acces = c.version_acces
    and i.retire_le is null
    and p.actif_le > now() - interval '2 hours'
$$;

create function prive.enseignant_du_poste() returns uuid
language sql stable security definer set search_path = ''
as $$
  select c.enseignant_id from public.classes c where c.id = (select prive.classe_du_poste())
$$;

-- La classe appartient-elle à l'adulte qui interroge, et son année est-elle en cours ?
create function prive.classe_en_cours(p_classe uuid) returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.classes c
    where c.id = p_classe and c.enseignant_id = (select auth.uid()) and c.terminee_le is null
  )
$$;

-- Horaires : la classe est-elle ouverte au travail à cet instant ? (F06-AC27, AC72, AC80)
-- Sans limite d'horaire, toujours. L'heure se lit au fuseau de la classe, qui suit
-- seul l'heure d'été et l'heure d'hiver.
create function prive.horaires_ouverts(p_classe uuid, p_instant timestamptz) returns boolean
language sql stable security definer set search_path = ''
as $$
  select case
    when not c.horaires_limites then true
    else exists (
      select 1 from public.horaires h
      where h.classe_id = c.id
        and extract(isodow from (p_instant at time zone c.fuseau))::smallint = any (h.jours)
        and (p_instant at time zone c.fuseau)::time >= h.de
        and (p_instant at time zone c.fuseau)::time < h.a
    )
  end
  from public.classes c
  where c.id = p_classe
$$;

-- Prochaine fermeture nocturne : 3 h, à l'heure du fuseau (F06-AC82)
create function prive.fermeture_nocturne(p_instant timestamptz, p_fuseau text) returns timestamptz
language sql stable set search_path = ''
as $$
  select ((((p_instant at time zone p_fuseau) - interval '3 hours')::date + 1) + time '03:00') at time zone p_fuseau
$$;

-- Une ligne « enseignants » pour chaque compte créé
create function prive.creer_enseignant() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.enseignants (id) values (new.id) on conflict (id) do nothing;
  return new;
end
$$;
create trigger enseignant_a_la_creation
  after insert on auth.users
  for each row execute function prive.creer_enseignant();
-- Les comptes créés avant cette migration reçoivent leur ligne eux aussi
insert into public.enseignants (id) select u.id from auth.users u on conflict (id) do nothing;

-- Classes : ce qui ne change pas, classe terminée en lecture, postes fermés à la fin d'année
create function prive.classes_avant_maj() returns trigger
language plpgsql set search_path = ''
as $$
begin
  if new.enseignant_id <> old.enseignant_id or new.fuseau <> old.fuseau then
    raise exception 'Cette information de la classe ne se change pas.' using errcode = 'P0001';
  end if;
  if old.terminee_le is not null and new.terminee_le is not null
     and (new.nom, new.annee_debut, new.identifiant, new.horaires_limites, new.version_acces)
         is distinct from
         (old.nom, old.annee_debut, old.identifiant, old.horaires_limites, old.version_acces) then
    raise exception 'L''année de cette classe est terminée : rouvrez-la pour la modifier.' using errcode = 'P0001';
  end if;
  if old.terminee_le is null and new.terminee_le is not null then
    new.version_acces := old.version_acces + 1;
  end if;
  return new;
end
$$;
create trigger classes_avant_maj
  before update on public.classes
  for each row execute function prive.classes_avant_maj();

-- Une classe ne se supprime que sans élève ni projet (F01.1) ; les autres se terminent
create function prive.classes_avant_suppression() returns trigger
language plpgsql set search_path = ''
as $$
begin
  if exists (select 1 from public.inscriptions i where i.classe_id = old.id and i.retire_le is null)
     or exists (select 1 from public.projets p where p.classe_id = old.id) then
    raise exception 'Une classe qui a des élèves ou un projet ne se supprime pas.' using errcode = 'P0001';
  end if;
  return old;
end
$$;
create trigger classes_avant_suppression
  before delete on public.classes
  for each row execute function prive.classes_avant_suppression();

-- Mot de passe remplacé : les postes où la classe est ouverte se ferment (F06-AC77)
create function prive.mot_de_passe_remplace() returns trigger
language plpgsql set search_path = ''
as $$
begin
  if new.mot_de_passe_chiffre is distinct from old.mot_de_passe_chiffre then
    update public.classes set version_acces = version_acces + 1 where id = new.classe_id;
  end if;
  return new;
end
$$;
create trigger mot_de_passe_remplace
  after update on public.classes_secrets
  for each row execute function prive.mot_de_passe_remplace();

-- Projets : modes fixes (F01-AC04), classe en cours seulement (F01.1)
create function prive.projets_avant_ecriture() returns trigger
language plpgsql set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' then
    if new.organisation <> old.organisation or new.recit <> old.recit then
      raise exception 'L''organisation et le type de récit d''un projet ne se changent pas.' using errcode = 'P0001';
    end if;
    if new.enseignant_id <> old.enseignant_id then
      raise exception 'Un projet garde son enseignant responsable.' using errcode = 'P0001';
    end if;
  end if;
  if new.classe_id is not null
     and (tg_op = 'INSERT' or new.classe_id is distinct from old.classe_id)
     and not exists (select 1 from public.classes c where c.id = new.classe_id and c.terminee_le is null) then
    raise exception 'Une classe dont l''année est terminée ne reçoit pas de projet.' using errcode = 'P0001';
  end if;
  return new;
end
$$;
create trigger projets_avant_ecriture
  before insert or update on public.projets
  for each row execute function prive.projets_avant_ecriture();

-- ————————————————————————————————————————————————————————————————————————
-- Fonctions de l'adulte (exécutées avec ses droits : les règles d'accès s'appliquent)
-- ————————————————————————————————————————————————————————————————————————

-- Créer une classe et son mot de passe d'un seul tenant
create function public.creer_classe(
  p_id uuid, p_nom text, p_annee_debut integer, p_identifiant text, p_mot_de_passe_chiffre text
) returns uuid
language plpgsql security invoker set search_path = ''
as $$
declare
  v_enseignant uuid := (select auth.uid());
begin
  insert into public.classes (id, enseignant_id, nom, annee_debut, identifiant)
  values (p_id, v_enseignant, btrim(p_nom), p_annee_debut, p_identifiant);
  insert into public.classes_secrets (classe_id, enseignant_id, mot_de_passe_chiffre)
  values (p_id, v_enseignant, p_mot_de_passe_chiffre);
  return p_id;
end
$$;

-- Inscription en lot (F01-AC10) : réinscrit des profils connus, crée les nouveaux
-- profils avec leur code, d'un seul tenant. p_nouveaux : tableau de
-- { id, prenom, nom, couleur, code_chiffre }.
create function public.inscrire_eleves(p_classe uuid, p_connus uuid[], p_nouveaux jsonb) returns integer
language plpgsql security invoker set search_path = ''
as $$
declare
  v_enseignant uuid := (select auth.uid());
  v_nombre integer := 0;
  v_lignes integer;
  v_eleve jsonb;
begin
  if not (select prive.classe_en_cours(p_classe)) then
    raise exception 'Cette classe n''existe pas, ou son année est terminée.' using errcode = 'P0001';
  end if;

  insert into public.inscriptions (classe_id, eleve_id, enseignant_id)
  select p_classe, e.id, v_enseignant
  from public.eleves e
  where e.id = any (coalesce(p_connus, '{}')) and e.enseignant_id = v_enseignant
  on conflict (classe_id, eleve_id) do update
    set retire_le = null, inscrit_le = now()
    where public.inscriptions.retire_le is not null;
  get diagnostics v_lignes = row_count;
  v_nombre := v_nombre + v_lignes;

  for v_eleve in select * from jsonb_array_elements(coalesce(p_nouveaux, '[]'::jsonb)) loop
    insert into public.eleves (id, enseignant_id, prenom, nom, couleur)
    values (
      (v_eleve ->> 'id')::uuid, v_enseignant, btrim(v_eleve ->> 'prenom'),
      nullif(btrim(coalesce(v_eleve ->> 'nom', '')), ''), coalesce((v_eleve ->> 'couleur')::smallint, 0)
    );
    insert into public.eleves_secrets (eleve_id, enseignant_id, code_chiffre)
    values ((v_eleve ->> 'id')::uuid, v_enseignant, v_eleve ->> 'code_chiffre');
    insert into public.inscriptions (classe_id, eleve_id, enseignant_id)
    values (p_classe, (v_eleve ->> 'id')::uuid, v_enseignant);
    v_nombre := v_nombre + 1;
  end loop;

  return v_nombre;
end
$$;

-- Horaires d'une classe, remplacés d'un seul tenant (F06-AC72)
-- p_plages : tableau de { jours: [1,2,4,5], de: "08:30", a: "16:30" }.
create function public.regler_horaires(p_classe uuid, p_limites boolean, p_plages jsonb) returns void
language plpgsql security invoker set search_path = ''
as $$
declare
  v_enseignant uuid := (select auth.uid());
begin
  if not (select prive.classe_en_cours(p_classe)) then
    raise exception 'Cette classe n''existe pas, ou son année est terminée.' using errcode = 'P0001';
  end if;
  if p_limites and jsonb_array_length(coalesce(p_plages, '[]'::jsonb)) = 0 then
    raise exception 'Des horaires limités demandent au moins une plage.' using errcode = 'P0001';
  end if;
  delete from public.horaires where classe_id = p_classe;
  insert into public.horaires (classe_id, enseignant_id, jours, de, a, rang)
  select p_classe, v_enseignant,
         array(select jsonb_array_elements_text(plage -> 'jours')::smallint),
         (plage ->> 'de')::time, (plage ->> 'a')::time, (rang - 1)::smallint
  from jsonb_array_elements(coalesce(p_plages, '[]'::jsonb)) with ordinality as t (plage, rang);
  update public.classes set horaires_limites = p_limites where id = p_classe;
end
$$;

-- ————————————————————————————————————————————————————————————————————————
-- Fonctions du serveur de l'application (service_role seulement)
-- ————————————————————————————————————————————————————————————————————————

-- Attente en cours à l'entrée de la classe, pour ce navigateur ou cette adresse réseau
create function public.entree_bloquee_jusqua(p_navigateur text, p_reseau text) returns timestamptz
language sql stable security invoker set search_path = ''
as $$
  select max(e.bloque_jusqua)
  from public.essais_entree e
  where e.cle in (p_navigateur, p_reseau) and e.bloque_jusqua > now()
$$;

-- Un essai à l'entrée de la classe, compté avant que le mot de passe ne soit comparé :
-- des demandes simultanées ne passent pas à côté du compte. Renvoie l'heure jusqu'à
-- laquelle attendre si l'essai est refusé, rien s'il peut être comparé.
-- Dix essais faux de suite depuis un navigateur : cinq minutes d'attente (F06-AC74).
-- Cent en cinq minutes depuis une adresse réseau : cinq minutes (F06-AC83).
-- L'attente ne s'allonge pas d'une fois sur l'autre.
create function public.prendre_essai_entree(p_navigateur text, p_reseau text) returns timestamptz
language plpgsql security invoker set search_path = ''
as $$
declare
  v_attente timestamptz;
begin
  delete from public.essais_entree e
  where e.debut < now() - interval '1 day' and (e.bloque_jusqua is null or e.bloque_jusqua < now());

  insert into public.essais_entree (cle) values (p_navigateur), (p_reseau) on conflict (cle) do nothing;
  -- Les deux lignes sont verrouillées, toujours dans le même ordre
  perform 1 from public.essais_entree e where e.cle in (p_navigateur, p_reseau) order by e.cle for update;

  select max(e.bloque_jusqua) into v_attente
  from public.essais_entree e
  where e.cle in (p_navigateur, p_reseau) and e.bloque_jusqua > now();
  if v_attente is not null then
    return v_attente;
  end if;

  update public.essais_entree e set
    essais = case when e.essais + 1 >= 10 then 0 else e.essais + 1 end,
    bloque_jusqua = case when e.essais + 1 >= 10 then now() + interval '5 minutes' else null end
  where e.cle = p_navigateur;

  update public.essais_entree e set
    essais = case
      when e.debut < now() - interval '5 minutes' then 1
      when e.essais + 1 >= 100 then 0
      else e.essais + 1 end,
    debut = case when e.debut < now() - interval '5 minutes' or e.essais + 1 >= 100 then now() else e.debut end,
    bloque_jusqua = case
      when e.debut >= now() - interval '5 minutes' and e.essais + 1 >= 100 then now() + interval '5 minutes'
      else null end
  where e.cle = p_reseau;

  return null;
end
$$;

-- Les bonnes informations : le compte du navigateur repart de zéro, et cet essai n'est
-- plus compté parmi les essais faux de l'adresse réseau
create function public.noter_entree_juste(p_navigateur text, p_reseau text) returns void
language plpgsql security invoker set search_path = ''
as $$
begin
  delete from public.essais_entree where cle = p_navigateur;
  update public.essais_entree set essais = greatest(essais - 1, 0) where cle = p_reseau;
end
$$;

-- Ouvrir la classe sur un poste : l'accès tient jusqu'à 3 h, heure de la classe
create function public.ouvrir_poste(p_classe uuid, p_jeton_hash text) returns uuid
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
  where c.id = p_classe and c.terminee_le is null
  returning id into v_poste;
  return v_poste;
end
$$;

-- État d'un poste d'après son jeton. Termine d'abord l'accès de l'élève resté deux
-- heures sans activité, ou retiré de la classe (F06-AC76, F06-AC78). Ne renvoie rien
-- si l'accès de classe ne tient plus.
create function public.etat_poste(p_jeton_hash text)
returns table (poste_id uuid, classe_id uuid, inscription_id uuid, eleve_id uuid)
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
  select p.id, p.classe_id, p.inscription_id, i.eleve_id
  from public.postes p
  join public.classes c on c.id = p.classe_id
  left join public.inscriptions i on i.id = p.inscription_id
  where p.jeton_hash = p_jeton_hash
    and p.ferme_le is null
    and p.expire_le > now()
    and c.terminee_le is null
    and p.version_acces = c.version_acces;
end
$$;

-- Un essai de code, compté avant que le code ne soit comparé : des demandes simultanées
-- ne passent pas à côté du compte. « autorise » dit si l'essai peut être comparé ;
-- « attente_jusqua », l'heure jusqu'à laquelle ce profil attend.
-- Cinq codes faux de suite pour un même élève : deux minutes d'attente pour ce profil
-- seulement, sans allongement (F06-AC73). Le bon code remet le compte à zéro.
create function public.prendre_essai_code(p_eleve uuid)
returns table (autorise boolean, attente_jusqua timestamptz)
language plpgsql security invoker set search_path = ''
as $$
declare
  v_essais smallint;
  v_bloque timestamptz;
begin
  select s.essais_faux, s.bloque_jusqua into v_essais, v_bloque
  from public.eleves_secrets s
  where s.eleve_id = p_eleve
  for update;
  if not found then
    return;
  end if;

  if v_bloque > now() then
    return query select false, v_bloque;
    return;
  end if;

  if v_essais + 1 >= 5 then
    v_bloque := now() + interval '2 minutes';
    update public.eleves_secrets s set essais_faux = 0, bloque_jusqua = v_bloque where s.eleve_id = p_eleve;
    return query select true, v_bloque;
  else
    update public.eleves_secrets s set essais_faux = v_essais + 1, bloque_jusqua = null where s.eleve_id = p_eleve;
    return query select true, null::timestamptz;
  end if;
end
$$;

-- Le bon code : l'élève est identifié sur ce poste, son compte d'essais repart de zéro
create function public.identifier_eleve(p_poste uuid, p_inscription uuid) returns boolean
language plpgsql security invoker set search_path = ''
as $$
declare
  v_eleve uuid;
begin
  update public.postes p
  set inscription_id = i.id, identifie_le = now(), actif_le = now()
  from public.inscriptions i
  where p.id = p_poste and i.id = p_inscription and i.classe_id = p.classe_id and i.retire_le is null
  returning i.eleve_id into v_eleve;
  if v_eleve is null then
    return false;
  end if;
  update public.eleves_secrets set essais_faux = 0, bloque_jusqua = null where eleve_id = v_eleve;
  return true;
end
$$;

-- « Changer d'élève » : l'accès individuel se termine, la classe reste ouverte (F06-AC15)
create function public.changer_eleve(p_poste uuid) returns void
language sql security invoker set search_path = ''
as $$
  update public.postes set inscription_id = null, identifie_le = null, actif_le = null where id = p_poste
$$;

-- « Quitter la classe » : plus aucun accès sur ce poste (F06-AC44)
create function public.quitter_classe(p_poste uuid) returns void
language sql security invoker set search_path = ''
as $$
  update public.postes
  set ferme_le = now(), inscription_id = null, identifie_le = null, actif_le = null
  where id = p_poste
$$;

-- L'élève a fait quelque chose sur son poste
create function public.noter_activite(p_poste uuid) returns void
language sql security invoker set search_path = ''
as $$
  update public.postes set actif_le = now() where id = p_poste and inscription_id is not null
$$;

-- Lecture pour un poste : la classe est-elle ouverte au travail, là, maintenant ?
create function public.travail_ouvert() returns boolean
language sql stable security invoker set search_path = ''
as $$
  select coalesce(prive.horaires_ouverts((select prive.classe_du_poste()), now()), false)
$$;

-- ————————————————————————————————————————————————————————————————————————
-- Droits : rien par défaut, puis ce que chaque accès peut faire
-- ————————————————————————————————————————————————————————————————————————

alter default privileges in schema public revoke all on tables from anon, authenticated;
alter default privileges in schema public revoke execute on functions from anon, authenticated;
-- PostgreSQL donne par défaut à tous le droit d'exécuter une fonction neuve, et ce droit
-- ne se retire pas schéma par schéma : il est retiré pour toutes les fonctions à venir.
-- Chaque migration donne ensuite ses droits un à un.
alter default privileges revoke execute on functions from public;
revoke all on all tables in schema public from public, anon, authenticated, poste;
revoke execute on all functions in schema public from public, anon, authenticated, poste;
revoke execute on all functions in schema prive from public, anon, authenticated, poste;

grant usage on schema public to poste;
grant usage on schema prive to authenticated, poste, service_role;
grant execute on function
  prive.classe_du_poste(), prive.inscription_du_poste(), prive.enseignant_du_poste(),
  prive.horaires_ouverts(uuid, timestamptz)
  to poste, service_role;
grant execute on function prive.classe_en_cours(uuid) to authenticated, service_role;
grant execute on function prive.fermeture_nocturne(timestamptz, text) to service_role;

-- L'adulte
grant select on public.enseignants to authenticated;
grant update (nom_affiche, dernier_projet_id, aides_masquees) on public.enseignants to authenticated;
grant select, insert, update, delete on public.classes to authenticated;
grant select, insert, update on public.classes_secrets to authenticated;
grant select, insert, update, delete on public.horaires to authenticated;
grant select, insert, update on public.eleves to authenticated;
grant select, insert on public.eleves_secrets to authenticated;
grant update (code_chiffre) on public.eleves_secrets to authenticated;
grant select, insert, update on public.inscriptions to authenticated;
grant select, insert, update on public.projets to authenticated;
grant execute on function
  public.creer_classe(uuid, text, integer, text, text),
  public.inscrire_eleves(uuid, uuid[], jsonb),
  public.regler_horaires(uuid, boolean, jsonb)
  to authenticated;

-- Le poste : des colonnes choisies, en lecture seule
grant select (id, nom, annee_debut, enseignant_id, horaires_limites) on public.classes to poste;
grant select (id, nom_affiche) on public.enseignants to poste;
-- enseignant_id fait partie des clés qui relient ces tables : sans lui, le poste ne
-- peut pas lire une inscription avec son élève
grant select (id, classe_id, eleve_id, enseignant_id, retire_le) on public.inscriptions to poste;
grant select (id, prenom, nom, couleur, enseignant_id) on public.eleves to poste;
grant select (id, classe_id, jours, de, a, rang) on public.horaires to poste;
grant select (id, classe_id, inscription_id) on public.postes to poste;
grant execute on function public.travail_ouvert() to poste;

-- Le serveur de l'application
grant all on all tables in schema public to service_role;
grant execute on all functions in schema public to service_role;

-- ————————————————————————————————————————————————————————————————————————
-- Règles d'accès aux lignes
-- ————————————————————————————————————————————————————————————————————————

alter table public.enseignants enable row level security;
alter table public.classes enable row level security;
alter table public.classes_secrets enable row level security;
alter table public.horaires enable row level security;
alter table public.eleves enable row level security;
alter table public.eleves_secrets enable row level security;
alter table public.inscriptions enable row level security;
alter table public.projets enable row level security;
alter table public.postes enable row level security;
alter table public.essais_entree enable row level security;

-- enseignants
create policy enseignant_lit_son_compte on public.enseignants
  for select to authenticated using (id = (select auth.uid()));
create policy enseignant_modifie_son_compte on public.enseignants
  for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));
create policy poste_lit_son_enseignant on public.enseignants
  for select to poste using (id = (select prive.enseignant_du_poste()));

-- classes
create policy enseignant_lit_ses_classes on public.classes
  for select to authenticated using (enseignant_id = (select auth.uid()));
create policy enseignant_cree_ses_classes on public.classes
  for insert to authenticated with check (enseignant_id = (select auth.uid()));
create policy enseignant_modifie_ses_classes on public.classes
  for update to authenticated
  using (enseignant_id = (select auth.uid())) with check (enseignant_id = (select auth.uid()));
create policy enseignant_supprime_ses_classes on public.classes
  for delete to authenticated using (enseignant_id = (select auth.uid()));
create policy poste_lit_sa_classe on public.classes
  for select to poste using (id = (select prive.classe_du_poste()));

-- classes_secrets : le texte chiffré ne sert à rien sans la clé de l'application
create policy enseignant_lit_ses_mots_de_passe on public.classes_secrets
  for select to authenticated using (enseignant_id = (select auth.uid()));
create policy enseignant_cree_ses_mots_de_passe on public.classes_secrets
  for insert to authenticated with check (enseignant_id = (select auth.uid()));
create policy enseignant_remplace_ses_mots_de_passe on public.classes_secrets
  for update to authenticated
  using (enseignant_id = (select auth.uid()) and (select prive.classe_en_cours(classe_id)))
  with check (enseignant_id = (select auth.uid()));

-- horaires : réglés dans une classe en cours seulement (F01-AC26)
create policy enseignant_lit_ses_horaires on public.horaires
  for select to authenticated using (enseignant_id = (select auth.uid()));
create policy enseignant_cree_ses_horaires on public.horaires
  for insert to authenticated
  with check (enseignant_id = (select auth.uid()) and (select prive.classe_en_cours(classe_id)));
create policy enseignant_modifie_ses_horaires on public.horaires
  for update to authenticated
  using (enseignant_id = (select auth.uid()) and (select prive.classe_en_cours(classe_id)))
  with check (enseignant_id = (select auth.uid()));
create policy enseignant_supprime_ses_horaires on public.horaires
  for delete to authenticated
  using (enseignant_id = (select auth.uid()) and (select prive.classe_en_cours(classe_id)));
create policy poste_lit_ses_horaires on public.horaires
  for select to poste using (classe_id = (select prive.classe_du_poste()));

-- eleves
create policy enseignant_lit_ses_eleves on public.eleves
  for select to authenticated using (enseignant_id = (select auth.uid()));
create policy enseignant_cree_ses_eleves on public.eleves
  for insert to authenticated with check (enseignant_id = (select auth.uid()));
create policy enseignant_modifie_ses_eleves on public.eleves
  for update to authenticated
  using (enseignant_id = (select auth.uid())) with check (enseignant_id = (select auth.uid()));
create policy poste_lit_les_eleves_de_sa_classe on public.eleves
  for select to poste using (
    exists (
      select 1 from public.inscriptions i
      where i.eleve_id = eleves.id
        and i.classe_id = (select prive.classe_du_poste())
        and i.retire_le is null
    )
  );

-- eleves_secrets
create policy enseignant_lit_ses_codes on public.eleves_secrets
  for select to authenticated using (enseignant_id = (select auth.uid()));
create policy enseignant_cree_ses_codes on public.eleves_secrets
  for insert to authenticated with check (enseignant_id = (select auth.uid()));
create policy enseignant_remplace_ses_codes on public.eleves_secrets
  for update to authenticated
  using (enseignant_id = (select auth.uid())) with check (enseignant_id = (select auth.uid()));

-- inscriptions : inscrire et retirer dans une classe en cours seulement (F01-AC26)
create policy enseignant_lit_ses_inscriptions on public.inscriptions
  for select to authenticated using (enseignant_id = (select auth.uid()));
create policy enseignant_inscrit on public.inscriptions
  for insert to authenticated
  with check (enseignant_id = (select auth.uid()) and (select prive.classe_en_cours(classe_id)));
create policy enseignant_modifie_ses_inscriptions on public.inscriptions
  for update to authenticated
  using (enseignant_id = (select auth.uid()) and (select prive.classe_en_cours(classe_id)))
  with check (enseignant_id = (select auth.uid()));
create policy poste_lit_les_inscriptions_de_sa_classe on public.inscriptions
  for select to poste
  using (classe_id = (select prive.classe_du_poste()) and retire_le is null);

-- projets
create policy enseignant_lit_ses_projets on public.projets
  for select to authenticated using (enseignant_id = (select auth.uid()));
create policy enseignant_cree_ses_projets on public.projets
  for insert to authenticated with check (enseignant_id = (select auth.uid()));
create policy enseignant_modifie_ses_projets on public.projets
  for update to authenticated
  using (enseignant_id = (select auth.uid())) with check (enseignant_id = (select auth.uid()));

-- postes : le poste lit sa propre ligne ; tout le reste passe par le serveur
create policy poste_lit_sa_ligne on public.postes
  for select to poste
  using (id = (select auth.uid()) and classe_id = (select prive.classe_du_poste()));

-- essais_entree : aucune règle, donc aucun accès hors du serveur
