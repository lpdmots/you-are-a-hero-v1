/** L'histoire des étoiles d'un compte, telle que l'administration la montre (F14-AC24). */
export type Mouvement = { quand: string; nombre: number; motif: string; note: string | null };

export type LigneDHistoire =
  | { sorte: "mouvement"; mouvement: Mouvement }
  /** Des aides qui se suivent, sans autre mouvement entre elles : une ligne, leur total, et leur détail */
  | { sorte: "aides"; total: number; premiere: string; derniere: string; aides: Mouvement[] };

/**
 * Regroupe les aides qui se suivent, une ligne par suite de deux aides ou plus ; tout autre
 * mouvement garde sa ligne. L'ordre est celui reçu (du plus récent au plus ancien).
 */
export function regrouperLesAides(mouvements: Mouvement[]): LigneDHistoire[] {
  const lignes: LigneDHistoire[] = [];
  let suite: Mouvement[] = [];
  const fermer = () => {
    if (suite.length === 1) lignes.push({ sorte: "mouvement", mouvement: suite[0] });
    else if (suite.length > 1)
      lignes.push({ sorte: "aides", total: suite.reduce((s, m) => s + m.nombre, 0), premiere: suite[suite.length - 1].quand, derniere: suite[0].quand, aides: suite });
    suite = [];
  };
  for (const m of mouvements) {
    if (m.motif === "aide") suite.push(m);
    else {
      fermer();
      lignes.push({ sorte: "mouvement", mouvement: m });
    }
  }
  fermer();
  return lignes;
}
