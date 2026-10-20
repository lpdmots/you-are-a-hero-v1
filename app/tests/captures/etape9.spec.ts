import { randomUUID } from "node:crypto";
import { test, type Page } from "@playwright/test";
import { adultePret, aller, recit, semerBlocs, semerPartie, semerProjet, sql, supprimerComptes } from "../parcours/outils";

/**
 * Captures des écrans de l'étape 9 : npm run captures -- etape9
 * Elles s'écrivent dans test-results/captures/. Ce n'est pas un test : rien n'y est vérifié.
 */
const dossier = "test-results/captures";
let n = 900;
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

test("lot 4 : limites gratuites et pass", async ({ page }) => {
  test.setTimeout(240_000);
  const { compte, base } = await adultePret(page);
  const projet = await semerProjet(base, compte, "personnel", "choix", "Le marais des feux follets", null);
  const { chapitres } = await semerPartie(base, projet, "La traversée", [
    { titre: "Le dernier bac", scenes: Array.from({ length: 22 }, (_, i) => `Scène ${i + 1}`) },
    { titre: "Le gué des saules", scenes: Array.from({ length: 18 }, (_, i) => `Scène ${i + 23}`) },
  ]);
  const images = await Promise.all(Array.from({ length: 10 }, async () => {
    const id = randomUUID();
    await sql("insert into public.images (id, projet_id, enseignant_id, chemin, chemin_vignette, largeur, hauteur, format) values ($1, $2, $3, $4, $5, 240, 160, 'jpeg')", [id, projet, compte.id, `${compte.id}/${projet}/${id}.jpg`, `${compte.id}/${projet}/${id}-v.jpg`]);
    return id;
  }));
  const bloc = (image: string) => ({ type: "image", id: randomUUID(), image, largeur: 60, children: [{ text: "" }] });
  await semerBlocs(base, chapitres[0].scenes[0], [recit("Le bac glisse sur l’eau noire."), ...images.slice(0, 7).map(bloc)]);
  await semerBlocs(base, chapitres[0].scenes[1], [recit("Les feux follets dansent au-dessus des roseaux.")]);
  await sql("update public.reglages_application set paiement_ouvert = true");

  // Le décompte de « Parties et chapitres », puis les réglages du projet
  await aller(page, `/projet/${projet}/plan`);
  await capturer(page, "plan-40-scenes-sur-40");
  await page.getByRole("button", { name: "Réglages du projet" }).click();
  await page.getByRole("heading", { name: "Pass du livre" }).scrollIntoViewIfNeeded();
  await capturer(page, "reglages-livre-gratuit");
  await page.keyboard.press("Escape");

  // La limite des scènes
  await aller(page, `/projet/${projet}/chapitre/${chapitres[0].id}`);
  await page.getByRole("button", { name: "Ajouter une scène" }).click();
  await page.getByRole("alertdialog").waitFor();
  await capturer(page, "dialogue-scenes");

  // La limite des images
  await semerBlocs(base, chapitres[0].scenes[1], [recit("Les feux follets dansent au-dessus des roseaux."), ...images.slice(7, 10).map(bloc)]);
  await aller(page, `/projet/${projet}/scene/${chapitres[0].scenes[1]}`);
  await page.locator('.copie__texte[contenteditable="true"]').click();
  await page.getByRole("toolbar", { name: "Outils de la copie" }).getByRole("button", { name: "Image" }).click();
  await page.getByRole("alertdialog").waitFor();
  await capturer(page, "dialogue-images");

  // En 390
  await page.setViewportSize({ width: 390, height: 844 });
  await aller(page, `/projet/${projet}/chapitre/${chapitres[0].id}`);
  await page.getByRole("button", { name: "Ajouter une scène" }).click();
  await page.getByRole("alertdialog").waitFor();
  await capturer(page, "dialogue-scenes-390");
  await page.getByRole("button", { name: "Plus tard" }).click();
  await aller(page, `/projet/${projet}/plan`);
  await page.getByRole("button", { name: "Réglages du projet" }).click();
  await page.getByRole("heading", { name: "Pass du livre" }).scrollIntoViewIfNeeded();
  await capturer(page, "reglages-livre-gratuit-390");

  // Le pass reçu
  await page.setViewportSize({ width: 1366, height: 768 });
  await sql("select public.donner_le_pass($1, 'achat')", [projet]);
  await aller(page, `/projet/${projet}/plan`);
  await page.getByRole("button", { name: "Réglages du projet" }).click();
  await page.getByRole("heading", { name: "Pass du livre" }).scrollIntoViewIfNeeded();
  await capturer(page, "reglages-pass");
});

test("lot 5 : recharger dans « Mon compte », et le retour du pass payé", async ({ page }) => {
  test.setTimeout(120_000);
  const { compte, base } = await adultePret(page);
  const projet = await semerProjet(base, compte, "personnel", "choix", "Le marais des feux follets", null);
  await semerPartie(base, projet, "La traversée", [{ titre: "Le dernier bac", scenes: ["Le départ"] }]);
  await sql("update public.reglages_application set paiement_ouvert = true");
  await aller(page, "/projets");
  await page.locator("header button[aria-haspopup='dialog']").first().click();
  await page.getByRole("heading", { name: "Aides IA" }).scrollIntoViewIfNeeded();
  n = 910;
  await capturer(page, "mon-compte-recharger");
  await sql("select public.donner_le_pass($1, 'achat')", [projet]);
  await aller(page, `/projet/${projet}/plan?message=pass`);
  await capturer(page, "retour-du-pass");
});

test("lot 6 : l'administration", async ({ page }) => {
  test.setTimeout(120_000);
  const { compte, base } = await adultePret(page);
  await sql("update public.enseignants set createur = true where id = $1", [compte.id]);
  const projet = await semerProjet(base, compte, "personnel", "choix", "Le marais des feux follets", null);
  await sql("insert into public.mouvements_etoiles (enseignant_id, nombre, motif, note) values ($1, 100, 'cadeau', 'Essai en classe')", [compte.id]);
  void projet;
  n = 920;
  await aller(page, "/admin");
  await capturer(page, "admin", true);
  await aller(page, `/admin/compte/${compte.id}`);
  await capturer(page, "admin-compte", true);
  await page.setViewportSize({ width: 390, height: 844 });
  await aller(page, "/admin");
  await capturer(page, "admin-390", true);
});

test("lot 7 : la corbeille, et supprimer son compte", async ({ page }) => {
  test.setTimeout(120_000);
  const { compte, base } = await adultePret(page);
  const projet = await semerProjet(base, compte, "personnel", "choix", "Le marais des feux follets", null);
  const { chapitres } = await semerPartie(base, projet, "La traversée", [{ titre: "Le dernier bac", scenes: ["Le départ", "La brume", "Le passeur"] }]);
  await base.rpc("supprimer_element", { p_sorte: "scene", p_id: chapitres[0].scenes[1] });
  await base.rpc("supprimer_element", { p_sorte: "scene", p_id: chapitres[0].scenes[2] });
  n = 930;
  await aller(page, `/projet/${projet}/plan`);
  await page.getByRole("button", { name: /Corbeille du projet/ }).click();
  await capturer(page, "corbeille");
  await page.getByRole("button", { name: "Vider la corbeille" }).click();
  await capturer(page, "corbeille-vider");
  await page.keyboard.press("Escape");
  await aller(page, "/projets");
  await page.locator("header button[aria-haspopup='dialog']").first().click();
  await page.getByRole("button", { name: "Supprimer mon compte" }).click();
  await capturer(page, "supprimer-mon-compte");
});

test("lot 9 : les pages publiques", async ({ page }) => {
  test.setTimeout(180_000);
  n = 940;
  for (const [adresse, nom] of [["/", "accueil"], ["/aide", "aide"], ["/confidentialite", "confidentialite"], ["/conditions", "conditions"], ["/mentions-legales", "mentions-legales"], ["/modeles/autorisation-de-diffusion", "modele-autorisation"]] as const) {
    await aller(page, adresse);
    await capturer(page, nom, true);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  for (const [adresse, nom] of [["/", "accueil-390"], ["/aide", "aide-390"], ["/modeles/autorisation-de-diffusion", "modele-390"]] as const) {
    await aller(page, adresse);
    await capturer(page, nom, true);
  }
  await aller(page, "/");
  await capturer(page, "accueil-390-haut");
  // L'offre, « Paiement ouvert » allumé
  await page.setViewportSize({ width: 1366, height: 768 });
  await sql("update public.reglages_application set paiement_ouvert = true");
  await aller(page, "/");
  await page.getByRole("heading", { name: "Ce que cela coûte" }).scrollIntoViewIfNeeded();
  await capturer(page, "accueil-offre-paiement-ouvert");
});
