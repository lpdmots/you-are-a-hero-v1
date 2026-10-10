import { enseignantCourant } from "@/serveur/adulte";
import { SEAU } from "@/serveur/images";
import { clientDuPoste, etatDuPoste } from "@/serveur/poste";
import { estUuid } from "@/serveur/recit";
import { clientService } from "@/serveur/supabase";

/**
 * Une image de repérage (F10.1). La base dit d'abord si la personne peut la voir : l'adulte
 * voit les images de ses projets ; un poste, celles qui servent de repère dans le récit de
 * sa classe (F10-AC06). Le fichier n'est lu dans le stockage qu'ensuite.
 */
export async function GET(requete: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!estUuid(id)) return new Response(null, { status: 404 });
  const vignette = new URL(requete.url).searchParams.get("v") === "1";

  let chemins: { chemin: string; chemin_vignette: string } | null = null;
  const enseignant = await enseignantCourant();
  if (enseignant) {
    const { data } = await enseignant.supabase.from("images").select("chemin, chemin_vignette").eq("id", id).maybeSingle();
    chemins = data;
  }
  if (!chemins) {
    const poste = await etatDuPoste();
    if (poste?.inscriptionId) {
      const { data } = await (await clientDuPoste(poste)).rpc("image_du_poste", { p_image: id });
      chemins = (Array.isArray(data) ? data[0] : data) ?? null;
    }
  }
  if (!chemins) return new Response(null, { status: 404 });

  const { data, error } = await clientService().storage.from(SEAU).download(vignette ? chemins.chemin_vignette : chemins.chemin);
  if (error || !data) return new Response(null, { status: 404 });
  return new Response(data, {
    headers: {
      "Content-Type": "image/jpeg",
      // Une image ne change jamais sous son identifiant : le navigateur de la personne la garde
      "Cache-Control": "private, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
