import { ADRESSE_DE_L_AUTEUR_SEUL, TITRE_DE_L_AUTEUR_SEUL } from "./auteur-seul";
import { enEuros, type Offre } from "./offre";
import { ADRESSE_DU_GUIDE } from "./pages-publiques";
import { ADRESSE_DES_RESSOURCES, DOCUMENTS_A_IMPRIMER } from "./ressources";
import { EDITEUR, MODELES } from "./textes-publics";
import { afficheDe, dureeIso, HORS_SERIE_POSEES, numeroDe, TUTOS_POSES, TUTOS_POSES_LE, videoDe } from "./tutos";

/**
 * Ce que les moteurs et les IA lisent du site (F14-AC48) : `llms.txt` et les données structurées. Tout
 * y reprend ce que les pages publiques disent déjà ; les prix sont ceux des réglages, au moment où la
 * page se compose.
 */

export const NOM = "Il était une classe";
/**
 * Le premier écran de l'accueil et le pied des pages publiques, pour les deux sortes de récit (F14-AC72,
 * « Pages publiques pour les deux sortes de récit », 23 novembre 2026) : « livre » porte les titres, mot-clé
 * « écrire un livre avec sa classe » ; le livre dont vous êtes le héros est nommé d'abord, l'histoire
 * classique ensuite.
 */
export const PROMESSE = "Votre classe écrit son livre.";
export const DEUX_RECITS = "Un livre dont vous êtes le héros ou une histoire classique.";
// Sans le nom du site, que les moteurs affichent à part : 73 signes, « livre dont vous êtes le héros » avant la coupe
export const TITRE_DE_L_ACCUEIL = "Écrire un livre avec sa classe : livre dont vous êtes le héros ou histoire";
export const DESCRIPTION_DE_L_ACCUEIL =
  "Créez gratuitement un livre avec votre classe : livre dont vous êtes le héros ou histoire classique. Écriture des élèves, PDF, lecture en ligne. IA facultative.";
/** Le troisième temps du passage 12 (F14-AC73) : ce qui vaut toujours, le PDF, puis ce qui est propre au livre-jeu */
export const LE_LIVRE_PREND_FORME = "L’application compose le PDF. Pour un livre-jeu, elle vérifie aussi les chemins et numérote les passages. Vous relisez et ajustez.";

export const DESCRIPTION =
  "Application web gratuite pour écrire un livre avec sa classe d’école élémentaire : un livre dont vous êtes le héros (un livre-jeu, une histoire interactive à choix) ou une histoire classique, qui se lit du début à la fin. Chaque élève écrit ses scènes, l’application guide l’enseignant à chaque étape, et le livre s’imprime en PDF et se lit en ligne.";

/** La définition du genre, en une phrase qu'un moteur ou une IA peut citer telle quelle. */
export const DEFINITION =
  "Un livre dont vous êtes le héros, ou livre-jeu, est un récit découpé en passages numérotés : à la fin de chacun, le lecteur choisit la suite et se rend au passage indiqué, si bien que chaque lecture est une aventure différente. On parle aussi d’histoire interactive ou de fiction interactive.";

const prix = (centimes: number) => enEuros(centimes).replace(" ", " ");

/** L'autre sorte de récit, dite pour un moteur ou une IA (F14-AC75) */
export const HISTOIRE_CLASSIQUE =
  "L’outil sert aussi à écrire une histoire classique, qui se lit du début à la fin, sans choix ni numéros de passage : un conte, un récit d’aventure, un roman. L’enseignant choisit la sorte de récit en créant le projet ; la préparation, l’écriture des élèves, la relecture, le PDF et la lecture en ligne sont les mêmes.";

/** `llms.txt` (llmstxt.org) : ce qu'est l'outil, pour qui, ce qu'il coûte, et où lire la suite. */
export function llmsTxt(offre: Offre, site: string): string {
  const etoiles = offre.paiementOuvert
    ? `- Les aides de l’IA, facultatives et pour l’enseignant seulement, ont un coût à chaque demande et se paient en étoiles : ${offre.etoilesOffertes} offertes à l’inscription, ${prix(offre.prixDeLaRecharge)} les ${offre.etoilesDeLaRecharge} de plus. Pas d’abonnement.`
    : `- Les aides de l’IA, facultatives et pour l’enseignant seulement, se paient en étoiles, dont ${offre.etoilesOffertes} offertes à l’inscription.`;
  const cout = offre.livrePayant
    ? [
        `- Gratuit pour un livre jusqu’à ${offre.scenesGratuites} scènes et ${offre.imagesGratuites} images, sans carte bancaire.`,
        `- Pass du livre : ${prix(offre.prixDuPass)} par livre, payé une fois ; il lève ces limites pour ce livre et donne ${offre.etoilesDuPass} étoiles.`,
        etoiles,
      ]
    : [`- Gratuit, sans limite de scènes ni d’images, sans carte bancaire : la préparation, l’écriture des élèves, le PDF et la lecture en ligne. Offert aux collègues tant que les frais d’hébergement restent supportables.`, etoiles];
  return [
    `# ${NOM}`,
    "",
    `> ${DESCRIPTION}`,
    "",
    "## Livre dont vous êtes le héros",
    "",
    DEFINITION,
    "",
    "## Histoire classique",
    "",
    HISTOIRE_CLASSIQUE,
    "",
    "## Pour qui",
    "",
    "- Les enseignants d’école élémentaire et leur classe, en français : de jeunes auteurs dès 6 ans, en écriture accompagnée ou sous la dictée à l’adulte ; l’âge des lecteurs se règle pour chaque livre.",
    "- Un adulte seul peut aussi écrire son propre livre, à choix ou classique, sans classe.",
    "",
    "## Comment se passe un projet",
    "",
    "1. On prépare ensemble, projeté au tableau, étape par étape : le monde, les héros, l’enjeu, puis les chapitres et les scènes.",
    "2. Chaque élève écrit ses scènes, sur son cahier d’après une fiche de rédaction nominative ou directement à l’écran ; l’enseignant suit les textes à écrire, relire ou reprendre, fait retravailler et valide.",
    "3. Le livre prend forme : l’application compose le PDF à imprimer et, pour un livre-jeu, vérifie les chemins et numérote les passages ; l’enseignant relit et ajuste ; les élèves le lisent en ligne avec leur code, et il peut entrer dans la bibliothèque publique du site.",
    "",
    "Deux sortes de récit, au choix pour chaque projet : un livre dont vous êtes le héros ou une histoire classique. Rien à installer ; quelques postes suffisent ; l’enseignant ouvre la classe, et chaque élève entre avec son prénom et son code, sans adresse électronique. Les élèves n’ont accès à aucune IA.",
    "",
    "## Ce que cela coûte",
    "",
    ...cout,
    "",
    "## Qui le fait",
    "",
    `Conçu par Nicolas Coussot, professeur des écoles : six ans de livres-jeux avec sa classe, dont quatre avec cet outil. Édité par ${EDITEUR.nom}. Contact : ${EDITEUR.contact}.`,
    "",
    "## Pages",
    "",
    `- [Accueil](${site}/) : l’outil, les deux sortes de récit, un projet en trois temps, deux livres à feuilleter, les prix.`,
    `- [La bibliothèque](${site}/bibliotheque) : des histoires dont vous êtes le héros et des récits écrits par des classes avec l’outil, à lire en ligne gratuitement, sans compte.`,
    `- [Aide](${site}/aide) : un tuto vidéo d’environ une minute pour chaque étape du projet, une vidéo de deux minutes et demie sur les aides de l’IA, les questions fréquentes (âge des élèves, durée d’un projet, matériel, prix), les modèles à télécharger.`,
    `- [Production d’écrit et projet d’écriture : le livre-jeu en classe](${site}${ADRESSE_DES_RESSOURCES}) : leçons, fiches de recherche, affiches et lettre aux familles à imprimer, gratuites, rangées par moment du projet, avec les liens aux programmes de français.`,
    `- [Comment écrire un livre dont vous êtes le héros en classe](${site}${ADRESSE_DU_GUIDE}) : la méthode d’un professeur des écoles, en quatorze questions, de la lecture de livres-jeux à l’impression ; avec ses chiffres réels (six ans de livres, deux livres de 213 et 323 scènes).`,
    `- [${TITRE_DE_L_AUTEUR_SEUL}](${site}${ADRESSE_DE_L_AUTEUR_SEUL}) : pour un adulte qui écrit seul son livre-jeu, sans classe ; les chemins, l’écriture des scènes, le PDF à imprimer.`,
    `- [Confidentialité](${site}/confidentialite) : les données gardées, l’IA, la mesure d’audience.`,
    `- [Conditions d’utilisation](${site}/conditions)`,
    `- [Mentions légales](${site}/mentions-legales)`,
    ...MODELES.map((m) => `- [${m.nom}](${site}/modeles/${m.cle}) : ${m.pour}`),
    "",
    "## Documents à imprimer",
    "",
    `Gratuits, en PDF, sous licence Creative Commons BY-NC 4.0 ; présentés sur la page [Ressources](${site}${ADRESSE_DES_RESSOURCES}).`,
    "",
    ...DOCUMENTS_A_IMPRIMER.flatMap((d) => d.versions.map((v) => `- [${d.versions.length > 1 ? `${d.titre} (${v.libelle})` : d.titre}](${site}${v.fichier}) : ${d.phrase}`)),
    "",
  ].join("\n");
}

/** La visite en vidéo, telle que l'accueil la montre */
export type Video = { fichier: string; sousTitres: string | null; image: string; duree: string; publieeLe: string };

type Donnee = Record<string, unknown>;

/** L'accueil : l'organisation, le site, l'application et son offre, la visite en vidéo si elle est en ligne. */
export function donneesDeLAccueil(offre: Offre, site: string, video: Video | null): Donnee {
  const organisation = `${site}/#organisation`;
  const offres: Donnee[] = [{ "@type": "Offer", name: "Gratuit", price: "0", priceCurrency: "EUR" }];
  if (offre.livrePayant) {
    offres.push({ "@type": "Offer", name: "Pass du livre", price: (offre.prixDuPass / 100).toFixed(2), priceCurrency: "EUR", description: `Par livre, payé une fois : sans limite de scènes ni d’images, et ${offre.etoilesDuPass} étoiles.` });
  }
  if (offre.paiementOuvert) {
    offres.push({ "@type": "Offer", name: `${offre.etoilesDeLaRecharge} étoiles`, price: (offre.prixDeLaRecharge / 100).toFixed(2), priceCurrency: "EUR", description: "Une recharge d’étoiles pour les aides de l’IA." });
  }
  const graphe: Donnee[] = [
    {
      "@type": "Organization",
      "@id": organisation,
      name: NOM,
      url: `${site}/`,
      logo: `${site}/icon.svg`,
      email: EDITEUR.contact,
      // Le même auteur que celui du guide, par son identifiant (audit du 7 novembre 2026)
      founder: { "@type": "Person", "@id": `${site}/#nicolas`, name: "Nicolas Coussot", jobTitle: "Professeur des écoles" },
    },
    { "@type": "WebSite", "@id": `${site}/#site`, name: NOM, url: `${site}/`, inLanguage: "fr-FR", publisher: { "@id": organisation } },
    {
      "@type": "WebApplication",
      name: NOM,
      url: `${site}/`,
      description: DESCRIPTION,
      applicationCategory: "EducationalApplication",
      operatingSystem: "Navigateur web",
      inLanguage: "fr-FR",
      audience: { "@type": "EducationalAudience", educationalRole: "teacher" },
      // Le livre gratuit (8 novembre 2026) : l'outil s'utilise sans payer, l'IA seule se paie
      isAccessibleForFree: !offre.livrePayant,
      publisher: { "@id": organisation },
      offers: offres,
    },
  ];
  if (video) {
    graphe.push({
      "@type": "VideoObject",
      name: "Il était une classe en vidéo",
      description: "La visite de l’outil, de la préparation en classe au livre imprimé.",
      thumbnailUrl: `${site}${video.image}`,
      contentUrl: `${site}${video.fichier}`,
      uploadDate: video.publieeLe,
      duration: video.duree,
      inLanguage: "fr-FR",
      publisher: { "@id": organisation },
    });
  }
  return { "@context": "https://schema.org", "@graph": graphe };
}

/**
 * L'« Aide » : ses tutos vidéo, un `VideoObject` chacun, sur le modèle de la visite de l'accueil
 * (F14-AC64) ; seuls les tutos posés, dans l'ordre de la page, puis la vidéo hors série (F14-AC68).
 */
export function donneesDesTutos(site: string): Donnee {
  const organisation = `${site}/#organisation`;
  return {
    "@context": "https://schema.org",
    "@graph": [...TUTOS_POSES, ...HORS_SERIE_POSEES].map((t) => ({
      "@type": "VideoObject",
      "@id": `${site}/aide#${"horsSerie" in t ? "video" : "tuto"}-${t.cle}`,
      name: "horsSerie" in t ? t.titre : `Tuto ${numeroDe(t)} · ${t.titre}`,
      description: t.description,
      thumbnailUrl: `${site}${afficheDe(t)}`,
      contentUrl: `${site}${videoDe(t)}`,
      uploadDate: "horsSerie" in t ? t.poseeLe : TUTOS_POSES_LE,
      duration: dureeIso(t),
      inLanguage: "fr-FR",
      isAccessibleForFree: true,
      publisher: { "@id": organisation },
    })),
  };
}

/** L'« Aide » : ses questions, telles qu'elle les affiche. */
export function donneesDeLAide(questions: { question: string; reponse: string }[]): Donnee {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: questions.map((q) => ({ "@type": "Question", name: q.question, acceptedAnswer: { "@type": "Answer", text: q.reponse } })),
  };
}

/** Le JSON d'une balise `<script type="application/ld+json">`, sans fermeture de balise possible */
export const enJsonLd = (donnee: Donnee): string => JSON.stringify(donnee).replace(/</g, "\\u003c");
