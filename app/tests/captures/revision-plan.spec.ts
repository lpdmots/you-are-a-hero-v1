import { test, type Page } from "@playwright/test";
import { adultePret, aller, elevesDe, semerAttribution, semerClasse, semerPartie, semerProjet, semerTexte, supprimerComptes } from "../parcours/outils";
import { ELEVES, PARTIES } from "../../scripts/passeurs-de-brume";

/**
 * Captures de la révision d'ergonomie de « Parties et chapitres » (novembre 2026), contre le
 * serveur local : npx playwright test --config playwright.local.config.ts revision-plan
 * Elles s'écrivent dans test-results/captures/plan/. Ce n'est pas un test : rien n'y est vérifié.
 * Aucun appel d'IA n'y part : les panneaux de l'IA sont capturés avant toute demande.
 */
const dossier = "test-results/captures/plan";
let n = 0;
const capturer = async (page: Page, nom: string, toute = false) => {
  n += 1;
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${dossier}/${String(n).padStart(2, "0")}-${nom}.png`, fullPage: toute });
};
const fermer = async (page: Page) => {
  await page.keyboard.press("Escape");
  await page.waitForTimeout(200);
};

test.afterEach(async () => {
  await supprimerComptes();
});

test("Parties et chapitres : « Les passeurs de brume », 25 élèves, un chapitre de 32 scènes, en 1366 et 390 px", async ({ page }) => {
  test.setTimeout(400_000);
  const { compte, base } = await adultePret(page);
  const classe = await semerClasse(base, "CM1-CM2 d’essai", [...ELEVES]);
  const eleves = await elevesDe(base, classe.id);
  const projet = await semerProjet(base, compte, "classe", "choix", "Les passeurs de brume", classe.id);
  const visuels = ["mer", "foret", "montagne", "cite", "desert"];
  const scenes: string[] = [];
  for (const [i, partie] of PARTIES.entries()) {
    const semee = await semerPartie(base, projet, partie.titre, partie.chapitres.map((c) => ({ titre: c.titre, scenes: c.scenes.map((s) => s.titre) })), visuels[i % visuels.length]);
    for (const [j, chapitre] of partie.chapitres.entries()) {
      // Un chapitre de la forêt reste sans élève : « À compléter » le dit
      if (i === 1 && j === partie.chapitres.length - 1) continue;
      if (chapitre.eleves.length) await semerAttribution(base, semee.chapitres[j].id, chapitre.eleves.map(([prenom, profil]) => ({ eleve: eleves[prenom].id, profil })));
      scenes.push(...semee.chapitres[j].scenes);
    }
  }
  // Un long chapitre de 32 scènes, et un chapitre vide
  const marais = await semerPartie(base, projet, "Le marais des feux follets", [
    { titre: "Le marais des feux follets", scenes: Array.from({ length: 32 }, (_, i) => `Marais — passage ${i + 1}`) },
    { titre: "La barque oubliée" },
  ], "foret");
  await semerAttribution(base, marais.chapitres[0].id, ["Hugo", "Inès", "Jade", "Kenza", "Léo", "Lina", "Malo", "Nahel"].map((p) => ({ eleve: eleves[p].id })));
  // Des textes écrits, pour les jalons et le dialogue de suppression
  for (const s of scenes.slice(0, 18)) await semerTexte(base, s, ["Lou avance dans la brume, la lanterne à la main."]);
  await base.from("scenes").update({ etat: "valide" }).in("id", scenes.slice(0, 6));
  await base.from("scenes").update({ etat: "valider" }).in("id", scenes.slice(6, 9));
  await base.from("chapitres").update({ hors_livre: true }).eq("id", marais.chapitres[1].id);

  const plan = `/projet/${projet}/plan`;
  await page.setViewportSize({ width: 1366, height: 768 });

  // L'écran d'aide, à la première ouverture
  await base.from("enseignants").update({ aides_masquees: [] }).eq("id", compte.id);
  await aller(page, plan);
  await page.getByRole("button", { name: "Commencer" }).waitFor();
  await capturer(page, "aide");
  await page.getByRole("button", { name: "Commencer" }).click();
  await capturer(page, "plan");
  await capturer(page, "plan-toute", true);

  // « À compléter » : un manque cliqué
  await page.locator(".reste__manques button").first().click();
  await page.waitForTimeout(600);
  await capturer(page, "a-completer-clique");

  // Recherche : des scènes, puis aucune
  await aller(page, plan);
  await page.getByPlaceholder("Rechercher une scène").fill("lanterne");
  await capturer(page, "recherche");
  await page.getByPlaceholder("Rechercher une scène").fill("dragon");
  await capturer(page, "recherche-vide");

  // Menus d'une partie et d'un chapitre
  await aller(page, plan);
  await page.locator('summary[aria-label^="Autres commandes de la partie"]').first().click();
  await capturer(page, "menu-partie");
  await fermer(page);
  await page.locator('summary[aria-label^="Autres commandes du chapitre"]').first().click();
  await capturer(page, "menu-chapitre");
  await page.getByRole("button", { name: "Réglages", exact: true }).click();
  await capturer(page, "reglages-chapitre");
  await fermer(page);
  await aller(page, plan);
  await page.locator('summary[aria-label^="Autres commandes du chapitre"]').first().click();
  await page.getByRole("button", { name: "Attribuer des élèves" }).click();
  await capturer(page, "attribuer");
  await fermer(page);

  // L'IA : la bande d'un chapitre ouverte, le panneau des idées de parties, avant toute demande
  await aller(page, plan);
  await page.getByRole("button", { name: /Demander des chapitres à l’IA/ }).first().click();
  await capturer(page, "chapitre-ia");
  await aller(page, plan);
  await page.getByRole("button", { name: "Demander des idées de parties à l’IA" }).click();
  await capturer(page, "idees-de-parties");
  await fermer(page);

  // Supprimer un chapitre écrit : le dialogue ; un chapitre vide : la corbeille
  await aller(page, plan);
  await page.locator('summary[aria-label="Autres commandes du chapitre La lisière"]').click({ timeout: 5000 }).catch(() => undefined);
  await page.getByRole("button", { name: "Supprimer" }).click({ timeout: 5000 }).catch(() => undefined);
  await capturer(page, "supprimer-dialogue");
  await fermer(page);
  await aller(page, plan);
  await page.locator('summary[aria-label="Autres commandes du chapitre La barque oubliée"]').click();
  await page.getByRole("button", { name: "Supprimer" }).click();
  await page.waitForTimeout(800);
  await capturer(page, "supprime-message");
  await page.getByRole("button", { name: /Corbeille du projet/ }).click({ timeout: 5000 }).catch(() => undefined);
  await capturer(page, "corbeille");
  await fermer(page);

  // Un projet neuf, puis un projet personnel
  const neuf = await semerProjet(base, compte, "classe", "choix", "Le grenier aux secrets", classe.id);
  await aller(page, `/projet/${neuf}/plan`);
  await capturer(page, "vide");
  const seul = await semerProjet(base, compte, "personnel", "classique", "Carnet de voyage");
  await semerPartie(base, seul, "Le départ", [{ titre: "La gare", scenes: ["Le quai", "Le train"] }], "cite");
  await aller(page, `/projet/${seul}/plan`);
  await capturer(page, "personnel");

  // Sur téléphone
  await page.setViewportSize({ width: 390, height: 844 });
  await aller(page, plan);
  await capturer(page, "390");
  await capturer(page, "390-toute", true);
  await page.getByPlaceholder("Rechercher une scène").fill("lanterne");
  await capturer(page, "390-recherche");
  await aller(page, plan);
  await page.locator('summary[aria-label^="Autres commandes du chapitre"]').first().click();
  await capturer(page, "390-menu-chapitre");
});
