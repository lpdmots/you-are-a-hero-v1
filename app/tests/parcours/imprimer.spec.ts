import { expect, test, type Page } from "@playwright/test";
import type { SupabaseClient } from "@supabase/supabase-js";
import { adultePret, aller, choixAuto, recit, semerBlocs, semerImage, semerPartie, semerProjet, sql, supprimerComptes, type Compte } from "./outils";

/**
 * Étape 6 du plan, lot 5 : « Imprimer et partager », volet « Imprimer » — le PDF définitif et sa
 * règle unique (F11.2), les avertissements rappelés, les PDF conservés, le livre qui change.
 */

test.afterEach(async () => {
  await supprimerComptes();
});

type Livre = { compte: Compte; base: SupabaseClient; projet: string; s: string[] };

/** « Le phare » : deux passages, tout prêt, les deux premières étapes déclarées. */
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
  await sql("update projets set mise_en_page_ouverte_le = now(), livre_relu_le = now(), chemins_verifies_le = now() where id = $1", [projet]);
  return { compte, base, projet, s };
}
const etape = (page: Page, nom: string) => page.getByRole("navigation", { name: "Étapes du livre" }).getByRole("link", { name: new RegExp(nom) });

test("F11-AC72, F11-AC77, F11-AC101, F11-AC26 — fermée tant que la mise en page n'est pas déclarée ; puis le PDF définitif se crée et se télécharge ; le livre change, l'écran le dit ; un PDF se supprime après confirmation", async ({ page }) => {
  const l = await phare(page);
  await aller(page, `/projet/${l.projet}/livre?etape=sortie`);
  await expect(page.getByRole("heading", { name: "« Imprimer et partager » n’est pas encore ouverte" })).toBeVisible();

  await aller(page, `/projet/${l.projet}/livre?etape=page`);
  await page.getByRole("button", { name: "La mise en page me convient" }).click();
  await page.getByRole("link", { name: "Imprimer et partager" }).last().click();
  await expect(page.getByText("Le livre est prêt.")).toBeVisible();
  const telechargement = page.waitForEvent("download", { timeout: 60_000 });
  await page.getByRole("button", { name: "Créer le PDF définitif…" }).click();
  expect((await telechargement).suggestedFilename()).toBe("Le phare - livre.pdf");

  await aller(page, `/projet/${l.projet}/livre?etape=sortie`);
  await expect(page.getByText("Le livre est fait.")).toBeVisible();
  await expect(etape(page, "Imprimer et partager")).toContainText("terminée");
  const conserves = page.getByRole("region", { name: "PDF définitifs conservés" });
  await expect(conserves.locator(".conserve")).toHaveCount(1);
  await expect(conserves).toContainText("Correspond au livre actuel.");
  await expect(page.getByRole("button", { name: /PDF définitif…/ })).toHaveCount(0);

  // Le livre change : l'écran le dit, et propose un nouveau PDF
  await semerBlocs(l.base, l.s[1], [recit("La lanterne s’allume enfin.")]);
  await aller(page, `/projet/${l.projet}/livre?etape=sortie`);
  await expect(page.getByText(/Le livre a changé depuis le PDF définitif du/)).toBeVisible();
  await expect(conserves).not.toContainText("Correspond au livre actuel.");
  const second = page.waitForEvent("download", { timeout: 60_000 });
  await page.getByRole("button", { name: "Nouveau PDF définitif…" }).click();
  await second;
  await aller(page, `/projet/${l.projet}/livre?etape=sortie`);
  await expect(conserves.locator(".conserve")).toHaveCount(2);
  await expect(conserves.locator(".conserve").first()).toContainText("Correspond au livre actuel.");

  // Le plus ancien supprimé, après confirmation sur place
  await conserves.locator(".conserve").last().getByRole("button", { name: /^Supprimer le PDF définitif/ }).click();
  await conserves.getByRole("group", { name: "Confirmer la suppression" }).getByRole("button", { name: "Supprimer" }).click();
  await expect(conserves.locator(".conserve")).toHaveCount(1);
  expect((await sql<{ n: number }>("select count(*)::int as n from pdf_du_livre where projet_id = $1 and sorte = 'definitif'", [l.projet]))[0].n).toBe(1);
});

test("F11-AC76, F09-AC10 — une scène rouverte après la mise en page : « Relire » perd sa coche, « Mettre en page » reste ouverte, le PDF définitif est refusé sans contournement, avec son motif", async ({ page }) => {
  const l = await phare(page);
  await sql("update projets set mise_en_page_convient_le = now(), imprimer_ouvert_le = now() where id = $1", [l.projet]);
  await sql("update scenes set etat = 'cours' where id = $1", [l.s[1]]);
  await aller(page, `/projet/${l.projet}/livre?etape=sortie`);
  await expect(etape(page, "Relire")).not.toContainText("terminée");
  await expect(etape(page, "Mettre en page")).not.toContainText("pas encore ouverte");
  await expect(page.getByText("PDF définitif pas encore possible.")).toBeVisible();
  await expect(page.locator(".imprimer__raisons")).toContainText("Relire · 1 scène à finir");
  await expect(page.getByRole("button", { name: /Créer le PDF définitif|Nouveau PDF définitif/ })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Créer un PDF de travail à la place" })).toBeVisible();
  await page.locator(".imprimer__raisons").getByRole("link", { name: "Relire" }).click();
  await expect(page.locator(".controles")).toBeVisible();
});

test("F11-AC100 — une image peu définie ne bloque pas : elle est rappelée à la demande, et « Annuler » revient sans rien créer", async ({ page }) => {
  const l = await phare(page);
  const image = await semerImage(l.base, l.compte, l.projet);
  await sql("update images set largeur = 500, hauteur = 400 where id = $1", [image]);
  await semerBlocs(l.base, l.s[0], [recit("Le phare clignote dans la brume."), { type: "image", id: crypto.randomUUID(), image, largeur: 100, children: [{ text: "" }] }, choixAuto("Monter au phare", l.s[1])]);
  await sql("update projets set mise_en_page_convient_le = now(), imprimer_ouvert_le = now() where id = $1", [l.projet]);
  await aller(page, `/projet/${l.projet}/livre?etape=sortie`);
  await page.getByRole("button", { name: "Créer le PDF définitif…" }).click();
  const rappel = page.getByRole("group", { name: "À savoir avant de créer le PDF" });
  await expect(rappel).toContainText("Image peu définie.");
  await rappel.getByRole("button", { name: "Annuler" }).click();
  await expect(rappel).toHaveCount(0);
  expect((await sql<{ n: number }>("select count(*)::int as n from pdf_du_livre where projet_id = $1", [l.projet]))[0].n).toBe(0);
});
