import { describe, expect, it } from "vitest";
import { CARTE, disposer, lignesDe, ONGLET, teteDeCarte, type Disposition, type Mesure, type Point } from "@/composants/chemins/disposer";
import {
  adoucir, carteDeReference, centrerSur, changerDeTaille, dansLeCadre, decalerLaVue, deLoin, englober, garderAuMemePoint, montrerLaBoite, partVue, pasDuGlissement, retenirLeSchema, sansVideInutile, suivreLeCadre, tailleLisible, tailleQuiMontre,
  vueDeDepart, vueDEnsemble, type Cadre,
} from "@/composants/chemins/ancrage";
import { cheminsAvecLeBloc, type Proposition } from "@/domaine/bloc-de-scenes";
import { aRegarder, cheminsDuPlan, compteARegarder, ordreDeLecture, peutConstruire, retoursEnArriere, vueDuChapitre, type Chemins, type LienDeChemin, type NoeudDeChemin } from "@/domaine/chemins";
import { fautConfirmer, type Chapitre, type ElevePlan, type Plan, type Scene } from "@/domaine/recit";
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

/** Les traits dessinés au repos : la ligne d'un retour en arrière n'est tracée qu'à la demande, par-dessus le schéma. */
const auRepos = (d: Disposition) => d.traits.filter((t) => !t.retour);

/** Le nombre de traits qui passent sous une carte autre que celles qu'ils relient. */
function traitsSousUneCarte(d: Disposition): number {
  return auRepos(d).filter((t) =>
    [...d.places].some(([carte, place]) => {
      if (carte === t.de || carte === t.vers) return false;
      // Des points pris tout le long de chaque segment
      return segments(t.points).some(([a, b]) => Array.from({ length: 41 }, (_, k) => ({ x: a.x + ((b.x - a.x) * k) / 40, y: a.y + ((b.y - a.y) * k) / 40 })).some((p) => dansUneCarte(p, place)));
    }),
  ).length;
}

/** Deux traits qui suivent la même ligne sur plus de quelques points : on ne saurait plus lequel est lequel. */
function traitsConfondus(d: Disposition): number {
  const morceaux = auRepos(d).flatMap((t) => segments(t.points).map(([a, b]) => ({ trait: t.id, a, b })));
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

  it("F03-AC43, F03-AC64 — chaque trait dessiné mène à une scène placée plus bas ; les quatre retours en arrière ne pèsent pas dans la disposition ; aucune carte n'en recouvre une autre", () => {
    expect(d.elements.filter((e) => e.sorte === "scene")).toHaveLength(ATTENDU.scenes);
    // Les retours en arrière du marais : vers le ponton, la cabane, le cercle, le récit de la passeuse
    const retours = d.traits.filter((t) => t.retour);
    expect(retours.map((t) => `${t.de}>${t.vers}`).sort()).toEqual(["brume>ponton", "coffre>recit", "enigme>cercle", "ombre>cabane"]);
    // Un trait par suite dans le chapitre et un pour le chemin venu d'ailleurs : ni les deux sorties ni les deux choix à regarder n'en ont
    expect(auRepos(d)).toHaveLength(ATTENDU.liens + 1 - 2 - 2 - retours.length);
    for (const t of auRepos(d)) {
      const [de, vers] = [place(t.de), place(t.vers)];
      expect(vers.y).toBeGreaterThan(de.y + de.h);
      // Le trait part du bord bas de sa carte et arrive au bord haut de l'autre
      expect(t.points[0].y).toBeCloseTo(de.y + de.h, 5);
      expect(t.points.at(-1)!.y).toBeCloseTo(vers.y, 5);
    }
    // Les cartes ont la place qu'elles auraient si ces quatre choix ne menaient nulle part
    const sansRetour = new Set(retours.map((t) => t.id));
    const sans: Chemins = { ...chemins, liens: chemins.liens.map((l) => (sansRetour.has(l.id) ? { ...l, vers: null, manque: "sans" as const } : l)) };
    expect([...disposer(sans, aRegarder(chemins).marques).places]).toEqual([...d.places]);
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

  it("F03-AC25, F03-AC46 — un chemin venu d'un autre chapitre garde son étiquette, au-dessus de la scène ; une sortie et un choix à regarder n'en ont plus : ils se lisent dans leur onglet", () => {
    expect(d.elements.filter((e) => e.sorte !== "scene").map((e) => `${e.sorte} ${e.chapitre}`)).toEqual(["entree Le gué des saules"]);
    const entree = d.traits.find((t) => t.de.startsWith("entree:"))!;
    expect(place(entree.de).y + place(entree.de).h).toBeLessThan(place("barque").y);
  });

  it("F03-AC44 — la tête de la carte suit son titre, une ligne ou deux ; en tête une bande pour le départ ou « Rien n'y mène », au pied les onglets, à défaut la fin ou « Sans suite »", () => {
    const pied = (cle: string) => d.onglets.get(cle)![0].h;
    // Mesurée sans navigateur, à 7,4 points le signe : un titre de deux lignes garde la tête entière
    const deux = teteDeCarte(2);
    expect(deux).toBe(CARTE.h);
    expect(place("ile")).toMatchObject({ l: 2 * ONGLET.l, h: teteDeCarte(1) + pied("ile") }); // deux onglets : le titre tient sur une ligne
    expect(place("trou")).toMatchObject({ l: CARTE.l, h: deux + CARTE.bande }); // une fin, sans choix
    expect(place("crapaud").h).toBe(deux + CARTE.bande + pied("crapaud")); // rien n'y mène, et un choix
    expect(place("allumee").h).toBe(deux + CARTE.bande); // sans suite
    expect(place("nouvelle").h).toBe(teteDeCarte(1) + 2 * CARTE.bande); // rien n’y mène, en tête ; sans suite, au pied ; un titre court
    // « Scène 1 » tient sur une ligne : pas de seconde ligne vide
    const depart = disposer({ noeuds: [noeud(1, { depart: true }), noeud(2, { fin: true })], liens: [lien(1, 2)], entrees: [] }, new Map());
    expect(teteDeCarte(1)).toBe(CARTE.h - CARTE.ligneDeTitre);
    expect(depart.places.get(id(1))!.h).toBe(teteDeCarte(1) + CARTE.bande + depart.onglets.get(id(1))![0].h);
    expect(depart.places.get(id(2))!.h).toBe(teteDeCarte(1) + CARTE.bande);
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

  it("F03-AC64 — un choix qui ramène à sa propre scène le dit dans son onglet, sans trait", () => {
    const boucle = disposer({ noeuds: [noeud(1), noeud(2)], liens: [lien(1, 2), lien(1, 1, 1)], entrees: [] }, new Map());
    expect(boucle.onglets.get(id(1))!.map((o) => o.sorte)).toEqual(["suite", "ici"]);
    expect(boucle.traits.map((t) => `${t.de}>${t.vers}`)).toEqual([`${id(1)}>${id(2)}`]);
  });
});

describe("Les choix en onglets (F03.1, 11 novembre 2026)", () => {
  const chemins = marais();
  const d = disposer(chemins, aRegarder(chemins).marques);
  const place = (cle: string) => d.places.get(cle)!;
  const onglet = (cle: string) => [...d.onglets.values()].flat().find((o) => o.id === cle)!;
  /** Une mesure fixe, pour compter les lignes d'une phrase sans navigateur : cinq points et demi par lettre */
  const mesure: Mesure = (texte) => texte.length * 5.5;

  /** Où va le trait d'un onglet une fois sorti de sa carte : là où il redescend après son premier déplacement de côté. */
  const vaVers = (x: Disposition, cle: string): number => {
    const points = x.traits.find((t) => t.id === cle)!.points;
    return (points[2] ?? points.at(-1)!).x;
  };
  /** Les traits d'une carte ne se croisent pas sous elle : de gauche à droite, ses onglets vont de gauche à droite. */
  const sansCroisement = (x: Disposition, scene: string): boolean => {
    const vont = x.onglets.get(scene)!.filter((o) => o.sorte === "suite").map((o) => vaVers(x, o.id));
    return vont.every((v, i) => i === 0 || vont[i - 1] <= v + 0.01);
  };

  it("F03-AC62 — « Marais — la barque s'enlise » : un onglet par choix, côte à côte au pied de la carte ; chaque trait part du point de sortie de son onglet ; aucun trait ne porte de texte", () => {
    const onglets = d.onglets.get("barque")!;
    expect(onglets.map((o) => chemins.liens.find((l) => l.id === o.id)!.libelle).sort()).toEqual(["Appeler à l’aide", "Longer la vieille digue", "Suivre les feux follets"]);
    const carte = place("barque");
    expect(carte.l).toBe(3 * ONGLET.l);
    onglets.forEach((o, i) => {
      // Côte à côte, au pied de la carte, sur toute sa largeur
      expect(o).toMatchObject({ x: carte.x + i * ONGLET.l, l: ONGLET.l, y: carte.y + carte.h - o.h, sortie: { x: carte.x + i * ONGLET.l + ONGLET.l / 2, y: carte.y + carte.h } });
      expect(d.traits.find((t) => t.id === o.id)!.points[0]).toEqual(o.sortie);
    });
    for (const t of d.traits) expect(Object.keys(t).sort()).toEqual(["d", "de", "id", "points", "retour", "vers"]);
    // Partout : un onglet par choix de la scène, ni plus ni moins, et aucun croisement sous une carte
    for (const [scene, liste] of d.onglets) {
      expect(liste.map((o) => o.id).sort()).toEqual(chemins.liens.filter((l) => l.de === scene).map((l) => l.id).sort());
      expect(sansCroisement(d, scene)).toBe(true);
    }
  });

  it("F03-AC62 — les onglets se rangent comme partent leurs traits, pour qu'ils ne se croisent pas sous la carte ; un onglet sans trait garde sa place dans l'ordre du texte", () => {
    // « 1 » et « 4 » mènent toutes deux à « 2 » et « 3 », l'une dans un ordre, l'autre dans l'autre : la
    // disposition ne peut suivre l'ordre du texte que pour l'une des deux
    const noeuds = [1, 2, 3, 4].map((n) => noeud(n));
    const liens = [lien(1, 2, 0), lien(1, 3, 1), lien(4, 3, 0), lien(4, 2, 1)];
    const x = disposer({ noeuds, liens, entrees: [] }, new Map());
    const ordre = (de: number) => x.onglets.get(id(de))!.map((o) => o.id);
    const duTexte = (de: number) => liens.filter((l) => l.de === id(de)).map((l) => l.id);
    for (const de of [1, 4]) {
      expect(sansCroisement(x, id(de))).toBe(true);
      // De gauche à droite, les onglets suivent la place des scènes où ils mènent
      const scenes = x.onglets.get(id(de))!.map((o) => x.places.get(liens.find((l) => l.id === o.id)!.vers!)!.x);
      expect(scenes[0]).toBeLessThan(scenes[1]);
    }
    // L'une des deux cartes a donc ses onglets dans un autre ordre que son texte
    expect([1, 4].filter((de) => ordre(de).join() !== duTexte(de).join())).toHaveLength(1);

    // Un choix sans destination, entre deux choix qui mènent quelque part : il reste au milieu
    const avecManque = [lien(1, 2, 0), lien(1, null, 1, { manque: "sans" }), lien(1, 3, 2), lien(4, 3, 0), lien(4, 2, 1)];
    for (const essai of [avecManque, [avecManque[0], avecManque[1], avecManque[2], lien(4, 2, 0), lien(4, 3, 1)]]) {
      const y = disposer({ noeuds, liens: essai, entrees: [] }, new Map());
      expect(y.onglets.get(id(1))!.map((o) => o.sorte)).toEqual(["suite", "manque", "suite"]);
      expect(sansCroisement(y, id(1))).toBe(true);
    }
  });

  it("F03-AC63 — un onglet borné : 128 points de large et trois lignes au plus, une phrase plus longue étant coupée ; seul, il prend la largeur de sa carte ; quatre choix, une carte de quatre onglets sur un seul rang", () => {
    const mesuree = disposer(chemins, aRegarder(chemins).marques, mesure);
    const echanger = [...mesuree.onglets.values()].flat().find((o) => o.id === "marche>0")!; // « Échanger la plume argentée contre une barque »
    expect(echanger).toMatchObject({ l: ONGLET.l, lignes: 3, coupe: false });
    expect([...mesuree.onglets.values()].flat().every((o) => o.lignes <= ONGLET.lignes && o.l <= CARTE.l)).toBe(true);
    // Le seul choix d'une scène prend la largeur de sa carte
    expect(onglet("bocal>0").l).toBe(place("bocal").l);
    expect(place("bocal").l).toBe(CARTE.l);
    // Une phrase plus longue que trois lignes est coupée : elle se lira en entier pour la scène survolée ou cliquée
    const longue = lien(1, 2, 0, { libelle: "Traverser le pont de cordes en tenant la lanterne bien haut, sans regarder l’eau noire qui tourbillonne dessous" });
    const quatre = disposer({ noeuds: [1, 2, 3, 4, 5].map((n) => noeud(n)), liens: [longue, lien(1, 3, 1), lien(1, 4, 2), lien(1, 5, 3)], entrees: [] }, new Map(), mesure);
    const onglets = quatre.onglets.get(id(1))!;
    expect(onglets[0]).toMatchObject({ lignes: 3, coupe: true });
    expect(quatre.places.get(id(1))!.l).toBe(4 * ONGLET.l);
    expect(new Set(onglets.map((o) => o.y)).size).toBe(1);
    expect(new Set(onglets.map((o) => o.h)).size).toBe(1);
    // Le compte des lignes : coupé aux espaces, un mot trop long coupé où il faut, une espace insécable ne coupe pas
    const cinq = (t: string) => t.length * 5;
    expect(lignesDe("Appeler à l’aide", 100, cinq)).toBe(1);
    expect(lignesDe("Les suivre de loin, sans faire de bruit", 100, cinq)).toBe(2);
    expect(lignesDe("Anticonstitutionnellement", 100, cinq)).toBe(2);
    expect(lignesDe("Qui va là\u00a0? demande la passeuse", 100, cinq)).toBe(2);
  });

  it("F03-AC62 — un choix qui mène à deux scènes garde un seul onglet, d'où partent deux traits, chacun de son point de sortie", () => {
    const digue = { libelle: "Longer la vieille digue", choix: "barque:3" };
    const x = disposer(
      { noeuds: [1, 2, 3, 4].map((n) => noeud(n)), liens: [lien(1, 2, 0, digue), lien(1, 3, 1, digue), lien(1, 4, 2, { choix: "barque:4" })], entrees: [] },
      new Map(),
    );
    const onglets = x.onglets.get(id(1))!;
    expect(onglets).toHaveLength(2);
    const double = onglets.find((o) => o.destinations.length === 2)!;
    expect(double).toMatchObject({ id: lien(1, 2).id, sorte: "suite", l: ONGLET.l });
    expect(x.places.get(id(1))!.l).toBe(Math.max(CARTE.l, 2 * ONGLET.l));
    const sorties = double.destinations.map((d) => d.sortie!);
    expect(new Set(sorties.map((p) => p.x)).size).toBe(2);
    for (const p of sorties) {
      expect(p.x).toBeGreaterThan(double.x);
      expect(p.x).toBeLessThan(double.x + double.l);
    }
    for (const dest of double.destinations) expect(x.traits.find((t) => t.id === dest.id)!.points[0]).toEqual(dest.sortie);
  });

  it("F03-AC64 — « Renoncer et revenir au cercle » : un retour en arrière, écrit dans l'onglet ; sa ligne, tracée à la demande, va de l'onglet au côté de la scène où il revient", () => {
    const o = onglet("enigme>0");
    expect(o.sorte).toBe("retour");
    const ligne = d.traits.find((t) => t.id === "enigme>0")!;
    expect(ligne).toMatchObject({ de: "enigme", vers: "cercle", retour: true });
    expect(ligne.points[0]).toEqual(o.sortie);
    const cercle = place("cercle");
    const bout = ligne.points.at(-1)!;
    expect([cercle.x, cercle.x + cercle.l]).toContain(bout.x);
    expect(bout.y).toBeGreaterThan(cercle.y);
    expect(bout.y).toBeLessThan(cercle.y + cercle.h);
    // À angles droits, comme les autres traits
    for (const [a, b] of segments(ligne.points)) expect(Math.abs(a.x - b.x) < 0.01 || Math.abs(a.y - b.y) < 0.01).toBe(true);
  });

  it("F03-AC64 — un retour en arrière ferme une boucle : il ramène à une scène par laquelle on est passé ; deux chemins qui se rejoignent n'en sont pas", () => {
    const n = [1, 2, 3, 4].map((x) => noeud(x));
    // 1 → 2 → 3 → 1 : seul le dernier ramène en arrière
    const boucle = [lien(1, 2), lien(2, 3), lien(3, 1)];
    expect([...retoursEnArriere(n, boucle)]).toEqual([boucle[2].id]);
    // 1 → 2 → 4 et 1 → 3 → 4 : deux chemins se rejoignent, personne ne revient
    expect(retoursEnArriere(n, [lien(1, 2, 0), lien(1, 3, 1), lien(2, 4), lien(3, 4)]).size).toBe(0);
    // Un choix qui ramène à sa propre scène
    const sur = lien(2, 2, 1);
    expect([...retoursEnArriere(n, [lien(1, 2), sur])]).toEqual([sur.id]);
    // Dans le marais, quatre
    expect([...retoursEnArriere(chemins.noeuds, chemins.liens)].sort()).toEqual(["brume>0", "coffre>1", "enigme>0", "ombre>1"]);
  });

  it("F03-AC65 — une sortie vers un autre chapitre, un choix sans destination, un choix vers une scène supprimée : dans l'onglet, sans trait ni étiquette ; le lien caché garde son trait, que l'élève ne voit pas", () => {
    expect(onglet("ecluse>0")).toMatchObject({ sorte: "sortie", sortie: null });
    expect(onglet("passeur>0")).toMatchObject({ sorte: "sortie", sortie: null });
    expect(onglet("cercle>2")).toMatchObject({ sorte: "manque", sortie: null });
    expect(onglet("coffre>0")).toMatchObject({ sorte: "manque", sortie: null });
    for (const cle of ["ecluse>0", "passeur>0", "cercle>2", "coffre>0"]) expect(d.traits.some((t) => t.id === cle)).toBe(false);
    // « À regarder » compte ces deux choix comme avant, et désigne leur onglet par leur identité
    expect(aRegarder(chemins).sortes.slice(0, 2).map((s) => s.ou)).toEqual([["cercle>2"], ["coffre>0"]]);
    // Le lien caché : un onglet de plus, et son trait
    expect(d.onglets.get("enigme")!.map((o) => o.id).sort()).toEqual(["enigme>0", "enigme>cache"]);
    expect(onglet("enigme>cache").sorte).toBe("suite");
    expect(d.traits.find((t) => t.id === "enigme>cache")).toMatchObject({ vers: "salle", retour: false });
    const eleve = marais({ pourEleve: true });
    expect(disposer(eleve, new Map()).onglets.get("enigme")!.map((o) => o.id)).toEqual(["enigme>0"]);
  });

  it("F03-AC66 — l'état et qui écrit : le prénom de l'élève qui s'occupe de la scène, l'initiale pour deux mêmes prénoms, « Vous » pour celle de l'enseignant, rien quand personne ne s'en occupe", () => {
    const eleves: ElevePlan[] = [
      { id: "e1", prenom: "Hugo", nom: "Petit", couleur: 0 }, { id: "e2", prenom: "Hugo", nom: "Martin", couleur: 1 }, { id: "e3", prenom: "Jade", nom: null, couleur: 2 },
      { id: "e4", prenom: "Farah", nom: null, couleur: 3 },
    ];
    const scene = (n: number, extra: Partial<Scene>): Scene => ({
      id: `s${n}`, chapitreId: "c1", reference: n, titre: `Scène ${n}`, consigne: "", fin: false, horsLivre: false, creeParEleve: null, priseParEleve: null, priseParEnseignant: false, ancien: null,
      etat: "cours", texteVide: true, ecritPar: [], rangLivre: null, numeroFixe: null, ...extra,
    });
    const chapitre: Chapitre = {
      id: "c1", partieId: "p1", titre: "Le marais", couleur: 0, resume: "", horsLivre: false, imageId: null, visuelChoisi: null, visuelDefaut: "etang",
      attributions: [{ eleveId: "e1", profil: "propositions" }, { eleveId: "e3", profil: "propositions" }],
      scenes: [
        scene(1, { priseParEleve: "e1", etat: "valide", texteVide: false }), scene(2, { priseParEleve: "e3" }), scene(3, {}), scene(4, { priseParEnseignant: true }),
        // Farah n'est plus dans le chapitre : la scène qu'elle a remise garde son prénom ; celle qu'elle avait prise sans la finir, non
        scene(5, { ancien: eleves[3], etat: "valider", texteVide: false }), scene(6, { priseParEleve: "e4" }),
      ],
    };
    const plan = { parties: [{ id: "p1", titre: "La forêt", chapitres: [chapitre] }], corbeille: [], departSceneId: null, liens: [] } as unknown as Plan;
    const lu = cheminsDuPlan(plan, "c1", "projet", eleves).noeuds;
    expect(lu.map((n) => n.qui)).toEqual(["Hugo P.", "Jade", undefined, "Vous", "Farah", undefined]);
    // L'état reste celui de la scène : la carte en fait son tampon
    expect(lu.map((n) => [n.etat, n.vide])).toEqual([["valide", false], ["cours", true], ["cours", true], ["cours", true], ["valider", false], ["cours", true]]);
    // Sans la classe, rien n'est dit de qui écrit, sauf « Vous »
    expect(cheminsDuPlan(plan, "c1", "projet").noeuds.map((n) => n.qui)).toEqual([undefined, undefined, undefined, "Vous", "Farah", undefined]);
  });

  it("F03-AC68 — de loin, on regarde l'ensemble sans y construire, les onglets gardant leurs phrases et leurs points de sortie ; la taille lisible n'est jamais « de loin »", () => {
    expect(deLoin(0.3)).toBe(true);
    expect(deLoin(0.61)).toBe(true);
    expect(deLoin(0.7)).toBe(false);
    expect(deLoin(1)).toBe(false);
    // La taille lisible ne descend jamais jusque-là
    expect(deLoin(tailleLisible(d.largeur, { l: 700, h: 560 }, 28, { min: 0.7, max: 1 }))).toBe(false);
    // Chaque suite a son point de sortie, d'où part son trait, à toute taille
    for (const o of [...d.onglets.values()].flat().filter((x) => x.sorte === "suite")) expect(d.traits.find((t) => t.id === o.id)!.points[0]).toEqual(o.sortie);
  });

  it("F03-AC69 — la proposition de l'IA : ses choix sont des onglets, sur la carte de la scène d'origine avec ceux qu'elle a déjà ; leur trait part de l'onglet", () => {
    const origine = id(1);
    const p: Proposition = {
      origine,
      scenes: ["N1", "N2"].map((cle) => ({ cle, titre: cle, consigne: "", liste: [], inventee: false })),
      choix: [
        { cle: "C1", de: origine, vers: "N1", libelle: "Suivre le ruisseau", invente: false },
        { cle: "C2", de: origine, vers: "N2", libelle: "Entrer dans la grotte", invente: false },
        { cle: "C3", de: "N1", vers: "N2", libelle: "Remonter vers la grotte", invente: false },
      ],
      consigneOrigine: null, questions: [], reste: null,
    };
    const avant: Chemins = { noeuds: [noeud(1), noeud(2)], liens: [lien(1, 2)], entrees: [] };
    const vu = cheminsAvecLeBloc(avant, p);
    const x = disposer(vu, new Map());
    expect(x.onglets.get(origine)!.map((o) => o.id).sort()).toEqual([lien(1, 2).id, "propose:C1", "propose:C2"].sort());
    expect(x.onglets.get("propose:N1")!.map((o) => o.id)).toEqual(["propose:C3"]);
    expect(x.places.get(origine)!.l).toBe(3 * ONGLET.l);
    for (const cle of ["propose:C1", "propose:C2", "propose:C3"]) {
      const o = [...x.onglets.values()].flat().find((y) => y.id === cle)!;
      expect(vu.liens.find((l) => l.id === cle)!.propose).toBe(true);
      expect(x.traits.find((t) => t.id === cle)!.points[0]).toEqual(o.sortie);
    }
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
