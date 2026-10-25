-- Bibliothèque publique des livres (F15), lot 1 : proposer un livre à la bibliothèque.
--
-- Proposer fige une copie à part, distincte de la version partagée (`partages`) : c'est elle que
-- le porteur relit, et une mise à jour du partage privé ne change rien en public (F15-AC08).
-- Une ligne par projet, qui tient deux contenus à la fois : la version publiée, que lit le public,
-- et la proposition en attente de relecture, première ou mise à jour ; la version publiée reste
-- lisible pendant la relecture de sa mise à jour (F15-AC07). Une seule proposition en attente
-- par projet (F15-AC18).
--
-- L'adresse du livre se tire de son titre à la première publication, puis ne change plus, même
-- si le titre change (F15, « Liste, tri, filtres »).
--
-- L'adulte lit sa ligne ; il ne l'écrit pas. Seul le serveur de l'application l'écrit, avec la
-- clé de service, après avoir revérifié la règle du partage sur l'instantané qu'il fige (F15-AC02)
-- et, pour la version publiée, après la décision du porteur : un adulte ne se publie pas lui-même.

create table public.publications (
  projet_id uuid primary key,
  enseignant_id uuid not null,
  -- « la-lanterne-du-passeur » : rien avant la première publication
  adresse text unique check (adresse ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(adresse) <= 80),

  -- La version publiée : ce que lit le public, avec sa présentation et l'âge de ses lecteurs
  version jsonb check (version is null or jsonb_typeof(version) = 'object'),
  presentation text check (presentation is null or char_length(presentation) between 1 and 600),
  age text check (age is null or age in ('6-8', '8-10', '10-12', '12-15', 'adultes')),
  empreinte text check (empreinte is null or length(empreinte) between 16 and 128),
  -- Sa publication, depuis un livre qui n'était pas lisible : le tri « Les plus récents »
  publiee_le timestamptz,
  -- Le contenu publié en dernier, première publication ou mise à jour
  mise_a_jour_le timestamptz,

  -- La proposition en attente de relecture
  proposee jsonb check (proposee is null or jsonb_typeof(proposee) = 'object'),
  presentation_proposee text check (presentation_proposee is null or char_length(presentation_proposee) between 1 and 600),
  age_propose text check (age_propose is null or age_propose in ('6-8', '8-10', '10-12', '12-15', 'adultes')),
  empreinte_proposee text check (empreinte_proposee is null or length(empreinte_proposee) between 16 and 128),
  proposee_le timestamptz,
  -- Ce que l'adulte a attesté en proposant : l'autorisation des familles, ou être l'auteur (F15-AC17)
  attestation text check (attestation is null or attestation in ('classe', 'auteur')),

  -- La dernière présentation proposée, gardée après un refus : l'adulte la corrige au lieu de la réécrire
  derniere_presentation text check (derniere_presentation is null or char_length(derniere_presentation) between 1 and 600),

  -- Le dernier refus, lu par l'adulte jusqu'à sa proposition suivante (F15-AC05)
  refus_motif text check (refus_motif is null or char_length(refus_motif) between 1 and 2000),
  refusee_le timestamptz,

  modifie_le timestamptz not null default now(),
  check ((version is null) = (presentation is null) and (version is null) = (age is null) and (version is null) = (empreinte is null)),
  check (version is null or (adresse is not null and publiee_le is not null and mise_a_jour_le is not null)),
  check (
    (proposee is null) = (presentation_proposee is null) and (proposee is null) = (age_propose is null)
    and (proposee is null) = (empreinte_proposee is null) and (proposee is null) = (proposee_le is null)
    and (proposee is null) = (attestation is null)
  ),
  check ((refus_motif is null) = (refusee_le is null)),
  foreign key (projet_id, enseignant_id) references public.projets (id, enseignant_id) on delete cascade
);
create index publications_enseignant_idx on public.publications (enseignant_id);
-- La file de relecture du porteur, la plus ancienne d'abord
create index publications_a_relire_idx on public.publications (proposee_le) where proposee is not null;
-- La bibliothèque, la plus récente d'abord
create index publications_publiees_idx on public.publications (publiee_le desc) where version is not null;

alter table public.publications enable row level security;
create policy enseignant_lit on public.publications for select to authenticated using (enseignant_id = (select auth.uid()));
grant select on public.publications to authenticated;
grant all on public.publications to service_role;
