import { MESSAGES_IA } from "@/domaine/aides-ia";
import { enseignantCourant } from "@/serveur/adulte";
import { demanderUneConsigne } from "@/serveur/aides-de-la-scene";

/**
 * « ✦ Formuler », sous la consigne de la scène (F13.2). Une adresse plutôt qu'une action
 * serveur, comme la correction. Corps : { scene } ; l'indication est la consigne enregistrée,
 * relue par le serveur.
 */
export const maxDuration = 90;

export async function POST(requete: Request): Promise<Response> {
  const origine = requete.headers.get("origin");
  if (origine && origine !== new URL(requete.url).origin) return new Response(null, { status: 403 });
  const e = await enseignantCourant();
  if (!e) return Response.json({ ok: false, message: "Connectez-vous de nouveau." }, { status: 401 });
  let corps: { scene?: unknown };
  try {
    corps = await requete.json();
  } catch {
    return new Response(null, { status: 400 });
  }
  if (typeof corps.scene !== "string") return new Response(null, { status: 400 });
  try {
    return Response.json(await demanderUneConsigne(e, corps.scene), { headers: { "Cache-Control": "no-store" } });
  } catch (erreur) {
    console.error("Consigne", erreur);
    return Response.json({ ok: false, message: MESSAGES_IA.pasDeReponse }, { status: 500 });
  }
}
