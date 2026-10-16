-- Étape 7, lot 1 : partager une version du livre (F12.1, F12.3).
--
-- Une histoire a au plus une version partagée lisible. Elle est figée au moment du partage
-- et de chaque mise à jour : ce que le lecteur voit, sans rien de l'impression ni du travail
-- de la classe. Deux canaux la rendent lisible, chacun coupé seul : le lien de lecture, sans
-- compte, et la lecture par les classes de l'enseignant. Couper le dernier retire la version.
-- Le code du lien reste celui du projet d'un retrait à l'autre (un nouveau partage réactive
-- le même lien) ; « Changer de lien » le remplace, et l'ancien ne mène plus à rien.
--
-- Seul l'adulte du projet lit et écrit cette table. Le lecteur sans compte et les postes
-- d'élèves ne la lisent jamais directement : le serveur de l'application, pour le lien, et
-- des fonctions de la base, pour les élèves (lot 3), n'en rendent que la version.

create table public.partages (
  projet_id uuid primary key,
  enseignant_id uuid not null,
  -- Dix caractères sans lettres ni chiffres ambigus, écrits sans tirets (F12.1, 16 octobre 2026)
  code text not null unique check (code ~ '^[abcdefghjkmnpqrstuvwxyz23456789]{10}$'),
  par_lien boolean not null default false,
  aux_classes boolean not null default false,
  -- La version figée ; rien quand le partage est retiré
  version jsonb check (version is null or jsonb_typeof(version) = 'object'),
  -- L'instant du contenu figé
  etat_du timestamptz,
  -- Ce que le lecteur lit, sans les réglages des noms : comparé au PDF définitif (F12-AC22)
  empreinte_lecture text check (empreinte_lecture is null or length(empreinte_lecture) between 16 and 128),
  -- La version entière, noms compris : « le livre a changé depuis la version partagée » (F12-AC21)
  empreinte text check (empreinte is null or length(empreinte) between 16 and 128),
  -- Ce que la version montre des auteurs : la ligne de la page de titre, son texte propre au
  -- partage, la page des auteurs (F12.1, révisé le 16 octobre 2026) ; lu et complété par l'application
  noms jsonb not null default '{}'::jsonb check (jsonb_typeof(noms) = 'object'),
  modifie_le timestamptz not null default now(),
  -- Un canal ouvert suppose une version, et une version un canal ouvert
  check ((version is null) = (not par_lien and not aux_classes)),
  check (version is null or (etat_du is not null and empreinte is not null and empreinte_lecture is not null)),
  foreign key (projet_id, enseignant_id) references public.projets (id, enseignant_id) on delete cascade
);
create index partages_enseignant_idx on public.partages (enseignant_id);

alter table public.partages enable row level security;

create policy enseignant_lit on public.partages for select to authenticated using (enseignant_id = (select auth.uid()));
create policy enseignant_cree on public.partages for insert to authenticated with check (enseignant_id = (select auth.uid()));
create policy enseignant_modifie on public.partages for update to authenticated
  using (enseignant_id = (select auth.uid())) with check (enseignant_id = (select auth.uid()));
create policy enseignant_supprime on public.partages for delete to authenticated using (enseignant_id = (select auth.uid()));
grant select, insert, update, delete on public.partages to authenticated;
grant all on public.partages to service_role;

-- Le PDF définitif garde l'empreinte de ce que lit le lecteur : la version partagée et lui
-- disent alors s'ils ont le même texte, sans tenir compte de la mise en page (F12-AC22).
-- Un PDF produit avant l'étape 7 n'en a pas : la comparaison n'est pas possible.
alter table public.pdf_du_livre
  add column empreinte_lecture text check (empreinte_lecture is null or length(empreinte_lecture) between 16 and 128);
