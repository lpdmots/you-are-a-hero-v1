import { enseignantCourant } from "@/serveur/adulte";
import { apercuDuLivre } from "@/serveur/livre/apercu";

/** L'aperçu du livre (F11.2), composé sur le serveur ou repris tel quel si le livre n'a pas changé. */

export const maxDuration = 60;

export async function POST(requete: Request, { params }: { params: Promise<{ projet: string }> }) {
  const origine = requete.headers.get("origin");
  if (origine && origine !== new URL(requete.url).origin) return new Response(null, { status: 403 });
  const e = await enseignantCourant();
  if (!e) return Response.json({ ok: false, erreur: "Connectez-vous de nouveau." }, { status: 401 });
  const { projet } = await params;
  try {
    const apercu = await apercuDuLivre(e, projet);
    if (!apercu) return Response.json({ ok: false, erreur: "Ce projet est introuvable." }, { status: 404 });
    return Response.json({ ok: true, apercu }, { headers: { "Cache-Control": "no-store" } });
  } catch (erreur) {
    console.error("Aperçu du livre", erreur);
    return Response.json({ ok: false, erreur: "L’aperçu n’a pas pu être calculé. Réessayez dans un instant." }, { status: 500 });
  }
}
