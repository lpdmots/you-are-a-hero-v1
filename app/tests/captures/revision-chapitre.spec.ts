import { test, type Page } from "@playwright/test";
import { adultePret, aller, choixAuto, liaison, recit, semerAttribution, semerBlocs, semerClasse, semerPartie, semerProjet, semerTexte, sql, supprimerComptes } from "../parcours/outils";
import { ELEVES } from "../../scripts/passeurs-de-brume";

/**
 * Captures de la révision d'ergonomie de la page du chapitre, vue « Scènes » (novembre 2026), contre
 * le serveur local : npx playwright test --config playwright.local.config.ts revision-chapitre
 * La vue « Chemins » est hors de la révision (elle sera retravaillée). Rien n'y est vérifié.
 */
const dossier = "test-results/captures/chapitre";
let n = 0;
const capturer = async (page: Page, nom: string, toute = false) => {
  n += 1;
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${dossier}/${String(n).padStart(2, "0")}-${nom}.png`, fullPage: toute });
};
const echap = async (page: Page) => {
  await page.keyboard.press("Escape");
  await page.waitForTimeout(200);
};

test.afterEach(async () => {
  await supprimerComptes();
});

test("Page du chapitre : six scènes dans leurs états, un chapitre de 32 scènes, un chapitre vide, en 1366 et 390 px", async ({ page }) => {
  test.setTimeout(400_000);
  const { compte, base } = await adultePret(page);
  await base.from("enseignants").update({ nom_affiche: "Mme Laurent" }).eq("id", compte.id);
  const classe = await semerClasse(base, "CM1-CM2 d’essai", [...ELEVES]);
  const e = classe.eleves;
  const projet = await semerProjet(base, compte, "classe", "choix", "Les passeurs de brume", classe.id);
  const { chapitres } = await semerPartie(base, projet, "La forêt engloutie", [
    {
      titre: "La lisière",
      scenes: [
        "Sentier — le chant dans les fougères", "Souche creuse — la lanterne de secours", "Souche — la chouette messagère",
        "Clairière — les deux chemins se rejoignent", "Pont de brume — le passeur apparaît", "Gué — l’eau qui murmure",
      ],
    },
    { titre: "Le marais des feux follets", scenes: Array.from({ length: 32 }, (_, i) => `Marais — passage ${i + 1}`) },
    { titre: "Les racines" },
  ]);
  const [lisiere, marais, racines] = chapitres;
  const [sentier, souche, chouette, clairiere, pont, gue] = lisiere.scenes;
  await semerAttribution(base, lisiere.id, [{ eleve: e.Alice.id }, { eleve: e.Bilal.id }, { eleve: e.Chloé.id }, { eleve: e.Dylan.id, profil: "organisation" }]);
  await semerAttribution(base, marais.id, ["Hugo", "Inès", "Jade", "Kenza", "Léo", "Lina"].map((p) => ({ eleve: e[p].id })));
  await base.from("scenes").update({ prise_par_eleve: e.Alice.id }).in("id", [sentier, clairiere]);
  await base.from("scenes").update({ prise_par_eleve: e.Bilal.id }).in("id", [souche, chouette]);
  await base.from("scenes").update({ prise_par_enseignant: true }).eq("id", pont);
  await base.from("scenes").update({ consigne: "Lou se cache dans une souche creuse et allume la lanterne de secours." }).eq("id", souche);
  await semerBlocs(base, sentier, [recit("Un chant montait des fougères."), choixAuto("Suivre le chant", souche), choixAuto("Prendre le pont", pont)]);
  await semerBlocs(base, souche, [recit("Lou se glissa dans la souche creuse."), choixAuto("Sortir", clairiere), choixAuto("Rester caché", chouette)]);
  await semerTexte(base, chouette, ["La chouette tenait un message dans son bec."]);
  await semerBlocs(base, clairiere, [recit("Les deux chemins se rejoignaient."), liaison(gue, "La suite")]);
  await semerTexte(base, pont, ["Sur le pont de brume, une silhouette apparut."]);
  await sql("update scenes set etat = 'valider' where id = $1", [souche]);
  await sql("update scenes set etat = 'valide' where id = $1", [chouette]);
  await sql("update scenes set etat = 'reprendre' where id = $1", [clairiere]);
  await sql("update scenes set fin = true where id = $1", [pont]);
  await base.from("projets").update({ depart_scene_id: sentier }).eq("id", projet);
  for (const s of marais.scenes.slice(0, 12)) await semerTexte(base, s, ["Les feux follets dansaient sur l’eau noire."]);

  const page6 = `/projet/${projet}/chapitre/${lisiere.id}`;
  await page.setViewportSize({ width: 1366, height: 768 });

  await aller(page, page6);
  await capturer(page, "chapitre");
  await capturer(page, "chapitre-toute", true);

  // Les menus : le chapitre, une scène, qui s'en occupe
  await page.locator('summary[aria-label^="Autres commandes du chapitre"]').first().click();
  await capturer(page, "menu-chapitre");
  await echap(page);
  await page.locator('summary[aria-label^="Autres commandes de la scène"]').first().click();
  await capturer(page, "menu-scene");
  await echap(page);
  await page.getByText(/s’en occupe/).first().click();
  await capturer(page, "menu-qui");
  await echap(page);

  // Attribuer, la recherche, une scène ajoutée
  await aller(page, page6);
  await page.getByRole("button", { name: "Attribuer des élèves" }).first().click();
  await capturer(page, "attribuer");
  await echap(page);
  await aller(page, page6);
  await page.getByPlaceholder("Rechercher dans ce chapitre").fill("souche");
  await capturer(page, "recherche");
  await page.getByPlaceholder("Rechercher dans ce chapitre").fill("dragon");
  await capturer(page, "recherche-vide");
  await aller(page, page6);
  await page.getByRole("button", { name: "Ajouter une scène" }).first().click();
  await page.waitForTimeout(900);
  await capturer(page, "scene-ajoutee");

  // Le long chapitre, le chapitre vide
  await aller(page, `/projet/${projet}/chapitre/${marais.id}`);
  await capturer(page, "long");
  await capturer(page, "long-toute", true);
  await aller(page, `/projet/${projet}/chapitre/${racines.id}`);
  await capturer(page, "vide");

  // Projet personnel
  const seul = await semerProjet(base, compte, "personnel", "classique", "Carnet de voyage");
  const perso = await semerPartie(base, seul, "Le départ", [{ titre: "La gare", scenes: ["Le quai", "Le train", "La valise"] }], "cite");
  await semerTexte(base, perso.chapitres[0].scenes[0], ["Le train entra en gare."]);
  await aller(page, `/projet/${seul}/chapitre/${perso.chapitres[0].id}`);
  await capturer(page, "personnel");

  // Téléphone
  await page.setViewportSize({ width: 390, height: 844 });
  await aller(page, page6);
  await capturer(page, "390");
  await capturer(page, "390-toute", true);
  await page.locator('summary[aria-label^="Autres commandes du chapitre"]').first().click();
  await capturer(page, "390-menu-chapitre");
});
