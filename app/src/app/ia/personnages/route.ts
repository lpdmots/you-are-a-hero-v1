import { after } from "next/server";
import { MESSAGES_IA } from "@/domaine/aides-ia";
import { enseignantCourant } from "@/serveur/adulte";
import { demanderLaReference } from "@/serveur/images-creees";
import { estSorteDeCarte, preciserLaFiche, repererLesPersonnages } from "@/serveur/personnages";

/**
 * Personnages et objets de l'histoire (F10.2) : « Repérer les personnages », « Préciser pour les
 * images », « Créer son portrait » ou l'image de référence d'un objet. Une adresse plutôt qu'une
 * action serveur, comme les autres aides. Corps : { demande: "reperer", projet } ou
 * { demande: "fiche" | "images", sorte, id } ; la carte et la Préparation sont relues par le serveur.
 * « images » répond aussitôt avec la demande : l'image se crée ensuite (`after`), que la page reste
 * ouverte ou non, et se pose d'office sur la carte (19 octobre 2026).
 */
export const maxDuration = 300;

export async function POST(requete: Request): Promise<Response> {
  const origine = requete.headers.get("origin");
  if (origine && origine !== new URL(requete.url).origin) return new Response(null, { status: 403 });
  const e = await enseignantCourant();
  if (!e) return Response.json({ ok: false, message: "Connectez-vous de nouveau." }, { status: 401 });
  let corps: { demande?: unknown; projet?: unknown; sorte?: unknown; id?: unknown };
  try {
    corps = await requete.json();
  } catch {
    return new Response(null, { status: 400 });
  }
  const { demande } = corps;
  try {
    if (demande === "reperer") {
      if (typeof corps.projet !== "string") return new Response(null, { status: 400 });
      return Response.json(await repererLesPersonnages(e, corps.projet), { headers: { "Cache-Control": "no-store" } });
    }
    if ((demande === "fiche" || demande === "images") && estSorteDeCarte(corps.sorte) && typeof corps.id === "string") {
      if (demande === "fiche") return Response.json(await preciserLaFiche(e, corps.sorte, corps.id), { headers: { "Cache-Control": "no-store" } });
      const l = await demanderLaReference(e, corps.sorte, corps.id);
      if (!l.ok) return Response.json(l, { headers: { "Cache-Control": "no-store" } });
      after(l.travail);
      return Response.json({ ok: true, demande: l.demande }, { headers: { "Cache-Control": "no-store" } });
    }
    return new Response(null, { status: 400 });
  } catch (erreur) {
    console.error("Personnages", erreur);
    return Response.json({ ok: false, message: demande === "images" ? MESSAGES_IA.pasDImage : MESSAGES_IA.pasDeReponse }, { status: 500 });
  }
}
