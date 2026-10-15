/**
 * Les commandes d'un passage dans l'aperçu (F11.3, 3 octobre 2026) : « Monter d'un rang »,
 * « Descendre d'un rang », « Placer après le n° … ». Le passage reste dans son groupe de
 * mélange ; le départ, un numéro fixé et l'ouverture en tête de groupe ne bougent pas, et les
 * autres se décalent autour d'eux. Les renvois suivent : seuls les rangs gardés changent, jamais
 * une destination (F11-AC09, AC42, AC43).
 */

import { groupesDeMelange, numeroter, ouvertureDe, type PlanNumerote, type SceneNumerotee } from "./numeros";

export type Deplacement = { sorte: "monter" } | { sorte: "descendre" } | { sorte: "apres"; numero: number };

/** Pourquoi un passage garde son rang, s'il le garde */
export type Immobile = "depart" | "fixe" | "ouverture";

export const POURQUOI_IMMOBILE: Record<Immobile, string> = {
  depart: "Le départ porte toujours le n° 1.",
  fixe: "Son numéro est fixé : il garde sa place.",
  ouverture: "Il ouvre sa partie : il reste en tête.",
};

type Groupe = {
  /** L'ouverture en tête du groupe */
  tete: string | null;
  /** Les passages qui se déplacent, dans l'ordre de leurs numéros */
  mobiles: string[];
  /** Le départ et les numéros fixés : leur rang ne compte pas */
  tenus: string[];
  /** Le plus petit rang gardé du groupe : la suite récrite part de lui */
  base: number;
  numeros: { min: number; max: number };
};

const incluses = (g: PlanNumerote["parties"]): SceneNumerotee[] => g.flatMap((p) => p.chapitres.filter((c) => !c.horsLivre).flatMap((c) => c.scenes.filter((s) => !s.horsLivre)));

function groupeDe(plan: PlanNumerote, sceneId: string): Groupe | null {
  const { de } = numeroter(plan);
  for (const groupe of groupesDeMelange(plan)) {
    const scenes = incluses(groupe);
    if (!scenes.some((s) => s.id === sceneId)) continue;
    const tete = ouvertureDe(groupe[0]);
    const tenu = (s: SceneNumerotee) => s.id === plan.departSceneId || s.numeroFixe !== null;
    const parNumero = (a: SceneNumerotee, b: SceneNumerotee) => (de.get(a.id) ?? 0) - (de.get(b.id) ?? 0);
    // Les numéros du groupe, sans ceux qui sont fixés : ils peuvent être n'importe où dans le livre
    const numeros = scenes.filter((s) => s.numeroFixe === null).map((s) => de.get(s.id) ?? 0).filter((n) => n > 0);
    return {
      tete: tete && !tenu(scenes.find((s) => s.id === tete)!) ? tete : null,
      mobiles: scenes.filter((s) => s.id !== tete && !tenu(s)).sort(parNumero).map((s) => s.id),
      tenus: scenes.filter((s) => tenu(s) && s.id !== tete).map((s) => s.id).concat(tete && tenu(scenes.find((s) => s.id === tete)!) ? [tete] : []),
      base: Math.min(...scenes.map((s) => s.rangLivre ?? 0)),
      numeros: { min: Math.min(...numeros), max: Math.max(...numeros) },
    };
  }
  return null;
}

/** Pourquoi le passage ne se déplace pas ; rien s'il se déplace. */
export function immobileDe(plan: PlanNumerote, sceneId: string): Immobile | null {
  if (plan.departSceneId === sceneId) return "depart";
  const s = plan.parties.flatMap((p) => p.chapitres.flatMap((c) => c.scenes)).find((x) => x.id === sceneId);
  if (s?.numeroFixe !== null && s?.numeroFixe !== undefined) return "fixe";
  const g = groupeDe(plan, sceneId);
  return g && g.tete === sceneId ? "ouverture" : null;
}

/** Les numéros entre lesquels le passage peut aller : ceux de son groupe de mélange. */
export function numerosDuGroupe(plan: PlanNumerote, sceneId: string): { min: number; max: number } | null {
  return groupeDe(plan, sceneId)?.numeros ?? null;
}

export type Resultat =
  | { ok: true; rangs: Record<string, number>; avant: number; apres: number }
  | { ok: false; refus: string };

/**
 * Le déplacement d'un passage : les nouveaux rangs gardés de son groupe, et son numéro avant et
 * après. Rien ne change hors de son groupe. Refusé, la raison se dit sur place.
 */
export function deplacer(plan: PlanNumerote, sceneId: string, d: Deplacement): Resultat {
  const immobile = immobileDe(plan, sceneId);
  if (immobile) return { ok: false, refus: POURQUOI_IMMOBILE[immobile] };
  const g = groupeDe(plan, sceneId);
  if (!g) return { ok: false, refus: "Ce passage n’est pas dans le livre." };
  const { de } = numeroter(plan);
  const avant = de.get(sceneId)!;
  const autres = g.mobiles.filter((id) => id !== sceneId);
  const ici = g.mobiles.indexOf(sceneId);
  let rang: number;
  if (d.sorte === "monter") {
    if (ici <= 0) return { ok: false, refus: "Il est déjà le premier qui se déplace dans sa partie." };
    rang = ici - 1;
  } else if (d.sorte === "descendre") {
    if (ici >= g.mobiles.length - 1) return { ok: false, refus: "Il est déjà le dernier de sa partie." };
    rang = ici + 1;
  } else {
    const n = d.numero;
    if (!Number.isInteger(n) || n < g.numeros.min || n > g.numeros.max) {
      return { ok: false, refus: `Choisissez un numéro de sa partie, du ${g.numeros.min} au ${g.numeros.max}.` };
    }
    if (n === avant) return { ok: false, refus: "C’est son propre numéro." };
    // Il se place après tous les passages mobiles numérotés jusqu'à n
    rang = autres.filter((id) => de.get(id)! <= n).length;
  }
  const suite = [...autres.slice(0, rang), sceneId, ...autres.slice(rang)];
  if (suite.every((id, i) => id === g.mobiles[i])) return { ok: false, refus: "Il est déjà à cette place." };
  const rangs: Record<string, number> = {};
  let r = g.base;
  if (g.tete) rangs[g.tete] = r++;
  for (const id of suite) rangs[id] = r++;
  for (const id of g.tenus) rangs[id] = r++;
  const nouveau = { ...plan, parties: plan.parties.map((p) => ({ ...p, chapitres: p.chapitres.map((c) => ({ ...c, scenes: c.scenes.map((s) => (s.id in rangs ? { ...s, rangLivre: rangs[s.id] } : s)) })) })) };
  return { ok: true, rangs, avant, apres: numeroter(nouveau).de.get(sceneId)! };
}

/** Les rangs gardés d'un groupe tels qu'ils sont : de quoi annuler un déplacement (F11-AC45). */
export function rangsActuels(plan: PlanNumerote, ids: string[]): Record<string, number> {
  const voulus = new Set(ids);
  const rangs: Record<string, number> = {};
  for (const s of plan.parties.flatMap((p) => p.chapitres.flatMap((c) => c.scenes))) if (voulus.has(s.id) && s.rangLivre !== null) rangs[s.id] = s.rangLivre;
  return rangs;
}
