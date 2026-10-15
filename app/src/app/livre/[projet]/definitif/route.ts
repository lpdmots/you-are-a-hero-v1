import { enseignantCourant } from "@/serveur/adulte";
import { produirePdfDefinitif } from "@/serveur/livre/livre";
import { etatEnMots } from "@/serveur/livre/pdf";

/**
 * Le PDF définitif (F11.2), demandé depuis « Imprimer et partager » : la règle unique est
 * vérifiée sur l'instantané composé ; refusé, la réponse dit ce qui reste, étape par étape.
 */

// La composition prend quelques secondes ; un premier appel décompresse Chromium (ADR 0003)
export const maxDuration = 60;

export async function POST(requete: Request, { params }: { params: Promise<{ projet: string }> }) {
  // Une demande venue d'une autre page que l'application est refusée
  const origine = requete.headers.get("origin");
  if (origine && origine !== new URL(requete.url).origin) return new Response(null, { status: 403 });
  const e = await enseignantCourant();
  if (!e) return Response.json({ ok: false, erreur: "Connectez-vous de nouveau." }, { status: 401 });
  const { projet } = await params;
  try {
    const fait = await produirePdfDefinitif(e, projet);
    if (!fait.ok) return Response.json(fait, { status: fait.raisons ? 409 : 404 });
    return Response.json({ ok: true, id: fait.pdf.id, etat: etatEnMots(fait.pdf.etatDu), pages: fait.pdf.pages, taille: fait.pdf.taille, adresse: `/livre/pdf/${fait.pdf.id}` });
  } catch (erreur) {
    console.error("PDF définitif", erreur);
    return Response.json({ ok: false, erreur: "Le PDF n’a pas pu être créé. Réessayez dans un instant." }, { status: 500 });
  }
}
