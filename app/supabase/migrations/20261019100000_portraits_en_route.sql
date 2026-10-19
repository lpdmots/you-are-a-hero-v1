-- Étape 8, lot 9, le 19 octobre 2026, à la demande du porteur : le portrait d'un personnage et
-- l'image de référence d'un objet se demandent comme l'image de repérage d'un chapitre. La
-- demande part, l'adulte peut refermer le panneau ou quitter la page : l'image se crée côté
-- serveur et la première se pose d'office à son arrivée, sauf si l'adulte a choisi un autre
-- portrait entre-temps ; la seconde attend dans le panneau de la carte. Avant, les images
-- créées se perdaient quand on refermait le panneau sans les garder.

alter table public.demandes_d_images drop constraint demandes_d_images_cible_check;
alter table public.demandes_d_images add constraint demandes_d_images_cible_check
  check (cible in ('projet', 'partie', 'chapitre', 'scene', 'personnage', 'objet'));
