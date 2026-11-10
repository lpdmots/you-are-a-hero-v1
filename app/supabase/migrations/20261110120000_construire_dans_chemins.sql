-- Construire dans « Chemins », lot 2 : les gestes à la main (F03.1, F03-AC52 à AC57).
--
-- « + » sous une scène crée une scène et le choix qui y mène ; un lien tiré ne crée que le
-- choix. Les deux passent par la même fonction, d'un seul tenant : une scène n'existe jamais
-- sans le choix qui la relie, ni le choix sans elle. Le bloc de scènes (F13.7) s'en servira
-- pour ajouter plusieurs scènes et leurs choix d'un coup.
--
-- p_scenes : les nouvelles scènes, [{ cle, titre, consigne?, verification? }] ; « cle » est le
-- nom que l'appel donne à chacune pour y relier ses choix.
-- p_choix : [{ de, vers, bloc }] ; « de » et « vers » sont une scène du chapitre (son
-- identité) ou une nouvelle scène (sa clé) ; « bloc » est la phrase de choix automatique,
-- sans destination, que la fonction complète.
-- Rend { scenes: [{ cle, id, reference }] }.
create function public.ajouter_au_plan(p_chapitre uuid, p_scenes jsonb, p_choix jsonb) returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  v_scenes jsonb := coalesce(p_scenes, '[]'::jsonb);
  v_choix jsonb := coalesce(p_choix, '[]'::jsonb);
  v_creees jsonb := '{}'::jsonb;
  v_rendu jsonb := '[]'::jsonb;
  v_scene record;
  v_neuve record;
  v_de record;
begin
  -- Le chapitre est à qui demande, dans le plan, en récit à choix
  if not exists (
    select 1
    from public.chapitres c
    join public.parties pa on pa.id = c.partie_id
    join public.projets p on p.id = c.projet_id
    where c.id = p_chapitre and c.enseignant_id = (select auth.uid())
      and c.supprime_le is null and pa.supprime_le is null and p.recit = 'choix'
  ) then
    raise exception 'Ce chapitre n''existe pas.' using errcode = 'P0001';
  end if;
  if jsonb_typeof(v_scenes) <> 'array' or jsonb_typeof(v_choix) <> 'array'
     or jsonb_array_length(v_scenes) > 12 or jsonb_array_length(v_choix) > 40
     or jsonb_array_length(v_scenes) + jsonb_array_length(v_choix) = 0 then
    raise exception 'Cet ajout ne peut pas être fait.' using errcode = 'P0001';
  end if;

  -- Les nouvelles scènes, à la fin du chapitre, dans l'ordre donné : sans texte, sans élève
  for v_scene in
    select s.scene, s.n from jsonb_array_elements(v_scenes) with ordinality as s (scene, n) order by s.n
  loop
    if coalesce(v_scene.scene ->> 'cle', '') = '' or v_creees ? (v_scene.scene ->> 'cle') then
      raise exception 'Cet ajout ne peut pas être fait.' using errcode = 'P0001';
    end if;
    select a.scene_id, a.reference into v_neuve from prive.ajouter_scene(p_chapitre, null) a;
    update public.scenes sc
    set titre = nullif(left(btrim(regexp_replace(coalesce(v_scene.scene ->> 'titre', ''), '\s+', ' ', 'g')), 120), ''),
        consigne = left(btrim(coalesce(v_scene.scene ->> 'consigne', '')), 4000),
        verification = coalesce(
          (select array_agg(left(btrim(e), 80)) from jsonb_array_elements_text(
             case when jsonb_typeof(v_scene.scene -> 'verification') = 'array' then v_scene.scene -> 'verification' else '[]'::jsonb end
           ) with ordinality as x (e, k) where btrim(e) <> '' and k <= 8),
          '{}'::text[])
    where sc.id = v_neuve.scene_id;
    v_creees := v_creees || jsonb_build_object(v_scene.scene ->> 'cle', v_neuve.scene_id);
    v_rendu := v_rendu || jsonb_build_object('cle', v_scene.scene ->> 'cle', 'id', v_neuve.scene_id, 'reference', v_neuve.reference);
  end loop;

  -- Chaque choix part d'une scène du chapitre et mène à une scène du chapitre (F03.1 : un
  -- choix vers un autre chapitre se règle dans la copie)
  if exists (
    select 1
    from jsonb_array_elements(v_choix) as c (choix)
    cross join lateral (values (c.choix ->> 'de'), (c.choix ->> 'vers')) as bout (nom)
    where bout.nom is null
       or not (v_creees ? bout.nom
               or exists (select 1 from public.scenes s where s.id::text = bout.nom and s.chapitre_id = p_chapitre and s.supprime_le is null))
  ) or exists (
    select 1 from jsonb_array_elements(v_choix) as c (choix)
    where c.choix -> 'bloc' ->> 'type' is distinct from 'choix' or c.choix -> 'bloc' -> 'auto' is distinct from 'true'::jsonb
  ) then
    raise exception 'Cette scène n''est plus dans le chapitre.' using errcode = 'P0001';
  end if;

  -- Les choix de chaque scène d'origine se posent à la fin de son texte, d'une seule retouche
  -- (F08-AC44 : celui qui l'écrit n'est pas arrêté). Dans l'ordre des identités, pour que deux
  -- ajouts croisés ne s'attendent jamais l'un l'autre.
  for v_de in
    select coalesce(v_creees ->> (c.choix ->> 'de'), c.choix ->> 'de')::uuid as scene,
           jsonb_agg(
             (c.choix -> 'bloc') || jsonb_build_object('cible', coalesce(v_creees ->> (c.choix ->> 'vers'), c.choix ->> 'vers'))
             order by c.n
           ) as blocs
    from jsonb_array_elements(v_choix) with ordinality as c (choix, n)
    group by 1
    order by 1
  loop
    perform prive.retoucher_texte(v_de.scene, v_de.blocs, '{}'::uuid[]);
  end loop;

  return jsonb_build_object('scenes', v_rendu);
end
$$;

revoke execute on function public.ajouter_au_plan(uuid, jsonb, jsonb) from public, anon, authenticated, poste;
grant execute on function public.ajouter_au_plan(uuid, jsonb, jsonb) to authenticated, service_role;
