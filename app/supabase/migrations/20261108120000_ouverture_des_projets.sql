-- « Mes projets » rangé par dernière ouverture (F06.5, F06-AC103, 8 novembre 2026) : la date à
-- laquelle l'adulte a ouvert un projet pour la dernière fois. Un projet jamais ouvert depuis prend
-- sa date de création pour le rang ; au départ, seul le dernier projet ouvert de chaque compte en a
-- une, ce qui le met en tête, comme sa carte « Continuer ».

alter table public.projets add column ouvert_le timestamptz;

update public.projets p set ouvert_le = now()
from public.enseignants e
where e.dernier_projet_id = p.id;

-- Posée par l'adulte quand il ouvre son projet, avec son dernier onglet
grant update (ouvert_le) on public.projets to authenticated;
