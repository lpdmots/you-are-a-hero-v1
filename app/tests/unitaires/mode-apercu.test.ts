import { afterEach, describe, expect, it, vi } from "vitest";

/**
 * La présentation de l'aperçu gardée par le navigateur (F11.2) : lue après l'hydratation, pour
 * que le premier rendu soit celui du serveur, et tenue pour la visite sans stockage.
 */

const charger = async (stockage: Partial<Storage> | "bloque") => {
  vi.resetModules();
  vi.stubGlobal("window", {
    get localStorage() {
      if (stockage === "bloque") throw new Error("stockage bloqué");
      return stockage;
    },
  });
  return import("@/app/(adulte)/projet/[id]/_livre/modeApercu");
};
const stockageVide = () => {
  const m = new Map<string, string>();
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v), m };
};

afterEach(() => vi.unstubAllGlobals());

describe("Présentation de l'aperçu gardée", () => {
  it("reprend le choix gardé pour cette présentation par défaut, et la présentation par défaut sinon", async () => {
    const s = stockageVide();
    s.m.set("apercu-mode-agrandie", "double");
    s.m.set("apercu-mode-double", "n'importe quoi");
    const { modeGarde } = await charger(s);
    expect(modeGarde("agrandie")).toBe("double");
    expect(modeGarde("double")).toBe("double");
  });

  it("garde le choix et prévient l'aperçu, qui se rend de nouveau", async () => {
    const s = stockageVide();
    const { abonnerAuMode, garderLeMode, modeGarde } = await charger(s);
    const prevenir = vi.fn();
    const desabonner = abonnerAuMode(prevenir);
    garderLeMode("double", "agrandie");
    expect(prevenir).toHaveBeenCalledTimes(1);
    expect(modeGarde("double")).toBe("agrandie");
    expect(s.m.get("apercu-mode-double")).toBe("agrandie");
    desabonner();
    garderLeMode("double", "double");
    expect(prevenir).toHaveBeenCalledTimes(1);
  });

  it("sans stockage du navigateur, le choix vaut pour la visite", async () => {
    const { garderLeMode, modeGarde } = await charger("bloque");
    expect(modeGarde("agrandie")).toBe("agrandie");
    garderLeMode("agrandie", "double");
    expect(modeGarde("agrandie")).toBe("double");
  });
});
