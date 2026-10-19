-- Deux styles d'images de plus, « Bande dessinée, ligne claire » et « Pixel art », pour remplir la
-- grille des styles (18 octobre 2026, demande du porteur).
alter table public.projets drop constraint if exists projets_style_images_check;
alter table public.projets add constraint projets_style_images_check
  check (style_images in ('lumineuse', 'aquarelle', 'crayons', 'photo', 'volume', 'bd', 'pixel', 'encre', 'autre'));
