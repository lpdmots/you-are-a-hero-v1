-- Revue de l'étape 3 (11 octobre 2026) : une formule d'action porte un signe (F04.2,
-- F04-AC41).
--
-- Le signe se lit devant l'action de jeu, dans la copie comme dans le livre : le crayon
-- par défaut, pour ce qui se note sur la feuille d'aventure ; le dé, le sac, le cœur. Il se
-- choisit avec la formule, dans la préparation ou depuis la scène, et l'action née de la
-- formule le reprend. Les formules déjà écrites gardent le crayon.

alter table public.formules
  add column signe text not null default 'crayon' check (signe in ('crayon', 'de', 'sac', 'coeur'));

-- Le poste qui peut écrire une action de jeu reçoit le signe avec la formule
create or replace function public.jeu_de_la_scene(p_scene uuid) returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
declare
  s record;
  v_profil text;
begin
  select sc.chapitre_id, sc.projet_id, p.recit into s
  from public.scenes sc join public.projets p on p.id = sc.projet_id
  where sc.id = p_scene and sc.supprime_le is null;
  if not found or (select prive.eleve_au_travail()) is null or not (select prive.scenes_lisibles(s.chapitre_id)) then
    return null;
  end if;
  v_profil := (select prive.profil_dans(s.chapitre_id));
  -- Les objets servent à qui écrit ici : un lecteur d'un autre chapitre n'en reçoit rien
  if v_profil is null then
    return jsonb_build_object('objets', '[]'::jsonb, 'formules', '[]'::jsonb);
  end if;
  return jsonb_build_object(
    'objets', coalesce((
      select jsonb_agg(jsonb_build_object('id', o.id, 'nom', o.nom, 'description', o.description) order by o.cree_le, o.id)
      from public.objets o where o.projet_id = s.projet_id), '[]'::jsonb),
    'formules', case when v_profil = 'organisation' and s.recit = 'choix' then coalesce((
      select jsonb_agg(jsonb_build_object('id', f.id, 'texte', f.texte, 'signe', f.signe) order by f.cree_le, f.id)
      from public.formules f where f.projet_id = s.projet_id), '[]'::jsonb) else '[]'::jsonb end
  );
end
$$;
