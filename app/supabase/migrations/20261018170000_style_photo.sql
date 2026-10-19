-- Le style « Gouache d'album jeunesse », trop proche de « Illustration 2D lumineuse » une fois
-- celle-ci réécrite, laisse sa place à « Photo réaliste » (18 octobre 2026, demande du porteur).
-- Un projet qui avait choisi la gouache revient au style de l'application.
update public.projets set style_images = 'lumineuse' where style_images = 'gouache';
alter table public.projets drop constraint if exists projets_style_images_check;
alter table public.projets add constraint projets_style_images_check
  check (style_images in ('lumineuse', 'aquarelle', 'crayons', 'photo', 'papier', 'encre', 'autre'));
