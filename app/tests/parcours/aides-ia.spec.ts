import { expect, test, type Page } from "@playwright/test";
import { adultePret, supprimerComptes } from "./outils";

/**
 * Étape 8, lot 1 : la rubrique « Aides IA » de « Mon compte » (F13, cadre commun). Les
 * réglages valent pour tous les projets du compte et se retrouvent à la visite suivante.
 */

test.afterEach(async () => {
  await supprimerComptes();
});

const ouvrirMonCompte = async (page: Page) => {
  await page.locator("header button[aria-haspopup='dialog']").first().click();
  await expect(page.getByRole("heading", { name: "Mon compte" })).toBeVisible();
};

test("F13-AC01 — le degré 2 est proposé d'abord ; le défaut choisi, le niveau et les images sont gardés avec le compte", async ({ page }) => {
  await adultePret(page);
  await ouvrirMonCompte(page);
  await expect(page.getByLabel("Degré de correction par défaut")).toHaveValue("2");
  await expect(page.getByLabel("Degré de correction par défaut").locator("option:checked")).toHaveText("Degré 2 · Orthographe et grammaire");

  await page.getByLabel("Degré de correction par défaut").selectOption("3");
  await expect(page.getByText("Enregistré")).toBeVisible();
  await page.getByRole("checkbox", { name: "CM1" }).check();
  await page.getByRole("button", { name: "Deux" }).click();
  await page.getByRole("button", { name: "Haute" }).click();
  await expect(page.getByText("Enregistrement…")).toHaveCount(0);
  await expect(page.getByText("Enregistré")).toBeVisible();

  await page.reload();
  await ouvrirMonCompte(page);
  await expect(page.getByLabel("Degré de correction par défaut")).toHaveValue("3");
  await expect(page.getByRole("checkbox", { name: "CM1" })).toBeChecked();
  await expect(page.getByRole("checkbox", { name: "CM2" })).not.toBeChecked();
  await expect(page.getByRole("button", { name: "Deux" })).toHaveAttribute("aria-pressed", "true");
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

  await page.reload();
  await ouvrirMonCompte(page);
  await expect(page.getByRole("switch", { name: "Proposer les aides IA" })).not.toBeChecked();
  await page.getByText("Proposer les aides IA", { exact: true }).click();
  await expect(page.getByLabel("Degré de correction par défaut")).toHaveValue("4");
});
