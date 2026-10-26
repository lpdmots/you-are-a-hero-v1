import "server-only";
import { cache } from "react";
import { nomsDesObjets } from "./lecteur";
import { SEAU, TYPE_MIME, type FormatImage } from "./images";
import { estUuid } from "./recit";
import { clientService } from "./supabase";
import { estAge } from "@/domaine/aides-ia";
import { ADRESSE_VALIDE } from "@/domaine/bibliotheque";
import type { LivrePublie } from "@/domaine/bibliotheque-publique";
import { versionAvecObjets } from "@/domaine/inventaire";
import type { PresentationPartagee, VersionPartagee } from "@/domaine/partage";

/**
 * La bibliothèque, côté public (F15) : personne n'y est connecté ; le serveur lit les versions
 * publiées avec la clé de service, par leur adresse, et ne rend rien d'autre — ni le projet, ni le
 * compte, ni la proposition en attente. Une adresse inconnue ou retirée mène à la page neutre.
 */

type Ligne = {
  adresse: string;
  presentation: string;
  age: string;
  publiee_le: string;
  titre: string | null;
  a_choix: boolean | null;
  page: PresentationPartagee["titre"] | null;
  images: Record<string, { largeur?: number; hauteur?: number }> | null;
  dernier: number | null;
  passages: number | null;
};

const enLivre = (l: Ligne): LivrePublie => {
  const page = l.page;
  const image = page?.image ?? page?.illustration ?? null;
  const taille = image ? l.images?.[image] : undefined;
  return {
    adresse: l.adresse,
    titre: page?.titre?.trim() || l.titre?.trim() || "Sans titre",
    sousTitre: page?.sousTitre?.trim() ?? "",
    ligne: page?.ligne?.trim() ?? "",
    presentation: l.presentation,
    age: estAge(l.age) ? l.age : "8-10",
    aChoix: l.a_choix === true,
    passages: l.a_choix ? (l.dernier ?? 0) : 0,
    image: image ? { id: image, pleinePage: Boolean(page?.image), ratio: taille?.largeur && taille?.hauteur ? taille.largeur / taille.hauteur : 16 / 9 } : null,
    publieLe: l.publiee_le,
    coeurs: 0,
  };
};

// Le numéro du dernier passage et la page de titre, plutôt que la version entière : quelques octets par livre
const COLONNES =
  "adresse, presentation, age, publiee_le, titre:version->>titre, a_choix:version->aChoix, page:version->presentation->titre, images:version->images, dernier:version->passages->-1->numero";

/** Tous les livres publiés, pour la page ; une base qui ne répond pas laisse la page vide. */
export const livresPublies = cache(async (): Promise<LivrePublie[] | null> => {
  try {
    const { data, error } = await clientService().from("publications").select(COLONNES).not("version", "is", null).order("publiee_le", { ascending: false }).limit(2000);
    if (error) return null;
    // Le typage de supabase-js ne lit pas l'indice négatif « ->-1 », que PostgREST accepte
    return (data as unknown as Ligne[]).map(enLivre);
  } catch {
    return null;
  }
});

/** Un livre publié par son adresse, pour son tiroir ; rien s'il n'est pas (ou plus) dans la bibliothèque. */
export async function livrePublie(adresse: string): Promise<LivrePublie | null> {
  if (!ADRESSE_VALIDE.test(adresse) || adresse.length > 80) return null;
  const tous = await livresPublies();
  return tous?.find((l) => l.adresse === adresse) ?? null;
}

export type LuDansLaBibliotheque = { sorte: "livre"; version: VersionPartagee } | { sorte: "neutre" } | { sorte: "indisponible" };

/** La version publiée, pour le lecteur ; les noms des objets que ses actions nomment (F04-AC20). */
export async function versionPubliee(adresse: string): Promise<LuDansLaBibliotheque> {
  if (!ADRESSE_VALIDE.test(adresse) || adresse.length > 80) return { sorte: "neutre" };
  try {
    const { data, error } = await clientService().from("publications").select("version, projet_id").eq("adresse", adresse).not("version", "is", null).maybeSingle();
    if (error) return { sorte: "indisponible" };
    if (!data?.version) return { sorte: "neutre" };
    return { sorte: "livre", version: versionAvecObjets(data.version as VersionPartagee, await nomsDesObjets(data.projet_id as string)) };
  } catch {
    return { sorte: "indisponible" };
  }
}

/** Une image d'un livre publié : seulement celles que sa version montre ; la vignette (900 points) ou l'image entière. */
export async function imagePubliee(adresse: string, imageId: string, vignette: boolean): Promise<{ octets: Blob; type: string } | null> {
  if (!ADRESSE_VALIDE.test(adresse) || !estUuid(imageId)) return null;
  const base = clientService();
  const { data: l } = await base.from("publications").select("projet_id, images:version->images").eq("adresse", adresse).not("version", "is", null).maybeSingle();
  const images = (l?.images ?? null) as Record<string, unknown> | null;
  if (!l || !images || !(imageId in images)) return null;
  const { data: image } = await base.from("images").select("chemin, chemin_vignette, format").eq("id", imageId).eq("projet_id", l.projet_id).maybeSingle();
  if (!image) return null;
  const { data } = await base.storage.from(SEAU).download((vignette ? image.chemin_vignette : image.chemin) as string);
  return data ? { octets: data, type: TYPE_MIME[image.format as FormatImage] ?? "image/jpeg" } : null;
}
