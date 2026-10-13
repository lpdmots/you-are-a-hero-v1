import { describe, expect, it } from "vitest";
import {
  classement, phraseDesTotaux, pourquoiSansTampon, premieres, sansTotal, suite, totauxParEleve, type Categorie, type Encouragement,
} from "@/domaine/encouragements";

/** Étape 4 du plan, lot 6 : les règles des encouragements qui ne demandent pas la base (F07.5). */

const tampons = (eleve: string, categorie: Categorie, combien: number, depuis = 0): Encouragement[] =>
  Array.from({ length: combien }, (_, i) => ({ sceneId: `s${depuis + i}`, eleveId: eleve, categorie }));
const prenom = (id: string) => id;

describe("Totaux d'un élève (F07.5)", () => {
  it("F07-AC50, AC76 — un tampon de plus, un total de plus ; retiré, un de moins ; chaque catégorie a le sien", () => {
    const inscrits = new Set(["Bilal"]);
    const deux = [...tampons("Bilal", "effort", 1), ...tampons("Bilal", "creativite", 1)];
    expect(totauxParEleve(deux, inscrits).get("Bilal")).toEqual({ effort: 1, plume: 0, creativite: 1 });
    expect(totauxParEleve(deux.slice(1), inscrits).get("Bilal")).toEqual({ effort: 0, plume: 0, creativite: 1 });
  });

  it("F07-AC81 — « Effort 2 · Fine plume 1 », sans « Créativité » ; rien pour l'élève qui n'a aucun tampon", () => {
    const totaux = totauxParEleve([...tampons("Bilal", "effort", 2), ...tampons("Bilal", "plume", 1)], new Set(["Bilal", "Chloé"]));
    expect(phraseDesTotaux(totaux.get("Bilal"))).toBe("Effort 2 · Fine plume 1");
    expect(phraseDesTotaux(totaux.get("Chloé"))).toBeNull();
    expect(phraseDesTotaux(sansTotal())).toBeNull();
  });

  it("F07.5 — élève retiré de la classe : ses tampons restent sur ses scènes, et il sort des totaux affichés", () => {
    const totaux = totauxParEleve([...tampons("Bilal", "effort", 2), ...tampons("Alice", "effort", 1)], new Set(["Alice"]));
    expect([...totaux.keys()]).toEqual(["Alice"]);
  });

  it("F07-AC78 — l'encouragement reste à son élève : le tampon donné à Alice compte pour elle, que Bilal s'occupe ensuite de la scène ou non", () => {
    const donnes: Encouragement[] = [{ sceneId: "S015", eleveId: "Alice", categorie: "effort" }, { sceneId: "S015", eleveId: "Bilal", categorie: "effort" }];
    const totaux = totauxParEleve(donnes, new Set(["Alice", "Bilal"]));
    expect(totaux.get("Alice")?.effort).toBe(1);
    expect(totaux.get("Bilal")?.effort).toBe(1);
  });
});

describe("Classement par catégorie (F07.5)", () => {
  const effort = [...tampons("Lina", "effort", 4), ...tampons("Bilal", "effort", 3), ...tampons("Alice", "effort", 3), ...tampons("Jade", "effort", 2), ...tampons("Chloé", "effort", 1)];
  const classe = new Set(["Lina", "Bilal", "Alice", "Jade", "Chloé", ...Array.from({ length: 20 }, (_, i) => `Élève ${i}`)]);

  it("F07-AC83 — trois meilleurs totaux : Lina, puis Bilal et Alice ex æquo, puis Jade ; « Voir la suite » ajoute Chloé ; les vingt élèves sans tampon n'y sont jamais", () => {
    const marches = classement(totauxParEleve(effort, classe), "effort", prenom);
    expect(premieres(marches)).toEqual([{ total: 4, eleves: ["Lina"] }, { total: 3, eleves: ["Alice", "Bilal"] }, { total: 2, eleves: ["Jade"] }]);
    expect(suite(marches)).toEqual([{ total: 1, eleves: ["Chloé"] }]);
    expect(marches.flatMap((m) => m.eleves)).toHaveLength(5);
  });

  it("F07-AC83 — aucun total toutes catégories : chaque catégorie a son classement, et une catégorie sans tampon n'en a pas", () => {
    const totaux = totauxParEleve([...effort, ...tampons("Chloé", "plume", 2, 100)], classe);
    expect(classement(totaux, "plume", prenom)).toEqual([{ total: 2, eleves: ["Chloé"] }]);
    expect(classement(totaux, "creativite", prenom)).toEqual([]);
  });
});

describe("Personne à encourager (F07.5)", () => {
  it("F07-AC79 — pas de tampon sur une scène sans élève, sur celle que l'enseignante s'est attribuée, ni sur un texte vide", () => {
    expect(pourquoiSansTampon({ priseParEleve: null, priseParEnseignant: false, texteVide: false })).toBe("sans-eleve");
    expect(pourquoiSansTampon({ priseParEleve: null, priseParEnseignant: true, texteVide: false })).toBe("enseignant");
    expect(pourquoiSansTampon({ priseParEleve: "Bilal", priseParEnseignant: false, texteVide: true })).toBe("texte-vide");
    expect(pourquoiSansTampon({ priseParEleve: "Bilal", priseParEnseignant: false, texteVide: false })).toBeNull();
  });
});
