-- Les livres de l'accueil, choisis dans l'administration (F14-AC40), décidé par le porteur le
-- 23 octobre 2026 : ils remplacent la variable d'environnement LIVRES_DE_L_ACCUEIL, qui demandait
-- un passage chez Vercel et un nouveau déploiement.
--
-- Deux livres au plus, dans l'ordre de l'accueil : { "code": le code du partage par lien,
-- "couverture": le chemin de la face avant déposée dans le seau des images, ou null }. Seuls les
-- livres du porteur, partagés par lien, s'y choisissent ; un partage retiré quitte l'accueil de
-- lui-même, l'accueil ne lisant que les partages par lien.

alter table public.reglages_application
  add column livres_de_l_accueil jsonb not null default '[]'::jsonb
  check (jsonb_typeof(livres_de_l_accueil) = 'array' and jsonb_array_length(livres_de_l_accueil) <= 2);
