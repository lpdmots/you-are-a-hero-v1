-- Étape 3 du plan, lot 1 : écrire une scène et l'enregistrer.
-- Règles : F08.1 (écritures concurrentes, texte gardé à part), F08.2 (enregistrement
-- automatique, versions précédentes), F04.1 (mise en forme des élèves), F06.1 (scène
-- « contenant du travail »), F06.4 (dernier enregistrement à la fermeture d'un poste).
--
-- Le texte d'une scène ne s'écrit que par des fonctions : chacune compare la version que
-- la page connaît à celle de la base, d'un seul tenant. Un enregistrement refusé, quel
-- qu'en soit le motif, est gardé à part sur la scène ; rien n'est remplacé en silence.

-- ————————————————————————————————————————————————————————————————————————
-- Le texte de la scène
-- ————————————————————————————————————————————————————————————————————————

-- Un texte est vide quand il n'a ni mot, ni phrase de choix, ni action de jeu, ni image.
-- Une note de l'enseignant n'est pas du texte de la scène (F05.2).
create function prive.texte_est_vide(p_texte jsonb) returns boolean
language sql immutable set search_path = ''
as $$
  select not (
    jsonb_path_exists(p_texte, '$[*] ? (@.type == "choix" || @.type == "action" || @.type == "image")')
    or jsonb_path_exists(p_texte, '$[*] ? (@.type != "note").** ? (@.text like_regex "\\S")')
    or jsonb_path_exists(p_texte, '$[*] ? (@.type != "note").** ? (@.type == "image" || @.type == "image-ligne")')
  )
$$;

alter table public.scenes
  -- Texte courant : la suite des blocs de la copie, telle que l'éditeur la tient
  add column texte jsonb not null default '[]'::jsonb check (jsonb_typeof(texte) = 'array'),
  -- Augmente d'un à chaque enregistrement : c'est elle que la page compare (F08-AC01)
  add column version integer not null default 0,
  add column texte_vide boolean generated always as (prive.texte_est_vide(texte)) stored,
  add column ecrit_le timestamptz,
  -- Les élèves qui ont enregistré un texte dans la scène : le dialogue de suppression les nomme
  add column ecrit_par uuid[] not null default '{}';

-- Mise en forme des élèves : gras, italique et souligné, ensemble (F04-AC02, AC03)
alter table public.projets add column mise_en_forme_eleves boolean not null default true;

-- Copie de récupération : à l'écran, « texte gardé à part » (F08.1).
create table public.copies_recuperation (
  id uuid primary key default gen_random_uuid(),
  scene_id uuid not null,
  projet_id uuid not null,
  enseignant_id uuid not null,
  -- « refus » : née d'un enregistrement refusé, elle arrête l'élève qui l'a écrite ;
  -- « ancien » : texte sorti de la scène par un échange, qui n'arrête personne (F08-AC30)
  sorte text not null check (sorte in ('refus', 'ancien')),
  -- L'élève dont c'est le texte ; personne quand c'est celui de l'adulte ou un ancien texte
  eleve_id uuid references public.eleves (id) on delete set null,
  -- Pourquoi l'enregistrement a été refusé : texte devenu ancien, scène qui ne s'écrit plus…
  motif text check (motif in ('conflit', 'scene', 'supprimee', 'acces', 'arrete', 'controle')),
  texte jsonb not null check (jsonb_typeof(texte) = 'array'),
  garde_le timestamptz not null default now(),
  -- « Ne plus garder ce texte » : effacé pour de bon une fois la page quittée (F08-AC13)
  retire_le timestamptz,
  foreign key (scene_id, projet_id) references public.scenes (id, projet_id) on delete cascade,
  foreign key (projet_id, enseignant_id) references public.projets (id, enseignant_id) on delete cascade
);
create index copies_scene_idx on public.copies_recuperation (scene_id);
create index copies_projet_idx on public.copies_recuperation (projet_id);
create index copies_enseignant_idx on public.copies_recuperation (enseignant_id);
create index copies_eleve_idx on public.copies_recuperation (eleve_id);

-- Version précédente : le texte tel qu'il était avant qu'une personne le modifie, une fois
-- par personne et par jour (F08.2).
create table public.versions_precedentes (
  id uuid primary key default gen_random_uuid(),
  scene_id uuid not null,
  projet_id uuid not null,
  enseignant_id uuid not null,
  -- « avant » : gardée d'office au premier enregistrement du jour ;
  -- « remplace » : texte sorti de la scène quand une version y a été remise (F08-AC42)
  sorte text not null check (sorte in ('avant', 'remplace')),
  -- La personne qui a modifié ensuite ; personne quand c'est l'adulte
  eleve_id uuid references public.eleves (id) on delete set null,
  de_l_adulte boolean not null default false,
  jour date not null,
  texte jsonb not null check (jsonb_typeof(texte) = 'array'),
  cree_le timestamptz not null default now(),
  foreign key (scene_id, projet_id) references public.scenes (id, projet_id) on delete cascade,
  foreign key (projet_id, enseignant_id) references public.projets (id, enseignant_id) on delete cascade
);
create unique index versions_une_par_jour on public.versions_precedentes
  (scene_id, coalesce(eleve_id, '00000000-0000-0000-0000-000000000000'::uuid), jour)
  where sorte = 'avant';
create index versions_projet_idx on public.versions_precedentes (projet_id);
create index versions_enseignant_idx on public.versions_precedentes (enseignant_id);
create index versions_eleve_idx on public.versions_precedentes (eleve_id);

-- Une scène ouverte pour écrire par un élève, sur un poste. Elle sert au dernier
-- enregistrement, accepté une fois après la fermeture de l'accès (F06-AC29, AC76 à AC78).
create table public.ecritures (
  id uuid primary key default gen_random_uuid(),
  scene_id uuid not null references public.scenes (id) on delete cascade,
  eleve_id uuid not null references public.eleves (id) on delete cascade,
  poste_id uuid not null references public.postes (id) on delete cascade,
  ouverte_le timestamptz not null default now(),
  -- Le dernier enregistrement a été reçu après la fermeture de l'accès : plus rien ensuite
  close_le timestamptz
);
create index ecritures_scene_idx on public.ecritures (scene_id);
create index ecritures_eleve_idx on public.ecritures (eleve_id);
create index ecritures_poste_idx on public.ecritures (poste_id);

-- ————————————————————————————————————————————————————————————————————————
-- Fonctions internes
-- ————————————————————————————————————————————————————————————————————————

-- L'élève est-il arrêté sur cette scène ? Tant qu'un texte à lui y est gardé à part (F08-AC09)
create function prive.eleve_arrete(p_scene uuid, p_eleve uuid) returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.copies_recuperation c
    where c.scene_id = p_scene and c.eleve_id = p_eleve and c.sorte = 'refus' and c.retire_le is null
  )
$$;

-- Pourquoi cet élève ne peut pas écrire dans cette scène ; rien s'il le peut. L'accès du
-- poste (horaires, classe ouverte) n'est pas regardé ici : voir prive.acces_ouvert.
create function prive.refus_d_ecrire(p_scene uuid, p_eleve uuid) returns text
language plpgsql stable security definer set search_path = ''
as $$
declare
  s record;
begin
  select sc.id, sc.chapitre_id, sc.projet_id, sc.supprime_le, sc.prise_par_enseignant
  into s from public.scenes sc where sc.id = p_scene;
  if not found or p_eleve is null then
    return 'acces';
  end if;
  if s.supprime_le is not null or not prive.chapitre_dans_le_plan(s.chapitre_id) then
    return 'supprimee';
  end if;
  if not exists (
    select 1
    from public.attributions a
    join public.projets p on p.id = a.projet_id and p.organisation = 'classe'
    join public.inscriptions i on i.classe_id = p.classe_id and i.eleve_id = a.eleve_id and i.retire_le is null
    where a.chapitre_id = s.chapitre_id and a.eleve_id = p_eleve
  ) then
    return 'acces';
  end if;
  -- La scène que l'enseignant s'attribue se lit sans s'écrire (F06-AC62)
  if s.prise_par_enseignant then
    return 'scene';
  end if;
  if prive.eleve_arrete(p_scene, p_eleve) then
    return 'arrete';
  end if;
  return null;
end
$$;

-- L'accès de cet élève sur ce poste tient-il à cet instant ? Classe ouverte, mot de passe
-- inchangé, élève identifié et actif, horaires ouverts (F06.4).
create function prive.acces_ouvert(p_poste uuid, p_eleve uuid) returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1
    from public.postes p
    join public.classes c on c.id = p.classe_id
    join public.inscriptions i on i.id = p.inscription_id and i.classe_id = p.classe_id
    where p.id = p_poste
      and p.ferme_le is null
      and p.expire_le > now()
      and c.terminee_le is null
      and p.version_acces = c.version_acces
      and i.eleve_id = p_eleve
      and i.retire_le is null
      and p.actif_le > now() - interval '2 hours'
      and prive.horaires_ouverts(i.classe_id, now())
  )
$$;

-- Écrire le texte d'une scène, d'un seul tenant (F08-AC01). p_eleve : l'élève qui écrit,
-- ou personne pour l'adulte. p_refus : un motif de refus déjà connu de l'appelant.
-- Rend { etat: 'enregistre' | 'garde' | 'refuse', version, motif }.
create function prive.ecrire_texte(p_scene uuid, p_version integer, p_texte jsonb, p_eleve uuid, p_refus text)
returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  s public.scenes%rowtype;
  v_fuseau text;
  v_refus text := p_refus;
begin
  select * into s from public.scenes sc where sc.id = p_scene for update;
  if not found then
    return jsonb_build_object('etat', 'refuse', 'motif', 'supprimee');
  end if;

  -- Rien de neuf : rien à écrire ni à garder. C'est aussi le cas d'une réponse perdue en
  -- route, que la page renvoie : son texte est déjà celui de la scène.
  if s.texte = p_texte then
    if v_refus is not null then
      return jsonb_build_object('etat', 'refuse', 'version', s.version, 'motif', v_refus);
    end if;
    return jsonb_build_object('etat', 'enregistre', 'version', s.version);
  end if;

  if v_refus is null and s.version <> p_version then
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
  set texte = p_texte,
      version = sc.version + 1,
      ecrit_le = now(),
      ecrit_par = case when p_eleve is null or p_eleve = any (sc.ecrit_par) then sc.ecrit_par else sc.ecrit_par || p_eleve end
  where sc.id = p_scene;
  return jsonb_build_object('etat', 'enregistre', 'version', s.version + 1);
end
$$;

-- Une scène contient du travail quand sa copie porte un texte ou une image, ou qu'un texte
-- est gardé à part pour elle (F06.1, 10 octobre 2026). Les remises arrivent à l'étape 4.
create or replace function prive.scene_contient_du_travail(p_scene uuid) returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (select 1 from public.scenes s where s.id = p_scene and not s.texte_vide)
    or exists (select 1 from public.copies_recuperation c where c.scene_id = p_scene and c.retire_le is null)
$$;

-- ————————————————————————————————————————————————————————————————————————
-- Fonctions de l'adulte
-- ————————————————————————————————————————————————————————————————————————

-- Enregistrer le texte d'une de ses scènes. Refusé, il est gardé à part sous « Vos
-- corrections » : l'adulte n'est pas arrêté (F08-AC21, AC29).
create function public.enregistrer_texte(p_scene uuid, p_version integer, p_texte jsonb) returns jsonb
language plpgsql security definer set search_path = ''
as $$
begin
  if not exists (select 1 from public.scenes s where s.id = p_scene and s.enseignant_id = (select auth.uid())) then
    return jsonb_build_object('etat', 'refuse', 'motif', 'acces');
  end if;
  return prive.ecrire_texte(p_scene, p_version, p_texte, null, null);
end
$$;

-- « Ne plus garder ce texte » : il n'est plus proposé nulle part, et s'annule tant que
-- l'adulte reste sur la page (F08-AC07, AC13). Les textes retirés la veille sont effacés.
create function public.ne_plus_garder(p_copie uuid) returns void
language plpgsql security definer set search_path = ''
as $$
begin
  delete from public.copies_recuperation c
  where c.enseignant_id = (select auth.uid()) and c.retire_le < now() - interval '1 day';
  update public.copies_recuperation c set retire_le = now()
  where c.id = p_copie and c.enseignant_id = (select auth.uid()) and c.retire_le is null;
  if not found then
    raise exception 'Ce texte n''est plus gardé à part.' using errcode = 'P0001';
  end if;
end
$$;

-- « Annuler » : le texte est de nouveau gardé à part, et son élève de nouveau arrêté
create function public.garder_de_nouveau(p_copie uuid) returns void
language plpgsql security definer set search_path = ''
as $$
begin
  update public.copies_recuperation c set retire_le = null
  where c.id = p_copie and c.enseignant_id = (select auth.uid()) and c.retire_le is not null;
  if not found then
    raise exception 'Ce texte ne peut plus être retrouvé.' using errcode = 'P0001';
  end if;
end
$$;

-- « Mettre ce texte dans la scène » : un échange. Le texte gardé à part devient le texte
-- de la scène ; celui qu'il remplace est gardé à part à son tour, sous « Ancien texte de
-- la scène », et n'arrête personne (F08-AC08, AC25, AC30). Un texte vide n'est pas gardé.
create function public.mettre_copie_dans_scene(p_copie uuid) returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  c public.copies_recuperation%rowtype;
  s public.scenes%rowtype;
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
  update public.scenes sc set texte = c.texte, version = sc.version + 1, ecrit_le = now() where sc.id = s.id;
  if s.texte_vide then
    delete from public.copies_recuperation x where x.id = p_copie;
    return jsonb_build_object('version', s.version + 1, 'ancien', null);
  end if;
  update public.copies_recuperation x
  set texte = s.texte, sorte = 'ancien', eleve_id = null, motif = null, garde_le = now()
  where x.id = p_copie;
  return jsonb_build_object('version', s.version + 1, 'ancien', p_copie);
end
$$;

-- « Mettre ce texte dans la scène », depuis une version précédente : le même échange,
-- le texte remplacé devenant à son tour une version précédente (F08-AC42)
create function public.mettre_version_dans_scene(p_version uuid) returns jsonb
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
  if s.texte_vide then
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

-- ————————————————————————————————————————————————————————————————————————
-- Fonctions du poste d'un élève
-- ————————————————————————————————————————————————————————————————————————

-- La scène qu'un élève ouvre : son texte, sans les notes de l'enseignant, et ce qu'il peut
-- y faire. Rien pour une scène qu'il ne peut pas lire (F06-AC21). Les versions précédentes
-- et les textes gardés à part n'y sont jamais (F08-AC17, AC43).
create function public.scene_du_poste(p_scene uuid) returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
declare
  s record;
  v_eleve uuid := (select prive.eleve_au_travail());
  v_profil text;
begin
  select sc.id, sc.chapitre_id, sc.projet_id, sc.reference, sc.titre, sc.consigne, sc.texte, sc.version, sc.texte_vide,
         sc.prise_par_eleve, sc.prise_par_enseignant
  into s from public.scenes sc where sc.id = p_scene and sc.supprime_le is null;
  if not found or v_eleve is null or not (select prive.scenes_lisibles(s.chapitre_id)) then
    return null;
  end if;
  v_profil := (select prive.profil_dans(s.chapitre_id));
  return jsonb_build_object(
    'id', s.id, 'chapitre', s.chapitre_id, 'projet', s.projet_id, 'reference', s.reference, 'titre', s.titre,
    -- La consigne ne se lit que dans son chapitre (F06-AC48)
    'consigne', case when v_profil is null then null else s.consigne end,
    'texte', jsonb_path_query_array(s.texte, '$[*] ? (@.type != "note")'),
    'version', s.version, 'vide', s.texte_vide,
    'profil', v_profil,
    'prise_par_eleve', s.prise_par_eleve, 'prise_par_enseignant', s.prise_par_enseignant,
    -- Gras, italique et souligné : le réglage du projet (F04-AC03)
    'marques', (select p.mise_en_forme_eleves from public.projets p where p.id = s.projet_id),
    'refus', prive.refus_d_ecrire(s.id, v_eleve)
  );
end
$$;

-- L'élève ouvre une scène pour y écrire : la page reçoit de quoi faire accepter son
-- dernier enregistrement si l'accès se ferme pendant qu'il tape.
create function public.eleve_ouvrir_ecriture(p_scene uuid) returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  v_eleve uuid := (select prive.eleve_au_travail());
  v_id uuid;
begin
  if v_eleve is null or prive.refus_d_ecrire(p_scene, v_eleve) is not null then
    return null;
  end if;
  delete from public.ecritures e where e.ouverte_le < now() - interval '7 days';
  insert into public.ecritures (scene_id, eleve_id, poste_id)
  values (p_scene, v_eleve, (select auth.uid()))
  returning id into v_id;
  return v_id;
end
$$;

-- Les scènes de ce chapitre où l'élève du poste est arrêté (F08-AC17)
create function public.scenes_ou_je_suis_arrete(p_chapitre uuid) returns setof uuid
language sql stable security definer set search_path = ''
as $$
  select distinct c.scene_id
  from public.copies_recuperation c
  join public.scenes s on s.id = c.scene_id
  where s.chapitre_id = p_chapitre
    and c.eleve_id = (select prive.eleve_au_travail())
    and c.sorte = 'refus' and c.retire_le is null
    and (select prive.profil_dans(p_chapitre)) is not null
$$;

-- ————————————————————————————————————————————————————————————————————————
-- Fonction du serveur : l'enregistrement d'un élève
-- ————————————————————————————————————————————————————————————————————————

-- Le serveur de l'application a contrôlé le texte reçu (p_refus dit s'il l'a refusé) ; la
-- base vérifie ici, d'un seul tenant avec l'écriture, que l'élève peut encore écrire dans
-- la scène. Quand son accès vient de se fermer — fin de plage, deux heures sans activité,
-- mot de passe remplacé, année terminée —, ce dernier enregistrement est accepté, une
-- fois (F06-AC29, AC76, AC77). Les protections de F08.1 s'y appliquent comme aux autres.
create function public.ecriture_enregistrer(
  p_ecriture uuid, p_jeton_hash text, p_version integer, p_texte jsonb, p_refus text
) returns jsonb
language plpgsql security invoker set search_path = ''
as $$
declare
  e record;
  v_ouvert boolean;
  v_resultat jsonb;
begin
  select ec.id, ec.scene_id, ec.eleve_id, ec.poste_id, ec.close_le
  into e
  from public.ecritures ec
  join public.postes p on p.id = ec.poste_id
  where ec.id = p_ecriture and p.jeton_hash = p_jeton_hash
  for update of ec;
  if not found or e.close_le is not null then
    return jsonb_build_object('etat', 'ferme');
  end if;

  v_ouvert := prive.acces_ouvert(e.poste_id, e.eleve_id);
  if v_ouvert then
    update public.postes set actif_le = now() where id = e.poste_id and inscription_id is not null;
  else
    update public.ecritures set close_le = now() where id = e.id;
  end if;

  v_resultat := prive.ecrire_texte(
    e.scene_id, p_version, p_texte, e.eleve_id,
    coalesce(prive.refus_d_ecrire(e.scene_id, e.eleve_id), p_refus)
  );
  return v_resultat || jsonb_build_object('dernier', not v_ouvert);
end
$$;

-- Ce que le serveur relit avant de contrôler le texte d'un élève : le texte courant, sa
-- version, le profil de l'élève dans le chapitre
create function public.ecriture_lire(p_ecriture uuid, p_jeton_hash text) returns jsonb
language sql stable security invoker set search_path = ''
as $$
  select jsonb_build_object(
    'scene', s.id, 'projet', s.projet_id, 'chapitre', s.chapitre_id, 'eleve', ec.eleve_id,
    'texte', s.texte, 'version', s.version,
    'profil', (select a.profil from public.attributions a where a.chapitre_id = s.chapitre_id and a.eleve_id = ec.eleve_id)
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
  prive.texte_est_vide(jsonb), prive.eleve_arrete(uuid, uuid), prive.refus_d_ecrire(uuid, uuid),
  prive.acces_ouvert(uuid, uuid), prive.ecrire_texte(uuid, integer, jsonb, uuid, text)
  from public, anon, authenticated, poste;
-- La colonne calculée « texte_vide » s'évalue avec les droits de qui écrit la scène
grant execute on function prive.texte_est_vide(jsonb) to authenticated, poste, service_role;
grant execute on function
  prive.eleve_arrete(uuid, uuid), prive.refus_d_ecrire(uuid, uuid), prive.acces_ouvert(uuid, uuid),
  prive.ecrire_texte(uuid, integer, jsonb, uuid, text)
  to service_role;

-- L'adulte : il lit ses textes, et ne les écrit que par les fonctions ci-dessus
grant update (mise_en_forme_eleves) on public.projets to authenticated;
grant select on public.copies_recuperation, public.versions_precedentes to authenticated;
grant execute on function
  public.enregistrer_texte(uuid, integer, jsonb),
  public.ne_plus_garder(uuid), public.garder_de_nouveau(uuid),
  public.mettre_copie_dans_scene(uuid), public.mettre_version_dans_scene(uuid)
  to authenticated;

-- Le poste : jamais la colonne du texte, où sont les notes de l'enseignant
grant select (mise_en_forme_eleves) on public.projets to poste;
grant select (version, texte_vide, ecrit_le) on public.scenes to poste;
grant execute on function
  public.scene_du_poste(uuid), public.eleve_ouvrir_ecriture(uuid), public.scenes_ou_je_suis_arrete(uuid)
  to poste;

-- Le serveur de l'application
grant all on all tables in schema public to service_role;
grant execute on all functions in schema public to service_role;

-- ————————————————————————————————————————————————————————————————————————
-- Règles d'accès aux lignes
-- ————————————————————————————————————————————————————————————————————————

alter table public.copies_recuperation enable row level security;
alter table public.versions_precedentes enable row level security;
alter table public.ecritures enable row level security;

create policy enseignant_lit on public.copies_recuperation
  for select to authenticated using (enseignant_id = (select auth.uid()));
create policy enseignant_lit on public.versions_precedentes
  for select to authenticated using (enseignant_id = (select auth.uid()));
