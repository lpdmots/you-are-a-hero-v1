-- Bibliothèque publique des livres (F15), lot 7 : les livres de l'accueil, choisis parmi les livres
-- publiés (F14-AC40 révisé le 25 octobre 2026, F15-AC19).
--
-- Chaque livre de l'accueil se désigne désormais par son projet, et non plus par le code de son lien
-- de lecture, qui ne se crée plus : { "projet": l'identité du projet, "couverture": le chemin de la
-- face avant déposée, ou null }. L'accueil ne montre que les livres de la bibliothèque : un livre
-- retiré la quitte de lui-même, et il y revient avec sa couverture s'il est publié de nouveau.
--
-- Les entrées d'aujourd'hui — les deux livres du porteur, partagés par lien — gardent leur place et
-- leur couverture : leur code devient leur projet. Elles ne se montrent qu'une fois ces livres
-- publiés dans la bibliothèque (`npm run bibliotheque:accueil`).

update public.reglages_application r
set livres_de_l_accueil = coalesce((
  select jsonb_agg(jsonb_build_object('projet', pa.projet_id, 'couverture', e -> 'couverture') order by o)
  from jsonb_array_elements(r.livres_de_l_accueil) with ordinality as x(e, o)
  join public.partages pa on pa.code = e ->> 'code'
), '[]'::jsonb);
