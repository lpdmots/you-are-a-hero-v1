/** Projets : les deux modes fixes (F01) et les onglets de l'histoire (F06.5). */

export type Organisation = "classe" | "personnel";
export type Recit = "choix" | "classique";

export const ONGLETS = ["preparation", "plan", "suivi", "livre"] as const;
export type Onglet = (typeof ONGLETS)[number];

export const NOM_ONGLET: Record<Onglet, string> = {
  preparation: "Préparation",
  plan: "Parties et chapitres",
  suivi: "Suivi",
  livre: "Livre",
};

/** Le projet en cours, tel que la colonne de navigation de l'adulte le montre (F06.5, 8 novembre 2026). */
export type ProjetDeLaColonne = {
  id: string;
  titre: string;
  /** Le dernier onglet utilisé : le titre du projet y ramène */
  onglet: string;
  deClasse: boolean;
  classe: { id: string; nom: string } | null;
  repere: { imageId: string | null; visuelChoisi: string | null; visuelDefaut: string | null };
  /** Les scènes à valider, inscrites sur « Suivi » ; rien à zéro (F06-AC100) */
  aValider: number;
};

/** Le repli de la colonne, gardé sur cet ordinateur : il dépend de l'écran plus que du compte (F06-AC101). */
export const TEMOIN_COLONNE = "colonne";
export type Repli = "repliee" | "ouverte" | null;

export const estOnglet = (v: string): v is Onglet => (ONGLETS as readonly string[]).includes(v);

/**
 * Les onglets d'un projet. Un projet personnel a aussi son Suivi : le même écran, sans ce
 * qui concerne les élèves (F06.5, 13 octobre 2026).
 */
export const ongletsDe = (): Onglet[] => [...ONGLETS];

export const libelleOrganisation = (o: Organisation): string =>
  o === "classe" ? "Projet de classe" : "Projet personnel";

export const libelleRecit = (r: Recit): string => (r === "choix" ? "Récit à choix" : "Récit classique");
