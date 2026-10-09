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

export const estOnglet = (v: string): v is Onglet => (ONGLETS as readonly string[]).includes(v);

/** Le mode personnel n'a pas de suivi d'élèves. */
export const ongletsDe = (organisation: Organisation): Onglet[] =>
  ONGLETS.filter((o) => organisation === "classe" || o !== "suivi");

export const libelleOrganisation = (o: Organisation): string =>
  o === "classe" ? "Projet de classe" : "Projet personnel";

export const libelleRecit = (r: Recit): string => (r === "choix" ? "Récit à choix" : "Récit classique");

/** Illustration générique d'un projet sans image, toujours la même pour un projet. */
const DEFAUTS = ["montagne", "foret", "mer", "cite", "desert"] as const;
export function illustrationParDefaut(idProjet: string): string {
  let h = 7;
  for (const c of idProjet) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return `/illustrations/defaut-${DEFAUTS[h % DEFAUTS.length]}.jpg`;
}
