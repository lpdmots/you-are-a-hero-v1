import { expect, test, type Page } from "@playwright/test";
import { aller, choixAuto, classeQuiEcrit, posteDe, recit, semerBlocs, semerPartie, semerProjet, sql, supprimerComptes } from "./outils";

/**
 * Étape 7 du plan, lot 4 : l'essai de bout en bout. Mme Laurent partage le livre de sa classe
 * par les deux canaux ; une famille le lit sur un téléphone, sans compte, jusqu'à la fin ;
 * Alice le lit depuis « Lire » ; une coquille corrigée et la mise à jour arrivent chez les deux ;
 * le partage retiré, le lien mène à la page neutre et le livre quitte « Lire ».
 */

test.afterEach(async () => {
  await supprimerComptes();
});
test.beforeEach(async () => {
  await sql("delete from essais_entree");
});

const interrupteur = (page: Page, nom: string) => page.locator("label.inter", { has: page.getByRole("switch", { name: nom }) });
async function confirmer(page: Page, action: string) {
  const rappel = page.getByRole("group", { name: "À relire avant de partager" });
  await rappel.getByText("J’ai relu le livre sur ces points.").click();
  await rappel.getByRole("button", { name: action }).click();
}

test("Étape 7 — partager le livre de la classe, le lire sur un téléphone sans compte et depuis « Lire », le mettre à jour, le retirer", async ({ page, browser }) => {
  test.setTimeout(150_000);
  const s = await classeQuiEcrit(page);
  const projet = await semerProjet(s.base, s.compte, "classe", "choix", "Le phare", s.classe.id);
  const [depart, fin] = (await semerPartie(s.base, projet, "La côte", [{ titre: "La plage", scenes: ["Le départ", "La fin"] }])).chapitres[0].scenes;
  await s.base.from("projets").update({ depart_scene_id: depart }).eq("id", projet);
  await semerBlocs(s.base, depart, [recit("La brume s’épaissi sur la plage."), choixAuto("Monter au phare", fin)]);
  await semerBlocs(s.base, fin, [recit("La lanterne s’allume.")]);
  await s.base.from("scenes").update({ fin: true }).eq("id", fin);
  await sql("update scenes set etat = 'prete' where projet_id = $1", [projet]);
  await sql("update projets set livre_relu_le = now(), chemins_verifies_le = now(), mise_en_page_ouverte_le = now() where id = $1", [projet]);

  // Mme Laurent déclare la mise en page, puis partage par les deux canaux
  await aller(page, `/projet/${projet}/livre?etape=page`);
  await page.getByRole("button", { name: "La mise en page me convient" }).click();
  // La déclaration doit être enregistrée avant de changer de page : sinon « Imprimer et partager » reste fermée
  await expect(page.getByText("Mise en page terminée")).toBeVisible();
  await aller(page, `/projet/${projet}/livre?etape=sortie&volet=partager`);
  await interrupteur(page, "À mes classes").click();
  await confirmer(page, "Partager à mes classes");
  await expect(page.getByRole("switch", { name: "À mes classes" })).toBeChecked();
  await expect(page.getByRole("navigation", { name: "Étapes du livre" }).getByRole("link", { name: /Imprimer et partager — terminée/ })).toBeVisible();
  // Un lien de lecture ouvert avant le 25 octobre 2026 : il ne se crée plus (F15-AC15), mais reste lisible
  const [{ code }] = await sql<{ code: string }>("update partages set par_lien = true where projet_id = $1 returning code", [projet]);
  const adresse = `/lire/${code}`;

  // Une famille, sur un téléphone, sans compte
  const famille = await browser.newContext({ baseURL: "http://localhost:3100", viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, locale: "fr-FR" });
  const tel = await famille.newPage();
  await tel.goto(adresse);
  await expect(tel.getByText("La classe de CM1-CM2 de Mme Laurent")).toBeVisible();
  await tel.getByRole("button", { name: "Commencer la lecture" }).click();
  await expect(tel.locator(".lecteur__corps")).toContainText("La brume s’épaissi sur la plage.");
  await tel.locator(".lecteur__corps").getByRole("button", { name: /Monter au phare/ }).click();
  await expect(tel.locator(".lu-fin__marque")).toHaveText("Fin");

  // Alice, depuis « Lire »
  const alice = await posteDe(browser, s, "Alice");
  await alice.page.getByRole("navigation", { name: "Espace élève" }).getByRole("link", { name: "Lire", exact: true }).click();
  await alice.page.getByRole("link", { name: /Le phare/ }).click();
  await alice.page.getByRole("button", { name: "Commencer la lecture" }).click();
  await expect(alice.page.locator(".lecteur__corps")).toContainText("La brume s’épaissi sur la plage.");

  // La coquille corrigée : rien ne change avant la mise à jour, puis les deux lisent le texte corrigé
  await semerBlocs(s.base, depart, [recit("La brume s’épaissit sur la plage."), choixAuto("Monter au phare", fin)]);
  await tel.goto(adresse);
  await tel.getByRole("button", { name: "Recommencer au début" }).click();
  await expect(tel.locator(".lecteur__corps")).toContainText("La brume s’épaissi sur la plage.");
  await aller(page, `/projet/${projet}/livre?etape=sortie&volet=partager`);
  await page.getByRole("button", { name: "Mettre à jour…" }).click();
  await confirmer(page, "Mettre à jour");
  await expect(page.getByText(/À jour depuis le/)).toBeVisible();
  await tel.goto(adresse);
  await tel.getByRole("button", { name: /Continuer|Commencer/ }).first().click();
  await expect(tel.locator(".lecteur__corps")).toContainText("La brume s’épaissit sur la plage.");
  await alice.page.reload();
  await alice.page.getByRole("button", { name: /Continuer|Commencer/ }).first().click();
  await expect(alice.page.locator(".lecteur__corps")).toContainText("La brume s’épaissit sur la plage.");

  // Retiré : le lien mène à la page neutre, le livre quitte « Lire »
  await page.getByRole("button", { name: "Couper le lien…" }).click();
  await page.getByRole("group", { name: "Couper ce lien ?" }).getByRole("button", { name: "Couper le lien" }).click();
  await interrupteur(page, "À mes classes").click();
  await page.getByRole("group", { name: "Ne plus proposer le livre à vos classes ?" }).getByRole("button", { name: "Ne plus le proposer" }).click();
  await expect(page.getByRole("switch", { name: "À mes classes" })).not.toBeChecked();
  await tel.goto(adresse);
  await expect(tel.getByText("Ce livre n’est plus partagé.")).toBeVisible();
  await alice.page.goto("/travail/lecture");
  await expect(alice.page.getByText("Pas encore de livre. Quand Mme Laurent en proposera un, il sera ici.")).toBeVisible();
  await famille.close();
  await alice.contexte.close();
});
