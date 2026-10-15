import { expect, test, type Page } from "@playwright/test";
import { adultePret, aller, choixAuto, recit, semerBlocs, semerImage, semerPartie, semerProjet, sql, supprimerComptes } from "./outils";

/**
 * Étape 6 du plan, lot 7 : un livre mené de « Relire » au PDF définitif, à l'écran seulement,
 * comme l'adulte le fera (F11.6) — un récit à choix, puis un récit classique.
 */

test.afterEach(async () => {
  await supprimerComptes();
});

const fiche = (page: Page) => page.locator(".controles");
const tache = (page: Page, nom: string) => fiche(page).getByRole("list", { name: "Tâches de l’étape" }).getByRole("button", { name: new RegExp(nom) });
const etape = (page: Page, nom: string) => page.getByRole("navigation", { name: "Étapes du livre" }).getByRole("link", { name: new RegExp(nom) });

test("F11.6 — récit à choix : relire et confirmer un dessin, vérifier les chemins, régler la mise en page, la déclarer, créer le PDF définitif", async ({ page }) => {
  test.setTimeout(180_000);
  const { compte, base } = await adultePret(page);
  const projet = await semerProjet(base, compte, "personnel", "choix", "Le phare");
  const { chapitres } = await semerPartie(base, projet, "La côte", [{ titre: "La plage", scenes: ["La plage au matin", "La lanterne", "La grotte"] }]);
  const s = chapitres[0].scenes;
  const image = await semerImage(base, compte, projet);
  await sql("update images set largeur = 500, hauteur = 400 where id = $1", [image]);
  await base.from("projets").update({ depart_scene_id: s[0] }).eq("id", projet);
  await semerBlocs(base, s[0], [recit("Le phare clignote dans la brume."), { type: "image", id: crypto.randomUUID(), image, largeur: 60, children: [{ text: "" }] }, choixAuto("Monter au phare", s[1]), choixAuto("Entrer dans la grotte", s[2])]);
  await semerBlocs(base, s[1], [recit("La lanterne s’allume.")]);
  await semerBlocs(base, s[2], [recit("La grotte est froide.")]);
  await base.from("scenes").update({ fin: true }).in("id", [s[1], s[2]]);
  await sql("update scenes set etat = 'prete' where projet_id = $1", [projet]);

  // Relire : le dessin peu défini se garde, puis la déclaration
  await aller(page, `/projet/${projet}/livre?etape=relire`);
  await tache(page, "À confirmer").click();
  await fiche(page).getByRole("button", { name: "Garder ainsi" }).click();
  await tache(page, "Lire et corriger").click();
  await fiche(page).getByRole("button", { name: "J’ai relu le livre" }).click();
  await expect(etape(page, "Relire")).toContainText("terminée");
  // Vérifier les chemins
  await aller(page, `/projet/${projet}/livre?etape=chemins`);
  await tache(page, "Tester la lecture").click();
  await fiche(page).getByRole("button", { name: "J’ai vérifié les chemins" }).click();
  await expect(etape(page, "Vérifier les chemins")).toContainText("terminée");
  // Mettre en page : un réglage, un coup d'œil à l'aperçu, la déclaration
  await etape(page, "Mettre en page").click();
  await page.getByRole("button", { name: "Grande" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Enregistré" })).toBeVisible();
  await page.getByRole("tab", { name: "Aperçu" }).click();
  await expect(page.locator(".apercu__etat")).toContainText("3 passages", { timeout: 60_000 });
  await page.getByRole("button", { name: "La mise en page me convient" }).click();
  await expect(etape(page, "Mettre en page")).toContainText("terminée");
  // Imprimer : le dessin gardé est rappelé, puis le PDF se télécharge
  await page.getByRole("link", { name: "Imprimer et partager" }).last().click();
  await page.getByRole("button", { name: "Créer le PDF définitif…" }).click();
  await expect(page.getByRole("group", { name: "À savoir avant de créer le PDF" })).toContainText("Image peu définie.");
  const fichier = page.waitForEvent("download", { timeout: 60_000 });
  await page.getByRole("button", { name: "Créer le PDF définitif", exact: true }).click();
  expect((await fichier).suggestedFilename()).toBe("Le phare - livre.pdf");
  await aller(page, `/projet/${projet}/livre?etape=sortie`);
  await expect(page.getByText("Le livre est fait.")).toBeVisible();
  await expect(etape(page, "Imprimer et partager")).toContainText("terminée");
});

test("F11-AC69 — récit classique : « Relire », puis « Mettre en page », puis le PDF définitif", async ({ page }) => {
  test.setTimeout(180_000);
  const { compte, base } = await adultePret(page);
  const projet = await semerProjet(base, compte, "personnel", "classique", "Le grand voyage");
  const { chapitres } = await semerPartie(base, projet, "Le départ", [{ titre: "Le village", scenes: ["Le village endormi", "La lettre"] }]);
  for (const [i, s] of chapitres[0].scenes.entries()) await semerBlocs(base, s, [recit(`Scène ${i + 1} : la route commence ici.`)]);
  await sql("update scenes set etat = 'prete' where projet_id = $1", [projet]);

  await aller(page, `/projet/${projet}/livre?etape=relire`);
  await expect(page.getByRole("navigation", { name: "Étapes du livre" }).getByRole("listitem")).toHaveCount(3);
  await tache(page, "Lire et corriger").click();
  await fiche(page).getByRole("button", { name: "J’ai relu le livre" }).click();
  await etape(page, "Mettre en page").click();
  await expect(page.getByRole("region", { name: "Ordre des passages" })).toHaveCount(0);
  await page.getByRole("button", { name: "La mise en page me convient" }).click();
  await page.getByRole("link", { name: "Imprimer et partager" }).last().click();
  const fichier = page.waitForEvent("download", { timeout: 60_000 });
  await page.getByRole("button", { name: "Créer le PDF définitif…" }).click();
  expect((await fichier).suggestedFilename()).toBe("Le grand voyage - livre.pdf");
});
