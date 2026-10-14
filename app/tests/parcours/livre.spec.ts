import { expect, test, type Page } from "@playwright/test";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  action, adultePret, aller, choixAuto, FICHE, liaison, recit, semerBlocs, semerPartie, semerProjet, sql, supprimerComptes, type Compte,
} from "./outils";

/**
 * Étape 5 du plan, lot 2 : la destination Livre et « Vérifier les chemins » (F11.6, F09.2) —
 * la ligne d'étapes et ses marques, l'aide à l'ouverture, les tâches, les points avec leurs
 * gestes, les avertissements acceptés, la déclaration, le retour depuis la scène.
 */

test.afterEach(async () => {
  await supprimerComptes();
});

const etapes = (page: Page) => page.getByRole("navigation", { name: "Étapes du livre" });
const fiche = (page: Page) => page.locator(".controles");
const tache = (page: Page, nom: string) => fiche(page).getByRole("list", { name: "Tâches de l’étape" }).getByRole("button", { name: new RegExp(`^\\d?\\s*${nom}`) });
const points = (page: Page) => fiche(page).locator(".tache-panneau .point");
const pret = (projet: string) => sql("update scenes set etat = 'prete' where projet_id = $1", [projet]);

type Livre = { compte: Compte; base: SupabaseClient; projet: string; s: string[] };

/**
 * « Le phare » : S001, départ, mène à S002 (fin) et, par « Suivre le goéland », nulle part ;
 * S003, fin où rien ne mène ; S004, impasse où mène S002 ; S005, sa seule suite une énigme vers S002.
 * Toutes prêtes ; S001 porte une action de jeu, et le livre n'a pas de feuille d'aventure.
 */
async function phare(page: Page): Promise<Livre> {
  const { compte, base } = await adultePret(page);
  const projet = await semerProjet(base, compte, "personnel", "choix", "Le phare");
  const { chapitres } = await semerPartie(base, projet, "La côte", [{ titre: "La plage", scenes: ["La plage au matin", "La lanterne", "La crique", "Le bateau échoué", "La porte aux symboles"] }]);
  const s = chapitres[0].scenes;
  await base.from("projets").update({ depart_scene_id: s[0] }).eq("id", projet);
  await semerBlocs(base, s[0], [recit("Le phare clignote."), action("Ajoute la corde à ton inventaire."), choixAuto("Monter au phare", s[1]), choixAuto("Suivre le goéland", null)]);
  await semerBlocs(base, s[1], [recit("La lanterne s’allume."), choixAuto("Regarder la mer", s[3]), choixAuto("Ouvrir la porte", s[4])]);
  await semerBlocs(base, s[2], [recit("La crique est calme.")]);
  await semerBlocs(base, s[3], [recit("La coque est fendue.")]);
  await semerBlocs(base, s[4], [recit("Trois symboles."), liaison(s[1], "Déchiffrer")]);
  await base.from("scenes").update({ fin: true }).in("id", [s[1], s[2]]);
  await pret(projet);
  return { compte, base, projet, s };
}

test.describe("Destination Livre (F11.6)", () => {
  test("F11-AC79 — à l'ouverture de « Vérifier les chemins » : son titre, quelques questions, « Ne plus afficher », « Commencer » ; la case cochée, l'étape s'ouvre directement et « Aide » rouvre l'écran", async ({ page }) => {
    const l = await phare(page);
    await l.base.from("enseignants").update({ aides_masquees: [] }).eq("id", l.compte.id);
    await aller(page, `/projet/${l.projet}/livre`);
    const aide = page.getByRole("region", { name: "Vérifier les chemins" });
    await expect(aide.getByText("Étape 2")).toBeVisible();
    await expect(aide.locator("details[open] > summary")).toHaveText(["Que fait-on maintenant ?"]);
    await expect(aide.locator("details:not([open]) > summary")).toHaveCount(3);
    await aide.getByLabel("Ne plus afficher").check();
    await expect.poll(async () => (await sql<{ a: string[] }>("select aides_masquees as a from enseignants where id = $1", [l.compte.id]))[0].a).toContain("livre-chemins");
    await aide.getByRole("button", { name: "Commencer" }).click();
    await expect(fiche(page)).toBeVisible();
    await page.context().clearCookies({ name: "aide-livre" });
    await aller(page, `/projet/${l.projet}/livre`);
    await expect(fiche(page)).toBeVisible();
    await etapes(page).getByRole("button", { name: "Aide" }).click();
    await expect(page.getByRole("region", { name: "Vérifier les chemins" }).getByRole("button", { name: "Fermer l’aide" })).toBeVisible();
  });

  test("F11-AC73 — un choix à relier, une impasse, deux passages à confirmer : la destination désignée, la fin marquée, « C'est voulu », puis la déclaration ; l'étape reçoit sa coche", async ({ page }) => {
    const l = await phare(page);
    await aller(page, `/projet/${l.projet}/livre`);
    await expect(etapes(page).getByRole("link", { name: /Vérifier les chemins — il reste à faire/ })).toBeVisible();
    await expect(tache(page, "Départ et fins")).toContainText("1");
    await expect(tache(page, "Choix à relier")).toContainText("1");
    await expect(tache(page, "Passages à confirmer")).toContainText("2");

    // Départ et fins : l'impasse, marquée comme fin
    await expect(points(page)).toHaveCount(1);
    await expect(points(page)).toContainText("Cette scène est une impasse.");
    await points(page).getByRole("button", { name: "Marquer comme fin" }).click();
    await expect(points(page)).toHaveCount(0);
    await expect(fiche(page).locator(".tache-panneau")).toContainText("Le départ et les fins sont en place.");

    // Choix à relier : le choix est nommé ; la destination se désigne dans la scène
    await tache(page, "Choix à relier").click();
    await expect(points(page)).toContainText("« Suivre le goéland » ne mène nulle part.");
    await semerBlocs(l.base, l.s[0], [recit("Le phare clignote."), action("Ajoute la corde à ton inventaire."), choixAuto("Monter au phare", l.s[1]), choixAuto("Suivre le goéland", l.s[1])]);
    await page.reload();
    await expect(tache(page, "Choix à relier")).not.toContainText(/\d\s*$/);

    // Passages à confirmer : « C'est voulu » sur les deux ; ils se replient sous « 2 acceptés · Revoir »
    await tache(page, "Passages à confirmer").click();
    await expect(points(page)).toHaveText([/Aucun chemin n’y mène\./, /Sa seule suite est une énigme\./]);
    for (let n = 2; n > 0; n -= 1) {
      await points(page).first().getByRole("button", { name: "C’est voulu" }).click();
      await expect(points(page)).toHaveCount(n - 1);
    }
    await expect(fiche(page).getByText("2 acceptés · Revoir")).toBeVisible();
    await expect(etapes(page).getByRole("link", { name: /Vérifier les chemins/ })).not.toHaveAccessibleName(/il reste à faire/);

    // La déclaration, puis la coche
    await tache(page, "Tester la lecture").click();
    await fiche(page).getByRole("button", { name: "J’ai vérifié les chemins" }).click();
    await expect(fiche(page).getByText("Chemins vérifiés.")).toBeVisible();
    await expect(etapes(page).getByRole("link", { name: /Vérifier les chemins — terminée/ })).toBeVisible();

    // « Revoir » : le passage est de nouveau à confirmer, l'étape perd sa coche
    await tache(page, "Passages à confirmer").click();
    await fiche(page).getByText("2 acceptés · Revoir").click();
    await fiche(page).locator(".acceptes").getByRole("button", { name: "Revoir" }).first().click();
    await expect(points(page)).toHaveCount(1);
    await expect(etapes(page).getByRole("link", { name: /Vérifier les chemins — il reste à faire/ })).toBeVisible();
  });

  test("F11-AC89 — septembre : scènes à finir et un passage où rien ne mène ; sablier, aucun triangle, le passage listé, la déclaration attend", async ({ page }) => {
    const l = await phare(page);
    await sql("update scenes set etat = 'cours' where id = any($1::uuid[])", [[l.s[0], l.s[3]]]);
    await aller(page, `/projet/${l.projet}/livre`);
    await expect(etapes(page).getByRole("link", { name: /Relire — en attente de l’écriture/ })).toBeVisible();
    await expect(etapes(page).getByRole("link", { name: /Vérifier les chemins — en attente de l’écriture/ })).toBeVisible();
    await expect(etapes(page).getByText("il reste à faire")).toHaveCount(0);
    // Le choix sans destination et l'impasse sont ceux de scènes à finir : rien à corriger
    await expect(tache(page, "Choix à relier")).not.toContainText(/\d\s*$/);
    await tache(page, "Choix à relier").click();
    await expect(fiche(page).locator(".tache-panneau")).toContainText("Rien pour l’instant.");
    await expect(fiche(page)).toContainText("2 scènes à finir : leurs choix seront vérifiés ensuite.");
    await tache(page, "Passages à confirmer").click();
    await expect(points(page)).toHaveText([/Aucun chemin n’y mène\./, /Sa seule suite est une énigme\./]);
    await tache(page, "Tester la lecture").click();
    await expect(fiche(page).getByRole("button", { name: "J’ai vérifié les chemins" })).toBeDisabled();
    await expect(fiche(page)).toContainText("Possible quand toutes les scènes seront prêtes pour le livre.");
  });

  test("F09.2 — « Ouvrir la scène » d'un choix à relier : la scène s'ouvre sur ce choix, son panneau ouvert, et « Retour au Livre » y ramène", async ({ page }) => {
    const l = await phare(page);
    await aller(page, `/projet/${l.projet}/livre`);
    await tache(page, "Choix à relier").click();
    await points(page).getByRole("link", { name: "Ouvrir la scène" }).click();
    await expect(page).toHaveURL(/\/scene\/.*de=livre/);
    await expect(FICHE(page)).toBeVisible();
    await expect(FICHE(page).getByLabel("Ce que fait le lecteur")).toHaveValue("Suivre le goéland");
    await page.getByRole("link", { name: "Retour au Livre" }).click();
    await expect(fiche(page)).toBeVisible();
    // « Voir dans les chemins » ouvre la vue du chapitre, la scène désignée, et « Retour au Livre »
    await tache(page, "Passages à confirmer").click();
    await points(page).first().getByRole("link", { name: "Voir dans les chemins" }).click();
    await expect(page).toHaveURL(new RegExp(`vue=chemins&scene=${l.s[2]}`));
    await expect(page.getByRole("link", { name: "Retour au Livre" })).toBeVisible();
  });

  test("F04-AC33 — actions de jeu sans feuille : le rappel « à savoir » est replié au pied de la fiche, et nulle part dans la page de scène", async ({ page }) => {
    const l = await phare(page);
    await aller(page, `/projet/${l.projet}/livre`);
    const savoir = fiche(page).locator(".asavoir");
    await expect(savoir).not.toHaveAttribute("open");
    await savoir.locator("summary").click();
    await expect(savoir).toContainText("1 passage demande d’agir sur une feuille d’aventure, et le livre n’en a pas.");
    await expect(savoir.getByRole("link", { name: "Composer la feuille d’aventure" })).toBeVisible();
    await aller(page, `/projet/${l.projet}/scene/${l.s[0]}`);
    await expect(page.getByText("feuille d’aventure, et le livre n’en a pas")).toHaveCount(0);
  });
});
