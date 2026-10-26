import "server-only";
import sharp from "sharp";
import { PAGE } from "@/domaine/mise-en-page";
import type { PresentationPartagee } from "@/domaine/partage";
import { lireImage, SEAU } from "./images";
import { clientService } from "./supabase";

/**
 * Un livre posé sur le feuillet 27, fermé (design.md, « Le passage 27 ») : sa couverture déposée
 * dans l'administration, la face avant du livre imprimé (`couverture`) ; sinon sa page de titre,
 * l'image d'une page de titre faite à la main qui la remplit (`pleinePage`), ou le titre, le
 * sous-titre et l'illustration entière, dans ses proportions (`ratio`, largeur sur hauteur). Depuis
 * le 25 octobre 2026 (F14-AC40 révisé, F15-AC19), c'est un livre de la bibliothèque : il se lit à
 * son adresse.
 */
export type LivreDeLAccueil = {
  /** L'adresse du livre dans la bibliothèque */
  adresse: string;
  titre: string;
  sousTitre: string;
  couverture: string | null;
  image: string | null;
  pleinePage: boolean;
  ratio: number;
  /** Le nombre de passages d'un livre à choix, lu sur le numéro du dernier ; rien en récit classique */
  passages: number | null;
  /** Un livre du porteur, écrit par ses élèves : l'accueil le dit à la première personne */
  duPorteur: boolean;
};

/** Ce que les réglages gardent de chaque livre de l'accueil (F14-AC40), deux au plus, dans l'ordre : son projet. */
export type EntreeDeLAccueil = { projet: string; couverture: string | null };

export const POIDS_MAX_COUVERTURE = 4 * 1024 * 1024;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function entreesDe(brut: unknown): EntreeDeLAccueil[] {
  if (!Array.isArray(brut)) return [];
  return brut
    .map((e) => (e ?? {}) as { projet?: unknown; couverture?: unknown })
    .filter((e): e is { projet: string; couverture?: unknown } => typeof e.projet === "string" && UUID.test(e.projet))
    .map((e) => ({ projet: e.projet, couverture: typeof e.couverture === "string" && e.couverture.startsWith("accueil/") ? e.couverture : null }))
    .slice(0, 2);
}

export async function entreesActuelles(): Promise<EntreeDeLAccueil[]> {
  const { data } = await clientService().from("reglages_application").select("livres_de_l_accueil").maybeSingle();
  const entrees = entreesDe(data?.livres_de_l_accueil);
  if (entrees.length === 0) return entrees;
  // Un projet supprimé (un livre d'exemple rechargé, par exemple) ne garde pas sa place ; un livre
  // seulement retiré de la bibliothèque la garde, pour y revenir s'il est publié de nouveau
  const { data: projets, error } = await clientService().from("projets").select("id").in("id", entrees.map((e) => e.projet));
  if (error) return entrees;
  const existants = new Set((projets ?? []).map((p) => p.id as string));
  return entrees.filter((e) => existants.has(e.projet));
}

async function garderLesEntrees(entrees: EntreeDeLAccueil[]): Promise<boolean> {
  const { error } = await clientService().from("reglages_application").update({ livres_de_l_accueil: entrees.slice(0, 2) }).eq("id", true);
  return !error;
}

/** L'adresse de la couverture déposée : son nom de fichier change à chaque dépôt, l'adresse aussi, et aucun cache ne garde l'ancienne. */
export const adresseDeCouverture = (e: EntreeDeLAccueil): string | null =>
  e.couverture ? `/images/accueil/${e.projet}?c=${encodeURIComponent(e.couverture.slice("accueil/".length))}` : null;

type Publiee = {
  projet_id: string;
  enseignant_id: string;
  adresse: string;
  titre: string | null;
  presentation: PresentationPartagee | null;
  images: Record<string, { largeur?: number; hauteur?: number }> | null;
  dernier: number | null;
};

/**
 * Les livres à feuilleter de l'accueil (F14, « Pages publiques » ; F14-AC40, F15-AC19) : deux livres
 * de la bibliothèque, choisis dans l'administration. Le titre et la page de titre viennent de la
 * version publiée : un livre retiré de la bibliothèque disparaît de l'accueil. Une base qui ne
 * répond pas laisse la page sans livres.
 */
export async function livresDeLAccueil(): Promise<LivreDeLAccueil[]> {
  try {
    const entrees = await entreesActuelles();
    if (entrees.length === 0) return [];
    const { data, error } = await clientService()
      .from("publications")
      // Le numéro du dernier passage, plutôt que les passages entiers : quelques octets au lieu de centaines de kilo-octets
      .select("projet_id, enseignant_id, adresse, titre:version->>titre, presentation:version->presentation, images:version->images, dernier:version->passages->-1->numero")
      .in("projet_id", entrees.map((e) => e.projet))
      .not("version", "is", null);
    if (error || !data) return [];
    // Le typage de supabase-js ne lit pas l'indice négatif « ->-1 », que PostgREST accepte
    const lus = data as unknown as Publiee[];
    const { data: porteurs } = await clientService().from("enseignants").select("id").in("id", [...new Set(lus.map((l) => l.enseignant_id))]).eq("createur", true);
    const duPorteur = new Set((porteurs ?? []).map((p) => p.id as string));
    return entrees.flatMap((entree) => {
      const lu = lus.find((l) => l.projet_id === entree.projet);
      if (!lu) return [];
      const page = lu.presentation?.titre;
      const image = page?.image ?? page?.illustration ?? null;
      const taille = image ? lu.images?.[image] : undefined;
      return [
        {
          adresse: lu.adresse,
          titre: page?.titre?.trim() || lu.titre?.trim() || "Un livre de la classe",
          sousTitre: page?.sousTitre?.trim() ?? "",
          couverture: adresseDeCouverture(entree),
          image: image ? `/images/publie/${lu.adresse}/${image}?v=1` : null,
          pleinePage: Boolean(page?.image),
          ratio: taille?.largeur && taille?.hauteur ? taille.largeur / taille.hauteur : 16 / 9,
          passages: typeof lu.dernier === "number" && lu.dernier > 0 ? lu.dernier : null,
          duPorteur: duPorteur.has(lu.enseignant_id),
        },
      ];
    });
  } catch {
    return [];
  }
}

// ——— Dans l'administration du porteur (F14-AC40, révisé par F15-AC19) ———

export type LivreAChoisir = { projet: string; adresse: string; titre: string; courriel: string | null; surLAccueil: boolean; couverture: string | null };

/** Tous les livres de la bibliothèque, de tous les comptes, ceux de l'accueil d'abord, dans leur ordre. */
export async function livresAChoisir(): Promise<LivreAChoisir[]> {
  const base = clientService();
  const [entrees, { data }] = await Promise.all([
    entreesActuelles(),
    base.from("publications").select("projet_id, enseignant_id, adresse, titre:version->>titre").not("version", "is", null).order("publiee_le", { ascending: false }).limit(500),
  ]);
  const publies = (data ?? []) as unknown as { projet_id: string; enseignant_id: string; adresse: string; titre: string | null }[];
  const rang = (projet: string) => {
    const i = entrees.findIndex((e) => e.projet === projet);
    return i < 0 ? 99 : i;
  };
  const livres = await Promise.all(publies.map(async (p) => {
    const entree = entrees.find((e) => e.projet === p.projet_id);
    return {
      projet: p.projet_id, adresse: p.adresse, titre: p.titre?.trim() || "Sans titre",
      courriel: (await base.auth.admin.getUserById(p.enseignant_id)).data.user?.email ?? null,
      surLAccueil: Boolean(entree), couverture: entree ? adresseDeCouverture(entree) : null,
    };
  }));
  return livres.sort((a, b) => rang(a.projet) - rang(b.projet));
}

/** Poser un livre de la bibliothèque sur l'accueil, après les autres, ou l'en retirer avec sa couverture. */
export async function choisirPourLAccueil(projet: string, oui: boolean): Promise<"fait" | "plein" | "refus"> {
  if (!UUID.test(projet)) return "refus";
  const entrees = await entreesActuelles();
  const deja = entrees.find((e) => e.projet === projet);
  if (!oui) {
    if (!deja) return "fait";
    if (!(await garderLesEntrees(entrees.filter((e) => e.projet !== projet)))) return "refus";
    if (deja.couverture) await clientService().storage.from(SEAU).remove([deja.couverture]);
    return "fait";
  }
  if (deja) return "fait";
  if (entrees.length >= 2) return "plein";
  const { data } = await clientService().from("publications").select("projet_id").eq("projet_id", projet).not("version", "is", null).maybeSingle();
  if (!data) return "refus";
  return (await garderLesEntrees([...entrees, { projet, couverture: null }])) ? "fait" : "refus";
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
export async function deposerLaCouverture(projet: string, fichier: File): Promise<"fait" | "format" | "refus"> {
  // 4 Mo au plus : un envoi chez Vercel ne dépasse pas 4,5 Mo
  if (!UUID.test(projet) || fichier.size === 0 || fichier.size > POIDS_MAX_COUVERTURE) return "format";
  const octets = new Uint8Array(await fichier.arrayBuffer());
  const lue = lireImage(octets);
  if (!lue) return "format";
  const entrees = await entreesActuelles();
  const entree = entrees.find((e) => e.projet === projet);
  if (!entree) return "refus";
  let image = sharp(octets).rotate();
  if (lue.largeur > lue.hauteur) {
    // Le dos tient au plus 4 % de la largeur : la face avant commence après lui
    const largeur = Math.round(lue.largeur * 0.48);
    image = image.extract({ left: lue.largeur - largeur, top: 0, width: largeur, height: lue.hauteur });
  }
  const sortie = await image.resize({ width: Math.round(PAGE.largeur * 4.5), withoutEnlargement: true }).webp({ quality: 84 }).toBuffer();
  const chemin = `accueil/${projet}-${Date.now().toString(36)}.webp`;
  const stockage = clientService().storage.from(SEAU);
  const { error } = await stockage.upload(chemin, sortie, { contentType: "image/webp", upsert: false });
  if (error) return "refus";
  if (!(await garderLesEntrees(entrees.map((e) => (e.projet === projet ? { ...e, couverture: chemin } : e))))) {
    await stockage.remove([chemin]);
    return "refus";
  }
  if (entree.couverture) await stockage.remove([entree.couverture]);
  return "fait";
}

export async function retirerLaCouverture(projet: string): Promise<boolean> {
  const entrees = await entreesActuelles();
  const entree = entrees.find((e) => e.projet === projet);
  if (!entree?.couverture) return true;
  if (!(await garderLesEntrees(entrees.map((e) => (e.projet === projet ? { ...e, couverture: null } : e))))) return false;
  await clientService().storage.from(SEAU).remove([entree.couverture]);
  return true;
}

/** Le fichier de la couverture, pour tous : seulement celle d'un livre de l'accueil encore dans la bibliothèque. */
export async function fichierDeCouverture(projet: string): Promise<Blob | null> {
  if (!UUID.test(projet)) return null;
  const entree = (await entreesActuelles()).find((e) => e.projet === projet);
  if (!entree?.couverture) return null;
  const { data: publie } = await clientService().from("publications").select("projet_id").eq("projet_id", projet).not("version", "is", null).maybeSingle();
  if (!publie) return null;
  const { data } = await clientService().storage.from(SEAU).download(entree.couverture);
  return data ?? null;
}
