import { describe, expect, it } from "vitest";
import {
  defautsDEcriture, etatsPermis, etatsProposes, ligneEtat, messageEtat, NOM_TAMPON, sEcrit, SIGNE_TAMPON, sorteDeScene, tamponDe,
} from "@/domaine/etats";

/** Étape 4 du plan, lot 1 : les règles d'état d'une scène, sans base ni navigateur (F07.1, F11.1, F06.5). */

describe("Tampon d'état (F06.5, F11.1)", () => {
  it("F06-AC55 — scène sans texte : « En cours » se lit « Texte vide », et « En cours » dès qu'un texte y est", () => {
    expect(NOM_TAMPON[tamponDe("cours", true)]).toBe("Texte vide");
    expect(NOM_TAMPON[tamponDe("cours", false)]).toBe("En cours");
    // « Texte vide » ne remplace que « En cours » : un autre état se lit tel quel, texte vide compris
    expect(NOM_TAMPON[tamponDe("valider", true)]).toBe("À valider");
    expect(NOM_TAMPON[tamponDe("prete", true)]).toBe("Prête");
  });

  it("F11.1 — un seul nom par état, « Validé » et « Prête », et un signe par notion", () => {
    expect([NOM_TAMPON.reprendre, NOM_TAMPON.valider, NOM_TAMPON.valide, NOM_TAMPON.prete]).toEqual(["À reprendre", "À valider", "Validé", "Prête"]);
    expect(new Set(Object.values(SIGNE_TAMPON)).size).toBe(6);
  });
});

describe("États que la scène peut prendre (F11.1)", () => {
  const sans = { priseParEleve: null };
  const avec = { priseParEleve: "alice" };

  it("F11-AC94 — texte fini, image à faire : une scène sans élève se voit proposer « En cours », « Validé » et « Prête », sans « À valider » ni « À reprendre »", () => {
    expect(sorteDeScene(sans, true)).toBe("sans-eleve");
    expect(etatsProposes("sans-eleve", "cours")).toEqual(["cours", "valide", "prete"]);
    expect(ligneEtat("valide", "sans-eleve", false)).toBe("Le texte est fini. Reste à finir la scène.");
  });

  it("F11-AC99 — deux états en mode personnel : « En cours » et « Prête »", () => {
    expect(sorteDeScene(sans, false)).toBe("personnel");
    expect(etatsPermis("personnel")).toEqual(["cours", "prete"]);
    expect(etatsProposes("personnel", "cours")).toEqual(["cours", "prete"]);
  });

  it("F07.1 — scène dont un élève s'occupe : les cinq états, dans l'ordre du travail", () => {
    expect(sorteDeScene(avec, true)).toBe("eleve");
    expect(etatsProposes("eleve", "valider")).toEqual(["cours", "reprendre", "valider", "valide", "prete"]);
  });

  it("F06-AC94 — scène remise que l'enseignant s'attribue : elle montre « À valider », qu'elle garde, sans proposer « À reprendre »", () => {
    expect(etatsProposes("sans-eleve", "valider")).toEqual(["cours", "valider", "valide", "prete"]);
  });

  it("F07.1 — ce que l'état change pour les élèves, dit là où il se choisit", () => {
    expect(sEcrit("cours") && sEcrit("reprendre")).toBe(true);
    expect(sEcrit("valider") || sEcrit("valide") || sEcrit("prete")).toBe(false);
    expect(ligneEtat("cours", "eleve", false)).toBe("Les élèves peuvent écrire.");
    expect(ligneEtat("cours", "eleve", true)).toBe("Les élèves peuvent écrire. Le texte est encore vide.");
    expect(ligneEtat("cours", "personnel", true)).toBe("Le texte est encore vide.");
    expect(ligneEtat("valider", "eleve", false)).toBe("À vous de relire. Les élèves ne peuvent plus écrire.");
    expect(messageEtat("valide", "S016", "eleve")).toBe("S016 est validée. Pour changer d’état : le tampon, en haut.");
    expect(messageEtat("cours", "S060", "sans-eleve")).toBe("S060 est de nouveau en cours.");
  });
});

describe("Rappel avant « prête » (F11.1, F09.2)", () => {
  it("F11.1 — les défauts d'écriture de la scène sont rappelés : texte vide, ni choix ni fin, choix sans destination", () => {
    expect(defautsDEcriture({ vide: true, aChoix: true, fin: false, liens: [] })).toEqual(["Le texte est vide.", "Cette scène n’a ni choix ni fin."]);
    expect(defautsDEcriture({ vide: false, aChoix: true, fin: false, liens: [{ cibleId: "a", cache: false }, { cibleId: null, cache: false }] })).toEqual([
      "Un choix n’a pas de destination.",
    ]);
    // Une fin, une suite par un choix ou par une liaison cachée : rien à rappeler
    expect(defautsDEcriture({ vide: false, aChoix: true, fin: true, liens: [] })).toEqual([]);
    expect(defautsDEcriture({ vide: false, aChoix: true, fin: false, liens: [{ cibleId: "a", cache: true }] })).toEqual([]);
    // Un récit classique n'a ni choix ni fin à contrôler
    expect(defautsDEcriture({ vide: false, aChoix: false, fin: false, liens: [] })).toEqual([]);
  });
});
