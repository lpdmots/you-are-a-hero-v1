-- La recherche de l'élève (F05-AC48) : l'extrait répétait chaque paragraphe. En mode souple, le
-- chemin « .** » visite chaque texte deux fois (déballage automatique des listes) ; en mode strict,
-- une fois. Rien d'autre ne change : mêmes colonnes, mêmes droits.
create or replace function public.scenes_a_chercher()
returns table (id uuid, reference integer, titre text, chapitre_id uuid, chapitre text, couleur smallint, consigne text, mots text)
language sql stable security definer set search_path = ''
as $$
  select s.id, s.reference, s.titre, c.id, c.titre, c.couleur,
         case when (select prive.profil_dans(c.id)) is not null then s.consigne end,
         coalesce((
           select string_agg(m #>> '{}', ' ')
           from jsonb_path_query(s.texte, 'strict $[*] ? (@.type != "note").**.text') m
         ), '') || ' ' || coalesce((
           select string_agg(coalesce(b ->> 'libelle', b ->> 'legende'), ' ')
           from jsonb_array_elements(s.texte) b where b ->> 'type' in ('choix', 'image')
         ), '')
  from public.scenes s
  join public.chapitres c on c.id = s.chapitre_id
  join public.parties pa on pa.id = c.partie_id
  where s.supprime_le is null and (select prive.scenes_lisibles(c.id))
  order by pa.rang, c.rang, s.rang
$$;
