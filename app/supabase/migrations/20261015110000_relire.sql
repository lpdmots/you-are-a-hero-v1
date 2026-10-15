-- Étape 6, lot 2 : « Relire » et la mémoire du Livre (F11.6).
--
-- « J'ai relu le livre » est un jugement de l'adulte, gardé quand une scène est rouverte,
-- comme « J'ai vérifié les chemins » (F11-AC91). La destination Livre s'ouvre sur la dernière
-- étape quittée, « Relire » la première fois (F11.6, « Variantes »).

alter table public.projets
  add column livre_relu_le timestamptz,
  add column derniere_etape_livre text check (derniere_etape_livre in ('relire', 'chemins', 'page', 'sortie'));

grant update (livre_relu_le, derniere_etape_livre) on public.projets to authenticated;

-- L'aperçu du livre (F11.2) est gardé dans le seau des PDF, avec sa carte des blocs : le
-- même livre ne se recompose pas à chaque visite.
update storage.buckets set allowed_mime_types = array['application/pdf', 'application/json'] where id = 'livres';
