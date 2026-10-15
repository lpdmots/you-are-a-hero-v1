import { expect, test, type Page } from "@playwright/test";
import type { SupabaseClient } from "@supabase/supabase-js";
import { adultePret, aller, choixAuto, recit, semerBlocs, semerPartie, semerProjet, sql, supprimerComptes, type Compte } from "./outils";

/**
 * Étape 6 du plan, lot 4 : « Mettre en page », volet « Aperçu » — les commandes d'un passage
 * (F11.3), « Annuler », les pages peu remplies, les groupes de mélange, « La mise en page me
 * convient » et l'ouverture d'« Imprimer et partager » (F11.6), la scène réintégrée (F11-AC32).
 */

test.afterEach(async () => {
  await supprimerComptes();
});

type Livre = { compte: Compte; base: SupabaseClient; projet: string; s: string[] };

/** « Le phare » : six passages en deux parties, chacun mène au suivant ; tout est prêt, l'ordre établi dans l'ordre des scènes. */
async function phare(page: Page): Promise<Livre> {
  const { compte, base } = await adultePret(page);
  const projet = await semerProjet(base, compte, "personnel", "choix", "Le phare");
  const a = await semerPartie(base, projet, "La côte", [{ titre: "La plage", scenes: ["La plage au matin", "Les rochers", "La crique"] }]);
  const b = await semerPartie(base, projet, "Le phare", [{ titre: "La tour", scenes: ["L’escalier", "La lanterne", "Le sommet"] }]);
  const s = [...a.chapitres[0].scenes, ...b.chapitres[0].scenes];
  await base.from("projets").update({ depart_scene_id: s[0] }).eq("id", projet);
  for (let i = 0; i < s.length; i += 1) {
    await semerBlocs(base, s[i], [recit(`Passage ${i + 1} : la brume monte sur la côte.`), ...(i < s.length - 1 ? [choixAuto(`Continuer vers ${i + 2}`, s[i + 1])] : [])]);
  }
  await base.from("scenes").update({ fin: true }).eq("id", s[s.length - 1]);
  await sql("update scenes set etat = 'prete' where projet_id = $1", [projet]);
  for (let i = 0; i < s.length; i += 1) await sql("update scenes set rang_livre = $2 where id = $1", [s[i], i]);
  await sql("update projets set ordre_etabli_le = now(), mise_en_page_ouverte_le = now(), livre_relu_le = now(), chemins_verifies_le = now() where id = $1", [projet]);
  return { compte, base, projet, s };
}
const etape = (page: Page, nom: string) => page.getByRole("navigation", { name: "Étapes du livre" }).getByRole("link", { name: new RegExp(nom) });
const versApercu = async (page: Page) => {
  await page.getByRole("tab", { name: "Aperçu" }).click();
  await expect(page.locator(".apercu__etat")).toContainText("passages", { timeout: 60_000 });
};
const ouvrirPassage = async (page: Page, numero: number) => {
  await page.getByRole("button", { name: new RegExp(`^Ouvrir n° ${numero} ·`) }).evaluate((b: HTMLButtonElement) => b.click());
  await expect(page.getByRole("region", { name: "Ce passage dans le livre" })).toBeVisible();
};

test("F11-AC42, F11-AC45, F11-AC61 — à « Mettre en page », le n° 6 placé après le n° 4 devient le n° 5, les renvois suivent ; « Annuler » le rend ; à « Relire », la même scène n'a pas ces commandes", async ({ page }) => {
  const l = await phare(page);
  await aller(page, `/projet/${l.projet}/livre?etape=page`);
  await versApercu(page);
  // Le n° 5 ouvre la partie 2 : il ne bouge pas, et le dit
  await ouvrirPassage(page, 4);
  await expect(page.locator(".ce-passage__garde")).toHaveText("Il ouvre sa partie : il reste en tête.");
  await page.getByRole("button", { name: "Fermer" }).first().click();
  await ouvrirPassage(page, 6);
  const fiche = page.getByRole("region", { name: "Ce passage dans le livre" });
  // Hors de sa partie : refusé, la raison sur place
  await fiche.getByLabel("Placer après le n°").fill("2");
  await fiche.getByRole("button", { name: "Placer" }).click();
  await expect(fiche.getByRole("alert")).toHaveText("Choisissez un numéro de sa partie, du 4 au 6.");
  await fiche.getByLabel("Placer après le n°").fill("4");
  await fiche.getByRole("button", { name: "Placer" }).click();
  await expect(page.locator(".apercu__fait")).toContainText("Passé du n° 6 au n° 5 · les renvois suivent.");
  await expect(fiche.locator(".ce-passage__ou")).toContainText("n° 5", { timeout: 15_000 });
  // Le renvoi du passage 5 (la lanterne, devenue n° 6) mène toujours au sommet, désormais n° 5
  const numeros = async () => Object.fromEntries((await sql<{ id: string; rang_livre: number }>("select id, rang_livre from scenes where projet_id = $1", [l.projet])).map((x) => [x.id, x.rang_livre]));
  expect((await numeros())[l.s[5]]).toBeLessThan((await numeros())[l.s[4]]);
  await page.locator(".apercu__fait").getByRole("button", { name: "Annuler" }).click();
  await expect(page.locator(".apercu__fait")).toHaveCount(0);
  await expect(fiche.locator(".ce-passage__ou")).toContainText("n° 6", { timeout: 15_000 });
  expect((await numeros())[l.s[5]]).toBeGreaterThan((await numeros())[l.s[4]]);

  await aller(page, `/projet/${l.projet}/livre?etape=relire`);
  await page.getByRole("button", { name: /^Ouvrir n° 6 ·/ }).evaluate((b: HTMLButtonElement) => b.click());
  await expect(page.locator(".a-cote")).toBeVisible();
  await expect(page.getByRole("region", { name: "Ce passage dans le livre" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Pages peu remplies/ })).toHaveCount(0);
});

test("F11-AC10 — « Commencer sur une nouvelle page » se règle depuis l’aperçu, se dit avec « Annuler », et se garde avec la scène", async ({ page }) => {
  const l = await phare(page);
  await aller(page, `/projet/${l.projet}/livre?etape=page`);
  await versApercu(page);
  await ouvrirPassage(page, 3);
  await page.getByRole("region", { name: "Ce passage dans le livre" }).locator("label.inter").click();
  await expect(page.locator(".apercu__fait")).toContainText("Le n° 3 commence sur une nouvelle page.");
  await expect.poll(async () => (await sql<{ nouvelle_page: boolean }>("select nouvelle_page from scenes where id = $1", [l.s[2]]))[0].nouvelle_page).toBe(true);
});

test("F11-AC77, F11-AC62, F11-AC92 — « La mise en page me convient » coche l'étape et ouvre « Imprimer et partager », qui ne se referme plus ; un choix sans destination remet « il reste à faire » ; chaque volet garde sa place", async ({ page }) => {
  const l = await phare(page);
  await aller(page, `/projet/${l.projet}/livre?etape=page`);
  await expect(etape(page, "Imprimer et partager")).toContainText("pas encore ouverte");
  // AC92 : les réglages défilés jusqu'aux pages de début et de fin, puis l'aperçu, puis retour
  await page.getByRole("heading", { name: "Pages de début et de fin" }).scrollIntoViewIfNeeded();
  const ici = await page.evaluate(() => window.scrollY);
  await versApercu(page);
  await expect(page.locator('[data-folio="1"]')).toBeAttached();
  await expect(page.getByRole("group", { name: "Pages peu remplies" })).toBeVisible();
  await page.getByRole("tab", { name: "Réglages" }).click();
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(ici);
  await expect(page.getByRole("button", { name: "La mise en page me convient" })).toBeInViewport();

  await page.getByRole("button", { name: "La mise en page me convient" }).click();
  await expect(page.getByText("Mise en page terminée")).toBeVisible();
  await expect(etape(page, "Mettre en page")).toContainText("terminée");
  await expect(etape(page, "Imprimer et partager")).not.toContainText("pas encore ouverte");
  await page.getByRole("button", { name: "Reprendre" }).click();
  await expect(page.getByRole("button", { name: "La mise en page me convient" })).toBeVisible();
  // Une étape ouverte ne se referme pas
  await expect(etape(page, "Imprimer et partager")).not.toContainText("pas encore ouverte");

  // AC62 : un choix perd sa destination, l'adulte l'apprend sans changer d'étape
  await semerBlocs(l.base, l.s[1], [recit("Passage 2 : la brume monte sur la côte."), choixAuto("Continuer vers 3", null)]);
  await aller(page, `/projet/${l.projet}/livre?etape=page`);
  await expect(etape(page, "Vérifier les chemins")).toContainText("il reste à faire");
  await expect(etape(page, "Imprimer et partager")).toContainText("il reste à faire");
});

test("F11-AC17, F11-AC32 — « Mélanger les parties 1 et 2 » réunit leurs passages ; une scène réintégrée prend la suite de sa partie et le message le dit", async ({ page }) => {
  const l = await phare(page);
  await aller(page, `/projet/${l.projet}/livre?etape=page`);
  const ordre = page.getByRole("region", { name: "Ordre des passages" });
  await expect(ordre).toContainText("Partie 1 · La côte · n° 1 à 3");
  await ordre.getByText("Mélanger les parties 1 et 2").click();
  await expect(ordre).toContainText("n° 1 à 6, mélangés ensemble");
  expect((await sql<{ g: boolean }>("select groupe_avec_precedente as g from parties where projet_id = $1 order by rang", [l.projet])).map((x) => x.g)).toEqual([false, true]);

  // S002 exclue puis réintégrée : à la suite de sa partie
  await sql("update scenes set hors_livre = true where id = $1", [l.s[1]]);
  const [{ reference }] = await sql<{ reference: number }>("select reference from scenes where id = $1", [l.s[1]]);
  const ref = `S${String(reference).padStart(3, "0")}`;
  await aller(page, `/projet/${l.projet}/scene/${l.s[1]}`);
  await page.getByLabel(`Autres commandes de la scène ${ref}`).click();
  await page.getByRole("button", { name: "Réintégrer dans le livre" }).click();
  await expect(page.getByText(new RegExp(`${ref} .* est de nouveau dans le livre, à la suite de sa partie : n° 6\\.`))).toBeVisible();
});
