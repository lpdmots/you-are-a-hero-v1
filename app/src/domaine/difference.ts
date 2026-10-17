/**
 * La différence mot à mot entre deux textes : ce qui reste, ce qui part, ce qui arrive. Elle
 * sert à marquer une correction dans la copie, comme au stylo (F13.1, degrés 1 à 3), et à la
 * page de jugement de l'essai V17. Un mot et un signe de ponctuation sont deux morceaux, chacun
 * avec l'espace qui le suit : « brume et il » devenu « brume. Il » laisse « brume » intact.
 * Un mot qui ne change que d'apostrophe ou d'espace insécable est « pareil » : il garde sa forme
 * dans chacun des deux textes, `texte` pour le nouveau, `avant` pour l'ancien, espace comprise.
 * Un changement refusé se recompose ainsi avec l'espace du texte d'origine (`domaine/correction.ts`).
 */
export type Morceau = { sorte: "pareil" | "retire" | "ajoute"; texte: string; /** Pour « pareil » : la forme du texte d'origine */ avant?: string };

const typographie = (t: string): string => t.replace(/[’ʼ]/g, "'").replace(/[\u00a0\u202f]/g, " ");

/** « Le dragon dormé. » → ["Le ", "dragon ", "dormé", ". "] : mots et signes, chacun avec l'espace qui le suit. */
export const mots = (texte: string): string[] => texte.match(/[\p{L}\p{N}'’ʼ-]+\s*|[^\s\p{L}\p{N}]\s*|\s+/gu) ?? [];

/**
 * La plus longue suite commune (programmation dynamique, en mots) : un paragraphe d'élève
 * compte rarement plus de quelques centaines de mots. Au-delà de 4 000 mots de part et
 * d'autre, tout est rendu comme remplacé, sans calcul quadratique.
 */
export function difference(avant: string, apres: string): Morceau[] {
  const a = mots(avant);
  const b = mots(apres);
  // L'apostrophe droite et la courbe, l'espace ordinaire et l'insécable ne font pas une correction
  const egal = (x: string, y: string) => typographie(x.trimEnd()) === typographie(y.trimEnd());
  if (a.length * b.length > 16_000_000) return fusionner([{ sorte: "retire", texte: avant }, { sorte: "ajoute", texte: apres }]);

  const n = a.length;
  const m = b.length;
  const table = Array.from({ length: n + 1 }, () => new Uint16Array(m + 1));
  for (let i = n - 1; i >= 0; i -= 1) {
    for (let j = m - 1; j >= 0; j -= 1) {
      table[i][j] = egal(a[i], b[j]) ? table[i + 1][j + 1] + 1 : Math.max(table[i + 1][j], table[i][j + 1]);
    }
  }
  const sortie: Morceau[] = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (egal(a[i], b[j])) {
      sortie.push({ sorte: "pareil", texte: b[j], avant: a[i] });
      i += 1;
      j += 1;
    } else if (table[i + 1][j] >= table[i][j + 1]) {
      sortie.push({ sorte: "retire", texte: a[i] });
      i += 1;
    } else {
      sortie.push({ sorte: "ajoute", texte: b[j] });
      j += 1;
    }
  }
  while (i < n) sortie.push({ sorte: "retire", texte: a[i++] });
  while (j < m) sortie.push({ sorte: "ajoute", texte: b[j++] });
  return fusionner(sortie);
}

/** Les morceaux voisins de même sorte ne font qu'un ; un retrait se place avant son ajout. */
function fusionner(morceaux: Morceau[]): Morceau[] {
  const sortie: Morceau[] = [];
  for (const m of morceaux) {
    if (!m.texte) continue;
    const dernier = sortie[sortie.length - 1];
    if (dernier && dernier.sorte === m.sorte) {
      dernier.texte += m.texte;
      if (m.avant !== undefined) dernier.avant = (dernier.avant ?? "") + m.avant;
    } else sortie.push({ ...m });
  }
  return sortie;
}

/** Le nombre de changements : chaque suite de retraits et d'ajouts voisins en compte un. */
export function nombreDeChangements(morceaux: Morceau[]): number {
  let n = 0;
  let dansUnChangement = false;
  for (const m of morceaux) {
    if (m.sorte === "pareil") dansUnChangement = false;
    else if (!dansUnChangement) {
      n += 1;
      dansUnChangement = true;
    }
  }
  return n;
}
