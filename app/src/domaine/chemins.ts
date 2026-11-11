/**
 * Les chemins d'un chapitre (F03.1, « Vue Chemins ») : ses scènes, les choix qui les relient,
 * et ce qu'il y a « à regarder ». Rien ne s'y saisit : tout se déduit des textes.
 */

import { nomPourEleves } from "./eleves";
import type { Etat } from "./etats";
import { chapitresDe, departDe, nomScene, type ElevePlan, type Plan } from "./recit";
import { pluriel } from "./texte";

export type NoeudDeChemin = {
  id: string; reference: number; titre: string | null; etat: Etat; vide: boolean; depart: boolean; fin: boolean;
  /** La scène a une liaison cachée que la vue ne trace pas — celle d'un élève : elle a une suite */
  suiteCachee?: boolean;
  /** La consigne de la scène, pour l'adulte : le panneau du schéma la montre et la modifie (F03-AC55) */
  consigne?: string;
  /** Sa liste de vérification, et ce que l'élève y a coché : le panneau les montre et modifie la liste (F13.2) */
  verification?: string[];
  cochees?: string[];
  /**
   * Qui écrit la scène, tel que la carte le dit après son tampon (F03-AC66) : le prénom de l'élève
   * qui s'en occupe, « Vous » ou « Toi ». On lit seulement qui écrit : rien ne s'attribue d'ici.
   */
  qui?: string;
  /** La page de la scène */
  lien: string;
  /** Une scène du bloc proposé par l'IA, pas encore ajoutée : dessinée en pointillé (F13.7) */
  propose?: { cle: string; inventee: boolean };
};
export type LienDeChemin = {
  id: string; de: string; libelle: string;
  /** Le choix qui porte ce lien : les destinations d'une même phrase partagent son onglet */
  choix?: string;
  /** Liaison cachée par énigme : une suite du récit, sans phrase dans le texte (F05.1) */
  cache: boolean;
  /** La scène d'arrivée, si elle est dans ce chapitre */
  vers: string | null;
  /** Vers un autre chapitre : son titre, et la scène visée si la personne peut la nommer (F03-AC25) */
  ailleurs?: { chapitre: string; nom?: string; lien?: string };
  /** Sans destination encore, ou vers une scène supprimée */
  manque?: "sans" | "supprimee";
  /** Un choix du bloc proposé par l'IA, pas encore ajouté (F13.7) */
  propose?: boolean;
};
/** Un choix d'un autre chapitre qui mène à une scène de celui-ci */
export type EntreeDeChemin = { vers: string; chapitre: string; lien?: string };
export type Chemins = { noeuds: NoeudDeChemin[]; liens: LienDeChemin[]; entrees: EntreeDeChemin[] };

/**
 * La vue qui s'ouvre dans un chapitre (F03.1, « Chemins en atelier », 11 novembre 2026) : en récit à
 * choix, « Chemins », sauf si l'adresse demande « Scènes » ; en récit classique, « Scènes », le
 * seul rangement qui y ait un sens.
 */
export const vueDuChapitre = (demandee: string | undefined, aChoix: boolean): "scenes" | "chemins" => (aChoix && demandee !== "scenes" ? "chemins" : "scenes");

/**
 * Les chemins d'un chapitre tels que l'adulte les lit, d'après le plan et ses liens. `eleves` : la
 * classe, pour dire sur chaque carte qui écrit la scène (F03-AC66).
 */
export function cheminsDuPlan(plan: Plan, chapitreId: string, projetId: string, eleves: readonly ElevePlan[] = []): Chemins {
  const chapitres = chapitresDe(plan);
  const chapitre = chapitres.find((c) => c.id === chapitreId);
  if (!chapitre) return { noeuds: [], liens: [], entrees: [] };
  const depart = departDe(plan);
  const ou = new Map(chapitres.flatMap((c) => c.scenes.map((s) => [s.id, { scene: s, chapitre: c }] as const)));
  const ici = new Set(chapitre.scenes.map((s) => s.id));
  const vueChemins = (c: string, scene?: string) => `/projet/${projetId}/chapitre/${c}?vue=chemins${scene ? `&scene=${scene}` : ""}`;
  const duChapitre = new Set(chapitre.attributions.map((a) => a.eleveId));
  // L'enseignant qui s'est attribué la scène, l'élève du chapitre qui s'en occupe, ou celui qui n'y est plus et
  // dont la scène remise ou finie garde le prénom (F06.3)
  const quiEcrit = (s: (typeof chapitre.scenes)[number]): string | undefined => {
    if (s.priseParEnseignant) return "Vous";
    const eleve = s.priseParEleve && duChapitre.has(s.priseParEleve) ? eleves.find((e) => e.id === s.priseParEleve) : s.ancien;
    return eleve ? nomPourEleves(eleve, eleves) : undefined;
  };
  return {
    noeuds: chapitre.scenes.map((s) => ({
      id: s.id, reference: s.reference, titre: s.titre, etat: s.etat, vide: s.texteVide, depart: depart?.id === s.id, fin: s.fin,
      qui: quiEcrit(s), consigne: s.consigne, verification: s.verification ?? [], cochees: s.cochees ?? [],
      lien: `/projet/${projetId}/scene/${s.id}?de=chemins`,
    })),
    liens: plan.liens
      .filter((l) => ici.has(l.sceneId))
      .map((l): LienDeChemin => {
        const base = { id: l.renvoiId, de: l.sceneId, libelle: l.libelle, cache: l.cache, choix: l.choix };
        if (!l.cibleId) return { ...base, vers: null, manque: "sans" };
        const cible = ou.get(l.cibleId);
        // Une destination partie dans la corbeille n'est redirigée nulle part : le choix le dit (F03-AC14)
        if (!cible) return { ...base, vers: null, manque: "supprimee" };
        if (cible.chapitre.id === chapitreId) return { ...base, vers: l.cibleId };
        return { ...base, vers: null, ailleurs: { chapitre: cible.chapitre.titre, nom: nomScene(cible.scene), lien: vueChemins(cible.chapitre.id, cible.scene.id) } };
      }),
    entrees: plan.liens.flatMap((l) => {
      const origine = ou.get(l.sceneId);
      return l.cibleId && ici.has(l.cibleId) && origine && origine.chapitre.id !== chapitreId
        ? [{ vers: l.cibleId, chapitre: origine.chapitre.titre, lien: vueChemins(origine.chapitre.id, origine.scene.id) }]
        : [];
    }),
  };
}

/**
 * Les scènes dans l'ordre où on les rencontre depuis l'entrée du chapitre, pas après pas :
 * l'ordre de la liste, sur téléphone, et celui dans lequel le schéma reçoit ses scènes.
 */
export function ordreDeLecture(noeuds: NoeudDeChemin[], liens: LienDeChemin[]): NoeudDeChemin[] {
  const ici = new Set(noeuds.map((n) => n.id));
  const suites = new Map<string, string[]>();
  const arrivees = new Set<string>();
  for (const l of liens) {
    if (!l.vers || !ici.has(l.vers) || !ici.has(l.de) || l.vers === l.de) continue;
    suites.set(l.de, [...(suites.get(l.de) ?? []), l.vers]);
    arrivees.add(l.vers);
  }
  const pas = new Map<string, number>();
  const parcourir = (racine: string) => {
    const file: [string, number][] = [[racine, 0]];
    while (file.length) {
      const [id, n] = file.shift()!;
      if (pas.has(id)) continue;
      pas.set(id, n);
      for (const suite of suites.get(id) ?? []) file.push([suite, n + 1]);
    }
  };
  // D'abord le départ et les scènes où rien du chapitre ne mène, dans l'ordre du plan ; puis ce qui reste
  for (const n of noeuds) if (n.depart) parcourir(n.id);
  for (const n of noeuds) if (!arrivees.has(n.id)) parcourir(n.id);
  for (const n of noeuds) parcourir(n.id);
  const rang = new Map(noeuds.map((n, i) => [n.id, i]));
  return [...noeuds].sort((a, b) => pas.get(a.id)! - pas.get(b.id)! || rang.get(a.id)! - rang.get(b.id)!);
}

/**
 * Les retours en arrière (F03.1, « Choix en onglets », F03-AC64) : les choix qui ramènent à une scène par
 * laquelle le lecteur est passé pour arriver là — ils ferment une boucle —, et ceux qui ramènent à leur
 * propre scène. Le schéma les écrit dans l'onglet du choix, ne trace leur ligne qu'à la demande et place
 * les cartes comme s'ils n'existaient pas : sans eux, tout chemin descend.
 *
 * On suit le récit depuis son entrée, chaque scène jusqu'au bout de ses suites, dans l'ordre du texte :
 * un choix qui retombe sur une scène du chemin en cours est un retour.
 */
export function retoursEnArriere(noeuds: NoeudDeChemin[], liens: LienDeChemin[]): Set<string> {
  const ici = new Set(noeuds.map((n) => n.id));
  const suites = new Map<string, LienDeChemin[]>();
  for (const l of liens) if (l.vers && ici.has(l.vers) && ici.has(l.de)) suites.set(l.de, [...(suites.get(l.de) ?? []), l]);
  const etat = new Map<string, "en-route" | "finie">();
  const retours = new Set<string>();
  // Une pile plutôt qu'une fonction qui s'appelle elle-même : un chapitre peut être long
  const suivre = (racine: string) => {
    const pile: { id: string; reste: LienDeChemin[] }[] = [{ id: racine, reste: [...(suites.get(racine) ?? [])] }];
    etat.set(racine, "en-route");
    while (pile.length) {
      const haut = pile[pile.length - 1];
      const l = haut.reste.shift();
      if (!l) {
        etat.set(haut.id, "finie");
        pile.pop();
        continue;
      }
      const vers = l.vers!;
      if (etat.get(vers) === "en-route") retours.add(l.id);
      else if (!etat.has(vers)) {
        etat.set(vers, "en-route");
        pile.push({ id: vers, reste: [...(suites.get(vers) ?? [])] });
      }
    }
  };
  for (const n of ordreDeLecture(noeuds, liens)) if (!etat.has(n.id)) suivre(n.id);
  return retours;
}

/**
 * Construire dans « Chemins » (F03.1, F03-AC57) : les gestes sont à l'adulte seul — l'enseignant,
 * ou l'auteur d'un projet personnel —, en récit à choix, sur un écran large. L'élève lit le même
 * schéma sans rien y modifier ; le téléphone garde la liste.
 */
export const peutConstruire = ({ adulte, aChoix, etroit }: { adulte: boolean; aChoix: boolean; etroit: boolean }): boolean => adulte && aChoix && !etroit;

/**
 * Modifier un choix depuis « Chemins » (F03-AC70, AC76) : l'onglet d'un choix s'ouvre là où l'adulte
 * construit, à une taille où ses mots se lisent. Ni l'élève, ni le téléphone, ni la vue de loin ; ni un
 * choix que l'IA propose, qui n'est pas encore dans le texte.
 */
export const peutOuvrirUnChoix = ({ construit, loin, propose = false }: { construit: boolean; loin: boolean; propose?: boolean }): boolean =>
  construit && !loin && !propose;

/** Ce que la carte d'une scène porte quand elle est « à regarder ». */
export type Marque = "rien-n-y-mene" | "sans-suite";
export type SorteARegarder = "sans-destination" | "supprimee" | Marque;
export type ARegarder = {
  /** Par scène : les marques de sa carte */
  marques: Map<string, Marque[]>;
  /** La ligne en tête : chaque sorte présente, et ce qu'elle désigne — des choix ou des scènes */
  sortes: { sorte: SorteARegarder; ou: string[] }[];
};

/**
 * « À regarder » (F03.1, 11 octobre 2026) : ce qui touche les chemins, sans le dire fautif.
 * Un choix sans destination, un choix vers une scène supprimée, une scène où rien ne mène
 * hors le départ, une scène sans suite ni fin. Le contrôle complet, avec sa gravité, reste
 * celui du Livre (F09.2).
 *
 * « rienNyMene » à faux : c'est la vue d'un élève, à qui la base ne dit pas les chemins venus
 * des chapitres qu'il ne lit pas ; « rien n'y mène » y serait souvent faux, et ne lui est jamais
 * dit. Il connaît, depuis le 14 octobre 2026, les fins et les liens cachés de son chapitre :
 * « sans suite » lui est dit (F03-AC50 révisé).
 */
export function aRegarder({ noeuds, liens, entrees }: Chemins, { scenes = true, rienNyMene = scenes }: { scenes?: boolean; rienNyMene?: boolean } = {}): ARegarder {
  const atteintes = new Set([...liens.filter((l) => l.vers && l.vers !== l.de).map((l) => l.vers!), ...entrees.map((e) => e.vers)]);
  const quittees = new Set(liens.map((l) => l.de));
  const marques = new Map<string, Marque[]>();
  for (const n of scenes ? noeuds : []) {
    const m: Marque[] = [];
    if (rienNyMene && !n.depart && !atteintes.has(n.id)) m.push("rien-n-y-mene");
    if (!n.fin && !n.suiteCachee && !quittees.has(n.id)) m.push("sans-suite");
    if (m.length) marques.set(n.id, m);
  }
  const avec = (marque: Marque) => noeuds.filter((n) => marques.get(n.id)?.includes(marque)).map((n) => n.id);
  const sortes: ARegarder["sortes"] = [
    { sorte: "sans-destination" as const, ou: liens.filter((l) => l.manque === "sans").map((l) => l.id) },
    { sorte: "supprimee" as const, ou: liens.filter((l) => l.manque === "supprimee").map((l) => l.id) },
    { sorte: "rien-n-y-mene" as const, ou: avec("rien-n-y-mene") },
    { sorte: "sans-suite" as const, ou: avec("sans-suite") },
  ].filter((s) => s.ou.length);
  return { marques, sortes };
}

/** « 2 choix sans destination », « 1 scène où rien ne mène » : un élément de la ligne « À regarder ». */
export function compteARegarder(sorte: SorteARegarder, n: number): string {
  if (sorte === "sans-destination") return `${n} choix sans destination`;
  if (sorte === "supprimee") return `${n} choix vers une scène supprimée`;
  return `${n} scène${pluriel(n)} ${sorte === "rien-n-y-mene" ? "où rien ne mène" : "sans suite"}`;
}

export const MOT_DE_MARQUE: Record<Marque, string> = { "rien-n-y-mene": "Rien n’y mène", "sans-suite": "Sans suite" };
