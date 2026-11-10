-- Construire dans « Chemins », lot 1, correctif : les retouches du plan se lisent dans l'ordre
-- où elles ont été faites (F08-AC44).
--
-- prive.retouches_depuis (20261110100000_ajout_du_plan) écartait de ce qui est ajouté tout bloc
-- retiré depuis la même version, sans regarder lequel des deux gestes était le dernier. Un choix
-- supprimé depuis « Chemins » puis remis par « Annuler » — retiré, puis ajouté de nouveau sous
-- la même identité — sortait alors de la copie de celui qui écrivait la scène, à son
-- enregistrement suivant. Pour chaque bloc, c'est désormais le dernier geste qui compte.
create or replace function prive.retouches_depuis(p_scene uuid, p_version integer, out nombre integer, out ajoute jsonb, out retire uuid[])
language sql stable security definer set search_path = ''
as $$
  with r as (
    select x.version, x.ajoute, x.retire from public.retouches_du_plan x where x.scene_id = p_scene and x.version > p_version
  ), gestes as (
    select lower(b.bloc ->> 'id') as id, r.version, true as pose, b.bloc, b.n
    from r cross join lateral jsonb_array_elements(r.ajoute) with ordinality as b (bloc, n)
    union all
    select i::text, r.version, false, null::jsonb, 0::bigint
    from r cross join lateral unnest(r.retire) as i
  ), dernier as (
    -- Une même retouche ne pose et ne retire jamais le même bloc : la version suffit à les ordonner
    select distinct on (g.id) g.id, g.version, g.pose, g.bloc, g.n from gestes g order by g.id, g.version desc
  )
  select
    (select count(*)::integer from r),
    (select coalesce(jsonb_agg(d.bloc order by d.version, d.n), '[]'::jsonb) from dernier d where d.pose),
    (select coalesce(array_agg(d.id::uuid), '{}'::uuid[]) from dernier d where not d.pose)
$$;
