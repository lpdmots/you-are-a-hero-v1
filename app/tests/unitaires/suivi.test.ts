import { describe, expect, it } from "vitest";
import type { Etat } from "@/domaine/etats";
import type { Chapitre, ElevePlan, Partie, Plan, Scene } from "@/domaine/recit";
import {
  adresseDesFiltres, avancement, bilanDesEleves, compterEtats, filtrer, filtrerHorsEtat, filtresDepuis, grouper, lignesDuPlan, SANS_FILTRE, suivanteAValider,
  TAMPONS_DU_SUIVI, TAMPONS_PERSONNELS,
} from "@/domaine/suivi";

/** Étape 4 du plan, lot 4 : ce que le Suivi liste, compte et propose, sans base ni navigateur (F06.5). */

const eleve = (id: string): ElevePlan => ({ id, prenom: id[0].toUpperCase() + id.slice(1), nom: null, couleur: 0 });
const [alice, bilal, adam] = [eleve("alice"), eleve("bilal"), eleve("adam")];
let reference = 0;
const scene = (chapitreId: string, etat: Etat, extra: Partial<Scene> = {}): Scene => {
  reference += 1;
  return {
    id: `s${reference}`, chapitreId, reference, titre: `Scène ${reference}`, consigne: "Une consigne.", fin: false, horsLivre: false, creeParEleve: null,
    priseParEleve: null, priseParEnseignant: false, ancien: null, etat, texteVide: false, ecritPar: [], rangLivre: null, numeroFixe: null, ...extra,
  };
};
const chapitre = (id: string, eleves: ElevePlan[], scenes: Scene[]): Chapitre => ({
  id, partieId: "foret", titre: id, couleur: 0, resume: "", horsLivre: false, imageId: null, visuelChoisi: null, visuelDefaut: null,
  scenes, attributions: eleves.map((e) => ({ eleveId: e.id, profil: "propositions" })),
});
const plan = (...chapitres: Chapitre[]): Plan => {
  const partie: Partie = { id: "foret", titre: "La forêt", chapitres, imageId: null, visuelChoisi: null, visuelDefaut: null, groupeAvecPrecedente: false, ouvertureSceneId: null };
  return { parties: [partie], corbeille: [], departSceneId: null, liens: [] };
};

/** « La lisière », à Alice et Bilal ; « Le sanctuaire », sans élève. */
const recit = (): Plan =>
  plan(
    chapitre("lisiere", [alice, bilal], [
      scene("lisiere", "valider", { priseParEleve: "alice" }),
      scene("lisiere", "cours", { priseParEleve: "bilal" }),
      scene("lisiere", "cours", { texteVide: true }),
      scene("lisiere", "valider", { priseParEleve: "bilal" }),
      scene("lisiere", "valide", { priseParEleve: "bilal" }),
      scene("lisiere", "prete", { priseParEnseignant: true }),
    ]),
    chapitre("sanctuaire", [], [scene("sanctuaire", "cours"), scene("sanctuaire", "valider", { priseParEnseignant: true })]),
  );

describe("Ce que le Suivi liste (F06.5)", () => {
  it("F06-AC36 — accès distinct de la responsabilité : « Tout son chapitre » retrouve les six scènes de « La lisière », « Dont Alice s'occupe » la seule à son nom", () => {
    const lignes = lignesDuPlan(recit());
    expect(filtrerHorsEtat(lignes, { ...SANS_FILTRE, eleve: "alice", mode: "chapitre" })).toHaveLength(6);
    expect(filtrerHorsEtat(lignes, { ...SANS_FILTRE, eleve: "alice", mode: "occupe" }).map((l) => l.scene.priseParEleve)).toEqual(["alice"]);
  });

  it("F06-AC93 — « Moi » : les seules scènes au nom de l'enseignant, d'où qu'elles soient", () => {
    const lignes = filtrerHorsEtat(lignesDuPlan(recit()), { ...SANS_FILTRE, eleve: "moi" });
    expect(lignes).toHaveLength(2);
    expect(lignes.every((l) => l.scene.priseParEnseignant)).toBe(true);
  });

  it("F06-AC55, AC34 — les nombres des états suivent le chapitre et l'élève choisis ; « Texte vide » se compte à part de « En cours », « Validé » à part de « Prête »", () => {
    const lignes = lignesDuPlan(recit());
    expect(compterEtats(lignes)).toEqual({ valider: 3, reprendre: 0, cours: 2, vide: 1, valide: 1, prete: 1 });
    expect(compterEtats(filtrerHorsEtat(lignes, { ...SANS_FILTRE, chapitre: "lisiere", eleve: "bilal" }))).toMatchObject({ valider: 1, cours: 1, valide: 1, prete: 0 });
    expect(filtrer(lignes, { ...SANS_FILTRE, etat: "vide" })).toHaveLength(1);
  });

  it("F06-AC37 — filtre sans tâche à clôturer : la scène validée ne satisfait plus « À valider », sans autre geste", () => {
    const r = recit();
    const avant = filtrer(lignesDuPlan(r), { ...SANS_FILTRE, etat: "valider" });
    avant[0].scene.etat = "valide";
    expect(filtrer(lignesDuPlan(r), { ...SANS_FILTRE, etat: "valider" })).toHaveLength(avant.length - 1);
  });

  it("F06-AC91 — projet personnel : trois tampons, « Texte vide », « En cours », « Prête »", () => {
    expect(TAMPONS_PERSONNELS).toEqual(["vide", "cours", "prete"]);
    expect(TAMPONS_DU_SUIVI).toEqual(["valider", "reprendre", "cours", "vide", "valide", "prete"]);
  });

  it("F06.5 — la liste se groupe par chapitre, dans l'ordre du plan", () => {
    expect(grouper(lignesDuPlan(recit())).map((g) => [g.chapitre.id, g.scenes.length])).toEqual([["lisiere", 6], ["sanctuaire", 2]]);
  });
});

describe("Scène suivante à valider (F06.5)", () => {
  it("F06-AC63 — après une décision, la scène « À valider » qui suit dans la liste ; la première qui reste quand on était à la dernière ; rien quand il n'en reste plus", () => {
    const lignes = lignesDuPlan(recit());
    const aValider = lignes.filter((l) => l.scene.etat === "valider");
    expect(suivanteAValider(lignes, aValider[0].scene.id)?.scene.id).toBe(aValider[1].scene.id);
    expect(suivanteAValider(lignes, aValider[2].scene.id)?.scene.id).toBe(aValider[0].scene.id);
    // Avec les filtres du Suivi d'où l'on vient : celles de Bilal seulement
    const deBilal = filtrerHorsEtat(lignes, { ...SANS_FILTRE, eleve: "bilal" });
    expect(suivanteAValider(deBilal, aValider[1].scene.id)).toBeNull();
  });
});

describe("Bilan par élève (F06.5)", () => {
  it("F06-AC32 — oubli d'attribution identifiable : Adam, sans chapitre, vient en tête et se distingue d'Alice, qui a des scènes où écrire", () => {
    const bilans = bilanDesEleves(recit(), [alice, bilal, adam]);
    expect(bilans.map((b) => [b.eleve.id, b.aRegler])).toEqual([["adam", "sans-chapitre"], ["alice", null], ["bilal", null]]);
    expect(bilans[1]).toMatchObject({ accessibles: 6, occupe: 1 });
    expect(bilans[2].parEtat).toEqual({ cours: 1, valider: 1, valide: 1 });
  });

  it("F06.5 — aucune scène modifiable : un chapitre dont tout est remis, validé ou à l'enseignant le signale, sans rien bloquer", () => {
    const tout = plan(chapitre("lisiere", [alice], [scene("lisiere", "valide", { priseParEleve: "alice" }), scene("lisiere", "cours", { priseParEnseignant: true })]));
    expect(bilanDesEleves(tout, [alice])[0].aRegler).toBe("aucune-scene-modifiable");
  });
});

describe("Carte du projet (F06.5)", () => {
  it("F06-AC58 — quarante scènes dont cinq à valider et une prête : « 5 scènes à valider », « 3 % des scènes prêtes pour le livre »", () => {
    const scenes = [...Array(5).fill({ etat: "valider", horsLivre: false }), { etat: "prete", horsLivre: false }, ...Array(34).fill({ etat: "cours", horsLivre: false })];
    expect(avancement(scenes)).toEqual({ aValider: 5, pourCent: 3 });
    // Une scène hors du livre ne compte pas dans la part des scènes prêtes
    expect(avancement([{ etat: "prete", horsLivre: false }, { etat: "cours", horsLivre: true }])).toEqual({ aValider: 0, pourCent: 100 });
    expect(avancement([])).toEqual({ aValider: 0, pourCent: 0 });
  });
});

describe("Les filtres tiennent dans l'adresse (F06.5)", () => {
  it("F06-AC54 — retour au Suivi : le chapitre, l'élève, sa sélection et l'état se retrouvent depuis l'adresse, et rien d'inconnu n'y passe", () => {
    const f = { chapitre: "c1", eleve: "e1", mode: "chapitre" as const, etat: "cours" as const };
    const adresse = adresseDesFiltres(f);
    expect(filtresDepuis(Object.fromEntries(new URLSearchParams(adresse)))).toEqual(f);
    expect(adresseDesFiltres(SANS_FILTRE)).toBe("");
    expect(adresseDesFiltres(SANS_FILTRE, "eleves")).toBe("vue=eleves");
    expect(filtresDepuis({ etat: "inconnu", mode: "autre" })).toEqual(SANS_FILTRE);
  });
});
