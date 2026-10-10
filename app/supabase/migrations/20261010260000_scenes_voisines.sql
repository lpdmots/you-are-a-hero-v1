-- Étape 3, lot 6 : l'aperçu des scènes voisines pendant l'écriture (F04.3).
--
-- Une seule fonction pour l'adulte et pour le poste d'un élève : elle ne rend d'une scène
-- voisine que ce que la personne a le droit d'en lire. L'extrait est court — la fin de la
-- scène d'avant, le début de la scène d'après — et ne porte jamais de note de l'enseignant.

-- « Afficher les scènes voisines » : conservée avec le compte de l'adulte et avec le profil
-- de l'élève, qu'elle suit d'un poste à l'autre. Cochée par défaut (F04-AC08, AC13).
alter table public.enseignants add column voisines boolean not null default true;
alter table public.eleves add column voisines boolean not null default true;
grant update (voisines) on public.enseignants to authenticated;

create function public.voisines_affichees() returns boolean
language sql stable security definer set search_path = ''
as $$
  select coalesce((select e.voisines from public.eleves e where e.id = (select prive.eleve_au_travail())), true)
$$;

create function public.regler_voisines(p_affiche boolean) returns void
language sql security definer set search_path = ''
as $$
  update public.eleves set voisines = coalesce(p_affiche, true) where id = (select prive.eleve_au_travail())
$$;

-- Un paragraphe de récit qui a quelque chose à lire : des mots, ou une image sur la ligne
create function prive.paragraphe_ecrit(p_bloc jsonb) returns boolean
language sql immutable set search_path = ''
as $$
  select p_bloc ->> 'type' = 'p'
    and jsonb_path_exists(p_bloc, '$.children[*] ? (@.text like_regex "\\S" || @.type == "image-ligne")')
$$;

-- Les scènes voisines d'une scène. Récit à choix : celles dont un choix ou une liaison
-- cachée mène ici, dans l'ordre du plan, et les destinations de ses choix, dans leur ordre.
-- Récit classique : la scène d'avant et celle d'après dans le plan, d'un chapitre à l'autre.
create function public.voisines_de_la_scene(p_scene uuid)
returns table (
  sens text, scene_id uuid, reference integer, titre text, chapitre text, lisible boolean, vide boolean, cache boolean, libelle text,
  -- Le dernier paragraphe de récit de la scène d'avant, ou le premier de la scène d'après
  extrait jsonb,
  -- La phrase de choix qui mène ici, pour la scène d'avant
  phrase jsonb,
  -- La scène voisine a-t-elle d'autres paragraphes de récit que celui de l'extrait ?
  suite boolean,
  rang bigint
)
language plpgsql stable security definer set search_path = ''
as $$
declare
  s record;
  v_adulte boolean;
begin
  select sc.id, sc.chapitre_id, sc.projet_id, sc.enseignant_id, p.recit into s
  from public.scenes sc join public.projets p on p.id = sc.projet_id
  where sc.id = p_scene and sc.supprime_le is null;
  if not found then
    return;
  end if;
  v_adulte := s.enseignant_id = (select auth.uid());
  if not v_adulte and ((select prive.eleve_au_travail()) is null or not (select prive.scenes_lisibles(s.chapitre_id))) then
    return;
  end if;

  return query
  with ordre as (
    select sc.id, (row_number() over (order by pa.rang, pa.cree_le, c.rang, c.cree_le, sc.rang, sc.cree_le))::integer as n
    from public.scenes sc
    join public.chapitres c on c.id = sc.chapitre_id
    join public.parties pa on pa.id = c.partie_id
    where sc.projet_id = s.projet_id and sc.supprime_le is null and c.supprime_le is null and pa.supprime_le is null
  ), liees as (
    -- Qui mène ici
    select 'avant'::text as sens, l.scene_id as autre, l.cache, l.libelle, l.renvoi_id, (select o.n from ordre o where o.id = l.scene_id)::bigint * 10000000 + l.rang as rang
    from public.liens l
    where s.recit = 'choix' and l.cible_id = p_scene and l.scene_id <> p_scene
    union all
    -- Où mène cette scène
    select 'apres', l.cible_id, l.cache, l.libelle, l.renvoi_id, l.rang::bigint
    from public.liens l
    where s.recit = 'choix' and l.scene_id = p_scene and l.cible_id is not null and l.cible_id <> p_scene
    union all
    -- Récit classique : l'ordre du plan
    select 'avant', v.id, false, '', null::uuid, 0::bigint
    from ordre moi join ordre v on v.n = moi.n - 1
    where s.recit <> 'choix' and moi.id = p_scene
    union all
    select 'apres', v.id, false, '', null::uuid, 0::bigint
    from ordre moi join ordre v on v.n = moi.n + 1
    where s.recit <> 'choix' and moi.id = p_scene
  ), voisines as (
    -- Une scène voisine ne figure qu'une fois de chaque côté : par son premier lien, un choix avant une liaison cachée
    select distinct on (li.sens, li.autre) li.sens, li.autre, li.cache, li.libelle, li.renvoi_id, li.rang
    from liees li
    join ordre o on o.id = li.autre
    order by li.sens, li.autre, li.cache, li.rang
  )
  select
    v.sens, x.id,
    case when d.lisible then x.reference end,
    case when d.lisible then x.titre end,
    c.titre, d.lisible, x.texte_vide, v.cache, v.libelle,
    case when d.lisible then (
      select b.bloc from jsonb_array_elements(x.texte) with ordinality as b (bloc, n)
      where prive.paragraphe_ecrit(b.bloc)
      order by case when v.sens = 'avant' then -b.n else b.n end limit 1
    ) end,
    case when d.lisible and v.sens = 'avant' and not v.cache and v.renvoi_id is not null then (
      select b.bloc from jsonb_array_elements(x.texte) as b (bloc)
      where b.bloc ->> 'type' = 'choix'
        and (b.bloc ->> 'id' = v.renvoi_id::text
          or jsonb_path_exists(b.bloc, '$.children[*] ? (@.type == "renvoi" && @.id == $r)', jsonb_build_object('r', v.renvoi_id::text)))
      limit 1
    ) end,
    d.lisible and (select count(*) from jsonb_array_elements(x.texte) as b (bloc) where prive.paragraphe_ecrit(b.bloc)) > 1,
    v.rang
  from voisines v
  join public.scenes x on x.id = v.autre
  join public.chapitres c on c.id = x.chapitre_id
  cross join lateral (
    select v_adulte or (select prive.scenes_lisibles(x.chapitre_id)) as lisible,
           v_adulte or (select prive.profil_dans(x.chapitre_id)) is not null as attribue
  ) d
  -- Une liaison cachée dont l'autre bout est hors du périmètre de l'élève n'apparaît pas (F04-AC37)
  where not v.cache or d.attribue
  order by v.sens, v.rang;
end
$$;

revoke all on function public.voisines_affichees(), public.regler_voisines(boolean), public.voisines_de_la_scene(uuid) from public, anon, authenticated;
revoke execute on function prive.paragraphe_ecrit(jsonb) from public, anon, authenticated, poste;
grant execute on function prive.paragraphe_ecrit(jsonb) to service_role;
grant execute on function public.voisines_affichees(), public.regler_voisines(boolean) to poste, service_role;
grant execute on function public.voisines_de_la_scene(uuid) to authenticated, poste, service_role;
