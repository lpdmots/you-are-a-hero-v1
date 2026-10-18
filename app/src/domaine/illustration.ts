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
export const STYLES = ["lumineuse", "aquarelle", "crayons", "gouache", "papier", "encre", "autre"] as const;
export type Style = (typeof STYLES)[number];
export const estStyle = (v: unknown): v is Style => typeof v === "string" && (STYLES as readonly string[]).includes(v);
export const STYLE_PAR_DEFAUT = "lumineuse" satisfies Style;
export const STYLE_AUTRE_MAX = 300;

export const STYLES_DES_IMAGES: Record<Exclude<Style, "autre">, { nom: string; prompt: string }> = {
  lumineuse: {
    nom: "Illustration 2D lumineuse",
    prompt: "illustration 2D contemporaine en lumière de jour, formes arrondies et simples, aplats de couleurs claires et chaudes, peu de détails, contours nets, sans effet vieilli ni texture d'impression",
  },
  aquarelle: {
    nom: "Aquarelle douce",
    prompt: "aquarelle douce, couleurs transparentes et légères, bords qui se fondent, grain du papier visible, lumière claire",
  },
  crayons: {
    nom: "Crayons de couleur",
    prompt: "dessin aux crayons de couleur, traits visibles et hachures légères, couleurs vives mais douces, sur papier blanc",
  },
  gouache: {
    nom: "Gouache d'album jeunesse",
    prompt: "peinture à la gouache d'album jeunesse, couleurs franches et mates, touches de pinceau visibles, formes généreuses, lumière de jour",
  },
  papier: {
    nom: "Papier découpé",
    prompt: "illustration en papier découpé, formes simples superposées, légères ombres entre les couches, textures de papier colorées",
  },
  encre: {
    nom: "Encre et hachures, noir et blanc",
    prompt: "dessin à l'encre noire sur papier blanc, hachures et trait précis, sans aucune couleur ni gris lavé, pour un livre imprimé en noir",
  },
};

export const nomDuStyle = (style: Style): string => (style === "autre" ? "Autre" : STYLES_DES_IMAGES[style].nom);

/** Ce que le prompt dit du style ; « Autre » sans description reprend le style par défaut. */
export function descriptionDuStyle(style: Style, autre: string): string {
  if (style === "autre") return autre.replace(/\s+/g, " ").trim() || STYLES_DES_IMAGES.lumineuse.prompt;
  return STYLES_DES_IMAGES[style].prompt;
}

export type StyleDuProjet = { style: Style; autre: string };

/** Les règles que toute image reprend : ni texte ni signature, rien d'inadapté à des enfants. */
const REGLES_DE_L_IMAGE = "Aucun texte, aucune lettre, aucun chiffre, aucune signature dans l'image. Image pour un livre d'enfants.";

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
