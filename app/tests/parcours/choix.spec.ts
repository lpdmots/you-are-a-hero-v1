import { expect, test, type Locator, type Page } from "@playwright/test";
import {
  adultePret, aller, attendreEnBase, attendreEnregistre, BANDEAU, blocsEditeur, choixAuto, choixPerso, classeQuiEcrit, collerDepuisAilleurs, copie,
  ecrire, enClair, FICHE, liensEnBase, MESSAGE, motsEnBase, numerosEnBase, PHRASES, pied, posteDe, presseTexte, recit, renvoi, sceneEnBase, selectionner,
  semerBlocs, semerPartie, semerProjet, sql, supprimerComptes, tirer, typesEnBase, type BlocSeme,
} from "./outils";

/**
 * Étape 3 du plan, lot 2 : créer et modifier les choix dans la scène (F05, F05.2, F11.5).
 * Ce sont les scénarios du prototype de l'éditeur (points 1 à 7, 12 et 13 de
 * docs/architecture.md), réécrits pour l'application : frappes, raccourcis et
 * presse-papiers sont réels, le curseur est parfois posé par programme.
 */

test.afterEach(async () => {
  await supprimerComptes();
});

const sceneAdulte = (projet: string, scene: string) => `/projet/${projet}/scene/${scene}`;
const sceneEleve = (scene: string) => `/travail/scene/${scene}`;
const MOD = "ControlOrMeta";

type Livre = { base: Awaited<ReturnType<typeof adultePret>>["base"]; projet: string; lisiere: { id: string; scenes: string[] }; marais: { id: string; scenes: string[] } };

/** Un auteur seul et son récit : « La lisière » (S001 Le sentier, S002 Clairière, S003 La souche, S004 Le pont) et « Le marais » (S005 Le ponton). */
async function auteur(page: Page, sorte: "choix" | "classique" = "choix"): Promise<Livre> {
  const { compte, base } = await adultePret(page);
  const projet = await semerProjet(base, compte, "personnel", sorte, "Les passeurs de brume");
  const { chapitres } = await semerPartie(base, projet, "La forêt", [
    { titre: "La lisière", scenes: ["Le sentier", "Clairière", "La souche", "Le pont"] },
    { titre: "Le marais", scenes: ["Le ponton"] },
  ]);
  return { base, projet, lisiere: chapitres[0], marais: chapitres[1] };
}

/** S001 avec deux paragraphes de récit, ouverte. */
async function deuxParagraphes(page: Page, l: Livre): Promise<[BlocSeme, BlocSeme]> {
  const blocs: [BlocSeme, BlocSeme] = [recit("Lou fit un pas, puis un autre."), recit("Le sentier montait entre les fougères.")];
  await semerBlocs(l.base, l.lisiere.scenes[0], blocs);
  await aller(page, sceneAdulte(l.projet, l.lisiere.scenes[0]));
  return blocs;
}

/** Ce qu'on lit d'une phrase, sans les caractères invisibles que l'éditeur pose autour d'un renvoi. */
const lue = (phrase: Locator): Promise<string> => phrase.evaluate((n) => (n.textContent ?? "").replace(/[\uFEFF\u200B]/g, ""));

/** Les scènes que la fiche propose pour destination. */
const PROPOSEES = (page: Page): Locator => FICHE(page).locator(".cx-liste > li[role=option]");

/** La phrase telle qu'elle s'écrit dans le panneau : ses textes, autour de ses numéros. */
const TEXTES = (page: Page): Locator => FICHE(page).locator(".cx-phrase [data-texte]");
/** Les destinations d'un choix, dans ses réglages. */
const DESTINATIONS = (page: Page): Locator => FICHE(page).locator(".cx-dest");

/** Écrit dans la phrase du panneau : au début ou à la fin de l'un de ses textes. */
async function ecrireDansLaPhrase(page: Page, texte: number, mots: string, ou: "début" | "fin"): Promise<void> {
  await TEXTES(page).nth(texte).evaluate((champ: HTMLElement, fin: boolean) => {
    champ.focus();
    const plage = document.createRange();
    plage.selectNodeContents(champ);
    plage.collapse(!fin);
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(plage);
  }, ou === "fin");
  if (mots) await page.keyboard.type(mots);
}

/** Saisit un choix dans la fiche ouverte : le libellé, puis une scène cherchée par son titre. */
async function saisirChoix(page: Page, libelle: string, destination: string): Promise<void> {
  await FICHE(page).getByLabel("Ce que fait le lecteur").fill(libelle);
  await FICHE(page).getByLabel("Ce que fait le lecteur").press("Enter");
  await FICHE(page).getByLabel("Chercher une scène").fill(destination);
  await FICHE(page).getByLabel("Chercher une scène").press("Enter");
}

test.describe("Créer un choix (F05.2) — points 1, 2 et 4 du prototype", () => {
  test("F05-AC13, AC15, AC34 — « /choix » insère la phrase après le paragraphe du curseur, qui reste entier et sans renvoi ; elle affiche un numéro avant toute ouverture du Livre", async ({ page }) => {
    const l = await auteur(page);
    await deuxParagraphes(page, l);
    await selectionner(page, { bloc: 0, offset: 15 });
    // Le curseur est au milieu de « Lou fit un pas, puis un autre. »
    await page.keyboard.press("End");
    await page.keyboard.type(" /cho");
    await expect(page.locator(".slash")).toContainText("Choix");
    await page.keyboard.press("Enter");
    await saisirChoix(page, "Continuer vers la lumière", "Clair");
    await expect(PHRASES(page)).toHaveCount(1);
    await attendreEnregistre(page);

    expect(await typesEnBase(l.lisiere.scenes[0])).toEqual(["p", "choix", "p"]);
    const enBase = await sceneEnBase(l.lisiere.scenes[0]);
    // « /cho » n'est pas resté dans le texte, le paragraphe est entier et sans renvoi
    expect(enClair([enBase.texte[0], enBase.texte[2]])).toEqual(["Lou fit un pas, puis un autre. ", "Le sentier montait entre les fougères."]);
    expect(enBase.texte[0].children.every((x) => "text" in x)).toBe(true);
    expect(await liensEnBase(l.projet)).toEqual(["S001 > S002"]);
    // Le numéro est celui du livre, établi dès ce premier choix ; il n'est écrit nulle part dans le texte
    const numeros = await numerosEnBase(l.projet);
    await expect(PHRASES(page)).toContainText(`Continuer vers la lumière : rends-toi au ${numeros[l.lisiere.scenes[1]]}.`);
    await expect(PHRASES(page).locator(".copie__dest")).toHaveText("Clairière");
    expect(JSON.stringify(enBase.texte[1])).not.toContain("rends-toi");
    expect((await sql<{ o: boolean }>("select ordre_etabli_le is not null as o from projets where id = $1", [l.projet]))[0].o).toBe(true);
  });

  test("le menu des commandes s'ouvre sous la ligne du curseur, sans allonger le cadre du texte ni déplacer ce qui est écrit ; quand la fenêtre n'a pas la place dessous, il s'ouvre au-dessus, et reste entier à l'écran", async ({ page }) => {
    const l = await auteur(page);
    await deuxParagraphes(page, l);
    const cadre = copie(page);
    const avant = (await cadre.boundingBox())!;
    const ligne = (await cadre.locator("p").nth(1).boundingBox())!;
    await selectionner(page, { bloc: 1, offset: 38 });
    await page.keyboard.type(" /");
    const menu = page.locator(".slash");
    await expect(menu.getByRole("option")).toHaveCount(5);
    await expect(menu).toHaveAttribute("data-cote", "bottom");
    const dessous = (await menu.boundingBox())!;
    expect(dessous.y).toBeGreaterThanOrEqual(ligne.y + ligne.height - 2);
    expect(dessous.y + dessous.height).toBeLessThanOrEqual(768);
    // Ni le cadre ni le texte n'ont bougé
    expect(Math.round((await cadre.boundingBox())!.height)).toBe(Math.round(avant.height));
    expect((await cadre.locator("p").nth(1).boundingBox())!.y).toBeCloseTo(ligne.y, 0);
    await page.keyboard.press("Escape");
    await expect(menu).toHaveCount(0);

    // Une fenêtre trop basse pour le montrer sous la ligne : il s'ouvre au-dessus
    const hauteur = Math.round(ligne.y + ligne.height + dessous.height / 2);
    await page.setViewportSize({ width: 1366, height: hauteur });
    await page.keyboard.press("Backspace");
    await page.keyboard.type("/");
    await expect(menu).toHaveAttribute("data-cote", "top");
    const dessus = (await menu.boundingBox())!;
    expect(dessus.y + dessus.height).toBeLessThanOrEqual(ligne.y + 2);
    expect(dessus.y).toBeGreaterThanOrEqual(0);
    expect(Math.round((await cadre.boundingBox())!.height)).toBe(Math.round(avant.height));
  });

  test("F05-AC55 — la phrase en attente : pendant la saisie d'un choix, elle se lit à sa place dans le texte, avec un libellé d'exemple puis celui qu'on tape ; le panneau ne demande la destination qu'une fois le libellé saisi ; rien d'elle ne s'enregistre", async ({ page }) => {
    const l = await auteur(page);
    await deuxParagraphes(page, l);
    await selectionner(page, { bloc: 0, offset: 5 });
    await page.keyboard.press("End");
    await page.keyboard.type(" /cho");
    await page.keyboard.press("Enter");
    const attendue = copie(page).locator(".choix-attendu");
    // Après le paragraphe du curseur, avant le suivant
    await expect(copie(page).locator("p").first().locator(".choix-attendu")).toHaveCount(1);
    await expect(attendue).toContainText("Traverser le pont : rends-toi au ….");
    await expect(FICHE(page).getByText("Où mène ce choix ?")).toHaveCount(0);
    await expect(FICHE(page).getByRole("radio")).toHaveCount(0);
    await FICHE(page).getByLabel("Ce que fait le lecteur").fill("Suivre la lumière");
    await expect(attendue).toContainText("Suivre la lumière : rends-toi au ….");
    await expect(FICHE(page).getByRole("radio", { name: "Scène existante" })).toBeChecked();
    await expect(FICHE(page).getByRole("radio", { name: "Nouvelle scène" })).toBeVisible();
    await expect(PROPOSEES(page)).toHaveCount(3);
    await expect(PHRASES(page)).toHaveCount(0);
    // L'aide ne se lit que demandée : un « i » à côté de la question
    await expect(FICHE(page)).not.toContainText("De préférence");
    await FICHE(page).getByRole("button", { name: "Que faut-il écrire ici ?" }).click();
    await expect(FICHE(page).getByRole("note")).toContainText("La phrase du choix s’écrit toute seule dans le texte ; vous pourrez la personnaliser ensuite.");
    await page.keyboard.press("Escape");
    await expect(FICHE(page).getByRole("note")).toHaveCount(0);
    await expect(FICHE(page).getByRole("button", { name: "Qu’est-ce qu’un lien caché ?" })).toBeVisible();
    // Le lien caché : une forme rare, dans un lien discret ; il n'ajoute pas de phrase au texte
    await FICHE(page).getByRole("button", { name: "Lien caché (énigme)…" }).click();
    await expect(attendue).toHaveCount(0);
    await FICHE(page).getByRole("button", { name: "Retour au choix" }).click();
    await expect(FICHE(page).getByLabel("Ce que fait le lecteur")).toHaveValue("Suivre la lumière");
    await expect(attendue).toHaveCount(1);
    await page.keyboard.press("Escape");
    await expect(attendue).toHaveCount(0);
    await attendreEnregistre(page);
    const apres = await sceneEnBase(l.lisiere.scenes[0]);
    expect(apres.texte.map((b) => b.type)).toEqual(["p", "p"]);
    expect(JSON.stringify(apres.texte)).not.toMatch(/Suivre la lumière|Traverser le pont/);
  });

  test("F05-AC56 — scène existante : les scènes qui ressemblent à l'action remontent en tête, celles d'un autre chapitre avec leur repère ; le bouton des chapitres en ouvre un autre ; le filtre cherche dans tout le livre", async ({ page }) => {
    const l = await auteur(page);
    await deuxParagraphes(page, l);
    await page.getByRole("button", { name: "Choix", exact: true }).click();
    const libelle = FICHE(page).getByLabel("Ce que fait le lecteur");
    const groupes = FICHE(page).locator(".cx-liste__groupe");
    // Sans mot commun : les scènes du chapitre, dans l'ordre du plan, sans repère
    await libelle.fill("Continuer vers la lumière");
    await expect(PROPOSEES(page)).toHaveText([/^Clairière/, /^La souche/, /^Le pont(?!on)/]);
    await expect(groupes).toHaveCount(0);
    // « Traverser le pont » fait remonter « Le pont », surlignée : Entrée la retiendrait
    await libelle.fill("Traverser le pont");
    await expect(PROPOSEES(page)).toHaveText([/^Le pont(?!on)/, /^Clairière/, /^La souche/]);
    await expect(groupes).toHaveText(["Proposées d’après l’action", "Ce chapitre"]);
    await expect(PROPOSEES(page).first()).toHaveAttribute("aria-selected", "true");
    // Une scène d'un autre chapitre remonte aussi, avec son repère
    await libelle.fill("Sauter sur le ponton");
    await expect(PROPOSEES(page)).toHaveText([/^Le ponton/, /^Clairière/, /^La souche/, /^Le pont(?!on)/]);
    await expect(PROPOSEES(page).first().locator(".cx-liste__ailleurs")).toHaveText("Le marais");
    await expect(PROPOSEES(page).nth(1).locator(".cx-liste__ailleurs")).toHaveCount(0);
    // Le bouton des chapitres ouvre « Le marais » : ses scènes seules
    await FICHE(page).getByLabel("Chapitre").selectOption({ label: "Le marais" });
    await expect(PROPOSEES(page)).toHaveText([/^Le ponton/]);
    await expect(groupes).toHaveText(["Le marais"]);
    // Le filtre cherche dans tout le livre, sans proposition
    await FICHE(page).getByLabel("Chercher une scène").fill("souche");
    await expect(PROPOSEES(page)).toHaveText([/^La souche/]);
    await expect(groupes).toHaveCount(0);
    await FICHE(page).getByLabel("Chercher une scène").press("Enter");
    await attendreEnregistre(page);
    expect(await liensEnBase(l.projet)).toEqual(["S001 > S003"]);
  });

  test("F05-AC14 — par le bouton, sans curseur dans le texte, la phrase s'ajoute après le dernier paragraphe", async ({ page }) => {
    const l = await auteur(page);
    await deuxParagraphes(page, l);
    await page.getByRole("button", { name: "Choix", exact: true }).click();
    await saisirChoix(page, "Faire demi-tour", "souche");
    await attendreEnregistre(page);
    expect(await typesEnBase(l.lisiere.scenes[0])).toEqual(["p", "p", "choix"]);
    expect(await liensEnBase(l.projet)).toEqual(["S001 > S003"]);
    await expect(BANDEAU(page)).toContainText("Le choix est ajouté.");
  });

  test("sur une ligne vide, la phrase remplace la ligne ; F05-AC18 — « Ajouter un autre choix » place le second juste sous le premier", async ({ page }) => {
    const l = await auteur(page);
    await semerBlocs(l.base, l.lisiere.scenes[0], [recit("Lou hésita."), recit(""), recit("Puis il avança.")]);
    await aller(page, sceneAdulte(l.projet, l.lisiere.scenes[0]));
    await selectionner(page, { bloc: 1, offset: 0 });
    await page.keyboard.type("/choix");
    await page.keyboard.press("Enter");
    await saisirChoix(page, "Prendre à gauche", "Clair");
    await BANDEAU(page).getByRole("button", { name: "Ajouter un autre choix" }).click();
    await saisirChoix(page, "Prendre à droite", "pont");
    await attendreEnregistre(page);
    const enBase = await sceneEnBase(l.lisiere.scenes[0]);
    expect(enBase.texte.map((b) => b.type)).toEqual(["p", "choix", "choix", "p"]);
    expect(enBase.texte.map((b) => (b as { libelle?: string }).libelle)).toEqual([undefined, "Prendre à gauche", "Prendre à droite", undefined]);
    expect(await liensEnBase(l.projet)).toEqual(["S001 > S002", "S001 > S004"]);
  });

  test("F05-AC16, AC12, AC44 — « nouvelle scène » crée une scène vide titrée du libellé, sans quitter la page ; le choix annulé, la scène reste, et « Supprimer aussi la scène » l'envoie à la corbeille", async ({ page }) => {
    const l = await auteur(page);
    await deuxParagraphes(page, l);
    const adresse = page.url();
    await page.getByRole("button", { name: "Choix", exact: true }).click();
    await FICHE(page).getByLabel("Ce que fait le lecteur").fill("Traverser le pont de brume");
    await FICHE(page).getByRole("radio", { name: "Nouvelle scène" }).check();
    await expect(FICHE(page).getByLabel("Titre de la nouvelle scène")).toHaveValue("Traverser le pont de brume");
    await FICHE(page).getByRole("button", { name: "Créer le choix et la scène" }).click();
    await expect(BANDEAU(page)).toContainText("S006 « Traverser le pont de brume » est créée. Vous restez dans cette scène.");
    expect(page.url()).toBe(adresse);
    await attendreEnregistre(page);
    const [creee] = await sql<{ id: string; titre: string; chapitre_id: string; texte_vide: boolean }>("select id, titre, chapitre_id, texte_vide from scenes where projet_id = $1 and reference = 6", [l.projet]);
    expect(creee).toMatchObject({ titre: "Traverser le pont de brume", chapitre_id: l.lisiere.id, texte_vide: true });
    expect(await liensEnBase(l.projet)).toEqual(["S001 > S006"]);
    await expect(PHRASES(page).locator(".copie__dest")).toHaveText("Traverser le pont de brume");
    // Le titre et le libellé vivent ensuite chacun leur vie
    await sql("update scenes set titre = 'Pont — la brume' where id = $1", [creee.id]);
    expect(((await sceneEnBase(l.lisiere.scenes[0])).texte[2] as { libelle?: string }).libelle).toBe("Traverser le pont de brume");

    await BANDEAU(page).getByRole("button", { name: "Annuler" }).click();
    await expect(PHRASES(page)).toHaveCount(0);
    await expect(BANDEAU(page)).toContainText("Choix retiré. La scène S006 « Traverser le pont de brume » reste dans le chapitre.");
    await attendreEnregistre(page);
    expect(await liensEnBase(l.projet)).toEqual([]);
    expect((await sql("select 1 from scenes where id = $1 and supprime_le is null", [creee.id])).length).toBe(1);
    await BANDEAU(page).getByRole("button", { name: "Supprimer aussi la scène" }).click();
    await expect(BANDEAU(page)).toContainText("est supprimée.");
    expect((await sql("select 1 from scenes where id = $1 and supprime_le is not null", [creee.id])).length).toBe(1);
  });

  test("F05-AC17 — « à décider plus tard » : un renvoi vide, aucune scène créée ; lui donner une destination ensuite ne demande pas de ressaisir le libellé", async ({ page }) => {
    const l = await auteur(page);
    await deuxParagraphes(page, l);
    await page.getByRole("button", { name: "Choix", exact: true }).click();
    await FICHE(page).getByLabel("Ce que fait le lecteur").fill("Faire demi-tour");
    await FICHE(page).getByRole("button", { name: "Décider plus tard" }).click();
    await expect(BANDEAU(page)).toContainText("Le choix est ajouté, sans destination : il bloquera le PDF définitif tant qu’il n’en a pas.");
    await attendreEnregistre(page);
    await expect(PHRASES(page).locator(".renvoi-copie--vide")).toHaveCount(1);
    await expect(PHRASES(page).locator(".copie__dest")).toHaveText("Sans destination");
    expect(await liensEnBase(l.projet)).toEqual(["S001 > ?"]);
    expect((await sql("select 1 from scenes where projet_id = $1", [l.projet])).length).toBe(5);

    // Le panneau est resté ouvert sur les réglages du choix créé
    await expect(FICHE(page).getByRole("heading", { name: "Choix", exact: true })).toBeVisible();
    await expect(FICHE(page).getByLabel("Ce que fait le lecteur")).toHaveValue("Faire demi-tour");
    await FICHE(page).getByRole("button", { name: "Choisir…" }).click();
    await FICHE(page).getByLabel("Chercher une scène").fill("pont");
    await FICHE(page).getByLabel("Chercher une scène").press("Enter");
    await attendreEnregistre(page);
    expect(await liensEnBase(l.projet)).toEqual(["S001 > S004"]);
    await expect(PHRASES(page).locator(".renvoi-copie--vide")).toHaveCount(0);
    await expect(PHRASES(page)).toContainText("Faire demi-tour : rends-toi au");
  });

  test("F05-AC19, F03-AC20 — récit classique : ni bouton « Choix » ni « /choix », et aucune vue « Chemins »", async ({ page }) => {
    const l = await auteur(page, "classique");
    await aller(page, sceneAdulte(l.projet, l.lisiere.scenes[0]));
    await expect(page.getByRole("button", { name: "Choix", exact: true })).toHaveCount(0);
    await ecrire(page, "Une ligne. /choix");
    await expect(page.locator(".slash")).toHaveCount(0);
    await page.keyboard.press("Enter");
    await expect(FICHE(page)).toHaveCount(0);
    await attendreEnBase(l.lisiere.scenes[0], "/choix");
    // Les cartes du chapitre suivent l'ordre du plan, sans graphe imposé
    await aller(page, `/projet/${l.projet}/chapitre/${l.lisiere.id}?vue=chemins`);
    await expect(page.locator(".fiches .fiche__ref")).toHaveText(["S001", "S002", "S003", "S004"]);
    await expect(page.getByRole("group", { name: "Vue du chapitre" })).toHaveCount(0);
    await expect(page.locator(".chemins")).toHaveCount(0);
  });

  test("F05-AC39 — au clavier seul : « /choix », le libellé, la destination choisie aux flèches, Entrée valide ; Échap referme sans rien créer et rend le curseur au texte", async ({ page }) => {
    const l = await auteur(page);
    await deuxParagraphes(page, l);
    await selectionner(page, { bloc: 1, offset: 38 });
    await page.keyboard.type(" /choix");
    await page.keyboard.press("Enter");
    await page.keyboard.type("Continuer vers la lumière");
    await page.keyboard.press("Enter");
    // Les scènes du chapitre sont proposées : la deuxième aux flèches
    await expect(PROPOSEES(page)).toHaveCount(3);
    await page.keyboard.press("ArrowDown");
    await expect(PROPOSEES(page).nth(1)).toHaveAttribute("aria-selected", "true");
    await page.keyboard.press("Enter");
    await attendreEnregistre(page);
    expect(await liensEnBase(l.projet)).toEqual(["S001 > S003"]);

    // Échap pendant la saisie : rien n'est créé, et la frappe reprend dans le texte
    await selectionner(page, { bloc: 0, offset: 30 });
    await page.keyboard.type(" /choix");
    await page.keyboard.press("Enter");
    await page.keyboard.type("Un choix abandonné");
    await page.keyboard.press("Escape");
    await expect(FICHE(page)).toHaveCount(0);
    await page.keyboard.type("Lou repartit.");
    await attendreEnBase(l.lisiere.scenes[0], "Lou repartit.");
    expect(await liensEnBase(l.projet)).toEqual(["S001 > S003"]);
    expect(await typesEnBase(l.lisiere.scenes[0])).toEqual(["p", "p", "choix"]);
  });

  test("F05-AC01 — deux destinations au même titre se distinguent par leur chapitre et le passage trouvé ; la recherche lit aussi les textes", async ({ page }) => {
    const l = await auteur(page);
    await sql("update scenes set titre = 'Faire demi-tour' where id = any($1::uuid[])", [[l.lisiere.scenes[2], l.marais.scenes[0]]]);
    await semerBlocs(l.base, l.lisiere.scenes[2], [recit("Lou revient vers la cour, devant la porte condamnée.")]);
    await semerBlocs(l.base, l.marais.scenes[0], [recit("Lou retourne au carrefour des trois saules.")]);
    await aller(page, sceneAdulte(l.projet, l.lisiere.scenes[0]));
    await page.getByRole("button", { name: "Choix", exact: true }).click();
    await FICHE(page).getByLabel("Ce que fait le lecteur").fill("Faire demi-tour");
    await FICHE(page).getByLabel("Chercher une scène").fill("demi-tour");
    const options = PROPOSEES(page);
    await expect(options).toHaveCount(2);
    // Même titre : seule celle d'un autre chapitre porte le repère de son chapitre
    await expect(options.nth(0).locator(".cx-liste__ailleurs")).toHaveCount(0);
    await expect(options.nth(1).locator(".cx-liste__ailleurs")).toHaveText("Le marais");
    // Par le texte : seul le carrefour
    await FICHE(page).getByLabel("Chercher une scène").fill("carrefour");
    await expect(options).toHaveCount(1);
    await expect(options).toContainText("Lou retourne au carrefour des trois saules.");
    await FICHE(page).getByLabel("Chercher une scène").press("Enter");
    await attendreEnregistre(page);
    expect(await liensEnBase(l.projet)).toEqual(["S001 > S005"]);
    await expect(PHRASES(page).locator(".copie__dest")).toHaveText("Faire demi-tour");
  });
});

test.describe("Modifier un choix (F05.2) — points 2 et 3 du prototype", () => {
  /** S001 : un paragraphe, puis « Continuer vers la lumière » vers S002. */
  async function avecUnChoix(page: Page, l: Livre): Promise<BlocSeme> {
    const choix = choixAuto("Continuer vers la lumière", l.lisiere.scenes[1]);
    await semerBlocs(l.base, l.lisiere.scenes[0], [recit("Lou fit un pas, puis un autre."), choix]);
    await aller(page, sceneAdulte(l.projet, l.lisiere.scenes[0]));
    return choix;
  }

  test("F05-AC20, AC21 — le libellé corrigé recompose la phrase, même construction, même destination ; la destination changée, le lien suit et l'ancienne scène n'est pas supprimée", async ({ page }) => {
    const l = await auteur(page);
    await avecUnChoix(page, l);
    await PHRASES(page).locator(".phrase-choix__corps").click();
    await FICHE(page).getByLabel("Ce que fait le lecteur").fill("Suivre la lumière");
    await FICHE(page).getByLabel("Ce que fait le lecteur").press("Enter");
    await expect(PHRASES(page)).toContainText("Suivre la lumière : rends-toi au");
    await attendreEnregistre(page);
    expect((await sceneEnBase(l.lisiere.scenes[0])).texte[1]).toMatchObject({ libelle: "Suivre la lumière", construction: "neutre", cible: l.lisiere.scenes[1] });

    await FICHE(page).getByRole("button", { name: "Changer…" }).click();
    await FICHE(page).getByLabel("Chercher une scène").fill("souche");
    await FICHE(page).getByLabel("Chercher une scène").press("Enter");
    await attendreEnregistre(page);
    expect(await liensEnBase(l.projet)).toEqual(["S001 > S003"]);
    const numeros = await numerosEnBase(l.projet);
    await expect(PHRASES(page)).toContainText(`Suivre la lumière : rends-toi au ${numeros[l.lisiere.scenes[2]]}.`);
    await expect(PHRASES(page).locator(".copie__dest")).toHaveText("La souche");
    expect((await sql("select 1 from scenes where id = $1 and supprime_le is null", [l.lisiere.scenes[1]])).length).toBe(1);
  });

  test("F05-AC10, AC22 — rien ne se tape dans une phrase de choix, dans le texte ; elle s'écrit dans le panneau, où la modifier la détache de la formule du livre : un changement de formule ne change plus que les phrases automatiques", async ({ page }) => {
    const l = await auteur(page);
    await semerBlocs(l.base, l.lisiere.scenes[0], [choixAuto("Continuer vers la lumière", l.lisiere.scenes[1]), choixAuto("Faire demi-tour", l.lisiere.scenes[2])]);
    await aller(page, sceneAdulte(l.projet, l.lisiere.scenes[0]));
    await selectionner(page, { bloc: 0, offset: 0 });
    await page.keyboard.type("Des lettres");
    await page.waitForTimeout(300);
    expect((await blocsEditeur(page))[0]).toMatchObject({ auto: true, libelle: "Continuer vers la lumière" });
    await expect(PHRASES(page).nth(0)).toContainText("Continuer vers la lumière : rends-toi au");

    // Dans le panneau, la phrase automatique se lit et se modifie, autour de son numéro
    await PHRASES(page).nth(0).locator(".phrase-choix__corps").click();
    await expect(TEXTES(page)).toHaveText(["Continuer vers la lumière : rends-toi au ", "."]);
    await expect(FICHE(page).locator(".cx-etat")).toHaveCount(0);
    await ecrireDansLaPhrase(page, 0, "Si le chant t’attire : ", "début");
    await expect(FICHE(page).locator(".cx-etat")).toHaveText("modifiée");
    // Ce qu'on tape se lit aussitôt dans le texte de la scène
    await expect(PHRASES(page).nth(0)).toContainText("Si le chant t’attire : Continuer vers la lumière : rends-toi au");
    await attendreEnBase(l.lisiere.scenes[0], "Si le chant t’attire");
    const perso = (await sceneEnBase(l.lisiere.scenes[0])).texte[0];
    expect(perso).not.toHaveProperty("auto");
    expect(enClair([perso])).toEqual(["Si le chant t’attire : Continuer vers la lumière : rends-toi au ."]);
    expect(await liensEnBase(l.projet)).toEqual(["S001 > S002", "S001 > S003"]);

    // Le livre passe à « va au » : la phrase automatique suit, la phrase modifiée non
    await sql("update preparations set formule_renvoi = 'va' where projet_id = $1", [l.projet]);
    await page.reload();
    await expect(PHRASES(page).nth(0)).toContainText("Si le chant t’attire : Continuer vers la lumière : rends-toi au");
    await expect(PHRASES(page).nth(1)).toContainText("Faire demi-tour : va au");
    // La formule n'est écrite dans aucun texte : celui de la phrase automatique n'a pas changé
    expect(JSON.stringify((await sceneEnBase(l.lisiere.scenes[0])).texte[1])).not.toMatch(/va au|rends-toi/);
  });

  test("F05-AC23 — la flèche ronde remet la phrase automatique, sans avertissement ; la phrase à deux destinations ne le propose pas", async ({ page }) => {
    const l = await auteur(page);
    await semerBlocs(l.base, l.lisiere.scenes[0], [
      choixPerso("Suivre la lumière", ["Si le chant t’attire, suis la lumière au ", renvoi(l.lisiere.scenes[1]), "."]),
      choixPerso("La porte", ["Va au ", renvoi(l.lisiere.scenes[2]), " ou au ", renvoi(l.lisiere.scenes[3]), "."]),
    ]);
    await aller(page, sceneAdulte(l.projet, l.lisiere.scenes[0]));
    await PHRASES(page).nth(1).getByRole("button", { name: "Régler ce choix" }).click();
    await expect(FICHE(page).getByRole("button", { name: "Phrase automatique" })).toBeDisabled();
    await FICHE(page).getByRole("button", { name: "Fermer la fiche" }).click();

    await PHRASES(page).nth(0).getByRole("button", { name: "Régler ce choix" }).click();
    await expect(FICHE(page).locator(".cx-etat")).toHaveText("modifiée");
    await FICHE(page).getByRole("button", { name: "Remettre la phrase automatique" }).click();
    await expect(FICHE(page).getByRole("alert")).toHaveCount(0);
    await expect(FICHE(page).locator(".cx-etat")).toHaveCount(0);
    await expect(TEXTES(page)).toHaveText(["Suivre la lumière : rends-toi au ", "."]);
    await expect(PHRASES(page).nth(0)).toContainText("Suivre la lumière : rends-toi au");
    await attendreEnregistre(page);
    expect((await sceneEnBase(l.lisiere.scenes[0])).texte[0]).toMatchObject({ auto: true, libelle: "Suivre la lumière", cible: l.lisiere.scenes[1] });
    expect(await liensEnBase(l.projet)).toEqual(["S001 > S002", "S001 > S003", "S001 > S004"]);
  });

  test("F05-AC09, AC57 — « + » ajoute une destination : son numéro se pose à la fin de la phrase, où l'on écrit autour ; tirer une destination au-dessus de l'autre échange les numéros de la phrase", async ({ page }) => {
    const l = await auteur(page);
    await semerBlocs(l.base, l.lisiere.scenes[0], [choixPerso("La porte", ["Si tu as la clé d’argent, ouvre la porte au ", renvoi(l.lisiere.scenes[1]), " ; sinon, déchiffre les symboles au"])]);
    await aller(page, sceneAdulte(l.projet, l.lisiere.scenes[0]));
    await PHRASES(page).getByRole("button", { name: "Régler ce choix" }).click();
    await expect(DESTINATIONS(page)).toHaveCount(1);
    await expect(DESTINATIONS(page).getByRole("button", { name: "Retirer" })).toHaveCount(0);
    await FICHE(page).getByRole("button", { name: "Ajouter une destination" }).click();
    await FICHE(page).getByLabel("Chercher une scène").fill("souche");
    await FICHE(page).getByLabel("Chercher une scène").press("Enter");
    await expect(DESTINATIONS(page)).toHaveCount(2);
    await expect(DESTINATIONS(page).locator(".cx-dest__nom")).toHaveText(["Clairière", "La souche"]);
    // Le numéro est à la fin de la phrase : on écrit le point après lui
    await expect(TEXTES(page)).toHaveCount(3);
    await ecrireDansLaPhrase(page, 2, ".", "fin");
    await attendreEnregistre(page);
    expect(await liensEnBase(l.projet)).toEqual(["S001 > S002", "S001 > S003"]);
    const numeros = await numerosEnBase(l.projet);
    await expect.poll(() => lue(PHRASES(page).locator(".recit"))).toBe(
      `Si tu as la clé d’argent, ouvre la porte au ${numeros[l.lisiere.scenes[1]]} ; sinon, déchiffre les symboles au ${numeros[l.lisiere.scenes[2]]}.`,
    );

    // F05-AC57 — l'ordre des destinations : la seconde tirée au-dessus de la première, les numéros s'échangent dans la phrase
    await tirer(page, DESTINATIONS(page).nth(1).locator(".prise"), DESTINATIONS(page).nth(0));
    await expect(DESTINATIONS(page).locator(".cx-dest__nom")).toHaveText(["La souche", "Clairière"]);
    await expect.poll(() => lue(PHRASES(page).locator(".recit"))).toBe(
      `Si tu as la clé d’argent, ouvre la porte au ${numeros[l.lisiere.scenes[2]]} ; sinon, déchiffre les symboles au ${numeros[l.lisiere.scenes[1]]}.`,
    );
    await attendreEnregistre(page);
    const phrase = (await sceneEnBase(l.lisiere.scenes[0])).texte[0];
    expect(phrase.children.filter((x) => (x as { type?: string }).type === "renvoi").map((x) => (x as { cible?: string }).cible)).toEqual([l.lisiere.scenes[2], l.lisiere.scenes[1]]);
  });

  test("F05-AC11 — la flèche ronde tire une autre tournure pour une phrase automatique, qui reste enregistrée ; avec une seule tournure cochée, elle ne sert pas", async ({ page }) => {
    const l = await auteur(page);
    await sql("update preparations set constructions = '{neutre,pour,si}' where projet_id = $1", [l.projet]);
    await semerBlocs(l.base, l.lisiere.scenes[0], [recit("Lou écoute."), choixAuto("Suivre le chant", l.lisiere.scenes[3])]);
    await aller(page, sceneAdulte(l.projet, l.lisiere.scenes[0]));
    await PHRASES(page).locator(".phrase-choix__corps").click();
    await FICHE(page).getByRole("button", { name: "Autre tournure" }).click();
    await expect(PHRASES(page)).toContainText(/^(Pour suivre le chant, rends-toi au|Si tu veux suivre le chant, rends-toi au)/);
    await attendreEnregistre(page);
    const construction = ((await sceneEnBase(l.lisiere.scenes[0])).texte[1] as { construction?: string }).construction;
    expect(["pour", "si"]).toContain(construction);
    // Décocher cette construction dans la préparation ne récrit pas la phrase
    await sql("update preparations set constructions = '{neutre}' where projet_id = $1", [l.projet]);
    await page.reload();
    await expect(PHRASES(page)).toContainText(construction === "pour" ? "Pour suivre le chant, rends-toi au" : "Si tu veux suivre le chant, rends-toi au");
    await PHRASES(page).locator(".phrase-choix__corps").click();
    await expect(FICHE(page).getByRole("button", { name: "Phrase automatique" })).toBeDisabled();
  });

  test("F05-AC24, AC25 — retirer une destination sur deux : son lien disparaît, l'autre reste ; avec une seule destination, rien ne la retire : on supprime le choix, et « Annuler » rétablit phrase, renvoi et lien", async ({ page }) => {
    const l = await auteur(page);
    await semerBlocs(l.base, l.lisiere.scenes[0], [recit("Devant la porte."), choixPerso("La porte", ["Va au ", renvoi(l.lisiere.scenes[2]), " ou au ", renvoi(l.lisiere.scenes[3]), "."])]);
    await aller(page, sceneAdulte(l.projet, l.lisiere.scenes[0]));
    await PHRASES(page).getByRole("button", { name: "Régler ce choix" }).click();
    await DESTINATIONS(page).nth(1).getByRole("button", { name: "Retirer" }).click();
    await expect(BANDEAU(page)).toContainText("1 renvoi retiré.");
    await attendreEnregistre(page);
    expect(await liensEnBase(l.projet)).toEqual(["S001 > S003"]);
    expect((await sql("select 1 from scenes where id = $1 and supprime_le is null", [l.lisiere.scenes[3]])).length).toBe(1);
    // Le texte qui entourait le renvoi reste, à réécrire
    expect(enClair([(await sceneEnBase(l.lisiere.scenes[0])).texte[1]])).toEqual(["Va au  ou au ."]);

    // Une seule destination : pas de « Retirer », un choix sans destination n'en serait plus un
    await expect(DESTINATIONS(page)).toHaveCount(1);
    await expect(DESTINATIONS(page).getByRole("button", { name: "Retirer" })).toHaveCount(0);
    await FICHE(page).getByRole("button", { name: "Supprimer ce choix" }).click();
    await expect(PHRASES(page)).toHaveCount(0);
    await expect(BANDEAU(page)).toContainText("1 choix supprimé.");
    await attendreEnregistre(page);
    expect(await liensEnBase(l.projet)).toEqual([]);
    await BANDEAU(page).getByRole("button", { name: "Annuler" }).click();
    await expect(PHRASES(page)).toHaveCount(1);
    await attendreEnregistre(page);
    expect(await liensEnBase(l.projet)).toEqual(["S001 > S003"]);
  });

  test("le numéro est d'un seul bloc : dans le panneau on écrit autour, jamais dedans, et le retour arrière contre lui ne l'efface pas", async ({ page }) => {
    const l = await auteur(page);
    const r = renvoi(l.lisiere.scenes[1]);
    await semerBlocs(l.base, l.lisiere.scenes[0], [choixPerso("Suivre la lumière", ["Suis la lumière au ", r, "."])]);
    await aller(page, sceneAdulte(l.projet, l.lisiere.scenes[0]));
    await PHRASES(page).getByRole("button", { name: "Régler ce choix" }).click();
    await ecrireDansLaPhrase(page, 0, "n° ", "fin");
    await ecrireDansLaPhrase(page, 1, " exactement", "début");
    await attendreEnBase(l.lisiere.scenes[0], "exactement");
    let phrase = (await sceneEnBase(l.lisiere.scenes[0])).texte[0];
    expect(enClair([phrase])).toEqual(["Suis la lumière au n°  exactement."]);
    expect(phrase.children[1]).toMatchObject({ type: "renvoi", id: r.id, cible: l.lisiere.scenes[1] });

    // Le retour arrière au début du second texte passe par-dessus le numéro et efface la fin du premier
    await ecrireDansLaPhrase(page, 1, "", "début");
    await page.keyboard.press("Backspace");
    await page.keyboard.press("Backspace");
    await attendreEnBase(l.lisiere.scenes[0], "au n°");
    await expect.poll(async () => enClair([(await sceneEnBase(l.lisiere.scenes[0])).texte[0]])).toEqual(["Suis la lumière au n° exactement."]);
    phrase = (await sceneEnBase(l.lisiere.scenes[0])).texte[0];
    expect(phrase.children[1]).toMatchObject({ type: "renvoi", id: r.id, cible: l.lisiere.scenes[1] });
    expect(await liensEnBase(l.projet)).toEqual(["S001 > S002"]);
  });
});

test.describe("Robustesse du texte (F05.2) — points 1, 5 et 6 du prototype", () => {
  for (const forme of ["automatique", "personnalisée"] as const) {
    test(`F05-AC28 — sélection à cheval sur une phrase ${forme} : la fin du paragraphe et la phrase entière partent, le lien avec ; « 1 choix supprimé », et « Annuler » rétablit le tout`, async ({ page }) => {
      const l = await auteur(page);
      const phrase = forme === "automatique" ? choixAuto("Continuer vers la lumière", l.lisiere.scenes[1]) : choixPerso("Continuer", ["Pour continuer, va au ", renvoi(l.lisiere.scenes[1]), " sans attendre."]);
      await semerBlocs(l.base, l.lisiere.scenes[0], [recit("Lou fit un pas, puis un autre."), phrase, recit("La nuit tombait.")]);
      await aller(page, sceneAdulte(l.projet, l.lisiere.scenes[0]));
      // Du milieu du paragraphe au milieu de la phrase de choix
      await selectionner(page, { bloc: 0, offset: 15 }, forme === "automatique" ? { bloc: 1, offset: 0 } : { bloc: 1, enfant: 0, offset: 8 });
      await page.keyboard.press("Delete");
      await expect(BANDEAU(page)).toContainText("1 choix supprimé.");
      await attendreEnregistre(page);
      expect(enClair((await sceneEnBase(l.lisiere.scenes[0])).texte)).toEqual(["Lou fit un pas,", "La nuit tombait."]);
      expect(await liensEnBase(l.projet)).toEqual([]);
      expect((await sql("select 1 from scenes where id = $1 and supprime_le is null", [l.lisiere.scenes[1]])).length).toBe(1);

      await BANDEAU(page).getByRole("button", { name: "Annuler" }).click();
      await attendreEnregistre(page);
      expect(await typesEnBase(l.lisiere.scenes[0])).toEqual(["p", "choix", "p"]);
      expect(enClair([(await sceneEnBase(l.lisiere.scenes[0])).texte[0]])).toEqual(["Lou fit un pas, puis un autre."]);
      expect(await liensEnBase(l.projet)).toEqual(["S001 > S002"]);
    });
  }

  test("« tout sélectionner » puis frappe : tout est remplacé, les choix partent avec leurs liens, et le texte peut être annulé au clavier", async ({ page }) => {
    const l = await auteur(page);
    await semerBlocs(l.base, l.lisiere.scenes[0], [recit("Lou fit un pas."), choixAuto("Continuer", l.lisiere.scenes[1]), choixAuto("Reculer", l.lisiere.scenes[2])]);
    await aller(page, sceneAdulte(l.projet, l.lisiere.scenes[0]));
    await copie(page).locator("p").first().click();
    await page.keyboard.press(`${MOD}+a`);
    await page.waitForTimeout(150);
    await page.keyboard.type("Tout recommence.");
    await expect(BANDEAU(page)).toContainText("2 choix supprimés.");
    await attendreEnregistre(page);
    expect(enClair((await sceneEnBase(l.lisiere.scenes[0])).texte)).toEqual(["Tout recommence."]);
    expect(await liensEnBase(l.projet)).toEqual([]);
    // Un geste efface la frappe, le suivant rend le récit, les phrases et leurs liens
    await page.keyboard.press(`${MOD}+z`);
    await page.keyboard.press(`${MOD}+z`);
    await expect(PHRASES(page)).toHaveCount(2);
    await attendreEnregistre(page);
    expect(await liensEnBase(l.projet)).toEqual(["S001 > S002", "S001 > S003"]);
  });

  test("fusion : le retour arrière au début d'un paragraphe et « Suppr. » à la fin du précédent ne mêlent jamais récit et phrase de choix", async ({ page }) => {
    const l = await auteur(page);
    await semerBlocs(l.base, l.lisiere.scenes[0], [
      recit("Avant."), choixAuto("Continuer", l.lisiere.scenes[1]), recit("Entre."), choixPerso("Reculer", ["Recule au ", renvoi(l.lisiere.scenes[2]), "."]), recit("Après."),
    ]);
    await aller(page, sceneAdulte(l.projet, l.lisiere.scenes[0]));
    const { version } = await sceneEnBase(l.lisiere.scenes[0]);
    const intact = async () => {
      const blocs = await blocsEditeur(page);
      expect(blocs.map((b) => b.type)).toEqual(["p", "choix", "p", "choix", "p"]);
      // Aucun renvoi n'est entré dans un paragraphe de récit
      for (const b of blocs.filter((x) => x.type === "p")) expect((b.children as { type?: string }[]).some((x) => x.type)).toBe(false);
    };
    await selectionner(page, { bloc: 2, offset: 0 });
    await page.keyboard.press("Backspace");
    await intact();
    await selectionner(page, { bloc: 0, offset: 6 });
    await page.keyboard.press("Delete");
    await intact();
    await selectionner(page, { bloc: 4, offset: 0 });
    await page.keyboard.press("Backspace");
    await intact();
    await selectionner(page, { bloc: 2, offset: 6 });
    await page.keyboard.press("Delete");
    await intact();
    await page.waitForTimeout(400);
    expect(await liensEnBase(l.projet)).toEqual(["S001 > S002", "S001 > S003"]);
    // Rien n'a changé : rien n'a donc été enregistré
    expect((await sceneEnBase(l.lisiere.scenes[0])).version).toBe(version);
  });

  test("un renvoi forcé par programme dans un paragraphe de récit est retiré ; une phrase de choix sans renvoi redevient du récit", async ({ page }) => {
    const l = await auteur(page);
    await semerBlocs(l.base, l.lisiere.scenes[0], [recit("Lou fit un pas.")]);
    await aller(page, sceneAdulte(l.projet, l.lisiere.scenes[0]));
    await page.evaluate((cible) => {
      const e = (window as unknown as { __copie: { tf: { insertNodes: (n: unknown, o: unknown) => void } } }).__copie;
      e.tf.insertNodes({ type: "renvoi", id: crypto.randomUUID(), cible, children: [{ text: "" }] }, { at: [0, 0] });
      e.tf.insertNodes({ type: "choix", id: crypto.randomUUID(), libelle: "Vide", children: [{ text: "Une phrase sans renvoi" }] }, { at: [1] });
    }, l.lisiere.scenes[1]);
    await attendreEnBase(l.lisiere.scenes[0], "Une phrase sans renvoi");
    const enBase = await sceneEnBase(l.lisiere.scenes[0]);
    expect(enBase.texte.map((b) => b.type)).toEqual(["p", "p"]);
    expect(JSON.stringify(enBase.texte)).not.toContain('"type":"renvoi"');
    expect(await liensEnBase(l.projet)).toEqual([]);
  });

  test("point 12 — la phrase se sélectionne aux flèches comme un bloc ; Entrée ouvre sa fiche, Suppr. la supprime avec le message ; F05-AC40 — Alt et une flèche la déplacent, liens inchangés", async ({ page }) => {
    const l = await auteur(page);
    await semerBlocs(l.base, l.lisiere.scenes[0], [recit("Lou hésita."), choixAuto("Prendre à gauche", l.lisiere.scenes[1]), choixAuto("Prendre à droite", l.lisiere.scenes[2])]);
    await aller(page, sceneAdulte(l.projet, l.lisiere.scenes[0]));
    await selectionner(page, { bloc: 0, offset: 11 });
    await page.keyboard.press("ArrowRight");
    await expect(PHRASES(page).nth(0)).toHaveClass(/est-choisi/);
    await page.keyboard.press("ArrowDown");
    await expect(PHRASES(page).nth(1)).toHaveClass(/est-choisi/);
    await page.keyboard.press("Enter");
    await expect(FICHE(page).getByLabel("Ce que fait le lecteur")).toHaveValue("Prendre à droite");
    await page.keyboard.press("Escape");
    await expect(FICHE(page)).toHaveCount(0);

    // Alt et flèche haut : la seconde passe au-dessus de la première
    await page.keyboard.press("Alt+ArrowUp");
    await attendreEnregistre(page);
    expect((await sceneEnBase(l.lisiere.scenes[0])).texte.map((b) => (b as { libelle?: string }).libelle)).toEqual([undefined, "Prendre à droite", "Prendre à gauche"]);
    expect(await liensEnBase(l.projet)).toEqual(["S001 > S003", "S001 > S002"]);

    await page.keyboard.press("Delete");
    await expect(BANDEAU(page)).toContainText("1 choix supprimé.");
    await attendreEnregistre(page);
    expect(await liensEnBase(l.projet)).toEqual(["S001 > S002"]);
    // Après la dernière phrase, la flèche bas ouvre un paragraphe où écrire
    await selectionner(page, { bloc: 1, offset: 0 });
    await page.keyboard.press("ArrowDown");
    await page.keyboard.type("La suite.");
    await attendreEnBase(l.lisiere.scenes[0], "La suite.");
    expect(await typesEnBase(l.lisiere.scenes[0])).toEqual(["p", "choix", "p"]);
  });

  test("F05-AC40 — la phrase se tire par son repère de prise, dans la marge ; un paragraphe de récit n'en a pas", async ({ page }) => {
    const l = await auteur(page);
    await semerBlocs(l.base, l.lisiere.scenes[0], [recit("Lou hésita."), choixAuto("Prendre à gauche", l.lisiere.scenes[1]), choixAuto("Prendre à droite", l.lisiere.scenes[2]), recit("Fin.")]);
    await aller(page, sceneAdulte(l.projet, l.lisiere.scenes[0]));
    await expect(copie(page).locator("p .prise")).toHaveCount(0);
    await expect(PHRASES(page).locator(".prise")).toHaveCount(2);
    const prise = (await PHRASES(page).nth(1).locator(".prise").boundingBox())!;
    const cible = (await PHRASES(page).nth(0).boundingBox())!;
    await page.mouse.move(prise.x + prise.width / 2, prise.y + prise.height / 2);
    await page.mouse.down();
    await page.mouse.move(prise.x + 4, cible.y + 4, { steps: 8 });
    await expect(PHRASES(page).nth(0)).toHaveClass(/se-pose-avant/);
    await page.mouse.up();
    await attendreEnregistre(page);
    expect((await sceneEnBase(l.lisiere.scenes[0])).texte.map((b) => (b as { libelle?: string }).libelle)).toEqual([undefined, "Prendre à droite", "Prendre à gauche", undefined]);
    expect(await liensEnBase(l.projet)).toEqual(["S001 > S003", "S001 > S002"]);
  });
});

test.describe("Panneau des réglages, à droite du texte (F05.2)", () => {
  test("F05-AC53 — les réglages d'un choix s'ouvrent à droite, à la place de la consigne, sans déplacer le texte ; écrire ailleurs referme le panneau ; déplacer la phrase, ou écrire sa phrase dans le panneau, le laisse ouvert", async ({ page }) => {
    const l = await auteur(page);
    await semerBlocs(l.base, l.lisiere.scenes[0], [recit("Lou hésita."), choixAuto("Prendre à gauche", l.lisiere.scenes[1]), choixAuto("Prendre à droite", l.lisiere.scenes[2]), recit("Fin.")]);
    await aller(page, sceneAdulte(l.projet, l.lisiere.scenes[0]));
    const panneau = page.locator(".cote-copie .panneau-copie");
    const consigne = page.getByRole("textbox", { name: "Consigne" });
    const places = async () => Promise.all([copie(page).locator("p").first(), PHRASES(page).nth(0), PHRASES(page).nth(1), copie(page).locator("p").last()].map(async (b) => (await b.boundingBox())!.y));
    await expect(consigne).toBeVisible();
    const avant = await places();

    // La fiche s'ouvre à droite : la consigne lui laisse la place, aucun bloc du texte ne bouge
    await PHRASES(page).nth(1).locator(".phrase-choix__corps").click();
    await expect(panneau.getByLabel("Ce que fait le lecteur")).toHaveValue("Prendre à droite");
    await expect(consigne).toBeHidden();
    await expect(copie(page).locator(".cx")).toHaveCount(0);
    expect(await places()).toEqual(avant);
    const fiche = (await panneau.boundingBox())!;
    const texte = (await copie(page).boundingBox())!;
    expect(fiche.x).toBeGreaterThan(texte.x + texte.width);

    // Déplacer la phrase par son repère de prise : le panneau reste ouvert, sur la même phrase
    const prise = (await PHRASES(page).nth(1).locator(".prise").boundingBox())!;
    const cible = (await PHRASES(page).nth(0).boundingBox())!;
    await page.mouse.move(prise.x + prise.width / 2, prise.y + prise.height / 2);
    await page.mouse.down();
    await page.mouse.move(prise.x + 4, cible.y + 4, { steps: 8 });
    await expect(PHRASES(page).nth(0)).toHaveClass(/se-pose-avant/);
    await page.mouse.up();
    await expect(PHRASES(page).nth(0)).toContainText("Prendre à droite");
    await expect(panneau.getByLabel("Ce que fait le lecteur")).toHaveValue("Prendre à droite");
    await expect(PHRASES(page).nth(0)).toHaveClass(/est-ouvert/);

    // On se remet à écrire dans le récit : le panneau se referme, la consigne revient
    await selectionner(page, { bloc: 3, offset: 4 });
    await page.keyboard.type(" Vraiment.");
    await expect(panneau).toHaveCount(0);
    await expect(consigne).toBeVisible();
    await attendreEnBase(l.lisiere.scenes[0], "Fin. Vraiment.");

    // La phrase s'écrit dans le panneau : le texte de la scène la suit, le panneau reste ouvert
    await PHRASES(page).nth(1).locator(".phrase-choix__corps").click();
    await ecrireDansLaPhrase(page, 1, " Vite", "fin");
    await expect(PHRASES(page).nth(1)).toContainText("Vite");
    await expect(panneau.locator(".cx")).toBeVisible();
    // La croix du panneau le referme
    await panneau.locator(".cx__fermer").click();
    await expect(panneau).toHaveCount(0);
  });

  test("F05-AC54 — écran étroit : le panneau monte du bas de l'écran, par-dessus le texte, sans le déplacer", async ({ page }) => {
    const l = await auteur(page);
    await semerBlocs(l.base, l.lisiere.scenes[0], [recit("Lou hésita."), choixAuto("Prendre à gauche", l.lisiere.scenes[1])]);
    await page.setViewportSize({ width: 390, height: 800 });
    await aller(page, sceneAdulte(l.projet, l.lisiere.scenes[0]));
    const avant = (await PHRASES(page).boundingBox())!.y;
    await PHRASES(page).locator(".phrase-choix__corps").click();
    const panneau = page.locator(".cote-copie .panneau-copie");
    await expect(panneau.getByLabel("Ce que fait le lecteur")).toBeVisible();
    expect((await PHRASES(page).boundingBox())!.y).toBe(avant);
    const boite = (await panneau.boundingBox())!;
    expect(Math.round(boite.y + boite.height)).toBe(800);
    expect(boite.height).toBeLessThanOrEqual(800 * 0.62 + 1);
  });
});

test.describe("Presse-papiers (F05.2) — point 7 du prototype", () => {
  test("F05-AC30, AC31 — couper-coller vers une autre scène déplace le même choix ; copier-coller en crée un autre, que l'on modifie sans toucher au premier", async ({ page, context }) => {
    test.setTimeout(120_000);
    const l = await auteur(page);
    const choix = choixAuto("Continuer vers la lumière", l.lisiere.scenes[2]);
    await semerBlocs(l.base, l.lisiere.scenes[0], [recit("Lou fit un pas, puis un autre."), choix]);
    await semerBlocs(l.base, l.lisiere.scenes[1], [recit("Le sentier montait entre les fougères."), recit("Lou hésita.")]);
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await aller(page, sceneAdulte(l.projet, l.lisiere.scenes[0]));
    await selectionner(page, { bloc: 1, offset: 0 });
    await page.keyboard.press(`${MOD}+x`);
    await attendreEnregistre(page);
    expect(await typesEnBase(l.lisiere.scenes[0])).toEqual(["p"]);
    expect(await liensEnBase(l.projet)).toEqual([]);

    await aller(page, sceneAdulte(l.projet, l.lisiere.scenes[1]));
    await selectionner(page, { bloc: 0, offset: 38 });
    await page.keyboard.press(`${MOD}+v`);
    await expect(BANDEAU(page)).toContainText("1 choix déplacé.");
    await attendreEnregistre(page);
    let b = (await sceneEnBase(l.lisiere.scenes[1])).texte;
    expect(b.map((x) => x.type)).toEqual(["p", "choix", "p"]);
    // Le même choix : même identité, même libellé, même forme, même destination
    expect(b[1]).toEqual(choix);
    expect(await liensEnBase(l.projet)).toEqual(["S002 > S003"]);

    // Copier-coller dans S004 : deux choix distincts mènent à S003
    await selectionner(page, { bloc: 1, offset: 0 });
    await page.keyboard.press(`${MOD}+c`);
    await aller(page, sceneAdulte(l.projet, l.lisiere.scenes[3]));
    await copie(page).click();
    await page.keyboard.press(`${MOD}+v`);
    await expect(BANDEAU(page)).toContainText("1 choix copié.");
    await attendreEnregistre(page);
    b = (await sceneEnBase(l.lisiere.scenes[3])).texte;
    expect(b.map((x) => x.type)).toEqual(["choix"]);
    expect(b[0].id).not.toBe(choix.id);
    expect(b[0]).toMatchObject({ libelle: "Continuer vers la lumière", cible: l.lisiere.scenes[2] });
    expect((await liensEnBase(l.projet)).sort()).toEqual(["S002 > S003", "S004 > S003"]);
    await PHRASES(page).locator(".phrase-choix__corps").click();
    await FICHE(page).getByLabel("Ce que fait le lecteur").fill("Suivre la lumière");
    await FICHE(page).getByLabel("Ce que fait le lecteur").press("Enter");
    await attendreEnregistre(page);
    expect(((await sceneEnBase(l.lisiere.scenes[1])).texte[1] as { libelle?: string }).libelle).toBe("Continuer vers la lumière");
  });

  test("vers l'extérieur, la phrase sort en texte simple, avec le numéro affiché ; F05-AC33 — « rends-toi au 12 » collé depuis Word reste du texte ordinaire", async ({ page }) => {
    const l = await auteur(page);
    await semerBlocs(l.base, l.lisiere.scenes[0], [recit("Lou fit un pas."), choixAuto("Continuer vers la lumière", l.lisiere.scenes[1])]);
    await aller(page, sceneAdulte(l.projet, l.lisiere.scenes[0]));
    await copie(page).locator("p").first().click();
    await page.keyboard.press(`${MOD}+a`);
    await page.waitForTimeout(150);
    await page.keyboard.press(`${MOD}+c`);
    const numeros = await numerosEnBase(l.projet);
    expect(await presseTexte(page)).toBe(`Lou fit un pas.\nContinuer vers la lumière : rends-toi au ${numeros[l.lisiere.scenes[1]]}.`);

    await selectionner(page, { bloc: 0, offset: 15 });
    await collerDepuisAilleurs(page, "<p class=MsoNormal>Si tu hésites, rends-toi au 12.</p>", "Si tu hésites, rends-toi au 12.");
    await attendreEnBase(l.lisiere.scenes[0], "rends-toi au 12");
    const enBase = await sceneEnBase(l.lisiere.scenes[0]);
    expect(enBase.texte.map((x) => x.type)).toEqual(["p", "choix"]);
    expect(enClair([enBase.texte[0]])).toEqual(["Lou fit un pas.Si tu hésites, rends-toi au 12."]);
    expect(await liensEnBase(l.projet)).toEqual(["S001 > S002"]);
  });

  test("F05-AC45 — une phrase de choix copiée, collée au milieu d'un paragraphe de récit, forme une phrase de choix juste en dessous ; le paragraphe reste entier et sans renvoi", async ({ page, context }) => {
    const l = await auteur(page);
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await semerBlocs(l.base, l.lisiere.scenes[0], [
      recit("Lou fit un pas, puis un autre."),
      choixPerso("Suivre la lumière", ["Si le chant t’attire, suis la lumière au ", renvoi(l.lisiere.scenes[1]), "."]),
    ]);
    await aller(page, sceneAdulte(l.projet, l.lisiere.scenes[0]));
    // La phrase est un bloc : le curseur posé sur elle, elle se copie entière
    await selectionner(page, { bloc: 1, offset: 0 });
    await page.keyboard.press(`${MOD}+c`);
    await selectionner(page, { bloc: 0, offset: 15 });
    await page.keyboard.press(`${MOD}+v`);
    await expect(BANDEAU(page)).toContainText("1 choix copié.");
    await attendreEnregistre(page);
    const enBase = await sceneEnBase(l.lisiere.scenes[0]);
    expect(enBase.texte.map((x) => x.type)).toEqual(["p", "choix", "choix"]);
    expect(enClair([enBase.texte[0]])).toEqual(["Lou fit un pas, puis un autre."]);
    expect(enClair([enBase.texte[1]])).toEqual(["Si le chant t’attire, suis la lumière au ."]);
    expect(await liensEnBase(l.projet)).toEqual(["S001 > S002", "S001 > S002"]);
  });

  test("un texte brut de plusieurs lignes fait un paragraphe par ligne ; un fragment forgé vers une scène inconnue est écarté", async ({ page }) => {
    const l = await auteur(page);
    await semerBlocs(l.base, l.lisiere.scenes[0], [recit("Début."), choixAuto("Continuer", l.lisiere.scenes[1])]);
    await aller(page, sceneAdulte(l.projet, l.lisiere.scenes[0]));
    await selectionner(page, { bloc: 0, offset: 6 });
    await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.evaluate(() => navigator.clipboard.writeText("Ligne une.\nLigne deux.\n\nLigne trois."));
    await page.keyboard.press(`${MOD}+v`);
    await attendreEnBase(l.lisiere.scenes[0], "Ligne trois.");
    expect(enClair((await sceneEnBase(l.lisiere.scenes[0])).texte.filter((b) => b.type === "p"))).toEqual(["Début.Ligne une.", "Ligne deux.", "Ligne trois."]);
    expect(await typesEnBase(l.lisiere.scenes[0])).toEqual(["p", "p", "p", "choix"]);

    // Un fragment fabriqué à la main, qui vise une scène d'un autre livre
    await page.evaluate(() => {
      const forge = [{ type: "choix", id: crypto.randomUUID(), auto: true, libelle: "Passer ailleurs", construction: "neutre", cible: crypto.randomUUID(), children: [{ text: "" }] }];
      const donnees = new DataTransfer();
      donnees.setData("application/x-slate-fragment", btoa(encodeURIComponent(JSON.stringify(forge))));
      (window as unknown as { __copie: { tf: { insertData: (d: DataTransfer) => void } } }).__copie.tf.insertData(donnees);
    });
    await expect(BANDEAU(page)).toContainText("La phrase de choix n’a pas été collée");
    await page.waitForTimeout(300);
    expect(await liensEnBase(l.projet)).toEqual(["S001 > S002"]);
    expect((await blocsEditeur(page)).filter((b) => b.type === "choix")).toHaveLength(1);
  });
});

test.describe("Élèves et choix (F05.2, F06.1)", () => {
  test("F05-AC29, AC42, F06-AC45 — Alice, « écriture et propositions » : ni bouton ni « /choix » ; la phrase préparée porte un cadenas et le lieu sans la référence ; elle écrit autour, et tout sélectionner puis supprimer laisse la phrase et son lien", async ({ page, browser }) => {
    test.setTimeout(120_000);
    const s = await classeQuiEcrit(page);
    const [s15, s16] = s.lisiere.scenes;
    await s.base.from("scenes").update({ titre: "Clairière" }).eq("id", s16);
    const choix = choixAuto("Traverser le pont", s16);
    await semerBlocs(s.base, s15, [recit("Lou fit un pas."), choix, recit("Puis un autre.")]);
    const alice = await posteDe(browser, s, "Alice");
    await aller(alice.page, sceneEleve(s15));
    await expect(alice.page.getByRole("button", { name: "Choix", exact: true })).toHaveCount(0);
    const numeros = await numerosEnBase(s.projet);
    const phrase = PHRASES(alice.page);
    await expect(phrase.locator(".recit")).toHaveText(`Traverser le pont : rends-toi au ${numeros[s16]}.`);
    // Un seul numéro pour l'élève : celui du livre. Le lieu, sans « S002 »
    await expect(phrase.locator(".copie__dest")).toHaveText("Clairière");
    await expect(phrase).toContainText("Choix préparé : tu écris autour");
    await expect(phrase.locator(".prise")).toHaveCount(0);
    await ecrire(alice.page, " /choix");
    await expect(alice.page.locator(".slash")).toHaveCount(0);

    // Elle clique la phrase : rien ne s'ouvre, rien ne s'y écrit
    await phrase.locator(".phrase-choix__corps").click();
    await alice.page.keyboard.type("Nager jusqu’à l’autre rive");
    await expect(alice.page.locator(".cx")).toHaveCount(0);
    await alice.page.keyboard.press("Backspace");
    await expect(phrase).toHaveCount(1);
    // Tout sélectionner, puis remplacer : le récit est remplacé, la phrase demeure avec son lien
    await copie(alice.page).locator("p").first().click();
    await alice.page.keyboard.press(`${MOD}+a`);
    await alice.page.waitForTimeout(150);
    await alice.page.keyboard.type("Tout mon texte.");
    await attendreEnBase(s15, "Tout mon texte.");
    const enBase = await sceneEnBase(s15);
    expect(enBase.texte.map((b) => b.type)).toEqual(["p", "choix", "p"]);
    expect(enClair(enBase.texte)).toEqual(["Tout mon texte.", "", ""]);
    expect(enBase.texte[1]).toEqual(choix);
    expect(await liensEnBase(s.projet)).toEqual(["S001 > S002"]);
    await expect(pied(alice.page)).toHaveText("Enregistré", { timeout: 8_000 });
    // L'enseignante lit le même lieu, sans référence non plus
    await aller(page, sceneAdulte(s.projet, s15));
    await expect(PHRASES(page).locator(".copie__dest")).toHaveText("Clairière");
    await alice.contexte.close();
  });

  test("F06-AC46, AC52, F05-AC47 — Bilal, « écriture et organisation » : il crée un choix vers une scène de son chapitre, reformule un choix interne ; une phrase qui porte un raccord reste préparée, avec « autre chapitre » pour seule indication", async ({ page, browser }) => {
    test.setTimeout(120_000);
    const s = await classeQuiEcrit(page);
    const [s15, s16] = s.lisiere.scenes;
    const autel = s.sanctuaire.scenes[0];
    const interne = choixAuto("Traverser le pont", s16);
    const mixte = choixPerso("La porte", ["Va au ", renvoi(s16), " ou au ", renvoi(autel), "."]);
    await semerBlocs(s.base, s15, [recit("Lou fit un pas."), interne, mixte]);
    const bilal = await posteDe(browser, s, "Bilal");
    await aller(bilal.page, sceneEleve(s15));
    const phrases = PHRASES(bilal.page);
    // La phrase mêlant renvoi interne et raccord est préparée ; l'autre se règle
    await expect(phrases.nth(1)).toContainText("Choix préparé : tu écris autour");
    await expect(phrases.nth(1).locator(".copie__dest")).toContainText("autre chapitre · Le sanctuaire");
    await expect(phrases.nth(1).locator(".copie__dest")).not.toContainText(/autel|S003/i);
    await s.base.from("projets").update({ lecture_ouverte: true }).eq("id", s.projet);
    await bilal.page.reload();
    await phrases.nth(0).locator(".phrase-choix__corps").click();
    await FICHE(bilal.page).getByLabel("Ce que fait le lecteur").fill("Franchir le pont");
    await FICHE(bilal.page).getByLabel("Ce que fait le lecteur").press("Enter");
    // Même avec la lecture ouverte, seules les scènes de « La lisière » sont proposées
    await FICHE(bilal.page).getByRole("button", { name: "Changer…" }).click();
    await expect(FICHE(bilal.page).getByPlaceholder("Chercher dans ton chapitre")).toBeVisible();
    await FICHE(bilal.page).getByLabel("Chercher une scène").fill("autel");
    await expect(PROPOSEES(bilal.page)).toHaveCount(0);
    await FICHE(bilal.page).getByRole("button", { name: "Fermer la fiche" }).click();
    await expect.poll(async () => ((await sceneEnBase(s15)).texte[1] as { libelle?: string }).libelle, { timeout: 15_000 }).toBe("Franchir le pont");
    expect((await sceneEnBase(s15)).texte[1]).toMatchObject({ libelle: "Franchir le pont", cible: s16 });

    // Un choix de plus, par le bouton
    await bilal.page.getByRole("button", { name: "Choix", exact: true }).click();
    await FICHE(bilal.page).getByLabel("Ce que fait le lecteur").fill("Rebrousser chemin");
    await FICHE(bilal.page).getByLabel("Ce que fait le lecteur").press("Enter");
    await FICHE(bilal.page).getByLabel("Chercher une scène").fill("pont");
    await FICHE(bilal.page).getByLabel("Chercher une scène").press("Enter");
    await expect(pied(bilal.page)).toHaveText("Enregistré", { timeout: 8_000 });
    expect((await liensEnBase(s.projet)).sort()).toEqual(["S001 > S002", "S001 > S002", "S001 > S002", "S001 > S003"]);
    expect((await sceneEnBase(s15)).texte.find((b) => b.id === mixte.id)).toEqual(mixte);
    await bilal.contexte.close();
  });

  test("F05-AC32, F06-AC13 — Bilal colle deux paragraphes et une phrase de choix dans une scène d'un autre chapitre : le récit est collé, la phrase écartée, un message le dit ; forcé depuis le navigateur, l'enregistrement est refusé par le serveur", async ({ page, browser }) => {
    test.setTimeout(120_000);
    const s = await classeQuiEcrit(page);
    const [s15, s16] = s.lisiere.scenes;
    const autel = s.sanctuaire.scenes[0];
    // Bilal écrit aussi dans « Le sanctuaire », avec le profil par défaut
    await s.base.rpc("attribuer_chapitre", { p_chapitre: s.sanctuaire.id, p_eleves: [{ eleve: s.eleves.Chloé.id }, { eleve: s.eleves.Bilal.id, profil: "propositions" }] });
    await semerBlocs(s.base, s15, [recit("Premier paragraphe."), recit("Second paragraphe."), choixAuto("Traverser le pont", s16)]);
    const bilal = await posteDe(browser, s, "Bilal");
    await bilal.contexte.grantPermissions(["clipboard-read", "clipboard-write"]);
    await aller(bilal.page, sceneEleve(s15));
    await copie(bilal.page).locator("p").first().click();
    await bilal.page.keyboard.press(`${MOD}+a`);
    await bilal.page.waitForTimeout(150);
    await bilal.page.keyboard.press(`${MOD}+c`);
    await aller(bilal.page, sceneEleve(autel));
    await copie(bilal.page).click();
    await bilal.page.keyboard.press(`${MOD}+v`);
    await expect(BANDEAU(bilal.page)).toContainText("La phrase de choix n’a pas été collée : tu ne peux pas créer ce choix ici.");
    await attendreEnBase(autel, "Second paragraphe.");
    expect(enClair((await sceneEnBase(autel)).texte)).toEqual(["Premier paragraphe.", "Second paragraphe."]);
    expect(await liensEnBase(s.projet)).toEqual(["S001 > S002"]);

    // Le navigateur contourné : un raccord glissé dans le texte envoyé. Le serveur le refuse et garde le texte à part
    const forge = await bilal.page.evaluate((cible) => {
      const e = (window as unknown as { __copie: { children: unknown[] } }).__copie;
      return [...e.children, { type: "choix", id: crypto.randomUUID(), auto: true, libelle: "Filer vers la lisière", construction: "neutre", cible, children: [{ text: "" }] }];
    }, s16);
    const { version } = await sceneEnBase(autel);
    const [{ id: ecriture }] = await sql<{ id: string }>("select id from ecritures where scene_id = $1 and eleve_id = $2 order by ouverte_le desc limit 1", [autel, s.eleves.Bilal.id]);
    const reponse = await bilal.page.evaluate(
      async ([e, v, t]) => (await fetch("/copie", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ecriture: e, version: v, texte: t }) })).json(),
      [ecriture, version, forge] as const,
    );
    expect(reponse).toMatchObject({ etat: "garde", motif: "controle" });
    expect(await liensEnBase(s.projet)).toEqual(["S001 > S002"]);
    expect((await sceneEnBase(autel)).texte.map((b) => b.type)).toEqual(["p", "p"]);
    await bilal.contexte.close();
  });

  test("F05-AC48, AC03 — « Rechercher une scène », pour l'élève : les scènes de son chapitre par leur titre, leur texte ou leur consigne ; rien d'un chapitre fermé ; la lecture ouverte y ajoute les autres par leur titre ou leur texte", async ({ page, browser }) => {
    test.setTimeout(120_000);
    const s = await classeQuiEcrit(page);
    const [s15, s16] = s.lisiere.scenes;
    const autel = s.sanctuaire.scenes[0];
    await s.base.from("scenes").update({ titre: "Souche — la lanterne de secours" }).eq("id", s15);
    await semerBlocs(s.base, s16, [recit("Au loin, une lanterne brille entre les arbres.")]);
    await s.base.from("scenes").update({ consigne: "Parle de la lanterne noyée." }).eq("id", autel);
    await semerBlocs(s.base, autel, [recit("Sur l’autel, une lanterne éteinte.")]);
    const alice = await posteDe(browser, s, "Alice");
    const champ = alice.page.getByRole("searchbox", { name: "Rechercher une scène" });
    await champ.fill("lanterne");
    const resultats = alice.page.locator(".trouves");
    await expect(resultats).toContainText("2 scènes trouvées");
    await expect(resultats.locator(".trouves__chap h3")).toHaveText(["La lisière"]);
    await expect(resultats.locator(".trouve")).toContainText(["Souche — la lanterne de secours", "une lanterne brille entre les arbres"]);
    await expect(resultats).not.toContainText(/autel|sanctuaire|noyée/i);

    await s.base.from("projets").update({ lecture_ouverte: true }).eq("id", s.projet);
    await champ.fill("");
    await champ.fill("lanterne");
    await expect(resultats).toContainText("3 scènes trouvées");
    await expect(resultats.locator(".trouves__chap h3")).toHaveText(["La lisière", "Le sanctuaire"]);
    // Jamais par la consigne d'un chapitre qui n'est pas le sien
    await champ.fill("noyée");
    await expect(resultats).toContainText("Aucune scène ne contient « noyée ».");
    await champ.fill("brille");
    await resultats.getByRole("link", { name: /^Ouvrir S002/ }).click();
    await alice.page.waitForURL(new RegExp(`/travail/scene/${s16}`));
    await alice.contexte.close();
  });
});

test.describe("Numéros, chemins et suppression (F11.5, F03.1)", () => {
  test("F05-AC35, F11-AC96, AC97, F05-AC36 — « Fixer son numéro… » : la scène garde le numéro écrit, la phrase qui y mène le suit, la référence ne change pas ; un numéro déjà fixé est refusé en nommant la scène ; « Libérer le numéro » ; le départ n'a pas ces commandes", async ({ page }) => {
    test.setTimeout(120_000);
    const l = await auteur(page);
    await semerBlocs(l.base, l.lisiere.scenes[0], [recit("Lou fit un pas."), choixAuto("Continuer vers la lumière", l.lisiere.scenes[1])]);
    await l.base.from("projets").update({ depart_scene_id: l.lisiere.scenes[0] }).eq("id", l.projet);
    await aller(page, sceneAdulte(l.projet, l.lisiere.scenes[1]));
    const menu = (ref: string) => page.locator(`summary[aria-label="Autres commandes de la scène ${ref}"]`);
    await menu("S002").click();
    await page.getByRole("button", { name: "Fixer son numéro…" }).click();
    const fiche = page.locator(".fiche-numero");
    await expect(fiche).toContainText(/Ce passage porte le n° \d+\./);
    await fiche.getByLabel("Ou un autre numéro").fill("100");
    await expect(fiche).toContainText("Le livre ne compte que 5 passages pour l’instant.");
    await fiche.getByRole("button", { name: "Fixer ce numéro" }).click();
    await expect(MESSAGE(page)).toContainText("S002 garde le n° 100.");
    await expect(page.getByText("n° 100 fixé")).toBeVisible();
    expect((await numerosEnBase(l.projet))[l.lisiere.scenes[1]]).toBe(100);

    // La phrase qui y mène affiche 100 ; son repère dit toujours S002
    await aller(page, sceneAdulte(l.projet, l.lisiere.scenes[0]));
    await expect(PHRASES(page)).toContainText("Continuer vers la lumière : rends-toi au 100.");
    await expect(PHRASES(page).locator(".copie__dest")).toHaveText("Clairière");
    // Le départ porte toujours le n° 1 : ni l'une ni l'autre commande
    await menu("S001").click();
    await expect(page.getByRole("button", { name: "Départ du livre" }).or(page.getByRole("button", { name: "Retirer le départ du livre" }))).toBeVisible();
    await expect(page.getByRole("button", { name: /Fixer son numéro|Libérer le numéro/ })).toHaveCount(0);

    // 100 pour une autre scène : refusé, S002 est nommée
    await aller(page, sceneAdulte(l.projet, l.lisiere.scenes[2]));
    await menu("S003").click();
    await page.getByRole("button", { name: "Fixer son numéro…" }).click();
    await fiche.getByLabel("Ou un autre numéro").fill("100");
    await fiche.getByRole("button", { name: "Fixer ce numéro" }).click();
    await expect(fiche.getByRole("alert")).toContainText("Le n° 100 est déjà celui de S002 « Clairière ».");
    await fiche.getByRole("button", { name: "Garder ce numéro" }).click();
    await expect(page.getByText(/n° \d+ fixé/)).toBeVisible();

    await aller(page, sceneAdulte(l.projet, l.lisiere.scenes[1]));
    await menu("S002").click();
    await page.getByRole("button", { name: "Libérer le numéro" }).click();
    await expect(MESSAGE(page)).toContainText("S002 n’a plus de numéro fixé");
    await expect(page.getByText("n° 100 fixé")).toHaveCount(0);
    expect((await numerosEnBase(l.projet))[l.lisiere.scenes[1]]).toBeLessThanOrEqual(5);
  });

  test("F03-AC18, AC25, point 13 — la vue « Chemins » montre les mêmes scènes, reliées par les choix enregistrés, sans rien modifier ; suivre un choix vers un autre chapitre ouvre ce chapitre dans la même vue, la scène d'arrivée désignée", async ({ page }) => {
    test.setTimeout(120_000);
    const l = await auteur(page);
    await l.base.from("projets").update({ depart_scene_id: l.lisiere.scenes[0] }).eq("id", l.projet);
    await l.base.from("scenes").update({ fin: true }).eq("id", l.lisiere.scenes[3]);
    await semerBlocs(l.base, l.lisiere.scenes[0], [choixAuto("Continuer vers la lumière", l.lisiere.scenes[1]), choixAuto("Longer la souche", l.lisiere.scenes[2]), choixAuto("Plus tard", null)]);
    await semerBlocs(l.base, l.lisiere.scenes[1], [choixAuto("Descendre au marais", l.marais.scenes[0])]);
    await semerBlocs(l.base, l.lisiere.scenes[2], [choixAuto("Rejoindre la clairière", l.lisiere.scenes[1])]);
    const avant = await sql("select id, version, rang from scenes where projet_id = $1 order by reference", [l.projet]);

    await aller(page, `/projet/${l.projet}/chapitre/${l.lisiere.id}`);
    await expect(page.locator(".fiches .fiche__ref")).toHaveText(["S001", "S002", "S003", "S004"]);
    await page.getByRole("button", { name: "Chemins" }).click();
    await page.waitForURL(/vue=chemins/);
    const noeud = (ref: string) => page.locator(".noeud").filter({ has: page.locator(".noeud__tete .fiche__ref", { hasText: ref }) });
    // Une colonne par pas depuis l'entrée du chapitre : S001 et S004, où rien ne mène, puis S002 et S003
    await expect(page.locator(".noeud .fiche__ref")).toHaveText(["S001", "S004", "S002", "S003"]);
    await expect(noeud("S001")).toContainText("Départ du livre");
    await expect(noeud("S001").locator(".noeud__suites li")).toHaveText([/Continuer vers la lumière.*S002 Clairière/, /Longer la souche.*S003 La souche/, /Plus tard.*Sans destination/]);
    await expect(noeud("S002")).toContainText("2 chemins se rejoignent");
    await expect(noeud("S004")).toContainText("Fin de l’histoire");
    await expect(noeud("S004")).not.toContainText("Sans suite");
    // Un trait par lien interne au chapitre
    await expect(page.locator(".chemins__traits path[marker-end]")).toHaveCount(3);

    // Le choix vers « Le marais » ouvre ce chapitre dans la même vue, S005 désignée
    await noeud("S002").getByRole("link", { name: /Le marais · S005/ }).click();
    await page.waitForURL(new RegExp(`/chapitre/${l.marais.id}\\?vue=chemins&scene=${l.marais.scenes[0]}`));
    await expect(page.locator(".noeud.est-designe")).toContainText("S005");
    await expect(page.locator(".noeud.est-designe")).toContainText("depuis La lisière");
    await expect(page.locator(".noeud.est-designe")).toContainText("Sans suite");
    // Ouvrir une scène depuis les chemins, puis revenir : on retrouve la vue quittée
    await page.locator(".noeud.est-designe").getByRole("link", { name: "Ouvrir S005" }).click();
    await page.waitForURL(/\/scene\/.*de=chemins/);
    await page.getByRole("link", { name: "Retour à Le marais" }).click();
    await page.waitForURL(/vue=chemins/);
    await expect(page.getByRole("button", { name: "Chemins" })).toHaveAttribute("aria-pressed", "true");
    // Rien n'a été modifié en regardant les chemins
    expect(await sql("select id, version, rang from scenes where projet_id = $1 order by reference", [l.projet])).toEqual(avant);
  });

  test("F03-AC13, AC14 — supprimer une scène où mène un choix annonce d'abord ce lien, qui n'est redirigé nulle part ; la carte du choix dit ensuite « scène supprimée »", async ({ page }) => {
    const l = await auteur(page);
    await semerBlocs(l.base, l.lisiere.scenes[0], [choixAuto("Continuer vers la lumière", l.lisiere.scenes[1])]);
    await aller(page, `/projet/${l.projet}/chapitre/${l.lisiere.id}`);
    await page.locator('summary[aria-label="Autres commandes de la scène S002"]').click();
    await page.getByRole("button", { name: "Supprimer" }).click();
    const dialogue = page.getByRole("alertdialog", { name: "Supprimer S002 « Clairière » ?" });
    await expect(dialogue.locator("li")).toHaveText(["Un choix y mène, depuis S001 : il ne sera redirigé nulle part.", "Rien n’est effacé : vous retrouvez tout dans la corbeille du projet."]);
    await dialogue.getByRole("button", { name: "Supprimer" }).click();
    await expect(MESSAGE(page)).toContainText("S002 « Clairière » est supprimée.");
    await expect(page.locator(".fiches .fiche__ref")).toHaveText(["S001", "S003", "S004"]);
    expect(await liensEnBase(l.projet)).toEqual(["S001 > S002"]);
    await aller(page, `/projet/${l.projet}/chapitre/${l.lisiere.id}?vue=chemins`);
    await expect(page.locator(".noeud").filter({ has: page.locator(".noeud__tete .fiche__ref", { hasText: "S001" }) }).locator(".noeud__suites li")).toContainText("scène supprimée");
  });

  test("V15 — un chapitre de quarante scènes dans un livre de deux cents : la vue « Chemins » s'affiche en moins de trois secondes et reste lisible", async ({ page }) => {
    test.setTimeout(180_000);
    await page.setViewportSize({ width: 1024, height: 768 });
    const l = await auteur(page);
    // Cent quatre-vingt-quinze scènes de plus, par la base : quarante dans « La lisière », le reste dans « Le marais »
    await sql(
      `insert into scenes (chapitre_id, projet_id, enseignant_id, reference, rang, titre)
       select case when n <= 36 then $1::uuid else $2::uuid end, $3::uuid, (select enseignant_id from projets where id = $3), 5 + n, 10 + n, 'Scène ' || (5 + n)
       from generate_series(1, 195) n`,
      [l.lisiere.id, l.marais.id, l.projet],
    );
    await sql("update projets set reference_suivante = 201 where id = $1", [l.projet]);
    const scenes = await sql<{ id: string; reference: number }>("select id, reference from scenes where chapitre_id = $1 order by reference", [l.lisiere.id]);
    expect(scenes).toHaveLength(40);
    // Chaque scène propose deux ou trois choix : un arbre qui se rejoint, comme dans un vrai livre
    for (const [i, s] of scenes.entries()) {
      const suites = [scenes[2 * i + 1], scenes[2 * i + 2], scenes[i + 7]].filter(Boolean);
      if (suites.length) await semerBlocs(l.base, s.id, suites.map((d) => choixAuto(`Aller vers ${d.reference}`, d.id)));
    }
    const debut = Date.now();
    await aller(page, `/projet/${l.projet}/chapitre/${l.lisiere.id}?vue=chemins`);
    await expect(page.locator(".noeud")).toHaveCount(40);
    await expect(page.locator(".chemins__traits path[marker-end]").first()).toBeVisible();
    expect(Date.now() - debut).toBeLessThan(3_000);
    const traits = await page.locator(".chemins__traits path[marker-end]").count();
    expect(traits).toBeGreaterThan(60);
    // « Tout voir » ramène le chapitre à la largeur de l'écran, sans défilement horizontal
    await page.getByRole("button", { name: "Tout voir" }).click();
    const largeur = await page.locator(".chemins__toile").evaluate((t) => t.getBoundingClientRect().width);
    const place = await page.locator(".chemins__cadre").evaluate((c) => c.clientWidth);
    expect(largeur).toBeLessThanOrEqual(place);
    await page.getByRole("button", { name: "Taille lisible" }).click();
    await expect(page.locator(".noeud").first().getByRole("link", { name: /Ouvrir/ })).toBeVisible();
  });
});

test("F08-AC26 — le choix d'un texte gardé à part n'apparaît dans « Chemins » qu'une fois ce texte mis dans la scène", async ({ page, context }) => {
  test.setTimeout(120_000);
  const l = await auteur(page);
  await semerBlocs(l.base, l.lisiere.scenes[0], [recit("Le texte de départ.")]);
  await aller(page, sceneAdulte(l.projet, l.lisiere.scenes[0]));
  // Une seconde fenêtre enregistre d'abord ; la première y ajoute un choix, qui part à part
  const seconde = await context.newPage();
  await aller(seconde, sceneAdulte(l.projet, l.lisiere.scenes[0]));
  await ecrire(seconde, " Écrit ailleurs.");
  await attendreEnBase(l.lisiere.scenes[0], "Écrit ailleurs.");
  await seconde.close();
  await page.getByRole("button", { name: "Choix", exact: true }).click();
  await saisirChoix(page, "Suivre la lumière", "souche");
  await expect(page.locator(".note--attend")).toContainText("est gardé à part", { timeout: 10_000 });
  await page.waitForTimeout(500);
  expect(await liensEnBase(l.projet)).toEqual([]);
  await aller(page, `/projet/${l.projet}/chapitre/${l.lisiere.id}?vue=chemins`);
  await expect(page.locator(".noeud").filter({ has: page.locator(".noeud__tete .fiche__ref", { hasText: "S001" }) })).toContainText("Sans suite");

  await aller(page, sceneAdulte(l.projet, l.lisiere.scenes[0]));
  await page.getByRole("tab", { name: /^Votre texte, gardé à part/ }).click();
  // Le texte gardé à part se lit avec sa phrase de choix
  await expect(page.locator(".copie__texte--lu .phrase-choix")).toContainText("Suivre la lumière : rends-toi au");
  await page.getByRole("button", { name: "Mettre ce texte dans la scène" }).click();
  await expect(PHRASES(page)).toHaveCount(1);
  expect(await liensEnBase(l.projet)).toEqual(["S001 > S003"]);
  await aller(page, `/projet/${l.projet}/chapitre/${l.lisiere.id}?vue=chemins`);
  await expect(page.locator(".noeud").filter({ has: page.locator(".noeud__tete .fiche__ref", { hasText: "S001" }) }).locator(".noeud__suites li")).toContainText("Suivre la lumière");
  expect(await motsEnBase(l.lisiere.scenes[0])).toContain("Le texte de départ.");
});
