import { describe, expect, it } from "vitest";
import { debutDuTexte, voisinesDe } from "@/serveur/aides-de-la-scene";

/** Étape 8, lot 3 : ce que reçoivent l'aide à la consigne (F13.2) et le ✦ du titre (F05). */

const s = (t: string) => ({ titre: t, consigne: null });

describe("Ce qui part pour une consigne ou un titre", () => {
  it("les scènes voisines : les plus proches de part et d'autre, dans l'ordre du chapitre", () => {
    const avant = ["A", "B", "C", "D", "E"].map(s);
    const apres = ["F", "G"].map(s);
    expect(voisinesDe(avant, apres).map((v) => v.titre)).toEqual(["B", "C", "D", "E", "F", "G"]);
    expect(voisinesDe(avant, apres, 3).map((v) => v.titre)).toEqual(["D", "E", "F"]);
    expect(voisinesDe([], [], 6)).toEqual([]);
  });

  it("le début du texte : des paragraphes entiers, jamais toute une longue scène", () => {
    expect(debutDuTexte([])).toBeNull();
    expect(debutDuTexte(["  ", "Lou avance.", "Le pont tremble."])).toBe("Lou avance.\nLe pont tremble.");
    const long = "mot ".repeat(100).trim();
    expect(debutDuTexte(["Lou avance.", long], 50)).toBe("Lou avance.");
    const coupe = debutDuTexte([long], 50)!;
    expect(coupe.endsWith("…")).toBe(true);
    expect(coupe.length).toBeLessThanOrEqual(51);
  });
});
