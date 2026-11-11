import { test, type Page } from "@playwright/test";
import { adultePret, aller, choixAuto, liaison, recit, semerAttribution, semerBlocs, semerClasse, semerPartie, semerProjet, semerTexte, sql, supprimerComptes } from "../parcours/outils";
import { ELEVES } from "../../scripts/passeurs-de-brume";

/**
 * Captures de la révision d'ergonomie de la vue « Scènes » du chapitre, depuis « Chemins en atelier » (en-tête en une bande,
 * « Nouvelle scène » en dernière carte), contre le serveur local, sans recompiler :
 * npx playwright test --config playwright.local.config.ts revision-vue-scenes
 * Aucun bouton ✦ n'est cliqué : le serveur local a de vraies clés.
 */
const dossier = "test-results/captures/vue-scenes";
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

test("Vue « Scènes » du chapitre : états, 32 scènes, beaucoup d'élèves, vide, menus, recherche, personnel, 390 px", async ({ page }) => {
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
        "Le terrier abandonné", "", "Sous la cascade, la grotte aux lucioles qui chantent quand on s’approche trop près",
      ],
    },
    { titre: "Le marais des feux follets", scenes: Array.from({ length: 32 }, (_, i) => `Marais — passage ${i + 1}`) },
    { titre: "Les racines" },
    { titre: "La clairière", scenes: ["Le cercle de pierres", "La source"] },
  ]);
  const [lisiere, marais, racines, clairiereChap] = chapitres;
  const [sentier, souche, chouette, clairiere, pont, gue, terrier, sansTitre, cascade] = lisiere.scenes;
  await semerAttribution(base, lisiere.id, [{ eleve: e.Alice.id }, { eleve: e.Bilal.id }, { eleve: e.Chloé.id }, { eleve: e.Dylan.id, profil: "organisation" }]);
  // Un grand groupe : neuf élèves dans le marais
  await semerAttribution(base, marais.id, ["Hugo", "Inès", "Jade", "Kenza", "Léo", "Lina", "Malo", "Nahel", "Océane"].map((p) => ({ eleve: e[p].id })));
  await base.from("scenes").update({ prise_par_eleve: e.Alice.id }).in("id", [sentier, clairiere]);
  await base.from("scenes").update({ prise_par_eleve: e.Bilal.id }).in("id", [souche, chouette]);
  await base.from("scenes").update({ prise_par_eleve: e.Chloé.id }).eq("id", gue);
  await base.from("scenes").update({ prise_par_enseignant: true }).eq("id", pont);
  await base.from("scenes").update({ consigne: "Lou se cache dans une souche creuse et allume la lanterne de secours." }).in("id", [souche, chouette, clairiere, pont, gue, cascade]);
  await semerBlocs(base, sentier, [recit("Un chant montait des fougères."), choixAuto("Suivre le chant", souche), choixAuto("Prendre le pont", pont)]);
  await semerBlocs(base, souche, [recit("Lou se glissa dans la souche creuse."), choixAuto("Sortir", clairiere), choixAuto("Rester caché", chouette)]);
  await semerTexte(base, chouette, ["La chouette tenait un message dans son bec."]);
  await semerBlocs(base, clairiere, [recit("Les deux chemins se rejoignaient."), liaison(gue, "La suite")]);
  await semerTexte(base, pont, ["Sur le pont de brume, une silhouette apparut."]);
  await semerTexte(base, gue, ["L’eau murmurait des noms oubliés."]);
  await sql("update scenes set etat = 'valider' where id = $1", [souche]);
  await sql("update scenes set etat = 'valide' where id = $1", [chouette]);
  await sql("update scenes set etat = 'reprendre' where id = $1", [clairiere]);
  await sql("update scenes set etat = 'prete' where id = $1", [gue]);
  await sql("update scenes set fin = true where id = $1", [pont]);
  await sql("update scenes set hors_livre = true where id = $1", [terrier]);
  await base.from("projets").update({ depart_scene_id: sentier }).eq("id", projet);
  for (const s of marais.scenes.slice(0, 12)) await semerTexte(base, s, ["Les feux follets dansaient sur l’eau noire."]);
  await sql("update scenes set etat = 'valide' where id = any($1)", [marais.scenes.slice(0, 5)]);
  await sql("update scenes set etat = 'valider' where id = any($1)", [marais.scenes.slice(5, 8)]);
  void sansTitre;

  const vueScenes = (c: string) => `/projet/${projet}/chapitre/${c}?vue=scenes`;
  const page6 = vueScenes(lisiere.id);
  await page.setViewportSize({ width: 1366, height: 768 });

  await aller(page, page6);
  await capturer(page, "lisiere");
  await capturer(page, "lisiere-toute", true);
  // La même bande dans « Chemins », pour la bascule qui ne doit pas bouger
  await aller(page, `/projet/${projet}/chapitre/${lisiere.id}`);
  await page.waitForTimeout(1200);
  await capturer(page, "lisiere-chemins");

  // Les menus : le chapitre, une scène (en haut, puis en bas de l'écran), qui s'en occupe, le « i »
  await aller(page, page6);
  await page.locator('summary[aria-label^="Autres commandes du chapitre"]').first().click();
  await capturer(page, "menu-chapitre");
  await echap(page);
  await page.locator('summary[aria-label^="Autres commandes de la scène"]').first().click();
  await capturer(page, "menu-scene");
  await echap(page);
  await page.locator('summary[aria-label^="Autres commandes de la scène"]').nth(5).scrollIntoViewIfNeeded();
  await page.locator('summary[aria-label^="Autres commandes de la scène"]').nth(5).click();
  await capturer(page, "menu-scene-bas");
  await echap(page);
  await aller(page, page6);
  await page.getByText(/s’en occupe/).first().click();
  await capturer(page, "menu-qui");
  await echap(page);
  await aller(page, page6);
  await page.getByRole("button", { name: /Que change l’ordre des cartes/ }).click();
  await capturer(page, "bulle-ordre");
  await echap(page);

  // Survol d'une carte, tirer une carte
  await aller(page, page6);
  await page.locator(".fiche").nth(1).hover();
  await capturer(page, "survol");
  const prise = page.locator(".prise").first();
  const a = (await prise.boundingBox())!;
  await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2);
  await page.mouse.down();
  await page.mouse.move(a.x + 120, a.y + 60, { steps: 8 });
  await page.mouse.move(a.x + 320, a.y + 130, { steps: 8 });
  await capturer(page, "tirer");
  await page.keyboard.press("Escape");
  await page.mouse.up();

  // Attribuer, la recherche, une scène ajoutée
  await aller(page, page6);
  await page.locator(".chap-eleves--bouton").click();
  await capturer(page, "attribuer");
  await echap(page);
  await aller(page, page6);
  await page.getByPlaceholder("Chercher un titre").fill("souche");
  await capturer(page, "recherche");
  await page.getByPlaceholder("Chercher un titre").fill("dragon");
  await capturer(page, "recherche-vide");
  await aller(page, page6);
  await page.getByRole("button", { name: "Nouvelle scène" }).click();
  await page.waitForTimeout(1200);
  await capturer(page, "scene-ajoutee");

  // Le long chapitre et son grand groupe, le chapitre de deux scènes, le chapitre vide
  await aller(page, vueScenes(marais.id));
  await capturer(page, "marais");
  await capturer(page, "marais-toute", true);
  await page.mouse.wheel(0, 2400);
  await capturer(page, "marais-bas");
  await aller(page, vueScenes(clairiereChap.id));
  await capturer(page, "deux-scenes");
  await aller(page, `/projet/${projet}/chapitre/${racines.id}`);
  await capturer(page, "vide");

  // La bascule ailleurs : le Suivi, ses deux vues et la sélection d'un élève
  await aller(page, `/projet/${projet}/suivi?direct=1&eleve=${e.Alice.id}`);
  await capturer(page, "suivi-bascules");

  // À 1024 points, la bande
  await page.setViewportSize({ width: 1024, height: 768 });
  await aller(page, vueScenes(marais.id));
  await capturer(page, "1024-marais");
  await page.setViewportSize({ width: 1366, height: 768 });

  // Projet personnel, récit classique
  const seul = await semerProjet(base, compte, "personnel", "classique", "Carnet de voyage");
  const perso = await semerPartie(base, seul, "Le départ", [{ titre: "La gare", scenes: ["Le quai", "Le train", "La valise", "Le contrôleur", "La correspondance"] }], "cite");
  await semerTexte(base, perso.chapitres[0].scenes[0], ["Le train entra en gare."]);
  await sql("update scenes set etat = 'valide' where id = $1", [perso.chapitres[0].scenes[0]]);
  await aller(page, `/projet/${seul}/chapitre/${perso.chapitres[0].id}`);
  await capturer(page, "personnel");

  // Téléphone
  await page.setViewportSize({ width: 390, height: 844 });
  await aller(page, page6);
  await capturer(page, "390");
  await capturer(page, "390-toute", true);
  await page.locator('summary[aria-label^="Autres commandes du chapitre"]').first().click();
  await capturer(page, "390-menu-chapitre");
  await echap(page);
  await page.locator('summary[aria-label^="Autres commandes de la scène"]').first().click();
  await capturer(page, "390-menu-scene");
  await echap(page);
  await aller(page, vueScenes(marais.id));
  await capturer(page, "390-marais");
  await aller(page, `/projet/${projet}/chapitre/${racines.id}`);
  await capturer(page, "390-vide");
});
