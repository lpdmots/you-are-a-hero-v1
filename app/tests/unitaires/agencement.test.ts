import { describe, expect, it } from "vitest";
import { agencer, blancDe, candidats, doute, type Mesure, type Modele, type PassageOrdonne } from "@/domaine/agencement";

/**
 * Étape 6 du plan, lot 6 : l'ordre des passages et les blancs (F11.3, F11.5, F11.6), sur un
 * modèle de la mise en page fait des hauteurs mesurées.
 */

const LIGNE = 5;
const passage = (n: number, o: Partial<PassageOrdonne> = {}): PassageOrdonne => ({ sceneId: `s${n}`, numero: n, groupe: 0, tenu: false, saut: false, ...o });
const modele = (hauteurs: number[], o: Partial<Modele> = {}): Modele => ({
  hauteur: 170, ligne: LIGNE, premiere: 5,
  mesures: Object.fromEntries(hauteurs.map((h, i): [string, Mesure] => [`s${i + 1}`, { h, queue: 20, pleinePage: false }])),
  liens: {},
  ...o,
});

describe("Réordonner les passages (F11.5)", () => {
  it("F11-AC64 — le nouvel ordre laisse moins de blanc ; le départ et un numéro fixé gardent leur place", () => {
    // Des passages hauts qui laissent chacun un bas de page vide, et de petits passages qui peuvent les combler
    const hauteurs = [30, 150, 150, 150, 18, 18, 18, 150, 18];
    const ordre = hauteurs.map((_, i) => passage(i + 1, { tenu: i === 0 || i === 6 }));
    const m = modele(hauteurs);
    const r = agencer(ordre, m);
    expect(r.apres).toBeLessThan(r.avant);
    const suite = r.suites.get(0)!;
    expect(suite).toHaveLength(7);
    expect(suite).not.toContain("s1");
    expect(suite).not.toContain("s7");
    expect(new Set(suite)).toEqual(new Set(["s2", "s3", "s4", "s5", "s6", "s8", "s9"]));
  });

  it("F11-AC66 — un passage n'est pas posé sur la double page de celui qui y mène quand un autre convient", () => {
    const hauteurs = [30, 18, 18, 18];
    const m = modele(hauteurs, { liens: { s1: ["s2"] } });
    const r = agencer(hauteurs.map((_, i) => passage(i + 1, { tenu: i === 0 })), m);
    expect(r.suites.get(0)![0]).not.toBe("s2");
  });

  it("chaque groupe garde ses passages : rien ne passe d'une partie à l'autre", () => {
    const hauteurs = [30, 150, 18, 30, 150, 18];
    const ordre = hauteurs.map((_, i) => passage(i + 1, { groupe: i < 3 ? 0 : 1, tenu: i === 0 || i === 3, saut: i === 3 }));
    const r = agencer(ordre, modele(hauteurs));
    expect(new Set(r.suites.get(0))).toEqual(new Set(["s2", "s3"]));
    expect(new Set(r.suites.get(1))).toEqual(new Set(["s5", "s6"]));
    expect(blancDe(ordre, modele(hauteurs))).toBeGreaterThanOrEqual(0);
  });
});

describe("Le modèle simule les coupures, bloc par bloc (F11.2, F11.5)", () => {
  const blocs = (id: string, b: [string, number][]): Record<string, Mesure> => ({ [id]: { h: b.reduce((n, x) => n + x[1], 0), queue: 0, pleinePage: false, blocs: b } });

  it("une image et les choix qui la suivent passent ensemble à la page suivante, et laissent leur blanc", () => {
    // 100 mm de texte, puis une image de 60 mm et ses choix de 20 mm : 70 mm restent, l'ensemble en demande 80
    const m = modele([], { mesures: blocs("s1", [["n", 10], ["t", 90], ["i", 60], ["c", 20]]) });
    expect(blancDe([passage(1)], m)).toBe(70);
  });

  it("une image au milieu d'un passage ne se coupe pas ; le texte, lui, s'écoule d'une page à l'autre", () => {
    const texte = modele([], { mesures: blocs("s1", [["n", 10], ["t", 100], ["t", 100]]) });
    expect(blancDe([passage(1)], texte)).toBe(0);
    const image = modele([], { mesures: blocs("s1", [["n", 10], ["t", 100], ["i", 100]]) });
    expect(blancDe([passage(1)], image)).toBe(60);
  });

  it("F11-AC64 — réordonner remplit la place qu'une image laissait vide", () => {
    // s2 finit sur une image et des choix trop hauts pour le bas de la page ; s3, court, peut s'y loger avant
    const mesures = { ...blocs("s1", [["n", 10], ["t", 80]]), ...blocs("s2", [["n", 10], ["t", 10], ["i", 70], ["c", 20]]), ...blocs("s3", [["n", 10], ["t", 20], ["c", 10]]) };
    const ordre = [passage(1, { tenu: true }), passage(2), passage(3)];
    const r = agencer(ordre, modele([], { mesures }));
    expect(r.suites.get(0)).toEqual(["s3", "s2"]);
    expect(r.apres).toBeLessThan(r.avant);
  });
});

describe("Passage suggéré (F11.3)", () => {
  const ordre = [passage(12), passage(27), passage(29), passage(31), passage(35)];
  const mesures: Record<string, Mesure> = {
    s31: { h: 62, queue: 10, pleinePage: false },
    s27: { h: 55, queue: 10, pleinePage: false },
    s35: { h: 48, queue: 10, pleinePage: false },
    s29: { h: 80, queue: 10, pleinePage: false },
  };
  const blanc = { page: 21, mm: 70, apres: "s12", dedans: false };

  it("F11-AC67 — un blanc de 70 mm : le 31, puis le 27 et le 35 ; pas le 29, trop haut", () => {
    const r = candidats(blanc, { ordre, nouvellesPages: new Set(), mesures, pageDe: { s12: 21 }, liens: {} });
    expect(r.candidats.map((c) => c.numero)).toEqual([31, 27, 35]);
    expect(r.candidats[0]).toMatchObject({ h: 62, reste: 8 });
  });

  it("F11-AC68 — le 12, au bas de la page 21, mène au 31 : le 31 n'est pas proposé", () => {
    const r = candidats(blanc, { ordre, nouvellesPages: new Set(), mesures, pageDe: { s12: 21 }, liens: { s12: ["s31"] } });
    expect(r.candidats.map((c) => c.numero)).toEqual([27, 35]);
  });

  it("F11-AC74 — un blanc à l'intérieur d'un passage : aucun candidat, et la raison", () => {
    expect(candidats({ ...blanc, dedans: true }, { ordre, nouvellesPages: new Set(), mesures, pageDe: {}, liens: {} })).toEqual({ candidats: [], raison: "dedans" });
  });

  it("un passage tenu, réglé sur une nouvelle page ou portant une image pleine page n'est jamais proposé", () => {
    const r = candidats(blanc, {
      ordre: [passage(12), passage(27, { tenu: true }), passage(31), passage(35)],
      nouvellesPages: new Set(["s31"]),
      mesures: { ...mesures, s35: { h: 48, queue: 10, pleinePage: true } },
      pageDe: { s12: 21 },
      liens: {},
    });
    expect(r).toEqual({ candidats: [], raison: "aucun" });
  });
});

describe("Doute sur l'ordre (F11.6)", () => {
  it("F11-AC86, F11-AC65 — un passage qui change de page fait naître le doute ; une coquille sans effet, non", () => {
    const reference = { s1: 5, s2: 5, s3: 6 };
    expect(doute(reference, { s1: 5, s2: 5, s3: 6 })).toBe(false);
    expect(doute(reference, { s1: 5, s2: 6, s3: 6 })).toBe(true);
    expect(doute(reference, { s1: 5, s2: 5 })).toBe(true);
    expect(doute(null, { s1: 5 })).toBe(false);
  });
});
