import { enseignantCourant } from "@/serveur/adulte";
import { enregistrerPourAdulte, enregistrerPourEleve } from "@/serveur/copie";
import type { Enregistrement } from "@/domaine/copie";

/**
 * Enregistrer le texte d'une scène (F08.2). Une adresse plutôt qu'une action : la page
 * peut encore y envoyer ce qui attend au moment où elle se ferme.
 *
 * Corps : { scene, version, texte } pour l'adulte ; { ecriture, version, texte } pour un
 * élève. La réponse dit ce que le texte est devenu, jamais « enregistré » sans l'être.
 */
export async function POST(request: Request): Promise<Response> {
  // Seules les pages de l'application écrivent ici
  const origine = request.headers.get("origin");
  const hote = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (origine && hote && new URL(origine).host !== hote) return new Response(null, { status: 403 });

  let corps: { scene?: unknown; ecriture?: unknown; version?: unknown; texte?: unknown };
  try {
    corps = await request.json();
  } catch {
    return new Response(null, { status: 400 });
  }
  const version = typeof corps?.version === "number" ? corps.version : NaN;

  let fait: Enregistrement;
  if (typeof corps?.ecriture === "string") {
    fait = await enregistrerPourEleve(corps.ecriture, version, corps.texte);
  } else {
    const enseignant = await enseignantCourant();
    if (!enseignant || typeof corps?.scene !== "string") return new Response(null, { status: 401 });
    fait = await enregistrerPourAdulte(enseignant, corps.scene, version, corps.texte);
  }
  return Response.json(fait);
}
