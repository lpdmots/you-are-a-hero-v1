-- Étape 8 du plan, lot 5 : la Préparation en étapes (F02, décision du 17 octobre 2026 ; F13.4).
-- Chaque étape de l'histoire a ses questions pour la classe, qui partent des relances du
-- guidage et s'allongent, à la main ou par l'IA ; une idée dit si elle vient de l'IA (F13-AC19) ;
-- l'orientation donnée à l'IA se garde par étape (F13, « Orienter l'IA »). Rien ici n'est lu
-- par un poste d'élève : la préparation reste à l'adulte (F02-AC04).

-- Les questions ajoutées à une étape. Les relances du guidage ne sont pas copiées ici : elles
-- restent celles de l'application, et ces questions viennent après elles.
create table public.questions (
  id uuid primary key default gen_random_uuid(),
  projet_id uuid not null,
  enseignant_id uuid not null,
  etape text not null check (etape in ('univers', 'personnages', 'enjeu', 'etapes')),
  texte text not null check (char_length(btrim(texte)) between 1 and 200),
  origine text not null default 'main' check (origine in ('main', 'ia')),
  cree_le timestamptz not null default now(),
  foreign key (projet_id, enseignant_id) references public.projets (id, enseignant_id) on delete cascade
);
create index questions_projet_idx on public.questions (projet_id);
create index questions_enseignant_idx on public.questions (enseignant_id);

-- Une idée notée à la main, ou ajoutée par l'IA, « à discuter » comme toute idée (F13-AC19)
alter table public.pistes add column origine text not null default 'main' check (origine in ('main', 'ia'));

-- « Orienter l'IA », par étape : { "personnages": "des animaux qui parlent", … }
alter table public.preparations add column orientations jsonb not null default '{}'::jsonb
  check (jsonb_typeof(orientations) = 'object' and octet_length(orientations::text) <= 4000);

grant select, insert, delete on public.questions to authenticated;
grant all on public.questions to service_role;

alter table public.questions enable row level security;
create policy enseignant_lit on public.questions
  for select to authenticated using (enseignant_id = (select auth.uid()));
create policy enseignant_cree on public.questions
  for insert to authenticated with check (enseignant_id = (select auth.uid()));
create policy enseignant_supprime on public.questions
  for delete to authenticated using (enseignant_id = (select auth.uid()));
