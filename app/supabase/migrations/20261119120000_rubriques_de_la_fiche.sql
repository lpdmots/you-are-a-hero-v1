-- Les rubriques à cocher de la fiche de l'histoire (F02.1, décidé par le porteur le 19 novembre
-- 2026) : une case par rubrique, jamais par élément, derrière « Réglages » sur l'écran de la fiche.
-- Tout est coché par défaut ; le projet garde la liste des rubriques décochées, pour ne pas tout
-- recocher à chaque réimpression.
--
-- Comme la Préparation, ce réglage ne regarde que l'adulte : le poste d'un élève ne lit des
-- projets que les colonnes qui lui sont accordées, et celle-ci n'en est pas.

alter table public.projets
  add column fiche_masquee text[] not null default '{}'
    check (fiche_masquee <@ array['univers', 'enjeu', 'heros', 'autres', 'parties', 'objets', 'ecriture', 'feuille']::text[]);
grant update (fiche_masquee) on public.projets to authenticated;
