-- Les lieux de l'histoire, ajoutés à l'étape « Univers » de la Préparation (F02.1, décidé par le
-- porteur le 18 novembre 2026), sur le modèle des objets de l'histoire : un nom, fixé comme celui
-- d'un personnage, et une phrase. L'ordre se change en tirant les lignes. Ils entrent dans la fiche
-- de l'histoire à imprimer et dans le contexte des aides de l'IA. Pas d'image de lieu pour cette
-- livraison.
--
-- Comme toute la Préparation, les lieux ne regardent que l'adulte (F02-AC04, F02-AC24) : le poste
-- d'un élève ne reçoit aucun droit sur cette table.

create table public.lieux (
  id uuid primary key default gen_random_uuid(),
  projet_id uuid not null,
  enseignant_id uuid not null,
  nom text not null check (char_length(btrim(nom)) between 1 and 60),
  phrase text not null default '' check (char_length(phrase) <= 160),
  rang integer not null default 0,
  cree_le timestamptz not null default now(),
  foreign key (projet_id, enseignant_id) references public.projets (id, enseignant_id) on delete cascade
);
create index lieux_projet_idx on public.lieux (projet_id, rang);
create index lieux_enseignant_idx on public.lieux (enseignant_id);

alter table public.lieux enable row level security;
create policy enseignant_lit on public.lieux for select to authenticated using (enseignant_id = (select auth.uid()));
create policy enseignant_cree on public.lieux for insert to authenticated with check (enseignant_id = (select auth.uid()));
create policy enseignant_modifie on public.lieux for update to authenticated
  using (enseignant_id = (select auth.uid())) with check (enseignant_id = (select auth.uid()));
create policy enseignant_supprime on public.lieux for delete to authenticated using (enseignant_id = (select auth.uid()));
grant select, insert, update, delete on public.lieux to authenticated;
grant all on public.lieux to service_role;

-- L'ordre des lieux, tel que l'adulte l'a tiré : chaque lieu prend sa position dans la liste
-- donnée. Un lieu absent de la liste garde son rang, après les autres. Avec les droits de
-- l'adulte : un lieu d'un autre compte n'est pas touché.
create function public.ordonner_lieux(p_projet uuid, p_lieux uuid[]) returns void
language plpgsql security invoker set search_path = ''
as $$
begin
  update public.lieux l
  set rang = o.position - 1
  from unnest(p_lieux) with ordinality as o(id, position)
  where l.id = o.id and l.projet_id = p_projet;
  update public.lieux l
  set rang = cardinality(p_lieux) + l.rang
  where l.projet_id = p_projet and not (l.id = any (p_lieux));
end
$$;
revoke execute on function public.ordonner_lieux(uuid, uuid[]) from public, anon, poste;
grant execute on function public.ordonner_lieux(uuid, uuid[]) to authenticated, service_role;
