import { expect, test, type Page } from "@playwright/test";
import {
  adultePret, aller, copie, FICHE, MESSAGE, posteDe, recit, sceneEnBase, semerBlocs, semerImageDeposee, semerPartie, semerProjet, sql, supprimerComptes, classeQuiEcrit,
} from "./outils";

/**
 * Étape 8, lot 8 : les images créées (F10.1, F10.2, F11.4). Le fournisseur est simulé
 * (IA_SIMULEE) : les images sont deux visuels de l'application réduits, la description reprend
 * l'idée donnée. Aucune vraie image, aucune dépense.
 */

test.afterEach(async () => {
  await supprimerComptes();
});

const BARRE = (page: Page) => page.getByRole("toolbar", { name: "Outils de la copie" });
const CREER = (page: Page) => page.getByRole("region", { name: "Créer une image" });
const appelsImages = (compte: string) =>
  sql<{ aide: string; nombre: number }>("select aide, nombre from public.appels_ia where enseignant_id = $1 and sorte = 'image' order by commence_le", [compte]);

async function passeurs(page: Page, reglages: Record<string, unknown> = {}) {
  const { compte, base } = await adultePret(page);
  if (Object.keys(reglages).length) await base.from("enseignants").update({ reglages_ia: reglages }).eq("id", compte.id);
  const projet = await semerProjet(base, compte, "personnel", "choix", "Les passeurs de brume");
  await base.from("projets").update({ style_images: "aquarelle" }).eq("id", projet);
  const foret = await semerPartie(base, projet, "La forêt", [{ titre: "La lisière", scenes: ["Le ponton"] }]);
  return { compte, base, projet, foret, chapitre: foret.chapitres[0].id, scene: foret.chapitres[0].scenes[0] };
}

test.describe("L'image de repérage d'après le résumé (F10.1)", () => {
  test("F10-AC48 — « Choisir une image » d'un chapitre : « Créer une image d'après le résumé » ; la première se pose d'office, la seconde attend en tête du panneau, et se garde à la place", async ({ page }) => {
    const s = await passeurs(page, { imagesParCreation: 2 });
    await s.base.from("chapitres").update({ resume: "Lou entre dans la forêt au crépuscule." }).eq("id", s.chapitre);
    await aller(page, `/projet/${s.projet}/plan`);
    await page.getByLabel("Autres commandes du chapitre La lisière").click();
    await page.getByRole("button", { name: "Réglages", exact: true }).click();
    await page.getByRole("complementary").getByRole("button", { name: "Choisir une image" }).click();
    await page.getByRole("button", { name: "Créer une image d’après le résumé" }).click();
    await expect(page.getByText("Vous pouvez fermer : elle se posera d’elle-même.")).toBeVisible();
    const autre = page.getByRole("group", { name: /Une autre proposition/ });
    await expect(autre.getByRole("img")).toHaveCount(1);
    expect(await appelsImages(s.compte.id)).toEqual([{ aide: "image-reperage", nombre: 2 }]);
    // Un lieu, sans personnage : candidate à la bibliothèque (F10-AC55)
    expect((await sql<{ s: boolean }>("select sans_personnage as s from demandes_d_images where cible_id = $1", [s.chapitre]))[0].s).toBe(true);
    const premiere = (await sql<{ image_id: string }>("select image_id from chapitres where id = $1", [s.chapitre]))[0].image_id;
    expect(premiere).not.toBeNull();
    await autre.getByRole("button", { name: "Garder celle-ci" }).click();
    await expect(page.getByRole("heading", { name: "Choisir une image" })).toHaveCount(0);
    await expect.poll(async () => (await sql("select image_id from chapitres where id = $1", [s.chapitre]))[0].image_id).not.toBe(premiere);
    // Les deux sont parmi les images du projet ; aucune proposition ne reste en attente
    expect((await sql("select id from images where projet_id = $1", [s.projet])).length).toBe(2);
    await expect.poll(async () => (await sql("select name from storage.objects where name like $1", [`${s.compte.id}/${s.projet}/propositions/%`])).length).toBe(0);
  });

  test("F10-AC48 — on demande, on ferme, on continue : l'image se pose d'elle-même, et la carte attend avec son signe", async ({ page }) => {
    const s = await passeurs(page);
    await s.base.from("chapitres").update({ resume: "Lou entre dans la forêt au crépuscule." }).eq("id", s.chapitre);
    await aller(page, `/projet/${s.projet}/plan`);
    await page.getByLabel("Autres commandes du chapitre La lisière").click();
    await page.getByRole("button", { name: "Réglages", exact: true }).click();
    await page.getByRole("complementary").getByRole("button", { name: "Choisir une image" }).click();
    await page.getByRole("button", { name: "Créer une image d’après le résumé" }).click();
    await page.getByRole("button", { name: "Fermer", exact: true }).last().click();
    await page.keyboard.press("Escape");
    await expect.poll(async () => (await sql("select image_id from chapitres where id = $1", [s.chapitre]))[0].image_id).not.toBeNull();
    await expect(page.locator(".attente-image")).toHaveCount(0);
  });

  test("F10-AC48 — sans résumé, le bouton est éteint et dit pourquoi ; aides éteintes, il n'y est pas", async ({ page }) => {
    const s = await passeurs(page);
    await aller(page, `/projet/${s.projet}/plan`);
    await page.getByLabel("Autres commandes du chapitre La lisière").click();
    await page.getByRole("button", { name: "Réglages", exact: true }).click();
    await page.getByRole("complementary").getByRole("button", { name: "Choisir une image" }).click();
    await expect(page.getByRole("button", { name: "Créer une image d’après le résumé" })).toBeDisabled();
    await expect(page.getByText("Écrivez d’abord le résumé du chapitre.")).toBeVisible();
    await s.base.from("enseignants").update({ reglages_ia: { proposer: false } }).eq("id", s.compte.id);
    await page.reload();
    await page.getByLabel("Autres commandes du chapitre La lisière").click();
    await page.getByRole("button", { name: "Réglages", exact: true }).click();
    await page.getByRole("complementary").getByRole("button", { name: "Choisir une image" }).click();
    await expect(page.getByRole("heading", { name: "Visuels proposés" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Créer une image d’après le résumé" })).toHaveCount(0);
  });
});

test.describe("L'image d'une scène (F10.2)", () => {
  async function avecPersonnages(page: Page, reglages: Record<string, unknown> = {}) {
    const s = await passeurs(page, reglages);
    const portrait = await semerImageDeposee(s.base, s.compte, s.projet);
    await s.base.from("personnages").insert([
      { projet_id: s.projet, enseignant_id: s.compte.id, nom: "Lou", autres_noms: [], heros: true, fiche: "Dix ans, ciré moutarde.", portrait_id: portrait, rang: 0 },
      { projet_id: s.projet, enseignant_id: s.compte.id, nom: "Maël", autres_noms: ["le passeur"], heros: false, fiche: "Grand, barbe grise.", portrait_id: portrait, rang: 1 },
    ]).throwOnError();
    await s.base.from("objets").insert({ projet_id: s.projet, enseignant_id: s.compte.id, nom: "la lanterne de cuivre", description: "Celle du père.", fiche: "Cuivre patiné." });
    await semerBlocs(s.base, s.scene, [recit("Le passeur t’attend au bout du ponton, sans un mot.")]);
    return s;
  }

  test("F10-AC49, F10-AC11 — fermée tant qu'on ne l'ouvre pas ; « Créer une image » : le passeur nommé a son badge, le héros absent n'en a pas, « + » ajoute la lanterne ; la description proposée, puis l'image en pleine page posée dans la scène", async ({ page }) => {
    const s = await avecPersonnages(page);
    await aller(page, `/projet/${s.projet}/scene/${s.scene}`);
    await expect(CREER(page)).toHaveCount(0);
    await copie(page).click();
    await BARRE(page).getByRole("button", { name: "Image" }).click();
    await FICHE(page).getByRole("button", { name: "Créer une image" }).click();
    const panneau = CREER(page);
    const badges = panneau.getByRole("group", { name: "Dans l’image" });
    await expect(badges.getByRole("listitem").filter({ hasText: "Maël" })).toBeVisible();
    await expect(badges.getByRole("listitem").filter({ hasText: /^Lou/ })).toHaveCount(0);
    await expect(panneau.getByText("Lou n’est pas dessiné : au plus des mains")).toBeVisible();
    await badges.getByLabel("Ajouter un personnage ou un objet à l’image").click();
    await page.getByRole("button", { name: "la lanterne de cuivre" }).click();
    await expect(badges.getByRole("listitem").filter({ hasText: "la lanterne de cuivre" })).toBeVisible();
    // Sans idée ni description, rien ne se crée et le bouton dit pourquoi
    await expect(panneau.getByRole("button", { name: "Créer l’image" })).toBeDisabled();
    await panneau.getByLabel("Ce que montre l’image").fill("le passeur et sa lanterne dans la brume");
    await panneau.getByRole("radio", { name: "Pleine page" }).check({ force: true });
    await expect(panneau.getByText("Haute qualité (automatique)")).toBeVisible();
    await panneau.getByRole("button", { name: "Proposer la description" }).click();
    await expect(panneau.getByLabel("Ce que montre l’image")).toHaveValue("le passeur et sa lanterne dans la brume, dans une lumière de fin de journée.");
    await panneau.getByRole("button", { name: "Créer l’image" }).click();
    const proposition = panneau.getByRole("group", { name: /Proposition/ });
    await expect(proposition.getByRole("img")).toHaveCount(1);
    expect(await appelsImages(s.compte.id)).toEqual([{ aide: "image-scene", nombre: 1 }]);
    // Le passeur y figure : elle ne sera jamais proposée à la bibliothèque (F10-AC55)
    expect((await sql<{ s: boolean }>("select sans_personnage as s from demandes_d_images where cible_id = $1", [s.scene]))[0].s).toBe(false);
    await proposition.getByRole("button", { name: "Garder" }).click();
    // Posée dans la scène, en pleine page ; ses réglages s'ouvrent à la place
    await expect(copie(page).locator(".image-bloc")).toHaveCount(1);
    await expect(FICHE(page).getByRole("radio", { name: "Pleine page" })).toBeChecked();
    await expect.poll(async () => (await sceneEnBase(s.scene)).texte.map((b) => b.type)).toEqual(["p", "image"]);
    // Ce qu'on en lit à voix haute : l'idée de départ
    expect((await sceneEnBase(s.scene)).texte[1]).toMatchObject({ page: true, largeur: 100, alt: "le passeur et sa lanterne dans la brume" });
    // L'idée et la description restent avec la scène
    expect((await sql("select idee_image, description_image from scenes where id = $1", [s.scene]))[0]).toEqual({
      idee_image: "le passeur et sa lanterne dans la brume", description_image: expect.stringContaining("le passeur et sa lanterne"),
    });
  });

  test("19 octobre 2026 — panneau ouvert, l'image arrive, « Garder » : une seule image dans la scène, même avec un serveur lent et la proposition dans le cache du navigateur", async ({ page }) => {
    const s = await avecPersonnages(page, { imagesParCreation: 2 });
    // Comme en ligne : le doublon venait de la pose d'office, qui reprenait la proposition dans le cache
    const cache = new Map<string, Buffer>();
    await page.route("**/images/proposition/**", async (route) => {
      const url = route.request().url();
      if (cache.has(url)) return route.fulfill({ status: 200, contentType: "image/jpeg", body: cache.get(url)! });
      const reponse = await route.fetch();
      if (reponse.ok()) cache.set(url, await reponse.body());
      await route.fulfill({ response: reponse });
    });
    await page.route("**/*", async (route) => {
      const r = route.request();
      if (r.method() === "POST" && r.headers()["next-action"]) await new Promise((f) => setTimeout(f, 700));
      await route.fallback();
    });
    await aller(page, `/projet/${s.projet}/scene/${s.scene}`);
    await copie(page).click();
    await BARRE(page).getByRole("button", { name: "Image" }).click();
    await FICHE(page).getByRole("button", { name: "Créer une image" }).click();
    await CREER(page).getByLabel("Ce que montre l’image").fill("le passeur sur le ponton");
    await CREER(page).getByRole("button", { name: "Créer l’image" }).click();
    await CREER(page).getByRole("button", { name: "Garder celle-ci" }).first().click();
    await expect(copie(page).locator(".image-bloc")).toHaveCount(1);
    await page.waitForTimeout(4000);
    await expect(copie(page).locator(".image-bloc")).toHaveCount(1);
    await expect.poll(async () => (await sceneEnBase(s.scene)).texte.map((b) => b.type)).toEqual(["p", "image"]);
  });

  test("F10-AC07 — « Copier le prompt » : le prompt complet, style et fiches compris, dans le presse-papiers, sans appel d'image ; rien n'est inséré", async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    const s = await avecPersonnages(page);
    await aller(page, `/projet/${s.projet}/scene/${s.scene}`);
    await copie(page).click();
    await BARRE(page).getByRole("button", { name: "Image" }).click();
    await FICHE(page).getByRole("button", { name: "Créer une image" }).click();
    await CREER(page).getByLabel("Ce que montre l’image").fill("la grotte avec des cristaux bleus");
    await CREER(page).getByRole("button", { name: "Copier le prompt" }).click();
    await expect(MESSAGE(page)).toContainText("Prompt copié");
    const prompt = await page.evaluate(() => navigator.clipboard.readText());
    expect(prompt).toContain("la grotte avec des cristaux bleus");
    expect(prompt).toContain("aquarelle douce");
    expect(prompt).toContain("- Maël : Grand, barbe grise. (image de référence 1)");
    expect(prompt).toContain("n'est pas représenté");
    expect(await appelsImages(s.compte.id)).toEqual([]);
    expect((await sceneEnBase(s.scene)).texte.map((b) => b.type)).toEqual(["p"]);
  });

  test("aides éteintes : « Préparer le prompt d'une image », sans ✦ ni « Créer l'image » ; le prompt se copie", async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    const s = await avecPersonnages(page, { proposer: false });
    await aller(page, `/projet/${s.projet}/scene/${s.scene}`);
    await copie(page).click();
    await BARRE(page).getByRole("button", { name: "Image" }).click();
    await expect(FICHE(page).getByRole("button", { name: "Créer une image" })).toHaveCount(0);
    await FICHE(page).getByRole("button", { name: "Préparer le prompt d’une image" }).click();
    const panneau = page.getByRole("region", { name: "Créer une image" });
    await expect(panneau.getByRole("heading", { name: "Prompt d’une image" })).toBeVisible();
    await expect(panneau.locator(".btn--ia")).toHaveCount(0);
    await expect(panneau.getByRole("button", { name: "Créer l’image" })).toHaveCount(0);
    await panneau.getByLabel("Ce que montre l’image").fill("le ponton désert");
    await panneau.getByRole("button", { name: "Copier le prompt" }).click();
    await expect(MESSAGE(page)).toContainText("Prompt copié");
    expect(await page.evaluate(() => navigator.clipboard.readText())).toContain("le ponton désert");
  });
});

test.describe("L'idée d'image de l'élève (F10.2)", () => {
  test("F10-AC10, F10-AC11 — l'élève écrit son idée dans « Mon idée d'image », fermée au départ, sans aucune commande d'IA ; l'adulte la retrouve en créant l'image", async ({ page, browser }) => {
    const s = await classeQuiEcrit(page, ["Alice", "Bilal"]);
    const scene = s.lisiere.scenes[0];
    const alice = await posteDe(browser, s, "Alice");
    await aller(alice.page, `/travail/scene/${scene}`);
    const idee = alice.page.locator("details", { hasText: "Mon idée d’image" });
    await expect(idee).not.toHaveAttribute("open", "");
    await idee.locator("summary").press("Enter");
    await idee.getByRole("textbox").fill("une grotte pleine de cristaux bleus");
    await idee.getByRole("textbox").blur();
    await expect(idee.getByText("Enregistrée.")).toBeVisible();
    await expect(alice.page.locator(".btn--ia")).toHaveCount(0);
    expect((await sql("select idee_image from scenes where id = $1", [scene]))[0].idee_image).toBe("une grotte pleine de cristaux bleus");
    await alice.contexte.close();

    await aller(page, `/projet/${s.projet}/scene/${scene}`);
    await copie(page).click();
    await BARRE(page).getByRole("button", { name: "Image" }).click();
    await FICHE(page).getByRole("button", { name: "Créer une image" }).click();
    await expect(CREER(page).getByLabel("Ce que montre l’image")).toHaveValue("une grotte pleine de cristaux bleus");
  });
});

test.describe("L'image créée d'office à l'ajout par l'IA (F10.1)", () => {
  test("F10-AC50 — un chapitre ajouté depuis une proposition de l'IA reçoit une image d'après son résumé ; la mention le dit, et s'éteint sur place", async ({ page }) => {
    const s = await passeurs(page, { imagesParCreation: 2 });
    await aller(page, `/projet/${s.projet}/plan`);
    await page.getByRole("button", { name: "Demander des chapitres à l’IA pour « La forêt »" }).click();
    const espace = page.getByRole("group", { name: "Chapitres proposés pour « La forêt »" });
    await espace.getByRole("button", { name: "Proposer des chapitres" }).click();
    await expect(espace.getByText("Image créée à l’ajout")).toBeVisible();
    await espace.getByRole("button", { name: "Ajouter ce chapitre" }).click();
    await expect(MESSAGE(page)).toContainText("est ajouté à la fin de « La forêt »");
    await expect
      .poll(async () => (await sql<{ image_id: string | null }>("select image_id from chapitres where partie_id = $1 and titre = 'Le gué des saules'", [s.foret.partieId]))[0]?.image_id)
      .not.toBeNull();
    expect(await appelsImages(s.compte.id)).toEqual([{ aide: "image-ajout", nombre: 1 }]);
    const mention = espace.getByRole("switch", { name: "Image créée à l’ajout" });
    await expect(mention).toBeChecked();
    await espace.getByText("Image créée à l’ajout").click();
    await expect(mention).not.toBeChecked();
    await expect
      .poll(async () => (await sql<{ r: { imageALAjout?: boolean } }>("select reglages_ia as r from enseignants where id = $1", [s.compte.id]))[0].r.imageALAjout)
      .toBe(false);
    await aller(page, "/compte");
    await expect(page.getByRole("switch", { name: "Créer l’image des parties et chapitres ajoutés par l’IA" })).not.toBeChecked();
  });

  test("F10-AC51 — réglage éteint : ni mention ni image ; un ajout à la main ne crée jamais d'image", async ({ page }) => {
    const s = await passeurs(page, { imageALAjout: false });
    await aller(page, `/projet/${s.projet}/plan`);
    await page.getByRole("button", { name: "Demander des chapitres à l’IA pour « La forêt »" }).click();
    const espace = page.getByRole("group", { name: "Chapitres proposés pour « La forêt »" });
    await espace.getByRole("button", { name: "Proposer des chapitres" }).click();
    await expect(espace.getByRole("textbox", { name: "Titre du chapitre proposé" })).toHaveValue("Le gué des saules");
    await expect(espace.getByText("Image créée à l’ajout")).toHaveCount(0);
    await espace.getByRole("button", { name: "Ajouter ce chapitre" }).click();
    await expect(MESSAGE(page)).toContainText("est ajouté à la fin de « La forêt »");
    await page.waitForTimeout(1500);
    expect(await appelsImages(s.compte.id)).toEqual([]);
  });
});

test.describe("Le prompt de couverture (F11.4)", () => {
  test("F10-AC52 — « Le prompt de l'image de face », replié : l'idée, la description proposée, puis le prompt au format du livre dans le presse-papiers", async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    const s = await passeurs(page);
    await sql(
      "update projets set mise_en_page_ouverte_le = now(), livre_relu_le = now(), chemins_verifies_le = now(), mise_en_page_convient_le = now(), imprimer_ouvert_le = now() where id = $1",
      [s.projet],
    );
    await aller(page, `/projet/${s.projet}/livre?etape=sortie`);
    const prompt = page.locator("details.couverture__prompt");
    await expect(prompt).not.toHaveAttribute("open", "");
    await prompt.locator("summary").click();
    await prompt.getByLabel("Ce que montre la couverture").fill("le bac sur le lac au lever du jour");
    await prompt.getByRole("button", { name: "Proposer la description" }).click();
    await expect(prompt.getByLabel("Ce que montre la couverture")).toHaveValue(/le bac sur le lac au lever du jour, dans une lumière/);
    await prompt.getByRole("button", { name: "Copier le prompt" }).click();
    await expect(MESSAGE(page)).toContainText("Prompt copié");
    const texte = await page.evaluate(() => navigator.clipboard.readText());
    expect(texte).toContain("Illustration de couverture");
    expect(texte).toContain("A5, 148 × 210 mm");
    expect(texte).toContain("le bac sur le lac");
    expect(await appelsImages(s.compte.id)).toEqual([]);
  });
});
