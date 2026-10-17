import { MESSAGES_IA } from "@/domaine/aides-ia";
import { enseignantCourant } from "@/serveur/adulte";
import { demanderDesIdees } from "@/serveur/idees-de-choix";

/**
 * « ✦ Idées de choix », depuis l'en-tête de la copie (F13.3). Une adresse plutôt qu'une action
 * serveur, comme la correction. Corps : { scene, orientation?, dejaMontrees? } ; la consigne et
 * le texte sont relus par le serveur, la page ne redit que ce qu'elle a montré et l'orientation.
 */
export const maxDuration = 90;

export async function POST(requete: Request): Promise<Response> {
  const origine = requete.headers.get("origin");
  if (origine && origine !== new URL(requete.url).origin) return new Response(null, { status: 403 });
  const e = await enseignantCourant();
  if (!e) return Response.json({ ok: false, message: "Connectez-vous de nouveau." }, { status: 401 });
  let corps: { scene?: unknown; orientation?: unknown; dejaMontrees?: unknown };
  try {
    corps = await requete.json();
  } catch {
    return new Response(null, { status: 400 });
  }
  if (typeof corps.scene !== "string") return new Response(null, { status: 400 });
  try {
    return Response.json(await demanderDesIdees(e, corps.scene, { orientation: corps.orientation, dejaMontrees: corps.dejaMontrees }), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (erreur) {
    console.error("Idées de choix", erreur);
    return Response.json({ ok: false, message: MESSAGES_IA.pasDeReponse }, { status: 500 });
  }
}
