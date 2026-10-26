import { AGES, NOMS_DES_AGES, type AgeDesLecteurs } from "./aides-ia";

/**
 * La page `/bibliotheque` (F15, « Liste, tri, filtres »), sans base : ce que la liste demande —
 * le tri, les filtres d'âge et de type, la recherche dans le titre et la présentation — et la carte
 * d'un livre publié.
 */

export type Tri = "recents" | "aimes";
export type TypeDeRecit = "choix" | "classique";

export type Demande = { tri: Tri; age: AgeDesLecteurs | null; type: TypeDeRecit | null; q: string };

/** Ce que l'adresse demande, relu sans confiance : une valeur inconnue vaut « tous ». */
export function demandeDepuis(p: { tri?: string; age?: string; type?: string; q?: string }): Demande {
  return {
    tri: p.tri === "aimes" ? "aimes" : "recents",
    age: (AGES as readonly string[]).includes(p.age ?? "") ? (p.age as AgeDesLecteurs) : null,
    type: p.type === "choix" || p.type === "classique" ? p.type : null,
    q: (p.q ?? "").replace(/\s+/g, " ").trim().slice(0, 80),
  };
}

/** L'adresse d'une demande : seulement ce qui diffère du défaut, pour une adresse courte. */
export function chercheEnAdresse(d: Demande): string {
  const p = new URLSearchParams();
  if (d.q) p.set("q", d.q);
  if (d.age) p.set("age", d.age);
  if (d.type) p.set("type", d.type);
  if (d.tri !== "recents") p.set("tri", d.tri);
  const s = p.toString();
  return s ? `?${s}` : "";
}

export type LivrePublie = {
  adresse: string;
  titre: string;
  sousTitre: string;
  /** La ligne de la page de titre, telle que la version la montre : « CM1 de l'école Jean-Moulin, 2026 » */
  ligne: string;
  presentation: string;
  age: AgeDesLecteurs;
  aChoix: boolean;
  passages: number;
  /** L'image de la page de titre : pleine page, ou illustration sous le titre */
  image: { id: string; pleinePage: boolean; ratio: number } | null;
  publieLe: string;
  coeurs: number;
};

export const NOM_DU_TYPE: Record<TypeDeRecit, string> = { choix: "Livre-jeu", classique: "Récit" };
export const nomDeLAge = (a: AgeDesLecteurs): string => NOMS_DES_AGES[a];

/** Sans accents ni majuscules : « lanterne » trouve « Lanterne », « reve » trouve « rêve ». */
const simple = (t: string) => t.normalize("NFD").replace(/\p{M}/gu, "").toLocaleLowerCase("fr");

/**
 * Les livres de la liste (F15-AC11) : filtrés par âge et par type, puis par les mots cherchés, tous
 * présents dans le titre ou la présentation ; les plus récents d'abord, ou les plus aimés, à égalité
 * les plus récents.
 */
export function livresDeLaListe(livres: readonly LivrePublie[], d: Demande): LivrePublie[] {
  const mots = simple(d.q).split(/[^\p{L}\p{N}]+/u).filter((m) => m.length > 1);
  return livres
    .filter((l) => (!d.age || l.age === d.age) && (!d.type || (d.type === "choix") === l.aChoix))
    .filter((l) => {
      if (!mots.length) return true;
      const texte = simple(`${l.titre} ${l.sousTitre} ${l.presentation}`);
      return mots.every((m) => texte.includes(m));
    })
    .sort((a, b) => (d.tri === "aimes" ? b.coeurs - a.coeurs : 0) || b.publieLe.localeCompare(a.publieLe));
}
