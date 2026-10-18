-- Étape 8, lot 7 : personnages et objets de l'histoire, pour les images (F10.2, F02, F04.2).
--
-- Une carte par personnage important, dans l'étape « Personnages » de la Préparation : nom,
-- autres noms, héros ou non (plusieurs héros possibles depuis le 18 octobre 2026), courte
-- description de l'adulte, fiche visuelle reprise mot pour mot dans chaque image, portrait de
-- référence. Les objets reçoivent de même une fiche visuelle et une image de référence. Le
-- style d'illustration et le réglage « héros absent » sont des options du projet.
--
-- Les cartes ne regardent que l'adulte, comme la Préparation (F02-AC04) ; le poste d'un élève
-- ne reçoit que les noms, pour `/personnage` (F10.2), par `jeu_de_la_scene`.

create table public.personnages (
  id uuid primary key default gen_random_uuid(),
  projet_id uuid not null,
  enseignant_id uuid not null,
  nom text not null check (char_length(btrim(nom)) between 1 and 60),
  -- « le passeur », « le vieux Maël » : les autres façons de le désigner
  autres_noms text[] not null default '{}'
    check (cardinality(autres_noms) <= 5 and char_length(array_to_string(autres_noms, '|')) <= 320),
  heros boolean not null default false,
  -- En quelques mots, par l'adulte ; la compétence d'un héros s'y écrit (F10.2)
  description text not null default '' check (char_length(description) <= 400),
  -- Fiche visuelle : âge apparent, silhouette, visage, cheveux, vêtements, objet fétiche
  fiche text not null default '' check (char_length(fiche) <= 900),
  -- Portrait de référence, gardé parmi les images du projet
  portrait_id uuid,
  rang integer not null default 0,
  cree_le timestamptz not null default now(),
  foreign key (projet_id, enseignant_id) references public.projets (id, enseignant_id) on delete cascade,
  foreign key (portrait_id, projet_id) references public.images (id, projet_id)
);
create index personnages_projet_idx on public.personnages (projet_id, rang);
create index personnages_enseignant_idx on public.personnages (enseignant_id);
create index personnages_portrait_idx on public.personnages (portrait_id);

alter table public.personnages enable row level security;
create policy enseignant_lit on public.personnages for select to authenticated using (enseignant_id = (select auth.uid()));
create policy enseignant_cree on public.personnages for insert to authenticated with check (enseignant_id = (select auth.uid()));
create policy enseignant_modifie on public.personnages for update to authenticated
  using (enseignant_id = (select auth.uid())) with check (enseignant_id = (select auth.uid()));
create policy enseignant_supprime on public.personnages for delete to authenticated using (enseignant_id = (select auth.uid()));
grant select, insert, update, delete on public.personnages to authenticated;
grant all on public.personnages to service_role;

-- Les objets de l'histoire : fiche visuelle et image de référence (F10.2, demande du porteur)
alter table public.objets
  add column fiche text not null default '' check (char_length(fiche) <= 900),
  add column image_id uuid,
  add constraint objets_image_fk foreign key (image_id, projet_id) references public.images (id, projet_id);
create index objets_image_idx on public.objets (image_id);

-- Les options du projet pour les images (F10.2) : le style, celui de l'application par défaut,
-- ou « autre », décrit par l'adulte ; le héros absent des images, allumé par défaut (F10-AC12)
alter table public.projets
  add column style_images text not null default 'lumineuse'
    check (style_images in ('lumineuse', 'aquarelle', 'crayons', 'gouache', 'papier', 'encre', 'autre')),
  add column style_autre text not null default '' check (char_length(style_autre) <= 300),
  add column heros_absent boolean not null default true;
grant update (style_images, style_autre, heros_absent) on public.projets to authenticated;

-- Le poste qui écrit dans un chapitre reçoit aussi les noms des personnages, pour `/personnage`
-- (F10.2), comme ceux des objets : ni leur description, ni leur fiche, ni leur portrait.
create or replace function public.jeu_de_la_scene(p_scene uuid) returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
declare
  s record;
  v_profil text;
begin
  select sc.chapitre_id, sc.projet_id, p.recit into s
  from public.scenes sc join public.projets p on p.id = sc.projet_id
  where sc.id = p_scene and sc.supprime_le is null;
  if not found or (select prive.eleve_au_travail()) is null or not (select prive.scenes_lisibles(s.chapitre_id)) then
    return null;
  end if;
  v_profil := (select prive.profil_dans(s.chapitre_id));
  -- Les objets servent à qui écrit ici : un lecteur d'un autre chapitre n'en reçoit rien
  if v_profil is null then
    return jsonb_build_object('objets', '[]'::jsonb, 'formules', '[]'::jsonb, 'personnages', '[]'::jsonb);
  end if;
  return jsonb_build_object(
    'objets', coalesce((
      select jsonb_agg(jsonb_build_object('id', o.id, 'nom', o.nom, 'description', o.description) order by o.cree_le, o.id)
      from public.objets o where o.projet_id = s.projet_id), '[]'::jsonb),
    'formules', case when v_profil = 'organisation' and s.recit = 'choix' then coalesce((
      select jsonb_agg(jsonb_build_object('id', f.id, 'texte', f.texte, 'signe', f.signe) order by f.cree_le, f.id)
      from public.formules f where f.projet_id = s.projet_id), '[]'::jsonb) else '[]'::jsonb end,
    'personnages', coalesce((
      select jsonb_agg(jsonb_build_object('id', c.id, 'nom', c.nom, 'autres_noms', to_jsonb(c.autres_noms)) order by c.rang, c.cree_le, c.id)
      from public.personnages c where c.projet_id = s.projet_id), '[]'::jsonb)
  );
end
$$;
