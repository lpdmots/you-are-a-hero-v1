import { expect, test, type Page } from "@playwright/test";
import {
  adultePret, aller, ALERTE, attendreEnBase, classeQuiEcrit, collerDepuisAilleurs, copie, copiesGardees, ecrire, enClair, MESSAGE, motsEnBase, pied, sauv,
  posteDe, sceneEnBase, semerPartie, semerProjet, semerTexte, sql, supprimerComptes, veiller,
} from "./outils";

/**
 * Étape 3 du plan, lot 1 : écrire une scène, la voir s'enregistrer, régler un conflit de
 * sauvegarde (F04.1, F08.1, F08.2, F06.4). Les frappes et le presse-papiers sont réels.
 */

test.afterEach(async () => {
  await supprimerComptes();
});

const sceneAdulte = (projet: string, scene: string) => `/projet/${projet}/scene/${scene}`;
const sceneEleve = (scene: string) => `/travail/scene/${scene}`;
const onglet = (page: Page, nom: string | RegExp) => page.getByRole("tab", { name: nom, exact: true });

/** Un auteur seul, son projet personnel et une scène. */
async function auteurEtSaScene(page: Page, recit: "choix" | "classique" = "choix") {
  const { compte, base } = await adultePret(page);
  const projet = await semerProjet(base, compte, "personnel", recit, "Mon roman");
  const { chapitres } = await semerPartie(base, projet, "Le début", [{ titre: "Chapitre un", scenes: ["La gare", "Le quai"] }]);
  return { compte, base, projet, chapitre: chapitres[0].id, scenes: chapitres[0].scenes };
}

test.describe("Enregistrement automatique (F08.2) — V11", () => {
  test("F08-AC32, F04-AC01 — deux secondes après la dernière frappe, le texte est enregistré et le pied le dit, sans rien cliquer ni régler", async ({ page }) => {
    const a = await auteurEtSaScene(page);
    await aller(page, sceneAdulte(a.projet, a.scenes[0]));
    await expect(page.locator(".tampon")).toHaveText("Texte vide");
    await expect(pied(page)).toHaveText("Enregistré");
    await ecrire(page, "Le train entre en gare.");
    await expect(pied(page)).toHaveText("Pas encore enregistré");
    await expect(pied(page)).toHaveText("Enregistré", { timeout: 6_000 });
    expect(await motsEnBase(a.scenes[0])).toBe("Le train entre en gare.");
    await expect(page.locator(".tampon")).toHaveText("En cours");
    // Aucun bouton « Enregistrer », aucun réglage de police ou de page pour écrire
    await expect(page.getByRole("button", { name: /Enregistrer/ })).toHaveCount(0);
    await page.reload();
    await expect(copie(page)).toHaveText("Le train entre en gare.");
  });

  test("F08-AC33 — frappe continue : le texte s'enregistre au plus tard après quinze secondes, pendant la frappe, sans l'interrompre ni déplacer le curseur", async ({ page }) => {
    test.setTimeout(120_000);
    const a = await auteurEtSaScene(page);
    await aller(page, sceneAdulte(a.projet, a.scenes[0]));
    const phrase = "Lou court sur le quai sans s arreter, son sac bat contre son dos et le sifflet du chef de gare retentit deja au bout de la voie.";
    await copie(page).click();
    await page.waitForTimeout(150);
    // Une frappe toutes les 140 ms : jamais plus d'une seconde de pause, dix-huit secondes en tout
    const frappe = page.keyboard.type(phrase, { delay: 140 });
    await expect.poll(async () => (await sceneEnBase(a.scenes[0])).version, { timeout: 17_500, intervals: [500] }).toBeGreaterThan(0);
    // Enregistré avant la fin de la frappe : ce qui est en base n'est qu'un début de la phrase
    const enCours = await motsEnBase(a.scenes[0]);
    expect(enCours.length).toBeGreaterThan(10);
    expect(enCours.length).toBeLessThan(phrase.length);
    expect(phrase.startsWith(enCours)).toBe(true);
    await frappe;
    await expect(copie(page)).toHaveText(phrase);
    await attendreEnBase(a.scenes[0], phrase);
  });

  test("F08-AC34 — quitter aussitôt par l'application : le mot tapé dans la seconde est dans le texte enregistré quand la page suivante s'affiche", async ({ page }) => {
    const a = await auteurEtSaScene(page);
    await aller(page, sceneAdulte(a.projet, a.scenes[0]));
    await ecrire(page, "Dernier mot");
    await page.getByRole("link", { name: "Retour à Chapitre un" }).click();
    await page.waitForURL(new RegExp(`/chapitre/${a.chapitre}`));
    expect(await motsEnBase(a.scenes[0])).toBe("Dernier mot");
    // La carte de la scène a quitté « Texte vide »
    await expect(page.locator(".fiche").first().locator(".tampon")).toHaveText("En cours");
  });

  test("F08-AC35, AC24 — onglet fermé aussitôt : la scène rouverte montre le dernier texte enregistré, et rien n'annonce un texte gardé ailleurs", async ({ page, context }) => {
    const a = await auteurEtSaScene(page);
    await semerTexte(a.base, a.scenes[0], ["Le texte déjà enregistré."]);
    await aller(page, sceneAdulte(a.projet, a.scenes[0]));
    await ecrire(page, " Un mot de plus");
    await page.close();
    const suite = await context.newPage();
    await suite.waitForTimeout(1_500);
    await aller(suite, sceneAdulte(a.projet, a.scenes[0]));
    const enBase = await motsEnBase(a.scenes[0]);
    expect(["Le texte déjà enregistré.", "Le texte déjà enregistré. Un mot de plus"]).toContain(enBase);
    await expect(copie(suite)).toHaveText(enBase);
    await expect(suite.getByText(/gardé à part/)).toHaveCount(0);
    await expect(suite.getByRole("tab")).toHaveCount(0);
  });
});

test.describe("Mise en forme et collage (F04.1) — V13", () => {
  test("F04-AC02 — gras, italique et souligné, par les boutons comme par leurs raccourcis ; annuler et rétablir au clavier", async ({ page }) => {
    const a = await auteurEtSaScene(page);
    await aller(page, sceneAdulte(a.projet, a.scenes[0]));
    await ecrire(page, "Un ");
    await page.getByRole("button", { name: "Gras" }).click();
    await expect(page.getByRole("button", { name: "Gras" })).toHaveAttribute("aria-pressed", "true");
    await page.keyboard.type("cri");
    await page.keyboard.press("ControlOrMeta+b");
    await page.keyboard.type(" dans ");
    await page.keyboard.press("ControlOrMeta+i");
    await page.keyboard.type("la nuit");
    await page.keyboard.press("ControlOrMeta+i");
    await page.keyboard.type(" ");
    await page.getByRole("button", { name: "Souligné" }).click();
    await page.keyboard.type("noire");
    await attendreEnBase(a.scenes[0], "_noire_");
    expect(enClair((await sceneEnBase(a.scenes[0])).texte)).toEqual(["Un *cri* dans /la nuit/ _noire_"]);

    await page.keyboard.press("ControlOrMeta+z");
    await expect(copie(page)).not.toContainText("noire");
    // Le navigateur du test se présente comme un Chrome de Windows : l'éditeur y attend Ctrl+Y pour rétablir
    await page.keyboard.press("Control+y");
    await expect(copie(page)).toContainText("noire");
    await attendreEnBase(a.scenes[0], "_noire_");
  });

  const WORD =
    '<html><body><!--StartFragment--><p class="MsoNormal" style="margin:0cm;font-size:22.0pt;font-family:\'Comic Sans MS\';color:red"><span style="font-size:22.0pt;color:red">Le héros entre dans la <b>forêt sombre</b>.</span></p>' +
    '<p class="MsoNormal"><span style="color:red;font-size:22.0pt">Il entend un cri.</span></p><!--EndFragment--></body></html>';

  test("F04-AC04 — un texte Word collé garde ses mots, ses deux paragraphes et son gras ; ni police, ni taille, ni couleur", async ({ page }) => {
    const a = await auteurEtSaScene(page);
    await aller(page, sceneAdulte(a.projet, a.scenes[0]));
    await copie(page).click();
    await collerDepuisAilleurs(page, WORD, "Le héros entre dans la forêt sombre.\nIl entend un cri.");
    await expect(copie(page).locator("p")).toHaveCount(2);
    await attendreEnBase(a.scenes[0], "Il entend un cri.");
    const enBase = await sceneEnBase(a.scenes[0]);
    expect(enClair(enBase.texte)).toEqual(["Le héros entre dans la *forêt sombre*.", "Il entend un cri."]);
    // Hors identités des blocs, tirées au hasard : l'une d'elles peut contenir « 22 »
    expect(JSON.stringify(enBase.texte.map((b) => b.children))).not.toMatch(/color|font|Comic|22/);
    // À l'écran non plus : la copie garde sa propre police et sa couleur
    const style = await copie(page).locator("p").first().evaluate((p) => [...p.querySelectorAll("*")].map((n) => (n as HTMLElement).style.color + (n as HTMLElement).style.fontSize).join(""));
    expect(style).toBe("");
  });

  test("F04-AC35, AC36 — titre, liste et tableau deviennent six paragraphes ; l'image d'une page web n'est pas collée, et un message le dit", async ({ page }) => {
    const a = await auteurEtSaScene(page);
    await aller(page, sceneAdulte(a.projet, a.scenes[0]));
    await copie(page).click();
    await collerDepuisAilleurs(
      page,
      "<h1>Le titre</h1><ul><li>Une</li><li>Deux</li><li>Trois</li></ul><table><tr><td>Cellule A</td><td>Cellule B</td></tr></table>",
      "Le titre\nUne\nDeux\nTrois\nCellule A\tCellule B",
    );
    await attendreEnBase(a.scenes[0], "Cellule B");
    const enBase = await sceneEnBase(a.scenes[0]);
    expect(enClair(enBase.texte)).toEqual(["Le titre", "Une", "Deux", "Trois", "Cellule A", "Cellule B"]);
    expect(enBase.texte.every((b) => b.type === "p")).toBe(true);
    await expect(copie(page).locator("h1, ul, li, table")).toHaveCount(0);

    await aller(page, sceneAdulte(a.projet, a.scenes[1]));
    await copie(page).click();
    await collerDepuisAilleurs(page, '<p>Un phare au bout de la jetée.</p><img src="https://exemple.test/phare.jpg" alt="Un phare">', "Un phare au bout de la jetée.");
    await expect(page.locator(".copie__message")).toContainText("L’image n’a pas été collée");
    await attendreEnBase(a.scenes[1], "Un phare");
    expect(enClair((await sceneEnBase(a.scenes[1])).texte)).toEqual(["Un phare au bout de la jetée."]);
    await expect(copie(page).locator("img")).toHaveCount(0);
  });

  test("F04-AC03, AC05, AC34 — mise en forme des élèves désactivée dans ce projet seulement : plus de boutons ni de raccourcis, un collage arrive sans forme, ce qui existe reste et l'enseignante peut le retirer", async ({ page, browser }) => {
    test.setTimeout(150_000);
    const s = await classeQuiEcrit(page);
    const [s15] = s.lisiere.scenes;
    const alice = await posteDe(browser, s, "Alice");
    await aller(alice.page, sceneEleve(s15));
    // Par défaut, Alice a les trois commandes (F04-AC02)
    await expect(alice.page.getByRole("toolbar", { name: "Outils de la copie" }).getByRole("button", { name: /^(Gras|Italique|Souligné)$/ })).toHaveCount(3);
    await ecrire(alice.page, "Trois ");
    await alice.page.keyboard.press("ControlOrMeta+b");
    await alice.page.keyboard.type("mots en gras");
    await attendreEnBase(s15, "mots en gras");

    await aller(page, `/projet/${s.projet}/plan`);
    await page.locator('summary[aria-label="Autres commandes du projet Les passeurs de brume"]').click();
    await page.getByRole("button", { name: "Réglages du projet" }).click();
    const reglage = page.getByRole("switch", { name: "Les élèves mettent en gras, en italique, soulignent" });
    await expect(reglage).toBeChecked();
    await page.getByText("Les élèves mettent en gras, en italique, soulignent").click();
    await expect(reglage).not.toBeChecked();
    await expect(page.getByText("Les élèves n’ont plus les trois boutons.")).toBeVisible();

    await alice.page.reload();
    // Il lui reste « Objets » (F04.2) : plus aucun bouton de mise en forme
    await expect(alice.page.getByRole("toolbar", { name: "Outils de la copie" }).getByRole("button", { name: /^(Gras|Italique|Souligné)$/ })).toHaveCount(0);
    // Ce qui existe reste en gras
    await expect(copie(alice.page).locator("strong")).toHaveText("mots en gras");
    await ecrire(alice.page, " puis ");
    await alice.page.keyboard.press("ControlOrMeta+b");
    await alice.page.keyboard.press("ControlOrMeta+i");
    await alice.page.keyboard.press("ControlOrMeta+u");
    await alice.page.keyboard.type("rien.");
    await alice.page.keyboard.press("Enter");
    await collerDepuisAilleurs(alice.page, "<p><b>gras</b> <i>italique</i> <u>souligné</u></p>", "gras italique souligné");
    await attendreEnBase(s15, "gras italique souligné");
    // Ce qu'elle tape à la suite d'un mot déjà en gras en garde la forme ; ses raccourcis ne font plus rien, son collage arrive nu
    expect(enClair((await sceneEnBase(s15)).texte)).toEqual(["Trois *mots en gras puis rien.*", "gras italique souligné"]);
    await alice.contexte.close();

    // L'enseignante garde les trois commandes et retire elle-même ce gras
    await aller(page, sceneAdulte(s.projet, s15));
    await expect(page.getByRole("toolbar", { name: "Outils de la copie" }).getByRole("button", { name: /^(Gras|Italique|Souligné)$/ })).toHaveCount(3);
    await copie(page).click();
    await page.keyboard.press("ControlOrMeta+a");
    await page.waitForTimeout(150);
    await page.getByRole("button", { name: "Gras" }).click();
    await page.getByRole("button", { name: "Gras" }).click();
    await expect.poll(async () => enClair((await sceneEnBase(s15)).texte)[0]).toBe("Trois mots en gras puis rien.");

    // L'autre projet de la classe n'a pas changé
    const autre = await semerProjet(s.base, s.compte, "classe", "classique", "Le phare", s.classe.id);
    expect((await sql<{ m: boolean }>("select mise_en_forme_eleves as m from projets where id = $1", [autre]))[0].m).toBe(true);
  });
});

test.describe("Conflit de sauvegarde, à deux postes (F08.1) — V7", () => {
  test("F08-AC01 à AC04, AC06, AC07, AC09, AC10, AC13, AC17, AC18 — Bilal écrit sur une version ancienne : son texte est gardé à part, il s'arrête ; l'enseignante le lit dans son onglet, ne le garde plus, annule, puis ne le garde plus", async ({ page, browser }) => {
    test.setTimeout(150_000);
    const s = await classeQuiEcrit(page);
    const [s15, s16] = s.lisiere.scenes;
    const alice = await posteDe(browser, s, "Alice");
    const bilal = await posteDe(browser, s, "Bilal");
    await aller(alice.page, sceneEleve(s15));
    await aller(bilal.page, sceneEleve(s15));

    await ecrire(alice.page, "Alice recopie son texte.");
    await expect(sauv(alice.page)).toHaveText("Enregistré", { timeout: 6_000 });
    await ecrire(bilal.page, "Bilal écrit en même temps.");
    await expect(pied(bilal.page)).toContainText("Quelqu’un d’autre a écrit dans cette scène en même temps que toi. Ton texte est gardé. Arrête d’écrire et appelle Mme Laurent.", { timeout: 6_000 });
    // Le travail d'Alice n'est pas remplacé ; rien ne dit « enregistré » à Bilal ; sa saisie reste affichée, sans pouvoir être modifiée
    expect(await motsEnBase(s15)).toBe("Alice recopie son texte.");
    await expect(pied(bilal.page)).not.toContainText("Enregistré");
    await expect(bilal.page.locator(".copie__texte")).toContainText("Bilal écrit en même temps.");
    await expect(bilal.page.locator('.copie__texte[contenteditable="true"]')).toHaveCount(0);
    const [garde] = await copiesGardees(s15);
    expect(garde).toMatchObject({ sorte: "refus", eleve_id: s.eleves.Bilal.id });
    expect(enClair(garde.texte)).toEqual(["Bilal écrit en même temps."]);

    // Il recharge : le texte de la scène en lecture, sans le sien, et la phrase d'attente
    await bilal.page.reload();
    await expect(bilal.page.locator(".copie__texte")).toHaveText("Alice recopie son texte.");
    await expect(bilal.page.getByText("Bilal écrit en même temps.")).toHaveCount(0);
    await expect(pied(bilal.page)).toContainText("Ton texte est gardé à part. Mme Laurent doit le regarder avant que tu écrives ici.");
    await expect(copie(bilal.page)).toHaveCount(0);
    // Depuis son chapitre, la même phrase, et « Lire »
    await aller(bilal.page, `/travail/chapitre/${s.lisiere.id}`);
    const fiche = bilal.page.locator(".fiche").filter({ hasText: "S001" });
    await expect(fiche).toContainText("Ton texte est gardé à part. Mme Laurent doit le regarder avant que tu écrives ici.");
    await expect(fiche.locator(".fiche__ouvrir")).toHaveText("Lire");
    // Les autres continuent : Alice dans S015, Bilal dans S016
    await ecrire(alice.page, " Elle continue.");
    await attendreEnBase(s15, "Elle continue.");
    await aller(bilal.page, sceneEleve(s16));
    await ecrire(bilal.page, "Bilal écrit ailleurs.");
    await attendreEnBase(s16, "Bilal écrit ailleurs.");

    // Mme Laurent ouvre la scène : un message, et l'onglet du texte de Bilal
    await aller(page, sceneAdulte(s.projet, s15));
    await expect(page.locator(".note--attend")).toContainText("Un texte de Bilal est gardé à part : tant qu’il attend, Bilal ne peut pas écrire dans cette scène.");
    await expect(onglet(page, "Texte de la scène")).toHaveAttribute("aria-selected", "true");
    await page.getByRole("button", { name: "Voir ce texte" }).click();
    const sonOnglet = onglet(page, /^Texte de Bilal, gardé à part \w+ \d+(er)? \w+$/);
    await expect(sonOnglet).toHaveAttribute("aria-selected", "true");
    await expect(page.locator(".copie__texte--lu")).toHaveText("Bilal écrit en même temps.");
    await expect(page.locator(".copie__lecture")).toContainText(/En lecture · tel que Bilal l’a écrit à \d+ h \d\d/);
    await page.getByRole("button", { name: "Que font ces deux commandes ?" }).click();
    await expect(page.getByRole("note")).toContainText("échange les deux");

    await page.getByRole("button", { name: "Ne plus garder ce texte" }).click();
    await expect(page.getByRole("tab")).toHaveCount(0);
    await expect(page.locator(".note--ok")).toContainText("Le texte de Bilal n’est plus gardé : Bilal peut de nouveau écrire dans cette scène.");
    await expect(page.locator(".note--ok")).toContainText("tant que vous restez sur cette page");
    expect(await motsEnBase(s15)).toBe("Alice recopie son texte. Elle continue.");
    expect(await copiesGardees(s15)).toHaveLength(0);

    // « Annuler » rend l'onglet et l'arrêt de Bilal
    await page.locator(".note--ok").getByRole("button", { name: "Annuler" }).click();
    await expect(sonOnglet).toHaveAttribute("aria-selected", "true");
    expect(await copiesGardees(s15)).toHaveLength(1);
    await aller(bilal.page, sceneEleve(s15));
    await expect(copie(bilal.page)).toHaveCount(0);

    // Page quittée après « Ne plus garder » : plus rien à annuler, le texte n'est proposé nulle part
    await page.getByRole("button", { name: "Ne plus garder ce texte" }).click();
    await page.getByRole("link", { name: "Retour à La lisière" }).click();
    await page.waitForURL(/\/chapitre\//);
    await aller(page, sceneAdulte(s.projet, s15));
    await expect(page.getByText(/gardé/)).toHaveCount(0);
    await aller(page, `/projet/${s.projet}/suivi`);
    await expect(page.locator(".rappel")).toHaveCount(0);
    await aller(page, `/projet/${s.projet}/plan`);
    await expect(page.getByText(/Bilal écrit en même temps/)).toHaveCount(0);
    expect(await sql("select 1 from scenes where projet_id = $1 and supprime_le is not null", [s.projet])).toHaveLength(0);

    // Bilal retrouve l'écriture, sans aucun message sur ce qui a été décidé
    await bilal.page.reload();
    await expect(copie(bilal.page)).toHaveText("Alice recopie son texte. Elle continue.");
    await expect(bilal.page.getByText(/gardé|Mme Laurent doit/)).toHaveCount(0);
    await ecrire(bilal.page, " Bilal ajoute sa phrase.");
    await attendreEnBase(s15, "Bilal ajoute sa phrase.");
    await alice.contexte.close();
    await bilal.contexte.close();
  });

  test("F08-AC08, AC11, AC14, AC15, AC30 — l'échange met le texte de Bilal dans la scène et garde celui d'Alice ; la ligne du Suivi y mène ; un second échange les remet", async ({ page, browser }) => {
    test.setTimeout(150_000);
    const s = await classeQuiEcrit(page);
    const [s15] = s.lisiere.scenes;
    await s.base.from("scenes").update({ titre: "Le pont" }).eq("id", s15);
    await semerTexte(s.base, s15, ["Le texte d’Alice."]);
    const bilal = await posteDe(browser, s, "Bilal");
    await aller(bilal.page, sceneEleve(s15));
    await semerTexte(s.base, s15, ["Le texte d’Alice, corrigé."]);
    await ecrire(bilal.page, " Et celui de Bilal.");
    await expect(pied(bilal.page)).toContainText("Ton texte est gardé.", { timeout: 6_000 });

    // Sans être appelée : la ligne de rappel du Suivi, en lien
    await aller(page, `/projet/${s.projet}/suivi`);
    const rappel = page.locator(".rappel");
    await expect(rappel).toContainText("1 texte gardé à part :");
    await rappel.getByRole("link", { name: "S001 Le pont" }).click();
    await page.waitForURL(/\/scene\/.*texte=/);
    await expect(onglet(page, /^Texte de Bilal/)).toHaveAttribute("aria-selected", "true");
    await expect(page.getByRole("link", { name: "Retour au Suivi" })).toBeVisible();

    await page.getByRole("button", { name: "Mettre ce texte dans la scène" }).click();
    await expect(page.locator(".note--ok")).toContainText("Le texte de Bilal est maintenant le texte de la scène. L’ancien est gardé à part, et Bilal peut de nouveau écrire.");
    await expect(onglet(page, "Texte de la scène")).toHaveAttribute("aria-selected", "true");
    await expect(copie(page)).toHaveText("Le texte d’Alice. Et celui de Bilal.");
    expect(await motsEnBase(s15)).toBe("Le texte d’Alice. Et celui de Bilal.");
    let gardes = await copiesGardees(s15);
    expect(gardes.map((c) => [c.sorte, c.eleve_id, enClair(c.texte).join()])).toEqual([["ancien", null, "Le texte d’Alice, corrigé."]]);
    // Bilal écrit de nouveau ; la ligne du Suivi signale encore un texte, l'ancien
    await bilal.page.reload();
    await expect(copie(bilal.page)).toBeVisible();
    await page.getByRole("button", { name: "Voir l’ancien texte" }).click();
    await expect(onglet(page, /^Ancien texte de la scène, gardé à part/)).toHaveAttribute("aria-selected", "true");
    await expect(page.locator(".copie__lecture")).toContainText(/tel qu’il était à \d+ h \d\d/);

    // Second échange : le texte de Bilal ressort sous « Ancien texte de la scène », et Bilal n'est pas arrêté
    await page.getByRole("button", { name: "Mettre ce texte dans la scène" }).click();
    await expect(page.locator(".note--ok")).toContainText("L’ancien texte est de nouveau le texte de la scène. Celui qu’il remplace est gardé à part.");
    expect(await motsEnBase(s15)).toBe("Le texte d’Alice, corrigé.");
    gardes = await copiesGardees(s15);
    expect(gardes.map((c) => [c.sorte, c.eleve_id, enClair(c.texte).join()])).toEqual([["ancien", null, "Le texte d’Alice. Et celui de Bilal."]]);
    await expect(page.getByRole("tab")).toHaveText(["Texte de la scène", /Ancien texte de la scène/]);
    await bilal.page.reload();
    await expect(copie(bilal.page)).toBeVisible();
    await page.getByRole("link", { name: "Retour au Suivi" }).click();
    await expect(page.locator(".rappel")).toContainText("1 texte gardé à part");
    await bilal.contexte.close();
  });

  test("F08-AC21, AC29 — le texte de l'adulte est refusé : ses corrections sont dans un onglet, la scène montre le texte à jour, où il écrit aussitôt", async ({ page, context }) => {
    const a = await auteurEtSaScene(page);
    const scene = a.scenes[0];
    await semerTexte(a.base, scene, ["Le texte de départ."]);
    await aller(page, sceneAdulte(a.projet, scene));
    // Une seconde fenêtre du même auteur enregistre la première
    const seconde = await context.newPage();
    await aller(seconde, sceneAdulte(a.projet, scene));
    await ecrire(seconde, " Écrit dans la seconde fenêtre.");
    await attendreEnBase(scene, "seconde fenêtre");

    await ecrire(page, " Écrit dans la première.");
    await expect(page.locator(".note--attend")).toContainText(
      "Vous avez modifié cette scène dans une autre fenêtre. Ce que vous veniez d’écrire ici est gardé à part ; la scène montre le texte à jour.",
      { timeout: 8_000 },
    );
    await expect(copie(page)).toHaveText("Le texte de départ. Écrit dans la seconde fenêtre.");
    await expect(pied(page)).toHaveText("Enregistré");
    // Il n'est pas arrêté
    await ecrire(page, " Puis ceci.");
    await attendreEnBase(scene, "Puis ceci.");
    await page.getByRole("button", { name: "Voir ce texte" }).click();
    await expect(onglet(page, /^Votre texte, gardé à part/)).toHaveAttribute("aria-selected", "true");
    await expect(page.locator(".copie__texte--lu")).toHaveText("Le texte de départ. Écrit dans la première.");
    await page.getByRole("button", { name: "Mettre ce texte dans la scène" }).click();
    await expect(copie(page)).toHaveText("Le texte de départ. Écrit dans la première.");
    await expect(onglet(page, /^Ancien texte de la scène/)).toBeVisible();
    await onglet(page, /^Ancien texte de la scène/).click();
    await page.getByRole("button", { name: "Ne plus garder ce texte" }).click();
    await expect(page.getByRole("tab")).toHaveCount(0);
    expect(await motsEnBase(scene)).toBe("Le texte de départ. Écrit dans la première.");
  });

  test("F08-AC21 — en classe, l'onglet de l'enseignante s'appelle « Vos corrections » ; F06-AC62 — la scène qu'elle s'attribue se lit sans s'écrire", async ({ page, browser }) => {
    const s = await classeQuiEcrit(page);
    const [s15] = s.lisiere.scenes;
    await semerTexte(s.base, s15, ["Alice écrit."]);
    await aller(page, sceneAdulte(s.projet, s15));
    const alice = await posteDe(browser, s, "Alice");
    await aller(alice.page, sceneEleve(s15));
    await ecrire(alice.page, " Elle continue.");
    await attendreEnBase(s15, "Elle continue.");
    await ecrire(page, " Corrigé.");
    await expect(page.locator(".note--attend")).toContainText("Quelqu’un a modifié cette scène pendant que vous la corrigiez. Vos corrections sont gardées à part ; la scène montre le texte à jour.", { timeout: 8_000 });
    await page.getByRole("button", { name: "Voir vos corrections" }).click();
    await expect(onglet(page, /^Vos corrections, gardées à part/)).toHaveAttribute("aria-selected", "true");
    await page.getByRole("button", { name: "Ne plus garder ce texte" }).click();

    // « Moi » : les élèves lisent la scène, sans y écrire
    await s.base.from("scenes").update({ prise_par_enseignant: true }).eq("id", s15);
    await alice.page.reload();
    await expect(alice.page.locator(".copie__texte")).toHaveText("Alice écrit. Elle continue.");
    await expect(copie(alice.page)).toHaveCount(0);
    await expect(alice.page.getByText("Mme Laurent s’occupe de cette scène. Tu peux la lire.")).toBeVisible();
    await s.base.from("scenes").update({ prise_par_enseignant: false, prise_par_eleve: s.eleves.Alice.id }).eq("id", s15);
    await alice.page.reload();
    await expect(copie(alice.page)).toBeVisible();
    await expect(alice.page.getByText("Tu t’en occupes")).toBeVisible();
    await alice.contexte.close();
  });
});

test.describe("Côté élève : écrire, lire, perdre le réseau (F03, F06, F08.1)", () => {
  test("F03-AC17, F07-AC19, F06-AC20, AC21 — Alice écrit dans la scène préparée, sans consigne écrite ; Bilal lit son texte ; Chloé, d'un autre chapitre, n'y accède pas", async ({ page, browser }) => {
    const s = await classeQuiEcrit(page);
    const [s15] = s.lisiere.scenes;
    await s.base.from("scenes").update({ prise_par_eleve: s.eleves.Alice.id }).eq("id", s15);
    const alice = await posteDe(browser, s, "Alice");
    await alice.page.getByRole("link", { name: "Ouvrir La lisière" }).click();
    await alice.page.getByRole("link", { name: /^Écrire S001/ }).click();
    await alice.page.waitForURL(/\/travail\/scene\//);
    await expect(alice.page.getByText("Pas de consigne écrite. Suis celle que Mme Laurent t’a donnée.")).toBeVisible();
    await expect(sauv(alice.page)).toHaveText("Écris d’abord ton texte.");
    await ecrire(alice.page, "Lou entre dans la forêt.");
    await expect(sauv(alice.page)).toHaveText("Enregistré", { timeout: 6_000 });
    // Aucune commande pour créer une scène : elle écrit, c'est tout
    await expect(alice.page.getByRole("button", { name: /Ajouter une scène/ })).toHaveCount(0);

    const bilal = await posteDe(browser, s, "Bilal");
    await aller(bilal.page, sceneEleve(s15));
    await expect(bilal.page.locator(".copie__texte")).toHaveText("Lou entre dans la forêt.");
    await expect(bilal.page.getByText("Alice s’occupe de cette scène. Tu peux la lire. Pour écrire dedans, parle-lui d’abord, ou à Mme Laurent.")).toBeVisible();
    await expect(bilal.page.locator(".copie__barre")).toContainText("Le texte d’Alice");
    await expect(copie(bilal.page)).toHaveCount(0);

    const chloe = await posteDe(browser, s, "Chloé");
    const reponse = await chloe.page.goto(sceneEleve(s15));
    expect(reponse?.status()).toBe(404);
    await expect(chloe.page.getByText(/Lou entre/)).toHaveCount(0);
    for (const p of [alice, bilal, chloe]) await p.contexte.close();
  });

  test("F08-AC05, AC22, AC38 — sans réseau, Alice continue d'écrire et lit que rien n'est enregistré ; « Changer d'élève » ne la fait pas sortir ; au retour du réseau, le texte s'enregistre seul et l'écran l'annonce", async ({ page, browser }) => {
    test.setTimeout(120_000);
    const s = await classeQuiEcrit(page);
    const [s15] = s.lisiere.scenes;
    const alice = await posteDe(browser, s, "Alice");
    await aller(alice.page, sceneEleve(s15));
    await ecrire(alice.page, "Avant la coupure.");
    await expect(sauv(alice.page)).toHaveText("Enregistré", { timeout: 6_000 });

    await alice.contexte.setOffline(true);
    await ecrire(alice.page, " Pendant la coupure.");
    await expect(pied(alice.page)).toContainText("Ton texte n’est pas encore enregistré. Tu peux continuer, mais ne ferme pas cette page.", { timeout: 8_000 });
    await expect(pied(alice.page)).not.toContainText("Enregistré");
    // Le message est à l'écran sans défiler, et elle peut continuer d'écrire
    await expect(pied(alice.page)).toBeInViewport();
    await ecrire(alice.page, " Elle continue.");
    await expect(copie(alice.page)).toHaveText("Avant la coupure. Pendant la coupure. Elle continue.");

    await alice.page.getByRole("button", { name: "Changer d’élève" }).click();
    await alice.page.waitForTimeout(1_500);
    expect(alice.page.url()).toContain(sceneEleve(s15));
    await expect(pied(alice.page)).toContainText("Ton texte n’est pas encore enregistré.");
    await expect(alice.page.getByRole("button", { name: "Alice", exact: true })).toHaveCount(0);
    expect(await motsEnBase(s15)).toBe("Avant la coupure.");

    await alice.contexte.setOffline(false);
    await expect(pied(alice.page)).toContainText("Ça y est, ton texte est enregistré.", { timeout: 15_000 });
    expect(await motsEnBase(s15)).toBe("Avant la coupure. Pendant la coupure. Elle continue.");
    // Maintenant, « Changer d'élève » fait bien partir
    await alice.page.getByRole("button", { name: "Changer d’élève" }).click();
    await alice.page.waitForURL(/\/classe\/qui$/);
    await alice.contexte.close();
  });

  test("F08-AC23 — retour du réseau alors que la scène a changé : tout ce que Bilal a tapé pendant la coupure est gardé à part, il est arrêté, et le Suivi le signale", async ({ page, browser }) => {
    test.setTimeout(120_000);
    const s = await classeQuiEcrit(page);
    const [s15] = s.lisiere.scenes;
    await semerTexte(s.base, s15, ["Le début."]);
    const bilal = await posteDe(browser, s, "Bilal");
    await aller(bilal.page, sceneEleve(s15));
    await bilal.contexte.setOffline(true);
    await ecrire(bilal.page, " Dix minutes de Bilal.");
    await expect(pied(bilal.page)).toContainText("pas encore enregistré", { timeout: 8_000 });
    await semerTexte(s.base, s15, ["Le début, corrigé par Mme Laurent."]);
    await bilal.contexte.setOffline(false);
    await expect(pied(bilal.page)).toContainText("Quelqu’un d’autre a écrit dans cette scène en même temps que toi. Ton texte est gardé.", { timeout: 15_000 });
    expect(await motsEnBase(s15)).toBe("Le début, corrigé par Mme Laurent.");
    expect(enClair((await copiesGardees(s15))[0].texte)).toEqual(["Le début. Dix minutes de Bilal."]);
    await aller(page, `/projet/${s.projet}/suivi`);
    await expect(page.locator(".rappel")).toContainText("1 texte gardé à part");
    await bilal.contexte.close();
  });
});

test.describe("Fermeture d'un poste pendant l'écriture (F06.4, F08.2)", () => {
  test("F06-AC29, AC77 — la plage se termine, puis le mot de passe est remplacé : la dernière phrase est enregistrée avant que le poste ne se ferme", async ({ page, browser }) => {
    test.setTimeout(120_000);
    const s = await classeQuiEcrit(page);
    const [s15, s16] = s.lisiere.scenes;
    const alice = await posteDe(browser, s, "Alice");
    await aller(alice.page, sceneEleve(s15));
    await ecrire(alice.page, "La dernière phrase d’Alice");
    // La plage vient de se terminer : hier seulement
    const hier = ((new Date().getDay() + 6) % 7) || 7;
    await s.base.rpc("regler_horaires", { p_classe: s.classe.id, p_limites: true, p_plages: [{ jours: [hier], de: "00:00", a: "00:01" }] });
    await veiller(alice.page);
    await alice.page.waitForURL(/\/travail\?texte=enregistre$/);
    expect(await motsEnBase(s15)).toBe("La dernière phrase d’Alice");
    await expect(alice.page.getByText(/Le travail est fermé/)).toBeVisible();
    await expect(alice.page.getByText("Ton texte a été enregistré. Tu le retrouveras à la prochaine séance.")).toBeVisible();

    // À la reprise, elle retrouve son texte ; le mot de passe est remplacé pendant qu'elle écrit
    await s.base.rpc("regler_horaires", { p_classe: s.classe.id, p_limites: false, p_plages: [] });
    await aller(alice.page, sceneEleve(s15));
    await expect(copie(alice.page)).toHaveText("La dernière phrase d’Alice");
    await aller(alice.page, sceneEleve(s16));
    await ecrire(alice.page, "Encore une phrase");
    await sql("update classes set version_acces = version_acces + 1 where id = $1", [s.classe.id]);
    await veiller(alice.page);
    await alice.page.waitForURL(/\/classe$/);
    expect(await motsEnBase(s16)).toBe("Encore une phrase");
    await alice.contexte.close();
  });

  test("F06-AC76, AC78, F08-AC37 — deux heures sans activité : le texte est enregistré et le choix des profils s'affiche ; élève retiré de la classe : sa dernière phrase est gardée à part, et il ne figure plus", async ({ page, browser }) => {
    test.setTimeout(120_000);
    const s = await classeQuiEcrit(page);
    const [s15, s16] = s.lisiere.scenes;
    const alice = await posteDe(browser, s, "Alice");
    await aller(alice.page, sceneEleve(s15));
    await ecrire(alice.page, "Alice s’absente");
    await sql("update postes set actif_le = now() - interval '2 hours 1 minute' where inscription_id = $1", [s.eleves.Alice.inscriptionId]);
    await alice.page.evaluate(() => void window.dispatchEvent(new Event("veille-poste")));
    await alice.page.waitForURL(/\/classe\/qui$/);
    expect(await motsEnBase(s15)).toBe("Alice s’absente");
    await alice.contexte.close();

    const bilal = await posteDe(browser, s, "Bilal");
    await aller(bilal.page, sceneEleve(s16));
    await ecrire(bilal.page, "Bilal tapait encore");
    await s.base.from("inscriptions").update({ retire_le: new Date().toISOString() }).eq("id", s.eleves.Bilal.inscriptionId);
    await veiller(bilal.page);
    await bilal.page.waitForURL(/\/classe\/qui$/);
    await expect(bilal.page.getByRole("button", { name: "Alice", exact: true })).toBeVisible();
    await expect(bilal.page.getByRole("button", { name: "Bilal", exact: true })).toHaveCount(0);
    expect((await sceneEnBase(s16)).texte_vide).toBe(true);
    const [garde] = await copiesGardees(s16);
    expect(garde.eleve_id).toBe(s.eleves.Bilal.id);
    expect(enClair(garde.texte)).toEqual(["Bilal tapait encore"]);
    // L'enseignante trouve ce texte dans l'onglet de la scène
    await aller(page, sceneAdulte(s.projet, s16));
    await expect(page.getByRole("tab", { name: /gardé à part/ })).toBeVisible();
    await bilal.contexte.close();
  });

  test("F06-AC30 — coupure pendant l'enregistrement final : l'échec passe devant la fermeture, la page ne part pas et n'annonce pas « enregistré »", async ({ page, browser }) => {
    test.setTimeout(120_000);
    const s = await classeQuiEcrit(page);
    const [s15] = s.lisiere.scenes;
    const alice = await posteDe(browser, s, "Alice");
    await aller(alice.page, sceneEleve(s15));
    await ecrire(alice.page, "Avant.");
    await expect(sauv(alice.page)).toHaveText("Enregistré", { timeout: 6_000 });
    // Le serveur d'enregistrement ne répond plus, alors que la plage vient de se terminer
    await alice.page.route("**/copie", (route) => route.abort());
    const hier = ((new Date().getDay() + 6) % 7) || 7;
    await s.base.rpc("regler_horaires", { p_classe: s.classe.id, p_limites: true, p_plages: [{ jours: [hier], de: "00:00", a: "00:01" }] });
    await ecrire(alice.page, " Pas encore partie.");
    await veiller(alice.page);
    await expect(pied(alice.page)).toContainText("Ton texte n’est pas encore enregistré.", { timeout: 8_000 });
    await alice.page.waitForTimeout(1_000);
    expect(alice.page.url()).toContain(sceneEleve(s15));
    await expect(copie(alice.page)).toHaveText("Avant. Pas encore partie.");
    // Le service revient : la page réessaie d'elle-même, le texte est enregistré même après l'échéance, puis elle se ferme
    await alice.page.unroute("**/copie");
    await expect.poll(() => motsEnBase(s15), { timeout: 20_000 }).toBe("Avant. Pas encore partie.");
    await veiller(alice.page);
    await alice.page.waitForURL(/\/travail\?texte=enregistre$/);
    await s.base.rpc("regler_horaires", { p_classe: s.classe.id, p_limites: false, p_plages: [] });
    await alice.contexte.close();
  });
});

test.describe("Versions précédentes et suppression d'un texte (F08.2, F03.1)", () => {
  test("F08-AC40, AC42, AC43 — un texte effacé par erreur se retrouve dans « Versions précédentes » et se remet dans la scène ; l'élève n'y a pas accès", async ({ page, browser }) => {
    test.setTimeout(120_000);
    const s = await classeQuiEcrit(page);
    const [s15] = s.lisiere.scenes;
    await semerTexte(s.base, s15, ["Ligne un.", "Ligne deux.", "Ligne trois."]);
    await sql("delete from versions_precedentes where scene_id = $1", [s15]);
    await s.base.from("scenes").update({ prise_par_eleve: s.eleves.Alice.id }).eq("id", s15);
    const alice = await posteDe(browser, s, "Alice");
    await aller(alice.page, sceneEleve(s15));
    // Elle sélectionne tout, tape une lettre, et quitte
    await copie(alice.page).click();
    await alice.page.keyboard.press("ControlOrMeta+a");
    await alice.page.waitForTimeout(150);
    await alice.page.keyboard.type("x");
    await attendreEnBase(s15, /^x$/);
    await expect(alice.page.getByText(/Versions précédentes/)).toHaveCount(0);
    await alice.contexte.close();

    await aller(page, sceneAdulte(s.projet, s15));
    await page.locator('summary[aria-label="Autres commandes de la scène S001"]').click();
    await page.getByRole("button", { name: "Versions précédentes" }).click();
    const panneau = page.locator(".panneau");
    await expect(panneau.getByRole("button", { name: /^Avant les modifications d’Alice, \w+ \d+(er)? \w+$/ })).toHaveAttribute("aria-pressed", "true");
    await expect(panneau.locator(".copie__texte--lu p")).toHaveText(["Ligne un.", "Ligne deux.", "Ligne trois."]);
    await panneau.getByRole("button", { name: "Mettre ce texte dans la scène" }).click();
    await expect(MESSAGE(page)).toContainText("Ce texte est maintenant le texte de la scène.");
    await expect(copie(page).locator("p")).toHaveText(["Ligne un.", "Ligne deux.", "Ligne trois."]);
    expect(await motsEnBase(s15)).toBe("Ligne un. / Ligne deux. / Ligne trois.");
    // Le texte remplacé figure à son tour parmi les versions ; Alice reste indiquée
    await page.locator('summary[aria-label="Autres commandes de la scène S001"]').click();
    await page.getByRole("button", { name: "Versions précédentes" }).click();
    await expect(page.locator(".panneau .versions button")).toHaveText([/^Texte remplacé \w+ \d+(er)? \w+ à \d+ h \d\d$/]);
    await expect(page.locator(".panneau .copie__texte--lu")).toHaveText("x");
    await page.locator(".panneau").getByRole("button", { name: "Fermer", exact: true }).last().click();
    await expect(page.getByText("Alice s’en occupe")).toBeVisible();
  });

  test("F03-AC13, AC14, AC22 — supprimer un chapitre qui a des textes annonce d'abord les scènes écrites et leurs auteurs ; « Annuler » garde tout, « Restaurer » rend le chapitre et ses textes", async ({ page, browser }) => {
    test.setTimeout(120_000);
    const s = await classeQuiEcrit(page);
    const [s15, s16] = s.lisiere.scenes;
    const alice = await posteDe(browser, s, "Alice");
    await aller(alice.page, sceneEleve(s15));
    await ecrire(alice.page, "Le texte d’Alice.");
    await attendreEnBase(s15, "Le texte d’Alice.");
    await alice.contexte.close();

    await aller(page, `/projet/${s.projet}/plan`);
    // Un chapitre sans texte se supprime sans confirmation ; celui-ci demande confirmation
    await page.locator('summary[aria-label="Autres commandes du chapitre La lisière"]').click();
    await page.getByRole("button", { name: "Supprimer" }).click();
    const dialogue = page.getByRole("alertdialog", { name: "Supprimer « La lisière » ?" });
    await expect(dialogue.locator("li")).toHaveText([
      "2 scènes, dont 1 a un texte.",
      "Alice y a écrit.",
      "Rien n’est effacé : vous retrouvez tout dans la corbeille du projet.",
    ]);
    await dialogue.getByRole("button", { name: "Annuler" }).click();
    await expect(page.getByRole("heading", { name: "La lisière" })).toBeVisible();
    expect(await motsEnBase(s15)).toBe("Le texte d’Alice.");

    await page.locator('summary[aria-label="Autres commandes du chapitre La lisière"]').click();
    await page.getByRole("button", { name: "Supprimer" }).click();
    await page.getByRole("alertdialog").getByRole("button", { name: "Supprimer" }).click();
    await expect(MESSAGE(page)).toContainText("« La lisière » est supprimé. Vous le retrouvez dans la corbeille du projet.");
    await expect(page.getByRole("heading", { name: "La lisière" })).toHaveCount(0);
    expect(await motsEnBase(s15)).toBe("Le texte d’Alice.");
    await MESSAGE(page).getByRole("button", { name: "Annuler" }).click();
    await expect(page.getByRole("heading", { name: "La lisière" })).toBeVisible();

    // Une scène : avec texte, le dialogue ; sans texte, tout de suite
    await aller(page, `/projet/${s.projet}/chapitre/${s.lisiere.id}`);
    await page.locator('summary[aria-label="Autres commandes de la scène S001"]').click();
    await page.getByRole("button", { name: "Supprimer" }).click();
    await expect(page.getByRole("alertdialog", { name: "Supprimer S001 « Le sentier » ?" }).locator("li").first()).toHaveText("Cette scène a un texte.");
    await page.getByRole("alertdialog").getByRole("button", { name: "Annuler" }).click();
    await page.locator('summary[aria-label="Autres commandes de la scène S002"]').click();
    await page.getByRole("button", { name: "Supprimer" }).click();
    await expect(page.getByRole("alertdialog")).toHaveCount(0);
    await expect(MESSAGE(page)).toContainText("S002 « Le pont » est supprimée.");
    expect((await sceneEnBase(s16)).texte_vide).toBe(true);
  });
});

test("F08-AC36 — scène supprimée pendant que Bilal tape, puis restaurée : ce qu'il n'avait pas enregistré est dans son onglet", async ({ page, browser }) => {
  test.setTimeout(120_000);
  const s = await classeQuiEcrit(page);
  const [s15] = s.lisiere.scenes;
  const bilal = await posteDe(browser, s, "Bilal");
  await aller(bilal.page, sceneEleve(s15));
  await s.base.rpc("supprimer_element", { p_sorte: "scene", p_id: s15 });
  await ecrire(bilal.page, "Bilal tapait dans une scène supprimée.");
  // Son écran revient à ce qu'il a encore le droit de voir
  await bilal.page.waitForURL(/\/travail(\?|$)/, { timeout: 10_000 });
  await s.base.rpc("restaurer_element", { p_sorte: "scene", p_id: s15 });
  await aller(page, sceneAdulte(s.projet, s15));
  await page.getByRole("tab", { name: /^Texte de Bilal, gardé à part/ }).click();
  await expect(page.locator(".copie__texte--lu")).toHaveText("Bilal tapait dans une scène supprimée.");
  await expect(ALERTE(page)).toHaveCount(0);
  await bilal.contexte.close();
});
