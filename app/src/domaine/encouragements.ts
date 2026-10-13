/**
 * Encouragements de l'enseignant (F07.5) : trois catégories, un tampon au plus par catégorie
 * et par élève sur une scène, des totaux par élève dans le projet, et un classement par
 * catégorie, sans total général. Rien ici ne lit la base.
 */

export const CATEGORIES = ["effort", "plume", "creativite"] as const;
export type Categorie = (typeof CATEGORIES)[number];
export const NOM_CATEGORIE: Record<Categorie, string> = { effort: "Effort", plume: "Fine plume", creativite: "Créativité" };
export const estCategorie = (v: unknown): v is Categorie => typeof v === "string" && (CATEGORIES as readonly string[]).includes(v);

export type Totaux = Record<Categorie, number>;
export const sansTotal = (): Totaux => ({ effort: 0, plume: 0, creativite: 0 });

/** Un tampon donné : la scène, l'élève qui s'en occupait ce jour-là et qui le garde (F07-AC78), la catégorie. */
export type Encouragement = { sceneId: string; eleveId: string; categorie: Categorie };

/**
 * Les totaux de chaque élève dans le projet. `inscrits` : les élèves de la classe ; un
 * élève retiré garde ses tampons sur ses scènes et sort des totaux affichés (F07.5).
 */
export function totauxParEleve(encouragements: readonly Encouragement[], inscrits: ReadonlySet<string>): Map<string, Totaux> {
  const totaux = new Map<string, Totaux>();
  for (const e of encouragements) {
    if (!inscrits.has(e.eleveId)) continue;
    const t = totaux.get(e.eleveId) ?? sansTotal();
    t[e.categorie] += 1;
    totaux.set(e.eleveId, t);
  }
  return totaux;
}

/** « Effort 2 · Fine plume 1 » : les catégories où l'élève a au moins un tampon ; rien s'il n'en a aucun (F07-AC81). */
export function phraseDesTotaux(t: Totaux | undefined): string | null {
  const parts = CATEGORIES.filter((c) => (t?.[c] ?? 0) > 0).map((c) => `${NOM_CATEGORIE[c]} ${t![c]}`);
  return parts.length ? parts.join(" · ") : null;
}

/** Les élèves d'un même total, ensemble : des ex æquo ne se départagent pas. */
export type Marche = { total: number; eleves: string[] };

/** Les trois meilleurs totaux d'une catégorie sont montrés d'abord ; la suite, à l'enseignant seul. */
export const MARCHES_MONTREES = 3;

/**
 * Le classement d'une catégorie : du plus grand total au plus petit, les ex æquo sur la même
 * marche, dans l'ordre des prénoms. Un élève sans tampon dans la catégorie n'y est pas
 * (F07-AC83). `prenom` sert au seul ordre d'affichage.
 */
export function classement(totaux: ReadonlyMap<string, Totaux>, categorie: Categorie, prenom: (eleveId: string) => string): Marche[] {
  const parTotal = new Map<number, string[]>();
  for (const [eleve, t] of totaux) {
    if (t[categorie] > 0) parTotal.set(t[categorie], [...(parTotal.get(t[categorie]) ?? []), eleve]);
  }
  return [...parTotal]
    .sort(([a], [b]) => b - a)
    .map(([total, eleves]) => ({ total, eleves: eleves.sort((a, b) => prenom(a).localeCompare(prenom(b), "fr") || a.localeCompare(b)) }));
}

/** Les trois premières marches, puis la suite. */
export const premieres = (marches: Marche[]): Marche[] => marches.slice(0, MARCHES_MONTREES);
export const suite = (marches: Marche[]): Marche[] => marches.slice(MARCHES_MONTREES);

/** Peut-on encourager quelqu'un sur cette scène ? Il faut un élève et un texte ; pas la scène de l'enseignant (F07-AC79). */
export type SansTampon = "sans-eleve" | "enseignant" | "texte-vide";
export const pourquoiSansTampon = (s: { priseParEleve: string | null; priseParEnseignant: boolean; texteVide: boolean }): SansTampon | null =>
  s.priseParEnseignant ? "enseignant" : !s.priseParEleve ? "sans-eleve" : s.texteVide ? "texte-vide" : null;
