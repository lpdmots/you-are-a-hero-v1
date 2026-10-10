"use client";

import { NodeApi, RangeApi } from "platejs";
import { createPlatePlugin } from "platejs/react";
import {
  estAuto, estRenvoi, estReserve, lettresDe, lireCollage, lireTexteSimple, nettoyerTexte, nouvelId, paragrapheVide, phraseEnMots, renvoisDe,
  NUMERO_VIDE, type Bloc, type Choix, type Droits, type Lettres, type Texte,
} from "@/domaine/copie";
import type { FormuleRenvoi } from "@/domaine/preparation";

/**
 * Les règles de la copie que Plate ne fournit pas (F05.2, F06.1) : elles s'écrivent contre
 * Slate. Une phrase de choix automatique, ou un bloc que la personne n'a pas le droit de
 * modifier, est un bloc « fermé » : pris comme un tout, on écrit avant ou après, jamais
 * dedans. Slate n'a prévu ses blocs fermés que sans contenu : de là viennent les
 * contournements de ce fichier (docs/architecture.md).
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Editeur = any;
type Point = { path: number[]; offset: number };

/** Ce que la copie dit à la personne, au pied du texte, avec de quoi revenir en arrière. */
export type Signal =
  | { sorte: "supprime"; choix: number; renvois?: number }
  | { sorte: "colle"; deplaces: number; copies: number; ecartes: number; images?: boolean }
  | { sorte: "image" };

export type Regles = {
  /** Gras, italique et souligné sont-ils permis ici ? */
  marques: boolean;
  droits: Droits;
  projetId: string;
  sceneId: string;
  formule: FormuleRenvoi;
  /** Scène → numéro imprimé, pour ce qui sort vers le presse-papiers */
  numeros: Record<string, number>;
  /** Les scènes où un choix peut mener : un choix collé vers une autre est écarté */
  scenes: string[];
  signaler: (signal: Signal) => void;
  /** Retour arrière contre le dernier renvoi d'une phrase : la fiche demande confirmation */
  confirmerDernierRenvoi: (bloc: string) => void;
};

export const blocsDe = (e: Editeur): Bloc[] => e.children as Bloc[];

/**
 * Un bloc fermé : pris comme un tout, le curseur n'y entre pas. C'est la phrase de choix
 * automatique, et tout bloc réservé à l'adulte pour cette personne — phrase préparée,
 * paragraphe protégé (F06.1).
 */
export const estFerme = (bloc: Bloc | undefined, droits: Droits): boolean => !!bloc && (estAuto(bloc) || estReserve(bloc, droits));

/** La personne peut-elle modifier, déplacer ou supprimer ce bloc ? */
export const peutModifier = (bloc: Bloc, droits: Droits): boolean => !estReserve(bloc, droits);

/** Le bloc où se trouve le curseur, ou rien. */
export function blocCourant(e: Editeur): { index: number; bloc: Bloc } | null {
  const index = e.selection?.anchor.path[0];
  const bloc = typeof index === "number" ? blocsDe(e)[index] : undefined;
  return bloc ? { index: index as number, bloc } : null;
}

const fragmentInterne = (data: DataTransfer): { blocs: unknown; origine: { mode?: string; projet?: string } } => {
  let origine = {};
  try {
    origine = JSON.parse(data.getData("application/x-copie-origine") || "{}");
  } catch {
    // Pas notre presse-papiers
  }
  const code = data.getData("application/x-slate-fragment");
  if (!code) return { blocs: null, origine };
  try {
    return { blocs: JSON.parse(decodeURIComponent(window.atob(code))), origine };
  } catch {
    return { blocs: null, origine };
  }
};

const deplace0 = (origine: { mode?: string; projet?: string }, projetId: string): boolean => origine.mode === "coupe" && origine.projet === projetId;
const enBlocs = (paragraphes: Lettres[][]): Texte => paragraphes.map((children) => ({ type: "p", id: nouvelId(), children }));
const echapper = (t: string): string => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export const ReglesPlugin = createPlatePlugin({
  key: "regles",
  options: {
    marques: true, droits: { role: "adulte" }, projetId: "", sceneId: "", formule: "rends", numeros: {}, scenes: [],
    signaler: () => {}, confirmerDernierRenvoi: () => {},
  } as Regles,
// Les surcharges parlent à Slate plus largement que les types de Plate ne le décrivent
// eslint-disable-next-line @typescript-eslint/no-explicit-any
}).overrideEditor((({ editor, tf, api, getOptions }: any): any => {
  const e: Editeur = editor;
  // Plate remplace ces méthodes sur place : on garde les originales
  const { deleteBackward, deleteForward, insertBreak, insertFragment, insertText, insertData, normalizeNode, apply } = tf;
  const { isVoid, isInline, getFragment } = api;
  const o = (): Regles => getOptions();
  const ferme = (b: Bloc | undefined) => estFerme(b, o().droits);
  const numero = (cible: string | null): string => (cible && o().numeros[cible] ? String(o().numeros[cible]) : NUMERO_VIDE);

  /** Pose le curseur sur un bloc : dans son texte, ou sur lui s'il est fermé. */
  const allerA = (index: number, fin = false) => {
    const bloc = blocsDe(e)[index];
    if (!bloc) return;
    if (ferme(bloc)) e.tf.select({ path: [index, 0], offset: 0 });
    else e.tf.select(fin ? e.api.end([index]) : e.api.start([index]));
  };

  /**
   * Supprimer la sélection (F05-AC28, AC29, AC46). Une phrase de choix est prise en entier
   * ou pas du tout ; celle que la personne n'a pas le droit de toucher reste à sa place, et
   * le récit sélectionné autour d'elle est supprimé.
   */
  const supprimerSelection = (): boolean => {
    const selection = e.selection;
    if (!selection || RangeApi.isCollapsed(selection)) return false;
    const [debut, fin] = RangeApi.edges(selection) as [Point, Point];
    const [i0, i1] = [debut.path[0], fin.path[0]];
    const avant = blocsDe(e);
    const { droits } = o();
    let choix = 0;

    // Dans une seule phrase personnalisée : son texte se supprime, sauf si tous ses renvois partent avec
    if (i0 === i1 && avant[i0].type === "choix") {
      const bloc = avant[i0] as Choix;
      if (ferme(bloc)) return true;
      const emportes = (bloc.children as unknown[]).filter((enfant, k) => estRenvoi(enfant) && k > debut.path[1] && k < fin.path[1]).length;
      if (emportes < renvoisDe(bloc).length) {
        e.tf.delete({ at: selection });
        if (emportes) o().signaler({ sorte: "supprime", choix: 0, renvois: emportes });
        return true;
      }
      // Tous ses renvois sont dans la sélection : sans renvoi il n'y a plus de choix, la phrase part entière (F05-AC46)
      supprimerBlocs([bloc.id]);
      return true;
    }

    // Récit et note de l'enseignant : du texte, dont une partie seulement peut partir
    const textuel = (b: Bloc) => b.type === "p" || b.type === "note";
    const retire = (k: number): boolean => {
      const b = avant[k];
      if (b.type === "choix") return peutModifier(b, droits);
      // Un paragraphe entièrement couvert part ; aux deux bouts, seule la partie sélectionnée
      return k > i0 && k < i1 && peutModifier(b, droits);
    };
    e.tf.withoutNormalizing(() => {
      const teteGardee = textuel(avant[i0]) && peutModifier(avant[i0], droits);
      const queueGardee = i1 !== i0 && textuel(avant[i1]) && peutModifier(avant[i1], droits);
      if (i0 === i1) {
        if (teteGardee) e.tf.delete({ at: selection });
      } else {
        if (queueGardee) e.tf.delete({ at: { anchor: e.api.start([i1]), focus: fin } });
        let gardesEntre = 0;
        for (let k = i1; k >= i0; k -= 1) {
          if (retire(k)) {
            if (avant[k].type === "choix") choix += 1;
            e.tf.removeNodes({ at: [k] });
          } else if (k > i0 && k < i1) gardesEntre += 1;
        }
        if (teteGardee) e.tf.delete({ at: { anchor: debut, focus: e.api.end([i0]) } });
        // Les deux bouts d'un même récit se rejoignent, comme dans tout traitement de texte
        if (teteGardee && queueGardee && gardesEntre === 0 && avant[i0].type === avant[i1].type) e.tf.mergeNodes({ at: [i0 + 1] });
      }
      if (blocsDe(e).length === 0) e.tf.insertNodes(paragrapheVide(), { at: [0] });
      const reste = blocsDe(e);
      if (teteGardee) e.tf.select(debut);
      else allerA(Math.min(i0, reste.length - 1), i0 > reste.length - 1);
    });
    if (choix) o().signaler({ sorte: "supprime", choix });
    return true;
  };

  /** Supprimer des blocs entiers, par leur identité, si la personne en a le droit. */
  const supprimerBlocs = (ids: string[]): number => {
    let faits = 0;
    let choix = 0;
    e.tf.withoutNormalizing(() => {
      for (let k = blocsDe(e).length - 1; k >= 0; k -= 1) {
        const b = blocsDe(e)[k];
        if (!ids.includes(b.id) || !peutModifier(b, o().droits)) continue;
        if (b.type === "choix") choix += 1;
        e.tf.removeNodes({ at: [k] });
        faits += 1;
        if (blocsDe(e).length === 0) e.tf.insertNodes(paragrapheVide(), { at: [0] });
        allerA(Math.min(k, blocsDe(e).length - 1), k > blocsDe(e).length - 1);
      }
    });
    if (choix) o().signaler({ sorte: "supprime", choix });
    return faits;
  };

  /**
   * Insérer des blocs au curseur. Le récit se glisse dans le paragraphe du curseur ; une
   * phrase de choix, et tout ce qui la suit, prend place dessous, dans son propre
   * paragraphe : jamais de renvoi dans un paragraphe de récit (F05-AC15, AC45).
   */
  const insererBlocs = (fragment: Texte) => {
    if (fragment.length === 0) return;
    supprimerSelection();
    const ici = blocCourant(e);
    if (!ici) {
      e.tf.insertNodes(fragment, { at: [blocsDe(e).length] });
      allerA(blocsDe(e).length - 1, true);
      return;
    }
    const premier = fragment.findIndex((b) => b.type !== "p");
    const tete = premier === -1 ? fragment : fragment.slice(0, premier);
    const reste = premier === -1 ? [] : fragment.slice(premier);
    let apres = ici.index;
    if (tete.length) {
      if (ici.bloc.type === "p") {
        insertFragment(tete as never);
        apres = e.selection?.anchor.path[0] ?? ici.index;
      } else {
        e.tf.insertNodes(tete, { at: [ici.index + 1] });
        apres = ici.index + tete.length;
        allerA(apres, true);
      }
    }
    if (reste.length) {
      const sous = blocsDe(e)[apres];
      // Sur une ligne vide, ce qu'on insère la remplace
      const remplace = sous.type === "p" && lettresDe(sous) === "" && tete.length === 0;
      e.tf.withoutNormalizing(() => {
        e.tf.insertNodes(reste, { at: [apres + 1] });
        if (remplace) e.tf.removeNodes({ at: [apres] });
      });
      allerA(apres + reste.length - (remplace ? 1 : 0), true);
    }
  };

  return {
    api: {
      isVoid(element: { type?: string }) {
        if (element.type === "renvoi") return true;
        if (element.type === "choix" || element.type === "p") return ferme(element as Bloc);
        return isVoid(element as never);
      },
      isInline(element: { type?: string }) {
        return element.type === "renvoi" || isInline(element as never);
      },
      /** Ce qu'on copie : un bloc fermé part entier, et une phrase de choix n'est jamais prise à moitié (F05.2). */
      getFragment(at?: unknown) {
        const selection = e.selection;
        if (at === undefined && selection && RangeApi.isCollapsed(selection)) {
          const ici = blocCourant(e);
          return ici && ferme(ici.bloc) ? [ici.bloc] : [];
        }
        const fragment = getFragment(at as never) as unknown as Bloc[];
        const entiers = new Map(blocsDe(e).map((b) => [b.id, b]));
        return fragment.map((b) => (ferme(entiers.get(b.id)) ? entiers.get(b.id)! : b));
      },
    },
    transforms: {
      // Commandes de la copie, appelées par ses boutons et son clavier
      supprimerSelection,
      supprimerBlocs,
      insererBlocs,
      allerA,

      deleteFragment() {
        supprimerSelection();
      },
      deleteBackward(unite: unknown) {
        if (supprimerSelection()) return;
        const ici = blocCourant(e);
        const point = e.selection?.anchor as Point | undefined;
        if (!ici || !point) return;
        if (ferme(ici.bloc)) {
          supprimerBlocs([ici.bloc.id]);
          return;
        }
        // Contre un renvoi : il s'efface comme un tout, sauf le dernier de sa phrase (F05-AC25)
        if (ici.bloc.type === "choix" && point.offset === 0 && point.path[1] > 0) {
          const precedent = (ici.bloc.children as unknown[])[point.path[1] - 1];
          if (estRenvoi(precedent)) {
            if (renvoisDe(ici.bloc).length === 1) return o().confirmerDernierRenvoi(ici.bloc.id);
            e.tf.removeNodes({ at: [ici.index, point.path[1] - 1] });
            o().signaler({ sorte: "supprime", choix: 0, renvois: 1 });
            return;
          }
        }
        if (e.api.isStart(point, [ici.index])) {
          if (ici.index === 0) return;
          const avant = blocsDe(e)[ici.index - 1];
          // Deux paragraphes de récit se rejoignent ; récit et phrase de choix, note ou bloc préparé, jamais (F05-AC15)
          if (ici.bloc.type === "p" && avant.type === "p" && !ferme(avant)) return deleteBackward(unite as never);
          // Une ligne vide, ou une note vidée, s'efface
          if ((ici.bloc.type === "p" || ici.bloc.type === "note") && lettresDe(ici.bloc) === "") e.tf.removeNodes({ at: [ici.index] });
          allerA(ici.index - 1, true);
          return;
        }
        deleteBackward(unite as never);
      },
      deleteForward(unite: unknown) {
        if (supprimerSelection()) return;
        const ici = blocCourant(e);
        const point = e.selection?.anchor as Point | undefined;
        if (!ici || !point) return;
        if (ferme(ici.bloc)) {
          supprimerBlocs([ici.bloc.id]);
          return;
        }
        if (ici.bloc.type === "choix") {
          const lettres = (ici.bloc.children as unknown[])[point.path[1]] as { text?: string };
          const suivant = (ici.bloc.children as unknown[])[point.path[1] + 1];
          if (estRenvoi(suivant) && point.offset === (lettres.text ?? "").length) {
            if (renvoisDe(ici.bloc).length === 1) return o().confirmerDernierRenvoi(ici.bloc.id);
            e.tf.removeNodes({ at: [ici.index, point.path[1] + 1] });
            o().signaler({ sorte: "supprime", choix: 0, renvois: 1 });
            return;
          }
        }
        if (e.api.isEnd(point, [ici.index])) {
          const apres = blocsDe(e)[ici.index + 1];
          if (!apres) return;
          if (ici.bloc.type === "p" && apres.type === "p" && !ferme(apres)) return deleteForward(unite as never);
          if (ici.bloc.type === "p" && lettresDe(ici.bloc) === "") {
            e.tf.removeNodes({ at: [ici.index] });
            allerA(ici.index);
          } else allerA(ici.index + 1);
          return;
        }
        deleteForward(unite as never);
      },
      insertText(texte: string, options?: unknown) {
        supprimerSelection();
        const ici = blocCourant(e);
        // Rien ne s'écrit dans un bloc fermé (F05-AC22)
        if (!ici || ferme(ici.bloc)) return;
        insertText(texte, options as never);
      },
      insertBreak() {
        supprimerSelection();
        const ici = blocCourant(e);
        if (!ici || ferme(ici.bloc)) return;
        // Une phrase de choix ou une note tient en un paragraphe : Entrée en ouvre un dessous.
        // Après un paragraphe protégé, la suite ne l'est pas : on protège ce qu'on a choisi
        const point = e.selection?.anchor as Point | undefined;
        if (ici.bloc.type !== "p" || (ici.bloc.protege && point && e.api.isEnd(point, [ici.index]))) {
          e.tf.insertNodes(paragrapheVide(), { at: [ici.index + 1] });
          allerA(ici.index + 1);
          return;
        }
        insertBreak();
      },
      insertFragment(fragment: unknown) {
        const propre = nettoyerTexte(fragment);
        if (propre) insererBlocs(propre);
      },
      insertData(data: DataTransfer) {
        const { marques, droits, projetId } = o();
        const { blocs: bruts, origine } = fragmentInterne(data);
        // Copié depuis une scène de l'application : le même contrôle que pour ce qui s'enregistre
        const interne = nettoyerTexte(bruts);
        if (interne?.length) {
          // Coupé : le même choix se déplace ; copié : c'en est un autre (F05-AC30, AC31)
          const deplace = deplace0(origine, projetId);
          let [deplaces, copies, ecartes] = [0, 0, 0];
          const admis: Texte = [];
          for (const bloc of interne) {
            if (bloc.type === "p") {
              // Du récit, sans la protection qu'il portait : on protège un paragraphe, pas sa copie
              admis.push({ type: "p", id: nouvelId(), children: marques ? bloc.children : bloc.children.map((l) => ({ text: l.text })) });
            } else if (bloc.type === "note") {
              // La note se déplace ou se duplique pour l'adulte ; personne d'autre n'en a (F05.2)
              if (droits.role === "adulte") admis.push(deplace0(origine, projetId) ? bloc : { ...bloc, id: nouvelId() });
            } else if (bloc.type === "liaison") {
              // Hors du récit : une liaison cachée ne se colle pas
            } else if (estReserve(bloc, droits) || renvoisDe(bloc).some((r) => r.cible !== null && !o().scenes.includes(r.cible))) {
              // Créer ou déplacer ce choix n'est pas permis à cette personne, ou il vise une scène
              // qu'elle ne connaît pas : il est écarté (F05-AC32)
              ecartes += 1;
            } else if (deplace) {
              deplaces += 1;
              admis.push(bloc);
            } else {
              copies += 1;
              admis.push(
                estAuto(bloc)
                  ? { ...bloc, id: nouvelId() }
                  : { ...bloc, id: nouvelId(), children: bloc.children.map((enfant) => (estRenvoi(enfant) ? { ...enfant, id: nouvelId() } : enfant)) },
              );
            }
          }
          insererBlocs(admis);
          if (deplaces || copies || ecartes) o().signaler({ sorte: "colle", deplaces, copies, ecartes });
          return;
        }
        const images = [...(data.files ?? [])].filter((f) => f.type.startsWith("image/")).length;
        const html = data.getData("text/html");
        if (html) {
          const lu = lireCollage(new DOMParser().parseFromString(html, "text/html").body, marques);
          if (lu.paragraphes.length) insererBlocs(enBlocs(lu.paragraphes));
          // Une image collée est écartée : les images passent par l'import (F04-AC36)
          if (lu.imagesEcartees || images) o().signaler({ sorte: "image" });
          if (lu.paragraphes.length || lu.imagesEcartees) return;
        }
        // Un texte venu d'ailleurs ne crée jamais de renvoi : « rends-toi au 12 » reste du texte (F05-AC33)
        const simple = lireTexteSimple(data.getData("text/plain"));
        if (simple.length) return insererBlocs(enBlocs(simple));
        if (images) return o().signaler({ sorte: "image" });
        insertData(data);
      },
      /** Ce qui part dans le presse-papiers : nos blocs, et un texte simple avec les numéros affichés. */
      setFragmentData(data: DataTransfer, origine?: string) {
        const fragment = e.api.getFragment() as Bloc[];
        if (fragment.length === 0) return;
        const lignes = fragment.map((b) => (b.type === "choix" ? phraseEnMots(b, o().formule, numero) : lettresDe(b)));
        data.setData("application/x-slate-fragment", window.btoa(encodeURIComponent(JSON.stringify(fragment))));
        data.setData("application/x-copie-origine", JSON.stringify({ mode: origine === "cut" ? "coupe" : "copie", projet: o().projetId, scene: o().sceneId }));
        data.setData("text/plain", lignes.join("\n"));
        data.setData("text/html", lignes.map((l) => `<p>${echapper(l)}</p>`).join(""));
      },
      normalizeNode(entree: [unknown, number[]], options?: unknown) {
        const [noeud, chemin] = entree as [{ type?: string; id?: string; children?: unknown[] }, number[]];
        if (chemin.length === 0) {
          const blocs = blocsDe(e);
          if (blocs.length === 0) {
            e.tf.insertNodes(paragrapheVide(), { at: [0] });
            return;
          }
          // Un paragraphe coupé en deux garde son identité d'un côté, en reçoit une de l'autre
          const vus = new Set<string>();
          for (let i = 0; i < blocs.length; i += 1) {
            const id = blocs[i].id;
            if (!id || vus.has(id)) {
              e.tf.setNodes({ id: nouvelId() }, { at: [i] });
              return;
            }
            vus.add(id);
            for (const [k, enfant] of (blocs[i].children as unknown[]).entries()) {
              if (!estRenvoi(enfant)) continue;
              if (!enfant.id || vus.has(enfant.id)) {
                e.tf.setNodes({ id: nouvelId() }, { at: [i, k] });
                return;
              }
              vus.add(enfant.id);
            }
          }
        }
        if (chemin.length === 1) {
          const enfants = (noeud.children ?? []) as unknown[];
          // Un renvoi n'existe que dans une phrase de choix (F05-AC15)
          if (noeud.type === "p" || noeud.type === "note") {
            const k = enfants.findIndex(estRenvoi);
            if (k !== -1) {
              e.tf.removeNodes({ at: [...chemin, k] });
              return;
            }
          }
          // Pas de phrase de choix sans renvoi : ce qu'il en reste est du récit
          if (noeud.type === "choix" && !estAuto(noeud as Bloc) && !enfants.some(estRenvoi)) {
            e.tf.unsetNodes(["libelle"], { at: chemin });
            e.tf.setNodes({ type: "p" }, { at: chemin });
            return;
          }
        }
        normalizeNode(entree as never, options as never);
      },
      /** Dernière garde : aucune opération ne touche un bloc réservé, d'où qu'elle vienne (F06.1). */
      apply(op: { type: string; path?: number[]; newProperties?: Record<string, unknown> }) {
        const { droits } = o();
        if (droits.role !== "adulte" && op.path) {
          const bloc = blocsDe(e)[op.path[0]];
          const dedans = op.path.length > 1 && ["insert_text", "remove_text", "insert_node", "remove_node", "set_node", "split_node", "merge_node"].includes(op.type);
          const dessus = op.path.length === 1 && ["remove_node", "set_node", "split_node"].includes(op.type);
          const fusion = op.path.length === 1 && op.type === "merge_node" && (estReserve(bloc, droits) || estReserve(blocsDe(e)[op.path[0] - 1] ?? bloc, droits));
          if (bloc && ((estReserve(bloc, droits) && (dedans || dessus)) || fusion)) return;
        }
        apply(op as never);
      },
    },
  };
}) as never);

/** Ce qu'il faut pour écrire dans une phrase personnalisée : les lettres, sans mise en forme. */
export const lettresDuChoix = (bloc: Choix): string => NodeApi.string(bloc as never);
