-- Étape 3, lot 3 : la note de l'enseignant (F05.2, F05-AC49 à AC52).
--
-- Un élève ne reçoit rien d'une note, pas même son existence : la base ne la lui envoie
-- pas. Quand il enregistre, son texte n'en contient donc aucune, et c'est ici, sous le
-- verrou de la scène, que les notes reprennent leur place : après le paragraphe qui les
-- précédait ; s'il l'a supprimé, après le précédent, ou en tête de la scène (F05-AC50).

create function prive.remettre_les_notes(p_scene jsonb, p_texte jsonb) returns jsonb
language sql immutable set search_path = ''
as $$
  with recu as (
    -- Ce qu'un élève envoie ne porte jamais de note : une note forgée est écartée
    select b.bloc, row_number() over (order by b.n) as place
    from jsonb_array_elements(coalesce(p_texte, '[]'::jsonb)) with ordinality as b (bloc, n)
    where b.bloc ->> 'type' is distinct from 'note'
  ), scene as (
    select b.bloc, b.n
    from jsonb_array_elements(coalesce(p_scene, '[]'::jsonb)) with ordinality as b (bloc, n)
  ), notes as (
    select s.bloc, s.n,
           -- Le bloc d'avant le plus proche qui est encore dans le texte reçu
           (select r.place
            from scene a join recu r on r.bloc ->> 'id' = a.bloc ->> 'id'
            where a.n < s.n and a.bloc ->> 'type' is distinct from 'note'
            order by a.n desc limit 1) as ancre
    from scene s
    where s.bloc ->> 'type' = 'note'
  ), suite as (
    select bloc, place, 0 as apres, 0::bigint as rang from recu
    union all
    select bloc, coalesce(ancre, 0), 1, n from notes
  )
  select coalesce(jsonb_agg(bloc order by place, apres, rang), '[]'::jsonb) from suite
$$;

-- Enregistrer : pour un élève, le texte qui entre dans la scène est le sien, notes de
-- l'enseignant remises. Le texte gardé à part après un refus reste le sien, sans note.
create or replace function prive.ecrire_texte(p_scene uuid, p_version integer, p_texte jsonb, p_eleve uuid, p_refus text)
returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  s public.scenes%rowtype;
  v_fuseau text;
  v_refus text := p_refus;
  v_texte jsonb := p_texte;
begin
  select * into s from public.scenes sc where sc.id = p_scene for update;
  if not found then
    return jsonb_build_object('etat', 'refuse', 'motif', 'supprimee');
  end if;
  if p_eleve is not null then
    v_texte := prive.remettre_les_notes(s.texte, p_texte);
  end if;

  -- Rien de neuf : rien à écrire ni à garder. C'est aussi le cas d'une réponse perdue en
  -- route, que la page renvoie : son texte est déjà celui de la scène.
  if s.texte = v_texte then
    if v_refus is not null then
      return jsonb_build_object('etat', 'refuse', 'version', s.version, 'motif', v_refus);
    end if;
    return jsonb_build_object('etat', 'enregistre', 'version', s.version);
  end if;

  if v_refus is null and s.version <> p_version then
    v_refus := 'conflit';
  end if;
  if v_refus is not null then
    insert into public.copies_recuperation (scene_id, projet_id, enseignant_id, sorte, eleve_id, motif, texte)
    values (s.id, s.projet_id, s.enseignant_id, 'refus', p_eleve, v_refus, p_texte);
    return jsonb_build_object('etat', 'garde', 'version', s.version, 'motif', v_refus);
  end if;

  -- Version précédente : le texte d'avant, une fois par personne et par jour, jamais vide
  if not s.texte_vide then
    select coalesce(
      (select c.fuseau from public.projets p join public.classes c on c.id = p.classe_id where p.id = s.projet_id),
      'Europe/Paris') into v_fuseau;
    insert into public.versions_precedentes (scene_id, projet_id, enseignant_id, sorte, eleve_id, de_l_adulte, jour, texte)
    values (s.id, s.projet_id, s.enseignant_id, 'avant', p_eleve, p_eleve is null, (now() at time zone v_fuseau)::date, s.texte)
    on conflict do nothing;
  end if;

  update public.scenes sc
  set texte = v_texte,
      version = sc.version + 1,
      ecrit_le = now(),
      ecrit_par = case when p_eleve is null or p_eleve = any (sc.ecrit_par) then sc.ecrit_par else sc.ecrit_par || p_eleve end
  where sc.id = p_scene;
  return jsonb_build_object('etat', 'enregistre', 'version', s.version + 1);
end
$$;

-- « Mettre ce texte dans la scène » : le texte d'un élève, gardé sans note, reprend celles
-- de la scène en y entrant. L'ancien texte, gardé à part à son tour, a les siennes.
create or replace function public.mettre_copie_dans_scene(p_copie uuid) returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  c public.copies_recuperation%rowtype;
  s public.scenes%rowtype;
  v_texte jsonb;
begin
  select * into c from public.copies_recuperation x
  where x.id = p_copie and x.enseignant_id = (select auth.uid()) and x.retire_le is null;
  if not found then
    raise exception 'Ce texte n''est plus gardé à part.' using errcode = 'P0001';
  end if;
  select * into s from public.scenes sc where sc.id = c.scene_id for update;
  -- Relu sous le verrou de la scène : deux échanges demandés ensemble ne se croisent pas
  select * into c from public.copies_recuperation x where x.id = p_copie and x.retire_le is null for update;
  if not found then
    raise exception 'Ce texte n''est plus gardé à part.' using errcode = 'P0001';
  end if;
  v_texte := case when c.eleve_id is null then c.texte else prive.remettre_les_notes(s.texte, c.texte) end;
  update public.scenes sc set texte = v_texte, version = sc.version + 1, ecrit_le = now() where sc.id = s.id;
  if s.texte_vide then
    delete from public.copies_recuperation x where x.id = p_copie;
    return jsonb_build_object('version', s.version + 1, 'ancien', null);
  end if;
  update public.copies_recuperation x
  set texte = s.texte, sorte = 'ancien', eleve_id = null, motif = null, garde_le = now()
  where x.id = p_copie;
  return jsonb_build_object('version', s.version + 1, 'ancien', p_copie);
end
$$;
