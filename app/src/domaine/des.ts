/**
 * Les dés imprimés en bas des pages de droite du récit (F11.4, décision du 3 octobre 2026) :
 * ouvrir le livre au hasard tient lieu de lancer de dé. Les faces sont réparties également sur
 * le livre, deux pages de droite qui se suivent ne portent pas le même tirage, et un même livre
 * donne les mêmes faces d'un export à l'autre : le tirage ne dépend que du rang de la page.
 */

import { hasard } from "./numeros";

const FACES = [1, 2, 3, 4, 5, 6] as const;
export type Face = (typeof FACES)[number];

/**
 * Les faces d'un dé pour `n` pages de droite : des suites de six faces mélangées, mises bout à
 * bout, chaque suite ne commençant pas par la face qui finit la précédente. Chaque face revient
 * donc autant de fois qu'une autre, à une près.
 */
function suiteDeFaces(n: number, graine: number): Face[] {
  const tirage = hasard(graine);
  const faces: Face[] = [];
  while (faces.length < n) {
    const suite = [...FACES];
    for (let i = suite.length - 1; i > 0; i -= 1) {
      const j = Math.floor(tirage() * (i + 1));
      [suite[i], suite[j]] = [suite[j], suite[i]];
    }
    if (faces.length && suite[0] === faces[faces.length - 1]) [suite[0], suite[5]] = [suite[5], suite[0]];
    faces.push(...suite);
  }
  return faces.slice(0, n);
}

/**
 * Le tirage imprimé sur chaque page de droite du récit, dans l'ordre : un ou deux dés. Le premier
 * dé ne répète jamais la face de la page d'avant : deux tirages qui se suivent diffèrent donc
 * toujours, avec un dé comme avec deux.
 */
export function desImprimes(pagesDeDroite: number, des: 1 | 2): Face[][] {
  const premier = suiteDeFaces(pagesDeDroite, 20261003);
  if (des === 1) return premier.map((f) => [f]);
  const second = suiteDeFaces(pagesDeDroite, 20261004);
  return premier.map((f, i) => [f, second[i]]);
}
