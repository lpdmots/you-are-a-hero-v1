import { expect, test, type Page } from "@playwright/test";
import { aller, classeQuiEcrit, MESSAGE, posteDe, semerTexte, sql, supprimerComptes, type Situation } from "./outils";

/**
 * Étape 4 du plan, lot 3 : « Mon travail », les scènes dont l'élève s'occupe, par urgence
 * (F06.5), et ce que deviennent les scènes d'un élève retiré de la classe (F01.1).
 */

test.afterEach(async () => {
  await supprimerComptes();
});

const liste = (page: Page) => page.getByRole("region", { name: "Les scènes dont tu t’occupes" });
const lignes = (page: Page) => liste(page).getByRole("listitem");

/** Des scènes de plus dans « La lisière », libres. */
async function plusDeScenes(s: Situation, titres: string[]): Promise<string[]> {
  const ids: string[] = [];
  for (const titre of titres) {
    const { data, error } = await s.base.rpc("creer_scene", { p_chapitre: s.lisiere.id });
    const ligne = (Array.isArray(data) ? data[0] : data) as { scene_id: string } | null;
    if (error || !ligne) throw new Error(error?.message);
    await s.base.from("scenes").update({ titre }).eq("id", ligne.scene_id);
    ids.push(ligne.scene_id);
  }
  return ids;
}
const confier = async (s: Situation, scenes: string[], prenom: string | null): Promise<void> => {
  const { error } = await s.base.from("scenes").update({ prise_par_eleve: prenom ? s.eleves[prenom].id : null }).in("id", scenes);
  if (error) throw new Error(error.message);
};
const etat = (scene: string, voulu: string) => sql("update scenes set etat = $2, tour = tour + 1 where id = $1", [scene, voulu]);

test.describe("Mon travail (F06.5)", () => {
  test("F06-AC95, AC33 — Mon travail, par urgence : à reprendre, en cours, texte vide, remise, validée ; une seule scène porte le bouton plein ; ni la scène d'Alice, ni rien d'un autre chapitre n'y figure", async ({ page, browser }) => {
    const s = await classeQuiEcrit(page);
    const [sentier, pont] = s.lisiere.scenes;
    const [souche, clairiere, gue, brume] = await plusDeScenes(s, ["La souche", "La clairière", "Le gué", "La brume"]);
    await confier(s, [sentier, pont, souche, clairiere, gue], "Bilal");
    await confier(s, [brume], "Alice");
    for (const scene of [sentier, pont, clairiere, gue, brume]) await semerTexte(s.base, scene, ["Un texte."]);
    await etat(sentier, "valide");
    await etat(pont, "valider");
    await etat(clairiere, "reprendre");
    // « La souche » reste sans texte, « Le gué » est en cours
    const bilal = await posteDe(browser, s, "Bilal");
    await expect(lignes(bilal.page)).toHaveText([
      /S005.*La clairière.*Mme Laurent te demande de reprendre ton texte\..*À reprendre.*Reprendre mon texte/,
      /S006.*Le gué.*Continue ton texte\..*En cours.*Continuer/,
      /S004.*La souche.*Tu peux préparer ton texte sur papier ou l’écrire ici\..*Texte vide.*Écrire/,
      /S002.*Le pont.*Mme Laurent relit ton texte\..*À valider.*Lire mon texte/,
      /S001.*Le sentier.*Validé\. Bravo !.*Validé.*Lire mon texte/,
    ]);
    await expect(liste(bilal.page).locator(".btn--primaire")).toHaveText(["Reprendre mon texte"]);
    await expect(liste(bilal.page)).not.toContainText("La brume");
    await expect(liste(bilal.page)).not.toContainText("L’autel");
    // Le bouton plein ouvre la scène qui l'attend
    await liste(bilal.page).getByRole("link", { name: /^Reprendre mon texte/ }).click();
    await bilal.page.waitForURL(new RegExp(`/travail/scene/${clairiere}`));
    await bilal.contexte.close();
  });

  test("F06-AC96 — scènes à prendre : sous sa liste, « 3 scènes ne sont pas encore prises dans ton chapitre » et « Voir », qui ouvre le chapitre ; toutes prises, la ligne n'est plus affichée", async ({ page, browser }) => {
    const s = await classeQuiEcrit(page);
    const [sentier, pont] = s.lisiere.scenes;
    const [souche, clairiere] = await plusDeScenes(s, ["La souche", "La clairière"]);
    await confier(s, [sentier], "Bilal");
    // Une scène validée sans élève ne s'écrit plus : elle ne compte pas parmi celles à prendre
    await semerTexte(s.base, clairiere, ["Une scène de liaison."]);
    await etat(clairiere, "valide");
    await plusDeScenes(s, ["Le gué"]);
    const bilal = await posteDe(browser, s, "Bilal");
    await expect(liste(bilal.page)).toContainText("3 scènes ne sont pas encore prises dans ton chapitre");
    await liste(bilal.page).getByRole("link", { name: "Voir les scènes à prendre dans La lisière" }).click();
    await bilal.page.waitForURL(new RegExp(`/travail/chapitre/${s.lisiere.id}`));
    await expect(bilal.page.getByLabel("Choisir S002 pour m’en occuper")).toBeVisible();
    await sql("update scenes set prise_par_eleve = $1 where chapitre_id = $2 and prise_par_eleve is null and etat = 'cours'", [s.eleves.Alice.id, s.lisiere.id]);
    await aller(bilal.page, "/travail");
    await expect(lignes(bilal.page)).toHaveCount(1);
    await expect(liste(bilal.page)).not.toContainText("pas encore prise");
    void pont;
    void souche;
    await bilal.contexte.close();
  });

  test("F06-AC97 — aucune scène à son nom : une phrase le dit et « Choisir une scène » ouvre son chapitre ; rien ne lui dit qu'elle n'a pas de chapitre", async ({ page, browser }) => {
    const s = await classeQuiEcrit(page);
    const alice = await posteDe(browser, s, "Alice");
    await expect(liste(alice.page)).toContainText("Tu ne t’occupes encore d’aucune scène. Choisis-en une dans ton chapitre.");
    await expect(alice.page.getByText(/Tu n’as pas encore de chapitre/)).toHaveCount(0);
    await liste(alice.page).getByRole("link", { name: "Choisir une scène" }).click();
    await alice.page.waitForURL(new RegExp(`/travail/chapitre/${s.lisiere.id}`));
    // Quand aucune de ses scènes ne l'attend plus et qu'il en reste à prendre, le bouton plein y mène aussi
    await confier(s, [s.lisiere.scenes[0]], "Alice");
    await semerTexte(s.base, s.lisiere.scenes[0], ["Un texte."]);
    await etat(s.lisiere.scenes[0], "valider");
    await aller(alice.page, "/travail");
    await expect(lignes(alice.page)).toHaveCount(1);
    await expect(liste(alice.page).locator(".btn--primaire")).toHaveText(["Choisir une scène"]);
    await alice.contexte.close();
  });

  test("F08-AC17, F06.4 — scène où l'élève est arrêté : elle porte sa phrase, sans bouton pour écrire ; hors des horaires, « Mon travail » ne liste rien", async ({ page, browser }) => {
    const s = await classeQuiEcrit(page);
    const [sentier, pont] = s.lisiere.scenes;
    await confier(s, [sentier, pont], "Bilal");
    await semerTexte(s.base, sentier, ["Un texte."]);
    await sql(
      `insert into copies_recuperation (scene_id, projet_id, enseignant_id, sorte, eleve_id, motif, texte)
       select id, projet_id, enseignant_id, 'refus', $2, 'conflit', '[]'::jsonb from scenes where id = $1`,
      [sentier, s.eleves.Bilal.id],
    );
    const bilal = await posteDe(browser, s, "Bilal");
    await expect(lignes(bilal.page)).toHaveText([/S002.*Le pont.*Écrire/, /S001.*Le sentier.*Ton texte est gardé à part\. Mme Laurent doit le regarder avant que tu écrives ici\..*Lire la scène/]);
    await expect(liste(bilal.page).locator(".btn--primaire")).toHaveText(["Écrire"]);
    await sql("update classes set horaires_limites = true where id = $1", [s.classe.id]);
    await aller(bilal.page, "/travail");
    await expect(bilal.page.getByText(/Le travail est fermé/)).toBeVisible();
    await expect(liste(bilal.page)).toHaveCount(0);
    await bilal.contexte.close();
  });
});

test.describe("Retirer un élève de la classe (F01.1)", () => {
  test("F01-AC22, AC23, AC25 — Bilal retiré : sa scène validée garde son prénom, sa scène à reprendre redevient « En cours », « Pas encore prise » ; son profil reste proposé à l'inscription, pas celui de Chloé, inscrite par erreur", async ({ page }) => {
    const s = await classeQuiEcrit(page);
    const [sentier, pont] = s.lisiere.scenes;
    await confier(s, [sentier, pont], "Bilal");
    for (const scene of [sentier, pont]) await semerTexte(s.base, scene, ["Le texte de Bilal."]);
    await sql("update scenes set ecrit_par = array[$1::uuid] where id = any($2::uuid[])", [s.eleves.Bilal.id, [sentier, pont]]);
    await etat(sentier, "valide");
    await etat(pont, "reprendre");

    const retirer = async (prenom: string) => {
      await aller(page, `/classes/${s.classe.id}`);
      await page.getByRole("region", { name: "Élèves" }).getByRole("button", { name: new RegExp(prenom) }).click();
      await page.getByRole("complementary").filter({ hasText: "Retirer de la classe" }).getByRole("button", { name: "Retirer de la classe" }).click();
      await expect(MESSAGE(page)).toContainText(prenom);
    };
    await retirer("Bilal");
    await retirer("Chloé");
    await expect(page.getByRole("region", { name: "Élèves" }).getByRole("listitem")).toHaveCount(1);

    // Dans le chapitre : Bilal n'y est plus ; la scène validée garde son prénom, l'autre est à prendre
    await aller(page, `/projet/${s.projet}/chapitre/${s.lisiere.id}`);
    const fiche = (ref: string) => page.locator(".fiche").filter({ has: page.locator(".fiche__ref", { hasText: ref }) });
    await expect(fiche("S001")).toContainText("Validé");
    await expect(fiche("S001")).toContainText("Bilal s’en occupait");
    await expect(fiche("S002")).toContainText("En cours");
    await expect(fiche("S002")).toContainText("Pas encore prise");
    await expect(page.locator(".chap-eleves")).not.toContainText("Bilal");
    await aller(page, `/projet/${s.projet}/scene/${pont}`);
    await expect(page.locator(".copie__texte").first()).toContainText("Le texte de Bilal.");

    // À l'inscription : Bilal, qui a écrit, se retrouve avec son code ; Chloé, inscrite par erreur, n'est plus proposée
    await aller(page, `/classes/${s.classe.id}/inscrire`);
    await expect(page.getByRole("heading", { name: "Qui retrouvez-vous cette année ?" })).toBeVisible();
    await expect(page.getByText("retiré de CM1-CM2")).toBeVisible();
    await expect(page.getByRole("checkbox", { name: /Bilal/ })).toBeVisible();
    await expect(page.getByRole("checkbox", { name: /Chloé/ })).toHaveCount(0);
  });

  test("F01.1 — « Annuler », juste après le retrait : Bilal retrouve son chapitre et la scène qu'il reprenait", async ({ page }) => {
    const s = await classeQuiEcrit(page);
    const [sentier] = s.lisiere.scenes;
    await confier(s, [sentier], "Bilal");
    await semerTexte(s.base, sentier, ["Le texte de Bilal."]);
    await etat(sentier, "reprendre");
    await aller(page, `/classes/${s.classe.id}`);
    await page.getByRole("region", { name: "Élèves" }).getByRole("button", { name: /Bilal/ }).click();
    await page.getByRole("complementary").filter({ hasText: "Retirer de la classe" }).getByRole("button", { name: "Retirer de la classe" }).click();
    await expect.poll(async () => (await sql<{ etat: string; prise_par_eleve: string | null }>("select etat, prise_par_eleve from scenes where id = $1", [sentier]))[0]).toEqual({ etat: "cours", prise_par_eleve: null });
    await MESSAGE(page).getByRole("button", { name: "Annuler" }).click();
    await expect(page.getByRole("region", { name: "Élèves" }).getByRole("listitem")).toHaveCount(3);
    expect((await sql<{ etat: string; prise_par_eleve: string | null }>("select etat, prise_par_eleve from scenes where id = $1", [sentier]))[0]).toEqual({ etat: "reprendre", prise_par_eleve: s.eleves.Bilal.id });
    expect(await sql("select 1 from attributions where chapitre_id = $1 and eleve_id = $2", [s.lisiere.id, s.eleves.Bilal.id])).toHaveLength(1);
  });
});
