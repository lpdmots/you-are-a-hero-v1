import { after } from "next/server";
import { MESSAGES_IA } from "@/domaine/aides-ia";
import { estUsageDeLaCouverture } from "@/domaine/couverture";
import { enseignantCourant } from "@/serveur/adulte";
import {
  demanderLaCouverture, demanderLeReperage, demanderLesImagesALAjout, demanderLImageDeScene, lireDemandeDeScene, proposerLaCouverture, proposerLaDescription, type Lancee,
} from "@/serveur/images-creees";

/**
 * Les images créées (F10.1, F10.2, F11.4) : l'image de repérage d'après le résumé, celle créée
 * d'office à l'ajout d'une partie ou d'un chapitre par l'IA, la description et l'image d'une
 * scène, la description de la couverture. Une adresse plutôt qu'une action serveur, comme les
 * autres aides. Corps :
 *   { demande: "reperage", sorte: "projet" | "partie" | "chapitre", id }
 *   { demande: "a-l-ajout", sorte: "partie" | "chapitre", ids }
 *   { demande: "description", scene, cadrage, badges }
 *   { demande: "image-scene", scene, cadrage, badges, apresBloc, alt }
 *   { demande: "couverture", projet }  (la description de la couverture)
 *   { demande: "creer-couverture", projet, usage: "imprimer" | "site" }  (F11-AC110, AC111)
 * Le résumé, la scène, l'idée et la description sont relus par le serveur. Une image ne se fait
 * pas attendre : la réponse part aussitôt avec la demande, l'image se crée ensuite (`after`), que
 * la page reste ouverte ou non, et la page suit la demande.
 */
export const maxDuration = 300;

const pasDeCache = { headers: { "Cache-Control": "no-store" } };

/** La demande ouverte part aussitôt ; l'image se crée après la réponse. */
function lancer(l: Lancee): Response {
  if (!l.ok) return Response.json(l, pasDeCache);
  after(l.travail);
  return Response.json({ ok: true, demande: l.demande }, pasDeCache);
}

export async function POST(requete: Request): Promise<Response> {
  const origine = requete.headers.get("origin");
  if (origine && origine !== new URL(requete.url).origin) return new Response(null, { status: 403 });
  const e = await enseignantCourant();
  if (!e) return Response.json({ ok: false, message: "Connectez-vous de nouveau." }, { status: 401 });
  let corps: Record<string, unknown>;
  try {
    corps = await requete.json();
  } catch {
    return new Response(null, { status: 400 });
  }
  const { demande } = corps;
  try {
    if (demande === "reperage" && (corps.sorte === "projet" || corps.sorte === "partie" || corps.sorte === "chapitre") && typeof corps.id === "string") {
      return lancer(await demanderLeReperage(e, corps.sorte, corps.id));
    }
    if (demande === "a-l-ajout" && (corps.sorte === "partie" || corps.sorte === "chapitre") && Array.isArray(corps.ids)) {
      const l = await demanderLesImagesALAjout(e, corps.sorte, corps.ids.filter((x): x is string => typeof x === "string"));
      after(l.travail);
      return Response.json({ ok: true, demandes: l.demandes }, pasDeCache);
    }
    if ((demande === "description" || demande === "image-scene") && typeof corps.scene === "string") {
      const d = lireDemandeDeScene(corps);
      if (!d) return new Response(null, { status: 400 });
      if (demande === "description") return Response.json(await proposerLaDescription(e, corps.scene, d), pasDeCache);
      return lancer(await demanderLImageDeScene(e, corps.scene, { ...d, apresBloc: typeof corps.apresBloc === "string" ? corps.apresBloc : null, alt: typeof corps.alt === "string" ? corps.alt : "" }));
    }
    if (demande === "creer-couverture" && typeof corps.projet === "string" && estUsageDeLaCouverture(corps.usage)) {
      return lancer(await demanderLaCouverture(e, corps.projet, corps.usage));
    }
    if (demande === "couverture" && typeof corps.projet === "string") {
      return Response.json(await proposerLaCouverture(e, corps.projet), pasDeCache);
    }
    return new Response(null, { status: 400 });
  } catch (erreur) {
    console.error("Images créées", erreur);
    const texte = demande === "description" || demande === "couverture";
    return Response.json({ ok: false, message: texte ? MESSAGES_IA.pasDeReponse : MESSAGES_IA.pasDImage }, { status: 500 });
  }
}
