-- Étape 8, lot 8, repris le 18 octobre 2026 à la demande du porteur : une image créée se
-- demande, puis l'adulte continue son chemin. La demande retient où l'image va ; elle se crée
-- côté serveur, même si le tiroir ou la page se ferment, et se pose d'office sur le projet, la
-- partie ou le chapitre qui l'attend (F10.1). L'image d'une scène attend avec la scène, pour
-- être posée d'un clic au retour, sans que le serveur n'écrive dans un texte qu'un élève peut
-- être en train d'écrire (F10.2). Une image choisie entre-temps n'est pas remplacée : le geste
-- le plus récent gagne.
--
-- Plusieurs images peuvent se créer en même temps ; une seule à la fois pour un même élément.

create table public.demandes_d_images (
  id uuid primary key default gen_random_uuid(),
  enseignant_id uuid not null references public.enseignants (id) on delete cascade,
  projet_id uuid not null references public.projets (id) on delete cascade,
  -- Ce qui reçoit l'image
  cible text not null check (cible in ('projet', 'partie', 'chapitre', 'scene')),
  cible_id uuid not null,
  -- Créée d'office à l'ajout d'une partie ou d'un chapitre par l'IA, ou demandée par l'adulte
  d_office boolean not null default false,
  -- Pour une scène : le bloc après lequel la poser, le cadrage, le texte lu à voix haute
  apres_bloc text check (char_length(apres_bloc) <= 64),
  cadrage text check (cadrage in ('pleine-page', '3:2', '16:9', 'carre')),
  alt text not null default '' check (char_length(alt) <= 200),
  -- L'image ou le visuel de l'élément au moment de la demande : s'ils ont changé à l'arrivée,
  -- l'adulte a choisi autre chose entre-temps, et l'image arrivée ne remplace rien
  image_avant uuid,
  visuel_avant text,
  etat text not null default 'en_route' check (etat in ('en_route', 'prete', 'posee', 'laissee', 'echec')),
  -- Les images créées qui attendent dans le stockage ; la première posée d'office
  propositions uuid[] not null default '{}' check (cardinality(propositions) <= 2),
  image_posee uuid,
  message text check (char_length(message) <= 300),
  cree_le timestamptz not null default now(),
  termine_le timestamptz
);

-- Une seule image en route à la fois pour un même élément
create unique index demandes_d_images_une_en_route on public.demandes_d_images (cible, cible_id) where etat = 'en_route';
create index demandes_d_images_projet_idx on public.demandes_d_images (projet_id, etat);
create index demandes_d_images_enseignant_idx on public.demandes_d_images (enseignant_id);

alter table public.demandes_d_images enable row level security;
create policy enseignant_lit on public.demandes_d_images for select to authenticated using (enseignant_id = (select auth.uid()));
grant select on public.demandes_d_images to authenticated;
grant all on public.demandes_d_images to service_role;

-- Commencer une demande : la demande unique ne vaut plus que pour les aides de texte ; les
-- images se créent en parallèle, sous les plafonds du jour et du mois
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

  if p_sorte = 'texte' and exists (
    select 1 from public.appels_ia a
    where a.enseignant_id = p_enseignant and a.sorte = 'texte' and a.issue is null
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
