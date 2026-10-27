/**
 * La couverture faite sur le site (F11.4, « Couverture faite sur le site », 26 octobre 2026) : la
 * face avant du livre, créée par l'IA ou importée, qui sert à la bibliothèque et à l'imprimeur.
 * Le dos et la quatrième restent chez l'imprimeur.
 */

import { nommeDans, type Candidat, REFERENCES_MAX, candidatsDeLImage } from "./illustration";
import { PAGE, SEUIL_PPP, pointsParPouce } from "./mise-en-page";

/** Les fonds perdus de la face avant, en millimètres de chaque côté : l'imprimeur rogne au trait. */
export const FONDS_PERDUS_MM = 3;
/** La face avant avec ses fonds perdus : 154 × 216 mm pour un A5. */
export const FACE_AVANT = { largeur: PAGE.largeur + 2 * FONDS_PERDUS_MM, hauteur: PAGE.hauteur + 2 * FONDS_PERDUS_MM } as const;
/** Ce que le prompt dit du format, à copier comme à créer. */
export const FORMAT_DE_LA_COUVERTURE = `A5 (${PAGE.largeur} × ${PAGE.hauteur} mm), avec ${FONDS_PERDUS_MM} mm de fonds perdus : ${FACE_AVANT.largeur} × ${FACE_AVANT.hauteur} mm`;

/**
 * « Pour imprimer » ou « Pour le site » (décidé par le porteur le 26 octobre 2026) : la qualité
 * se choisit par l'usage. Pour imprimer, environ 300 points par pouce sur la face avant ; pour le
 * site, la taille d'une carte de la bibliothèque, à environ dix fois moins d'étoiles.
 */
export const USAGES_DE_LA_COUVERTURE = ["imprimer", "site"] as const;
export type UsageDeLaCouverture = (typeof USAGES_DE_LA_COUVERTURE)[number];
export const estUsageDeLaCouverture = (v: unknown): v is UsageDeLaCouverture => v === "imprimer" || v === "site";

/** Les textes qu'on peut écrire sur la couverture, dans leur ordre, repris de la page de titre. */
export const SORTES_DE_TEXTE = ["titre", "sousTitre", "ligne", "annee", "autre"] as const;
export type SorteDeTexte = (typeof SORTES_DE_TEXTE)[number];
export const NOMS_DES_TEXTES: Record<SorteDeTexte, string> = {
  titre: "Le titre",
  sousTitre: "Le sous-titre",
  ligne: "Les auteurs",
  annee: "L’année",
  autre: "Autre texte",
};
export const TEXTE_DE_COUVERTURE_MAX = 120;

/** Une case de « Écrire sur la couverture » : cochée ou non ; son texte, null tant qu'il reprend la page de titre. */
export type CaseDeTexte = { coche: boolean; texte: string | null };
export type CasesDeCouverture = Record<SorteDeTexte, CaseDeTexte>;

/** Au départ, le titre seul est coché ; la ligne de la classe, qui part chez le fournisseur d'images, ne l'est jamais d'office (F13). */
export const CASES_DE_DEPART: CasesDeCouverture = {
  titre: { coche: true, texte: null },
  sousTitre: { coche: false, texte: null },
  ligne: { coche: false, texte: null },
  annee: { coche: false, texte: null },
  autre: { coche: false, texte: null },
};

const propre = (t: string): string => t.replace(/\s+/g, " ").trim().slice(0, TEXTE_DE_COUVERTURE_MAX);

/** Les cases lues dans la base, ou envoyées par la page : ce qui manque ou s'abîme reprend la valeur de départ. */
export function casesPropres(brut: unknown): CasesDeCouverture {
  const o = brut && typeof brut === "object" && !Array.isArray(brut) ? (brut as Record<string, unknown>) : {};
  return Object.fromEntries(
    SORTES_DE_TEXTE.map((sorte) => {
      const c = o[sorte] && typeof o[sorte] === "object" ? (o[sorte] as Record<string, unknown>) : {};
      const depart = CASES_DE_DEPART[sorte];
      return [sorte, { coche: typeof c.coche === "boolean" ? c.coche : depart.coche, texte: typeof c.texte === "string" ? c.texte.slice(0, TEXTE_DE_COUVERTURE_MAX) : null }];
    }),
  ) as CasesDeCouverture;
}

/** Ce que propose la page de titre pour chaque case ; « Autre texte » ne propose rien. */
export type TextesDeLaPageDeTitre = { titre: string; sousTitre: string; ligne: string; annee: string };
export const textesProposes = (p: TextesDeLaPageDeTitre): Record<SorteDeTexte, string> => ({
  titre: propre(p.titre), sousTitre: propre(p.sousTitre), ligne: propre(p.ligne), annee: propre(p.annee), autre: "",
});

/** Le texte d'une case : le sien s'il a été modifié, sinon celui de la page de titre. */
export const texteDeLaCase = (cases: CasesDeCouverture, proposes: Record<SorteDeTexte, string>, sorte: SorteDeTexte): string =>
  cases[sorte].texte ?? proposes[sorte];

/** Les textes que le modèle écrira, dans l'ordre des cases : les cases cochées dont le texte n'est pas vide. */
export const textesDemandes = (cases: CasesDeCouverture, proposes: Record<SorteDeTexte, string>): string[] =>
  SORTES_DE_TEXTE.filter((s) => cases[s].coche).map((s) => propre(texteDeLaCase(cases, proposes, s))).filter(Boolean);

/** Les textes demandés d'une image, relus sans confiance : une liste de textes courts, ou rien. */
export const textesDemandesPropres = (v: unknown): string[] | null =>
  Array.isArray(v) ? v.filter((t): t is string => typeof t === "string").map(propre).filter(Boolean).slice(0, SORTES_DE_TEXTE.length) : null;

/** La définition d'une couverture sur la face avant imprimée, en points par pouce. */
export const pppDeLaCouverture = (largeurEnPixels: number): number => pointsParPouce(largeurEnPixels, FACE_AVANT.largeur);
/** Une couverture peu définie (F10, le seuil des images du livre) : signalée au téléchargement, sans rien bloquer. */
export const couverturePeuDefinie = (largeurEnPixels: number): boolean => pppDeLaCouverture(largeurEnPixels) < SEUIL_PPP;

/**
 * La face avant d'une couverture entière importée (F11-AC116) : une image plus large que haute
 * (quatrième, dos, face avant) est coupée à sa moitié droite, le dos, qui tient au plus 4 % de la
 * largeur, laissé en marge. La quatrième, qui porte souvent les prénoms des élèves, n'est jamais
 * gardée. Une image en hauteur est gardée entière.
 */
export function faceAvantDe(largeur: number, hauteur: number): { gauche: number; largeur: number; hauteur: number } {
  if (largeur <= hauteur) return { gauche: 0, largeur, hauteur };
  const garde = Math.round(largeur * 0.48);
  return { gauche: largeur - garde, largeur: garde, hauteur };
}

/**
 * Les personnages et les objets d'une couverture (précisé le 26 octobre 2026) : sans badges, ceux
 * que nomme « Ce que montre la couverture », le héros absent des images excepté ; les quatre
 * premiers qui ont un portrait ou une image de référence la joignent.
 */
export function retenusDeLaCouverture(description: string, candidats: readonly Candidat[], herosAbsent: boolean): { retenus: Candidat[]; joints: string[] } {
  const retenus = candidatsDeLImage(candidats, herosAbsent).filter((c) => [c.nom, ...c.autresNoms].some((n) => n.trim() && nommeDans(description, n)));
  return { retenus, joints: retenus.filter((r) => r.referenceId).slice(0, REFERENCES_MAX).map((r) => r.id) };
}
