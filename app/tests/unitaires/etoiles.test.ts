import { describe, expect, it } from "vitest";
import { regrouperLesAides, type Mouvement } from "@/domaine/etoiles";

const m = (quand: string, nombre: number, motif: string): Mouvement => ({ quand, nombre, motif, note: null });

describe("L'histoire des étoiles dans l'administration (F14-AC24)", () => {
  it("les aides qui se suivent font une ligne, avec leur total ; une aide seule garde la sienne", () => {
    const lignes = regrouperLesAides([
      m("2026-10-21T16:38:00Z", 100, "recharge"),
      m("2026-10-21T09:38:00Z", -1, "aide"),
      m("2026-10-21T09:36:00Z", -2, "aide"),
      m("2026-10-21T09:35:00Z", -3, "aide"),
      m("2026-10-21T09:30:00Z", 400, "pass"),
      m("2026-10-21T09:25:00Z", -2, "aide"),
      m("2026-10-21T09:22:00Z", 30, "bienvenue"),
    ]);
    expect(lignes.map((l) => l.sorte)).toEqual(["mouvement", "aides", "mouvement", "mouvement", "mouvement"]);
    const aides = lignes[1];
    expect(aides.sorte === "aides" && [aides.total, aides.aides.length, aides.premiere, aides.derniere]).toEqual([-6, 3, "2026-10-21T09:35:00Z", "2026-10-21T09:38:00Z"]);
    expect(lignes[3].sorte === "mouvement" && lignes[3].mouvement.nombre).toBe(-2);
  });
});
