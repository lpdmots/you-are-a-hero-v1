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
  "mots-cles", // F10.1, les mots-clés d'une image de la bibliothèque, lus dans l'image (21 octobre 2026)
] as const;
export type AideTexte = (typeof AIDES_TEXTE)[number];
/**
 * Les créations d'images (F10.1, F10.2) : le portrait de référence d'un personnage, l'image de
 * référence d'un objet, puis au lot 8 l'image d'une scène, l'image de repérage et celle créée
 * d'office pour une partie ou un chapitre ajouté par l'IA. Le journal les distingue pour suivre
 * la dépense.
 */
export const AIDES_IMAGE = ["portrait", "image-objet", "image-scene", "image-reperage", "image-ajout"] as const;
export type AideImage = (typeof AIDES_IMAGE)[number];
export type Aide = AideTexte | AideImage;

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
  "mots-cles": "Mots-clés d'une image",
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

/**
 * « Âge des lecteurs », réglé par projet (F13, décidé par le porteur le 21 octobre 2026) : il
 * remplace les niveaux CE1 à CM2 du compte, qui changent d'un pays à l'autre et ne disaient
 * rien d'un livre pour adultes. Dans un projet de classe, il décrit aussi les élèves qui écrivent.
 */
export const AGES = ["6-8", "8-10", "10-12", "12-15", "adultes"] as const;
export type AgeDesLecteurs = (typeof AGES)[number];
export const AGE_PAR_DEFAUT: AgeDesLecteurs = "8-10";
export const estAge = (v: unknown): v is AgeDesLecteurs => AGES.includes(v as AgeDesLecteurs);

/** Ce que lit l'adulte : « 8 à 10 ans », « Adultes ». */
export const NOMS_DES_AGES: Record<AgeDesLecteurs, string> = {
  "6-8": "6 à 8 ans",
  "8-10": "8 à 10 ans",
  "10-12": "10 à 12 ans",
  "12-15": "12 à 15 ans",
  adultes: "Adultes",
};

/** Le public, pour les aides : « enfants de 8 à 10 ans », « adolescents de 12 à 15 ans », « adultes ». */
export function lecteursEnMots(age: AgeDesLecteurs): string {
  if (age === "adultes") return "adultes";
  return `${age === "12-15" ? "adolescents" : "enfants"} de ${NOMS_DES_AGES[age]}`;
}

/** Un élève qui écrit, pour les aides : « élève de 8 à 10 ans », « élève adulte » ; au pluriel, « élèves… ». */
export const eleveEnMots = (age: AgeDesLecteurs, pluriel = false): string =>
  `élève${pluriel ? "s" : ""} ${age === "adultes" ? `adulte${pluriel ? "s" : ""}` : `de ${NOMS_DES_AGES[age]}`}`;

export type ReglagesIa = {
  /** Le degré proposé à chaque demande ; une demande peut en choisir un autre sans le changer */
  degre: Degre;
  /** Éteint : aucun bouton d'IA nulle part (projection devant la classe, travail sans IA) */
  proposer: boolean;
  imagesParCreation: 1 | 2;
  qualite: QualiteDesImages;
  /**
   * « Créer l'image des parties et chapitres ajoutés par l'IA » (F10.1, 18 octobre 2026) : une
   * image d'après le résumé, une seule, sans choix ; allumé par défaut, le porteur préférant
   * l'ajout automatique.
   */
  imageALAjout: boolean;
  /**
   * « Proposer mes images à la bibliothèque » (F10.1, 21 octobre 2026) : une image créée sans
   * personnage peut rejoindre les visuels proposés à tous, après la relecture du porteur ;
   * allumé par défaut, décision du porteur.
   */
  bibliotheque: boolean;
};

/**
 * « Qualité des images » (F10.2) : automatique, normale ou haute. Automatique, ajouté le
 * 18 octobre 2026 à la demande du porteur : la haute qualité là seulement où elle se voit,
 * une image en pleine page imprimée ; la normale partout ailleurs.
 */
export const QUALITES = ["auto", "normale", "haute"] as const;
export type QualiteDesImages = (typeof QUALITES)[number];
/** Ce pour quoi une image est créée : le cadrage d'une image de scène, l'image de repérage, le portrait de référence */
export type UsageDImage = "pleine-page" | "3:2" | "16:9" | "carre" | "reperage" | "portrait" | "objet";

/**
 * La taille demandée au fournisseur pour chaque usage, en points, multiples de 16. Le portrait
 * de référence est en hauteur, le personnage en pied ; l'objet, carré.
 */
export const TAILLES_DES_IMAGES: Record<UsageDImage, string> = {
  "pleine-page": "1024x1536",
  "3:2": "1536x1024",
  "16:9": "1536x864",
  carre: "1024x1024",
  reperage: "1536x1024",
  portrait: "1024x1536",
  objet: "1024x1024",
};

/** La qualité demandée au fournisseur pour une image, d'après le réglage du compte. */
export const qualiteDeLImage = (reglage: QualiteDesImages, usage: UsageDImage): "normale" | "haute" =>
  reglage === "auto" ? (usage === "pleine-page" ? "haute" : "normale") : reglage;

/** Un compte neuf (F13, F10.1, F10.2) : degré 2, aides proposées, une image, en qualité automatique, l'image créée à l'ajout. */
export const REGLAGES_IA_HABITUELS: ReglagesIa = { degre: 2, proposer: true, imagesParCreation: 1, qualite: "auto", imageALAjout: true, bibliotheque: true };

/**
 * Ce que la base garde, relu sans confiance : un réglage absent ou abîmé reprend sa valeur
 * habituelle. Les anciens niveaux (« niveaux », jusqu'au 21 octobre 2026) ne sont plus lus.
 */
export function lireReglagesIa(v: unknown): ReglagesIa {
  const o = v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
  const h = REGLAGES_IA_HABITUELS;
  return {
    degre: DEGRES.includes(o.degre as Degre) ? (o.degre as Degre) : h.degre,
    proposer: typeof o.proposer === "boolean" ? o.proposer : h.proposer,
    imagesParCreation: o.imagesParCreation === 1 || o.imagesParCreation === 2 ? o.imagesParCreation : h.imagesParCreation,
    qualite: QUALITES.includes(o.qualite as QualiteDesImages) ? (o.qualite as QualiteDesImages) : h.qualite,
    imageALAjout: typeof o.imageALAjout === "boolean" ? o.imageALAjout : h.imageALAjout,
    bibliotheque: typeof o.bibliotheque === "boolean" ? o.bibliotheque : h.bibliotheque,
  };
}

/**
 * Les fournisseurs facturent en dollars. Taux approché, relevé le 17 octobre 2026 (l'euro
 * a valu entre 1,13 et 1,21 dollar en 2026) : il ne sert qu'à dire une dépense en euros sur la
 * page de l'essai de qualité. Le débit des étoiles suit le taux des réglages de l'application
 * (F14, `reglages_application`).
 */
export const DOLLARS_PAR_EURO = 1.15;

/**
 * Le temps d'attente des aides. Les plafonds du jour et du mois sont retirés le 20 octobre 2026
 * (F14, « Aides IA sans quota ») : le solde d'étoiles borne la dépense.
 */
export const PLAFONDS = {
  /** Au-delà, la demande est abandonnée : « L'aide n'a pas répondu. » */
  secondes: 60,
  /**
   * Une image se crée en trente à quarante secondes chez OpenAI, parfois davantage en haute
   * qualité ou par deux : deux minutes avant d'abandonner (étape 8, lot 7, à confirmer).
   */
  secondesImage: 120,
} as const;

export const MESSAGES_IA = {
  pasDeReponse: "L'aide n'a pas répondu. Le texte n'a pas changé.",
  pasDImage: "L'image n'a pas pu être créée. Rien n'a changé.",
  texteChange: "Le texte a changé depuis la demande. Redemander ?",
  etoiles: "Vous n'avez plus d'étoiles. Tout le reste fonctionne.",
  absentes: "Les aides IA ne sont pas installées sur ce site. Tout le reste fonctionne.",
} as const;

/** « 34 ✦ » : le solde d'étoiles, seul prix que l'enseignant voit (F14). */
export const enEtoiles = (n: number): string => `${Math.max(n, 0)} ✦`;

/**
 * Ce qui s'affiche près d'une aide après sa réponse (F14-AC07) : le solde, quand il en reste peu ;
 * rien au-dessus, ni pour le compte du porteur, qui n'a pas de solde (`solde` null).
 */
export function resteDEtoiles(solde: number | null, peu: number): string | null {
  if (solde === null || solde > peu) return null;
  return solde > 0 ? `Il vous reste ${enEtoiles(solde)}.` : "Il ne vous reste plus d'étoiles.";
}

/** Pourquoi une demande n'a rien donné ; le texte, lui, n'a jamais changé. */
/** « absentes » : les clés du fournisseur manquent sur ce site ; rien n'est parti ni compté. */
/** « etoiles » : le solde est épuisé ; rien n'est parti (F14-AC08). */
export type RefusIa = "eteint" | "absentes" | "etoiles" | "delai" | "echec";

export function messageDuRefus(refus: RefusIa, sorte: "texte" | "image" = "texte"): string {
  switch (refus) {
    case "etoiles":
      return MESSAGES_IA.etoiles;
    case "absentes":
      return MESSAGES_IA.absentes;
    default:
      return sorte === "image" ? MESSAGES_IA.pasDImage : MESSAGES_IA.pasDeReponse;
  }
}
