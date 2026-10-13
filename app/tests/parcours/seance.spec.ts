import { expect, test, type Page } from "@playwright/test";
import { aller, classeQuiEcrit, copie, ecrire, MESSAGE, posteDe, sql, supprimerComptes } from "./outils";

/**
 * Étape 4 du plan, lot 7 : une séance entière, à plusieurs postes, de la prise d'une scène
 * à sa validation. Rien n'y est semé en cours de route : chaque geste passe par l'écran,
 * comme le porteur le jouera pour finir l'étape (plan, « Terminée quand »). Les règles
 * elles-mêmes ont chacune leur test ; celui-ci dit que leur enchaînement tient.
 */

test.afterEach(async () => {
  await supprimerComptes();
});

const etatDe = async (scene: string): Promise<{ etat: string; qui: string | null }> =>
  (await sql<{ etat: string; qui: string | null }>("select etat, prise_par_eleve as qui from scenes where id = $1", [scene]))[0];
const tamponEleve = (page: Page) => page.locator("header .tampon");
const tamponAdulte = (page: Page) => page.locator("summary.tampon--menu");
const decision = (page: Page) => page.locator(".carnet-fiche--decision");
const mesScenes = (page: Page) => page.getByRole("region", { name: "Les scènes dont tu t’occupes" }).getByRole("listitem");
const filtres = (page: Page) => page.getByRole("group", { name: "Filtrer par état" });

test("Séance entière (F06.3, F07.1, F07.3, F07.5, F06.5) — Alice et Bilal prennent chacun une scène, écrivent et remettent ; Mme Laurent relit depuis le Suivi, demande une reprise à Alice, valide Bilal et l'encourage ; Alice reprend, remet, est validée ; la scène de Bilal est déclarée prête", async ({ page, browser }) => {
  test.setTimeout(240_000);
  const s = await classeQuiEcrit(page);
  const [sentier, pont] = s.lisiere.scenes;
  await s.base.from("scenes").update({ consigne: "Raconte ce que Lou voit en arrivant." }).in("id", [sentier, pont]);

  // ——— Les élèves s'installent : chacun prend une scène dans son chapitre ———
  const alice = await posteDe(browser, s, "Alice");
  const bilal = await posteDe(browser, s, "Bilal");
  await expect(alice.page.getByText("Tu ne t’occupes encore d’aucune scène.")).toBeVisible();
  await alice.page.getByRole("link", { name: "Choisir une scène" }).click();
  await alice.page.getByLabel("Choisir S001 pour m’en occuper").check();
  await alice.page.getByRole("region", { name: "Sélection" }).getByRole("button", { name: "Je m’en occupe" }).click();
  await expect(MESSAGE(alice.page)).toContainText("Tu t’occupes maintenant de S001.");
  await aller(bilal.page, `/travail/chapitre/${s.lisiere.id}`);
  // Bilal voit qu'Alice s'occupe de S001, et prend l'autre
  await expect(bilal.page.locator(".fiche").filter({ hasText: "S001" })).toContainText("Alice s’en occupe");
  await bilal.page.getByLabel("Choisir S002 pour m’en occuper").check();
  await bilal.page.getByRole("region", { name: "Sélection" }).getByRole("button", { name: "Je m’en occupe" }).click();
  await expect(MESSAGE(bilal.page)).toContainText("Tu t’occupes maintenant de S002.");
  expect((await etatDe(sentier)).qui).toBe(s.eleves.Alice.id);
  expect((await etatDe(pont)).qui).toBe(s.eleves.Bilal.id);

  // ——— Ils écrivent, puis remettent ———
  await aller(alice.page, `/travail/scene/${sentier}`);
  await ecrire(alice.page, "Lou s’avance sur le sentier.");
  await alice.page.getByRole("button", { name: "Remettre à Mme Laurent" }).click();
  await expect(tamponEleve(alice.page)).toHaveText("À valider");
  await aller(bilal.page, `/travail/scene/${pont}`);
  await ecrire(bilal.page, "Le pont grince sous les pas de Lou, et la corde chante.");
  await bilal.page.getByRole("button", { name: "Remettre à Mme Laurent" }).click();
  await expect(tamponEleve(bilal.page)).toHaveText("À valider");

  // ——— L'enseignante relit depuis le Suivi ———
  await aller(page, `/projet/${s.projet}/suivi?direct=1`);
  await expect(filtres(page).getByRole("button", { name: /^À valider/ })).toHaveText("À valider 2");
  await filtres(page).getByRole("button", { name: /^À valider/ }).click();
  await page.getByRole("link", { name: "Relire S001" }).click();
  await expect(decision(page)).toContainText("Alice a remis ce texte");
  // Une reprise pour Alice, avec une remarque
  await decision(page).getByRole("button", { name: "Demander une reprise…" }).click();
  await page.getByLabel(/^Remarque pour Alice/).fill("Dis ce que Lou entend.");
  await decision(page).getByRole("button", { name: "Demander la reprise" }).click();
  await expect(tamponAdulte(page)).toContainText("À reprendre");
  // La scène suivante à valider est proposée : celle de Bilal
  await decision(page).getByRole("link", { name: /^Suivante à valider : S002/ }).click();
  await expect(decision(page)).toContainText("Bilal a remis ce texte");
  await decision(page).getByRole("button", { name: "Valider le travail élève" }).click();
  await expect(tamponAdulte(page)).toContainText("Validé");
  // Un encouragement pour Bilal
  const encouragements = page.getByRole("region", { name: "Encouragements pour Bilal" });
  await encouragements.getByRole("button", { name: "Fine plume", exact: true }).click();
  await expect(encouragements.getByRole("button", { name: "Fine plume", exact: true })).toHaveAttribute("aria-pressed", "true");
  expect((await etatDe(sentier)).etat).toBe("reprendre");
  expect((await etatDe(pont)).etat).toBe("valide");

  // ——— Alice retrouve sa remarque, reprend, remet ———
  await aller(alice.page, "/travail");
  await expect(mesScenes(alice.page).first()).toHaveText(/S001.*Mme Laurent te demande de reprendre ton texte\..*À reprendre.*Reprendre mon texte/);
  await mesScenes(alice.page).first().getByRole("link", { name: /^Reprendre mon texte/ }).click();
  const remarque = alice.page.getByRole("region", { name: "Mme Laurent te demande de reprendre ton texte" });
  await expect(remarque).toContainText("Dis ce que Lou entend.");
  await remarque.getByRole("button", { name: "J’ai lu, j’écris" }).click();
  await expect(copie(alice.page)).toBeFocused();
  await ecrire(alice.page, " Un chant monte des fougères.");
  await alice.page.getByRole("button", { name: "Remettre à Mme Laurent" }).click();
  await expect(tamponEleve(alice.page)).toHaveText("À valider");

  // ——— Bilal lit que sa scène est validée, et son encouragement ———
  await aller(bilal.page, "/travail");
  await expect(mesScenes(bilal.page).first()).toHaveText(/S002.*Validé\. Bravo !/);
  await expect(mesScenes(bilal.page).first().getByRole("img", { name: "Encouragement : Fine plume" })).toBeVisible();
  await expect(bilal.page.getByRole("region", { name: "Tes encouragements" }).getByRole("listitem")).toHaveText([/^Fine plume\s*1$/]);

  // ——— L'enseignante valide Alice, puis déclare prête la scène de Bilal ———
  await aller(page, `/projet/${s.projet}/scene/${sentier}`);
  await expect(decision(page)).toContainText("Alice a remis ce texte");
  await decision(page).getByRole("button", { name: "Valider le travail élève" }).click();
  await expect(tamponAdulte(page)).toContainText("Validé");
  await aller(page, `/projet/${s.projet}/scene/${pont}`);
  await decision(page).getByRole("button", { name: "Prête pour le livre" }).click();
  // Le rappel avant « prête » dit ce qui manque à la scène — ici, une suite ou une fin —, sans l'empêcher
  await expect(decision(page).getByRole("alert")).toContainText("La déclarer prête quand même ?");
  await decision(page).getByRole("button", { name: "Déclarer prête" }).click();
  await expect(tamponAdulte(page)).toContainText("Prête");

  // ——— La séance finie : le Suivi et la base disent la même chose ———
  await aller(page, `/projet/${s.projet}/suivi?direct=1`);
  await expect(filtres(page).getByRole("button", { name: /^À valider/ })).toHaveText("À valider 0");
  await expect(filtres(page).getByRole("button", { name: /^Validé/ })).toHaveText("Validé 1");
  await expect(filtres(page).getByRole("button", { name: /^Prête/ })).toHaveText("Prête 1");
  expect(await etatDe(sentier)).toEqual({ etat: "valide", qui: s.eleves.Alice.id });
  expect(await etatDe(pont)).toEqual({ etat: "prete", qui: s.eleves.Bilal.id });
  // Deux remises d'Alice, une de Bilal, une remarque, un encouragement
  expect(await sql("select 1 from remises where scene_id = $1", [sentier])).toHaveLength(2);
  expect(await sql("select 1 from remises where scene_id = $1", [pont])).toHaveLength(1);
  expect(await sql("select 1 from remarques where projet_id = $1", [s.projet])).toHaveLength(1);
  expect(await sql("select 1 from encouragements where projet_id = $1 and eleve_id = $2 and categorie = 'plume'", [s.projet, s.eleves.Bilal.id])).toHaveLength(1);
});
