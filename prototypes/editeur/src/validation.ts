// Contrôle « côté serveur » (point 9). Fonction pure, sans lien avec
// l'éditeur : elle reçoit l'ancien et le nouveau document avec le rôle, et
// refuse ce qui n'est pas permis, même si le navigateur a été contourné.

import {
  type Bloc,
  type Contexte,
  type Doc,
  estProtege,
  estRenvoi,
  interditALaCreation,
  renvoisDe,
  sansNotes,
} from './modele';

export type Verdict = { ok: true } | { ok: false; refus: string[] };

const TYPES = new Set(['p', 'choix', 'action', 'note']);

export function egal(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  const ka = Object.keys(a).filter((k) => (a as Record<string, unknown>)[k] !== undefined);
  const kb = Object.keys(b).filter((k) => (b as Record<string, unknown>)[k] !== undefined);
  if (ka.length !== kb.length) return false;
  return ka.every((k) => egal((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k]));
}

/** Règles vraies pour tout le monde, adulte compris. */
export function controlerStructure(doc: Doc, sceneExiste: (id: string) => boolean): string[] {
  const refus: string[] = [];
  const vus = new Set<string>();
  const voir = (id: unknown, quoi: string) => {
    if (typeof id !== 'string' || id === '') refus.push(`${quoi} sans identité`);
    else if (vus.has(id)) refus.push(`identité en double : ${id}`);
    else vus.add(id);
  };
  if (!Array.isArray(doc)) return ['document illisible'];
  for (const bloc of doc as Bloc[]) {
    if (!bloc || !TYPES.has(bloc.type) || !Array.isArray(bloc.children)) {
      refus.push('bloc de type inconnu');
      continue;
    }
    voir(bloc.id, `bloc ${bloc.type}`);
    const enfants = bloc.children as unknown[];
    const elements = enfants.filter((n) => typeof (n as { text?: unknown }).text !== 'string');
    if (bloc.type !== 'choix') {
      if (elements.length > 0) refus.push(`renvoi ou élément hors d'une phrase de choix (${bloc.type} ${bloc.id})`);
      continue;
    }
    if (elements.some((n) => !estRenvoi(n))) refus.push(`élément inconnu dans la phrase de choix ${bloc.id}`);
    const renvois = renvoisDe(bloc);
    if (renvois.length === 0) refus.push(`phrase de choix sans renvoi (${bloc.id})`);
    if (bloc.mode === 'auto') {
      if (renvois.length !== 1) refus.push(`phrase automatique à plusieurs renvois (${bloc.id})`);
      if (enfants.some((n) => typeof (n as { text?: string }).text === 'string' && (n as { text: string }).text !== ''))
        refus.push(`texte saisi dans une phrase automatique (${bloc.id})`);
    }
    for (const r of renvois) {
      voir(r.id, 'renvoi');
      if (r.cible !== null && !sceneExiste(r.cible)) refus.push(`renvoi vers une scène inconnue (${r.id})`);
    }
  }
  return refus;
}

export function validerEnregistrement(params: {
  ancien: Doc;
  nouveau: Doc;
  ctx: Contexte;
  sceneExiste: (id: string) => boolean;
}): Verdict {
  const { ancien, nouveau, ctx, sceneExiste } = params;
  const refus = controlerStructure(nouveau, sceneExiste);
  if (refus.length > 0) return { ok: false, refus };
  if (ctx.role === 'adulte') return { ok: true };

  if (nouveau.some((b) => b.type === 'note')) refus.push("note de l'enseignant envoyée par un élève");

  // L'élève n'a jamais reçu les notes : on compare à ce qu'il a vu.
  const vu = sansNotes(ancien);
  const avant = new Map(vu.map((b) => [b.id, b]));
  const apres = new Map(nouveau.map((b) => [b.id, b]));

  const protegesAvant = vu.filter((b) => estProtege(b, ctx));
  for (const bloc of protegesAvant) {
    const suite = apres.get(bloc.id);
    if (!suite) refus.push(`bloc protégé supprimé (${bloc.type} ${bloc.id})`);
    else if (!egal(bloc, suite)) refus.push(`bloc protégé modifié (${bloc.type} ${bloc.id})`);
  }
  const ordreAvant = protegesAvant.map((b) => b.id).filter((id) => apres.has(id));
  const ordreApres = nouveau.map((b) => b.id).filter((id) => ordreAvant.includes(id));
  if (!egal(ordreAvant, ordreApres)) refus.push('ordre des blocs protégés modifié');

  for (const bloc of nouveau) {
    if (bloc.type === 'note') continue;
    const origine = avant.get(bloc.id);
    const reserve = interditALaCreation(bloc, ctx) || estProtege(bloc, ctx);
    if (!origine) {
      if (reserve) refus.push(`ajout sans le droit requis (${bloc.type} ${bloc.id})`);
    } else if (!estProtege(origine, ctx) && !egal(origine, bloc) && reserve) {
      refus.push(`bloc transformé sans le droit requis (${bloc.type} ${bloc.id})`);
    }
  }
  return refus.length > 0 ? { ok: false, refus } : { ok: true };
}
