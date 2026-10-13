/** Suivi d'un projet (F06.5) : ce que la liste montre selon ses filtres, le bilan par élève, la carte du projet. */

import { sEcrit, tamponDe, type Tampon } from "./etats";
import type { Chapitre, ElevePlan, Partie, Plan, Scene } from "./recit";

/** Dans l'ordre de la rangée des filtres : ce qui attend l'enseignant d'abord. */
export const TAMPONS_DU_SUIVI: readonly Tampon[] = ["valider", "reprendre", "cours", "vide", "valide", "prete"];
/** Un projet personnel n'a ni remise ni validation (F06-AC91). */
export const TAMPONS_PERSONNELS: readonly Tampon[] = ["vide", "cours", "prete"];

export type FiltresSuivi = {
  chapitre: string | null;
  /** Un élève de la classe, ou « moi » : les scènes au nom de l'enseignant (F06-AC93) */
  eleve: string | null;
  /** « Dont Alice s'occupe » : ses prises en charge ; « Tout son chapitre » : ce qu'elle peut ouvrir (F06-AC36) */
  mode: "occupe" | "chapitre";
  etat: Tampon | "tous";
};
export const SANS_FILTRE: FiltresSuivi = { chapitre: null, eleve: null, mode: "occupe", etat: "tous" };

export type LigneSuivi = { scene: Scene; chapitre: Chapitre; partie: Partie };

/** Toutes les scènes du plan, dans l'ordre du projet. */
export const lignesDuPlan = (plan: Plan): LigneSuivi[] =>
  plan.parties.flatMap((partie) => partie.chapitres.flatMap((chapitre) => chapitre.scenes.map((scene) => ({ scene, chapitre, partie }))));

export const tamponDeLaScene = (s: Scene): Tampon => tamponDe(s.etat, s.texteVide);

/** Les scènes que retiennent le chapitre et l'élève choisis : c'est sur elles que les tampons comptent. */
export function filtrerHorsEtat(lignes: LigneSuivi[], f: FiltresSuivi): LigneSuivi[] {
  return lignes.filter(({ scene, chapitre }) => {
    if (f.chapitre && chapitre.id !== f.chapitre) return false;
    if (f.eleve === "moi") return scene.priseParEnseignant;
    if (f.eleve) return f.mode === "occupe" ? scene.priseParEleve === f.eleve : chapitre.attributions.some((a) => a.eleveId === f.eleve);
    return true;
  });
}

export const filtrer = (lignes: LigneSuivi[], f: FiltresSuivi): LigneSuivi[] =>
  filtrerHorsEtat(lignes, f).filter(({ scene }) => f.etat === "tous" || tamponDeLaScene(scene) === f.etat);

/** Le nombre que porte chaque tampon de la rangée. */
export function compterEtats(lignes: LigneSuivi[]): Record<Tampon, number> {
  const comptes: Record<Tampon, number> = { vide: 0, cours: 0, reprendre: 0, valider: 0, valide: 0, prete: 0 };
  for (const { scene } of lignes) comptes[tamponDeLaScene(scene)] += 1;
  return comptes;
}

/** Les scènes listées, groupées par chapitre, dans l'ordre du plan. */
export function grouper(lignes: LigneSuivi[]): { chapitre: Chapitre; partie: Partie; scenes: Scene[] }[] {
  const groupes = new Map<string, { chapitre: Chapitre; partie: Partie; scenes: Scene[] }>();
  for (const l of lignes) {
    const groupe = groupes.get(l.chapitre.id) ?? { chapitre: l.chapitre, partie: l.partie, scenes: [] };
    groupe.scenes.push(l.scene);
    groupes.set(l.chapitre.id, groupe);
  }
  return [...groupes.values()];
}

export type BilanEleve = {
  eleve: ElevePlan;
  chapitres: Chapitre[];
  /** « Tout son chapitre » : les scènes qu'il peut ouvrir, celles de ses camarades comprises */
  accessibles: number;
  /** « S'en occupe » : les scènes à son nom */
  occupe: number;
  parEtat: Partial<Record<Tampon, number>>;
  /** Ce qui reste à régler pour lui : aucun chapitre, ou aucune scène où écrire (F06-AC32) */
  aRegler: "sans-chapitre" | "aucune-scene-modifiable" | null;
};

/** Le bilan par élève : sans chapitre d'abord, puis l'ordre de la classe. */
export function bilanDesEleves(plan: Plan, eleves: ElevePlan[]): BilanEleve[] {
  const lignes = lignesDuPlan(plan);
  const bilans = eleves.map((eleve): BilanEleve => {
    const chapitres = plan.parties.flatMap((p) => p.chapitres.filter((c) => c.attributions.some((a) => a.eleveId === eleve.id)));
    const ouvertes = lignes.filter((l) => chapitres.includes(l.chapitre));
    const siennes = lignes.filter((l) => l.scene.priseParEleve === eleve.id);
    const parEtat: Partial<Record<Tampon, number>> = {};
    for (const { scene } of siennes) parEtat[tamponDeLaScene(scene)] = (parEtat[tamponDeLaScene(scene)] ?? 0) + 1;
    return {
      eleve, chapitres, accessibles: ouvertes.length, occupe: siennes.length, parEtat,
      aRegler: chapitres.length === 0 ? "sans-chapitre" : ouvertes.some((l) => sEcrit(l.scene.etat) && !l.scene.priseParEnseignant) ? null : "aucune-scene-modifiable",
    };
  });
  return [...bilans.filter((b) => b.aRegler === "sans-chapitre"), ...bilans.filter((b) => b.aRegler !== "sans-chapitre")];
}

/**
 * La scène « À valider » qui suit, juste après une décision (F06-AC63) : la suivante dans
 * la liste, sinon la première qui reste ; rien quand il n'en reste plus.
 */
export function suivanteAValider(lignes: LigneSuivi[], sceneId: string): LigneSuivi | null {
  const place = lignes.findIndex((l) => l.scene.id === sceneId);
  const aValider = lignes.filter((l) => l.scene.etat === "valider" && l.scene.id !== sceneId);
  return aValider.find((l) => lignes.indexOf(l) > place) ?? aValider[0] ?? null;
}

/** Ce que la carte d'un projet dit de son avancement (F06-AC58). Les scènes hors du livre ne comptent pas dans le pourcentage. */
export function avancement(scenes: { etat: string; horsLivre: boolean }[]): { aValider: number; pourCent: number } {
  const duLivre = scenes.filter((s) => !s.horsLivre);
  const pretes = duLivre.filter((s) => s.etat === "prete").length;
  return { aValider: scenes.filter((s) => s.etat === "valider").length, pourCent: duLivre.length ? Math.round((100 * pretes) / duLivre.length) : 0 };
}

// ——— Les filtres dans l'adresse : ils tiennent pendant la visite, aller-retour vers une scène compris (F06-AC54) ———

const TAMPONS = new Set<string>(TAMPONS_DU_SUIVI);

export function filtresDepuis(demande: Record<string, string | string[] | undefined>): FiltresSuivi {
  const un = (v: string | string[] | undefined): string | null => (typeof v === "string" && v ? v : null);
  const etat = un(demande.etat);
  return {
    chapitre: un(demande.chapitre),
    eleve: un(demande.eleve),
    mode: demande.mode === "chapitre" ? "chapitre" : "occupe",
    etat: etat && TAMPONS.has(etat) ? (etat as Tampon) : "tous",
  };
}

export function adresseDesFiltres(f: FiltresSuivi, vue: "scenes" | "eleves" = "scenes"): string {
  const p = new URLSearchParams();
  if (vue === "eleves") p.set("vue", "eleves");
  if (f.chapitre) p.set("chapitre", f.chapitre);
  if (f.eleve) p.set("eleve", f.eleve);
  if (f.eleve && f.eleve !== "moi" && f.mode === "chapitre") p.set("mode", "chapitre");
  if (f.etat !== "tous") p.set("etat", f.etat);
  return p.toString();
}
