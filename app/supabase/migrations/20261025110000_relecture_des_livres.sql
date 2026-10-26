-- Bibliothèque publique des livres (F15), lot 2 : la relecture par l'IA, puis par le porteur.
--
-- À chaque proposition et à chaque mise à jour, l'IA lit la proposition entière, textes et
-- images, pour l'âge de ses lecteurs, et rend un rapport court : rien, ou quelques points, chacun
-- avec son passage et la phrase en cause (F15-AC03). Elle ne décide rien. Le rapport vaut pour la
-- proposition en attente : une nouvelle proposition l'efface. Son coût est celui du journal des
-- appels (`appels_ia`), au compte du porteur, sans étoile débitée à l'adulte qui propose ; il est
-- gardé ici pour le montrer à côté du rapport.

alter table public.publications
  -- { points: [{ passage, repere, phrase, motif, explication }] } ; rien avant l'analyse
  add column rapport jsonb check (rapport is null or (jsonb_typeof(rapport) = 'object' and octet_length(rapport::text) <= 65536)),
  -- « en_cours » : l'analyse est partie ; « fait » : le rapport est là ; « echec » : à relancer
  add column rapport_etat text check (rapport_etat is null or rapport_etat in ('en_cours', 'fait', 'echec')),
  add column rapport_le timestamptz,
  add column rapport_cout_usd numeric(10, 6) check (rapport_cout_usd is null or rapport_cout_usd >= 0);
