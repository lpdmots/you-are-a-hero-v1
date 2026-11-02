import { ADRESSE_DU_GUIDE } from "./pages-publiques";
import { NOM } from "./presentation";
import { EDITEUR } from "./textes-publics";

/**
 * Le guide « Comment écrire un livre dont vous êtes le héros avec sa classe » (F14, « Mots-clés et
 * pages », F14-AC52, AC53) : la méthode, tirée de la classe du porteur, sur une seule page. Son texte
 * vient du document du guide (`npm run guide:texte`) ; ici, sa forme, ses images et ses données.
 */

export { ADRESSE_DU_GUIDE };

/** La date de mise à jour affichée sous le titre et donnée aux moteurs ; à changer à chaque retouche publiée */
export const DATE_DU_GUIDE = "2026-10-30";

export const AUTEUR_DU_GUIDE = { nom: "Nicolas Coussot", metier: "Professeur des écoles" };

export const DESCRIPTION_DU_GUIDE =
  "La méthode d’un professeur des écoles pour écrire un livre dont vous êtes le héros avec sa classe : inventer l’histoire, répartir l’écriture, organiser les choix, vérifier les chemins, imprimer.";

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
  /** « En bref » : un chiffre, la phrase qui le suit, la question qui le développe */
  enBref: { chiffre: string; texte: string; partie: number }[];
  plusLoin: { libelle: string; adresse: string }[];
  parties: Partie[];
};

/** L'ancre de chaque question, courte et stable : le sommaire et les renvois y mènent */
export const ANCRES = ["pourquoi", "age", "commencer", "inventer", "repartir", "combien", "choix", "relire", "objets", "chemins", "temps", "illustrer", "erreurs"] as const;
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

export type ImageDuGuide = { src: string; alt: string; largeur: number; hauteur: number; legende?: string; portrait?: boolean };

export const COUVERTURES_DU_GUIDE: (ImageDuGuide & { titre: string; note: string })[] = [
  { titre: "Électro Nick", note: "323 passages", src: "/guide/couverture-electro-nick.webp", alt: "Couverture d’« Électro Nick »", largeur: 960, hauteur: 1414 },
  { titre: "Le labyrinthe oublié", note: "213 passages", src: "/guide/couverture-labyrinthe.webp", alt: "Couverture du « Labyrinthe oublié »", largeur: 960, hauteur: 1414 },
  { titre: "Bouquin mène l’enquête", note: "livre d’exemple", src: "/guide/couverture-bouquin.webp", alt: "Couverture de « Bouquin mène l’enquête »", largeur: 666, hauteur: 999 },
];

/** Où se pose l'image d'une question : après le paragraphe qui commence par `apres` (ou la liste qui le suit), avant « Dans ma classe », ou dans l'encart */
export type PlaceDeLImage =
  | { apres: string; image: "couvertures" | "schemas" | ImageDuGuide }
  | { avantDansMaClasse: true; image: ImageDuGuide }
  | { dansLEncart: true; image: ImageDuGuide };

export const IMAGES_DU_GUIDE: Partial<Record<(typeof ANCRES)[number], PlaceDeLImage>> = {
  commencer: { apres: "Montrez que c’est possible.", image: "couvertures" },
  inventer: {
    dansLEncart: true,
    image: { src: "/guide/preparation-heros.webp", alt: "La Préparation d’Il était une classe : sous le héros, ce que la classe retient.", largeur: 2000, hauteur: 1128 },
  },
  combien: { apres: "Faites se rejoindre les chemins.", image: "schemas" },
  objets: {
    avantDansMaClasse: true,
    image: {
      src: "/guide/fiche-aventure-electro-nick.webp",
      alt: "La fiche aventure d’« Électro Nick » : volonté, boulons, rations, unités de temps, bonus aux jets, inventaire.",
      legende: "La fiche d’aventure d’« Électro Nick », notre plus long livre, imprimée au début du livre.",
      largeur: 707,
      hauteur: 1000,
      portrait: true,
    },
  },
  chemins: {
    dansLEncart: true,
    image: {
      src: "/guide/verifier-les-chemins.webp",
      alt: "« Vérifier les chemins » : une scène où aucun chemin ne mène, une autre dont la seule suite est une énigme.",
      largeur: 772,
      hauteur: 1110,
      portrait: true,
    },
  },
  illustrer: {
    apres: "Imprimer.",
    image: {
      src: "/accueil/photo-des-livres.webp",
      alt: "« Le labyrinthe oublié » ouvert sur sa fiche aventure et son premier passage, « Électro Nick » à côté, un crayon et un dé.",
      legende: "Deux de nos livres imprimés : « Le labyrinthe oublié », ouvert sur sa fiche aventure, et « Électro Nick ».",
      largeur: 1300,
      hauteur: 975,
    },
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
        datePublished: DATE_DU_GUIDE,
        dateModified: DATE_DU_GUIDE,
        image: `${site}/accueil/photo-des-livres.webp`,
        author: { "@type": "Person", name: AUTEUR_DU_GUIDE.nom, jobTitle: AUTEUR_DU_GUIDE.metier },
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
