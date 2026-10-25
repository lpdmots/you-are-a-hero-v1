import { readFileSync } from "node:fs";
import { test, type Page } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { adultePret, aller, choixAuto, recit, semerBlocs, semerImage, semerPartie, semerProjet, sql, supprimerComptes } from "../parcours/outils";

/**
 * Captures des écrans de l'étape 6 : npm run captures -- etape6
 * Elles s'écrivent dans test-results/captures/. Ce n'est pas un test : rien n'y est vérifié.
 */
const dossier = "test-results/captures";
let n = 600;
const capturer = async (page: Page, nom: string, toute = true) => {
  n += 1;
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${dossier}/${n}-${nom}.png`, fullPage: toute });
};

test.afterEach(async () => {
  await supprimerComptes();
});

test("lot 3 : « Mettre en page », réglages et pages de présentation", async ({ page }) => {
  test.setTimeout(300_000);
  n = 600;
  const { compte, base } = await adultePret(page);
  const projet = await semerProjet(base, compte, "personnel", "choix", "Les passeurs de brume");
  const { chapitres } = await semerPartie(base, projet, "Le quai aux lanternes", [{ titre: "Le dernier bac", scenes: ["Quai — la sirène", "Passerelle — le bac s’éloigne"] }]);
  const s = chapitres[0].scenes;
  await base.from("projets").update({ depart_scene_id: s[0] }).eq("id", projet);
  await semerBlocs(base, s[0], [recit("La sirène du dernier bac retentit trois fois. Lou courut sur le quai, son sac rebondissant dans son dos."), choixAuto("Courir vers la passerelle", s[1])]);
  await semerBlocs(base, s[1], [recit("Le bac glissait déjà sur l’eau noire.")]);
  await base.from("scenes").update({ fin: true }).eq("id", s[1]);
  await sql("update scenes set etat = 'prete' where projet_id = $1", [projet]);
  await sql(
    "update preparations set regles = 'Tu commences avec 5 points de volonté.', feuille = $2 where projet_id = $1",
    [projet, JSON.stringify({ on: true, des: 1, sections: [{ id: "v", type: "compteurs", titre: "Caractéristiques", compteurs: [{ id: "c", nom: "Volonté", depart: 5 }] }, { id: "i", type: "liste", titre: "Inventaire", lignes: 8 }] })],
  );
  // De vraies images dans le seau, pour que les vignettes s'affichent
  const service = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_CLE_SECRETE!, { auth: { persistSession: false } });
  for (const nom of ["bateau", "bibliotheque", "chateau"]) {
    const id = await semerImage(base, compte, projet);
    for (const [suffixe, fichier] of [["", `defaut-${nom}.jpg`], ["-v", `defaut-${nom}-v.jpg`]]) {
      await service.storage.from("images").upload(`${compte.id}/${projet}/${id}${suffixe}.jpg`, readFileSync(`public/illustrations/${fichier}`), { contentType: "image/jpeg", upsert: true });
    }
  }
  await sql("update projets set mise_en_page_ouverte_le = now() where id = $1", [projet]);

  await page.setViewportSize({ width: 1366, height: 860 });
  await aller(page, `/projet/${projet}/livre?etape=page`);
  const livreEnPetit = page.locator(".petite-double__legende");
  await livreEnPetit.filter({ hasText: "pages en tout" }).waitFor({ timeout: 60_000 });
  await capturer(page, "reglages");
  await page.getByRole("button", { name: "Modifier", exact: true }).first().click();
  await page.getByLabel("Intérieur, côté reliure").fill("8");
  await page.getByLabel("Intérieur, côté reliure").press("Tab");
  await page.getByLabel("Extérieur").focus();
  await capturer(page, "reglages-marge-refusee", false);

  const ligne = (nom: string) => page.locator(".page-du-livre").filter({ hasText: nom });
  await ligne("Page de titre").getByRole("button", { name: "Modifier" }).click();
  await page.getByLabel("Sous-titre").fill("Un livre dont tu es le héros");
  await page.waitForTimeout(2500);
  await livreEnPetit.filter({ hasText: "Page de titre, page" }).waitFor({ timeout: 60_000 });
  await page.locator(".petite-double--calcul").waitFor({ state: "detached", timeout: 60_000 });
  await capturer(page, "panneau-titre", false);
  await ligne("Page des auteurs").locator("label.inter").click();
  await ligne("Page des auteurs").getByRole("button", { name: "Modifier" }).click();
  await capturer(page, "panneau-auteurs", false);
  await ligne("Comment lire ce livre").getByRole("button", { name: "Modifier" }).click();
  await capturer(page, "panneau-comment-lire", false);
  // « Comment lire ce livre » s'écrit dans une grande fenêtre, qu'Échap referme (25 octobre 2026)
  await page.keyboard.press("Escape");
  await ligne("Feuille d’aventure").getByRole("button", { name: "Modifier" }).click();
  await page.getByRole("region", { name: "Feuille d’aventure" }).getByRole("radio", { name: "Image pleine page" }).check();
  await capturer(page, "panneau-feuille-image", false);
  await page.getByRole("list", { name: "Images du projet" }).getByRole("button").first().click();
  await page.waitForTimeout(2500);
  await page.locator(".petite-double--calcul").waitFor({ state: "detached", timeout: 60_000 });
  await capturer(page, "panneau-feuille-image-choisie", false);
  await page.getByRole("button", { name: "Fermer le panneau" }).click();

  await page.setViewportSize({ width: 390, height: 844 });
  await aller(page, `/projet/${projet}/livre?etape=page`);
  await capturer(page, "mobile-reglages");
  await ligne("Page de titre").getByRole("button", { name: "Modifier" }).click();
  await page.getByRole("region", { name: "Page de titre" }).scrollIntoViewIfNeeded();
  await capturer(page, "mobile-panneau-titre", false);
});

test("lot 5 : « Imprimer et partager »", async ({ page }) => {
  test.setTimeout(300_000);
  n = 620;
  const { compte, base } = await adultePret(page);
  const projet = await semerProjet(base, compte, "personnel", "choix", "Les passeurs de brume");
  const { chapitres } = await semerPartie(base, projet, "Le quai aux lanternes", [{ titre: "Le dernier bac", scenes: ["Quai — la sirène", "Passerelle — le bac s’éloigne"] }]);
  const s = chapitres[0].scenes;
  await base.from("projets").update({ depart_scene_id: s[0] }).eq("id", projet);
  await semerBlocs(base, s[0], [recit("La sirène du dernier bac retentit trois fois."), choixAuto("Courir vers la passerelle", s[1])]);
  await semerBlocs(base, s[1], [recit("Le bac glissait déjà sur l’eau noire.")]);
  await base.from("scenes").update({ fin: true }).eq("id", s[1]);
  await sql("update scenes set etat = 'prete' where projet_id = $1", [projet]);
  await sql("update projets set mise_en_page_ouverte_le = now(), livre_relu_le = now(), chemins_verifies_le = now(), mise_en_page_convient_le = now(), imprimer_ouvert_le = now() where id = $1", [projet]);
  await page.setViewportSize({ width: 1366, height: 860 });

  await sql("update scenes set etat = 'cours' where id = $1", [s[1]]);
  await aller(page, `/projet/${projet}/livre?etape=sortie`);
  await capturer(page, "imprimer-refuse", false);
  await sql("update scenes set etat = 'prete' where id = $1", [s[1]]);
  await aller(page, `/projet/${projet}/livre?etape=sortie`);
  await capturer(page, "imprimer-pret", false);
  const telechargement = page.waitForEvent("download", { timeout: 60_000 });
  await page.getByRole("button", { name: "Créer le PDF définitif…" }).click();
  await telechargement;
  await aller(page, `/projet/${projet}/livre?etape=sortie`);
  await capturer(page, "imprimer-fait");
  await semerBlocs(base, s[1], [recit("Le bac glissait déjà sur l’eau noire, sans lui.")]);
  await aller(page, `/projet/${projet}/livre?etape=sortie`);
  await capturer(page, "imprimer-livre-change");
  await page.setViewportSize({ width: 390, height: 844 });
  await aller(page, `/projet/${projet}/livre?etape=sortie`);
  await capturer(page, "mobile-imprimer");
});

test("lot 6 : ordre des passages, doute et passage suggéré", async ({ page }) => {
  test.setTimeout(300_000);
  n = 640;
  const { compte, base } = await adultePret(page);
  const projet = await semerProjet(base, compte, "personnel", "choix", "Le phare");
  const { chapitres } = await semerPartie(base, projet, "La côte", [{ titre: "La plage", scenes: ["Le long quai", "L’hésitation", "La barque", "Le ponton", "La digue", "Le phare"] }]);
  const s = chapitres[0].scenes;
  const PHRASE = "La brume montait du lac et recouvrait déjà les barques amarrées, tandis que Lou cherchait la lanterne. ";
  await base.from("projets").update({ depart_scene_id: s[0] }).eq("id", projet);
  await semerBlocs(base, s[0], [recit(PHRASE.repeat(8)), choixAuto("Continuer", s[1])]);
  await semerBlocs(base, s[1], [recit("Lou hésite."), ...Array.from({ length: 6 }, (_, k) => choixAuto(`Option ${k + 1}`, s[2 + (k % 3)]))]);
  for (const i of [2, 3, 4]) await semerBlocs(base, s[i], [recit("Court."), choixAuto("Suite", s[5])]);
  await semerBlocs(base, s[5], [recit(PHRASE.repeat(4))]);
  await base.from("scenes").update({ fin: true }).eq("id", s[5]);
  await sql("update scenes set etat = 'prete' where projet_id = $1", [projet]);
  for (let i = 0; i < s.length; i += 1) await sql("update scenes set rang_livre = $2 where id = $1", [s[i], i]);
  await sql("update projets set ordre_etabli_le = now(), mise_en_page_ouverte_le = now(), livre_relu_le = now(), chemins_verifies_le = now() where id = $1", [projet]);
  await page.setViewportSize({ width: 1366, height: 860 });

  await aller(page, `/projet/${projet}/livre?etape=page`);
  await page.locator("#moins-de-blanc").scrollIntoViewIfNeeded();
  await capturer(page, "ordre-des-passages", false);
  await page.getByRole("tab", { name: "Aperçu" }).click();
  await page.locator(".apercu__etat").filter({ hasText: "passages" }).waitFor({ timeout: 60_000 });
  await page.getByRole("button", { name: "Page peu remplie suivante" }).click();
  await capturer(page, "passage-suggere", false);
  await page.getByRole("button", { name: /^Ouvrir n° 1 ·/ }).evaluate((b: HTMLButtonElement) => b.click());
  await page.getByRole("region", { name: "Ce passage dans le livre" }).waitFor();
  await capturer(page, "ce-passage-dans-le-livre", false);
  await sql("update projets set ordre_decision = 'garde', ordre_pages = $2 where id = $1", [projet, JSON.stringify({ [s[5]]: 40 })]);
  await aller(page, `/projet/${projet}/livre?etape=page`);
  await page.locator("#moins-de-blanc").filter({ hasText: "Le livre a changé." }).waitFor({ timeout: 60_000 });
  await page.locator("#moins-de-blanc").scrollIntoViewIfNeeded();
  await capturer(page, "doute-sur-l-ordre", false);
});

test("F10-AC36 : image pleine page en tête de passage", async ({ page }) => {
  test.setTimeout(300_000);
  n = 650;
  const { compte, base } = await adultePret(page);
  const projet = await semerProjet(base, compte, "personnel", "choix", "Le phare");
  const { chapitres } = await semerPartie(base, projet, "La côte", [{ titre: "La plage", scenes: ["Le quai", "La barque", "L’autre rive"] }]);
  const s = chapitres[0].scenes;
  const service = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_CLE_SECRETE!, { auth: { persistSession: false } });
  const image = await semerImage(base, compte, projet);
  for (const [suffixe, fichier] of [["", "defaut-montagne.jpg"], ["-v", "defaut-montagne-v.jpg"]]) {
    await service.storage.from("images").upload(`${compte.id}/${projet}/${image}${suffixe}.jpg`, readFileSync(`public/illustrations/${fichier}`), { contentType: "image/jpeg", upsert: true });
  }
  await base.from("projets").update({ depart_scene_id: s[0] }).eq("id", projet);
  await semerBlocs(base, s[0], [recit("Le quai est désert. ".repeat(30)), choixAuto("Monter dans la barque", s[1])]);
  await semerBlocs(base, s[1], [{ type: "image", id: crypto.randomUUID(), image, largeur: 100, page: true, children: [{ text: "" }] }, recit("La barque glisse sur l’eau noire. ".repeat(6)), choixAuto("Accoster", s[2])]);
  await semerBlocs(base, s[2], [recit("L’autre rive est silencieuse.")]);
  await base.from("scenes").update({ fin: true }).eq("id", s[2]);
  await sql("update scenes set etat = 'prete' where projet_id = $1", [projet]);
  await page.setViewportSize({ width: 1366, height: 1000 });
  await aller(page, `/projet/${projet}/livre?etape=relire`);
  await page.locator(".apercu__etat").filter({ hasText: "passages" }).waitFor({ timeout: 60_000 });
  await page.getByRole("button", { name: "Double page" }).click();
  const folio = await page.getByRole("button", { name: /^Ouvrir n° 2 ·/ }).first().evaluate((b) => b.closest<HTMLElement>("[data-folio]")!.dataset.folio);
  await page.locator(`[data-folio="${folio}"]`).scrollIntoViewIfNeeded();
  await page.waitForTimeout(1500);
  await capturer(page, "image-en-tete-de-passage", false);
});
