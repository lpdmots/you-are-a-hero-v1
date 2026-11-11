import { test, type Page } from "@playwright/test";
import { adultePret, aller, choixAuto, recit, semerAttribution, semerBlocs, semerClasse, semerPartie, semerProjet, sql, supprimerComptes } from "../parcours/outils";
import { poserLeMarais } from "../../scripts/marais-des-feux-follets";
import { ELEVES } from "../../scripts/passeurs-de-brume";

/**
 * Captures de la révision d'ergonomie de la vue « Chemins » du chapitre, côté adulte (novembre 2026), contre
 * le serveur local, sans recompiler : npx playwright test --config playwright.local.config.ts revision-chemins
 * Le serveur local a de vraies clés : aucun bouton ✦ n'est cliqué. Le bloc de scènes ne se voit qu'ouvert d'office
 * sur un chapitre vide (?bloc=debut), sans demande envoyée ; sa proposition n'est pas capturée.
 */
const dossier = "test-results/captures/chemins";
let n = 0;
const capturer = async (page: Page, nom: string) => {
  n += 1;
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${dossier}/${String(n).padStart(2, "0")}-${nom}.png` });
};
const carte = (page: Page, titre: string) => page.locator(".carte-chemin", { has: page.locator(".carte-chemin__titre", { hasText: titre }) });
const plus = (page: Page, titre: string) => page.getByRole("button", { name: `Ajouter une suite à « ${titre} »` });
const onglet = (page: Page, phrase: string) => page.locator(".onglet-chemin", { hasText: phrase });
const choix = (page: Page) => page.locator(".panneau-choix");
const scene = (page: Page) => page.locator(".panneau-chemin:not(.panneau-choix)");

// Une carte se choisit par sa tête : son milieu porte souvent les onglets de ses choix
const choisir = (page: Page, titre: string) => carte(page, titre).locator(".carte-chemin__titre").click();

test.use({ actionTimeout: 15_000 });

test.afterEach(async () => {
  await supprimerComptes();
});

test("Chemins, l'adulte : petit chapitre, marais de 32 scènes, travail, choix, « À regarder », tailles, vide, écrans", async ({ page }) => {
  test.setTimeout(400_000);
  await page.setViewportSize({ width: 1366, height: 768 });
  const { compte, base } = await adultePret(page);
  await base.from("enseignants").update({ nom_affiche: "Mme Laurent" }).eq("id", compte.id);
  const classe = await semerClasse(base, "CM1-CM2 d’essai", [...ELEVES]);
  const projet = await semerProjet(base, compte, "classe", "choix", "Les passeurs de brume", classe.id);
  const { partieId, chapitres } = await semerPartie(base, projet, "La forêt engloutie", [
    { titre: "La lisière", scenes: ["L’orée de la forêt", "Le vieux pont", "La souche creuse", "Le gué"] },
    { titre: "Le moulin noyé", scenes: ["La roue du moulin"] },
    { titre: "Le sanctuaire", scenes: ["La grille du sanctuaire"] },
    { titre: "La rivière", scenes: [] },
  ]);
  const [lisiere, moulin, sanctuaire, riviere] = chapitres;
  const [oree, pont, souche, gue] = lisiere.scenes;
  await semerAttribution(base, lisiere.id, [{ eleve: classe.eleves.Alice.id }, { eleve: classe.eleves.Bilal.id }]);
  await base.from("scenes").update({ prise_par_eleve: classe.eleves.Alice.id }).eq("id", oree);
  await semerBlocs(base, oree, [
    recit("Le héros arrive à l’orée de la forêt. Les arbres sont si hauts qu’on n’en voit pas la cime."),
    choixAuto("Traverser le vieux pont", pont),
    choixAuto("Se cacher dans la souche", souche),
    choixAuto("Rebrousser chemin", null),
  ]);
  await semerBlocs(base, pont, [recit("Le pont grince sous ses pas."), choixAuto("Passer le gué", gue)]);
  await base.from("scenes").update({ consigne: "Le héros arrive à l’orée de la forêt. Décris ce qu’il voit et ce qu’il entend." }).eq("id", oree);
  await base.from("projets").update({ depart_scene_id: oree }).eq("id", projet);
  const eleves = new Map(Object.entries(classe.eleves).map(([prenom, e]) => [prenom, e.id]));
  const marais = await poserLeMarais(sql, {
    projetId: projet, partieId, enseignantId: compte.id, ailleurs: { moulin: moulin.scenes[0], sanctuaire: sanctuaire.scenes[0] }, entreeDepuis: gue, eleves,
  });
  const chapitre = (id: string) => `/projet/${projet}/chapitre/${id}`;

  // ——— Le petit chapitre : le plan, le « i », le survol, le « + » ———
  await aller(page, chapitre(lisiere.id));
  await carte(page, "L’orée de la forêt").waitFor();
  await capturer(page, "lisiere-plan");
  await page.getByRole("button", { name: "Comment lire ces chemins ?" }).click();
  await capturer(page, "lisiere-le-i");
  await page.keyboard.press("Escape");
  await carte(page, "Le vieux pont").hover();
  await capturer(page, "lisiere-survol");
  await onglet(page, "Se cacher dans la souche").hover();
  await capturer(page, "lisiere-survol-d-un-onglet");
  await plus(page, "Le vieux pont").click();
  await capturer(page, "lisiere-bulle-vide");
  await page.getByLabel("Ce que fait le lecteur").fill("Longer la rive");
  await capturer(page, "lisiere-bulle-remplie");
  await page.keyboard.press("Escape");

  // ——— Tirer l'onglet « Sans destination » jusqu'à une carte (le geste en cours, puis abandonné) ———
  const source = (await onglet(page, "Rebrousser chemin").boundingBox())!;
  const cible = (await carte(page, "Le gué").boundingBox())!;
  await page.mouse.move(source.x + source.width / 2, source.y + source.height / 2);
  await page.mouse.down();
  await page.mouse.move(source.x + 60, source.y + 80, { steps: 8 });
  await page.mouse.move(cible.x + cible.width / 2, cible.y + 20, { steps: 10 });
  await capturer(page, "lisiere-tirer-un-onglet");
  await page.keyboard.press("Escape");
  await page.mouse.up();

  // ——— Le travail : une carte cliquée, une autre, « Ajouter un choix », le choix ouvert par son onglet ———
  await aller(page, chapitre(lisiere.id));
  await carte(page, "L’orée de la forêt").waitFor();
  await carte(page, "L’orée de la forêt").click();
  await capturer(page, "clic-au-milieu-de-la-carte");
  await page.keyboard.press("Escape");
  await page.keyboard.press("Escape");
  await choisir(page, "L’orée de la forêt");
  await capturer(page, "travail-scene");
  await scene(page).getByRole("button", { name: "Ajouter un choix" }).click();
  await capturer(page, "travail-ajouter-un-choix");
  await page.keyboard.press("Escape");
  await choisir(page, "Le vieux pont");
  await capturer(page, "travail-autre-scene");
  await onglet(page, "Rebrousser chemin").click();
  await choix(page).getByLabel("Ce que fait le lecteur").waitFor();
  await capturer(page, "travail-choix-sans-destination");
  await choix(page).getByRole("button", { name: /Revenir à la scène/ }).click();
  await page.waitForTimeout(300);
  await scene(page).getByRole("button", { name: /Supprimer la scène/ }).click();
  await capturer(page, "travail-supprimer-la-scene");
  await page.keyboard.press("Escape");
  await page.keyboard.press("Escape");
  await page.keyboard.press("Escape");
  await capturer(page, "retour-au-plan");

  // ——— Le marais : plan, « À regarder », le fond tiré, la molette, « Tout voir », « Taille lisible » ———
  await aller(page, chapitre(marais.chapitreId));
  await carte(page, "Ponton — la voix du héron").waitFor();
  await capturer(page, "marais-plan");
  await page.getByRole("button", { name: "Suivant" }).click();
  await capturer(page, "marais-a-regarder-1");
  await page.getByRole("button", { name: "Suivant" }).click();
  await capturer(page, "marais-a-regarder-2");
  await page.keyboard.press("Escape");
  const fond = (await page.locator(".chemins__cadre").boundingBox())!;
  await page.mouse.move(fond.x + 60, fond.y + fond.height - 60);
  await page.mouse.down();
  await page.mouse.move(fond.x + 260, fond.y + 120, { steps: 10 });
  await page.mouse.up();
  await capturer(page, "marais-fond-tire");
  await page.getByRole("button", { name: "Tout voir" }).click();
  await capturer(page, "marais-tout-voir");
  await carte(page, "Ponton — la voix du héron").hover({ force: true });
  await capturer(page, "marais-tout-voir-survol");
  await page.getByRole("button", { name: "Taille lisible" }).click();
  await capturer(page, "marais-taille-lisible");

  // ——— Le marais au travail : une scène à plusieurs choix, un choix ouvert, « Changer… » ———
  await aller(page, chapitre(marais.chapitreId));
  await carte(page, "Marais — la barque s’enlise").waitFor();
  await page.waitForTimeout(600);
  await choisir(page, "Marais — la barque s’enlise");
  await capturer(page, "marais-travail");
  await onglet(page, "Longer la vieille digue").click();
  await choix(page).getByLabel("Ce que fait le lecteur").waitFor();
  await capturer(page, "marais-choix-ouvert");
  await choix(page).getByRole("button", { name: "Changer…" }).click();
  await capturer(page, "marais-changer");
  await page.keyboard.press("Escape");
  await page.keyboard.press("Escape");
  // Une autre scène, puis un ajout par le « + », le message et « Annuler »
  await choisir(page, "Ponton — la voix du héron");
  await capturer(page, "marais-travail-autre");
  await plus(page, "Ponton — la voix du héron").click();
  await page.getByLabel("Ce que fait le lecteur").fill("Plonger sous le ponton");
  await page.getByLabel("Nouvelle scène").fill("Sous le ponton");
  await capturer(page, "marais-bulle-du-plus");
  await page.keyboard.press("Enter");
  await carte(page, "Sous le ponton").waitFor();
  await capturer(page, "marais-apres-l-ajout");

  // ——— Le chapitre vide, puis le bloc ouvert d'office (aucune demande envoyée) ———
  await aller(page, chapitre(riviere.id));
  await page.locator(".vide-chap").waitFor();
  await capturer(page, "vide");
  await aller(page, `${chapitre(riviere.id)}?bloc=debut`);
  await page.locator(".panneau-bloc").waitFor();
  await capturer(page, "vide-bloc-ouvert");

  // ——— En 1440 × 900 et 1024 × 768 ———
  await page.setViewportSize({ width: 1440, height: 900 });
  await aller(page, chapitre(marais.chapitreId));
  await carte(page, "Ponton — la voix du héron").waitFor();
  await capturer(page, "1440-marais-plan");
  await choisir(page, "Ponton — la voix du héron");
  await capturer(page, "1440-marais-travail");
  await page.setViewportSize({ width: 1024, height: 768 });
  await aller(page, chapitre(lisiere.id));
  await carte(page, "L’orée de la forêt").waitFor();
  await capturer(page, "1024-plan");
  await choisir(page, "L’orée de la forêt");
  await capturer(page, "1024-travail");

  // ——— Téléphone : la liste ———
  await page.setViewportSize({ width: 390, height: 844 });
  await aller(page, chapitre(lisiere.id));
  await page.locator(".chemins__liste").waitFor();
  await capturer(page, "390-lisiere");
  await aller(page, chapitre(marais.chapitreId));
  await page.locator(".chemins__liste").waitFor();
  await capturer(page, "390-marais");
  await page.screenshot({ path: `${dossier}/${String((n += 1)).padStart(2, "0")}-390-marais-toute.png`, fullPage: true });
});
