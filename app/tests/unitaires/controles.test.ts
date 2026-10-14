import { describe, expect, it } from "vitest";
import { aTraiter, controler, pdfDefinitifRefuse, phraseDe, type Probleme, type Sorte } from "@/domaine/controles";
import type { Etat } from "@/domaine/etats";
import type { Chapitre, Lien, Plan, Scene } from "@/domaine/recit";

/**
 * Étape 5 du plan, lot 1 : les contrôles du livre (F09.2), sans base ni navigateur. Les scènes
 * sont nommées par leur référence ; un livre se décrit scène par scène, avec ses chemins.
 */

type Decrite = {
  ref: number; chapitre?: string; etat?: Etat; vide?: boolean; fin?: boolean; hors?: boolean; fixe?: number;
  /** Les choix : la référence visée, null sans destination, « corbeille » pour une scène supprimée */
  choix?: (number | null | "corbeille")[];
  cachees?: number[];
};

const id = (ref: number) => `00000000-0000-4000-8000-${String(ref).padStart(12, "0")}`;
const CORBEILLE = "00000000-0000-4000-8000-999999999999";

function livre(scenes: Decrite[], { depart = 1 as number | null, chapitresExclus = [] as string[] } = {}): Plan {
  const noms = [...new Set(scenes.map((s) => s.chapitre ?? "La lisière"))];
  const chapitres: Chapitre[] = noms.map((nom, i) => ({
    id: `chapitre-${nom}`, partieId: "partie", titre: nom, couleur: i, resume: "", horsLivre: chapitresExclus.includes(nom),
    imageId: null, visuelChoisi: null, visuelDefaut: null, attributions: [],
    scenes: scenes.filter((s) => (s.chapitre ?? "La lisière") === nom).map((s): Scene => ({
      id: id(s.ref), chapitreId: `chapitre-${nom}`, reference: s.ref, titre: `Scène ${s.ref}`, consigne: "", fin: s.fin ?? false, horsLivre: s.hors ?? false,
      creeParEleve: null, priseParEleve: null, priseParEnseignant: false, ancien: null, etat: s.etat ?? "prete", texteVide: s.vide ?? false, ecritPar: [],
      rangLivre: null, numeroFixe: s.fixe ?? null,
    })),
  }));
  const liens: Lien[] = scenes.flatMap((s) => [
    ...(s.choix ?? []).map((c, k): Lien => ({ sceneId: id(s.ref), renvoiId: `${s.ref}>${k}`, cibleId: c === null ? null : c === "corbeille" ? CORBEILLE : id(c), libelle: `Choix ${k + 1}`, cache: false })),
    ...(s.cachees ?? []).map((c, k): Lien => ({ sceneId: id(s.ref), renvoiId: `${s.ref}>cache${k}`, cibleId: id(c), libelle: "Énigme", cache: true })),
  ]);
  return {
    parties: [{ id: "partie", titre: "La forêt", imageId: null, visuelChoisi: null, visuelDefaut: null, groupeAvecPrecedente: false, ouvertureSceneId: null, chapitres }],
    corbeille: [], departSceneId: depart === null ? null : id(depart), liens,
  };
}

const controle = (plan: Plan, { aChoix = true, actions = [] as number[], feuille = true } = {}) =>
  controler({ plan, aChoix, scenesAvecActions: new Set(actions.map(id)), feuille });
const sortes = (p: Probleme[]): [Sorte, number | null][] =>
  p.map((x) => [x.sorte, "sceneId" in x && x.sceneId ? Number(x.sceneId.slice(-12)) : null]);
const presentes = (p: Probleme[]) => sortes(aTraiter(p));

/** Un petit livre sans défaut : un départ, deux chemins, deux fins. */
const sain: Decrite[] = [
  { ref: 1, choix: [2, 3] },
  { ref: 2, fin: true },
  { ref: 3, choix: [2], fin: true },
];

describe("Contrôles du livre (F09.2)", () => {
  it("un livre sans défaut n'a rien à traiter, et son PDF définitif n'est pas refusé", () => {
    const p = controle(livre(sain));
    expect(p).toEqual([]);
    expect(pdfDefinitifRefuse(p)).toBe(false);
  });

  it("F09-AC04 — destination exclue : le PDF définitif est refusé et le point désigne le choix de A, sans rien rediriger", () => {
    const plan = livre([{ ref: 1, choix: [2, 3] }, { ref: 2, fin: true }, { ref: 3, fin: true, hors: true }]);
    const p = controle(plan);
    const exclue = p.find((x) => x.sorte === "exclue");
    expect(exclue).toMatchObject({ sceneId: id(1), renvoiId: "1>1", cibleId: id(3), gravite: "bloque", tache: "choix", etape: "chemins" });
    expect(phraseDe(exclue!)).toEqual({ quoi: "Un choix mène hors du livre.", detail: "« Choix 2 » mène à S003 « Scène 3 », qui est hors du livre." });
    expect(pdfDefinitifRefuse(p)).toBe(true);
    // Le choix est resté tel quel
    expect(plan.liens.find((l) => l.renvoiId === "1>1")?.cibleId).toBe(id(3));
    // Une scène d'un chapitre exclu est hors du livre comme une scène exclue
    const chapitre = controle(livre([{ ref: 1, choix: [2] }, { ref: 2, chapitre: "Le phare", fin: true }], { chapitresExclus: ["Le phare"] }));
    expect(sortes(chapitre)).toEqual([["exclue", 1]]);
  });

  it("F09-AC05 — scène sans issue : refusée et signalée ; marquée comme fin ou dotée d'un choix valide, le point disparaît", () => {
    const p = controle(livre([{ ref: 1, choix: [2] }, { ref: 2 }]));
    expect(presentes(p)).toEqual([["impasse", 2]]);
    expect(phraseDe(p[0]).quoi).toBe("Cette scène est une impasse.");
    expect(p[0]).toMatchObject({ gravite: "bloque", tache: "depart-fins" });
    expect(pdfDefinitifRefuse(p)).toBe(true);
    expect(controle(livre([{ ref: 1, choix: [2] }, { ref: 2, fin: true }]))).toEqual([]);
    expect(controle(livre([{ ref: 1, choix: [2] }, { ref: 2, choix: [3] }, { ref: 3, fin: true }]))).toEqual([]);
  });

  it("F09-AC06 — scène prête mais vide : refusée et signalée, à « Relire », sans être dite impasse", () => {
    const p = controle(livre([{ ref: 1, choix: [2] }, { ref: 2, vide: true }]));
    expect(presentes(p)).toEqual([["vide", 2]]);
    expect(p[0]).toMatchObject({ gravite: "bloque", etape: "relire", tache: "graves" });
    expect(phraseDe(p[0]).quoi).toBe("Déclarée prête, mais vide.");
    expect(pdfDefinitifRefuse(p)).toBe(true);
  });

  it("F09-AC07 — passage inaccessible : un avertissement désigne la scène, qui reste dans le livre, et le PDF définitif reste possible", () => {
    const p = controle(livre([...sain, { ref: 4, fin: true }]));
    expect(presentes(p)).toEqual([["inaccessible", 4]]);
    expect(p[0]).toMatchObject({ gravite: "avert", tache: "passages", cle: `inaccessible:${id(4)}` });
    expect(phraseDe(p[0]).quoi).toBe("Aucun chemin n’y mène.");
    expect(pdfDefinitifRefuse(p)).toBe(false);
  });

  it("F09-AC08 — deux scènes qui se renvoient l'une à l'autre, l'une menant aussi à une fin : rien n'est signalé", () => {
    expect(controle(livre([{ ref: 1, choix: [2] }, { ref: 2, choix: [1, 3] }, { ref: 3, fin: true }]))).toEqual([]);
  });

  it("F09.2 — fin hors d'atteinte : une boucle dont on ne sort plus avertit une fois, sur la première scène rencontrée", () => {
    const p = controle(livre([{ ref: 1, choix: [2, 5] }, { ref: 2, choix: [3] }, { ref: 3, choix: [4] }, { ref: 4, choix: [2] }, { ref: 5, fin: true }]));
    expect(presentes(p)).toEqual([["sans-fin", 2]]);
    expect(p[0]).toMatchObject({ gravite: "avert", tache: "passages", scenes: [id(2), id(3), id(4)] });
    expect(phraseDe(p[0])).toEqual({ quoi: "Aucune fin ne s’atteint d’ici.", detail: "Ces 3 scènes se renvoient l’une à l’autre : le lecteur n’en sort plus." });
    expect(pdfDefinitifRefuse(p)).toBe(false);
    // Une scène qui ne mène qu'à elle-même est enfermée aussi
    expect(presentes(controle(livre([{ ref: 1, choix: [2, 3] }, { ref: 2, choix: [2] }, { ref: 3, fin: true }])))).toEqual([["sans-fin", 2]]);
  });

  it("F09.2 — une boucle dont un choix reste à relier n'est pas dite sans fin : sa sortie est sans doute ce choix", () => {
    const p = controle(livre([{ ref: 1, choix: [2, 4] }, { ref: 2, choix: [3] }, { ref: 3, choix: [2, null] }, { ref: 4, fin: true }]));
    expect(presentes(p)).toEqual([["sans-destination", 3]]);
  });

  it("F09.2 — sans départ, seul le départ manquant se dit : chaque scène serait sinon inaccessible", () => {
    const p = controle(livre(sain, { depart: null }));
    expect(presentes(p)).toEqual([["depart", null]]);
    expect(phraseDe(p[0])).toEqual({ quoi: "Le livre n’a pas de départ.", detail: "Aucune scène n’est choisie comme départ du livre." });
    // Un départ exclu du livre : le point désigne la scène
    const exclu = controle(livre([{ ref: 1, choix: [2], hors: true }, { ref: 2, fin: true }]));
    expect(presentes(exclu)).toEqual([["depart", 1]]);
    expect(phraseDe(exclu[0]).detail).toBe("La scène de départ est hors du livre.");
  });

  it("F09.2 — choix sans destination ou vers une scène supprimée : bloquants, à « Choix à relier »", () => {
    const p = controle(livre([{ ref: 1, choix: [2, null, "corbeille"] }, { ref: 2, fin: true }]));
    expect(presentes(p)).toEqual([["sans-destination", 1], ["supprimee", 1]]);
    expect(p.every((x) => x.gravite === "bloque" && x.tache === "choix")).toBe(true);
    expect(phraseDe(p[0])).toEqual({ quoi: "Un choix ne mène nulle part.", detail: "« Choix 2 » n’a pas encore de destination." });
    expect(phraseDe(p[1]).quoi).toBe("Un choix mène à une scène supprimée.");
  });

  it("F09-AC15 — énigme sans issue de secours : « sortie non assurée » avertit sans bloquer ; un choix écrit à côté la fait disparaître", () => {
    const porte = livre([{ ref: 1, choix: [55] }, { ref: 55, cachees: [62] }, { ref: 62, fin: true }]);
    const p = controle(porte);
    expect(presentes(p)).toEqual([["sortie", 55]]);
    expect(p[0]).toMatchObject({ gravite: "avert", tache: "passages" });
    expect(phraseDe(p[0]).quoi).toBe("Sa seule suite est une énigme.");
    expect(pdfDefinitifRefuse(p)).toBe(false);
    const secours = livre([{ ref: 1, choix: [55] }, { ref: 55, cachees: [62], choix: [36] }, { ref: 62, fin: true }, { ref: 36, fin: true }]);
    expect(controle(secours)).toEqual([]);
    // Aucun choix n'a été ajouté
    expect(porte.liens.filter((l) => l.sceneId === id(55)).map((l) => l.cache)).toEqual([true]);
  });

  it("F05-AC05 — énigme non signalée comme impasse : ni « La porte aux symboles » ni « La salle des brumes » ne sont dites sans issue ou inaccessibles", () => {
    const p = controle(livre([{ ref: 1, choix: [55] }, { ref: 55, cachees: [62] }, { ref: 62, fin: true }]));
    expect(sortes(p).some(([s]) => s === "impasse" || s === "inaccessible")).toBe(false);
  });

  it("F05-AC08 — numéro impossible : le PDF définitif est refusé et le point désigne la liaison", () => {
    // Le livre compte 3 passages ; l'énigme de S002 mène à S003, fixée au n° 40
    const p = controle(livre([{ ref: 1, choix: [2] }, { ref: 2, cachees: [3], choix: [3] }, { ref: 3, fixe: 40, fin: true }]));
    const numero = p.find((x) => x.sorte === "numero")!;
    expect(numero).toMatchObject({ sceneId: id(2), cibleId: id(3), gravite: "bloque", tache: "choix", parEnigme: true });
    expect(phraseDe(numero).detail).toBe("L’énigme mène au n° 40, mais le livre n’en compte que 3.");
    expect(pdfDefinitifRefuse(p)).toBe(true);
    // Deux scènes fixées au même numéro
    const double = controle(livre([{ ref: 1, choix: [2, 3] }, { ref: 2, fixe: 2, fin: true }, { ref: 3, fixe: 2, fin: true }]));
    expect(phraseDe(double.find((x) => x.sorte === "numero")!).quoi).toBe("Deux scènes doivent porter le même numéro.");
  });

  it("F09-AC16 — scène à finir sans alerte : S029, sans choix ni fin, n'est pas présentée ; prête, elle devient « une impasse »", () => {
    const enCours = controle(livre([{ ref: 1, choix: [29] }, { ref: 29, etat: "cours" }]));
    expect(presentes(enCours)).toEqual([]);
    expect(enCours.find((x) => x.sorte === "impasse")?.reporte).toBe(true);
    // Elle reste comptée parmi les scènes à finir
    expect(sortes(enCours.filter((x) => x.sorte === "a-finir"))).toEqual([["a-finir", 29]]);
    const prete = controle(livre([{ ref: 1, choix: [29] }, { ref: 29 }]));
    expect(presentes(prete)).toEqual([["impasse", 29]]);
    expect(phraseDe(aTraiter(prete)[0]).quoi).toBe("Cette scène est une impasse.");
  });

  it("F09.2 — les défauts d'écriture d'une scène à finir sont reportés, les contrôles du plan restent actifs", () => {
    const p = controle(livre([{ ref: 1, choix: [2, null], etat: "cours" }, { ref: 2, vide: true, etat: "cours" }, { ref: 3, fin: true, etat: "cours" }]));
    expect(presentes(p)).toEqual([["inaccessible", 3]]);
    expect(p.filter((x) => x.reporte).map((x) => x.sorte)).toEqual(["vide", "sans-destination"]);
    // Le PDF définitif reste refusé : trois scènes à finir
    expect(pdfDefinitifRefuse(p)).toBe(true);
  });

  it("F11-AC89 — septembre : trente-neuf scènes à finir et deux passages où aucun chemin ne mène, présentés à « Passages à confirmer »", () => {
    const scenes: Decrite[] = Array.from({ length: 39 }, (_, i) => ({ ref: i + 1, etat: "cours" as const, vide: true, choix: i < 38 ? [i + 2] : [] }));
    const p = controle(livre([...scenes, { ref: 40, fin: true }, { ref: 41, fin: true }]));
    expect(p.filter((x) => x.sorte === "a-finir")).toHaveLength(39);
    expect(presentes(p)).toEqual([["inaccessible", 40], ["inaccessible", 41]]);
  });

  it("F04-AC33 — actions de jeu sans feuille : un rappel « à savoir », jamais bloquant ni présenté parmi les points à corriger", () => {
    const p = controle(livre(sain), { actions: [1, 2, 3], feuille: false });
    expect(sortes(p)).toEqual([["jeu-sans-feuille", null]]);
    expect(p[0]).toMatchObject({ gravite: "info", tache: "a-savoir", etape: "chemins", passages: 3 });
    expect(phraseDe(p[0]).quoi).toBe("3 passages demandent d’agir sur une feuille d’aventure, et le livre n’en a pas.");
    expect(aTraiter(p)).toEqual([]);
    expect(pdfDefinitifRefuse(p)).toBe(false);
    // Avec une feuille, rien ; une scène exclue du livre ne compte pas
    expect(controle(livre(sain), { actions: [1], feuille: true })).toEqual([]);
    const exclue = controle(livre([...sain, { ref: 4, hors: true, fin: true }]), { actions: [4], feuille: false });
    expect(exclue).toEqual([]);
  });

  it("F09.2 — récit classique : ni départ, ni chemins, ni numéros ; la scène vide et la scène à finir seulement", () => {
    const plan = livre([{ ref: 1 }, { ref: 2, vide: true }, { ref: 3, etat: "valide" }], { depart: null });
    expect(sortes(controle(plan, { aChoix: false, actions: [1] }))).toEqual([["a-finir", 3], ["vide", 2]]);
  });

  it("F09.2 — chaque point garde sa clé d'une fois à l'autre, celle d'un groupe ne dépendant pas de l'ordre de ses scènes", () => {
    const a = controle(livre([{ ref: 1, choix: [2, 5] }, { ref: 2, choix: [3] }, { ref: 3, choix: [2] }, { ref: 5, fin: true }]));
    const b = controle(livre([{ ref: 1, choix: [3, 5] }, { ref: 3, choix: [2] }, { ref: 2, choix: [3] }, { ref: 5, fin: true }]));
    expect(a[0].cle).toBe(b[0].cle);
    expect(a[0].cle).toBe(`sans-fin:${id(2)},${id(3)}`);
  });
});
