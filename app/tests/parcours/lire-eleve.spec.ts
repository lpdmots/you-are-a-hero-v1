import { expect, test, type Page } from "@playwright/test";
import {
  aller, choixAuto, classeQuiEcrit, posteDe, recit, semerBlocs, semerPartie, semerProjet, sql, supprimerComptes, taperCode,
} from "./outils";

/**
 * Étape 7 du plan, lot 3 : « Lire », côté élève (F12.3) — l'entrée unique, l'histoire en cours à
 * l'essai, les livres que l'enseignant ouvre à ses classes, et la lecture gardée pour chaque
 * élève, d'un poste à l'autre (F12-AC26, F04-AC22).
 */

test.afterEach(async () => {
  await supprimerComptes();
});

/** Un livre fini de deux passages, avec une feuille d'aventure, partagé « À mes classes » par l'écran. */
async function livreOuvertAuxClasses(page: Page, base: Parameters<typeof semerBlocs>[0], compte: Parameters<typeof semerProjet>[1], titre: string, classeId: string | null) {
  const projet = await semerProjet(base, compte, classeId ? "classe" : "personnel", "choix", titre, classeId);
  const s = (await semerPartie(base, projet, "La côte", [{ titre: "La plage", scenes: ["Le départ", "La fin"] }])).chapitres[0].scenes;
  await base.from("projets").update({ depart_scene_id: s[0] }).eq("id", projet);
  await semerBlocs(base, s[0], [recit(`${titre} : le départ.`), choixAuto("Avancer", s[1])]);
  await semerBlocs(base, s[1], [recit(`${titre} : la fin.`)]);
  await base.from("scenes").update({ fin: true }).eq("id", s[1]);
  const feuille = { on: true, des: 0, sections: [{ id: "inv", type: "liste", titre: "Inventaire", lignes: 6 }] };
  await base.from("preparations").update({ feuille, rubrique_jeu: true }).eq("projet_id", projet);
  await sql("update scenes set etat = 'prete' where projet_id = $1", [projet]);
  await sql(
    "update projets set mise_en_page_ouverte_le = now(), livre_relu_le = now(), chemins_verifies_le = now(), mise_en_page_convient_le = now(), imprimer_ouvert_le = now() where id = $1",
    [projet],
  );
  await aller(page, `/projet/${projet}/livre?etape=sortie&volet=partager`);
  await page.locator("label.inter", { has: page.getByRole("switch", { name: "À mes classes" }) }).click();
  const rappel = page.getByRole("group", { name: "À relire avant de partager" });
  await rappel.getByText("J’ai relu le livre sur ces points.").click();
  await rappel.getByRole("button", { name: "Partager" }).click();
  await expect(page.getByText(/Livre partagé, à jour depuis le/)).toBeVisible();
  return projet;
}

const lire = (p: Page) => p.getByRole("navigation", { name: "Espace élève" }).getByRole("link", { name: "Lire", exact: true });

test("F12-AC12, F12-AC24, F12-AC26, F04-AC22 — « Lire » : l'histoire en cours à l'essai, le livre de la classe en grand, un livre personnel ; la lecture d'Alice la suit sur un autre poste, Bilal a la sienne", async ({ page, browser }) => {
  const s = await classeQuiEcrit(page);
  const phare = await livreOuvertAuxClasses(page, s.base, s.compte, "Le phare", s.classe.id);
  await livreOuvertAuxClasses(page, s.base, s.compte, "Mon livre-modèle", null);

  const alice = await posteDe(browser, s, "Alice");
  await lire(alice.page).click();
  await expect(alice.page.getByRole("heading", { name: "Lire", level: 1 })).toBeVisible();
  const enCours = alice.page.getByRole("region", { name: "Notre histoire en cours" });
  await expect(enCours).toContainText("Les passeurs de brume");
  await expect(enCours.getByRole("link", { name: "Lire à l’essai" })).toBeVisible();
  const aLire = alice.page.getByRole("region", { name: /Livres à lire/ });
  const livres = aLire.getByRole("link");
  await expect(livres).toHaveCount(2);
  await expect(livres.first()).toContainText("Écrit par ta classe");
  await expect(livres.first()).toContainText("Le phare");
  await expect(livres.nth(1)).toContainText("Mon livre-modèle");
  await expect(livres.nth(1)).not.toContainText("Écrit par ta classe");
  await expect(alice.page.locator("main")).not.toContainText(/maîtresse|maître/);

  // Alice lit, note un objet ; sa lecture est gardée avec son prénom
  await livres.first().click();
  await alice.page.getByRole("button", { name: "Commencer la lecture" }).click();
  await alice.page.getByRole("button", { name: "Ma feuille" }).first().click();
  await alice.page.getByRole("textbox", { name: "Inventaire, ligne 1" }).fill("couteau");
  await alice.page.getByRole("button", { name: "Ranger" }).click();
  await alice.page.locator(".lecteur__corps").getByRole("button", { name: /Avancer/ }).click();
  await expect(alice.page.locator(".lecteur__corps")).toContainText("Le phare : la fin.");
  await expect.poll(async () => (await sql<{ n: number }>("select count(*)::int as n from lectures_en_cours where projet_id = $1 and eleve_id = $2 and lecture::text like '%couteau%'", [phare, s.eleves.Alice.id]))[0].n).toBe(1);

  // Sur un autre poste, elle continue où elle était, sa feuille avec elle
  const ailleurs = await posteDe(browser, s, "Alice");
  await lire(ailleurs.page).click();
  await ailleurs.page.getByRole("link", { name: /Le phare/ }).click();
  await ailleurs.page.getByRole("button", { name: "Continuer au passage 2" }).click();
  await ailleurs.page.getByRole("button", { name: "Ma feuille" }).first().click();
  await expect(ailleurs.page.getByRole("textbox", { name: "Inventaire, ligne 1" })).toHaveValue("couteau");
  await ailleurs.contexte.close();

  // Bilal, sur le premier poste : sa feuille à lui, vide
  await alice.page.getByRole("link", { name: "Retour à Lire" }).click();
  await alice.page.getByRole("button", { name: "Changer d’élève" }).click();
  await alice.page.waitForURL(/\/classe\/qui$/);
  await taperCode(alice.page, "Bilal", s.codes.Bilal);
  await alice.page.waitForURL(/\/travail$/);
  await lire(alice.page).click();
  await alice.page.getByRole("link", { name: /Le phare/ }).click();
  await expect(alice.page.getByRole("button", { name: /^Continuer/ })).toHaveCount(0);
  await alice.page.getByRole("button", { name: "Commencer la lecture" }).click();
  await alice.page.getByRole("button", { name: "Ma feuille" }).first().click();
  await expect(alice.page.getByRole("textbox", { name: "Inventaire, ligne 1" })).toHaveValue("");
  await alice.contexte.close();
});

test("sans livre proposé, « Lire » le dit ; sur un téléphone, la page tient dans la largeur", async ({ page, browser }) => {
  const s = await classeQuiEcrit(page);
  const alice = await posteDe(browser, s, "Alice");
  await alice.page.setViewportSize({ width: 390, height: 844 });
  await lire(alice.page).click();
  await expect(alice.page.getByText("Pas encore de livre. Quand Mme Laurent en proposera un, il sera ici.")).toBeVisible();
  expect(await alice.page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await alice.contexte.close();
});
