-- Le livre gratuit pour l'instant, l'IA toujours payante (F14, décidé par le porteur le 8 novembre 2026).
--
-- « Paiement ouvert » ne commande plus que la vente : les recharges d'étoiles se vendent dès qu'il
-- est allumé. Un second interrupteur, « Livre payant », éteint, commande les limites gratuites
-- (40 scènes, 10 images) et la vente du pass ; il ne vaut qu'avec la vente ouverte, une limite sans
-- moyen de payer bloquant un livre en cours.
--
-- Un projet créé pendant que le livre est gratuit reste sans limite pour toujours, comme s'il avait
-- son pass, sans les étoiles du pass (F14-AC54) : la marque se pose d'office à sa création, et
-- l'enseignant ne la change pas. Les projets qui existent déjà la reçoivent tous : la période
-- gratuite commence avec cette migration.

alter table public.reglages_application
  add column livre_payant boolean not null default false;

alter table public.projets
  add column sans_limite boolean not null default false;

update public.projets set sans_limite = true;

-- La marque d'un nouveau projet : celle de la période où il naît
create function prive.marque_sans_limite() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  new.sans_limite := not coalesce((select r.livre_payant from public.reglages_application r), false);
  return new;
end
$$;
create trigger projets_sans_limite
  before insert on public.projets
  for each row execute function prive.marque_sans_limite();

-- Personne d'autre que le service ne la change : l'enseignant, qui peut modifier son projet, garde
-- celle que son projet a reçue
create function prive.garde_sans_limite() returns trigger
language plpgsql set search_path = ''
as $$
begin
  if current_user in ('authenticated', 'anon', 'poste') then
    new.sans_limite := old.sans_limite;
  end if;
  return new;
end
$$;
create trigger projets_garde_sans_limite
  before update of sans_limite on public.projets
  for each row execute function prive.garde_sans_limite();

revoke execute on function prive.marque_sans_limite(), prive.garde_sans_limite() from public, anon, authenticated, poste;

-- Les limites valent-elles pour ce projet ? Vente ouverte, livre payant, sans pass ni marque, hors porteur.
create or replace function prive.projet_limite(p_projet uuid) returns boolean
language sql stable security definer set search_path = ''
as $$
  select coalesce((select r.paiement_ouvert and r.livre_payant from public.reglages_application r), false)
    and not exists (select 1 from public.passes pa where pa.projet_id = p_projet)
    and not exists (
      select 1 from public.projets p join public.enseignants e on e.id = p.enseignant_id
      where p.id = p_projet and (e.createur or p.sans_limite)
    )
$$;
