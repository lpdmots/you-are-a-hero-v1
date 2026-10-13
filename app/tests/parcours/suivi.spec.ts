import { expect, test, type Page } from "@playwright/test";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  adultePret, aller, semerAttribution, semerClasse, semerPartie, semerProjet, semerTexte, sql, supprimerComptes, type Compte,
} from "./outils";

/**
 * Étape 4 du plan, lot 4 : le Suivi d'un projet (F06.5). Une vue « Scènes » pour agir, une
 * vue « Élèves » pour la répartition, l'aide à l'ouverture, le retour depuis la scène, la
 * scène suivante à valider, la carte du projet, et le Suivi d'un projet personnel.
 */

test.afterEach(async () => {
  await supprimerComptes();
});

const suivi = (projet: string, requete = "") => `/projet/${projet}/suivi${requete ? `?${requete}` : ""}`;
const filtres = (page: Page) => page.getByRole("group", { name: "Filtrer par état" });
const tampon = (page: Page, nom: string) => filtres(page).getByRole("button", { name: new RegExp(`^${nom} \\d+$`) });
const lignes = (page: Page) => page.locator(".table-scenes tbody tr");
const references = (page: Page): Promise<string[]> => page.locator(".table-scenes tbody td.code").allTextContents();
const fiche = (page: Page) => page.locator(".carnet-fiche--decision");
const etat = (scene: string, voulu: string) => sql("update scenes set etat = $2, tour = tour + 1 where id = $1", [scene, voulu]);

type Classe = {
  compte: Compte; base: SupabaseClient; projet: string; lisiere: { id: string; scenes: string[] }; sanctuaire: { id: string; scenes: string[] };
  eleves: Record<string, { id: string; inscriptionId: string }>;
};

/**
 * Mme Laurent, Alice, Bilal et Adam. « La lisière » (S001 à S004), à Alice et Bilal ; « Le
 * sanctuaire » (S005, S006), sans élève. Adam n'a pas de chapitre.
 * S001 Alice « À valider », S002 Bilal « À valider », S003 Bilal sans texte, S004 libre et sans consigne.
 */
async function classeSuivie(page: Page): Promise<Classe> {
  const { compte, base } = await adultePret(page);
  const classe = await semerClasse(base, "CM1-CM2", ["Alice", "Bilal", "Adam"]);
  const projet = await semerProjet(base, compte, "classe", "choix", "Les passeurs de brume", classe.id);
  const { chapitres } = await semerPartie(base, projet, "La forêt", [
    { titre: "La lisière", scenes: ["Le sentier", "Le pont", "La souche", "Le gué"] },
    { titre: "Le sanctuaire", scenes: ["L’autel", "La crypte"] },
  ]);
  const [lisiere, sanctuaire] = chapitres;
  await semerAttribution(base, lisiere.id, [{ eleve: classe.eleves.Alice.id }, { eleve: classe.eleves.Bilal.id }]);
  await base.from("scenes").update({ consigne: "Ce que la scène doit raconter." }).in("id", [...lisiere.scenes.slice(0, 3), ...sanctuaire.scenes]);
  await base.from("scenes").update({ prise_par_eleve: classe.eleves.Alice.id }).eq("id", lisiere.scenes[0]);
  await base.from("scenes").update({ prise_par_eleve: classe.eleves.Bilal.id }).in("id", lisiere.scenes.slice(1, 3));
  for (const scene of [lisiere.scenes[0], lisiere.scenes[1], sanctuaire.scenes[0]]) await semerTexte(base, scene, ["Un texte."]);
  await etat(lisiere.scenes[0], "valider");
  await etat(lisiere.scenes[1], "valider");
  return { compte, base, projet, lisiere, sanctuaire, eleves: classe.eleves };
}

test.describe("Aide à l'ouverture du Suivi (F06.5)", () => {
  test("F06-AC59 — à l'ouverture de l'onglet : « Que fait-on ici ? », trois questions repliées, « Ne plus afficher » et « Commencer » ; la case cochée, le Suivi s'ouvre directement et « Aide » rouvre l'écran", async ({ page }) => {
    const c = await classeSuivie(page);
    await c.base.from("enseignants").update({ aides_masquees: ["classes", "plan", "preparation"] }).eq("id", c.compte.id);
    await aller(page, `/projet/${c.projet}/plan`);
    await page.getByRole("navigation", { name: "Sections du projet" }).getByRole("link", { name: "Suivi" }).click();
    const aide = page.getByRole("region", { name: "Suivi" });
    await expect(aide.locator("details[open] > summary")).toHaveText(["Que fait-on ici ?"]);
    await expect(aide.locator("details:not([open]) > summary")).toHaveText(["Que veulent dire les états ?", "Qui s’occupe d’une scène ?", "Que sont les fiches de rédaction ?"]);
    await expect(lignes(page)).toHaveCount(0);
    // Les états se lisent dans l'aide : à qui est le tour
    await aide.getByText("Que veulent dire les états ?").click();
    await expect(aide).toContainText("Travail de l’élève terminé. À vous de finir la scène pour le livre.");
    await aide.getByRole("button", { name: "Commencer" }).click();
    await expect(lignes(page)).toHaveCount(6);
    // « Aide », discret, rouvre l'écran ; il se referme par « Fermer l'aide »
    await page.getByRole("button", { name: "Aide" }).click();
    await page.getByLabel("Ne plus afficher").check();
    await page.getByRole("button", { name: "Fermer l’aide" }).click();
    await expect(lignes(page)).toHaveCount(6);
    await expect.poll(async () => (await sql<{ a: string[] }>("select aides_masquees as a from enseignants where id = $1", [c.compte.id]))[0].a).toContain("suivi");
    // Dans un autre navigateur, donc sans le souvenir de cette visite : le Suivi s'ouvre directement
    await page.context().clearCookies({ name: "aide-suivi" });
    await aller(page, suivi(c.projet));
    await expect(lignes(page)).toHaveCount(6);
    await expect(page.getByRole("button", { name: "Aide" })).toBeVisible();
  });

  test("F06-AC58, AC60, AC35 — carte du projet : « 2 scènes à valider » et la part des scènes prêtes ; « Voir » ouvre le Suivi sur ces scènes, sans écran d'aide ; rouvert par son onglet, le Suivi montre son aide", async ({ page }) => {
    const c = await classeSuivie(page);
    await c.base.from("enseignants").update({ aides_masquees: ["classes", "plan", "preparation"] }).eq("id", c.compte.id);
    await etat(c.sanctuaire.scenes[0], "prete");
    // Un second projet, avec sa propre scène à valider : les deux ne se mélangent pas (AC35)
    const autre = await semerProjet(c.base, c.compte, "classe", "choix", "La cabane du bout du monde");
    const { chapitres } = await semerPartie(c.base, autre, "La cabane", [{ titre: "Le toit", scenes: ["La tuile"] }]);
    await etat(chapitres[0].scenes[0], "valide");
    await aller(page, "/projets");
    const carte = (titre: string) => page.getByRole("listitem").filter({ hasText: titre });
    await expect(carte("Les passeurs de brume")).toContainText("2 scènes à valider");
    // Une scène prête sur six : 17 %
    await expect(carte("Les passeurs de brume")).toContainText("17 % des scènes prêtes pour le livre");
    await expect(carte("La cabane du bout du monde")).not.toContainText("à valider");
    await carte("Les passeurs de brume").getByRole("link", { name: /^Voir/ }).click();
    await page.waitForURL(/\/suivi\?/);
    await expect(page.getByRole("region", { name: "Suivi" })).toHaveCount(0);
    expect(await references(page)).toEqual(["S001", "S002"]);
    await expect(tampon(page, "À valider")).toHaveAttribute("aria-pressed", "true");
    // Par son onglet, plus tard : l'aide s'affiche comme avant
    await aller(page, `/projet/${c.projet}/plan`);
    await page.getByRole("navigation", { name: "Sections du projet" }).getByRole("link", { name: "Suivi" }).click();
    await expect(page.getByRole("region", { name: "Suivi" }).getByRole("button", { name: "Commencer" })).toBeVisible();
  });
});

test.describe("Vue « Scènes » (F06.5)", () => {
  test("F06-AC55, AC34, AC56 — la liste par chapitre : « Texte vide » pour une scène sans texte, « sans consigne » après le titre, « Pas encore prise » et « Aucun élève » ; les tampons comptent, et l'aucun-résultat nomme les filtres", async ({ page }) => {
    const c = await classeSuivie(page);
    await etat(c.sanctuaire.scenes[0], "prete");
    await aller(page, suivi(c.projet));
    // Un seul rappel en tête, en lien et non en filtre ; aucun décompte des scènes sans consigne
    const rappel = page.locator(".suivi-rappel");
    await expect(rappel).toContainText("1 élève sans chapitre");
    await expect(page.getByText(/scènes? sans consigne/)).toHaveCount(0);
    await expect(filtres(page).getByRole("button")).toHaveText(["Toutes 6", "À valider 2", "À reprendre 0", "En cours 0", "Texte vide 3", "Validé 0", "Prête 1"]);
    // Celui qui ne compte aucune scène est éteint, et garde sa place
    await expect(tampon(page, "À reprendre")).toBeDisabled();
    await expect(lignes(page)).toHaveText([
      /S001.*Le sentier.*À valider.*Alice.*Relire/,
      /S002.*Le pont.*À valider.*Bilal.*Relire/,
      /S003.*La souche.*Texte vide.*Bilal.*Ouvrir/,
      /S004.*Le gué.*sans consigne.*Texte vide.*Pas encore prise.*Ouvrir/,
      /S005.*L’autel.*Prête.*Aucun élève.*Ouvrir/,
      /S006.*La crypte.*Texte vide.*Aucun élève.*Ouvrir/,
    ]);
    await expect(page.locator(".suivi-groupe > summary")).toHaveText([/La lisière.*4 scènes.*2 à valider/, /Le sanctuaire.*Chapitre non attribué.*2 scènes.*1 prête/]);
    await page.getByRole("combobox", { name: "Chapitre", exact: true }).selectOption({ label: "La lisière" });
    await expect(filtres(page).getByRole("button")).toHaveText(["Toutes 4", "À valider 2", "À reprendre 0", "En cours 0", "Texte vide 2", "Validé 0", "Prête 0"]);
    // Aucun résultat : les filtres en cause sont nommés
    await page.getByRole("combobox", { name: "Chapitre", exact: true }).selectOption({ label: "Le sanctuaire" });
    await tampon(page, "Prête").click();
    await page.getByRole("combobox", { name: "Chapitre", exact: true }).selectOption({ label: "La lisière" });
    await expect(page.locator(".suivi-aucun")).toContainText("Aucune scène pour : La lisière · Prête.");
    await expect(filtres(page)).toBeVisible();
    await page.locator(".suivi-aucun").getByRole("button", { name: "Tout afficher" }).click();
    await expect(lignes(page)).toHaveCount(6);
    // « Voir » ouvre la vue « Élèves », sans rien filtrer
    await rappel.getByRole("button", { name: "Voir" }).click();
    await expect(page.locator(".table-eleves tbody tr")).toHaveCount(3);
  });

  test("F06-AC36, AC93 — par élève : « Dont Alice s'occupe 1 », « Tout son chapitre 4 » ; « Moi », après les élèves, liste les scènes de l'enseignante, qui portent « Vous », sans les deux sélections", async ({ page }) => {
    const c = await classeSuivie(page);
    await c.base.from("scenes").update({ prise_par_enseignant: true }).in("id", [c.lisiere.scenes[3], c.sanctuaire.scenes[1]]);
    await aller(page, suivi(c.projet));
    await expect(page.getByRole("combobox", { name: "Élève", exact: true }).locator("option")).toHaveText(["Tous les élèves", "Adam", "Alice", "Bilal", "Moi"]);
    await page.getByRole("combobox", { name: "Élève", exact: true }).selectOption({ label: "Alice" });
    const selections = page.getByRole("group", { name: "Scènes d’Alice" });
    await expect(selections.getByRole("button")).toHaveText(["Dont Alice s’occupe 1", "Tout son chapitre 4"]);
    expect(await references(page)).toEqual(["S001"]);
    await selections.getByRole("button", { name: /^Tout son chapitre/ }).click();
    expect(await references(page)).toEqual(["S001", "S002", "S003", "S004"]);
    // Changer de sélection ne change ni attribution ni prise en charge
    expect((await sql("select 1 from scenes where prise_par_eleve = $1", [c.eleves.Alice.id]))).toHaveLength(1);
    await page.getByRole("combobox", { name: "Élève", exact: true }).selectOption({ label: "Moi" });
    expect(await references(page)).toEqual(["S004", "S006"]);
    await expect(lignes(page).first()).toContainText("Vous");
    await expect(page.getByRole("group", { name: /^Scènes d/ })).toHaveCount(0);
    // Sans chapitre : la sélection le dit, avec le lien vers l'attribution
    await page.getByRole("combobox", { name: "Élève", exact: true }).selectOption({ label: "Adam" });
    await expect(page.locator(".suivi-aucun")).toContainText("Adam n’a aucun chapitre. Le travail sur papier reste possible.");
    await expect(page.locator(".suivi-aucun").getByRole("link", { name: "Attribuer un chapitre" })).toBeVisible();
  });

  test("F06-AC54, AC63, AC37 — relire depuis le Suivi : la scène validée, « Suivante à valider : S002 » y mène ; la dernière validée, il n'en reste plus dans cette liste ; « Retour au Suivi » rend le filtre, les scènes validées en moins", async ({ page }) => {
    const c = await classeSuivie(page);
    await semerTexte(c.base, c.sanctuaire.scenes[1], ["Un texte."]);
    await c.base.from("scenes").update({ fin: true }).in("id", c.lisiere.scenes);
    await aller(page, suivi(c.projet));
    await page.getByRole("combobox", { name: "Chapitre", exact: true }).selectOption({ label: "La lisière" });
    await tampon(page, "À valider").click();
    expect(await references(page)).toEqual(["S001", "S002"]);
    await page.getByRole("link", { name: "Relire S001" }).click();
    await page.waitForURL(/\/scene\/.*de=suivi/);
    await fiche(page).getByRole("button", { name: "Valider le travail élève" }).click();
    await expect(page.locator("summary.tampon--menu")).toHaveText("Validé");
    await fiche(page).getByRole("link", { name: "Suivante à valider : S002" }).click();
    await expect(page.locator(".fiche__ref")).toHaveText("S002");
    await fiche(page).getByRole("button", { name: "Valider le travail élève" }).click();
    await expect(fiche(page)).toContainText("Plus de scène à valider dans cette liste.");
    await page.getByRole("link", { name: "Retour au Suivi" }).click();
    await page.waitForURL(/\/suivi/);
    // Le filtre est rendu, sans autre geste pour clôturer quoi que ce soit (AC37)
    await expect(tampon(page, "À valider")).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByRole("combobox", { name: "Chapitre", exact: true })).toHaveValue(c.lisiere.id);
    await expect(page.locator(".suivi-aucun")).toContainText("Aucune scène pour : La lisière · À valider.");
    await expect(tampon(page, "Validé")).toHaveText("Validé 2");
    // Les filtres repartent de « Toutes » à chaque nouvelle entrée dans le Suivi
    await page.getByRole("navigation", { name: "Sections du projet" }).getByRole("link", { name: "Parties et chapitres" }).click();
    await page.getByRole("navigation", { name: "Sections du projet" }).getByRole("link", { name: "Suivi" }).click();
    await expect(filtres(page).getByRole("button", { name: /^Toutes/ })).toHaveAttribute("aria-pressed", "true");
  });

  test("F06-AC54 — retour au Suivi : la liste retrouve l'endroit quitté", async ({ page }) => {
    const { compte, base } = await adultePret(page);
    const projet = await semerProjet(base, compte, "personnel", "classique", "Mon roman");
    const titres = Array.from({ length: 30 }, (_, i) => `Scène ${i + 1}`);
    await semerPartie(base, projet, "Le début", [{ titre: "Chapitre un", scenes: titres }]);
    await aller(page, suivi(projet));
    await page.getByRole("link", { name: "Ouvrir S028" }).scrollIntoViewIfNeeded();
    const quitte = await page.evaluate(() => window.scrollY);
    expect(quitte).toBeGreaterThan(200);
    await page.getByRole("link", { name: "Ouvrir S028" }).click();
    await page.waitForURL(/\/scene\//);
    await page.getByRole("link", { name: "Retour au Suivi" }).click();
    await page.waitForURL(/\/suivi/);
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(quitte - 60);
    await expect(page.getByRole("link", { name: "Ouvrir S028" })).toBeInViewport();
  });
});

test.describe("Vue « Élèves » (F06.5)", () => {
  test("F06-AC32, AC93 — bilan par élève : Adam, sans chapitre, se distingue d'Alice sans ouvrir de scène, avec « Attribuer un chapitre » ; aucune ligne au nom de l'enseignante ; un nombre ouvre les scènes de l'élève", async ({ page }) => {
    const c = await classeSuivie(page);
    await c.base.from("scenes").update({ prise_par_enseignant: true }).eq("id", c.sanctuaire.scenes[1]);
    await aller(page, suivi(c.projet, "vue=eleves"));
    const rangs = page.locator(".table-eleves tbody tr");
    await expect(rangs).toHaveText([
      /Adam.*Aucun chapitre.*Aucune.*Sans chapitre.*Attribuer un chapitre/,
      /Alice.*La lisière.*4 scènes.*1 scène.*1 à valider/,
      /Bilal.*La lisière.*4 scènes.*2 scènes.*1 à valider.*1 texte vide/,
    ]);
    // Ce bilan ne crée aucune attribution
    expect(await sql("select 1 from attributions where eleve_id = $1", [c.eleves.Adam.id])).toHaveLength(0);
    await rangs.nth(2).getByRole("button", { name: "2 scènes" }).click();
    expect(await references(page)).toEqual(["S002", "S003"]);
    await expect(page.getByRole("combobox", { name: "Élève", exact: true })).toHaveValue(c.eleves.Bilal.id);
  });
});

test.describe("Suivi d'un projet personnel (F06.5)", () => {
  test("F06-AC91, AC92 — l'auteur voit ses scènes par chapitre, les tampons « Toutes », « Texte vide », « En cours », « Prête » et le filtre Chapitre, sans rien de la classe ; « Texte vide » choisi, puis une scène ouverte, « Retour au Suivi » rend ce filtre", async ({ page }) => {
    const { compte, base } = await adultePret(page);
    const projet = await semerProjet(base, compte, "personnel", "classique", "Mon roman");
    const { chapitres } = await semerPartie(base, projet, "Le début", [
      { titre: "Chapitre un", scenes: ["La gare", "Le quai", "Le train"] },
      { titre: "Chapitre deux", scenes: ["La ville", "Le port"] },
    ]);
    const [un, deux] = chapitres;
    for (const scene of [un.scenes[0], un.scenes[1], deux.scenes[0]]) await semerTexte(base, scene, ["Un texte."]);
    await etat(un.scenes[0], "prete");
    await aller(page, `/projet/${projet}/plan`);
    await page.getByRole("navigation", { name: "Sections du projet" }).getByRole("link", { name: "Suivi" }).click();
    await expect(filtres(page).getByRole("button")).toHaveText(["Toutes 5", "Texte vide 2", "En cours 2", "Prête 1"]);
    await expect(page.locator(".suivi-groupe")).toHaveCount(2);
    await expect(page.getByRole("combobox", { name: "Chapitre", exact: true })).toBeVisible();
    await expect(page.getByRole("combobox", { name: "Élève", exact: true })).toHaveCount(0);
    await expect(page.getByRole("group", { name: "Vue du suivi" })).toHaveCount(0);
    await expect(page.locator(".suivi-colonnes")).not.toContainText("Qui s’en occupe");
    await expect(page.getByRole("button", { name: /fiches de rédaction/ })).toHaveCount(0);
    await expect(page.locator(".suivi-rappel")).toHaveCount(0);
    await tampon(page, "Texte vide").click();
    expect(await references(page)).toEqual(["S003", "S005"]);
    await page.getByRole("link", { name: "Ouvrir S003" }).click();
    await page.waitForURL(/\/scene\//);
    await page.getByRole("link", { name: "Retour au Suivi" }).click();
    await page.waitForURL(/\/suivi/);
    await expect(tampon(page, "Texte vide")).toHaveAttribute("aria-pressed", "true");
    expect(await references(page)).toEqual(["S003", "S005"]);
    // L'aide du Suivi personnel : ce qu'on fait ici et le sens des états, rien de la classe
    await page.getByRole("button", { name: "Aide" }).click();
    await expect(page.getByRole("region", { name: "Suivi" }).locator("summary")).toHaveText(["Que fait-on ici ?", "Que veulent dire les états ?"]);
  });
});
