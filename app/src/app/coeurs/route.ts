import { coeurDonne, donnerUnCoeur } from "@/serveur/coeurs";

/**
 * Les cœurs de la bibliothèque (F15-AC13), sans compte. POST { adresse, lecteur, oui } donne ou
 * retire ; GET ?adresse=…&lecteur=… dit si ce lecteur l'a donné. Le lecteur est l'identifiant que
 * le navigateur garde pour cette fonction ; rien d'autre ne part.
 */
export async function POST(requete: Request): Promise<Response> {
  const origine = requete.headers.get("origin");
  if (origine && origine !== new URL(requete.url).origin) return new Response(null, { status: 403 });
  let corps: { adresse?: unknown; lecteur?: unknown; oui?: unknown };
  try {
    corps = await requete.json();
  } catch {
    return new Response(null, { status: 400 });
  }
  const r = await donnerUnCoeur(corps.adresse, corps.lecteur, corps.oui);
  return Response.json(r, { status: r.ok ? 200 : 404, headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex" } });
}

export async function GET(requete: Request): Promise<Response> {
  const p = new URL(requete.url).searchParams;
  const donne = await coeurDonne(p.get("adresse") ?? "", p.get("lecteur") ?? "");
  return Response.json({ donne }, { headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex" } });
}
