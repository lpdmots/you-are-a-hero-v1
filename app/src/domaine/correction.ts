/**
 * La correction d'une scène, sans fournisseur ni base (F13.1) : ce qui part chez l'aide, les
 * changements qu'elle propose, et le texte qu'on obtient en gardant certains d'entre eux.
 *
 * Seuls partent les paragraphes de récit non vides, de toute la scène ou de la sélection ;
 * phrases de choix, actions de jeu, images et notes restent intactes (F13-AC03). Un
 * paragraphe garde sa mise en forme et ses images sur la ligne : un mot qui reste garde son
 * gras ou son italique, un mot ajouté prend la forme de celui qui le précède.
 */

import { difference, type Morceau } from "./difference";
import { estImageLigne, type Bloc, type ImageLigne, type Lettres, type Marques, type Paragraphe, type Texte } from "./copie";

/** Un paragraphe tel qu'il part chez l'aide : ses lettres seules, sans les images sur la ligne. */
export type ParagrapheACorriger = { id: string; texte: string };

/** Les lettres d'un paragraphe de récit, sans ses images sur la ligne ni sa mise en forme. */
export const lettresDuParagraphe = (p: Paragraphe): string => p.children.map((e) => ("text" in e ? e.text : "")).join("");

/**
 * Ce qui part chez l'aide : les paragraphes de récit qui ont des mots, dans l'ordre ; avec une
 * sélection, ceux qu'elle touche, en entier.
 */
export function paragraphesACorriger(texte: Texte, selection: readonly string[] | null = null): ParagrapheACorriger[] {
  return texte
    .filter((b): b is Paragraphe => b.type === "p" && (!selection || selection.includes(b.id)))
    .map((p) => ({ id: p.id, texte: lettresDuParagraphe(p) }))
    .filter((p) => p.texte.trim() !== "");
}

/** Ce que la sélection touche de récit : les identités des paragraphes, ou rien si elle n'en touche aucun. */
export const selectionACorriger = (texte: Texte, ids: readonly string[]): string[] | null => {
  const touches = paragraphesACorriger(texte, ids).map((p) => p.id);
  return touches.length ? touches : null;
};

/**
 * La correction d'un paragraphe, en morceaux : ce qui reste, et chaque changement, numéroté,
 * qui s'accepte ou se refuse d'un clic. Un changement est une suite de retraits et d'ajouts
 * voisins : « grote » → « grotte », ou une phrase reprise au degré 3.
 */
export type Segment =
  | { sorte: "pareil"; /** Forme du texte d'origine */ avant: string; /** Forme proposée */ apres: string }
  | { sorte: "change"; n: number; retire: string; ajoute: string };

export function segmentsDe(avant: string, apres: string, premier = 0): Segment[] {
  const sortie: Segment[] = [];
  let n = premier;
  for (const m of difference(avant, apres) as Morceau[]) {
    if (m.sorte === "pareil") {
      sortie.push({ sorte: "pareil", avant: m.avant ?? m.texte, apres: m.texte });
      continue;
    }
    const dernier = sortie[sortie.length - 1];
    if (dernier?.sorte === "change") {
      if (m.sorte === "retire") dernier.retire += m.texte;
      else dernier.ajoute += m.texte;
    } else sortie.push({ sorte: "change", n: n++, retire: m.sorte === "retire" ? m.texte : "", ajoute: m.sorte === "ajoute" ? m.texte : "" });
  }
  return sortie;
}

export const nombreDe = (segments: readonly Segment[]): number => segments.filter((s) => s.sorte === "change").length;

/**
 * Une lettre du texte recomposé, avec la place qu'elle occupait dans le texte d'origine, ou
 * null si elle vient de la proposition.
 */
type Lettre = { c: string; source: number | null };

/**
 * Le texte qu'on obtient en gardant les changements acceptés : ce qui reste garde sa forme
 * d'origine (apostrophe, espace insécable) ; un changement refusé rend ce qu'il retirait. Les
 * espaces et la ponctuation font des changements comme les mots : « quai.Le » devenu
 * « quai. Le » se garde ou se refuse d'un clic (F13.1, degré 1).
 */
function recomposerEnLettres(segments: readonly Segment[], refuses: ReadonlySet<number>): Lettre[] {
  const sortie: Lettre[] = [];
  let i = 0;
  const depuisLOrigine = (t: string) => {
    for (const c of t) {
      sortie.push({ c, source: i });
      i += c.length;
    }
  };
  for (const s of segments) {
    if (s.sorte === "pareil") depuisLOrigine(s.avant);
    else if (refuses.has(s.n)) depuisLOrigine(s.retire);
    else {
      for (const c of s.ajoute) sortie.push({ c, source: null });
      i += s.retire.length;
    }
  }
  return sortie;
}

/** Le texte d'un paragraphe une fois gardés les changements acceptés. */
export const recomposer = (segments: readonly Segment[], refuses: ReadonlySet<number> = new Set()): string =>
  recomposerEnLettres(segments, refuses).map((l) => l.c).join("");

const memes = (a: Marques, b: Marques) => !!a.bold === !!b.bold && !!a.italic === !!b.italic && !!a.underline === !!b.underline;
const marquesDe = (l: Lettres): Marques => ({ ...(l.bold ? { bold: true } : {}), ...(l.italic ? { italic: true } : {}), ...(l.underline ? { underline: true } : {}) });

/**
 * Le paragraphe corrigé : ses lettres recomposées, sa mise en forme et ses images sur la ligne
 * gardées. Une image se pose devant la première lettre qui la suivait, ou à la fin.
 */
export function corrigerParagraphe(p: Paragraphe, segments: readonly Segment[], refuses: ReadonlySet<number> = new Set()): Paragraphe {
  const marques: Marques[] = [];
  const images: { image: ImageLigne; place: number }[] = [];
  for (const e of p.children) {
    if (estImageLigne(e)) images.push({ image: e, place: marques.length });
    else for (let j = 0; j < (e as Lettres).text.length; j += 1) marques.push(marquesDe(e as Lettres));
  }
  const lettres = recomposerEnLettres(segments, refuses);
  const premiere = lettres.find((l) => l.source !== null);
  let forme: Marques = premiere?.source != null ? (marques[premiere.source] ?? {}) : (marques[0] ?? {});

  const enfants: (Lettres | ImageLigne)[] = [];
  const ecrire = (c: string, m: Marques) => {
    const dernier = enfants[enfants.length - 1];
    if (dernier && "text" in dernier && memes(marquesDe(dernier as Lettres), m)) (dernier as Lettres).text += c;
    else enfants.push({ text: c, ...m });
  };
  const poser = (image: ImageLigne) => {
    // Une image sur la ligne est toujours entre deux textes, comme l'éditeur les tient
    if (!enfants.length || !("text" in enfants[enfants.length - 1])) enfants.push({ text: "" });
    enfants.push(image);
  };
  let k = 0;
  for (const l of lettres) {
    if (l.source !== null) {
      while (k < images.length && images[k].place <= l.source) poser(images[k++].image);
      forme = marques[l.source] ?? forme;
    }
    ecrire(l.c, forme);
  }
  while (k < images.length) poser(images[k++].image);
  if (!enfants.length || !("text" in enfants[enfants.length - 1])) enfants.push({ text: "" });
  return { ...p, children: enfants };
}

/** Une proposition reçue : pour chaque paragraphe parti, ce que l'aide rend. */
export type Proposition = { id: string; avant: string; apres: string };

/**
 * Le texte de la scène avec les paragraphes corrigés : `refuses` aux degrés 1 à 3, rien aux
 * degrés 4 et 5, où `apres` est la proposition telle que l'adulte l'a retouchée. Les autres
 * blocs ne changent pas, ni leur ordre, ni leur identité.
 */
export function appliquerCorrection(texte: Texte, propositions: readonly Proposition[], refuses: ReadonlySet<number> = new Set()): Texte {
  const segments = segmentsParParagraphe(propositions);
  return texte.map((b): Bloc => {
    const s = segments.get(b.id);
    return s && b.type === "p" ? corrigerParagraphe(b, s, refuses) : b;
  });
}

/** Les segments de chaque paragraphe, les changements numérotés d'un bout à l'autre de la scène. */
export function segmentsParParagraphe(propositions: readonly Proposition[]): Map<string, Segment[]> {
  const sortie = new Map<string, Segment[]>();
  let n = 0;
  for (const p of propositions) {
    const s = segmentsDe(p.avant, p.apres, n);
    n += nombreDe(s);
    sortie.set(p.id, s);
  }
  return sortie;
}

/** Le nombre de changements d'une proposition, sur toute la scène. */
export const changementsDe = (propositions: readonly Proposition[]): number =>
  [...segmentsParParagraphe(propositions).values()].reduce((n, s) => n + nombreDe(s), 0);

/**
 * La longueur de la proposition, aux degrés 4 et 5 (F13.1, décidé par le porteur le
 * 17 octobre 2026) : la même par défaut, ou un facteur, ou un nombre de mots approximatif.
 * Elle vaut pour la demande, comme le degré choisi pour une scène ; rien ne se garde avec le
 * compte. La part du texte d'origine qui reste est le choix de l'auteur.
 */
export type Longueur = { facteur: Facteur } | { mots: number };
export const FACTEURS = [1, 1.5, 2] as const;
export type Facteur = (typeof FACTEURS)[number];
export const MEME_LONGUEUR: Longueur = { facteur: 1 };
/** Bornes d'un nombre de mots demandé : au-delà, la réponse ne tiendrait pas dans la minute de l'aide */
export const MOTS_DEMANDES = { min: 5, max: 1500 } as const;

/** Les mots d'un texte : « l'eau » et « arc-en-ciel » en font un, la ponctuation aucun. */
export const compterMots = (texte: string): number => (texte.match(/[\p{L}\p{N}]+(?:['’ʼ-][\p{L}\p{N}]+)*/gu) ?? []).length;

/** La longueur s'applique-t-elle à ce degré ? Aux degrés 1 à 3, une correction ne rallonge pas. */
export const longueurReglable = (degre: number): boolean => degre >= 4;

/** Le nombre de mots visé pour un texte qui en compte `actuels`, ou null pour la même longueur. */
export function cibleDe(longueur: Longueur, actuels: number): number | null {
  if ("mots" in longueur) return Math.min(MOTS_DEMANDES.max, Math.max(MOTS_DEMANDES.min, Math.round(longueur.mots)));
  if (longueur.facteur === 1) return null;
  return Math.min(MOTS_DEMANDES.max, Math.max(MOTS_DEMANDES.min, Math.round(actuels * longueur.facteur)));
}

/** Ce que la page envoie, relu sans confiance : un facteur connu, ou un nombre de mots entier dans les bornes. */
export function lireLongueur(v: unknown): Longueur {
  const o = v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
  if (typeof o.mots === "number" && Number.isFinite(o.mots)) return { mots: Math.min(MOTS_DEMANDES.max, Math.max(MOTS_DEMANDES.min, Math.round(o.mots))) };
  const f = FACTEURS.find((x) => x === o.facteur);
  return f ? { facteur: f } : MEME_LONGUEUR;
}

/** « ×1,5 », « ≈ 300 mots », ou rien pour la même longueur. */
export const nomDeLongueur = (l: Longueur): string | null =>
  "mots" in l ? `≈ ${l.mots} mots` : l.facteur === 1 ? null : `×${String(l.facteur).replace(".", ",")}`;
