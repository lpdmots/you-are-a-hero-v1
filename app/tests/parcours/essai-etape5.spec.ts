import { expect, test } from "@playwright/test";
import { aller, choixAuto, classeQuiEcrit, posteDe, recit, semerBlocs, sql, supprimerComptes } from "./outils";

/**
 * Étape 5 du plan, lot 5 : l'essai du porteur, joué de bout en bout. L'enseignante vérifie les
 * chemins de son livre et corrige ce qu'ils signalent, le lit à l'essai jusqu'à une fin, déclare
 * l'étape ; puis une élève lit ses chapitres et bute, sans rien en apprendre, sur un chapitre fermé.
 * Le mode d'emploi de cet essai est dans app/README.md, « Essayer l'étape 5 ».
 */

test.afterEach(async () => {
  await supprimerComptes();
});

test("Étape 5 — vérifier les chemins, les corriger, lire le livre à l'essai, le déclarer ; une élève lit ses chapitres", async ({ page, browser }) => {
  test.setTimeout(180_000);
  const s = await classeQuiEcrit(page);
  const [sentier, pont] = s.lisiere.scenes;
  const [autel] = s.sanctuaire.scenes;
  await s.base.from("projets").update({ depart_scene_id: sentier }).eq("id", s.projet);
  await semerBlocs(s.base, sentier, [recit("Un chant montait des fougères."), choixAuto("Traverser le pont", pont), choixAuto("Suivre le héron", null)]);
  await semerBlocs(s.base, pont, [recit("Le pont craquait sous les pas de Lou."), choixAuto("Entrer au sanctuaire", autel)]);
  await semerBlocs(s.base, autel, [recit("L’autel brillait dans la brume.")]);
  await sql("update scenes set etat = 'prete' where projet_id = $1", [s.projet]);

  // 1. « Vérifier les chemins » : un choix à relier et une impasse
  await aller(page, `/projet/${s.projet}/livre?etape=chemins`);
  const fiche = page.locator(".controles");
  const tache = (nom: string) => fiche.getByRole("list", { name: "Tâches de l’étape" }).getByRole("button", { name: new RegExp(nom) });
  await expect(fiche.locator(".tache-panneau .point")).toContainText("Cette scène est une impasse.");
  await fiche.getByRole("button", { name: "Marquer comme fin" }).click();
  await expect(fiche.locator(".tache-panneau")).toContainText("Le départ et les fins sont en place.");
  await tache("Choix à relier").click();
  await expect(fiche.locator(".tache-panneau .point")).toContainText("« Suivre le héron » ne mène nulle part.");
  // La scène s'ouvre sur ce choix ; la destination y est désignée, puis « Retour au Livre »
  await fiche.getByRole("button", { name: "Ouvrir la scène" }).click();
  await expect(page.locator(".cx").first().getByLabel("Ce que fait le lecteur")).toHaveValue("Suivre le héron");
  await semerBlocs(s.base, sentier, [recit("Un chant montait des fougères."), choixAuto("Traverser le pont", pont), choixAuto("Suivre le héron", autel)]);
  await page.locator(".a-cote").getByRole("button", { name: "Fermer" }).click();
  await expect(tache("Choix à relier")).not.toContainText(/\d\s*$/);

  // 2. La lecture d'essai, du départ à la fin
  await tache("Tester la lecture").click();
  await fiche.getByRole("link", { name: "Tester la lecture" }).click();
  await page.getByRole("link", { name: "Commencer au départ" }).click();
  await page.locator(".lu-page").getByRole("button", { name: /Traverser le pont/ }).click();
  await page.locator(".lu-page").getByRole("button", { name: /Entrer au sanctuaire/ }).click();
  await expect(page.locator(".lu-fin__marque")).toHaveText("Fin");
  await page.getByRole("link", { name: "Quitter" }).click();

  // 3. La déclaration : l'étape porte sa coche
  await tache("Tester la lecture").click();
  await fiche.getByRole("button", { name: "J’ai vérifié les chemins" }).click();
  await expect(page.getByRole("navigation", { name: "Étapes du livre" }).getByRole("link", { name: /Vérifier les chemins — terminée/ })).toBeVisible();

  // 4. Alice lit ses chapitres : la lisière, et une suite à découvrir au sanctuaire
  const alice = await posteDe(browser, s, "Alice");
  await alice.page.getByRole("link", { name: "Lire à l’essai" }).click();
  await alice.page.getByRole("link", { name: "Commencer au début de La lisière" }).click();
  await alice.page.locator(".lu-page").getByRole("button", { name: /Traverser le pont/ }).click();
  await alice.page.locator(".lu-page").getByRole("button", { name: /Entrer au sanctuaire/ }).click();
  await expect(alice.page.locator(".lu-page")).toContainText("La suite se trouve dans un chapitre que tu découvriras plus tard.");
  await expect(alice.page.locator("body")).not.toContainText("L’autel brillait");
  await alice.contexte.close();
});
