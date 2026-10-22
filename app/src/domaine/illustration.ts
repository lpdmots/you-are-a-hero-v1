/**
 * Les images de l'histoire (F10.2) : le style du projet, les personnages et les objets qui
 * reviennent, et les prompts que l'application assemble elle-même pour leurs images de
 * référence. Les prompts sont en français, lisibles et faciles à retoucher ; la fiche visuelle
 * s'y reprend mot pour mot, pour qu'un personnage reste le même d'une image à l'autre.
 */

/**
 * Les styles proposés, décrits par leur technique, jamais par le nom d'un artiste ni d'un
 * studio (F10.2, 17 octobre 2026). « Illustration 2D lumineuse » est le style des images de
 * l'application, proposé par défaut.
 */
export const STYLES = ["lumineuse", "aquarelle", "crayons", "photo", "volume", "bd", "pixel", "encre", "autre"] as const;
export type Style = (typeof STYLES)[number];
export const estStyle = (v: unknown): v is Style => typeof v === "string" && (STYLES as readonly string[]).includes(v);
export const STYLE_PAR_DEFAUT = "lumineuse" satisfies Style;
export const STYLE_AUTRE_MAX = 300;

export const STYLES_DES_IMAGES: Record<Exclude<Style, "autre">, { nom: string; prompt: string }> = {
  lumineuse: {
    nom: "Illustration 2D lumineuse",
    // Réécrit les 18 et 19 octobre 2026 à la demande du porteur, pour rejoindre les visuels de
    // l'application : d'abord trop pastel (« couleurs claires »), puis trop chargé et peint ; ici simple,
    // lisse, vif, peu détaillé, jugé sur des essais à côté de ses visuels
    prompt: "illustration numérique de livre jeunesse, nette et lisse, façon dessin animé moderne : formes simples et arrondies, contours nets, grands aplats de couleurs vives avec des dégradés doux, peu de détails, aucune texture fine, feuillages et herbes simplifiés en grandes masses, ciel bleu franc avec de gros nuages blancs moelleux, lumière chaude de plein jour ; même dans la brume ou au crépuscule, les couleurs restent claires et vives ; sans effet vieilli, sans texture d'impression, sans rendu de peinture détaillée",
  },
  aquarelle: {
    nom: "Aquarelle douce",
    prompt: "aquarelle douce, couleurs transparentes et légères, bords qui se fondent, grain du papier visible, lumière claire",
  },
  crayons: {
    nom: "Crayons de couleur",
    prompt: "dessin aux crayons de couleur, traits visibles et hachures légères, couleurs vives mais douces, sur papier blanc",
  },
  // À la place de la gouache, trop proche de l'illustration 2D réécrite (18 octobre 2026, demande du porteur)
  photo: {
    nom: "Photo réaliste",
    prompt: "image photoréaliste, comme une photographie prise sur place, lumière naturelle de jour, couleurs fidèles, matières et détails nets, légère profondeur de champ",
  },
  // À la place du papier découpé, dont l'exemple ressemblait à l'illustration 2D (18 octobre 2026, demande du porteur)
  volume: {
    nom: "Dessin animé en volume",
    prompt: "rendu en volume de film d'animation, formes rondes et douces, personnages aux grands yeux expressifs, matières lisses et légèrement brillantes, couleurs vives, éclairage chaud de cinéma avec des ombres douces",
  },
  // Ajoutés le 18 octobre 2026 à la demande du porteur, pour remplir la grille de trois sur trois
  bd: {
    nom: "Bande dessinée, ligne claire",
    prompt: "bande dessinée à la ligne claire, contours noirs nets et réguliers, aplats de couleurs vives sans dégradé, décors précis et lisibles",
  },
  pixel: {
    nom: "Pixel art",
    prompt: "pixel art, petits pixels carrés bien visibles, palette limitée et vive, contours nets, comme un jeu vidéo rétro",
  },
  encre: {
    nom: "Encre et hachures, noir et blanc",
    prompt: "dessin à l'encre noire sur papier blanc, hachures et trait précis, sans aucune couleur ni gris lavé, pour un livre imprimé en noir",
  },
};

/**
 * L'image d'exemple d'un style, livrée avec l'application (18 octobre 2026, demande du porteur) : le
 * même sujet dans chaque style, pour comparer les techniques d'un coup d'œil.
 */
export const exempleDuStyle = (style: Exclude<Style, "autre">, grand = false): string => `/illustrations/styles/${style}${grand ? "-grand" : ""}.jpg`;

/** Le sujet commun des images d'exemple des styles. */
export const SUJET_DES_EXEMPLES =
  "Un ponton de bois au bord d'un lac, une barque amarrée, une lanterne posée sur le ponton, des arbres sur l'autre rive, le matin.";

export const nomDuStyle = (style: Style): string => (style === "autre" ? "Autre" : STYLES_DES_IMAGES[style].nom);

/** Ce que le prompt dit du style ; « Autre » sans description reprend le style par défaut. */
export function descriptionDuStyle(style: Style, autre: string): string {
  if (style === "autre") return autre.replace(/\s+/g, " ").trim() || STYLES_DES_IMAGES.lumineuse.prompt;
  return STYLES_DES_IMAGES[style].prompt;
}

export type StyleDuProjet = { style: Style; autre: string };

/** Les règles que toute image reprend : ni texte ni signature, rien d'inadapté à des enfants. */
export const REGLES_DE_L_IMAGE = "Aucun texte, aucune lettre, aucun chiffre, aucune signature dans l'image. Image pour un livre d'enfants.";

/**
 * Le portrait de référence d'un personnage (F10.2) : en pied, de face, sur un fond uni, pour
 * servir ensuite de référence à chaque image où il paraît. La fiche se reprend mot pour mot ;
 * sans fiche, la description de l'adulte.
 */
export function promptDuPortrait(p: { nom: string; description: string; fiche: string }, style: StyleDuProjet): string {
  const apparence = p.fiche.trim() || p.description.trim();
  return [
    `Portrait de référence d'un personnage de livre illustré : ${p.nom.trim()}.`,
    apparence ? `Apparence : ${apparence}` : "",
    "Le personnage seul, en entier, debout, de face ou de trois quarts, le regard vers le lecteur, sur un fond uni très clair, sans décor ni autre personnage.",
    `Style : ${descriptionDuStyle(style.style, style.autre)}.`,
    REGLES_DE_L_IMAGE,
  ].filter(Boolean).join("\n");
}

/** L'image de référence d'un objet de l'histoire (F10.2), seul et centré sur un fond uni. */
export function promptDeLObjet(o: { nom: string; description: string; fiche: string }, style: StyleDuProjet): string {
  const apparence = o.fiche.trim() || o.description.trim();
  return [
    `Image de référence d'un objet de livre illustré : ${o.nom.trim()}.`,
    apparence ? `Apparence : ${apparence}` : "",
    "L'objet seul, entier, centré, vu de trois quarts, sur un fond uni très clair, sans décor ni main ni personnage.",
    `Style : ${descriptionDuStyle(style.style, style.autre)}.`,
    REGLES_DE_L_IMAGE,
  ].filter(Boolean).join("\n");
}

/**
 * Une image de référence se crée d'après la fiche visuelle, qu'elle doit ensuite rejoindre
 * dans chaque image : sans fiche, elle ne se crée pas (critique du lot 7, une image payée
 * d'après trois mots ne correspondrait plus à la fiche écrite ensuite).
 */
export const peutCreerSonImage = (p: { fiche: string }): boolean => p.fiche.trim() !== "";

/** « Portrait de Lou.jpg » : le nom du fichier téléchargé, sans signe que les systèmes refusent. */
export function nomDeFichier(debut: string, nom: string): string {
  const propre = `${debut} ${nom}`.replace(/[\\/:*?"<>|\u0000-\u001f]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 80);
  return `${propre || debut}.jpg`;
}

/**
 * Le cadrage d'une image de scène (F10.2), choisi d'un clic sur cinq cadres dessinés : la
 * pleine page en hauteur, 3:2, 16:9, le carré, et la « Détourée » (le sujet seul sur fond
 * transparent, ajoutée le 18 octobre 2026 à la demande du porteur). La pleine page se demande en
 * haute qualité sous « Automatique » (F10-AC37) ; une fois gardée, l'image se pose en « Pleine page »
 * dans la scène, la détourée en petite, les autres en pleine largeur.
 */
export const CADRAGES = ["pleine-page", "3:2", "16:9", "carre"] as const;
export type Cadrage = (typeof CADRAGES)[number];
export const estCadrage = (v: unknown): v is Cadrage => typeof v === "string" && (CADRAGES as readonly string[]).includes(v);

export const NOMS_DES_CADRAGES: Record<Cadrage, string> = { "pleine-page": "Pleine page", "3:2": "3:2", "16:9": "16:9", carre: "Carré" };

/** Ce que le prompt dit du cadrage. */
export const CADRAGES_EN_MOTS: Record<Cadrage, string> = {
  "pleine-page": "illustration pleine page, en hauteur",
  "3:2": "illustration horizontale, format 3:2",
  "16:9": "bandeau horizontal, format 16:9",
  carre: "illustration carrée",
};

/** « Ce que montre l'image » : l'idée de l'élève ou de l'adulte, en quelques mots (F10.2, F10-AC10). */
export const IDEE_MAX = 400;
/** La description proposée par l'IA, ou écrite à la main : le cœur du prompt */
export const DESCRIPTION_IMAGE_MAX = 1500;
/** Au plus quatre images de référence jointes à une image de scène : chacune se paie en entrée */
export const REFERENCES_MAX = 4;

/** Ce qui peut paraître dans une image de scène : un personnage ou un objet de l'histoire. */
export type Candidat = {
  id: string;
  sorte: "personnage" | "objet";
  nom: string;
  autresNoms: string[];
  heros: boolean;
  /** La fiche visuelle, reprise mot pour mot ; vide, le nom seul part */
  fiche: string;
  /** Le portrait ou l'image de référence, joint à la création */
  referenceId: string | null;
};

/** En minuscules, l'apostrophe courbe tenue pour la droite : « l’Ogre » nomme « l'ogre ». */
const enMinuscules = (t: string): string => t.normalize("NFC").toLocaleLowerCase("fr").replace(/[’ʼ]/g, "'");
const echapper = (t: string): string => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Un nom paraît-il dans le texte, mot entier, sans tenir compte des majuscules ? « Lou » n'est pas
 * dans « loup ». L'article du nom ne compte pas : « la lanterne de cuivre » est nommée par « sa
 * lanterne de cuivre », « la chouette » par « une chouette ».
 */
export function nommeDans(texte: string, nom: string): boolean {
  const n = enMinuscules(nom.trim());
  const sansArticle = n.replace(/^(?:(?:le|la|les|un|une|des|du|ton|ta|tes|son|sa|ses)\s+|l')/u, "");
  const lu = enMinuscules(texte);
  return [n, sansArticle]
    .filter((x) => x.length >= 3 || x === n)
    .some((x) => new RegExp(`(^|[^\\p{L}\\p{N}])${echapper(x)}($|[^\\p{L}\\p{N}])`, "u").test(lu));
}

/**
 * Les personnages et les objets qu'une image peut montrer (F10.2) : un héros absent des images
 * n'y est jamais (au plus ses mains, neutres) ; les autres, tous, pour le « + ».
 */
export const candidatsDeLImage = (candidats: readonly Candidat[], herosAbsent: boolean): Candidat[] =>
  candidats.filter((c) => !(herosAbsent && c.sorte === "personnage" && c.heros));

/**
 * Les badges posés d'office sur une image de scène (F10.2) : les personnages et les objets dont un
 * nom paraît dans le texte de la scène ou dans « Ce que montre l'image » ; et, quand le héros est
 * dessiné et qu'il est le seul, son badge, même sans être nommé (« tu » ne le nomme pas). Avec
 * plusieurs héros, aucun d'office : celui que le texte nomme a le sien, les autres s'ajoutent par
 * « + ». Rend les identités, dans l'ordre des candidats.
 */
export function badgesDOffice(texte: string, idee: string, candidats: readonly Candidat[], herosAbsent: boolean): string[] {
  const possibles = candidatsDeLImage(candidats, herosAbsent);
  const lu = `${texte}\n${idee}`;
  const heros = possibles.filter((c) => c.sorte === "personnage" && c.heros);
  return possibles
    .filter((c) => [c.nom, ...c.autresNoms].some((n) => nommeDans(lu, n)) || (heros.length === 1 && heros[0].id === c.id))
    .map((c) => c.id);
}

export type Retenu = Pick<Candidat, "nom" | "sorte" | "fiche"> & { /** Son image est jointe à la création */ reference: boolean };

const ligneDuRetenu = (r: Retenu, n: number | null): string =>
  `- ${r.nom.trim()}${r.fiche.trim() ? ` : ${r.fiche.trim()}` : ""}${n !== null ? ` (image de référence ${n})` : ""}`;

/** Ce que le prompt dit du héros absent (F10-AC08) ; rien quand il est dessiné (F10-AC12). */
export const HEROS_ABSENT_EN_MOTS =
  "Le héros, que le lecteur incarne, n'est pas représenté : ni son visage ni son corps. Au plus ses mains, neutres, et seulement si la scène montre son geste : sans bijou, sans manche distinctive, sans couleur de peau marquée.";

/**
 * Le prompt d'une image de scène (F10.2), en français, assemblé par l'application : ce que montre
 * l'image (la description, sinon l'idée), le cadrage, les personnages et les objets retenus avec
 * leur fiche reprise mot pour mot, la règle du héros absent, le style du projet. C'est aussi ce que
 * « Copier le prompt » met dans le presse-papiers, sans IA (le repli de F10.2).
 */
export function promptDeLaScene(
  d: { description: string; cadrage: Cadrage; retenus: readonly Retenu[]; herosAbsent: boolean; detouree?: boolean },
  style: StyleDuProjet,
): string {
  let n = 0;
  const lignes = d.retenus.map((r) => ligneDuRetenu(r, r.reference ? ++n : null));
  const description = d.description.replace(/\s+/g, " ").trim();
  const commun = [
    lignes.length ? `Personnages et objets, à dessiner tels qu'ils sont décrits :\n${lignes.join("\n")}` : "",
    n ? "Les images de référence jointes donnent l'apparence de ces personnages et objets : garder leur apparence, pas leur pose ni leur fond." : "",
  ];
  // Détourée : une description de scène l'emportait sur la consigne, et l'image revenait entière,
  // décor compris (essai en ligne du 22 octobre 2026). Le sujet seul se dit d'abord, ce qu'on
  // garde d'une idée qui décrit un lieu, et le fond transparent se redit à la fin.
  if (d.detouree)
    return [
      "Illustration détourée pour un livre pour enfants : un seul sujet isolé, entier et centré, sur un fond entièrement transparent.",
      description
        ? `Sujet, tiré de cette idée : ${description} Si l'idée décrit un lieu ou une scène, n'en garder qu'un seul élément, le plus parlant (un personnage, un animal ou un objet), sans le lieu autour.`
        : "",
      ...commun,
      d.herosAbsent ? "Le héros n'est jamais représenté, ni ses mains." : "",
      "Sans main ni personnage autour, s'il n'est pas lui-même un personnage.",
      `Style : ${descriptionDuStyle(style.style, style.autre)}.`,
      REGLES_DE_L_IMAGE,
      "Rappel : fond entièrement transparent ; aucun décor, aucun sol, aucun ciel, aucune ombre portée.",
    ].filter(Boolean).join("\n");
  return [
    `Illustration d'une scène de livre pour enfants, ${CADRAGES_EN_MOTS[d.cadrage]}.`,
    description ? `Ce que montre l'image : ${description}` : "",
    ...commun,
    d.herosAbsent ? HEROS_ABSENT_EN_MOTS : "",
    `Style : ${descriptionDuStyle(style.style, style.autre)}.`,
    REGLES_DE_L_IMAGE,
  ].filter(Boolean).join("\n");
}

/** Ce que l'on illustre pour le repérage : le projet, une partie ou un chapitre (F10.1). */
export type Repere = "projet" | "partie" | "chapitre";

const coupe = (t: string, max: number): string => {
  const propre = t.replace(/\s+/g, " ").trim();
  if (propre.length <= max) return propre;
  const court = propre.slice(0, max);
  const fin = court.lastIndexOf(" ");
  return `${court.slice(0, fin > max * 0.6 ? fin : max)}…`;
};

/**
 * Le prompt d'une image de repérage (F10.1), assemblé sans modèle de texte : un lieu et son
 * ambiance, d'assez loin, sans personnage au premier plan, comme les visuels de l'application,
 * d'après le titre et le résumé (ceux des chapitres pour une partie, l'univers et l'enjeu pour le
 * projet). Le héros n'y est jamais : une image de repérage montre un lieu.
 */
export function promptDuReperage(
  r: { sorte: Repere; titre: string; resume: string; univers?: string },
  style: StyleDuProjet,
): string {
  const quoi = r.sorte === "projet" ? "d'une histoire" : r.sorte === "partie" ? "d'une partie d'un livre" : "d'un chapitre d'un livre";
  const nom = r.sorte === "projet" ? "Histoire" : r.sorte === "partie" ? "Partie" : "Chapitre";
  return [
    `Image de repérage ${quoi} pour enfants, illustration horizontale : un lieu et son ambiance, vus d'assez loin, sans personnage au premier plan.`,
    `${nom} « ${r.titre.trim()} »${r.resume.trim() ? ` : ${coupe(r.resume, 900)}` : "."}`,
    r.univers?.trim() ? `Univers de l'histoire : ${coupe(r.univers, 600)}` : "",
    `Style : ${descriptionDuStyle(style.style, style.autre)}.`,
    REGLES_DE_L_IMAGE,
  ].filter(Boolean).join("\n");
}

/**
 * Pourquoi l'image de repérage d'un chapitre ou d'une partie ne se crée pas encore (F10.1) : sans
 * résumé, elle ne dirait rien du lieu. Rien quand elle peut se créer.
 */
export function raisonDuReperage(element: { resume: string } | { chapitres: { resume: string }[] } | null | undefined): string | null {
  if (!element) return null;
  if ("resume" in element) return element.resume.trim() ? null : "Écrivez d’abord le résumé du chapitre.";
  return element.chapitres.some((c) => c.resume.trim()) ? null : "Écrivez d’abord le résumé d’un de ses chapitres.";
}

/**
 * Le prompt de l'illustration de couverture (F11.4, F10.2), à copier pour l'outil de l'imprimeur :
 * l'image de face au format du livre, sans texte, de la place en haut pour le titre.
 */
export function promptDeCouverture(
  c: { titre: string; description: string; herosAbsent: boolean; format: string },
  style: StyleDuProjet,
): string {
  return [
    `Illustration de couverture d'un livre pour enfants, « ${c.titre.trim()} » : image de face en hauteur, au format ${c.format}. Laisser de la place en haut pour le titre, que l'imprimeur ajoutera.`,
    c.description.trim() ? `Ce que montre la couverture : ${c.description.replace(/\s+/g, " ").trim()}` : "",
    c.herosAbsent ? HEROS_ABSENT_EN_MOTS : "",
    `Style : ${descriptionDuStyle(style.style, style.autre)}.`,
    REGLES_DE_L_IMAGE,
  ].filter(Boolean).join("\n");
}
