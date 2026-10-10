-- Étape 3, lot 4 : objets de l'histoire et actions de jeu dans la copie (F04.2).
--
-- Les deux listes sont tenues par l'adulte, dans la préparation, à laquelle un élève
-- n'accède pas. Depuis la scène où il écrit, il consulte les objets, en lecture seule
-- (F04-AC28) ; les formules d'action ne sont proposées qu'à qui peut écrire une action de
-- jeu : le profil « écriture et organisation », dans un récit à choix (F04-AC25).

create function public.jeu_de_la_scene(p_scene uuid) returns jsonb
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
      select jsonb_agg(jsonb_build_object('id', f.id, 'texte', f.texte) order by f.cree_le, f.id)
      from public.formules f where f.projet_id = s.projet_id), '[]'::jsonb) else '[]'::jsonb end
  );
end
$$;

revoke all on function public.jeu_de_la_scene(uuid) from public, anon, authenticated;
grant execute on function public.jeu_de_la_scene(uuid) to poste, service_role;

-- La remise des notes (lot 3) ne s'appelle que depuis les fonctions d'enregistrement
revoke execute on function prive.remettre_les_notes(jsonb, jsonb) from public, anon, authenticated, poste;
grant execute on function prive.remettre_les_notes(jsonb, jsonb) to service_role;
