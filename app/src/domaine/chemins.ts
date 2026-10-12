/**
 * Les chemins d'un chapitre (F03.1, « Vue Chemins ») : ses scènes, les choix qui les relient,
 * et ce qu'il y a « à regarder ». Rien ne s'y saisit : tout se déduit des textes.
 */

import { chapitresDe, departDe, nomScene, type Plan } from "./recit";
import { pluriel } from "./texte";

export type NoeudDeChemin = {
  id: string; reference: number; titre: string | null; vide: boolean; depart: boolean; fin: boolean;
  /** La page de la scène */
  lien: string;
};
export type LienDeChemin = {
  id: string; de: string; libelle: string;
  /** Liaison cachée par énigme : une suite du récit, sans phrase dans le texte (F05.1) */
  cache: boolean;
  /** La scène d'arrivée, si elle est dans ce chapitre */
  vers: string | null;
  /** Vers un autre chapitre : son titre, et la scène visée si la personne peut la nommer (F03-AC25) */
  ailleurs?: { chapitre: string; nom?: string; lien?: string };
  /** Sans destination encore, ou vers une scène supprimée */
  manque?: "sans" | "supprimee";
};
/** Un choix d'un autre chapitre qui mène à une scène de celui-ci */
export type EntreeDeChemin = { vers: string; chapitre: string; lien?: string };
export type Chemins = { noeuds: NoeudDeChemin[]; liens: LienDeChemin[]; entrees: EntreeDeChemin[] };

/** Les chemins d'un chapitre tels que l'adulte les lit, d'après le plan et ses liens. */
export function cheminsDuPlan(plan: Plan, chapitreId: string, projetId: string): Chemins {
  const chapitres = chapitresDe(plan);
  const chapitre = chapitres.find((c) => c.id === chapitreId);
  if (!chapitre) return { noeuds: [], liens: [], entrees: [] };
  const depart = departDe(plan);
  const ou = new Map(chapitres.flatMap((c) => c.scenes.map((s) => [s.id, { scene: s, chapitre: c }] as const)));
  const ici = new Set(chapitre.scenes.map((s) => s.id));
  const vueChemins = (c: string, scene?: string) => `/projet/${projetId}/chapitre/${c}?vue=chemins${scene ? `&scene=${scene}` : ""}`;
  return {
    noeuds: chapitre.scenes.map((s) => ({
      id: s.id, reference: s.reference, titre: s.titre, vide: s.texteVide, depart: depart?.id === s.id, fin: s.fin,
      lien: `/projet/${projetId}/scene/${s.id}?de=chemins`,
    })),
    liens: plan.liens
      .filter((l) => ici.has(l.sceneId))
      .map((l): LienDeChemin => {
        const base = { id: l.renvoiId, de: l.sceneId, libelle: l.libelle, cache: l.cache };
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
 * « scenes » à faux : seuls les choix sont regardés. C'est la vue d'un élève, à qui la base
 * ne dit ni les chemins venus d'autres chapitres, ni les liens cachés, ni le départ, ni les
 * fins : « rien n'y mène » et « sans suite » y seraient souvent faux.
 */
export function aRegarder({ noeuds, liens, entrees }: Chemins, { scenes = true }: { scenes?: boolean } = {}): ARegarder {
  const atteintes = new Set([...liens.filter((l) => l.vers && l.vers !== l.de).map((l) => l.vers!), ...entrees.map((e) => e.vers)]);
  const quittees = new Set(liens.map((l) => l.de));
  const marques = new Map<string, Marque[]>();
  for (const n of scenes ? noeuds : []) {
    const m: Marque[] = [];
    if (!n.depart && !atteintes.has(n.id)) m.push("rien-n-y-mene");
    if (!n.fin && !quittees.has(n.id)) m.push("sans-suite");
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
