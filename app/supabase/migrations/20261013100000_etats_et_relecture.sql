-- Étape 4 du plan, lot 1 : l'état d'une scène et la relecture de l'enseignant.
-- Règles : F07.1 (du travail préparatoire au travail élève validé, l'enseignant a la main
-- sur l'état), F07.3 (retours de révision), F11.1 (« Validé » et « Prête »), F06.3 (la
-- prise en charge ne change pas avec l'état).
--
-- L'état ne se change que par une fonction. Elle vérifie, d'un seul tenant avec le
-- changement, que le texte et l'état sont encore ceux que l'enseignant a lus : sinon la
-- validation est suspendue (F07-AC26). Aucune remise n'est créée ni supprimée ici.

-- ————————————————————————————————————————————————————————————————————————
-- L'état de la scène
-- ————————————————————————————————————————————————————————————————————————

alter table public.scenes
  -- « En cours », « À reprendre », « À valider », « Validé », « Prête ». « Texte vide »
  -- n'est pas un état : c'est « En cours » sans texte, dit à l'affichage (F06.5).
  add column etat text not null default 'cours' check (etat in ('cours', 'reprendre', 'valider', 'valide', 'prete')),
  -- Avance d'un à chaque changement d'état, remise ou retrait d'une remise : c'est lui,
  -- avec la version du texte, que la page compare avant « Validé » ou « Prête »
  add column tour integer not null default 0,
  add column etat_le timestamptz;
create index scenes_etat_idx on public.scenes (projet_id, etat);

-- Remise : le texte tel qu'un élève l'a remis, conservé sans jamais être modifié (F07.1).
-- Les notes de l'enseignant n'en font pas partie.
create table public.remises (
  id uuid primary key default gen_random_uuid(),
  scene_id uuid not null,
  projet_id uuid not null,
  enseignant_id uuid not null,
  -- L'élève qui a remis ; son prénom reste sur la remise si la scène change de main
  eleve_id uuid references public.eleves (id) on delete set null,
  texte jsonb not null check (jsonb_typeof(texte) = 'array'),
  remis_le timestamptz not null default now(),
  foreign key (scene_id, projet_id) references public.scenes (id, projet_id) on delete cascade,
  foreign key (projet_id, enseignant_id) references public.projets (id, enseignant_id) on delete cascade
);
create index remises_scene_idx on public.remises (scene_id, remis_le);
create index remises_projet_idx on public.remises (projet_id);
create index remises_enseignant_idx on public.remises (enseignant_id);
create index remises_eleve_idx on public.remises (eleve_id);

-- Retour de révision : à l'écran, « remarque ». Une ligne par reprise demandée, même sans
-- remarque écrite ; elle est gardée avec la remise qu'elle concerne (F07-AC25).
create table public.remarques (
  id uuid primary key default gen_random_uuid(),
  scene_id uuid not null,
  projet_id uuid not null,
  enseignant_id uuid not null,
  -- La dernière remise au moment de la demande ; rien quand la scène n'a jamais été remise
  remise_id uuid references public.remises (id) on delete set null,
  -- L'élève qui s'occupait de la scène : c'est à lui que la reprise est signalée (F07-AC16)
  eleve_id uuid references public.eleves (id) on delete set null,
  texte text not null default '' check (char_length(texte) <= 2000),
  cree_le timestamptz not null default now(),
  foreign key (scene_id, projet_id) references public.scenes (id, projet_id) on delete cascade,
  foreign key (projet_id, enseignant_id) references public.projets (id, enseignant_id) on delete cascade
);
create index remarques_scene_idx on public.remarques (scene_id, cree_le);
create index remarques_projet_idx on public.remarques (projet_id);
create index remarques_enseignant_idx on public.remarques (enseignant_id);
create index remarques_remise_idx on public.remarques (remise_id);
create index remarques_eleve_idx on public.remarques (eleve_id);

-- ————————————————————————————————————————————————————————————————————————
-- Fonctions internes
-- ————————————————————————————————————————————————————————————————————————

-- Pourquoi cet élève ne peut pas écrire dans cette scène ; rien s'il le peut. « À valider »,
-- « Validé » et « Prête » retirent l'écriture aux élèves, quel que soit leur profil
-- (F07-AC03, AC30) ; « En cours » et « À reprendre » la leur rendent (F07-AC14).
create or replace function prive.refus_d_ecrire(p_scene uuid, p_eleve uuid) returns text
language plpgsql stable security definer set search_path = ''
as $$
declare
  s record;
begin
  select sc.id, sc.chapitre_id, sc.projet_id, sc.supprime_le, sc.prise_par_enseignant, sc.etat
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
  if s.etat in ('valider', 'valide', 'prete') then
    return 'scene';
  end if;
  if prive.eleve_arrete(p_scene, p_eleve) then
    return 'arrete';
  end if;
  return null;
end
$$;

-- Une scène contient du travail quand sa copie porte un texte ou une image, qu'un texte est
-- gardé à part pour elle, ou qu'un élève l'a remise (F06.1)
create or replace function prive.scene_contient_du_travail(p_scene uuid) returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (select 1 from public.scenes s where s.id = p_scene and not s.texte_vide)
    or exists (select 1 from public.copies_recuperation c where c.scene_id = p_scene and c.retire_le is null)
    or exists (select 1 from public.remises r where r.scene_id = p_scene)
$$;

-- ————————————————————————————————————————————————————————————————————————
-- Fonction de l'adulte
-- ————————————————————————————————————————————————————————————————————————

-- Mettre une scène dans l'état voulu, depuis n'importe quel état (F07.1, 4 octobre 2026).
-- p_version et p_tour : le texte et l'état que la page montrait. Pour « Validé » et
-- « Prête », s'ils ne sont plus ceux de la base, rien ne change et la réponse le dit.
-- Rend { fait, suspendu, etat, version, tour }.
create function public.changer_etat(p_scene uuid, p_etat text, p_version integer, p_tour integer, p_remarque text default null)
returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  s public.scenes%rowtype;
  v_de_classe boolean;
  v_remise uuid;
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

  update public.scenes sc set etat = p_etat, tour = sc.tour + 1, etat_le = now() where sc.id = s.id;

  -- Demander une reprise : la remarque est facultative, la demande est toujours gardée (F07.3)
  if p_etat = 'reprendre' then
    select r.id into v_remise from public.remises r where r.scene_id = s.id order by r.remis_le desc limit 1;
    insert into public.remarques (scene_id, projet_id, enseignant_id, remise_id, eleve_id, texte)
    values (s.id, s.projet_id, s.enseignant_id, v_remise, s.prise_par_eleve, left(btrim(coalesce(p_remarque, '')), 2000));
  end if;

  return jsonb_build_object('fait', true, 'suspendu', false, 'etat', p_etat, 'version', s.version, 'tour', s.tour + 1);
end
$$;

-- ————————————————————————————————————————————————————————————————————————
-- Droits et règles d'accès aux lignes
-- ————————————————————————————————————————————————————————————————————————

-- L'adulte lit ses remises et ses remarques ; il ne les écrit que par les fonctions
grant select on public.remises, public.remarques to authenticated;
revoke execute on function public.changer_etat(uuid, text, integer, integer, text) from public, anon, poste;
grant execute on function public.changer_etat(uuid, text, integer, integer, text) to authenticated;

-- Le poste lit l'état des scènes qu'il lit déjà ; les remises et les remarques, jamais
-- directement : elles passeront par des fonctions
grant select (etat) on public.scenes to poste;

-- Le serveur de l'application
grant all on public.remises, public.remarques to service_role;
grant execute on function public.changer_etat(uuid, text, integer, integer, text) to service_role;

alter table public.remises enable row level security;
alter table public.remarques enable row level security;

create policy enseignant_lit on public.remises
  for select to authenticated using (enseignant_id = (select auth.uid()));
create policy enseignant_lit on public.remarques
  for select to authenticated using (enseignant_id = (select auth.uid()));
