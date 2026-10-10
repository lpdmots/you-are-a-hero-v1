import { expect, test, type Page } from "@playwright/test";
import {
  adultePret, aller, chapitresDeLaPartie, MESSAGE, scenesDuChapitre, semerAttribution, semerClasse, semerPartie, semerProjet, supprimerComptes, tirer,
} from "./outils";

test.afterEach(async () => {
  await supprimerComptes();
});

const carte = (page: Page, titre: string) => page.locator("li", { has: page.getByRole("link", { name: `Ouvrir ${titre}`, exact: true }) });
const menuChapitre = (page: Page, titre: string) => page.getByLabel(`Autres commandes du chapitre ${titre}`);

/** Un projet de classe à choix : « La forêt » (La lisière, Le sanctuaire, Les racines) et « La montagne » (Le col). */
async function passeursDeBrume(page: Page) {
  const { compte, base } = await adultePret(page);
  const classe = await semerClasse(base, "CM1-CM2", ["Alice", "Bilal", "Chloé", "Dylan", "Emma"]);
  const projet = await semerProjet(base, compte, "classe", "choix", "Les passeurs de brume", classe.id);
  const foret = await semerPartie(base, projet, "La forêt", [
    { titre: "La lisière", scenes: ["L’entrée du bois", "Souche creuse — la lanterne de secours", "Souche — la chouette messagère"] },
    { titre: "Le sanctuaire", scenes: ["L’autel de pierre", "Le gardien"] },
    { titre: "Les racines" },
  ]);
  const montagne = await semerPartie(base, projet, "La montagne", [{ titre: "Le col", scenes: ["La dernière lanterne"] }], "montagne");
  return { compte, base, classe, projet, foret, montagne };
}

test("F03-AC10, F02-AC08, F10-AC22 — une partie ajoutée s'ouvre sur ses réglages, titre sélectionné, avec son image et son premier chapitre vide", async ({ page }) => {
  const { compte, base } = await adultePret(page);
  const projet = await semerProjet(base, compte, "classe", "choix", "Les passeurs de brume");
  await aller(page, `/projet/${projet}/plan`);
  await expect(page.getByText(/Le plan est encore vide/)).toBeVisible();

  await page.getByRole("button", { name: "Ajouter une partie" }).first().click();
  await expect(page.getByRole("heading", { name: "Réglages de la partie" })).toBeVisible();
  // Le titre est sélectionné : on écrit le sien par-dessus
  await expect(page.getByLabel("Titre")).toBeFocused();
  await page.keyboard.type("La forêt");
  await expect(page.getByRole("complementary").getByRole("button", { name: "Choisir une image" })).toBeVisible();
  await page.getByLabel("Titre").blur();
  await expect(page.getByText("Enregistré")).toBeVisible();
  await page.getByRole("button", { name: "Fermer", exact: true }).last().click();

  await expect(page.getByRole("heading", { level: 2, name: "La forêt" })).toBeVisible();
  expect(await chapitresDeLaPartie(page, "La forêt")).toEqual(["Nouveau chapitre"]);
  await expect(carte(page, "Nouveau chapitre")).toContainText("Aucune scène · aucun élève");

  // Un chapitre ajouté s'ouvre lui aussi sur ses réglages, avec le choix de l'image sous le titre
  await page.getByRole("button", { name: "Ajouter un chapitre" }).click();
  await expect(page.getByRole("heading", { name: "Réglages du chapitre" })).toBeVisible();
  await page.keyboard.type("La lisière");
  await expect(page.getByRole("complementary").getByRole("button", { name: "Choisir une image" })).toBeVisible();
  await page.getByLabel("Titre").blur();
  await expect(page.getByText("Enregistré")).toBeVisible();
  await page.getByRole("button", { name: "Fermer", exact: true }).last().click();
  expect(await chapitresDeLaPartie(page, "La forêt")).toEqual(["Nouveau chapitre", "La lisière"]);
});

test("F03-AC21 — la carte ouvre le chapitre ; son menu et celui du bandeau portent les mêmes commandes", async ({ page }) => {
  const { projet } = await passeursDeBrume(page);
  await aller(page, `/projet/${projet}/plan`);
  await menuChapitre(page, "La lisière").click();
  for (const commande of ["Réglages", "Attribuer des élèves", "Exclure du livre", "Supprimer"]) {
    await expect(carte(page, "La lisière").getByRole("button", { name: commande, exact: true })).toBeVisible();
  }
  await page.keyboard.press("Escape");

  await page.getByRole("link", { name: "Ouvrir La lisière", exact: true }).click();
  await expect(page).toHaveURL(/\/chapitre\/[0-9a-f-]{36}$/);
  await expect(page.getByRole("heading", { level: 1, name: "La lisière" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Attribuer des élèves" })).toBeVisible();
  await menuChapitre(page, "La lisière").click();
  for (const commande of ["Réglages", "Exclure du livre", "Supprimer"]) {
    await expect(page.locator(".chap-actions").getByRole("button", { name: commande, exact: true })).toBeVisible();
  }
});

test("F03-AC16 — « Ajouter une scène » donne une scène vide munie de sa référence, sans titre ni consigne", async ({ page }) => {
  const { projet } = await passeursDeBrume(page);
  await aller(page, `/projet/${projet}/plan`);
  await page.getByRole("link", { name: "Ouvrir Les racines", exact: true }).click();
  await expect(page.getByText("Ce chapitre n’a pas encore de scène. Ajoutez une première scène.")).toBeVisible();
  await page.getByRole("button", { name: "Ajouter une scène" }).click();
  await expect(MESSAGE(page)).toContainText("S007 est ajoutée à la fin du chapitre. Ouvrez-la pour lui donner un titre.");
  expect(await scenesDuChapitre(page)).toEqual(["S007"]);
  const fiche = page.locator(".fiche");
  await expect(fiche).toContainText("sans titre");
  await expect(fiche).toContainText("sans consigne");
  await expect(fiche).toContainText("Texte vide");

  // Elle s'ouvre : on lui donne un titre et une consigne, tous deux facultatifs (F07.1)
  await page.getByRole("link", { name: /Ouvrir S007/ }).click();
  await page.getByLabel("Titre de la scène").fill("Sous les racines");
  await page.getByRole("textbox", { name: /^Consigne/ }).fill("Lou descend sous l’arbre. Que trouve-t-il ?");
  await expect(page.getByText("Enregistré", { exact: true })).toBeVisible();
  await page.getByRole("link", { name: "Retour à Les racines" }).click();
  await expect(page.locator(".fiche")).toContainText("Sous les racines");
  await expect(page.locator(".fiche")).not.toContainText("sans consigne");
});

test("F03-AC22, F03-AC27, F03-AC29 — supprimer un chapitre l'envoie dans la corbeille ; « Restaurer » le remet à son rang, avec ses élèves", async ({ page }) => {
  const { base, classe, projet, foret } = await passeursDeBrume(page);
  await semerAttribution(base, foret.chapitres[1].id, [{ eleve: classe.eleves.Alice.id }, { eleve: classe.eleves.Bilal.id }, { eleve: classe.eleves.Chloé.id }]);
  await aller(page, `/projet/${projet}/plan`);

  await menuChapitre(page, "Le sanctuaire").click();
  await page.getByRole("button", { name: "Supprimer", exact: true }).click();
  await expect(MESSAGE(page)).toContainText("« Le sanctuaire » est supprimé. Vous le retrouvez dans la corbeille du projet.");
  await expect(MESSAGE(page).getByRole("button", { name: "Annuler" })).toBeVisible();
  expect(await chapitresDeLaPartie(page, "La forêt")).toEqual(["La lisière", "Les racines"]);

  // Un chapitre sans scène part de même, sans confirmation, et se retrouve lui aussi dans la corbeille
  await menuChapitre(page, "Les racines").click();
  await page.getByRole("button", { name: "Supprimer", exact: true }).click();
  await expect(page.getByRole("button", { name: /Corbeille du projet · 2 éléments/ })).toBeVisible();

  await page.getByRole("button", { name: /Corbeille du projet/ }).click();
  const corbeille = page.getByRole("complementary");
  await expect(corbeille).toContainText("Chapitre · était dans « La forêt »");
  await corbeille.getByRole("button", { name: "Restaurer Le sanctuaire" }).click();
  await expect(MESSAGE(page)).toContainText("« Le sanctuaire » est restauré, avec ses 3 élèves.");
  await corbeille.getByRole("button", { name: "Restaurer Les racines" }).click();
  await expect(corbeille).toContainText("La corbeille est vide.");
  await corbeille.getByRole("button", { name: "Fermer", exact: true }).last().click();
  expect(await chapitresDeLaPartie(page, "La forêt")).toEqual(["La lisière", "Le sanctuaire", "Les racines"]);
  await expect(carte(page, "Le sanctuaire")).toContainText("3 élèves");
  await expect(carte(page, "Le sanctuaire")).toContainText("2 scènes");
});

test("F03-AC13, F03-AC14 — « Annuler » remet aussitôt l'élément supprimé ; le seul chapitre d'une partie ne se supprime pas", async ({ page }) => {
  const { projet } = await passeursDeBrume(page);
  await aller(page, `/projet/${projet}/plan`);
  await menuChapitre(page, "Le sanctuaire").click();
  await page.getByRole("button", { name: "Supprimer", exact: true }).click();
  await MESSAGE(page).getByRole("button", { name: "Annuler" }).click();
  await expect(carte(page, "Le sanctuaire")).toBeVisible();
  expect(await chapitresDeLaPartie(page, "La forêt")).toEqual(["La lisière", "Le sanctuaire", "Les racines"]);

  await menuChapitre(page, "Le col").click();
  await expect(carte(page, "Le col").getByRole("button", { name: "Supprimer", exact: true })).toBeDisabled();
  await expect(carte(page, "Le col")).toContainText("C’est le seul chapitre de sa partie : supprimez la partie.");
  await page.keyboard.press("Escape");
  // La partie, elle, se supprime avec son chapitre
  await page.getByLabel("Autres commandes de la partie La montagne").click();
  await page.getByRole("button", { name: "Supprimer", exact: true }).click();
  await expect(MESSAGE(page)).toContainText("« La montagne » est supprimée.");
  await expect(page.getByRole("heading", { level: 2, name: "La montagne" })).toHaveCount(0);
});

test("F03-AC31 — une scène dont le chapitre est aussi supprimé se restaure après lui, et la corbeille le dit", async ({ page }) => {
  const { base, projet, foret } = await passeursDeBrume(page);
  await base.rpc("supprimer_element", { p_sorte: "scene", p_id: foret.chapitres[0].scenes[2] });
  await base.rpc("supprimer_element", { p_sorte: "chapitre", p_id: foret.chapitres[0].id });
  await aller(page, `/projet/${projet}/plan`);
  await page.getByRole("button", { name: /Corbeille du projet · 2 éléments/ }).click();
  const corbeille = page.getByRole("complementary");
  await expect(corbeille).toContainText("Restaurez d’abord « La lisière ».");
  await expect(corbeille.getByRole("button", { name: /Restaurer S003/ })).toHaveCount(0);

  await corbeille.getByRole("button", { name: "Restaurer La lisière" }).click();
  await expect(corbeille.getByRole("button", { name: /Restaurer S003/ })).toBeVisible();
  await corbeille.getByRole("button", { name: "Fermer", exact: true }).last().click();
  // Restaurer le chapitre n'a pas restauré la scène supprimée avant lui
  await expect(carte(page, "La lisière")).toContainText("2 scènes");
});

test("F03-AC34 — un chapitre tiré change de rang, et « Annuler » remet l'ordre d'avant ; F03-AC38 — cliquer n'est pas déplacer", async ({ page }) => {
  const { projet } = await passeursDeBrume(page);
  await aller(page, `/projet/${projet}/plan`);
  await tirer(page, carte(page, "Le sanctuaire"), carte(page, "La lisière"));
  await expect(MESSAGE(page)).toContainText("« Le sanctuaire » est placé avant « La lisière ».");
  await expect.poll(() => chapitresDeLaPartie(page, "La forêt")).toEqual(["Le sanctuaire", "La lisière", "Les racines"]);
  // L'ordre est enregistré : il tient après un rechargement, et se retrouve dans la préparation
  await aller(page, `/projet/${projet}/preparation`);
  await expect(page.locator("ol").filter({ hasText: "La forêt" })).toContainText(/Le sanctuaire[\s\S]*La lisière/);

  await aller(page, `/projet/${projet}/plan`);
  await tirer(page, carte(page, "Les racines"), carte(page, "Le sanctuaire"));
  await expect(MESSAGE(page)).toContainText("« Les racines » est placé avant « Le sanctuaire ».");
  await MESSAGE(page).getByRole("button", { name: "Annuler" }).click();
  await expect.poll(() => chapitresDeLaPartie(page, "La forêt")).toEqual(["Le sanctuaire", "La lisière", "Les racines"]);

  // Un clic sans tirer ouvre la carte, et l'ordre ne change pas
  await page.getByRole("link", { name: "Ouvrir La lisière", exact: true }).click();
  await expect(page).toHaveURL(/\/chapitre\//);
  await page.getByRole("link", { name: "Parties et chapitres" }).click();
  await expect.poll(() => chapitresDeLaPartie(page, "La forêt")).toEqual(["Le sanctuaire", "La lisière", "Les racines"]);
});

test("F03-AC35 — un chapitre posé dans une autre partie y garde ses scènes et ses élèves ; F03-AC36 — le seul chapitre d'une partie n'en sort pas", async ({ page }) => {
  const { base, classe, projet, foret } = await passeursDeBrume(page);
  await semerAttribution(base, foret.chapitres[1].id, [{ eleve: classe.eleves.Alice.id }]);
  await aller(page, `/projet/${projet}/plan`);

  await tirer(page, carte(page, "Le sanctuaire"), carte(page, "Le col"));
  await expect(MESSAGE(page)).toContainText("« Le sanctuaire » est maintenant dans « La montagne ».");
  await expect.poll(() => chapitresDeLaPartie(page, "La forêt")).toEqual(["La lisière", "Les racines"]);
  expect(await chapitresDeLaPartie(page, "La montagne")).toContain("Le sanctuaire");
  await expect(carte(page, "Le sanctuaire")).toContainText("2 scènes");
  await expect(carte(page, "Le sanctuaire")).toContainText("1 élève");
  const { data } = await base.from("attributions").select("eleve_id").eq("chapitre_id", foret.chapitres[1].id);
  expect(data).toEqual([{ eleve_id: classe.eleves.Alice.id }]);

  // « Le col » devenu… non : on remet d'abord « Le sanctuaire », puis « Le col » est de nouveau seul
  await MESSAGE(page).getByRole("button", { name: "Annuler" }).click();
  await expect.poll(() => chapitresDeLaPartie(page, "La montagne")).toEqual(["Le col"]);
  await tirer(page, carte(page, "Le col"), carte(page, "La lisière"));
  await expect(MESSAGE(page)).toContainText("C’est le seul chapitre de « La montagne » : il y reste.");
  expect(await chapitresDeLaPartie(page, "La montagne")).toEqual(["Le col"]);
  expect(await chapitresDeLaPartie(page, "La forêt")).toEqual(["La lisière", "Le sanctuaire", "Les racines"]);
});

test("F03-AC37 — une partie tirée change de rang", async ({ page }) => {
  const { projet } = await passeursDeBrume(page);
  await aller(page, `/projet/${projet}/plan`);
  const parties = () => page.locator(".partie__titres h2").allTextContents();
  expect(await parties()).toEqual(["La forêt", "La montagne"]);
  await tirer(page, page.getByRole("heading", { level: 2, name: "La montagne" }), page.getByRole("heading", { level: 2, name: "La forêt" }));
  await expect(MESSAGE(page)).toContainText("« La montagne » est placée avant « La forêt ».");
  await expect.poll(parties).toEqual(["La montagne", "La forêt"]);
  await page.reload();
  expect(await parties()).toEqual(["La montagne", "La forêt"]);
});

test("F03-AC23 — une scène tirée change de rang dans son chapitre ; F03-AC39 — au clavier aussi", async ({ page }) => {
  const { projet, foret } = await passeursDeBrume(page);
  await aller(page, `/projet/${projet}/chapitre/${foret.chapitres[0].id}`);
  expect(await scenesDuChapitre(page)).toEqual(["S001", "S002", "S003"]);
  const fiche = (ref: string) => page.locator(".fiches > li", { hasText: ref });
  await tirer(page, fiche("S003").locator(".fiche__ref"), fiche("S002").locator(".fiche__ref"));
  await expect(MESSAGE(page)).toContainText("S003 est placée avant S002.");
  await expect.poll(() => scenesDuChapitre(page)).toEqual(["S001", "S003", "S002"]);
  await page.reload();
  expect(await scenesDuChapitre(page)).toEqual(["S001", "S003", "S002"]);

  // Au clavier : on saisit le repère de prise par Espace, on déplace aux flèches, on repose par Espace
  await page.getByRole("button", { name: "Déplacer S001" }).focus();
  await page.keyboard.press("Space");
  await page.waitForTimeout(250);
  await page.keyboard.press("ArrowRight");
  await page.waitForTimeout(250);
  await page.keyboard.press("Space");
  await expect(MESSAGE(page)).toContainText("S001 est placée avant S002.");
  await expect.poll(() => scenesDuChapitre(page)).toEqual(["S003", "S001", "S002"]);
});

test("F03-AC24 — « À compléter » mène à la première carte concernée, sans rien filtrer ni compter les consignes", async ({ page }) => {
  const { base, classe, projet, foret } = await passeursDeBrume(page);
  await semerAttribution(base, foret.chapitres[0].id, [{ eleve: classe.eleves.Alice.id }]);
  await semerAttribution(base, foret.chapitres[1].id, [{ eleve: classe.eleves.Bilal.id }]);
  await base.from("projets").update({ depart_scene_id: foret.chapitres[0].scenes[0] }).eq("id", projet);
  await aller(page, `/projet/${projet}/plan`);

  const manques = page.locator(".reste__manques");
  await expect(manques).toContainText("À compléter :");
  await expect(manques).toContainText("1 chapitre sans scène");
  await expect(manques).toContainText("2 chapitres sans élève");
  await expect(manques).toContainText("3 élèves sans chapitre");
  // Six scènes sans consigne : la phrase n'en dit rien
  await expect(manques).not.toContainText("consigne");

  await manques.getByRole("button", { name: "2 chapitres sans élève" }).click();
  await expect(carte(page, "Les racines").locator(".cahier")).toHaveClass(/est-montree/);
  // Rien n'est masqué, aucun état ne reste enfoncé
  for (const titre of ["La lisière", "Le sanctuaire", "Les racines", "Le col"]) await expect(carte(page, titre)).toBeVisible();
  await expect(manques.locator("[aria-pressed]")).toHaveCount(0);
});

test("F03-AC26 — une scène se retrouve sans connaître son chapitre", async ({ page }) => {
  const { projet } = await passeursDeBrume(page);
  await aller(page, `/projet/${projet}/plan`);
  await page.getByPlaceholder("Rechercher une scène").fill("souche");
  const trouvees = page.getByRole("region", { name: "Scènes trouvées" });
  await expect(trouvees).toContainText("2 scènes pour « souche »");
  await expect(trouvees.getByRole("heading", { level: 3 })).toContainText("La lisière");
  await expect(trouvees.locator(".trouve")).toHaveCount(2);
  await expect(trouvees).toContainText("S002");
  await expect(trouvees).toContainText("S003");

  await page.getByPlaceholder("Rechercher une scène").fill("dragon");
  await expect(page.getByText("Aucune scène trouvée pour « dragon » dans le livre.")).toBeVisible();
  await page.getByRole("button", { name: "Effacer la recherche" }).click();
  await expect(carte(page, "La lisière")).toBeVisible();

  await page.getByPlaceholder("Rechercher une scène").fill("chouette");
  await page.getByRole("link", { name: /Ouvrir S003/ }).click();
  await expect(page).toHaveURL(/\/scene\/[0-9a-f-]{36}$/);
  await expect(page.getByLabel("Titre de la scène")).toHaveValue("Souche — la chouette messagère");
});

test("F03-AC03 — désigner un nouveau départ nomme celui qu'il remplace ; F03-AC05, F03-AC06 — plusieurs fins, et une scène sans choix n'en est pas une", async ({ page }) => {
  const { base, projet, foret } = await passeursDeBrume(page);
  await base.from("projets").update({ depart_scene_id: foret.chapitres[0].scenes[0] }).eq("id", projet);
  await aller(page, `/projet/${projet}/chapitre/${foret.chapitres[0].id}`);
  const fiche = (ref: string) => page.locator(".fiches > li", { hasText: ref });
  await expect(fiche("S001")).toContainText("Départ du livre");
  await expect(fiche("S002")).not.toContainText("Fin de l’histoire");

  await page.getByLabel("Autres commandes de la scène S002").click();
  await page.getByRole("button", { name: "Départ du livre", exact: true }).click();
  const dialogue = page.getByRole("alertdialog", { name: "Changer le départ du livre ?" });
  await expect(dialogue).toContainText("S002 « Souche creuse — la lanterne de secours » devient le départ du livre.");
  await expect(dialogue).toContainText("S001 « L’entrée du bois » ne l’est plus : un livre n’a qu’un départ.");
  await dialogue.getByRole("button", { name: "Changer le départ" }).click();
  await expect(fiche("S002")).toContainText("Départ du livre");
  await expect(fiche("S001")).not.toContainText("Départ du livre");

  for (const ref of ["S002", "S003"]) {
    await page.getByLabel(`Autres commandes de la scène ${ref}`).click();
    await page.getByRole("button", { name: "Fin de l’histoire", exact: true }).click();
    await expect(fiche(ref)).toContainText("Fin de l’histoire");
  }
  await page.getByLabel("Autres commandes de la scène S003").click();
  await page.getByRole("button", { name: "Retirer le repère de fin" }).click();
  await expect(fiche("S003")).not.toContainText("Fin de l’histoire");
  await expect(fiche("S002")).toContainText("Fin de l’histoire");
});

test("F03-AC32, F03-AC33, F03-AC40 — le départ supprimé se dit, se choisit depuis le rappel, et revient à la restauration", async ({ page }) => {
  const { base, projet, foret } = await passeursDeBrume(page);
  await base.from("projets").update({ depart_scene_id: foret.chapitres[1].scenes[0] }).eq("id", projet);
  await aller(page, `/projet/${projet}/plan`);
  await expect(page.locator(".reste")).not.toContainText("pas de départ du livre");

  await menuChapitre(page, "Le sanctuaire").click();
  await page.getByRole("button", { name: "Supprimer", exact: true }).click();
  await expect(MESSAGE(page)).toContainText("« Le sanctuaire » est supprimé. Le livre n’aura plus de départ.");
  await expect(MESSAGE(page).getByRole("button", { name: "Choisir un autre départ" })).toBeVisible();
  await expect(page.locator(".reste__manques")).toContainText("pas de départ du livre");

  // Restauré sans autre départ désigné : la scène est de nouveau le départ
  await MESSAGE(page).getByRole("button", { name: "Annuler" }).click();
  await expect(page.locator(".reste")).not.toContainText("pas de départ du livre");

  // Supprimé de nouveau, puis un autre départ choisi depuis le rappel
  await menuChapitre(page, "Le sanctuaire").click();
  await page.getByRole("button", { name: "Supprimer", exact: true }).click();
  await page.locator(".reste__manques").getByRole("button", { name: "pas de départ du livre" }).click();
  const selecteur = page.getByRole("complementary");
  await expect(selecteur.getByRole("heading", { name: "Choisir le départ du livre" })).toBeVisible();
  await selecteur.getByPlaceholder("Rechercher une scène").fill("lanterne");
  await selecteur.getByRole("button", { name: "Choisir S002" }).click();
  await expect(MESSAGE(page)).toContainText("S002 « Souche creuse — la lanterne de secours » est le départ du livre.");
  await expect(page.locator(".reste")).not.toContainText("pas de départ du livre");

  // Le chapitre restauré ne reprend pas le départ : S002 reste le seul
  await page.getByRole("button", { name: /Corbeille du projet/ }).click();
  await page.getByRole("complementary").getByRole("button", { name: "Restaurer Le sanctuaire" }).click();
  await expect(MESSAGE(page)).toContainText("est restauré");
  const { data } = await base.from("projets").select("depart_scene_id").eq("id", projet).single();
  expect(data?.depart_scene_id).toBe(foret.chapitres[0].scenes[1]);
});

test("F06-AC01, F06-AC11, F06-AC18 — attribuer un chapitre : les élèves cochés, leur profil dit par ce qu'il permet ; F01-AC24 — la classe ne se change plus", async ({ page }) => {
  const { base, projet, foret } = await passeursDeBrume(page);
  await aller(page, `/projet/${projet}/plan`);
  await expect(page.getByRole("button", { name: "Changer de classe" })).toBeVisible();

  await menuChapitre(page, "La lisière").click();
  await page.getByRole("button", { name: "Attribuer des élèves" }).click();
  const panneau = page.getByRole("complementary");
  await expect(panneau).toContainText("Un élève coché lit et écrit dans ce chapitre, tout de suite.");
  for (const prenom of ["Alice", "Bilal", "Chloé"]) await panneau.getByRole("checkbox", { name: prenom }).check();
  // Le profil se dit par ce qu'il permet, et n'est pas coché d'office
  const profils = panneau.getByRole("checkbox", { name: "peut créer des scènes et des choix" });
  await expect(profils).toHaveCount(3);
  await expect(profils.first()).not.toBeChecked();
  await profils.nth(1).check();
  await expect(panneau.getByText("Enregistré")).toBeVisible();
  await panneau.getByRole("button", { name: "Fermer", exact: true }).last().click();

  await expect(carte(page, "La lisière")).toContainText("3 élèves");
  const { data } = await base.from("attributions").select("profil").eq("chapitre_id", foret.chapitres[0].id).order("profil");
  expect(data).toEqual([{ profil: "organisation" }, { profil: "propositions" }, { profil: "propositions" }]);
  await expect(page.getByRole("button", { name: "Changer de classe" })).toHaveCount(0);
  await expect(page.locator(".reste__manques")).toContainText("2 élèves sans chapitre");
});

test("F06-AC07, F06-AC62 — l'enseignant dit qui s'occupe d'une scène, sur sa carte comme dans sa page ; un chapitre qu'il écrit seul n'attend pas d'élève", async ({ page }) => {
  const { base, classe, projet, foret } = await passeursDeBrume(page);
  await semerAttribution(base, foret.chapitres[0].id, [{ eleve: classe.eleves.Alice.id }, { eleve: classe.eleves.Bilal.id }]);
  await aller(page, `/projet/${projet}/chapitre/${foret.chapitres[0].id}`);
  const fiche = (ref: string) => page.locator(".fiches > li", { hasText: ref });
  // Dans un chapitre attribué, une scène sans élève est « Pas encore prise »
  await expect(fiche("S001")).toContainText("Pas encore prise");

  await fiche("S001").getByLabel(/^Qui s’occupe de S001/).click();
  // Les élèves du chapitre, « Moi », « Pas encore prise » : Chloé, hors du chapitre, n'y est pas
  await expect(fiche("S001").getByRole("button", { name: "Chloé" })).toHaveCount(0);
  await fiche("S001").getByRole("button", { name: "Alice" }).click();
  await expect(MESSAGE(page)).toContainText("Alice s’occupe de S001 « L’entrée du bois ».");
  await expect(fiche("S001")).toContainText("Alice s’en occupe");

  await fiche("S002").getByLabel(/^Qui s’occupe de S002/).click();
  await fiche("S002").getByRole("button", { name: "Moi", exact: true }).click();
  await expect(MESSAGE(page)).toContainText("Vous vous occupez de S002");
  await expect(MESSAGE(page)).toContainText("les élèves la lisent, sans pouvoir l’écrire");
  await expect(fiche("S002")).toContainText("Vous vous en occupez");
  // « Annuler » remet la scène comme elle était
  await MESSAGE(page).getByRole("button", { name: "Annuler" }).click();
  await expect(fiche("S002")).toContainText("Pas encore prise");

  // Le même menu dans la page de la scène ; retirer ne touche pas à ce qu'elle contient
  await page.getByRole("link", { name: /Ouvrir S001/ }).click();
  await page.getByLabel(/^Qui s’occupe de S001 : Alice s’en occupe/).click();
  await page.getByRole("button", { name: "Pas encore prise" }).click();
  await expect(MESSAGE(page)).toContainText("Plus personne ne s’occupe de S001");
  await expect(page.getByLabel("Titre de la scène")).toHaveValue("L’entrée du bois");

  // « Le col » n'a aucun élève : ses scènes disent « Aucun élève ». L'enseignant les prend toutes :
  // le chapitre ne compte plus parmi les chapitres sans élève
  const col = (await base.from("chapitres").select("id").eq("projet_id", projet).eq("titre", "Le col").single()).data!.id;
  await aller(page, `/projet/${projet}/chapitre/${col}`);
  await expect(fiche("S006")).toContainText("Aucun élève");
  await fiche("S006").getByLabel(/^Qui s’occupe de S006/).click();
  await expect(fiche("S006")).toContainText("Ce chapitre n’a pas encore d’élève");
  await fiche("S006").getByRole("button", { name: "Moi", exact: true }).click();
  await expect(page.getByText("Vous écrivez ce chapitre vous-même.")).toBeVisible();
  await aller(page, `/projet/${projet}/plan`);
  await expect(carte(page, "Le col")).toContainText("Vous l’écrivez vous-même");
  await expect(carte(page, "Le col")).not.toContainText("aucun élève");
  await expect(page.locator(".reste__manques")).toContainText("2 chapitres sans élève");
});

test("F11.2 — exclure un chapitre du livre se confirme, se lit sur sa carte et se défait depuis le même menu", async ({ page }) => {
  const { projet } = await passeursDeBrume(page);
  await aller(page, `/projet/${projet}/plan`);
  await menuChapitre(page, "Le sanctuaire").click();
  await page.getByRole("button", { name: "Exclure du livre" }).click();
  const dialogue = page.getByRole("alertdialog", { name: "Exclure « Le sanctuaire » du livre ?" });
  await expect(dialogue).toContainText("Ses 2 scènes seront hors du livre. Elles restent dans le projet.");
  await expect(dialogue).toContainText("Les élèves continuent d’y écrire.");
  await dialogue.getByRole("button", { name: "Exclure du livre" }).click();
  await expect(carte(page, "Le sanctuaire")).toContainText("hors du livre");
  await menuChapitre(page, "Le sanctuaire").click();
  await page.getByRole("button", { name: "Réintégrer dans le livre" }).click();
  await expect(carte(page, "Le sanctuaire")).not.toContainText("hors du livre");
});

test("F03.1 — l'écran d'aide s'affiche à la première ouverture, dit comment changer l'ordre, et ne revient plus après « Ne plus afficher »", async ({ page }) => {
  const { compte, base } = await adultePret(page);
  await base.from("enseignants").update({ aides_masquees: [] }).eq("id", compte.id);
  const projet = await semerProjet(base, compte, "classe", "choix", "Les passeurs de brume");
  await aller(page, `/projet/${projet}/plan`);
  await expect(page.getByRole("heading", { level: 2, name: "Parties et chapitres" })).toBeVisible();
  await page.getByText("Comment changer l’ordre ?").click();
  await expect(page.getByText("Tirez une carte pour la déplacer. Un chapitre se pose aussi dans une autre partie.")).toBeVisible();
  await page.getByLabel("Ne plus afficher").check();
  await page.getByRole("button", { name: "Commencer" }).click();
  await expect(page.getByRole("button", { name: "Ajouter une partie" }).first()).toBeVisible();
  await page.context().clearCookies({ name: "aide-plan" });
  await page.reload();
  await expect(page.getByRole("button", { name: "Commencer" })).toHaveCount(0);
  await page.getByRole("button", { name: "Aide" }).click();
  await expect(page.getByRole("button", { name: "Fermer l’aide" })).toBeVisible();
});

test("F03-AC41 — en projet personnel, la page du chapitre n'a ni élèves, ni Suivi, ni filtre ; F01-AC02 — les quatre combinaisons se préparent", async ({ page }) => {
  const { compte, base } = await adultePret(page);
  const projet = await semerProjet(base, compte, "personnel", "choix", "Mon histoire");
  const partie = await semerPartie(base, projet, "La forêt", [{ titre: "La lisière", scenes: ["Un", "Deux", "Trois", "Quatre", "Cinq", "Six"] }]);
  await aller(page, `/projet/${projet}/plan`);
  await expect(page.getByRole("link", { name: "Suivi" })).toHaveCount(0);
  await expect(page.locator(".reste")).not.toContainText("élève");
  await menuChapitre(page, "La lisière").click();
  await expect(page.getByRole("button", { name: "Attribuer des élèves" })).toHaveCount(0);
  await page.keyboard.press("Escape");

  await aller(page, `/projet/${projet}/chapitre/${partie.chapitres[0].id}`);
  expect(await scenesDuChapitre(page)).toHaveLength(6);
  await expect(page.getByRole("button", { name: "Ajouter une scène" })).toBeVisible();
  await expect(menuChapitre(page, "La lisière")).toBeVisible();
  await expect(page.getByRole("button", { name: "Attribuer des élèves" })).toHaveCount(0);
  await expect(page.getByText(/s’en occupe|Suivi/)).toHaveCount(0);
  await expect(page.locator("main input[type=checkbox]")).toHaveCount(0);
  await expect(page.locator("[aria-pressed]")).toHaveCount(0);

  // Un récit classique n'a ni départ ni fin à désigner : l'ordre du plan est celui de la lecture (F03-AC20)
  const classique = await semerProjet(base, compte, "personnel", "classique", "Carnet de voyage");
  const c = await semerPartie(base, classique, "Le départ", [{ titre: "Le port", scenes: ["A", "B", "C"] }]);
  await aller(page, `/projet/${classique}/chapitre/${c.chapitres[0].id}`);
  await expect(page.getByText("Les scènes se lisent dans cet ordre.")).toBeVisible();
  await page.getByLabel("Autres commandes de la scène S001").click();
  await expect(page.getByRole("button", { name: "Départ du livre" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Fin de l’histoire" })).toHaveCount(0);
});
