import { randomUUID } from "node:crypto";
import { expect, test, type Page } from "@playwright/test";
import { adultePret, aller, semerBlocs, semerPartie, semerProjet, sql, supprimerComptes, recit, type Compte } from "./outils";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Étape 9, lot 4 : les limites gratuites et le pass, vus par l'enseignant (F14-AC12 à AC17,
 * AC21). L'interrupteur « Paiement ouvert » est global : chaque essai le règle, puis le rend
 * comme il était, avec le prix du pass.
 */

let avant: { paiement_ouvert: boolean; prix_du_pass: number };
test.beforeAll(async () => {
  [avant] = await sql<{ paiement_ouvert: boolean; prix_du_pass: number }>("select paiement_ouvert, prix_du_pass from public.reglages_application");
});
test.afterEach(async () => {
  await sql("update public.reglages_application set paiement_ouvert = $1, prix_du_pass = $2", [avant.paiement_ouvert, avant.prix_du_pass]);
  await supprimerComptes();
});

const interrupteur = (allume: boolean) => sql("update public.reglages_application set paiement_ouvert = $1", [allume]);
const DIALOGUE = (page: Page) => page.getByRole("alertdialog");
const BARRE = (page: Page) => page.getByRole("toolbar", { name: "Outils de la copie" });

/** « Le marais », projet personnel de n scènes dans un seul chapitre. */
async function leMarais(page: Page, n: number): Promise<{ compte: Compte; base: SupabaseClient; projet: string; chapitre: string; scenes: string[] }> {
  const { compte, base } = await adultePret(page);
  const projet = await semerProjet(base, compte, "personnel", "choix", "Le marais", null);
  const { chapitres } = await semerPartie(base, projet, "La traversée", [{ titre: "Le dernier bac", scenes: Array.from({ length: n }, (_, i) => `Scène ${i + 1}`) }]);
  return { compte, base, projet, chapitre: chapitres[0].id, scenes: chapitres[0].scenes };
}

async function ouvrirReglages(page: Page, projet: string): Promise<void> {
  await aller(page, `/projet/${projet}/plan`);
  await page.getByRole("button", { name: "Réglages du projet" }).click();
  await expect(page.getByRole("heading", { name: "Réglages du projet" })).toBeVisible();
}

test("F14-AC12 — interrupteur éteint : une 41e scène s'ajoute, et rien ne parle de limite ni de pass", async ({ page }) => {
  const m = await leMarais(page, 40);
  await interrupteur(false);
  await aller(page, `/projet/${m.projet}/chapitre/${m.chapitre}`);
  await page.getByRole("button", { name: "Ajouter une scène" }).click();
  await expect(page.locator(".message")).toContainText("est ajoutée à la fin du chapitre");
  await expect(DIALOGUE(page)).toHaveCount(0);
  await ouvrirReglages(page, m.projet);
  await expect(page.getByText(/Pass du livre|Acheter le pass/)).toHaveCount(0);
  await page.keyboard.press("Escape");
  await expect(page.getByText("1 partie · 1 chapitre · 41 scènes", { exact: true })).toBeVisible();
});

test("F14-AC13, AC21 — allumé, à 40 scènes : « Ajouter une scène » ouvre le dialogue du pass, rien n'est créé ; le prix vient des réglages ; « Plus tard » laisse écrire", async ({ page }) => {
  const m = await leMarais(page, 40);
  await interrupteur(true);
  await sql("update public.reglages_application set prix_du_pass = 2500");
  await aller(page, `/projet/${m.projet}/plan`);
  await expect(page.getByText("40 scènes sur 40", { exact: true })).toBeVisible();
  // Le décompte atteint mène au pass, sans rien dire de refusé
  await page.getByRole("button", { name: "Pass du livre" }).click();
  await expect(DIALOGUE(page).getByRole("heading", { name: "Ce livre a atteint ses 40 scènes gratuites" })).toBeVisible();
  await expect(DIALOGUE(page)).not.toContainText("n’a pas été ajoutée");
  await page.keyboard.press("Escape");

  await aller(page, `/projet/${m.projet}/chapitre/${m.chapitre}`);
  await page.getByRole("button", { name: "Ajouter une scène" }).click();
  await expect(DIALOGUE(page).getByRole("heading", { name: "Ce livre a atteint ses 40 scènes gratuites" })).toBeVisible();
  await expect(DIALOGUE(page)).toContainText("La scène n’a pas été ajoutée. Tout le reste continue : écrire, faire le PDF, partager.");
  // Ce qui ne compte pas, dans la bulle ; les deux jauges, celle qui arrête en ambre
  await expect(DIALOGUE(page).getByRole("button", { name: "Qu’est-ce qui compte ?" })).toBeVisible();
  await expect(DIALOGUE(page)).toContainText("Scènes40 / 40");
  await expect(DIALOGUE(page)).toContainText("Images0 / 10");
  await expect(DIALOGUE(page)).toContainText("« Le marais »");
  await expect(DIALOGUE(page)).toContainText("Scènes sans limite");
  await expect(DIALOGUE(page)).toContainText("Images sans limite");
  await expect(DIALOGUE(page)).toContainText("400 étoiles ✦ pour les aides IA");
  await expect(DIALOGUE(page).getByRole("button", { name: "Acheter le pass · 25 €" })).toBeVisible();
  await DIALOGUE(page).getByRole("button", { name: "Plus tard" }).click();
  await expect(DIALOGUE(page)).toHaveCount(0);
  expect((await sql<{ n: number }>("select count(*)::int as n from public.scenes where projet_id = $1", [m.projet]))[0].n).toBe(40);

  // Les scènes existantes s'écrivent toujours
  await semerBlocs(m.base, m.scenes[3], [recit("Le passeur lève sa lanterne.")]);

  // Les réglages du projet disent où en est le livre gratuit
  await ouvrirReglages(page, m.projet);
  await expect(page.getByRole("heading", { name: "Pass du livre" })).toBeVisible();
  await expect(page.getByText(/40 scènes sur 40 · 0 image sur 10/)).toBeVisible();
  await expect(page.getByText("25 € une fois, pour ce livre")).toBeVisible();
  await expect(page.getByRole("button", { name: "Acheter le pass", exact: true })).toBeVisible();
});

test("F14-AC14 — allumé, livre à 10 images : « Image » ouvre le dialogue du pass, sans fiche ; une scène sans image dans un livre à 9 images en pose une", async ({ page }) => {
  const m = await leMarais(page, 2);
  const images = await Promise.all(Array.from({ length: 10 }, async () => {
    const id = randomUUID();
    await sql("insert into public.images (id, projet_id, enseignant_id, chemin, chemin_vignette, largeur, hauteur, format) values ($1, $2, $3, $4, $5, 240, 160, 'jpeg')", [id, m.projet, m.compte.id, `${m.compte.id}/${m.projet}/${id}.jpg`, `${m.compte.id}/${m.projet}/${id}-v.jpg`]);
    return id;
  }));
  const bloc = (image: string) => ({ type: "image", id: randomUUID(), image, largeur: 60, children: [{ text: "" }] });
  await semerBlocs(m.base, m.scenes[0], [recit("Le bac."), ...images.slice(0, 9).map(bloc)]);
  await semerBlocs(m.base, m.scenes[1], [recit("La rive.")]);
  await interrupteur(true);

  // Neuf images : la dixième se pose encore
  await aller(page, `/projet/${m.projet}/scene/${m.scenes[1]}`);
  await page.locator('.copie__texte[contenteditable="true"]').click();
  await BARRE(page).getByRole("button", { name: "Image" }).click();
  await expect(page.getByRole("list", { name: "Images du projet" })).toBeVisible();
  await expect(DIALOGUE(page)).toHaveCount(0);

  // Dix : la onzième ne se pose pas
  await sql("update public.scenes set texte = texte || $2::jsonb where id = $1", [m.scenes[1], JSON.stringify([bloc(images[9])])]);
  await aller(page, `/projet/${m.projet}/scene/${m.scenes[1]}`);
  await page.locator('.copie__texte[contenteditable="true"]').click();
  await BARRE(page).getByRole("button", { name: "Image" }).click();
  await expect(DIALOGUE(page).getByRole("heading", { name: "Ce livre a atteint ses 10 images gratuites" })).toBeVisible();
  await expect(DIALOGUE(page)).toContainText("L’image n’a pas été posée.");
  await expect(page.getByRole("list", { name: "Images du projet" })).toHaveCount(0);
});

test("F14-AC16 — le pass reçu : plus de dialogue, « Pass du livre » dans les réglages, et l'autre projet garde sa limite", async ({ page }) => {
  const m = await leMarais(page, 40);
  await interrupteur(true);
  await sql("select public.donner_le_pass($1, 'achat')", [m.projet]);
  await aller(page, `/projet/${m.projet}/chapitre/${m.chapitre}`);
  await page.getByRole("button", { name: "Ajouter une scène" }).click();
  await expect(page.locator(".message")).toContainText("est ajoutée à la fin du chapitre");
  await expect(DIALOGUE(page)).toHaveCount(0);
  await ouvrirReglages(page, m.projet);
  await expect(page.getByRole("heading", { name: "Pass du livre" })).toBeVisible();
  await expect(page.getByText(/^Reçu le \d+ \w+ 2026$/)).toBeVisible();
  await expect(page.getByRole("button", { name: /Acheter le pass/ })).toHaveCount(0);
  await page.keyboard.press("Escape");
  await expect(page.getByText("1 partie · 1 chapitre · 41 scènes", { exact: true })).toBeVisible();
});

test("F14-AC17 — le compte du porteur : ni limite, ni pass, ni décompte", async ({ page }) => {
  const m = await leMarais(page, 40);
  await sql("update public.enseignants set createur = true where id = $1", [m.compte.id]);
  await interrupteur(true);
  await aller(page, `/projet/${m.projet}/chapitre/${m.chapitre}`);
  await page.getByRole("button", { name: "Ajouter une scène" }).click();
  await expect(page.locator(".message")).toContainText("est ajoutée à la fin du chapitre");
  await ouvrirReglages(page, m.projet);
  await expect(page.getByText(/Pass du livre|Acheter le pass/)).toHaveCount(0);
});
