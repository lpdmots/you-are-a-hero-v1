import { MESSAGES_IA } from "@/domaine/aides-ia";
import { enseignantCourant } from "@/serveur/adulte";
import { demanderUnBloc } from "@/serveur/bloc-de-scenes";

/**
 * « ✦ Proposer » un bloc de scènes, depuis « Chemins » (F13.7). Une adresse plutôt qu'une action
 * serveur, comme les idées de choix : la réponse d'Opus peut prendre près d'une minute. Corps :
 * { chapitre, origine, demande, reponses?, actuelle? } ; le serveur relit lui-même le chapitre,
 * la Préparation et le texte de la scène d'origine.
 */
export const maxDuration = 90;

export async function POST(requete: Request): Promise<Response> {
  const origine = requete.headers.get("origin");
  if (origine && origine !== new URL(requete.url).origin) return new Response(null, { status: 403 });
  const e = await enseignantCourant();
  if (!e) return Response.json({ ok: false, message: "Connectez-vous de nouveau." }, { status: 401 });
  let corps: { chapitre?: unknown; origine?: unknown; demande?: unknown; reponses?: unknown; actuelle?: unknown };
  try {
    corps = await requete.json();
  } catch {
    return new Response(null, { status: 400 });
  }
  if (typeof corps.chapitre !== "string") return new Response(null, { status: 400 });
  try {
    return Response.json(await demanderUnBloc(e, corps.chapitre, { origine: corps.origine ?? null, demande: corps.demande, reponses: corps.reponses, actuelle: corps.actuelle }), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (erreur) {
    console.error("Bloc de scènes", erreur);
    return Response.json({ ok: false, message: MESSAGES_IA.pasDeReponse }, { status: 500 });
  }
}
