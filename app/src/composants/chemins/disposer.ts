import dagre from "@dagrejs/dagre";
import { ordreDeLecture, retoursEnArriere, type Chemins, type LienDeChemin, type Marque } from "@/domaine/chemins";

/**
 * Place les scènes d'un chapitre de haut en bas et trace leurs chemins (F03.1, « Vue Chemins
 * à reprendre », puis « Choix en onglets », 11 novembre 2026).
 *
 * Chaque choix d'une scène est un onglet au pied de sa carte : la carte s'élargit d'un onglet
 * par choix, et le trait part du point de sortie de son onglet. Plus rien n'est écrit sur un
 * trait. Les onglets se rangent comme partent leurs traits, pour que ceux d'une même carte ne se
 * croisent pas sous elle (révisé par le porteur le 11 novembre 2026 : d'abord l'ordre du texte,
 * toujours) ; l'ordre du texte se lit dans l'espace de travail de la scène. Un retour en arrière s'écrit dans son onglet : il ne pèse pas dans la
 * disposition, et sa ligne, tracée à part, ne se montre qu'à la demande — tout autre trait descend.
 *
 * dagre range les scènes par rangs et ordonne chaque rang pour réduire les croisements. Les traits
 * sont ensuite menés ici, à angles droits arrondis : tout droit dans la hauteur d'un rang, à la
 * place que dagre leur a gardée entre les cartes, et de côté seulement entre deux rangs, chacun
 * sur sa propre ligne. Un trait ne passe donc jamais sous une carte, et deux traits ne se
 * confondent pas. L'espace entre deux rangs suit le nombre de traits qui s'y déplacent : étroit
 * là où le récit est simple.
 */

/** Tailles, en points du schéma à sa taille réelle. La feuille de style s'y tient (recit.css). */
/**
 * La carte : sa largeur au moins, la hauteur de sa tête quand le titre prend ses deux lignes, celle d'une bande
 * (départ, fin, ce qui attend), la hauteur d'une ligne du titre et ce que ses marges prennent sur la largeur.
 */
export const CARTE = { l: 178, h: 76, bande: 22, ligneDeTitre: 17, margesDuTitre: 25, hautDuTitre: 8 };
/** La tête de la carte : un titre qui tient sur une ligne ne laisse pas de seconde ligne vide (11 novembre 2026). */
export const teteDeCarte = (lignesDuTitre: number): number => CARTE.h - (2 - Math.min(2, lignesDuTitre)) * CARTE.ligneDeTitre;
/**
 * Un onglet : sa largeur quand la carte en porte plusieurs (seul, il prend celle de la carte), ses
 * marges, la hauteur d'une ligne de sa phrase, trois lignes au plus, et celle de la note que l'outil
 * y ajoute (retour, sortie, « Sans destination »).
 */
export const ONGLET = { l: 128, cote: 8, haut: 7, bas: 9, ligne: 17, lignes: 3, note: 17, ligneDeNote: 13, lignesDeNote: 2, signe: 17 };
export const ETIQUETTE = { h: 26, max: 240 };
/** La ligne d'un retour en arrière : ce qu'elle descend sous son onglet, et son écart des cartes qu'elle longe */
const RETOUR = { bas: 18, ecart: 18 };
/** Entre deux morceaux du chapitre que rien ne relie, et la largeur au-delà de laquelle ils passent à la ligne */
const MORCEAUX = { ecart: 34, entreLignes: 44, large: 1400 };
/** Entre deux rangs : la place d'un trait qui se déplace de côté, et celle qu'on garde au-dessus et au-dessous */
const PISTE = { pas: 9, marge: 12, min: 24, rayon: 6 };

export type Element =
  | { sorte: "scene"; id: string; marques: Marque[] }
  /** Une petite étiquette au nom d'un autre chapitre, d'où vient un chemin */
  | { sorte: "entree"; id: string; chapitre: string; lien?: string };

export type Place = { x: number; y: number; l: number; h: number };
export type Point = { x: number; y: number };
/**
 * Ce que dit un onglet, hors sa phrase : une suite dans le chapitre, dont le trait part ; un retour
 * en arrière, écrit dans l'onglet ; un choix qui ramène à sa propre scène ; une sortie vers un autre
 * chapitre ; un choix sans destination ou vers une scène supprimée.
 */
export type SorteDOnglet = "suite" | "retour" | "ici" | "sortie" | "manque";
export type Onglet = Place & {
  /** Le choix : son identité, et la scène d'où il part */
  id: string; de: string;
  sorte: SorteDOnglet;
  /** Le nombre de lignes que prend sa phrase, trois au plus ; coupée, elle se lit en entier pour la scène regardée */
  lignes: number; coupe: boolean;
  /** Le nombre de lignes de sa note — le retour, la sortie, ce qui manque —, deux au plus ; aucune pour une suite */
  note: number;
  /** Sa note dépasse ses deux lignes : elle se lit en entier au survol */
  noteCoupee: boolean;
  /** Le point d'où part son trait, au bord bas de la carte ; rien quand aucun trait n'en part */
  sortie: Point | null;
};
export type Trait = {
  id: string; de: string; vers: string;
  /** Par où passe le trait, de l'onglet de départ à la carte d'arrivée : des segments droits */
  points: Point[];
  /** Le tracé SVG, les angles arrondis */
  d: string;
  /** Un retour en arrière : sa ligne ne se montre que pour la scène survolée ou cliquée */
  retour: boolean;
};
export type Disposition = {
  largeur: number; hauteur: number; elements: Element[]; places: Map<string, Place>; traits: Trait[];
  /** Par scène, ses onglets de gauche à droite, rangés comme partent leurs traits */
  onglets: Map<string, Onglet[]>;
};

/** La largeur d'un texte à l'écran ; à défaut de pouvoir la mesurer, une estimation. */
export type Mesure = (texte: string, sorte: "onglet" | "etiquette" | "titre") => number;
const estimer: Mesure = (texte, sorte) => texte.length * (sorte === "onglet" ? 6.3 : sorte === "titre" ? 7.4 : 6.6);

export const texteDuLibelle = (l: { libelle: string; cache: boolean }): string => (l.cache ? "Lien caché" : l.libelle || "Choix sans libellé");
export const texteDeLEtiquette = (e: Element): string => (e.sorte === "entree" ? `depuis ${e.chapitre}` : "");

/**
 * Le nombre de lignes que prend un texte dans une largeur, coupé aux espaces comme le navigateur le
 * coupe ; un mot plus long que la ligne se coupe où il faut. Une espace insécable ne coupe pas.
 */
export function lignesDe(texte: string, largeur: number, mesurer: (texte: string) => number): number {
  let lignes = 1;
  let courante = "";
  for (const mot of texte.split(/[ \n\t]+/).filter(Boolean)) {
    const essai = courante ? `${courante} ${mot}` : mot;
    if (mesurer(essai) <= largeur) {
      courante = essai;
      continue;
    }
    if (courante) lignes += 1;
    lignes += Math.max(0, Math.ceil(mesurer(mot) / largeur) - 1);
    courante = mot;
  }
  return lignes;
}

/**
 * Ce que l'outil écrit sous la phrase d'un choix dont aucun trait ne part au repos : le retour en arrière et
 * la scène où il ramène, le chapitre où il sort, ce qui lui manque. Rien pour une suite dans le chapitre.
 */
export function noteDeLOnglet(sorte: SorteDOnglet, l: LienDeChemin, titreDe: (scene: string) => string): string | null {
  if (sorte === "retour") return `retour à « ${titreDe(l.vers!)} »`;
  if (sorte === "ici") return "revient à cette scène";
  if (sorte === "sortie") return l.ailleurs!.chapitre;
  if (sorte === "manque") return l.manque === "supprimee" ? "Scène supprimée" : "Sans destination";
  return null;
}

/** Ce qu'est l'onglet d'un choix, d'après où il mène. */
const sorteDOnglet = (l: LienDeChemin, scenes: Set<string>, retours: Set<string>): SorteDOnglet =>
  l.vers && scenes.has(l.vers) ? (l.vers === l.de ? "ici" : retours.has(l.id) ? "retour" : "suite") : l.ailleurs ? "sortie" : "manque";

const cle = (y: number): number => Math.round(y * 2);
const n1 = (v: number): number => Math.round(v * 10) / 10;

/** Le tracé d'une suite de segments droits, les angles arrondis. */
export function arrondir(points: Point[], rayon = PISTE.rayon): string {
  if (points.length < 2) return "";
  let d = `M${n1(points[0].x)},${n1(points[0].y)}`;
  for (let i = 1; i < points.length - 1; i++) {
    const [a, p, b] = [points[i - 1], points[i], points[i + 1]];
    const avant = Math.hypot(p.x - a.x, p.y - a.y);
    const apres = Math.hypot(b.x - p.x, b.y - p.y);
    const r = Math.min(rayon, avant / 2, apres / 2);
    if (r < 0.5) {
      d += ` L${n1(p.x)},${n1(p.y)}`;
      continue;
    }
    d += ` L${n1(p.x - ((p.x - a.x) / avant) * r)},${n1(p.y - ((p.y - a.y) / avant) * r)}`;
    d += ` Q${n1(p.x)},${n1(p.y)} ${n1(p.x + ((b.x - p.x) / apres) * r)},${n1(p.y + ((b.y - p.y) / apres) * r)}`;
  }
  const fin = points[points.length - 1];
  return `${d} L${n1(fin.x)},${n1(fin.y)}`;
}

type Aposer = { element: Element; l: number; h: number };
/**
 * `x` : où le trait quitte sa carte, compté depuis son bord gauche — le milieu de l'onglet que le choix a dans
 * l'ordre du texte, avant que les onglets de la carte soient rangés comme partent leurs traits ; rien pour une étiquette
 */
type Atracer = { id: string; de: string; vers: string; x: number | null };
/** L'onglet d'un choix avant que sa carte ait sa place : sa largeur, et ce que sa phrase demande */
type Prevu = { lien: LienDeChemin; sorte: SorteDOnglet; l: number; lignes: number; coupe: boolean; note: number; noteCoupee: boolean };

/**
 * La ligne d'un retour en arrière, de son onglet au côté de la scène où il revient : elle descend un
 * peu, longe les cartes par l'extérieur et entre de côté. Elle n'est montrée qu'à la demande, par-dessus
 * le schéma : elle n'a pas de place gardée entre les cartes.
 */
function tracerLeRetour(depart: Point, de: Place, vers: Place, titre: number): Point[] {
  // À hauteur du titre de la scène où l'on revient : plus bas, la ligne semblerait désigner un de ses onglets
  const milieu = vers.y + titre;
  const dehors = (x: number): boolean => x < de.x - RETOUR.ecart / 2 || x > de.x + de.l + RETOUR.ecart / 2;
  const [aDroite, aGauche] = [vers.x + vers.l + RETOUR.ecart, vers.x - RETOUR.ecart];
  let couloir: number;
  if (depart.x >= aDroite && dehors(aDroite)) couloir = aDroite;
  else if (depart.x <= aGauche && dehors(aGauche)) couloir = aGauche;
  else {
    // La scène où l'on revient est au-dessus de celle d'où l'on part : on contourne les deux, du côté le plus proche
    const droite = Math.max(de.x + de.l, vers.x + vers.l) + RETOUR.ecart;
    const gauche = Math.min(de.x, vers.x) - RETOUR.ecart;
    couloir = droite - depart.x <= depart.x - gauche ? droite : gauche;
  }
  const entree = couloir > vers.x + vers.l / 2 ? vers.x + vers.l : vers.x;
  return [depart, { x: depart.x, y: depart.y + RETOUR.bas }, { x: couloir, y: depart.y + RETOUR.bas }, { x: couloir, y: milieu }, { x: entree, y: milieu }];
}

export function disposer(chemins: Chemins, marques: Map<string, Marque[]>, mesurer: Mesure = estimer): Disposition {
  const { noeuds, liens, entrees } = chemins;
  const scenes = new Set(noeuds.map((n) => n.id));
  const aPoser: Aposer[] = [];
  const poses = new Set<string>();
  const poser = (element: Element, l: number, h: number) => {
    aPoser.push({ element, l, h });
    poses.add(element.id);
  };
  const etiquette = (e: Element) => poser(e, Math.min(ETIQUETTE.max, Math.ceil(mesurer(texteDeLEtiquette(e), "etiquette")) + 48), ETIQUETTE.h);

  // ——— Les onglets de chaque scène : un par choix, d'abord dans l'ordre du texte. Seul, il prend la largeur de la
  // carte ; à plusieurs, la carte s'élargit d'un onglet par choix, sur un seul rang ———
  const retours = retoursEnArriere(noeuds, liens);
  const titres = new Map(noeuds.map((n) => [n.id, n.titre ?? "scène sans titre"]));
  const choixDe = new Map<string, LienDeChemin[]>();
  for (const l of liens) if (scenes.has(l.de)) choixDe.set(l.de, [...(choixDe.get(l.de) ?? []), l]);
  const prevus = new Map<string, { onglets: Prevu[]; h: number }>();
  for (const [scene, choix] of choixDe) {
    const l = choix.length > 1 ? ONGLET.l : CARTE.l;
    const onglets = choix.map((lien): Prevu => {
      // La mesure d'une phrase est juste à peu de chose près : un rien de marge évite la ligne de trop qu'on n'aurait pas prévue
      const utile = (l - 2 * ONGLET.cote - (lien.cache ? ONGLET.signe : 0)) / 1.04;
      const lignes = lignesDe(texteDuLibelle(lien), utile, (t) => mesurer(t, "onglet"));
      const sorte = sorteDOnglet(lien, scenes, retours);
      // La note tient sur deux lignes au plus : « retour à » et le titre de la scène, qui se reconnaît à sa fin
      const texte = noteDeLOnglet(sorte, lien, (scene) => titres.get(scene) ?? "scène sans titre");
      const lignesDeNote = texte === null ? 0 : lignesDe(texte, (l - 2 * ONGLET.cote - ONGLET.signe) / 1.04, (t) => mesurer(t, "etiquette"));
      const note = Math.min(ONGLET.lignesDeNote, lignesDeNote);
      return { lien, sorte, l, lignes: Math.min(ONGLET.lignes, lignes), coupe: lignes > ONGLET.lignes, note, noteCoupee: lignesDeNote > ONGLET.lignesDeNote };
    });
    const h = ONGLET.haut + ONGLET.bas + Math.max(...onglets.map((o) => o.lignes * ONGLET.ligne + (o.note ? ONGLET.note + (o.note - 1) * ONGLET.ligneDeNote : 0)));
    prevus.set(scene, { onglets, h });
  }

  // Les scènes entrent dans l'ordre où on les rencontre depuis l'entrée. En tête de la carte, d'où l'on
  // vient (« Départ du livre », « Rien n'y mène ») ; à son pied, où l'on va : ses onglets, à défaut
  // « Fin de l'histoire » ou « Sans suite ».
  // La tête de la carte suit son titre : une ligne, ou deux au plus. Le milieu du titre est retenu : la ligne d'un
  // retour en arrière y entre
  const milieuxDuTitre = new Map<string, number>();
  for (const n of ordreDeLecture(noeuds, liens)) {
    const m = marques.get(n.id) ?? [];
    const pied = prevus.get(n.id);
    const tete = n.depart || m.includes("rien-n-y-mene") ? CARTE.bande : 0;
    const bas = (n.fin ? CARTE.bande : 0) + (pied ? pied.h : m.includes("sans-suite") ? CARTE.bande : 0);
    const l = Math.max(CARTE.l, (pied?.onglets.length ?? 0) > 1 ? pied!.onglets.length * ONGLET.l : 0);
    const lignes = Math.min(2, lignesDe(n.titre ?? "sans titre", (l - CARTE.margesDuTitre) / 1.04, (t) => mesurer(t, "titre")));
    milieuxDuTitre.set(n.id, tete + CARTE.hautDuTitre + (lignes * CARTE.ligneDeTitre) / 2);
    poser({ sorte: "scene", id: n.id, marques: m }, l, teteDeCarte(lignes) + tete + bas);
  }

  const aTracer: Atracer[] = [];
  // Un chemin venu d'un autre chapitre : une étiquette par chapitre d'origine, au-dessus de la scène
  for (const e of entrees) {
    if (!scenes.has(e.vers)) continue;
    const id = `entree:${e.vers}:${e.chapitre}`;
    if (poses.has(id)) continue;
    etiquette({ sorte: "entree", id, chapitre: e.chapitre, lien: e.lien });
    aTracer.push({ id, de: id, vers: e.vers, x: null });
  }
  // Seules les suites dans le chapitre ont un trait dans la disposition : un retour en arrière n'y pèse
  // pas, une sortie et un choix à regarder se lisent dans leur onglet
  for (const { onglets } of prevus.values()) {
    onglets.forEach((o, i) => {
      if (o.sorte === "suite") aTracer.push({ id: o.lien.id, de: o.lien.de, vers: o.lien.vers!, x: i * o.l + o.l / 2 });
    });
  }

  // ——— Les morceaux du chapitre : ce que des choix relient se dispose ensemble ; ce que rien ne
  // relie encore se range à la suite, en lignes, au lieu d'étirer le schéma sur un seul rang ———
  const chef = new Map(aPoser.map((p) => [p.element.id, p.element.id]));
  const trouver = (id: string): string => {
    let racine = id;
    while (chef.get(racine) !== racine) racine = chef.get(racine)!;
    chef.set(id, racine);
    return racine;
  };
  for (const t of aTracer) chef.set(trouver(t.de), trouver(t.vers));
  const morceaux = new Map<string, { poses: Aposer[]; traces: Atracer[] }>();
  for (const p of aPoser) {
    const racine = trouver(p.element.id);
    if (!morceaux.has(racine)) morceaux.set(racine, { poses: [], traces: [] });
    morceaux.get(racine)!.poses.push(p);
  }
  for (const t of aTracer) morceaux.get(trouver(t.de))!.traces.push(t);
  const disposes = [...morceaux.values()].map((m) => disposerUnMorceau(m.poses, m.traces));
  // D'abord les morceaux qui ont des chemins, le plus grand en tête ; puis les scènes seules, dans l'ordre du plan
  const ordre = disposes.map((d, i) => ({ d, i })).sort((a, b) => Number(b.d.traits.length > 0) - Number(a.d.traits.length > 0) || (a.d.traits.length && b.d.traits.length ? b.d.elements.length - a.d.elements.length : 0) || a.i - b.i);
  const large = Math.max(MORCEAUX.large, ...disposes.map((d) => d.largeur));

  const elements: Element[] = [];
  const places = new Map<string, Place>();
  const traits: Trait[] = [];
  const onglets = new Map<string, Onglet[]>();
  const departs = new Map(disposes.flatMap((d) => [...d.departs]));
  let x = 0;
  let y = 0;
  let hauteurDeLigne = 0;
  let largeur = 0;
  for (const { d } of ordre) {
    if (x > 0 && x + d.largeur > large) {
      x = 0;
      y += hauteurDeLigne + MORCEAUX.entreLignes;
      hauteurDeLigne = 0;
    }
    const deplacer = (p: Point): Point => ({ x: p.x + x, y: p.y + y });
    elements.push(...d.elements);
    for (const [id, p] of d.places) places.set(id, { ...p, ...deplacer(p) });
    for (const t of d.traits) {
      const points = t.points.map(deplacer);
      traits.push({ ...t, points, d: arrondir(points) });
    }
    largeur = Math.max(largeur, x + d.largeur);
    hauteurDeLigne = Math.max(hauteurDeLigne, d.hauteur);
    x += d.largeur + MORCEAUX.ecart;
  }

  // ——— Les onglets, une fois les cartes à leur place : au pied de chacune, de gauche à droite. Ceux d'où part
  // un trait ont pris la place qui évite un croisement sous la carte ; les autres gardent celle du texte. Puis
  // la ligne de chaque retour en arrière, de son onglet à la scène où il revient ———
  for (const [scene, { onglets: liste, h }] of prevus) {
    const p = places.get(scene);
    if (!p) continue;
    onglets.set(
      scene,
      liste
        .map((o, i): Onglet => {
          const depart = departs.get(o.lien.id);
          const gauche = p.x + (depart === undefined ? i * o.l : depart - o.l / 2);
          const part = o.sorte === "suite" || o.sorte === "retour";
          return { id: o.lien.id, de: scene, sorte: o.sorte, x: gauche, y: p.y + p.h - h, l: o.l, h, lignes: o.lignes, coupe: o.coupe, note: o.note, noteCoupee: o.noteCoupee, sortie: part ? { x: gauche + o.l / 2, y: p.y + p.h } : null };
        })
        .sort((a, b) => a.x - b.x),
    );
  }
  for (const liste of onglets.values()) {
    for (const o of liste) {
      if (o.sorte !== "retour" || !o.sortie) continue;
      const vers = liens.find((l) => l.id === o.id)!.vers!;
      const points = tracerLeRetour(o.sortie, places.get(o.de)!, places.get(vers)!, milieuxDuTitre.get(vers) ?? CARTE.h / 2);
      traits.push({ id: o.id, de: o.de, vers, points, d: arrondir(points), retour: true });
    }
  }
  return { largeur: Math.ceil(largeur), hauteur: Math.ceil(y + hauteurDeLigne), elements, places, traits, onglets };
}

/**
 * Deux traits ne descendent pas l'un sur l'autre. Le trait d'un choix part du milieu de son onglet : il
 * arrive qu'un autre trait, après son déplacement de côté, redescende juste là. Celui des deux qui ne part
 * pas d'un onglet s'écarte alors d'un pas.
 */
function ecarterLesVerticales(traits: Trait[]): void {
  type Montant = { trait: Trait; i: number; x: number; haut: number; bas: number };
  for (let tour = 0; tour < 4; tour++) {
    const montants: Montant[] = traits.flatMap((trait) =>
      trait.points.slice(1).flatMap((b, i) => {
        const a = trait.points[i];
        return Math.abs(a.x - b.x) < 0.01 && Math.abs(a.y - b.y) > 0.01 ? [{ trait, i, x: a.x, haut: Math.min(a.y, b.y), bas: Math.max(a.y, b.y) }] : [];
      }),
    );
    let ecartes = 0;
    for (let m = 0; m < montants.length; m++) {
      for (let n = m + 1; n < montants.length; n++) {
        const [u, v] = [montants[m], montants[n]];
        if (u.trait === v.trait || Math.abs(u.x - v.x) > 2 || Math.min(u.bas, v.bas) - Math.max(u.haut, v.haut) <= 4) continue;
        // Le départ d'un onglet ne bouge pas : c'est l'autre montant qui s'écarte, du côté d'où vient son trait
        const bouge = v.i > 0 ? v : u.i > 0 ? u : null;
        if (!bouge) continue;
        const points = bouge.trait.points;
        const avant = points[bouge.i - 1];
        const pas = avant && avant.x < bouge.x ? -PISTE.pas : PISTE.pas;
        points[bouge.i] = { ...points[bouge.i], x: bouge.x + pas };
        points[bouge.i + 1] = { ...points[bouge.i + 1], x: bouge.x + pas };
        bouge.x += pas;
        ecartes += 1;
      }
    }
    if (!ecartes) return;
  }
}

/** Un morceau du chapitre dont toutes les scènes se tiennent par des choix : ses rangs, ses traits. */
function disposerUnMorceau(aPoser: Aposer[], aTracer: Atracer[]): Omit<Disposition, "onglets"> & { departs: Map<string, number> } {
  const elements = aPoser.map((p) => p.element);
  const g = new dagre.graphlib.Graph({ multigraph: true });
  // Entre deux cartes d'un rang, la place du « + », à cheval sur le bord droit de la carte survolée
  g.setGraph({ rankdir: "TB", nodesep: 26, edgesep: 8, ranksep: 60, ranker: "network-simplex", marginx: 0, marginy: 0 });
  g.setDefaultEdgeLabel(() => ({}));
  for (const p of aPoser) g.setNode(p.element.id, { width: p.l, height: p.h });
  for (const t of aTracer) g.setEdge(t.de, t.vers, {}, t.id);

  dagre.layout(g);
  // dagre range les suites d'une scène de droite à gauche, dans l'ordre du texte : le schéma se retourne en miroir,
  // sans rien changer d'autre, pour que les choix se lisent de gauche à droite comme dans le texte (F13-AC43).
  // Lui donner les liens à rebours aurait le même effet, mais change la disposition, et la gâte sur un grand chapitre.
  const bordDroit = g.graph().width ?? 0;
  for (const v of g.nodes()) g.node(v).x = bordDroit - g.node(v).x;
  for (const e of g.edges()) {
    const a = g.edge(e);
    if (typeof a.x === "number") a.x = bordDroit - a.x;
    for (const p of (a.points ?? []) as Point[]) p.x = bordDroit - p.x;
  }

  // ——— Les rangs : ceux des cartes et, entre eux, ceux où dagre garde la place des traits, de haut en bas ———
  const demis = new Map<number, number>();
  const elargir = (y: number, demi: number) => demis.set(cle(y), Math.max(demis.get(cle(y)) ?? 0, demi));
  for (const e of elements) elargir(g.node(e.id).y, g.node(e.id).height / 2);
  const dessines = aTracer.map((t) => {
    const a = g.edge({ v: t.de, w: t.vers, name: t.id });
    const points = (a.points ?? []) as Point[];
    // Un trait traverse des rangs où il n'a pas de carte : il y garde sa place
    for (const p of points.slice(1, -1)) elargir(p.y, 0);
    return { ...t, points };
  });
  const rangs = [...demis.entries()].sort((a, b) => a[0] - b[0]).map(([k, demi]) => ({ k, demi }));
  const rangDe = new Map(rangs.map((r, i) => [r.k, i]));
  const rang = (y: number): number => rangDe.get(cle(y)) ?? 0;

  // ——— Les onglets d'une carte se rangent comme partent leurs traits : celui dont le trait va le plus à gauche
  // est le plus à gauche, si bien que deux traits d'une même carte ne se croisent pas sous elle. Ils échangent
  // entre eux les places qu'ils avaient dans l'ordre du texte ; un onglet sans trait ne bouge pas ———
  const departs = new Map<string, number>();
  const parCarte = new Map<string, { id: string; x: number; voisin: number }[]>();
  for (const t of dessines) {
    if (t.x === null || t.de === t.vers) continue;
    const voisin = t.points.slice(1, -1)[0]?.x ?? g.node(t.vers).x;
    parCarte.set(t.de, [...(parCarte.get(t.de) ?? []), { id: t.id, x: t.x, voisin }]);
  }
  for (const liste of parCarte.values()) {
    const libres = liste.map((o) => o.x).sort((a, b) => a - b);
    // À égalité, l'ordre du texte : le tri garde l'ordre d'arrivée
    [...liste].sort((a, b) => a.voisin - b.voisin).forEach((o, i) => departs.set(o.id, libres[i]));
  }

  // ——— Où chaque trait s'attache : au point de sortie de son onglet, en bas de la carte qu'il quitte, et en
  // haut de celle où il arrive. Les arrivées d'un même bord s'écartent, dans l'ordre d'où viennent les traits ———
  type Attache = { trait: string; bout: "debut" | "fin"; voisin: number };
  const bords = new Map<string, Attache[]>();
  const attacher = (noeud: string, bord: "haut" | "bas", a: Attache) => bords.set(`${noeud}|${bord}`, [...(bords.get(`${noeud}|${bord}`) ?? []), a]);
  const descend = new Map<string, boolean>();
  for (const t of dessines) {
    if (t.de === t.vers) continue;
    const dedans = t.points.slice(1, -1);
    const bas = g.node(t.vers).y > g.node(t.de).y;
    descend.set(t.id, bas);
    // Le trait d'un choix part du milieu de son onglet
    if (t.x === null || !bas) attacher(t.de, bas ? "bas" : "haut", { trait: t.id, bout: "debut", voisin: dedans[0]?.x ?? g.node(t.vers).x });
    attacher(t.vers, bas ? "haut" : "bas", { trait: t.id, bout: "fin", voisin: dedans.at(-1)?.x ?? g.node(t.de).x });
  }
  const attaches = new Map<string, number>();
  for (const t of dessines) if (t.x !== null && descend.get(t.id)) attaches.set(`${t.id}|debut`, g.node(t.de).x - g.node(t.de).width / 2 + (departs.get(t.id) ?? t.x));
  for (const [bord, liste] of bords) {
    const n = g.node(bord.split("|")[0]);
    const pas = liste.length > 1 ? Math.min(16, (n.width - 40) / (liste.length - 1)) : 0;
    [...liste].sort((a, b) => a.voisin - b.voisin).forEach((a, i) => attaches.set(`${a.trait}|${a.bout}`, n.x + (i - (liste.length - 1) / 2) * pas));
  }

  // ——— Les arrêts de chaque trait, rang après rang, et ses déplacements de côté entre deux rangs ———
  type Passage = { trait: number; etape: number; haut: number; bas: number; piste: number };
  const arrets = dessines.map((t) => {
    if (t.de === t.vers) return [];
    return [
      { x: attaches.get(`${t.id}|debut`)!, rang: rang(g.node(t.de).y) },
      ...t.points.slice(1, -1).map((p) => ({ x: p.x, rang: rang(p.y) })),
      { x: attaches.get(`${t.id}|fin`)!, rang: rang(g.node(t.vers).y) },
    ];
  });
  const passages: Passage[][] = rangs.map(() => []);
  arrets.forEach((liste, trait) => {
    for (let etape = 0; etape + 1 < liste.length; etape++) {
      const [a, b] = [liste[etape], liste[etape + 1]];
      if (Math.abs(a.x - b.x) < 1 || a.rang === b.rang) continue;
      // L'espace juste après le rang quitté, dans le sens de la marche
      const entre = a.rang < b.rang ? a.rang : a.rang - 1;
      passages[entre].push({ trait, etape, haut: a.rang < b.rang ? a.x : b.x, bas: a.rang < b.rang ? b.x : a.x, piste: 0 });
    }
  });
  // Deux traits qui vont du même côté ne se croisent pas si celui qui part le plus loin passe au-dessus ;
  // deux traits ne partagent une ligne que s'ils ne s'y rencontrent pas
  const pistes = passages.map((liste) => {
    const gauche = (p: Passage) => Math.min(p.haut, p.bas);
    const droite = (p: Passage) => Math.max(p.haut, p.bas);
    const seTouchent = (a: Passage, b: Passage) => gauche(a) < droite(b) + 10 && gauche(b) < droite(a) + 10;
    const places: Passage[] = [];
    const versLaDroite = liste.filter((p) => p.bas > p.haut).sort((a, b) => b.haut - a.haut);
    const versLaGauche = liste.filter((p) => p.bas < p.haut).sort((a, b) => a.haut - b.haut);
    for (const groupe of [versLaDroite, versLaGauche]) {
      const dejaDuGroupe: Passage[] = [];
      for (const p of groupe) {
        p.piste = Math.max(-1, ...dejaDuGroupe.filter((q) => seTouchent(p, q)).map((q) => q.piste)) + 1;
        while (places.some((q) => q.piste === p.piste && q.trait !== p.trait && seTouchent(p, q))) p.piste += 1;
        dejaDuGroupe.push(p);
        places.push(p);
      }
    }
    return Math.max(0, ...liste.map((p) => p.piste + 1));
  });

  // ——— La hauteur : chaque rang garde la sienne, chaque espace prend celle de ses lignes ———
  const hauts: number[] = [];
  let y = 0;
  rangs.forEach((r, i) => {
    hauts.push(y);
    y += 2 * r.demi + (i + 1 < rangs.length ? Math.max(PISTE.min, 2 * PISTE.marge + Math.max(0, pistes[i] - 1) * PISTE.pas) : 0);
  });
  const milieu = (i: number): number => hauts[i] + rangs[i].demi;
  const ligne = (entre: number, piste: number): number => {
    const debut = hauts[entre] + 2 * rangs[entre].demi;
    const hauteur = hauts[entre + 1] - debut;
    return debut + (hauteur - Math.max(0, pistes[entre] - 1) * PISTE.pas) / 2 + piste * PISTE.pas;
  };

  const places = new Map<string, Place>();
  for (const e of elements) {
    const n = g.node(e.id);
    places.set(e.id, { x: n.x - n.width / 2, y: milieu(rang(n.y)) - n.height / 2, l: n.width, h: n.height });
  }

  const traits: Trait[] = dessines.map((t, i) => {
    const bas = descend.get(t.id)!;
    const liste = arrets[i];
    const de = places.get(t.de)!;
    const vers = places.get(t.vers)!;
    const points: Point[] = [{ x: liste[0].x, y: bas ? de.y + de.h : de.y }];
    for (let etape = 0; etape + 1 < liste.length; etape++) {
      const [a, b] = [liste[etape], liste[etape + 1]];
      const entre = a.rang < b.rang ? a.rang : a.rang - 1;
      const passage = passages[entre]?.find((p) => p.trait === i && p.etape === etape);
      if (!passage) continue;
      const yLigne = ligne(entre, passage.piste);
      points.push({ x: a.x, y: yLigne }, { x: b.x, y: yLigne });
    }
    points.push({ x: liste[liste.length - 1].x, y: bas ? vers.y : vers.y + vers.h });
    return { id: t.id, de: t.de, vers: t.vers, points, d: "", retour: false };
  });
  ecarterLesVerticales(traits);
  for (const t of traits) t.d = arrondir(t.points);

  return { largeur: Math.ceil(g.graph().width ?? 0), hauteur: Math.ceil(y), elements, places, traits, departs };
}
