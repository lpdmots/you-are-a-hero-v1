/**
 * La mise en page du livre : son format, ses réglages (F11.3 à F11.5) et ce qui s'en déduit sans
 * composer — la zone de texte d'une page, la largeur imprimée d'une image et sa définition (F10).
 * La composition et les contrôles du livre s'en servent tous deux.
 */

export type Police = "vollkorn" | "andika";
export type Taille = "petite" | "moyenne" | "grande";
/** En millimètres ; l'intérieur est du côté de la reliure, alterné entre pages de gauche et de droite */
export type Marges = { haut: number; bas: number; exterieur: number; interieur: number };
export type BasDePage = "rien" | "numero" | "des";

export type ReglagesDuLivre = {
  police: Police;
  taille: Taille;
  alignement: "justifie" | "gauche";
  marges: Marges;
  basDePage: BasDePage;
  titresDePartie: boolean;
  /** Récit classique seulement */
  titresDeChapitre: boolean;
  partieNouvellePage: boolean;
  /** Récit classique seulement */
  chapitreNouvellePage: boolean;
};

/** Format unique de la première livraison : A5 portrait, 420 × 595 points une fois imprimé (F11.3). */
export const PAGE = { largeur: 148, hauteur: 210 } as const;
export const MARGES_DE_DEPART: Marges = { haut: 16, bas: 20, exterieur: 15, interieur: 20 };
/** Aucune marge sous 10 mm, pour qu'un texte ne soit pas rogné (F11-AC60) */
export const MARGE_MINIMALE = 10;
/** Corps du récit, en points */
export const CORPS: Record<Taille, number> = { petite: 11, moyenne: 12, grande: 13.5 };

export const reglagesDeDepart = (aChoix: boolean): ReglagesDuLivre => ({
  police: "vollkorn",
  taille: "moyenne",
  alignement: "justifie",
  marges: { ...MARGES_DE_DEPART },
  // Folio désactivé pour le récit à choix, où il se confondrait avec un numéro de passage (F11.4)
  basDePage: aChoix ? "rien" : "numero",
  titresDePartie: true,
  titresDeChapitre: true,
  partieNouvellePage: true,
  chapitreNouvellePage: false,
});

/** La zone de texte d'une page, en millimètres. */
export const zoneDeTexte = (r: ReglagesDuLivre): { largeur: number; hauteur: number } => ({
  largeur: PAGE.largeur - r.marges.interieur - r.marges.exterieur,
  hauteur: PAGE.hauteur - r.marges.haut - r.marges.bas,
});

/** Les trois largeurs proposées d'une image en bloc (F10) : une image ainsi placée est réduite sans indication. */
export const LARGEURS_PROPOSEES: readonly number[] = [40, 65, 100];
/** Une image s'imprime bien à 200 points par pouce au moins (F10, 15 octobre 2026). */
export const SEUIL_PPP = 200;
/** Ce que prend une légende sous une image, et la marge gardée autour d'une figure, en millimètres */
const LEGENDE_MM = 9;
const AIR_MM = 10;

/**
 * La largeur à laquelle une image en bloc s'imprime (F10) : celle demandée, réduite s'il le faut
 * pour que l'image et sa légende tiennent dans la hauteur d'une page. Pleine page, elle occupe la
 * zone de texte sans la dépasser, proportions gardées.
 */
export function largeurImprimee(
  b: { largeur: number; page?: true; legende?: string },
  image: { largeur: number; hauteur: number },
  r: ReglagesDuLivre,
): { pourcent: number; mm: number } {
  const z = zoneDeTexte(r);
  const proportion = image.largeur / image.hauteur;
  const legende = b.legende ? LEGENDE_MM : 0;
  const mm = b.page
    ? Math.min(z.largeur, (z.hauteur - 1 - legende) * proportion)
    : Math.min((b.largeur / 100) * z.largeur, (z.hauteur - AIR_MM - legende) * proportion);
  return { pourcent: Math.round((mm / z.largeur) * 10000) / 100, mm };
}

/** La définition d'une image imprimée sur `mm` millimètres de large, en points par pouce. */
export const pointsParPouce = (pixels: number, mm: number): number => Math.round(pixels / (mm / 25.4));

/** La hauteur d'une ligne de texte, en millimètres : celle d'une image posée sur la ligne. */
export const hauteurDeLigne = (r: ReglagesDuLivre): number => CORPS[r.taille] * (25.4 / 72);

const unDe = <T extends string>(v: unknown, valeurs: readonly T[], defaut: T): T => (valeurs.includes(v as T) ? (v as T) : defaut);
const oui = (v: unknown, defaut: boolean): boolean => (typeof v === "boolean" ? v : defaut);
/** Une marge en millimètres, au dixième ; refusée sous 10 mm (F11-AC60) ou au-delà de 40 */
const marge = (v: unknown, defaut: number): number => (typeof v === "number" && Number.isFinite(v) && v >= MARGE_MINIMALE && v <= 40 ? Math.round(v * 10) / 10 : defaut);

/**
 * Les réglages du livre lus dans la base : ce qui manque ou ne convient pas prend la valeur de
 * départ. « Dés » en bas de page n'est gardé que pour un récit à choix qui a un dé (F11.4).
 */
export function reglagesPropres(brut: unknown, o: { aChoix: boolean; des: 0 | 1 | 2 }): ReglagesDuLivre {
  const d = reglagesDeDepart(o.aChoix);
  const r = (brut && typeof brut === "object" ? brut : {}) as Record<string, unknown>;
  const m = (r.marges && typeof r.marges === "object" ? r.marges : {}) as Record<string, unknown>;
  const basDePage = unDe(r.basDePage, ["rien", "numero", "des"] as const, d.basDePage);
  return {
    police: unDe(r.police, ["vollkorn", "andika"] as const, d.police),
    taille: unDe(r.taille, ["petite", "moyenne", "grande"] as const, d.taille),
    alignement: unDe(r.alignement, ["justifie", "gauche"] as const, d.alignement),
    marges: { haut: marge(m.haut, d.marges.haut), bas: marge(m.bas, d.marges.bas), exterieur: marge(m.exterieur, d.marges.exterieur), interieur: marge(m.interieur, d.marges.interieur) },
    basDePage: basDePage === "des" && !(o.aChoix && o.des) ? d.basDePage : basDePage,
    titresDePartie: oui(r.titresDePartie, d.titresDePartie),
    titresDeChapitre: oui(r.titresDeChapitre, d.titresDeChapitre),
    partieNouvellePage: oui(r.partieNouvellePage, d.partieNouvellePage),
    chapitreNouvellePage: oui(r.chapitreNouvellePage, d.chapitreNouvellePage),
  };
}
