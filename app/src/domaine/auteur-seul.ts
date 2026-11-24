import type { Offre } from "./offre";

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
export const TEMPS_DE_L_AUTEUR_SEUL: readonly { titre: string; phrase: string; image: ImageDeLAuteurSeul }[] = [
  {
    titre: "Dessiner les chemins",
    phrase: "Dans « Chemins », chaque scène est une carte et chaque choix un onglet dessous : vous voyez où mène chaque chemin, et ce qui reste sans suite.",
    image: {
      src: "/guide/chemins-le-pont-effondre-onglets.webp",
      largeur: 1200,
      hauteur: 894,
      telephone: { src: "/guide/chemins-le-pont-effondre-onglets-telephone.webp", largeur: 1062, hauteur: 957 },
      alt: "La vue « Chemins » d’un chapitre : une énigme devant un pont effondré et ses quatre choix, chacun en onglet sous la carte ; trois chemins se rejoignent sur la rive.",
    },
  },
  {
    titre: "Écrire les scènes",
    phrase: "Vous écrivez chaque scène et posez ses choix dans le texte. Objets, feuille d’aventure et jets de dé s’ajoutent si votre livre en a.",
    image: {
      src: "/guide/copie-la-lanterne.webp",
      largeur: 1656,
      hauteur: 750,
      telephone: { src: "/guide/copie-la-lanterne-telephone.webp", largeur: 714, hauteur: 900 },
      alt: "Une scène en cours d’écriture : deux paragraphes, puis le choix « La suivre : rends-toi au 5 », qui mène à la cabane du passeur.",
    },
  },
  {
    titre: "Composer le livre",
    phrase: "L’application vérifie que chaque chemin mène quelque part, numérote les passages et compose le PDF au format A5. Un lien le donne aussi à lire en ligne.",
    image: {
      src: "/guide/livre-compose-electro-nick-definitif.webp",
      largeur: 1597,
      hauteur: 1130,
      telephone: { src: "/guide/livre-compose-electro-nick-definitif-telephone.webp", largeur: 798, hauteur: 735 },
      alt: "Une double page d’un livre composé par le site : les passages 74 à 77, leurs illustrations, une action de jeu et les choix.",
    },
  },
];

/** Sans classe : comment le dire à l'outil, en une phrase */
export const SANS_CLASSE = "Pensé d’abord pour la classe, l’outil marche aussi sans elle : à « Qui écrit ? », en créant le projet, répondez « Moi ».";

/** Ce que cela coûte, lu dans les réglages comme sur l'« Aide » */
export function prixPourLAuteurSeul(offre: Offre): string {
  const livre = offre.livrePayant
    ? `Gratuit jusqu’à ${offre.scenesGratuites} scènes et ${offre.imagesGratuites} images, sans carte bancaire.`
    : "Gratuit, sans limite de scènes ni d’images, sans carte bancaire.";
  return `${livre} Les aides de l’IA, facultatives, se paient en étoiles.`;
}
