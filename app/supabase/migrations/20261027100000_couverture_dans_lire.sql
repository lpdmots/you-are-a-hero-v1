-- Couverture faite sur le site, lot 3 (F11.4, F11-AC114) : « Lire », côté élève, montre la
-- couverture d'un livre, figée dans sa version partagée ou publiée (lot 2), à la place de sa page
-- de titre. Les deux étagères rendent son identité ; le reste ne change pas.

drop function public.livres_du_poste();
create function public.livres_du_poste()
returns table (projet_id uuid, titre text, a_choix boolean, ligne text, de_ma_classe boolean, passages integer, chapitres integer, image uuid, couverture uuid, partage_le timestamptz)
language sql stable security definer set search_path = ''
as $$
  select pa.projet_id,
         pa.version ->> 'titre',
         coalesce((pa.version ->> 'aChoix')::boolean, false),
         nullif(pa.version -> 'presentation' -> 'titre' ->> 'ligne', ''),
         p.classe_id is not distinct from (select prive.classe_lisible_du_poste()),
         jsonb_array_length(pa.version -> 'passages'),
         (select count(*)::integer from jsonb_array_elements(pa.version -> 'passages') x where jsonb_typeof(x -> 'chapitre') = 'object'),
         coalesce(pa.version -> 'presentation' -> 'titre' ->> 'image', pa.version -> 'presentation' -> 'titre' ->> 'illustration')::uuid,
         (pa.version -> 'couverture' ->> 'id')::uuid,
         pa.etat_du
  from public.partages pa
  join public.projets p on p.id = pa.projet_id
  where (select prive.eleve_du_poste()) is not null
    and pa.aux_classes
    and pa.version is not null
    and pa.enseignant_id = (select prive.enseignant_lisible_du_poste())
  order by p.classe_id is not distinct from (select prive.classe_lisible_du_poste()) desc, pa.etat_du desc
$$;
revoke all on function public.livres_du_poste() from public, anon, authenticated;
grant execute on function public.livres_du_poste() to poste, service_role;

drop function public.bibliotheque_du_poste();
create function public.bibliotheque_du_poste()
returns table (adresse text, titre text, a_choix boolean, page jsonb, images jsonb, dernier integer, presentation text, age text, coeurs integer, donne boolean, publiee_le timestamptz, couverture uuid)
language sql stable security definer set search_path = ''
as $$
  select pu.adresse,
         pu.version ->> 'titre',
         coalesce((pu.version ->> 'aChoix')::boolean, false),
         pu.version -> 'presentation' -> 'titre',
         pu.version -> 'images',
         (pu.version -> 'passages' -> -1 ->> 'numero')::integer,
         pu.presentation,
         pu.age,
         pu.coeurs,
         exists (select 1 from public.coeurs co where co.projet_id = pu.projet_id and co.lecteur = 'e:' || (select prive.eleve_du_poste())::text),
         pu.publiee_le,
         (pu.version -> 'couverture' ->> 'id')::uuid
  from public.publications pu
  join public.classes c on c.id = (select prive.classe_lisible_du_poste())
  where pu.version is not null
    and (select prive.eleve_du_poste()) is not null
    and c.bibliotheque_dans_lire
    and pu.age <> 'adultes'
    and pu.age = (select prive.age_de_la_classe(c.id))
    and not exists (
      select 1 from public.partages pa
      where pa.projet_id = pu.projet_id and pa.aux_classes and pa.version is not null
        and pa.enseignant_id = (select prive.enseignant_lisible_du_poste())
    )
  order by pu.publiee_le desc
$$;
revoke all on function public.bibliotheque_du_poste() from public, anon, authenticated;
grant execute on function public.bibliotheque_du_poste() to poste, service_role;
