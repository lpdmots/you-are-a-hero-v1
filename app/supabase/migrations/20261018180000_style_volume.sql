-- « Papier découpé », dont l'exemple ressemblait à l'illustration 2D, laisse sa place à « Dessin
-- animé en volume » (18 octobre 2026, demande du porteur). Un projet en papier découpé revient au
-- style de l'application.
update public.projets set style_images = 'lumineuse' where style_images = 'papier';
alter table public.projets drop constraint if exists projets_style_images_check;
alter table public.projets add constraint projets_style_images_check
  check (style_images in ('lumineuse', 'aquarelle', 'crayons', 'photo', 'volume', 'encre', 'autre'));
