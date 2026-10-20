-- Étape 9, lot 6 : les pages d'administration du porteur (F14, F14-AC22 à AC25).
--
-- Des pages simples, réservées au compte du porteur (`enseignants.createur`) et refusées à tout
-- autre côté serveur : le serveur vérifie la marque avant chaque lecture et chaque geste, puis
-- passe par la clé de service. Rien ici n'est ouvert à un adulte : ces fonctions ne s'appellent
-- qu'avec la clé de service.
--
-- Les gestes du porteur restent inscrits avec leur date : les étoiles offertes dans les
-- mouvements d'étoiles (motif « cadeau »), le pass offert dans les pass (origine « cadeau »), le
-- partage retiré ici.

-- Les comptes, avec ce que la page montre : inscription, dernière connexion, solde, projets
create function public.comptes_pour_l_administration()
returns table (
  id uuid, courriel text, inscrit_le timestamptz, connecte_le timestamptz, confirme boolean,
  etoiles integer, createur boolean, projets integer, pass integer
)
language sql stable security definer set search_path = ''
as $$
  select u.id, u.email::text, u.created_at, u.last_sign_in_at, u.email_confirmed_at is not null,
         e.etoiles, e.createur,
         (select count(*)::integer from public.projets p where p.enseignant_id = u.id),
         (select count(*)::integer from public.passes pa where pa.enseignant_id = u.id)
  from auth.users u
  join public.enseignants e on e.id = u.id
  order by u.created_at desc
$$;
revoke execute on function public.comptes_pour_l_administration() from public, anon, authenticated;
grant execute on function public.comptes_pour_l_administration() to service_role;

-- Les partages retirés par le porteur, avec leur date : le livre signalé, son compte, son titre
create table public.partages_retires (
  id uuid primary key default gen_random_uuid(),
  projet_id uuid,
  enseignant_id uuid references public.enseignants (id) on delete set null,
  titre text not null check (char_length(titre) <= 200),
  code text not null,
  retire_le timestamptz not null default now()
);
alter table public.partages_retires enable row level security;
grant all on public.partages_retires to service_role;
