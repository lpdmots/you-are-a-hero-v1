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

const RETENU_TEXTE = "Lou, 10 ans, fils du dernier passeur. Son père, Maël, a disparu dans la brume. Une chouette, Brindille, le guide la nuit.";

async function passeurs(page: Page, reglages: Record<string, unknown> = {}) {
  const { compte, base } = await adultePret(page);
  await base.from("enseignants").update({ reglages_ia: reglages }).eq("id", compte.id);
  const classe = await semerClasse(base, "CM1-CM2", ["Alice"]);
  const projet = await semerProjet(base, compte, "classe", "choix", "Les passeurs de brume", classe.id);
  await base.from("preparations").update({ personnages: RETENU_TEXTE }).eq("projet_id", projet);
  return { compte, base, projet };
}
const cartesEnBase = (projet: string) =>
  sql<{ nom: string; heros: boolean; autres_noms: string[]; fiche: string; portrait_id: string | null }>(
    "select nom, heros, autres_noms, fiche, portrait_id from public.personnages where projet_id = $1 order by rang, cree_le",
    [projet],
  );
const PANNEAU = (page: Page) => page.locator(".panneau");
const ONGLETS = (page: Page) => page.getByRole("navigation", { name: "Les héros et les autres personnages" });
const QUESTIONS = (page: Page) => page.getByRole("region", { name: /^Questions pour/ });
const RETENU = (page: Page) => page.getByRole("textbox", { name: "Nous retenons…", exact: true });
const propositionsEnStockage = async (compte: string, projet: string) =>
  (await sql("select name from storage.objects where bucket_id = 'images' and name like $1", [`${compte}/${projet}/propositions/%`])).length;

test.describe("Personnages de l'histoire (F10.2)", () => {
  test("F10-AC38 — dans « Autres personnages », « Repérer les personnages » propose des cartes, cochées, sans rien créer ; une décochée n'est pas ajoutée ; un héros repéré prend son onglet ; « Annuler » retire les cartes", async ({ page }) => {
    const s = await passeurs(page);
    await aller(page, `/projet/${s.projet}/preparation?etape=personnages&heros=autres`);
    await expect(page.getByRole("heading", { name: /Qui d’autre croise/ })).toBeVisible();
    await page.getByRole("button", { name: "Repérer les personnages d’après le texte retenu" }).click();
    const reperes = page.getByRole("group", { name: /Personnages repérés/ });
    const noms = reperes.getByRole("textbox", { name: "Nom", exact: true });
    await expect(noms).toHaveCount(3);
    expect(await noms.evaluateAll((champs) => champs.map((c) => (c as HTMLInputElement).value))).toEqual(["Lou", "Maël", "Brindille"]);
    expect(await cartesEnBase(s.projet)).toEqual([]);
    await expect(reperes.getByRole("checkbox", { name: "Héros" }).first()).toBeChecked();
    await reperes.getByRole("checkbox", { name: "Ajouter Brindille" }).uncheck();
    await noms.nth(1).fill("Maël le passeur");
    await reperes.getByRole("button", { name: "Ajouter 2 personnages" }).click();
    await expect(MESSAGE(page)).toContainText("2 personnages ajoutés.");
    await expect.poll(async () => (await cartesEnBase(s.projet)).map((c) => [c.nom, c.heros])).toEqual([["Lou", true], ["Maël le passeur", false]]);
    // Lou, héros, a son onglet ; la liste des autres ne montre que Maël
    await expect(ONGLETS(page).getByRole("link", { name: "Lou" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Ouvrir la carte de Maël le passeur" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Ouvrir la carte de Lou" })).toHaveCount(0);
    await MESSAGE(page).getByRole("button", { name: "Annuler" }).click();
    await expect.poll(async () => (await cartesEnBase(s.projet)).length).toBe(0);
  });

  test("F10-AC46 — un onglet par héros : chacun sa question, ses questions, ses idées et son « Nous retenons », qui est sa description ; deux héros, le lecteur choisit le sien", async ({ page }) => {
    const s = await passeurs(page);
    const [lou] = (await s.base.from("personnages").insert({ projet_id: s.projet, enseignant_id: s.compte.id, nom: "Lou", heros: true, rang: 0, description: "Lou, 10 ans." }).select("id")).data!;
    await s.base.from("pistes").insert({ projet_id: s.projet, enseignant_id: s.compte.id, rubrique: "personnages", texte: "Il a peur de l’eau", personnage_id: lou.id });
    await aller(page, `/projet/${s.projet}/preparation?etape=personnages`);
    await expect(page.getByRole("heading", { level: 2 })).toHaveText("Qui est Lou ?");
    await expect(QUESTIONS(page).getByRole("listitem")).toHaveText([/Quel âge a Lou/, /fait peur à Lou/, /Qui va aider Lou/, /Un seul héros, ou plusieurs/]);
    await expect(page.getByText("Il a peur de l’eau")).toBeVisible();
    // Un autre héros : son onglet s'ouvre, vide, sans la relance des héros
    await ONGLETS(page).getByRole("button", { name: "Un autre héros" }).click();
    await page.getByRole("textbox", { name: "Nom du nouveau héros" }).fill("Mina");
    await page.keyboard.press("Enter");
    await expect(page.getByRole("heading", { level: 2 })).toHaveText(/Qui est Mina/);
    await expect(QUESTIONS(page).getByRole("listitem")).toHaveText([/Quel âge a Mina/, /fait peur à Mina/, /Qui va aider Mina/]);
    await expect(page.getByText("Il a peur de l’eau")).toHaveCount(0);
    // Ses idées et son texte retenu sont les siens
    await page.getByRole("button", { name: "Noter une idée" }).click();
    await page.getByLabel("Nouvelle idée").fill("Elle sait nager");
    await page.keyboard.press("Enter");
    await RETENU(page).fill("La sœur de Lou, onze ans.");
    await RETENU(page).blur();
    const mina = async () => (await sql<{ id: string; description: string }>("select id, description from personnages where projet_id = $1 and nom = 'Mina'", [s.projet]))[0];
    await expect.poll(async () => (await mina())?.description).toBe("La sœur de Lou, onze ans.");
    expect(await sql("select texte from pistes where personnage_id = $1", [(await mina()).id])).toEqual([{ texte: "Elle sait nager" }]);
    // Le panneau d'un héros n'a pas de description : c'est son « Nous retenons »
    await page.getByRole("button", { name: "Ouvrir la carte de Mina" }).click();
    await expect(PANNEAU(page).getByLabel("Description")).toHaveCount(0);
    await expect(PANNEAU(page)).toContainText("Le personnage que le lecteur suit ou incarne.");
    await PANNEAU(page).getByRole("button", { name: "Fermer", exact: true }).last().click();
    // En projection, les mêmes onglets
    await aller(page, `/atelier/${s.projet}/personnages?heros=${(await mina()).id}`);
    await expect(page.getByRole("heading", { level: 2 })).toHaveText(/Qui est Mina/);
    await expect(ONGLETS(page).getByRole("link", { name: "Lou" })).toHaveAttribute("href", `/atelier/${s.projet}/personnages?heros=${lou.id}`);
    await expect(ONGLETS(page).getByRole("button", { name: "Un autre héros" })).toHaveCount(0);
  });

  test("F10-AC47 — sans carte de héros, l'onglet « Le héros » : le premier mot écrit crée sa carte, qui reçoit le texte retenu et les idées d'avant", async ({ page }) => {
    const s = await passeurs(page);
    await s.base.from("pistes").insert({ projet_id: s.projet, enseignant_id: s.compte.id, rubrique: "personnages", texte: "Il a peur de l’eau" });
    await aller(page, `/projet/${s.projet}/preparation?etape=personnages`);
    await expect(ONGLETS(page)).toContainText("Le héros");
    await expect(RETENU(page)).toHaveValue(RETENU_TEXTE);
    await RETENU(page).fill(`${RETENU_TEXTE} Il porte un ciré jaune.`);
    await RETENU(page).blur();
    await expect.poll(async () => (await cartesEnBase(s.projet)).map((c) => [c.nom, c.heros])).toEqual([["Le héros", true]]);
    await expect.poll(async () => (await sql<{ description: string }>("select description from personnages where projet_id = $1", [s.projet]))[0].description).toMatch(/ciré jaune/);
    expect(await sql("select count(*)::int n from pistes where projet_id = $1 and personnage_id is null", [s.projet])).toEqual([{ n: 0 }]);
    expect((await sql("select personnages from preparations where projet_id = $1", [s.projet]))[0].personnages).toBe("");
    // « Donner un nom au héros » ouvre sa carte
    await page.reload();
    await page.getByRole("button", { name: "Ouvrir la carte de Le héros" }).click();
    await PANNEAU(page).getByLabel("Nom", { exact: true }).fill("Lou");
    await PANNEAU(page).getByRole("button", { name: "Fermer", exact: true }).last().click();
    await page.reload();
    await expect(page.getByRole("heading", { level: 2 })).toHaveText(/Qui est Lou/);
  });

  test("un personnage qui devient héros, ou ne l'est plus, change d'onglet et la page le suit ; la poubelle de la carte supprime le héros, « Annuler » le rend ; en projection, la carte s'ouvre", async ({ page }) => {
    const s = await passeurs(page);
    const [lou] = (await s.base.from("personnages").insert({ projet_id: s.projet, enseignant_id: s.compte.id, nom: "Lou", heros: true, rang: 0 }).select("id")).data!;
    const [mael] = (await s.base.from("personnages").insert({ projet_id: s.projet, enseignant_id: s.compte.id, nom: "Maël", heros: false, rang: 1 }).select("id")).data!;
    await aller(page, `/projet/${s.projet}/preparation?etape=personnages&heros=autres`);
    await page.getByRole("button", { name: "Ouvrir la carte de Maël" }).click();
    await PANNEAU(page).getByText("Héros", { exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`heros=${mael.id}`));
    await expect(page.getByRole("heading", { level: 2 })).toHaveText("Qui est Maël ?");
    // Et l'inverse : il n'est plus un héros, la page ouvre « Autres personnages »
    await page.getByRole("button", { name: "Ouvrir la carte de Maël" }).click();
    await PANNEAU(page).getByText("Héros", { exact: true }).click();
    await expect(page).toHaveURL(/heros=autres/);
    await expect(page.getByRole("heading", { level: 2 })).toHaveText(/Qui d’autre croise/);
    // La poubelle à côté de la carte du héros
    await aller(page, `/projet/${s.projet}/preparation?etape=personnages&heros=${lou.id}`);
    await page.getByRole("button", { name: "Supprimer Lou et son onglet" }).click();
    await expect(MESSAGE(page)).toContainText("« Lou » et son onglet sont supprimés.");
    await expect(ONGLETS(page).getByRole("link", { name: "Lou" })).toHaveCount(0);
    await MESSAGE(page).getByRole("button", { name: "Annuler" }).click();
    await expect(ONGLETS(page).getByRole("link", { name: "Lou" })).toBeVisible();
    // Devant la classe, la carte du héros s'ouvre, et les autres personnages aussi
    await aller(page, `/atelier/${s.projet}/personnages`);
    await page.getByRole("button", { name: "Ouvrir la carte de Lou" }).click();
    await expect(PANNEAU(page).getByLabel(/À quoi ressemble Lou/)).toBeVisible();
    await expect(PANNEAU(page).getByRole("button", { name: "Supprimer le héros et son onglet" })).toBeVisible();
    await PANNEAU(page).getByRole("button", { name: "Fermer", exact: true }).last().click();
    await expect(page.getByRole("button", { name: "Supprimer Lou et son onglet" })).toBeVisible();
    await aller(page, `/atelier/${s.projet}/personnages?heros=autres`);
    await page.getByRole("button", { name: "Ouvrir la carte de Maël" }).click();
    await expect(PANNEAU(page).getByLabel(/À quoi ressemble Maël/)).toBeVisible();
  });

  test("une carte d'autre personnage ajoutée à la main s'ouvre ; ses autres noms se lisent d'une ligne, sans « tu » ; supprimée, « Annuler » la rend", async ({ page }) => {
    const s = await passeurs(page);
    await aller(page, `/projet/${s.projet}/preparation?etape=personnages&heros=autres`);
    await page.getByRole("button", { name: "Ajouter un personnage" }).click();
    await page.getByRole("textbox", { name: "Nom du personnage" }).fill("Maël");
    await page.getByRole("textbox", { name: "Nom du personnage" }).press("Enter");
    await expect(PANNEAU(page).getByRole("heading", { name: "Maël" })).toBeVisible();
    await PANNEAU(page).getByLabel("Autres noms").fill("le passeur, tu, le vieux Maël, Maël");
    await PANNEAU(page).getByLabel("Autres noms").blur();
    await expect.poll(async () => (await cartesEnBase(s.projet))[0]?.autres_noms).toEqual(["le passeur", "le vieux Maël"]);
    expect((await cartesEnBase(s.projet))[0].heros).toBe(false);
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
    await expect(PANNEAU(page)).toContainText("Décrivez d’abord son apparence.");
    await PANNEAU(page).getByRole("button", { name: /son apparence avec l’IA/ }).click();
    await expect(PANNEAU(page).getByRole("textbox", { name: "Apparence proposée" })).toHaveValue(/Ciré jaune moutarde/);
    expect((await cartesEnBase(s.projet))[0].fiche).toBe("");
    await PANNEAU(page).getByRole("button", { name: "Utiliser ce texte" }).click();
    await expect(MESSAGE(page)).toContainText("Son apparence est écrite.");
    await expect.poll(async () => (await cartesEnBase(s.projet))[0].fiche).toMatch(/Ciré jaune moutarde/);

    await PANNEAU(page).getByRole("button", { name: "Créer son portrait" }).click();
    await expect(PANNEAU(page).getByRole("img", { name: /Proposition/ })).toHaveCount(2);
    expect(await propositionsEnStockage(s.compte.id, s.projet)).toBe(2);
    expect((await cartesEnBase(s.projet))[0].portrait_id).toBeNull();
    // Un clic sur une proposition l'agrandit ; un clic la referme
    await PANNEAU(page).getByRole("button", { name: "Voir Proposition 1 en grand" }).click();
    await expect(page.getByRole("dialog", { name: "Proposition 1" })).toBeVisible();
    await page.getByRole("dialog", { name: "Proposition 1" }).click();
    await expect(page.getByRole("dialog", { name: "Proposition 1" })).toHaveCount(0);
    await PANNEAU(page).getByRole("button", { name: "Garder celle-ci" }).first().click();
    await expect(MESSAGE(page)).toContainText("Portrait de « Lou » gardé.");
    await expect(PANNEAU(page).getByRole("button", { name: "Voir Portrait de Lou en grand" })).toBeVisible();
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
    await PANNEAU(page).getByLabel(/À quoi ressemble/).fill("Cuivre patiné, verre bleuté, grande comme une main.");
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
    await aller(page, `/projet/${s.projet}/preparation?etape=personnages&heros=autres`);
    await expect(page.getByRole("button", { name: "Ajouter un personnage" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Repérer les personnages d’après le texte retenu" })).toHaveCount(0);
    await aller(page, `/projet/${s.projet}/preparation?etape=personnages`);
    await page.getByRole("button", { name: "Ouvrir la carte de Lou" }).click();
    await expect(PANNEAU(page).getByRole("button", { name: /son apparence avec l’IA/ })).toHaveCount(0);
    await expect(PANNEAU(page).getByRole("button", { name: "Créer son portrait" })).toHaveCount(0);
    await PANNEAU(page).getByLabel(/À quoi ressemble/).fill("Ciré jaune.");
    await PANNEAU(page).getByLabel(/À quoi ressemble/).blur();
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
    await page.getByLabel("Pour l’IA, notre façon d’écrire").fill("vous, au présent");
    await page.getByLabel("Pour l’IA, notre façon d’écrire").blur();
    await expect.poll(async () => (await sql("select consigne_ecriture from public.projets where id = $1", [s.projet]))[0].consigne_ecriture).toBe("vous, au présent");
    const projet = async () => (await sql("select style_images, style_autre, heros_absent from public.projets where id = $1", [s.projet]))[0];
    await expect.poll(projet).toEqual({ style_images: "autre", style_autre: "linogravure en deux couleurs", heros_absent: false });
    await expect(PANNEAU(page)).toContainText("Le héros est dessiné d’après sa carte et son portrait");
  });
});
