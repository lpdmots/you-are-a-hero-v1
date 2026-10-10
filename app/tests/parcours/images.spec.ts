import { resolve } from "node:path";
import { expect, test, type Page } from "@playwright/test";
import { adultePret, aller, autrePoste, semerPartie, semerProjet, supprimerComptes } from "./outils";

test.afterEach(async () => {
  await supprimerComptes();
});

const PHOTO = resolve(__dirname, "../../public/illustrations/defaut-desert.jpg");
const image = (page: Page, dans: string) => page.locator(`${dans} img`).first();
const importer = (page: Page, fichier: string | { name: string; mimeType: string; buffer: Buffer }) => page.getByLabel("Fichier de l’image").setInputFiles(fichier);

async function projetEtPlan(page: Page) {
  const { compte, base } = await adultePret(page);
  const projet = await semerProjet(base, compte, "classe", "choix", "Les passeurs de brume");
  const foret = await semerPartie(base, projet, "La forêt", [{ titre: "La lisière", scenes: ["L’entrée du bois"] }, { titre: "Le sanctuaire" }]);
  return { compte, base, projet, foret };
}
const ouvrirReglages = async (page: Page, sorte: "chapitre" | "partie", titre: string) => {
  await page.getByLabel(`Autres commandes ${sorte === "chapitre" ? "du chapitre" : "de la partie"} ${titre}`).click();
  await page.getByRole("button", { name: "Réglages" }).click();
  await page.getByRole("complementary").getByRole("button", { name: "Choisir une image" }).click();
  await expect(page.getByRole("heading", { name: "Choisir une image" })).toBeVisible();
};
const fermer = (page: Page) => page.getByRole("button", { name: "Fermer", exact: true }).last().click();

test("F10-AC21 — à la création, la carte montre le titre sur un visuel par défaut ; créé sans y toucher, le projet garde cette carte", async ({ page }) => {
  await adultePret(page);
  await aller(page, "/projets/nouveau");
  await page.getByRole("radio", { name: /^Moi/ }).check({ force: true });
  await page.getByRole("button", { name: "Continuer" }).click();
  await page.getByRole("radio", { name: /^À choix/ }).check({ force: true });
  await page.getByRole("button", { name: "Continuer" }).click();

  const carte = page.getByRole("complementary", { name: "La carte du projet" });
  await expect(carte).toContainText("Le titre de votre histoire");
  await page.getByLabel("Titre du projet").fill("Les passeurs de brume");
  await expect(carte).toContainText("Les passeurs de brume");
  const visuel = await carte.locator("img").getAttribute("src");
  expect(visuel).toMatch(/^\/illustrations\/defaut-[a-z]+\.jpg$/);
  // Le choix reste facultatif : toujours trois questions, et « Créer le projet » sans y toucher
  await expect(carte.getByRole("button", { name: "Choisir une image" })).toBeVisible();
  await page.getByRole("button", { name: "Créer le projet" }).click();
  await page.waitForURL(/\/projet\/[0-9a-f-]{36}\/preparation/);
  await expect(page.locator("main section img").first()).toHaveAttribute("src", visuel!);
  await aller(page, "/projets");
  await expect(page.locator("main li img").first()).toHaveAttribute("src", visuel!);
});

test("F10-AC21 — une image importée pendant la création est celle que porte la carte du projet", async ({ page }) => {
  await adultePret(page);
  await aller(page, "/projets/nouveau");
  await page.getByRole("radio", { name: /^Moi/ }).check({ force: true });
  await page.getByRole("button", { name: "Continuer" }).click();
  await page.getByRole("radio", { name: /^Classique/ }).check({ force: true });
  await page.getByRole("button", { name: "Continuer" }).click();
  await page.getByLabel("Titre du projet").fill("Carnet de voyage");
  const carte = page.getByRole("complementary", { name: "La carte du projet" });
  await carte.getByRole("button", { name: "Choisir une image" }).click();
  // À la création, il n'y a pas encore d'« Images du projet » : importer, ou un visuel proposé
  await expect(page.getByRole("heading", { name: "Images du projet" })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Visuels proposés" })).toBeVisible();
  await importer(page, PHOTO);
  await expect(carte.locator("img")).toHaveAttribute("src", /^blob:/);

  await page.getByRole("button", { name: "Créer le projet" }).click();
  await page.waitForURL(/\/projet\/[0-9a-f-]{36}\/preparation/);
  const entete = page.locator("main section img").first();
  await expect(entete).toHaveAttribute("src", /^\/images\/[0-9a-f-]{36}\?v=1$/);
  const reponse = await page.request.get((await entete.getAttribute("src"))!);
  expect(reponse.status()).toBe(200);
  expect(reponse.headers()["content-type"]).toBe("image/jpeg");
  await aller(page, "/projets");
  await expect(page.locator("main li img").first()).toHaveAttribute("src", /^\/images\/[0-9a-f-]{36}\?v=1$/);
});

test("F10-AC03, F10-AC04, F10-AC23 — sans image, un visuel par défaut ; un visuel proposé se choisit, tient d'une visite à l'autre, et se retire", async ({ page }) => {
  const { projet } = await projetEtPlan(page);
  await aller(page, `/projet/${projet}/plan`);
  const carte = "li:has(a[aria-label='Ouvrir La lisière'])";
  const defaut = await image(page, carte).getAttribute("src");
  expect(defaut).toMatch(/^\/illustrations\/defaut-[a-z]+\.jpg$/);

  await ouvrirReglages(page, "chapitre", "La lisière");
  await page.getByRole("button", { name: "Désert", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Réglages du chapitre" })).toBeVisible();
  await fermer(page);
  await expect(image(page, carte)).toHaveAttribute("src", "/illustrations/defaut-desert.jpg");
  await page.reload();
  await expect(image(page, carte)).toHaveAttribute("src", "/illustrations/defaut-desert.jpg");
  // Le repère est le même dans la page du chapitre
  await page.getByRole("link", { name: "Ouvrir La lisière", exact: true }).click();
  await expect(page.locator(".chap-bandeau__image img")).toHaveAttribute("src", "/illustrations/defaut-desert.jpg");

  await page.getByRole("link", { name: "Parties et chapitres" }).click();
  await ouvrirReglages(page, "chapitre", "La lisière");
  await expect(page.getByRole("button", { name: "Désert", exact: true })).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Revenir au visuel par défaut" }).click();
  await fermer(page);
  await expect(image(page, carte)).toHaveAttribute("src", defaut!);
});

test("F10-AC05, F10-AC25 — une image importée se réutilise sans nouvel import, et chaque usage reste séparé", async ({ page }) => {
  const { base, projet } = await projetEtPlan(page);
  await aller(page, `/projet/${projet}/plan`);
  const partie = ".partie__vignette";
  const chapitre = "li:has(a[aria-label='Ouvrir La lisière'])";

  await ouvrirReglages(page, "partie", "La forêt");
  await importer(page, PHOTO);
  await expect(page.getByRole("heading", { name: "Réglages de la partie" })).toBeVisible();
  await fermer(page);
  await expect(image(page, partie)).toHaveAttribute("src", /^\/images\//);
  const importee = (await image(page, partie).getAttribute("src"))!;

  // Pour le chapitre, la même image est proposée parmi les « Images du projet » : pas de second import
  await ouvrirReglages(page, "chapitre", "La lisière");
  await expect(page.getByRole("heading", { name: "Images du projet" })).toBeVisible();
  await page.getByRole("button", { name: "Image 1 du projet" }).click();
  await expect(page.getByRole("heading", { name: "Réglages du chapitre" })).toBeVisible();
  await fermer(page);
  await expect(image(page, chapitre)).toHaveAttribute("src", importee);
  expect((await base.from("images").select("id").eq("projet_id", projet)).data).toHaveLength(1);
  // Choisir un repère n'ajoute rien au texte des scènes ni au livre : seule la carte change
  expect((await base.from("scenes").select("titre, consigne").eq("projet_id", projet)).data).toEqual([{ titre: "L’entrée du bois", consigne: "" }]);

  // Remplacer celle du chapitre ne change pas celle de la partie
  await ouvrirReglages(page, "chapitre", "La lisière");
  await page.getByRole("button", { name: "Mer", exact: true }).click();
  await fermer(page);
  await expect(image(page, chapitre)).toHaveAttribute("src", "/illustrations/defaut-mer.jpg");
  await expect(image(page, partie)).toHaveAttribute("src", importee);
});

test("F10-AC24 — un autre format, un fichier trop lourd ou qui n'est pas une image sont refusés, et l'image en place reste", async ({ page }) => {
  const { base, projet } = await projetEtPlan(page);
  await aller(page, `/projet/${projet}/plan`);
  const chapitre = "li:has(a[aria-label='Ouvrir La lisière'])";
  const avant = await image(page, chapitre).getAttribute("src");
  await ouvrirReglages(page, "chapitre", "La lisière");
  const refus = page.getByRole("alert").filter({ hasText: "Cette image n’a pas pu être importée. Choisissez un fichier JPEG, PNG ou WebP de moins de 20 Mo." });

  await importer(page, { name: "photo.heic", mimeType: "image/heic", buffer: Buffer.from("ftypheic") });
  await expect(refus).toBeVisible();
  await importer(page, { name: "enorme.jpg", mimeType: "image/jpeg", buffer: Buffer.alloc(21 * 1024 * 1024) });
  await expect(refus).toBeVisible();
  await importer(page, { name: "faux.jpg", mimeType: "image/jpeg", buffer: Buffer.from("<svg onload='alert(1)'/>") });
  await expect(refus).toBeVisible();

  await fermer(page);
  await fermer(page);
  await expect(image(page, chapitre)).toHaveAttribute("src", avant!);
  expect((await base.from("images").select("id").eq("projet_id", projet)).data).toEqual([]);
});

test("F10-AC26 — le visuel par défaut d'une partie et de ses chapitres ne se répète pas tant que la bibliothèque le permet", async ({ page }) => {
  const { compte, base } = await adultePret(page);
  const projet = await semerProjet(base, compte, "personnel", "choix", "Mon histoire");
  await aller(page, `/projet/${projet}/plan`);
  await page.getByRole("button", { name: "Ajouter une partie" }).first().click();
  await fermer(page);
  await page.getByRole("button", { name: "Ajouter un chapitre" }).click();
  await fermer(page);
  await expect(page.locator(".cahier")).toHaveCount(2);
  const lus = async () => [await page.locator(".partie__vignette img").getAttribute("src"), ...(await page.locator(".cahier__vignette img").evaluateAll((l) => l.map((i) => i.getAttribute("src"))))];
  const visuels = await lus();
  expect(new Set(visuels).size).toBe(3);
  await page.reload();
  expect(await lus()).toEqual(visuels);
});

test("une image ne se lit pas sans compte ni poste, ni par l'enseignant d'un autre compte", async ({ page, browser }) => {
  const { projet } = await projetEtPlan(page);
  await aller(page, `/projet/${projet}/plan`);
  await ouvrirReglages(page, "partie", "La forêt");
  await importer(page, PHOTO);
  await expect(page.getByRole("heading", { name: "Réglages de la partie" })).toBeVisible();
  // L'image importée, et non le visuel par défaut qu'elle remplace
  await expect(page.locator(".reg-image__vue img")).toHaveAttribute("src", /^\/images\/[0-9a-f-]{36}\?v=1$/);
  const adresse = (await page.locator(".reg-image__vue img").getAttribute("src"))!;
  expect((await page.request.get(adresse)).status()).toBe(200);

  const inconnu = await autrePoste(browser);
  expect((await inconnu.page.request.get(adresse)).status()).toBe(404);
  expect((await inconnu.page.request.get(adresse.replace("?v=1", ""))).status()).toBe(404);
  await adultePret(inconnu.page);
  expect((await inconnu.page.request.get(adresse)).status()).toBe(404);
  await inconnu.contexte.close();
});
