import { expect, test } from "@playwright/test";
import { aller, connecter, creerClasse, creerCompte, nommer, ouvrirLaClasse, supprimerComptes, autrePoste, type Compte } from "./outils";

let compte: Compte;
test.beforeEach(async () => {
  compte = await creerCompte();
});
test.afterEach(async () => {
  await supprimerComptes();
});

test("F01-AC28 — aucun compte ne se crée depuis l'application, et l'espace adulte demande d'entrer", async ({ page }) => {
  await aller(page, "/entree");
  await expect(page.getByRole("heading", { level: 1, name: "Entrée enseignant" })).toBeVisible();
  await expect(page.getByText(/inscri|créer (un|mon|votre) compte|nouveau compte/i)).toHaveCount(0);

  for (const adresse of ["/projets", "/classes", "/projets/nouveau"]) {
    await page.goto(adresse);
    await expect(page).toHaveURL(/\/entree$/);
  }
});

test("F01-AC27 — entrée de l'enseignant : une phrase qui ne dit pas ce qui est faux, puis « Mes projets »", async ({ page }) => {
  await connecter(page, compte, "pas-le-bon-mot-de-passe");
  await expect(page.getByRole("alert").filter({ hasText: "L’adresse ou le mot de passe n’est pas le bon." })).toBeVisible();
  await expect(page).toHaveURL(/\/entree$/);

  await page.getByLabel("Adresse électronique").fill("inconnue@exemple.test");
  await page.getByLabel("Mot de passe").fill("pas-le-bon-mot-de-passe");
  await page.getByRole("button", { name: "Entrer" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "L’adresse ou le mot de passe n’est pas le bon." })).toBeVisible();

  await connecter(page, compte);
  await expect(page).toHaveURL(/\/projets$/);
  await expect(page.getByRole("heading", { name: "Votre premier livre commence ici" })).toBeVisible();

  // Une session ordinaire ne suffit pas à changer le mot de passe : il faut le lien reçu par courriel
  await page.goto("/entree/nouveau-mot-de-passe");
  await expect(page).toHaveURL(/\/projets$/);
});

test("F01-AC27 — au clavier : la touche Entrée envoie le formulaire ; après un refus, l'adresse reste écrite", async ({ page }) => {
  await aller(page, "/entree");
  await page.getByLabel("Adresse électronique").fill(compte.courriel);
  await page.getByLabel("Mot de passe").fill("pas-le-bon-mot-de-passe");
  await page.getByLabel("Adresse électronique").press("Enter");
  await expect(page.getByRole("alert").filter({ hasText: "L’adresse ou le mot de passe n’est pas le bon." })).toBeVisible();

  // Après un refus, l'adresse reste écrite : seul le mot de passe se retape
  await expect(page.getByLabel("Adresse électronique")).toHaveValue(compte.courriel);
  await expect(page.getByLabel("Mot de passe")).toHaveValue("");
  await page.getByLabel("Mot de passe").fill(compte.motDePasse);
  await page.getByLabel("Mot de passe").press("Enter");
  await expect(page).toHaveURL(/\/projets$/);
});

test("F01-AC29 — mot de passe oublié : même phrase pour toute adresse, puis un nouveau mot de passe par le lien reçu", async ({ page }) => {
  const phrase = "Si cette adresse a un compte, un courriel vient de partir. Ouvrez son lien sur cet ordinateur.";
  await aller(page, "/entree/oubli");
  await page.getByLabel("Adresse électronique").fill("personne@exemple.test");
  await page.getByRole("button", { name: "Recevoir le lien" }).click();
  await expect(page.getByText(phrase)).toBeVisible();

  await aller(page, "/entree");
  await page.getByRole("link", { name: "Mot de passe oublié" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Mot de passe oublié" })).toBeVisible();
  await page.getByLabel("Adresse électronique").fill(compte.courriel);
  await page.getByRole("button", { name: "Recevoir le lien" }).click();
  await expect(page.getByText(phrase)).toBeVisible();

  // Le courriel arrive dans la boîte locale de Supabase
  const courrier = process.env.COURRIER_LOCAL_URL!;
  let lien = "";
  await expect(async () => {
    const liste = await (await fetch(`${courrier}/api/v1/search?query=${encodeURIComponent(`to:${compte.courriel}`)}`)).json();
    const id = liste.messages?.[0]?.ID;
    expect(id).toBeTruthy();
    const message = await (await fetch(`${courrier}/api/v1/message/${id}`)).json();
    lien = (String(message.HTML ?? message.Text).match(/https?:\/\/[^\s"'<>]+\/auth\/v1\/verify[^\s"'<>]+/) ?? [""])[0].replace(/&amp;/g, "&");
    expect(lien).not.toBe("");
  }).toPass({ timeout: 15_000 });

  await page.goto(lien);
  await expect(page.getByRole("heading", { level: 1, name: "Nouveau mot de passe" })).toBeVisible();
  const nouveau = "un-nouveau-mot-de-passe-42";
  await page.locator('input[name="mot-de-passe"]').fill(nouveau);
  await page.getByRole("button", { name: "Enregistrer ce mot de passe" }).click();
  await expect(page).toHaveURL(/\/projets$/);

  // L'ancien est refusé, le nouveau accepté
  await page.getByRole("button", { name: new RegExp(compte.courriel.slice(0, 12)) }).click();
  await page.getByRole("button", { name: "Se déconnecter" }).click();
  await expect(page).toHaveURL(/\/entree$/);
  await connecter(page, compte);
  await expect(page.getByRole("alert").filter({ hasText: "n’est pas le bon" })).toBeVisible();
  await connecter(page, compte, nouveau);
  await expect(page).toHaveURL(/\/projets$/);
});

test("F01-AC31 — « Continuer avec Google » envoie chez Google par Supabase, et revient par l'application", async ({ page }) => {
  await aller(page, "/entree");
  const depart = page.waitForRequest((r) => r.url().includes("/auth/v1/authorize"));
  await page.getByRole("button", { name: "Continuer avec Google" }).click();
  const demande = new URL((await depart).url());
  expect(demande.searchParams.get("provider")).toBe("google");
  expect(demande.searchParams.get("redirect_to")).toBe("http://localhost:3100/entree/confirmer");
  // Le retour ne vaudra que sur ce navigateur, et Google demandera quel compte utiliser
  expect(demande.searchParams.get("code_challenge")).toBeTruthy();
  expect(demande.searchParams.get("prompt")).toBe("select_account");
});

test("F01-AC32 — un compte Google qui n'est celui d'aucun enseignant inscrit n'ouvre rien et ne crée rien", async ({ page }) => {
  // Ce que Supabase renvoie quand les inscriptions sont fermées et que l'adresse n'a pas de compte
  await aller(page, "/entree/confirmer?error=access_denied&error_code=signup_disabled&error_description=Signups+not+allowed+for+this+instance");
  await expect(page).toHaveURL(/\/entree\?refus=inconnu$/);
  await expect(page.getByRole("alert").filter({ hasText: "Aucun compte ne correspond à cette adresse Google." })).toBeVisible();
  await page.goto("/projets");
  await expect(page).toHaveURL(/\/entree$/);

  // Un retour sans code, ou avec un code fabriqué, n'ouvre rien non plus
  await aller(page, "/entree/confirmer");
  await expect(page.getByRole("alert").filter({ hasText: "La connexion n’a pas abouti. Réessayez." })).toBeVisible();
  await aller(page, "/entree/confirmer?code=un-code-fabrique");
  await expect(page.getByRole("alert").filter({ hasText: "La connexion n’a pas abouti. Réessayez." })).toBeVisible();
  await page.goto("/projets");
  await expect(page).toHaveURL(/\/entree$/);
});

test("F01-AC30, F01-AC13 — « Mon compte » : le nom affiché se lit à l'entrée des élèves ; « Se déconnecter » ferme l'accès", async ({ page, browser }) => {
  await connecter(page, compte);
  await expect(page).toHaveURL(/\/projets$/);
  const classe = await creerClasse(page, "CM1-CM2");

  // Sans nom affiché, l'élève lit « ton enseignant(e) »
  const poste = await autrePoste(browser);
  await ouvrirLaClasse(poste.page, classe.identifiant, classe.motDePasse);
  await expect(poste.page.getByText("Classe CM1-CM2", { exact: true })).toBeVisible();
  await expect(poste.page.getByText(/ton enseignant\(e\)/)).toBeVisible();

  await nommer(page, compte, "Mme Laurent");
  await poste.page.reload();
  await expect(poste.page.getByText("Classe CM1-CM2 de Mme Laurent")).toBeVisible();
  await poste.contexte.close();

  await page.getByRole("button", { name: "Mme Laurent" }).click();
  await page.getByRole("button", { name: "Se déconnecter" }).click();
  await expect(page).toHaveURL(/\/entree$/);
  await page.goto("/projets");
  await expect(page).toHaveURL(/\/entree$/);
});
