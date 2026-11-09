-- La liste de vérification d'une scène (F13.2, F07.2, F07.4 ; décidée par le porteur le 9 novembre 2026).
--
-- Sous la consigne, quelques éléments courts que l'élève coche en se relisant (« Décrire le garde. »).
-- L'adulte les écrit, les modifie, en ajoute ou en retire ; « ✦ Formuler » les propose avec la
-- consigne. L'élève qui peut écrire la scène coche et décoche ; ses coches restent avec la scène,
-- d'une séance à l'autre, et l'adulte les voit. Une coche se rattache au libellé de l'élément : un
-- élément récrit par l'adulte redevient à vérifier.
--
-- Les consignes que l'application composait jusqu'ici (« Décris : » puis des tirets) deviennent une
-- consigne et sa liste : « – sa lanterne ; » devient « Décrire sa lanterne. ». Tout autre texte reste.

alter table public.scenes
  add column verification text[] not null default '{}'
    check (cardinality(verification) <= 8 and char_length(array_to_string(verification, '')) <= 8 * 80),
  add column verification_cochee text[] not null default '{}'
    check (cardinality(verification_cochee) <= 8);

grant update (verification) on public.scenes to authenticated;

-- Ce que l'élève lit de la liste : seulement dans son chapitre, comme la consigne (F06-AC48) ;
-- ses coches, celles qui répondent encore à un élément de la liste
create function public.verification_du_poste(p_scene uuid) returns jsonb
language sql stable security definer set search_path = ''
as $$
  select jsonb_build_object(
    'elements', to_jsonb(s.verification),
    'cochees', to_jsonb(array(select c from unnest(s.verification_cochee) c where c = any (s.verification)))
  )
  from public.scenes s
  where s.id = p_scene and s.supprime_le is null
    and (select prive.profil_dans(s.chapitre_id)) is not null
$$;
revoke execute on function public.verification_du_poste(uuid) from public, anon, authenticated;
grant execute on function public.verification_du_poste(uuid) to poste;

-- Cocher ou décocher : l'élève qui peut écrire la scène, avec les mêmes droits que le texte
create function public.eleve_cocher(p_scene uuid, p_element text, p_coche boolean) returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v_eleve uuid := (select prive.eleve_au_travail());
begin
  if v_eleve is null or prive.refus_d_ecrire(p_scene, v_eleve) is not null then
    raise exception 'Tu ne peux pas écrire dans cette scène.' using errcode = 'P0001';
  end if;
  update public.scenes s
  set verification_cochee = case
    when p_coche then array(select distinct c from unnest(array_append(s.verification_cochee, p_element)) c where c = any (s.verification))
    else array(select c from unnest(s.verification_cochee) c where c <> p_element and c = any (s.verification))
  end
  where s.id = p_scene and p_element = any (s.verification);
end
$$;
revoke execute on function public.eleve_cocher(uuid, text, boolean) from public, anon, authenticated;
grant execute on function public.eleve_cocher(uuid, text, boolean) to poste;

-- Une consigne composée par l'application, séparée en consigne et liste ; rien quand le texte n'a
-- pas exactement cette forme : des phrases, la ligne « Décris : », puis un à huit tirets
create function prive.separer_decris(p_consigne text, out consigne text, out liste text[])
language plpgsql immutable set search_path = ''
as $$
declare
  v_parties text[] := regexp_split_to_array(coalesce(p_consigne, ''), E'\\n\\s*Décris\\s*:\\s*\\n');
  v_lignes text[];
  v_ligne text;
  v_point text;
begin
  if cardinality(v_parties) <> 2 or btrim(v_parties[1]) = '' then
    return;
  end if;
  v_lignes := array(select l from unnest(regexp_split_to_array(btrim(v_parties[2]), E'\\n')) l where btrim(l) <> '');
  if cardinality(v_lignes) not between 1 and 8 then
    return;
  end if;
  liste := '{}';
  foreach v_ligne in array v_lignes loop
    if v_ligne !~ E'^\\s*[–-]\\s*\\S' then
      liste := null;
      return;
    end if;
    v_point := regexp_replace(regexp_replace(v_ligne, E'^\\s*[–-]\\s*', ''), E'[\\s;.,]+$', '');
    v_point := 'Décrire ' || v_point || '.';
    if char_length(v_point) > 80 then
      liste := null;
      return;
    end if;
    liste := liste || v_point;
  end loop;
  consigne := btrim(v_parties[1]);
end
$$;

with separees as (
  select s.id, d.consigne, d.liste
  from public.scenes s
  join public.projets p on p.id = s.projet_id and p.organisation = 'classe'
  cross join lateral prive.separer_decris(s.consigne) d
  where d.liste is not null and cardinality(s.verification) = 0
)
update public.scenes s
set consigne = separees.consigne, verification = separees.liste
from separees
where s.id = separees.id;
