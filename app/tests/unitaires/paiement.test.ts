import { describe, expect, it } from "vitest";
import { RENONCIATION, avisVerifie, lireLaSession, parametresDeLaSession, signerUnAvis } from "@/serveur/stripe";

const commande = {
  achat: "pass" as const, projetId: "11111111-1111-4111-8111-111111111111", enseignantId: "22222222-2222-4222-8222-222222222222",
  courriel: "m.bernard@exemple.test", montant: 2000, libelle: "Pass du livre « Le marais »",
  merci: "https://iletaituneclasse.com/paiement/merci", abandon: "https://iletaituneclasse.com/projet/x/chapitre/y",
};

describe("Stripe Checkout (F14)", () => {
  it("F14-AC18 — la session exige la case de renonciation, produit la facture, se paie par carte, sans abonnement", () => {
    const p = parametresDeLaSession(commande);
    expect(p.mode).toBe("payment");
    expect(p["payment_method_types[0]"]).toBe("card");
    expect(p["consent_collection[terms_of_service]"]).toBe("required");
    expect(p["custom_text[terms_of_service_acceptance][message]"]).toBe(RENONCIATION);
    expect(RENONCIATION).toBe("Je demande l’accès immédiat et renonce à mon droit de rétractation.");
    expect(p["invoice_creation[enabled]"]).toBe("true");
    expect(p["metadata[projet]"]).toBe(commande.projetId);
    expect(p.success_url).toBe("https://iletaituneclasse.com/paiement/merci?session={CHECKOUT_SESSION_ID}");
  });

  it("F14-AC20 — un abandon ramène où l'on était", () => {
    expect(parametresDeLaSession(commande).cancel_url).toBe(commande.abandon);
  });

  it("F14-AC21 — le prix de la session est celui des réglages", () => {
    expect(parametresDeLaSession({ ...commande, montant: 2500 })["line_items[0][price_data][unit_amount]"]).toBe("2500");
  });

  it("F14-AC19 — seul un avis signé du secret du site est lu, et pas un vieil avis rejoué", () => {
    const corps = JSON.stringify({ type: "checkout.session.completed", data: { object: { id: "cs_test_1", payment_status: "paid", amount_total: 500, metadata: { achat: "recharge", enseignant: "e" } } } });
    expect(avisVerifie(corps, signerUnAvis(corps, "whsec_a"), "whsec_a")?.type).toBe("checkout.session.completed");
    expect(avisVerifie(corps, signerUnAvis(corps, "whsec_b"), "whsec_a")).toBeNull();
    expect(avisVerifie(corps + " ", signerUnAvis(corps, "whsec_a"), "whsec_a")).toBeNull();
    expect(avisVerifie(corps, signerUnAvis(corps, "whsec_a", Math.floor(Date.now() / 1000) - 3600), "whsec_a")).toBeNull();
    expect(avisVerifie(corps, null, "whsec_a")).toBeNull();
    expect(lireLaSession(JSON.parse(corps).data.object)).toEqual({ id: "cs_test_1", payee: true, montant: 500, achat: "recharge", enseignant: "e", projet: null });
  });
});
