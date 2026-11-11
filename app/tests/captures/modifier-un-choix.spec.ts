import { test, type Page } from "@playwright/test";
import { adultePret, aller, semerClasse, semerPartie, semerProjet, sql, supprimerComptes } from "../parcours/outils";
import { poserLeMarais } from "../../scripts/marais-des-feux-follets";
import { ELEVES } from "../../scripts/passeurs-de-brume";

/**
 * Captures de « Modifier un choix depuis Chemins » (F03.1, 11 novembre 2026, F03-AC70 à AC76), sur « Le
 * marais des feux follets » : un choix ouvert par son onglet, son libellé, sa destination et sa phrase
 * changés, le retour à la scène, le choix ouvert par sa ligne, supprimé puis rendu par « Annuler », caché
 * derrière une énigme, le lien caché ouvert, et la vue de loin où rien ne s'ouvre. Aucune aide n'y est
 * demandée. Contre le serveur local déjà lancé :
 * npx playwright test --config playwright.local.config.ts modifier-un-choix
 * Elles s'écrivent dans test-results/captures/modifier-un-choix/. Ce n'est pas un test : rien n'y est vérifié.
 */
const dossier = "test-results/captures/modifier-un-choix";
let n = 0;
const capturer = async (page: Page, nom: string) => {
  n += 1;
  await page.waitForTimeout(900);
  await page.screenshot({ path: `${dossier}/${String(n).padStart(2, "0")}-${nom}.png` });
};
const carte = (page: Page, titre: string) => page.locator(".carte-chemin", { has: page.locator(".carte-chemin__titre", { hasText: titre }) });
const onglet = (page: Page, phrase: string) => page.locator(".onglet-chemin", { hasText: phrase });
const choix = (page: Page) => page.locator(".panneau-choix");
const scene = (page: Page) => page.locator(".panneau-chemin:not(.panneau-choix)");

test.use({ deviceScaleFactor: 2 });

test.afterEach(async () => {
  await supprimerComptes();
});

/** Le marais dans un projet de classe. */
async function semerLeMarais(page: Page) {
  const { compte, base } = await adultePret(page);
  await base.from("enseignants").update({ nom_affiche: "Mme Laurent" }).eq("id", compte.id);
  const classe = await semerClasse(base, "CM1-CM2 d’essai", [...ELEVES]);
  const projet = await semerProjet(base, compte, "classe", "choix", "Les passeurs de brume", classe.id);
  const { partieId, chapitres } = await semerPartie(base, projet, "La forêt engloutie", [
    { titre: "La lisière", scenes: ["Le gué"] },
    { titre: "Le moulin noyé", scenes: ["La roue du moulin"] },
    { titre: "Le sanctuaire", scenes: ["La grille du sanctuaire"] },
  ]);
  const [lisiere, moulin, sanctuaire] = chapitres;
  const eleves = new Map(Object.entries(classe.eleves).map(([prenom, e]) => [prenom, e.id]));
  const marais = await poserLeMarais(sql, {
    projetId: projet, partieId, enseignantId: compte.id, ailleurs: { moulin: moulin.scenes[0], sanctuaire: sanctuaire.scenes[0] }, entreeDepuis: lisiere.scenes[0], eleves,
  });
  return { chapitre: `/projet/${projet}/chapitre/${marais.chapitreId}` };
}

test("Modifier un choix depuis Chemins, l'adulte : ouvrir, changer, revenir, supprimer, cacher", async ({ page }) => {
  test.setTimeout(240_000);
  await page.setViewportSize({ width: 1366, height: 768 });
  const { chapitre } = await semerLeMarais(page);
  await aller(page, chapitre);
  await carte(page, "Marais — la barque s’enlise").waitFor();

  // ——— Ouvrir un choix par son onglet : la scène est choisie, l'onglet et son trait restent désignés ———
  await onglet(page, "Longer la vieille digue").click();
  await choix(page).getByLabel("Ce que fait le lecteur").waitFor();
  await capturer(page, "choix-ouvert");

  // ——— Ce que fait le lecteur : l'onglet suit, sans bouton ———
  await choix(page).getByLabel("Ce que fait le lecteur").fill("Suivre la vieille digue jusqu’au bout");
  await choix(page).getByLabel("Ce que fait le lecteur").press("Enter");
  await choix(page).getByText("Enregistré").waitFor();
  await capturer(page, "libelle-change");

  // ——— Changer de destination : la liste des scènes, puis le trait qui mène ailleurs ———
  await choix(page).getByRole("button", { name: "Changer…" }).click();
  await capturer(page, "changer-de-destination");
  await choix(page).locator(".cx-liste button", { hasText: "Tourbière — le sol qui tremble" }).first().click();
  await choix(page).getByText("Enregistré").waitFor();
  await capturer(page, "destination-changee");

  // ——— La phrase, écrite à la main : « modifiée » ———
  const phrase = choix(page).locator(".cx-phrase__texte").first();
  await phrase.click();
  await page.keyboard.press("ControlOrMeta+a");
  await page.keyboard.type("Si tu veux suivre la digue jusqu’au bout, cours au ");
  await choix(page).getByText("Enregistré").waitFor();
  await capturer(page, "phrase-modifiee");

  // ——— Une destination de plus ———
  await choix(page).getByRole("button", { name: "Ajouter une destination" }).click();
  await choix(page).locator(".cx-liste button", { hasText: "Ponton — la voix du héron" }).first().click();
  await choix(page).getByText("Enregistré").waitFor();
  await capturer(page, "deux-destinations");

  // ——— Revenir à la scène : « Ses choix » dans l'ordre du texte, la ligne du choix désignée un instant ———
  await choix(page).getByRole("button", { name: /Revenir à la scène/ }).click();
  await page.waitForTimeout(200);
  await page.screenshot({ path: `${dossier}/${String((n += 1)).padStart(2, "0")}-retour-a-la-scene.png` });

  // ——— Ouvrir un choix par sa ligne, puis le supprimer : le message, « Annuler » le rend à sa place ———
  await scene(page).getByRole("button", { name: "Suivre les feux follets", exact: true }).hover();
  await capturer(page, "ligne-survolee");
  await scene(page).getByRole("button", { name: "Suivre les feux follets", exact: true }).click();
  await choix(page).getByLabel("Ce que fait le lecteur").waitFor();
  await capturer(page, "ouvert-par-sa-ligne");
  await choix(page).getByRole("button", { name: "Supprimer ce choix" }).click();
  await page.getByRole("button", { name: "Annuler" }).waitFor();
  await capturer(page, "supprime");
  await page.getByRole("button", { name: "Annuler" }).click();
  await scene(page).getByRole("button", { name: "Suivre les feux follets", exact: true }).waitFor();
  await capturer(page, "rendu-a-sa-place");

  // ——— « Cacher ce choix (énigme) », puis le lien caché ouvert par son onglet ———
  await scene(page).getByRole("button", { name: "Appeler à l’aide", exact: true }).click();
  await choix(page).getByRole("button", { name: "Cacher ce choix (énigme)" }).click();
  await page.getByRole("button", { name: "Annuler" }).waitFor();
  await capturer(page, "cache");
  await onglet(page, "Lien caché").first().click();
  await choix(page).getByRole("button", { name: "Retirer ce lien caché" }).waitFor();
  await capturer(page, "lien-cache-ouvert");
  await page.keyboard.press("Escape");
  await capturer(page, "echap-ramene-a-la-scene");

  // ——— De loin, aucun choix ne s'ouvre (F03-AC76) ———
  await page.keyboard.press("Escape");
  for (let i = 0; i < 3; i += 1) await page.getByRole("button", { name: "Réduire" }).click();
  await page.waitForTimeout(600);
  await page.locator(".onglet-chemin").first().click({ force: true });
  await capturer(page, "de-loin-rien-ne-s-ouvre");

  // ——— En 1 024 × 768 : le volet prend le pas, les réglages tiennent ———
  await page.setViewportSize({ width: 1024, height: 768 });
  await aller(page, chapitre);
  await carte(page, "Marais — la barque s’enlise").waitFor();
  await onglet(page, "Suivre les feux follets").click();
  await choix(page).getByLabel("Ce que fait le lecteur").waitFor();
  await choix(page).getByRole("button", { name: "Changer…" }).click();
  await capturer(page, "1024-changer-de-destination");
});

test("Modifier un choix depuis Chemins, la copie ouverte : celui qui écrit la scène reçoit le choix modifié, sans être arrêté", async ({ page, context }) => {
  test.setTimeout(200_000);
  await page.setViewportSize({ width: 1366, height: 768 });
  const { chapitre } = await semerLeMarais(page);
  await aller(page, chapitre);
  await carte(page, "Marais — la barque s’enlise").waitFor();

  // La scène ouverte dans une autre page, comme par quelqu'un qui l'écrit : sa copie est en retard sur ce que fera « Chemins »
  await carte(page, "Marais — la barque s’enlise").click();
  const adresse = await scene(page).getByRole("link", { name: "Ouvrir" }).getAttribute("href");
  const copie = await context.newPage();
  await copie.setViewportSize({ width: 1366, height: 768 });
  await aller(copie, adresse!);
  await copie.locator(".copie__texte").waitFor();
  await copie.waitForTimeout(600);
  await copie.screenshot({ path: `${dossier}/copie-01-avant.png` });

  // Depuis « Chemins » : la phrase, la destination, puis un choix supprimé
  await onglet(page, "Longer la vieille digue").click();
  await choix(page).getByLabel("Ce que fait le lecteur").fill("Suivre la vieille digue jusqu’au bout");
  await choix(page).getByLabel("Ce que fait le lecteur").press("Enter");
  await choix(page).getByText("Enregistré").waitFor();
  await choix(page).getByRole("button", { name: "Changer…" }).click();
  await choix(page).locator(".cx-liste button", { hasText: "Tourbière — le sol qui tremble" }).first().click();
  await choix(page).getByText("Enregistré").waitFor();
  await choix(page).getByRole("button", { name: /Revenir à la scène/ }).click();
  await scene(page).getByRole("button", { name: "Appeler à l’aide", exact: true }).click();
  await choix(page).getByRole("button", { name: "Supprimer ce choix" }).click();
  await page.getByRole("button", { name: "Annuler" }).waitFor();

  // Celui qui écrit continue : sa frappe s'enregistre, et sa copie montre le choix modifié à sa place, l'autre retiré
  await copie.locator(".copie__texte p").first().click();
  await copie.keyboard.press("End");
  await copie.keyboard.type(" La vase clapote.");
  await copie.waitForTimeout(3500);
  await copie.screenshot({ path: `${dossier}/copie-02-apres-la-frappe.png` });

  // « Annuler » rend le choix supprimé : à la frappe suivante, il revient à sa place dans la copie
  await page.getByRole("button", { name: "Annuler" }).click();
  await scene(page).getByRole("button", { name: "Appeler à l’aide", exact: true }).waitFor();
  await copie.keyboard.type(" Un héron crie.");
  await copie.waitForTimeout(3500);
  await copie.screenshot({ path: `${dossier}/copie-03-apres-annuler.png` });
  await copie.close();
});
