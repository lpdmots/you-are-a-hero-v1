import { ADRESSE_DU_GUIDE } from "./pages-publiques";
import { NOM } from "./presentation";
import { EDITEUR } from "./textes-publics";

/**
 * Le guide « Comment écrire un livre dont vous êtes le héros en classe » (F14, « Mots-clés et
 * pages », F14-AC52, AC53) : la méthode, tirée de la classe du porteur, sur une seule page. Son texte
 * vient du document du guide (`npm run guide:texte`) ; ici, sa forme, ses images et ses données.
 */

export { ADRESSE_DU_GUIDE };

/** La date de publication, donnée aux moteurs : celle du jour où le guide est mis en ligne, puis fixe */
export const DATE_DE_PUBLICATION_DU_GUIDE = "2026-10-30";

/** La date de mise à jour affichée sous le titre, donnée aux moteurs et au plan du site ; à changer à chaque retouche publiée */
export const DATE_DU_GUIDE = "2026-10-30";

export const AUTEUR_DU_GUIDE = { nom: "Nicolas Coussot", metier: "Professeur des écoles" };

/** L'image de partage du guide, 1200 × 630, servie de `public/` : l'aperçu des réseaux et l'une des images de l'article */
export const IMAGE_DE_PARTAGE_DU_GUIDE = {
  src: "/guide/partage.jpg",
  largeur: 1200,
  hauteur: 630,
  alt: "« Le labyrinthe oublié » ouvert sur sa feuille d’aventure, à côté d’« Électro Nick » : deux livres-jeux écrits par une classe et imprimés.",
};

/** 150 signes : Google coupe une description vers 155 (audit du 7 novembre 2026) */
export const DESCRIPTION_DU_GUIDE =
  "La méthode d’un professeur des écoles, en 14 questions, pour écrire un livre dont vous êtes le héros en classe : histoire, choix, chemins, impression.";

export type Bloc =
  | { sorte: "paragraphe"; tete: string | null; texte: string }
  | { sorte: "intertitre"; texte: string }
  | { sorte: "liste"; elements: string[]; ordonnee?: boolean }
  | { sorte: "tableau"; entete: string[]; rangs: string[][] }
  | { sorte: "classe"; texte: string; elements?: string[] }
  /** Un exemple de consigne, montré comme la fiche que l'élève reçoit */
  | { sorte: "exemple"; titre: string; texte: string; rappel: string; elements?: string[] }
  | { sorte: "encart"; texte: string };

export type Partie = { numero: number; titre: string; blocs: Bloc[] };

export type TexteDuGuide = {
  titre: string;
  definition: string;
  auteur: string;
  /** La note de l'auteur sous sa ligne : un retour d'expérience, pas des règles */
  avantDeCommencer: string;
  /** « En bref » : un chiffre, la phrase qui le suit, la question qui le développe */
  enBref: { chiffre: string; texte: string; partie: number }[];
  /** « Pour aller plus loin » : des lectures sur d'autres sites, chacune avec ce qu'elle apporte */
  lectures: string[];
  /** La fin de la page, sur la feuille qui répond à la page de titre : un titre à la main, une phrase */
  fin: { titre: string; texte: string };
  plusLoin: { libelle: string; adresse: string }[];
  parties: Partie[];
};

/** L'ancre de chaque question, courte et stable : le sommaire et les renvois y mènent */
export const ANCRES = ["pourquoi", "age", "commencer", "inventer", "repartir", "combien", "choix", "relire", "objets", "chemins", "temps", "illustrer", "ia", "erreurs"] as const;
export const ancreDe = (numero: number) => ANCRES[numero - 1];

// ——— Le texte en ligne : gras, italique, liens, renvois aux autres questions ———

export type Morceau =
  | { sorte: "texte"; texte: string }
  | { sorte: "gras"; texte: string }
  | { sorte: "italique"; texte: string }
  | { sorte: "lien"; texte: string; adresse: string; italique?: boolean }
  | { sorte: "renvoi"; titre: string; numero: number };

/** Découpe un texte du guide ; « (voir « Titre ? ») » devient un renvoi à la question de ce titre. */
export function morceaux(texte: string, parties: Pick<Partie, "numero" | "titre">[]): Morceau[] {
  const motif = /\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*|\*([^*]+)\*|\(voir «\s?([^»]+?)\s?»\)/g;
  const out: Morceau[] = [];
  let fin = 0;
  for (const m of texte.matchAll(motif)) {
    if (m.index > fin) out.push({ sorte: "texte", texte: texte.slice(fin, m.index) });
    if (m[1]) {
      // Un titre d'œuvre en italique peut être le texte du lien : « [*Titre*](adresse) »
      const titre = m[1].match(/^\*([^*]+)\*$/);
      out.push(titre ? { sorte: "lien", texte: titre[1], adresse: m[2], italique: true } : { sorte: "lien", texte: m[1], adresse: m[2] });
    }
    else if (m[3]) out.push({ sorte: "gras", texte: m[3] });
    else if (m[4]) out.push({ sorte: "italique", texte: m[4] });
    else {
      const titre = m[5].trim();
      const partie = parties.find((p) => p.titre === titre);
      out.push(partie ? { sorte: "renvoi", titre, numero: partie.numero } : { sorte: "texte", texte: m[0] });
    }
    fin = m.index + m[0].length;
  }
  if (fin < texte.length) out.push({ sorte: "texte", texte: texte.slice(fin) });
  return out;
}

// ——— Les images : une par question au plus, aucune pour décorer (maquette A2, 30 octobre 2026) ———

export type ImageDuGuide = {
  src: string;
  alt: string;
  largeur: number;
  hauteur: number;
  legende?: string;
  portrait?: boolean;
  /** Sur téléphone, la même capture cadrée plus serré */
  telephone?: { src: string; largeur: number; hauteur: number };
  /** Une image montrée moins large que la colonne et centrée sur grand écran (l'arbre des chemins) */
  moyenne?: boolean;
};

export const COUVERTURES_DU_GUIDE: (ImageDuGuide & { titre: string; note: string })[] = [
  { titre: "Électro Nick", note: "323 scènes", src: "/guide/couverture-electro-nick.webp", alt: "Couverture d’« Électro Nick »", largeur: 960, hauteur: 1414 },
  { titre: "Le labyrinthe oublié", note: "213 scènes", src: "/guide/couverture-labyrinthe.webp", alt: "Couverture du « Labyrinthe oublié »", largeur: 960, hauteur: 1414 },
  { titre: "Bouquin mène l’enquête", note: "livre d’exemple", src: "/guide/couverture-bouquin.webp", alt: "Couverture de « Bouquin mène l’enquête »", largeur: 666, hauteur: 999 },
];

/** Où se pose l'image d'une question : après le paragraphe qui commence par `apres` (ou la liste ou le tableau qui le suit), avant ou après « Dans ma classe » */
export type PlaceDeLImage =
  | { apres: string; image: "couvertures" | "schemas" | ImageDuGuide }
  | { avantDansMaClasse: true; image: ImageDuGuide }
  | { apresDansMaClasse: true; image: ImageDuGuide };

export const IMAGES_DU_GUIDE: Partial<Record<(typeof ANCRES)[number], PlaceDeLImage>> = {
  commencer: { apres: "Montrez que c’est possible.", image: "couvertures" },
  combien: { apres: "Faites se rejoindre les chemins.", image: "schemas" },
  objets: {
    apresDansMaClasse: true,
    image: {
      src: "/guide/fiche-aventure-electro-nick.webp",
      alt: "La feuille d’aventure d’« Électro Nick » : volonté, boulons, rations, unités de temps, bonus aux jets, inventaire.",
      legende: "La feuille d’aventure d’« Électro Nick », un système riche pour un long livre.",
      largeur: 707,
      hauteur: 1000,
      portrait: true,
    },
  },
  // L'arbre des chemins d'un petit chapitre, sous « Contrôlez les liens » (partie 10)
  chemins: {
    apres: "Contrôlez les liens.",
    image: {
      src: "/guide/chemins-le-pont-effondre.webp",
      // Sur téléphone, l'énigme et les trois chemins qui se rejoignent sur la rive : l'arbre entier y tombait à 5 points
      telephone: { src: "/guide/chemins-le-pont-effondre-telephone.webp", largeur: 1062, hauteur: 1080 },
      alt: "La vue « Chemins » d’un chapitre : une énigme devant un pont effondré, quatre façons de traverser ; trois chemins se rejoignent sur la rive, le quatrième passe par une barque, et tous mènent au chapitre suivant.",
      legende: "« Le pont effondré », un chapitre du livre d’exemple « Les passeurs de brume » : quatre façons de traverser, trois chemins qui se rejoignent.",
      largeur: 1200,
      hauteur: 947,
      moyenne: true,
    },
  },
  // La photo des livres ouvre la page sur le résultat (partie 1)
  pourquoi: {
    apres: "C’est un livre\u00a0! Un vrai.",
    image: {
      src: "/accueil/photo-des-livres.webp",
      alt: "« Le labyrinthe oublié » ouvert sur sa feuille d’aventure et sa première scène, « Électro Nick » à côté, un crayon et un dé.",
      legende: "« Le labyrinthe oublié », ouvert sur sa feuille d’aventure, et « Électro Nick », imprimés.",
      largeur: 1300,
      hauteur: 975,
    },
  },
};

/** Du livre à la scène (partie 4), en deux captures de l'application, sous « Découpez l'aventure » */
export const DECOUPAGE_EN_IMAGES: ImageDuGuide[] = [
  {
    src: "/guide/partie-la-foret-engloutie.webp",
    telephone: { src: "/guide/partie-la-foret-engloutie-telephone.webp", largeur: 768, hauteur: 760 },
    alt: "Une partie et ses chapitres, chacun avec son image, son nombre de scènes et les élèves à qui il est confié.",
    legende: "Dans Il était une classe, une partie et ses chapitres, chacun confié à quelques élèves.",
    largeur: 1600,
    hauteur: 514,
  },
  {
    src: "/guide/chapitre-la-lisiere.webp",
    telephone: { src: "/guide/chapitre-la-lisiere-telephone.webp", largeur: 768, hauteur: 1612 },
    alt: "Un chapitre et ses scènes, chacune avec son état et l’élève qui s’en occupe.",
    legende: "Puis un chapitre et ses scènes, chacune avec l’élève qui s’en occupe.",
    largeur: 1600,
    hauteur: 706,
  },
];

/**
 * La capture d'un encart, cadrée sur ce qu'il annonce (revue des encarts, 3 novembre 2026) : le Suivi,
 * les scènes voisines, le livre composé. Prises sur le site local ; l'encart des chemins n'en a pas,
 * l'arbre d'un chapitre se montre sous « Contrôlez les liens ».
 */
export const IMAGES_DES_ENCARTS: Partial<Record<(typeof ANCRES)[number], ImageDuGuide>> = {
  repartir: {
    src: "/guide/suivi.webp",
    telephone: { src: "/guide/suivi-telephone.webp", largeur: 736, hauteur: 1240 },
    alt: "Le Suivi d’un chapitre : chaque scène avec son état (à valider, à reprendre, validée, prête, en cours) et l’élève qui s’en occupe.",
    largeur: 1600,
    hauteur: 807,
  },
  relire: {
    src: "/guide/scenes-voisines.webp",
    telephone: { src: "/guide/scenes-voisines-telephone.webp", largeur: 736, hauteur: 1780 },
    alt: "Une scène en cours d’écriture, avec au-dessus la fin de la scène qui y mène et au-dessous le début de celle qui suit.",
    largeur: 1600,
    hauteur: 1207,
  },
  illustrer: {
    src: "/guide/livre-compose-electro-nick.webp",
    telephone: { src: "/guide/livre-compose-electro-nick-telephone.webp", largeur: 800, hauteur: 640 },
    alt: "Une double page d’« Électro Nick » composée par le site : les scènes 57 à 59, leurs illustrations et leurs choix.",
    largeur: 1600,
    hauteur: 1135,
  },
};

// ——— Ce que lisent les moteurs et les IA (F14-AC53) ———

/** Le texte brut d'un texte du guide, sans ses marques, pour les données structurées */
export const sansMarques = (t: string) =>
  t
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1");

/** L'article et son fil d'Ariane, pour `<script type="application/ld+json">` */
export function donneesDuGuide(texte: TexteDuGuide, site: string): Record<string, unknown> {
  const adresse = `${site}${ADRESSE_DU_GUIDE}`;
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        "@id": `${adresse}#article`,
        headline: texte.titre,
        description: DESCRIPTION_DU_GUIDE,
        abstract: sansMarques(texte.definition),
        url: adresse,
        mainEntityOfPage: adresse,
        inLanguage: "fr-FR",
        datePublished: DATE_DE_PUBLICATION_DU_GUIDE,
        dateModified: DATE_DU_GUIDE,
        // Deux formats, comme Google le recommande : la photo des livres (4:3) et l'image de partage (1,9:1)
        image: [`${site}/accueil/photo-des-livres.webp`, `${site}${IMAGE_DE_PARTAGE_DU_GUIDE.src}`],
        // Le même auteur que le fondateur de l'accueil, par son identifiant (audit du 7 novembre 2026)
        author: { "@type": "Person", "@id": `${site}/#nicolas`, name: AUTEUR_DU_GUIDE.nom, jobTitle: AUTEUR_DU_GUIDE.metier, url: `${site}/` },
        publisher: { "@type": "Organization", "@id": `${site}/#organisation`, name: NOM, email: EDITEUR.contact },
        about: ["Livre dont vous êtes le héros", "Livre-jeu", "Écriture collaborative en classe"],
        audience: { "@type": "EducationalAudience", educationalRole: "teacher" },
        hasPart: texte.parties.map((p) => ({ "@type": "WebPageElement", name: p.titre, url: `${adresse}#${ancreDe(p.numero)}` })),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: NOM, item: `${site}/` },
          { "@type": "ListItem", position: 2, name: texte.titre, item: adresse },
        ],
      },
    ],
  };
}
