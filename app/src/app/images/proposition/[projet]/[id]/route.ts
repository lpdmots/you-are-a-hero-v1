import { enseignantCourant } from "@/serveur/adulte";
import { SEAU } from "@/serveur/images";
import { projetDe } from "@/serveur/lectures";
import { cheminProposition } from "@/serveur/personnages";
import { estUuid } from "@/serveur/recit";
import { clientService } from "@/serveur/supabase";

/**
 * Une image créée qui attend que l'adulte la garde ou la laisse (F10.2). Seul l'adulte du projet
 * la voit : le chemin se compose avec son identité, jamais avec ce que le navigateur envoie.
 */
export async function GET(_requete: Request, { params }: { params: Promise<{ projet: string; id: string }> }) {
  const { projet, id } = await params;
  if (!estUuid(projet) || !estUuid(id)) return new Response(null, { status: 404 });
  const e = await enseignantCourant();
  if (!e || !(await projetDe(e, projet))) return new Response(null, { status: 404 });
  const { data, error } = await clientService().storage.from(SEAU).download(cheminProposition(e.id, projet, id));
  if (error || !data) return new Response(null, { status: 404 });
  return new Response(data, {
    headers: { "Content-Type": data.type || "image/jpeg", "Cache-Control": "private, max-age=86400", "X-Content-Type-Options": "nosniff" },
  });
}
