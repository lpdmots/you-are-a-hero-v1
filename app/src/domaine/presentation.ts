import { enEuros, type Offre } from "./offre";
import { EDITEUR, MODELES } from "./textes-publics";

/**
 * Ce que les moteurs et les IA lisent du site (F14-AC48) : `llms.txt` et les données structurées. Tout
 * y reprend ce que les pages publiques disent déjà ; les prix sont ceux des réglages, au moment où la
 * page se compose.
 */

export const NOM = "Il était une classe";
export const PROMESSE = "Votre classe écrit son livre-jeu.";
export const DESCRIPTION =
  "Application web pour écrire un livre-jeu, une histoire dont vous êtes le héros, avec sa classe d’école élémentaire : chaque élève écrit ses scènes, l’application guide l’enseignant à chaque étape, et le livre s’imprime en PDF et se lit en ligne.";

const prix = (centimes: number) => enEuros(centimes).replace(" ", " ");

/** `llms.txt` (llmstxt.org) : ce qu'est l'outil, pour qui, ce qu'il coûte, et où lire la suite. */
export function llmsTxt(offre: Offre, site: string): string {
  const cout = offre.paiementOuvert
    ? [
        `- Gratuit pour un livre jusqu’à ${offre.scenesGratuites} scènes et ${offre.imagesGratuites} images, sans carte bancaire.`,
        `- Pass du livre : ${prix(offre.prixDuPass)} par livre, payé une fois ; il lève ces limites pour ce livre et donne ${offre.etoilesDuPass} étoiles.`,
        `- Les aides de l’IA, pour l’enseignant seulement, se paient en étoiles : ${offre.etoilesOffertes} offertes à l’inscription, ${prix(offre.prixDeLaRecharge)} les ${offre.etoilesDeLaRecharge} de plus. Pas d’abonnement.`,
      ]
    : [`- Gratuit, sans carte bancaire. Les aides de l’IA se paient en étoiles, dont ${offre.etoilesOffertes} offertes à l’inscription.`];
  return [
    `# ${NOM}`,
    "",
    `> ${DESCRIPTION}`,
    "",
    "## Pour qui",
    "",
    "- Les enseignants d’école élémentaire et leur classe, en français : de jeunes auteurs dès 6 ans, l’âge des lecteurs se réglant pour chaque livre.",
    "- Un adulte seul peut aussi écrire son propre livre.",
    "",
    "## Comment se passe un projet",
    "",
    "1. On prépare ensemble, projeté au tableau, étape par étape : le monde, les héros, l’enjeu, puis les chapitres et les scènes.",
    "2. Chaque élève écrit ses scènes, d’abord sur son cahier d’après une fiche de rédaction nominative, puis sur les ordinateurs de la classe ; l’enseignant relit, fait reprendre et valide.",
    "3. Le livre se fait en trois étapes guidées (relire, vérifier les chemins, mettre en page), jusqu’au PDF prêt à imprimer ; les élèves le lisent en ligne avec leur code, et il peut entrer dans la bibliothèque publique du site.",
    "",
    "Une histoire à choix (livre-jeu) ou un récit classique. Rien à installer ; quelques postes suffisent ; les élèves se connectent avec un code de classe, sans adresse électronique. Les élèves n’ont accès à aucune IA.",
    "",
    "## Ce que cela coûte",
    "",
    ...cout,
    "",
    "## Qui le fait",
    "",
    `Conçu par Nicolas, professeur des écoles, dont la classe écrit ses livres-jeux avec les versions successives de l’outil depuis quatre ans. Édité par ${EDITEUR.nom}. Contact : ${EDITEUR.contact}.`,
    "",
    "## Pages",
    "",
    `- [Accueil](${site}/) : l’outil, un projet en trois temps, deux livres écrits par une classe, les prix.`,
    `- [La bibliothèque](${site}/bibliotheque) : des livres écrits par des classes avec l’outil, livres-jeux et récits, à lire en ligne gratuitement, sans compte.`,
    `- [Aide](${site}/aide) : les questions fréquentes, les modèles à télécharger.`,
    `- [Confidentialité](${site}/confidentialite) : les données gardées, l’IA, la mesure d’audience.`,
    `- [Conditions d’utilisation](${site}/conditions)`,
    `- [Mentions légales](${site}/mentions-legales)`,
    ...MODELES.map((m) => `- [${m.nom}](${site}/modeles/${m.cle}) : ${m.pour}`),
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
  if (offre.paiementOuvert) {
    offres.push(
      { "@type": "Offer", name: "Pass du livre", price: (offre.prixDuPass / 100).toFixed(2), priceCurrency: "EUR", description: `Par livre, payé une fois : sans limite de scènes ni d’images, et ${offre.etoilesDuPass} étoiles.` },
      { "@type": "Offer", name: `${offre.etoilesDeLaRecharge} étoiles`, price: (offre.prixDeLaRecharge / 100).toFixed(2), priceCurrency: "EUR", description: "Une recharge d’étoiles pour les aides de l’IA." },
    );
  }
  const graphe: Donnee[] = [
    {
      "@type": "Organization",
      "@id": organisation,
      name: NOM,
      url: `${site}/`,
      logo: `${site}/icon.svg`,
      email: EDITEUR.contact,
      founder: { "@type": "Person", name: "Nicolas", jobTitle: "Professeur des écoles" },
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
