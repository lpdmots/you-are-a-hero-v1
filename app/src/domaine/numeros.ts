/**
 * Ordre imprimé et numéros des passages d'un récit à choix (F11.5). Le numéro n'est écrit
 * nulle part dans les textes : il se calcule ici, d'après le plan, l'ordre gardé par le
 * projet et les numéros fixés. Le récit classique n'a ni numéros ni mélange.
 */

import type { Plan } from "./recit";

export type SceneNumerotee = {
  id: string;
  horsLivre: boolean;
  /** Rang gardé dans son groupe de mélange ; rien tant que l'ordre du livre n'est pas établi */
  rangLivre: number | null;
  /** Numéro que la scène doit garder : fixé par l'adulte, ou par une liaison cachée (F05.1) */
  numeroFixe: number | null;
};
export type ChapitreNumerote = { horsLivre: boolean; scenes: SceneNumerotee[] };
export type PartieNumerotee = {
  id: string;
  /** Ses scènes sont mélangées avec celles de la partie précédente (F11-AC17) */
  groupeAvecPrecedente: boolean;
  /** Scène d'ouverture choisie par l'adulte ; sinon la première scène incluse de la partie */
  ouvertureSceneId: string | null;
  chapitres: ChapitreNumerote[];
};
export type PlanNumerote = { parties: PartieNumerotee[]; departSceneId: string | null };

export type ProblemeDeNumero =
  /** Deux scènes fixées au même numéro : la seconde garde un numéro libre en attendant */
  | { sorte: "double"; sceneId: string; numero: number; avec: string }
  /** Numéro fixé plus grand que le nombre de passages (F05-AC08) */
  | { sorte: "trop-grand"; sceneId: string; numero: number };

export type Numeros = {
  /** Numéro imprimé de chaque scène incluse */
  de: Map<string, number>;
  /** Nombre de passages du livre */
  total: number;
  /** Scènes dans l'ordre d'impression, hors celles dont le numéro fixé dépasse le livre */
  ordre: string[];
  problemes: ProblemeDeNumero[];
};

const incluses = (p: PartieNumerotee): SceneNumerotee[] => p.chapitres.filter((c) => !c.horsLivre).flatMap((c) => c.scenes.filter((s) => !s.horsLivre));

/** La scène d'ouverture d'une partie : celle que l'adulte a désignée, sinon la première incluse du plan (F11.5). */
export function ouvertureDe(p: PartieNumerotee): string | null {
  const scenes = incluses(p);
  return scenes.find((s) => s.id === p.ouvertureSceneId)?.id ?? scenes[0]?.id ?? null;
}

/** Les groupes de mélange : chaque partie forme le sien, sauf celles que l'adulte a réunies. */
export function groupesDeMelange(plan: PlanNumerote): PartieNumerotee[][] {
  const groupes: PartieNumerotee[][] = [];
  for (const partie of plan.parties) {
    if (partie.groupeAvecPrecedente && groupes.length) groupes[groupes.length - 1].push(partie);
    else groupes.push([partie]);
  }
  return groupes;
}

/**
 * Les numéros du livre. Les passages sont numérotés de 1 à N sur les seules scènes incluses,
 * sans trou (F11-AC20) ; les groupes se suivent dans l'ordre du plan (F11-AC16) ; la scène
 * d'ouverture de la première partie d'un groupe est en tête du groupe (F11-AC22, AC23) ; le
 * départ porte toujours le n° 1 (F11-AC18) ; un numéro fixé prime sur tout le reste.
 */
export function numeroter(plan: PlanNumerote): Numeros {
  // 1. La suite des scènes, groupe après groupe
  const suite: SceneNumerotee[] = [];
  for (const groupe of groupesDeMelange(plan)) {
    const scenes = groupe.flatMap(incluses);
    const rangDansLePlan = new Map(scenes.map((s, i) => [s.id, i]));
    const tete = ouvertureDe(groupe[0]);
    scenes.sort((a, b) => {
      if (a.id === tete || b.id === tete) return a.id === tete ? -1 : 1;
      // Une scène sans rang gardé — ordre pas encore établi — suit celles qui en ont un, dans l'ordre du plan
      const [ra, rb] = [a.rangLivre ?? Number.MAX_SAFE_INTEGER, b.rangLivre ?? Number.MAX_SAFE_INTEGER];
      return ra - rb || rangDansLePlan.get(a.id)! - rangDansLePlan.get(b.id)!;
    });
    suite.push(...scenes);
  }
  const total = suite.length;
  const depart = suite.find((s) => s.id === plan.departSceneId) ?? null;

  // 2. Les numéros tenus : le départ au n° 1, puis les numéros fixés
  const de = new Map<string, number>();
  const tenus = new Map<number, string>();
  const problemes: ProblemeDeNumero[] = [];
  if (depart) {
    de.set(depart.id, 1);
    tenus.set(1, depart.id);
  }
  for (const s of suite) {
    if (s.numeroFixe === null || s === depart) continue;
    const pris = tenus.get(s.numeroFixe);
    if (pris) {
      problemes.push({ sorte: "double", sceneId: s.id, numero: s.numeroFixe, avec: pris });
      continue;
    }
    de.set(s.id, s.numeroFixe);
    tenus.set(s.numeroFixe, s.id);
    if (s.numeroFixe > total) problemes.push({ sorte: "trop-grand", sceneId: s.id, numero: s.numeroFixe });
  }

  // 3. Les autres prennent les numéros restants, dans l'ordre de la suite
  let n = 1;
  for (const s of suite) {
    if (de.has(s.id)) continue;
    while (tenus.has(n)) n += 1;
    de.set(s.id, n);
    tenus.set(n, s.id);
  }
  const ordre = [...de.entries()].filter(([, numero]) => numero <= total).sort((a, b) => a[1] - b[1]).map(([id]) => id);
  return { de, total, ordre, problemes };
}

/** Générateur pseudo-aléatoire à graine : un même tirage se rejoue à l'identique dans un test. */
export function hasard(graine: number): () => number {
  let a = graine >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Ordre initial proposé (F11.5) : les scènes de chaque groupe sont mélangées, en évitant
 * au mieux de placer côte à côte les destinations d'un même choix, qu'un enfant lirait par
 * accident. Rend, pour chaque scène, son rang dans son groupe. Fait une fois, puis gardé.
 */
export function melangeInitial(plan: PlanNumerote, fratries: string[][], tirage: () => number = Math.random): Map<string, number> {
  const rangs = new Map<string, number>();
  const freres = new Map<string, Set<string>>();
  for (const fratrie of fratries) {
    for (const a of fratrie) for (const b of fratrie) if (a !== b) freres.set(a, new Set([...(freres.get(a) ?? []), b]));
  }
  const voisinsFreres = (ordre: string[]): number => ordre.reduce((n, id, i) => n + (i > 0 && freres.get(id)?.has(ordre[i - 1]) ? 1 : 0), 0);
  for (const groupe of groupesDeMelange(plan)) {
    const ids = groupe.flatMap((p) => p.chapitres.flatMap((c) => c.scenes.map((s) => s.id)));
    let meilleur = ids;
    let cout = Number.POSITIVE_INFINITY;
    for (let essai = 0; essai < 40 && cout > 0; essai += 1) {
      const melange = [...ids];
      for (let i = melange.length - 1; i > 0; i -= 1) {
        const j = Math.floor(tirage() * (i + 1));
        [melange[i], melange[j]] = [melange[j], melange[i]];
      }
      const c = voisinsFreres(melange);
      if (c < cout) [meilleur, cout] = [melange, c];
    }
    meilleur.forEach((id, i) => rangs.set(id, i));
  }
  return rangs;
}

/** Ce que la numérotation lit du plan du récit. */
export const planNumerote = (plan: Plan): PlanNumerote => ({
  departSceneId: plan.departSceneId,
  parties: plan.parties.map((p) => ({
    id: p.id, groupeAvecPrecedente: p.groupeAvecPrecedente, ouvertureSceneId: p.ouvertureSceneId,
    chapitres: p.chapitres.map((c) => ({
      horsLivre: c.horsLivre,
      scenes: c.scenes.map((s) => ({ id: s.id, horsLivre: s.horsLivre, rangLivre: s.rangLivre, numeroFixe: s.numeroFixe })),
    })),
  })),
});

/** Les numéros du livre d'après le plan : scène → numéro imprimé. */
export const numerosDuPlan = (plan: Plan): Numeros => numeroter(planNumerote(plan));
