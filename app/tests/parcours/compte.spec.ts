import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { adresseDEssai, aller, connecter, courrielRecu, creerClasse, creerCompte, nommer, ouvrirLaClasse, retenirCompte, sql, supprimerComptes, autrePoste, type Compte } from "./outils";

let compte: Compte;
test.beforeEach(async () => {
  compte = await creerCompte();
});
test.afterEach(async () => {
  await supprimerComptes();
});

test("F01-AC28 — sans être entré, l'espace adulte ramène à l'entrée enseignant", async ({ page }) => {
  await aller(page, "/entree");
  await expect(page.getByRole("heading", { level: 1, name: "Entrée enseignant" })).toBeVisible();

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
  await page.locator('input[name="password"]').fill(nouveau);
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

test("F14-AC02, F01-AC32 révisé — un retour de Google refusé ou fabriqué n'ouvre rien", async ({ page }) => {
  await aller(page, "/entree/confirmer?error=access_denied&error_code=bad_oauth_state");
  await expect(page).toHaveURL(/\/entree\?refus=echec$/);
  await expect(page.getByRole("alert").filter({ hasText: "La connexion n’a pas abouti. Réessayez." })).toBeVisible();

  // Un retour sans code, ou avec un code fabriqué, n'ouvre rien non plus
  await aller(page, "/entree/confirmer");
  await expect(page.getByRole("alert").filter({ hasText: "La connexion n’a pas abouti. Réessayez." })).toBeVisible();
  await aller(page, "/entree/confirmer?code=un-code-fabrique");
  await expect(page.getByRole("alert").filter({ hasText: "La connexion n’a pas abouti. Réessayez." })).toBeVisible();
  await page.goto("/projets");
  await expect(page).toHaveURL(/\/entree$/);
});

test("F14-AC02 — « Continuer avec Google » est offert à l'inscription, et un compte né sans mot de passe arrive sur « Mes projets », vide", async ({ page }) => {
  await aller(page, "/entree/inscription");
  const depart = page.waitForRequest((r) => r.url().includes("/auth/v1/authorize"));
  await page.getByRole("button", { name: "Continuer avec Google" }).click();
  const demande = new URL((await depart).url());
  expect(demande.searchParams.get("provider")).toBe("google");
  expect(demande.searchParams.get("redirect_to")).toBe("http://localhost:3100/entree/confirmer");

  // Google lui-même ne se joue pas en local : un compte créé sans mot de passe, comme le
  // crée Google, entre par un lien de Supabase et trouve sa ligne d'enseignant toute prête
  const courriel = adresseDEssai();
  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_CLE_SECRETE!, { auth: { persistSession: false } });
  const cree = await admin.auth.admin.createUser({ email: courriel, email_confirm: true });
  expect(cree.error).toBeNull();
  await retenirCompte(courriel);
  const { data } = await admin.auth.admin.generateLink({ type: "magiclink", email: courriel });
  const lien = data.properties!.hashed_token;
  await aller(page, `/entree/confirmer?token_hash=${lien}&type=email`);
  await expect(page).toHaveURL(/\/projets$/);
  await expect(page.getByRole("heading", { name: "Votre premier livre commence ici" })).toBeVisible();
  const [ligne] = await sql<{ n: number }>("select count(*)::int as n from public.enseignants e join auth.users u on u.id = e.id where u.email = $1", [courriel]);
  expect(ligne.n).toBe(1);
});

test("F14-AC03 — l'écran d'inscription dit qu'on accepte les conditions, sans case à cocher", async ({ page }) => {
  await aller(page, "/entree");
  await page.getByRole("link", { name: "Créer un compte" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Créer un compte" })).toBeVisible();
  await expect(page.getByText("En créant un compte, vous acceptez les conditions d’utilisation et la politique de confidentialité.")).toBeVisible();
  await expect(page.getByRole("link", { name: "conditions d’utilisation" })).toHaveAttribute("href", "/conditions");
  await expect(page.getByRole("link", { name: "politique de confidentialité" })).toHaveAttribute("href", "/confidentialite");
  await expect(page.getByRole("checkbox")).toHaveCount(0);
});

test("F14-AC01 — s'inscrire par adresse : un courriel de confirmation, pas d'entrée avant son lien, puis « Mes projets », vide", async ({ page, browser }) => {
  const courriel = adresseDEssai();
  const motDePasse = "un-mot-de-passe-42";
  await aller(page, "/entree/inscription");
  await page.getByLabel("Adresse électronique").fill(courriel);
  await page.getByLabel(/Mot de passe/).fill(motDePasse);
  await page.getByRole("button", { name: "Créer mon compte" }).click();
  await expect(page.getByRole("status")).toContainText(`Un courriel vient de partir vers ${courriel}. Ouvrez son lien pour entrer.`);
  expect(await retenirCompte(courriel)).toBeTruthy();

  // Avant le lien, le compte n'ouvre pas, et le courriel se renvoie
  await connecter(page, { id: "", courriel, motDePasse });
  await expect(page.getByRole("alert").filter({ hasText: "Votre adresse n’est pas encore confirmée : ouvrez le lien du courriel reçu." })).toBeVisible();
  await expect(page).toHaveURL(/\/entree$/);
  await expect(page.getByRole("button", { name: "Renvoyer le courriel" })).toBeVisible();

  // Le lien s'ouvre sur un autre appareil que celui de l'inscription, comme un téléphone
  const recu = await courrielRecu(courriel, "Confirmer votre adresse");
  expect(recu.sujet).toBe("Confirmer votre adresse — Il était une classe");
  const lien = recu.liens.find((l) => l.includes("token_hash="))!;
  expect(lien).toMatch(/^http:\/\/localhost:3100\/entree\/confirmer\?token_hash=.+&type=email$/);
  const telephone = await browser.newContext();
  const autre = await telephone.newPage();
  await autre.goto(lien);
  await expect(autre).toHaveURL(/\/projets$/);
  await expect(autre.getByRole("heading", { name: "Votre premier livre commence ici" })).toBeVisible();

  // Le lien a servi : rouvert, il invite à entrer avec son mot de passe, qui marche désormais
  await autre.goto(lien);
  await telephone.close();
  await aller(page, lien.replace("http://localhost:3100", ""));
  await expect(page.getByRole("alert").filter({ hasText: "Ce lien n’est plus valable. Si vous l’avez déjà ouvert, entrez avec votre mot de passe." })).toBeVisible();
  await connecter(page, { id: "", courriel, motDePasse });
  await expect(page).toHaveURL(/\/projets$/);
});

test("F14-AC04 — une adresse déjà prise : la même phrase, aucun second compte, et un courriel qui propose d'entrer", async ({ page }) => {
  await aller(page, "/entree/inscription");
  await page.getByLabel("Adresse électronique").fill(compte.courriel);
  await page.getByLabel(/Mot de passe/).fill("un-autre-mot-de-passe");
  await page.getByRole("button", { name: "Créer mon compte" }).click();
  await expect(page.getByRole("status")).toContainText(`Un courriel vient de partir vers ${compte.courriel}. Ouvrez son lien pour entrer.`);

  const [ligne] = await sql<{ n: number }>("select count(*)::int as n from auth.users where email = $1", [compte.courriel]);
  expect(ligne.n).toBe(1);
  // Le mot de passe du compte n'a pas changé
  await connecter(page, compte);
  await expect(page).toHaveURL(/\/projets$/);

  const recu = await courrielRecu(compte.courriel, "Vous avez déjà un compte");
  expect(recu.html).toContain("Entrer");
  expect(recu.liens).toContain("http://localhost:3100/entree");
  expect(recu.liens).toContain("http://localhost:3100/entree/oubli");
  // Aucun lien du courriel n'ouvre le compte de lui-même
  expect(recu.liens.some((l) => /verify|token|code=/.test(l))).toBe(false);
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
