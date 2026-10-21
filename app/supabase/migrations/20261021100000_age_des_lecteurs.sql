-- « Âge des lecteurs », réglé par projet (F13), décidé par le porteur le 21 octobre 2026.
--
-- Remplace « Niveau des élèves » de « Mon compte » (CE1 à CM2, cochés pour tout le compte) :
-- les noms de classes changent d'un pays à l'autre, un livre personnel peut s'adresser à des
-- adultes, et un même compte tient un livre de classe et un livre à soi. Une seule tranche
-- par projet ; dans un projet de classe, elle décrit aussi les élèves qui écrivent.
--
-- Chaque projet reçoit une fois la tranche la plus proche des niveaux cochés de son adulte
-- (âge moyen : CE1 7,5 ans, CE2 8,5, CM1 9,5, CM2 10,5) ; sans niveau coché, « 8 à 10 ans ».
-- Les niveaux restent dans `reglages_ia`, que l'application ne lit plus.

alter table public.projets
  add column age_des_lecteurs text not null default '8-10'
  check (age_des_lecteurs in ('6-8', '8-10', '10-12', '12-15', 'adultes'));
grant update (age_des_lecteurs) on public.projets to authenticated;

with moyennes as (
  select e.id as enseignant_id,
         avg(case n when 'CE1' then 7.5 when 'CE2' then 8.5 when 'CM1' then 9.5 when 'CM2' then 10.5 end) as age
  from public.enseignants e
  cross join lateral jsonb_array_elements_text(
    case when jsonb_typeof(e.reglages_ia -> 'niveaux') = 'array' then e.reglages_ia -> 'niveaux' else '[]'::jsonb end
  ) as n
  group by e.id
)
update public.projets p
set age_des_lecteurs = case when m.age < 8 then '6-8' when m.age < 10 then '8-10' else '10-12' end
from moyennes m
where m.enseignant_id = p.enseignant_id and m.age is not null;
