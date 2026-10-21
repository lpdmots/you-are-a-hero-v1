import { expect, test, type Page } from "@playwright/test";
import { adultePret, aller, semerProjet, sql, supprimerComptes, ouvrirLeMenuDuCompte } from "./outils";

/**
 * Étape 8, lot 1 : la rubrique « Aides IA » de « Mon compte » (F13, cadre commun). Les
 * réglages valent pour tous les projets du compte et se retrouvent à la visite suivante.
 */

test.afterEach(async () => {
  await supprimerComptes();
});

const ouvrirMonCompte = async (page: Page) => {
  await ouvrirLeMenuDuCompte(page);
  await page.getByRole("link", { name: "Mon compte" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Mon compte" })).toBeVisible();
};

test("F13-AC01 — le degré 2 est proposé d'abord ; le défaut choisi et les images sont gardés avec le compte", async ({ page }) => {
  await adultePret(page);
  await ouvrirMonCompte(page);
  await expect(page.getByLabel("Degré de correction par défaut")).toHaveValue("2");
  await expect(page.getByLabel("Degré de correction par défaut").locator("option:checked")).toHaveText("Degré 2 · Orthographe et grammaire");

  await page.getByLabel("Degré de correction par défaut").selectOption("3");
  await expect(page.getByText("Enregistré")).toBeVisible();
  await page.getByRole("button", { name: "Deux", exact: true }).click();
  await page.getByRole("button", { name: "Haute" }).click();
  await expect(page.getByText("Enregistrement…")).toHaveCount(0);
  await expect(page.getByText("Enregistré")).toBeVisible();

  await page.reload();
  await ouvrirMonCompte(page);
  await expect(page.getByLabel("Degré de correction par défaut")).toHaveValue("3");
  await expect(page.getByRole("button", { name: "Deux", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("button", { name: "Haute" })).toHaveAttribute("aria-pressed", "true");
});

test("éteintes, les aides replient leurs réglages ; rallumées, elles les retrouvent", async ({ page }) => {
  await adultePret(page);
  await ouvrirMonCompte(page);
  await page.getByLabel("Degré de correction par défaut").selectOption("4");
  await expect(page.getByText("Enregistré")).toBeVisible();
  await page.getByText("Proposer les aides IA", { exact: true }).click();
  await expect(page.getByText("Aucune aide IA dans vos projets. Tout le reste fonctionne.")).toBeVisible();
  await expect(page.getByLabel("Degré de correction par défaut")).toHaveCount(0);
  // Le réglage s'enregistre avant qu'on recharge la page
  await expect(page.getByText("Enregistré")).toBeVisible();

  await page.reload();
  await ouvrirMonCompte(page);
  await expect(page.getByRole("switch", { name: "Proposer les aides IA" })).not.toBeChecked();
  await page.getByText("Proposer les aides IA", { exact: true }).click();
  await expect(page.getByLabel("Degré de correction par défaut")).toHaveValue("4");
});

test("F13-AC29 — l'âge des lecteurs se règle avec chaque projet : « 8 à 10 ans » d'abord, « Adultes » gardé pour ce projet seul", async ({ page }) => {
  const { compte, base } = await adultePret(page);
  const grandVoyage = await semerProjet(base, compte, "personnel", "choix", "Le grand voyage", null);
  const lanterne = await semerProjet(base, compte, "personnel", "choix", "La lanterne du passeur", null);
  await aller(page, `/projet/${grandVoyage}/plan`);
  await page.getByRole("button", { name: "Réglages du projet" }).click();
  await expect(page.getByRole("button", { name: "8 à 10 ans" })).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Adultes" }).click();
  await expect(page.getByRole("button", { name: "Adultes" })).toHaveAttribute("aria-pressed", "true");
  await expect
    .poll(async () => (await sql<{ a: string }>("select age_des_lecteurs as a from projets where id = $1", [grandVoyage]))[0].a)
    .toBe("adultes");
  expect((await sql<{ a: string }>("select age_des_lecteurs as a from projets where id = $1", [lanterne]))[0].a).toBe("8-10");

  // Aides éteintes : le réglage ne se montre pas
  await sql("update enseignants set reglages_ia = reglages_ia || '{\"proposer\": false}'::jsonb where id = $1", [compte.id]);
  await aller(page, `/projet/${grandVoyage}/plan`);
  await page.getByRole("button", { name: "Réglages du projet" }).click();
  await expect(page.getByRole("heading", { name: "Images", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Âge des lecteurs" })).toHaveCount(0);
});
