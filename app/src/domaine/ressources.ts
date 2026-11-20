/**
 * Les documents à imprimer de la page « Ressources » (F14, « Page « Ressources » », F14-AC55 à AC61).
 * Leurs sources sont dans `ressources/` à la racine du dépôt ; `node ressources/composer.mjs <cle>` écrit leurs
 * PDF et la vignette de leur première feuille dans `public/ressources/`, que le site sert tels quels. Cette
 * liste dit ce que la page montre : un test vérifie que chaque fichier annoncé existe, et qu'aucun n'est oublié.
 */

/** L'adresse de la page */
export const ADRESSE_DES_RESSOURCES = "/ressources";

/** La date de mise à jour de la page, sans date par document (F14, « Précisions ») */
export const DATE_DES_RESSOURCES = "2026-11-19";

/** Titre d'onglet, grand titre et description, arrêtés à l'entretien du 19 novembre 2026 (F14, « Titre et niveaux ») */
export const TITRE_DES_RESSOURCES = "Production d’écrit et projet d’écriture : le livre-jeu en classe";
export const GRAND_TITRE_DES_RESSOURCES = "Un projet d’écriture en classe : le livre dont vous êtes le héros";
export const DESCRIPTION_DES_RESSOURCES =
  "Leçons, fiches de recherche, affiches et lettre aux familles à imprimer pour mener un projet d’écriture de livre-jeu, du CE1 au CM2 (7 à 11 ans), avec les liens aux programmes. Gratuit.";

/** La licence des documents (F14, « Accès libre ») */
export const LICENCE_DES_RESSOURCES = { nom: "CC BY-NC 4.0", adresse: "https://creativecommons.org/licenses/by-nc/4.0/deed.fr" };

/** Une version d'un document : un PDF et le nom de son bouton */
export type VersionDuDocument = { libelle: string; fichier: string };

export type DocumentAImprimer = {
  /** Le nom du dossier source, de la vignette et de l'ancre sur la page */
  cle: string;
  titre: string;
  /** À quoi il sert et quand, en une phrase */
  phrase: string;
  /** Format, pages, recto verso */
  format: string;
  /** Dans l'ordre des boutons, la feuille de l'élève d'abord ; la version complète (`<cle>.pdf`) est celle de la vignette */
  versions: readonly VersionDuDocument[];
  /** Ne sert qu'avec Il était une classe (F14-AC57) */
  avecLOutil?: true;
  /**
   * Un tirage d'un autre document, montré à part (le bon de précommande, seconde feuille de la lettre) : le fichier
   * sans `.pdf` qui donne la vignette et que la vignette ouvre, et sa feuille posée en largeur.
   */
  tirage?: { fichier: string; paysage?: true };
  /** Le livre de la bibliothèque du site sur lequel porte le document */
  livre?: { titre: string; adresse: string };
};

export type TempsDuProjet = {
  cle: string;
  /** « Temps 1 »… ; absent pour le bloc « Pour mener le projet » */
  numero?: number;
  titre: string;
  phrase: string;
  /** Un renvoi après la phrase, vers une autre page (la partie du guide sur la fabrication, au temps 4) */
  renvoi?: { avant: string; lien: string; adresse: string; apres: string };
  documents: readonly DocumentAImprimer[];
};

const pdf = (fichier: string) => `${ADRESSE_DES_RESSOURCES}/${fichier}.pdf`;

/** La vignette d'un document : la première feuille de sa version complète, qu'un clic ouvre (F14-AC56) */
export const vignetteDe = (d: DocumentAImprimer) => `${ADRESSE_DES_RESSOURCES}/${d.tirage?.fichier ?? d.cle}.jpg`;
export const versionCompleteDe = (d: DocumentAImprimer) => pdf(d.tirage?.fichier ?? d.cle);

/**
 * Ce que montre la vignette, quand ce n'est pas la version du premier bouton (« Corrigé », « Version complète »,
 * « Exemple rempli ») : la feuille de l'élève passe d'abord, la vignette montre la version complète.
 */
export const apercuDe = (d: DocumentAImprimer) => (d.versions[0]?.fichier === versionCompleteDe(d) ? undefined : d.versions.find((v) => v.fichier === versionCompleteDe(d))?.libelle);

/** Le bloc d'ouverture, puis les quatre temps du déroulé, les documents dans l'ordre du déroulé */
export const TEMPS_DU_PROJET: readonly TempsDuProjet[] = [
  {
    cle: "mener-le-projet",
    titre: "Pour mener le projet",
    phrase: "Deux documents pour l’enseignant, du premier jour au livre imprimé.",
    documents: [
      {
        cle: "deroule-du-projet",
        titre: "Le déroulé du projet",
        phrase: "Les quatre temps et les quatorze étapes du projet, avec ce qui sert à chacune.",
        format: "A4 recto verso",
        versions: [{ libelle: "Ouvrir le PDF", fichier: pdf("deroule-du-projet") }],
      },
      {
        cle: "programmes",
        titre: "Le livre-jeu et les programmes",
        phrase: "Ce que le projet fait travailler, en regard des programmes de français des cycles 2 et 3, cités mot pour mot.",
        format: "A4 recto verso : cycle 3 au recto, cycle 2 au verso",
        versions: [{ libelle: "Ouvrir le PDF", fichier: pdf("programmes") }],
      },
    ],
  },
  {
    cle: "decouvrir-le-genre",
    numero: 1,
    titre: "Découvrir le genre",
    phrase: "La lettre aux familles part dès le début. Puis on lit des livres-jeux, on cherche comment ils marchent avec la feuille de recherche du livre lu, et une leçon range ce qu’on a trouvé.",
    documents: [
      {
        cle: "lettre-aux-familles",
        titre: "Lettre aux familles",
        phrase:
          "Au début, la lettre qui présente le projet, avec le coupon d’autorisation en bas ; à la fin, le bon de précommande du livre.",
        format: "Lettre A4 ; bon A5, deux par feuille ; coupon seul, trois par feuille",
        versions: [
          { libelle: "Lettre et bon de précommande", fichier: pdf("lettre-aux-familles") },
          { libelle: "Coupon seul", fichier: pdf("lettre-aux-familles-coupon") },
        ],
      },
      {
        cle: "recherche-bouquin",
        titre: "Recherche sur « Bouquin mène l’enquête »",
        phrase: "Si la classe lit ce livre d’exemple, en ligne sur le site, l’élève le joue, puis cherche comment il est construit : choix, indices, hasard, fins.",
        livre: { titre: "Lire le livre en ligne", adresse: "/bibliotheque/bouquin-mene-l-enquete" },
        format: "4 pages A4",
        versions: [
          { libelle: "Fiche de l’élève", fichier: pdf("recherche-bouquin-a-completer") },
          { libelle: "Corrigé", fichier: pdf("recherche-bouquin") },
        ],
      },
      {
        cle: "recherche-passeurs",
        titre: "Recherche sur « Les passeurs de brume »",
        phrase: "La même recherche pour cet autre livre d’exemple, plus long, raconté au passé.",
        livre: { titre: "Lire le livre en ligne", adresse: "/bibliotheque/les-passeurs-de-brume" },
        format: "4 pages A4",
        versions: [
          { libelle: "Fiche de l’élève", fichier: pdf("recherche-passeurs-a-completer") },
          { libelle: "Corrigé", fichier: pdf("recherche-passeurs") },
        ],
      },
      {
        cle: "recherche-livre-jeu",
        titre: "Recherche pour tout livre-jeu",
        phrase: "La même recherche pour tout autre livre dont vous êtes le héros, de la classe, de l’école ou de la bibliothèque du site.",
        format: "4 pages A4",
        versions: [
          { libelle: "Fiche de l’élève", fichier: pdf("recherche-livre-jeu-a-completer") },
          { libelle: "Exemples de réponses", fichier: pdf("recherche-livre-jeu") },
        ],
      },
      {
        cle: "lecon-1-livre-jeu",
        titre: "Leçon 1 · Le livre dont tu es le héros",
        phrase: "Les scènes numérotées, les chemins et les fins, les règles du jeu, qui raconte et à quel temps.",
        format: "3 pages A4",
        versions: [
          { libelle: "Version à compléter", fichier: pdf("lecon-1-livre-jeu-a-completer") },
          { libelle: "Version complète", fichier: pdf("lecon-1-livre-jeu") },
        ],
      },
      {
        cle: "lecon-2-choix",
        titre: "Leçon 2 · Les choix",
        phrase: "Inventer des choix qui font réfléchir le lecteur, sans dévoiler la suite.",
        format: "3 pages A4",
        versions: [
          { libelle: "Version à compléter", fichier: pdf("lecon-2-choix-a-completer") },
          { libelle: "Version complète", fichier: pdf("lecon-2-choix") },
        ],
      },
    ],
  },
  {
    cle: "preparer-l-histoire",
    numero: 2,
    titre: "Préparer l’histoire",
    phrase: "La classe invente ensemble l’univers et le héros ; chaque élève prépare ensuite son chapitre.",
    documents: [
      {
        cle: "mon-chapitre",
        titre: "Mon chapitre",
        phrase: "L’élève prépare ce qui arrive au héros dans son chapitre, ses obstacles et ce qu’il peut gagner ou perdre.",
        format: "Feuilles A4 recto verso",
        versions: [
          { libelle: "Feuille vierge", fichier: pdf("mon-chapitre-a-completer") },
          { libelle: "Exemple rempli", fichier: pdf("mon-chapitre") },
          { libelle: "Feuille « Un obstacle »", fichier: pdf("mon-chapitre-obstacles") },
        ],
      },
    ],
  },
  {
    cle: "ecrire-et-relire",
    numero: 3,
    titre: "Écrire et relire",
    phrase: "Chacun écrit ses scènes, les relit et les reprend, puis teste les chemins, à son rythme.",
    documents: [
      {
        cle: "lecon-3-scene",
        titre: "Leçon 3 · Écrire une scène",
        phrase: "Les quatre moments d’une scène à choix, développer, rester fidèle au livre, glisser un indice, se relire.",
        format: "3 pages A4",
        versions: [
          { libelle: "Version à compléter", fichier: pdf("lecon-3-scene-a-completer") },
          { libelle: "Version complète", fichier: pdf("lecon-3-scene") },
        ],
      },
      {
        cle: "affiches",
        titre: "Quatre affiches pour la classe",
        phrase: "Une scène de livre-jeu, les chemins, inventer des choix, écrire sa scène : les leçons en grand, lisibles de loin.",
        format: "4 affiches A4, à agrandir en A3",
        versions: [{ libelle: "Ouvrir le PDF", fichier: pdf("affiches") }],
      },
      {
        cle: "sur-le-site",
        titre: "J’écris sur le site",
        phrase: "Pour l’élève : entrer dans la classe, trouver sa scène, l’écrire, la remettre, la reprendre et tester son chapitre.",
        format: "A4 recto verso, avec les écrans du site",
        versions: [{ libelle: "Ouvrir le PDF", fichier: pdf("sur-le-site") }],
        avecLOutil: true,
      },
    ],
  },
  {
    cle: "fabriquer-et-faire-vivre",
    numero: 4,
    titre: "Fabriquer le livre et le faire vivre",
    phrase: "On met le livre en page, on l’imprime, on le lit en ligne et on le fait lire, à sa classe ou à une autre.",
    renvoi: { avant: "Le guide explique comment ", lien: "illustrer, imprimer et partager le livre", adresse: "/guide/ecrire-un-livre-dont-vous-etes-le-heros#illustrer", apres: "." },
    documents: [
      {
        cle: "bon-de-precommande",
        titre: "Bon de précommande",
        phrase: "Quand le livre est prêt et son prix connu : les familles le commandent si elles le souhaitent, l’achat restant facultatif.",
        format: "A5, deux par feuille A4 posée en largeur ; la seconde feuille de la lettre aux familles",
        tirage: { fichier: "lettre-aux-familles-bon", paysage: true },
        versions: [{ libelle: "Ouvrir le PDF", fichier: pdf("lettre-aux-familles-bon") }],
      },
    ],
  },
];

/** Tous les documents, dans l'ordre de la page */
export const DOCUMENTS_A_IMPRIMER: readonly DocumentAImprimer[] = TEMPS_DU_PROJET.flatMap((t) => t.documents);

/**
 * Les données de la page pour les moteurs et les IA (F14-AC59) : une collection de documents gratuits, chacun avec
 * son PDF principal, sa licence et ses niveaux.
 */
export function donneesDesRessources(site: string) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: TITRE_DES_RESSOURCES,
    headline: GRAND_TITRE_DES_RESSOURCES,
    description: DESCRIPTION_DES_RESSOURCES,
    url: `${site}${ADRESSE_DES_RESSOURCES}`,
    inLanguage: "fr",
    dateModified: DATE_DES_RESSOURCES,
    isAccessibleForFree: true,
    license: LICENCE_DES_RESSOURCES.adresse,
    hasPart: DOCUMENTS_A_IMPRIMER.map((d) => ({
      "@type": "LearningResource",
      name: d.titre,
      description: d.phrase,
      url: `${site}${versionCompleteDe(d)}`,
      encodingFormat: "application/pdf",
      image: `${site}${vignetteDe(d)}`,
      inLanguage: "fr",
      isAccessibleForFree: true,
      license: LICENCE_DES_RESSOURCES.adresse,
      educationalLevel: ["CE1", "CE2", "CM1", "CM2"],
    })),
  };
}
