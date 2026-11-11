-- Le bloc de scènes depuis « Chemins » (F13.7, lot 3 de « Construire dans Chemins ») : ses
-- deux réglages, gardés avec le compte de l'adulte comme ceux des fiches, et valables dans tous
-- ses projets. « Ce qui manque » : « demander » (par défaut) ou « completer » ; « Consignes » :
-- true (par défaut) ou false. Un objet vide : les réglages par défaut.
--
-- Rien d'autre : l'ajout d'un bloc passe par public.ajouter_au_plan (lot 2), d'un seul tenant,
-- et par l'ajout venu du plan (lot 1), qui n'arrête jamais celui qui écrit la scène d'origine.
alter table public.enseignants
  add column reglages_bloc jsonb not null default '{}'::jsonb
  check (jsonb_typeof(reglages_bloc) = 'object' and pg_column_size(reglages_bloc) < 500);

grant update (reglages_bloc) on public.enseignants to authenticated;
