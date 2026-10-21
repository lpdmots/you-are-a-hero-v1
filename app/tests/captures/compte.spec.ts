import { test, type Page } from "@playwright/test";
import { adultePret, aller, ouvrirLeMenuDuCompte, semerImageDeposee, semerPartie, semerProjet, sql, supprimerComptes, viderLaBibliotheque } from "../parcours/outils";

/**
 * Captures de « Mon compte » en page (21 octobre 2026) : npm run captures -- compte
 * Elles s'écrivent dans test-results/captures/. Ce n'est pas un test : rien n'y est vérifié.
 */
const dossier = "test-results/captures";
let n = 960;
const capturer = async (page: Page, nom: string, toute = false) => {
  n += 1;
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${dossier}/${n}-${nom}.png`, fullPage: toute });
};

let avant: boolean;
test.beforeAll(async () => {
  avant = (await sql<{ p: boolean }>("select paiement_ouvert as p from public.reglages_application"))[0].p;
});
test.afterEach(async () => {
  await sql("update public.reglages_application set paiement_ouvert = $1", [avant]);
  await supprimerComptes();
});

test("« Mon compte » en page, et le menu du nom", async ({ page }) => {
  test.setTimeout(180_000);
  const { compte, base } = await adultePret(page);
  await sql("update public.reglages_application set paiement_ouvert = true");
  const projet = await semerProjet(base, compte, "personnel", "choix", "Le marais des feux follets", null);
  await semerPartie(base, projet, "La traversée", [{ titre: "Le dernier bac", scenes: ["Le départ"] }]);
  await base.from("enseignants").update({ nom_affiche: "Mme Laurent" }).eq("id", compte.id);

  await page.setViewportSize({ width: 1366, height: 900 });
  await aller(page, "/projets");
  await ouvrirLeMenuDuCompte(page);
  await capturer(page, "menu-du-nom");
  await page.getByRole("link", { name: "Mon compte" }).click();
  await page.getByRole("heading", { level: 1, name: "Mon compte" }).waitFor();
  await capturer(page, "mon-compte", true);
  await page.getByRole("button", { name: "Quelle qualité choisir ?" }).click();
  await capturer(page, "mon-compte-bulle");
  await page.keyboard.press("Escape");
  await page.getByLabel("Degré de correction par défaut").selectOption("3");
  await page.getByText("Enregistré").waitFor();
  await capturer(page, "mon-compte-enregistre");
  await page.getByText("Proposer les aides IA", { exact: true }).click();
  await page.getByText("Aucune aide IA dans vos projets. Tout le reste fonctionne.").waitFor();
  await capturer(page, "mon-compte-aides-eteintes", true);
  await page.getByText("Proposer les aides IA", { exact: true }).click();
  await page.getByRole("button", { name: "Supprimer mon compte" }).click();
  await capturer(page, "mon-compte-supprimer");
  await page.keyboard.press("Escape");

  await page.getByRole("button", { name: "Changer d’adresse" }).click();
  await page.getByLabel("Nouvelle adresse").fill("laurent.nouvelle@exemple.test");
  n = 969;
  await capturer(page, "connexion-adresse", true);
  await page.getByRole("button", { name: "Annuler" }).click();
  await page.getByRole("button", { name: "Changer de mot de passe" }).click();
  await capturer(page, "connexion-mot-de-passe", true);
  await page.getByRole("button", { name: "Annuler" }).click();
  n = 965;

  await page.setViewportSize({ width: 390, height: 844 });
  await aller(page, "/compte");
  await capturer(page, "mon-compte-390", true);
  await ouvrirLeMenuDuCompte(page);
  await capturer(page, "menu-du-nom-390");
  await page.keyboard.press("Escape");

  // La mention, là où l'on ajoute : son interrupteur, à la place de « Régler »
  await page.setViewportSize({ width: 1366, height: 900 });
  await aller(page, `/projet/${projet}/plan`);
  await page.getByRole("button", { name: /Demander des chapitres à l’IA/ }).first().click();
  await page.getByRole("button", { name: "Proposer des chapitres" }).click();
  await page.getByText("Image créée à l’ajout").last().waitFor({ timeout: 60_000 });
  n = 971;
  await capturer(page, "mention-image-a-l-ajout");
});

test("la bibliothèque d'images : l'administration, puis « Choisir une image »", async ({ page }) => {
  test.setTimeout(120_000);
  const { compte, base } = await adultePret(page);
  await sql("update public.enseignants set createur = true where id = $1", [compte.id]);
  const projet = await semerProjet(base, compte, "personnel", "choix", "Le marais des feux follets", null);
  const sources: string[] = [];
  for (const cible of ["chapitre", "scene", "partie"]) {
    const image = await semerImageDeposee(base, compte, projet);
    sources.push(image);
    await sql(
      "insert into public.demandes_d_images (enseignant_id, projet_id, cible, cible_id, etat, image_posee, sans_personnage, termine_le) values ($1, $2, $3, gen_random_uuid(), 'posee', $4, true, now())",
      [compte.id, projet, cible, image],
    );
  }
  try {
    await page.setViewportSize({ width: 1366, height: 900 });
    await aller(page, "/admin");
    n = 980;
    await capturer(page, "admin-lien-bibliotheque");
    await aller(page, "/admin/bibliotheque");
    await page.locator(`img[src^="/admin/images/${sources[0]}"]`).locator("xpath=ancestor::li").getByRole("button", { name: "Accepter" }).click();
    await page.getByText("L’image est dans la bibliothèque").waitFor();
    await capturer(page, "admin-bibliotheque", true);
    await aller(page, `/projet/${projet}/plan`);
    await page.getByRole("button", { name: "Réglages du projet" }).click();
    await page.getByRole("button", { name: "Choisir une image" }).click();
    await page.getByRole("searchbox", { name: "Chercher un visuel" }).fill("brume");
    await page.getByRole("button", { name: /Image de la bibliothèque/ }).first().waitFor();
    await capturer(page, "choisir-une-image-chercher");
    await page.setViewportSize({ width: 390, height: 844 });
    await aller(page, "/admin/bibliotheque");
    await capturer(page, "admin-bibliotheque-390", true);
  } finally {
    await viderLaBibliotheque(sources);
  }
});

test("les réglages du projet, entiers", async ({ page }) => {
  const { compte, base } = await adultePret(page);
  await sql("update public.reglages_application set paiement_ouvert = true");
  const projet = await semerProjet(base, compte, "classe", "choix", "Le marais des feux follets", null);
  await page.setViewportSize({ width: 1366, height: 2600 });
  await aller(page, `/projet/${projet}/plan`);
  await page.getByRole("button", { name: "Réglages du projet" }).click();
  await page.getByRole("heading", { name: "Images" }).waitFor();
  n = 989;
  await capturer(page, "reglages-du-projet");
  await page.getByRole("button", { name: "Changer le style des images" }).click();
  await capturer(page, "reglages-du-projet-styles");
  await page.setViewportSize({ width: 1366, height: 900 });
  await page.getByRole("button", { name: "Que lisent les élèves ?" }).click();
  await capturer(page, "reglages-du-projet-bulle");
});
