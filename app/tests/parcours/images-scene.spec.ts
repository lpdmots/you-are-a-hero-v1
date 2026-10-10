import { resolve } from "node:path";
import { deflateSync } from "node:zlib";
import { expect, test, type Page } from "@playwright/test";
import {
  aller, attendreEnBase, attendreEnregistre, BANDEAU, blocsEditeur, choixPerso, classeQuiEcrit, copie, copiesGardees, enClair, FICHE, figure, presseTexte, posteDe,
  recit, recitAvec, renvoi, sceneEnBase, selectionner, semerBlocs, semerImage, sql, supprimerComptes, symbole, typesEnBase,
} from "./outils";

/**
 * Étape 3 du plan, lot 5 : les images posées dans la scène, en bloc ou sur la ligne (F10).
 * Le prototype de l'éditeur ne les avait pas éprouvées : c'est ici que se lève la
 * vérification V12.
 */

test.afterEach(async () => {
  await supprimerComptes();
});

const sceneAdulte = (projet: string, scene: string) => `/projet/${projet}/scene/${scene}`;
const sceneEleve = (scene: string) => `/travail/scene/${scene}`;
const MOD = "ControlOrMeta";
const PHOTO = resolve(__dirname, "../../public/illustrations/defaut-desert.jpg");
const BARRE = (page: Page) => page.getByRole("toolbar", { name: "Outils de la copie" });
const FIGURES = (page: Page) => copie(page).locator(".image-bloc");
const importer = (page: Page, fichier: string | { name: string; mimeType: string; buffer: Buffer }) => FICHE(page).getByLabel("Fichier de l’image").setInputFiles(fichier);
const imagesDuProjet = (projet: string) => sql<{ id: string; format: string; largeur: number; hauteur: number }>("select id, format, largeur, hauteur from images where projet_id = $1 order by cree_le", [projet]);

/** Un symbole détouré : un disque sombre sur fond transparent, en PNG. */
function pngDetoure(cote = 240): Buffer {
  const crc = (octets: Buffer): number => {
    let c = ~0;
    for (const o of octets) {
      c ^= o;
      for (let k = 0; k < 8; k += 1) c = c & 1 ? (c >>> 1) ^ 0xedb88320 : c >>> 1;
    }
    return ~c >>> 0;
  };
  const bloc = (type: string, donnees: Buffer): Buffer => {
    const tete = Buffer.alloc(8);
    tete.writeUInt32BE(donnees.length, 0);
    tete.write(type, 4, "latin1");
    const fin = Buffer.alloc(4);
    fin.writeUInt32BE(crc(Buffer.concat([tete.subarray(4), donnees])), 0);
    return Buffer.concat([tete, donnees, fin]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(cote, 0);
  ihdr.writeUInt32BE(cote, 4);
  ihdr.set([8, 6, 0, 0, 0], 8);
  const lignes = Buffer.alloc((cote * 4 + 1) * cote);
  for (let y = 0; y < cote; y += 1) {
    for (let x = 0; x < cote; x += 1) {
      const dedans = (x - cote / 2) ** 2 + (y - cote / 2) ** 2 < (cote / 2.4) ** 2;
      lignes.set(dedans ? [40, 60, 90, 255] : [0, 0, 0, 0], y * (cote * 4 + 1) + 1 + x * 4);
    }
  }
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), bloc("IHDR", ihdr), bloc("IDAT", deflateSync(lignes)), bloc("IEND", Buffer.alloc(0))]);
}

test.describe("Image en bloc (F10) — V12", () => {
  test("F10-AC27, AC01, AC16, AC34 — « /image », import, « Dans le texte » : un bloc après le paragraphe du curseur, en largeur moyenne, sans quitter la scène ; la fiche propose ensuite cette image parmi celles du projet ; sa largeur change sans nouvel import ; sa légende se lit dessous, pour l'élève aussi", async ({ page, browser }) => {
    test.setTimeout(180_000);
    const s = await classeQuiEcrit(page);
    const [s15] = s.lisiere.scenes;
    await semerBlocs(s.base, s15, [recit("Le pont se balance."), recit("Lou s’avance.")]);
    await aller(page, sceneAdulte(s.projet, s15));
    const adresse = page.url();
    await selectionner(page, { bloc: 0, offset: 19 });
    await page.keyboard.type(" /ima");
    await expect(page.locator(".slash [role=option]")).toHaveText([/Image.*Dans le texte, ou sur la ligne/]);
    await page.keyboard.press("Enter");
    await importer(page, PHOTO);
    await FICHE(page).getByRole("button", { name: "Dans le texte" }).click();
    await expect(FIGURES(page)).toHaveCount(1);
    await attendreEnregistre(page);
    expect(page.url()).toBe(adresse);
    const [importee] = await imagesDuProjet(s.projet);
    // Gardée à la définition de son plus grand emploi : 2 600 points au plus sur le grand côté
    expect(importee.format).toBe("jpeg");
    expect(Math.max(importee.largeur, importee.hauteur)).toBeLessThanOrEqual(2600);
    let enBase = await sceneEnBase(s15);
    expect(enBase.texte.map((b) => b.type)).toEqual(["p", "image", "p"]);
    expect(enBase.texte[1]).toMatchObject({ image: importee.id, largeur: 65 });
    expect(enClair([enBase.texte[0]])).toEqual(["Le pont se balance. "]);
    // Elle s'affiche vraiment : le fichier arrive, à la largeur réglée
    const img = FIGURES(page).locator("img");
    await expect.poll(() => img.evaluate((i: HTMLImageElement) => i.complete && i.naturalWidth)).toBeGreaterThan(100);
    await expect(FIGURES(page).locator(".figure")).toHaveAttribute("style", /width: 65%/);

    // La même fiche la propose ensuite parmi les images du projet
    await BARRE(page).getByRole("button", { name: "Image" }).click();
    await expect(FICHE(page).getByRole("list", { name: "Images du projet" }).getByRole("button")).toHaveCount(1);
    await FICHE(page).getByRole("button", { name: "Fermer la fiche" }).click();

    // Réglages : largeur en segments et en pourcentage, pleine page, sans nouvel import
    await FIGURES(page).getByRole("button", { name: "Régler cette image" }).click();
    await FICHE(page).getByRole("radio", { name: "Pleine largeur" }).check({ force: true });
    await expect(FIGURES(page).locator(".figure")).toHaveAttribute("style", /width: 100%/);
    await FICHE(page).getByLabel("Largeur, en pourcentage de la page").fill("30");
    await FICHE(page).getByLabel("Largeur, en pourcentage de la page").press("Enter");
    await expect(FIGURES(page).locator(".figure")).toHaveAttribute("style", /width: 30%/);
    await attendreEnregistre(page);
    expect((await sceneEnBase(s15)).texte[1]).toMatchObject({ image: importee.id, largeur: 30 });
    await FICHE(page).getByRole("radio", { name: "Pleine page" }).check({ force: true });
    await expect(FIGURES(page)).toContainText("pleine page dans le livre");
    await FICHE(page).getByRole("radio", { name: "Moyenne" }).check({ force: true });
    expect(await imagesDuProjet(s.projet)).toHaveLength(1);

    // Légende et « Ce que montre l'image »
    await FICHE(page).getByLabel("Légende").fill("Le pont, dessiné par Chloé");
    await FICHE(page).getByLabel("Légende").press("Enter");
    await expect(FIGURES(page).locator(".figure__legende")).toHaveText("Le pont, dessiné par Chloé");
    await FICHE(page).getByLabel("Ce que montre l’image").fill("un pont de cordes dans la brume");
    await FICHE(page).getByLabel("Ce que montre l’image").press("Enter");
    await attendreEnregistre(page);
    enBase = await sceneEnBase(s15);
    expect(enBase.texte[1]).toMatchObject({ largeur: 65, legende: "Le pont, dessiné par Chloé", alt: "un pont de cordes dans la brume" });
    expect(enBase.texte[1]).not.toHaveProperty("page");
    await expect(FIGURES(page).locator("img")).toHaveAttribute("alt", "un pont de cordes dans la brume");

    // Alice lit l'image et sa légende, sans pouvoir y toucher
    const alice = await posteDe(browser, s, "Alice");
    await aller(alice.page, sceneEleve(s15));
    await expect(FIGURES(alice.page).locator(".figure__legende")).toHaveText("Le pont, dessiné par Chloé");
    await expect.poll(() => FIGURES(alice.page).locator("img").evaluate((i: HTMLImageElement) => i.complete && i.naturalWidth)).toBeGreaterThan(100);
    await expect(FIGURES(alice.page).getByRole("button", { name: /Régler|Déplacer/ })).toHaveCount(0);
    await FIGURES(alice.page).locator("img").click();
    await expect(alice.page.locator(".cx")).toHaveCount(0);
    await alice.contexte.close();

    // La légende effacée, rien ne figure sous l'image
    await FICHE(page).getByLabel("Légende").fill("");
    await FICHE(page).getByLabel("Légende").press("Enter");
    await expect(FIGURES(page).locator(".figure__legende")).toHaveCount(0);
    await attendreEnregistre(page);
    expect((await sceneEnBase(s15)).texte[1]).not.toHaveProperty("legende");
  });

  test("F10-AC28, AC02 — l'image en bloc est préparée pour tous les élèves : elle demeure quand Alice sélectionne tout et supprime ; Bilal ne la déplace ni ne la supprime, même en appelant la commande ; ni l'un ni l'autre n'a « Image » ; le serveur refuse ce qu'un poste forcerait", async ({ page, browser }) => {
    test.setTimeout(180_000);
    const s = await classeQuiEcrit(page);
    const [s15] = s.lisiere.scenes;
    const dessin = figure(await semerImage(s.base, s.compte, s.projet));
    const autre = await semerImage(s.base, s.compte, s.projet);
    await semerBlocs(s.base, s15, [recit("Le pont se balance."), dessin, recit("Lou s’avance.")]);

    const alice = await posteDe(browser, s, "Alice");
    await aller(alice.page, sceneEleve(s15));
    await expect(BARRE(alice.page).getByRole("button", { name: "Image" })).toHaveCount(0);
    await copie(alice.page).locator("p").first().click();
    await alice.page.keyboard.press(`${MOD}+a`);
    await alice.page.waitForTimeout(150);
    await alice.page.keyboard.press("Delete");
    await alice.page.keyboard.type("Tout mon texte.");
    await attendreEnBase(s15, "Tout mon texte.");
    let enBase = await sceneEnBase(s15);
    expect(enBase.texte.map((b) => b.type)).toEqual(["p", "image", "p"]);
    expect(enBase.texte[1]).toEqual(dessin);
    await alice.contexte.close();

    const bilal = await posteDe(browser, s, "Bilal");
    await aller(bilal.page, sceneEleve(s15));
    await expect(BARRE(bilal.page).getByRole("button", { name: "Image" })).toHaveCount(0);
    await selectionner(bilal.page, { bloc: 0, offset: 0 });
    await bilal.page.keyboard.type(" /");
    await expect(bilal.page.locator(".slash [role=option]")).toHaveText([/Choix/, /Action de jeu/, /Objet/]);
    await bilal.page.keyboard.press("Backspace");
    await expect(FIGURES(bilal.page).locator(".prise")).toHaveCount(0);
    // Sélectionnée, puis Suppr., Alt et flèche, et les commandes appelées directement : rien ne bouge
    await selectionner(bilal.page, { bloc: 1, offset: 0 });
    await bilal.page.keyboard.press("Delete");
    await bilal.page.keyboard.press("Alt+ArrowUp");
    await bilal.page.evaluate(() => {
      const e = (window as unknown as { __copie: { tf: Record<string, (...a: unknown[]) => void>; children: { id: string }[] } }).__copie;
      e.tf.supprimerBlocs([e.children[1].id]);
      e.tf.moveNodes({ at: [1], to: [0] });
      e.tf.setNodes({ largeur: 100 }, { at: [1] });
    });
    expect((await blocsEditeur(bilal.page))[1]).toEqual(dessin);

    // Le navigateur contourné : image retirée, image d'un autre fichier ajoutée en bloc ou sur la ligne
    enBase = await sceneEnBase(s15);
    const [{ id: ecriture }] = await sql<{ id: string }>("select id from ecritures where scene_id = $1 and eleve_id = $2 order by ouverte_le desc limit 1", [s15, s.eleves.Bilal.id]);
    const forges = [
      [enBase.texte[0], enBase.texte[2]],
      [...enBase.texte, figure(autre)],
      [recitAvec(["Un symbole ", symbole(autre), " glissé."]), enBase.texte[1], enBase.texte[2]],
      [enBase.texte[0], { ...dessin, largeur: 100 }, enBase.texte[2]],
    ];
    for (const forge of forges) {
      const reponse = await bilal.page.evaluate(
        async ([e, v, t]) => (await fetch("/copie", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ecriture: e, version: v, texte: t }) })).json(),
        [ecriture, enBase.version, forge] as const,
      );
      expect(reponse).toMatchObject({ etat: "garde", motif: "controle" });
      expect(await copiesGardees(s15)).toHaveLength(1);
      await sql("delete from copies_recuperation where scene_id = $1", [s15]);
    }
    expect((await sceneEnBase(s15)).texte).toEqual(enBase.texte);
    await bilal.contexte.close();
  });

  test("F05-AC40 — l'image en bloc se déplace par son repère et par Alt et une flèche ; supprimée, le bandeau le dit et « Annuler » la rend ; au clavier, Entrée ouvre sa fiche", async ({ page }) => {
    test.setTimeout(150_000);
    const s = await classeQuiEcrit(page);
    const [s15] = s.lisiere.scenes;
    const dessin = figure(await semerImage(s.base, s.compte, s.projet));
    await semerBlocs(s.base, s15, [recit("Un."), recit("Deux."), dessin]);
    await aller(page, sceneAdulte(s.projet, s15));
    const prise = (await FIGURES(page).locator(".prise").boundingBox())!;
    const cible = (await copie(page).locator("p").first().boundingBox())!;
    await page.mouse.move(prise.x + prise.width / 2, prise.y + prise.height / 2);
    await page.mouse.down();
    await page.mouse.move(prise.x + 4, cible.y + 2, { steps: 8 });
    await page.mouse.up();
    await attendreEnregistre(page);
    expect(await typesEnBase(s15)).toEqual(["image", "p", "p"]);
    await selectionner(page, { bloc: 0, offset: 0 });
    await page.keyboard.press("Alt+ArrowDown");
    await attendreEnregistre(page);
    expect(await typesEnBase(s15)).toEqual(["p", "image", "p"]);
    // Entrée, sur l'image sélectionnée, ouvre ses réglages ; Échap les referme
    await page.keyboard.press("Enter");
    await expect(FICHE(page).getByRole("radio", { name: "Moyenne" })).toBeChecked();
    await FICHE(page).getByRole("button", { name: "Supprimer" }).click();
    await expect(FIGURES(page)).toHaveCount(0);
    await expect(BANDEAU(page)).toContainText("1 image supprimée. Elle reste parmi les images du projet.");
    await attendreEnregistre(page);
    expect(await typesEnBase(s15)).toEqual(["p", "p"]);
    await BANDEAU(page).getByRole("button", { name: "Annuler" }).click();
    await expect(FIGURES(page)).toHaveCount(1);
    await attendreEnregistre(page);
    expect((await sceneEnBase(s15)).texte[1]).toEqual(dessin);
  });

  test("F10-AC30 — un PDF de scanner est refusé, avec un message qui nomme JPEG, PNG et WebP ; un import coupé en route ne pose rien dans la scène, et le message le dit", async ({ page }) => {
    test.setTimeout(150_000);
    const s = await classeQuiEcrit(page);
    const [s15] = s.lisiere.scenes;
    await semerBlocs(s.base, s15, [recit("Le pont se balance.")]);
    await aller(page, sceneAdulte(s.projet, s15));
    await BARRE(page).getByRole("button", { name: "Image" }).click();
    await importer(page, { name: "scan.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.7\n%%EOF") });
    await expect(FICHE(page).getByRole("alert")).toContainText("Choisissez un fichier JPEG, PNG ou WebP de moins de 20 Mo. Rien n’a été posé dans le texte.");
    // Un fichier qui se dit image sans en être une
    await importer(page, { name: "faux.png", mimeType: "image/png", buffer: Buffer.from("ceci n’est pas une image") });
    await expect(FICHE(page).getByRole("alert")).toContainText("Cette image n’a pas pu être importée.");

    // L'import s'interrompt : le dépôt du fichier échoue en route
    await page.route("**/storage/v1/object/upload/sign/**", (route) => route.abort("connectionreset"));
    await importer(page, PHOTO);
    await expect(FICHE(page).getByRole("alert")).toContainText("L’image n’est pas arrivée. Vérifiez la connexion et réessayez. Rien n’a été posé dans le texte.");
    await expect(FICHE(page).getByRole("button", { name: "Dans le texte" })).toHaveCount(0);
    await page.unroute("**/storage/v1/object/upload/sign/**");
    await page.waitForTimeout(2500);
    expect(await typesEnBase(s15)).toEqual(["p"]);
    expect(await imagesDuProjet(s.projet)).toEqual([]);
    await expect(FIGURES(page)).toHaveCount(0);
  });
});

test.describe("Image sur la ligne (F10) — V12", () => {
  test("F10-AC29, AC31, AC32 — un symbole détouré, posé en bloc dans une scène, se reprend « Sur la ligne » dans une autre sans nouvel import, à la hauteur du texte et sans rectangle autour ; copié ailleurs, il devient « [image] », puis « [lune] »", async ({ page, context }) => {
    test.setTimeout(180_000);
    const s = await classeQuiEcrit(page);
    const [s15, s16] = s.lisiere.scenes;
    await semerBlocs(s.base, s15, [recit("Trois portes.")]);
    await semerBlocs(s.base, s16, [recit("Si tu choisis la porte ")]);
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await aller(page, sceneAdulte(s.projet, s15));
    await BARRE(page).getByRole("button", { name: "Image" }).click();
    await importer(page, { name: "lune.png", mimeType: "image/png", buffer: pngDetoure() });
    await FICHE(page).getByRole("button", { name: "Dans le texte" }).click();
    await attendreEnregistre(page);
    const [lune] = await imagesDuProjet(s.projet);
    // Le fond transparent est gardé : le fichier n'est pas du JPEG
    expect(["png", "webp"]).toContain(lune.format);
    const enBloc = (await sceneEnBase(s15)).texte;

    await aller(page, sceneAdulte(s.projet, s16));
    await selectionner(page, { bloc: 0, offset: 23 });
    await BARRE(page).getByRole("button", { name: "Image" }).click();
    await FICHE(page).getByRole("list", { name: "Images du projet" }).getByRole("button").click();
    await FICHE(page).getByRole("button", { name: "Sur la ligne" }).click();
    await expect(copie(page)).toBeFocused();
    await page.keyboard.type(", pousse-la.");
    await attendreEnBase(s16, "pousse-la.");
    // Sans nouvel import, et la scène d'origine n'a pas changé
    expect(await imagesDuProjet(s.projet)).toHaveLength(1);
    expect((await sceneEnBase(s15)).texte).toEqual(enBloc);
    const phrase = (await sceneEnBase(s16)).texte[0];
    expect(phrase.children).toMatchObject([{ text: "Si tu choisis la porte " }, { type: "image-ligne", image: lune.id }, { text: ", pousse-la." }]);

    // À la hauteur du texte, et le papier de la copie se voit autour du symbole
    const img = copie(page).locator("img.symbole");
    await expect.poll(() => img.evaluate((i: HTMLImageElement) => i.complete && i.naturalWidth)).toBeGreaterThan(10);
    const [hauteurImage, hauteurLigne] = await img.evaluate((i) => [i.getBoundingClientRect().height, Number.parseFloat(getComputedStyle(i.closest("p")!).lineHeight)]);
    expect(hauteurImage).toBeLessThanOrEqual(hauteurLigne);
    const coin = await img.evaluate(async (i: HTMLImageElement) => {
      const reponse = await fetch(i.src);
      const dessin = await createImageBitmap(await reponse.blob());
      const toile = document.createElement("canvas");
      toile.width = dessin.width;
      toile.height = dessin.height;
      const c = toile.getContext("2d")!;
      c.drawImage(dessin, 0, 0);
      return { type: reponse.headers.get("content-type"), alphaDuCoin: c.getImageData(1, 1, 1, 1).data[3], alphaDuCentre: c.getImageData(dessin.width >> 1, dessin.height >> 1, 1, 1).data[3] };
    });
    expect(coin.type).toMatch(/^image\/(png|webp)$/);
    expect(coin.alphaDuCoin).toBe(0);
    expect(coin.alphaDuCentre).toBe(255);

    // Vers un autre logiciel : « [image] » sans texte de remplacement, puis « [lune] »
    await copie(page).locator("p").first().click();
    await page.keyboard.press(`${MOD}+a`);
    await page.waitForTimeout(150);
    await page.keyboard.press(`${MOD}+c`);
    expect(await presseTexte(page)).toBe("Si tu choisis la porte [image], pousse-la.");
    await copie(page).getByRole("button", { name: /Régler l’image/ }).click();
    await FICHE(page).getByLabel("Ce que montre l’image").fill("lune");
    await FICHE(page).getByLabel("Ce que montre l’image").press("Enter");
    await FICHE(page).getByRole("button", { name: "Fermer la fiche" }).click();
    await attendreEnregistre(page);
    await copie(page).locator("p").first().click();
    await page.keyboard.press(`${MOD}+a`);
    await page.waitForTimeout(150);
    await page.keyboard.press(`${MOD}+c`);
    expect(await presseTexte(page)).toBe("Si tu choisis la porte [lune], pousse-la.");
    await expect(img).toHaveAttribute("alt", "lune");
  });

  test("F10-AC20 — un symbole se pose dans une phrase de choix personnalisée ; son libellé reste du texte, sans image, pour les chemins ; rien de tel dans une note ni dans une phrase automatique", async ({ page }) => {
    test.setTimeout(150_000);
    const s = await classeQuiEcrit(page);
    const [s15, s16] = s.lisiere.scenes;
    await semerImage(s.base, s.compte, s.projet);
    await semerBlocs(s.base, s15, [choixPerso("Pousser la porte de la lune", ["Si tu choisis la porte , rends-toi au ", renvoi(s16), "."])]);
    await aller(page, sceneAdulte(s.projet, s15));
    await selectionner(page, { bloc: 0, enfant: 0, offset: 23 });
    await BARRE(page).getByRole("button", { name: "Image" }).click();
    await FICHE(page).getByRole("list", { name: "Images du projet" }).getByRole("button").click();
    await FICHE(page).getByRole("button", { name: "Sur la ligne" }).click();
    await attendreEnregistre(page);
    const phrase = (await sceneEnBase(s15)).texte[0];
    expect(phrase).toMatchObject({ type: "choix", libelle: "Pousser la porte de la lune" });
    expect(phrase.children.map((x) => (x as { type?: string }).type ?? "texte")).toEqual(["texte", "image-ligne", "texte", "renvoi", "texte"]);
    await expect(copie(page).locator(".phrase-choix img.symbole")).toHaveCount(1);
    // Les chemins désignent ce choix par son libellé, sans image
    await aller(page, `/projet/${s.projet}/chapitre/${s.lisiere.id}?vue=chemins`);
    const suite = page.locator(".noeud__suites li").first();
    await expect(suite).toContainText("Pousser la porte de la lune");
    await expect(suite.locator("img")).toHaveCount(0);

    // Dans une note, « Sur la ligne » n'est pas proposé : l'image irait en bloc
    await aller(page, sceneAdulte(s.projet, s16));
    await BARRE(page).getByRole("button", { name: "Note" }).click();
    await expect(copie(page)).toBeFocused();
    await page.keyboard.type("Rappel");
    await BARRE(page).getByRole("button", { name: "Image" }).click();
    await FICHE(page).getByRole("list", { name: "Images du projet" }).getByRole("button").click();
    await expect(FICHE(page).getByRole("button", { name: "Sur la ligne" })).toBeDisabled();
    await expect(FICHE(page)).toContainText("Pour la mettre sur la ligne, placez d’abord le curseur dans un paragraphe.");
  });

  test("F10-AC33 — Alice coupe une phrase qui porte une image sur la ligne et la colle plus bas dans la même scène : l'image suit ; collée dans une autre scène, le texte arrive sans l'image, et un message le lui dit ; elle peut la retirer d'un paragraphe qu'elle modifie", async ({ page, browser }) => {
    test.setTimeout(180_000);
    const s = await classeQuiEcrit(page);
    const [s15, s16] = s.lisiere.scenes;
    const lune = await semerImage(s.base, s.compte, s.projet);
    const signe = symbole(lune, "lune");
    await semerBlocs(s.base, s15, [recitAvec(["La porte ", signe, " s’ouvre."]), recit("Lou attend.")]);
    const alice = await posteDe(browser, s, "Alice");
    await alice.contexte.grantPermissions(["clipboard-read", "clipboard-write"]);
    await aller(alice.page, sceneEleve(s15));
    await expect(copie(alice.page).locator("img.symbole")).toHaveCount(1);
    // Elle coupe toute la première phrase, image comprise, et la colle à la fin de la scène
    await selectionner(alice.page, { bloc: 0, enfant: 0, offset: 0 }, { bloc: 0, enfant: 2, offset: 10 });
    await alice.page.keyboard.press(`${MOD}+x`);
    await selectionner(alice.page, { bloc: 1, offset: 11 });
    await alice.page.keyboard.press(`${MOD}+v`);
    await attendreEnBase(s15, "Lou attend.La porte");
    let enBase = await sceneEnBase(s15);
    expect(JSON.stringify(enBase.texte)).toContain(`"image":"${lune}"`);
    expect(enClair(enBase.texte)).toEqual(["", "Lou attend.La porte  s’ouvre."]);
    await expect(alice.page.locator(".copie__message")).toHaveCount(0);
    await expect(copie(alice.page).locator("img.symbole")).toHaveCount(1);

    // Copiée, puis collée dans une autre scène : le texte sans l'image, et un message
    await selectionner(alice.page, { bloc: 1, enfant: 0, offset: 11 }, { bloc: 1, enfant: 2, offset: 10 });
    await alice.page.keyboard.press(`${MOD}+c`);
    await aller(alice.page, sceneEleve(s16));
    await copie(alice.page).click();
    await alice.page.keyboard.press(`${MOD}+v`);
    await expect(BANDEAU(alice.page)).toContainText("L’image n’a pas été collée : tu ne peux pas ajouter d’image ici.");
    await attendreEnBase(s16, "s’ouvre.");
    enBase = await sceneEnBase(s16);
    expect(enClair(enBase.texte)).toEqual(["La porte  s’ouvre."]);
    expect(JSON.stringify(enBase.texte)).not.toContain("image-ligne");

    // De retour dans la première scène, elle retire l'image d'un retour arrière : c'est permis
    await aller(alice.page, sceneEleve(s15));
    await selectionner(alice.page, { bloc: 1, enfant: 2, offset: 0 });
    await alice.page.keyboard.press("Backspace");
    await alice.page.keyboard.type("!");
    await attendreEnBase(s15, "La porte ! s’ouvre.");
    expect(JSON.stringify((await sceneEnBase(s15)).texte)).not.toContain("image-ligne");
    expect(await copiesGardees(s15)).toEqual([]);
    await alice.contexte.close();
  });
});
