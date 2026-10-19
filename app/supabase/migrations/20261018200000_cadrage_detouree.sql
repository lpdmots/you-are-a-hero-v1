-- Le cadre « Détourée » d'une image de scène : le sujet seul, sur fond transparent (18 octobre 2026,
-- demande du porteur). Une demande d'image peut le retenir.
alter table public.demandes_d_images drop constraint if exists demandes_d_images_cadrage_check;
alter table public.demandes_d_images add constraint demandes_d_images_cadrage_check
  check (cadrage in ('pleine-page', '3:2', '16:9', 'carre', 'detouree'));
