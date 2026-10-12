import dagre from "@dagrejs/dagre";
import { ordreDeLecture, type Chemins, type Marque } from "@/domaine/chemins";

/**
 * Place les scènes d'un chapitre de haut en bas et trace leurs chemins (F03.1, « Vue Chemins
 * à reprendre »).
 *
 * dagre range les scènes par rangs, réserve la place des libellés et ordonne chaque rang pour
 * réduire les croisements. Les traits sont ensuite menés ici, à angles droits arrondis : tout
 * droit dans la hauteur d'un rang, à la place que dagre leur a gardée entre les cartes, et de
 * côté seulement entre deux rangs, chacun sur sa propre ligne. Un trait ne passe donc jamais
 * sous une carte, et deux traits ne se confondent pas. L'espace entre deux rangs suit le
 * nombre de traits qui s'y déplacent : étroit là où le récit est simple.
 */

/** Tailles, en points du schéma à sa taille réelle. La feuille de style s'y tient (recit.css). */
export const CARTE = { l: 178, h: 76, bande: 22 };
export const LIBELLE = { max: 112, h: 20, h2: 33 };
export const ETIQUETTE = { h: 26, max: 240 };
/** Entre deux morceaux du chapitre que rien ne relie, et la largeur au-delà de laquelle ils passent à la ligne */
const MORCEAUX = { ecart: 34, entreLignes: 44, large: 1400 };
/** Entre deux rangs : la place d'un trait qui se déplace de côté, et celle qu'on garde au-dessus et au-dessous */
const PISTE = { pas: 7, marge: 12, min: 24, rayon: 6 };

export type Element =
  | { sorte: "scene"; id: string; marques: Marque[] }
  /** Une petite étiquette au nom d'un autre chapitre : on y va, ou on en vient */
  | { sorte: "sortie"; id: string; chapitre: string; nom?: string; lien?: string }
  | { sorte: "entree"; id: string; chapitre: string; lien?: string }
  /** Le bout d'un choix qui ne mène encore nulle part, ou à une scène supprimée */
  | { sorte: "manque"; id: string; manque: "sans" | "supprimee"; lienId: string };

export type Place = { x: number; y: number; l: number; h: number };
export type Point = { x: number; y: number };
export type Trait = {
  id: string; de: string; vers: string;
  /** Par où passe le trait, de la carte de départ à la carte d'arrivée : des segments droits */
  points: Point[];
  /** Le tracé SVG, les angles arrondis */
  d: string;
  /** Le milieu de son libellé, sa largeur et sa hauteur, s'il en a un */
  libelle: { x: number; y: number; l: number; h: number } | null;
  /** Un retour en arrière : le trait remonte */
  remonte: boolean;
};
export type Disposition = { largeur: number; hauteur: number; elements: Element[]; places: Map<string, Place>; traits: Trait[] };

/** La largeur d'un texte à l'écran ; à défaut de pouvoir la mesurer, une estimation. */
export type Mesure = (texte: string, sorte: "libelle" | "etiquette") => number;
const estimer: Mesure = (texte, sorte) => texte.length * (sorte === "libelle" ? 6.1 : 6.6);

export const texteDuLibelle = (l: { libelle: string; cache: boolean }): string => (l.cache ? "Lien caché" : l.libelle || "Choix sans libellé");
export const texteDeLEtiquette = (e: Element): string =>
  e.sorte === "sortie" ? e.chapitre : e.sorte === "entree" ? `depuis ${e.chapitre}` : e.sorte === "manque" ? (e.manque === "sans" ? "Sans destination" : "Scène supprimée") : "";

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
type Atracer = { id: string; de: string; vers: string; libelle: { l: number; h: number } | null };

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

  // Les scènes entrent dans l'ordre où on les rencontre depuis l'entrée : dagre garde ainsi pour
  // « retours en arrière » les choix qui remontent vraiment le récit
  for (const n of ordreDeLecture(noeuds, liens)) {
    const m = marques.get(n.id) ?? [];
    poser({ sorte: "scene", id: n.id, marques: m }, CARTE.l, CARTE.h + (n.depart || n.fin ? CARTE.bande : 0) + (m.length ? CARTE.bande : 0));
  }

  const aTracer: Atracer[] = [];
  const relier = (id: string, de: string, vers: string, texte: string | null, signe = 0) => {
    // Un libellé long tient sur deux lignes, puis se coupe
    const large = texte === null ? 0 : Math.ceil(mesurer(texte, "libelle")) + 16 + signe;
    aTracer.push({ id, de, vers, libelle: large ? { l: Math.min(LIBELLE.max, large), h: large > LIBELLE.max ? LIBELLE.h2 : LIBELLE.h } : null });
  };

  // Un chemin venu d'un autre chapitre : une étiquette par chapitre d'origine, au-dessus de la scène
  for (const e of entrees) {
    if (!scenes.has(e.vers)) continue;
    const id = `entree:${e.vers}:${e.chapitre}`;
    if (poses.has(id)) continue;
    etiquette({ sorte: "entree", id, chapitre: e.chapitre, lien: e.lien });
    relier(id, id, e.vers, null);
  }
  for (const l of liens) {
    if (!scenes.has(l.de)) continue;
    let vers = l.vers && scenes.has(l.vers) ? l.vers : null;
    if (!vers && l.ailleurs) {
      // Plusieurs choix vers la même scène d'un autre chapitre se rejoignent sur une seule étiquette
      vers = `sortie:${l.ailleurs.lien ?? l.ailleurs.chapitre}`;
      if (!poses.has(vers)) etiquette({ sorte: "sortie", id: vers, chapitre: l.ailleurs.chapitre, nom: l.ailleurs.nom, lien: l.ailleurs.lien });
    } else if (!vers) {
      vers = `manque:${l.id}`;
      etiquette({ sorte: "manque", id: vers, manque: l.manque === "supprimee" ? "supprimee" : "sans", lienId: l.id });
    }
    relier(l.id, l.de, vers, texteDuLibelle(l), l.cache ? 17 : 0);
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
      traits.push({ ...t, points, d: arrondir(points), libelle: t.libelle ? { ...t.libelle, ...deplacer(t.libelle) } : null });
    }
    largeur = Math.max(largeur, x + d.largeur);
    hauteurDeLigne = Math.max(hauteurDeLigne, d.hauteur);
    x += d.largeur + MORCEAUX.ecart;
  }
  return { largeur: Math.ceil(largeur), hauteur: Math.ceil(y + hauteurDeLigne), elements, places, traits };
}

/** Un morceau du chapitre dont toutes les scènes se tiennent par des choix : ses rangs, ses traits. */
function disposerUnMorceau(aPoser: Aposer[], aTracer: Atracer[]): Disposition {
  const elements = aPoser.map((p) => p.element);
  const g = new dagre.graphlib.Graph({ multigraph: true });
  g.setGraph({ rankdir: "TB", nodesep: 18, edgesep: 8, ranksep: 60, ranker: "network-simplex", marginx: 0, marginy: 0 });
  g.setDefaultEdgeLabel(() => ({}));
  for (const p of aPoser) g.setNode(p.element.id, { width: p.l, height: p.h });
  for (const t of aTracer) g.setEdge(t.de, t.vers, t.libelle ? { width: t.libelle.l, height: t.libelle.h, labelpos: "c" } : {}, t.id);

  dagre.layout(g);

  // ——— Les rangs : ceux des cartes et ceux des libellés, de haut en bas ———
  const demis = new Map<number, number>();
  const elargir = (y: number, demi: number) => demis.set(cle(y), Math.max(demis.get(cle(y)) ?? 0, demi));
  for (const e of elements) elargir(g.node(e.id).y, g.node(e.id).height / 2);
  const dessines = aTracer.map((t) => {
    const a = g.edge({ v: t.de, w: t.vers, name: t.id });
    const points = (a.points ?? []) as Point[];
    if (t.libelle && typeof a.y === "number") elargir(a.y, t.libelle.h / 2);
    // Un trait long traverse des rangs où il n'a ni carte ni libellé : il y garde sa place
    for (const p of points.slice(1, -1)) elargir(p.y, 0);
    return { ...t, points, x: a.x as number | undefined, y: a.y as number | undefined };
  });
  const rangs = [...demis.entries()].sort((a, b) => a[0] - b[0]).map(([k, demi]) => ({ k, demi }));
  const rangDe = new Map(rangs.map((r, i) => [r.k, i]));
  const rang = (y: number): number => rangDe.get(cle(y)) ?? 0;

  // ——— Où chaque trait s'attache : en bas de la carte qu'il quitte, en haut de celle où il arrive,
  // ou l'inverse s'il remonte. Les attaches d'un même bord s'écartent, dans l'ordre où partent les traits ———
  type Attache = { trait: string; bout: "debut" | "fin"; voisin: number };
  const bords = new Map<string, Attache[]>();
  const attacher = (noeud: string, bord: "haut" | "bas", a: Attache) => bords.set(`${noeud}|${bord}`, [...(bords.get(`${noeud}|${bord}`) ?? []), a]);
  const descend = new Map<string, boolean>();
  for (const t of dessines) {
    if (t.de === t.vers) continue;
    const dedans = t.points.slice(1, -1);
    const bas = g.node(t.vers).y > g.node(t.de).y;
    descend.set(t.id, bas);
    attacher(t.de, bas ? "bas" : "haut", { trait: t.id, bout: "debut", voisin: dedans[0]?.x ?? g.node(t.vers).x });
    attacher(t.vers, bas ? "haut" : "bas", { trait: t.id, bout: "fin", voisin: dedans.at(-1)?.x ?? g.node(t.de).x });
  }
  const attaches = new Map<string, number>();
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
    const libelle = t.libelle && typeof t.x === "number" && typeof t.y === "number" ? { x: t.x, y: milieu(rang(t.y)), l: t.libelle.l, h: t.libelle.h } : null;
    if (t.de === t.vers) {
      // Un choix qui ramène à sa propre scène : une boucle sur le côté de la carte
      const p = places.get(t.de)!;
      const points = [
        { x: p.x + p.l, y: p.y + p.h * 0.3 }, { x: p.x + p.l + 22, y: p.y + p.h * 0.3 }, { x: p.x + p.l + 22, y: p.y + p.h * 0.7 }, { x: p.x + p.l, y: p.y + p.h * 0.7 },
      ];
      return { id: t.id, de: t.de, vers: t.vers, points, d: arrondir(points), libelle: libelle ? { ...libelle, x: p.x + p.l + 22 + libelle.l / 2 + 4, y: p.y + p.h / 2 } : null, remonte: false };
    }
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
    return { id: t.id, de: t.de, vers: t.vers, points, d: arrondir(points), libelle, remonte: !bas };
  });

  return { largeur: Math.ceil(g.graph().width ?? 0), hauteur: Math.ceil(y), elements, places, traits };
}
