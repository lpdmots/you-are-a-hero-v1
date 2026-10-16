import { expect, test, type Page } from "@playwright/test";
import type { SupabaseClient } from "@supabase/supabase-js";
import { adultePret, aller, choixAuto, MESSAGE, recit, semerBlocs, semerPartie, semerProjet, sql, supprimerComptes, type Compte } from "./outils";

/**
 * Étape 7 du plan, lot 1 : « Imprimer et partager », volet « Partager » (F12.1, F12.3) — le
 * rappel sur place, le lien, la mise à jour, les noms, le changement de lien, le retrait par le
 * dernier interrupteur, et la coche de l'étape d'arrivée (F11.6).
 */

test.afterEach(async () => {
  await supprimerComptes();
});

type Livre = { compte: Compte; base: SupabaseClient; projet: string; s: string[] };

/** « Le phare » : deux passages, tout prêt, « Imprimer et partager » ouverte, sans PDF définitif. */
async function phare(page: Page): Promise<Livre> {
  const { compte, base } = await adultePret(page);
  const projet = await semerProjet(base, compte, "personnel", "choix", "Le phare");
  const { chapitres } = await semerPartie(base, projet, "La côte", [{ titre: "La plage", scenes: ["La plage au matin", "La lanterne"] }]);
  const s = chapitres[0].scenes;
  await base.from("projets").update({ depart_scene_id: s[0] }).eq("id", projet);
  await semerBlocs(base, s[0], [recit("Le phare clignote dans la brume."), choixAuto("Monter au phare", s[1])]);
  await semerBlocs(base, s[1], [recit("La lanterne s’allume.")]);
  await base.from("scenes").update({ fin: true }).eq("id", s[1]);
  await sql("update scenes set etat = 'prete' where projet_id = $1", [projet]);
  await sql(
    "update projets set mise_en_page_ouverte_le = now(), livre_relu_le = now(), chemins_verifies_le = now(), mise_en_page_convient_le = now(), imprimer_ouvert_le = now() where id = $1",
    [projet],
  );
  return { compte, base, projet, s };
}
const etape = (page: Page, nom: string) => page.getByRole("navigation", { name: "Étapes du livre" }).getByRole("link", { name: new RegExp(nom) });
/** Un interrupteur se bascule par son étiquette : la case elle-même est cachée sous la piste. */
const basculer = (page: Page, nom: string) => page.locator("label.inter", { has: page.getByRole("switch", { name: nom }) }).click();
const lien = (page: Page) => ({ click: () => basculer(page, "Par un lien") });

test("F12-AC17, F11-AC108, F12-AC08, F12-AC11, F12-AC10 — le rappel avant le lien ; partagé sans PDF, l'étape est cochée ; le livre change, la mise à jour le rattrape ; changer de lien ; couper le dernier canal retire le partage", async ({ page }) => {
  const l = await phare(page);
  await aller(page, `/projet/${l.projet}/livre?etape=sortie&volet=partager`);
  await expect(page.getByText("Ce livre n’est pas partagé.")).toBeVisible();
  // Récit personnel sans classe en cours : seul le lien est proposé (F12-AC24)
  await expect(page.getByRole("switch", { name: "À mes classes" })).toHaveCount(0);

  // Le rappel s'ouvre sur place ; rien ne s'ouvre avant qu'il soit coché
  await lien(page).click();
  const rappel = page.getByRole("group", { name: "À relire avant de partager" });
  await expect(rappel).toBeVisible();
  await expect(rappel).not.toContainText("autorisations des familles");
  await expect(rappel.getByRole("button", { name: "Partager" })).toBeDisabled();
  await rappel.getByText("J’ai relu le livre sur ces points.").click();
  await rappel.getByRole("button", { name: "Partager" }).click();
  await expect(page.getByText(/Livre partagé, à jour depuis le/)).toBeVisible();
  const adresse = page.getByRole("textbox", { name: "Lien de lecture" });
  await expect(adresse).toHaveValue(/\/lire\/[a-z2-9]{4}-[a-z2-9]{3}-[a-z2-9]{3}$/);
  const premiere = await adresse.inputValue();
  await expect(etape(page, "Imprimer et partager")).toContainText("terminée");

  // Le livre change : l'état le dit, l'étape n'est plus cochée, la mise à jour passe par le rappel
  await semerBlocs(l.base, l.s[1], [recit("La lanterne s’allume enfin.")]);
  await aller(page, `/projet/${l.projet}/livre?etape=sortie&volet=partager`);
  await expect(page.getByText(/Le livre a changé depuis la version partagée du/)).toBeVisible();
  await expect(etape(page, "Imprimer et partager")).toContainText("il reste à faire");
  await page.getByRole("button", { name: "Mettre à jour le partage…" }).click();
  const maj = page.getByRole("group", { name: "À relire avant de partager" });
  await maj.getByText("J’ai relu le livre sur ces points.").click();
  await maj.getByRole("button", { name: "Mettre à jour" }).click();
  await expect(page.getByText(/Livre partagé, à jour depuis le/)).toBeVisible();
  await expect(adresse).toHaveValue(premiere);
  const [{ version }] = await sql<{ version: string }>("select version::text from partages where projet_id = $1", [l.projet]);
  expect(version).toContain("La lanterne s’allume enfin.");

  // Changer de lien : confirmé sur place, l'adresse change
  await page.getByRole("button", { name: "Changer de lien…" }).click();
  await page.getByRole("group", { name: "Changer de lien ?" }).getByRole("button", { name: "Changer de lien" }).click();
  await expect(MESSAGE(page)).toContainText("Nouveau lien");
  await expect(adresse).not.toHaveValue(premiere);

  // Couper le dernier canal : la confirmation dit ce que le lien affichera
  await lien(page).click();
  const retirer = page.getByRole("group", { name: "Retirer le partage ?" });
  await expect(retirer).toContainText("« Ce livre n’est plus partagé »");
  await retirer.getByRole("button", { name: "Retirer le partage" }).click();
  await expect(page.getByText("Ce livre n’est pas partagé.")).toBeVisible();
  expect((await sql<{ version: unknown }>("select version from partages where projet_id = $1", [l.projet]))[0].version).toBeNull();
});

test("F12-AC16, F12-AC15 — les noms du partage : la ligne remplacée, la page des auteurs retirée ; le réglage vaut pour la prochaine mise à jour", async ({ page }) => {
  const l = await phare(page);
  await sql(`update projets set pages_du_livre = '{"auteurs":{"presente":true,"noms":["Alice","Bilal"]}}' where id = $1`, [l.projet]);
  await aller(page, `/projet/${l.projet}/livre?etape=sortie&volet=partager`);
  await expect(page.getByText("Comme dans le livre.")).toBeVisible();
  await page.getByRole("button", { name: "Modifier" }).click();
  const texte = page.getByRole("textbox", { name: "Texte affiché" });
  await texte.fill("Un auteur de Bretagne");
  await texte.blur();
  await basculer(page, "Page des auteurs");
  await expect.poll(async () => (await sql<{ noms: unknown }>("select noms from partages where projet_id = $1", [l.projet]))[0]?.noms).toEqual({
    ligne: true, texte: "Un auteur de Bretagne", auteurs: false,
  });
  await page.getByRole("button", { name: "Replier" }).click();
  await expect(page.getByText("Modifiés pour le partage ; le livre imprimé ne change pas.")).toBeVisible();

  await lien(page).click();
  const rappel = page.getByRole("group", { name: "À relire avant de partager" });
  await rappel.getByText("J’ai relu le livre sur ces points.").click();
  await rappel.getByRole("button", { name: "Partager" }).click();
  await expect(page.getByText(/Livre partagé, à jour depuis le/)).toBeVisible();
  const [{ version }] = await sql<{ version: { presentation: { titre: { ligne: string }; auteurs: unknown } } }>("select version from partages where projet_id = $1", [l.projet]);
  expect(version.presentation.titre.ligne).toBe("Un auteur de Bretagne");
  expect(version.presentation.auteurs).toBeNull();

  // Remettre la page des auteurs après le partage : la version attend la prochaine mise à jour
  await page.getByRole("button", { name: "Modifier" }).click();
  await basculer(page, "Page des auteurs");
  await expect(page.getByText("Un changement vaut pour la prochaine mise à jour du partage.")).toBeVisible();
  await aller(page, `/projet/${l.projet}/livre?etape=sortie&volet=partager`);
  await expect(page.getByText(/Le livre a changé depuis la version partagée du/)).toBeVisible();
});

test("F12-AC09 — une scène rouverte : « Mise à jour impossible pour l’instant », la version précédente reste ; le refus mène à l'étape qui le traite", async ({ page }) => {
  const l = await phare(page);
  await aller(page, `/projet/${l.projet}/livre?etape=sortie&volet=partager`);
  await lien(page).click();
  const rappel = page.getByRole("group", { name: "À relire avant de partager" });
  await rappel.getByText("J’ai relu le livre sur ces points.").click();
  await rappel.getByRole("button", { name: "Partager" }).click();
  await expect(page.getByText(/Livre partagé, à jour depuis le/)).toBeVisible();

  await semerBlocs(l.base, l.s[1], [recit("La lanterne s’allume enfin.")]);
  await sql("update scenes set etat = 'cours' where id = $1", [l.s[1]]);
  await aller(page, `/projet/${l.projet}/livre?etape=sortie&volet=partager`);
  await expect(page.getByText(/Mise à jour impossible pour l’instant : les lecteurs gardent la version du/)).toBeVisible();
  await expect(page.getByRole("button", { name: "Mettre à jour le partage…" })).toHaveCount(0);
  await expect(page.locator(".imprimer__raisons")).toContainText("Relire · 1 scène à finir");
  // L'onglet du volet porte la marque du livre changé
  await expect(page.getByRole("tab", { name: /Partager — le livre a changé/ })).toBeVisible();
});
