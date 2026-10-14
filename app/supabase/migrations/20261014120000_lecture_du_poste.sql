-- Étape 5 du plan, lot 4 : ce que le poste d'un élève reçoit pour la lecture d'essai (F09.1).
-- Une seule fonction, sans table. C'est la base qui décide de ce qui part : les chapitres que
-- l'élève lit — les siens, ou tous quand l'enseignant a ouvert la lecture (F06.2) —, et rien
-- d'un chapitre fermé, pas même un titre de scène (F09-AC23). Rien ne lui dit qu'une scène est
-- exclue du livre, ni dans quel état elle est.

create function public.lecture_du_poste(p_projet uuid) returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
declare
  p record;
begin
  -- Un élève identifié, au travail, dans un projet de sa classe ; hors des horaires, rien
  if (select prive.eleve_au_travail()) is null or not (select prive.projet_du_poste(p_projet)) then
    return null;
  end if;
  select pr.recit, pr.lecture_ouverte, pr.depart_scene_id into p from public.projets pr where pr.id = p_projet;

  return (
    with lisibles as (
      select c.id, c.titre, c.couleur, (select prive.profil_dans(c.id)) is not null as mien,
             row_number() over (order by pa.rang, pa.cree_le, c.rang, c.cree_le) as ordre
      from public.chapitres c
      join public.parties pa on pa.id = c.partie_id
      where c.projet_id = p_projet and c.supprime_le is null and pa.supprime_le is null
        and (select prive.scenes_lisibles(c.id))
    ),
    lues as (
      select s.id, s.chapitre_id, s.titre, s.fin, s.texte_vide,
             -- Le texte sans les notes de l'enseignant, que le poste ne reçoit jamais (F05.2)
             jsonb_path_query_array(s.texte, '$[*] ? (@.type != "note")') as texte,
             row_number() over (order by l.ordre, s.rang, s.cree_le) as ordre
      from public.scenes s
      join lisibles l on l.id = s.chapitre_id
      where s.supprime_le is null
    )
    select jsonb_build_object(
      'recit', p.recit,
      'lecture_ouverte', p.lecture_ouverte,
      -- Le départ du livre, seulement quand la lecture est ouverte (F09-AC22)
      'depart', case when p.lecture_ouverte and exists (select 1 from lues x where x.id = p.depart_scene_id) then p.depart_scene_id end,
      'chapitres', (select coalesce(jsonb_agg(jsonb_build_object('id', l.id, 'titre', l.titre, 'couleur', l.couleur, 'mien', l.mien) order by l.ordre), '[]'::jsonb) from lisibles l),
      'scenes', (select coalesce(jsonb_agg(jsonb_build_object('id', x.id, 'chapitre', x.chapitre_id, 'titre', x.titre, 'fin', x.fin, 'vide', x.texte_vide, 'texte', x.texte) order by x.ordre), '[]'::jsonb) from lues x),
      -- Les scènes où mène un chemin, hors des chapitres que l'élève lit, qui existent encore :
      -- une suite à découvrir, et non une destination manquante. Rien d'autre sur elles.
      'ailleurs', (
        select coalesce(jsonb_agg(distinct d.id), '[]'::jsonb)
        from public.liens li
        join lues o on o.id = li.scene_id
        join public.scenes d on d.id = li.cible_id
        where d.supprime_le is null and (select prive.chapitre_dans_le_plan(d.chapitre_id))
          and not exists (select 1 from lues x where x.id = d.id)
      ),
      -- De la préparation, ce dont la lecture a besoin, et rien d'autre (F02-AC04)
      'formule', pre.formule_renvoi,
      'marque_fin', pre.marque_fin,
      'feuille', case when pre.feuille ->> 'on' = 'true' then pre.feuille end,
      'regles', pre.regles
    )
    from public.preparations pre
    where pre.projet_id = p_projet
  );
end
$$;

revoke execute on function public.lecture_du_poste(uuid) from public, anon, authenticated;
grant execute on function public.lecture_du_poste(uuid) to poste, service_role;
