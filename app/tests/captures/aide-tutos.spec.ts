import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { expect, test, type Page } from "@playwright/test";
import { adultePret, aller, semerClasse, semerPartie, semerProjet, supprimerComptes } from "../parcours/outils";

/**
 * Les écrans de l'application qui montrent un tuto (F14-AC65, AC66), capturés pour les juger :
 * npx playwright test --config playwright.local.config.ts aide-tutos (serveur 4840 lancé).
 * Ce n'est pas un test : un compte d'essai, supprimé à la fin, et ses écrans d'aide rouverts.
 * Les images vont dans test-results/aide-tutos/ (ou CAPTURES=<dossier>).
 */
const dossier = process.env.CAPTURES ?? resolve(__dirname, "../../test-results/aide-tutos");

test.use({ viewport: { width: 1280, height: 860 }, deviceScaleFactor: 2 });
test.afterAll(async () => {
  await supprimerComptes();
});

async function capturer(page: Page, nom: string, cible = page.locator(".aide-etape").first()): Promise<void> {
  await page.mouse.move(1279, 859);
  await page.evaluate(() => document.querySelectorAll("nextjs-portal").forEach((e) => e.remove()));
  await page.waitForTimeout(500);
  await cible.screenshot({ path: `${dossier}/${nom}.png` });
}

/** L'écran d'aide de la page : ouvert de lui-même à la première visite, sinon par « Aide » */
async function aide(page: Page, adresse: string, nom: string): Promise<string[]> {
  await aller(page, adresse);
  const ecran = page.locator(".aide-etape");
  if (!(await ecran.isVisible().catch(() => false))) await page.getByRole("button", { name: /^Aide$/ }).first().click();
  await expect(ecran).toBeVisible();
  await capturer(page, nom);
  return ecran.locator("ul li button b").allTextContents();
}

test("écrans d'aide et leurs tutos", async ({ page }) => {
  test.setTimeout(180_000);
  mkdirSync(dossier, { recursive: true });
  const { compte, base } = await adultePret(page);
  // Les écrans d'aide de nouveau affichés : adultePret les masque
  await base.from("enseignants").update({ aides_masquees: [] }).eq("id", compte.id);

  // « Mes projets » vide : le lien sous « Créer mon premier projet »
  await aller(page, "/projets");
  await expect(page.getByRole("button", { name: /Voir le tuto/ })).toBeVisible();
  await capturer(page, "01-projets-vide", page.locator("section").first());

  const classe = await semerClasse(base, "CM2 des Tilleuls", ["Inès", "Mathis", "Léna"]);
  const projet = await semerProjet(base, compte, "classe", "choix", "Le secret de la forêt bleue", classe.id);
  await semerPartie(base, projet, "La forêt", [{ titre: "L’entrée du bois", scenes: ["La clairière"] }]);

  const vus: Record<string, string[]> = {};
  vus.classes = await aide(page, "/classes", "02-classes");
  vus.preparation = await aide(page, `/projet/${projet}/preparation`, "03-preparation");
  vus.plan = await aide(page, `/projet/${projet}/plan`, "04-plan");
  vus.suivi = await aide(page, `/projet/${projet}/suivi`, "05-suivi");
  vus.relire = await aide(page, `/projet/${projet}/livre?etape=relire`, "06-livre-relire");
  vus.chemins = await aide(page, `/projet/${projet}/livre?etape=chemins`, "07-livre-chemins");

  // Une vignette ouvre la fenêtre du tuto, « Fermer » la referme
  await page.locator(".aide-etape ul li button").first().click();
  const fenetre = page.locator("dialog[open]");
  await expect(fenetre).toBeVisible();
  vus.fenetre = [await fenetre.locator("video source").getAttribute("src") ?? ""];
  await fenetre.getByRole("button", { name: "Fermer" }).click();
  await expect(fenetre).toHaveCount(0);

  // « Mettre en page » et « Imprimer et partager » ouverts en base : le bouton « Tuto » de la ligne du titre
  const maintenant = new Date().toISOString();
  await base.from("projets").update({ livre_relu_le: maintenant, chemins_verifies_le: maintenant, mise_en_page_ouverte_le: maintenant, derniere_etape_livre: "page" }).eq("id", projet);
  for (const [etape, nom] of [["page", "08-livre-page"], ["sortie", "09-livre-sortie"]] as const) {
    if (etape === "sortie") await base.from("projets").update({ mise_en_page_convient_le: maintenant, imprimer_ouvert_le: maintenant }).eq("id", projet);
    await aller(page, `/projet/${projet}/livre?etape=${etape}`);
    const bouton = page.getByRole("button", { name: /^Tuto$/ });
    vus[etape] = [String(await bouton.count())];
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.mouse.move(1279, 859);
    await page.evaluate(() => document.querySelectorAll("nextjs-portal").forEach((e) => e.remove()));
    await page.screenshot({ path: `${dossier}/${nom}.png`, clip: { x: 0, y: 0, width: 1280, height: 220 } });
  }
  console.log(JSON.stringify(vus, null, 1));
});
