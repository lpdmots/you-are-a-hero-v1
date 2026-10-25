import { MESSAGES_IA } from "@/domaine/aides-ia";
import { enseignantCourant } from "@/serveur/adulte";
import { demanderUnePresentation } from "@/serveur/publication";

/**
 * « ✦ Proposer » la présentation d'un livre proposé à la bibliothèque (F15). Une adresse plutôt
 * qu'une action serveur, comme les autres aides. Corps : { projet, actuelle } ; le livre est relu
 * par le serveur.
 */
export const maxDuration = 90;

export async function POST(requete: Request): Promise<Response> {
  const origine = requete.headers.get("origin");
  if (origine && origine !== new URL(requete.url).origin) return new Response(null, { status: 403 });
  const e = await enseignantCourant();
  if (!e) return Response.json({ ok: false, message: "Connectez-vous de nouveau." }, { status: 401 });
  let corps: { projet?: unknown; actuelle?: unknown };
  try {
    corps = await requete.json();
  } catch {
    return new Response(null, { status: 400 });
  }
  if (typeof corps.projet !== "string") return new Response(null, { status: 400 });
  try {
    return Response.json(await demanderUnePresentation(e, corps.projet, corps.actuelle), { headers: { "Cache-Control": "no-store" } });
  } catch (erreur) {
    console.error("Présentation", erreur);
    return Response.json({ ok: false, message: MESSAGES_IA.pasDeReponse }, { status: 500 });
  }
}
