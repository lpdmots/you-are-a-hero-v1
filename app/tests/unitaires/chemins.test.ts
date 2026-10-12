import { describe, expect, it } from "vitest";
import { CARTE, disposer, LIBELLE, type Disposition, type Point } from "@/composants/chemins/disposer";
import { aRegarder, compteARegarder, ordreDeLecture, type Chemins, type LienDeChemin, type NoeudDeChemin } from "@/domaine/chemins";
import { ATTENDU, SCENES } from "../../scripts/marais-des-feux-follets";

/**
 * Vue « Chemins » (F03.1, « Vue Chemins à reprendre ») : ce qu'il y a « à regarder », et la
 * disposition du schéma — sans base ni navigateur. Le chapitre d'essai est « Le marais des
 * feux follets » (scripts/marais-des-feux-follets.ts) : trente-deux scènes, quarante-neuf choix.
 */

const id = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const noeud = (n: number, extra: Partial<NoeudDeChemin> = {}): NoeudDeChemin => ({ id: id(n), reference: n, titre: `Scène ${n}`, vide: true, depart: false, fin: false, lien: "", ...extra });
const lien = (de: number, vers: number | null, k = 0, extra: Partial<LienDeChemin> = {}): LienDeChemin => ({
  id: id(5000 + de * 10 + k), de: id(de), vers: vers === null ? null : id(vers), libelle: `Aller en ${vers}`, cache: false, ...extra,
});

/** Le marais tel que l'adulte le lit : ses deux sorties vers d'autres chapitres, et le chemin qui y arrive. */
function marais({ pourEleve = false } = {}): Chemins {
  const noeuds = SCENES.map((s, i) => noeud(100 + i, { id: s.cle, titre: s.titre, vide: !s.texte, fin: !pourEleve && s.fin === true }));
  const liens = SCENES.flatMap((s) => [
    ...(s.choix ?? []).map(([libelle, vers], k): LienDeChemin => {
      const base = { id: `${s.cle}>${k}`, de: s.cle, libelle, cache: false };
      if (vers === null) return { ...base, vers: null, manque: "sans" };
      if (typeof vers === "string") return { ...base, vers };
      if ("supprimee" in vers) return { ...base, vers: null, manque: "supprimee" };
      return { ...base, vers: null, ailleurs: { chapitre: vers.ailleurs === "moulin" ? "Le moulin noyé" : "Le sanctuaire", ...(pourEleve ? {} : { lien: `/chemins/${vers.ailleurs}` }) } };
    }),
    ...(s.cachee && !pourEleve ? [{ id: `${s.cle}>cache`, de: s.cle, libelle: s.cachee.libelle, cache: true, vers: s.cachee.vers }] : []),
  ]);
  return { noeuds, liens, entrees: pourEleve ? [] : [{ vers: "barque", chapitre: "Le gué des saules", lien: "/chemins/gue" }] };
}

const dansUneCarte = (p: Point, c: { x: number; y: number; l: number; h: number }, marge = 0.5): boolean =>
  p.x > c.x + marge && p.x < c.x + c.l - marge && p.y > c.y + marge && p.y < c.y + c.h - marge;

/** Les segments d'un trait, deux à deux : ses points se suivent en ligne droite. */
const segments = (points: Point[]): [Point, Point][] => points.slice(1).map((p, i) => [points[i], p]);

/** Le nombre de traits qui passent sous une carte autre que celles qu'ils relient. */
function traitsSousUneCarte(d: Disposition): number {
  return d.traits.filter((t) =>
    [...d.places].some(([carte, place]) => {
      if (carte === t.de || carte === t.vers) return false;
      // Des points pris tout le long de chaque segment
      return segments(t.points).some(([a, b]) => Array.from({ length: 41 }, (_, k) => ({ x: a.x + ((b.x - a.x) * k) / 40, y: a.y + ((b.y - a.y) * k) / 40 })).some((p) => dansUneCarte(p, place)));
    }),
  ).length;
}

/** Deux traits qui suivent la même ligne sur plus de quelques points : on ne saurait plus lequel est lequel. */
function traitsConfondus(d: Disposition): number {
  const morceaux = d.traits.flatMap((t) => segments(t.points).map(([a, b]) => ({ trait: t.id, a, b })));
  let confondus = 0;
  for (let i = 0; i < morceaux.length; i++) {
    for (let j = i + 1; j < morceaux.length; j++) {
      const [m, n] = [morceaux[i], morceaux[j]];
      if (m.trait === n.trait) continue;
      for (const axe of ["x", "y"] as const) {
        const autre = axe === "x" ? "y" : "x";
        // Deux segments sur la même droite, verticale ou horizontale, qui se recouvrent
        if (Math.abs(m.a[axe] - m.b[axe]) > 0.5 || Math.abs(n.a[axe] - n.b[axe]) > 0.5 || Math.abs(m.a[axe] - n.a[axe]) > 2) continue;
        const commun = Math.min(Math.max(m.a[autre], m.b[autre]), Math.max(n.a[autre], n.b[autre])) - Math.max(Math.min(m.a[autre], m.b[autre]), Math.min(n.a[autre], n.b[autre]));
        if (commun > 6) confondus += 1;
      }
    }
  }
  return confondus;
}

describe("Ce qu'il y a « à regarder » (F03.1)", () => {
  it("F03-AC18 — les mêmes scènes, une fois chacune, dans l'ordre où on les rencontre depuis l'entrée du chapitre", () => {
    const noeuds = [1, 2, 3, 4, 5, 6].map((n) => noeud(n));
    const ordre = ordreDeLecture(noeuds, [lien(1, 2), lien(1, 3, 1), lien(2, 4), lien(3, 4), lien(4, 1)]);
    // S001, puis S005 et S006 où rien ne mène, puis ce qu'on atteint en un pas, en deux pas
    expect(ordre.map((n) => n.reference)).toEqual([1, 5, 6, 2, 3, 4]);
    // Le départ passe en tête ; un lien vers un autre chapitre ou sans destination ne déplace rien
    const avecDepart = [noeud(1), noeud(2, { depart: true }), noeud(3)];
    expect(ordreDeLecture(avecDepart, [lien(2, 1), lien(1, null), lien(3, null, 0, { ailleurs: { chapitre: "Le marais" } })]).map((n) => n.reference)).toEqual([2, 3, 1]);
    expect(ordreDeLecture([], [])).toEqual([]);
  });

  it("F03-AC46 — un choix sans destination, un choix vers une scène supprimée, les scènes où rien ne mène, les scènes sans suite ni fin ; le compte de chacun", () => {
    const regard = aRegarder(marais());
    expect(regard.sortes.map((s) => compteARegarder(s.sorte, s.ou.length))).toEqual([
      "1 choix sans destination", "1 choix vers une scène supprimée", "2 scènes où rien ne mène", "2 scènes sans suite",
    ]);
    expect(regard.sortes.map((s) => s.ou)).toEqual([["cercle>2"], ["coffre>0"], ["crapaud", "nouvelle"], ["allumee", "nouvelle"]]);
    expect(Object.fromEntries(regard.marques)).toEqual({ crapaud: ["rien-n-y-mene"], allumee: ["sans-suite"], nouvelle: ["rien-n-y-mene", "sans-suite"] });
    expect(ATTENDU).toMatchObject({ choixSansDestination: 1, choixVersSupprimee: 1, scenesOuRienNeMene: 2, scenesSansSuite: 2 });
    expect(compteARegarder("rien-n-y-mene", 1)).toBe("1 scène où rien ne mène");
    expect(compteARegarder("sans-destination", 3)).toBe("3 choix sans destination");
  });

  it("F03-AC46 — le départ du livre, une scène où mène un autre chapitre, une scène atteinte par un lien caché et une fin ne sont pas à regarder ; sans rien à regarder, rien n'est dit", () => {
    const noeuds = [noeud(1, { depart: true }), noeud(2), noeud(3), noeud(4, { fin: true }), noeud(5)];
    const chemins: Chemins = {
      noeuds,
      liens: [lien(1, 2), lien(2, 3, 0, { cache: true }), lien(3, 4), lien(5, null, 0, { ailleurs: { chapitre: "Le marais" } }), lien(2, 2, 1)],
      entrees: [{ vers: id(5), chapitre: "Le quai" }],
    };
    expect(aRegarder(chemins)).toEqual({ marques: new Map(), sortes: [] });
    // Un choix qui ramène à sa propre scène ne fait pas d'elle une scène où quelque chose mène
    expect(aRegarder({ noeuds: [noeud(1, { depart: true }), noeud(2, { fin: true })], liens: [lien(2, 2)], entrees: [] }).marques.get(id(2))).toEqual(["rien-n-y-mene"]);
  });

  it("F03-AC50 — pour un élève, seuls ses choix sont à regarder : il ne connaît ni les chemins venus d'ailleurs, ni les liens cachés, ni le départ, ni les fins", () => {
    const regard = aRegarder(marais({ pourEleve: true }), { scenes: false });
    expect(regard.sortes.map((s) => compteARegarder(s.sorte, s.ou.length))).toEqual(["1 choix sans destination", "1 choix vers une scène supprimée"]);
    expect(regard.marques.size).toBe(0);
  });
});

describe("Le schéma, de haut en bas (F03.1)", () => {
  const chemins = marais();
  const d = disposer(chemins, aRegarder(chemins).marques);
  const place = (cle: string) => d.places.get(cle)!;

  it("F03-AC43 — chaque choix mène à une scène placée plus bas, sauf les retours en arrière, qui remontent ; aucune carte n'en recouvre une autre", () => {
    expect(d.elements.filter((e) => e.sorte === "scene")).toHaveLength(ATTENDU.scenes);
    expect(d.traits).toHaveLength(ATTENDU.liens + 1);
    for (const t of d.traits) {
      const [de, vers] = [place(t.de), place(t.vers)];
      if (t.remonte) expect(vers.y + vers.h).toBeLessThan(de.y);
      else expect(vers.y).toBeGreaterThan(de.y + de.h);
      // Le trait part du bord de sa carte et arrive au bord de l'autre
      expect(t.points[0].y).toBeCloseTo(t.remonte ? de.y : de.y + de.h, 5);
      expect(t.points.at(-1)!.y).toBeCloseTo(t.remonte ? vers.y + vers.h : vers.y, 5);
    }
    // Les retours en arrière du marais : vers le ponton, la cabane, le cercle, le récit de la passeuse
    expect(d.traits.filter((t) => t.remonte).map((t) => `${t.de}>${t.vers}`).sort()).toEqual(["brume>ponton", "coffre>recit", "enigme>cercle", "ombre>cabane"]);
    const cartes = [...d.places.values()];
    for (let i = 0; i < cartes.length; i++) {
      for (let j = i + 1; j < cartes.length; j++) {
        const [a, b] = [cartes[i], cartes[j]];
        expect(a.x + a.l <= b.x || b.x + b.l <= a.x || a.y + a.h <= b.y || b.y + b.h <= a.y).toBe(true);
      }
    }
    // L'entrée du chapitre en haut, sa sortie en bas
    expect(place("barque").y).toBeLessThan(place("ecluse").y);
  });

  it("V15 — lisibilité : aucun trait ne passe sous une carte, et deux traits ne suivent jamais la même ligne", () => {
    for (const t of d.traits) for (const [a, b] of segments(t.points)) expect(Math.abs(a.x - b.x) < 0.01 || Math.abs(a.y - b.y) < 0.01).toBe(true);
    expect(traitsSousUneCarte(d)).toBe(0);
    expect(traitsConfondus(d)).toBe(0);
  });

  it("V15 — quarante scènes qui se rejoignent, deux à trois choix chacune : disposées en moins d'une demi-seconde, toujours sans trait sous une carte", () => {
    const noeuds = Array.from({ length: 40 }, (_, i) => noeud(i + 1));
    const liens = noeuds.flatMap((_, i) => [2 * i + 1, 2 * i + 2, i + 7].filter((v) => v < 40).map((v, k) => lien(i + 1, v + 1, k)));
    const debut = performance.now();
    const dense = disposer({ noeuds, liens, entrees: [] }, new Map());
    expect(performance.now() - debut).toBeLessThan(500);
    expect(dense.traits.length).toBeGreaterThan(60);
    expect(traitsSousUneCarte(dense)).toBe(0);
    expect(traitsConfondus(dense)).toBe(0);
  });

  it("F03-AC45 — le libellé d'un choix a sa place sur sa flèche : une ligne s'il est court, deux lignes s'il est long, jamais plus large que prévu", () => {
    const libelle = (cle: string) => d.traits.find((t) => t.id === cle)!.libelle!;
    expect(libelle("lanterne>0").h).toBe(LIBELLE.h); // « La décrocher »
    expect(libelle("marche>0")).toMatchObject({ l: LIBELLE.max, h: LIBELLE.h2 }); // « Échanger la plume argentée contre une barque »
    for (const t of d.traits.filter((x) => x.libelle)) {
      // Le libellé est posé sur son trait, hors de toute carte
      const l = t.libelle!;
      expect(l.l).toBeLessThanOrEqual(LIBELLE.max);
      expect(segments(t.points).some(([a, b]) => Math.abs(a.x - l.x) < 0.5 && Math.abs(b.x - l.x) < 0.5 && Math.min(a.y, b.y) <= l.y && l.y <= Math.max(a.y, b.y))).toBe(true);
      expect([...d.places.values()].some((c) => dansUneCarte({ x: l.x, y: l.y }, c))).toBe(false);
    }
    // Le chemin venu d'un autre chapitre n'a pas de libellé : son étiquette suffit
    expect(d.traits.find((t) => t.de.startsWith("entree:"))!.libelle).toBeNull();
  });

  it("F03-AC25, F03-AC46 — un autre chapitre est une étiquette à son nom, un choix qui ne mène nulle part a la sienne ; deux choix vers la même scène d'un autre chapitre se rejoignent", () => {
    expect(d.elements.filter((e) => e.sorte !== "scene").map((e) => (e.sorte === "manque" ? `${e.sorte} ${e.manque}` : `${e.sorte} ${e.chapitre}`)).sort()).toEqual([
      "entree Le gué des saules", "manque sans", "manque supprimee", "sortie Le moulin noyé", "sortie Le sanctuaire",
    ]);
    const deux = disposer(
      { noeuds: [noeud(1), noeud(2)], liens: [lien(1, null, 0, { ailleurs: { chapitre: "Le marais", lien: "/m?scene=5" } }), lien(2, null, 0, { ailleurs: { chapitre: "Le marais", lien: "/m?scene=5" } })], entrees: [] },
      new Map(),
    );
    expect(deux.elements.filter((e) => e.sorte === "sortie")).toHaveLength(1);
    expect(deux.traits.map((t) => t.vers)).toEqual(["sortie:/m?scene=5", "sortie:/m?scene=5"]);
  });

  it("F03-AC44 — la carte garde sa taille ; le départ ou la fin lui ajoutent une bande en tête, ce qui est à regarder une bande au pied", () => {
    expect(place("ile")).toMatchObject({ l: CARTE.l, h: CARTE.h });
    expect(place("trou").h).toBe(CARTE.h + CARTE.bande); // une fin
    expect(place("crapaud").h).toBe(CARTE.h + CARTE.bande); // rien n'y mène
    const depart = disposer({ noeuds: [noeud(1, { depart: true }), noeud(2)], liens: [lien(1, 2)], entrees: [] }, new Map([[id(2), ["sans-suite"]]]));
    expect(depart.places.get(id(1))!.h).toBe(CARTE.h + CARTE.bande);
    expect(depart.places.get(id(2))!.h).toBe(CARTE.h + CARTE.bande);
  });

  it("F03-AC51 — vingt scènes que rien ne relie se rangent en lignes, au lieu de s'étirer sur un seul rang ; elles viennent après ce qui a des chemins", () => {
    const seules = disposer({ noeuds: Array.from({ length: 20 }, (_, i) => noeud(i + 1)), liens: [], entrees: [] }, new Map());
    expect(seules.largeur).toBeLessThanOrEqual(1400);
    expect(new Set([...seules.places.values()].map((p) => p.y)).size).toBeGreaterThan(1);
    // Dans l'ordre du plan, de gauche à droite puis de haut en bas
    const rangees = [...seules.places.entries()].sort((a, b) => a[1].y - b[1].y || a[1].x - b[1].x).map(([cle]) => cle);
    expect(rangees).toEqual(Array.from({ length: 20 }, (_, i) => id(i + 1)));
    // Dans le marais, la scène sans titre, que rien ne relie, vient sous le reste
    expect(place("nouvelle").y).toBeGreaterThan(place("ecluse").y);
    expect(d.largeur).toBeLessThan(1700);
  });

  it("un choix qui ramène à sa propre scène fait une boucle sur le côté de la carte, sans rien déplacer", () => {
    const boucle = disposer({ noeuds: [noeud(1), noeud(2)], liens: [lien(1, 2), lien(1, 1, 1)], entrees: [] }, new Map());
    const carte = boucle.places.get(id(1))!;
    const trait = boucle.traits.find((t) => t.de === t.vers)!;
    expect(trait.points[0].x).toBe(carte.x + carte.l);
    expect(trait.points.every((p) => p.y > carte.y && p.y < carte.y + carte.h)).toBe(true);
  });
});
