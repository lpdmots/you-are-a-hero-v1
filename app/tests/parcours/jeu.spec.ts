import { expect, test, type Page } from "@playwright/test";
import {
  action, adultePret, aller, attendreEnBase, attendreEnregistre, BANDEAU, blocsEditeur, classeQuiEcrit, copie, copiesGardees, ecrire, enClair, FICHE, LISTE, sauv,
  posteDe, presseTexte, recit, sceneEnBase, selectionner, semerBlocs, semerJeu, semerPartie, semerProjet, sql, supprimerComptes, typesEnBase,
} from "./outils";

/**
 * Étape 3 du plan, lot 4 : objets de l'histoire et actions de jeu dans la copie (F04.2).
 * C'est le scénario 14 du prototype de l'éditeur (docs/architecture.md), réécrit pour
 * l'application, avec les critères F04-AC15, AC16 et AC25 à AC30.
 */

test.afterEach(async () => {
  await supprimerComptes();
});

const sceneAdulte = (projet: string, scene: string) => `/projet/${projet}/scene/${scene}`;
const sceneEleve = (scene: string) => `/travail/scene/${scene}`;
const MOD = "ControlOrMeta";
const BARRE = (page: Page) => page.getByRole("toolbar", { name: "Outils de la copie" });
const ACTIONS = (page: Page) => copie(page).locator(".action-jeu");
const OBJETS: [string, string][] = [["la clé d’argent", "Ouvre la porte du sanctuaire"], ["le couteau", ""], ["la lanterne", "Éclaire la grotte"]];
const PANNEAU = (page: Page) => page.locator(".cote-copie .panneau-copie");
const FORMULES = ["Retire un point de volonté à ton héros.", "Ajoute … à ton inventaire."];

test.describe("Objets de l'histoire (F04.2)", () => {
  test("F04-AC15, AC16 — Bilal tape « /objet » et retient « la clé d’argent » : le nom s'écrit comme du texte ordinaire, qu'il modifie ; renommé dans la liste, le texte ne change pas et l'ancien nom se retrouve par la recherche", async ({ page, browser }) => {
    test.setTimeout(150_000);
    const s = await classeQuiEcrit(page);
    const [s15, s16] = s.lisiere.scenes;
    await semerJeu(s.base, s.compte, s.projet, OBJETS, FORMULES);
    await semerBlocs(s.base, s15, [recit("Lou serre ")]);
    const bilal = await posteDe(browser, s, "Bilal");
    await aller(bilal.page, sceneEleve(s15));
    await ecrire(bilal.page, "/obj");
    await expect(bilal.page.locator(".slash [role=option]")).toHaveText([/Objet/]);
    await bilal.page.keyboard.press("Enter");
    // La liste s'ouvre au curseur, sur son filtre : il cherche, les flèches parcourent, Entrée retient
    await expect(LISTE(bilal.page).getByLabel("Chercher un objet")).toBeFocused();
    await bilal.page.keyboard.type("clé");
    await expect(LISTE(bilal.page).getByRole("option")).toHaveText([/la clé d’argent.*Ouvre la porte du sanctuaire/]);
    await bilal.page.keyboard.press("Enter");
    await expect(LISTE(bilal.page)).toHaveCount(0);
    await expect(copie(bilal.page)).toBeFocused();
    await bilal.page.keyboard.type(" dans sa poche.");
    await attendreEnBase(s15, "dans sa poche.");
    let enBase = await sceneEnBase(s15);
    // Du texte ordinaire, dans le même paragraphe, sans élément particulier ; « /obj » n'y est pas resté
    expect(enBase.texte).toHaveLength(1);
    expect(enBase.texte[0].children).toEqual([{ text: "Lou serre la clé d’argent dans sa poche." }]);
    // Il le modifie librement : « sa clé d’argent »
    await selectionner(bilal.page, { bloc: 0, offset: 10 }, { bloc: 0, offset: 12 });
    await bilal.page.keyboard.type("sa");
    await attendreEnBase(s15, "Lou serre sa clé d’argent");

    // L'enseignante renomme l'objet dans la liste : le texte de la scène est inchangé
    await s.base.from("objets").update({ nom: "la clé d’argent terni" }).eq("projet_id", s.projet).eq("nom", "la clé d’argent");
    enBase = await sceneEnBase(s15);
    expect(enClair(enBase.texte)).toEqual(["Lou serre sa clé d’argent dans sa poche."]);
    // La recherche de l'adulte retrouve l'ancien nom, par le texte
    await aller(page, sceneAdulte(s.projet, s16));
    await BARRE(page).getByRole("button", { name: "Choix", exact: true }).click();
    await FICHE(page).getByLabel("Ce que fait le lecteur").fill("Revenir");
    await FICHE(page).getByLabel("Chercher une scène").fill("clé d’argent");
    await expect(FICHE(page).locator(".cx-liste > li[role=option]")).toContainText(["Lou serre sa clé d’argent dans sa poche."]);
    await bilal.contexte.close();
  });

  test("F04-AC28 — Alice, qui n'accède pas à la préparation, ouvre « Objets » : elle lit noms et descriptions, sans pouvoir en ajouter ni en modifier ; « Liste tenue par Mme Laurent »", async ({ page, browser }) => {
    test.setTimeout(120_000);
    const s = await classeQuiEcrit(page);
    const [s15] = s.lisiere.scenes;
    await semerJeu(s.base, s.compte, s.projet, OBJETS, FORMULES);
    const alice = await posteDe(browser, s, "Alice");
    await aller(alice.page, sceneEleve(s15));
    await BARRE(alice.page).getByRole("button", { name: "Objets" }).click();
    const fiche = LISTE(alice.page);
    await expect(fiche.getByRole("option")).toHaveText([/la clé d’argent.*Ouvre la porte du sanctuaire/, /le couteau/, /la lanterne.*Éclaire la grotte/]);
    await expect(fiche).toContainText("Liste tenue par Mme Laurent");
    await expect(fiche.getByRole("button", { name: /Créer|Ajouter|Modifier|Supprimer/ })).toHaveCount(0);
    await expect(fiche.getByRole("link")).toHaveCount(0);
    await expect(fiche.locator("input:not([type=search])")).toHaveCount(0);
    // Elle retient un objet au clavier : il s'écrit dans son texte
    await alice.page.keyboard.press("ArrowDown");
    await alice.page.keyboard.press("Enter");
    await attendreEnBase(s15, "le couteau");
    // Les formules d'action ne lui sont pas envoyées : elle n'écrit pas d'action de jeu
    expect(await alice.page.content()).not.toContain("point de volonté");
    await alice.contexte.close();
  });

  test("F04-AC29 — l'enseignante ajoute « la lanterne sourde » depuis la scène : l'objet figure dans la liste de la préparation, et elle n'a pas quitté la scène", async ({ page }) => {
    test.setTimeout(120_000);
    const s = await classeQuiEcrit(page);
    const [s15] = s.lisiere.scenes;
    await aller(page, sceneAdulte(s.projet, s15));
    const adresse = page.url();
    await ecrire(page, "Lou lève /objet");
    await page.keyboard.press("Enter");
    await expect(LISTE(page)).toContainText("Aucun objet dans la liste pour l’instant.");
    // « Créer un nouvel objet » ouvre le panneau de droite ; créé, l'objet s'écrit aussitôt dans le texte
    await LISTE(page).getByRole("button", { name: "Créer un nouvel objet" }).click();
    await expect(LISTE(page)).toHaveCount(0);
    await expect(PANNEAU(page).getByRole("heading", { name: "Nouvel objet" })).toBeVisible();
    await FICHE(page).getByLabel("Nom, tel qu’il s’écrit dans une phrase").fill("la lanterne sourde");
    await FICHE(page).getByLabel("Description, facultative").fill("Éclaire sans être vue");
    await FICHE(page).getByRole("button", { name: "Créer et écrire dans le texte" }).click();
    await expect(FICHE(page)).toHaveCount(0);
    expect(page.url()).toBe(adresse);
    await attendreEnBase(s15, "Lou lève la lanterne sourde");
    // Le nouvel objet figure dans la liste, à la prochaine ouverture
    await BARRE(page).getByRole("button", { name: "Objets" }).click();
    await expect(LISTE(page).getByRole("option")).toHaveText([/la lanterne sourde.*Éclaire sans être vue/]);
    await page.keyboard.press("Escape");
    // Dans la préparation, la rubrique « Objets et formules » la montre
    await aller(page, `/projet/${s.projet}/preparation`);
    await expect(page.getByText("la lanterne sourde")).toBeVisible();
    expect(await sql("select nom, description from objets where projet_id = $1", [s.projet])).toEqual([{ nom: "la lanterne sourde", description: "Éclaire sans être vue" }]);
  });

  test("F04-AC26 — récit classique : « /objet » propose la liste, et aucune commande d'action de jeu n'existe", async ({ page }) => {
    const { compte, base } = await adultePret(page);
    const projet = await semerProjet(base, compte, "personnel", "classique", "Carnet de voyage");
    const { chapitres } = await semerPartie(base, projet, "Le départ", [{ titre: "Le port", scenes: ["Le quai"] }]);
    await semerJeu(base, compte, projet, OBJETS, FORMULES);
    await aller(page, sceneAdulte(projet, chapitres[0].scenes[0]));
    await expect(BARRE(page).getByRole("button", { name: "Objets" })).toBeVisible();
    await expect(BARRE(page).getByRole("button", { name: /Action de jeu|Choix/ })).toHaveCount(0);
    await ecrire(page, "Sur le quai, /");
    await expect(page.locator(".slash [role=option]")).toHaveText([/Objet/, /Image/, /Note/]);
    await page.keyboard.type("action");
    await expect(page.locator(".slash")).toHaveCount(0);
    for (let i = 0; i < 6; i += 1) await page.keyboard.press("Backspace");
    await page.keyboard.type("objet");
    await page.keyboard.press("Enter");
    await expect(LISTE(page).getByRole("option")).toHaveCount(3);
    await page.keyboard.press("Enter");
    await attendreEnBase(chapitres[0].scenes[0], "Sur le quai, la clé d’argent");
  });
});

test.describe("Action de jeu (F04.2) — point 14 du prototype", () => {
  test("F04-AC27, AC39 — l'enseignante tape « /action » et retient une formule : un paragraphe d'action de jeu porte ce texte, qu'elle modifie sur place ; dans une formule à compléter, « … » est sélectionné", async ({ page }) => {
    test.setTimeout(120_000);
    const s = await classeQuiEcrit(page);
    const [s15] = s.lisiere.scenes;
    await semerJeu(s.base, s.compte, s.projet, OBJETS, FORMULES);
    await semerBlocs(s.base, s15, [recit("La lame brille."), recit("Lou recule.")]);
    await aller(page, sceneAdulte(s.projet, s15));
    const adresse = page.url();
    await selectionner(page, { bloc: 0, offset: 15 });
    await page.keyboard.type(" /act");
    await expect(page.locator(".slash [role=option]")).toHaveText([/Action de jeu/]);
    await page.keyboard.press("Enter");
    await expect(LISTE(page).getByRole("option")).toHaveText(["Paragraphe vide, à écrire", ...FORMULES]);
    // F04-AC39 — l'action se lit en attente sous le paragraphe du curseur : l'invite, puis la formule surlignée
    const attendue = copie(page).locator("p").first().locator(".action-attendue");
    await expect(attendue).toContainText("Ce que le lecteur fait sur sa feuille d’aventure");
    await page.keyboard.press("ArrowDown");
    await expect(attendue).toContainText(FORMULES[0]);
    await page.keyboard.press("Enter");
    await expect(copie(page).locator(".action-attendue")).toHaveCount(0);
    await expect(ACTIONS(page)).toHaveCount(1);
    await expect(copie(page)).toBeFocused();
    await expect(ACTIONS(page).locator(".action-jeu__legende")).toContainText("Action de jeu");
    await attendreEnregistre(page);
    expect(page.url()).toBe(adresse);
    // Après le paragraphe du curseur, entre les deux paragraphes de récit ; « /act » n'est pas resté
    let enBase = await sceneEnBase(s15);
    expect(enBase.texte.map((b) => b.type)).toEqual(["p", "action", "p"]);
    expect(enClair(enBase.texte)).toEqual(["La lame brille. ", "Retire un point de volonté à ton héros.", "Lou recule."]);
    // Elle remplace « un point » par « deux points », sur place
    await selectionner(page, { bloc: 1, offset: 7 }, { bloc: 1, offset: 15 });
    await page.keyboard.type("deux points");
    await attendreEnBase(s15, "Retire deux points de volonté");

    // Une formule à compléter : « … » est sélectionné, ce qu'on tape le remplace
    await BARRE(page).getByRole("button", { name: "Action de jeu" }).click();
    await LISTE(page).getByRole("option").nth(2).getByRole("button").click();
    await expect(copie(page)).toBeFocused();
    await page.keyboard.type("le couteau");
    await attendreEnBase(s15, "Ajoute le couteau à ton inventaire.");
    enBase = await sceneEnBase(s15);
    expect(enBase.texte.map((b) => b.type)).toEqual(["p", "action", "action", "p"]);
    // La liste des formules n'a pas changé : le paragraphe est du texte libre
    expect((await sql<{ texte: string }>("select texte from formules where projet_id = $1 order by cree_le, texte", [s.projet])).map((f) => f.texte).sort()).toEqual([...FORMULES].sort());
    // Aucune mise en forme dans une action de jeu
    await page.keyboard.press(`${MOD}+a`);
    await page.keyboard.press(`${MOD}+b`);
    await page.waitForTimeout(300);
    expect(JSON.stringify((await blocsEditeur(page)).filter((b) => b.type === "action"))).not.toContain("bold");
  });

  test("au clavier, la formule surlignée reste à l'écran : la liste défile jusqu'à elle", async ({ page }) => {
    const s = await classeQuiEcrit(page);
    const [s15] = s.lisiere.scenes;
    const douze = Array.from({ length: 12 }, (_, i) => `Formule d’essai numéro ${i + 1}.`);
    await semerJeu(s.base, s.compte, s.projet, OBJETS, douze);
    await semerBlocs(s.base, s15, [recit("La lame brille.")]);
    await aller(page, sceneAdulte(s.projet, s15));
    await BARRE(page).getByRole("button", { name: "Action de jeu" }).click();
    const liste = LISTE(page).getByRole("listbox");
    await expect(liste.getByRole("option")).toHaveCount(13);
    for (let i = 0; i < 12; i += 1) await page.keyboard.press("ArrowDown");
    const surlignee = liste.locator('[aria-selected="true"]');
    await expect(surlignee).toHaveText(douze[11]);
    await expect.poll(async () => {
      const [l, o] = [(await liste.boundingBox())!, (await surlignee.boundingBox())!];
      return o.y >= l.y - 1 && o.y + o.height <= l.y + l.height + 1;
    }).toBe(true);
    // Et l'action en attente la montre
    await expect(copie(page).locator(".action-attendue")).toContainText(douze[11]);
  });

  test("F04-AC40, AC41 — « Formules… » remplace le texte d'une action ; « Supprimer » passe par le bandeau d'annulation ; l'enseignante ajoute une formule à la liste sans quitter la scène", async ({ page }) => {
    test.setTimeout(120_000);
    const s = await classeQuiEcrit(page);
    const [s15] = s.lisiere.scenes;
    await semerJeu(s.base, s.compte, s.projet, OBJETS, FORMULES);
    const posee = action("Note ce numéro.");
    await semerBlocs(s.base, s15, [recit("La lame brille."), posee]);
    await aller(page, sceneAdulte(s.projet, s15));
    // Les commandes de l'action n'apparaissent que lorsqu'on y écrit
    await expect(ACTIONS(page).getByRole("button", { name: "Formules…" })).toHaveCount(0);
    await selectionner(page, { bloc: 1, offset: 4 });
    await ACTIONS(page).getByRole("button", { name: "Formules…" }).click();
    await expect(LISTE(page).getByRole("option")).toHaveText(FORMULES);
    // « Ajouter une formule à la liste » ouvre le panneau de droite ; ajoutée, la formule est employée aussitôt
    await LISTE(page).getByRole("button", { name: "Ajouter une formule à la liste" }).click();
    await expect(PANNEAU(page).getByRole("heading", { name: "Nouvelle formule" })).toBeVisible();
    await FICHE(page).getByRole("textbox", { name: "Formule" }).fill("Lance le dé.");
    // F04-AC41 — la formule est ajoutée avec son signe, que l'action reprend
    await FICHE(page).getByRole("radiogroup", { name: "Signe devant la formule" }).getByRole("radio", { name: /^Dé/ }).click();
    await FICHE(page).getByRole("button", { name: "Ajouter et utiliser" }).click();
    await expect(FICHE(page)).toHaveCount(0);
    await attendreEnBase(s15, "Lance le dé.");
    expect((await sql<{ texte: string }>("select texte from formules where projet_id = $1", [s.projet])).map((f) => f.texte).sort()).toEqual([...FORMULES, "Lance le dé."].sort());
    expect(await sql("select signe from formules where projet_id = $1 and texte = 'Lance le dé.'", [s.projet])).toEqual([{ signe: "de" }]);
    // La même action, son texte remplacé, précédée du dé
    expect((await sceneEnBase(s15)).texte[1]).toEqual({ ...posee, signe: "de", children: [{ text: "Lance le dé." }] });

    await selectionner(page, { bloc: 1, offset: 2 });
    // F04-AC40 — le signe devant l'action : le crayon par défaut, un autre d'un clic, et retour
    const signes = ACTIONS(page).getByRole("radiogroup", { name: "Signe devant l’action" });
    await expect(signes.getByRole("radio")).toHaveCount(4);
    await expect(signes.getByRole("radio", { name: /^Dé/ })).toBeChecked();
    await signes.getByRole("radio", { name: /^Cœur/ }).click();
    await expect(signes.getByRole("radio", { name: /^Cœur/ })).toBeChecked();
    await expect.poll(async () => ((await sceneEnBase(s15)).texte[1] as { signe?: string }).signe, { timeout: 15_000 }).toBe("coeur");
    await signes.getByRole("radio", { name: /^Crayon/ }).click();
    await expect.poll(async () => "signe" in (await sceneEnBase(s15)).texte[1], { timeout: 15_000 }).toBe(false);
    // La liste montre la formule avec son signe ; retenue, elle le rend à l'action
    await ACTIONS(page).getByRole("button", { name: "Formules…" }).click();
    await LISTE(page).getByRole("option", { name: "Lance le dé." }).getByRole("button").click();
    await expect.poll(async () => ((await sceneEnBase(s15)).texte[1] as { signe?: string }).signe, { timeout: 15_000 }).toBe("de");
    await selectionner(page, { bloc: 1, offset: 2 });

    await ACTIONS(page).getByRole("button", { name: "Supprimer" }).click();
    await expect(ACTIONS(page)).toHaveCount(0);
    await expect(BANDEAU(page)).toContainText("1 action de jeu supprimée.");
    await attendreEnregistre(page);
    expect(await typesEnBase(s15)).toEqual(["p"]);
    await BANDEAU(page).getByRole("button", { name: "Annuler" }).click();
    await expect(ACTIONS(page)).toHaveCount(1);
    await attendreEnregistre(page);
    expect(await typesEnBase(s15)).toEqual(["p", "action"]);
  });

  test("F04-AC25 — Bilal, « écriture et organisation », écrit une action de jeu ; Alice, « écriture et propositions », n'en a pas la commande : pour elle c'est un bloc préparé, qui demeure quand elle sélectionne tout et supprime", async ({ page, browser }) => {
    test.setTimeout(150_000);
    const s = await classeQuiEcrit(page);
    const [s15] = s.lisiere.scenes;
    await semerJeu(s.base, s.compte, s.projet, OBJETS, FORMULES);
    await semerBlocs(s.base, s15, [recit("La lame brille.")]);
    const bilal = await posteDe(browser, s, "Bilal");
    await aller(bilal.page, sceneEleve(s15));
    await BARRE(bilal.page).getByRole("button", { name: "Action de jeu" }).click();
    // Les formules lui sont proposées ; la liste reste tenue par l'enseignante
    await expect(LISTE(bilal.page).getByRole("option")).toHaveText(["Paragraphe vide, à écrire", ...FORMULES]);
    await expect(LISTE(bilal.page).getByRole("button", { name: /Ajouter une formule/ })).toHaveCount(0);
    await bilal.page.keyboard.press("Enter");
    await expect(copie(bilal.page)).toBeFocused();
    await bilal.page.keyboard.type("Ajoute le couteau à ton inventaire.");
    await attendreEnBase(s15, "Ajoute le couteau à ton inventaire.");
    await expect(sauv(bilal.page)).toHaveText("Enregistré", { timeout: 8_000 });
    const posee = (await sceneEnBase(s15)).texte[1];
    expect(posee).toMatchObject({ type: "action", children: [{ text: "Ajoute le couteau à ton inventaire." }] });
    await bilal.contexte.close();

    const alice = await posteDe(browser, s, "Alice");
    await aller(alice.page, sceneEleve(s15));
    await expect(BARRE(alice.page).getByRole("button", { name: "Action de jeu" })).toHaveCount(0);
    await selectionner(alice.page, { bloc: 0, offset: 15 });
    await alice.page.keyboard.type(" /");
    await expect(alice.page.locator(".slash [role=option]")).toHaveText([/Objet/]);
    await alice.page.keyboard.press("Backspace");
    const preparee = ACTIONS(alice.page);
    await expect(preparee.locator(".action-jeu__texte")).toHaveText("Ajoute le couteau à ton inventaire.");
    await expect(preparee.locator(".marge")).toHaveAttribute("title", "Action de jeu préparée : tu écris autour");
    await expect(preparee.locator(".repere-prepare")).toHaveCount(0);
    await expect(preparee.locator(".prise")).toHaveCount(0);
    // Tout sélectionner, puis supprimer : le récit part, l'action de jeu demeure
    await copie(alice.page).locator("p").first().click();
    await alice.page.keyboard.press(`${MOD}+a`);
    await alice.page.waitForTimeout(150);
    await alice.page.keyboard.press("Delete");
    await alice.page.keyboard.type("Lou hésite.");
    await attendreEnBase(s15, "Lou hésite.");
    const enBase = await sceneEnBase(s15);
    expect(enClair(enBase.texte)).toEqual(["Lou hésite.", "Ajoute le couteau à ton inventaire."]);
    expect(enBase.texte[1]).toEqual(posee);
    await alice.contexte.close();
  });

  test("F04-AC30 — Alice colle un paragraphe de récit et une action de jeu dans sa scène : le récit est collé, l'action ne l'est pas, un message le dit ; forcée depuis le navigateur, elle est refusée par le serveur", async ({ page, browser }) => {
    test.setTimeout(150_000);
    const s = await classeQuiEcrit(page);
    const [s15, s16] = s.lisiere.scenes;
    await semerBlocs(s.base, s15, [recit("La lame brille."), action("Ajoute le couteau à ton inventaire.")]);
    const alice = await posteDe(browser, s, "Alice");
    await alice.contexte.grantPermissions(["clipboard-read", "clipboard-write"]);
    await aller(alice.page, sceneEleve(s15));
    await copie(alice.page).locator("p").first().click();
    await alice.page.keyboard.press(`${MOD}+a`);
    await alice.page.waitForTimeout(150);
    await alice.page.keyboard.press(`${MOD}+c`);
    // Vers l'extérieur, l'action sort en texte simple
    expect(await presseTexte(alice.page)).toBe("La lame brille.\nAjoute le couteau à ton inventaire.");
    await aller(alice.page, sceneEleve(s16));
    await copie(alice.page).click();
    await alice.page.keyboard.press(`${MOD}+v`);
    await expect(BANDEAU(alice.page)).toContainText("L’action de jeu n’a pas été collée : tu ne peux pas en écrire ici.");
    await attendreEnBase(s16, "La lame brille.");
    expect(enClair((await sceneEnBase(s16)).texte)).toEqual(["La lame brille."]);
    expect(await typesEnBase(s16)).toEqual(["p"]);

    const { version, texte } = await sceneEnBase(s16);
    const [{ id: ecriture }] = await sql<{ id: string }>("select id from ecritures where scene_id = $1 and eleve_id = $2 order by ouverte_le desc limit 1", [s16, s.eleves.Alice.id]);
    const forge = [...texte, { type: "action", id: crypto.randomUUID(), children: [{ text: "Gagne dix points." }] }];
    const reponse = await alice.page.evaluate(
      async ([e, v, t]) => (await fetch("/copie", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ecriture: e, version: v, texte: t }) })).json(),
      [ecriture, version, forge] as const,
    );
    expect(reponse).toMatchObject({ etat: "garde", motif: "controle" });
    expect(await typesEnBase(s16)).toEqual(["p"]);
    expect(await copiesGardees(s16)).toHaveLength(1);
    await alice.contexte.close();
  });

  test("F05-AC40 — l'action de jeu se déplace par son repère et par Alt et une flèche ; coupée puis collée, c'est la même ; copiée puis collée, une autre", async ({ page, context }) => {
    test.setTimeout(150_000);
    const s = await classeQuiEcrit(page);
    const [s15, s16] = s.lisiere.scenes;
    const posee = action("Retire un point de volonté à ton héros.");
    await semerBlocs(s.base, s15, [recit("Un."), recit("Deux."), posee]);
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await aller(page, sceneAdulte(s.projet, s15));
    await expect(copie(page).locator("p .prise")).toHaveCount(0);
    const prise = (await ACTIONS(page).locator(".prise").boundingBox())!;
    const cible = (await copie(page).locator("p").first().boundingBox())!;
    await page.mouse.move(prise.x + prise.width / 2, prise.y + prise.height / 2);
    await page.mouse.down();
    await page.mouse.move(prise.x + 4, cible.y + 2, { steps: 8 });
    await page.mouse.up();
    await attendreEnregistre(page);
    expect(await typesEnBase(s15)).toEqual(["action", "p", "p"]);
    await selectionner(page, { bloc: 0, offset: 3 });
    await page.keyboard.press("Alt+ArrowDown");
    await attendreEnregistre(page);
    expect(await typesEnBase(s15)).toEqual(["p", "action", "p"]);

    // Coupée entière, collée dans une autre scène : la même action
    await selectionner(page, { bloc: 1, offset: 0 }, { bloc: 1, offset: 39 });
    await page.keyboard.press(`${MOD}+x`);
    await attendreEnregistre(page);
    await aller(page, sceneAdulte(s.projet, s16));
    await copie(page).click();
    await page.keyboard.press(`${MOD}+v`);
    await attendreEnBase(s16, "Retire un point de volonté");
    expect((await sceneEnBase(s16)).texte).toEqual([posee]);
    // Copiée, collée dessous : une autre action, de même texte
    await selectionner(page, { bloc: 0, offset: 0 }, { bloc: 0, offset: 39 });
    await page.keyboard.press(`${MOD}+c`);
    await selectionner(page, { bloc: 0, offset: 39 });
    await page.keyboard.press(`${MOD}+v`);
    await expect(ACTIONS(page)).toHaveCount(2);
    await attendreEnregistre(page);
    const deux = (await sceneEnBase(s16)).texte;
    expect(deux.map((b) => b.type)).toEqual(["action", "action"]);
    expect(deux[1].id).not.toBe(posee.id);
    expect(enClair([deux[1]])).toEqual(["Retire un point de volonté à ton héros."]);
  });

  test("F04.2 — l'enseignante protège une action de jeu : elle reste modifiable par elle, fermée pour Bilal avec « Préparé par Mme Laurent »", async ({ page, browser }) => {
    test.setTimeout(150_000);
    const s = await classeQuiEcrit(page);
    const [s15] = s.lisiere.scenes;
    await semerBlocs(s.base, s15, [recit("La lame brille."), action("Retire un point de volonté à ton héros.")]);
    await aller(page, sceneAdulte(s.projet, s15));
    const bouton = BARRE(page).getByRole("button", { name: /^(Protéger|Retirer la protection)$/ });
    await selectionner(page, { bloc: 1, offset: 3 });
    await bouton.click();
    await expect(bouton).toHaveAccessibleName("Retirer la protection");
    await expect(ACTIONS(page).locator(".action-jeu__legende")).toContainText("protégée");
    await attendreEnregistre(page);
    expect((await sceneEnBase(s15)).texte[1]).toMatchObject({ type: "action", protege: true });

    const bilal = await posteDe(browser, s, "Bilal");
    await aller(bilal.page, sceneEleve(s15));
    await expect(ACTIONS(bilal.page).locator(".repere-prepare")).toHaveText("Préparé par Mme Laurent");
    await expect(ACTIONS(bilal.page).getByRole("button", { name: /Formules|Supprimer/ })).toHaveCount(0);
    await ACTIONS(bilal.page).locator(".action-jeu__texte").click();
    await bilal.page.keyboard.type("Zut");
    await bilal.page.keyboard.press("Delete");
    expect((await blocsEditeur(bilal.page))[1]).toMatchObject({ type: "action", protege: true, children: [{ text: "Retire un point de volonté à ton héros." }] });
    await bilal.contexte.close();
  });
});
