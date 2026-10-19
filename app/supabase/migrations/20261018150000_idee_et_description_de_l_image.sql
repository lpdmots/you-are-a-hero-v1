-- Étape 8, lot 8 : l'adulte écrit l'idée et la description de l'image d'une scène (F10.2). La
-- migration `images_creees` les a ajoutées sans en donner l'écriture à l'adulte, dont les droits
-- sur les scènes se donnent colonne par colonne.
grant update (idee_image, description_image) on public.scenes to authenticated;
