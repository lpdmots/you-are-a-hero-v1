-- Les réglages des fiches de rédaction, gardés avec le compte de l'enseignant (F07.4, décidé
-- par le porteur le 14 octobre 2026) : une feuille par chapitre ou par élève, à la suite ou
-- une par page, et le nombre de scènes à écrire par élève. Ils servent dans tous ses projets.
-- Un objet vide : les réglages par défaut (par élève, une par page, au plus 4).
alter table public.enseignants
  add column reglages_fiches jsonb not null default '{}'::jsonb
  check (jsonb_typeof(reglages_fiches) = 'object' and pg_column_size(reglages_fiches) < 1000);

grant update (reglages_fiches) on public.enseignants to authenticated;
