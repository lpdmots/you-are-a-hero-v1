// Césure française posée à la composition : des traits d'union conditionnels
// (U+00AD) calculés par les motifs de césure, identiques quel que soit le
// navigateur. La césure propre à chaque navigateur dépend de dictionnaires
// installés ou non sur la machine : elle ne peut pas garantir les mêmes pages.
import { readFileSync } from 'node:fs';
import hyphenopoly from 'hyphenopoly';

const cesures = hyphenopoly.config({
  require: ['fr'],
  hyphen: '­',
  sync: true,
  minWordLength: 6,
  leftmin: 3,
  rightmin: 3,
  loaderSync: (fichier, dossier) => readFileSync(new URL(fichier, dossier)),
});
const fr = cesures.get('fr');

export const cesure = (texte) => fr(texte).replace(/​/g, '');
export const sansCesure = (texte) => texte;
