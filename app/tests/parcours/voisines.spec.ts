import { expect, test, type Page } from "@playwright/test";
import {
  adultePret, aller, attendreEnBase, autrePoste, choixAuto, classeQuiEcrit, copie, enClair, liaison, note, numerosEnBase, ouvrirLaClasse, posteDe, recit,
  sceneEnBase, selectionner, semerBlocs, semerPartie, semerProjet, supprimerComptes, taperCode,
} from "./outils";

/**
 * Étape 3 du plan, lot 6 : l'aperçu des scènes voisines pendant l'écriture (F04.3). La fin
 * de la scène d'où arrive le lecteur se lit avant le texte, le début de celle où il repart
 * après, sans quitter la page de la scène.
 */

test.afterEach(async () => {
  await supprimerComptes();
});

const sceneAdulte = (projet: string, scene: string) => `/projet/${projet}/scene/${scene}`;
const sceneEleve = (scene: string) => `/travail/scene/${scene}`;
const AVANT = (page: Page) => page.getByRole("complementary", { name: "Juste avant" });
const APRES = (page: Page) => page.getByRole("complementary", { name: "Juste après" });
const CASE = (page: Page) => page.getByRole("checkbox", { name: "Scènes voisines" });

/** Un auteur seul : « La lisière » (S001 Le sentier, S002 Le gué, S003 Clairière, S004 La souche) et « Le marais » (S005 Le ponton). */
async function auteur(page: Page, sorte: "choix" | "classique" = "choix") {
  const { compte, base } = await adultePret(page);
  const projet = await semerProjet(base, compte, "personnel", sorte, "Les passeurs de brume");
  const { chapitres } = await semerPartie(base, projet, "La forêt", [
    { titre: "La lisière", scenes: ["Le sentier", "Le gué", "Clairière", "La souche"] },
    { titre: "Le marais", scenes: ["Le ponton"] },
  ]);
  return { compte, base, projet, s: chapitres[0].scenes, ponton: chapitres[1].scenes[0] };
}

test.describe("Scènes voisines, pour l'adulte (F04.3)", () => {
  test("F04-AC06, AC13, AC14, AC10 — sans avoir touché à la case, l'auteur lit la fin de la scène d'avant, avec la phrase qui mène ici, avant son texte, et le début de la scène d'après ensuite ; rien de cela ne se modifie ni ne s'enregistre avec sa scène", async ({ page }) => {
    test.setTimeout(120_000);
    const a = await auteur(page);
    const [s14, s15, s18] = a.s;
    await semerBlocs(a.base, s14, [recit("Le sentier monte entre les fougères."), note("À revoir"), recit("Un chant s’élève."), choixAuto("Suivre le chant", s15)]);
    await semerBlocs(a.base, s15, [recit("Lou s’arrête pour écouter."), choixAuto("Continuer vers la lumière", s18)]);
    await semerBlocs(a.base, s18, [recit("La clairière s’ouvre."), recit("Un cerf attend.")]);
    await aller(page, sceneAdulte(a.projet, s15));
    await expect(CASE(page)).toBeChecked();
    const numeros = await numerosEnBase(a.projet);

    // Avant : ce que le lecteur lit juste avant d'arriver, phrase de choix comprise, telle que le livre l'affiche
    await expect(AVANT(page)).toContainText("S001 Le sentier");
    await expect(AVANT(page).locator(".tampon")).toHaveText("En cours");
    await expect(AVANT(page).locator(".voisine__extrait p")).toHaveText(["[…]", "Un chant s’élève.", `Suivre le chant : rends-toi au ${numeros[s15]}.`]);
    await expect(AVANT(page)).not.toContainText("À revoir");
    // Après : le premier paragraphe de la destination, avec le libellé du choix qui y conduit
    await expect(APRES(page)).toContainText("S003 Clairière");
    await expect(APRES(page)).toContainText("si le lecteur choisit « Continuer vers la lumière »");
    await expect(APRES(page).locator(".voisine__extrait p")).toHaveText(["La clairière s’ouvre.", "[…]"]);

    // Dans la continuité de la lecture : avant le texte, puis après ; hors de la zone où l'on écrit
    const ordre = await page.locator(".copie").evaluate((c) => [...c.querySelectorAll(".voisine--avant, .copie__texte, .voisine--apres")].map((n) => n.className.split(" ")[1] ?? n.className));
    expect(ordre[0]).toContain("voisine--avant");
    expect(ordre[ordre.length - 1]).toContain("voisine--apres");
    await expect(copie(page).locator(".voisine")).toHaveCount(0);
    await expect(page.locator(".voisine [contenteditable=true]")).toHaveCount(0);
    await AVANT(page).locator(".voisine__extrait").click();
    await page.keyboard.type("Zut");
    await selectionner(page, { bloc: 0, offset: 26 });
    await page.keyboard.type(" Puis il repart.");
    await attendreEnBase(s15, "Puis il repart.");
    // Le texte enregistré n'est que celui de la scène
    expect(enClair((await sceneEnBase(s15)).texte)).toEqual(["Lou s’arrête pour écouter. Puis il repart.", ""]);
    expect(enClair((await sceneEnBase(s14)).texte)[2]).toBe("Un chant s’élève.");

    // « Ouvrir » mène à la page de la scène voisine
    await APRES(page).getByRole("link", { name: "Ouvrir S003 Clairière" }).click();
    await page.waitForURL(new RegExp(`/scene/${s18}`));
    await expect(AVANT(page)).toContainText("S002 Le gué");
  });

  test("F04-AC07, AC11 — plusieurs scènes mènent ici : un seul extrait à la fois, des onglets pour voir les autres, la première scène rédigée d'abord ; une voisine sans texte n'a qu'une ligne, avec sa référence, son titre et « Texte vide »", async ({ page }) => {
    test.setTimeout(120_000);
    const a = await auteur(page);
    const [s14, s15, s18, s19] = a.s;
    await semerBlocs(a.base, s14, [choixAuto("Passer par le sentier", s18)]);
    await semerBlocs(a.base, s15, [recit("Le gué est froid."), choixAuto("Traverser le gué", s18)]);
    await semerBlocs(a.base, s18, [recit("La clairière s’ouvre."), choixAuto("Vers la souche", s19)]);
    await aller(page, sceneAdulte(a.projet, s18));
    const onglets = AVANT(page).getByRole("tab");
    await expect(onglets).toHaveText(["S001 Le sentier", "S002 Le gué"]);
    // S001 n'a pas de récit : c'est S002, la première rédigée, qui est montrée
    await expect(onglets.nth(1)).toHaveAttribute("aria-selected", "true");
    await expect(AVANT(page).locator(".voisine__extrait")).toHaveCount(1);
    await expect(AVANT(page).locator(".voisine__extrait")).toContainText("Le gué est froid.");
    await expect(AVANT(page).locator(".voisine__extrait")).toContainText("Traverser le gué : rends-toi au");
    await onglets.nth(0).click();
    await expect(onglets.nth(0)).toHaveAttribute("aria-selected", "true");
    // S001 ne porte qu'une phrase de choix : pas de récit à montrer
    await expect(AVANT(page).locator(".voisine__extrait")).toHaveCount(0);

    // Après : S004 sans texte
    await expect(APRES(page).locator(".voisine__extrait")).toHaveCount(0);
    await expect(APRES(page)).toContainText("S004 La souche");
    await expect(APRES(page).locator(".tampon")).toHaveText("Texte vide");
    await expect(APRES(page).getByRole("tab")).toHaveCount(0);
  });

  test("F04-AC12 — récit classique : la fin de la scène d'avant et le début de la scène d'après dans l'ordre du plan, d'un chapitre à l'autre, sans phrase de choix ; une scène seule dans son livre n'a pas la case", async ({ page }) => {
    test.setTimeout(120_000);
    const a = await auteur(page, "classique");
    const [, , , s4] = a.s;
    await semerBlocs(a.base, a.s[2], [recit("Le matin."), recit("Le départ.")]);
    await semerBlocs(a.base, s4, [recit("La route.")]);
    await semerBlocs(a.base, a.ponton, [recit("La halte."), recit("La nuit tombe.")]);
    await aller(page, sceneAdulte(a.projet, s4));
    await expect(AVANT(page).locator(".voisine__extrait p")).toHaveText(["[…]", "Le départ."]);
    await expect(AVANT(page)).toContainText("S003 Clairière");
    await expect(APRES(page).locator(".voisine__extrait p")).toHaveText(["La halte.", "[…]"]);
    await expect(APRES(page)).toContainText("S005 Le ponton");
    await expect(APRES(page)).not.toContainText("si le lecteur choisit");

    const seul = await semerProjet(a.base, a.compte, "personnel", "choix", "Une seule scène");
    const { chapitres } = await semerPartie(a.base, seul, "Début", [{ titre: "Chapitre", scenes: ["La scène"] }]);
    await aller(page, sceneAdulte(seul, chapitres[0].scenes[0]));
    await expect(copie(page)).toBeVisible();
    await expect(CASE(page)).toHaveCount(0);
    await expect(page.locator(".voisine")).toHaveCount(0);
  });
});

test.describe("Scènes voisines, pour les élèves (F04.3)", () => {
  test("F04-AC08 — Alice décoche « Scènes voisines » : le lendemain, sur un autre poste et dans une autre scène, les extraits ne s'affichent pas ; la préférence de Bilal et celle de l'enseignante n'ont pas changé", async ({ page, browser }) => {
    test.setTimeout(180_000);
    const s = await classeQuiEcrit(page);
    const [s15, s16] = s.lisiere.scenes;
    await semerBlocs(s.base, s15, [recit("Lou s’arrête."), choixAuto("Traverser le pont", s16)]);
    await semerBlocs(s.base, s16, [recit("Le pont grince."), choixAuto("Revenir", s15)]);
    const alice = await posteDe(browser, s, "Alice");
    await aller(alice.page, sceneEleve(s15));
    // Pour un élève, le lieu sans la référence
    await expect(APRES(alice.page)).toContainText("Le pont");
    await expect(APRES(alice.page)).not.toContainText("S002");
    await expect(APRES(alice.page).locator(".voisine__extrait")).toContainText("Le pont grince.");
    await CASE(alice.page).uncheck();
    await expect(alice.page.locator(".voisine")).toHaveCount(0);
    await expect(alice.page.locator(".copie__message")).toContainText("Les scènes voisines ne s’affichent plus, dans aucune de tes scènes.");
    await alice.contexte.close();

    // Un autre poste, une autre scène
    const autre = await autrePoste(browser);
    await ouvrirLaClasse(autre.page, s.classe.identifiant, s.classe.motDePasse);
    await taperCode(autre.page, "Alice", s.codes.Alice);
    await autre.page.waitForURL(/\/travail$/);
    await aller(autre.page, sceneEleve(s16));
    await expect(copie(autre.page)).toBeVisible();
    await expect(CASE(autre.page)).not.toBeChecked();
    await expect(autre.page.locator(".voisine")).toHaveCount(0);
    await autre.contexte.close();

    const bilal = await posteDe(browser, s, "Bilal");
    await aller(bilal.page, sceneEleve(s16));
    await expect(CASE(bilal.page)).toBeChecked();
    await expect(AVANT(bilal.page).locator(".voisine__extrait")).toContainText("Lou s’arrête.");
    await bilal.contexte.close();
    await aller(page, sceneAdulte(s.projet, s15));
    await expect(CASE(page)).toBeChecked();
    // L'enseignante règle la sienne : elle tient d'une visite à l'autre
    await CASE(page).uncheck();
    await expect(page.locator(".copie__message")).toContainText("Les scènes voisines ne s’affichent plus, dans aucune de vos scènes.");
    await aller(page, sceneAdulte(s.projet, s16));
    await expect(CASE(page)).not.toBeChecked();
    await expect(page.locator(".voisine")).toHaveCount(0);
  });

  test("F04-AC09, AC38 — Bilal ne reçoit aucun extrait d'une scène d'un chapitre qui n'est pas le sien : « Autre chapitre » et son titre, sans lien ; la lecture ouverte, il lit son début et l'ouvre sans pouvoir l'écrire", async ({ page, browser }) => {
    test.setTimeout(150_000);
    const s = await classeQuiEcrit(page);
    const [s17] = s.lisiere.scenes;
    const s21 = s.sanctuaire.scenes[0];
    await semerBlocs(s.base, s17, [recit("Lou hésite devant le porche."), choixAuto("Entrer au sanctuaire", s21)]);
    await semerBlocs(s.base, s21, [recit("Sous la voûte, une lueur.")]);
    const bilal = await posteDe(browser, s, "Bilal");
    await aller(bilal.page, sceneEleve(s17));
    await expect(APRES(bilal.page)).toContainText("Autre chapitre");
    await expect(APRES(bilal.page)).toContainText("Le sanctuaire");
    await expect(APRES(bilal.page).locator(".voisine__extrait")).toHaveCount(0);
    await expect(APRES(bilal.page).getByRole("link")).toHaveCount(0);
    expect(await bilal.page.content()).not.toMatch(/voûte|L’autel/);

    await s.base.from("projets").update({ lecture_ouverte: true }).eq("id", s.projet);
    await bilal.page.reload();
    await expect(APRES(bilal.page).locator(".voisine__extrait")).toContainText("Sous la voûte, une lueur.");
    await expect(APRES(bilal.page)).toContainText("L’autel");
    await APRES(bilal.page).getByRole("link", { name: /^Ouvrir/ }).click();
    await bilal.page.waitForURL(new RegExp(`/travail/scene/${s21}`));
    await expect(bilal.page.getByText("Sous la voûte, une lueur.")).toBeVisible();
    await expect(copie(bilal.page)).toHaveCount(0);

    // Le réglage refermé, il retrouve la ligne « Autre chapitre »
    await s.base.from("projets").update({ lecture_ouverte: false }).eq("id", s.projet);
    await aller(bilal.page, sceneEleve(s17));
    await expect(APRES(bilal.page)).toContainText("Autre chapitre");
    await expect(APRES(bilal.page).locator(".voisine__extrait")).toHaveCount(0);
    await bilal.contexte.close();
  });

  test("F04-AC37 — une liaison cachée vers un chapitre qui n'est pas le sien : rien ne la mentionne parmi les scènes voisines d'Alice, qui garde « Ton énigme doit conduire au numéro » ; l'enseignante lit le début de la destination, avec « lien caché »", async ({ page, browser }) => {
    test.setTimeout(150_000);
    const s = await classeQuiEcrit(page);
    const [s55] = s.lisiere.scenes;
    const s62 = s.sanctuaire.scenes[0];
    await semerBlocs(s.base, s55, [recit("Trois symboles sur la porte."), liaison(s62)]);
    await semerBlocs(s.base, s62, [recit("La salle des brumes.")]);
    const alice = await posteDe(browser, s, "Alice");
    await aller(alice.page, sceneEleve(s55));
    await expect(copie(alice.page)).toBeVisible();
    await expect(alice.page.locator(".voisine")).toHaveCount(0);
    await expect(CASE(alice.page)).toHaveCount(0);
    await expect(alice.page.locator(".hors-recit")).toContainText("Ton énigme doit conduire au numéro");
    expect(await alice.page.content()).not.toMatch(/salle des brumes|L’autel/);
    await alice.contexte.close();

    await aller(page, sceneAdulte(s.projet, s55));
    await expect(APRES(page)).toContainText("S003 L’autel");
    await expect(APRES(page)).toContainText("lien caché");
    await expect(APRES(page).locator(".voisine__extrait")).toContainText("La salle des brumes.");
    await expect(APRES(page)).not.toContainText("si le lecteur choisit");
    // De l'autre côté : l'extrait s'arrête au dernier paragraphe de récit, sans phrase de choix
    await aller(page, sceneAdulte(s.projet, s62));
    await expect(AVANT(page)).toContainText("lien caché");
    await expect(AVANT(page).locator(".voisine__extrait p")).toHaveText(["Trois symboles sur la porte."]);
  });
});
