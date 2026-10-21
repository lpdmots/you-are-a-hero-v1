import { enseignantCourant } from "@/serveur/adulte";
import { fichierARelire } from "@/serveur/bibliotheque";
import { TYPE_MIME } from "@/serveur/images";

/** Une image à relire pour la bibliothèque (F10.1), pour le porteur seul ; `?v=1` pour la vignette. */
export async function GET(requete: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const e = await enseignantCourant();
  if (!e?.createur) return new Response(null, { status: 404 });
  const fichier = await fichierARelire(id, new URL(requete.url).searchParams.get("v") === "1");
  if (!fichier) return new Response(null, { status: 404 });
  return new Response(fichier.octets, {
    headers: { "Content-Type": TYPE_MIME[fichier.format] ?? "image/jpeg", "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" },
  });
}
