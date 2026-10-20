import { expect, test, type Page } from "@playwright/test";
import { createHmac } from "node:crypto";
import { adultePret, aller, semerPartie, semerProjet, sql, supprimerComptes, type Compte } from "./outils";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Étape 9, lot 5 : le paiement, par Stripe Checkout (F14-AC18 à AC21). Stripe est simulé
 * (STRIPE_SIMULE) : la page de paiement simulée montre ce que la session demandait, exige la case
 * de renonciation, et « Payer » inscrit le paiement comme l'avis de Stripe. L'avis lui-même se
 * rejoue, signé du secret d'essai.
 */

let avant: { paiement_ouvert: boolean; prix_du_pass: number };
test.beforeAll(async () => {
  [avant] = await sql<{ paiement_ouvert: boolean; prix_du_pass: number }>("select paiement_ouvert, prix_du_pass from public.reglages_application");
});
test.afterEach(async () => {
  await sql("update public.reglages_application set paiement_ouvert = $1, prix_du_pass = $2", [avant.paiement_ouvert, avant.prix_du_pass]);
  await sql("delete from public.paiements where enseignant_id is null or enseignant_id in (select id from auth.users where email like 'parcours-%@exemple.test')");
  await supprimerComptes();
});

/** Signe un avis comme Stripe le ferait (le serveur d'essai connaît le secret « whsec_essai_local »). */
const signerUnAvis = (corps: string, secret: string, t = Math.floor(Date.now() / 1000)) =>
  `t=${t},v1=${createHmac("sha256", secret).update(`${t}.${corps}`).digest("hex")}`;
const interrupteur = (allume: boolean) => sql("update public.reglages_application set paiement_ouvert = $1", [allume]);
const DIALOGUE = (page: Page) => page.getByRole("alertdialog");
const solde = async (c: Compte) => (await sql<{ etoiles: number }>("select etoiles from public.enseignants where id = $1", [c.id]))[0].etoiles;

async function leMarais(page: Page, n = 40): Promise<{ compte: Compte; base: SupabaseClient; projet: string; chapitre: string }> {
  const { compte, base } = await adultePret(page);
  const projet = await semerProjet(base, compte, "personnel", "choix", "Le marais", null);
  const { chapitres } = await semerPartie(base, projet, "La traversée", [{ titre: "Le dernier bac", scenes: Array.from({ length: n }, (_, i) => `Scène ${i + 1}`) }]);
  return { compte, base, projet, chapitre: chapitres[0].id };
}

async function ouvrirMonCompte(page: Page): Promise<void> {
  await page.locator("header button[aria-haspopup='dialog']").first().click();
  await expect(page.getByRole("heading", { name: "Mon compte" })).toBeVisible();
}

test("F14-AC18, AC21 — acheter le pass depuis le dialogue : la page de paiement porte le prix des réglages et exige la case ; payé, le projet a son pass et ses étoiles", async ({ page }) => {
  const m = await leMarais(page);
  await interrupteur(true);
  await sql("update public.reglages_application set prix_du_pass = 2500");
  const avantSolde = await solde(m.compte);
  await aller(page, `/projet/${m.projet}/chapitre/${m.chapitre}`);
  await page.getByRole("button", { name: "Ajouter une scène" }).click();
  await DIALOGUE(page).getByRole("button", { name: "Acheter le pass · 25 €" }).click();

  await expect(page).toHaveURL(/\/paiement\/simulation\?session=cs_simule_/);
  await expect(page.getByText("Pass du livre « Le marais » · 25 €")).toBeVisible();
  // Sans la case, rien ne se paie
  await page.getByRole("button", { name: "Payer" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Cochez" })).toContainText("Cochez la case pour payer.");
  await page.getByLabel("Je demande l’accès immédiat et renonce à mon droit de rétractation.").check();
  await page.getByRole("button", { name: "Payer" }).click();

  await expect(page).toHaveURL(new RegExp(`/projet/${m.projet}/plan`));
  await expect(page.locator(".message")).toContainText("Le pass est là");
  expect((await sql("select origine from public.passes where projet_id = $1", [m.projet]))).toEqual([{ origine: "achat" }]);
  expect(await solde(m.compte)).toBe(avantSolde + 400);
  expect((await sql<{ montant: number }>("select montant from public.paiements where projet_id = $1", [m.projet]))[0].montant).toBe(2500);
  // Le pass est là : la 41e scène s'ajoute
  await aller(page, `/projet/${m.projet}/chapitre/${m.chapitre}`);
  await page.getByRole("button", { name: "Ajouter une scène" }).click();
  await expect(page.locator(".message")).toContainText("est ajoutée à la fin du chapitre");
});

test("F14-AC19 — recharger depuis « Mon compte » ; l'avis de Stripe reçu deux fois ne donne les étoiles qu'une fois", async ({ page, request }) => {
  const m = await leMarais(page, 1);
  await interrupteur(true);
  const avantSolde = await solde(m.compte);
  await aller(page, "/projets");
  await ouvrirMonCompte(page);
  await page.getByRole("button", { name: "Recharger · 5 € pour 100 ✦" }).click();
  await expect(page).toHaveURL(/\/paiement\/simulation\?session=/);
  const session = new URL(page.url()).searchParams.get("session")!;

  // L'avis de Stripe arrive, deux fois, avant le retour de l'enseignant
  const corps = JSON.stringify({
    type: "checkout.session.completed",
    data: { object: { id: session, payment_status: "paid", amount_total: 500, metadata: { achat: "recharge", enseignant: m.compte.id } } },
  });
  for (let i = 0; i < 2; i++) {
    const r = await request.post("/paiement/avis", { data: corps, headers: { "stripe-signature": signerUnAvis(corps, "whsec_essai_local"), "content-type": "application/json" } });
    expect(r.status()).toBe(200);
  }
  // Un avis mal signé est refusé
  expect((await request.post("/paiement/avis", { data: corps, headers: { "stripe-signature": signerUnAvis(corps, "whsec_autre") } })).status()).toBe(400);
  expect(await solde(m.compte)).toBe(avantSolde + 100);

  // Puis le retour par la page de paiement : rien de plus
  await page.getByLabel("Je demande l’accès immédiat et renonce à mon droit de rétractation.").check();
  await page.getByRole("button", { name: "Payer" }).click();
  await expect(page).toHaveURL(/\/projets/);
  await expect(page.locator(".message")).toContainText("Vos étoiles sont arrivées.");
  expect(await solde(m.compte)).toBe(avantSolde + 100);
  await ouvrirMonCompte(page);
  await expect(page.getByText(`Il vous reste ${avantSolde + 100} ✦ pour les aides.`)).toBeVisible();
});

test("F14-AC20 — quitter la page de paiement, ou une carte refusée : rien ne change, et l'on revient où l'on était", async ({ page }) => {
  const m = await leMarais(page);
  await interrupteur(true);
  const avantSolde = await solde(m.compte);
  await aller(page, `/projet/${m.projet}/chapitre/${m.chapitre}`);
  await page.getByRole("button", { name: "Ajouter une scène" }).click();
  await DIALOGUE(page).getByRole("button", { name: /Acheter le pass/ }).click();
  await expect(page).toHaveURL(/\/paiement\/simulation/);
  await page.getByLabel("Je demande l’accès immédiat et renonce à mon droit de rétractation.").check();
  await page.getByLabel("Carte refusée").check();
  await page.getByRole("button", { name: "Payer" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "carte" })).toContainText("Votre carte a été refusée.");
  await page.getByRole("link", { name: "Retour" }).click();
  await expect(page).toHaveURL(new RegExp(`/projet/${m.projet}/chapitre/${m.chapitre}$`));
  expect(await sql("select 1 from public.passes where projet_id = $1", [m.projet])).toHaveLength(0);
  expect(await sql("select 1 from public.paiements where projet_id = $1", [m.projet])).toHaveLength(0);
  expect(await solde(m.compte)).toBe(avantSolde);
});

test("F14-AC12 — interrupteur éteint : ni « Recharger », ni achat possible, même en appelant l'action", async ({ page }) => {
  await leMarais(page, 1);
  await interrupteur(false);
  await aller(page, "/projets");
  await ouvrirMonCompte(page);
  await expect(page.getByRole("button", { name: /Recharger/ })).toHaveCount(0);
});
