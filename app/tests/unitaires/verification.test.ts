import { describe, expect, it } from "vitest";
import { cocheesValides, consigneEtListe, decompteDesCoches, elementPropre, listePropre, rappelARemettre, restants } from "@/domaine/verification";

/** La liste de vérification sous la consigne (F13.2, F07.2), sans base ni écran. */

describe("La liste telle qu'elle s'enregistre (F13.2)", () => {
  it("F13-AC33 — sans élément vide ni doublon, une ligne chacun, huit au plus, 80 caractères chacun", () => {
    expect(listePropre(["  Décrire le garde. ", "", "Décrire le garde.", "Écrire\nle dialogue.", 3])).toEqual(["Décrire le garde.", "Écrire le dialogue."]);
    expect(listePropre(Array.from({ length: 12 }, (_, i) => `Élément ${i}.`))).toHaveLength(8);
    expect(elementPropre("x".repeat(100))).toHaveLength(80);
  });
});

describe("Les coches de l'élève (F07.2)", () => {
  const liste = ["Décrire le garde.", "Écrire le dialogue.", "Montrer la peur de Lou."];

  it("F07-AC102 — une coche tient au libellé : un élément récrit ou retiré n'est plus coché", () => {
    expect(cocheesValides(liste, ["Décrire le garde.", "Décrire le gardien."])).toEqual(["Décrire le garde."]);
    expect(restants(liste, ["Décrire le garde."])).toBe(2);
  });

  it("F07-AC103 — le rappel à la remise dit combien il reste, au singulier comme au pluriel", () => {
    expect(rappelARemettre(1)).toBe("Il te reste 1 élément à vérifier dans « J'ai pensé à ».");
    expect(rappelARemettre(2)).toBe("Il te reste 2 éléments à vérifier dans « J'ai pensé à ».");
  });

  it("F07-AC104 — la consigne repliée dit combien d'éléments sont cochés", () => {
    expect(decompteDesCoches(liste, ["Écrire le dialogue."])).toBe("1 sur 3 coché");
    expect(decompteDesCoches(liste, liste)).toBe("3 sur 3 cochés");
  });
});

describe("La consigne et sa liste, lues par les aides IA (F13)", () => {
  it("la liste suit la consigne sous « J'ai pensé à : » ; sans liste, la consigne seule", () => {
    expect(consigneEtListe("Le passeur apparaît.", ["Décrire le passeur."])).toBe("Le passeur apparaît.\nJ'ai pensé à :\n- Décrire le passeur.");
    expect(consigneEtListe("Le passeur apparaît.", [])).toBe("Le passeur apparaît.");
    expect(consigneEtListe("", [])).toBeNull();
  });
});
