import { imageParLeLien } from "@/serveur/lecteur";

/**
 * Une image de la version partagée, par le lien de lecture (F12.1) : seulement celles que la
 * version montre. Le navigateur la garde un jour, sans la partager avec d'autres : un lien
 * coupé ne sert plus d'image au-delà.
 */
export async function GET(requete: Request, { params }: { params: Promise<{ code: string; id: string }> }) {
  const { code, id } = await params;
  const vignette = new URL(requete.url).searchParams.get("v") === "1";
  const image = await imageParLeLien(code, id, vignette);
  if (!image) return new Response(null, { status: 404 });
  return new Response(image.octets, {
    headers: {
      "Content-Type": image.type,
      "Cache-Control": "private, max-age=86400",
      "X-Content-Type-Options": "nosniff",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}
