import { test, type Page } from "@playwright/test";
import { adultePret, aller, supprimerComptes } from "../parcours/outils";

/**
 * Captures des écrans de l'étape 8 : npm run captures -- etape8
 * Elles s'écrivent dans test-results/captures/. Ce n'est pas un test : rien n'y est vérifié.
 */
const dossier = "test-results/captures";
let n = 800;
const capturer = async (page: Page, nom: string, toute = true) => {
  n += 1;
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${dossier}/${n}-${nom}.png`, fullPage: toute });
};

test.afterEach(async () => {
  await supprimerComptes();
});

const ouvrirMonCompte = async (page: Page) => {
  await page.locator("header button[aria-haspopup='dialog']").first().click();
  await page.getByRole("heading", { name: "Mon compte" }).waitFor();
};

test("lot 1 : « Aides IA » dans « Mon compte », et la page de jugement de l'essai", async ({ page }) => {
  test.setTimeout(240_000);
  await adultePret(page);

  await ouvrirMonCompte(page);
  await capturer(page, "mon-compte-aides-ia", false);
  await page.locator(".panneau__corps").evaluate((e) => e.scrollTo(0, e.scrollHeight));
  await capturer(page, "mon-compte-aides-ia-bas", false);
  await page.getByRole("checkbox", { name: "CM1" }).check();
  await page.getByRole("checkbox", { name: "CM2" }).check();
  await page.getByLabel("Degré de correction par défaut").selectOption("3");
  await page.getByText("Enregistré").waitFor();
  await capturer(page, "mon-compte-aides-ia-reglees", false);
  await page.getByText("Proposer les aides IA", { exact: true }).click();
  await page.getByText("Aucune aide IA dans vos projets").waitFor();
  await capturer(page, "mon-compte-aides-ia-eteintes", false);
  await page.getByText("Proposer les aides IA", { exact: true }).click();

  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  await page.locator("html[data-pret]").waitFor();
  await ouvrirMonCompte(page);
  await page.getByRole("heading", { name: "Aides IA" }).scrollIntoViewIfNeeded();
  await capturer(page, "mon-compte-aides-ia-390", false);

  // La page de jugement lit essais-ia/resultats.json, s'il existe
  await page.setViewportSize({ width: 1366, height: 900 });
  await aller(page, "/essai-ia");
  await capturer(page, "essai-premier-cas");
  for (const cas of ["Correction, degré 3 (phrases plus claires), CM2", "Dix idées de choix : enfermé au grenier, sans la clé", "Fiche visuelle : la chouette messagère"]) {
    const option = page.locator("option", { hasText: cas });
    if (!(await option.count())) continue;
    await page.getByLabel("Aller au cas").selectOption({ label: (await option.textContent())!.trim() });
    await capturer(page, `essai-${cas.split(" ")[0].toLowerCase()}`);
  }
  const propositions = page.locator("section[aria-label^='Proposition']");
  if (await propositions.count()) {
    await propositions.first().getByRole("button", { name: "Bonne" }).click();
    await propositions.first().getByRole("button", { name: /Meilleure/ }).click();
    await propositions.nth(1).getByRole("button", { name: "Passable" }).click();
    await capturer(page, "essai-note");
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await capturer(page, "essai-390");
  await page.setViewportSize({ width: 1366, height: 900 });
  await aller(page, "/essai-ia?resultats=1");
  await capturer(page, "essai-resultats");
});
