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
