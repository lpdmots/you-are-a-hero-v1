-- Bibliothèque publique des livres (F15), lot 4 : les cœurs.
--
-- Un cœur par livre et par lecteur, sans compte : le lecteur est un identifiant tiré au hasard,
-- gardé par le navigateur pour une fonction qu'il demande (donc sans bandeau), dont la base ne
-- garde que l'empreinte ; plus tard, un élève identifié aura le sien, par profil (lot 6). Un clic
-- donne, un autre retire. Contre les abus, une limite large par adresse réseau — une école
-- entière sort par une seule — : au-delà de 40 cœurs dans la journée pour un même livre depuis
-- une même adresse, les suivants ne comptent pas (F15-AC13). L'adresse n'est jamais gardée, son
-- empreinte seulement.
--
-- Les cœurs suivent le projet, non sa version : un livre retiré puis publié de nouveau les
-- retrouve (F15-AC09). Le nombre se tient sur la publication, pour trier sans compter.

create table public.coeurs (
  projet_id uuid not null references public.projets (id) on delete cascade,
  -- L'empreinte de l'identifiant du navigateur (« n: »), ou l'élève (« e: », lot 6)
  lecteur text not null check (char_length(lecteur) between 3 and 80),
  -- L'empreinte de l'adresse réseau ; rien pour un élève, que sa classe identifie déjà
  reseau text check (reseau is null or char_length(reseau) between 8 and 80),
  donne_le timestamptz not null default now(),
  primary key (projet_id, lecteur)
);
create index coeurs_reseau_idx on public.coeurs (projet_id, reseau, donne_le);

alter table public.coeurs enable row level security;
-- Aucune règle d'accès : seul le serveur, avec la clé de service, lit et écrit les cœurs
grant all on public.coeurs to service_role;

alter table public.publications add column coeurs integer not null default 0 check (coeurs >= 0);

-- Le nombre de cœurs d'un livre, tenu à jour à chaque cœur donné ou retiré
create function prive.compter_les_coeurs() returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  v_projet uuid := coalesce(new.projet_id, old.projet_id);
begin
  update public.publications p set coeurs = (select count(*) from public.coeurs c where c.projet_id = v_projet) where p.projet_id = v_projet;
  return null;
end
$$;
create trigger coeurs_comptes
  after insert or delete on public.coeurs
  for each row execute function prive.compter_les_coeurs();

-- Donner ou retirer un cœur à un livre publié, par son adresse. « limite » : la limite du réseau
-- est atteinte, le cœur ne compte pas ; « absent » : le livre n'est pas dans la bibliothèque.
create function public.donner_un_coeur(p_adresse text, p_lecteur text, p_reseau text, p_oui boolean, p_limite integer default 40)
returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  v_projet uuid;
  v_etat text := 'fait';
begin
  select projet_id into v_projet from public.publications where adresse = p_adresse and version is not null;
  if v_projet is null then
    return jsonb_build_object('etat', 'absent');
  end if;
  if p_oui then
    if not exists (select 1 from public.coeurs where projet_id = v_projet and lecteur = p_lecteur) then
      if p_reseau is not null and (
        select count(*) from public.coeurs where projet_id = v_projet and reseau = p_reseau and donne_le > now() - interval '1 day'
      ) >= p_limite then
        v_etat := 'limite';
      else
        insert into public.coeurs (projet_id, lecteur, reseau) values (v_projet, p_lecteur, p_reseau) on conflict do nothing;
      end if;
    end if;
  else
    delete from public.coeurs where projet_id = v_projet and lecteur = p_lecteur;
  end if;
  return jsonb_build_object(
    'etat', v_etat,
    'coeurs', (select coeurs from public.publications where projet_id = v_projet),
    'donne', exists (select 1 from public.coeurs where projet_id = v_projet and lecteur = p_lecteur)
  );
end
$$;
revoke all on function public.donner_un_coeur(text, text, text, boolean, integer) from public, anon, authenticated;
grant execute on function public.donner_un_coeur(text, text, text, boolean, integer) to service_role;
revoke all on function prive.compter_les_coeurs() from public, anon, authenticated;
