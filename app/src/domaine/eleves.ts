/**
 * Prénoms, noms et inscription en lot (F01.1).
 * Les élèves ne voient que des prénoms ; l'initiale du nom s'ajoute quand deux élèves
 * d'une même classe portent le même prénom.
 */
import { cle, majuscule } from "./texte";

export type Personne = { prenom: string; nom: string | null };
export type Eleve = Personne & { id: string; couleur: number };

/** Couleurs des gommettes, dans l'ordre où elles se donnent. */
export const PALETTE = [
  "#C43E28", "#2466AD", "#2B7A40", "#9A6200", "#7447B2",
  "#B0386F", "#0E736F", "#586620", "#A34A1A", "#3F4EA8",
] as const;

export const couleurDe = (rang: number): string => PALETTE[((rang % 10) + 10) % 10];

/** Deux lettres de la gommette : « Al » pour Alice. */
export function initiales(prenom: string): string {
  const p = prenom.trim();
  return p.slice(0, 1).toLocaleUpperCase("fr") + p.slice(1, 2).toLocaleLowerCase("fr");
}

export const memePrenom = (a: Personne, b: Personne): boolean => cle(a.prenom) === cle(b.prenom);

/**
 * Ce que lisent les élèves : le prénom, suivi de l'initiale du nom quand un autre
 * élève de la classe porte le même prénom (F01-AC21).
 */
export function nomPourEleves(eleve: Eleve, classe: readonly Eleve[]): string {
  const double = classe.some((autre) => autre.id !== eleve.id && memePrenom(autre, eleve));
  const nom = eleve.nom?.trim();
  return double && nom ? `${eleve.prenom} ${nom[0].toLocaleUpperCase("fr")}.` : eleve.prenom;
}

/** Ordre des prénoms, puis des noms. */
export function trier<T extends Personne>(liste: readonly T[]): T[] {
  return [...liste].sort(
    (a, b) => a.prenom.localeCompare(b.prenom, "fr") || (a.nom ?? "").localeCompare(b.nom ?? "", "fr"),
  );
}

/** Une ligne de la saisie en lot : « Prénom » ou « Prénom Nom ». */
export function lireLigne(ligne: string): Personne | null {
  const propre = ligne.trim().replace(/\s+/g, " ");
  if (!propre) return null;
  const [prenom, ...reste] = propre.split(" ");
  const nom = reste.join(" ");
  return { prenom: majuscule(prenom), nom: nom || null };
}

export const lireLignes = (texte: string): Personne[] =>
  texte.split("\n").map(lireLigne).filter((p): p is Personne => p !== null);

export type ProfilConnu = Eleve & { de: string };

export type LigneLot =
  // nomDonne : le nom, ou son initiale, écrit pendant la vérification pour un profil qui n'en avait pas
  | { type: "connu"; eleve: ProfilConnu; nomDonne?: boolean }
  | { type: "neuf"; cle: string; prenom: string; nom: string; meme: ProfilConnu | null };

export type PointARegler =
  | { sorte: "meme"; rang: number; ligne: Extract<LigneLot, { type: "neuf" }> }
  | { sorte: "double"; rang: number; ligne: LigneLot; autre: Personne };

/**
 * Récapitulatif d'un lot : les profils connus cochés, puis les nouvelles lignes.
 * Une nouvelle ligne qui porte le prénom et le nom d'un profil connu non coché est
 * signalée, jamais fusionnée d'office (F01-AC12).
 */
export function construireLot(
  connus: readonly ProfilConnu[],
  coches: ReadonlySet<string>,
  texte: string,
): LigneLot[] {
  const lignes: LigneLot[] = connus.filter((e) => coches.has(e.id)).map((eleve) => ({ type: "connu", eleve }));
  lireLignes(texte).forEach((p, rang) => {
    const meme = p.nom
      ? (connus.find(
          (e) => !coches.has(e.id) && cle(e.prenom) === cle(p.prenom) && cle(e.nom ?? "") === cle(p.nom ?? ""),
        ) ?? null)
      : null;
    lignes.push({ type: "neuf", cle: `neuf-${rang}`, prenom: p.prenom, nom: p.nom ?? "", meme });
  });
  return lignes;
}

const personneDe = (l: LigneLot): Personne =>
  l.type === "connu" ? l.eleve : { prenom: l.prenom, nom: l.nom || null };

/**
 * Ce qui reste à régler avant d'inscrire : un nom déjà connu, ou deux fois le même
 * prénom dans la classe sans nom pour les distinguer (F01-AC21). La règle vaut pour un
 * nouvel élève comme pour un profil connu que l'on réinscrit.
 */
export function pointsARegler(inscrits: readonly Personne[], lignes: readonly LigneLot[]): PointARegler[] {
  const points: PointARegler[] = [];
  lignes.forEach((ligne, rang) => {
    if (ligne.type === "neuf" && ligne.meme) {
      points.push({ sorte: "meme", rang, ligne });
      return;
    }
    const personne = personneDe(ligne);
    if (personne.nom?.trim()) return;
    const autres = [...inscrits, ...lignes.filter((_, i) => i !== rang).map(personneDe)];
    const autre = autres.find((a) => memePrenom(a, personne));
    if (autre) points.push({ sorte: "double", rang, ligne, autre });
  });
  return points;
}

/**
 * Le prénom porté deux fois sans nom pour le distinguer, parmi ceux que l'on ajoute ;
 * null si tout est en ordre. Le serveur refuse l'inscription sur cette même règle.
 */
export function prenomEnDouble(inscrits: readonly Personne[], ajoutes: readonly Personne[]): string | null {
  for (const [rang, personne] of ajoutes.entries()) {
    if (personne.nom?.trim()) continue;
    const autres = [...inscrits, ...ajoutes.filter((_, i) => i !== rang)];
    if (autres.some((a) => memePrenom(a, personne))) return personne.prenom;
  }
  return null;
}
