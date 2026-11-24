import { enEuros, type Offre } from "./offre";

/**
 * La page de l'auteur seul (F14, « Pages publiques pour les deux sortes de récit », cinquième part, F14-AC76) :
 * quelqu'un qui écrit seul un livre dont vous êtes le héros, sans classe. Décidé par le porteur le
 * 24 novembre 2026 : jamais mise en avant (un lien au pied du site, dans « Commencer », et un sous la question
 * de l'« Aide » qui la pose), limitée au livre-jeu ; mot-clé « créer un livre dont vous êtes le héros »,
 * « histoire interactive » en appui, sans viser ceux du guide ni de l'accueil.
 */

export const ADRESSE_DE_L_AUTEUR_SEUL = "/creer-un-livre-dont-vous-etes-le-heros";
export const DATE_DE_L_AUTEUR_SEUL = "2026-11-24";

// Le titre d'onglet porte le mot-clé tel qu'il se cherche ; le grand titre le dit comme on le dirait
export const TITRE_DE_L_AUTEUR_SEUL = "Créer un livre dont vous êtes le héros, seul";
export const GRAND_TITRE_DE_L_AUTEUR_SEUL = "Créer seul son livre dont vous êtes le héros";
export const DESCRIPTION_DE_L_AUTEUR_SEUL =
  "Écrivez seul votre livre dont vous êtes le héros, une histoire interactive à imprimer : l’outil tient les chemins, numérote les passages et compose le PDF.";
export const CHAPEAU_DE_L_AUTEUR_SEUL = "Vous écrivez l’histoire ; l’application tient les chemins, numérote les passages et compose le livre à imprimer.";

/** Le libellé du lien au pied des pages publiques */
export const LIEN_DE_L_AUTEUR_SEUL = "Écrire seul un livre-jeu";

export type ImageDeLAuteurSeul = {
  src: string;
  largeur: number;
  hauteur: number;
  /** Une capture recadrée pour le téléphone, quand l'autre y serait illisible */
  telephone?: { src: string; largeur: number; hauteur: number };
  alt: string;
};

/** Les trois temps, du plan au livre, chacun avec une capture de l'application déjà publiée par le guide */
/**
 * Les trois temps, du plan au livre, chacun avec sa capture. Elles montrent « La dernière traversée du Cormoran »,
 * un livre-jeu pour adultes écrit pour cette page (`scripts/exemples/cormoran.ts`, images à l'encre du porteur), à la
 * place des livres de classe, jugés « un peu bébé » pour ce public (24 novembre 2026). Refaites par
 * `npx playwright test --config playwright.local.config.ts auteur-seul`, puis converties en webp.
 */
const IMAGES = ADRESSE_DE_L_AUTEUR_SEUL;
export const TEMPS_DE_L_AUTEUR_SEUL: readonly { titre: string; phrase: string; image: ImageDeLAuteurSeul }[] = [
  {
    titre: "Dessiner les chemins",
    phrase: "Dans « Chemins », chaque scène est une carte et chaque choix un onglet dessous : vous voyez où mène chaque chemin, et ce qui reste sans suite.",
    image: {
      src: `${IMAGES}/chemins.webp`,
      largeur: 1440,
      hauteur: 984,
      telephone: { src: `${IMAGES}/chemins-telephone.webp`, largeur: 830, hauteur: 340 },
      alt: "La vue « Chemins » d’un polar en mer : le départ sur le pont promenade et ses trois choix en onglets, qui mènent au commandant, aux poches du pardessus et à la cabine A-24.",
    },
  },
  {
    titre: "Écrire les scènes",
    phrase: "Vous écrivez chaque scène et posez ses choix dans le texte. Objets, feuille d’aventure et jets de dé s’ajoutent si votre livre en a.",
    image: {
      src: `${IMAGES}/copie.webp`,
      largeur: 1486,
      hauteur: 942,
      telephone: { src: `${IMAGES}/copie-telephone.webp`, largeur: 686, hauteur: 1158 },
      alt: "Une scène en cours d’écriture : le passager disparu, retrouvé sous la suie en tenue de chauffeur, puis deux choix, « Le conduire au commandant » et « Garder son secret », chacun avec son numéro.",
    },
  },
  {
    titre: "Composer le livre",
    phrase: "L’application vérifie que chaque chemin mène quelque part, numérote les passages et compose le PDF au format A5. Un lien le donne aussi à lire en ligne.",
    image: {
      src: `${IMAGES}/livre.webp`,
      largeur: 1600,
      hauteur: 1133,
      telephone: { src: `${IMAGES}/livre-telephone.webp`, largeur: 800, hauteur: 1133 },
      alt: "Une double page du livre composé : les passages 1 à 4, leurs choix numérotés, une fin, et l’illustration à l’encre d’une cabine de paquebot en désordre.",
    },
  },
];

/**
 * Pour commencer : comment le dire à l'outil, en une phrase. Sans « pensé d'abord pour la classe », retiré à la
 * demande du porteur le 24 novembre 2026 (« cela fait second choix »).
 */
export const POUR_COMMENCER = "En créant le projet, à « Qui écrit ? », répondez « Moi » : vous écrivez toutes les scènes.";

/** Ce que cela coûte, lu dans les réglages comme sur l'« Aide » ; l'IA a sa partie à elle */
export function prixPourLAuteurSeul(offre: Offre): string {
  return offre.livrePayant
    ? `Gratuit jusqu’à ${offre.scenesGratuites} scènes et ${offre.imagesGratuites} images, sans carte bancaire.`
    : "Gratuit, sans limite de scènes ni d’images, sans carte bancaire.";
}

/**
 * L'IA, un peu en avant (demandé par le porteur le 24 novembre 2026 : elle peut intéresser qui veut écrire son
 * histoire avec de l'aide). Les aides que l'adulte a dans un projet personnel (F13), dites par ce qu'elles font.
 */
export const TITRE_DE_L_IA = "Avec l’aide de l’IA, si vous le voulez";
export const AIDES_DE_L_IA: readonly { nom: string; phrase: string }[] = [
  { nom: "Proposer la suite", phrase: "Dans « Chemins », dites ce qui manque : l’IA dessine plusieurs scènes et leurs choix, en pointillé, et vous gardez ce qui vous plaît." },
  { nom: "Des idées de choix", phrase: "Pour une scène où vous ne savez pas quoi offrir au lecteur." },
  { nom: "Une première version", phrase: "D’une scène, d’après ce que vous voulez y raconter, à reprendre à votre main." },
  { nom: "Relire", phrase: "Orthographe et tournures ; chaque correction s’accepte ou se refuse." },
  { nom: "Illustrer", phrase: "Les scènes, les portraits des personnages et la couverture." },
];

/** Ce que coûte l'IA, lu dans les réglages */
export function etoilesPourLAuteurSeul(offre: Offre): string {
  const achat = offre.paiementOuvert ? `, puis ${enEuros(offre.prixDeLaRecharge)} les ${offre.etoilesDeLaRecharge}` : "";
  return `Chaque demande coûte quelques étoiles : ${offre.etoilesOffertes} offertes à l’inscription${achat}. Tout le reste marche sans elles.`;
}
