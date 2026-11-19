import { test, type Page } from "@playwright/test";

/**
 * Captures de la page « Ressources » (F14, F14-AC55 à AC58), pour sa critique en deux lectures : contre le serveur
 * local déjà lancé, npx playwright test --config playwright.local.config.ts ressources. Elles s'écrivent dans
 * test-results/captures/ressources/, fenêtre après fenêtre, en 1440 et en 390 points. Ce n'est pas un test : rien
 * n'y est vérifié, et la page ne lit pas la base.
 */
const dossier = "test-results/captures/ressources";

/** La page entière, une fenêtre après l'autre (une capture « pleine page » répéterait la barre collée) */
async function parcourir(page: Page, largeur: number, hauteur: number, prefixe: string) {
  await page.setViewportSize({ width: largeur, height: hauteur });
  await page.goto("/ressources");
  await page.evaluate(() => document.fonts.ready);
  const total = await page.evaluate(() => document.documentElement.scrollHeight);
  let i = 1;
  for (let y = 0; y < total; y += hauteur - 120) {
    await page.evaluate((h) => window.scrollTo(0, h), y);
    // Les vignettes se chargent en approchant
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${dossier}/${prefixe}-${String(i).padStart(2, "0")}.png` });
    i += 1;
  }
}

test("ressources en 1440 et en 390 points", async ({ page }) => {
  test.setTimeout(120_000);
  await parcourir(page, 1440, 1000, "1440");
  // Une feuille qu'on va prendre : elle se redresse
  await page.evaluate(() => document.getElementById("lecon-1-livre-jeu")?.scrollIntoView({ block: "center" }));
  await page.locator("#lecon-1-livre-jeu .btn").first().hover();
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${dossier}/1440-survol.png` });
  await parcourir(page, 390, 844, "390");
});
