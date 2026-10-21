import { describe, expect, it } from "vitest";
import { EDITEUR } from "@/domaine/textes-publics";
import { RENONCIATION, avisVerifie, lireLaSession, parametresDeLaSession, signerUnAvis } from "@/serveur/stripe";

const commande = {
  achat: "pass" as const, projetId: "11111111-1111-4111-8111-111111111111", enseignantId: "22222222-2222-4222-8222-222222222222",
  courriel: "m.bernard@exemple.test", montant: 2000, libelle: "Pass du livre « Le marais »",
  merci: "https://iletaituneclasse.com/paiement/merci", abandon: "https://iletaituneclasse.com/projet/x/chapitre/y",
};

describe("Stripe Checkout (F14)", () => {
  it("F14-AC18 — la session exige la case de renonciation, produit la facture, sans abonnement, les moyens de paiement laissés au tableau de bord de Stripe", () => {
    const p = parametresDeLaSession(commande);
    expect(p.mode).toBe("payment");
    expect(Object.keys(p).some((k) => k.startsWith("payment_method_types"))).toBe(false);
    expect(p["consent_collection[terms_of_service]"]).toBe("required");
    expect(p["custom_text[terms_of_service_acceptance][message]"]).toBe(RENONCIATION);
    expect(RENONCIATION).toBe("Je demande l’accès immédiat et renonce à mon droit de rétractation.");
    expect(p["invoice_creation[enabled]"]).toBe("true");
    // La facture porte le SIRET et la franchise de TVA du vendeur
    expect(p["invoice_creation[invoice_data][custom_fields][0][value]"]).toBe(EDITEUR.siret);
    expect(p["invoice_creation[invoice_data][footer]"]).toContain("TVA non applicable, article 293 B du code général des impôts");
    expect(p["metadata[projet]"]).toBe(commande.projetId);
    expect(p.success_url).toBe("https://iletaituneclasse.com/paiement/merci?session={CHECKOUT_SESSION_ID}");
  });

  it("F14-AC18 — la page de Stripe rappelle ce que l'achat donne, avec l'image du projet si Stripe peut la lire", () => {
    const p = parametresDeLaSession({ ...commande, description: "Scènes et images sans limite", image: "https://iletaituneclasse.com/illustrations/defaut-montagne.jpg" });
    expect(p["line_items[0][price_data][product_data][description]"]).toBe("Scènes et images sans limite");
    expect(p["line_items[0][price_data][product_data][images][0]"]).toBe("https://iletaituneclasse.com/illustrations/defaut-montagne.jpg");
    const local = parametresDeLaSession({ ...commande, image: "http://127.0.0.1:54321/storage/v1/object/sign/images/x.jpg" });
    expect(Object.keys(local).some((k) => k.includes("[images]"))).toBe(false);
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
