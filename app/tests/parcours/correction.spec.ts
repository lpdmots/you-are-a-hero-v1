import { expect, test, type Page } from "@playwright/test";
import {
  adultePret, aller, choixAuto, copie, MESSAGE, motsEnBase, note, recit, selectionner, semerAttribution, semerBlocs, semerClasse, semerPartie, semerProjet, sql,
  supprimerComptes, typesEnBase,
} from "./outils";

/**
 * Étape 8, lot 2 : l'aide à la correction dans la page de scène (F13.1). Le fournisseur est
 * simulé (IA_SIMULEE) : « dormé » devient « dormait », « grote » « grotte », et à partir du
 * degré 2 la majuscule et le point final s'ajoutent.
 */

test.afterEach(async () => {
  await supprimerComptes();
});

const DRAGON = "Le dragon dormé dans la grote. Il était très très grand.";
const CHEMIN = "Lou suivit le chemin";

/** Mme Laurent, sa classe, et S001 « La grotte », dont Alice s'occupe : un paragraphe, un choix vers S002, une note, un second paragraphe. */
async function sceneDAlice(page: Page) {
  const { compte, base } = await adultePret(page);
  const classe = await semerClasse(base, "CM1-CM2", ["Alice"]);
  const projet = await semerProjet(base, compte, "classe", "choix", "Les passeurs de brume", classe.id);
  const { chapitres } = await semerPartie(base, projet, "La forêt", [{ titre: "La lisière", scenes: ["La grotte", "Le pont", "Le sentier"] }]);
  const [s1, s2, s3] = chapitres[0].scenes;
  await semerAttribution(base, chapitres[0].id, [{ eleve: classe.eleves.Alice.id }]);
  await base.from("scenes").update({ prise_par_eleve: classe.eleves.Alice.id }).eq("id", s1);
  await semerBlocs(base, s1, [recit(DRAGON), choixAuto("Entrer dans la grote", s2), note("Alice a oublié la grote."), recit(CHEMIN)]);
  await semerBlocs(base, s3, [recit("Le sentier monte.")]);
  return { compte, base, projet, s1, s2, s3, alice: classe.eleves.Alice.id };
}

const degre = (page: Page) => page.locator(".corriger summary");
const choisirDegre = async (page: Page, n: number) => {
  await degre(page).click();
  await page.getByRole("menuitemradio", { name: new RegExp(`^Degré ${n} ·`) }).click();
};
const changements = (page: Page) => page.locator("button.corr");

test.describe("Corriger une scène (F13.1)", () => {
  test("F13-AC17, F13-AC02 — au degré 1, deux marques au stylo ; rien ne change avant « Garder », un refus reste, « Annuler » rend le texte", async ({ page }) => {
    const s = await sceneDAlice(page);
    await aller(page, `/projet/${s.projet}/scene/${s.s1}`);
    await expect(page.getByRole("button", { name: "Corriger", exact: true })).toBeVisible();
    await expect(degre(page)).toHaveText("Degré 2");
    await expect(degre(page).locator("span[title]")).toHaveAttribute("title", "Degré 2 · Orthographe et grammaire");
    await choisirDegre(page, 1);
    await page.getByRole("button", { name: "Corriger", exact: true }).click();

    await expect(changements(page)).toHaveCount(2);
    await expect(changements(page).nth(0)).toHaveAccessibleName("Changement 1 : « dormé » devient « dormait ». Gardé.");
    await expect(changements(page).nth(1)).toHaveAccessibleName("Changement 2 : « grote » devient « grotte ». Gardé.");
    // La note et le choix restent, intacts, et ne se marquent pas (F13-AC03)
    await expect(page.locator(".corr-texte .note-prof")).toContainText("Alice a oublié la grote.");
    await expect(page.locator(".corr-texte .phrase-choix")).toContainText("Entrer dans la grote");
    // F13-AC02 : la proposition est là, le texte de la scène n'a pas changé
    expect(await motsEnBase(s.s1)).toBe(`${DRAGON} /  / Alice a oublié la grote. / ${CHEMIN}`);

    await changements(page).nth(0).click();
    await expect(changements(page).nth(0)).toHaveAttribute("aria-pressed", "false");
    await expect(page.locator(".corr-compte")).toContainText("1 changement sur 2.");
    await page.getByRole("button", { name: "Garder les changements" }).click();
    await expect(MESSAGE(page)).toContainText("1 changement gardé.");
    await expect(copie(page)).toContainText("Le dragon dormé dans la grotte.");
    expect(await motsEnBase(s.s1)).toBe(`Le dragon dormé dans la grotte. Il était très très grand. /  / Alice a oublié la grote. / ${CHEMIN}`);
    expect(await typesEnBase(s.s1)).toEqual(["p", "choix", "note", "p"]);

    await MESSAGE(page).getByRole("button", { name: "Annuler" }).click();
    await expect(MESSAGE(page)).toContainText("La scène a retrouvé son texte d’avant la correction.");
    expect(await motsEnBase(s.s1)).toBe(`${DRAGON} /  / Alice a oublié la grote. / ${CHEMIN}`);
  });

  test("F13-AC03, F13-AC04 — la correction gardée laisse l'état, l'élève, le choix vers S002 et la remise d'Alice", async ({ page }) => {
    const s = await sceneDAlice(page);
    await sql(
      `with sc as (update public.scenes set etat = 'valider', tour = tour + 1 where id = $1 returning id, projet_id, enseignant_id, texte)
       insert into public.remises (scene_id, projet_id, enseignant_id, eleve_id, texte) select id, projet_id, enseignant_id, $2, texte from sc`,
      [s.s1, s.alice],
    );
    await aller(page, `/projet/${s.projet}/scene/${s.s1}`);
    await page.getByRole("button", { name: "Corriger", exact: true }).click();
    await page.getByRole("button", { name: "Garder les changements" }).click();
    await expect(MESSAGE(page)).toContainText("changements gardés.");
    await expect(page.locator(".tampon").first()).toHaveText(/À valider/);
    const [scene] = await sql<{ etat: string; prise_par_eleve: string }>("select etat, prise_par_eleve from public.scenes where id = $1", [s.s1]);
    expect(scene).toEqual({ etat: "valider", prise_par_eleve: s.alice });
    expect(await sql("select cible_id from public.liens where scene_id = $1", [s.s1])).toEqual([{ cible_id: s.s2 }]);
    const [remise] = await sql<{ texte: { children: { text: string }[] }[] }>("select texte from public.remises where scene_id = $1", [s.s1]);
    expect(remise.texte[0].children[0].text).toBe(DRAGON);
    await page.getByRole("tab", { name: /Remis/ }).click();
    await expect(page.locator(".copie__texte--lu")).toContainText(DRAGON);
  });

  test("« Corriger la sélection » : seul le paragraphe touché part, en entier", async ({ page }) => {
    const s = await sceneDAlice(page);
    await aller(page, `/projet/${s.projet}/scene/${s.s1}`);
    await expect(copie(page)).toContainText(CHEMIN);
    // Quelques lettres du dernier paragraphe : le paragraphe entier part
    await selectionner(page, { bloc: 3, offset: 4 }, { bloc: 3, offset: 9 });
    await expect(page.getByRole("button", { name: "Corriger la sélection" })).toBeVisible();
    await page.getByRole("button", { name: "Corriger la sélection" }).click();
    await expect(changements(page)).toHaveCount(1);
    await expect(changements(page).first()).toHaveAccessibleName("Changement 1 : ajouter « . ». Gardé.");
    await page.getByRole("button", { name: "Laisser" }).click();
    await expect(copie(page)).toBeVisible();
    expect(await motsEnBase(s.s1)).toContain(DRAGON);
  });

  test("degrés 4 et 5 : côte à côte, la proposition se retouche, puis « Mettre ce texte dans la scène » ; un onglet chacun en 390 px", async ({ page }) => {
    const s = await sceneDAlice(page);
    await aller(page, `/projet/${s.projet}/scene/${s.s1}`);
    await choisirDegre(page, 4);
    await page.getByRole("button", { name: "Corriger", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Texte actuel" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Proposition" })).toBeVisible();
    await expect(changements(page)).toHaveCount(0);
    const champs = page.getByLabel("Paragraphe proposé");
    await expect(champs).toHaveCount(2);
    await expect(champs.first()).toHaveValue("Le dragon dormait dans la grotte. Il était très très grand.");
    await champs.first().fill("Le dragon dormait au fond de la grotte, immense.");
    // Sur téléphone, un onglet pour chaque texte
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(page.getByRole("tab", { name: "Proposition" })).toHaveAttribute("aria-selected", "true");
    await expect(page.locator("[data-col='scene']")).toBeHidden();
    await page.getByRole("tab", { name: "Texte actuel" }).click();
    await expect(page.locator("[data-col='scene']")).toBeVisible();
    await expect(page.locator("[data-col='proposition']")).toBeHidden();
    await page.setViewportSize({ width: 1366, height: 768 });
    await page.getByRole("button", { name: "Mettre ce texte dans la scène" }).click();
    await expect(MESSAGE(page)).toContainText("La proposition est maintenant le texte de la scène.");
    expect(await motsEnBase(s.s1)).toBe(`Le dragon dormait au fond de la grotte, immense. /  / Alice a oublié la grote. / ${CHEMIN}.`);
  });

  test("F13-AC01 — le degré choisi pour une scène ne change pas le défaut : la scène suivante repart du degré du compte", async ({ page }) => {
    const s = await sceneDAlice(page);
    await s.base.from("enseignants").update({ reglages_ia: { degre: 3, proposer: true, niveaux: [], imagesParCreation: 1, qualite: "normale" } }).eq("id", s.compte.id);
    await aller(page, `/projet/${s.projet}/scene/${s.s1}`);
    await expect(degre(page)).toHaveText("Degré 3");
    await choisirDegre(page, 5);
    await expect(degre(page)).toHaveText(/Degré 5/);
    await aller(page, `/projet/${s.projet}/scene/${s.s3}`);
    await expect(degre(page)).toHaveText(/Degré 3/);
  });

  test("le texte a changé depuis la demande : rien ne se propose, « Redemander ? » relit la scène et redemande", async ({ page }) => {
    const s = await sceneDAlice(page);
    await aller(page, `/projet/${s.projet}/scene/${s.s1}`);
    await expect(copie(page)).toContainText(CHEMIN);
    // Un élève écrit pendant que la page est ouverte
    await sql("update public.scenes set version = version + 1 where id = $1", [s.s1]);
    await page.getByRole("button", { name: "Corriger", exact: true }).click();
    await expect(page.getByText("Le texte a changé depuis la demande. Redemander ?")).toBeVisible();
    await expect(changements(page)).toHaveCount(0);
    await page.getByRole("button", { name: "Redemander" }).click();
    await expect(changements(page)).toHaveCount(3);
  });

  test("aides éteintes : ni « Corriger », ni degré, ni « Proposer des pistes »", async ({ page }) => {
    const s = await sceneDAlice(page);
    await s.base.from("enseignants").update({ reglages_ia: { degre: 2, proposer: false, niveaux: [], imagesParCreation: 1, qualite: "normale" } }).eq("id", s.compte.id);
    await sql("update public.scenes set etat = 'valider' where id = $1", [s.s1]);
    await aller(page, `/projet/${s.projet}/scene/${s.s1}`);
    await expect(copie(page)).toBeVisible();
    await expect(page.getByRole("button", { name: /Corriger/ })).toHaveCount(0);
    await expect(page.locator(".corriger")).toHaveCount(0);
    await page.getByRole("button", { name: "Demander une reprise…" }).click();
    await expect(page.getByLabel(/Remarque/)).toBeVisible();
    await expect(page.getByRole("button", { name: "Proposer des pistes" })).toHaveCount(0);
  });
});

test.describe("« Proposer des pistes » (F13.1, F07.3)", () => {
  test("sous la remarque de reprise : les pistes remplissent un champ vide, puis s'ajoutent à la suite", async ({ page }) => {
    const s = await sceneDAlice(page);
    await sql("update public.scenes set etat = 'valider' where id = $1", [s.s1]);
    await aller(page, `/projet/${s.projet}/scene/${s.s1}`);
    await page.getByRole("button", { name: "Demander une reprise…" }).click();
    const remarque = page.getByLabel(/Remarque/);
    await page.getByRole("button", { name: "Proposer des pistes" }).click();
    await expect(remarque).toHaveValue("– Dis ce que tu vois en arrivant.\n– Montre ce que ressent ton héros.");
    await remarque.fill("Bien commencé, Alice.");
    await page.getByRole("button", { name: "Proposer des pistes" }).click();
    await expect(remarque).toHaveValue("Bien commencé, Alice.\n– Dis ce que tu vois en arrivant.\n– Montre ce que ressent ton héros.");
  });

  test("en projet personnel, pas de pistes : la correction reste", async ({ page }) => {
    const { compte, base } = await adultePret(page);
    const projet = await semerProjet(base, compte, "personnel", "choix", "Mon roman");
    const { chapitres } = await semerPartie(base, projet, "Le début", [{ titre: "Chapitre un", scenes: ["La gare"] }]);
    await semerBlocs(base, chapitres[0].scenes[0], [recit(DRAGON)]);
    await aller(page, `/projet/${projet}/scene/${chapitres[0].scenes[0]}`);
    await expect(page.getByRole("button", { name: "Corriger", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Proposer des pistes" })).toHaveCount(0);
  });
});
