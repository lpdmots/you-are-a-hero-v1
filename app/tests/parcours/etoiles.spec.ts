import { expect, test, type Page } from "@playwright/test";
import { adultePret, aller, MESSAGE, recit, semerBlocs, semerPartie, semerProjet, sql, supprimerComptes, type Compte, ouvrirLeMenuDuCompte } from "./outils";

/**
 * Étape 9, lot 3 : les étoiles, vues par l'enseignant (F14-AC07, AC08, AC11). Le fournisseur est
 * simulé (IA_SIMULEE) et ne coûte rien : le solde se règle directement dans la base locale, par un
 * mouvement comme un autre.
 */

let avant: { paiement_ouvert: boolean };
test.beforeAll(async () => {
  [avant] = await sql<{ paiement_ouvert: boolean }>("select paiement_ouvert from public.reglages_application");
});
const interrupteur = (allume: boolean) => sql("update public.reglages_application set paiement_ouvert = $1", [allume]);

test.afterEach(async () => {
  await interrupteur(avant.paiement_ouvert);
  await sql("delete from public.paiements where enseignant_id is null or enseignant_id in (select id from auth.users where email like 'parcours-%@exemple.test')");
  await supprimerComptes();
});

async function soldeA(compte: Compte, n: number): Promise<void> {
  const [{ etoiles }] = await sql<{ etoiles: number }>("select etoiles from public.enseignants where id = $1", [compte.id]);
  if (etoiles !== n) await sql("insert into public.mouvements_etoiles (enseignant_id, nombre, motif) values ($1, $2, 'cadeau')", [compte.id, n - etoiles]);
}

async function ouvrirMonCompte(page: Page): Promise<void> {
  await ouvrirLeMenuDuCompte(page);
  await page.getByRole("link", { name: "Mon compte" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Mon compte" })).toBeVisible();
}

/** Une scène du projet personnel « Le phare », ouverte. */
async function uneScene(page: Page) {
  const { compte, base } = await adultePret(page);
  const projet = await semerProjet(base, compte, "personnel", "choix", "Le phare", null);
  const { chapitres } = await semerPartie(base, projet, "La côte", [{ titre: "La falaise", scenes: ["Le phare"] }]);
  const scene = chapitres[0].scenes[0];
  await semerBlocs(base, scene, [recit("La lanterne tourne au sommet du phare.")]);
  return { compte, projet, scene };
}

test("F14-AC07 — « Mon compte » dit le solde ; aucun bouton d'IA ne montre de prix ; quand il en reste peu, le solde se dit près de l'aide", async ({ page }) => {
  const s = await uneScene(page);
  await ouvrirMonCompte(page);
  await expect(page.getByText("Il vous reste 30 ✦ pour les aides.")).toBeVisible();
  // Le solde se lit aussi d'un coup d'œil, dans le menu du nom
  await ouvrirLeMenuDuCompte(page);
  await expect(page.locator("header").getByText("30 ✦ pour les aides")).toBeVisible();

  await aller(page, `/projet/${s.projet}/scene/${s.scene}`);
  const titres = page.getByRole("button", { name: "Proposer des titres" });
  await expect(titres).toBeVisible();
  // Aucun prix sur les boutons de l'IA, ni ailleurs dans la page
  await expect(page.locator("body")).not.toContainText("€");
  await expect(page.locator("body")).not.toContainText(/\d\s*✦/);
  // Au-dessus de « peu », rien ne se dit
  await titres.click();
  await expect(page.getByRole("group", { name: "Titres proposés" })).toBeVisible();
  await expect(page.getByText(/Il vous reste/)).toHaveCount(0);
  await page.keyboard.press("Escape");

  await soldeA(s.compte, 8);
  await titres.click();
  await expect(MESSAGE(page)).toContainText("Il vous reste 8 ✦.");
  // Le menu du nom relit le solde à son ouverture, sans recharger la page
  await page.keyboard.press("Escape");
  await ouvrirLeMenuDuCompte(page);
  await expect(page.locator("header").getByText("8 ✦ pour les aides")).toBeVisible();
});

test("F14-AC08 — à 0 ✦, l'aide ne part pas : « Vous n'avez plus d'étoiles. Tout le reste fonctionne. »", async ({ page }) => {
  const s = await uneScene(page);
  await interrupteur(false);
  await soldeA(s.compte, 0);
  await aller(page, `/projet/${s.projet}/scene/${s.scene}`);
  await page.getByRole("button", { name: "Proposer des titres" }).click();
  await expect(MESSAGE(page)).toContainText("Vous n'avez plus d'étoiles. Tout le reste fonctionne.");
  await expect(page.getByRole("group", { name: "Titres proposés" })).toHaveCount(0);
  // « Paiement ouvert » éteint : rien à vendre, aucun dialogue ne s'ouvre (F14-AC38)
  await expect(page.getByRole("alertdialog")).toHaveCount(0);
  expect(await sql("select 1 from public.appels_ia where enseignant_id = $1", [s.compte.id])).toHaveLength(0);
  await ouvrirMonCompte(page);
  await expect(page.getByText("Il vous reste 0 ✦ pour les aides.")).toBeVisible();
});

test("F14-AC38 — « Paiement ouvert » allumé, à 0 ✦ : l'aide refusée ouvre la recharge, qui mène au paiement et revient", async ({ page }) => {
  const s = await uneScene(page);
  await interrupteur(true);
  await soldeA(s.compte, 0);
  await aller(page, `/projet/${s.projet}/scene/${s.scene}`);
  await page.getByRole("button", { name: "Proposer des titres" }).click();
  const dialogue = page.getByRole("alertdialog");
  await expect(dialogue.getByRole("heading", { name: "Vous n’avez plus d’étoiles" })).toBeVisible();
  await expect(dialogue).toContainText("100 ✦");
  await expect(dialogue).toContainText("pour les aides IA de tous vos projets");
  // « Plus tard » le referme ; l'aide suivante le rouvre
  await dialogue.getByRole("button", { name: "Plus tard" }).click();
  await expect(dialogue).toHaveCount(0);
  await page.getByRole("button", { name: "Proposer des titres" }).click();
  await dialogue.getByRole("button", { name: /^Recharger · 5/ }).click();
  await expect(page).toHaveURL(/\/paiement\/simulation\?session=cs_simule_/);
  await page.getByLabel("Je demande l’accès immédiat et renonce à mon droit de rétractation.").check();
  await page.getByRole("button", { name: "Payer" }).click();
  await expect.poll(async () => (await sql<{ etoiles: number }>("select etoiles from public.enseignants where id = $1", [s.compte.id]))[0].etoiles).toBe(100);
});

test("F14-AC11 — le compte du porteur : aucun solde dans « Mon compte », l'aide part à 0 ✦", async ({ page }) => {
  const s = await uneScene(page);
  await sql("update public.enseignants set createur = true where id = $1", [s.compte.id]);
  await soldeA(s.compte, 0);
  await aller(page, `/projet/${s.projet}/scene/${s.scene}`);
  await ouvrirMonCompte(page);
  await expect(page.getByRole("heading", { name: "Aides IA" })).toBeVisible();
  await expect(page.getByText(/Il vous reste/)).toHaveCount(0);
  await ouvrirLeMenuDuCompte(page);
  await expect(page.getByText(/✦ pour les aides/)).toHaveCount(0);
  await aller(page, `/projet/${s.projet}/scene/${s.scene}`);
  await page.getByRole("button", { name: "Proposer des titres" }).click();
  await expect(page.getByRole("group", { name: "Titres proposés" })).toBeVisible();
});
