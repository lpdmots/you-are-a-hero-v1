import { expect, test, type Page } from "@playwright/test";
import { adultePret, aller, autrePoste, MESSAGE, semerClasse, semerPartie, semerProjet, supprimerComptes } from "./outils";

test.afterEach(async () => {
  await supprimerComptes();
});

const rubrique = (page: Page, nom: string) => page.getByRole("region", { name: nom, exact: true });

async function projetDeClasse(page: Page, recit: "choix" | "classique" = "choix") {
  const { compte, base } = await adultePret(page);
  const classe = await semerClasse(base, "CM1-CM2", ["Alice", "Bilal"]);
  const projet = await semerProjet(base, compte, "classe", recit, "Les passeurs de brume", classe.id);
  return { compte, base, classe, projet };
}

test("F02-AC01, F02-AC07 — la préparation se garde rubrique par rubrique, et l'organisation du récit n'attend pas les autres", async ({ page }) => {
  const { projet } = await projetDeClasse(page);
  await aller(page, `/projet/${projet}/preparation`);
  await rubrique(page, "Personnages").getByLabel("Nous retenons…").fill("Lou, 10 ans, fils du dernier passeur.");
  await rubrique(page, "Enjeu").getByLabel("Nous retenons…").fill("Retrouver son père avant que la dernière lanterne ne s’éteigne.");
  await rubrique(page, "Enjeu").getByLabel("Nous retenons…").blur();
  await expect(rubrique(page, "Enjeu").getByText("Enregistré", { exact: true })).toBeVisible();

  // Univers et grandes étapes restent vides : on passe quand même à l'organisation du récit
  await page.getByRole("link", { name: "Parties et chapitres", exact: true }).click();
  await page.getByRole("button", { name: "Ajouter une partie" }).first().click();
  await expect(page.getByRole("heading", { name: "Réglages de la partie" })).toBeVisible();
  await page.getByRole("button", { name: "Fermer", exact: true }).last().click();

  // Revenu plus tard, pendant la rédaction, l'enseignant retrouve ce qu'il a consigné
  await aller(page, `/projet/${projet}/preparation`);
  await expect(rubrique(page, "Personnages").getByLabel("Nous retenons…")).toHaveValue("Lou, 10 ans, fils du dernier passeur.");
  await expect(rubrique(page, "Enjeu").getByLabel("Nous retenons…")).toHaveValue("Retrouver son père avant que la dernière lanterne ne s’éteigne.");
  await expect(rubrique(page, "Univers").getByLabel("Nous retenons…")).toHaveValue("");
});

test("F02-AC02, F02-AC18 — le carnet dit à quoi il sert ; chaque rubrique a sa question, ses relances et un exemple replié", async ({ page }) => {
  const { projet } = await projetDeClasse(page);
  await aller(page, `/projet/${projet}/preparation`);
  await expect(page.getByText("Le carnet garde les décisions de la classe. Il sert de repère pendant l’écriture. Remplissez seulement ce qui vous sert.")).toBeVisible();
  const personnages = rubrique(page, "Personnages");
  await expect(personnages).toContainText("Qui est notre héros, et qu’est-ce qui le rend unique ?");
  await expect(personnages).toContainText("De quoi a-t-il peur ?");
  await expect(personnages.getByText("Lou, 10 ans, fils du dernier passeur du village.")).toBeHidden();
  await personnages.getByText("Voir un exemple").click();
  await expect(personnages.getByText(/Lou, 10 ans, fils du dernier passeur du village\./)).toBeVisible();
  // L'exemple se lit : il n'écrit rien dans la rubrique
  await expect(personnages.getByLabel("Nous retenons…")).toHaveValue("");
  // Aucune aide IA n'est annoncée avant d'exister
  await expect(page.getByText(/M’aider à développer|Idées de parties/)).toHaveCount(0);
});

test("F02-AC02, F02-AC07 — l'écran d'aide ouvre la Préparation : rien n'est obligatoire, on écrit sans avoir tout rempli", async ({ page }) => {
  const { compte, base } = await adultePret(page);
  await base.from("enseignants").update({ aides_masquees: [] }).eq("id", compte.id);
  const projet = await semerProjet(base, compte, "classe", "choix", "Les passeurs de brume");
  await aller(page, `/projet/${projet}/preparation`);
  await expect(page.getByRole("heading", { level: 2, name: "Préparation" })).toBeVisible();
  // La première réponse, déjà dépliée, rassure d'emblée
  await expect(page.getByText(/Rien n’est obligatoire : remplissez ce qui vous sert, et commencez à écrire quand vous voulez\./)).toBeVisible();
  await page.getByText("Faut-il tout remplir avant d’écrire ?").click();
  await expect(page.getByText(/Non\. Une ligne suffit, ou rien du tout\./)).toBeVisible();
  await expect(page.getByText("Comment le faire avec la classe ?")).toBeVisible();
  await expect(page.getByText("À quoi servent les rubriques du bas ?")).toBeVisible();
  // Le carnet n'est pas encore à l'écran : l'aide tient seule
  await expect(page.getByLabel("Nous retenons…")).toHaveCount(0);

  await page.getByLabel("Ne plus afficher").check();
  await page.getByRole("button", { name: "Commencer" }).click();
  await expect(rubrique(page, "Univers")).toBeVisible();
  await page.context().clearCookies({ name: "aide-preparation" });
  await page.reload();
  await expect(page.getByRole("button", { name: "Commencer" })).toHaveCount(0);
  await page.getByRole("button", { name: "Aide" }).click();
  await expect(page.getByRole("button", { name: "Fermer l’aide" })).toBeVisible();

  // Projet personnel en récit classique : ni atelier, ni rubriques du jeu dans l'aide
  const seul = await semerProjet(base, compte, "personnel", "classique", "Carnet de voyage");
  await aller(page, `/projet/${seul}/preparation`);
  await page.getByRole("button", { name: "Aide" }).click();
  await expect(page.getByText(/On note ce que vous décidez avant d’écrire\./)).toBeVisible();
  await expect(page.getByText("Comment le faire avec la classe ?")).toHaveCount(0);
  await expect(page.getByText("À quoi servent les rubriques du bas ?")).toHaveCount(0);
});

test("F02-AC08, F02-AC09, F02-AC10 — le plan est le même dans la préparation et dans « Parties et chapitres »", async ({ page }) => {
  const { projet } = await projetDeClasse(page);
  await aller(page, `/projet/${projet}/preparation`);
  const etapes = rubrique(page, "Grandes étapes");
  for (const titre of ["La forêt", "La montagne"]) {
    await etapes.getByRole("button", { name: "Ajouter une partie" }).click();
    await expect(page.getByRole("heading", { name: "Réglages de la partie" })).toBeVisible();
    await page.keyboard.type(titre);
    await page.getByLabel("Titre").blur();
    await expect(page.getByRole("complementary").getByText("Enregistré")).toBeVisible();
    await page.getByRole("button", { name: "Fermer", exact: true }).last().click();
    await expect(etapes).toContainText(titre);
  }

  // Les deux mêmes parties, chacune avec son premier chapitre vide, sans scène ni attribution
  await page.getByRole("link", { name: "Ouvrir Parties et chapitres" }).click();
  await expect(page.locator(".partie__titres h2")).toHaveText(["La forêt", "La montagne"]);
  await expect(page.locator(".cahier")).toHaveCount(2);
  await expect(page.locator(".cahier").first()).toContainText("Aucune scène · aucun élève");

  // Renommée depuis « Parties et chapitres », elle l'est aussi dans la préparation
  await page.getByLabel("Autres commandes de la partie La forêt").click();
  await page.getByRole("button", { name: "Réglages" }).click();
  await page.getByLabel("Titre").fill("La forêt endormie");
  await page.getByLabel("Titre").blur();
  await expect(page.getByRole("complementary").getByText("Enregistré")).toBeVisible();
  await page.getByRole("button", { name: "Fermer", exact: true }).last().click();
  await page.getByRole("link", { name: "Préparation", exact: true }).click();
  await expect(rubrique(page, "Grandes étapes")).toContainText("Partie 1 · La forêt endormie");

  // … et réciproquement
  await page.getByLabel("Autres commandes de la partie La montagne").click();
  await page.getByRole("button", { name: "Réglages" }).click();
  await page.getByLabel("Titre").fill("La montagne bleue");
  await page.getByLabel("Titre").blur();
  await expect(page.getByRole("complementary").getByText("Enregistré")).toBeVisible();
  await page.getByRole("button", { name: "Fermer", exact: true }).last().click();

  // Passer plusieurs fois d'une vue à l'autre ne recrée ni ne duplique rien
  for (let i = 0; i < 3; i += 1) {
    await page.getByRole("link", { name: "Parties et chapitres", exact: true }).click();
    await expect(page.locator(".partie__titres h2")).toHaveText(["La forêt endormie", "La montagne bleue"]);
    await page.getByRole("link", { name: "Préparation", exact: true }).click();
    await expect(rubrique(page, "Grandes étapes").locator("ol > li")).toHaveCount(2);
  }
});

test("F02-AC14 — le résumé d'un chapitre est le même texte dans les deux vues ; F03-AC13 — supprimer depuis la préparation passe par la même corbeille", async ({ page }) => {
  const { base, projet } = await projetDeClasse(page);
  await semerPartie(base, projet, "La forêt", [{ titre: "La lisière", scenes: ["L’entrée du bois"] }, { titre: "Le sanctuaire" }]);
  await aller(page, `/projet/${projet}/plan`);
  await page.getByLabel("Autres commandes du chapitre La lisière").click();
  await page.getByRole("button", { name: "Réglages" }).click();
  await page.getByLabel(/^Résumé/).fill("Lou entre dans la forêt et découvre que les chemins bougent.");
  await page.getByLabel(/^Résumé/).blur();
  await expect(page.getByRole("complementary").getByText("Enregistré")).toBeVisible();
  await page.getByRole("button", { name: "Fermer", exact: true }).last().click();

  await page.getByRole("link", { name: "Préparation", exact: true }).click();
  const etapes = rubrique(page, "Grandes étapes");
  await expect(etapes).toContainText("Lou entre dans la forêt et découvre que les chemins bougent.");
  // Il se développe ici aussi, sur le même chapitre : la partie, elle, n'a pas de résumé
  await etapes.getByRole("button", { name: "La lisière" }).click();
  await expect(page.getByLabel(/^Résumé/)).toHaveValue("Lou entre dans la forêt et découvre que les chemins bougent.");
  await page.getByRole("button", { name: "Fermer", exact: true }).last().click();
  await page.getByLabel("Autres commandes de la partie La forêt").click();
  await page.getByRole("button", { name: "Réglages" }).click();
  await expect(page.getByRole("complementary").getByLabel(/Résumé/)).toHaveCount(0);
  await page.getByRole("button", { name: "Fermer", exact: true }).last().click();

  await page.getByLabel("Autres commandes de la partie La forêt").click();
  await page.getByRole("button", { name: "Supprimer" }).click();
  await expect(MESSAGE(page)).toContainText("« La forêt » est supprimée.");
  await expect(etapes).toContainText("Le plan est encore vide.");
  await MESSAGE(page).getByRole("button", { name: "Annuler" }).click();
  await expect(etapes).toContainText("Partie 1 · La forêt");
});

test("F02-AC05, F02-AC11, F02-AC12, F02-AC13 — l'atelier projeté écrit dans le même carnet, sans compte d'élève, et se reprend à n'importe quelle étape", async ({ page }) => {
  const { projet } = await projetDeClasse(page);
  await aller(page, `/projet/${projet}/preparation`);
  await page.getByRole("link", { name: "Projeter l’atelier" }).click();
  await expect(page).toHaveURL(new RegExp(`/atelier/${projet}/univers$`));
  // L'écran projeté n'a ni barre de l'application ni commande d'élève : seul l'enseignant est connecté
  await expect(page.getByRole("navigation", { name: "Espace adulte" })).toHaveCount(0);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Où se passe notre histoire");

  // On saute à « Personnages » sans avoir rempli « Univers »
  await page.getByRole("navigation", { name: "Étapes de l’atelier" }).getByRole("link", { name: /Personnages/ }).click();
  await expect(page.getByText("Étape 2 sur 4 · Personnages")).toBeVisible();
  await page.getByRole("textbox", { name: "Nous retenons…" }).fill("Lou, 10 ans, fils du dernier passeur.");
  await page.getByRole("textbox", { name: "Nous retenons…" }).blur();
  await expect(page.getByText("Enregistré dans le carnet")).toBeVisible();

  // L'atelier s'interrompt ; au retour, le carnet a cette décision, sans transfert ni ressaisie
  await page.getByRole("link", { name: "Quitter la projection" }).click();
  await expect(page).toHaveURL(new RegExp(`/projet/${projet}/preparation$`));
  await expect(rubrique(page, "Personnages").getByLabel("Nous retenons…")).toHaveValue("Lou, 10 ans, fils du dernier passeur.");
  // Il reprend sur une autre rubrique : les éléments retenus subsistent
  await rubrique(page, "Enjeu").getByRole("link", { name: "Projeter Enjeu" }).click();
  await expect(page.getByText("Étape 3 sur 4 · Enjeu")).toBeVisible();
  await page.getByRole("link", { name: /Personnages/ }).first().click();
  await expect(page.getByRole("textbox", { name: "Nous retenons…" })).toHaveValue("Lou, 10 ans, fils du dernier passeur.");

  // « Grandes étapes » : ce que la classe retient devient le plan
  await page.getByRole("link", { name: /Grandes étapes/ }).first().click();
  await page.getByLabel("Nouvelle partie").fill("La forêt");
  await page.getByRole("button", { name: "Ajouter" }).click();
  await expect(page.locator("ol").filter({ hasText: "La forêt" })).toBeVisible();
  await aller(page, `/projet/${projet}/plan`);
  await expect(page.locator(".partie__titres h2")).toHaveText(["La forêt"]);
});

test("F02-AC17 — une piste écartée pendant l'atelier se retrouve dans le carnet, repliée, hors du texte retenu", async ({ page }) => {
  const { projet } = await projetDeClasse(page);
  await aller(page, `/atelier/${projet}/personnages`);
  for (const idee of ["Lou, fils du dernier passeur", "Des jumeaux inséparables"]) {
    await page.getByLabel("Noter une idée").fill(idee);
    await page.getByRole("button", { name: "Noter" }).click();
    await expect(page.getByText(idee, { exact: true })).toBeVisible();
  }
  await page.getByLabel("Statut de « Lou, fils du dernier passeur »").selectOption("retenue");
  await page.getByLabel("Statut de « Des jumeaux inséparables »").selectOption("ecartee");
  await expect(page.getByText("Pistes écartées · 1")).toBeVisible();

  await aller(page, `/projet/${projet}/preparation`);
  const personnages = rubrique(page, "Personnages");
  await expect(personnages.getByText("Lou, fils du dernier passeur", { exact: true })).toBeVisible();
  await expect(personnages.getByText("Des jumeaux inséparables", { exact: true })).toBeHidden();
  await personnages.getByText("Pistes écartées · 1").click();
  await expect(personnages.getByText("Des jumeaux inséparables", { exact: true })).toBeVisible();
  await expect(personnages.getByLabel("Nous retenons…")).toHaveValue("");
});

test("F02-AC19 — en projet personnel, le carnet parle à l'auteur, dit « Je retiens… » et ne propose pas de projeter", async ({ page }) => {
  const { compte, base } = await adultePret(page);
  const projet = await semerProjet(base, compte, "personnel", "choix", "Mon histoire");
  await aller(page, `/projet/${projet}/preparation`);
  await expect(page.getByText(/Le carnet garde vos décisions\./)).toBeVisible();
  await expect(rubrique(page, "Personnages")).toContainText("Qui est votre héros, et qu’est-ce qui le rend unique ?");
  await expect(rubrique(page, "Personnages").getByLabel("Je retiens…")).toBeVisible();
  await expect(page.getByText("Nous retenons…")).toHaveCount(0);
  await expect(page.getByRole("link", { name: /Projeter/ })).toHaveCount(0);
  await expect(page.getByLabel("Noter une idée")).toHaveCount(0);
  // L'atelier projeté n'existe pas pour un projet personnel, même par son adresse
  const reponse = await page.goto(`/atelier/${projet}/univers`);
  expect(reponse?.status()).toBe(404);
});

test("F02-AC20 — en récit classique, « Grandes étapes » demande le déroulement, et le carnet n'a ni jeu ni phrases de choix", async ({ page }) => {
  const { projet } = await projetDeClasse(page, "classique");
  await aller(page, `/projet/${projet}/preparation`);
  await expect(rubrique(page, "Grandes étapes")).toContainText("Que se passe-t-il, du début à la fin ?");
  await expect(page.getByRole("heading", { name: "Phrases de choix" })).toHaveCount(0);
  await page.getByRole("button", { name: "Ajouter cette rubrique" }).click();
  const objets = rubrique(page, "Objets de l’histoire");
  await expect(objets).toBeVisible();
  for (const absent of ["Formules d’action", "Feuille d’aventure", "Règles du jeu", "Dé de la feuille"]) await expect(page.getByText(absent)).toHaveCount(0);
});

test("F04.2 — la rubrique facultative réunit les objets, les formules d'action, la feuille d'aventure, le dé et les règles du jeu", async ({ page }) => {
  const { base, projet } = await projetDeClasse(page);
  await aller(page, `/projet/${projet}/preparation`);
  await page.getByRole("button", { name: "Ajouter cette rubrique" }).click();
  const jeu = rubrique(page, "Objets et formules");

  await jeu.getByLabel("Nouvel objet").fill("la lanterne sourde");
  await jeu.getByLabel("Description", { exact: true }).fill("Éclaire sans être vue.");
  await jeu.getByRole("button", { name: "Ajouter" }).first().click();
  await expect(jeu.getByText("la lanterne sourde")).toBeVisible();
  await jeu.getByLabel("Nouvelle formule").fill("Retire un point de volonté à ton héros.");
  await jeu.getByRole("button", { name: "Ajouter" }).nth(1).click();
  await expect(jeu.getByText("Retire un point de volonté à ton héros.")).toBeVisible();

  // Renommer un objet ne touche pas aux textes : l'écran le dit
  await jeu.getByRole("button", { name: "Modifier la lanterne sourde" }).click();
  await expect(jeu).toContainText("Renommer ne modifie pas les textes déjà écrits.");
  await jeu.getByLabel("Nom, tel qu’il s’écrit dans une phrase").fill("la lanterne d’argent");
  await jeu.getByRole("button", { name: "Enregistrer" }).click();
  await expect(jeu.getByText("la lanterne d’argent")).toBeVisible();

  await jeu.getByText("Feuille d’aventure du lecteur").click();
  await jeu.getByRole("button", { name: "Compteurs" }).click();
  await jeu.getByRole("button", { name: "Liste" }).click();
  await jeu.getByText("Dans le livre et en ligne").click();
  await expect(jeu.getByRole("switch", { name: "Dans le livre et en ligne" })).toBeChecked();
  await jeu.getByRole("radio", { name: "Deux dés" }).check();
  await jeu.getByText("Règles du jeu").click();
  await jeu.getByLabel(/Ce que le lecteur doit savoir/).fill("Note tes objets sur ta feuille d’aventure.");
  await jeu.getByLabel(/Ce que le lecteur doit savoir/).blur();
  await expect.poll(async () => (await base.from("preparations").select("feuille, regles").eq("projet_id", projet).single()).data).toMatchObject({
    regles: "Note tes objets sur ta feuille d’aventure.",
    feuille: { on: true, des: 2, sections: [{ type: "compteurs", titre: "Compteurs" }, { type: "liste", titre: "Inventaire", lignes: 6 }] },
  });
  expect((await base.from("objets").select("nom, description").eq("projet_id", projet)).data).toEqual([{ nom: "la lanterne d’argent", description: "Éclaire sans être vue." }]);
});

test("F05, F11.5 — la rubrique « Phrases de choix » : une seule liste de phrases à cocher, la façon d'annoncer le numéro, la marque de fin", async ({ page }) => {
  const { base, projet } = await projetDeClasse(page);
  await aller(page, `/projet/${projet}/preparation`);
  const phrases = rubrique(page, "Phrases de choix");
  await expect(phrases.getByRole("radio", { name: "« rends-toi au 12 »" })).toBeChecked();
  // Les phrases s'écrivent en entier ; la première est toujours proposée
  const cases = phrases.getByRole("checkbox");
  await expect(cases).toHaveCount(4);
  await expect(phrases.getByRole("checkbox", { name: /Plonger la main : rends-toi au 17\./ })).toBeDisabled();
  await expect(phrases.getByRole("checkbox", { name: /Plonger la main : rends-toi au 17\./ })).toBeChecked();

  // Changer la façon d'annoncer le numéro récrit toutes les phrases
  await phrases.getByRole("radio", { name: "« va au 12 »" }).check();
  await expect(phrases.getByRole("checkbox", { name: /Plonger la main : va au 17\./ })).toBeChecked();
  await phrases.getByRole("checkbox", { name: "Pour plonger la main, va au 17." }).check();
  await phrases.getByLabel("Marque de fin").fill("FIN");
  await phrases.getByLabel("Marque de fin").blur();
  await expect.poll(async () => (await base.from("preparations").select("formule_renvoi, constructions, marque_fin").eq("projet_id", projet).single()).data).toEqual({
    formule_renvoi: "va", constructions: ["neutre", "pour"], marque_fin: "FIN",
  });

  // F05-AC43 — avec la flèche, seule la première phrase sert ; les autres sont grisées, et l'écran le dit
  await phrases.getByRole("radio", { name: "« → 12 »" }).check();
  await expect(phrases.getByRole("checkbox", { name: /Plonger la main → 17/ })).toBeChecked();
  for (const autre of [/^Pour plonger la main/, /^Si tu veux plonger la main/, /^Plonger la main \? /]) {
    await expect(phrases.getByRole("checkbox", { name: autre })).toBeDisabled();
    await expect(phrases.getByRole("checkbox", { name: autre })).not.toBeChecked();
  }
  await expect(phrases).toContainText("Avec « → 12 », seule la première phrase sert");
  // Revenu à une formule en mots, ce qui était coché l'est de nouveau
  await phrases.getByRole("radio", { name: "« rends-toi au 12 »" }).check();
  await expect(phrases.getByRole("checkbox", { name: "Pour plonger la main, rends-toi au 17." })).toBeChecked();
});

test("F02-AC04 — un élève n'ouvre pas la préparation, même par son adresse", async ({ page, browser }) => {
  const { projet } = await projetDeClasse(page);
  const poste = await autrePoste(browser);
  for (const adresse of [`/projet/${projet}/preparation`, `/atelier/${projet}/personnages`]) {
    await poste.page.goto(adresse);
    await expect(poste.page).toHaveURL(/\/entree$/);
    await expect(poste.page.getByText("Nous retenons…")).toHaveCount(0);
  }
  await poste.contexte.close();
});
