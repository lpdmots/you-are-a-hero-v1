-- Couverture faite sur le site, lot 1 (F11.4, « Couverture faite sur le site », 26 octobre 2026).
--
-- La couverture du projet est une image du projet, créée par l'IA ou importée, comme l'image de
-- repérage : la même clé étrangère vers l'image et son projet. Une image créée garde les textes
-- que le modèle devait y écrire (« textes demandés ») : la relecture de la bibliothèque les compare
-- à l'image (F11-AC115) ; une couverture importée n'en a pas. Les cases de « Écrire sur la
-- couverture » restent avec le projet, d'une demande à l'autre.

alter table public.projets
  add column couverture_id uuid,
  -- { "titre": { "coche": true, "texte": null }, … } : un texte null reprend la page de titre
  add column couverture_cases jsonb not null default '{}'::jsonb check (jsonb_typeof(couverture_cases) = 'object' and pg_column_size(couverture_cases) <= 4000),
  add constraint projets_couverture_fk foreign key (couverture_id, id) references public.images (id, projet_id);
create index projets_couverture_idx on public.projets (couverture_id);

alter table public.images
  add column textes_demandes jsonb check (textes_demandes is null or (jsonb_typeof(textes_demandes) = 'array' and pg_column_size(textes_demandes) <= 2000));

-- Une demande d'image peut viser la couverture d'un projet (son identité est celle du projet)
alter table public.demandes_d_images drop constraint demandes_d_images_cible_check;
alter table public.demandes_d_images add constraint demandes_d_images_cible_check
  check (cible in ('projet', 'partie', 'chapitre', 'scene', 'personnage', 'objet', 'couverture'));
