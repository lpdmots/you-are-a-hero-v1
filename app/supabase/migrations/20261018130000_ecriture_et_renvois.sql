-- Étape 8, reprise du lot 7 : la façon d'écrire du livre, et le renvoi au « vous » (F13, F05),
-- décidés par le porteur le 18 octobre 2026.
--
-- Un livre à plusieurs héros peut être écrit au « vous », un autre au passé : l'adulte le dit
-- aux aides IA en une ligne, réglée avec le projet (« Pour l'IA, notre façon d'écrire »). Les
-- phrases de choix suivent : « rendez-vous au 12 » et « allez au 12 » rejoignent « rends-toi
-- au 12 », « va au 12 » et la flèche.

alter table public.projets
  add column consigne_ecriture text not null default '' check (char_length(consigne_ecriture) <= 300);
grant update (consigne_ecriture) on public.projets to authenticated;

alter table public.preparations
  drop constraint preparations_formule_renvoi_check,
  add constraint preparations_formule_renvoi_check check (formule_renvoi in ('rends', 'va', 'fleche', 'rendez', 'allez'));
