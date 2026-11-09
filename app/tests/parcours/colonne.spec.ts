import { expect, test, type Page } from "@playwright/test";
import {
  adultePret, aller, COLONNE, reglagesDuProjet, semerClasse, semerPartie, semerProjet, service, supprimerComptes,
} from "./outils";

// La colonne de navigation de l'adulte (F06.5, révisé le 8 novembre 2026)

test.afterEach(async () => {
  await supprimerComptes();
});

const SECTIONS = (page: Page) => page.getByRole("navigation", { name: "Sections du projet" });

/** « Les passeurs de brume », projet de la classe CM1-CM2 : « La lisière » (S001, S002) dans « La forêt ». */
async function passeurs(page: Page) {
  const { compte, base } = await adultePret(page);
  const classe = await semerClasse(base, "CM1-CM2", ["Alice", "Bilal"]);
  const projet = await semerProjet(base, compte, "classe", "choix", "Les passeurs de brume", classe.id);
  const foret = await semerPartie(base, projet, "La forêt", [{ titre: "La lisière", scenes: ["Le sentier", "Le pont"] }]);
  return { compte, base, classe, projet, lisiere: foret.chapitres[0] };
}

test("F06-AC98 — la colonne porte le projet, sa classe, ses onglets et le reste de l'espace ; rien au-dessus de la page", async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 768 });
  const { projet } = await passeurs(page);
  await aller(page, `/projet/${projet}/suivi`);

  const colonne = COLONNE(page);
  await expect(colonne.getByRole("link", { name: "Les passeurs de brume" })).toBeVisible();
  await expect(colonne.getByRole("link", { name: "CM1-CM2" })).toBeVisible();
  await expect(SECTIONS(page).getByRole("link")).toHaveText(["Préparation", "Parties et chapitres", "Suivi", "Livre"]);
  await expect(SECTIONS(page).getByRole("link", { name: "Suivi" })).toHaveAttribute("aria-current", "page");
  await expect(colonne.getByRole("link", { name: "Lire à l’essai" })).toBeVisible();
  await expect(colonne.getByRole("link", { name: "Réglages du projet" })).toBeVisible();
  await expect(colonne.getByRole("link", { name: "Mes projets" })).toBeVisible();
  await expect(colonne.getByRole("link", { name: "Mes classes" })).toBeVisible();
  await expect(page.getByLabel(/^Votre compte : /)).toBeVisible();

  // La page commence en haut de l'écran : son titre, puis « Aide » à sa droite
  await expect(page.getByRole("banner")).toBeHidden();
  const titre = page.getByRole("heading", { level: 1, name: "Suivi" });
  await expect(titre).toBeVisible();
  expect((await titre.boundingBox())!.y).toBeLessThan(60);
  await expect(page.locator("#tete-de-page").getByRole("button", { name: "Aide" })).toBeVisible();
});

test("F06-AC99 — l'onglet d'où l'on vient reste désigné dans la scène et le chapitre", async ({ page }) => {
  const { projet, lisiere } = await passeurs(page);

  // Depuis le Suivi, une scène : « Suivi » reste désigné
  await aller(page, `/projet/${projet}/suivi`);
  await page.getByRole("link", { name: /Ouvrir S001/ }).first().click();
  await page.waitForURL(/\/scene\//);
  await expect(SECTIONS(page).getByRole("link", { name: "Suivi" })).toHaveAttribute("aria-current", "page");
  await expect(page.getByRole("link", { name: "Retour au Suivi" })).toBeVisible();

  // Depuis « Parties et chapitres », le chapitre puis une scène : « Parties et chapitres »
  await aller(page, `/projet/${projet}/chapitre/${lisiere.id}`);
  await expect(SECTIONS(page).getByRole("link", { name: "Parties et chapitres" })).toHaveAttribute("aria-current", "page");
  await expect(page.getByRole("link", { name: "Retour à Parties et chapitres" })).toBeVisible();
  await page.getByRole("link", { name: /Ouvrir S002/ }).click();
  await page.waitForURL(/\/scene\//);
  await expect(SECTIONS(page).getByRole("link", { name: "Parties et chapitres" })).toHaveAttribute("aria-current", "page");
  await expect(page.getByRole("link", { name: "Retour à La lisière" })).toBeVisible();

  // Un clic sur « Livre » ouvre l'onglet Livre
  await SECTIONS(page).getByRole("link", { name: "Livre" }).click();
  await expect(page).toHaveURL(new RegExp(`/projet/${projet}/livre$`));
  await expect(page.getByRole("heading", { level: 1, name: "Livre" })).toBeVisible();
});

test("F06-AC100 — « Suivi » porte le nombre de scènes à valider, depuis tout le projet ; rien à zéro", async ({ page }) => {
  const { projet, lisiere } = await passeurs(page);
  await service().from("scenes").update({ etat: "valider" }).eq("id", lisiere.scenes[0]);

  await aller(page, `/projet/${projet}/preparation`);
  const suivi = SECTIONS(page).getByRole("link", { name: /^Suivi/ });
  await expect(suivi).toContainText("1");
  await expect(suivi).toHaveAccessibleName(/Suivi\s*1 à valider/);

  // La scène validée depuis son tampon : le chiffre disparaît
  await aller(page, `/projet/${projet}/scene/${lisiere.scenes[0]}?de=suivi`);
  await expect(suivi).toContainText("1");
  await page.getByLabel(/^État de S001 : À valider/).click();
  await page.locator(".etat__choix", { hasText: "Validé" }).click();
  await expect(suivi).not.toContainText("1");
  await expect(suivi).toHaveAccessibleName("Suivi");
});

test("F06-AC101 — replier la colonne : les icônes seules, gardées sur cet ordinateur jusqu'à « Déplier »", async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 768 });
  const { projet } = await passeurs(page);
  await aller(page, `/projet/${projet}/suivi`);
  const titre = page.getByRole("heading", { level: 1, name: "Suivi" });
  const avant = (await titre.boundingBox())!.x;

  await page.getByRole("button", { name: "Replier la colonne" }).click();
  await expect(SECTIONS(page).getByRole("link", { name: "Suivi" })).toHaveAttribute("title", "Suivi");
  await expect.poll(async () => (await titre.boundingBox())!.x).toBeLessThan(avant - 100);

  // Le lendemain, sur le même ordinateur : toujours repliée
  await page.reload();
  await expect(page.getByRole("button", { name: "Déplier la colonne" })).toBeVisible();
  expect((await titre.boundingBox())!.x).toBeLessThan(avant - 100);
  await page.getByRole("button", { name: "Déplier la colonne" }).click();
  await expect(page.getByRole("button", { name: "Replier la colonne" })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("button", { name: "Replier la colonne" })).toBeVisible();
});

test("F06-AC102 — la classe s'ouvre depuis le projet, le projet depuis la classe ; « Changer de classe » dans les réglages", async ({ page }) => {
  const { projet, classe } = await passeurs(page);
  await aller(page, `/projet/${projet}/plan`);
  await COLONNE(page).getByRole("link", { name: "CM1-CM2" }).click();
  await expect(page).toHaveURL(new RegExp(`/classes/${classe.id}$`));
  await expect(page.getByRole("heading", { level: 1, name: "CM1-CM2" })).toBeVisible();

  await page.getByRole("region", { name: "Projets de la classe" }).getByRole("link", { name: "Les passeurs de brume" }).click();
  await expect(page).toHaveURL(new RegExp(`/projet/${projet}/`));

  await aller(page, "/classes");
  await page.getByRole("link", { name: "Les passeurs de brume" }).last().click();
  await expect(page).toHaveURL(new RegExp(`/projet/${projet}/`));

  const reglages = await reglagesDuProjet(page);
  await expect(reglages).toContainText("CM1-CM2 · 2 élèves");
  await expect(reglages.getByRole("button", { name: "Changer de classe" })).toBeVisible();
});

test("F06-AC103 — « Mes projets » rangé par dernière ouverture", async ({ page }) => {
  const { compte, base } = await adultePret(page);
  const passeursId = await semerProjet(base, compte, "personnel", "choix", "Les passeurs de brume");
  await semerProjet(base, compte, "personnel", "choix", "Le bidibule ridicule");
  // Ouvert ce matin, le plus ancien passe devant le plus récent
  await aller(page, `/projet/${passeursId}/preparation`);
  await page.waitForLoadState("networkidle");
  await aller(page, "/projets");
  const titres = page.locator("main li b");
  await expect(titres.first()).toHaveText("Les passeurs de brume");
  await expect(page.getByRole("link", { name: "Continuer Les passeurs de brume" })).toBeVisible();
});

test("F06-AC104 — écran étroit : une barre mince et la colonne en tiroir", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const { projet } = await passeurs(page);
  await aller(page, `/projet/${projet}/suivi`);
  const barre = page.getByRole("banner");
  await expect(barre).toBeVisible();
  await expect(barre).toContainText("Les passeurs de brume");
  await expect(COLONNE(page)).toBeHidden();

  await barre.getByRole("button", { name: "Menu" }).click();
  await expect(COLONNE(page)).toBeVisible();
  // Un choix referme le tiroir
  await SECTIONS(page).getByRole("link", { name: "Parties et chapitres" }).click();
  await expect(page).toHaveURL(new RegExp(`/projet/${projet}/plan$`));
  await expect(COLONNE(page)).toBeHidden();
  // « Échap » aussi
  await barre.getByRole("button", { name: "Menu" }).click();
  await expect(COLONNE(page)).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(COLONNE(page)).toBeHidden();
});
