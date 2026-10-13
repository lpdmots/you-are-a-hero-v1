import { describe, expect, it } from "vitest";
import { attendLEleve, ceQueDitLaScene, phraseAPrendre, rangerMonTravail, sceneSuivante, type SceneDeTravail } from "@/domaine/travail";
import type { Etat } from "@/domaine/etats";

/** Étape 4 du plan, lot 3 : ce que « Mon travail » range et dit, sans base ni navigateur (F06.5, 13 octobre 2026). */

const scene = (reference: number, etat: Etat, extra: Partial<SceneDeTravail> = {}): SceneDeTravail => ({
  id: `s${reference}`, reference, titre: `Scène ${reference}`, chapitreId: "lisiere", chapitre: "La lisière", etat, vide: false, arrete: false, ordre: reference, ...extra,
});

describe("Mon travail, par urgence (F06.5)", () => {
  it("F06-AC95 — à reprendre, en cours, texte vide, remise, puis validée : S017, S021, S022, S016, S012, S017 seule portant le bouton plein", () => {
    const rangees = rangerMonTravail([scene(12, "valide"), scene(16, "valider"), scene(17, "reprendre"), scene(21, "cours"), scene(22, "cours", { vide: true })]);
    expect(rangees.map((s) => s.reference)).toEqual([17, 21, 22, 16, 12]);
    expect(sceneSuivante(rangees)?.reference).toBe(17);
    expect(rangees.filter(attendLEleve).map((s) => s.reference)).toEqual([17, 21, 22]);
  });

  it("F06.5 — à urgence égale, l'ordre du plan ; une scène prête se range avec les validées", () => {
    const rangees = rangerMonTravail([scene(30, "cours"), scene(8, "prete"), scene(5, "cours"), scene(3, "valide")]);
    expect(rangees.map((s) => s.reference)).toEqual([5, 30, 3, 8]);
  });

  it("F08-AC17 — scène où l'élève est arrêté : elle porte sa phrase, sans bouton pour écrire, après ce qu'il peut écrire et avant ce qu'il a remis", () => {
    const rangees = rangerMonTravail([scene(16, "valider"), scene(15, "cours", { arrete: true }), scene(22, "cours", { vide: true })]);
    expect(rangees.map((s) => s.reference)).toEqual([22, 15, 16]);
    expect(sceneSuivante(rangees)?.reference).toBe(22);
    expect(ceQueDitLaScene(rangees[1], "Mme Laurent")).toEqual({
      phrase: "Ton texte est gardé à part. Mme Laurent doit le regarder avant que tu écrives ici.", bouton: "Lire la scène",
    });
  });

  it("F06.5 — ce que dit chaque ligne : « reprendre » pour la seule correction après une remarque, « Mme Laurent relit » pour une scène remise", () => {
    expect(ceQueDitLaScene(scene(1, "reprendre"), "Mme Laurent")).toEqual({ phrase: "Mme Laurent te demande de reprendre ton texte.", bouton: "Reprendre mon texte" });
    expect(ceQueDitLaScene(scene(1, "cours"), "Mme Laurent").bouton).toBe("Continuer");
    expect(ceQueDitLaScene(scene(1, "cours", { vide: true }), "Mme Laurent").bouton).toBe("Écrire");
    expect(ceQueDitLaScene(scene(1, "valider"), "Mme Laurent")).toEqual({ phrase: "Mme Laurent relit ton texte.", bouton: "Lire mon texte" });
    expect(ceQueDitLaScene(scene(1, "prete"), "Mme Laurent").phrase).toBe("Validé. Bravo !");
  });

  it("F06-AC96 — scènes à prendre : « 3 scènes ne sont pas encore prises dans ton chapitre », et le chapitre nommé quand l'élève en a plusieurs", () => {
    expect(phraseAPrendre(3, "La lisière", true)).toBe("3 scènes ne sont pas encore prises dans ton chapitre");
    expect(phraseAPrendre(1, "La lisière", true)).toBe("1 scène n’est pas encore prise dans ton chapitre");
    expect(phraseAPrendre(2, "La lisière", false)).toBe("2 scènes ne sont pas encore prises dans La lisière");
  });

  it("F06-AC97 — aucune scène à son nom : rien n'attend l'élève, et rien n'est rangé", () => {
    expect(sceneSuivante(rangerMonTravail([]))).toBeNull();
    // Quand tout est remis ou validé, plus rien ne l'attend non plus
    expect(sceneSuivante(rangerMonTravail([scene(16, "valider"), scene(12, "valide")]))).toBeNull();
  });
});
