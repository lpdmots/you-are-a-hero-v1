// Règles d'édition branchées sur Plate : ce fichier est l'objet de l'essai.
// Trois étages : gestes de haut niveau (suppression, collage, fusion),
// normalisation du document, puis garde au niveau des opérations.

import { NodeApi, RangeApi } from 'platejs';
import { createPlatePlugin } from 'platejs/react';

import {
  type Bloc,
  type Choix,
  type Contexte,
  type Recit,
  type Renvoi,
  type Texte,
  estFerme,
  estProtege,
  estRenvoi,
  interditALaCreation,
  nouvelId,
  renvoisDe,
} from '../modele';

export type Env = {
  ctx: Contexte;
  /** Vrai si cette identité existe déjà dans une autre scène enregistrée. */
  idExisteAilleurs: (id: string) => boolean;
  sceneExiste: (id: string) => boolean;
  message: (texte: string, options?: { annulable?: boolean }) => void;
  /** Commande tapée dans le texte : `/choix` ou `/action`. */
  slash: (commande: 'choix' | 'action') => void;
  /** Dernier renvoi d'une phrase : la suppression demande confirmation. */
  confirmerDernierRenvoi: (blocId: string) => void;
  /** Compteur d'opérations refusées par la garde, pour diagnostic. */
  garde: { refus: number };
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type E = any;

const TYPES_BLOC = new Set(['p', 'choix', 'action', 'note']);
const TEXTE_LIBRE = new Set(['p', 'action', 'note']);

export const blocs = (e: E): Bloc[] => e.children as Bloc[];
export const chaine = (n: unknown): string => NodeApi.string(n as never);
const estBloc = (n: unknown): n is Bloc => typeof n === 'object' && n !== null && TYPES_BLOC.has((n as Bloc).type);

export function peutCreerChoix(ctx: Contexte): boolean {
  return ctx.role !== 'propositions';
}

/** Index du bloc portant le curseur, ou -1. */
export function indexCourant(e: E): number {
  return e.selection ? e.selection.anchor.path[0] : -1;
}

export function selectionnerBloc(e: E, index: number, bord: 'debut' | 'fin' = 'debut') {
  if (index < 0 || index >= blocs(e).length) return;
  e.tf.select(bord === 'fin' ? e.api.end([index]) : e.api.start([index]));
}

export function indexDe(e: E, id: string): number {
  return blocs(e).findIndex((b) => b.id === id);
}

function pluriel(n: number, mot: string) {
  return `${n} ${mot}${n > 1 ? 's' : ''}`;
}

/**
 * Suppression d'une sélection. Une phrase de choix part en entier ou pas du
 * tout ; un bloc protégé pour cette personne est épargné.
 */
export function supprimerSelection(e: E, env: Env, pourEcrire = false) {
  const sel = e.selection;
  if (!sel || RangeApi.isCollapsed(sel)) return;
  const [debut, fin] = RangeApi.edges(sel);
  const i0 = debut.path[0];
  const i1 = fin.path[0];
  const avant = blocs(e);
  const { ctx } = env;
  let choix = 0;
  let epargnes = 0;
  let renvoisRetires = 0;

  if (i0 === i1) {
    const b = avant[i0];
    if (estFerme(b, ctx)) {
      if (estProtege(b, ctx)) epargnes += 1;
      else {
        if (b.type === 'choix') choix += 1;
        e.tf.removeNodes({ at: [i0] });
      }
    } else {
      const n = renvoisDe(b).length;
      e.tf.delete({ at: sel });
      const suite = blocs(e).find((x) => x.id === b.id);
      if (b.type === 'choix') {
        if (!suite) choix += 1;
        else renvoisRetires = n - renvoisDe(suite).length;
      }
    }
  } else {
    e.tf.withoutNormalizing(() => {
      for (let i = i1; i >= i0; i -= 1) {
        const b = avant[i];
        if (estProtege(b, ctx)) {
          epargnes += 1;
          continue;
        }
        // Un bloc couvert jusqu'au bout part en entier ; le premier paragraphe
        // de récit reste, pour accueillir le curseur.
        const couvertFin = i === i1 && i > i0 && e.api.isEnd(fin, [i]);
        const couvertDebut = i === i0 && b.type !== 'p' && e.api.isStart(debut, [i]);
        const entier = (i > i0 && i < i1) || b.type === 'choix' || estFerme(b, ctx) || couvertFin || couvertDebut;
        if (entier) {
          if (b.type === 'choix') choix += 1;
          e.tf.removeNodes({ at: [i] });
        } else if (i === i1) {
          const d = e.api.start([i]);
          if (!(d.offset === fin.offset && d.path.join() === fin.path.join())) e.tf.delete({ at: { anchor: d, focus: fin } });
        } else {
          const f = e.api.end([i]);
          if (!(f.offset === debut.offset && f.path.join() === debut.path.join())) e.tf.delete({ at: { anchor: debut, focus: f } });
        }
      }
      // Deux paragraphes de récit entamés et désormais voisins se rejoignent.
      const a = blocs(e)[i0];
      const suivant = blocs(e)[i0 + 1];
      if (a && suivant && a.id === avant[i0].id && suivant.id === avant[i1].id && a.type === 'p' && suivant.type === 'p') {
        e.tf.mergeNodes({ at: [i0 + 1] });
      }
    });
  }

  // Où laisser le curseur.
  const apres = blocs(e);
  if (i0 !== i1) {
    const premier = apres.findIndex((b) => b.id === avant[i0].id);
    const dernier = apres.findIndex((b) => b.id === avant[i1].id);
    if (premier !== -1 && !estFerme(apres[premier], ctx)) e.tf.select(debut.path[0] === premier ? debut : e.api.start([premier]));
    else if (dernier !== -1 && !estFerme(apres[dernier], ctx)) selectionnerBloc(e, dernier);
    else if (pourEcrire) insererParagraphe(e, premier !== -1 ? premier + 1 : Math.min(i0, apres.length));
    else if (apres.length > 0) selectionnerBloc(e, Math.min(premier !== -1 ? premier : i0, apres.length - 1));
  } else if (pourEcrire) {
    const i = Math.min(i0, apres.length - 1);
    if (apres.length === 0 || estFerme(apres[i], ctx)) insererParagraphe(e, apres.length === 0 ? 0 : i + 1);
  } else if (apres.length > 0 && !apres.some((b) => b.id === avant[i0].id)) {
    selectionnerBloc(e, Math.min(i0, apres.length - 1));
  }

  if (choix > 0) env.message(pluriel(choix, 'choix supprimé'), { annulable: true });
  else if (renvoisRetires > 0) env.message(`${pluriel(renvoisRetires, 'renvoi')} retiré${renvoisRetires > 1 ? 's' : ''}`, { annulable: true });
  else if (epargnes > 0) env.message("Les blocs préparés par l'enseignant sont conservés.");
}

export function insererParagraphe(e: E, index: number, texte = '') {
  const p: Recit = { type: 'p', id: nouvelId('p'), children: [{ text: texte }] };
  e.tf.insertNodes(p, { at: [index] });
  e.tf.select(e.api.end([index]));
}

/** Prépare ce qui est collé : filtre les droits, les renvois et les identités. */
export function preparerCollage(fragment: unknown[], e: E, env: Env): { blocs: Bloc[]; ecartes: Bloc[] } {
  const { ctx } = env;
  const sortie: Bloc[] = [];
  const ecartes: Bloc[] = [];
  const textes = (n: unknown): Texte[] => {
    const liste: Texte[] = [];
    for (const [t] of NodeApi.texts(n as never)) {
      const { text, bold, italic, underline } = t as Texte;
      liste.push({ text, ...(bold ? { bold } : {}), ...(italic ? { italic } : {}), ...(underline ? { underline } : {}) });
    }
    return liste.length > 0 ? liste : [{ text: '' }];
  };
  const enRecit = (n: unknown): Recit => ({ type: 'p', id: nouvelId('p'), children: textes(n) });
  let enLigne: unknown[] = [];
  const vider = () => {
    if (enLigne.length > 0) sortie.push(enRecit({ children: enLigne }));
    enLigne = [];
  };

  const traiter = (n: unknown) => {
    const noeud = n as { type?: string; text?: string; children?: unknown[] };
    if (estRenvoi(n)) return; // Renvoi nu : jamais hors d'une phrase de choix.
    if (typeof noeud.text === 'string') {
      enLigne.push(noeud);
      return;
    }
    vider();
    if (!estBloc(noeud)) {
      // Titre, liste, citation venus d'ailleurs : seul le texte est repris.
      const enfants = noeud.children ?? [];
      const blocsEnfants = enfants.some((c) => Array.isArray((c as { children?: unknown[] }).children) && !estRenvoi(c));
      if (blocsEnfants) enfants.forEach(traiter);
      else sortie.push(enRecit(noeud));
      return;
    }
    const bloc = noeud as Bloc;
    if (bloc.type === 'p') {
      sortie.push({ type: 'p', id: bloc.id, ...(bloc.protege && ctx.role === 'adulte' ? { protege: true } : {}), children: textes(bloc) });
      return;
    }
    if (bloc.type === 'choix') {
      const renvois = renvoisDe(bloc);
      if (renvois.length === 0) {
        sortie.push(enRecit(bloc));
        return;
      }
      const cibleInconnue = renvois.some((r) => r.cible !== null && !env.sceneExiste(r.cible));
      const autoIncoherent = bloc.mode === 'auto' && renvois.length !== 1;
      if (interditALaCreation(bloc, ctx) || cibleInconnue || autoIncoherent) {
        ecartes.push(bloc);
        return;
      }
      sortie.push(JSON.parse(JSON.stringify(bloc)) as Choix);
      return;
    }
    if (interditALaCreation(bloc, ctx)) {
      ecartes.push(bloc);
      return;
    }
    sortie.push({ ...bloc, ...(ctx.role === 'adulte' ? {} : { protege: undefined }), children: textes(bloc) } as Bloc);
  };
  fragment.forEach(traiter);
  vider();
  // Bords vides d'une sélection à cheval : pas de paragraphe vide en plus.
  const vide = (b: Bloc) => b.type === 'p' && chaine(b) === '';
  while (sortie.length > 1 && vide(sortie[0])) sortie.shift();
  while (sortie.length > 1 && vide(sortie[sortie.length - 1])) sortie.pop();

  // Identités : conservée si le bloc a été coupé (elle n'existe plus nulle
  // part), renouvelée s'il a été copié.
  const pris = new Set<string>();
  for (const b of blocs(e)) {
    pris.add(b.id);
    for (const r of renvoisDe(b)) pris.add(r.id);
  }
  const identite = (id: string | undefined, prefixe: string) => {
    const libre = id && !pris.has(id) && !env.idExisteAilleurs(id);
    const retenu = libre ? id : nouvelId(prefixe);
    pris.add(retenu);
    return retenu;
  };
  for (const b of sortie) {
    b.id = identite(b.id, b.type[0]);
    for (const r of renvoisDe(b)) r.id = identite(r.id, 'r');
  }
  return { blocs: sortie, ecartes };
}

export function collerBlocs(e: E, env: Env, fragment: unknown[], origine: (f: unknown[]) => void) {
  if (e.selection && RangeApi.isExpanded(e.selection)) supprimerSelection(e, env, true);
  const { blocs: aColler, ecartes } = preparerCollage(fragment, e, env);
  const { ctx } = env;
  const i = indexCourant(e);
  const courant = i >= 0 ? blocs(e)[i] : undefined;

  if (aColler.length > 0) {
    const unSeulRecit = aColler.length === 1 && aColler[0].type === 'p';
    if (unSeulRecit && courant && !estFerme(courant, ctx)) {
      // Texte seul dans un bloc ouvert : insertion dans la ligne.
      origine([aColler[0]]);
    } else {
      e.tf.withoutNormalizing(() => {
        let index = blocs(e).length;
        if (courant) {
          index = i + 1;
          if (courant.type === 'p' && !estFerme(courant, ctx)) {
            const point = e.selection.anchor;
            if (chaine(courant) === '') {
              e.tf.removeNodes({ at: [i] });
              index = i;
            } else if (e.api.isStart(point, [i])) index = i;
            else if (!e.api.isEnd(point, [i])) e.tf.splitNodes({ at: point });
          }
        }
        e.tf.insertNodes(aColler, { at: [index] });
        const dernier = index + aColler.length - 1;
        e.tf.select(e.api.end([dernier]));
      });
    }
  }
  if (ecartes.length > 0) {
    const nChoix = ecartes.filter((b) => b.type === 'choix').length;
    const nActions = ecartes.filter((b) => b.type === 'action').length;
    const parties = [
      nChoix ? pluriel(nChoix, 'phrase') + ' de choix' : '',
      nActions ? pluriel(nActions, 'action') + ' de jeu' : '',
      ecartes.length - nChoix - nActions ? 'un bloc réservé' : '',
    ].filter(Boolean);
    env.message(`Non collé, faute du droit requis : ${parties.join(', ')}.`);
  }
}

/** Vrai si l'opération doit être refusée. Dernier rempart avant le serveur. */
function interdite(e: E, env: Env, op: E): boolean {
  const { ctx } = env;
  const bl = blocs(e);
  const protege = (i: number) => Boolean(bl[i]) && estProtege(bl[i], ctx);
  const reserve = (n: unknown) =>
    ctx.role !== 'adulte' && estBloc(n) && (interditALaCreation(n, ctx) || estProtege(n, ctx));
  const i = op.path?.[0] as number;
  switch (op.type) {
    case 'insert_node':
      if (op.path.length === 1) return reserve(op.node);
      if (typeof op.node.text !== 'string' && !(estRenvoi(op.node) && bl[i]?.type === 'choix')) return true;
      return protege(i);
    case 'remove_node':
    case 'insert_text':
    case 'remove_text':
      return protege(i);
    case 'set_node':
      if (protege(i)) return true;
      return op.path.length === 1 && reserve({ ...bl[i], ...op.newProperties });
    case 'split_node':
      if (protege(i)) return true;
      return op.path.length === 1 && bl[i]?.type === 'choix';
    case 'merge_node':
      if (op.path.length > 1) return protege(i);
      // Fusion de deux blocs : jamais entre types différents, jamais une phrase de choix.
      return !bl[i] || !bl[i - 1] || bl[i].type !== bl[i - 1].type || bl[i].type === 'choix' || protege(i) || protege(i - 1);
    case 'move_node': {
      const j = op.newPath[0] as number;
      if (protege(i)) return true;
      if (op.path.length === 1 && op.newPath.length === 1) return false;
      if (op.newPath.length > 1 && protege(j)) return true;
      const noeud = NodeApi.get(e, op.path);
      return estRenvoi(noeud) && bl[j]?.type !== 'choix';
    }
    default:
      return false;
  }
}

export function creerPluginRegles(env: Env) {
  const { ctx } = env;
  return createPlatePlugin({ key: 'regles' }).overrideEditor(({ editor, api, tf }) => {
    const e: E = editor;
    // Plate remplace ces méthodes sur place : on garde les originales.
    const { getFragment, isVoid } = api;
    const { apply, deleteBackward, deleteForward, insertBreak, insertData, insertFragment, insertText, normalizeNode } = tf;

    /** Bloc fermé sous le curseur, ou undefined. */
    const ferme = () => {
      const i = indexCourant(e);
      const b = blocs(e)[i];
      return b && estFerme(b, ctx) ? { b, i } : undefined;
    };

    const retirerRenvoiVoisin = (i: number, k: number) => {
      const b = blocs(e)[i] as Choix;
      if (renvoisDe(b).length <= 1) env.confirmerDernierRenvoi(b.id);
      else {
        e.tf.removeNodes({ at: [i, k] });
        env.message('1 renvoi retiré : le lien disparaît, la scène visée est conservée.', { annulable: true });
      }
    };

    const effacer = (sens: 'arriere' | 'avant', unite: unknown, origine: (u: unknown) => void) => {
      const sel = e.selection;
      if (!sel) return;
      if (RangeApi.isExpanded(sel)) return supprimerSelection(e, env);
      const i = indexCourant(e);
      const b = blocs(e)[i];
      if (estFerme(b, ctx)) {
        if (estProtege(b, ctx)) return;
        e.tf.removeNodes({ at: [i] });
        if (blocs(e).length > 0) selectionnerBloc(e, Math.min(i, blocs(e).length - 1));
        if (b.type === 'choix') env.message('1 choix supprimé', { annulable: true });
        return;
      }
      const point = sel.anchor;
      const [, k] = point.path as number[];
      if (b.type === 'choix') {
        const enfants = b.children as (Texte | Renvoi)[];
        if (sens === 'arriere' && point.offset === 0 && estRenvoi(enfants[k - 1])) return retirerRenvoiVoisin(i, k - 1);
        if (sens === 'avant' && point.offset === (enfants[k] as Texte).text.length && estRenvoi(enfants[k + 1]))
          return retirerRenvoiVoisin(i, k + 1);
      }
      const auBord = sens === 'arriere' ? e.api.isStart(point, [i]) : e.api.isEnd(point, [i]);
      if (!auBord) return origine(unite);
      // Bord de bloc : on ne fusionne que deux blocs de texte libre de même type.
      const j = sens === 'arriere' ? i - 1 : i + 1;
      const voisin = blocs(e)[j];
      if (!voisin) return;
      if (voisin.type === b.type && TEXTE_LIBRE.has(b.type) && !estFerme(voisin, ctx)) return origine(unite);
      if (b.type === 'p' && chaine(b) === '') {
        e.tf.removeNodes({ at: [i] });
        const cible = sens === 'arriere' ? i - 1 : i;
        selectionnerBloc(e, cible, sens === 'arriere' ? 'fin' : 'debut');
      }
    };

    return {
      api: {
        /**
         * Copier et couper : un bloc fermé part en entier, et une phrase de
         * choix aussi dès que la sélection déborde sur d'autres blocs.
         */
        getFragment(at?: E) {
          const fragment = getFragment(at) as E[];
          const cible = at ?? e.selection;
          if (!cible || !RangeApi.isRange(cible)) return fragment;
          const [debut, fin] = RangeApi.edges(cible);
          const i0 = debut.path[0];
          const plusieurs = fin.path[0] !== i0;
          return fragment.map((n, j) => {
            const original = blocs(e)[i0 + j];
            if (!original || !estBloc(n) || n.type !== original.type) return n;
            const entier = estFerme(original, ctx) || (plusieurs && original.type === 'choix');
            return entier ? JSON.parse(JSON.stringify(original)) : n;
          });
        },
        isVoid(element: E) {
          if (estBloc(element) && estFerme(element, ctx)) return true;
          return isVoid(element);
        },
      },
      transforms: {
        deleteBackward(unite: E) {
          effacer('arriere', unite, deleteBackward as never);
        },
        deleteForward(unite: E) {
          effacer('avant', unite, deleteForward as never);
        },
        deleteFragment() {
          supprimerSelection(e, env);
        },
        insertText(texte: string, options?: E) {
          if (options?.at) return insertText(texte, options);
          if (e.selection && RangeApi.isExpanded(e.selection)) supprimerSelection(e, env, true);
          if (ferme()) {
            env.message(
              estProtege(ferme()!.b, ctx)
                ? "Ce bloc a été préparé par l'enseignant : écris avant ou après."
                : 'Phrase automatique : utilise « Personnaliser » pour en écrire le texte.'
            );
            return;
          }
          insertText(texte, options);
          // Commandes tapées dans le texte.
          const i = indexCourant(e);
          const b = blocs(e)[i];
          if (!b || b.type !== 'p' || !e.selection || !peutCreerChoix(ctx)) return;
          const avant = chaine(b).slice(0, e.selection.anchor.offset);
          for (const commande of ['choix', 'action'] as const) {
            const mot = `/${commande}`;
            if (b.children.length === 1 && avant.endsWith(mot)) {
              const fin = e.selection.anchor;
              e.tf.delete({ at: { anchor: { path: fin.path, offset: fin.offset - mot.length }, focus: fin } });
              env.slash(commande);
            }
          }
        },
        insertBreak() {
          if (e.selection && RangeApi.isExpanded(e.selection)) supprimerSelection(e, env, true);
          const i = indexCourant(e);
          const b = blocs(e)[i];
          if (!b) return;
          // Après un bloc fermé, une phrase de choix ou la fin d'une action : nouveau paragraphe de récit.
          if (estFerme(b, ctx) || b.type === 'choix' || (b.type !== 'p' && e.api.isEnd(e.selection.anchor, [i]))) {
            return insererParagraphe(e, i + 1);
          }
          insertBreak();
        },
        insertFragment(fragment: E[], options?: E) {
          collerBlocs(e, env, fragment, (f) => insertFragment(f as never, options));
        },
        insertData(data: DataTransfer) {
          const slate = data.getData('application/x-slate-fragment');
          const html = data.getData('text/html');
          if (!slate && !html) {
            // Texte brut : un paragraphe de récit par ligne, jamais de renvoi.
            const lignes = data.getData('text/plain').split(/\r\n|\r|\n/);
            const fragment = lignes.map((text) => ({ type: 'p', children: [{ text }] }));
            return collerBlocs(e, env, fragment, (f) => insertFragment(f as never));
          }
          insertData(data);
        },
        normalizeNode(entree: E, options?: E) {
          const [noeud, chemin] = entree;
          if (chemin.length === 0) {
            if (e.children.length === 0) {
              e.tf.insertNodes({ type: 'p', id: nouvelId('p'), children: [{ text: '' }] }, { at: [0] });
              return;
            }
            // Un bloc scindé recopie l'identité de l'original : on la renouvelle.
            const vus = new Set<string>();
            for (const [i, b] of blocs(e).entries()) {
              if (!b.id || vus.has(b.id)) {
                e.tf.setNodes({ id: nouvelId(String(b.type)[0]) }, { at: [i] });
                return;
              }
              vus.add(b.id);
              for (const [k, enfant] of (b.children as unknown[]).entries()) {
                if (!estRenvoi(enfant)) continue;
                if (!enfant.id || vus.has(enfant.id)) {
                  e.tf.setNodes({ id: nouvelId('r') }, { at: [i, k], voids: true });
                  return;
                }
                vus.add(enfant.id);
              }
            }
          }
          if (chemin.length === 1 && estBloc(noeud)) {
            const enfants = noeud.children as unknown[];
            if (noeud.type !== 'choix') {
              // Seule une phrase de choix porte des renvois.
              const k = enfants.findIndex((c) => typeof (c as Texte).text !== 'string');
              if (k !== -1) {
                e.tf.removeNodes({ at: [...chemin, k] });
                return;
              }
            } else if (renvoisDe(noeud).length === 0) {
              // Pas de phrase de choix sans renvoi.
              e.tf.removeNodes({ at: chemin });
              return;
            }
          }
          normalizeNode(entree, options);
        },
        apply(op: E) {
          if (op.type === 'set_selection' && op.newProperties) {
            // Slate ne sait placer le curseur que sur le premier texte d'un bloc
            // fermé : tout point qui tomberait plus loin y est ramené.
            const ramener = (point: E) => {
              const b = point && blocs(e)[point.path[0]];
              return b && estFerme(b, ctx) ? { path: [point.path[0], 0], offset: 0 } : point;
            };
            const { anchor, focus } = op.newProperties;
            op = { ...op, newProperties: { ...op.newProperties, ...(anchor ? { anchor: ramener(anchor) } : {}), ...(focus ? { focus: ramener(focus) } : {}) } };
          }
          if (op.type !== 'set_selection' && interdite(e, env, op)) {
            env.garde.refus += 1;
            return;
          }
          apply(op);
        },
      },
    };
  });
}
