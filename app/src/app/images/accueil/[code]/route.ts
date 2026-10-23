import { fichierDeCouverture } from "@/serveur/accueil";

/**
 * La couverture d'un livre de l'accueil (F14-AC40), pour tous. Son adresse change à chaque dépôt
 * (`?c=`) : elle se garde un jour, sans risque de montrer l'ancienne.
 */
export async function GET(_requete: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const fichier = await fichierDeCouverture(code);
  if (!fichier) return new Response(null, { status: 404 });
  return new Response(fichier, {
    headers: {
      "Content-Type": "image/webp",
      "Cache-Control": "public, max-age=86400",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
