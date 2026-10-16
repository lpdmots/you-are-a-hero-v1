import { describe, expect, it } from "vitest";
import { rappelDe } from "@/app/(adulte)/projet/[id]/_livre/points";
import type { Probleme } from "@/domaine/controles";

/**
 * Les rappels avant le PDF définitif et le partage (F11.2, F12.1) : chaque point dit où il est.
 * Une image de page de présentation n'a pas de scène : sa page la désigne (16 octobre 2026).
 */
describe("Rappel d'un point avant le PDF définitif ou le partage", () => {
  const noms = { s4: "n° 4 · S004" };
  const floue = (o: { sceneId: string | null; pageDuLivre?: string }) =>
    ({ sorte: "image-floue", gravite: "avert", etape: "relire", cle: "x", image: "i", bloc: null, ppp: 120, largeur: 100, ...o }) as unknown as Probleme;

  it("F11-AC100 — une image d'une scène : son numéro et sa référence ; une image de la page de titre : sa page", () => {
    expect(rappelDe(floue({ sceneId: "s4" }), noms)).toBe("n° 4 · S004 · Image peu définie.");
    expect(rappelDe(floue({ sceneId: null, pageDuLivre: "Page de titre" }), noms)).toBe("Page de titre · Image peu définie.");
  });
});
