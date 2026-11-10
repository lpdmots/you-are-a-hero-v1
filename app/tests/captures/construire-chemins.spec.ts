import { test, type Page } from "@playwright/test";
import { adultePret, aller, choixAuto, recit, semerAttribution, semerBlocs, semerClasse, semerPartie, semerProjet, sql, supprimerComptes } from "../parcours/outils";
import { poserLeMarais } from "../../scripts/marais-des-feux-follets";
import { ELEVES } from "../../scripts/passeurs-de-brume";

/**
 * Captures de « Construire dans Chemins » (F03.1, lot 2 : les gestes à la main), contre le serveur
 * local : npx playwright test --config playwright.local.config.ts construire-chemins
 * Elles s'écrivent dans test-results/captures/construire-chemins/. Ce n'est pas un test : rien
 * n'y est vérifié.
 */
const dossier = "test-results/captures/construire-chemins";
let n = 0;
const capturer = async (page: Page, nom: string) => {
  n += 1;
  await page.waitForTimeout(700);
  await page.screenshot({ path: `${dossier}/${String(n).padStart(2, "0")}-${nom}.png` });
};
const carte = (page: Page, titre: string) => page.locator(".carte-chemin", { hasText: titre });
const plus = (page: Page, titre: string) => page.getByRole("button", { name: `Ajouter une suite à « ${titre} »` });

test.afterEach(async () => {
  await supprimerComptes();
});

test("Construire dans « Chemins » : le « + », le lien tiré, le panneau, les suppressions, en 1440 et 1366 px", async ({ page }) => {
  test.setTimeout(400_000);
  await page.setViewportSize({ width: 1440, height: 900 });
  const { compte, base } = await adultePret(page);
  await base.from("enseignants").update({ nom_affiche: "Mme Laurent" }).eq("id", compte.id);
  const classe = await semerClasse(base, "CM1-CM2 d’essai", [...ELEVES]);
  const projet = await semerProjet(base, compte, "classe", "choix", "Les passeurs de brume", classe.id);
  const { partieId, chapitres } = await semerPartie(base, projet, "La forêt engloutie", [
    { titre: "La lisière", scenes: ["Clairière", "Le vieux pont", "La souche creuse", "Le gué"] },
    { titre: "Le moulin noyé", scenes: ["La roue du moulin"] },
    { titre: "Le sanctuaire", scenes: ["La grille du sanctuaire"] },
  ]);
  const [lisiere, moulin, sanctuaire] = chapitres;
  const [clairiere, pont, souche, gue] = lisiere.scenes;
  await semerAttribution(base, lisiere.id, [{ eleve: classe.eleves.Alice.id }, { eleve: classe.eleves.Bilal.id }]);
  await semerBlocs(base, clairiere, [recit("Le héros entre dans la clairière. Deux chemins s’ouvrent devant lui."), choixAuto("Traverser le pont", pont), choixAuto("Se cacher dans la souche", souche)]);
  await semerBlocs(base, pont, [recit("Le pont grince sous ses pas.")]);
  await base.from("scenes").update({ consigne: "Le héros arrive dans la clairière. Décris les deux chemins." }).eq("id", clairiere);
  const eleves = new Map(Object.entries(classe.eleves).map(([prenom, e]) => [prenom, e.id]));
  const marais = await poserLeMarais(sql, {
    projetId: projet, partieId, enseignantId: compte.id, ailleurs: { moulin: moulin.scenes[0], sanctuaire: sanctuaire.scenes[0] }, entreeDepuis: gue, eleves,
  });
  const chemins = (chapitre: string) => `/projet/${projet}/chapitre/${chapitre}?vue=chemins`;

  // ——— Le chapitre de trente-deux scènes ———
  await aller(page, chemins(marais.chapitreId));
  await carte(page, "Ponton — la voix du héron").waitFor();
  await page.waitForTimeout(600);
  await capturer(page, "ouverture");
  await page.getByRole("button", { name: "Comment lire ces chemins ?" }).click();
  await capturer(page, "aide");
  await page.keyboard.press("Escape");

  // Le « + » se montre sous la carte survolée
  await carte(page, "Ponton — la voix du héron").scrollIntoViewIfNeeded();
  await page.mouse.wheel(0, 260);
  await carte(page, "Ponton — la voix du héron").hover();
  await capturer(page, "survol-le-plus");

  // La bulle du « + » : vide, puis remplie
  await plus(page, "Ponton — la voix du héron").click();
  await capturer(page, "bulle-vide");
  await page.getByLabel("Ce que fait le lecteur").fill("Plonger dans la vase");
  await capturer(page, "bulle-choix-ecrit");
  await page.getByLabel("Nouvelle scène").fill("La vase profonde");
  await capturer(page, "bulle-remplie");
  await page.keyboard.press("Enter");
  await carte(page, "La vase profonde").waitFor();
  await capturer(page, "apres-l-ajout");
  await page.waitForTimeout(8500);
  await capturer(page, "apres-l-ajout-sans-message");

  // « Scène existante » : la liste du chapitre, à la place du titre
  await plus(page, "La vase profonde").click();
  await page.getByLabel("Ce que fait le lecteur").fill("S’agripper aux roseaux");
  await page.getByRole("button", { name: "Relier plutôt à une scène existante" }).click();
  await capturer(page, "bulle-scene-existante");
  await page.keyboard.press("Escape");

  // Le lien qu'on tire, d'une carte à l'autre ; puis la bulle qui demande son libellé
  const depart = (await plus(page, "La vase profonde").boundingBox())!;
  const arrivee = (await carte(page, "Tourbière — le sol qui tremble").boundingBox())!;
  await carte(page, "La vase profonde").hover();
  await page.mouse.move(depart.x + depart.width / 2, depart.y + depart.height / 2);
  await page.mouse.down();
  await page.mouse.move(depart.x + 60, depart.y + 60, { steps: 6 });
  await capturer(page, "lien-tire-en-route");
  await page.mouse.move(arrivee.x + arrivee.width / 2, arrivee.y + arrivee.height / 2, { steps: 12 });
  await capturer(page, "lien-tire-sur-la-carte");
  await page.mouse.up();
  await capturer(page, "bulle-du-lien");
  await page.getByLabel("Ce que fait le lecteur").fill("S’extraire de la vase");
  await page.keyboard.press("Enter");
  await page.waitForTimeout(1200);
  await capturer(page, "apres-le-lien");

  // Le panneau de la scène cliquée : titre, consigne, choix
  await page.waitForTimeout(8000);
  await carte(page, "Ponton — la voix du héron").click();
  await capturer(page, "panneau-scene-ecrite");
  await carte(page, "La vase profonde").click();
  await capturer(page, "panneau-scene-neuve");
  await page.getByLabel("Consigne").fill("Lou s’enfonce jusqu’aux genoux. Décris ce qu’elle sent sous ses pieds, et ce qu’elle voit autour d’elle.");
  await page.waitForTimeout(1600);
  await capturer(page, "panneau-consigne-enregistree");
  // « Ajouter » dans le panneau ouvre la même bulle
  await page.locator(".panneau-chemin").getByRole("button", { name: "Ajouter un choix" }).click();
  await capturer(page, "panneau-ajouter-un-choix");
  await page.keyboard.press("Escape");

  // Une scène aux choix variés : lien caché, autre chapitre, sans destination
  await page.keyboard.press("Escape");
  await carte(page, "Écluse").first().scrollIntoViewIfNeeded().catch(() => {});
  const variee = page.locator(".carte-chemin").filter({ has: page.locator(".carte-chemin__bande--regarder") }).first();
  await variee.scrollIntoViewIfNeeded();
  await variee.click();
  await capturer(page, "panneau-scene-a-regarder");

  // Supprimer un choix : le message et son « Annuler »
  await carte(page, "Ponton — la voix du héron").scrollIntoViewIfNeeded();
  await carte(page, "Ponton — la voix du héron").click();
  await page.getByRole("button", { name: "Supprimer le choix « Plonger dans la vase »" }).click();
  await page.waitForTimeout(900);
  await capturer(page, "choix-supprime");
  // Supprimer une scène écrite : la confirmation
  await page.locator(".panneau-chemin").getByRole("button", { name: "Supprimer la scène" }).click();
  await capturer(page, "confirmation-scene-ecrite");
  await page.keyboard.press("Escape");

  // De loin : le panneau reste, les « + » ne s'offrent plus
  await page.getByRole("button", { name: "Tout voir" }).click();
  await page.waitForTimeout(600);
  await capturer(page, "tout-voir");
  await page.getByRole("button", { name: "Taille lisible" }).click();

  // ——— Un petit chapitre : quatre scènes ———
  await aller(page, chemins(lisiere.id));
  await carte(page, "Clairière").waitFor();
  await capturer(page, "petit-chapitre");
  await carte(page, "Clairière").click();
  await capturer(page, "petit-chapitre-panneau");
  await plus(page, "Le vieux pont").click();
  await page.getByLabel("Ce que fait le lecteur").fill("Suivre le ruisseau");
  await capturer(page, "petit-chapitre-bulle");
  await page.keyboard.press("Enter");
  await page.waitForTimeout(1200);
  await capturer(page, "petit-chapitre-apres");

  // ——— En 1366 × 768, l'écran d'un portable d'école ———
  await page.setViewportSize({ width: 1366, height: 768 });
  await aller(page, chemins(marais.chapitreId));
  await carte(page, "Ponton — la voix du héron").waitFor();
  await page.mouse.wheel(0, 300);
  await carte(page, "Ponton — la voix du héron").click();
  await capturer(page, "1366-panneau");
  await plus(page, "Ponton — la voix du héron").click();
  await page.getByLabel("Ce que fait le lecteur").fill("Appeler la passeuse");
  await capturer(page, "1366-panneau-et-bulle");
});
