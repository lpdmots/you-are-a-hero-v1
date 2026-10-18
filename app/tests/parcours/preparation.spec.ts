import { expect, test, type Page } from "@playwright/test";
import { adultePret, aller, autrePoste, MESSAGE, semerClasse, semerPartie, semerProjet, sql, supprimerComptes } from "./outils";

/**
 * La Préparation en étapes (F02, décision du 17 octobre 2026) et ses aides IA (F13.4). Le
 * fournisseur est simulé (IA_SIMULEE) : six questions et six idées toujours les mêmes, et
 * « Rédiger » qui met bout à bout le texte retenu et les idées retenues.
 */

test.afterEach(async () => {
  await supprimerComptes();
});

const LIGNE = (page: Page) => page.getByRole("navigation", { name: "Étapes de la préparation" });
const RETENU = (page: Page, nom = "Nous retenons…") => page.getByRole("textbox", { name: nom, exact: true });
const QUESTIONS = (page: Page) => page.getByRole("region", { name: /^Questions pour/ });
const IDEES = (page: Page) => page.getByRole("region", { name: "Idées", exact: true });
const etape = (page: Page, nom: string | RegExp) => LIGNE(page).locator("ol").getByRole("link", { name: nom });
const appels = async (compte: string) => (await sql<{ aide: string }>("select aide from appels_ia where enseignant_id = $1 order by commence_le", [compte])).map((a) => a.aide);

async function projetDeClasse(page: Page, recit: "choix" | "classique" = "choix") {
  const { compte, base } = await adultePret(page);
  const classe = await semerClasse(base, "CM1-CM2", ["Alice", "Bilal"]);
  const projet = await semerProjet(base, compte, "classe", recit, "Les passeurs de brume", classe.id);
  return { compte, base, classe, projet };
}

test("F02, 17 octobre 2026 — un parcours en étapes : la page s'ouvre sur la première étape sans texte retenu, une étape retenue est cochée, rien n'est bloqué", async ({ page }) => {
  const { base, projet } = await projetDeClasse(page);
  await base.from("preparations").update({ univers: "Un pays de brume." }).eq("projet_id", projet);
  await aller(page, `/projet/${projet}/preparation`);
  await expect(LIGNE(page).locator("ol").getByRole("link")).toHaveText([/Univers/, /Personnages/, /Enjeu/, /Grandes étapes/, /Les choix/, /Le jeu/]);
  await expect(etape(page, /Personnages/)).toHaveAttribute("aria-current", "step");
  await expect(etape(page, /Univers/)).toContainText("fait");
  await expect(etape(page, /Les choix/)).toContainText("facultative");
  await expect(page.getByRole("heading", { level: 2 })).toContainText("Qui est notre héros");

  // On saute l'enjeu : Grandes étapes s'ouvre sans rien exiger
  await etape(page, /Grandes étapes/).click();
  await expect(page.getByRole("heading", { level: 2 })).toContainText("Par quels lieux passe notre aventure");
  await page.getByRole("link", { name: "Étape suivante : Les choix (facultative)" }).click();
  await expect(etape(page, /Les choix/)).toHaveAttribute("aria-current", "step");
  await page.getByRole("link", { name: "Étape suivante : Le jeu (facultative)" }).click();
  await expect(page.getByRole("link", { name: "Aller à Parties et chapitres" })).toBeVisible();

  // Écrire dans « Nous retenons » coche l'étape
  await etape(page, /Enjeu/).click();
  await RETENU(page).fill("Retrouver son père avant que la dernière lanterne ne s’éteigne.");
  await RETENU(page).blur();
  await expect(page.getByText("Enregistré", { exact: true })).toBeVisible();
  await page.reload();
  await expect(etape(page, /Enjeu/)).toContainText("fait");
});

test("F02-AC01, F02-AC07 — la préparation se garde étape par étape, et l'organisation du récit n'attend pas les autres", async ({ page }) => {
  const { projet } = await projetDeClasse(page);
  await aller(page, `/projet/${projet}/preparation?etape=personnages`);
  await RETENU(page).fill("Lou, 10 ans, fils du dernier passeur.");
  await RETENU(page).blur();
  await expect(page.getByText("Enregistré", { exact: true })).toBeVisible();

  // Univers et grandes étapes restent vides : on passe quand même à l'organisation du récit
  await page.getByRole("link", { name: "Parties et chapitres", exact: true }).click();
  await page.getByRole("button", { name: "Ajouter une partie" }).first().click();
  await expect(page.getByRole("heading", { name: "Réglages de la partie" })).toBeVisible();
  await page.getByRole("button", { name: "Fermer", exact: true }).last().click();

  // Revenu plus tard, l'enseignant retrouve ce qu'il a consigné
  await aller(page, `/projet/${projet}/preparation?etape=personnages`);
  await expect(RETENU(page)).toHaveValue("Lou, 10 ans, fils du dernier passeur.");
  await etape(page, /Univers/).click();
  await expect(RETENU(page)).toHaveValue("");
});

test("F02-AC18 — chaque étape a sa question en grand, ses relances parmi les questions pour la classe, et un exemple replié", async ({ page }) => {
  const { projet } = await projetDeClasse(page);
  await aller(page, `/projet/${projet}/preparation?etape=personnages`);
  await expect(page.getByRole("heading", { level: 2 })).toContainText("Qui est notre héros, et qu");
  await expect(QUESTIONS(page).getByRole("listitem")).toHaveText(["Quel âge a-t-il ? Que sait-il faire ?", "De quoi a-t-il peur ?", "Qui va l’aider, qui va le gêner ?"]);
  await expect(page.getByText(/Lou, 10 ans, fils du dernier passeur du village\./)).toBeHidden();
  await page.getByText("Voir un exemple").click();
  await expect(page.getByText(/Lou, 10 ans, fils du dernier passeur du village\./)).toBeVisible();
  // L'exemple se lit : il n'écrit rien
  await expect(RETENU(page)).toHaveValue("");

  // Une question ajoutée à la main suit les relances, et se supprime ; les relances, non
  await QUESTIONS(page).getByRole("button", { name: "Ajouter une question" }).click();
  await page.getByLabel("Nouvelle question").fill("A-t-il un animal avec lui ?");
  await page.keyboard.press("Enter");
  await expect(QUESTIONS(page).getByRole("listitem").last()).toHaveText("A-t-il un animal avec lui ?");
  await expect(QUESTIONS(page).getByRole("button", { name: /^Supprimer la question/ })).toHaveCount(1);
  await QUESTIONS(page).getByRole("button", { name: "Supprimer la question « A-t-il un animal avec lui ? »" }).click();
  await expect(QUESTIONS(page).getByRole("listitem")).toHaveCount(3);
});

test("F02-AC02, F02-AC07 — l'écran d'aide ouvre la Préparation : rien n'est obligatoire, et la préparation sert de contexte aux aides IA", async ({ page }) => {
  const { compte, base } = await adultePret(page);
  await base.from("enseignants").update({ aides_masquees: [] }).eq("id", compte.id);
  const projet = await semerProjet(base, compte, "classe", "choix", "Les passeurs de brume");
  await aller(page, `/projet/${projet}/preparation`);
  await expect(page.getByRole("heading", { level: 2, name: "Préparation" })).toBeVisible();
  await expect(page.getByText(/Rien n’est obligatoire : remplissez ce qui vous sert, et commencez à écrire quand vous voulez\./)).toBeVisible();
  await page.getByText("Que fait l’IA ici ?").click();
  await expect(page.getByText(/Cette préparation sert aussi aux aides de la suite : consignes, idées de choix, corrections\./)).toBeVisible();
  await expect(page.getByText("Comment le faire avec la classe ?")).toBeVisible();
  await expect(page.getByText("Et « Les choix », « Le jeu » ?")).toBeVisible();
  await expect(RETENU(page)).toHaveCount(0);

  await page.getByLabel("Ne plus afficher").check();
  await page.getByRole("button", { name: "Commencer" }).click();
  await expect(RETENU(page)).toBeVisible();
  await page.context().clearCookies({ name: "aide-preparation" });
  await page.reload();
  await expect(page.getByRole("button", { name: "Commencer" })).toHaveCount(0);
  await page.getByRole("button", { name: "Aide" }).click();
  await expect(page.getByRole("button", { name: "Fermer l’aide" })).toBeVisible();

  // Aides éteintes : l'aide ne parle pas de l'IA (F02-AC02) ; projet personnel en récit classique : ni projection ni « Les choix »
  await base.from("enseignants").update({ reglages_ia: { proposer: false } }).eq("id", compte.id);
  const seul = await semerProjet(base, compte, "personnel", "classique", "Carnet de voyage");
  await aller(page, `/projet/${seul}/preparation`);
  await page.getByRole("button", { name: "Aide" }).click();
  await expect(page.getByText(/On note ce que vous décidez avant d’écrire/)).toBeVisible();
  await expect(page.getByText("Que fait l’IA ici ?")).toHaveCount(0);
  await expect(page.getByText("Comment le faire avec la classe ?")).toHaveCount(0);
  await expect(page.getByText("Et « Les objets » ?")).toBeVisible();
});

test("F02-AC08, F02-AC09, F02-AC10 — Grandes étapes ne montre que les parties, du même plan que « Parties et chapitres »", async ({ page }) => {
  const { projet } = await projetDeClasse(page);
  await aller(page, `/projet/${projet}/preparation?etape=etapes`);
  for (const titre of ["La forêt", "La montagne"]) {
    await page.getByRole("button", { name: "Ajouter une partie" }).click();
    await page.getByLabel("Titre de la nouvelle partie").fill(titre);
    await page.keyboard.press("Enter");
    await expect(page.getByRole("link", { name: new RegExp(titre) })).toBeVisible();
  }
  await expect(page.getByRole("link", { name: /La forêt/ })).toContainText("1 chapitre");
  await expect(etape(page, /Grandes étapes/)).toContainText("fait");

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
  await aller(page, `/projet/${projet}/preparation?etape=etapes`);
  await expect(page.getByRole("link", { name: /La forêt endormie/ })).toBeVisible();

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
    await etape(page, /Grandes étapes/).click();
    await expect(page.getByRole("link", { name: /^Partie \d/ })).toHaveCount(2);
  }
});

test("F02-AC14 — les chapitres et leur résumé se règlent dans « Parties et chapitres » ; F03-AC13 — supprimer une partie depuis la préparation passe par la même corbeille", async ({ page }) => {
  const { base, projet } = await projetDeClasse(page);
  await semerPartie(base, projet, "La forêt", [{ titre: "La lisière", scenes: ["L’entrée du bois"] }, { titre: "Le sanctuaire" }]);
  await base.from("chapitres").update({ resume: "Lou entre dans la forêt et découvre que les chemins bougent." }).eq("titre", "La lisière");
  await aller(page, `/projet/${projet}/preparation?etape=etapes`);
  // Les parties seules : ni chapitre ni résumé ici (décision du 17 octobre 2026)
  await expect(page.getByRole("link", { name: /La forêt/ })).toContainText("2 chapitres");
  await expect(page.getByText("Lou entre dans la forêt")).toHaveCount(0);
  await page.getByRole("link", { name: /La forêt/ }).click();
  await expect(page).toHaveURL(/\/plan/);
  await page.getByLabel("Autres commandes du chapitre La lisière").click();
  await page.getByRole("button", { name: "Réglages" }).click();
  await expect(page.getByLabel(/^Résumé/)).toHaveValue("Lou entre dans la forêt et découvre que les chemins bougent.");
  await page.getByRole("button", { name: "Fermer", exact: true }).last().click();

  await aller(page, `/projet/${projet}/preparation?etape=etapes`);
  await page.getByLabel("Autres commandes de la partie La forêt").click();
  await page.getByRole("button", { name: "Supprimer" }).click();
  await expect(MESSAGE(page)).toContainText("« La forêt » est supprimée.");
  await expect(page.getByText(/Une partie par grand moment de l’histoire/)).toBeVisible();
  await MESSAGE(page).getByRole("button", { name: "Annuler" }).click();
  await expect(page.getByRole("link", { name: /La forêt/ })).toBeVisible();
});

test("F02-AC05, F02-AC11, F02-AC12, F02-AC13 — « Projeter » montre la même étape en grand, sans compte d'élève, et écrit dans la même préparation", async ({ page }) => {
  const { projet } = await projetDeClasse(page);
  await aller(page, `/projet/${projet}/preparation?etape=univers`);
  await page.getByRole("link", { name: "Projeter" }).click();
  await expect(page).toHaveURL(new RegExp(`/atelier/${projet}/univers$`));
  // L'écran projeté n'a ni barre de l'application ni commande d'élève : seul l'enseignant est connecté
  await expect(page.getByRole("navigation", { name: "Espace adulte" })).toHaveCount(0);
  await expect(page.getByRole("heading", { level: 2 })).toContainText("Où se passe notre histoire");
  // Les aides IA s'y voient aussi : la classe suit l'échange (F02-AC12)
  await expect(page.getByRole("button", { name: "Demander une idée à l’IA" })).toBeVisible();

  // On saute à « Personnages » sans avoir rempli « Univers »
  await etape(page, /Personnages/).click();
  await expect(page).toHaveURL(new RegExp(`/atelier/${projet}/personnages$`));
  await RETENU(page).fill("Lou, 10 ans, fils du dernier passeur.");
  await RETENU(page).blur();
  await expect(page.getByText("Enregistré", { exact: true })).toBeVisible();
  await IDEES(page).getByRole("button", { name: "Noter une idée" }).click();
  await page.getByLabel("Nouvelle idée").fill("Une chouette qui ne parle qu’aux enfants");
  await page.keyboard.press("Enter");
  await expect(IDEES(page).getByText("Une chouette qui ne parle qu’aux enfants")).toBeVisible();

  // L'atelier s'interrompt ; au retour, la préparation a ces décisions, sans transfert ni ressaisie
  await page.getByRole("link", { name: "Quitter la projection" }).first().click();
  await expect(page).toHaveURL(new RegExp(`/projet/${projet}/preparation\\?etape=personnages$`));
  await expect(RETENU(page)).toHaveValue("Lou, 10 ans, fils du dernier passeur.");
  await expect(IDEES(page).getByText("Une chouette qui ne parle qu’aux enfants")).toBeVisible();
});

test("F02-AC17 — une idée écartée reste dans l'étape, repliée, hors du texte retenu, et se remet à discuter", async ({ page }) => {
  const { projet } = await projetDeClasse(page);
  await aller(page, `/projet/${projet}/preparation?etape=personnages`);
  for (const idee of ["Lou, fils du dernier passeur", "Des jumeaux inséparables"]) {
    await IDEES(page).getByRole("button", { name: "Noter une idée" }).click();
    await page.getByLabel("Nouvelle idée").fill(idee);
    await page.keyboard.press("Enter");
    await expect(IDEES(page).getByText(idee, { exact: true })).toBeVisible();
  }
  await IDEES(page).getByRole("button", { name: "Retenir « Lou, fils du dernier passeur »" }).click();
  await expect(IDEES(page).getByRole("button", { name: "Ne plus retenir « Lou, fils du dernier passeur »" })).toHaveAttribute("aria-pressed", "true");
  await IDEES(page).getByRole("button", { name: "Écarter « Des jumeaux inséparables »" }).click();
  await expect(IDEES(page).getByText("Idées écartées · 1")).toBeVisible();

  await page.reload();
  await expect(IDEES(page).getByText("Des jumeaux inséparables", { exact: true })).toBeHidden();
  await IDEES(page).getByText("Idées écartées · 1").click();
  await expect(IDEES(page).getByText("Des jumeaux inséparables", { exact: true })).toBeVisible();
  await expect(RETENU(page)).toHaveValue("");
  await IDEES(page).getByRole("button", { name: "Remettre « Des jumeaux inséparables » à discuter" }).click();
  await expect(IDEES(page).getByText("Idées écartées · 1")).toHaveCount(0);
  await expect(IDEES(page).getByRole("button", { name: "Retenir « Des jumeaux inséparables »" })).toBeVisible();
});

test("F13-AC19 — une idée de l'IA arrive « à discuter », marquée ✦ ; « Orienter l'IA » s'ouvre avant la première demande, et la réserve livre une idée par clic, sans nouvel appel", async ({ page }) => {
  const { compte, projet } = await projetDeClasse(page);
  await aller(page, `/projet/${projet}/preparation?etape=personnages`);
  // Premier clic : le champ d'orientation, le curseur dedans ; rien n'est encore demandé
  await IDEES(page).getByRole("button", { name: "Demander une idée à l’IA" }).click();
  await expect(page.getByRole("textbox", { name: /Orienter l’IA/ })).toBeFocused();
  expect(await appels(compte.id)).toEqual([]);
  await page.getByRole("textbox", { name: /Orienter l’IA/ }).fill("un compagnon animal");
  await page.getByRole("button", { name: "Proposer une idée" }).click();
  const idee = IDEES(page).getByRole("listitem").filter({ hasText: "Il parle aux chouettes" });
  await expect(idee).toBeVisible();
  await expect(idee).toContainText("proposée par l’IA");
  await expect(idee).toContainText("à discuter");
  await expect.poll(async () => (await sql("select texte, etat, origine from pistes where projet_id = $1", [projet]))).toEqual([{ texte: "Il parle aux chouettes", etat: "discuter", origine: "ia" }]);
  // L'orientation se garde avec l'étape
  await expect.poll(async () => (await sql<{ o: unknown }>("select orientations o from preparations where projet_id = $1", [projet]))[0].o).toEqual({ personnages: "un compagnon animal" });

  // Le clic suivant prend la suivante de la réserve : pas d'autre appel
  await IDEES(page).getByRole("button", { name: "Demander une idée à l’IA" }).click();
  await expect(IDEES(page).getByText("Une cicatrice en forme d’étoile sur la main")).toBeVisible();
  expect(await appels(compte.id)).toEqual(["idees"]);

  // L'adulte la retient, l'écarte ou la supprime, comme toute idée
  await IDEES(page).getByRole("button", { name: "Retenir « Il parle aux chouettes »" }).click();
  await expect(IDEES(page).getByRole("button", { name: "Ne plus retenir « Il parle aux chouettes »" })).toBeVisible();
  await IDEES(page).getByRole("button", { name: "Supprimer l’idée « Une cicatrice en forme d’étoile sur la main »" }).click();
  await expect(IDEES(page).getByText("Une cicatrice en forme d’étoile sur la main")).toHaveCount(0);
});

test("F13-AC14 — retenir une idée jette la réserve des questions : la question suivante vient d'une nouvelle demande", async ({ page }) => {
  const { compte, base, projet } = await projetDeClasse(page);
  await base.from("pistes").insert({ projet_id: projet, enseignant_id: compte.id, rubrique: "personnages", texte: "il ne peut pas voler" });
  await base.from("preparations").update({ orientations: { personnages: "rien de magique" } }).eq("projet_id", projet);
  await aller(page, `/projet/${projet}/preparation?etape=personnages`);
  // Une orientation déjà gardée : le champ est ouvert, le ✦ demande aussitôt
  await expect(page.getByRole("textbox", { name: /Orienter l’IA/ })).toHaveValue("rien de magique");
  await QUESTIONS(page).getByRole("button", { name: "Demander une question à l’IA" }).click();
  await expect(QUESTIONS(page).getByText(/le rend différent des autres/)).toBeVisible();
  expect(await appels(compte.id)).toEqual(["questions"]);
  await expect.poll(async () => (await sql("select origine from questions where projet_id = $1", [projet]))).toEqual([{ origine: "ia" }]);

  await IDEES(page).getByRole("button", { name: "Retenir « il ne peut pas voler »" }).click();
  await expect(IDEES(page).getByRole("button", { name: "Ne plus retenir « il ne peut pas voler »" })).toBeVisible();
  await QUESTIONS(page).getByRole("button", { name: "Demander une question à l’IA" }).click();
  await expect(QUESTIONS(page).getByText("Que fait-il quand il a très peur ?")).toBeVisible();
  await expect.poll(() => appels(compte.id)).toEqual(["questions", "questions"]);
});

test("F13-AC12, F13-AC13 — « Rédiger d'après les idées » propose un texte : rien ne change avant « Utiliser ce texte », qui met le texte retouché, sans rien créer d'autre", async ({ page }) => {
  const { compte, base, projet } = await projetDeClasse(page);
  await base.from("preparations").update({ personnages: "Lou, 10 ans." }).eq("projet_id", projet);
  await base.from("pistes").insert({ projet_id: projet, enseignant_id: compte.id, rubrique: "personnages", texte: "Il connaît le chant des lanternes", etat: "retenue" });
  await aller(page, `/projet/${projet}/preparation?etape=personnages`);
  await page.getByRole("button", { name: "Rédiger d’après les idées" }).click();
  const propose = page.getByRole("textbox", { name: "Texte proposé" });
  await expect(propose).toHaveValue("Lou, 10 ans.\nIl connaît le chant des lanternes");
  // F13-AC12 : le texte retenu n'a pas changé
  await expect(RETENU(page)).toHaveValue("Lou, 10 ans.");
  expect((await sql("select personnages from preparations where projet_id = $1", [projet]))[0].personnages).toBe("Lou, 10 ans.");
  // « Laisser » ne change rien
  await page.getByRole("button", { name: "Laisser" }).click();
  await expect(propose).toHaveCount(0);
  await expect(RETENU(page)).toHaveValue("Lou, 10 ans.");

  // F13-AC13 : la proposition retouchée devient le texte retenu, et rien d'autre ne se crée
  await page.getByRole("button", { name: "Rédiger d’après les idées" }).click();
  await propose.fill("Lou, 10 ans, connaît le chant des lanternes.");
  await page.getByRole("button", { name: "Utiliser ce texte" }).click();
  await expect(RETENU(page)).toHaveValue("Lou, 10 ans, connaît le chant des lanternes.");
  await expect(MESSAGE(page)).toContainText("Le texte retenu est remplacé.");
  await expect.poll(async () => (await sql("select personnages from preparations where projet_id = $1", [projet]))[0].personnages).toBe("Lou, 10 ans, connaît le chant des lanternes.");
  expect(await sql("select 1 from parties where projet_id = $1 union all select 1 from scenes where projet_id = $1", [projet])).toEqual([]);
  // « Annuler » rend le texte d'avant
  await MESSAGE(page).getByRole("button", { name: "Annuler" }).click();
  await expect(RETENU(page)).toHaveValue("Lou, 10 ans.");
});

test("aides éteintes dans « Mon compte » : aucun ✦, les boutons doubles redeviennent simples, ni orientation ni « Rédiger »", async ({ page }) => {
  const { compte, base, projet } = await projetDeClasse(page);
  await base.from("enseignants").update({ reglages_ia: { proposer: false } }).eq("id", compte.id);
  await base.from("questions").insert({ projet_id: projet, enseignant_id: compte.id, etape: "personnages", texte: "Que fait-il quand il a très peur ?", origine: "ia" });
  await aller(page, `/projet/${projet}/preparation?etape=personnages`);
  await expect(page.getByRole("button", { name: "Noter une idée" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Ajouter une question" })).toBeVisible();
  await expect(page.getByRole("button", { name: /à l’IA/ })).toHaveCount(0);
  await expect(page.getByText("Orienter l’IA")).toHaveCount(0);
  // Une question venue de l'IA perd son ✦ : aucun signe d'IA quand les aides sont éteintes
  await expect(QUESTIONS(page).getByText("proposée par l’IA")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Rédiger d’après les idées" })).toHaveCount(0);
  // Sans IA, les idées retenues se reprennent dans le texte d'un clic, et s'annulent
  await IDEES(page).getByRole("button", { name: "Noter une idée" }).click();
  await page.getByLabel("Nouvelle idée").fill("Lou, fils du dernier passeur");
  await page.keyboard.press("Enter");
  await IDEES(page).getByRole("button", { name: "Retenir « Lou, fils du dernier passeur »" }).click();
  await RETENU(page).fill("Il a dix ans.");
  await page.getByRole("button", { name: "Reprendre les idées retenues" }).click();
  await expect(RETENU(page)).toHaveValue("Il a dix ans.\nLou, fils du dernier passeur");
  await expect(page.getByRole("button", { name: "Reprendre les idées retenues" })).toHaveCount(0);
  await expect.poll(async () => (await sql("select personnages from preparations where projet_id = $1", [projet]))[0].personnages).toBe("Il a dix ans.\nLou, fils du dernier passeur");
});

test("F02-AC19 — en projet personnel, la préparation parle à l'auteur, dit « Je retiens… » et ne propose pas de projeter", async ({ page }) => {
  const { compte, base } = await adultePret(page);
  const projet = await semerProjet(base, compte, "personnel", "choix", "Mon histoire");
  await aller(page, `/projet/${projet}/preparation?etape=personnages`);
  await expect(page.getByRole("heading", { level: 2 })).toContainText("Qui est votre héros");
  await expect(page.getByRole("heading", { name: "Questions pour vous" })).toBeVisible();
  await expect(RETENU(page, "Je retiens…")).toBeVisible();
  await expect(page.getByText("Nous retenons…")).toHaveCount(0);
  await expect(page.getByRole("link", { name: /Projeter/ })).toHaveCount(0);
  // La projection n'existe pas pour un projet personnel, même par son adresse
  const reponse = await page.goto(`/atelier/${projet}/univers`);
  expect(reponse?.status()).toBe(404);
});

test("F02-AC20 — en récit classique, « Grandes étapes » demande le déroulement, et la préparation n'a ni jeu ni phrases de choix", async ({ page }) => {
  const { projet } = await projetDeClasse(page, "classique");
  await aller(page, `/projet/${projet}/preparation?etape=etapes`);
  await expect(page.getByRole("heading", { level: 2 })).toContainText("Que se passe-t-il, du début à la fin");
  await expect(LIGNE(page).locator("ol").getByRole("link", { name: /Les choix/ })).toHaveCount(0);
  await etape(page, /Les objets/).click();
  await expect(page.getByRole("region", { name: "Objets de l’histoire", exact: true })).toBeVisible();
  for (const absent of ["Formules d’action", "Feuille d’aventure", "Règles du jeu", "Dé de la feuille"]) await expect(page.getByText(absent)).toHaveCount(0);
  // « Les choix » n'existe pas par son adresse : la page s'ouvre sur une étape de l'histoire
  await aller(page, `/projet/${projet}/preparation?etape=choix`);
  await expect(etape(page, /Univers/)).toHaveAttribute("aria-current", "step");
});

test("F04.2 — l'étape « Le jeu » réunit les objets, les formules d'action, la feuille d'aventure, le dé et les règles du jeu", async ({ page }) => {
  const { base, projet } = await projetDeClasse(page);
  await aller(page, `/projet/${projet}/preparation?etape=jeu`);
  const jeu = page.getByRole("region", { name: "Objets et formules" });

  await jeu.getByLabel("Nouvel objet").fill("la lanterne sourde");
  await jeu.getByLabel("Description", { exact: true }).fill("Éclaire sans être vue.");
  await jeu.getByRole("button", { name: "Ajouter" }).first().click();
  await expect(jeu.getByText("la lanterne sourde")).toBeVisible();
  await jeu.getByLabel("Nouvelle formule").fill("Retire un point de volonté à ton héros.");
  await jeu.getByRole("button", { name: "Ajouter" }).nth(1).click();
  await expect(jeu.getByText("Retire un point de volonté à ton héros.")).toBeVisible();
  // F04-AC41 — une formule porte son signe : le crayon par défaut, le dé choisi à l'ajout, changé ensuite
  await jeu.getByLabel("Nouvelle formule").fill("Lance le dé.");
  await jeu.getByRole("radiogroup", { name: "Signe de la formule à ajouter" }).getByRole("radio", { name: /^Dé/ }).click();
  await jeu.getByRole("button", { name: "Ajouter" }).nth(1).click();
  await expect(jeu.getByText("Lance le dé.")).toBeVisible();
  const signes = async () => (await base.from("formules").select("texte, signe").eq("projet_id", projet).order("cree_le")).data;
  await expect.poll(signes).toEqual([{ texte: "Retire un point de volonté à ton héros.", signe: "crayon" }, { texte: "Lance le dé.", signe: "de" }]);
  await expect(jeu.getByRole("radiogroup", { name: "Signe de la formule à ajouter" }).getByRole("radio", { name: /^Crayon/ })).toBeChecked();
  await jeu.getByRole("button", { name: "Modifier la formule « Retire un point de volonté à ton héros. »" }).click();
  await jeu.getByRole("radiogroup", { name: "Signe devant la formule" }).getByRole("radio", { name: /^Cœur/ }).click();
  await jeu.getByRole("button", { name: "Enregistrer" }).click();
  await expect.poll(signes).toEqual([{ texte: "Retire un point de volonté à ton héros.", signe: "coeur" }, { texte: "Lance le dé.", signe: "de" }]);

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

test("F05, F11.5 — l'étape « Les choix » : une seule liste de phrases à cocher, la façon d'annoncer le numéro, la marque de fin", async ({ page }) => {
  const { base, projet } = await projetDeClasse(page);
  await aller(page, `/projet/${projet}/preparation?etape=choix`);
  const phrases = page.getByRole("region", { name: "Phrases de choix" });
  await expect(phrases.getByRole("radio", { name: "« rends-toi au 12 »" })).toBeChecked();
  const cases = phrases.getByRole("checkbox");
  await expect(cases).toHaveCount(4);
  await expect(phrases.getByRole("checkbox", { name: /Plonger la main : rends-toi au 17\./ })).toBeDisabled();
  await expect(phrases.getByRole("checkbox", { name: /Plonger la main : rends-toi au 17\./ })).toBeChecked();

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
