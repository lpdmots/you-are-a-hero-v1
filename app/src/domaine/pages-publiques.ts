import { MODELES } from "./textes-publics";

/**
 * L'image de partage des pages publiques (courriel, messagerie, ENT, réseaux), 1200 × 630 : le premier
 * écran de l'accueil. Déclarée par le pied des pages publiques, et par l'accueil lui-même, dont les réglages
 * de partage remplacent ceux qu'il hérite : sans elle, l'accueil n'en donnait aucune (audit du 7 novembre 2026).
 */
export const IMAGE_DE_PARTAGE = {
  url: "/accueil/partage.jpg",
  width: 1200,
  height: 630,
  alt: "Un grand livre ouvert : « Votre classe écrit son livre-jeu. », à côté d’élèves qui écrivent sur l’ordinateur, et un petit dragon assis",
};

/** Le guide « Comment écrire un livre dont vous êtes le héros en classe » (F14-AC52, AC53) */
export const ADRESSE_DU_GUIDE = "/guide/ecrire-un-livre-dont-vous-etes-le-heros";

/**
 * Les pages publiques (F14, « Pages publiques ») : celles que les moteurs de recherche et les robots
 * des IA peuvent lire (F14-AC45). Le plan du site, `robots.txt` et `llms.txt` partent de cette liste ;
 * le reste du site, l'application et les livres de `/lire`, n'y est pas. La bibliothèque y est, non
 * les adresses de ses livres, que leur « noindex » tient hors des moteurs (F15-AC12).
 */
export const PAGES_PUBLIQUES: readonly string[] = [
  "/",
  "/bibliotheque",
  "/aide",
  ADRESSE_DU_GUIDE,
  ...MODELES.map((m) => `/modeles/${m.cle}`),
  "/confidentialite",
  "/conditions",
  "/mentions-legales",
];

/**
 * Ce que les robots des IA lisent en plus des pages : `llms.txt`, les fichiers de l'application et les
 * images de l'accueil (les couvertures de ses livres comprises) et du guide, sans lesquels une page ne
 * s'affiche pas.
 */
export const RESSOURCES_PUBLIQUES: readonly string[] = ["/llms.txt", "/_next/", "/accueil/", "/images/accueil/", "/guide/"];

/**
 * L'application, fermée à tous les robots : des pages de compte ou d'élève, qui ne mènent à rien sans
 * connexion. `/entree` et `/classe` n'y sont pas : liées depuis chaque page publique, elles doivent
 * rester lisibles pour que leur « noindex » soit vu, faute de quoi leur adresse seule serait répertoriée.
 * `/lire` non plus : son en-tête « noindex » tient les livres hors des moteurs (F12.1, « Non-référencement »).
 */
export const APPLICATION: readonly string[] = [
  "/projet/",
  "/projets",
  "/classes",
  "/compte",
  "/admin",
  "/essai-ia",
  "/atelier",
  "/travail",
  "/copie",
  "/livre/",
  "/previsualiser",
  "/diagnostic",
  "/ia/",
  "/images/",
  "/paiement/",
  "/taches/",
];

/**
 * Les robots des IA (recherche et entraînement), qui ne lisent que les pages publiques (décidé par le
 * porteur le 24 octobre 2026) : ni l'application ni les livres des élèves. Les agents qui lisent une page
 * à la demande d'une personne (ChatGPT-User, Claude-User…) ne sont pas des robots : ils n'y sont pas.
 */
export const ROBOTS_DES_IA: readonly string[] = [
  "GPTBot",
  "OAI-SearchBot",
  "ClaudeBot",
  "Claude-SearchBot",
  "PerplexityBot",
  "Google-Extended",
  "Applebot-Extended",
  "CCBot",
  "meta-externalagent",
  "meta-webindexer",
  "Bytespider",
  "Amazonbot",
];

/** Les pages où l'audience se mesure (F14-AC49) : les pages publiques et les entrées de l'adulte. */
export function estPageMesuree(chemin: string | null): boolean {
  if (!chemin) return false;
  // `/vitrine` : l'accueil gardé en cache, que le serveur compose sous ce nom (F14-AC47)
  return PAGES_PUBLIQUES.includes(chemin) || chemin === "/vitrine" || chemin === "/entree" || chemin.startsWith("/entree/");
}
