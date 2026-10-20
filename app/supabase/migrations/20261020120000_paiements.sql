-- Étape 9, lot 5 : le paiement (F14, F14-AC18 à AC21).
--
-- Deux achats uniques, par Stripe Checkout et par carte : le pass d'un projet, et une recharge
-- d'étoiles. Un paiement reçu s'inscrit une seule fois, sous l'identifiant de sa session de
-- paiement : l'avis de Stripe peut arriver deux fois, ou en même temps que le retour de
-- l'enseignant sur la page de remerciement, sans que le pass ou les étoiles ne se donnent deux
-- fois (F14-AC19). Seul le serveur de l'application écrit ici, avec la clé de service.
--
-- Une vente reste inscrite si le compte est supprimé : elle compte dans les ventes du mois et
-- dans les comptes du porteur ; elle ne nomme plus personne.

create table public.paiements (
  -- L'identifiant de la session de paiement chez Stripe (« cs_… »)
  session text primary key check (char_length(session) between 3 and 200),
  enseignant_id uuid references public.enseignants (id) on delete set null,
  achat text not null check (achat in ('pass', 'recharge')),
  -- Le projet du pass ; gardé sans lien, pour qu'une vente survive au projet
  projet_id uuid,
  -- Ce qui a été payé, en centimes d'euro, et les étoiles données
  montant integer not null check (montant > 0),
  etoiles integer not null default 0 check (etoiles >= 0),
  recu_le timestamptz not null default now(),
  check ((achat = 'pass') = (projet_id is not null))
);
create index paiements_enseignant_idx on public.paiements (enseignant_id);
create index paiements_mois_idx on public.paiements (recu_le);

alter table public.paiements enable row level security;
create policy enseignant_lit on public.paiements for select to authenticated using (enseignant_id = (select auth.uid()));
grant select on public.paiements to authenticated;
grant all on public.paiements to service_role;

-- Inscrire un paiement reçu, et donner ce qu'il achète, d'un seul tenant. Rend false s'il était
-- déjà inscrit : rien n'est donné une seconde fois.
create function public.enregistrer_paiement(
  p_session text, p_enseignant uuid, p_achat text, p_projet uuid, p_montant integer
) returns boolean
language plpgsql security invoker set search_path = ''
as $$
declare
  v_etoiles integer;
begin
  if p_achat = 'pass' then
    select r.etoiles_du_pass into v_etoiles from public.reglages_application r;
  else
    select r.etoiles_de_la_recharge into v_etoiles from public.reglages_application r;
  end if;
  insert into public.paiements (session, enseignant_id, achat, projet_id, montant, etoiles)
  values (p_session, p_enseignant, p_achat, case when p_achat = 'pass' then p_projet end, p_montant, coalesce(v_etoiles, 0))
  on conflict (session) do nothing;
  if not found then
    return false;
  end if;
  if p_achat = 'pass' then
    -- Le pass donne ses étoiles lui-même ; un projet qui l'avait déjà n'en reçoit pas d'autres
    perform public.donner_le_pass(p_projet, 'achat');
  elsif coalesce(v_etoiles, 0) > 0 then
    insert into public.mouvements_etoiles (enseignant_id, nombre, motif, note)
    values (p_enseignant, v_etoiles, 'recharge', p_session);
  end if;
  return true;
end
$$;
revoke execute on function public.enregistrer_paiement(text, uuid, text, uuid, integer) from public, anon, authenticated;
grant execute on function public.enregistrer_paiement(text, uuid, text, uuid, integer) to service_role;
