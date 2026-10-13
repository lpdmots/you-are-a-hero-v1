/** État d'une scène (F07.1, F11.1) : ce qu'il se nomme, ce qu'il change, où il peut se choisir. */

export type Etat = "cours" | "reprendre" | "valider" | "valide" | "prete";

/** Dans l'ordre du travail : c'est celui de la liste où l'état se choisit. */
export const ETATS: readonly Etat[] = ["cours", "reprendre", "valider", "valide", "prete"];

export const estEtat = (v: unknown): v is Etat => typeof v === "string" && (ETATS as readonly string[]).includes(v);

/** Un seul nom par état, partout où il se lit (F11.1, 4 octobre 2026). */
export const NOM_ETAT: Record<Etat, string> = {
  cours: "En cours",
  reprendre: "À reprendre",
  valider: "À valider",
  valide: "Validé",
  prete: "Prête",
};

/** Ce que porte le tampon : l'état, ou « Texte vide » pour une scène « En cours » sans texte (F06.5). */
export type Tampon = Etat | "vide";
export const tamponDe = (etat: Etat, vide: boolean): Tampon => (etat === "cours" && vide ? "vide" : etat);
export const NOM_TAMPON: Record<Tampon, string> = { ...NOM_ETAT, vide: "Texte vide" };

/** Le signe du tampon : celui de sa notion (design, « Passe de cohérence »). */
export const SIGNE_TAMPON = {
  vide: "vide", cours: "crayon", reprendre: "demi-tour", valider: "sablier", valide: "coche", prete: "livre",
} as const satisfies Record<Tampon, string>;

/** Les élèves du chapitre peuvent-ils écrire dans la scène ? (F07.1) */
export const sEcrit = (etat: Etat): boolean => etat === "cours" || etat === "reprendre";

/**
 * Qui écrit la scène décide des états qu'elle peut prendre (F11.1) : cinq quand un élève
 * s'en occupe, trois sans élève — personne, ou l'enseignant lui-même —, deux dans un
 * projet personnel, où l'auteur n'a personne à valider.
 */
export type SorteDeScene = "eleve" | "sans-eleve" | "personnel";

export const sorteDeScene = (scene: { priseParEleve: string | null }, deClasse: boolean): SorteDeScene =>
  !deClasse ? "personnel" : scene.priseParEleve ? "eleve" : "sans-eleve";

export const etatsPermis = (sorte: SorteDeScene): Etat[] =>
  sorte === "personnel" ? ["cours", "prete"] : sorte === "sans-eleve" ? ["cours", "valide", "prete"] : [...ETATS];

/**
 * Les états que la liste montre : ceux que la scène peut prendre, et celui qu'elle porte.
 * Une scène remise que l'enseignant s'attribue reste « À valider » (F06-AC94) : elle le
 * montre coché, sans que « À reprendre » lui soit proposé.
 */
export const etatsProposes = (sorte: SorteDeScene, courant: Etat): Etat[] => {
  const permis = etatsPermis(sorte);
  return ETATS.filter((e) => permis.includes(e) || e === courant);
};

/** Ce que l'état change, dit là où il se choisit. */
export function ligneEtat(etat: Etat, sorte: SorteDeScene, vide: boolean): string {
  const seul = sorte !== "eleve";
  switch (etat) {
    case "cours":
      if (vide) return seul ? "Le texte est encore vide." : "Les élèves peuvent écrire. Le texte est encore vide.";
      return seul ? "Le texte n’est pas fini." : "Les élèves peuvent écrire.";
    case "reprendre":
      return "Les élèves reprennent, avec votre remarque.";
    case "valider":
      return "À vous de relire. Les élèves ne peuvent plus écrire.";
    case "valide":
      return seul ? "Le texte est fini. Reste à finir la scène." : "L’élève a fini. À vous de finir la scène.";
    case "prete":
      return "Elle entre dans le livre telle quelle.";
  }
}

/** Le message qui suit un changement d'état : il dit le nouvel état et où en changer. */
export function messageEtat(etat: Etat, nom: string, sorte: SorteDeScene): string {
  const eleves = sorte === "eleve";
  switch (etat) {
    case "cours":
      return `${nom} est de nouveau en cours.${eleves ? " Les élèves peuvent y écrire." : ""}`;
    case "valider":
      return `${nom} est à valider.${eleves ? " Les élèves ne peuvent plus y écrire." : ""}`;
    case "reprendre":
      return `Reprise demandée pour ${nom}.`;
    case "valide":
      return `${nom} est validée. Pour changer d’état : le tampon, en haut.`;
    case "prete":
      return `${nom} est prête pour le livre. Pour changer d’état : le tampon, en haut.`;
  }
}

/**
 * Les défauts d'écriture rappelés au moment de déclarer une scène prête, sans l'empêcher
 * (F09.2, F11.1) : texte vide ; dans un récit à choix, ni choix ni fin, ou un choix sans
 * destination. Une liaison cachée compte pour une suite.
 */
export function defautsDEcriture(scene: {
  vide: boolean; aChoix: boolean; fin: boolean;
  /** Les liens qui partent de la scène, avec leur destination */
  liens: { cibleId: string | null; cache: boolean }[];
}): string[] {
  const defauts: string[] = [];
  if (scene.vide) defauts.push("Le texte est vide.");
  if (scene.aChoix) {
    const choix = scene.liens.filter((l) => !l.cache);
    if (scene.liens.length === 0 && !scene.fin) defauts.push("Cette scène n’a ni choix ni fin.");
    else if (choix.some((l) => !l.cibleId)) defauts.push("Un choix n’a pas de destination.");
  }
  return defauts;
}
