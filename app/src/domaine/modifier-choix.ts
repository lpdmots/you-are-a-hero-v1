/**
 * Modifier une phrase de choix (F05.2, F05-AC20 à AC25) : chaque geste des réglages d'un choix, comme une
 * règle du texte — le bloc d'avant, le bloc d'après, la même identité. La copie les applique dans son
 * éditeur ; « Chemins » les pose depuis le plan (F03-AC71 à AC73) : un choix se modifie de la même façon
 * partout.
 */

import {
  enPersonnalisee, estAuto, estRenvoi, estSuite, nouveauRenvoi, nouvelId, renvoisDe, seulRenvoi, tirerConstruction,
  type Choix, type ChoixAuto, type ChoixPerso, type Liaison,
} from "./copie";
import type { Construction, FormuleRenvoi } from "./preparation";

/**
 * Les liens d'un choix dans « Chemins » (F03-AC70) : un par destination de sa phrase, sous l'identité de
 * son renvoi ; celui d'un lien caché, sous la sienne. Le choix n'a qu'un onglet, d'où part un trait par
 * destination : l'onglet et ses traits restent désignés tant que le choix est ouvert.
 */
export const liensDuChoix = (bloc: Choix | Liaison): string[] => (bloc.type === "liaison" ? [bloc.id] : renvoisDe(bloc).map((r) => r.id));

/** « Ce que fait le lecteur » : le libellé ; une phrase automatique le reprend aussitôt. */
export const avecLibelle = (bloc: Choix, libelle: string): Choix => ({ ...bloc, libelle });

/** La destination d'un renvoi : celle de la phrase automatique, ou celle d'un numéro d'une phrase écrite à la main. */
export function avecDestination(bloc: Choix, renvoi: string, cible: string | null): Choix {
  if (estAuto(bloc)) return bloc.id === renvoi ? { ...bloc, cible } : bloc;
  return { ...bloc, children: bloc.children.map((x) => (estRenvoi(x) && x.id === renvoi ? { ...x, cible } : x)) };
}

/** Écrire la phrase : le texte autour de ses numéros, qui restent à leur place. Une phrase automatique devient une phrase modifiée (F05-AC22). */
export function avecPhrase(bloc: Choix, textes: readonly string[], formule: FormuleRenvoi): Choix {
  const perso = enPersonnalisee(bloc, formule) as ChoixPerso;
  const puces = perso.children.filter((x) => !("text" in x));
  return { ...perso, children: [...puces.flatMap((puce, k) => [{ text: textes[k] ?? "" }, puce]), { text: textes[puces.length] ?? "" }] };
}

/**
 * La flèche ronde : une autre tournure pour une phrase automatique ; pour une phrase modifiée à une seule
 * destination, le retour à l'automatique (F05-AC23). Rien à faire avec plusieurs destinations.
 */
export function automatisee(bloc: Choix, utiles: Construction[], tirage?: () => number): Choix {
  if (estAuto(bloc)) {
    // Une suite n'a qu'une forme : sa construction attend qu'on lui écrive une action (F05-AC63)
    if (estSuite(bloc)) return bloc;
    const autres = utiles.filter((u) => u !== bloc.construction);
    return autres.length ? { ...bloc, construction: tirerConstruction(autres, tirage) } : bloc;
  }
  const renvoi = seulRenvoi(bloc);
  if (!renvoi) return bloc;
  return { type: "choix", id: bloc.id, auto: true, libelle: bloc.libelle, construction: tirerConstruction(utiles, tirage), cible: renvoi.cible, children: [{ text: "" }] };
}

/** Une destination de plus : son numéro s'ajoute à la fin de la phrase, qui s'écrit dès lors à la main. */
export function avecUneDestinationDePlus(bloc: Choix, cible: string | null, formule: FormuleRenvoi): Choix {
  const perso = enPersonnalisee(bloc, formule) as ChoixPerso;
  const enfants = perso.children;
  const dernier = enfants[enfants.length - 1];
  const fin = "text" in dernier ? dernier.text : "";
  return {
    ...perso,
    children: [...enfants.slice(0, "text" in dernier ? -1 : undefined), { text: fin && !/\s$/.test(fin) ? `${fin} ` : fin }, nouveauRenvoi(cible), { text: "" }],
  };
}

/** « Retirer » une destination : son numéro quitte la phrase, les textes qui l'entouraient se rejoignent. */
export function sansRenvoi(bloc: Choix, renvoi: string): Choix {
  if (estAuto(bloc)) return bloc;
  const children: ChoixPerso["children"] = [];
  for (const x of bloc.children) {
    if (estRenvoi(x) && x.id === renvoi) continue;
    const avant = children[children.length - 1];
    if ("text" in x && avant && "text" in avant) children[children.length - 1] = { text: avant.text + x.text };
    else children.push(x);
  }
  return { ...bloc, children };
}

/** Les destinations dans un nouvel ordre : les numéros de la phrase, de gauche à droite, les prennent une à une. */
export function avecDestinationsOrdonnees(bloc: Choix, cibles: readonly (string | null)[]): Choix {
  if (estAuto(bloc)) return bloc;
  let n = 0;
  return { ...bloc, children: bloc.children.map((x) => (estRenvoi(x) ? { ...x, cible: cibles[n++] ?? null } : x)) };
}

/** La seule destination d'un choix, s'il n'en a qu'une : celle qu'un lien caché reprend. */
export const seuleDestination = (bloc: Choix): string | null => (estAuto(bloc) ? bloc.cible : (seulRenvoi(bloc)?.cible ?? null));

/** « Cacher ce choix (énigme) » : le lien caché qui prend la place de la phrase, hors du récit (F05-AC26). */
export function liaisonDuChoix(bloc: Choix): Liaison | null {
  const cible = seuleDestination(bloc);
  if (!cible) return null;
  return { type: "liaison", id: nouvelId(), cible, children: [{ text: "" }], ...(bloc.libelle ? { libelle: bloc.libelle } : {}) };
}

/** « Proposer comme choix » : la phrase automatique qui reprend un lien caché, à la fin du texte (F05-AC26). */
export const choixDeLaLiaison = (liaison: Liaison, libelle: string, utiles: Construction[], tirage?: () => number): ChoixAuto => ({
  type: "choix", id: nouvelId(), auto: true, libelle, cible: liaison.cible, construction: tirerConstruction(utiles, tirage), children: [{ text: "" }],
});
