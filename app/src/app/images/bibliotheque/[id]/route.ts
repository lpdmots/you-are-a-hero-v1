import { enseignantCourant } from "@/serveur/adulte";
import { fichierDeLaBibliotheque } from "@/serveur/bibliotheque";
import { TYPE_MIME } from "@/serveur/images";

/** Une image de la bibliothèque (F10.1) : tout adulte connecté la voit ; `?v=1` pour la vignette. */
export async function GET(requete: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const e = await enseignantCourant();
  if (!e) return new Response(null, { status: 404 });
  const fichier = await fichierDeLaBibliotheque(e, id, new URL(requete.url).searchParams.get("v") === "1");
  if (!fichier) return new Response(null, { status: 404 });
  return new Response(fichier.octets, {
    headers: {
      "Content-Type": TYPE_MIME[fichier.format] ?? "image/jpeg",
      // Une image ne change jamais sous son identifiant
      "Cache-Control": "private, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
