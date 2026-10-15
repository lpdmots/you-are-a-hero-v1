import { readFile } from "node:fs/promises";
import { expect, test } from "@playwright/test";
import { adultePret, aller, choixAuto, recit, semerBlocs, semerPartie, semerProjet, sql, supprimerComptes } from "./outils";

/**
 * Étape 6 du plan, lot 1 : le PDF de travail demandé depuis « Relire » (F11.2, F11.6) — composé
 * sur le serveur, téléchargé, puis retrouvé à la visite suivante.
 */

test.afterEach(async () => {
  await supprimerComptes();
});

test("F11-AC03 — à « Relire », un livre dont des scènes restent à finir donne son PDF de travail, puis le propose de nouveau", async ({ page }) => {
  const { compte, base } = await adultePret(page);
  const projet = await semerProjet(base, compte, "personnel", "choix", "Le phare");
  const { chapitres } = await semerPartie(base, projet, "La côte", [{ titre: "La plage", scenes: ["La plage au matin", "La lanterne"] }]);
  const s = chapitres[0].scenes;
  await base.from("projets").update({ depart_scene_id: s[0] }).eq("id", projet);
  await semerBlocs(base, s[0], [recit("Le phare clignote dans la brume."), choixAuto("Monter au phare", s[1])]);
  await semerBlocs(base, s[1], [recit("La lanterne s’allume.")]);
  await base.from("scenes").update({ fin: true }).eq("id", s[1]);
  await sql("update scenes set etat = 'prete' where id = $1", [s[1]]);

  await aller(page, `/projet/${projet}/livre?etape=relire`);
  // Le PDF de travail est à la dernière tâche, « Lire et corriger » (F11.6)
  await page.locator(".controles").getByRole("button", { name: /Lire et corriger/ }).click();
  const bouton = page.getByRole("button", { name: "Créer le PDF de travail" });
  const telechargement = page.waitForEvent("download");
  await bouton.click();
  const fichier = await telechargement;
  expect(fichier.suggestedFilename()).toBe("Le phare - version de travail.pdf");
  const octets = await readFile((await fichier.path())!);
  expect(octets.subarray(0, 5).toString()).toBe("%PDF-");

  await aller(page, `/projet/${projet}/livre?etape=relire`);
  await page.locator(".controles").getByRole("button", { name: /Lire et corriger/ }).click();
  await expect(page.getByRole("link", { name: /^Télécharger celui du \d+ \S+, \d+ h \d\d$/ })).toBeVisible();
});
