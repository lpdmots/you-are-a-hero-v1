import { revalidatePath } from "next/cache";
import { deposerLaCouverture } from "@/serveur/accueil";
import { enseignantCourant } from "@/serveur/adulte";

/**
 * Déposer la couverture d'un livre de l'accueil (F14-AC40) : un formulaire ordinaire, envoyé ici
 * plutôt qu'à une action, que Next limite à 1 Mo. Le porteur seul ; sinon, une page qui n'existe pas.
 */
export async function POST(requete: Request) {
  const e = await enseignantCourant();
  if (!e?.createur) return new Response(null, { status: 404 });
  const formulaire = await requete.formData().catch(() => null);
  const code = String(formulaire?.get("code") ?? "");
  const fichier = formulaire?.get("couverture");
  const r = fichier instanceof File ? await deposerLaCouverture(code, fichier) : "format";
  revalidatePath("/", "layout");
  const fait = r === "fait" ? "couverture-posee" : r === "format" ? "couverture-format" : "refus";
  return Response.redirect(new URL(`/admin?fait=${fait}#adm-accueil`, requete.url), 303);
}
