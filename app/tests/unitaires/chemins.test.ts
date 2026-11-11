import { describe, expect, it } from "vitest";
import { CARTE, disposer, LIBELLE, type Disposition, type Point } from "@/composants/chemins/disposer";
import {
  adoucir, carteDeReference, centrerSur, changerDeTaille, dansLeCadre, decalerLaVue, englober, garderAuMemePoint, montrerLaBoite, partVue, pasDuGlissement, retenirLeSchema, sansVideInutile, suivreLeCadre, tailleLisible, tailleQuiMontre,
  vueDeDepart, vueDEnsemble, type Cadre,
} from "@/composants/chemins/ancrage";
import { aRegarder, compteARegarder, ordreDeLecture, peutConstruire, vueDuChapitre, type Chemins, type LienDeChemin, type NoeudDeChemin } from "@/domaine/chemins";
import { fautConfirmer } from "@/domaine/recit";
import { ATTENDU, SCENES } from "../../scripts/marais-des-feux-follets";

/**
 * Vue « Chemins » (F03.1, « Vue Chemins à reprendre ») : ce qu'il y a « à regarder », et la
 * disposition du schéma — sans base ni navigateur. Le chapitre d'essai est « Le marais des
 * feux follets » (scripts/marais-des-feux-follets.ts) : trente-deux scènes, quarante-neuf choix.
 */

const id = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const noeud = (n: number, extra: Partial<NoeudDeChemin> = {}): NoeudDeChemin => ({ id: id(n), reference: n, titre: `Scène ${n}`, etat: "cours", vide: true, depart: false, fin: false, lien: "", ...extra });
const lien = (de: number, vers: number | null, k = 0, extra: Partial<LienDeChemin> = {}): LienDeChemin => ({
  id: id(5000 + de * 10 + k), de: id(de), vers: vers === null ? null : id(vers), libelle: `Aller en ${vers}`, cache: false, ...extra,
});

/** Le marais tel que l'adulte le lit : ses deux sorties vers d'autres chapitres, et le chemin qui y arrive. */
function marais({ pourEleve = false } = {}): Chemins {
  // L'élève connaît les fins de son chapitre et sait qu'une scène a un lien caché, sans le voir (F03-AC50 révisé)
  const noeuds = SCENES.map((s, i) => noeud(100 + i, { id: s.cle, titre: s.titre, vide: !s.texte, fin: s.fin === true, ...(pourEleve && s.cachee ? { suiteCachee: true } : {}) }));
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

  it("F03-AC50 — pour un élève (révisé le 14 octobre 2026) : ses choix et les scènes sans suite sont à regarder ; « rien n'y mène » ne lui est jamais dit, et une scène à lien caché a une suite", () => {
    const regard = aRegarder(marais({ pourEleve: true }), { rienNyMene: false });
    expect(regard.sortes.map((s) => compteARegarder(s.sorte, s.ou.length))).toEqual([
      "1 choix sans destination", "1 choix vers une scène supprimée", `${ATTENDU.scenesSansSuite} scènes sans suite`,
    ]);
    expect([...regard.marques.values()].flat()).not.toContain("rien-n-y-mene");
    // Le même chapitre pour l'adulte compte les mêmes scènes sans suite
    expect(aRegarder(marais()).sortes.find((s) => s.sorte === "sans-suite")?.ou).toEqual(regard.sortes.find((s) => s.sorte === "sans-suite")?.ou);
  });
});

describe("Le schéma, de haut en bas (F03.1)", () => {
  it("F13-AC43 — les suites d'une scène se lisent de gauche à droite dans l'ordre de ses choix", () => {
    const d = disposer({ noeuds: [1, 2, 3, 4].map((n) => noeud(n)), liens: [lien(1, 2, 0), lien(1, 3, 1), lien(1, 4, 2)], entrees: [] }, new Map());
    const x = (n: number) => d.places.get(id(n))!.x;
    expect(x(2)).toBeLessThan(x(3));
    expect(x(3)).toBeLessThan(x(4));
  });
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

describe("Construire dans « Chemins » (F03.1)", () => {
  // Le cadre tel que le schéma le remplit, sur un portable de 1 366 × 768 : en état « plan », puis « travail »
  const MARGE = 28;
  const PLAN: Cadre = { l: 1134, h: 560 };
  const TRAVAIL: Cadre = { l: 700, h: 560 };
  const BORNES = { min: 0.7, max: 1 };
  const schema = (d: Disposition): Cadre => ({ l: d.largeur, h: d.hauteur });
  const coin = (d: Disposition, id: string) => ({ x: d.places.get(id)!.x, y: d.places.get(id)!.y });

  it("F03-AC54 — « Le marais des feux follets », la vue tirée sur ses dernières scènes : une scène ajoutée sous l'une d'elles, cette carte reste au même point du cadre et la taille du schéma ne change pas", () => {
    const avant = marais();
    const d1 = disposer(avant, aRegarder(avant).marques);
    const zoom = tailleLisible(d1.largeur, PLAN, MARGE, BORNES);
    // Les dernières scènes : celles du bas du schéma. On ajoute sous chacune d'elles, tour à tour
    const dernieres = [...avant.noeuds].sort((a, b) => d1.places.get(b.id)!.y - d1.places.get(a.id)!.y).slice(0, 6);
    for (const origine of dernieres) {
      const apres: Chemins = {
        ...avant,
        noeuds: [...avant.noeuds, noeud(999, { id: "scene-ajoutee", titre: "La scène ajoutée" })],
        liens: [...avant.liens, { id: "nouveau-choix", de: origine.id, vers: "scene-ajoutee", libelle: "Continuer", cache: false }],
      };
      const d2 = disposer(apres, aRegarder(apres).marques);
      // La vue est tirée jusqu'à cette scène, au milieu du cadre
      const vue = centrerSur(d1.places.get(origine.id)!, PLAN, zoom);
      const ou = dansLeCadre(vue, coin(d1, origine.id));
      const suite = garderAuMemePoint(vue, coin(d1, origine.id), coin(d2, origine.id));
      // La carte d'où l'on part est exactement où elle était, et le schéma à la même taille
      expect(dansLeCadre(suite, coin(d2, origine.id)).x).toBeCloseTo(ou.x, 6);
      expect(dansLeCadre(suite, coin(d2, origine.id)).y).toBeCloseTo(ou.y, 6);
      expect(suite.zoom).toBe(zoom);
      // Lue à l'écran, la correction est la même : la carte s'y est déplacée d'un écart, la vue se décale d'autant
      const deplacee = dansLeCadre(vue, coin(d2, origine.id));
      const lue = decalerLaVue(vue, { x: deplacee.x - ou.x, y: deplacee.y - ou.y });
      expect(lue.x).toBeCloseTo(suite.x, 6);
      expect(lue.y).toBeCloseTo(suite.y, 6);
      // La nouvelle carte existe, sous elle
      expect(d2.places.get("scene-ajoutee")!.y).toBeGreaterThan(d2.places.get(origine.id)!.y);
    }
  });

  it("F03-AC54 — la vue n'a pas de bord : au tout début du schéma comme à sa fin, la carte reste en place sans que rien soit poussé ni allongé", () => {
    // La carte a glissé de 40 points vers la gauche dans le schéma, alors que la vue était à son début
    const debut = garderAuMemePoint({ x: 0, y: 0, zoom: 1 }, { x: 100, y: 50 }, { x: 60, y: 50 });
    expect(debut).toEqual({ x: 40, y: 0, zoom: 1 });
    expect(dansLeCadre(debut, { x: 60, y: 50 })).toEqual({ x: 100, y: 50 });
    // À une taille réduite, le décalage se compte à cette taille
    const reduit = garderAuMemePoint({ x: -300, y: -900, zoom: 0.7 }, { x: 500, y: 1400 }, { x: 620, y: 1400 });
    expect(dansLeCadre(reduit, { x: 620, y: 1400 })).toEqual(dansLeCadre({ x: -300, y: -900, zoom: 0.7 }, { x: 500, y: 1400 }));
    // Rien n'a bougé : rien à faire
    expect(garderAuMemePoint({ x: 12, y: 34, zoom: 0.8 }, { x: 5, y: 5 }, { x: 5, y: 5 })).toEqual({ x: 12, y: 34, zoom: 0.8 });
  });

  it("F03-AC54 — sans geste qui la désigne, la carte de référence est celle qu'on a cliquée, sinon la plus proche du milieu de ce qu'on voit", () => {
    const rects = new Map([
      ["haut", { x: 100, y: 100, l: 130, h: 56 }],
      ["milieu", { x: 500, y: 380, l: 130, h: 56 }],
      ["bas", { x: 900, y: 700, l: 130, h: 56 }],
    ]);
    const vu = { x: 0, y: 0, l: 1200, h: 800 };
    expect(carteDeReference(rects, "bas", vu)).toBe("bas");
    expect(carteDeReference(rects, null, vu)).toBe("milieu");
    expect(carteDeReference(rects, "supprimee", vu)).toBe("milieu");
    expect(carteDeReference(new Map(), null, vu)).toBeNull();
  });

  it("F03-AC58 — un cadre qu'on tire : à l'ouverture, le marais est à la taille lisible, au milieu de la largeur, son haut en haut du cadre ; « Tout voir » le montre entier", () => {
    const m = marais();
    const d = disposer(m, aRegarder(m).marques);
    const zoom = tailleLisible(d.largeur, PLAN, MARGE, BORNES);
    // Jamais sous la taille où les titres se lisent, jamais au-dessus de la taille réelle
    expect(zoom).toBeGreaterThanOrEqual(0.7);
    expect(zoom).toBeLessThanOrEqual(1);
    const depart = vueDeDepart(schema(d), PLAN, MARGE, zoom);
    expect(depart.y).toBe(MARGE);
    expect(depart.x + (d.largeur * zoom) / 2).toBeCloseTo(PLAN.l / 2, 0);
    // Le marais est plus haut que le cadre : on le tire, la page ne défile pas ; « Tout voir » le fait tenir
    expect(d.hauteur * zoom).toBeGreaterThan(PLAN.h);
    const tout = vueDEnsemble(schema(d), PLAN, MARGE, { min: 0.05, max: 1 });
    const vu = partVue(tout, PLAN);
    expect(vu.x).toBeLessThanOrEqual(0);
    expect(vu.y).toBeLessThanOrEqual(0);
    expect(vu.x + vu.l).toBeGreaterThanOrEqual(d.largeur);
    expect(vu.y + vu.h).toBeGreaterThanOrEqual(d.hauteur);
    // Un chapitre de quatre scènes tient à sa taille réelle
    const petit: Chemins = { noeuds: [noeud(1), noeud(2), noeud(3), noeud(4)], liens: [lien(1, 2), lien(1, 3, 1), lien(2, 4)], entrees: [] };
    expect(tailleLisible(disposer(petit, aRegarder(petit).marques).largeur, PLAN, MARGE, BORNES)).toBe(1);
  });

  it("F03-AC58 — changer de taille garde au milieu du cadre ce qu'on regardait ; on ne perd pas le schéma en le tirant", () => {
    const vue = { x: -400, y: -900, zoom: 1 };
    const milieu = { x: (PLAN.l / 2 - vue.x) / vue.zoom, y: (PLAN.h / 2 - vue.y) / vue.zoom };
    const reduite = changerDeTaille(vue, PLAN, 0.6);
    expect(reduite.zoom).toBe(0.6);
    expect(dansLeCadre(reduite, milieu).x).toBeCloseTo(PLAN.l / 2, 6);
    expect(dansLeCadre(reduite, milieu).y).toBeCloseTo(PLAN.h / 2, 6);
    // Tiré très loin vers la gauche et vers le haut : il en reste un morceau dans le cadre
    const s = { l: 1500, h: 2400 };
    const retenue = retenirLeSchema({ x: -5000, y: -9000, zoom: 1 }, s, PLAN);
    expect(retenue.x + s.l).toBeGreaterThanOrEqual(240);
    expect(retenue.y + s.h).toBeGreaterThanOrEqual(240);
    // Vers la droite et vers le bas aussi
    const autre = retenirLeSchema({ x: 5000, y: 9000, zoom: 1 }, s, PLAN);
    expect(autre.x).toBeLessThanOrEqual(PLAN.l - 240);
    expect(autre.y).toBeLessThanOrEqual(PLAN.h - 240);
    // Tant qu'il se voit, la vue n'est pas touchée
    expect(retenirLeSchema(vue, s, PLAN)).toBe(vue);
  });

  it("F03-AC59 — état « travail » : la scène cliquée vient au milieu du schéma rétréci, un peu au-dessus, à la même taille ; une autre carte cliquée y vient à son tour", () => {
    const m = marais();
    const d = disposer(m, aRegarder(m).marques);
    const zoom = tailleLisible(d.largeur, PLAN, MARGE, BORNES);
    for (const n of [m.noeuds[0], m.noeuds[12], m.noeuds[31]]) {
      const p = d.places.get(n.id)!;
      const vue = centrerSur(p, TRAVAIL, zoom, 0.42);
      const centre = dansLeCadre(vue, { x: p.x + p.l / 2, y: p.y + p.h / 2 });
      expect(centre.x).toBeCloseTo(TRAVAIL.l / 2, 6);
      expect(centre.y).toBeCloseTo(TRAVAIL.h * 0.42, 6);
      expect(vue.zoom).toBe(zoom);
    }
  });

  it("F03-AC59 — la scène cliquée vient au milieu sans montrer de vide pour rien : le haut du schéma ne descend pas, un petit chapitre reste au milieu de la largeur ; le bas reste libre", () => {
    const m = marais();
    const d = disposer(m, aRegarder(m).marques);
    const s = { l: d.largeur, h: d.hauteur };
    const zoom = tailleLisible(d.largeur, PLAN, MARGE, BORNES);
    // La première scène, tout en haut : centrée, elle laisserait un grand vide au-dessus d'elle
    const haut = [...m.noeuds].sort((a, b) => d.places.get(a.id)!.y - d.places.get(b.id)!.y)[0];
    const voulue = centrerSur(d.places.get(haut.id)!, TRAVAIL, zoom, 0.42);
    expect(voulue.y).toBeGreaterThan(MARGE);
    const tenue = sansVideInutile(voulue, s, TRAVAIL, MARGE);
    expect(tenue.y).toBe(MARGE);
    // Le schéma, plus large que le cadre, ne laisse pas de vide sur un côté
    expect(tenue.x).toBeLessThanOrEqual(MARGE);
    expect(tenue.x + s.l * zoom).toBeGreaterThanOrEqual(TRAVAIL.l - MARGE);
    // La dernière scène, tout en bas : elle vient bien au milieu, sa suite se construira dessous
    const bas = [...m.noeuds].sort((a, b) => d.places.get(b.id)!.y - d.places.get(a.id)!.y)[0];
    const vers = centrerSur(d.places.get(bas.id)!, TRAVAIL, zoom, 0.42);
    expect(sansVideInutile(vers, s, TRAVAIL, MARGE).y).toBe(vers.y);
    // Un petit chapitre tient dans la largeur : il y reste au milieu, quelle que soit la carte cliquée
    const petit = sansVideInutile({ x: 300, y: -40, zoom: 1 }, { l: 400, h: 300 }, TRAVAIL, MARGE);
    expect(petit).toEqual({ x: (TRAVAIL.l - 400) / 2, y: -40, zoom: 1 });
  });

  it("F03-AC59 — le passage glisse une seule fois : le cadre change de place et de largeur en route (l'espace s'ouvre, la colonne se replie) sans que le schéma saute", () => {
    // Dans la page : le cadre commence à 232 points, la vue est à 80 ; le coin du schéma est donc à 312
    const depart = { x: 232 + 80, y: 190 + 28, zoom: 0.8 };
    const p = { x: 300, y: 500 };
    const dansLaPage = (cadre: { x: number; y: number }, vue: { x: number; y: number; zoom: number }) => ({ x: cadre.x + dansLeCadre(vue, p).x, y: cadre.y + dansLeCadre(vue, p).y });
    const avant = { x: depart.x + p.x * 0.8, y: depart.y + p.y * 0.8 };
    // Au départ, rien n'a bougé à l'écran, que le cadre soit encore à 232 ou déjà à 64, et quelle que soit la vue visée
    for (const cadre of [{ x: 232, y: 190 }, { x: 64, y: 190 }]) {
      for (const vers of [{ x: -40, y: -120, zoom: 0.8 }, { x: 200, y: 28, zoom: 0.8 }]) {
        expect(dansLaPage(cadre, pasDuGlissement(depart, vers, cadre, 0))).toEqual(avant);
      }
    }
    // À l'arrivée, la vue est celle qu'on visait dans le cadre tel qu'il est devenu
    const vers = { x: -40, y: -120, zoom: 0.8 };
    expect(pasDuGlissement(depart, vers, { x: 64, y: 190 }, 1)).toEqual(vers);
    // En route, le cadre passe de 232 à 64 : la carte ne saute pas, elle continue son chemin d'un seul mouvement
    const juste = dansLaPage({ x: 232, y: 190 }, pasDuGlissement(depart, { x: 128, y: -120, zoom: 0.8 }, { x: 232, y: 190 }, adoucir(0.05)));
    const apres = dansLaPage({ x: 64, y: 190 }, pasDuGlissement(depart, vers, { x: 64, y: 190 }, adoucir(0.05)));
    expect(Math.abs(apres.x - juste.x)).toBeLessThan(1);
    // Le rythme : de 0 à 1, sans jamais reculer, presque immobile au départ
    expect(adoucir(0)).toBe(0);
    expect(adoucir(1)).toBe(1);
    expect(adoucir(0.05)).toBeLessThan(0.001);
    let dernier = 0;
    for (let t = 0; t <= 1; t += 0.05) {
      expect(adoucir(t)).toBeGreaterThanOrEqual(dernier);
      dernier = adoucir(t);
    }
  });

  it("F03-AC59 — le cadre change de place quand la colonne se replie : les cartes restent d'abord où elles étaient à l'écran", () => {
    // Le cadre commençait à 232 points du bord de la fenêtre, il commence à 64 : la vue se décale d'autant
    const vue = { x: 80, y: 28, zoom: 0.8 };
    const suite = suivreLeCadre(vue, { x: 232, y: 190 }, { x: 64, y: 190 });
    const p = { x: 300, y: 500 };
    expect(64 + dansLeCadre(suite, p).x).toBe(232 + dansLeCadre(vue, p).x);
    expect(dansLeCadre(suite, p).y).toBe(dansLeCadre(vue, p).y);
  });

  it("F13.7 — le bloc proposé tient entier dans le cadre, à gauche de l'espace de travail : la vue bouge juste assez, et le schéma ne se réduit que s'il le faut, jamais sous la taille où les libellés se lisent", () => {
    const marge = { x: 24, y: 28 };
    const vue = { x: 0, y: 0, zoom: 1 };
    // Déjà en vue : rien ne bouge
    expect(montrerLaBoite(vue, { x: 100, y: 100, l: 300, h: 200 }, TRAVAIL, marge)).toEqual(vue);
    // Il dépasse en bas et à droite : la vue se décale de ce qu'il faut, pas plus
    const decalee = montrerLaBoite(vue, { x: 500, y: 400, l: 300, h: 300 }, TRAVAIL, marge);
    expect(dansLeCadre(decalee, { x: 800, y: 700 })).toEqual({ x: TRAVAIL.l - marge.x, y: TRAVAIL.h - marge.y });
    // Plus grand que le cadre : il se réduit, sans passer sous 0,62
    expect(tailleQuiMontre({ x: 0, y: 0, l: 900, h: 500 }, TRAVAIL, 1, marge, 0.62)).toBeLessThan(1);
    expect(tailleQuiMontre({ x: 0, y: 0, l: 4000, h: 500 }, TRAVAIL, 1, marge, 0.62)).toBe(0.62);
    expect(tailleQuiMontre({ x: 0, y: 0, l: 300, h: 200 }, TRAVAIL, 1, marge, 0.62)).toBe(1);
    expect(englober([{ x: 10, y: 20, l: 100, h: 50 }, { x: 200, y: 300, l: 100, h: 50 }])).toEqual({ x: 10, y: 20, l: 290, h: 330 });
    expect(englober([])).toBeNull();
  });

  it("F03-AC61 — « Chemins » s'ouvre en premier dans un chapitre à choix, « Scènes » restant à un clic ; en récit classique, « Scènes »", () => {
    expect(vueDuChapitre(undefined, true)).toBe("chemins");
    expect(vueDuChapitre("chemins", true)).toBe("chemins");
    expect(vueDuChapitre("scenes", true)).toBe("scenes");
    expect(vueDuChapitre(undefined, false)).toBe("scenes");
    expect(vueDuChapitre("chemins", false)).toBe("scenes");
  });

  it("F03-AC57 — les gestes sont à l'adulte, en récit à choix, sur un écran large : ni l'élève, ni le téléphone, ni le récit classique", () => {
    expect(peutConstruire({ adulte: true, aChoix: true, etroit: false })).toBe(true);
    expect(peutConstruire({ adulte: false, aChoix: true, etroit: false })).toBe(false);
    expect(peutConstruire({ adulte: true, aChoix: true, etroit: true })).toBe(false);
    expect(peutConstruire({ adulte: true, aChoix: false, etroit: false })).toBe(false);
  });

  it("F03-AC56 — depuis le schéma, une scène sans texte se supprime sans confirmation, même si un choix y mène ; une scène écrite demande toujours confirmation", () => {
    expect(fautConfirmer({ ecrites: 0, menentIci: [{}] }, true)).toBe(false);
    expect(fautConfirmer({ ecrites: 0, menentIci: [] }, true)).toBe(false);
    expect(fautConfirmer({ ecrites: 1, menentIci: [] }, true)).toBe(true);
    // Ailleurs, le choix qui y mène est annoncé avant confirmation (F03-AC13)
    expect(fautConfirmer({ ecrites: 0, menentIci: [{}] })).toBe(true);
    expect(fautConfirmer({ ecrites: 0, menentIci: [] })).toBe(false);
  });
});
