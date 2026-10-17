import { DEGRES, MESSAGES_IA, type Degre } from "@/domaine/aides-ia";
import { lireLongueur } from "@/domaine/correction";
import { enseignantCourant } from "@/serveur/adulte";
import { demanderUneCorrection } from "@/serveur/correction";

/**
 * Demander une correction (F13.1). Une adresse plutôt qu'une action serveur : Next.js passe
 * les actions d'un même navigateur l'une après l'autre, et une aide de quelques secondes
 * retiendrait les autres gestes de la page (l'enregistrement du titre, un changement d'état).
 *
 * Corps : { scene, version, degre, selection?, longueur? } — `selection`, les paragraphes que
 * touche la sélection de l'adulte ; `longueur`, aux degrés 4 et 5, un facteur ou un nombre de mots. La réponse porte le texte relu par le serveur et les propositions.
 */
export const maxDuration = 90;

export async function POST(requete: Request): Promise<Response> {
  const origine = requete.headers.get("origin");
  if (origine && origine !== new URL(requete.url).origin) return new Response(null, { status: 403 });
  const e = await enseignantCourant();
  if (!e) return Response.json({ ok: false, message: "Connectez-vous de nouveau." }, { status: 401 });
  let corps: { scene?: unknown; version?: unknown; degre?: unknown; selection?: unknown; longueur?: unknown };
  try {
    corps = await requete.json();
  } catch {
    return new Response(null, { status: 400 });
  }
  const degre = DEGRES.find((d) => d === corps.degre) as Degre | undefined;
  const selection = Array.isArray(corps.selection) ? corps.selection.filter((x): x is string => typeof x === "string").slice(0, 2000) : null;
  if (typeof corps.scene !== "string" || typeof corps.version !== "number" || !degre) return new Response(null, { status: 400 });
  try {
    const r = await demanderUneCorrection(e, corps.scene, corps.version, degre, selection?.length ? selection : null, lireLongueur(corps.longueur));
    return Response.json(r, { headers: { "Cache-Control": "no-store" } });
  } catch (erreur) {
    console.error("Correction", erreur);
    return Response.json({ ok: false, message: MESSAGES_IA.pasDeReponse }, { status: 500 });
  }
}
