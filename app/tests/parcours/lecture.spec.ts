import { expect, test, type Page } from "@playwright/test";
import type { SupabaseClient } from "@supabase/supabase-js";
import { action, adultePret, aller, choixAuto, liaison, recit, semerBlocs, semerPartie, semerProjet, sql, supprimerComptes, type Compte } from "./outils";

/**
 * Étape 5 du plan, lot 3 : la lecture d'essai de l'adulte (F09.1) — « Par où commencer ? »,
 * les phrases du livre, l'énigme, ce que la lecture rencontre, le parcours et « déjà lu », la
 * feuille et le dé, « Lire à l'essai d'ici », l'aller-retour vers une scène, le téléphone.
 */

test.afterEach(async () => {
  await supprimerComptes();
});

type Livre = { compte: Compte; base: SupabaseClient; projet: string; s: Record<string, string> };

/**
 * Trois parties. « Le quai » : le départ, d'où « Monter au phare » mène à la lisière et « Suivre
 * le héron » nulle part. « La lisière » : « Les deux chemins », à gauche « La porte aux
 * symboles » (énigme vers le sommet), à droite une scène sans choix ni fin, et « Approcher du
 * coffre », hors du livre. « La tour » : « Le sommet », une fin. Une feuille : Volonté 1, un dé.
 */
async function phare(page: Page): Promise<Livre> {
  const { compte, base } = await adultePret(page);
  const projet = await semerProjet(base, compte, "personnel", "choix", "Le phare");
  const quai = (await semerPartie(base, projet, "Le quai", [{ titre: "Le quai", scenes: ["La plage au matin"] }])).chapitres[0].scenes;
  const lisiere = (await semerPartie(base, projet, "La forêt", [{ titre: "La lisière", scenes: ["Les deux chemins", "La porte aux symboles", "Le bateau échoué", "Le coffre"] }])).chapitres[0].scenes;
  const tour = (await semerPartie(base, projet, "La tour", [{ titre: "Le sommet", scenes: ["Le sommet"] }])).chapitres[0].scenes;
  const s = { depart: quai[0], chemins: lisiere[0], porte: lisiere[1], bateau: lisiere[2], coffre: lisiere[3], sommet: tour[0] };
  await base.from("projets").update({ depart_scene_id: s.depart }).eq("id", projet);
  await semerBlocs(base, s.depart, [recit("Le phare clignote."), action("Ajoute la corde à ton inventaire."), choixAuto("Monter au phare", s.chemins), choixAuto("Suivre le héron", null)]);
  await semerBlocs(base, s.chemins, [recit("Deux chemins s’ouvrent."), choixAuto("Aller à gauche", s.porte), choixAuto("Aller à droite", s.bateau), choixAuto("Approcher du coffre", s.coffre)]);
  await semerBlocs(base, s.porte, [recit("Trois symboles sur la porte."), liaison(s.sommet, "Déchiffrer")]);
  await semerBlocs(base, s.bateau, [recit("La coque est fendue.")]);
  await semerBlocs(base, s.coffre, [recit("Un coffre vide.")]);
  await semerBlocs(base, s.sommet, [recit("La lanterne s’allume.")]);
  await base.from("scenes").update({ fin: true }).in("id", [s.sommet, s.coffre]);
  await base.from("scenes").update({ hors_livre: true }).eq("id", s.coffre);
  const feuille = { on: true, des: 1, sections: [{ id: "heros", type: "compteurs", titre: "Ton héros", compteurs: [{ id: "vol", nom: "Volonté", depart: 1 }] }, { id: "inv", type: "liste", titre: "Inventaire", lignes: 6 }] };
  await base.from("preparations").update({ feuille, rubrique_jeu: true }).eq("projet_id", projet);
  return { compte, base, projet, s };
}

const page_ = (page: Page) => page.locator(".lu-page");
const choix = (page: Page, libelle: string) => page_(page).getByRole("button", { name: new RegExp(libelle) });
const parcours = (page: Page) => page.getByRole("button", { name: /^Parcours · \d+/ });
const etatEnBase = async (scene: string) => (await sql<{ etat: string }>("select etat from scenes where id = $1", [scene]))[0].etat;

test.describe("Lecture d'essai de l'adulte (F09.1)", () => {
  test("F09-AC13, F09-AC21, F09-AC03 — depuis « Tester la lecture » : le départ, les choix à travers les trois parties, un retour à une étape, « déjà lu », « Recommencer » ; rien ne change l'état des scènes, et « Quitter » efface les marques", async ({ page }) => {
    const l = await phare(page);
    await aller(page, `/projet/${l.projet}/livre?etape=chemins`);
    await page.locator(".controles").getByRole("button", { name: /Tester la lecture/ }).click();
    await page.getByRole("link", { name: "Tester la lecture" }).click();
    await expect(page.getByRole("heading", { name: "Par où commencer ?" })).toBeVisible();
    await page.getByRole("link", { name: "Commencer au départ" }).click();

    await expect(page_(page)).toContainText("Le phare clignote.");
    await choix(page, "Monter au phare").click();
    await expect(page_(page)).toContainText("Deux chemins s’ouvrent.");
    await expect(page.locator(".lu-bandeau")).toContainText("La lisière");
    await choix(page, "Aller à gauche").click();
    await expect(page_(page)).toContainText("Trois symboles sur la porte.");
    await expect(parcours(page)).toHaveText(/Parcours · 3/);

    // Retour à l'étape 2 par le parcours : le choix suivi porte « déjà lu », l'autre non
    await parcours(page).click();
    await page.getByRole("list", { name: "Parcours" }).getByRole("button").nth(1).click();
    await expect(choix(page, "Aller à gauche")).toContainText("déjà lu");
    await expect(choix(page, "Aller à droite")).not.toContainText("déjà lu");
    // Un autre choix depuis cette étape remplace la suite
    await choix(page, "Aller à droite").click();
    await expect(page_(page)).toContainText("Cette scène n’a ni choix ni fin.");
    await expect(parcours(page)).toHaveText(/Parcours · 3/);
    await page.getByRole("button", { name: "Passage précédent" }).click();
    await expect(page_(page)).toContainText("Deux chemins s’ouvrent.");

    // « Recommencer » : le départ, les marques gardées
    await page.getByRole("button", { name: "Recommencer" }).first().click();
    await expect(page_(page)).toContainText("Le phare clignote.");
    await expect(choix(page, "Monter au phare")).toContainText("déjà lu");
    expect(await etatEnBase(l.s.chemins)).toBe("cours");

    // « Quitter » ramène au Livre ; rouverte, la lecture n'a plus de marque
    await page.getByRole("link", { name: "Quitter" }).click();
    await expect(page).toHaveURL(/\/livre/);
    await aller(page, `/projet/${l.projet}/lecture?depart=${l.s.depart}&de=livre`);
    await expect(choix(page, "Monter au phare")).not.toContainText("déjà lu");
  });

  test("F09-AC14, F09-AC19 — l'énigme : un mauvais numéro, celui d'une autre scène, puis le bon ; l'adulte lit le numéro attendu à côté de « Passer l'énigme »", async ({ page }) => {
    const l = await phare(page);
    await aller(page, `/projet/${l.projet}/lecture?depart=${l.s.porte}&de=livre`);
    const enigme = page.locator(".lu-enigme");
    const attendu = ((await enigme.locator(".lu-enigme__numero").textContent()) ?? "").replace(/\D/g, "");
    expect(attendu).not.toBe("");
    const essayer = async (n: string) => {
      await enigme.getByLabel("Numéro trouvé").fill(n);
      await enigme.getByRole("button", { name: "Y aller" }).click();
    };
    await essayer(String(Number(attendu) + 1));
    await expect(enigme).toContainText("Ce n’est pas ce numéro.");
    await expect(page_(page)).toContainText("Trois symboles sur la porte.");
    // Le n° 1, celui du départ, n'y mène pas non plus
    await essayer("1");
    await expect(enigme).toContainText("Ce n’est pas ce numéro.");
    await essayer(attendu);
    await expect(page_(page)).toContainText("La lanterne s’allume.");
    // Une fin : la marque de fin du livre, et « Recommencer »
    await expect(page.locator(".lu-fin__marque")).toHaveText("Fin");
    await page.getByRole("button", { name: "Passage précédent" }).click();
    await enigme.getByRole("button", { name: "Passer l’énigme" }).click();
    await expect(page_(page)).toContainText("La lanterne s’allume.");
  });

  test("F09-AC17, F09-AC18 — un choix à relier se lit sans se cliquer ; une scène exclue se lit avec « Hors du livre »", async ({ page }) => {
    const l = await phare(page);
    await aller(page, `/projet/${l.projet}/lecture?depart=${l.s.depart}&de=livre`);
    const heron = page_(page).locator("li").filter({ hasText: "Suivre le héron" });
    await expect(heron).toContainText("à relier");
    await expect(heron.getByRole("button")).toHaveCount(0);
    await choix(page, "Monter au phare").click();
    await choix(page, "Approcher du coffre").click();
    await expect(page_(page)).toContainText("Un coffre vide.");
    await expect(page.locator(".lu-bandeau")).toContainText("Hors du livre");
  });

  test("F04-AC21, F04-AC31, F04-AC32 — la feuille et le dé : le compteur s'arrête à zéro, le dé affiche son résultat, les choix restent activables", async ({ page }) => {
    const l = await phare(page);
    await aller(page, `/projet/${l.projet}/lecture?depart=${l.s.depart}&de=livre`);
    const feuille = page.getByRole("complementary", { name: "Feuille d’aventure" });
    // Fermée au départ, la feuille s'ouvre par « Ma feuille », qui résume ses compteurs (décidé le 14 octobre 2026)
    await expect(feuille).toBeHidden();
    await expect(page.getByRole("button", { name: /Ma feuille · Volonté 1/ })).toBeVisible();
    await page.getByRole("button", { name: /Ma feuille/ }).click();
    await feuille.getByRole("button", { name: "Retirer un point : Volonté" }).click();
    await expect(feuille.locator(".fa-compteur__valeur")).toHaveText("0");
    await expect(feuille.getByRole("button", { name: "Retirer un point : Volonté" })).toBeDisabled();
    await feuille.getByRole("button", { name: "Lancer le dé" }).click();
    await expect(feuille.locator(".fa-de__resultat")).toHaveText(/^Tu as fait [1-6]$/);
    await choix(page, "Monter au phare").click();
    await expect(page_(page)).toContainText("Deux chemins s’ouvrent.");
    // La feuille tient d'un passage à l'autre, refermée ou non ; « Recommencer » la remet à ses valeurs de départ
    await page.keyboard.press("Escape");
    await expect(feuille).toBeHidden();
    await expect(page.getByRole("button", { name: /Ma feuille · Volonté 0/ })).toBeVisible();
    await page.getByRole("button", { name: /Ma feuille/ }).click();
    await expect(feuille.locator(".fa-compteur__valeur")).toHaveText("0");
    await page.getByRole("button", { name: "Recommencer" }).first().click();
    await expect(feuille.locator(".fa-compteur__valeur")).toHaveText("1");
  });

  test("F04.2 — une action de jeu ouvre la feuille, sans rien y écrire ; « Ranger » la referme ; le texte reste centré", async ({ page }) => {
    const l = await phare(page);
    await aller(page, `/projet/${l.projet}/lecture?depart=${l.s.depart}&de=livre`);
    const feuille = page.getByRole("complementary", { name: "Feuille d’aventure" });
    const texteAvant = (await page_(page).boundingBox())!;
    await page_(page).getByRole("button", { name: /Ajoute la corde à ton inventaire/ }).click();
    await expect(feuille).toBeVisible();
    await expect(feuille.getByRole("textbox", { name: "Inventaire, ligne 1" })).toHaveValue("");
    // La feuille s'ouvre par-dessus, dans la marge : le texte n'a pas bougé
    expect((await page_(page).boundingBox())!.x).toBe(texteAvant.x);
    await feuille.getByRole("button", { name: "Ranger" }).click();
    await expect(feuille).toBeHidden();
  });

  test("F09.1 — « Lire à l'essai d'ici », depuis le menu de la scène ; « Ouvrir la scène » puis « Retour à la lecture d'essai » retrouve le parcours ; « Quitter » ramène à la scène", async ({ page }) => {
    const l = await phare(page);
    await aller(page, `/projet/${l.projet}/scene/${l.s.chemins}`);
    await page.getByLabel(/Autres commandes de la scène/).click();
    await page.getByRole("link", { name: "Lire à l’essai d’ici" }).click();
    await expect(page_(page)).toContainText("Deux chemins s’ouvrent.");
    await choix(page, "Aller à gauche").click();
    await page.locator(".lu-bandeau").getByRole("link", { name: /Ouvrir la scène/ }).click();
    await expect(page).toHaveURL(new RegExp(`/scene/${l.s.porte}`));
    await page.getByRole("link", { name: "Retour à la lecture d’essai" }).click();
    await expect(page_(page)).toContainText("Trois symboles sur la porte.");
    await expect(parcours(page)).toHaveText(/Parcours · 2/);
    await page.getByRole("link", { name: "Quitter" }).click();
    await expect(page).toHaveURL(new RegExp(`/scene/${l.s.chemins}$`));
  });

  test("F09.1 — sur téléphone : « Ma feuille » dans une barre basse ouvre la feuille, « Ranger » la referme ; rien ne déborde", async ({ page }) => {
    const l = await phare(page);
    await page.setViewportSize({ width: 390, height: 844 });
    await aller(page, `/projet/${l.projet}/lecture?depart=${l.s.depart}&de=livre`);
    const feuille = page.getByRole("complementary", { name: "Feuille d’aventure" });
    await expect(feuille).toBeHidden();
    await expect(page.locator(".lecture__resume")).toHaveText("Volonté 1 · Inventaire 0");
    await page.getByRole("button", { name: "Ma feuille" }).click();
    await expect(feuille).toBeVisible();
    await feuille.getByRole("button", { name: "Ranger" }).click();
    await expect(feuille).toBeHidden();
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
  });
});
