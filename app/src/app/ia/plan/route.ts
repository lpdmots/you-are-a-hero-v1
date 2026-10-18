import { MESSAGES_IA } from "@/domaine/aides-ia";
import { enseignantCourant } from "@/serveur/adulte";
import { demanderDesChapitres, demanderDesParties, demanderUnResume, estSortePlan } from "@/serveur/plan-ia";

/**
 * Parties, chapitres et résumés (F13.5). Une adresse plutôt qu'une action serveur, comme les
 * autres aides. Corps : { sorte, projet | partie | chapitre, orientation?, dejaMontres? } ; la
 * Préparation et le plan sont relus par le serveur.
 */
export const maxDuration = 90;

export async function POST(requete: Request): Promise<Response> {
  const origine = requete.headers.get("origin");
  if (origine && origine !== new URL(requete.url).origin) return new Response(null, { status: 403 });
  const e = await enseignantCourant();
  if (!e) return Response.json({ ok: false, message: "Connectez-vous de nouveau." }, { status: 401 });
  let corps: { sorte?: unknown; projet?: unknown; partie?: unknown; chapitre?: unknown; orientation?: unknown; dejaMontres?: unknown };
  try {
    corps = await requete.json();
  } catch {
    return new Response(null, { status: 400 });
  }
  const { sorte } = corps;
  if (!estSortePlan(sorte)) return new Response(null, { status: 400 });
  const id = sorte === "parties" ? corps.projet : sorte === "chapitres" ? corps.partie : corps.chapitre;
  if (typeof id !== "string") return new Response(null, { status: 400 });
  try {
    const options = { orientation: corps.orientation, dejaMontres: corps.dejaMontres };
    const reponse =
      sorte === "parties" ? await demanderDesParties(e, id, options) : sorte === "chapitres" ? await demanderDesChapitres(e, id, options) : await demanderUnResume(e, id);
    return Response.json(reponse, { headers: { "Cache-Control": "no-store" } });
  } catch (erreur) {
    console.error("Plan", erreur);
    return Response.json({ ok: false, message: MESSAGES_IA.pasDeReponse }, { status: 500 });
  }
}
