import { expect, test } from "@playwright/test";
import { adultePret, aller, ouvrirLeMenuDuCompte, semerProjet, sql, supprimerComptes } from "./outils";

/**
 * Étape 9, lot 9 : les pages publiques et les textes juridiques (F14-AC32, AC33, AC36), et le
 * retour à l'accueil (F14-AC39, 22 octobre 2026). Les
 * adresses `.com`, qui renvoient vers le `.fr`, se règlent chez Vercel et s'essaient en ligne.
 */

test.afterEach(async () => {
  await supprimerComptes();
});

test("F14-AC32 — l'accueil, un livre-jeu, dit ce qu'est l'outil et mène à l'inscription, aux deux entrées et aux quatre pages", async ({ page }) => {
  await aller(page, "/");
  await expect(page.getByRole("heading", { level: 1, name: "Votre classe écrit son livre-jeu." })).toBeVisible();
  await expect(page.getByText("l’application vous guide à chaque étape")).toBeVisible();
  // Les choix du passage sont les liens de la page : « rendez-vous au 12 » mène au passage 12
  await page.getByRole("link", { name: /comment se passe un projet, rendez.vous au\s*12/ }).click();
  await expect(page).toHaveURL(/#p12$/);
  await expect(page.getByRole("heading", { level: 2, name: "Un projet, en trois temps." })).toBeInViewport();
  for (const [lien, adresse] of [
    ["Créez un compte", /\/entree\/inscription$/], ["Se connecter", /\/entree$/], ["Entrée enseignant", /\/entree$/], 
    ["Entrée des élèves", /\/classe$/], ["Aide", /\/aide$/], ["Confidentialité", /\/confidentialite$/], ["Conditions d’utilisation", /\/conditions$/],
    ["Mentions légales", /\/mentions-legales$/],
  ] as const) {
    await aller(page, "/");
    await page.getByRole("link", { name: lien, exact: true }).first().click();
    await expect(page).toHaveURL(adresse);
  }
  await aller(page, "/confidentialite");
  await expect(page.getByRole("heading", { name: "Ce qui part à l’IA" })).toBeVisible();
  await expect(page.getByText("Ne partent jamais : le prénom ou le nom d’un élève")).toBeVisible();
  await aller(page, "/mentions-legales");
  await expect(page.getByText(/Vercel Inc\./)).toBeVisible();
});

test("F14-AC21 — le prix du pass, changé dans les réglages, se lit sur l'accueil quand la vente est ouverte", async ({ page }) => {
  const [avant] = await sql<{ paiement_ouvert: boolean; prix_du_pass: number }>("select paiement_ouvert, prix_du_pass from public.reglages_application");
  try {
    await sql("update public.reglages_application set paiement_ouvert = true, prix_du_pass = 2500");
    await aller(page, "/");
    // Le passage 40 : choisir « Un grand livre » remplit la fiche aventure avec le prix du pass
    const grand = page.getByRole("button", { name: /Un grand livre.*pass du livre.*25\s€/ });
    await expect(grand).toBeVisible();
    await grand.click();
    await expect(grand).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByRole("group", { name: "Fiche aventure" }).getByText(/^25\s€$/)).toBeVisible();
    await sql("update public.reglages_application set paiement_ouvert = false");
    await aller(page, "/");
    await expect(page.getByText(/pass du livre/)).toHaveCount(0);
    await expect(page.getByText("Gratuit.", { exact: true })).toBeVisible();
  } finally {
    await sql("update public.reglages_application set paiement_ouvert = $1, prix_du_pass = $2", [avant.paiement_ouvert, avant.prix_du_pass]);
  }
});

test("F14-AC33 — depuis l'aide, les deux modèles pour les familles se lisent et se téléchargent ; le contrat type aussi", async ({ page, request }) => {
  await aller(page, "/aide");
  for (const nom of ["Autorisation de diffusion", "Information des familles", "Contrat de sous-traitance type"]) {
    await expect(page.getByRole("link", { name: nom })).toBeVisible();
  }
  await page.getByRole("link", { name: "Autorisation de diffusion" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Autorisation de diffusion des textes et dessins d’un élève" })).toBeVisible();
  const telechargement = page.waitForEvent("download");
  await page.getByRole("link", { name: "Télécharger le modèle" }).first().click();
  expect((await telechargement).suggestedFilename()).toBe("autorisation-de-diffusion.rtf");
  const fichier = await request.get("/modeles/information-des-familles/fichier");
  expect(fichier.headers()["content-type"]).toContain("application/rtf");
  expect(await fichier.text()).toMatch(/^\{\\rtf1/);
  expect((await request.get("/modeles/inconnu/fichier")).status()).toBe(404);
});

test("F14-AC33 — dans « Imprimer et partager », un projet de classe propose les deux modèles pour les familles", async ({ page }) => {
  const { compte, base } = await adultePret(page);
  const projet = await semerProjet(base, compte, "classe", "choix", "Le marais", null);
  await sql(
    "update projets set mise_en_page_ouverte_le = now(), livre_relu_le = now(), chemins_verifies_le = now(), mise_en_page_convient_le = now(), imprimer_ouvert_le = now() where id = $1",
    [projet],
  );
  await aller(page, `/projet/${projet}/livre?etape=sortie&volet=partager`);
  const familles = page.getByRole("region", { name: "Pour les familles" });
  await expect(familles.getByRole("link", { name: "Autorisation de diffusion" })).toHaveAttribute("href", "/modeles/autorisation-de-diffusion/fichier");
  await expect(familles.getByRole("link", { name: "Information des familles" })).toHaveAttribute("href", "/modeles/information-des-familles/fichier");
});

test("F14-AC36 — « Écrire au créateur » dans « Mon compte » et l'adresse de contact dans l'aide", async ({ page }) => {
  await adultePret(page);
  await aller(page, "/compte");
  await expect(page.getByRole("link", { name: "Écrire au créateur" })).toHaveAttribute("href", "mailto:contact@iletaituneclasse.com");
  await aller(page, "/aide");
  await expect(page.getByRole("link", { name: "contact@iletaituneclasse.com" }).first()).toHaveAttribute("href", "mailto:contact@iletaituneclasse.com");
  await expect(page.getByText("Il était une classe est fait par un enseignant qui a sa classe : la réponse peut prendre quelques jours.")).toBeVisible();
  await expect(page.getByText("Où retrouver les codes des élèves ?")).toBeVisible();
});

test("F14-AC39 — revenir à l'accueil : après « Se déconnecter », et depuis les écrans d'entrée", async ({ page }) => {
  // Depuis l'entrée enseignant, l'inscription et le mot de passe oublié : « Retour à l'accueil » et le nom
  for (const adresse of ["/entree", "/entree/inscription", "/entree/oubli"]) {
    for (const lien of ["Retour à l’accueil", "Il était une classe"]) {
      await aller(page, adresse);
      await page.getByRole("link", { name: lien, exact: true }).click();
      await expect(page).toHaveURL(/:\d+\/$/);
    }
  }
  // L'entrée des élèves aussi
  for (const lien of ["Retour à l’accueil", "Il était une classe"]) {
    await aller(page, "/classe");
    await page.getByRole("link", { name: lien, exact: true }).click();
    await expect(page).toHaveURL(/:\d+\/$/);
  }

  // Se déconnecter mène à l'accueil
  await adultePret(page);
  await ouvrirLeMenuDuCompte(page);
  await page.getByRole("button", { name: "Se déconnecter" }).click();
  await expect(page).toHaveURL(/:\d+\/$/);
  await expect(page.getByRole("link", { name: "Créez un compte" }).first()).toBeVisible();
});
