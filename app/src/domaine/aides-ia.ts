/**
 * Les aides IA, sans fournisseur ni base (F13, cadre commun) : ce que l'adulte règle dans
 * « Mon compte », les degrés de correction, les plafonds et les phrases qui les disent.
 * Toutes les aides sont facultatives : un échec, une absence de réponse ou une limite
 * atteinte ne changent rien et laissent tout le travail possible sans elles.
 */

/** Les aides qui rendent du texte, chacune avec ses consignes au modèle (`serveur/ia/aides/`). */
export const AIDES_TEXTE = [
  "correction", // F13.1, degrés 1 à 5
  "pistes", // F13.1, « Proposer des pistes » dans la reprise
  "consigne", // F13.2
  "titre", // F05, ✦ du titre de scène
  "ecriture", // F13.6, « ✦ Écrire » une scène vide
  "idees-choix", // F13.3
  "questions", // F13.4, questions pour la classe
  "idees", // F13.4, idées d'une étape
  "retenons", // F13.4, « Rédiger d'après les idées »
  "parties", // F13.5
  "chapitres", // F13.5
  "resume", // F13.5, « Proposer un résumé »
  "personnages", // F10.2, « Repérer les personnages »
  "fiche-visuelle", // F10.2, « Préciser pour les images »
  "description-image", // F10.2, « Proposer la description »
] as const;
export type AideTexte = (typeof AIDES_TEXTE)[number];
export type Aide = AideTexte | "image";

/** Le nom de chaque aide, tel que l'adulte le lit. */
export const NOMS_DES_AIDES: Record<AideTexte, string> = {
  correction: "Correction",
  pistes: "Pistes de reprise",
  consigne: "Consigne",
  titre: "Titre de scène",
  ecriture: "Écriture d'une scène",
  "idees-choix": "Idées de choix",
  questions: "Questions pour la classe",
  idees: "Idées de la préparation",
  retenons: "« Nous retenons »",
  parties: "Idées de parties",
  chapitres: "Idées de chapitres",
  resume: "Résumé de chapitre",
  personnages: "Repérer les personnages",
  "fiche-visuelle": "Fiche visuelle",
  "description-image": "Description d'une image",
};

export const DEGRES = [1, 2, 3, 4, 5] as const;
export type Degre = (typeof DEGRES)[number];

/** Chaque degré est nommé à l'écran (F13.1, 16 octobre 2026). */
export const NOMS_DES_DEGRES: Record<Degre, string> = {
  1: "Orthographe",
  2: "Orthographe et grammaire",
  3: "Phrases plus claires",
  4: "Style",
  5: "D'après la consigne",
};

/** Ce que fait chaque degré, en une ligne, pour le choisir. */
export const ROLES_DES_DEGRES: Record<Degre, string> = {
  1: "Les mots mal écrits, les terminaisons, les accords, les espaces et les majuscules ; la phrase ne change pas.",
  2: "Le degré 1, plus la ponctuation qui manque et les tournures mal construites.",
  3: "Répétitions, phrases trop longues, mots imprécis ; rien ne change à ce qui se passe.",
  4: "Vocabulaire plus riche, phrases plus fluides ; mêmes événements.",
  5: "Le texte s'améliore pour bien répondre à la consigne, sans événement ni personnage nouveau.",
};

/** Aux degrés 1 à 3, les changements se marquent dans la copie ; aux degrés 4 et 5, côte à côte. */
export const marquesDansLaCopie = (degre: Degre): boolean => degre <= 3;

export const NIVEAUX = ["CE1", "CE2", "CM1", "CM2"] as const;
export type Niveau = (typeof NIVEAUX)[number];

export type ReglagesIa = {
  /** Le degré proposé à chaque demande ; une demande peut en choisir un autre sans le changer */
  degre: Degre;
  /** Éteint : aucun bouton d'IA nulle part (projection devant la classe, travail sans IA) */
  proposer: boolean;
  /** Plusieurs pour un cours double ; aucun : « élèves d'école élémentaire » */
  niveaux: Niveau[];
  imagesParCreation: 1 | 2;
  qualite: QualiteDesImages;
};

/**
 * « Qualité des images » (F10.2) : automatique, normale ou haute. Automatique, ajouté le
 * 18 octobre 2026 à la demande du porteur : la haute qualité là seulement où elle se voit,
 * une image en pleine page imprimée ; la normale partout ailleurs.
 */
export const QUALITES = ["auto", "normale", "haute"] as const;
export type QualiteDesImages = (typeof QUALITES)[number];
/** Ce pour quoi une image est créée : le cadrage d'une image de scène, l'image de repérage, le portrait de référence */
export type UsageDImage = "pleine-page" | "3:2" | "16:9" | "carre" | "reperage" | "portrait";

/** La qualité demandée au fournisseur pour une image, d'après le réglage du compte. */
export const qualiteDeLImage = (reglage: QualiteDesImages, usage: UsageDImage): "normale" | "haute" =>
  reglage === "auto" ? (usage === "pleine-page" ? "haute" : "normale") : reglage;

/** Un compte neuf (F13, F10.2) : degré 2, aides proposées, une image, en qualité automatique. */
export const REGLAGES_IA_HABITUELS: ReglagesIa = { degre: 2, proposer: true, niveaux: [], imagesParCreation: 1, qualite: "auto" };

/** Ce que la base garde, relu sans confiance : un réglage absent ou abîmé reprend sa valeur habituelle. */
export function lireReglagesIa(v: unknown): ReglagesIa {
  const o = v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
  const h = REGLAGES_IA_HABITUELS;
  const niveaux = Array.isArray(o.niveaux) ? NIVEAUX.filter((n) => (o.niveaux as unknown[]).includes(n)) : h.niveaux;
  return {
    degre: DEGRES.includes(o.degre as Degre) ? (o.degre as Degre) : h.degre,
    proposer: typeof o.proposer === "boolean" ? o.proposer : h.proposer,
    niveaux,
    imagesParCreation: o.imagesParCreation === 1 || o.imagesParCreation === 2 ? o.imagesParCreation : h.imagesParCreation,
    qualite: QUALITES.includes(o.qualite as QualiteDesImages) ? (o.qualite as QualiteDesImages) : h.qualite,
  };
}

/** « élèves de CM1 et de CM2 », « élèves de CE2 », « élèves d'école élémentaire ». */
export function niveauEnMots(niveaux: readonly Niveau[]): string {
  const tries = NIVEAUX.filter((n) => niveaux.includes(n));
  if (!tries.length) return "élèves d'école élémentaire";
  if (tries.length === 1) return `élèves de ${tries[0]}`;
  return `élèves de ${tries.slice(0, -1).join(", de ")} et de ${tries[tries.length - 1]}`;
}

/**
 * Les fournisseurs facturent en dollars. Taux approché, relevé le 17 octobre 2026 (l'euro
 * a valu entre 1,13 et 1,21 dollar en 2026) : il ne sert qu'à dire un plafond ou un budget
 * en euros, et se revoit avec les plafonds à l'ouverture.
 */
export const DOLLARS_PAR_EURO = 1.15;

/**
 * Les plafonds, rangés en un seul endroit et réglés à l'ouverture (F14). Ils se comptent en
 * demandes, plus lisibles que des euros ; seul le plafond mensuel des images, pour toute
 * l'application, se compte en argent.
 */
export const PLAFONDS = {
  /** Demandes de texte par adulte et par jour, heure de Paris */
  textesParJour: 60,
  /** Images par adulte et par jour : chaque image d'une création compte */
  imagesParJour: 20,
  /** En dessous, l'écran dit ce qu'il reste ; au-dessus, rien ne s'affiche */
  avertirTextesSous: 10,
  avertirImagesSous: 4,
  /** Pour toute l'application et par mois : trente euros d'images, comptés en dollars facturés */
  imagesParMoisUsd: 30 * DOLLARS_PAR_EURO,
  /** Au-delà, la demande est abandonnée : « L'aide n'a pas répondu. » */
  secondes: 60,
} as const;

export const MESSAGES_IA = {
  pasDeReponse: "L'aide n'a pas répondu. Le texte n'a pas changé.",
  texteChange: "Le texte a changé depuis la demande. Redemander ?",
  demain: "Les aides reviennent demain. Tout le reste fonctionne.",
  occupe: "Une autre demande attend encore sa réponse.",
  mois: "Les images reviennent le mois prochain. Tout le reste fonctionne.",
} as const;

/** « Encore 10 demandes aujourd'hui. », seulement dans les dix dernières ; rien au-dessus. */
export function resteDuJour(sorte: "texte" | "image", restant: number): string | null {
  if (sorte === "texte") {
    if (restant > PLAFONDS.avertirTextesSous || restant < 1) return null;
    return `Encore ${restant} ${restant > 1 ? "demandes" : "demande"} aujourd'hui.`;
  }
  if (restant > PLAFONDS.avertirImagesSous || restant < 1) return null;
  return `Encore ${restant} ${restant > 1 ? "images" : "image"} aujourd'hui.`;
}

/** Pourquoi une demande n'a rien donné ; le texte, lui, n'a jamais changé. */
export type RefusIa = "eteint" | "occupe" | "jour" | "mois" | "delai" | "echec";

export function messageDuRefus(refus: RefusIa): string {
  switch (refus) {
    case "jour":
      return MESSAGES_IA.demain;
    case "mois":
      return MESSAGES_IA.mois;
    case "occupe":
      return MESSAGES_IA.occupe;
    default:
      return MESSAGES_IA.pasDeReponse;
  }
}
