import { expect, test, type Page } from "@playwright/test";
import { MESSAGES_IA } from "@/domaine/aides-ia";
import { aller, classeQuiEcrit, copie, ecrire, FICHE, MESSAGE, posteDe, semerTexte, sql, supprimerComptes, type Situation, ouvrirLeMenuDuCompte } from "./outils";

/**
 * Étape 8 du plan, lot 9 : l'essai de bout en bout des aides IA, sur la réponse simulée
 * (IA_SIMULEE). Mme Laurent prépare, organise et fait écrire la classe avec les aides ; puis
 * le même trajet, aides éteintes ; puis un fournisseur en panne, et un site sans les clés.
 * Chaque aide a ses propres tests ; ceux-ci disent que l'enchaînement tient, et que
 * l'application reste entièrement utilisable sans elles (plan, « Terminée quand »).
 */

test.afterEach(async ({ request }) => {
  await request.post("/ia/simulation", { data: { mode: null } });
  await supprimerComptes();
});

const DRAGON = "Le dragon dormé dans la grote. Il était très très grand.";
const BARRE = (page: Page) => page.getByRole("toolbar", { name: "Outils de la copie" });
const CREER = (page: Page) => page.getByRole("region", { name: "Créer une image" });
const IDEES = (page: Page) => page.getByRole("region", { name: "Idées", exact: true });
const RETENU = (page: Page) => page.getByRole("textbox", { name: "Nous retenons…", exact: true });
const CONSIGNE = (page: Page) => page.getByRole("textbox", { name: "Consigne", exact: true });
const decision = (page: Page) => page.locator(".carnet-fiche--decision");
const tamponEleve = (page: Page) => page.locator("header .tampon");
const tamponAdulte = (page: Page) => page.locator("summary.tampon--menu");
const mesScenes = (page: Page) => page.getByRole("region", { name: "Les scènes dont tu t’occupes" }).getByRole("listitem");
const aidesAppelees = async (compte: string) =>
  (await sql<{ aide: string }>("select distinct aide from appels_ia where enseignant_id = $1 order by aide", [compte])).map((a) => a.aide);
/** Aucun signe de l'IA sur la page : ni bouton ✦, ni « à l'IA », ni « Orienter l'IA » */
async function sansIa(page: Page): Promise<void> {
  await expect(page.locator(".btn--ia")).toHaveCount(0);
  await expect(page.getByRole("button", { name: /l’IA/ })).toHaveCount(0);
  await expect(page.getByText("Orienter l’IA")).toHaveCount(0);
}

async function ouvrirMonCompte(page: Page): Promise<void> {
  await ouvrirLeMenuDuCompte(page);
  await page.getByRole("link", { name: "Mon compte" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Mon compte" })).toBeVisible();
}

/** Alice prend S001 depuis son chapitre, l'écrit et la remet. */
async function aliceEcritEtRemet(alice: Page, s: Situation, texte: string, avantDeRemettre?: () => Promise<void>): Promise<void> {
  await aller(alice, `/travail/chapitre/${s.lisiere.id}`);
  await alice.getByLabel("Choisir S001 pour m’en occuper").check();
  await alice.getByRole("region", { name: "Sélection" }).getByRole("button", { name: "Je m’en occupe" }).click();
  await expect(MESSAGE(alice)).toContainText("Tu t’occupes maintenant de S001.");
  await aller(alice, `/travail/scene/${s.lisiere.scenes[0]}`);
  await ecrire(alice, texte);
  await avantDeRemettre?.();
  await alice.getByRole("button", { name: "Remettre à Mme Laurent" }).click();
  await expect(tamponEleve(alice)).toHaveText("À valider");
}

/** Alice lit la remarque de reprise, complète son texte et le remet. */
async function aliceReprend(alice: Page, remarqueAttendue: string, ajout: string): Promise<void> {
  await aller(alice, "/travail");
  await mesScenes(alice).first().getByRole("link", { name: /^Reprendre mon texte/ }).click();
  const remarque = alice.getByRole("region", { name: "Mme Laurent te demande de reprendre ton texte" });
  await expect(remarque).toContainText(remarqueAttendue);
  await remarque.getByRole("button", { name: "J’ai lu, j’écris" }).click();
  await ecrire(alice, ajout);
  await alice.getByRole("button", { name: "Remettre à Mme Laurent" }).click();
  await expect(tamponEleve(alice)).toHaveText("À valider");
}

test("Étape 8, avec les aides — préparer, organiser, formuler, corriger, relancer, titrer, relier et illustrer, de la Préparation au livre", async ({ page, browser, context }) => {
  test.setTimeout(300_000);
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  const s = await classeQuiEcrit(page, ["Alice", "Bilal"]);
  const [sentier] = s.lisiere.scenes;

  // ——— La Préparation : une idée de l'IA retenue, puis le texte rédigé d'après elle ———
  await aller(page, `/projet/${s.projet}/preparation?etape=personnages`);
  await IDEES(page).getByRole("button", { name: "Demander une idée à l’IA" }).click();
  await page.getByRole("textbox", { name: /Orienter l’IA/ }).fill("un compagnon animal");
  await page.getByRole("button", { name: "Proposer une idée" }).click();
  await expect(IDEES(page).getByText("Il parle aux chouettes")).toBeVisible();
  await IDEES(page).getByRole("button", { name: "Retenir « Il parle aux chouettes »" }).click();
  // L'idée retenue s'enregistre avant qu'on demande le texte : le serveur rédige d'après la base
  await expect.poll(async () => (await sql<{ etat: string }>("select etat from public.pistes where projet_id = $1 and texte like 'Il parle aux chouettes%'", [s.projet]))[0]?.etat).toBe("retenue");
  await page.getByRole("button", { name: "Rédiger d’après les idées" }).click();
  await expect(page.getByRole("textbox", { name: "Texte proposé" })).toHaveValue(/Il parle aux chouettes/);
  await page.getByRole("button", { name: "Utiliser ce texte" }).click();
  await expect(RETENU(page)).toHaveValue(/Il parle aux chouettes/);

  // ——— Parties et chapitres : un chapitre proposé, ajouté, qui reçoit son image d'office ———
  await aller(page, `/projet/${s.projet}/plan`);
  await page.getByRole("button", { name: "Demander des chapitres à l’IA pour « La forêt »" }).click();
  const espace = page.getByRole("group", { name: "Chapitres proposés pour « La forêt »" });
  await espace.getByRole("button", { name: "Proposer des chapitres" }).click();
  await expect(espace.getByText("Image créée à l’ajout")).toBeVisible();
  await espace.getByRole("button", { name: "Ajouter ce chapitre" }).click();
  await expect(MESSAGE(page)).toContainText("« Le gué des saules » est ajouté à la fin de « La forêt ».");
  await expect.poll(async () => (await sql<{ image_id: string | null }>("select c.image_id from chapitres c join parties p on p.id = c.partie_id where p.projet_id = $1 and c.titre = 'Le gué des saules'", [s.projet]))[0]?.image_id, { timeout: 20_000 }).not.toBeNull();
  await page.keyboard.press("Escape");

  // ——— La scène S001 : une consigne formulée d'après l'indication ———
  await aller(page, `/projet/${s.projet}/scene/${sentier}`);
  await CONSIGNE(page).fill("Lou découvre le dragon endormi");
  await page.getByRole("button", { name: "Formuler" }).click();
  await expect(page.getByRole("textbox", { name: "Consigne proposée" })).toHaveValue(/Décris :/);
  await page.getByRole("button", { name: "Utiliser" }).click();
  await expect(MESSAGE(page)).toContainText("Consigne remplacée.");
  await expect.poll(async () => (await sql<{ consigne: string }>("select consigne from scenes where id = $1", [sentier]))[0].consigne).toContain("Décris :");

  // ——— Alice écrit, note son idée d'image, remet ———
  const alice = await posteDe(browser, s, "Alice");
  await aliceEcritEtRemet(alice.page, s, DRAGON, async () => {
    // Côté élève, aucune commande d'IA : seulement son idée d'image (F10.2)
    await expect(alice.page.locator(".btn--ia")).toHaveCount(0);
    const idee = alice.page.locator("details", { hasText: "Mon idée d’image" });
    await idee.locator("summary").click();
    await idee.getByRole("textbox").fill("le dragon qui dort sur un tas de cristaux");
    await idee.getByRole("textbox").blur();
    await expect(idee.getByText("Enregistrée.")).toBeVisible();
  });

  // ——— Mme Laurent corrige au degré 1, garde, puis demande une reprise avec des pistes ———
  await aller(page, `/projet/${s.projet}/scene/${sentier}`);
  await expect(decision(page)).toContainText("Alice a remis ce texte");
  await page.locator(".corriger summary").click();
  await page.getByRole("menuitemradio", { name: /^Degré 1 ·/ }).click();
  await page.getByRole("button", { name: "Corriger", exact: true }).click();
  await expect(page.locator("button.corr")).toHaveCount(2);
  await page.getByRole("button", { name: "Garder les changements" }).click();
  await expect(MESSAGE(page)).toContainText("2 changements gardés.");
  await expect(copie(page)).toContainText("Le dragon dormait dans la grotte.");
  await decision(page).getByRole("button", { name: "Demander une reprise…" }).click();
  await page.getByRole("button", { name: "Proposer des pistes" }).click();
  await expect(page.getByLabel(/^Remarque pour Alice/)).toHaveValue(/Dis ce que tu vois en arrivant\./);
  await decision(page).getByRole("button", { name: "Demander la reprise" }).click();
  await expect(tamponAdulte(page)).toContainText("À reprendre");

  // ——— Alice lit les pistes, reprend son texte corrigé, remet ———
  await aliceReprend(alice.page, "Dis ce que tu vois en arrivant.", " Ses écailles brillaient comme des braises.");
  await expect(alice.page.locator(".copie__texte")).toContainText("Le dragon dormait dans la grotte.");
  await alice.contexte.close();

  // ——— Mme Laurent valide, choisit un titre, ajoute un choix proposé, crée l'image de la scène ———
  await aller(page, `/projet/${s.projet}/scene/${sentier}`);
  await decision(page).getByRole("button", { name: "Valider le travail élève" }).click();
  await expect(tamponAdulte(page)).toContainText("Validé");
  await page.getByRole("button", { name: "Proposer des titres" }).click();
  await page.getByRole("group", { name: "Titres proposés" }).getByRole("button", { name: "La lanterne qui tremble" }).click();
  await expect(page.getByRole("textbox", { name: "Titre de la scène" })).toHaveValue("La lanterne qui tremble");

  await page.getByRole("button", { name: "Idées de choix" }).click();
  const choix = page.getByRole("region", { name: "Idées de choix" });
  await choix.getByRole("button", { name: "Proposer des idées" }).click();
  await choix.getByRole("listitem").nth(0).getByRole("checkbox").check();
  await choix.getByRole("button", { name: /^Ajouter/ }).click();
  await expect(page.locator(".copie__message")).toContainText("1 scène créée dans le chapitre : « Nouvelle scène 1 »");
  await expect.poll(async () => (await sql("select 1 from liens where scene_id = $1", [sentier])).length).toBe(1);

  await copie(page).click();
  await BARRE(page).getByRole("button", { name: "Image" }).click();
  await FICHE(page).getByRole("button", { name: "Créer une image" }).click();
  // L'idée d'Alice est là, prête à servir
  await expect(CREER(page).getByLabel("Ce que montre l’image")).toHaveValue("le dragon qui dort sur un tas de cristaux");
  await CREER(page).getByRole("button", { name: "Créer l’image" }).click();
  const proposition = CREER(page).getByRole("group", { name: /Proposition/ });
  await expect(proposition.getByRole("img")).toHaveCount(1);
  await proposition.getByRole("button", { name: "Garder" }).click();
  await expect(copie(page).locator(".image-bloc")).toHaveCount(1);
  // Le texte d'Alice, corrigé et complété, reste ; la scène reste validée et à son prénom
  expect((await sql<{ etat: string; prise_par_eleve: string }>("select etat, prise_par_eleve from scenes where id = $1", [sentier]))[0])
    .toEqual({ etat: "valide", prise_par_eleve: s.eleves.Alice.id });

  // ——— Le livre : le prompt de la couverture ———
  await sql("update projets set mise_en_page_ouverte_le = now(), livre_relu_le = now(), chemins_verifies_le = now(), mise_en_page_convient_le = now(), imprimer_ouvert_le = now() where id = $1", [s.projet]);
  await aller(page, `/projet/${s.projet}/livre?etape=sortie`);
  const couverture = page.locator("aside.couverture");
  await couverture.getByLabel("Ce que montre la couverture").fill("le dragon et Lou au bord du lac");
  await couverture.getByRole("button", { name: "Proposer la description" }).click();
  await expect(couverture.getByLabel("Ce que montre la couverture")).toHaveValue(/le dragon et Lou au bord du lac, dans une lumière/);
  await couverture.getByRole("button", { name: "Copier le prompt" }).click();
  await expect(MESSAGE(page)).toContainText("Prompt copié");
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain("Illustration de couverture");

  // Chaque aide du trajet est passée au journal, sans son contenu, et rien n'a été payé
  expect(await aidesAppelees(s.compte.id)).toEqual(
    ["chapitres", "consigne", "correction", "description-image", "idees", "idees-choix", "image-ajout", "image-scene", "pistes", "retenons", "titre"],
  );
  expect(await sql("select 1 from appels_ia where enseignant_id = $1 and (fournisseur <> 'simule' or cout_usd <> 0)", [s.compte.id])).toEqual([]);
});

test("Étape 8, sans les aides — éteintes dans « Mon compte », tout le trajet se fait à la main, sans un seul signe de l'IA, et rien ne part", async ({ page, browser, context }) => {
  test.setTimeout(240_000);
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  const s = await classeQuiEcrit(page, ["Alice", "Bilal"]);
  const [sentier] = s.lisiere.scenes;
  await ouvrirMonCompte(page);
  await page.getByText("Proposer les aides IA", { exact: true }).click();
  await expect(page.getByText("Aucune aide IA dans vos projets. Tout le reste fonctionne.")).toBeVisible();
  await expect(page.getByText("Enregistré")).toBeVisible();

  // ——— La Préparation à la main : une idée notée, retenue, reprise dans le texte ———
  await aller(page, `/projet/${s.projet}/preparation?etape=personnages`);
  await sansIa(page);
  await IDEES(page).getByRole("button", { name: "Noter une idée" }).click();
  await page.getByLabel("Nouvelle idée").fill("Il parle aux chouettes");
  await page.keyboard.press("Enter");
  await IDEES(page).getByRole("button", { name: "Retenir « Il parle aux chouettes »" }).click();
  await page.getByRole("button", { name: "Reprendre les idées retenues" }).click();
  await expect(RETENU(page)).toHaveValue("Il parle aux chouettes");

  // ——— Un chapitre ajouté à la main, sans image d'office ———
  await aller(page, `/projet/${s.projet}/plan`);
  await sansIa(page);
  await page.getByRole("button", { name: "Ajouter un chapitre" }).first().click();
  await expect(page.getByRole("heading", { name: "Réglages du chapitre" })).toBeVisible();
  await page.keyboard.type("Le gué des saules");
  await expect(page.getByRole("button", { name: /Proposer un/ })).toHaveCount(0);
  await page.getByLabel("Titre").blur();
  await expect(page.getByText("Enregistré")).toBeVisible();
  await page.getByRole("button", { name: "Fermer", exact: true }).last().click();
  await expect(page.getByRole("link", { name: "Ouvrir Le gué des saules" })).toBeVisible();

  // ——— La consigne écrite à la main ———
  await aller(page, `/projet/${s.projet}/scene/${sentier}`);
  await sansIa(page);
  await expect(page.getByRole("button", { name: "Formuler" })).toHaveCount(0);
  await CONSIGNE(page).fill("Lou découvre le dragon endormi. Décris la grotte.");
  await CONSIGNE(page).blur();
  await expect.poll(async () => (await sql<{ consigne: string }>("select consigne from scenes where id = $1", [sentier]))[0].consigne).toBe("Lou découvre le dragon endormi. Décris la grotte.");

  // ——— Alice écrit et remet ; Mme Laurent relit et demande une reprise, sa remarque à la main ———
  const alice = await posteDe(browser, s, "Alice");
  await aliceEcritEtRemet(alice.page, s, DRAGON);
  await aller(page, `/projet/${s.projet}/scene/${sentier}`);
  await expect(decision(page)).toContainText("Alice a remis ce texte");
  await expect(page.getByRole("button", { name: /Corriger/ })).toHaveCount(0);
  await decision(page).getByRole("button", { name: "Demander une reprise…" }).click();
  await expect(page.getByRole("button", { name: "Proposer des pistes" })).toHaveCount(0);
  await page.getByLabel(/^Remarque pour Alice/).fill("Attention à « dormait » et à « grotte ». Dis ce que Lou entend.");
  await decision(page).getByRole("button", { name: "Demander la reprise" }).click();
  await expect(tamponAdulte(page)).toContainText("À reprendre");
  await aliceReprend(alice.page, "Dis ce que Lou entend.", " Un souffle chaud sortait de ses naseaux.");
  await alice.contexte.close();

  // ——— Validée, titrée et illustrée à la main : le prompt se copie, rien ne se crée ———
  await aller(page, `/projet/${s.projet}/scene/${sentier}`);
  await decision(page).getByRole("button", { name: "Valider le travail élève" }).click();
  await expect(tamponAdulte(page)).toContainText("Validé");
  await expect(page.getByRole("button", { name: "Proposer des titres" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Idées de choix" })).toHaveCount(0);
  await page.getByRole("textbox", { name: "Titre de la scène" }).fill("Le dragon endormi");
  await page.getByRole("textbox", { name: "Titre de la scène" }).blur();
  await expect.poll(async () => (await sql<{ titre: string }>("select titre from scenes where id = $1", [sentier]))[0].titre).toBe("Le dragon endormi");
  await copie(page).click();
  await BARRE(page).getByRole("button", { name: "Image" }).click();
  await FICHE(page).getByRole("button", { name: "Préparer le prompt d’une image" }).click();
  await expect(CREER(page).locator(".btn--ia")).toHaveCount(0);
  await CREER(page).getByLabel("Ce que montre l’image").fill("le dragon endormi dans la grotte");
  await CREER(page).getByRole("button", { name: "Copier le prompt" }).click();
  await expect(MESSAGE(page)).toContainText("Prompt copié");
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain("le dragon endormi dans la grotte");

  // ——— Le livre s'ouvre et se compose sans elles ———
  await sql("update projets set mise_en_page_ouverte_le = now(), livre_relu_le = now(), chemins_verifies_le = now(), mise_en_page_convient_le = now(), imprimer_ouvert_le = now() where id = $1", [s.projet]);
  await aller(page, `/projet/${s.projet}/livre?etape=sortie`);
  await sansIa(page);
  await expect(page.locator("aside.couverture").getByRole("button", { name: "Copier le prompt" })).toBeVisible();
  await expect(page.locator("aside.couverture").getByRole("button", { name: "Créer la couverture" })).toHaveCount(0);

  // Rien n'est parti chez un fournisseur
  expect(await aidesAppelees(s.compte.id)).toEqual([]);
});

test("Étape 8, fournisseur en panne ou clés absentes — l'aide le dit d'une phrase, rien ne change, et le travail continue", async ({ page, request }) => {
  const s = await classeQuiEcrit(page, ["Alice", "Bilal"]);
  const [sentier] = s.lisiere.scenes;
  await semerTexte(s.base, sentier, [DRAGON]);

  // Panne : une réponse inutilisable
  await request.post("/ia/simulation", { data: { mode: "echec" } });
  await aller(page, `/projet/${s.projet}/scene/${sentier}`);
  await CONSIGNE(page).fill("Lou découvre le dragon endormi");
  await page.getByRole("button", { name: "Formuler" }).click();
  await expect(page.getByText(MESSAGES_IA.pasDeReponse).first()).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Consigne proposée" })).toHaveCount(0);
  await expect(CONSIGNE(page)).toHaveValue("Lou découvre le dragon endormi");
  await page.getByRole("button", { name: "Corriger", exact: true }).click();
  await expect(page.getByText(MESSAGES_IA.pasDeReponse).first()).toBeVisible();
  await expect(page.locator("button.corr")).toHaveCount(0);
  // La copie reste ouverte : on écrit, on enregistre
  await ecrire(page, " Lou recule d’un pas.");
  await expect.poll(async () => JSON.stringify((await sql("select texte from scenes where id = $1", [sentier]))[0])).toContain("Lou recule d’un pas.");
  expect((await sql<{ issue: string }>("select issue from appels_ia where enseignant_id = $1", [s.compte.id])).map((a) => a.issue)).toEqual(["echec", "echec"]);

  // Un site sans les clés du fournisseur : la phrase le dit, et rien ne compte dans les plafonds
  await sql("delete from appels_ia where enseignant_id = $1", [s.compte.id]);
  await request.post("/ia/simulation", { data: { mode: "sans-cle" } });
  await page.reload();
  await page.getByRole("button", { name: "Formuler" }).click();
  await expect(page.getByText(MESSAGES_IA.absentes).first()).toBeVisible();
  await page.getByRole("button", { name: "Proposer des titres" }).click();
  await expect(page.getByText(MESSAGES_IA.absentes).first()).toBeVisible();
  expect(await sql("select 1 from appels_ia where enseignant_id = $1", [s.compte.id])).toEqual([]);
  await page.getByRole("textbox", { name: "Titre de la scène" }).fill("Le dragon endormi");
  await page.getByRole("textbox", { name: "Titre de la scène" }).blur();
  await expect.poll(async () => (await sql<{ titre: string }>("select titre from scenes where id = $1", [sentier]))[0].titre).toBe("Le dragon endormi");
});
