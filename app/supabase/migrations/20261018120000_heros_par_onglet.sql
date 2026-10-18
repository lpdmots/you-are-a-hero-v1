-- Étape 8, reprise du lot 7 : un onglet par héros dans l'étape Personnages (F10.2, F02),
-- décidé par le porteur le 18 octobre 2026.
--
-- Chaque héros a ses questions pour la classe, ses idées et son « Nous retenons », qui est sa
-- description : un seul texte, celui que lisent la carte et les aides. Les autres personnages
-- restent des cartes simples. Les projets existants rattachent au premier héros le texte
-- retenu commun et les idées de l'étape ; sans héros, une carte « Le héros » les reçoit.

-- « Nous retenons » d'un héros : la longueur d'un texte retenu de la Préparation
alter table public.personnages
  drop constraint personnages_description_check,
  add constraint personnages_description_check check (char_length(description) <= 6000),
  add constraint personnages_id_projet_unique unique (id, projet_id);

-- Questions et idées d'un héros, dans son projet ; supprimées avec lui
alter table public.questions
  add column personnage_id uuid,
  add constraint questions_personnage_fk foreign key (personnage_id, projet_id) references public.personnages (id, projet_id) on delete cascade;
alter table public.pistes
  add column personnage_id uuid,
  add constraint pistes_personnage_fk foreign key (personnage_id, projet_id) references public.personnages (id, projet_id) on delete cascade;
create index questions_personnage_idx on public.questions (personnage_id);
create index pistes_personnage_idx on public.pistes (personnage_id);

-- Les projets existants : un héros pour qui a déjà écrit dans l'étape et n'en a pas
insert into public.personnages (projet_id, enseignant_id, nom, heros, rang)
select p.projet_id, p.enseignant_id, 'Le héros', true, -1
from public.preparations p
where (
    btrim(p.personnages) <> ''
    or exists (select 1 from public.pistes x where x.projet_id = p.projet_id and x.rubrique = 'personnages')
    or exists (select 1 from public.questions q where q.projet_id = p.projet_id and q.etape = 'personnages')
  )
  and not exists (select 1 from public.personnages c where c.projet_id = p.projet_id and c.heros);

-- Le texte retenu commun devient celui de ce héros, sa description d'avant à la suite
with premier as (
  select distinct on (c.projet_id) c.id, c.projet_id, c.description
  from public.personnages c
  join public.preparations p on p.projet_id = c.projet_id
  where c.heros
  order by c.projet_id, nullif(position(lower(c.nom) in lower(p.personnages)), 0) nulls last, c.rang, c.cree_le, c.id
)
update public.personnages c
set description = left(
  btrim(p.personnages)
    || case when btrim(pr.description) <> '' and position(btrim(pr.description) in p.personnages) = 0 then E'\n' || btrim(pr.description) else '' end,
  6000)
from premier pr
join public.preparations p on p.projet_id = pr.projet_id
where c.id = pr.id and btrim(p.personnages) <> '';

with premier as (
  select distinct on (c.projet_id) c.id, c.projet_id
  from public.personnages c
  join public.preparations p on p.projet_id = c.projet_id
  where c.heros
  order by c.projet_id, nullif(position(lower(c.nom) in lower(p.personnages)), 0) nulls last, c.rang, c.cree_le, c.id
)
update public.pistes x set personnage_id = pr.id
from premier pr
where x.projet_id = pr.projet_id and x.rubrique = 'personnages' and x.personnage_id is null;

with premier as (
  select distinct on (c.projet_id) c.id, c.projet_id
  from public.personnages c
  join public.preparations p on p.projet_id = c.projet_id
  where c.heros
  order by c.projet_id, nullif(position(lower(c.nom) in lower(p.personnages)), 0) nulls last, c.rang, c.cree_le, c.id
)
update public.questions q set personnage_id = pr.id
from premier pr
where q.projet_id = pr.projet_id and q.etape = 'personnages' and q.personnage_id is null;

update public.preparations p set personnages = ''
where btrim(p.personnages) <> ''
  and exists (select 1 from public.personnages c where c.projet_id = p.projet_id and c.heros);
