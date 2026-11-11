import { test, type Page } from "@playwright/test";
import { adultePret, aller, choixAuto, recit, semerAttribution, semerBlocs, semerClasse, semerPartie, semerProjet, sql, supprimerComptes } from "../parcours/outils";
import { poserLeMarais } from "../../scripts/marais-des-feux-follets";
import { ELEVES } from "../../scripts/passeurs-de-brume";

/**
 * Captures du bloc de scènes (F13.7, lots 3 et 4 de « Construire dans Chemins »), contre le serveur
 * local lancé en IA simulée (« application-ia-simulee » de .claude/launch.json : aucun appel payé) :
 * npx playwright test --config playwright.local.config.ts bloc-de-scenes
 * Elles s'écrivent dans test-results/captures/bloc-de-scenes/. Ce n'est pas un test : rien n'y est
 * vérifié.
 */
const dossier = "test-results/captures/bloc-de-scenes";
let n = 0;
const capturer = async (page: Page, nom: string) => {
  n += 1;
  await page.waitForTimeout(700);
  await page.screenshot({ path: `${dossier}/${String(n).padStart(2, "0")}-${nom}.png` });
};
const carte = (page: Page, titre: string) => page.locator(".carte-chemin", { hasText: titre });
const panneau = (page: Page) => page.locator(".panneau-bloc");
const proposer = async (page: Page, demande: string) => {
  await panneau(page).getByRole("textbox").first().fill(demande);
  await panneau(page).getByRole("button", { name: /Proposer/ }).click();
  await page.locator(".carte-chemin--proposee").first().waitFor();
};

test.afterEach(async () => {
  await supprimerComptes();
});

test("Bloc de scènes : la demande, la proposition en pointillé, les retouches, l'ajout, en 1440 et 1366 px", async ({ page }) => {
  test.setTimeout(150_000);
  await page.setViewportSize({ width: 1440, height: 900 });
  const { compte, base } = await adultePret(page);
  await base.from("enseignants").update({ nom_affiche: "Mme Laurent" }).eq("id", compte.id);
  const classe = await semerClasse(base, "CM1-CM2 d’essai", [...ELEVES]);
  const projet = await semerProjet(base, compte, "classe", "choix", "Les passeurs de brume", classe.id);
  const { partieId, chapitres } = await semerPartie(base, projet, "La forêt engloutie", [
    { titre: "La lisière", scenes: ["L’orée de la forêt", "Le vieux pont", "La souche creuse"] },
    { titre: "Le moulin noyé", scenes: ["La roue du moulin"] },
    { titre: "Le sanctuaire", scenes: ["La grille du sanctuaire"] },
    { titre: "La rivière", scenes: [] },
  ]);
  const [lisiere, moulin, sanctuaire, riviere] = chapitres;
  const [oree, pont, souche] = lisiere.scenes;
  await semerAttribution(base, lisiere.id, [{ eleve: classe.eleves.Alice.id }]);
  await semerBlocs(base, oree, [recit("Le héros arrive à l’orée de la forêt. Les arbres sont si hauts qu’on n’en voit pas la cime."), choixAuto("Se cacher dans la souche", souche)]);
  await semerBlocs(base, pont, [recit("Le pont grince sous ses pas.")]);
  const eleves = new Map(Object.entries(classe.eleves).map(([prenom, e]) => [prenom, e.id]));
  const marais = await poserLeMarais(sql, {
    projetId: projet, partieId, enseignantId: compte.id, ailleurs: { moulin: moulin.scenes[0], sanctuaire: sanctuaire.scenes[0] }, entreeDepuis: souche, eleves,
  });
  const chemins = (chapitre: string) => `/projet/${projet}/chapitre/${chapitre}?vue=chemins`;

  // ——— Un petit chapitre : la demande, puis la proposition ———
  await aller(page, chemins(lisiere.id));
  await carte(page, "L’orée de la forêt").waitFor();
  await carte(page, "L’orée de la forêt").click();
  await capturer(page, "panneau-de-la-scene");
  await page.locator(".panneau-chemin").getByRole("button", { name: "Construire avec l’IA" }).click();
  await capturer(page, "bloc-vide");
  await panneau(page).getByRole("button", { name: "Réglages" }).click();
  await capturer(page, "bloc-reglages");
  await panneau(page).getByRole("button", { name: "Réglages" }).click();
  await panneau(page).getByRole("textbox").first().fill("Le héros arrive dans la forêt, où trois chemins s’offrent à lui : le sentier des fougères, le ruisseau, la grotte rejoint Le vieux pont");
  await capturer(page, "bloc-demande-ecrite");
  await panneau(page).getByRole("button", { name: "Proposer" }).click();
  await page.locator(".carte-chemin--proposee").first().waitFor();
  await capturer(page, "proposition");
  await page.locator(".carte-chemin--proposee", { hasText: "Le ruisseau" }).click();
  await capturer(page, "proposition-ligne-ouverte");
  await panneau(page).getByLabel("Titre de la nouvelle scène").first().fill("Le sentier aux fougères géantes");
  await panneau(page).getByText("Donner aussi une consigne").click();
  await capturer(page, "proposition-retouchee");
  await panneau(page).getByRole("button", { name: /Retirer la scène « Le sentier des fougères/ }).click();
  await capturer(page, "proposition-scene-retiree");
  await panneau(page).getByRole("button", { name: /^Ajouter \d/ }).click();
  await page.locator(".carte-chemin--proposee").first().waitFor({ state: "detached" });
  await capturer(page, "apres-l-ajout");

  // ——— Lot 4 : une question, puis la réponse qui redessine ———
  await carte(page, "Le vieux pont").click();
  await page.locator(".panneau-chemin").getByRole("button", { name: "Construire avec l’IA" }).click();
  await capturer(page, "champ-vide");
  await proposer(page, "Trois chemins : le sentier des fougères, le ruisseau, et un troisième");
  await capturer(page, "question");
  await panneau(page).getByLabel(/Où mène le chemin/).fill("Une cabane de bûcheron abandonnée");
  await panneau(page).getByRole("button", { name: "Redessiner avec mes réponses" }).click();
  await page.locator(".carte-chemin--proposee", { hasText: "Une cabane" }).waitFor();
  await capturer(page, "question-repondue");
  await panneau(page).getByRole("button", { name: "Abandonner" }).click();

  // « L'IA complète » : ce qu'elle invente est marqué
  await panneau(page).getByRole("button", { name: "Réglages" }).click();
  await panneau(page).getByLabel("L’IA complète").check();
  await panneau(page).getByRole("button", { name: "Réglages" }).click();
  await proposer(page, "Trois chemins : le sentier des fougères, le ruisseau, et un troisième");
  await capturer(page, "l-ia-complete");
  await panneau(page).getByRole("button", { name: "Abandonner" }).click();
  await panneau(page).getByRole("button", { name: "Réglages" }).click();
  await panneau(page).getByLabel("Me le demander").check();
  await panneau(page).getByRole("button", { name: "Réglages" }).click();

  // Une demande trop large : ce qui reste, puis dans le champ après l'ajout
  await proposer(page, "Deux chemins : la mare, la colline puis le campement et la rivière avec leurs choix");
  await capturer(page, "demande-trop-large");
  await panneau(page).getByRole("button", { name: /^Ajouter \d/ }).click();
  await page.locator(".carte-chemin--proposee").first().waitFor({ state: "detached" });
  await capturer(page, "reste-dans-le-champ");
  await panneau(page).getByRole("button", { name: "Fermer le panneau du bloc" }).click();

  // ——— Le grand chapitre : le bloc sous une scène du bas, cadré à l'écran ———
  await aller(page, chemins(marais.chapitreId));
  await carte(page, "Ponton — la voix du héron").waitFor();
  await carte(page, "Ponton — la voix du héron").scrollIntoViewIfNeeded();
  await carte(page, "Ponton — la voix du héron").click();
  await page.locator(".panneau-chemin").getByRole("button", { name: "Construire avec l’IA" }).click();
  await proposer(page, "Une scène dans la vase avec trois choix");
  await page.waitForTimeout(800);
  await capturer(page, "grand-chapitre-proposition");

  // ——— Un chapitre vide : « Construire avec l'IA » ———
  await aller(page, `/projet/${projet}/chapitre/${riviere.id}`);
  await page.getByRole("button", { name: "Construire avec l’IA" }).waitFor();
  await capturer(page, "chapitre-vide");
  await page.getByRole("button", { name: "Construire avec l’IA" }).click();
  await panneau(page).waitFor();
  await capturer(page, "chapitre-vide-bloc");
  await proposer(page, "Une scène au bord de la rivière avec deux choix");
  await capturer(page, "chapitre-vide-proposition");

  // ——— En 1366 × 768 ———
  await page.setViewportSize({ width: 1366, height: 768 });
  await aller(page, chemins(lisiere.id));
  await carte(page, "Le vieux pont").waitFor();
  await carte(page, "Le vieux pont").click();
  await page.locator(".panneau-chemin").getByRole("button", { name: "Construire avec l’IA" }).click();
  await proposer(page, "Trois chemins : la clairière, le marécage, la tour");
  await capturer(page, "1366-proposition");
});
