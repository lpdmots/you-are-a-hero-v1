import { expect, test, type Page } from "@playwright/test";
import { adultePret, aller, attendreEnBase, copie, MESSAGE, semerClasse, semerPartie, semerProjet, sql, supprimerComptes } from "./outils";

/**
 * Étape 8, lot 7 : personnages et objets de l'histoire (F10.2). Le fournisseur est simulé
 * (IA_SIMULEE) : « Repérer les personnages » rend Lou (héros), Maël et Brindille ; une fiche
 * visuelle simulée ; des portraits et des images d'objet dessinés simplement. Aucune vraie image.
 */

test.afterEach(async () => {
  await supprimerComptes();
});

const RETENU = "Lou, 10 ans, fils du dernier passeur. Son père, Maël, a disparu dans la brume. Une chouette, Brindille, le guide la nuit.";

async function passeurs(page: Page, reglages: Record<string, unknown> = {}) {
  const { compte, base } = await adultePret(page);
  await base.from("enseignants").update({ reglages_ia: reglages }).eq("id", compte.id);
  const classe = await semerClasse(base, "CM1-CM2", ["Alice"]);
  const projet = await semerProjet(base, compte, "classe", "choix", "Les passeurs de brume", classe.id);
  await base.from("preparations").update({ personnages: RETENU }).eq("projet_id", projet);
  return { compte, base, projet };
}
const cartesEnBase = (projet: string) =>
  sql<{ nom: string; heros: boolean; autres_noms: string[]; fiche: string; portrait_id: string | null }>(
    "select nom, heros, autres_noms, fiche, portrait_id from public.personnages where projet_id = $1 order by rang, cree_le",
    [projet],
  );
const PANNEAU = (page: Page) => page.locator(".panneau");
const propositionsEnStockage = async (compte: string, projet: string) =>
  (await sql("select name from storage.objects where bucket_id = 'images' and name like $1", [`${compte}/${projet}/propositions/%`])).length;

test.describe("Personnages de l'histoire (F10.2)", () => {
  test("F10-AC38 — « Repérer les personnages » propose des cartes, cochées, sans rien créer ; une décochée n'est pas ajoutée ; « Annuler » retire celles ajoutées", async ({ page }) => {
    const s = await passeurs(page);
    await aller(page, `/projet/${s.projet}/preparation?etape=personnages`);
    await page.getByRole("button", { name: "Repérer les personnages d’après le texte retenu" }).click();
    const reperes = page.getByRole("group", { name: /Personnages repérés/ });
    const noms = reperes.getByRole("textbox", { name: "Nom", exact: true });
    await expect(noms).toHaveCount(3);
    expect(await noms.evaluateAll((champs) => champs.map((c) => (c as HTMLInputElement).value))).toEqual(["Lou", "Maël", "Brindille"]);
    expect(await cartesEnBase(s.projet)).toEqual([]);
    // Lou est marqué héros ; Brindille décochée ; le nom de Maël retouché
    await expect(reperes.getByRole("checkbox", { name: "Héros" }).first()).toBeChecked();
    await reperes.getByRole("checkbox", { name: "Ajouter Brindille" }).uncheck();
    await reperes.getByRole("textbox", { name: "Nom", exact: true }).nth(1).fill("Maël le passeur");
    await reperes.getByRole("button", { name: "Ajouter 2 personnages" }).click();
    await expect(MESSAGE(page)).toContainText("2 personnages ajoutés.");
    await expect.poll(async () => (await cartesEnBase(s.projet)).map((c) => [c.nom, c.heros])).toEqual([["Lou", true], ["Maël le passeur", false]]);
    await expect(page.getByRole("button", { name: "Ouvrir la carte de Lou" })).toContainText("héros");
    await MESSAGE(page).getByRole("button", { name: "Annuler" }).click();
    await expect.poll(async () => (await cartesEnBase(s.projet)).length).toBe(0);
  });

  test("F10-AC39 — plusieurs héros, sans limite : la liste dit que le lecteur choisit le sien ; le panneau dit d'écrire leur compétence", async ({ page }) => {
    const s = await passeurs(page);
    await s.base.from("personnages").insert([
      { projet_id: s.projet, enseignant_id: s.compte.id, nom: "Lou", heros: true, rang: 0 },
      { projet_id: s.projet, enseignant_id: s.compte.id, nom: "Mina", heros: false, rang: 1 },
    ]);
    await aller(page, `/projet/${s.projet}/preparation?etape=personnages`);
    await expect(page.getByText("héros : le lecteur choisit le sien")).toHaveCount(0);
    await page.getByRole("button", { name: "Ouvrir la carte de Mina" }).click();
    await PANNEAU(page).getByText("Héros", { exact: true }).click();
    await expect(PANNEAU(page).getByRole("switch", { name: "Héros" })).toBeChecked();
    await expect(PANNEAU(page)).toContainText("Le lecteur choisit son héros : dites ce que chacun sait faire.");
    await PANNEAU(page).getByLabel("Description").fill("Elle sait nager.");
    await PANNEAU(page).getByRole("button", { name: "Fermer", exact: true }).last().click();
    await expect(page.getByText("2 héros : le lecteur choisit le sien au début du livre.")).toBeVisible();
    await expect.poll(async () => (await cartesEnBase(s.projet)).map((c) => c.heros)).toEqual([true, true]);
  });

  test("une carte ajoutée à la main s'ouvre ; ses autres noms se lisent d'une ligne ; supprimée, « Annuler » la rend", async ({ page }) => {
    const s = await passeurs(page);
    await aller(page, `/projet/${s.projet}/preparation?etape=personnages`);
    await page.getByRole("button", { name: "Ajouter un personnage" }).click();
    await page.getByRole("textbox", { name: "Nom du personnage" }).fill("Maël");
    await page.getByRole("textbox", { name: "Nom du personnage" }).press("Enter");
    await expect(PANNEAU(page).getByRole("heading", { name: "Maël" })).toBeVisible();
    await PANNEAU(page).getByLabel("Autres noms").fill("le passeur, le vieux Maël, Maël");
    await PANNEAU(page).getByLabel("Autres noms").blur();
    await expect.poll(async () => (await cartesEnBase(s.projet))[0]?.autres_noms).toEqual(["le passeur", "le vieux Maël"]);
    // Le premier personnage ajouté est le héros
    expect((await cartesEnBase(s.projet))[0].heros).toBe(true);
    await PANNEAU(page).getByRole("button", { name: "Supprimer la carte" }).click();
    await expect(MESSAGE(page)).toContainText("La carte de « Maël » est supprimée.");
    await MESSAGE(page).getByRole("button", { name: "Annuler" }).click();
    await expect.poll(async () => (await cartesEnBase(s.projet)).map((c) => [c.nom, c.autres_noms])).toEqual([["Maël", ["le passeur", "le vieux Maël"]]]);
  });

  test("F10-AC40, F10-AC41 — la fiche proposée ne change rien avant « Utiliser ce texte » ; sans fiche, pas de portrait ; deux portraits, l'un gardé, téléchargeable, l'autre effacé", async ({ page }) => {
    const s = await passeurs(page, { imagesParCreation: 2 });
    await s.base.from("personnages").insert({ projet_id: s.projet, enseignant_id: s.compte.id, nom: "Lou", heros: true, description: "Fils du passeur, dix ans." });
    await aller(page, `/projet/${s.projet}/preparation?etape=personnages`);
    await page.getByRole("button", { name: "Ouvrir la carte de Lou" }).click();
    await expect(PANNEAU(page).getByRole("button", { name: "Créer son portrait" })).toBeDisabled();
    await expect(PANNEAU(page)).toContainText("Écrivez d’abord la fiche visuelle, ou faites-la préciser.");
    await PANNEAU(page).getByRole("button", { name: "Préciser pour les images" }).click();
    await expect(PANNEAU(page).getByRole("textbox", { name: "Fiche proposée" })).toHaveValue(/Ciré jaune moutarde/);
    expect((await cartesEnBase(s.projet))[0].fiche).toBe("");
    await PANNEAU(page).getByRole("button", { name: "Utiliser ce texte" }).click();
    await expect(MESSAGE(page)).toContainText("La fiche visuelle est remplie.");
    await expect.poll(async () => (await cartesEnBase(s.projet))[0].fiche).toMatch(/Ciré jaune moutarde/);

    await PANNEAU(page).getByRole("button", { name: "Créer son portrait" }).click();
    await expect(PANNEAU(page).getByRole("img", { name: /Proposition/ })).toHaveCount(2);
    expect(await propositionsEnStockage(s.compte.id, s.projet)).toBe(2);
    expect((await cartesEnBase(s.projet))[0].portrait_id).toBeNull();
    await PANNEAU(page).getByRole("button", { name: "Garder celle-ci" }).first().click();
    await expect(MESSAGE(page)).toContainText("Portrait de « Lou » gardé.");
    await expect.poll(async () => (await cartesEnBase(s.projet))[0].portrait_id).not.toBeNull();
    // L'image gardée rejoint les images du projet ; l'autre proposition n'est pas conservée
    await expect.poll(() => propositionsEnStockage(s.compte.id, s.projet)).toBe(0);
    const portrait = (await cartesEnBase(s.projet))[0].portrait_id!;
    expect(await sql("select 1 from public.images where id = $1 and projet_id = $2", [portrait, s.projet])).toHaveLength(1);
    await expect(PANNEAU(page).getByRole("link", { name: "Télécharger" })).toHaveAttribute("download", "Portrait de Lou.jpg");
    await expect(PANNEAU(page).getByRole("link", { name: "Télécharger" })).toHaveAttribute("href", `/images/${portrait}`);
    // Le héros est absent des images, par défaut : le panneau le rappelle
    await expect(PANNEAU(page)).toContainText("Le héros n’est pas dessiné dans les images de scène");
    // Refermé avec des propositions en attente, rien n'est conservé
    await PANNEAU(page).getByRole("button", { name: "Créer un autre portrait" }).click();
    await expect(PANNEAU(page).getByRole("img", { name: /Proposition/ })).toHaveCount(2);
    await PANNEAU(page).getByRole("button", { name: "Fermer", exact: true }).last().click();
    await expect.poll(() => propositionsEnStockage(s.compte.id, s.projet)).toBe(0);
    expect((await cartesEnBase(s.projet))[0].portrait_id).toBe(portrait);
    await expect(page.getByRole("button", { name: "Ouvrir la carte de Lou" }).locator("img")).toHaveAttribute("src", `/images/${portrait}?v=1`);
  });

  test("F10-AC42 — un objet de l'histoire s'ouvre dans le panneau : fiche visuelle et image de référence", async ({ page }) => {
    const s = await passeurs(page);
    await s.base.from("objets").insert({ projet_id: s.projet, enseignant_id: s.compte.id, nom: "la lanterne de cuivre", description: "Celle du père." });
    await aller(page, `/projet/${s.projet}/preparation?etape=jeu`);
    await page.getByRole("button", { name: "Modifier la lanterne de cuivre" }).click();
    await PANNEAU(page).getByLabel("Fiche visuelle").fill("Cuivre patiné, verre bleuté, grande comme une main.");
    await PANNEAU(page).getByRole("button", { name: "Créer son image" }).click();
    await PANNEAU(page).getByRole("button", { name: "Garder" }).click();
    await expect(MESSAGE(page)).toContainText("Image de « la lanterne de cuivre » gardée.");
    const objet = async () => (await sql<{ fiche: string; image_id: string | null }>("select fiche, image_id from public.objets where projet_id = $1", [s.projet]))[0];
    await expect.poll(async () => (await objet()).image_id).not.toBeNull();
    expect((await objet()).fiche).toBe("Cuivre patiné, verre bleuté, grande comme une main.");
    await PANNEAU(page).getByRole("button", { name: "Fermer", exact: true }).last().click();
    await expect(page.locator(`img[src="/images/${(await objet()).image_id}?v=1"]`)).toBeVisible();
  });

  test("aides éteintes : ni ✦ de repérage, ni « Préciser », ni portrait à créer ; la fiche s'écrit à la main", async ({ page }) => {
    const s = await passeurs(page, { proposer: false });
    await s.base.from("personnages").insert({ projet_id: s.projet, enseignant_id: s.compte.id, nom: "Lou", heros: true });
    await aller(page, `/projet/${s.projet}/preparation?etape=personnages`);
    await expect(page.getByRole("button", { name: "Repérer les personnages d’après le texte retenu" })).toHaveCount(0);
    await page.getByRole("button", { name: "Ouvrir la carte de Lou" }).click();
    await expect(PANNEAU(page).getByRole("button", { name: "Préciser pour les images" })).toHaveCount(0);
    await expect(PANNEAU(page).getByRole("button", { name: "Créer son portrait" })).toHaveCount(0);
    await PANNEAU(page).getByLabel("Fiche visuelle").fill("Ciré jaune.");
    await PANNEAU(page).getByLabel("Fiche visuelle").blur();
    await expect.poll(async () => (await cartesEnBase(s.projet))[0].fiche).toBe("Ciré jaune.");
  });
});

test.describe("`/personnage` et les options du projet (F10.2)", () => {
  test("F10-AC43 — « /personnage » propose les personnages et leurs autres noms ; le nom retenu s'écrit comme du texte ordinaire", async ({ page }) => {
    const s = await passeurs(page);
    await s.base.from("personnages").insert({ projet_id: s.projet, enseignant_id: s.compte.id, nom: "Maël", autres_noms: ["le passeur"] });
    const { chapitres } = await semerPartie(s.base, s.projet, "Le port", [{ titre: "Le départ", scenes: ["Le quai"] }]);
    const scene = chapitres[0].scenes[0];
    await aller(page, `/projet/${s.projet}/scene/${scene}`);
    await copie(page).click();
    await page.keyboard.type("Au bout du quai, /perso");
    await page.keyboard.press("Enter");
    const liste = page.getByRole("dialog", { name: "Personnages de l’histoire" });
    await expect(liste.getByRole("option")).toHaveText(["Maël", /le passeur/]);
    await expect(liste.getByLabel("Chercher un personnage")).toBeFocused();
    await page.keyboard.type("passeur");
    await expect(liste.getByRole("option")).toHaveText([/le passeur/]);
    await page.keyboard.press("Enter");
    await expect(liste).toHaveCount(0);
    await expect(copie(page)).toBeFocused();
    await page.keyboard.type(" attend.");
    await attendreEnBase(scene, "Au bout du quai, le passeur attend.");
  });

  test("F10-AC45 — le style des images et le héros absent se règlent dans les options du projet ; « Autre » se décrit", async ({ page }) => {
    const s = await passeurs(page);
    await aller(page, `/projet/${s.projet}/preparation`);
    await page.getByLabel("Autres commandes du projet Les passeurs de brume").click();
    await page.getByRole("button", { name: "Réglages du projet" }).click();
    await expect(page.getByLabel("Style des images")).toHaveValue("lumineuse");
    await expect(page.getByRole("switch", { name: "Héros absent des images" })).toBeChecked();
    await page.getByLabel("Style des images").selectOption("autre");
    await page.getByRole("textbox", { name: "Le style, décrit par sa technique" }).fill("linogravure en deux couleurs");
    await page.getByRole("textbox", { name: "Le style, décrit par sa technique" }).blur();
    await page.getByText("Héros absent des images", { exact: true }).click();
    await expect(page.getByRole("switch", { name: "Héros absent des images" })).not.toBeChecked();
    const projet = async () => (await sql("select style_images, style_autre, heros_absent from public.projets where id = $1", [s.projet]))[0];
    await expect.poll(projet).toEqual({ style_images: "autre", style_autre: "linogravure en deux couleurs", heros_absent: false });
    await expect(PANNEAU(page)).toContainText("Le héros est dessiné d’après sa carte et son portrait");
  });
});
