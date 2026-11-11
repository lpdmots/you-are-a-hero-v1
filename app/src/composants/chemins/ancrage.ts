/**
 * La vue du schéma dans son cadre (F03.1, « Chemins en atelier », 11 novembre 2026). Le schéma se
 * tire dans un cadre qui ne défile plus avec la page : sa vue est un décalage et une taille,
 * `x` et `y` disant où tombe le coin haut gauche du schéma dans le cadre. Tout ce qui déplace
 * cette vue sans la main de l'utilisateur est calculé ici, à part de l'écran, pour être vérifié.
 */

/** Le décalage du schéma dans son cadre, en points d'écran, et sa taille */
export type Vue = { x: number; y: number; zoom: number };
type Point = { x: number; y: number };
/** Une carte, ou ce qui en englobe plusieurs, dans les mesures du schéma */
export type Boite = { x: number; y: number; l: number; h: number };
/** Le cadre où le schéma se voit */
export type Cadre = { l: number; h: number };

/** Où un point du schéma tombe dans le cadre. */
export const dansLeCadre = (vue: Vue, p: Point): Point => ({ x: vue.x + p.x * vue.zoom, y: vue.y + p.y * vue.zoom });

/**
 * L'écran ne bouge pas (F03-AC54) : après un geste le schéma se redispose, et la carte d'où
 * l'on part change de place dans le schéma. La vue se décale d'autant : la carte reste au même
 * point du cadre, à la même taille. Rien n'est poussé ni allongé, la vue n'a pas de bord.
 */
export const garderAuMemePoint = (vue: Vue, avant: Point, apres: Point): Vue => ({
  x: vue.x + (avant.x - apres.x) * vue.zoom,
  y: vue.y + (avant.y - apres.y) * vue.zoom,
  zoom: vue.zoom,
});

/** La même correction, lue à l'écran : la carte s'y est déplacée de `ecart` points. */
export const decalerLaVue = (vue: Vue, ecart: Point): Vue => ({ x: vue.x - ecart.x, y: vue.y - ecart.y, zoom: vue.zoom });

/**
 * Le cadre a changé de place dans la page (la colonne de navigation se replie, l'espace de
 * travail s'ouvre) : les cartes restent où elles étaient à l'écran, avant de glisser vers leur but.
 */
export const suivreLeCadre = (vue: Vue, avant: Point, apres: Point): Vue => ({ x: vue.x + avant.x - apres.x, y: vue.y + avant.y - apres.y, zoom: vue.zoom });

/**
 * Un seul glissement (F03-AC59), même quand le cadre change de place et de largeur en route — l'espace
 * de travail s'ouvre, la colonne se replie. Le trajet se compte dans la page, et non dans le cadre :
 * `depart` dit où était le coin du schéma dans la page en partant, `vers` la vue visée dans le cadre
 * tel qu'il est maintenant, `cadre` où ce cadre se trouve dans la page. À l'avancée 0, le schéma n'a
 * pas bougé à l'écran, où que soit passé le cadre ; à 1, il est à sa place.
 */
export const pasDuGlissement = (depart: Vue, vers: Vue, cadre: Point, avancee: number): Vue => ({
  x: depart.x + (cadre.x + vers.x - depart.x) * avancee - cadre.x,
  y: depart.y + (cadre.y + vers.y - depart.y) * avancee - cadre.y,
  zoom: depart.zoom + (vers.zoom - depart.zoom) * avancee,
});
/** Le rythme du glissement : doux au départ et à l'arrivée. Le cadre finit de changer pendant le départ, où presque rien ne bouge encore. */
export const adoucir = (t: number): number => (t <= 0 ? 0 : t >= 1 ? 1 : t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/**
 * Amener une carte au milieu du cadre. `hauteur` : où elle se pose de haut en bas — un peu
 * au-dessus du milieu pour une scène cliquée, dont la suite se construit dessous.
 */
export const centrerSur = (boite: Boite, cadre: Cadre, zoom: number, hauteur = 0.5): Vue => ({
  x: cadre.l / 2 - (boite.x + boite.l / 2) * zoom,
  y: cadre.h * hauteur - (boite.y + boite.h / 2) * zoom,
  zoom,
});

/**
 * Amener une carte au milieu sans montrer de vide pour rien : le haut du schéma ne descend pas
 * sous sa marge, et un schéma qui tient dans la largeur y reste au milieu ; plus large, il ne
 * laisse pas de vide sur un côté. Le bas reste libre : sous la dernière scène, la suite se construit.
 */
export function sansVideInutile(vue: Vue, schema: Cadre, cadre: Cadre, marge: number): Vue {
  const largeur = schema.l * vue.zoom;
  const x = largeur + 2 * marge <= cadre.l ? Math.round((cadre.l - largeur) / 2) : Math.min(marge, Math.max(cadre.l - marge - largeur, vue.x));
  return { x, y: Math.min(marge, vue.y), zoom: vue.zoom };
}

/** Ce qui englobe plusieurs cartes. */
export function englober(boites: Boite[]): Boite | null {
  if (!boites.length) return null;
  const x = Math.min(...boites.map((b) => b.x));
  const y = Math.min(...boites.map((b) => b.y));
  return { x, y, l: Math.max(...boites.map((b) => b.x + b.l)) - x, h: Math.max(...boites.map((b) => b.y + b.h)) - y };
}

/**
 * La taille à laquelle une boîte tient dans le cadre : celle qu'on a si elle y tient déjà, plus
 * petite sinon, sans descendre sous `min` (la taille où les libellés se lisent, F13.7).
 */
export function tailleQuiMontre(boite: Boite, cadre: Cadre, zoom: number, marge: Point, min: number): number {
  const facteur = Math.min(1, (cadre.l - 2 * marge.x) / (boite.l * zoom), (cadre.h - 2 * marge.y) / (boite.h * zoom));
  return facteur >= 0.98 ? zoom : Math.round(Math.max(Math.min(min, zoom), zoom * facteur) * 100) / 100;
}

/** Changer de taille autour du milieu du cadre : ce qu'on regardait y reste. */
export const changerDeTaille = (vue: Vue, cadre: Cadre, zoom: number): Vue => ({
  x: cadre.l / 2 - ((cadre.l / 2 - vue.x) / vue.zoom) * zoom,
  y: cadre.h / 2 - ((cadre.h / 2 - vue.y) / vue.zoom) * zoom,
  zoom,
});

/**
 * Montrer une boîte entière en bougeant le moins possible : rien ne bouge si elle se voit déjà.
 * Plus grande que le cadre, elle se montre par son coin haut gauche.
 */
export function montrerLaBoite(vue: Vue, boite: Boite, cadre: Cadre, marge: Point): Vue {
  const sur = (debut: number, longueur: number, place: number, m: number): number => {
    const a = debut;
    const b = debut + longueur;
    if (longueur > place - 2 * m) return m - a;
    if (a < m) return m - a;
    if (b > place - m) return place - m - b;
    return 0;
  };
  const coin = dansLeCadre(vue, boite);
  return { x: vue.x + sur(coin.x, boite.l * vue.zoom, cadre.l, marge.x), y: vue.y + sur(coin.y, boite.h * vue.zoom, cadre.h, marge.y), zoom: vue.zoom };
}

/**
 * La taille lisible : le schéma tient dans la largeur du cadre, sans descendre sous la taille où
 * les titres se lisent ni dépasser sa taille réelle.
 */
export const tailleLisible = (largeur: number, cadre: Cadre, marge: number, bornes: { min: number; max: number }): number =>
  largeur > 0 && cadre.l > 0 ? Math.floor(Math.min(bornes.max, Math.max(bornes.min, (cadre.l - 2 * marge) / largeur)) * 100) / 100 : bornes.max;

/** La vue à l'ouverture : à la taille lisible, le schéma au milieu de la largeur, son haut en haut du cadre. */
export const vueDeDepart = (schema: Cadre, cadre: Cadre, marge: number, zoom: number): Vue => ({ x: Math.round((cadre.l - schema.l * zoom) / 2), y: marge, zoom });

/** « Tout voir » : le schéma entier dans le cadre, au milieu. */
export function vueDEnsemble(schema: Cadre, cadre: Cadre, marge: number, bornes: { min: number; max: number }): Vue {
  const zoom = Math.floor(Math.min(bornes.max, Math.max(bornes.min, Math.min((cadre.l - 2 * marge) / schema.l, (cadre.h - 2 * marge) / schema.h))) * 100) / 100;
  return { x: Math.round((cadre.l - schema.l * zoom) / 2), y: Math.round(Math.max(marge, (cadre.h - schema.h * zoom) / 2)), zoom };
}

/**
 * On ne perd pas le schéma en le tirant : il en reste toujours un morceau dans le cadre, `reste`
 * points au moins. Rend la vue telle quelle quand c'est le cas.
 */
export function retenirLeSchema(vue: Vue, schema: Cadre, cadre: Cadre, reste = 240): Vue {
  const sur = (debut: number, longueur: number, place: number): number => {
    const garde = Math.min(reste, longueur, place);
    return Math.min(place - garde, Math.max(garde - longueur, debut));
  };
  const x = sur(vue.x, schema.l * vue.zoom, cadre.l);
  const y = sur(vue.y, schema.h * vue.zoom, cadre.h);
  return x === vue.x && y === vue.y ? vue : { x, y, zoom: vue.zoom };
}

/** Ce que le cadre montre du schéma, dans les mesures du schéma : le rectangle de la mini-carte. */
export const partVue = (vue: Vue, cadre: Cadre): Boite => ({ x: -vue.x / vue.zoom, y: -vue.y / vue.zoom, l: cadre.l / vue.zoom, h: cadre.h / vue.zoom });

/**
 * La carte à garder en place quand aucun geste n'en désigne une : celle qu'on a cliquée, sinon
 * la plus proche du milieu de ce qu'on voit.
 */
export function carteDeReference(rects: Map<string, Boite>, choisie: string | null, vu: Boite): string | null {
  if (choisie && rects.has(choisie)) return choisie;
  let mieux: string | null = null;
  let distance = Infinity;
  const [cx, cy] = [vu.x + vu.l / 2, vu.y + vu.h / 2];
  for (const [id, r] of rects) {
    const d = Math.hypot(r.x + r.l / 2 - cx, r.y + r.h / 2 - cy);
    if (d < distance) [mieux, distance] = [id, d];
  }
  return mieux;
}
