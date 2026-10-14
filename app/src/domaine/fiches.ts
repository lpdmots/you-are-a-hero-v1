/**
 * Fiches de rédaction (F07.4) : quelles scènes se choisissent, comment les feuilles se font,
 * et comment les scènes que personne n'a prises se partagent entre les élèves d'un chapitre.
 * Tout ici est une proposition : rien ne passe au nom d'un élève avant l'impression.
 */

import { sEcrit } from "./etats";
import type { Chapitre, ElevePlan, Plan, Scene } from "./recit";

/** Pourquoi une scène ne peut pas être choisie ; rien si elle le peut. */
export type HorsFiche = "sans-consigne" | "enseignant" | "ne-s-ecrit-plus";

/**
 * Une fiche porte une consigne à des élèves : pas de fiche sans consigne (F07-AC54), ni pour
 * la scène que l'enseignant s'est attribuée (F07-AC70), ni pour une scène remise ou validée,
 * où il ne reste rien à écrire.
 */
export const horsFiche = (s: Scene): HorsFiche | null =>
  !s.consigne.trim() ? "sans-consigne" : s.priseParEnseignant ? "enseignant" : !sEcrit(s.etat) ? "ne-s-ecrit-plus" : null;

export type SceneDeFiche = { scene: Scene; chapitre: Chapitre; partie: string };

/** Les scènes du plan, dans son ordre, avec leur chapitre. */
export const scenesDuPlan = (plan: Plan): SceneDeFiche[] =>
  plan.parties.flatMap((p) => p.chapitres.flatMap((chapitre) => chapitre.scenes.map((scene) => ({ scene, chapitre, partie: p.titre }))));

/** Reste-t-il à l'élève de quoi écrire dans cette scène ? En cours, à reprendre ou sans texte. */
const aEcrire = (s: Scene): boolean => sEcrit(s.etat);

type Compte = { eleve: ElevePlan; total: number; reste: number; finies: number };

/**
 * Ce que chaque élève a déjà à son nom, dans tout le projet (F07-AC72) : le nombre de ses
 * scènes, celles qu'il lui reste à écrire, celles qui sont validées ou prêtes.
 */
export function comptesDesEleves(plan: Plan, eleves: ElevePlan[]): Map<string, Compte> {
  const comptes = new Map(eleves.map((eleve) => [eleve.id, { eleve, total: 0, reste: 0, finies: 0 }]));
  for (const { scene } of scenesDuPlan(plan)) {
    const c = scene.priseParEleve ? comptes.get(scene.priseParEleve) : undefined;
    if (!c) continue;
    c.total += 1;
    if (aEcrire(scene)) c.reste += 1;
    if (scene.etat === "valide" || scene.etat === "prete") c.finies += 1;
  }
  return comptes;
}

/**
 * Qui servir d'abord (F07.4, 13 octobre 2026) : l'élève qui a le moins de scènes à son nom ;
 * à égalité, celui à qui il en reste le moins à écrire ; puis celui qui en a le plus de
 * validées ; enfin l'ordre des prénoms, pour que la proposition ne change pas d'un
 * affichage à l'autre.
 */
const avant = (a: Compte, b: Compte): number =>
  a.total - b.total || a.reste - b.reste || b.finies - a.finies || a.eleve.prenom.localeCompare(b.eleve.prenom, "fr") || a.eleve.id.localeCompare(b.eleve.id);

export type Partage = {
  /** Scène proposée → élève. Rien n'est donné avant l'impression (F07-AC59) */
  propositions: Map<string, string>;
  /** Les scènes choisies qui restent sans élève, sur aucune feuille : chapitre non attribué, ou plafond atteint */
  sansEleve: string[];
};

/**
 * « Les répartir entre les élèves du chapitre » : les scènes choisies que personne n'a
 * prises, chapitre après chapitre dans l'ordre du plan. On calcule d'abord combien chaque
 * élève reçoit, puis les scènes sont données dans l'ordre du chapitre, part après part, en
 * commençant par l'élève servi le premier : chacun garde des scènes voisines.
 * `plafond` : au plus n scènes à écrire par élève, scènes déjà à son nom comprises (F07-AC74).
 */
export function repartir(plan: Plan, eleves: ElevePlan[], choisies: ReadonlySet<string>, plafond: number | null = null): Partage {
  const comptes = comptesDesEleves(plan, eleves);
  const propositions = new Map<string, string>();
  const sansEleve: string[] = [];
  for (const chapitre of plan.parties.flatMap((p) => p.chapitres)) {
    const libres = chapitre.scenes.filter((s) => choisies.has(s.id) && !s.priseParEleve && horsFiche(s) === null);
    if (libres.length === 0) continue;
    const duChapitre = chapitre.attributions.flatMap((a) => comptes.get(a.eleveId) ?? []);
    // Combien pour chacun, et dans quel ordre ils sont servis la première fois
    const parts = new Map<string, number>();
    for (let i = 0; i < libres.length; i += 1) {
      const servi = duChapitre.filter((c) => plafond === null || c.reste < plafond).sort(avant)[0];
      if (!servi) break;
      servi.total += 1;
      servi.reste += 1;
      parts.set(servi.eleve.id, (parts.get(servi.eleve.id) ?? 0) + 1);
    }
    let rang = 0;
    for (const [eleveId, nombre] of parts) {
      for (const scene of libres.slice(rang, rang + nombre)) propositions.set(scene.id, eleveId);
      rang += nombre;
    }
    sansEleve.push(...libres.slice(rang).map((s) => s.id));
  }
  return { propositions, sansEleve };
}

/** Les élèves à qui il reste moins de scènes à écrire que le nombre fixé, et qu'on peut compléter (F07-AC75). */
export function elevesACompleter(plan: Plan, eleves: ElevePlan[], choisies: ReadonlySet<string>, plafond: number | null): { eleve: ElevePlan; reste: number }[] {
  if (plafond === null) return [];
  const comptes = comptesDesEleves(plan, eleves);
  // Ceux dont un chapitre a des scènes libres cochées : les autres, rien ne peut leur être proposé
  const servables = new Set(
    plan.parties.flatMap((p) => p.chapitres).flatMap((c) => (c.scenes.some((s) => choisies.has(s.id) && !s.priseParEleve && horsFiche(s) === null) ? c.attributions.map((a) => a.eleveId) : [])),
  );
  return eleves.flatMap((eleve) => {
    const c = comptes.get(eleve.id)!;
    return servables.has(eleve.id) && c.reste < plafond ? [{ eleve, reste: c.reste }] : [];
  });
}

/**
 * Compléter des élèves, l'un après l'autre : à chacun, les premières scènes libres cochées
 * de ses chapitres, dans l'ordre du plan, jusqu'au nombre fixé. Le premier complété reçoit
 * les premières scènes libres.
 */
export function completer(plan: Plan, eleves: ElevePlan[], choisies: ReadonlySet<string>, plafond: number, aCompleter: readonly string[]): Partage {
  const comptes = comptesDesEleves(plan, eleves);
  const propositions = new Map<string, string>();
  for (const eleveId of aCompleter) {
    const c = comptes.get(eleveId);
    if (!c) continue;
    for (const chapitre of plan.parties.flatMap((p) => p.chapitres)) {
      if (!chapitre.attributions.some((a) => a.eleveId === eleveId)) continue;
      for (const scene of chapitre.scenes) {
        if (c.reste >= plafond) break;
        if (!choisies.has(scene.id) || scene.priseParEleve || horsFiche(scene) !== null || propositions.has(scene.id)) continue;
        propositions.set(scene.id, eleveId);
        c.reste += 1;
        c.total += 1;
      }
    }
  }
  const sansEleve = scenesDuPlan(plan)
    .filter(({ scene }) => choisies.has(scene.id) && !scene.priseParEleve && horsFiche(scene) === null && !propositions.has(scene.id))
    .map(({ scene }) => scene.id);
  return { propositions, sansEleve };
}

export type Feuille = {
  /** Sa clé : le chapitre, ou l'élève */
  cle: string;
  /** « La lisière », pour une feuille de chapitre ; les chapitres de l'élève sinon */
  chapitres: { chapitre: Chapitre; scenes: Scene[] }[];
  /** L'élève à qui la feuille est destinée : son prénom y est imprimé. Personne pour une feuille de chapitre */
  eleve: ElevePlan | null;
};

/**
 * Les feuilles à tirer (F07.4). « Par chapitre » : une feuille par chapitre, avec ses scènes
 * choisies. « Par élève » : une feuille par élève, à son prénom, avec les scènes choisies
 * dont il s'occupe et celles qui lui sont proposées, rangées par chapitre ; une scène sans
 * élève n'est sur aucune feuille (F07-AC53). Un élève choisi dans la liste : sa seule
 * feuille (F07-AC56).
 */
export function feuilles(
  plan: Plan, eleves: ElevePlan[], choisies: ReadonlySet<string>,
  reglage: { par: "chapitre" | "eleve"; eleve: string | null; propositions?: ReadonlyMap<string, string> },
): Feuille[] {
  const chapitres = plan.parties.flatMap((p) => p.chapitres);
  const bonnes = (c: Chapitre): Scene[] => c.scenes.filter((s) => choisies.has(s.id) && horsFiche(s) === null);
  const deLEleve = (id: string): Feuille | null => {
    const eleve = eleves.find((e) => e.id === id);
    if (!eleve) return null;
    const parChapitre = chapitres
      .map((chapitre) => ({ chapitre, scenes: bonnes(chapitre).filter((s) => (s.priseParEleve ?? reglage.propositions?.get(s.id)) === id) }))
      .filter((x) => x.scenes.length > 0);
    return parChapitre.length ? { cle: id, chapitres: parChapitre, eleve } : null;
  };
  if (reglage.eleve) return [deLEleve(reglage.eleve)].flatMap((f) => f ?? []);
  if (reglage.par === "eleve") return eleves.flatMap((e) => deLEleve(e.id) ?? []);
  return chapitres.flatMap((chapitre) => {
    const scenes = bonnes(chapitre);
    return scenes.length ? [{ cle: chapitre.id, chapitres: [{ chapitre, scenes }], eleve: null }] : [];
  });
}

/** Les scènes choisies qui ne sont sur aucune feuille : en « par élève », celles que personne n'a prises et qui ne sont proposées à personne. */
export function surAucuneFeuille(plan: Plan, choisies: ReadonlySet<string>, reglage: { par: "chapitre" | "eleve"; eleve: string | null; propositions?: ReadonlyMap<string, string> }): Scene[] {
  if (reglage.par !== "eleve" || reglage.eleve) return [];
  return scenesDuPlan(plan)
    .map((x) => x.scene)
    .filter((s) => choisies.has(s.id) && horsFiche(s) === null && !s.priseParEleve && !reglage.propositions?.has(s.id));
}

/** « 4 scènes sur 3 feuilles · Alice », « 4 scènes en 3 parties à découper », « Aucune feuille ». */
export function decompte(lesFeuilles: Feuille[], aLaSuite: boolean, eleve: ElevePlan | null): string {
  const scenes = lesFeuilles.reduce((n, f) => n + f.chapitres.reduce((m, c) => m + c.scenes.length, 0), 0);
  if (scenes === 0) return "Aucune feuille";
  const n = lesFeuilles.length;
  const combien = `${scenes} scène${scenes > 1 ? "s" : ""}`;
  const ou = aLaSuite && n > 1 ? `en ${n} parties à découper` : `sur ${n} feuille${n > 1 ? "s" : ""}`;
  return `${combien} ${ou}${eleve ? ` · ${eleve.prenom}` : ""}`;
}

/**
 * Les réglages des fiches, gardés avec le compte de l'enseignant et repris d'une fois sur
 * l'autre, dans tous ses projets (F07.4, 14 octobre 2026). L'élève choisi et le partage n'en
 * sont pas : ils tiennent au moment.
 */
export type ReglagesFiches = {
  par: "chapitre" | "eleve";
  /** « À la suite, à découper » */
  suite: boolean;
  /** Au plus n scènes à écrire par élève ; rien : aucun nombre */
  plafond: number | null;
};

/** Sans rien régler : une feuille par élève, une par page, au plus 4 scènes à écrire par élève. */
export const REGLAGES_HABITUELS: ReglagesFiches = { par: "eleve", suite: false, plafond: 4 };

/** Ce que la base garde, relu sans confiance : un réglage absent ou abîmé reprend sa valeur habituelle. */
export function lireReglages(v: unknown): ReglagesFiches {
  const o = v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
  const plafond = o.plafond === null ? null : typeof o.plafond === "number" && Number.isInteger(o.plafond) && o.plafond >= 1 && o.plafond <= 99 ? o.plafond : REGLAGES_HABITUELS.plafond;
  return {
    par: o.par === "chapitre" || o.par === "eleve" ? o.par : REGLAGES_HABITUELS.par,
    suite: typeof o.suite === "boolean" ? o.suite : REGLAGES_HABITUELS.suite,
    plafond,
  };
}
