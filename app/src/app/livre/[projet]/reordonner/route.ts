import { revalidatePath } from "next/cache";
import { enseignantCourant } from "@/serveur/adulte";
import { estUuid } from "@/serveur/recit";
import { reordonnerLeLivre } from "@/serveur/livre/ordre";

/**
 * « Réordonner les passages » (F11.5, F11-AC64) : l'ordre proposé est composé une fois avant
 * d'être appliqué. Une route du livre, comme l'aperçu, parce qu'elle a besoin de Chromium.
 */

// La composition prend quelques secondes ; un premier appel décompresse Chromium (ADR 0003)
export const maxDuration = 60;

export async function POST(requete: Request, { params }: { params: Promise<{ projet: string }> }) {
  // Une demande venue d'une autre page que l'application est refusée
  const origine = requete.headers.get("origin");
  if (origine && origine !== new URL(requete.url).origin) return new Response(null, { status: 403 });
  const e = await enseignantCourant();
  if (!e) return Response.json({ ok: false, erreur: "Connectez-vous de nouveau." }, { status: 401 });
  const { projet } = await params;
  if (!estUuid(projet)) return Response.json({ ok: false, erreur: "Projet inconnu." }, { status: 404 });
  try {
    const r = await reordonnerLeLivre(e, projet);
    if (r.ok) revalidatePath(`/projet/${projet}`, "layout");
    return Response.json(r);
  } catch (erreur) {
    console.error("Réordonner les passages", erreur);
    return Response.json({ ok: false, erreur: "L’ordre n’a pas pu être changé. Réessayez dans un instant." }, { status: 500 });
  }
}
