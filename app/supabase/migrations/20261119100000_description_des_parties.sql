-- La description d'une partie (F02.1, révisé par le porteur le 19 novembre 2026), à la place de
-- la liste « Lieux » de l'Univers, retirée : les parties sont le plus souvent des lieux. Une
-- description courte et facultative, l'endroit, l'ambiance, ce qu'on y trouve ; ce n'est pas un
-- résumé narratif, qui reste au chapitre (F02). Elle s'écrit sur la carte de la partie à l'étape
-- « Grandes étapes » et dans ses réglages, entre dans le contexte des aides demandées sur une
-- scène de la partie et s'imprime sur la fiche de l'histoire.
--
-- Comme la Préparation, elle ne regarde que l'adulte : le poste d'un élève ne lit des parties
-- que les colonnes qui lui sont accordées, et celle-ci n'en est pas.

alter table public.parties
  add column description text not null default '' check (char_length(description) <= 300);
grant update (description) on public.parties to authenticated;
