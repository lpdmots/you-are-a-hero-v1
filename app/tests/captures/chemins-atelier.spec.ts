import { test, type Browser, type Page } from "@playwright/test";
import {
  adultePret, aller, choixAuto, classeQuiEcrit, posteDe, recit, semerAttribution, semerBlocs, semerClasse, semerPartie, semerProjet, sql, supprimerComptes,
} from "../parcours/outils";
import { poserLeMarais } from "../../scripts/marais-des-feux-follets";
import { ELEVES } from "../../scripts/passeurs-de-brume";

/**
 * Captures de « Chemins en atelier » (F03.1, 11 novembre 2026) : le cadre qu'on tire, les deux
 * états (plan et travail), l'en-tête en une bande, les commandes sur le cadre, « Chemins » ouvert
 * en premier. Contre le serveur des captures, en IA simulée (aucun appel payé) :
 * npm run captures -- chemins-atelier
 * ou contre le serveur local lancé en IA simulée (« application-ia-simulee » de .claude/launch.json) :
 * npx playwright test --config playwright.local.config.ts chemins-atelier
 * Elles s'écrivent dans test-results/captures/chemins-atelier/. Ce n'est pas un test : rien n'y est vérifié.
 */
const dossier = "test-results/captures/chemins-atelier";
let n = 0;
const capturer = async (page: Page, nom: string) => {
  n += 1;
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${dossier}/${String(n).padStart(2, "0")}-${nom}.png` });
};
const carte = (page: Page, titre: string) => page.locator(".carte-chemin", { hasText: titre });
const plus = (page: Page, titre: string) => page.getByRole("button", { name: `Ajouter une suite à « ${titre} »` });
const bloc = (page: Page) => page.locator(".panneau-bloc");

test.afterEach(async () => {
  await supprimerComptes();
});

test("Chemins en atelier, l'adulte : plan, travail, bloc, « Scènes », en 1366 et 1440 px", async ({ page }) => {
  test.setTimeout(240_000);
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
  await semerBlocs(base, oree, [
    recit("Le héros arrive à l’orée de la forêt. Les arbres sont si hauts qu’on n’en voit pas la cime."),
    choixAuto("Traverser le vieux pont", pont),
    choixAuto("Se cacher dans la souche", souche),
  ]);
  await semerBlocs(base, pont, [recit("Le pont grince sous ses pas."), choixAuto("Passer le gué", gue)]);
  await base.from("scenes").update({ consigne: "Le héros arrive à l’orée de la forêt. Décris ce qu’il voit et ce qu’il entend." }).eq("id", oree);
  const eleves = new Map(Object.entries(classe.eleves).map(([prenom, e]) => [prenom, e.id]));
  const marais = await poserLeMarais(sql, {
    projetId: projet, partieId, enseignantId: compte.id, ailleurs: { moulin: moulin.scenes[0], sanctuaire: sanctuaire.scenes[0] }, entreeDepuis: gue, eleves,
  });
  const chapitre = (id: string) => `/projet/${projet}/chapitre/${id}`;

  // ——— Un petit chapitre : « Chemins » s'ouvre en premier ; le plan ———
  await aller(page, chapitre(lisiere.id));
  await carte(page, "L’orée de la forêt").waitFor();
  await capturer(page, "plan-petit-chapitre");
  await page.getByRole("button", { name: "Comment lire ces chemins ?" }).click();
  await capturer(page, "plan-le-i");
  await page.keyboard.press("Escape");
  await carte(page, "Le vieux pont").hover();
  await capturer(page, "plan-survol-le-plus");
  await plus(page, "Le vieux pont").click();
  await page.getByLabel("Ce que fait le lecteur").fill("Longer la rive");
  await capturer(page, "plan-bulle-du-plus");
  await page.keyboard.press("Escape");

  // ——— Le travail : une carte cliquée, puis une autre ———
  await carte(page, "L’orée de la forêt").click();
  await capturer(page, "travail-scene");
  await carte(page, "Le vieux pont").click();
  await capturer(page, "travail-autre-scene");
  await page.locator(".panneau-chemin").getByRole("button", { name: "Ajouter un choix" }).click();
  await capturer(page, "travail-ajouter-un-choix");
  await page.keyboard.press("Escape");
  await page.keyboard.press("Escape");
  await capturer(page, "retour-au-plan");

  // ——— Le bloc : depuis le plan (aucune scène choisie), puis la demande seule, puis la proposition ———
  await page.getByRole("button", { name: "Construire avec l’IA" }).click();
  await capturer(page, "bloc-sans-scene");
  await carte(page, "La souche creuse").click();
  await capturer(page, "bloc-demande-seule");
  await bloc(page).getByRole("textbox").first().fill("Le héros sort de la souche : trois chemins s’offrent à lui, le sentier des fougères, le ruisseau, la grotte rejoint Le vieux pont");
  await capturer(page, "bloc-demande-ecrite");
  await bloc(page).getByRole("button", { name: "Proposer" }).click();
  await page.locator(".carte-chemin--proposee").first().waitFor();
  await page.waitForTimeout(900);
  await capturer(page, "bloc-proposition");
  await bloc(page).getByRole("button", { name: /^Ajouter \d/ }).click();
  await page.locator(".carte-chemin--proposee").first().waitFor({ state: "detached" });
  await capturer(page, "bloc-apres-l-ajout");
  await page.waitForTimeout(8500);

  // ——— « Scènes » : l'en-tête en une bande, « + Nouvelle scène » en dernière carte ———
  await page.getByRole("button", { name: "Scènes", exact: true }).click();
  await page.locator(".fiche-ajout").waitFor();
  await capturer(page, "scenes");
  await page.locator(".chap-eleves--bouton").click();
  await capturer(page, "scenes-attribuer-par-les-prenoms");
  await page.keyboard.press("Escape");

  // ——— Le chapitre de trente-deux scènes : plan, « À regarder », travail, « Tout voir » ———
  await aller(page, chapitre(marais.chapitreId));
  await carte(page, "Ponton — la voix du héron").waitFor();
  await capturer(page, "marais-plan");
  await page.getByRole("button", { name: "Suivant" }).click();
  await capturer(page, "marais-a-regarder-1");
  await page.getByRole("button", { name: "Suivant" }).click();
  await capturer(page, "marais-a-regarder-2");
  await page.keyboard.press("Escape");
  await capturer(page, "marais-retour-au-plan");
  // On tire le fond pour se déplacer, puis la molette change la taille (F03-AC58, révisé le 11 novembre 2026)
  const fond = (await page.locator(".chemins__cadre").boundingBox())!;
  await page.mouse.move(fond.x + 60, fond.y + fond.height - 60);
  await page.mouse.down();
  await page.mouse.move(fond.x + 260, fond.y + 120, { steps: 10 });
  await page.mouse.up();
  await capturer(page, "marais-fond-tire");
  await page.mouse.wheel(0, 500);
  await capturer(page, "marais-molette");
  // On revient à l'ouverture : la carte cliquée doit être dans le cadre
  await aller(page, chapitre(marais.chapitreId));
  await carte(page, "Ponton — la voix du héron").waitFor();
  await page.waitForTimeout(600);
  await carte(page, "Ponton — la voix du héron").click();
  await capturer(page, "marais-travail");
  await carte(page, "Roseaux — les feux follets dansent").click();
  await capturer(page, "marais-travail-autre-scene");
  await plus(page, "Roseaux — les feux follets dansent").click();
  await page.getByLabel("Ce que fait le lecteur").fill("Plonger sous les roseaux");
  await page.getByLabel("Nouvelle scène").fill("Sous les roseaux");
  await capturer(page, "marais-bulle-du-plus");
  await page.keyboard.press("Enter");
  await carte(page, "Sous les roseaux").waitFor();
  await capturer(page, "marais-apres-l-ajout");
  await page.waitForTimeout(8500);
  await page.locator(".panneau-chemin").getByRole("button", { name: "Construire avec l’IA" }).click();
  await bloc(page).getByRole("textbox").first().fill("Une scène dans la vase avec trois choix");
  await bloc(page).getByRole("button", { name: "Proposer" }).click();
  await page.locator(".carte-chemin--proposee").first().waitFor();
  await page.waitForTimeout(900);
  await capturer(page, "marais-bloc-proposition");
  await bloc(page).getByRole("button", { name: "Fermer le panneau du bloc" }).click();
  await page.getByRole("button", { name: "Tout voir" }).click();
  await capturer(page, "marais-tout-voir");
  await page.getByRole("button", { name: "Taille lisible" }).click();
  await capturer(page, "marais-taille-lisible");

  // ——— Un chapitre vide ———
  await aller(page, chapitre(riviere.id));
  await page.getByRole("button", { name: "Construire avec l’IA" }).waitFor();
  await capturer(page, "chapitre-vide");
  await page.getByRole("button", { name: "Construire avec l’IA" }).click();
  await bloc(page).waitFor();
  await capturer(page, "chapitre-vide-bloc");

  // ——— En 1440 × 900 : la colonne ouverte au plan, repliée au travail ———
  await page.setViewportSize({ width: 1440, height: 900 });
  await aller(page, chapitre(marais.chapitreId));
  await carte(page, "Ponton — la voix du héron").waitFor();
  await capturer(page, "1440-marais-plan");
  await carte(page, "Ponton — la voix du héron").click();
  await capturer(page, "1440-marais-travail");
  await page.locator(".panneau-chemin").getByRole("button", { name: "Construire avec l’IA" }).click();
  await capturer(page, "1440-bloc-demande-seule");
  await page.keyboard.press("Escape");

  // ——— En 1024 × 768 : un écran moyen ———
  await page.setViewportSize({ width: 1024, height: 768 });
  await aller(page, chapitre(lisiere.id));
  await carte(page, "L’orée de la forêt").waitFor();
  await capturer(page, "1024-plan");
  await carte(page, "L’orée de la forêt").click();
  await capturer(page, "1024-travail");

  // ——— Sur téléphone : la liste, comme avant ———
  await page.setViewportSize({ width: 390, height: 844 });
  await aller(page, chapitre(lisiere.id));
  await page.locator(".chemins__liste").waitFor();
  await capturer(page, "telephone-liste");
});

test("Chemins en atelier, l'élève : « Chemins » en premier, en lecture, puis « Scènes »", async ({ page, browser }: { page: Page; browser: Browser }) => {
  test.setTimeout(200_000);
  const s = await classeQuiEcrit(page);
  const [sentier, pont] = s.lisiere.scenes;
  await semerBlocs(s.base, sentier, [recit("Le sentier s’enfonce sous les arbres."), choixAuto("Traverser le pont", pont), choixAuto("Rebrousser chemin", null)]);
  const poste = await posteDe(browser, s, "Alice");
  await aller(poste.page, `/travail/chapitre/${s.lisiere.id}`);
  await carte(poste.page, "Le sentier").waitFor();
  await capturer(poste.page, "eleve-chemins");
  await carte(poste.page, "Le sentier").click();
  await capturer(poste.page, "eleve-scene-cliquee");
  await poste.page.getByRole("button", { name: "Scènes", exact: true }).click();
  await poste.page.locator(".fiches").waitFor();
  await capturer(poste.page, "eleve-scenes");
  await poste.contexte.close();
});
