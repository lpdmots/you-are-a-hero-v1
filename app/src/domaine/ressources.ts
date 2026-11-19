/**
 * Les documents à imprimer de la page « Ressources » (F14, « Page « Ressources » », F14-AC55 à AC61).
 * Leurs sources sont dans `ressources/` à la racine du dépôt ; `node ressources/composer.mjs <cle>` écrit leurs
 * PDF et la vignette de leur première feuille dans `public/ressources/`, que le site sert tels quels. Cette
 * liste dit ce que la page montre : un test vérifie que chaque fichier annoncé existe, et qu'aucun n'est oublié.
 */

/** L'adresse de la page */
export const ADRESSE_DES_RESSOURCES = "/ressources";

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
  /** Dans l'ordre des boutons ; la version complète (`<cle>.pdf`) est celle de la vignette */
  versions: readonly VersionDuDocument[];
  /** Ne sert qu'avec Il était une classe (F14-AC57) */
  avecLOutil?: true;
};

export type TempsDuProjet = {
  cle: string;
  /** « Temps 1 »… ; absent pour le bloc « Pour mener le projet » */
  numero?: number;
  titre: string;
  phrase: string;
  documents: readonly DocumentAImprimer[];
};

const pdf = (fichier: string) => `${ADRESSE_DES_RESSOURCES}/${fichier}.pdf`;

/** La vignette d'un document : la première feuille de sa version complète, qu'un clic ouvre (F14-AC56) */
export const vignetteDe = (d: DocumentAImprimer) => `${ADRESSE_DES_RESSOURCES}/${d.cle}.jpg`;
export const versionCompleteDe = (d: DocumentAImprimer) => pdf(d.cle);

/** Le bloc d'ouverture, puis les quatre temps du déroulé, les documents dans l'ordre du déroulé */
export const TEMPS_DU_PROJET: readonly TempsDuProjet[] = [
  {
    cle: "mener-le-projet",
    titre: "Pour mener le projet",
    phrase: "Deux documents pour l'enseignant, du premier jour au livre imprimé.",
    documents: [
      {
        cle: "deroule-du-projet",
        titre: "Le déroulé du projet",
        phrase: "Les quatre temps et les quatorze étapes du projet, avec ce qui sert à chacune.",
        format: "A4 recto verso",
        versions: [{ libelle: "Télécharger", fichier: pdf("deroule-du-projet") }],
      },
      {
        cle: "programmes",
        titre: "Le livre-jeu et les programmes",
        phrase: "Ce que le projet fait travailler, en regard des programmes de français des cycles 2 et 3, cités mot pour mot.",
        format: "A4 recto verso : cycle 3 au recto, cycle 2 au verso",
        versions: [{ libelle: "Télécharger", fichier: pdf("programmes") }],
      },
    ],
  },
  {
    cle: "decouvrir-le-genre",
    numero: 1,
    titre: "Découvrir le genre",
    phrase: "On lit des livres-jeux, on cherche comment ils marchent, puis une leçon range ce qu'on a trouvé.",
    documents: [
      {
        cle: "lettre-aux-familles",
        titre: "Lettre aux familles",
        phrase:
          "Au début, la lettre qui présente le projet, avec le coupon d'autorisation en bas ; à la fin, le bon de précommande du livre.",
        format: "Lettre A4 ; bon A5, deux par feuille ; coupon seul, trois par feuille",
        versions: [
          { libelle: "Lettre et bon de précommande", fichier: pdf("lettre-aux-familles") },
          { libelle: "Coupon seul", fichier: pdf("lettre-aux-familles-coupon") },
        ],
      },
      {
        cle: "recherche-bouquin",
        titre: "Recherche sur « Bouquin mène l'enquête »",
        phrase: "L'élève lit et joue le livre d'exemple du site, puis cherche comment il est construit : choix, indices, hasard, fins.",
        format: "4 pages A4",
        versions: [
          { libelle: "Fiche de l'élève", fichier: pdf("recherche-bouquin-a-completer") },
          { libelle: "Corrigé", fichier: pdf("recherche-bouquin") },
        ],
      },
      {
        cle: "recherche-passeurs",
        titre: "Recherche sur « Les passeurs de brume »",
        phrase: "La même recherche sur le second livre d'exemple du site, plus long, raconté au passé.",
        format: "4 pages A4",
        versions: [
          { libelle: "Fiche de l'élève", fichier: pdf("recherche-passeurs-a-completer") },
          { libelle: "Corrigé", fichier: pdf("recherche-passeurs") },
        ],
      },
      {
        cle: "recherche-livre-jeu",
        titre: "Recherche pour tout livre-jeu",
        phrase: "La recherche pour n'importe quel livre dont vous êtes le héros de la bibliothèque de la classe.",
        format: "4 pages A4",
        versions: [
          { libelle: "Fiche de l'élève", fichier: pdf("recherche-livre-jeu-a-completer") },
          { libelle: "Exemples de réponses", fichier: pdf("recherche-livre-jeu") },
        ],
      },
      {
        cle: "lecon-1-livre-jeu",
        titre: "Leçon 1 · Le livre dont tu es le héros",
        phrase: "Les scènes numérotées, les chemins et les fins, les règles du jeu, qui raconte et à quel temps.",
        format: "3 pages A4",
        versions: [
          { libelle: "Version complète", fichier: pdf("lecon-1-livre-jeu") },
          { libelle: "Version à compléter", fichier: pdf("lecon-1-livre-jeu-a-completer") },
        ],
      },
      {
        cle: "lecon-2-choix",
        titre: "Leçon 2 · Les choix",
        phrase: "Inventer des choix qui font réfléchir le lecteur, sans dévoiler la suite.",
        format: "3 pages A4",
        versions: [
          { libelle: "Version complète", fichier: pdf("lecon-2-choix") },
          { libelle: "Version à compléter", fichier: pdf("lecon-2-choix-a-completer") },
        ],
      },
    ],
  },
  {
    cle: "preparer-l-histoire",
    numero: 2,
    titre: "Préparer l'histoire",
    phrase: "La classe invente ensemble l'univers et le héros ; chaque élève prépare ensuite son chapitre.",
    documents: [
      {
        cle: "mon-chapitre",
        titre: "Mon chapitre",
        phrase: "L'élève prépare ce qui arrive au héros dans son chapitre, ses obstacles et ce qu'il peut gagner ou perdre.",
        format: "A4 recto verso ; feuille « Un obstacle » en recto verso",
        versions: [
          { libelle: "Exemple rempli", fichier: pdf("mon-chapitre") },
          { libelle: "Feuille vierge", fichier: pdf("mon-chapitre-a-completer") },
          { libelle: "Feuille « Un obstacle »", fichier: pdf("mon-chapitre-obstacles") },
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
        phrase: "Les quatre moments d'une scène à choix, développer, rester fidèle au livre, glisser un indice, se relire.",
        format: "3 pages A4",
        versions: [
          { libelle: "Version complète", fichier: pdf("lecon-3-scene") },
          { libelle: "Version à compléter", fichier: pdf("lecon-3-scene-a-completer") },
        ],
      },
      {
        cle: "affiches",
        titre: "Quatre affiches pour la classe",
        phrase: "Une scène de livre-jeu, les chemins, inventer des choix, écrire sa scène : les leçons en grand, lisibles de loin.",
        format: "4 affiches A4, à agrandir en A3",
        versions: [{ libelle: "Télécharger", fichier: pdf("affiches") }],
      },
      {
        cle: "sur-le-site",
        titre: "J'écris sur le site",
        phrase: "Pour l'élève : entrer dans la classe, trouver sa scène, l'écrire, la remettre, la reprendre et tester son chapitre.",
        format: "A4 recto verso, avec les écrans du site",
        versions: [{ libelle: "Télécharger", fichier: pdf("sur-le-site") }],
        avecLOutil: true,
      },
    ],
  },
  {
    cle: "fabriquer-et-faire-vivre",
    numero: 4,
    titre: "Fabriquer le livre et le faire vivre",
    phrase:
      "On met en page, on imprime, on lit le livre en ligne et on le fait lire. Le bon de précommande est la seconde feuille de la lettre aux familles.",
    documents: [],
  },
];

/** Tous les documents, dans l'ordre de la page */
export const DOCUMENTS_A_IMPRIMER: readonly DocumentAImprimer[] = TEMPS_DU_PROJET.flatMap((t) => t.documents);
