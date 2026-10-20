import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { inscrireLePaiement } from "@/serveur/stripe";
import { creerEnseignant, creerProjet, nettoyer, sql, type Adulte } from "./outils";

/**
 * Étape 9, lot 5 : un paiement reçu s'inscrit une seule fois et donne ce qu'il achète
 * (F14-AC18, AC19), contre la vraie base locale. Stripe n'est jamais appelé.
 */

let bernard: Adulte;
beforeAll(async () => {
  bernard = await creerEnseignant("M. Bernard");
});
afterAll(async () => {
  await sql("delete from public.paiements where enseignant_id = $1", [bernard.id]);
  await nettoyer();
});

const solde = async () => (await sql<{ etoiles: number }>("select etoiles from public.enseignants where id = $1", [bernard.id]))[0].etoiles;
const session = () => `cs_test_${crypto.randomUUID().replace(/-/g, "")}`;

describe("Paiements reçus (F14-AC18, AC19)", () => {
  it("F14-AC18 — le pass payé : le projet a son pass et le compte ses étoiles ; la vente est inscrite", async () => {
    const projet = (await creerProjet(bernard, "personnel", "choix", "Le marais")).id;
    const avant = await solde();
    const id = session();
    expect(await inscrireLePaiement({ id, payee: true, montant: 2000, achat: "pass", enseignant: bernard.id, projet })).toBe(true);
    expect((await sql("select origine from public.passes where projet_id = $1", [projet]))).toEqual([{ origine: "achat" }]);
    expect(await solde()).toBe(avant + 400);
    expect((await sql("select achat, montant from public.paiements where session = $1", [id]))).toEqual([{ achat: "pass", montant: 2000 }]);
    // L'adulte lit ses achats, sans pouvoir en écrire
    expect((await bernard.base.from("paiements").select("session")).data).toHaveLength(1);
    expect((await bernard.base.from("paiements").insert({ session: session(), enseignant_id: bernard.id, achat: "recharge", montant: 1 })).error).not.toBeNull();
  });

  it("F14-AC19 — une recharge reçue deux fois ne donne ses étoiles qu'une fois ; une session non payée ne donne rien", async () => {
    const avant = await solde();
    const id = session();
    const recue = { id, payee: true, montant: 500, achat: "recharge", enseignant: bernard.id, projet: null };
    const [a, b] = await Promise.all([inscrireLePaiement(recue), inscrireLePaiement(recue)]);
    expect([a, b].filter(Boolean)).toHaveLength(1);
    expect(await inscrireLePaiement(recue)).toBe(false);
    expect(await solde()).toBe(avant + 100);
    expect(await inscrireLePaiement({ ...recue, id: session(), payee: false })).toBe(false);
    expect(await solde()).toBe(avant + 100);
  });
});
