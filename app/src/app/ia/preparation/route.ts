import { MESSAGES_IA } from "@/domaine/aides-ia";
import { estRubrique } from "@/domaine/preparation";
import { enseignantCourant } from "@/serveur/adulte";
import { demanderPourLEtape, estSorteAidePreparation } from "@/serveur/preparation-ia";

/**
 * Les aides d'une étape de la Préparation (F13.4) : questions, idées, « Rédiger d'après les
 * idées ». Une adresse plutôt qu'une action serveur, comme les autres aides. Corps :
 * { projet, etape, sorte } ; tout ce qui part est relu par le serveur, orientation comprise.
 */
export const maxDuration = 90;

export async function POST(requete: Request): Promise<Response> {
  const origine = requete.headers.get("origin");
  if (origine && origine !== new URL(requete.url).origin) return new Response(null, { status: 403 });
  const e = await enseignantCourant();
  if (!e) return Response.json({ ok: false, message: "Connectez-vous de nouveau." }, { status: 401 });
  let corps: { projet?: unknown; etape?: unknown; sorte?: unknown };
  try {
    corps = await requete.json();
  } catch {
    return new Response(null, { status: 400 });
  }
  if (typeof corps.projet !== "string" || typeof corps.etape !== "string" || !estRubrique(corps.etape) || !estSorteAidePreparation(corps.sorte)) {
    return new Response(null, { status: 400 });
  }
  try {
    return Response.json(await demanderPourLEtape(e, corps.projet, corps.etape, corps.sorte), { headers: { "Cache-Control": "no-store" } });
  } catch (erreur) {
    console.error("Préparation", erreur);
    return Response.json({ ok: false, message: MESSAGES_IA.pasDeReponse }, { status: 500 });
  }
}
