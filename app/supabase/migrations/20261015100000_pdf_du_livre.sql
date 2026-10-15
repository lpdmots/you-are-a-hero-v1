-- Étape 6, lot 1 : les PDF du livre (F11.2).
--
-- Un PDF est composé par le serveur de l'application, sur un instantané du contenu, puis
-- déposé dans un seau privé : une réponse du serveur ne peut pas porter un fichier de cette
-- taille. La base retient de quoi le lister et dire s'il correspond encore au livre : la date
-- de l'état composé et l'empreinte de ce contenu. Un PDF définitif ne change plus et ne
-- s'efface qu'à la main ; seul le dernier PDF de travail est gardé (15 octobre 2026).

create table public.pdf_du_livre (
  id uuid primary key default gen_random_uuid(),
  projet_id uuid not null,
  enseignant_id uuid not null,
  sorte text not null check (sorte in ('travail', 'definitif')),
  -- L'instant du contenu composé : une modification venue pendant le calcul n'y figure pas
  etat_du timestamptz not null,
  -- L'empreinte de ce contenu : le livre a changé depuis le PDF quand elle diffère
  empreinte text not null check (length(empreinte) between 16 and 128),
  chemin text not null unique,
  taille bigint not null check (taille > 0),
  pages integer not null check (pages > 0),
  cree_le timestamptz not null default now(),
  foreign key (projet_id, enseignant_id) references public.projets (id, enseignant_id) on delete cascade
);
create index pdf_du_livre_projet_idx on public.pdf_du_livre (projet_id, sorte, cree_le desc);
create index pdf_du_livre_enseignant_idx on public.pdf_du_livre (enseignant_id);

alter table public.pdf_du_livre enable row level security;

-- L'adulte du projet seul : aucun poste d'élève ne lit un PDF (F11.2, 15 octobre 2026)
create policy enseignant_lit on public.pdf_du_livre for select to authenticated using (enseignant_id = (select auth.uid()));
create policy enseignant_cree on public.pdf_du_livre for insert to authenticated with check (enseignant_id = (select auth.uid()));
create policy enseignant_supprime on public.pdf_du_livre for delete to authenticated using (enseignant_id = (select auth.uid()));
grant select, insert, delete on public.pdf_du_livre to authenticated;
grant all on public.pdf_du_livre to service_role;

-- Les fichiers : un seau privé. Tout y passe par le serveur de l'application, qui vérifie
-- d'abord dans la base que la personne peut lire le PDF, puis donne une adresse signée.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('livres', 'livres', false, 52428800, array['application/pdf'])
on conflict (id) do nothing;
