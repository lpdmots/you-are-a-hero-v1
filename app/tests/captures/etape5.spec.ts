import { test, type Page } from "@playwright/test";
import { poserLeMarais, type Requete } from "../../scripts/marais-des-feux-follets";
import { adultePret, aller, choixAuto, classeQuiEcrit, posteDe, recit, semerAttribution, semerBlocs, semerPartie, semerProjet, sql, supprimerComptes } from "../parcours/outils";

/**
 * Captures des écrans de l'étape 5 : npm run captures -- etape5
 * Elles s'écrivent dans test-results/captures/. Ce n'est pas un test : rien n'y est vérifié.
 */
const dossier = "test-results/captures";
let n = 500;
const capturer = async (page: Page, nom: string, toute = true) => {
  n += 1;
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${dossier}/${n}-${nom}.png`, fullPage: toute });
};

test.afterEach(async () => {
  await supprimerComptes();
});

test("lot 4 : départ de la lecture d'essai de l'élève", async ({ page, browser }) => {
  test.setTimeout(300_000);
  n = 500;
  const s = await classeQuiEcrit(page, ["Alice", "Bilal", "Chloé", "Adam"]);
  const [sentier, pont] = s.lisiere.scenes;
  const [autel] = s.sanctuaire.scenes;
  const tour = await semerPartie(s.base, s.projet, "La tour", [{ titre: "Le phare", scenes: ["La porte aux symboles", "Le sommet"] }], "montagne");
  const [porte, sommet] = tour.chapitres[0].scenes;
  await semerAttribution(s.base, tour.chapitres[0].id, [{ eleve: s.eleves.Bilal.id }]);
  await s.base.from("scenes").update({ titre: "Sentier — le chant dans les fougères" }).eq("id", sentier);
  await s.base.from("scenes").update({ titre: "Pont de brume — le passeur apparaît" }).eq("id", pont);
  await semerBlocs(s.base, sentier, [recit("Un chant montait des fougères, si doux que Lou s’arrêta pour l’écouter."), choixAuto("Traverser le pont", pont), choixAuto("Entrer au sanctuaire", autel)]);
  await semerBlocs(s.base, pont, [recit("Le pont craquait sous les pas de Lou. Au milieu, une lanterne brillait."), choixAuto("Suivre la lanterne", null)]);
  await semerBlocs(s.base, autel, [recit("L’autel était couvert de mousse.")]);
  await semerBlocs(s.base, porte, [recit("Trois symboles sur la porte."), choixAuto("Monter au sommet", sommet)]);
  await semerBlocs(s.base, sommet, [recit("La lanterne s’allume.")]);
  await s.base.from("projets").update({ depart_scene_id: sentier }).eq("id", s.projet);

  // Alice : un seul chapitre
  const alice = await posteDe(browser, s, "Alice");
  await alice.page.setViewportSize({ width: 1366, height: 860 });
  await aller(alice.page, "/travail");
  await capturer(alice.page, "eleve-mon-travail-entree", false);
  await alice.page.getByRole("link", { name: "Lire à l’essai" }).click();
  await alice.page.waitForURL(/\/travail\/lecture\//);
  await capturer(alice.page, "eleve-depart-un-chapitre");
  await alice.page.getByPlaceholder("Chercher une scène à lire").fill("lanterne");
  await alice.page.waitForTimeout(900);
  await capturer(alice.page, "eleve-depart-recherche");
  await alice.page.getByPlaceholder("Chercher une scène à lire").fill("dragon");
  await alice.page.waitForTimeout(900);
  await capturer(alice.page, "eleve-depart-recherche-vide");
  await alice.page.getByPlaceholder("Chercher une scène à lire").fill("");
  await alice.page.getByRole("link", { name: "Commencer au début de La lisière" }).click();
  await alice.page.waitForURL(/depart=/);
  await capturer(alice.page, "eleve-lecture-passage");
  await alice.page.getByRole("button", { name: /Entrer au sanctuaire/ }).click();
  await capturer(alice.page, "eleve-lecture-sortie");
  await alice.page.getByRole("button", { name: "Passage précédent" }).click();
  await alice.page.getByRole("button", { name: /Traverser le pont/ }).click();
  await capturer(alice.page, "eleve-lecture-pas-encore-de-suite");
  await alice.page.setViewportSize({ width: 390, height: 844 });
  await aller(alice.page, `/travail/lecture/${s.projet}`);
  await capturer(alice.page, "eleve-depart-390");
  await alice.contexte.close();

  // Bilal : deux chapitres
  const bilal = await posteDe(browser, s, "Bilal");
  await bilal.page.setViewportSize({ width: 1366, height: 860 });
  await aller(bilal.page, `/travail/lecture/${s.projet}`);
  await capturer(bilal.page, "eleve-depart-deux-chapitres");
  await bilal.page.setViewportSize({ width: 390, height: 844 });
  await capturer(bilal.page, "eleve-depart-deux-chapitres-390");
  await bilal.contexte.close();

  // La lecture ouverte : le départ du livre, en premier
  await s.base.from("projets").update({ lecture_ouverte: true }).eq("id", s.projet);
  const chloe = await posteDe(browser, s, "Chloé");
  await chloe.page.setViewportSize({ width: 1366, height: 860 });
  await aller(chloe.page, `/travail/lecture/${s.projet}`);
  await capturer(chloe.page, "eleve-depart-lecture-ouverte");
  await chloe.page.setViewportSize({ width: 390, height: 844 });
  await capturer(chloe.page, "eleve-depart-lecture-ouverte-390");
  await chloe.contexte.close();

  // Adam : aucun chapitre, lecture fermée
  await s.base.from("projets").update({ lecture_ouverte: false }).eq("id", s.projet);
  const adam = await posteDe(browser, s, "Adam");
  await adam.page.setViewportSize({ width: 1366, height: 860 });
  await aller(adam.page, "/travail/lecture");
  await capturer(adam.page, "eleve-lecture-sans-chapitre");
  await adam.contexte.close();
});

test("lot 5 : mini-carte repliable, « Sans destination » en ambre", async ({ page }) => {
  test.setTimeout(240_000);
  n = 520;
  const { compte, base } = await adultePret(page);
  const projet = await semerProjet(base, compte, "personnel", "choix", "Les passeurs de brume");
  const { partieId, chapitres } = await semerPartie(base, projet, "La forêt", [{ titre: "La lisière", scenes: ["Le sentier", "Le pont"] }]);
  const [sentier, pont] = chapitres[0].scenes;
  await base.from("projets").update({ depart_scene_id: sentier }).eq("id", projet);
  await semerBlocs(base, sentier, [recit("Un chant montait des fougères."), choixAuto("Traverser le pont", pont), choixAuto("Suivre le héron", null)]);
  const pose = await poserLeMarais(sql as Requete, { projetId: projet, partieId, enseignantId: compte.id, ailleurs: { moulin: pont, sanctuaire: pont }, entreeDepuis: sentier });
  await page.setViewportSize({ width: 1366, height: 860 });
  await aller(page, `/projet/${projet}/chapitre/${pose.chapitreId}?vue=chemins`);
  await page.locator(".chemins__toile[data-dessine]").waitFor();
  await page.evaluate(() => window.scrollTo(0, 1100));
  await capturer(page, "chemins-mini-carte", false);
  await page.getByRole("button", { name: "Replier la mini-carte" }).click();
  await capturer(page, "chemins-mini-carte-repliee", false);
  await aller(page, `/projet/${projet}/scene/${sentier}`);
  await capturer(page, "scene-sans-destination-ambre", false);
});
