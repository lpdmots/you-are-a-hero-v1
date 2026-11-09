-- La dictée de l'adulte (F07.4, décidée le 25 octobre 2026, étendue le 9 novembre 2026 à tous les
-- champs que l'adulte remplit).
--
-- Gratuite, sans étoile (exception de F14), avec un plafond de trois heures par compte et par mois,
-- heure de Paris. Le journal garde la durée de chaque dictée transcrite, et rien d'autre : ni le son,
-- ni le texte entendu, ni le champ où il s'est posé. Il ne sert qu'au plafond.
--
-- Seul le serveur de l'application y écrit, avec la clé de service : un adulte qui effacerait ses
-- lignes retrouverait ses heures du mois. L'adulte lit les siennes.

create table public.dictees (
  id uuid primary key default gen_random_uuid(),
  enseignant_id uuid not null references public.enseignants (id) on delete cascade,
  le timestamptz not null default now(),
  -- La durée que le fournisseur a transcrite ; un enregistrement s'arrête de lui-même à cinq minutes
  secondes numeric(6, 1) not null check (secondes >= 0 and secondes <= 600),
  fournisseur text not null check (fournisseur in ('elevenlabs', 'simule'))
);
create index dictees_enseignant_idx on public.dictees (enseignant_id, le desc);

alter table public.dictees enable row level security;
create policy enseignant_lit on public.dictees for select to authenticated using (enseignant_id = (select auth.uid()));
grant select on public.dictees to authenticated;
grant all on public.dictees to service_role;

-- Les secondes dictées par un compte depuis le 1er du mois, heure de Paris
create function public.secondes_dictees_du_mois(p_enseignant uuid) returns numeric
language sql stable security invoker set search_path = ''
as $$
  select coalesce(sum(d.secondes), 0)
  from public.dictees d
  where d.enseignant_id = p_enseignant
    and d.le >= (date_trunc('month', now() at time zone 'Europe/Paris') at time zone 'Europe/Paris')
$$;
revoke execute on function public.secondes_dictees_du_mois(uuid) from public, anon, authenticated;
grant execute on function public.secondes_dictees_du_mois(uuid) to service_role;
