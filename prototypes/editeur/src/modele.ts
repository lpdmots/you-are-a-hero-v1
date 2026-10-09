// Modèle du document d'une scène et fonctions pures partagées par l'éditeur,
// la lecture et le « serveur ». Essai jetable : rien ici n'a valeur de schéma.

export type Role = 'adulte' | 'propositions' | 'organisation';

export type Texte = {
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
};

/** Élément en ligne insécable. `cible` vaut null pour une destination à décider. */
export type Renvoi = {
  type: 'renvoi';
  id: string;
  cible: string | null;
  libelle?: string;
  children: [{ text: '' }];
};

export type Recit = { type: 'p'; id: string; protege?: boolean; children: Texte[] };

/**
 * Phrase de choix. En mode automatique, le texte n'est pas enregistré : il se
 * recompose depuis le libellé, la construction et la formule du livre. Les
 * enfants ne portent alors que le renvoi.
 */
export type Choix = {
  type: 'choix';
  id: string;
  mode: 'auto' | 'perso';
  libelle: string;
  construction: number;
  children: (Texte | Renvoi)[];
};

export type Action = { type: 'action'; id: string; protege?: boolean; children: Texte[] };

/** Note de l'enseignant : jamais transmise à un élève, jamais imprimée. */
export type Note = { type: 'note'; id: string; children: Texte[] };

export type Bloc = Recit | Choix | Action | Note;
export type Doc = Bloc[];

export type Contexte = {
  role: Role;
  /** Chapitre de la scène en cours d'édition. */
  chapitreScene: string;
  /** Chapitre d'une scène, ou undefined si elle n'existe pas. */
  chapitreDe: (sceneId: string) => string | undefined;
};

export const CONSTRUCTIONS = [
  'Prendre la clé : …',
  'Pour prendre la clé, …',
  'Si tu veux prendre la clé, …',
  'Prendre la clé ? …',
] as const;

export const FORMULES = ['rends-toi au', 'va au'] as const;

let compteur = 0;
export function nouvelId(prefixe = 'n'): string {
  compteur += 1;
  return `${prefixe}-${Date.now().toString(36)}-${compteur.toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 6)}`;
}

export const estRenvoi = (n: unknown): n is Renvoi =>
  typeof n === 'object' && n !== null && (n as { type?: string }).type === 'renvoi';

export function renvoisDe(bloc: Bloc): Renvoi[] {
  return (bloc.children as (Texte | Renvoi)[]).filter(estRenvoi);
}

const minuscule = (s: string) => (s ? s[0].toLowerCase() + s.slice(1) : s);
const majuscule = (s: string) => (s ? s[0].toUpperCase() + s.slice(1) : s);

/** Texte placé avant et après le renvoi d'une phrase automatique. */
export function composer(
  libelle: string,
  construction: number,
  formule: string
): { avant: string; apres: string } {
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

export type Segment =
  | { genre: 'texte'; texte: string; bold?: boolean; italic?: boolean; underline?: boolean }
  | { genre: 'renvoi'; id: string; cible: string | null; numero: number | null };

export type Livre = { formule: string; numeroDe: (sceneId: string) => number | undefined };

/**
 * Source unique du texte d'un bloc : l'éditeur, la lecture d'essai, l'aperçu
 * et le lecteur en ligne passent tous par cette fonction (point 13).
 */
export function segments(bloc: Bloc, livre: Livre): Segment[] {
  const renvoi = (r: Renvoi): Segment => ({
    genre: 'renvoi',
    id: r.id,
    cible: r.cible,
    numero: r.cible ? (livre.numeroDe(r.cible) ?? null) : null,
  });
  if (bloc.type === 'choix' && bloc.mode === 'auto') {
    const r = renvoisDe(bloc)[0];
    const { avant, apres } = composer(bloc.libelle, bloc.construction, livre.formule);
    return [{ genre: 'texte', texte: avant }, ...(r ? [renvoi(r)] : []), { genre: 'texte', texte: apres }];
  }
  return (bloc.children as (Texte | Renvoi)[])
    .map((n): Segment =>
      estRenvoi(n)
        ? renvoi(n)
        : { genre: 'texte', texte: n.text, bold: n.bold, italic: n.italic, underline: n.underline }
    )
    .filter((s) => s.genre === 'renvoi' || s.texte !== '');
}

export const RENVOI_VIDE = '?';

export function texteBloc(bloc: Bloc, livre: Livre): string {
  return segments(bloc, livre)
    .map((s) => (s.genre === 'texte' ? s.texte : s.numero === null ? RENVOI_VIDE : String(s.numero)))
    .join('');
}

/** Un renvoi vers un autre chapitre que celui de la scène est un raccord. */
export function contientRaccord(bloc: Bloc, ctx: Contexte): boolean {
  return renvoisDe(bloc).some((r) => r.cible !== null && ctx.chapitreDe(r.cible) !== ctx.chapitreScene);
}

/** Bloc que cette personne ne peut ni modifier ni supprimer (F06.1, F04.2). */
export function estProtege(bloc: Bloc, ctx: Contexte): boolean {
  if (ctx.role === 'adulte') return false;
  if (bloc.type === 'note') return true;
  if ((bloc.type === 'p' || bloc.type === 'action') && bloc.protege) return true;
  if (bloc.type === 'choix') return ctx.role === 'propositions' || contientRaccord(bloc, ctx);
  if (bloc.type === 'action') return ctx.role === 'propositions';
  return false;
}

/**
 * Bloc que cette personne n'a pas le droit de créer, donc écarté d'un collage.
 * Un paragraphe de récit protégé reste collable : seul son texte est repris.
 */
export function interditALaCreation(bloc: Bloc, ctx: Contexte): boolean {
  if (ctx.role === 'adulte') return false;
  if (bloc.type === 'p') return false;
  return estProtege({ ...bloc, protege: false } as Bloc, ctx);
}

/**
 * Bloc présenté comme un tout dans l'éditeur : le curseur n'entre pas dans
 * son texte. Vaut pour la phrase automatique de tous et pour les blocs
 * protégés d'un élève.
 */
export function estFerme(bloc: Bloc, ctx: Contexte): boolean {
  return (bloc.type === 'choix' && bloc.mode === 'auto') || estProtege(bloc, ctx);
}

export type Lien = { de: string; vers: string | null; renvoiId: string; libelle: string };

/** Le graphe se déduit des renvois enregistrés, sans seconde saisie. */
export function liensDe(sceneId: string, doc: Doc): Lien[] {
  const liens: Lien[] = [];
  for (const bloc of doc) {
    if (bloc.type !== 'choix') continue;
    for (const r of renvoisDe(bloc)) {
      liens.push({ de: sceneId, vers: r.cible, renvoiId: r.id, libelle: r.libelle ?? bloc.libelle });
    }
  }
  return liens;
}

export function idsDe(doc: Doc): string[] {
  return doc.flatMap((b) => [b.id, ...renvoisDe(b).map((r) => r.id)]);
}

export const sansNotes = (doc: Doc): Doc => doc.filter((b) => b.type !== 'note');

export function recit(texte: string, extra: Partial<Recit> = {}): Recit {
  return { type: 'p', id: nouvelId('p'), children: [{ text: texte }], ...extra };
}

export function renvoi(cible: string | null, libelle?: string): Renvoi {
  return { type: 'renvoi', id: nouvelId('r'), cible, ...(libelle ? { libelle } : {}), children: [{ text: '' }] };
}

export function choixAuto(libelle: string, cible: string | null, construction = 0): Choix {
  return {
    type: 'choix',
    id: nouvelId('c'),
    mode: 'auto',
    libelle,
    construction,
    children: [{ text: '' }, renvoi(cible), { text: '' }],
  };
}

export function choixPerso(libelle: string, enfants: (string | Renvoi)[]): Choix {
  const children = enfants.map((e) => (typeof e === 'string' ? { text: e } : e));
  if (estRenvoi(children[0])) children.unshift({ text: '' });
  if (estRenvoi(children[children.length - 1])) children.push({ text: '' });
  return { type: 'choix', id: nouvelId('c'), mode: 'perso', libelle, construction: 0, children };
}

export function action(texte: string, extra: Partial<Action> = {}): Action {
  return { type: 'action', id: nouvelId('a'), children: [{ text: texte }], ...extra };
}

export function note(texte: string): Note {
  return { type: 'note', id: nouvelId('t'), children: [{ text: texte }] };
}
