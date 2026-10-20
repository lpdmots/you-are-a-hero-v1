-- Étape 9, lot 3 : les étoiles (F14, « Crédits d'IA », F14-AC05 à AC11).
--
-- Chaque compte a un solde d'étoiles qui borne la dépense d'IA à la place des plafonds du jour et
-- du mois (F13, révisé le 20 octobre 2026). Une étoile vaut un centime d'euro de coût réel chez le
-- fournisseur : chaque demande réussie débite son coût, converti en euros et arrondi à l'étoile
-- supérieure, d'après le journal des appels. Une demande qui échoue ou ne répond pas ne débite
-- rien. Un nouveau compte reçoit ses étoiles une seule fois, quand son adresse est confirmée (tout
-- de suite pour un compte créé par Google). Le compte du porteur n'a pas de solde.
--
-- Chaque mouvement du solde est inscrit avec sa date et son motif : étoiles offertes à
-- l'inscription, demande d'aide, et plus tard pass, recharge et cadeau du porteur (lots 5 et 6).
-- Le solde est tenu à côté, par la base, pour se lire d'un coup.

-- Les réglages de l'offre, en un seul endroit, lus par l'application et par la base (F14-AC21).
-- Une seule ligne. Les lots suivants y ajoutent l'interrupteur « Paiement ouvert », les limites
-- gratuites et les prix.
create table public.reglages_application (
  id boolean primary key default true check (id),
  -- Étoiles d'un nouveau compte, de quoi essayer
  etoiles_offertes integer not null default 30 check (etoiles_offertes between 0 and 1000),
  -- Le coût est facturé en dollars ; une étoile vaut un centime d'euro
  euros_par_dollar numeric(6, 4) not null default 0.87 check (euros_par_dollar > 0),
  -- En dessous, le solde s'affiche près des aides (F14-AC07)
  etoiles_peu integer not null default 10 check (etoiles_peu >= 0)
);
insert into public.reglages_application (id) values (true);

alter table public.reglages_application enable row level security;
-- Rien de secret : les pages publiques montreront l'offre
create policy tous_lisent on public.reglages_application for select to anon, authenticated using (true);
grant select on public.reglages_application to anon, authenticated;
grant all on public.reglages_application to service_role;

alter table public.enseignants
  -- Le solde ; il peut finir légèrement négatif quand plusieurs demandes partent ensemble (F14-AC09)
  add column etoiles integer not null default 0,
  -- Le compte du porteur : aucun solde ni débit (F14-AC11), et plus tard l'administration.
  -- Posé par « npm run createur », jamais par l'application ; l'adulte ne peut pas l'écrire.
  add column createur boolean not null default false;

create table public.mouvements_etoiles (
  id uuid primary key default gen_random_uuid(),
  enseignant_id uuid not null references public.enseignants (id) on delete cascade,
  quand timestamptz not null default now(),
  nombre integer not null check (nombre <> 0),
  motif text not null check (motif in ('bienvenue', 'aide', 'pass', 'recharge', 'cadeau')),
  -- Pour une aide : la demande du journal, débitée une seule fois
  appel_id uuid unique references public.appels_ia (id) on delete set null,
  note text check (char_length(note) <= 200)
);
create index mouvements_etoiles_enseignant_idx on public.mouvements_etoiles (enseignant_id, quand desc);
-- Les étoiles offertes ne se donnent qu'une fois par compte (F14-AC05)
create unique index mouvements_etoiles_une_bienvenue on public.mouvements_etoiles (enseignant_id) where motif = 'bienvenue';

alter table public.mouvements_etoiles enable row level security;
create policy enseignant_lit on public.mouvements_etoiles for select to authenticated using (enseignant_id = (select auth.uid()));
grant select on public.mouvements_etoiles to authenticated;
grant all on public.mouvements_etoiles to service_role;

-- Le solde suit chaque mouvement
create function prive.etoiles_suivent() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  update public.enseignants set etoiles = etoiles + new.nombre where id = new.enseignant_id;
  return new;
end
$$;
create trigger mouvements_etoiles_solde
  after insert on public.mouvements_etoiles
  for each row execute function prive.etoiles_suivent();

-- Les étoiles offertes, quand l'adresse est confirmée : à la création pour un compte Google ou
-- créé confirmé, à l'ouverture du lien pour un compte créé par adresse (F14-AC05)
create function prive.etoiles_de_bienvenue() returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  v_offertes integer;
begin
  if new.email_confirmed_at is null or (tg_op = 'UPDATE' and old.email_confirmed_at is not null) then
    return new;
  end if;
  -- La ligne de l'adulte naît d'un autre déclencheur, dont l'ordre n'est pas garanti
  insert into public.enseignants (id) values (new.id) on conflict (id) do nothing;
  select r.etoiles_offertes into v_offertes from public.reglages_application r;
  if coalesce(v_offertes, 0) > 0 then
    insert into public.mouvements_etoiles (enseignant_id, nombre, motif)
    values (new.id, v_offertes, 'bienvenue')
    on conflict do nothing;
  end if;
  return new;
end
$$;
create trigger etoiles_de_bienvenue
  after insert or update of email_confirmed_at on auth.users
  for each row execute function prive.etoiles_de_bienvenue();

-- Les comptes déjà confirmés reçoivent les leurs
insert into public.mouvements_etoiles (enseignant_id, nombre, motif)
select e.id, r.etoiles_offertes, 'bienvenue'
from public.enseignants e
join auth.users u on u.id = e.id
cross join public.reglages_application r
where u.email_confirmed_at is not null and r.etoiles_offertes > 0
on conflict do nothing;

-- Le débit d'une demande réussie : son coût en dollars, converti, arrondi à l'étoile supérieure
-- (F14-AC06). Rien pour une demande qui échoue, ne répond pas ou ne coûte rien, ni pour le porteur.
create function prive.debiter_l_appel() returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  v_taux numeric;
  v_etoiles integer;
begin
  if new.issue is distinct from 'reussi' or coalesce(new.cout_usd, 0) <= 0 then
    return new;
  end if;
  if exists (select 1 from public.enseignants e where e.id = new.enseignant_id and e.createur) then
    return new;
  end if;
  select r.euros_par_dollar into v_taux from public.reglages_application r;
  v_etoiles := ceil(new.cout_usd * v_taux * 100)::integer;
  if v_etoiles > 0 then
    insert into public.mouvements_etoiles (enseignant_id, nombre, motif, appel_id)
    values (new.enseignant_id, -v_etoiles, 'aide', new.id)
    on conflict (appel_id) do nothing;
  end if;
  return new;
end
$$;
create trigger appels_ia_debit
  after update of issue on public.appels_ia
  for each row when (old.issue is null and new.issue is not null)
  execute function prive.debiter_l_appel();

-- Commencer une demande, révisé à l'étape 9 (F14, « Aides IA sans quota ») : plus de plafond du
-- jour ni du mois, plus de demande unique par adulte ; un solde d'étoiles positif au moment de la
-- demande (F14-AC09), sauf pour le porteur. La signature ne change pas : le code d'avant passe
-- encore ses plafonds, qui ne valent que s'ils sont donnés, le temps de la mise en ligne.
--   « etoiles » : le solde est épuisé (F14-AC08).
create or replace function public.commencer_appel_ia(
  p_enseignant uuid, p_aide text, p_sorte text, p_nombre integer,
  p_par_jour integer, p_mois_usd numeric, p_attente integer
) returns jsonb
language plpgsql security invoker set search_path = ''
as $$
declare
  v_debut_jour timestamptz := date_trunc('day', now() at time zone 'Europe/Paris') at time zone 'Europe/Paris';
  v_debut_mois timestamptz := date_trunc('month', now() at time zone 'Europe/Paris') at time zone 'Europe/Paris';
  v_etoiles integer;
  v_createur boolean;
  v_faites integer;
  v_id uuid;
begin
  select e.etoiles, e.createur into v_etoiles, v_createur
  from public.enseignants e where e.id = p_enseignant for update;
  if not found then
    raise exception 'adulte inconnu';
  end if;

  if not v_createur and v_etoiles <= 0 then
    return jsonb_build_object('refus', 'etoiles');
  end if;

  if p_par_jour is not null then
    select coalesce(sum(a.nombre), 0) into v_faites
    from public.appels_ia a
    where a.enseignant_id = p_enseignant and a.sorte = p_sorte and a.commence_le >= v_debut_jour;
    if v_faites + p_nombre > p_par_jour then
      return jsonb_build_object('refus', 'jour', 'restant', greatest(p_par_jour - v_faites, 0));
    end if;
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

  return jsonb_build_object('id', v_id);
end
$$;

revoke execute on function public.commencer_appel_ia(uuid, text, text, integer, integer, numeric, integer) from public, anon, authenticated;
grant execute on function public.commencer_appel_ia(uuid, text, text, integer, integer, numeric, integer) to service_role;
