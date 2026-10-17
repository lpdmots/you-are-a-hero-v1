-- Étape 8, lot 1 : le socle des aides IA (F13, cadre commun).
--
-- Le journal des appels garde chaque demande faite à un fournisseur, sans son contenu : la
-- date, l'aide, le modèle, les jetons et le coût. Il sert aux plafonds du jour et du mois, et
-- au budget ; le jour venu (F14), il permettra de passer des plafonds à un solde sans rien
-- reprendre. Ni le texte envoyé ni la réponse n'y sont jamais écrits.
--
-- Seul le serveur de l'application y écrit, avec la clé de service : un adulte qui effacerait
-- ses lignes retrouverait ses demandes du jour. L'adulte lit les siennes.

create table public.appels_ia (
  id uuid primary key default gen_random_uuid(),
  enseignant_id uuid not null references public.enseignants (id) on delete cascade,
  -- « correction », « consigne », « image »… : le nom de l'aide dans l'application
  aide text not null check (aide ~ '^[a-z][a-z-]{1,29}$'),
  sorte text not null check (sorte in ('texte', 'image')),
  -- Les images d'une même création comptent chacune (F13 : vingt images par jour)
  nombre smallint not null default 1 check (nombre between 1 and 4),
  commence_le timestamptz not null default now(),
  -- Rien tant que la réponse n'est pas arrivée : la demande est en cours
  termine_le timestamptz,
  issue text check (issue in ('reussi', 'echec', 'delai', 'refus')),
  fournisseur text check (fournisseur in ('anthropic', 'openai', 'simule')),
  modele text check (char_length(modele) between 1 and 60),
  jetons_entree integer check (jetons_entree >= 0),
  jetons_sortie integer check (jetons_sortie >= 0),
  -- Ce que le fournisseur facture, en dollars
  cout_usd numeric(10, 6) check (cout_usd >= 0),
  check ((termine_le is null) = (issue is null))
);
create index appels_ia_enseignant_idx on public.appels_ia (enseignant_id, commence_le desc);
create index appels_ia_mois_idx on public.appels_ia (sorte, commence_le);

alter table public.appels_ia enable row level security;
create policy enseignant_lit on public.appels_ia for select to authenticated using (enseignant_id = (select auth.uid()));
grant select on public.appels_ia to authenticated;
grant all on public.appels_ia to service_role;

-- Les réglages des aides, gardés avec le compte et valables pour tous ses projets (F13) :
-- degré de correction par défaut, « Proposer les aides IA », niveau des élèves, images par
-- création, qualité des images. Un objet vide : les réglages par défaut.
alter table public.enseignants
  add column reglages_ia jsonb not null default '{}'::jsonb
  check (jsonb_typeof(reglages_ia) = 'object' and pg_column_size(reglages_ia) < 1000);

grant update (reglages_ia) on public.enseignants to authenticated;

-- Commencer une demande : d'un seul tenant, sous le verrou de la ligne de l'adulte, pour que
-- deux demandes parties ensemble ne passent pas toutes deux sous un plafond.
--   « occupe » : une demande de l'adulte attend encore sa réponse (une à la fois) ;
--   « jour » : le plafond du jour, heure de Paris, est atteint ;
--   « mois » : le plafond des images de toute l'application pour le mois est atteint.
-- Les valeurs des plafonds viennent de l'application, qui les range en un seul endroit.
-- Une demande restée sans réponse au-delà de p_attente secondes ne retient plus l'adulte.
create function public.commencer_appel_ia(
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
    where a.enseignant_id = p_enseignant and a.issue is null
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

-- Noter la fin d'une demande : son issue, le modèle, les jetons et le coût. Une seule fois.
create function public.terminer_appel_ia(
  p_id uuid, p_issue text, p_fournisseur text, p_modele text,
  p_entree integer, p_sortie integer, p_cout numeric
) returns void
language sql security invoker set search_path = ''
as $$
  update public.appels_ia set
    termine_le = now(), issue = p_issue, fournisseur = p_fournisseur, modele = p_modele,
    jetons_entree = p_entree, jetons_sortie = p_sortie, cout_usd = p_cout
  where id = p_id and issue is null;
$$;

revoke execute on function public.commencer_appel_ia(uuid, text, text, integer, integer, numeric, integer) from public, anon, authenticated;
revoke execute on function public.terminer_appel_ia(uuid, text, text, text, integer, integer, numeric) from public, anon, authenticated;
grant execute on function public.commencer_appel_ia(uuid, text, text, integer, integer, numeric, integer) to service_role;
grant execute on function public.terminer_appel_ia(uuid, text, text, text, integer, integer, numeric) to service_role;
