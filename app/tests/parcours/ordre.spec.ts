import { expect, test, type Page } from "@playwright/test";
import type { SupabaseClient } from "@supabase/supabase-js";
import { adultePret, aller, choixAuto, recit, semerBlocs, semerImage, semerPartie, semerProjet, sql, supprimerComptes, type Compte } from "./outils";

/**
 * Étape 6 du plan, lot 6 : l'ordre des passages (F11.5, F11.6) — « Réordonner les passages »,
 * « Garder cet ordre », le doute quand le livre change, le passage suggéré (F11.3).
 */

test.afterEach(async () => {
  await supprimerComptes();
});

type Livre = { compte: Compte; base: SupabaseClient; projet: string; s: string[] };

const PHRASE = "La brume montait du lac et recouvrait déjà les barques amarrées, tandis que Lou cherchait la lanterne. ";
/** Huit passages de longueurs variées en une partie, chacun mène au suivant ; tout est prêt, la mise en page ouverte. */
async function phare(page: Page, o: { pleinePage?: boolean } = {}): Promise<Livre> {
  const { compte, base } = await adultePret(page);
  const projet = await semerProjet(base, compte, "personnel", "choix", "Le phare");
  const { chapitres } = await semerPartie(base, projet, "La côte", [{ titre: "La plage", scenes: Array.from({ length: 8 }, (_, i) => `Passage ${i + 1}`) }]);
  const s = chapitres[0].scenes;
  await base.from("projets").update({ depart_scene_id: s[0] }).eq("id", projet);
  const longueurs = [1, 14, 2, 1, 12, 1, 2, 1];
  const image = o.pleinePage ? await semerImage(base, compte, projet) : null;
  for (let i = 0; i < s.length; i += 1) {
    const blocs = [recit(PHRASE.repeat(longueurs[i]))];
    if (image && i === 1) blocs.unshift({ type: "image", id: crypto.randomUUID(), image, largeur: 100, page: true, children: [{ text: "" }] });
    await semerBlocs(base, s[i], [...blocs, ...(i < s.length - 1 ? [choixAuto(`Continuer vers ${i + 2}`, s[i + 1])] : [])]);
  }
  await base.from("scenes").update({ fin: true }).eq("id", s[s.length - 1]);
  await sql("update scenes set etat = 'prete' where projet_id = $1", [projet]);
  for (let i = 0; i < s.length; i += 1) await sql("update scenes set rang_livre = $2 where id = $1", [s[i], i]);
  await sql("update projets set ordre_etabli_le = now(), mise_en_page_ouverte_le = now(), livre_relu_le = now(), chemins_verifies_le = now() where id = $1", [projet]);
  return { compte, base, projet, s };
}
const section = (page: Page) => page.locator("#moins-de-blanc");
const etape = (page: Page, nom: string) => page.getByRole("navigation", { name: "Étapes du livre" }).getByRole("link", { name: new RegExp(nom) });

test("F11-AC64, F11-AC21 — « Réordonner les passages » range les passages ou dit qu'aucun ordre ne fait mieux ; le départ garde le n° 1, aucune destination ne change ; « Annuler » rend l'ordre", async ({ page }) => {
  const l = await phare(page);
  await aller(page, `/projet/${l.projet}/livre?etape=page`);
  await expect(section(page)).toContainText("Les numéros changent, les renvois suivent.");
  // Aucune commande ne mélange tout le livre au hasard
  await expect(page.getByRole("button", { name: /nouveau mélange|mélanger le livre/i })).toHaveCount(0);
  const liens = async () => sql<{ scene_id: string; cible_id: string }>("select scene_id, cible_id from liens where projet_id = $1 order by scene_id", [l.projet]);
  const rangs = async () => (await sql<{ id: string; rang_livre: number }>("select id, rang_livre from scenes where projet_id = $1 order by id", [l.projet])).map((x) => x.rang_livre);
  const avant = { liens: await liens(), rangs: await rangs() };
  await section(page).getByRole("button", { name: "Réordonner les passages" }).click();
  await expect(section(page).getByRole("status")).toContainText(/Passages réordonnés|Aucun autre ordre/, { timeout: 60_000 });
  expect(await liens()).toEqual(avant.liens);
  // Le départ porte toujours le n° 1
  await page.getByRole("tab", { name: "Aperçu" }).click();
  await expect(page.getByRole("button", { name: /^Ouvrir n° 1 · S001$/ })).toBeAttached({ timeout: 60_000 });
  await page.getByRole("tab", { name: "Réglages" }).click();
  if (await section(page).getByRole("button", { name: "Annuler" }).count()) {
    expect(await rangs()).not.toEqual(avant.rangs);
    expect((await sql<{ d: string }>("select ordre_decision as d from projets where id = $1", [l.projet]))[0].d).toBe("reordonne");
    await section(page).getByRole("button", { name: "Annuler" }).click();
    await expect(section(page).getByRole("button", { name: "Réordonner les passages" })).toBeVisible();
    expect(await rangs()).toEqual(avant.rangs);
  }
});

test("F11-AC81 — après un passage déplacé à la main, réordonner l'abandonne : l'avertissement le dit d'abord ; « Annuler » ne change rien", async ({ page }) => {
  const l = await phare(page);
  await sql("update projets set ordre_decision = 'reordonne', ordre_agence_le = now() - interval '1 hour', ordre_retouche_le = now() where id = $1", [l.projet]);
  await aller(page, `/projet/${l.projet}/livre?etape=page`);
  await section(page).getByRole("button", { name: "Réordonner à nouveau" }).click();
  const avertissement = section(page).getByRole("group", { name: "Réordonner à nouveau ?" });
  await expect(avertissement).toContainText("Vos déplacements de passages seront abandonnés ; les réglages et les images sont gardés.");
  await avertissement.getByRole("button", { name: "Annuler" }).click();
  await expect(avertissement).toHaveCount(0);
});

test("F11-AC86, F11-AC99 — un passage a changé de page depuis la décision : la section, l'onglet et l'étape le marquent, la déclaration et le PDF définitif attendent ; « Garder cet ordre » lève le doute sans changer un numéro", async ({ page }) => {
  const l = await phare(page);
  // L'ordre gardé alors que le passage 8 était page 40 : il n'y est plus
  await sql("update projets set ordre_decision = 'garde', ordre_pages = $2, mise_en_page_convient_le = now(), imprimer_ouvert_le = now() where id = $1", [l.projet, JSON.stringify({ [l.s[7]]: 40 })]);
  await aller(page, `/projet/${l.projet}/livre?etape=page`);
  await expect(section(page)).toContainText("Le livre a changé.", { timeout: 60_000 });
  await expect(etape(page, "Mettre en page")).toContainText("il reste à faire");
  await expect(page.getByRole("tab", { name: /Réglages/ })).toContainText("ordre des passages à confirmer");
  await expect(page.getByRole("button", { name: "La mise en page me convient" })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Ordre des passages à confirmer" })).toBeVisible();
  await aller(page, `/projet/${l.projet}/livre?etape=sortie`);
  await expect(page.locator(".imprimer__raisons")).toContainText("Mettre en page · L’ordre des passages est à confirmer");

  await aller(page, `/projet/${l.projet}/livre?etape=page`);
  const rangs = async () => (await sql<{ rang_livre: number }>("select rang_livre from scenes where projet_id = $1 order by id", [l.projet])).map((x) => x.rang_livre);
  const avant = await rangs();
  await section(page).getByRole("button", { name: "Garder cet ordre" }).click();
  await expect(section(page)).toContainText("Ordre gardé.");
  await expect(etape(page, "Mettre en page")).toContainText("terminée");
  expect(await rangs()).toEqual(avant);
});

/** Un passage de huit phrases laisse 59 mm de blanc : le suivant, court mais fait de six choix, ne s'y coupe pas. */
async function blancComblable(page: Page): Promise<Livre> {
  const { compte, base } = await adultePret(page);
  const projet = await semerProjet(base, compte, "personnel", "choix", "Le phare");
  const { chapitres } = await semerPartie(base, projet, "La côte", [{ titre: "La plage", scenes: ["Le long quai", "L’hésitation", "La barque", "Le ponton", "La digue", "Le phare"] }]);
  const s = chapitres[0].scenes;
  await base.from("projets").update({ depart_scene_id: s[0] }).eq("id", projet);
  await semerBlocs(base, s[0], [recit(PHRASE.repeat(8)), choixAuto("Continuer", s[1])]);
  await semerBlocs(base, s[1], [recit("Lou hésite."), ...Array.from({ length: 6 }, (_, k) => choixAuto(`Option ${k + 1}`, s[2 + (k % 3)]))]);
  for (const i of [2, 3, 4]) await semerBlocs(base, s[i], [recit("Court."), choixAuto("Suite", s[5])]);
  await semerBlocs(base, s[5], [recit(PHRASE.repeat(4))]);
  await base.from("scenes").update({ fin: true }).eq("id", s[5]);
  await sql("update scenes set etat = 'prete' where projet_id = $1", [projet]);
  for (let i = 0; i < s.length; i += 1) await sql("update scenes set rang_livre = $2 where id = $1", [s[i], i]);
  await sql("update projets set ordre_etabli_le = now(), mise_en_page_ouverte_le = now(), livre_relu_le = now(), chemins_verifies_le = now() where id = $1", [projet]);
  return { compte, base, projet, s };
}
const versLesBlancs = async (page: Page) => {
  await page.getByRole("tab", { name: "Aperçu" }).click();
  await expect(page.locator(".apercu__etat")).toContainText("passages", { timeout: 60_000 });
  await page.getByRole("button", { name: "Page peu remplie suivante" }).click();
};

test("F11-AC67, F11-AC68 — sur une page peu remplie, les passages courts plus loin dans la partie sont suggérés, jamais celui où mène le bas de page ; « Placer ici » le place après lui, avec « Annuler »", async ({ page }) => {
  const l = await blancComblable(page);
  await aller(page, `/projet/${l.projet}/livre?etape=page`);
  await versLesBlancs(page);
  const suggestion = page.locator(".suggestion");
  await expect(suggestion).toContainText("3 passages peuvent le combler");
  await expect(suggestion.locator(".suggestion__numero")).toHaveText(["3", "4", "5"]);
  await expect(suggestion.locator(".suggestion__candidat").first()).toContainText("La barque");
  await suggestion.locator(".suggestion__candidat").nth(2).getByRole("button", { name: "Placer ici" }).click();
  await expect(page.locator(".apercu__fait")).toContainText("Passé du n° 5 au n° 2 · les renvois suivent.");
  await page.locator(".apercu__fait").getByRole("button", { name: "Annuler" }).click();
  await expect(page.locator(".apercu__fait")).toHaveCount(0);
  expect((await sql<{ rang_livre: number }>("select rang_livre from scenes where id = $1", [l.s[4]]))[0].rang_livre).toBe(4);
});

test("F11-AC74 — un blanc à l'intérieur d'un passage, avant son image pleine page : aucun passage suggéré, la raison, et la scène à ouvrir", async ({ page }) => {
  const l = await phare(page, { pleinePage: true });
  await aller(page, `/projet/${l.projet}/livre?etape=page`);
  await versLesBlancs(page);
  const suggestion = page.locator(".suggestion");
  await expect(suggestion).toContainText("Ce blanc est dans le n° 2 : aucun passage ne peut s’y glisser. Réduisez son image, ou laissez-le.");
  await expect(suggestion.locator(".suggestion__candidat")).toHaveCount(0);
  await suggestion.getByRole("button", { name: "Ouvrir le n° 2" }).click();
  await expect(page.getByRole("region", { name: "Ce passage dans le livre" })).toBeVisible();
});
