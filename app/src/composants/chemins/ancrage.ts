/**
 * L'écran ne bouge pas (F03.1, F03-AC54). Après un geste, le schéma se redispose : la carte
 * d'où l'on part peut changer de place dans le schéma, et le schéma de largeur. On la ramène où
 * elle était à l'écran, sans changer la taille : d'abord en faisant défiler, la page de haut en
 * bas et le cadre de côté ; et quand le défilement est au bout, en poussant le schéma dans son
 * cadre ou en allongeant le cadre.
 */

/** Où en est un défilement, et jusqu'où il peut aller. */
export type Defilement = { position: number; max: number };

export type Correction = {
  /** De combien faire défiler */
  defiler: number;
  /** De combien pousser le schéma dans son cadre : le défilement était déjà au début */
  pousser: number;
  /** De combien allonger le cadre : le défilement était déjà à la fin */
  allonger: number;
};

/**
 * Sur un axe : la carte s'est déplacée de `ecart` points à l'écran (vers la droite ou vers le
 * bas si positif). Ce qu'il faut faire pour qu'elle retrouve sa place.
 */
export function garderEnPlace(ecart: number, defilement: Defilement): Correction {
  const cible = defilement.position + ecart;
  if (cible < 0) return { defiler: -defilement.position, pousser: -cible, allonger: 0 };
  if (cible > defilement.max) return { defiler: ecart, pousser: 0, allonger: cible - defilement.max };
  return { defiler: ecart, pousser: 0, allonger: 0 };
}

/**
 * Ce qu'un geste a poussé se rend dès qu'on le peut sans que rien bouge à l'écran : la part de
 * la poussée qui est déjà hors de la vue, au-dessus ou à gauche (décidé le 10 novembre 2026).
 * `cache` : de combien le début du cadre est passé hors de la vue.
 */
export const aRendreSansMouvement = (poussee: number, cache: number): number => Math.max(0, Math.min(poussee, cache));

/** Où la carte se retrouve à l'écran, par rapport à sa place d'avant, une fois la correction faite : toujours zéro. */
export const resteApres = (ecart: number, c: Correction): number => ecart - c.defiler + c.pousser;

/**
 * La carte à garder en place quand aucun geste n'en désigne une : celle qu'on a cliquée, sinon
 * la plus proche du milieu de ce qu'on voit.
 */
export function carteDeReference(
  rects: Map<string, { x: number; y: number; l: number; h: number }>, choisie: string | null, vu: { x: number; y: number; l: number; h: number },
): string | null {
  if (choisie && rects.has(choisie)) return choisie;
  let mieux: string | null = null;
  let distance = Infinity;
  const [cx, cy] = [vu.x + vu.l / 2, vu.y + vu.h / 2];
  for (const [id, r] of rects) {
    const d = Math.hypot(r.x + r.l / 2 - cx, r.y + r.h / 2 - cy);
    if (d < distance) [mieux, distance] = [id, d];
  }
  return mieux;
}

/**
 * « La taille du schéma ne change pas » (F03-AC54) : au premier geste, la taille qu'on voyait
 * est figée. Sans cela, un schéma devenu plus large rétrécirait pour tenir dans la fenêtre.
 */
export const figerLaTaille = (choisie: number | null, courante: number): number => choisie ?? courante;
