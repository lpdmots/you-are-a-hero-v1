import { imagePubliee } from "@/serveur/bibliotheque-publique";

/**
 * Une image d'un livre de la bibliothèque (F15) : seulement celles que sa version publiée montre ;
 * `?v=1` pour la vignette. Gardée un jour par le navigateur ; fermée aux moteurs, comme le livre.
 */
export async function GET(requete: Request, { params }: { params: Promise<{ adresse: string; id: string }> }) {
  const { adresse, id } = await params;
  const image = await imagePubliee(adresse, id, new URL(requete.url).searchParams.get("v") === "1");
  if (!image) return new Response(null, { status: 404 });
  return new Response(image.octets, {
    headers: {
      "Content-Type": image.type,
      "Cache-Control": "public, max-age=86400",
      "X-Content-Type-Options": "nosniff",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}
