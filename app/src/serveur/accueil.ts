import "server-only";
import sharp from "sharp";
import { PAGE } from "@/domaine/mise-en-page";
import type { PresentationPartagee } from "@/domaine/partage";
import type { Enseignant } from "./adulte";
import { lireImage, SEAU } from "./images";
import { clientService } from "./supabase";

/**
 * Un livre posé sur le feuillet 27, fermé (design.md, « Le passage 27 ») : sa couverture déposée
 * dans l'administration, la face avant du livre imprimé (`couverture`) ; sinon sa page de titre,
 * l'image d'une page de titre faite à la main qui la remplit (`pleinePage`), ou le titre, le
 * sous-titre et l'illustration entière, dans ses proportions (`ratio`, largeur sur hauteur).
 */
export type LivreDeLAccueil = {
  code: string;
  titre: string;
  sousTitre: string;
  couverture: string | null;
  image: string | null;
  pleinePage: boolean;
  ratio: number;
  /** Le nombre de passages d'un livre à choix, lu sur le numéro du dernier ; rien en récit classique */
  passages: number | null;
};

/** Ce que les réglages gardent de chaque livre de l'accueil (F14-AC40), deux au plus, dans l'ordre. */
export type EntreeDeLAccueil = { code: string; couverture: string | null };

export const POIDS_MAX_COUVERTURE = 4 * 1024 * 1024;
const CODE = /^[abcdefghjkmnpqrstuvwxyz23456789]{10}$/;

function entreesDe(brut: unknown): EntreeDeLAccueil[] {
  if (!Array.isArray(brut)) return [];
  return brut
    .map((e) => (e ?? {}) as { code?: unknown; couverture?: unknown })
    .filter((e): e is { code: string; couverture?: unknown } => typeof e.code === "string" && CODE.test(e.code))
    .map((e) => ({ code: e.code, couverture: typeof e.couverture === "string" && e.couverture.startsWith("accueil/") ? e.couverture : null }))
    .slice(0, 2);
}

async function entreesActuelles(): Promise<EntreeDeLAccueil[]> {
  const { data } = await clientService().from("reglages_application").select("livres_de_l_accueil").maybeSingle();
  return entreesDe(data?.livres_de_l_accueil);
}

async function garderLesEntrees(entrees: EntreeDeLAccueil[]): Promise<boolean> {
  const { error } = await clientService().from("reglages_application").update({ livres_de_l_accueil: entrees.slice(0, 2) }).eq("id", true);
  return !error;
}

/**
 * Les livres à feuilleter de l'accueil (F14, « Pages publiques » ; F14-AC40) : deux livres du
 * porteur, partagés par lien, choisis dans l'administration. Le titre et la page de titre
 * viennent de la version partagée : rien n'est écrit en dur, et un partage retiré disparaît de
 * l'accueil. Une base qui ne répond pas laisse la page sans livres.
 */
export async function livresDeLAccueil(): Promise<LivreDeLAccueil[]> {
  try {
    const entrees = await entreesActuelles();
    if (entrees.length === 0) return [];
    const { data, error } = await clientService()
      .from("partages")
      // Le numéro du dernier passage, plutôt que les passages entiers : quelques octets au lieu de centaines de kilo-octets
      .select("code, titre:version->>titre, presentation:version->presentation, images:version->images, dernier:version->passages->-1->numero")
      .in("code", entrees.map((e) => e.code))
      .eq("par_lien", true)
      .not("version", "is", null);
    if (error || !data) return [];
    // Le typage de supabase-js ne lit pas l'indice négatif « ->-1 », que PostgREST accepte
    const lus = data as unknown as {
      code: string;
      titre: string | null;
      presentation: PresentationPartagee | null;
      images: Record<string, { largeur?: number; hauteur?: number }> | null;
      dernier: number | null;
    }[];
    return entrees.flatMap(({ code, couverture }) => {
      const lu = lus.find((l) => l.code === code);
      if (!lu) return [];
      const page = lu.presentation?.titre;
      const image = page?.image ?? page?.illustration ?? null;
      const taille = image ? lu.images?.[image] : undefined;
      return [
        {
          code,
          titre: page?.titre?.trim() || lu.titre?.trim() || "Un livre de la classe",
          sousTitre: page?.sousTitre?.trim() ?? "",
          // Le nom du fichier change à chaque dépôt : l'adresse aussi, et aucun cache ne garde l'ancienne
          couverture: couverture ? `/images/accueil/${code}?c=${encodeURIComponent(couverture.slice("accueil/".length))}` : null,
          image: image ? `/images/lire/${code}/${image}?v=1` : null,
          pleinePage: Boolean(page?.image),
          ratio: taille?.largeur && taille?.hauteur ? taille.largeur / taille.hauteur : 16 / 9,
          passages: typeof lu.dernier === "number" && lu.dernier > 0 ? lu.dernier : null,
        },
      ];
    });
  } catch {
    return [];
  }
}

// ——— Dans l'administration du porteur (F14-AC40) ———

export type LivrePartage = { code: string; titre: string; surLAccueil: boolean; couverture: string | null };

/** Les livres du porteur partagés par lien, ceux de l'accueil d'abord, dans leur ordre. */
export async function livresAChoisir(porteur: Enseignant): Promise<LivrePartage[]> {
  const [entrees, { data }] = await Promise.all([
    entreesActuelles(),
    clientService().from("partages").select("code, titre:version->>titre").eq("enseignant_id", porteur.id).eq("par_lien", true).not("version", "is", null),
  ]);
  const partages = ((data ?? []) as { code: string; titre: string | null }[]).map((p) => ({ code: p.code, titre: p.titre?.trim() || "Sans titre" }));
  const rang = (code: string) => {
    const i = entrees.findIndex((e) => e.code === code);
    return i < 0 ? 99 : i;
  };
  return partages
    .map((p) => {
      const entree = entrees.find((e) => e.code === p.code);
      return {
        ...p,
        surLAccueil: Boolean(entree),
        couverture: entree?.couverture ? `/images/accueil/${p.code}?c=${encodeURIComponent(entree.couverture.slice("accueil/".length))}` : null,
      };
    })
    .sort((a, b) => rang(a.code) - rang(b.code) || a.titre.localeCompare(b.titre, "fr"));
}

/** Poser un livre du porteur sur l'accueil, après les autres, ou l'en retirer avec sa couverture. */
export async function choisirPourLAccueil(porteur: Enseignant, code: string, oui: boolean): Promise<"fait" | "plein" | "refus"> {
  if (!CODE.test(code)) return "refus";
  const entrees = await entreesActuelles();
  const deja = entrees.find((e) => e.code === code);
  if (!oui) {
    if (!deja) return "fait";
    if (!(await garderLesEntrees(entrees.filter((e) => e.code !== code)))) return "refus";
    if (deja.couverture) await clientService().storage.from(SEAU).remove([deja.couverture]);
    return "fait";
  }
  if (deja) return "fait";
  if (entrees.length >= 2) return "plein";
  const { data } = await clientService().from("partages").select("code").eq("code", code).eq("enseignant_id", porteur.id).eq("par_lien", true).maybeSingle();
  if (!data) return "refus";
  return (await garderLesEntrees([...entrees, { code, couverture: null }])) ? "fait" : "refus";
}

/** Échanger l'ordre des deux livres de l'accueil. */
export async function echangerLesLivres(): Promise<boolean> {
  const entrees = await entreesActuelles();
  return entrees.length === 2 ? garderLesEntrees([entrees[1], entrees[0]]) : true;
}

/**
 * La couverture d'un livre de l'accueil : la face avant seule. Une couverture entière, plus large
 * que haute (quatrième, dos, face avant), est coupée à sa moitié droite, dos compris en marge :
 * la quatrième, qui porte souvent les prénoms des élèves, n'est jamais gardée.
 */
export async function deposerLaCouverture(code: string, fichier: File): Promise<"fait" | "format" | "refus"> {
  // 4 Mo au plus : un envoi chez Vercel ne dépasse pas 4,5 Mo
  if (!CODE.test(code) || fichier.size === 0 || fichier.size > POIDS_MAX_COUVERTURE) return "format";
  const octets = new Uint8Array(await fichier.arrayBuffer());
  const lue = lireImage(octets);
  if (!lue) return "format";
  const entrees = await entreesActuelles();
  const entree = entrees.find((e) => e.code === code);
  if (!entree) return "refus";
  let image = sharp(octets).rotate();
  if (lue.largeur > lue.hauteur) {
    // Le dos tient au plus 4 % de la largeur : la face avant commence après lui
    const largeur = Math.round(lue.largeur * 0.48);
    image = image.extract({ left: lue.largeur - largeur, top: 0, width: largeur, height: lue.hauteur });
  }
  const sortie = await image.resize({ width: Math.round(PAGE.largeur * 4.5), withoutEnlargement: true }).webp({ quality: 84 }).toBuffer();
  const chemin = `accueil/${code}-${Date.now().toString(36)}.webp`;
  const stockage = clientService().storage.from(SEAU);
  const { error } = await stockage.upload(chemin, sortie, { contentType: "image/webp", upsert: false });
  if (error) return "refus";
  if (!(await garderLesEntrees(entrees.map((e) => (e.code === code ? { ...e, couverture: chemin } : e))))) {
    await stockage.remove([chemin]);
    return "refus";
  }
  if (entree.couverture) await stockage.remove([entree.couverture]);
  return "fait";
}

export async function retirerLaCouverture(code: string): Promise<boolean> {
  const entrees = await entreesActuelles();
  const entree = entrees.find((e) => e.code === code);
  if (!entree?.couverture) return true;
  if (!(await garderLesEntrees(entrees.map((e) => (e.code === code ? { ...e, couverture: null } : e))))) return false;
  await clientService().storage.from(SEAU).remove([entree.couverture]);
  return true;
}

/** Le fichier de la couverture, pour tous : seulement celle d'un livre de l'accueil encore partagé par lien. */
export async function fichierDeCouverture(code: string): Promise<Blob | null> {
  if (!CODE.test(code)) return null;
  const entree = (await entreesActuelles()).find((e) => e.code === code);
  if (!entree?.couverture) return null;
  const { data: partage } = await clientService().from("partages").select("code").eq("code", code).eq("par_lien", true).maybeSingle();
  if (!partage) return null;
  const { data } = await clientService().storage.from(SEAU).download(entree.couverture);
  return data ?? null;
}
