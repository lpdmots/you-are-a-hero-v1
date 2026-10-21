import { assembler, chaine, champs, liste, objet, textes, type DefinitionAide } from "../aide";
import type { Piece } from "../fournisseurs";

/**
 * Les mots-clés d'une image de la bibliothèque (F10.1, 21 octobre 2026), lus dans l'image
 * elle-même, en français et en anglais : ce qu'elle montre, pour la retrouver par un filtre
 * (« forêt »). Rien d'autre ne part que la vignette : ni le texte de la scène, ni le résumé, ni
 * un nom. Le porteur les demande en acceptant l'image, et les retouche ensuite.
 */
export type EntreeMotsCles = { image: Piece };
export type MotsCles = { mots: string[]; motsEn: string[] };

/** Des mots courts, en minuscules, sans doublon : « forêt », « rivière », « coucher de soleil ». */
const propres = (v: unknown): string[] | null => {
  const l = textes(v, 40)?.map((m) => m.toLocaleLowerCase("fr").replace(/[.;,]+$/, "").trim()).filter(Boolean);
  return l ? [...new Set(l)].slice(0, 12) : null;
};

export const motsCles: DefinitionAide<EntreeMotsCles, MotsCles> = {
  aide: "mots-cles",
  sortieMax: 400,
  systeme: () =>
    assembler(
      "Tu ranges des illustrations de livres pour enfants dans une bibliothèque d'images, où des enseignants les cherchent par un mot.",
      `Tu regardes l'image et tu donnes de six à dix mots-clés, d'abord en français, puis les mêmes en anglais.
- Ce qu'on voit : le lieu (forêt, port, château), les éléments marquants (rivière, pont, lanterne), le moment ou la saison (nuit, hiver), l'ambiance (brume, mystérieux).
- Des noms communs ou de courtes expressions, au singulier, en minuscules.
- Jamais de nom propre, de personnage nommé, de marque, ni le style de dessin.`,
    ),
  message: () => "Donne les mots-clés de cette image.",
  pieces: (e) => [e.image],
  schema: { nom: "mots_cles", schema: objet({ mots: liste(chaine), motsEn: liste(chaine) }) },
  lire: (json) => {
    const c = champs(json);
    const mots = propres(c?.mots);
    const motsEn = propres(c?.motsEn);
    return mots?.length && motsEn?.length ? { mots, motsEn } : null;
  },
  simuler: () => ({ mots: ["forêt", "rivière", "brume", "matin"], motsEn: ["forest", "river", "mist", "morning"] }),
};
