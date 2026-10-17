import { MESSAGES_IA } from "@/domaine/aides-ia";
import { enseignantCourant } from "@/serveur/adulte";
import { demanderUneEcriture } from "@/serveur/aides-de-la-scene";

/**
 * « ✦ Écrire » une scène vide (F13.6). Une adresse plutôt qu'une action serveur, comme la
 * correction. Corps : { scene, version, mots } ; la consigne et ce qui mène à la scène sont
 * relus par le serveur.
 */
export const maxDuration = 90;

export async function POST(requete: Request): Promise<Response> {
  const origine = requete.headers.get("origin");
  if (origine && origine !== new URL(requete.url).origin) return new Response(null, { status: 403 });
  const e = await enseignantCourant();
  if (!e) return Response.json({ ok: false, message: "Connectez-vous de nouveau." }, { status: 401 });
  let corps: { scene?: unknown; version?: unknown; mots?: unknown };
  try {
    corps = await requete.json();
  } catch {
    return new Response(null, { status: 400 });
  }
  if (typeof corps.scene !== "string" || typeof corps.version !== "number") return new Response(null, { status: 400 });
  try {
    return Response.json(await demanderUneEcriture(e, corps.scene, corps.version, corps.mots), { headers: { "Cache-Control": "no-store" } });
  } catch (erreur) {
    console.error("Écriture", erreur);
    return Response.json({ ok: false, message: MESSAGES_IA.pasDeReponse }, { status: 500 });
  }
}
