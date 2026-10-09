// Forme du document d'une scène, recopiée du prototype de l'éditeur comme
// simple format d'entrée : récit, phrase de choix avec renvois, action de jeu.
// S'y ajoutent l'image en bloc et l'image en ligne (F10). Essai jetable.

export const CONSTRUCTIONS = [
  'Prendre la clé : …',
  'Pour prendre la clé, …',
  'Si tu veux prendre la clé, …',
  'Prendre la clé ? …',
];

export const RENVOI_VIDE = '…';

const minuscule = (s) => (s ? s[0].toLowerCase() + s.slice(1) : s);
const majuscule = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s);

export const estRenvoi = (n) => n && n.type === 'renvoi';
export const estImageLigne = (n) => n && n.type === 'image-ligne';

/** Texte placé avant et après le renvoi d'une phrase automatique. */
export function composerPhrase(libelle, construction, formule) {
  const l = libelle.trim();
  switch (construction) {
    case 1:
      return { avant: `Pour ${minuscule(l)}, ${formule} `, apres: '.' };
    case 2:
      return { avant: `Si tu veux ${minuscule(l)}, ${formule} `, apres: '.' };
    case 3:
      return { avant: `${l} ? ${majuscule(formule)} `, apres: '.' };
    default:
      return { avant: `${l} : ${formule} `, apres: '.' };
  }
}

/**
 * Source unique du contenu d'un bloc de texte : suite de segments de texte,
 * de renvois (avec le numéro imprimé de la destination) et d'images en ligne.
 */
export function segments(bloc, livre) {
  const renvoi = (r) => ({
    genre: 'renvoi',
    id: r.id,
    cible: r.cible,
    numero: r.cible ? (livre.numeroDe(r.cible) ?? null) : null,
  });
  if (bloc.type === 'choix' && bloc.mode === 'auto') {
    const r = bloc.children.find(estRenvoi);
    const { avant, apres } = composerPhrase(bloc.libelle, bloc.construction, livre.formule);
    return [{ genre: 'texte', texte: avant }, ...(r ? [renvoi(r)] : []), { genre: 'texte', texte: apres }];
  }
  return bloc.children
    .map((n) => {
      if (estRenvoi(n)) return renvoi(n);
      if (estImageLigne(n)) return { genre: 'image-ligne', src: n.src, alt: n.alt ?? '' };
      return { genre: 'texte', texte: n.text, bold: n.bold, italic: n.italic };
    })
    .filter((s) => s.genre !== 'texte' || s.texte !== '');
}

export function texteBloc(bloc, livre) {
  return segments(bloc, livre)
    .map((s) =>
      s.genre === 'texte' ? s.texte : s.genre === 'renvoi' ? (s.numero === null ? RENVOI_VIDE : String(s.numero)) : ''
    )
    .join('');
}

// --- Texte source d'un bloc, pour la correction depuis l'aperçu ------------
// **gras**, *italique*, {→S033} pour un renvoi, {img:nom} pour une image en
// ligne. Le renvoi et l'image doivent se retrouver à l'identique après saisie.

export function versSource(bloc) {
  if (bloc.type === 'choix' && bloc.mode === 'auto') return bloc.libelle;
  return bloc.children
    .map((n) => {
      if (estRenvoi(n)) return `{→${n.cible ?? '?'}}`;
      if (estImageLigne(n)) return `{img:${n.src}}`;
      const t = n.text;
      return n.bold ? `**${t}**` : n.italic ? `*${t}*` : t;
    })
    .join('');
}

export function depuisSource(bloc, source) {
  if (bloc.type === 'choix' && bloc.mode === 'auto') return { ...bloc, libelle: source.trim() };
  const anciens = bloc.children.filter((n) => estRenvoi(n) || estImageLigne(n));
  const children = [];
  const motif = /\{→([^}]*)\}|\{img:([^}]*)\}|\*\*([^*]+)\*\*|\*([^*]+)\*/g;
  let fin = 0;
  let m;
  const reste = [...anciens];
  while ((m = motif.exec(source))) {
    if (m.index > fin) children.push({ text: source.slice(fin, m.index) });
    if (m[1] !== undefined || m[2] !== undefined) {
      // Un élément insécable ne se crée ni ne se modifie par la saisie : on
      // reprend celui d'origine, dans l'ordre.
      const ancien = reste.shift();
      if (!ancien) throw new Error('Renvoi ou image ajouté par la saisie : refusé');
      children.push(ancien);
    } else if (m[3] !== undefined) children.push({ text: m[3], bold: true });
    else children.push({ text: m[4], italic: true });
    fin = motif.lastIndex;
  }
  if (fin < source.length) children.push({ text: source.slice(fin) });
  if (reste.length) throw new Error('Renvoi ou image retiré par la saisie : refusé');
  return { ...bloc, children };
}
