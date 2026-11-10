-- « Texte vide » : le récit seul compte (F06.5, F06-AC105 ; précisé par le porteur le
-- 10 novembre 2026, après 20261110140000_texte_vide_sans_les_choix).
--
-- Une action de jeu et une image ne sont pas du texte non plus : le texte d'une scène est vide
-- tant qu'aucun paragraphe de récit n'y porte un mot. Une scène qui n'a qu'une image, une
-- action de jeu ou des choix reste « Texte vide ».
--
-- Le sens strict, rien du tout (prive.texte_sans_rien), ne change pas : ce qui garde un texte
-- — version précédente, « Ancien texte » d'un échange — garde aussi une image ou une action
-- seule. Les contrôles du Livre ne bloquent que la scène qui n'a rien à imprimer
-- (src/domaine/controles.ts).
create or replace function prive.texte_est_vide(p_texte jsonb) returns boolean
language sql immutable set search_path = ''
as $$
  select not jsonb_path_exists(p_texte, '$[*] ? (@.type == "p").children[*] ? (@.text like_regex "\\S")')
$$;

-- La colonne « texte_vide » est calculée à l'écriture : les scènes déjà en base dont l'état
-- change la retrouvent ici. Le texte n'est pas changé, ni sa version.
update public.scenes s set texte = s.texte where s.texte_vide is distinct from prive.texte_est_vide(s.texte);
