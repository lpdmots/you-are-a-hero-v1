-- Étape 6, lot 3 : les réglages du livre et ses pages de présentation (F11.3, F11.4).
--
-- Deux documents de l'adulte, gardés avec le projet : les réglages de « Texte et pages »
-- (police, taille, alignement, marges, bas de page, titres, nouvelles pages) et la forme des
-- pages de présentation (modèle et ses textes, ou image pleine page). Vides, le livre prend les
-- réglages de départ et les pages proposées par défaut : rien n'est à remplir pour composer.

alter table public.projets
  add column mise_en_page jsonb check (mise_en_page is null or jsonb_typeof(mise_en_page) = 'object'),
  add column pages_du_livre jsonb check (pages_du_livre is null or jsonb_typeof(pages_du_livre) = 'object'),
  -- « Mettre en page » s'ouvre quand « Relire » et « Vérifier les chemins » sont terminées, puis ne
  -- se referme plus (F11.6) : la date de la première ouverture le retient
  add column mise_en_page_ouverte_le timestamptz;

grant update (mise_en_page, pages_du_livre, mise_en_page_ouverte_le) on public.projets to authenticated;
