// Commandes de l'éditeur appelées par la barre, la saisie et le panneau.

import {
  type Bloc,
  type Choix,
  type Renvoi,
  choixAuto,
  composer,
  estFerme,
  renvoi,
  renvoisDe,
} from '../modele';
import type { Serveur } from '../serveur';
import { type Env, blocs, chaine, indexCourant, indexDe, insererParagraphe, selectionnerBloc } from './regles';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type E = any;

export type Position = { genre: 'fin' } | { genre: 'apres'; id: string };

export function creerCommandes(e: E, env: Env, serveur: Serveur, sceneId: string) {
  const { ctx } = env;

  const remplacer = (i: number, bloc: Bloc) => {
    e.tf.withoutNormalizing(() => {
      e.tf.removeNodes({ at: [i] });
      e.tf.insertNodes(bloc, { at: [i] });
    });
    selectionnerBloc(e, i, 'fin');
  };

  return {
    /** Où insérer : après le paragraphe du curseur, ou en fin de scène sans curseur. */
    positionCourante(): Position {
      const i = indexCourant(e);
      const b = blocs(e)[i];
      return b ? { genre: 'apres', id: b.id } : { genre: 'fin' };
    },

    insererBloc(position: Position, bloc: Bloc): string {
      e.tf.withoutNormalizing(() => {
        let index = blocs(e).length;
        if (position.genre === 'apres') {
          const i = indexDe(e, position.id);
          if (i !== -1) {
            const courant = blocs(e)[i];
            index = i + 1;
            // Sur une ligne vide, le bloc la remplace.
            if (courant.type === 'p' && !estFerme(courant, ctx) && chaine(courant) === '') {
              e.tf.removeNodes({ at: [i] });
              index = i;
            }
          }
        }
        e.tf.insertNodes(bloc, { at: [index] });
        selectionnerBloc(e, index, 'fin');
      });
      return bloc.id;
    },

    insererChoix(position: Position, libelle: string, cible: string | null, construction: number): string {
      return this.insererBloc(position, choixAuto(libelle, cible, construction));
    },

    modifierLibelle(id: string, libelle: string) {
      const i = indexDe(e, id);
      if (i !== -1) e.tf.setNodes({ libelle }, { at: [i] });
    },

    modifierCible(id: string, renvoiId: string, cible: string | null) {
      const i = indexDe(e, id);
      if (i === -1) return;
      const k = (blocs(e)[i].children as unknown[]).findIndex((n) => (n as Renvoi).id === renvoiId);
      if (k !== -1) e.tf.setNodes({ cible }, { at: [i, k], voids: true });
    },

    /** Le texte devient libre ; le renvoi reste un élément insécable. */
    personnaliser(id: string) {
      const i = indexDe(e, id);
      const b = blocs(e)[i] as Choix;
      if (!b || b.type !== 'choix' || b.mode !== 'auto') return;
      const { avant, apres } = composer(b.libelle, b.construction, serveur.formule);
      remplacer(i, { ...b, mode: 'perso', children: [{ text: avant }, renvoisDe(b)[0], { text: apres }] });
    },

    revenirAuto(id: string) {
      const i = indexDe(e, id);
      const b = blocs(e)[i] as Choix;
      if (!b || b.type !== 'choix' || renvoisDe(b).length !== 1) return;
      remplacer(i, { ...b, mode: 'auto', children: [{ text: '' }, renvoisDe(b)[0], { text: '' }] });
      selectionnerBloc(e, i);
    },

    regenerer(id: string, cochees: number[]) {
      const i = indexDe(e, id);
      const b = blocs(e)[i] as Choix;
      const autres = cochees.filter((c) => c !== b.construction);
      if (autres.length > 0) e.tf.setNodes({ construction: autres[Math.floor(Math.random() * autres.length)] }, { at: [i] });
    },

    /** Second renvoi, à l'endroit du curseur d'une phrase personnalisée. */
    insererRenvoi(cible: string | null, libelle?: string) {
      const i = indexCourant(e);
      const b = blocs(e)[i];
      if (!b || b.type !== 'choix' || b.mode !== 'perso') return;
      e.tf.insertNodes(renvoi(cible, libelle), { at: e.selection.anchor, select: true });
    },

    retirerRenvoi(id: string, renvoiId: string) {
      const i = indexDe(e, id);
      const b = blocs(e)[i];
      if (!b) return;
      if (renvoisDe(b).length <= 1) return env.confirmerDernierRenvoi(id);
      const k = (b.children as unknown[]).findIndex((n) => (n as Renvoi).id === renvoiId);
      e.tf.removeNodes({ at: [i, k] });
      env.message('1 renvoi retiré : le lien disparaît, la scène visée est conservée.', { annulable: true });
    },

    supprimerBloc(id: string) {
      const i = indexDe(e, id);
      if (i === -1) return;
      const b = blocs(e)[i];
      e.tf.removeNodes({ at: [i] });
      if (blocs(e).length > 0) selectionnerBloc(e, Math.min(i, blocs(e).length - 1));
      if (b.type === 'choix') env.message('1 choix supprimé', { annulable: true });
    },

    /** Déplacement sans glisser : « Monter » et « Descendre ». */
    deplacer(id: string, pas: -1 | 1) {
      const i = indexDe(e, id);
      const j = i + pas;
      if (i === -1 || j < 0 || j >= blocs(e).length) return;
      e.tf.moveNodes({ at: [i], to: [j] });
      selectionnerBloc(e, j);
    },

    /** Récit ↔ action de jeu, pour le paragraphe du curseur. */
    basculerAction() {
      const i = indexCourant(e);
      const b = blocs(e)[i];
      if (!b) return;
      if (b.type === 'p') e.tf.setNodes({ type: 'action' }, { at: [i] });
      else if (b.type === 'action') e.tf.setNodes({ type: 'p' }, { at: [i] });
    },

    basculerProtection() {
      const i = indexCourant(e);
      const b = blocs(e)[i];
      if (!b || (b.type !== 'p' && b.type !== 'action')) return;
      if (b.protege) e.tf.unsetNodes('protege', { at: [i] });
      else e.tf.setNodes({ protege: true }, { at: [i] });
    },

    ecrireA(index: number) {
      const precedent = blocs(e)[index - 1];
      if (precedent && precedent.type === 'p' && !estFerme(precedent, ctx) && chaine(precedent) === '') {
        selectionnerBloc(e, index - 1);
      } else insererParagraphe(e, index);
      // Le focus est donné une fois le changement rendu ; demandé trop tôt, Slate l'abandonne parfois.
      setTimeout(() => e.tf.focus(), 0);
    },

    /** « Cacher ce choix (énigme) » : la phrase part, le lien reste, le numéro est fixé. */
    cacherChoix(id: string) {
      const i = indexDe(e, id);
      const b = blocs(e)[i] as Choix;
      const [r] = renvoisDe(b);
      if (!b || b.type !== 'choix' || renvoisDe(b).length !== 1 || !r.cible) return;
      serveur.ajouterLiaison(sceneId, r.cible, b.libelle);
      e.tf.removeNodes({ at: [i] });
      if (blocs(e).length > 0) selectionnerBloc(e, Math.min(i, blocs(e).length - 1));
    },

    proposerCommeChoix(liaisonId: string) {
      const liaison = serveur.scenes.get(sceneId)?.liaisons.find((l) => l.id === liaisonId);
      if (!liaison) return;
      serveur.retirerLiaison(sceneId, liaisonId);
      this.insererChoix({ genre: 'fin' }, liaison.libelle ?? 'Continuer', liaison.cible, 0);
    },
  };
}

export type Commandes = ReturnType<typeof creerCommandes>;
