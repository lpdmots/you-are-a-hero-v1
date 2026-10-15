import { expect, test, type Page } from "@playwright/test";
import type { SupabaseClient } from "@supabase/supabase-js";
import { lirePdf } from "../livre/fabrique";
import { adultePret, aller, choixAuto, recit, semerBlocs, semerImage, semerPartie, semerProjet, sql, supprimerComptes, type Compte } from "./outils";

/**
 * Étape 6 du plan, lot 2 : l'aperçu du livre et la scène ouverte à côté (F11.2), « Relire »
 * et ses quatre tâches (F11.6), le Suivi filtré sur les scènes à finir (F11-AC78).
 */

test.afterEach(async () => {
  await supprimerComptes();
});

type Livre = { compte: Compte; base: SupabaseClient; projet: string; s: string[]; debut: string };

const DEBUT = "La brume s’épaissi au matin.";

/**
 * « Le phare » : S001, départ, mène à S002 et S003, deux fins ; S004 est une impasse où mène S003.
 * Toutes prêtes. Les numéros suivent le plan : n° 1 à 4.
 */
async function phare(page: Page, o: { aChoix?: boolean; impasse?: boolean } = {}): Promise<Livre> {
  const aChoix = o.aChoix ?? true;
  const { compte, base } = await adultePret(page);
  const projet = await semerProjet(base, compte, "personnel", aChoix ? "choix" : "classique", "Le phare");
  const { chapitres } = await semerPartie(base, projet, "La côte", [{ titre: "La plage", scenes: ["La plage au matin", "La lanterne", "Le port", "Le bateau échoué"] }]);
  const s = chapitres[0].scenes;
  await base.from("projets").update({ depart_scene_id: s[0] }).eq("id", projet);
  await semerBlocs(base, s[0], [recit(DEBUT), ...(aChoix ? [choixAuto("Suivre la lanterne", s[1]), choixAuto("Aller au port", s[2])] : [])]);
  await semerBlocs(base, s[1], [recit("La lanterne s’allume.")]);
  await semerBlocs(base, s[2], [recit("Le port est désert."), ...(aChoix && o.impasse ? [choixAuto("Monter dans l’épave", s[3])] : [])]);
  await semerBlocs(base, s[3], [recit("La coque est fendue.")]);
  await base.from("scenes").update({ fin: true }).in("id", o.impasse ? [s[1]] : [s[1], s[2], s[3]]);
  await sql("update scenes set etat = 'prete' where projet_id = $1", [projet]);
  return { compte, base, projet, s, debut: DEBUT };
}

const apercuPret = (page: Page) => expect(page.locator(".apercu__etat")).toHaveText(/\d+ passages? · \d+ pages · état du/, { timeout: 30000 });
/** Les passages et les renvois de l'aperçu se cliquent aussi par des boutons, pour le clavier : on s'en sert ici. */
const ouvrirPassage = (page: Page, nom: string) => page.getByRole("button", { name: `Ouvrir ${nom}`, exact: true }).first().dispatchEvent("click");
const scene = (page: Page) => page.locator(".a-cote");

test.describe("Aperçu et scène ouverte à côté (F11.2)", () => {
  test("F11-AC27, F11-AC61, F11-AC47 — une coquille corrigée depuis l'aperçu entre dans la scène, qui reste prête, puis dans le PDF ; « Tout annuler » rend le texte de l'ouverture", async ({ page }) => {
    const l = await phare(page);
    await aller(page, `/projet/${l.projet}/livre?etape=relire`);
    await apercuPret(page);
    await ouvrirPassage(page, "n° 1 · S001");
    await expect(scene(page).locator(".fiche__ref")).toHaveText("S001");
    // À « Relire », ni déplacement de passage ni nouvelle page (F11-AC61)
    await expect(page.getByRole("button", { name: /Monter d’un rang|Commencer sur une nouvelle page/ })).toHaveCount(0);
    const paragraphe = scene(page).locator("[data-slate-editor] p").first();
    await paragraphe.getByText(DEBUT).click();
    await page.waitForTimeout(200);
    // Juste après « s’épaissi »
    // Début de ligne : sous macOS, la touche Début fait défiler la page sans déplacer le curseur
    await page.keyboard.press(process.platform === "darwin" ? "Meta+ArrowLeft" : "Home");
    for (let i = 0; i < "La brume s’épaissi".length; i += 1) await page.keyboard.press("ArrowRight");
    await page.keyboard.type("t");
    await expect(scene(page).getByText("Enregistré", { exact: true })).toBeVisible({ timeout: 15000 });
    await expect.poll(async () => JSON.stringify((await sql<{ texte: unknown }>("select texte from scenes where id = $1", [l.s[0]]))[0].texte)).toContain("s’épaissit au matin");
    expect((await sql<{ etat: string }>("select etat from scenes where id = $1", [l.s[0]]))[0].etat).toBe("prete");

    // Le prochain PDF contient la correction
    const fait = await page.evaluate(async (projet) => (await fetch(`/livre/${projet}/pdf`, { method: "POST" })).json(), l.projet);
    const fichier = await page.request.get(fait.adresse);
    const texte = (await lirePdf(await fichier.body())).map((x) => x.lignes.join(" ")).join(" ").replaceAll("­", "").replace(/\s+/g, "");
    expect(texte).toContain("s’épaissitaumatin");

    // « Tout annuler », après confirmation sur place
    await scene(page).getByRole("button", { name: "Tout annuler" }).click();
    await scene(page).getByRole("group", { name: "Tout annuler" }).getByRole("button", { name: "Tout annuler" }).click();
    await expect.poll(async () => JSON.stringify((await sql<{ texte: unknown }>("select texte from scenes where id = $1", [l.s[0]]))[0].texte)).toContain("s’épaissi au matin");
    await expect(paragraphe).toHaveText(DEBUT);
  });

  test("F11-AC46 — l'image descendue dans la scène ouverte à côté de l'aperçu, par son repère de prise, suit le paragraphe suivant dans la scène", async ({ page }) => {
    const l = await phare(page);
    const image = await semerImage(l.base, l.compte, l.projet);
    const bloc = { type: "image", id: crypto.randomUUID(), image, largeur: 65, children: [{ text: "" }] };
    await semerBlocs(l.base, l.s[2], [recit("Le port est désert."), bloc, recit("Une mouette se pose.")]);
    await aller(page, `/projet/${l.projet}/livre?etape=relire`);
    await apercuPret(page);
    await ouvrirPassage(page, "n° 3 · S003");
    const figure = scene(page).locator(".image-bloc");
    const suivant = scene(page).locator("[data-slate-editor] p").filter({ hasText: "Une mouette se pose." });
    await figure.hover();
    const prise = (await figure.locator(".prise").boundingBox())!;
    const cible = (await suivant.boundingBox())!;
    await page.mouse.move(prise.x + prise.width / 2, prise.y + prise.height / 2);
    await page.mouse.down();
    await page.mouse.move(prise.x + 4, cible.y + cible.height - 2, { steps: 10 });
    await page.mouse.up();
    await expect
      .poll(async () => ((await sql<{ texte: { type: string }[] }>("select texte from scenes where id = $1", [l.s[2]]))[0].texte).map((b) => b.type).join(","))
      .toBe("p,p,image");
  });

  test("F11-AC83 — un renvoi suivi depuis « Relire » place l'aperçu sur sa destination, ouvre sa scène et propose « Revenir au n° 1 »", async ({ page }) => {
    const l = await phare(page);
    await aller(page, `/projet/${l.projet}/livre?etape=relire`);
    await apercuPret(page);
    await page.getByRole("button", { name: "Depuis n° 1, aller au n° 3" }).dispatchEvent("click");
    await expect(scene(page).locator(".fiche__ref")).toHaveText("S003");
    await expect(page.locator(".apercu__choisie")).toBeVisible();
    await scene(page).getByRole("button", { name: "Revenir au n° 1" }).click();
    await expect(scene(page).locator(".fiche__ref")).toHaveText("S001");
    await expect(scene(page).getByRole("button", { name: /Revenir au/ })).toHaveCount(0);
  });

  test("F11-AC85, F11-AC59 — à « Vérifier les chemins », « Ouvrir la scène » d'une impasse l'affiche à côté de l'aperçu, avec le point ; « Fermer » rend la liste ; le parcours des problèmes ouvre le suivant", async ({ page }) => {
    const l = await phare(page, { impasse: true });
    await aller(page, `/projet/${l.projet}/livre?etape=chemins`);
    await apercuPret(page);
    const fiche = page.locator(".controles");
    await expect(fiche.getByText("Cette scène est une impasse.")).toBeVisible();
    await fiche.getByRole("button", { name: "Ouvrir la scène" }).first().click();
    await expect(scene(page).locator(".fiche__ref")).toHaveText("S004");
    await expect(scene(page).getByText("Cette scène est une impasse.")).toBeVisible();
    await expect(page.locator(".apercu__choisie")).toBeVisible();
    await scene(page).getByRole("button", { name: "Fermer" }).click();
    await expect(fiche.getByText("Cette scène est une impasse.")).toBeVisible();
    // Le parcours des problèmes de l'étape
    await page.getByRole("button", { name: "Problème suivant" }).click();
    await expect(scene(page).locator(".point")).toBeVisible();
    await expect(page.locator(".parcours__nom")).toHaveText(/Problèmes 1 \/ \d/);
  });
});

test.describe("« Relire » (F11.6)", () => {
  test("F11-AC78, F11-AC87, F11-AC71 — « 1 scène à finir » ouvre le Suivi filtré ; exclue depuis son menu, elle n'y est plus et le Livre est à un geste ; le PDF de travail n'est qu'à « Relire »", async ({ page }) => {
    const l = await phare(page);
    await sql("update scenes set etat = 'cours' where id = $1", [l.s[1]]);
    await aller(page, `/projet/${l.projet}/livre?etape=relire`);
    const fiche = page.locator(".controles");
    await fiche.getByRole("button", { name: /Ce qui reste à écrire/ }).click();
    await expect(fiche.getByText("1 scène à finir")).toBeVisible();
    await fiche.getByRole("link", { name: "Voir dans le Suivi" }).click();
    await expect(page.getByText("Ouvrez une scène pour la finir et la déclarer prête, ou pour l’exclure du livre")).toBeVisible();
    await expect(page.locator(".suivi-ligne, tbody tr").filter({ hasText: "S002" })).toHaveCount(1);
    await expect(page.locator("tbody tr").filter({ hasText: "S001" })).toHaveCount(0);
    await page.locator("tbody tr").filter({ hasText: "S002" }).getByRole("link", { name: "Ouvrir" }).click();
    await page.getByLabel("Autres commandes de la scène S002").click();
    await page.getByRole("button", { name: "Exclure du livre" }).click();
    await expect(page.locator(".repere").filter({ hasText: "hors du livre" })).toBeVisible();
    await page.getByRole("link", { name: "Retour aux scènes à finir" }).click();
    await expect(page.getByText("Plus de scène à finir pour le livre.")).toBeVisible();
    await page.getByRole("link", { name: "Retour au Livre" }).click();
    await page.locator(".controles").getByRole("button", { name: /Lire et corriger/ }).click();
    await expect(page.getByRole("button", { name: "Créer le PDF de travail" })).toBeVisible();
    await aller(page, `/projet/${l.projet}/livre?etape=chemins`);
    await expect(page.locator(".controles")).toBeVisible();
    await expect(page.getByRole("button", { name: "Créer le PDF de travail" })).toHaveCount(0);
  });

  test("F11-AC88, F11-AC90 — tout prêt : « Erreurs graves » est cochée à sa place ; « J'ai relu le livre » coche l'étape ; le Livre se rouvre sur la dernière étape quittée", async ({ page }) => {
    const l = await phare(page);
    await aller(page, `/projet/${l.projet}/livre?etape=relire`);
    const fiche = page.locator(".controles");
    await fiche.getByRole("button", { name: /Erreurs graves/ }).click();
    await expect(fiche.getByText("Aucune erreur grave.")).toBeVisible();
    await fiche.getByRole("button", { name: /Lire et corriger/ }).click();
    await fiche.getByRole("button", { name: "J’ai relu le livre" }).click();
    await expect(fiche.getByText("Livre relu.")).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Étapes du livre" }).getByRole("link", { name: /Relire — terminée/ })).toBeVisible();
    // La dernière étape quittée
    await aller(page, `/projet/${l.projet}/livre?etape=chemins`);
    await expect(page.locator("#controles-t")).toBeVisible();
    await expect.poll(async () => (await sql<{ e: string }>("select derniere_etape_livre as e from projets where id = $1", [l.projet]))[0].e).toBe("chemins");
    await aller(page, `/projet/${l.projet}/livre`);
    await expect(page.locator("#controles-t")).toHaveText("Vérifier les chemins");
  });

  test("F11-AC69 — un récit classique a deux temps, « Relire » et « Mettre en page », et « Lire comme un lecteur » à « Lire et corriger »", async ({ page }) => {
    const l = await phare(page, { aChoix: false });
    await aller(page, `/projet/${l.projet}/livre`);
    await expect(page.getByRole("navigation", { name: "Étapes du livre" }).getByRole("link")).toHaveText([/Relire/, /Mettre en page/, /Imprimer et partager/]);
    await apercuPret(page);
    await page.locator(".controles").getByRole("button", { name: /Lire et corriger/ }).click();
    await expect(page.getByRole("link", { name: "Lire comme un lecteur" })).toBeVisible();
  });
});
