-- Bibliothèque publique des livres (F15), lot 5 : retirer un livre, et le signaler.
--
-- Retirer : l'adulte, à tout moment, depuis « Imprimer et partager », sans relecture ; le porteur,
-- depuis l'administration, avec un motif envoyé par courriel à l'adulte (F15-AC09, AC10). La
-- version publiée s'efface, l'adresse et les cœurs restent : l'adresse dit « Ce livre n'est plus
-- dans la bibliothèque », et le livre proposé de nouveau puis publié retrouve l'une et les autres.
--
-- Signaler : un court formulaire dans le tiroir du livre (F15-AC14) — motif, passage facultatif,
-- message, adresse de réponse — qui garde le signalement pour le porteur jusqu'à sa décision. Le
-- livre reste publié : aucun masquage automatique. L'adresse réseau n'est gardée qu'en empreinte,
-- pour borner les envois d'une même adresse.

alter table public.publications
  add column retiree_le timestamptz,
  add column retrait_par text check (retrait_par is null or retrait_par in ('adulte', 'porteur')),
  -- Le motif du porteur, que l'adulte lit dans l'étape ; rien pour un retrait de l'adulte
  add column retrait_motif text check (retrait_motif is null or char_length(retrait_motif) between 1 and 2000),
  add check ((retiree_le is null) = (retrait_par is null)),
  add check (retrait_motif is null or retrait_par = 'porteur');

create table public.signalements (
  id uuid primary key default gen_random_uuid(),
  projet_id uuid not null references public.projets (id) on delete cascade,
  -- L'adresse du livre au moment du signalement, pour l'ouvrir depuis l'administration
  adresse text not null check (char_length(adresse) between 1 and 80),
  motif text not null check (motif in ('age', 'haine', 'vie-privee', 'droits', 'autre')),
  passage integer check (passage is null or passage between 1 and 9999),
  message text not null check (char_length(message) between 1 and 2000),
  courriel text not null check (char_length(courriel) between 3 and 254 and courriel like '%_@_%'),
  reseau text check (reseau is null or char_length(reseau) between 8 and 80),
  recu_le timestamptz not null default now(),
  -- La décision du porteur : livre retiré, ou signalement classé sans suite
  traite_le timestamptz,
  decision text check (decision is null or decision in ('retire', 'classe')),
  check ((traite_le is null) = (decision is null))
);
create index signalements_a_traiter_idx on public.signalements (recu_le) where traite_le is null;
create index signalements_reseau_idx on public.signalements (reseau, recu_le);

alter table public.signalements enable row level security;
-- Aucune règle d'accès : seul le serveur, avec la clé de service, lit et écrit les signalements
grant all on public.signalements to service_role;
