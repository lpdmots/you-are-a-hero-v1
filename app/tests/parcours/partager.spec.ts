import { expect, test, type Page } from "@playwright/test";
import type { SupabaseClient } from "@supabase/supabase-js";
import { adultePret, aller, choixAuto, MESSAGE, recit, semerBlocs, semerClasse, semerPartie, semerProjet, sql, supprimerComptes, type Compte } from "./outils";

/**
 * Étape 7 du plan, lot 1, revu par F15 (lot 1, 25 octobre 2026) : « Imprimer et partager », volet
 * « Partager » — deux façons, privée et publique, sans lien seul ; le rappel sur place, la mise à
 * jour, les noms, le retrait par l'interrupteur, et la coche de l'étape d'arrivée (F11.6) ; la
 * proposition à la bibliothèque.
 */

test.afterEach(async () => {
  await supprimerComptes();
});

type Livre = { compte: Compte; base: SupabaseClient; projet: string; s: string[] };

/** « Le phare » : deux passages, tout prêt, « Imprimer et partager » ouverte, sans PDF définitif ; l'adulte a une classe en cours, sauf `seul`. */
async function phare(page: Page, seul = false): Promise<Livre> {
  const { compte, base } = await adultePret(page);
  if (!seul) await semerClasse(base, "CM1", ["Alice"]);
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
const classes = (page: Page) => ({ click: () => basculer(page, "À mes classes") });

test("F12-AC17, F11-AC108, F12-AC08, F12-AC10 — le rappel avant le partage privé ; partagé sans PDF, l'étape est cochée ; le livre change, la mise à jour le rattrape ; couper le dernier canal retire le partage", async ({ page }) => {
  const l = await phare(page);
  await aller(page, `/projet/${l.projet}/livre?etape=sortie&volet=partager`);

  // Le rappel s'ouvre sur place ; rien ne s'ouvre avant qu'il soit coché
  await classes(page).click();
  const rappel = page.getByRole("group", { name: "À relire avant de partager" });
  await expect(rappel).toBeVisible();
  await expect(rappel.getByRole("button", { name: "Partager à mes classes" })).toBeDisabled();
  await rappel.getByText("J’ai relu le livre sur ces points.").click();
  await rappel.getByRole("button", { name: "Partager à mes classes" }).click();
  await expect(page.getByText(/À jour depuis le/)).toBeVisible();
  await expect(etape(page, "Imprimer et partager")).toContainText("terminée");

  // Le livre change : l'état le dit, l'étape n'est plus cochée, la mise à jour passe par le rappel
  await semerBlocs(l.base, l.s[1], [recit("La lanterne s’allume enfin.")]);
  await aller(page, `/projet/${l.projet}/livre?etape=sortie&volet=partager`);
  await expect(page.getByText(/Le livre a changé depuis la version du/)).toBeVisible();
  await expect(etape(page, "Imprimer et partager")).toContainText("il reste à faire");
  await page.getByRole("button", { name: "Mettre à jour…" }).click();
  const maj = page.getByRole("group", { name: "À relire avant de partager" });
  await maj.getByText("J’ai relu le livre sur ces points.").click();
  await maj.getByRole("button", { name: "Mettre à jour" }).click();
  await expect(page.getByText(/À jour depuis le/)).toBeVisible();
  const [{ version }] = await sql<{ version: string }>("select version::text from partages where projet_id = $1", [l.projet]);
  expect(version).toContain("La lanterne s’allume enfin.");

  // Couper : la confirmation dit ce qui change
  await classes(page).click();
  const couper = page.getByRole("group", { name: "Ne plus proposer le livre à vos classes ?" });
  await expect(couper).toContainText("La bibliothèque ne change pas.");
  await couper.getByRole("button", { name: "Ne plus le proposer" }).click();
  await expect(MESSAGE(page)).toContainText("Vos classes ne voient plus le livre.");
  expect((await sql<{ version: unknown }>("select version from partages where projet_id = $1", [l.projet]))[0].version).toBeNull();
});

test("F15-AC15 — deux façons, privée et publique, sans lien seul", async ({ page }) => {
  const l = await phare(page);
  await aller(page, `/projet/${l.projet}/livre?etape=sortie&volet=partager`);
  await expect(page.getByRole("heading", { name: /^Privé/ })).toBeVisible();
  await expect(page.getByRole("heading", { name: /^Public/ })).toBeVisible();
  await expect(page.getByRole("switch", { name: "Par un lien" })).toHaveCount(0);
  await expect(page.getByText(/lien de lecture/i)).toHaveCount(0);
});

test("F12-AC24 — sans classe en cours, seule la bibliothèque", async ({ page }) => {
  const seul = await phare(page, true);
  await aller(page, `/projet/${seul.projet}/livre?etape=sortie&volet=partager`);
  await expect(page.getByRole("switch", { name: "À mes classes" })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: /^Public/ })).toBeVisible();
});

test("F15-AC01, F15-AC17 — proposer à la bibliothèque : la présentation, l'attestation de l'auteur, puis « En attente de relecture »", async ({ page }) => {
  const l = await phare(page);
  await aller(page, `/projet/${l.projet}/livre?etape=sortie&volet=partager`);
  await page.getByRole("button", { name: "Proposer à la bibliothèque…" }).click();
  const panneau = page.getByRole("group", { name: "Proposer à la bibliothèque" });
  await panneau.getByLabel("Présentation").fill("Au bord de la côte, le phare clignote dans la brume. Qui l’allume chaque nuit ?");
  // Mode personnel : l'attestation est celle de l'auteur, et rien ne part sans elle
  await expect(panneau).toContainText("Je suis l’auteur de ce livre et j’ai les droits de ses images.");
  await expect(panneau.getByRole("button", { name: "Proposer le livre" })).toBeDisabled();
  await panneau.getByText("Je suis l’auteur de ce livre").click();
  await panneau.getByRole("button", { name: "Proposer le livre" }).click();
  await expect(page.getByText(/En attente de relecture depuis le/)).toBeVisible();
  await expect(page.getByRole("button", { name: "Proposer à la bibliothèque…" })).toHaveCount(0);
  const [ligne] = await sql<{ attestation: string; version: unknown; adresse: string | null }>("select attestation, version, adresse from publications where projet_id = $1", [l.projet]);
  expect(ligne).toEqual({ attestation: "auteur", version: null, adresse: null });
});

test("F12-AC16, F12-AC15 — les noms du partage : la ligne remplacée, la page des auteurs retirée ; le réglage vaut pour la prochaine mise à jour", async ({ page }) => {
  const l = await phare(page);
  await sql(`update projets set pages_du_livre = '{"auteurs":{"presente":true,"noms":["Alice","Bilal"]}}' where id = $1`, [l.projet]);
  await aller(page, `/projet/${l.projet}/livre?etape=sortie&volet=partager`);
  await expect(page.getByText("Comme dans le livre, en privé et en public.")).toBeVisible();
  await page.getByRole("button", { name: "Modifier" }).click();
  const texte = page.getByRole("textbox", { name: "Texte affiché" });
  await texte.fill("Un auteur de Bretagne");
  await texte.blur();
  await basculer(page, "Page des auteurs");
  await expect.poll(async () => (await sql<{ noms: unknown }>("select noms from partages where projet_id = $1", [l.projet]))[0]?.noms).toEqual({
    ligne: true, texte: "Un auteur de Bretagne", auteurs: false,
  });
  await page.getByRole("button", { name: "Replier" }).click();
  await expect(page.getByText("Modifiés pour le partage, privé et public ; le livre imprimé ne change pas.")).toBeVisible();

  await classes(page).click();
  const rappel = page.getByRole("group", { name: "À relire avant de partager" });
  await rappel.getByText("J’ai relu le livre sur ces points.").click();
  await rappel.getByRole("button", { name: "Partager à mes classes" }).click();
  await expect(page.getByText(/À jour depuis le/)).toBeVisible();
  const [{ version }] = await sql<{ version: { presentation: { titre: { ligne: string }; auteurs: unknown } } }>("select version from partages where projet_id = $1", [l.projet]);
  expect(version.presentation.titre.ligne).toBe("Un auteur de Bretagne");
  expect(version.presentation.auteurs).toBeNull();

  // Remettre la page des auteurs après le partage : la version attend la prochaine mise à jour
  await page.getByRole("button", { name: "Modifier" }).click();
  await basculer(page, "Page des auteurs");
  await expect(page.getByText("Un changement vaut pour la prochaine mise à jour, privée ou publique.")).toBeVisible();
  await aller(page, `/projet/${l.projet}/livre?etape=sortie&volet=partager`);
  await expect(page.getByText(/Le livre a changé depuis la version du/)).toBeVisible();
});

test("F12-AC09 — une scène rouverte : « Mise à jour impossible pour l’instant », la version précédente reste ; le refus mène à l'étape qui le traite", async ({ page }) => {
  const l = await phare(page);
  await aller(page, `/projet/${l.projet}/livre?etape=sortie&volet=partager`);
  await classes(page).click();
  const rappel = page.getByRole("group", { name: "À relire avant de partager" });
  await rappel.getByText("J’ai relu le livre sur ces points.").click();
  await rappel.getByRole("button", { name: "Partager à mes classes" }).click();
  await expect(page.getByText(/À jour depuis le/)).toBeVisible();

  await semerBlocs(l.base, l.s[1], [recit("La lanterne s’allume enfin.")]);
  await sql("update scenes set etat = 'cours' where id = $1", [l.s[1]]);
  await aller(page, `/projet/${l.projet}/livre?etape=sortie&volet=partager`);
  await expect(page.getByText(/Mise à jour impossible pour l’instant : vos élèves gardent la version du/)).toBeVisible();
  await expect(page.getByRole("button", { name: "Mettre à jour…" })).toHaveCount(0);
  await expect(page.locator(".imprimer__raisons")).toContainText("Relire · 1 scène à finir");
  // L'onglet du volet porte la marque du livre changé
  await expect(page.getByRole("tab", { name: /Partager — le livre a changé/ })).toBeVisible();
});
