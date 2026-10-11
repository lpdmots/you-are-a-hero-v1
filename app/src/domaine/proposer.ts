import { cle } from "./texte";

/**
 * Proposer une destination d'après le libellé d'un choix (F05.2, F05-AC56) : les scènes
 * dont le titre ou la consigne reprennent un mot du libellé remontent en tête de liste.
 * « Traverser le pont » propose « Le pont ». On ne rapproche que des mots, pas le sens :
 * « Fuir » ne propose pas « La sortie ».
 */

/** Les petits mots, qui ne disent rien d'une scène. */
const VIDES = new Set(
  ("le la les un une des du de au aux et ou en dans sur sous vers pour par avec sans chez entre son sa ses ton ta tes mon ma mes leur leurs ce cet cette ces " +
    "qui que quoi dont ne pas plus tout tous toute toutes tres bien se si il elle on tu te toi lui y a est etre avoir faire aller comme puis alors").split(" "),
);

/** Les mots qui comptent, sans accents ni majuscules : « L’entrée du bois » donne « entree », « bois ». */
export function motsUtiles(texte: string): string[] {
  const mots = cle(texte)
    .split(/[^a-z0-9]+/)
    .filter((m) => m.length >= 3 && !VIDES.has(m));
  return [...new Set(mots)];
}

/** Deux mots se ressemblent : les mêmes, au pluriel près, ou le même début pour deux mots longs. */
function ressemble(a: string, b: string): boolean {
  if (a === b) return true;
  const [x, y] = [a.replace(/[sx]$/, ""), b.replace(/[sx]$/, "")];
  if (x === y) return true;
  return x.length >= 5 && y.length >= 5 && x.slice(0, 5) === y.slice(0, 5);
}

export type AProposer = { id: string; titre: string | null; consigne?: string | null };

/**
 * Les scènes qui ressemblent au libellé, la plus proche d'abord. Un mot du titre compte
 * plus qu'un mot de la consigne. Un mot que portent trop de scènes — le nom du héros — ne
 * distingue rien : il est laissé de côté.
 */
export function scenesProposees<S extends AProposer>(libelle: string, scenes: readonly S[]): S[] {
  const mots = motsUtiles(libelle);
  if (mots.length === 0 || scenes.length === 0) return [];
  const lues = scenes.map((s) => ({ scene: s, titre: motsUtiles(s.titre ?? ""), consigne: motsUtiles(s.consigne ?? "") }));
  const tropCourant = Math.max(3, Math.ceil(scenes.length * 0.4));
  const notes = new Map<S, number>();
  for (const mot of mots) {
    const touchees = lues
      .map((l) => ({ scene: l.scene, note: l.titre.some((t) => ressemble(t, mot)) ? 3 : l.consigne.some((c) => ressemble(c, mot)) ? 1 : 0 }))
      .filter((t) => t.note > 0);
    if (touchees.length > tropCourant) continue;
    for (const t of touchees) notes.set(t.scene, (notes.get(t.scene) ?? 0) + t.note);
  }
  // À note égale, l'ordre reçu est gardé : celui du plan
  return scenes.filter((s) => notes.has(s)).sort((a, b) => notes.get(b)! - notes.get(a)!);
}
