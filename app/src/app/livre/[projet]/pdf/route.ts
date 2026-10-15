import { enseignantCourant } from "@/serveur/adulte";
import { produirePdfDeTravail } from "@/serveur/livre/livre";
import { etatEnMots } from "@/serveur/livre/pdf";

/**
 * Le PDF de travail (F11.2), demandé depuis « Relire » : composé par Chromium sur le serveur,
 * déposé dans le stockage. La réponse dit seulement où le prendre.
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
    const fait = await produirePdfDeTravail(e, projet);
    if (!fait.ok) return Response.json(fait, { status: 404 });
    return Response.json({ ok: true, id: fait.pdf.id, etat: etatEnMots(fait.pdf.etatDu), pages: fait.pdf.pages, adresse: `/livre/pdf/${fait.pdf.id}` });
  } catch (erreur) {
    console.error("PDF de travail", erreur);
    return Response.json({ ok: false, erreur: "Le PDF n’a pas pu être créé. Réessayez dans un instant." }, { status: 500 });
  }
}
