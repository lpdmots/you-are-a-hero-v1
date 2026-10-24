import { beforeEach, describe, expect, it, vi } from "vitest";

const track = vi.fn();
vi.mock("@vercel/analytics/server", () => ({ track: (...a: unknown[]) => track(...a) }));
vi.mock("next/headers", () => ({
  headers: async () => new Headers({ "user-agent": "Firefox", "x-forwarded-for": "1.2.3.4", cookie: "sb-auth=secret" }),
}));
vi.mock("@/serveur/supabase", () => ({
  clientService: () => ({
    from: () => ({ select: () => ({ eq: (_c: string, id: string) => ({ maybeSingle: async () => ({ data: { createur: id === "porteur" } }) }) }) }),
  }),
}));

const { mesurer } = await import("@/serveur/mesure");

beforeEach(() => track.mockReset());

describe("conversions", () => {
  it("F14-AC50 — une conversion part du serveur, sans nom ni adresse, et sans les témoins de la demande", async () => {
    await mesurer({ evenement: "pass_achete", euros: 20 }, "bernard");
    expect(track).toHaveBeenCalledWith("pass_achete", { euros: 20 }, { headers: { "user-agent": "Firefox", "x-forwarded-for": "1.2.3.4" } });
    await mesurer({ evenement: "projet_cree", organisation: "classe" }, "bernard", false);
    expect(track).toHaveBeenLastCalledWith("projet_cree", { organisation: "classe" }, expect.anything());
  });

  it("F14-AC50 — les comptes du porteur n'envoient rien ; une mesure qui échoue n'empêche rien", async () => {
    await mesurer({ evenement: "recharge_achetee", euros: 5 }, "porteur");
    await mesurer({ evenement: "projet_cree", organisation: "personnel" }, "bernard", true);
    expect(track).not.toHaveBeenCalled();
    track.mockRejectedValueOnce(new Error("réseau"));
    await expect(mesurer({ evenement: "compte_cree", methode: "google" }, "bernard")).resolves.toBeUndefined();
  });
});
