import { describe, expect, it } from "vitest";
import { DICTEE, duree, raccorder, termesDeLaDictee } from "@/domaine/dictee";

/** La dictée de l'adulte (F07.4), sans micro ni fournisseur : où et comment le texte entendu se pose. */

describe("Le texte entendu, raccordé à ce qui l'entoure (F07.4)", () => {
  it("F07-AC89 — dans un champ vide, tel qu'entendu, avec sa majuscule", () => {
    expect(raccorder("", "le héros entre dans la grotte.", "")).toBe("Le héros entre dans la grotte.");
  });

  it("F07-AC89 — après une phrase finie : une espace, puis une majuscule", () => {
    expect(raccorder("Lou avance.", "Le pont tremble.", "")).toBe(" Le pont tremble.");
    expect(raccorder("Lou avance.\n", "le pont tremble.", "")).toBe("Le pont tremble.");
    expect(raccorder("Il crie : «", "attention !", "")).toBe(" Attention !");
  });

  it("F07-AC89 — au milieu d'une phrase : un mot courant perd sa majuscule, un nom la garde", () => {
    expect(raccorder("Lou avance et", "Le pont tremble", "")).toBe(" le pont tremble");
    expect(raccorder("Lou avance avec", "Pipo le renard", "")).toBe(" Pipo le renard");
    expect(raccorder("Lou ouvre", "L'énorme coffre", "")).toBe(" l'énorme coffre");
  });

  it("F07-AC89 — devant une suite en minuscule, le point final ne coupe pas la phrase ; une espace la sépare", () => {
    expect(raccorder("Lou voit", "Un loup.", "qui dort.")).toBe(" un loup ");
    expect(raccorder("Lou voit ", "Un loup.", ", puis il part.")).toBe("un loup");
    expect(raccorder("", "Bonjour", " le monde")).toBe("Bonjour");
  });

  it("F07-AC89 — rien entendu, rien à poser ; les espaces multiples se réduisent", () => {
    expect(raccorder("Lou", "   ", "")).toBe("");
    expect(raccorder("", "Le  pont\n tremble", "")).toBe("Le pont tremble");
  });
});

describe("Les noms du projet donnés comme indices (F07.4)", () => {
  it("F07-AC95 — de 1 à 5 mots, 50 caractères au plus, sans doublon, cent au plus", () => {
    expect(termesDeLaDictee(["Lou", " lou ", "Le passeur de brume", "un nom de bien plus de cinq mots ici", "x".repeat(51), "", "Pipo"])).toEqual(["Lou", "Le passeur de brume", "Pipo"]);
    expect(termesDeLaDictee(Array.from({ length: 150 }, (_, i) => `Nom${i}`))).toHaveLength(DICTEE.termesMax);
  });
});

describe("Les bornes de la dictée (F07.4)", () => {
  it("F07-AC91, F07-AC92 — cinq minutes par enregistrement, trois heures par mois ; cinq minutes tiennent sous la limite du serveur", () => {
    expect(DICTEE.secondesMax).toBe(300);
    expect(DICTEE.secondesParMois).toBe(10_800);
    expect((DICTEE.secondesMax * DICTEE.debit) / 8).toBeLessThan(DICTEE.octetsMax / 2);
    expect(duree(0)).toBe("0:00");
    expect(duree(65.7)).toBe("1:05");
  });
});
