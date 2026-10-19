-- Étape 8, lot 8 : les images créées (F10.1, F10.2, F11.4).
--
-- L'idée d'illustration d'une scène, « Ce que montre l'image » : l'élève qui peut écrire la scène
-- la note en quelques mots, sans aucune commande d'IA (F10-AC10), et l'adulte la retrouve en
-- créant l'image. La dernière description de l'image, celle qui fait le prompt, reste à l'adulte.
-- La même paire pour l'illustration de couverture, gardée avec le projet (F11.4).
--
-- Une demande à la fois par adulte et par sorte (F13, précisé au lot 8) : l'image créée d'office
-- pour un chapitre ajouté par l'IA ne retient plus les aides de texte, et deux images ne se créent
-- toujours jamais en même temps.

alter table public.scenes
  add column idee_image text not null default '' check (char_length(idee_image) <= 400),
  add column description_image text not null default '' check (char_length(description_image) <= 1500);

-- Le poste lit l'idée, pas la description
grant select (idee_image) on public.scenes to poste;

alter table public.projets
  add column idee_couverture text not null default '' check (char_length(idee_couverture) <= 400),
  add column description_couverture text not null default '' check (char_length(description_couverture) <= 1500);

-- « Mon idée d'image » : l'élève qui peut écrire la scène, avec les mêmes droits que le texte
-- (son chapitre, une scène qui s'écrit encore, pas arrêté par un conflit)
create function public.eleve_noter_idee_image(p_scene uuid, p_idee text) returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v_eleve uuid := (select prive.eleve_au_travail());
begin
  if v_eleve is null or prive.refus_d_ecrire(p_scene, v_eleve) is not null then
    raise exception 'Tu ne peux pas écrire dans cette scène.' using errcode = 'P0001';
  end if;
  update public.scenes
  set idee_image = left(btrim(replace(coalesce(p_idee, ''), E'\r', '')), 400)
  where id = p_scene;
end
$$;

revoke execute on function public.eleve_noter_idee_image(uuid, text) from public, anon, authenticated;
grant execute on function public.eleve_noter_idee_image(uuid, text) to poste;

-- Commencer une demande : comme au lot 1, la demande unique comptée par sorte
create or replace function public.commencer_appel_ia(
  p_enseignant uuid, p_aide text, p_sorte text, p_nombre integer,
  p_par_jour integer, p_mois_usd numeric, p_attente integer
) returns jsonb
language plpgsql security invoker set search_path = ''
as $$
declare
  v_debut_jour timestamptz := date_trunc('day', now() at time zone 'Europe/Paris') at time zone 'Europe/Paris';
  v_debut_mois timestamptz := date_trunc('month', now() at time zone 'Europe/Paris') at time zone 'Europe/Paris';
  v_faites integer;
  v_id uuid;
begin
  perform 1 from public.enseignants e where e.id = p_enseignant for update;
  if not found then
    raise exception 'adulte inconnu';
  end if;

  if exists (
    select 1 from public.appels_ia a
    where a.enseignant_id = p_enseignant and a.sorte = p_sorte and a.issue is null
      and a.commence_le > now() - make_interval(secs => p_attente)
  ) then
    return jsonb_build_object('refus', 'occupe');
  end if;

  select coalesce(sum(a.nombre), 0) into v_faites
  from public.appels_ia a
  where a.enseignant_id = p_enseignant and a.sorte = p_sorte and a.commence_le >= v_debut_jour;
  if v_faites + p_nombre > p_par_jour then
    return jsonb_build_object('refus', 'jour', 'restant', greatest(p_par_jour - v_faites, 0));
  end if;

  if p_mois_usd is not null and (
    select coalesce(sum(a.cout_usd), 0) from public.appels_ia a
    where a.sorte = p_sorte and a.commence_le >= v_debut_mois
  ) >= p_mois_usd then
    return jsonb_build_object('refus', 'mois');
  end if;

  insert into public.appels_ia (enseignant_id, aide, sorte, nombre)
  values (p_enseignant, p_aide, p_sorte, p_nombre)
  returning id into v_id;

  return jsonb_build_object('id', v_id, 'restant', p_par_jour - v_faites - p_nombre);
end
$$;

revoke execute on function public.commencer_appel_ia(uuid, text, text, integer, integer, numeric, integer) from public, anon, authenticated;
grant execute on function public.commencer_appel_ia(uuid, text, text, integer, integer, numeric, integer) to service_role;
