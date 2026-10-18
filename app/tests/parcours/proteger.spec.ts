import { expect, test, type Page } from "@playwright/test";
import {
  adultePret, aller, attendreEnBase, attendreEnregistre, BANDEAU, blocsEditeur, choixAuto, classeQuiEcrit, copie, ecrire, enClair, FICHE, liaison,
  liensEnBase, note, numerosEnBase, PHRASES, sauv, posteDe, presseTexte, protege, recit, sceneEnBase, selectionner, semerBlocs, semerPartie, semerProjet,
  sql, supprimerComptes, typesEnBase, copiesGardees,
} from "./outils";

/**
 * Étape 3 du plan, lot 3 : liaison cachée par énigme (F05.1), note de l'enseignant (F05.2)
 * et paragraphe protégé (F06.1). Ce sont les scénarios 8 à 11 du prototype de l'éditeur
 * (docs/architecture.md), réécrits pour l'application.
 */

test.afterEach(async () => {
  await supprimerComptes();
});

const sceneAdulte = (projet: string, scene: string) => `/projet/${projet}/scene/${scene}`;
const sceneEleve = (scene: string) => `/travail/scene/${scene}`;
const MOD = "ControlOrMeta";
const HORS_RECIT = (page: Page) => page.locator(".hors-recit");
const numeroFixe = async (scene: string): Promise<number | null> => (await sql<{ n: number | null }>("select numero_fixe as n from scenes where id = $1", [scene]))[0].n;
const liensCaches = (projet: string) => sql<{ cache: boolean }>("select cache from liens where projet_id = $1 order by rang", [projet]);

/** Un auteur seul : « La lisière » (S001 Le sentier, S002 Clairière, S003 La souche, S004 Le pont). */
async function auteur(page: Page) {
  const { compte, base } = await adultePret(page);
  const projet = await semerProjet(base, compte, "personnel", "choix", "Les passeurs de brume");
  const { chapitres } = await semerPartie(base, projet, "La forêt", [{ titre: "La lisière", scenes: ["Le sentier", "Clairière", "La souche", "Le pont"] }]);
  return { base, projet, chapitre: chapitres[0].id, scenes: chapitres[0].scenes };
}

test.describe("Paragraphe protégé (F06.1) — point 8 du prototype", () => {
  for (const prenom of ["Alice", "Bilal"] as const) {
    test(`F06-AC50, F01-AC13 — ${prenom} ne peut ni modifier ni supprimer le paragraphe protégé ; il porte « Préparé par Mme Laurent » ; elle ou il écrit avant et après`, async ({ page, browser }) => {
      test.setTimeout(120_000);
      const s = await classeQuiEcrit(page);
      const [s15] = s.lisiere.scenes;
      const prepare = protege("Il était une fois un pont de brume.");
      await semerBlocs(s.base, s15, [prepare, recit("Lou s’approcha.")]);
      const poste = await posteDe(browser, s, prenom);
      await aller(poste.page, sceneEleve(s15));
      const bloc = copie(poste.page).locator(".bloc-prepare");
      await expect(bloc.locator(".bloc-prepare__texte")).toHaveText("Il était une fois un pont de brume.");
      await expect(bloc.locator(".repere-prepare")).toHaveText("Préparé par Mme Laurent");

      // Le curseur n'y entre pas : rien ne s'y tape, rien ne s'en efface
      await bloc.locator(".bloc-prepare__texte").click();
      await poste.page.keyboard.type("Zut");
      await poste.page.keyboard.press("Backspace");
      await poste.page.keyboard.press("Delete");
      expect((await blocsEditeur(poste.page))[0]).toEqual(prepare);
      // Tout sélectionner et supprimer : le récit part, le paragraphe protégé demeure
      await copie(poste.page).locator("p").first().click();
      await poste.page.keyboard.press(`${MOD}+a`);
      await poste.page.waitForTimeout(150);
      await poste.page.keyboard.press("Delete");
      expect((await blocsEditeur(poste.page)).map((b) => [b.type, b.protege ?? false])).toEqual([["p", true], ["p", false]]);

      // Écrire avant, par le « + » de la marge, et après
      await bloc.getByRole("button", { name: "Écrire un paragraphe au-dessus" }).click();
      await expect(copie(poste.page)).toBeFocused();
      await poste.page.keyboard.type("Tout au début.");
      await ecrire(poste.page, "Et après.");
      await attendreEnBase(s15, "Et après.");
      const enBase = await sceneEnBase(s15);
      expect(enClair(enBase.texte)).toEqual(["Tout au début.", "Il était une fois un pont de brume.", "Et après."]);
      expect(enBase.texte[1]).toEqual(prepare);
      await expect(sauv(poste.page)).toHaveText("Enregistré", { timeout: 8_000 });
      await poste.contexte.close();
    });
  }

  test("écrire entre deux blocs préparés voisins : le « + » ne se montre que là où le curseur n'a pas d'autre accès ; Entrée ouvre un paragraphe dessous", async ({ page, browser }) => {
    test.setTimeout(120_000);
    const s = await classeQuiEcrit(page);
    const [s15, s16] = s.lisiere.scenes;
    await semerBlocs(s.base, s15, [choixAuto("Traverser le pont", s16), protege("Le pont grinçait."), recit("Lou hésita."), protege("Puis la brume se leva.")]);
    const alice = await posteDe(browser, s, "Alice");
    await aller(alice.page, sceneEleve(s15));
    // Au-dessus du premier bloc, et entre les deux blocs préparés ; pas après un paragraphe où l'on écrit
    await expect(copie(alice.page).locator(".plus-avant:visible")).toHaveCount(2);
    await copie(alice.page).locator(".bloc-prepare").first().getByRole("button", { name: "Écrire un paragraphe au-dessus" }).click();
    // Le curseur arrive dans le nouveau paragraphe dès qu'il est à l'écran
    await expect(copie(alice.page)).toBeFocused();
    await alice.page.keyboard.type("Entre les deux.");
    await attendreEnBase(s15, "Entre les deux.");
    expect(await typesEnBase(s15)).toEqual(["choix", "p", "p", "p", "p"]);
    // Entrée, sur un bloc préparé, ouvre un paragraphe dessous
    await selectionner(alice.page, { bloc: 0, offset: 0 });
    await alice.page.keyboard.press("Enter");
    await alice.page.keyboard.type("Sous le choix.");
    await attendreEnBase(s15, "Sous le choix.");
    expect(enClair((await sceneEnBase(s15)).texte)).toEqual(["", "Sous le choix.", "Entre les deux.", "Le pont grinçait.", "Lou hésita.", "Puis la brume se leva."]);
    expect(await liensEnBase(s.projet)).toEqual(["S001 > S002"]);
    await alice.contexte.close();
  });

  test("au clavier seul, les flèches traversent un bloc préparé sans y écrire ; une opération forcée par programme est arrêtée", async ({ page, browser }) => {
    test.setTimeout(120_000);
    const s = await classeQuiEcrit(page);
    const [s15] = s.lisiere.scenes;
    const prepare = protege("Le pont grinçait.");
    await semerBlocs(s.base, s15, [recit("Avant."), prepare, recit("Après.")]);
    const alice = await posteDe(browser, s, "Alice");
    await aller(alice.page, sceneEleve(s15));
    await selectionner(alice.page, { bloc: 0, offset: 6 });
    await alice.page.keyboard.press("ArrowRight");
    await expect(copie(alice.page).locator(".bloc-prepare")).toHaveClass(/est-choisi/);
    await alice.page.keyboard.type("x");
    await alice.page.keyboard.press("ArrowDown");
    await alice.page.keyboard.type("Puis ");
    await selectionner(alice.page, { bloc: 1, offset: 0 });
    await alice.page.keyboard.press("ArrowUp");
    await alice.page.keyboard.type(" Encore.");
    await attendreEnBase(s15, "Encore.");
    expect(enClair((await sceneEnBase(s15)).texte)).toEqual(["Avant. Encore.", "Le pont grinçait.", "Puis Après."]);

    // La garde d'opérations : même forcées par programme, les modifications du bloc préparé n'ont pas lieu
    await alice.page.evaluate(() => {
      const e = (window as unknown as { __copie: { tf: Record<string, (...a: unknown[]) => void> } }).__copie;
      e.tf.insertText("Forcé", { at: { path: [1, 0], offset: 0 } });
      e.tf.setNodes({ protege: false }, { at: [1] });
      e.tf.removeNodes({ at: [1] });
    });
    expect((await blocsEditeur(alice.page))[1]).toEqual(prepare);
    await alice.contexte.close();
  });

  test("F06-AC51, F01-AC13 — l'enseignante protège un paragraphe, en corrige un mot sans lever la protection, puis la retire ; sans nom affiché, l'élève lit « Préparé par ton enseignant(e) »", async ({ page, browser }) => {
    test.setTimeout(150_000);
    const s = await classeQuiEcrit(page);
    const [s15] = s.lisiere.scenes;
    await semerBlocs(s.base, s15, [recit("Il était une fois un pont."), recit("Lou s’approcha.")]);
    await aller(page, sceneAdulte(s.projet, s15));
    const bouton = page.getByRole("toolbar", { name: "Outils de la copie" }).getByRole("button", { name: /^(Protéger|Retirer la protection)$/ });
    await selectionner(page, { bloc: 0, offset: 5 });
    await expect(bouton).toHaveAccessibleName("Protéger");
    await bouton.click();
    await expect(bouton).toHaveAccessibleName("Retirer la protection");
    await expect(copie(page).locator("p.est-protege")).toHaveText("Il était une fois un pont.");
    await attendreEnregistre(page);
    expect((await sceneEnBase(s15)).texte.map((b) => (b as { protege?: boolean }).protege ?? false)).toEqual([true, false]);
    // Dans le second paragraphe, le bouton redevient « Protéger »
    await selectionner(page, { bloc: 1, offset: 0 });
    await expect(bouton).toHaveAccessibleName("Protéger");

    // Elle corrige un mot : le paragraphe reste protégé
    await selectionner(page, { bloc: 0, offset: 21 }, { bloc: 0, offset: 25 });
    await page.keyboard.type("gué");
    await attendreEnBase(s15, "un gué");
    const corrige = (await sceneEnBase(s15)).texte[0];
    expect(corrige).toMatchObject({ protege: true });
    expect(enClair([corrige])).toEqual(["Il était une fois un gué."]);
    // Entrée à la fin d'un paragraphe protégé : la suite ne l'est pas
    await selectionner(page, { bloc: 0, offset: 25 });
    await page.keyboard.press("Enter");
    await page.keyboard.type("La suite.");
    await attendreEnBase(s15, "La suite.");
    expect((await sceneEnBase(s15)).texte.map((b) => (b as { protege?: boolean }).protege ?? false)).toEqual([true, false, false]);

    // Bilal le lit préparé, au nom que l'enseignante affiche ; sans nom, « ton enseignant(e) »
    const bilal = await posteDe(browser, s, "Bilal");
    await aller(bilal.page, sceneEleve(s15));
    await expect(copie(bilal.page).locator(".bloc-prepare .repere-prepare")).toHaveText("Préparé par Mme Laurent");
    await s.base.from("enseignants").update({ nom_affiche: null }).eq("id", s.compte.id);
    await bilal.page.reload();
    await expect(copie(bilal.page).locator(".bloc-prepare .repere-prepare")).toHaveText("Préparé par ton enseignant(e)");

    // « Retirer la protection » le rend modifiable par les élèves
    await selectionner(page, { bloc: 0, offset: 3 });
    await bouton.click();
    await expect(copie(page).locator("p.est-protege")).toHaveCount(0);
    await attendreEnregistre(page);
    await bilal.page.reload();
    await expect(copie(bilal.page).locator(".bloc-prepare")).toHaveCount(0);
    await selectionner(bilal.page, { bloc: 0, offset: 0 });
    await bilal.page.keyboard.type("Jadis, ");
    await attendreEnBase(s15, "Jadis, Il était");
    await bilal.contexte.close();
  });

  test("point 9 — navigateur contourné : un paragraphe protégé modifié, une protection retirée ou une note ajoutée par un poste sont refusés par le serveur ; le texte de la scène ne bouge pas, celui de l'élève est gardé à part", async ({ page, browser }) => {
    test.setTimeout(120_000);
    const s = await classeQuiEcrit(page);
    const [s15] = s.lisiere.scenes;
    const prepare = protege("Le pont grinçait.");
    await semerBlocs(s.base, s15, [prepare, recit("Lou hésita.")]);
    const bilal = await posteDe(browser, s, "Bilal");
    await aller(bilal.page, sceneEleve(s15));
    const [{ id: ecriture }] = await sql<{ id: string }>("select id from ecritures where scene_id = $1 and eleve_id = $2 order by ouverte_le desc limit 1", [s15, s.eleves.Bilal.id]);
    const envoyer = (texte: unknown, version: number) =>
      bilal.page.evaluate(
        async ([e, v, t]) => (await fetch("/copie", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ecriture: e, version: v, texte: t }) })).json(),
        [ecriture, version, texte] as const,
      );
    const avant = await sceneEnBase(s15);
    const libre = avant.texte[1];
    const forges = [
      [{ ...prepare, children: [{ text: "Le pont tenait bon." }] }, libre],
      [{ type: "p", id: prepare.id, children: prepare.children }, libre],
      [libre],
      [prepare, libre, { type: "note", id: crypto.randomUUID(), children: [{ text: "Mot glissé" }] }],
      [prepare, libre, { type: "liaison", id: crypto.randomUUID(), cible: s.lisiere.scenes[1], children: [{ text: "" }] }],
    ];
    for (const [i, forge] of forges.entries()) {
      // Une note glissée dans un texte par ailleurs inchangé : rien à garder, la note est écartée
      const rienAGarder = i === 3;
      expect(await envoyer(forge, avant.version)).toMatchObject({ etat: rienAGarder ? "refuse" : "garde", motif: "controle" });
      // Ce que le poste a tenté n'est pas perdu : c'est gardé à part, à son nom
      expect((await copiesGardees(s15)).map((c) => [c.sorte, c.eleve_id])).toEqual(rienAGarder ? [] : [["refus", s.eleves.Bilal.id]]);
      // L'enseignante ne garde pas ce texte : Bilal n'est plus arrêté, la tentative suivante est jugée pour elle-même
      await sql("delete from copies_recuperation where scene_id = $1", [s15]);
    }
    const apres = await sceneEnBase(s15);
    expect(apres.texte).toEqual(avant.texte);
    expect(apres.version).toBe(avant.version);
    await bilal.contexte.close();
  });

  test("F05-AC41 — en projet personnel, ni « Protéger » ni repère de bloc protégé ; l'auteur a la note et le lien caché", async ({ page }) => {
    const a = await auteur(page);
    await semerBlocs(a.base, a.scenes[0], [recit("Lou fit un pas.")]);
    await aller(page, sceneAdulte(a.projet, a.scenes[0]));
    const barre = page.getByRole("toolbar", { name: "Outils de la copie" });
    await expect(barre.getByRole("button", { name: "Note" })).toBeVisible();
    await expect(barre.getByRole("button", { name: /Protéger|Retirer la protection/ })).toHaveCount(0);
    await expect(copie(page).locator(".est-protege, .bloc-prepare, .marge--crochet")).toHaveCount(0);
    await barre.getByRole("button", { name: "Choix", exact: true }).click();
    await expect(FICHE(page).getByRole("button", { name: "Lien caché (énigme)…" })).toBeVisible();
  });
});

test.describe("Liaison cachée par énigme (F05.1, F05.2) — point 11 du prototype", () => {
  test("F05-AC26 — « Cacher ce choix (énigme) » : la phrase quitte le texte, le lien reste, le numéro de la destination est fixé ; « Proposer comme choix » recrée une phrase automatique", async ({ page }) => {
    test.setTimeout(120_000);
    const a = await auteur(page);
    await semerBlocs(a.base, a.scenes[0], [recit("Devant la porte aux symboles."), choixAuto("Déchiffrer les symboles", a.scenes[2])]);
    await aller(page, sceneAdulte(a.projet, a.scenes[0]));
    await PHRASES(page).locator(".phrase-choix__corps").click();
    await FICHE(page).getByRole("button", { name: "Cacher ce choix (énigme)" }).click();
    await expect(PHRASES(page)).toHaveCount(0);
    const numero = (await numerosEnBase(a.projet))[a.scenes[2]];
    await expect(BANDEAU(page)).toContainText(`Le choix est caché : c’est maintenant un lien caché, hors du récit. S003 « La souche » garde le n° ${numero}.`);
    await expect(HORS_RECIT(page)).toContainText("Hors du récit · jamais imprimé");
    await expect(HORS_RECIT(page).locator(".lien-cache")).toContainText("Lien caché");
    await expect(HORS_RECIT(page).locator(".lien-cache")).toContainText("La souche");
    await expect(HORS_RECIT(page).locator(".lien-cache")).toContainText(`n° ${numero} fixé`);
    await attendreEnregistre(page);
    expect(await typesEnBase(a.scenes[0])).toEqual(["p", "liaison"]);
    expect(await liensEnBase(a.projet)).toEqual(["S001 > S003"]);
    expect(await liensCaches(a.projet)).toEqual([{ cache: true }]);
    expect(await numeroFixe(a.scenes[2])).toBe(numero);

    // « Proposer comme choix » : le libellé que portait le choix revient, sans le redemander
    await HORS_RECIT(page).getByRole("button", { name: /Régler ce lien/ }).click();
    await FICHE(page).getByRole("button", { name: "Proposer comme choix" }).click();
    await expect(HORS_RECIT(page)).toHaveCount(0);
    await expect(PHRASES(page)).toContainText(`Déchiffrer les symboles : rends-toi au ${numero}.`);
    await attendreEnregistre(page);
    expect(await typesEnBase(a.scenes[0])).toEqual(["p", "choix"]);
    expect(await liensCaches(a.projet)).toEqual([{ cache: false }]);
    // « Annuler » : le lien caché revient, la phrase repart
    await BANDEAU(page).getByRole("button", { name: "Annuler" }).click();
    await expect(PHRASES(page)).toHaveCount(0);
    await expect(HORS_RECIT(page).locator(".lien-cache")).toContainText("La souche");
    await attendreEnregistre(page);
    expect(await liensCaches(a.projet)).toEqual([{ cache: true }]);
  });

  test("F05-AC07, AC36, AC06, F11-AC98 — créer un lien caché : le numéro que donne l'énigme est fixé, un numéro déjà fixé est refusé en nommant la scène ; une scène ajoutée ne le change pas ; le lien retiré, la scène garde son numéro et le message propose « Libérer le numéro »", async ({ page }) => {
    test.setTimeout(150_000);
    const a = await auteur(page);
    await semerBlocs(a.base, a.scenes[0], [recit("Devant la porte aux symboles.")]);
    expect((await a.base.rpc("fixer_numero", { p_scene: a.scenes[3], p_numero: 38 })).error).toBeNull();
    await aller(page, sceneAdulte(a.projet, a.scenes[0]));
    await page.getByRole("button", { name: "Choix", exact: true }).click();
    await FICHE(page).getByRole("button", { name: "Lien caché (énigme)…" }).click();
    // Un lien caché ne mène qu'à une scène qui existe
    await expect(FICHE(page).getByRole("radio", { name: "Nouvelle scène" })).toHaveCount(0);
    await expect(FICHE(page).getByRole("button", { name: "Décider plus tard" })).toHaveCount(0);
    await FICHE(page).getByLabel("Chercher une scène").fill("souche");
    await FICHE(page).getByLabel("Chercher une scène").press("Enter");
    await expect(FICHE(page)).toContainText(/La souche porte le n° \d+\. Il sera fixé/);
    await FICHE(page).getByLabel("Ou le numéro que donne votre énigme").fill("38");
    await FICHE(page).getByRole("button", { name: "Créer avec ce numéro" }).click();
    await expect(FICHE(page).getByRole("alert")).toContainText("Le n° 38 est déjà celui de S004 « Le pont ».");
    expect(await numeroFixe(a.scenes[2])).toBeNull();
    await FICHE(page).getByLabel("Ou le numéro que donne votre énigme").fill("31");
    await expect(FICHE(page)).toContainText("Le livre ne compte que 4 passages pour l’instant");
    await FICHE(page).getByRole("button", { name: "Créer avec ce numéro" }).click();
    await expect(BANDEAU(page)).toContainText("Le lien caché est créé, vers S003 « La souche », n° 31. Il ne s’imprime pas : l’énigme s’écrit dans le texte.");
    await expect(HORS_RECIT(page).locator(".lien-cache")).toContainText("n° 31 fixé");
    await attendreEnregistre(page);
    // Rien n'est ajouté au récit
    expect(await typesEnBase(a.scenes[0])).toEqual(["p", "liaison"]);
    expect(enClair((await sceneEnBase(a.scenes[0])).texte)).toEqual(["Devant la porte aux symboles.", ""]);
    expect(await liensCaches(a.projet)).toEqual([{ cache: true }]);
    expect((await numerosEnBase(a.projet))[a.scenes[2]]).toBe(31);

    // Une scène de plus dans la même partie : S003 reste au n° 31 (F05-AC06)
    expect((await a.base.rpc("creer_scene", { p_chapitre: a.chapitre })).error).toBeNull();
    expect((await numerosEnBase(a.projet))[a.scenes[2]]).toBe(31);

    // Le lien n'a pas de libellé : « Proposer comme choix » le demande
    await HORS_RECIT(page).getByRole("button", { name: /Régler ce lien/ }).click();
    await FICHE(page).getByRole("button", { name: "Proposer comme choix" }).click();
    await FICHE(page).getByLabel("Ce que fait le lecteur").fill("Déchiffrer les symboles");
    await FICHE(page).getByRole("button", { name: "Proposer comme choix" }).click();
    await expect(PHRASES(page)).toContainText("Déchiffrer les symboles : rends-toi au 31.");
    await BANDEAU(page).getByRole("button", { name: "Annuler" }).click();
    await expect(PHRASES(page)).toHaveCount(0);

    // Retiré : la scène garde son numéro, une énigme pouvant rester dans un texte
    await HORS_RECIT(page).getByRole("button", { name: /Régler ce lien/ }).click();
    await FICHE(page).getByRole("button", { name: "Retirer ce lien caché" }).click();
    await expect(HORS_RECIT(page)).toHaveCount(0);
    await expect(BANDEAU(page)).toContainText("Lien caché retiré. S003 « La souche » garde le n° 31 fixé.");
    await attendreEnregistre(page);
    expect(await liensEnBase(a.projet)).toEqual([]);
    expect(await numeroFixe(a.scenes[2])).toBe(31);
    // « Annuler » le rend ; retiré de nouveau, « Libérer le numéro »
    await BANDEAU(page).getByRole("button", { name: "Annuler" }).click();
    await expect(HORS_RECIT(page).locator(".lien-cache")).toContainText("n° 31 fixé");
    await HORS_RECIT(page).getByRole("button", { name: /Régler ce lien/ }).click();
    await FICHE(page).getByRole("button", { name: "Retirer ce lien caché" }).click();
    await BANDEAU(page).getByRole("button", { name: "Libérer le numéro" }).click();
    await expect(BANDEAU(page)).toContainText("S003 « La souche » n’a plus de numéro fixé.");
    expect(await numeroFixe(a.scenes[2])).toBeNull();
    // S004, fixée à part, n'a pas bougé
    expect(await numeroFixe(a.scenes[3])).toBe(38);
  });

  test("F05-AC27, AC52 — Bilal, « écriture et organisation » : la saisie d'un choix ne lui propose pas « Lien caché (énigme) », et ni « Note » ni « /note » ne lui sont offerts", async ({ page, browser }) => {
    test.setTimeout(120_000);
    const s = await classeQuiEcrit(page);
    const [s15] = s.lisiere.scenes;
    await semerBlocs(s.base, s15, [recit("Lou fit un pas.")]);
    const bilal = await posteDe(browser, s, "Bilal");
    await aller(bilal.page, sceneEleve(s15));
    const barre = bilal.page.getByRole("toolbar", { name: "Outils de la copie" });
    await expect(barre.getByRole("button", { name: "Note" })).toHaveCount(0);
    await expect(barre.getByRole("button", { name: /Protéger/ })).toHaveCount(0);
    await ecrire(bilal.page, " /");
    await expect(bilal.page.locator(".slash [role=option]")).toHaveText([/Choix/, /Action de jeu/, /Objet/, /Personnage/]);
    await bilal.page.keyboard.type("note");
    await expect(bilal.page.locator(".slash")).toHaveCount(0);
    await bilal.page.keyboard.press("Enter");
    await expect(copie(bilal.page).locator(".note-prof")).toHaveCount(0);
    await barre.getByRole("button", { name: "Choix", exact: true }).click();
    await expect(FICHE(bilal.page).getByLabel("Ce que fait le lecteur")).toBeVisible();
    await expect(FICHE(bilal.page).getByRole("button", { name: "Lien caché (énigme)…" })).toHaveCount(0);
    // L'enseignante, elle, a les deux
    await aller(page, sceneAdulte(s.projet, s15));
    await expect(page.getByRole("toolbar", { name: "Outils de la copie" }).getByRole("button", { name: "Note" })).toBeVisible();
    await page.getByRole("button", { name: "Choix", exact: true }).click();
    await expect(FICHE(page).getByRole("button", { name: "Lien caché (énigme)…" })).toBeVisible();
    await bilal.contexte.close();
  });

  test("F05-AC37 — Chloé rédige l'énigme : elle lit « Ton énigme doit conduire au numéro 38 », sans titre ni référence de la destination, sans commande ; son texte s'enregistre sans toucher au lien, et un lien retiré par un navigateur contourné est refusé", async ({ page, browser }) => {
    test.setTimeout(120_000);
    const s = await classeQuiEcrit(page);
    const pont = s.lisiere.scenes[1];
    const autel = s.sanctuaire.scenes[0];
    const lien = liaison(pont);
    await semerBlocs(s.base, autel, [recit("Devant l’autel, trois symboles."), lien]);
    expect((await s.base.rpc("fixer_numero", { p_scene: pont, p_numero: 38 })).error).toBeNull();
    const chloe = await posteDe(browser, s, "Chloé");
    await aller(chloe.page, sceneEleve(autel));
    await expect(HORS_RECIT(chloe.page).locator(".lien-cache")).toHaveText("Ton énigme doit conduire au numéro 38");
    await expect(HORS_RECIT(chloe.page).getByRole("button")).toHaveCount(0);
    // Ni le titre ni la référence de la scène d'un chapitre qui n'est pas le sien
    expect(await chloe.page.content()).not.toMatch(/Le pont|S002/);

    await ecrire(chloe.page, " Elle réfléchit.");
    await attendreEnBase(autel, "Elle réfléchit.");
    const enBase = await sceneEnBase(autel);
    expect(enBase.texte.map((b) => b.type)).toEqual(["p", "liaison"]);
    expect(enBase.texte[1]).toEqual(lien);
    expect(await liensCaches(s.projet)).toEqual([{ cache: true }]);

    const [{ id: ecriture }] = await sql<{ id: string }>("select id from ecritures where scene_id = $1 and eleve_id = $2 order by ouverte_le desc limit 1", [autel, s.eleves.Chloé.id]);
    const reponse = await chloe.page.evaluate(
      async ([e, v, t]) => (await fetch("/copie", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ecriture: e, version: v, texte: t }) })).json(),
      [ecriture, enBase.version, [enBase.texte[0]]] as const,
    );
    expect(reponse).toMatchObject({ etat: "garde", motif: "controle" });
    expect((await sceneEnBase(autel)).texte[1]).toEqual(lien);
    await chloe.contexte.close();
  });
});

test.describe("Note de l'enseignant (F05.2) — point 11 du prototype", () => {
  test("F05-AC49, AC50 — Alice ne voit ni la note ni un repère, et son poste n'en reçoit rien ; quand elle enregistre, la note reste à sa place ; le paragraphe d'avant supprimé, elle remonte en tête de la scène", async ({ page, browser }) => {
    test.setTimeout(150_000);
    const s = await classeQuiEcrit(page);
    const [s15] = s.lisiere.scenes;
    const solution = note("Solution : 38");
    await semerBlocs(s.base, s15, [recit("Premier."), solution, recit("Second.")]);
    const alice = await posteDe(browser, s, "Alice");
    const recu: string[] = [];
    alice.page.on("response", (r) => void r.text().then((t) => recu.push(t)).catch(() => undefined));
    await aller(alice.page, sceneEleve(s15));
    await expect(copie(alice.page).locator("p")).toHaveText(["Premier.", "Second."]);
    await expect(copie(alice.page).locator(".note-prof")).toHaveCount(0);
    expect(await alice.page.content()).not.toContain("Solution");
    expect(await blocsEditeur(alice.page)).toHaveLength(2);

    // Elle ajoute une phrase au premier paragraphe : la note est toujours entre les deux
    await selectionner(alice.page, { bloc: 0, offset: 8 });
    await alice.page.keyboard.type(" Une phrase de plus.");
    await attendreEnBase(s15, "Une phrase de plus.");
    let enBase = await sceneEnBase(s15);
    expect(enBase.texte.map((b) => b.type)).toEqual(["p", "note", "p"]);
    expect(enBase.texte[1]).toEqual(solution);
    await expect(sauv(alice.page)).toHaveText("Enregistré", { timeout: 8_000 });

    // Elle vide puis supprime le premier paragraphe : la note remonte en tête
    await selectionner(alice.page, { bloc: 0, offset: 0 }, { bloc: 0, offset: 28 });
    await alice.page.keyboard.press("Delete");
    await selectionner(alice.page, { bloc: 1, offset: 0 });
    await alice.page.keyboard.press("Backspace");
    await alice.page.keyboard.type("Et ");
    await attendreEnBase(s15, "Et Second.");
    enBase = await sceneEnBase(s15);
    expect(enBase.texte.map((b) => b.type)).toEqual(["note", "p"]);
    expect(enBase.texte[0]).toEqual(solution);
    await expect(sauv(alice.page)).toHaveText("Enregistré", { timeout: 8_000 });
    // Rien de ce que le poste a reçu, pages et réponses, ne contenait la note
    expect(recu.join("\n")).not.toContain("Solution");

    // L'enseignante retrouve sa note
    await aller(page, sceneAdulte(s.projet, s15));
    await expect(copie(page).locator(".note-prof")).toContainText("Note · pour vous seul, jamais imprimée");
    await expect(copie(page).locator(".note-prof__texte")).toHaveText("Solution : 38");
    await alice.contexte.close();
  });

  test("F05-AC51 — une scène qui ne porte qu'une note reste « Texte vide » ; la note se pose par « /note » ou le bouton, se met en forme, et Entrée en sort", async ({ page, browser }) => {
    test.setTimeout(120_000);
    const s = await classeQuiEcrit(page);
    const [, s16] = s.lisiere.scenes;
    await aller(page, sceneAdulte(s.projet, s16));
    await copie(page).click();
    await page.keyboard.type("/no");
    await expect(page.locator(".slash [role=option]")).toHaveText([/Note.*Pour vous seul, jamais imprimée/]);
    await page.keyboard.press("Enter");
    await page.keyboard.type("Penser au ");
    await page.keyboard.press(`${MOD}+b`);
    await page.keyboard.type("pont");
    await attendreEnregistre(page);
    let enBase = await sceneEnBase(s16);
    // La ligne vide a été remplacée par la note ; « /no » n'est pas resté
    expect(enBase.texte.map((b) => b.type)).toEqual(["note"]);
    expect(enClair(enBase.texte)).toEqual(["Penser au *pont*"]);
    expect(enBase.texte_vide).toBe(true);
    await expect(page.locator(".tampon")).toHaveText("Texte vide");
    // Dans le chapitre aussi
    const [{ vide }] = await sql<{ vide: boolean }>("select texte_vide as vide from scenes where id = $1", [s16]);
    expect(vide).toBe(true);

    // Entrée sort de la note : un paragraphe de récit dessous
    await page.keyboard.press("Enter");
    await page.keyboard.type("Le récit commence.");
    await attendreEnBase(s16, "Le récit commence.");
    enBase = await sceneEnBase(s16);
    expect(enBase.texte.map((b) => b.type)).toEqual(["note", "p"]);
    expect(enBase.texte_vide).toBe(false);
    await expect(page.locator(".tampon")).toHaveText("En cours");

    // Par le bouton, sous le paragraphe du curseur ; une note vidée s'efface au retour arrière
    await page.getByRole("toolbar", { name: "Outils de la copie" }).getByRole("button", { name: "Note" }).click();
    await page.keyboard.type("x");
    expect((await blocsEditeur(page)).map((b) => b.type)).toEqual(["note", "p", "note"]);
    await page.keyboard.press("Backspace");
    await page.keyboard.press("Backspace");
    expect((await blocsEditeur(page)).map((b) => b.type)).toEqual(["note", "p"]);
    await attendreEnregistre(page);

    // Alice n'en voit rien : pour elle, la scène commence par le récit
    const alice = await posteDe(browser, s, "Alice");
    await aller(alice.page, sceneEleve(s16));
    await expect(copie(alice.page).locator("p")).toHaveText(["Le récit commence."]);
    await expect(copie(alice.page).locator(".note-prof")).toHaveCount(0);
    await alice.contexte.close();
  });

  test("F05-AC40 — la note se déplace par son repère de prise et par Alt et une flèche ; couper-coller la déplace, copier-coller la duplique ; vers l'extérieur, elle sort en texte simple", async ({ page, context }) => {
    test.setTimeout(120_000);
    const a = await auteur(page);
    const rappel = note("Rappel : la clé est sous la souche.");
    await semerBlocs(a.base, a.scenes[0], [recit("Un."), recit("Deux."), rappel]);
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await aller(page, sceneAdulte(a.projet, a.scenes[0]));
    const laNote = copie(page).locator(".note-prof");
    await expect(laNote.locator(".prise")).toHaveCount(1);
    // Par le repère : au-dessus du premier paragraphe
    const prise = (await laNote.locator(".prise").boundingBox())!;
    const cible = (await copie(page).locator("p").first().boundingBox())!;
    await page.mouse.move(prise.x + prise.width / 2, prise.y + prise.height / 2);
    await page.mouse.down();
    await page.mouse.move(prise.x + 4, cible.y + 2, { steps: 8 });
    await page.mouse.up();
    await attendreEnregistre(page);
    expect(await typesEnBase(a.scenes[0])).toEqual(["note", "p", "p"]);
    // Alt et flèche bas : d'un cran
    await selectionner(page, { bloc: 0, offset: 3 });
    await page.keyboard.press("Alt+ArrowDown");
    await attendreEnregistre(page);
    expect(await typesEnBase(a.scenes[0])).toEqual(["p", "note", "p"]);
    expect((await sceneEnBase(a.scenes[0])).texte[1]).toEqual(rappel);

    // Copier la note entière : texte simple au-dehors, une autre note au collage
    await selectionner(page, { bloc: 1, offset: 0 }, { bloc: 1, offset: 35 });
    await page.keyboard.press(`${MOD}+c`);
    expect(await presseTexte(page)).toBe("Rappel : la clé est sous la souche.");
    await aller(page, sceneAdulte(a.projet, a.scenes[1]));
    await copie(page).click();
    await page.keyboard.press(`${MOD}+v`);
    await attendreEnBase(a.scenes[1], "Rappel");
    const colle = (await sceneEnBase(a.scenes[1])).texte;
    expect(colle.map((b) => b.type)).toEqual(["note"]);
    expect(colle[0].id).not.toBe(rappel.id);
    expect((await sceneEnBase(a.scenes[1])).texte_vide).toBe(true);
  });
});
