import { expect, test, type Page } from "@playwright/test";
import { aller, autrePoste, connecter, creerClasse, creerCompte, supprimerCompte, type Compte } from "./outils";

let compte: Compte;
test.beforeEach(async ({ page }) => {
  compte = await creerCompte();
  await connecter(page, compte);
  await expect(page).toHaveURL(/\/projets$/);
});
test.afterEach(async () => {
  await supprimerCompte(compte);
});

type Reponses = { qui: "Ma classe" | "Moi"; recit: "À choix" | "Classique"; titre: string; classe?: string };

async function repondre(page: Page, r: Reponses, creer = true): Promise<void> {
  await aller(page, "/projets/nouveau");
  await expect(page.getByRole("heading", { level: 2, name: "Qui écrit ?" })).toBeVisible();
  await page.getByRole("radio", { name: new RegExp(`^${r.qui}`) }).check({ force: true });
  await page.getByRole("button", { name: "Continuer" }).click();
  await expect(page.getByRole("heading", { level: 2, name: "Quel récit ?" })).toBeVisible();
  await page.getByRole("radio", { name: new RegExp(`^${r.recit}`) }).check({ force: true });
  await page.getByRole("button", { name: "Continuer" }).click();
  await expect(page.getByRole("heading", { level: 2, name: "Quel titre ?" })).toBeVisible();
  await page.getByLabel("Titre du projet").fill(r.titre);
  if (r.classe) await page.getByRole("radio", { name: new RegExp(`^${r.classe}`) }).check({ force: true });
  if (creer) {
    await page.getByRole("button", { name: "Créer le projet" }).click();
    await page.waitForURL(/\/projet\/[0-9a-f-]{36}\/preparation/);
  }
}

test("F01-AC14 — une enseignante sans projet ni classe crée un projet de classe à choix, sans classe", async ({ page }) => {
  await page.getByRole("link", { name: "Créer mon premier projet" }).click();
  await expect(page).toHaveURL(/\/projets\/nouveau$/);
  await repondre(page, { qui: "Ma classe", recit: "À choix", titre: "Les passeurs de brume" });

  await expect(page.getByRole("heading", { level: 1, name: "Les passeurs de brume" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Préparation", exact: true })).toHaveAttribute("aria-current", "page");
  await expect(page.getByText(/Sans classe/)).toBeVisible();
  await expect(page.getByText("Récit à choix")).toBeVisible();
  // La barre du haut porte son titre
  await expect(page.getByRole("navigation", { name: "Espace adulte" }).getByRole("link", { name: "Les passeurs de brume" })).toBeVisible();
});

test("F01-AC15 — les deux choix sont annoncés comme définitifs, et « Retour » permet encore de les changer", async ({ page }) => {
  await aller(page, "/projets/nouveau");
  await expect(page.getByText(/Ce choix ne se change pas ensuite\./)).toBeVisible();
  await repondre(page, { qui: "Ma classe", recit: "À choix", titre: "Les passeurs de brume" }, false);
  const rappel = page.locator("p", { hasText: "ne se changent pas ensuite" });
  await expect(rappel).toContainText("Projet de classe");
  await expect(rappel).toContainText("Récit à choix");
  await expect(rappel).toContainText("Le titre et la classe, si.");

  await page.getByRole("button", { name: "Retour" }).click();
  await page.getByRole("radio", { name: /^Classique/ }).check({ force: true });
  await page.getByRole("button", { name: "Continuer" }).click();
  await expect(page.locator("p", { hasText: "ne se changent pas ensuite" })).toContainText("Récit classique");
  // Le titre saisi n'est pas perdu
  await expect(page.getByLabel("Titre du projet")).toHaveValue("Les passeurs de brume");
});

test("F01-AC16 — pour un projet personnel, aucune classe n'est demandée", async ({ page }) => {
  await creerClasse(page, "CM1-CM2");
  await repondre(page, { qui: "Moi", recit: "Classique", titre: "Carnet de voyage" }, false);
  await expect(page.getByRole("group", { name: "Classe" })).toHaveCount(0);
  await expect(page.getByText("Choisir plus tard")).toHaveCount(0);
  await expect(page.locator("p", { hasText: "ne se changent pas ensuite" })).toContainText("Projet personnel");
  await page.getByRole("button", { name: "Créer le projet" }).click();
  await page.waitForURL(/\/projet\/[0-9a-f-]{36}\/preparation/);
  await expect(page.getByText(/Projet personnel · Récit classique/)).toBeVisible();
  // Le mode personnel n'a pas d'onglet Suivi
  await expect(page.getByRole("navigation", { name: "Sections du projet" }).getByRole("link")).toHaveText(["Préparation", "Parties et chapitres", "Livre"]);
});

test("F01-AC17 — quitter avant « Créer le projet » ne crée rien", async ({ page }) => {
  await repondre(page, { qui: "Ma classe", recit: "À choix", titre: "Jamais créé" }, false);
  await page.getByRole("link", { name: "Retour à Mes projets" }).click();
  await expect(page).toHaveURL(/\/projets$/);
  await expect(page.getByText("Jamais créé")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Votre premier livre commence ici" })).toBeVisible();
});

test("F01 — un projet ne se crée pas sans titre", async ({ page }) => {
  await repondre(page, { qui: "Moi", recit: "À choix", titre: "   " }, false);
  await expect(page.getByRole("button", { name: "Créer le projet" })).toBeDisabled();
});

test("F01-AC02 — les quatre combinaisons se créent et se retrouvent dans « Mes projets »", async ({ page }) => {
  await repondre(page, { qui: "Moi", recit: "Classique", titre: "Personnel classique" });
  await repondre(page, { qui: "Moi", recit: "À choix", titre: "Personnel à choix" });
  await repondre(page, { qui: "Ma classe", recit: "Classique", titre: "Classe classique" });
  await repondre(page, { qui: "Ma classe", recit: "À choix", titre: "Classe à choix" });
  await aller(page, "/projets");
  const cartes = page.getByRole("listitem");
  await expect(cartes.filter({ hasText: "Personnel classique" })).toContainText("Projet personnel · Récit classique");
  await expect(cartes.filter({ hasText: "Personnel à choix" })).toContainText("Projet personnel · Récit à choix");
  await expect(cartes.filter({ hasText: "Classe classique" })).toContainText("Sans classe · Récit classique");
  await expect(cartes.filter({ hasText: "Classe à choix" })).toContainText("Sans classe · Récit à choix");
  // Le dernier projet ouvert porte « Continuer », les autres « Ouvrir »
  await expect(cartes.filter({ hasText: "Classe à choix" }).getByRole("link", { name: /^Continuer/ })).toBeVisible();
  await expect(cartes.filter({ hasText: "Personnel classique" }).getByRole("link", { name: /^Ouvrir/ })).toBeVisible();
});

test("F01-AC08, F01-AC24 — la classe se choisit après la préparation, puis se change pour une autre classe en cours", async ({ page }) => {
  await repondre(page, { qui: "Ma classe", recit: "À choix", titre: "Préparé cet été" });
  const projet = page.url();
  await creerClasse(page, "CM1-CM2");
  await creerClasse(page, "CE2");

  await aller(page, projet);
  await page.getByRole("button", { name: "Choisir une classe" }).click();
  await page.getByRole("radio", { name: /^CM1-CM2/ }).check();
  await page.getByRole("button", { name: "Choisir cette classe" }).click();
  await expect(page.getByText(/Classe CM1-CM2 · aucun élève inscrit/)).toBeVisible();
  await expect(page.getByText(/Les élèves commencent quand vous leur attribuez un chapitre/)).toBeVisible();
  await expect(page.getByRole("heading", { level: 1, name: "Préparé cet été" })).toBeVisible();

  await page.getByRole("button", { name: "Changer de classe" }).click();
  await page.getByRole("radio", { name: /^CE2/ }).check();
  await page.getByRole("button", { name: "Choisir cette classe" }).click();
  await expect(page.getByText(/Classe CE2 · aucun élève inscrit/)).toBeVisible();
});

test("F01 — à la création, la classe en cours est proposée, avec « Choisir plus tard »", async ({ page }) => {
  await creerClasse(page, "CM1-CM2");
  await repondre(page, { qui: "Ma classe", recit: "À choix", titre: "Les passeurs de brume" }, false);
  await expect(page.getByRole("radio", { name: /^CM1-CM2/ })).toBeChecked();
  await expect(page.getByRole("radio", { name: /^Choisir plus tard/ })).toBeVisible();
  await page.getByRole("button", { name: "Créer le projet" }).click();
  await page.waitForURL(/\/projet\/[0-9a-f-]{36}\/preparation/);
  await expect(page.getByText(/Classe CM1-CM2/)).toBeVisible();
});

test("F06-AC53 — reprendre sans choisir : le dernier projet, à son dernier onglet, depuis un autre ordinateur", async ({ page, browser }) => {
  await repondre(page, { qui: "Ma classe", recit: "À choix", titre: "La cabane du bout du monde" });
  await repondre(page, { qui: "Ma classe", recit: "À choix", titre: "Les passeurs de brume" });
  await page.getByRole("navigation", { name: "Sections du projet" }).getByRole("link", { name: "Suivi" }).click();
  await expect(page).toHaveURL(/\/suivi$/);
  await expect(page.getByRole("link", { name: "Suivi", exact: true })).toHaveAttribute("aria-current", "page");
  // L'onglet se note une fois la page affichée
  await page.waitForLoadState("networkidle");
  const suivi = new URL(page.url()).pathname;

  // Le lendemain, depuis un autre ordinateur : la mémoire tient au compte, non au navigateur
  const ailleurs = await autrePoste(browser);
  await connecter(ailleurs.page, compte);
  await expect(ailleurs.page).toHaveURL(new RegExp(`${suivi}$`));
  await expect(ailleurs.page.getByRole("heading", { level: 1, name: "Les passeurs de brume" })).toBeVisible();

  // Depuis « Mes projets », le nom du projet dans la barre du haut y ramène
  await ailleurs.page.getByRole("link", { name: "Mes projets" }).click();
  await expect(ailleurs.page).toHaveURL(/\/projets$/);
  await ailleurs.page.getByRole("navigation", { name: "Espace adulte" }).getByRole("link", { name: "Les passeurs de brume" }).click();
  await expect(ailleurs.page).toHaveURL(new RegExp(`${suivi}$`));

  // Ouvrir l'autre projet le fait devenir le dernier ouvert, et la barre porte son nom
  await ailleurs.page.getByRole("link", { name: "Mes projets" }).click();
  await ailleurs.page.getByRole("link", { name: "Ouvrir La cabane du bout du monde" }).click();
  await expect(ailleurs.page).toHaveURL(/\/preparation$/);
  await expect(ailleurs.page.getByRole("navigation", { name: "Espace adulte" }).getByRole("link", { name: "La cabane du bout du monde" })).toBeVisible();
  await ailleurs.page.waitForLoadState("networkidle");
  await ailleurs.contexte.close();

  // Avoir seulement vu la carte d'un projet dans « Mes projets » ne le fait pas devenir le dernier ouvert
  await page.getByRole("link", { name: "Mes projets" }).click();
  await expect(page.getByRole("link", { name: "Continuer La cabane du bout du monde" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Ouvrir Les passeurs de brume" })).toBeVisible();
  await page.waitForLoadState("networkidle");
  await page.reload();
  await expect(page.getByRole("link", { name: "Continuer La cabane du bout du monde" })).toBeVisible();

  // Un projet qui n'est pas à soi n'existe pas
  const intrus = await creerCompte();
  const autre = await autrePoste(browser);
  await connecter(autre.page, intrus);
  await expect(autre.page).toHaveURL(/\/projets$/);
  const reponse = await autre.page.goto(suivi);
  expect(reponse?.status()).toBe(404);
  await autre.contexte.close();
  await supprimerCompte(intrus);
});
