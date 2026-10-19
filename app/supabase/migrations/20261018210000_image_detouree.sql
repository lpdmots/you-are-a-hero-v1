-- « Détourée » devient une case à cocher, à tout cadrage, et non plus un cinquième cadrage
-- (18 octobre 2026, remarque du porteur) : la demande d'une image de scène la retient à part.
alter table public.demandes_d_images add column detouree boolean not null default false;
update public.demandes_d_images set detouree = true, cadrage = 'carre' where cadrage = 'detouree';
