import { describe, expect, it } from "vitest";
import { enEuros, lireOffre, messageDeLaLimite, posesDImages } from "@/domaine/offre";

describe("L'offre (F14)", () => {
  it("F14-AC21 — les valeurs viennent des réglages de l'application ; sans elles, celles de l'entretien", () => {
    expect(lireOffre(null)).toMatchObject({ paiementOuvert: false, scenesGratuites: 40, imagesGratuites: 10, prixDuPass: 2000, etoilesDuPass: 400 });
    expect(lireOffre({ paiement_ouvert: true, prix_du_pass: 2500 })).toMatchObject({ paiementOuvert: true, prixDuPass: 2500 });
    expect(enEuros(2000)).toBe("20\u00a0€");
    expect(enEuros(450)).toBe("4,50\u00a0€");
    expect(messageDeLaLimite("images", { scenesGratuites: 40, imagesGratuites: 10 })).toBe("Ce livre a ses 10 images gratuites.");
  });

  it("F14-AC14 — les images d'une scène se comptent comme la base les compte : en bloc et sur la ligne, hors des notes", () => {
    const image = { type: "image", image: "a", children: [{ text: "" }] };
    const surLaLigne = { type: "p", children: [{ text: "Lou " }, { type: "image-ligne", image: "b", children: [{ text: "" }] }, { text: "" }] };
    const note = { type: "note", children: [{ type: "image", image: "c", children: [{ text: "" }] }] };
    expect(posesDImages([image, surLaLigne, note, image])).toBe(3);
    expect(posesDImages([])).toBe(0);
  });
});
