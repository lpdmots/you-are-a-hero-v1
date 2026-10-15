-- Étape 6, lot 6 : l'ordre des passages (F11.5, F11.6).
--
-- « Réordonner les passages » récrit les rangs gardés par `placer_passages` (lot 4) ; ce qui
-- s'ajoute ici, c'est ce que l'adulte a décidé de l'ordre, et de quoi voir naître un doute :
-- la page de chaque passage au moment de la décision. Quand une scène ou un réglage fait
-- passer un passage sur une autre page, la section « Ordre des passages » le demande.

alter table public.projets
  -- L'ordre est décidé : « reordonne » ou « garde » ; rien tant que l'adulte n'a pas répondu
  add column ordre_decision text check (ordre_decision in ('reordonne', 'garde')),
  -- La page de chaque passage quand l'ordre a été décidé ; rien : elle se relève à la prochaine composition
  add column ordre_pages jsonb check (ordre_pages is null or jsonb_typeof(ordre_pages) = 'object'),
  -- Le dernier déplacement fait à la main : « Réordonner à nouveau » l'abandonne, après avertissement (F11-AC81)
  add column ordre_retouche_le timestamptz,
  -- Le dernier agencement : un déplacement fait avant lui n'est plus à abandonner
  add column ordre_agence_le timestamptz;

grant update (ordre_decision, ordre_pages, ordre_retouche_le, ordre_agence_le) on public.projets to authenticated;
