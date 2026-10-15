-- Étape 6, lot 4 : « Mettre en page », volet « Aperçu » (F11.3, F11.5, F11.6).
--
-- Les commandes d'un passage dans l'aperçu : monter, descendre ou placer après un numéro, ce qui
-- récrit les rangs gardés de son groupe de mélange, et « Commencer sur une nouvelle page ».
-- La déclaration « La mise en page me convient », et l'ouverture d'« Imprimer et partager », qui
-- ne se referme plus (F11.6).

alter table public.scenes
  -- Ajustement de l'adulte : le passage commence en haut d'une page (F11.3), gardé d'un export à l'autre (F11-AC10)
  add column nouvelle_page boolean not null default false;

alter table public.projets
  -- « La mise en page me convient » : posée par l'adulte, retirée par « Reprendre »
  add column mise_en_page_convient_le timestamptz,
  -- « Imprimer et partager » s'ouvre à la première déclaration, puis ne se referme plus
  add column imprimer_ouvert_le timestamptz;

-- Les scènes ne se modifient que par l'adulte qui les possède (politique enseignant_modifie)
grant update (rang_livre, nouvelle_page) on public.scenes to authenticated;
grant update (mise_en_page_convient_le, imprimer_ouvert_le) on public.projets to authenticated;

-- Récrire en une fois les rangs gardés de plusieurs scènes : un déplacement, ou son annulation.
-- Les droits de l'appelant s'appliquent : seul l'adulte du projet modifie ses scènes. Rien ne
-- se fait tant que l'ordre du livre n'est pas établi (F11.5).
create function public.placer_passages(p_projet uuid, p_rangs jsonb) returns integer
language plpgsql security invoker set search_path = ''
as $$
declare
  n integer;
begin
  if jsonb_typeof(p_rangs) <> 'object' then
    raise exception 'Rangs illisibles.' using errcode = 'P0001';
  end if;
  if not exists (select 1 from public.projets p where p.id = p_projet and p.ordre_etabli_le is not null) then
    raise exception 'L''ordre du livre n''est pas encore établi.' using errcode = 'P0001';
  end if;
  update public.scenes s set rang_livre = (p_rangs ->> s.id::text)::integer
  where s.projet_id = p_projet and p_rangs ? s.id::text;
  get diagnostics n = row_count;
  return n;
end
$$;
grant execute on function public.placer_passages(uuid, jsonb) to authenticated;
