import { expect, test, type Page } from "@playwright/test";
import { aller, classeQuiEcrit, posteDe, semerTexte, sql, supprimerComptes, type Situation } from "./outils";

/**
 * Étape 4 du plan, lot 6 : les encouragements de l'enseignant (F07.5). Sur la page d'une
 * scène, la fiche « Encouragements pour Bilal » ; côté élève, le tampon reçu, ses totaux et
 * le classement s'il est montré ; au Suivi, la colonne et le classement de la vue « Élèves ».
 */

test.afterEach(async () => {
  await supprimerComptes();
});

const fiche = (page: Page) => page.getByRole("region", { name: /^Encouragements/ });
const tampon = (page: Page, nom: "Effort" | "Fine plume" | "Créativité") => fiche(page).getByRole("button", { name: nom, exact: true });
const confier = async (s: Situation, scenes: string[], prenom: string | null, aMoi = false): Promise<void> => {
  const { error } = await s.base.from("scenes").update({ prise_par_eleve: prenom ? s.eleves[prenom].id : null, prise_par_enseignant: aMoi }).in("id", scenes);
  if (error) throw new Error(error.message);
};
const donnes = (scene: string) => sql<{ eleve_id: string; categorie: string }>("select eleve_id, categorie from encouragements where scene_id = $1 order by categorie", [scene]);
/** Ce que fait un clic sur un tampon, sans passer par l'écran. */
const donner = async (s: Situation, scene: string, categorie: string): Promise<void> => {
  const { error } = await s.base.rpc("encourager", { p_scene: scene, p_categorie: categorie, p_donner: true });
  if (error) throw new Error(error.message);
};
/** Des scènes de plus dans « La lisière », écrites, au nom d'un élève. */
async function scenesDe(s: Situation, prenom: string, titres: string[]): Promise<string[]> {
  const ids: string[] = [];
  for (const titre of titres) {
    const { data, error } = await s.base.rpc("creer_scene", { p_chapitre: s.lisiere.id });
    const ligne = (Array.isArray(data) ? data[0] : data) as { scene_id: string } | null;
    if (error || !ligne) throw new Error(error?.message);
    await s.base.from("scenes").update({ titre, prise_par_eleve: s.eleves[prenom].id }).eq("id", ligne.scene_id);
    await semerTexte(s.base, ligne.scene_id, ["Un texte."]);
    ids.push(ligne.scene_id);
  }
  return ids;
}
const colonne = (page: Page, categorie: string) => page.getByRole("region", { name: `Classement, ${categorie}` });

test.describe("Donner un encouragement, sur la page de la scène (F07.5)", () => {
  test("F07-AC76, AC77, AC50 — donner et retirer : « Effort » puis « Créativité » sont montrés donnés à Bilal ; un second clic sur « Effort » le retire ; la scène est toujours « En cours »", async ({ page }) => {
    const s = await classeQuiEcrit(page);
    const [sentier] = s.lisiere.scenes;
    await confier(s, [sentier], "Bilal");
    await semerTexte(s.base, sentier, ["Bilal a écrit une belle phrase."]);
    await aller(page, `/projet/${s.projet}/scene/${sentier}`);
    await expect(fiche(page).getByRole("heading")).toHaveText("Encouragements pour Bilal");
    await expect(fiche(page).getByRole("button")).toHaveText(["Effort", "Fine plume", "Créativité"]);
    await expect(tampon(page, "Effort")).toHaveAttribute("aria-pressed", "false");
    await tampon(page, "Effort").click();
    await expect(tampon(page, "Effort")).toHaveAttribute("aria-pressed", "true");
    await tampon(page, "Créativité").click();
    await expect(tampon(page, "Créativité")).toHaveAttribute("aria-pressed", "true");
    expect((await donnes(sentier)).map((d) => d.categorie)).toEqual(["creativite", "effort"]);
    // Montré donné : il ne se donne pas une seconde fois, un clic le retire (AC77)
    await tampon(page, "Effort").click();
    await expect(tampon(page, "Effort")).toHaveAttribute("aria-pressed", "false");
    expect((await donnes(sentier)).map((d) => d.categorie)).toEqual(["creativite"]);
    await expect(page.locator("summary.tampon--menu")).toContainText("En cours");
    // La page rouverte montre ce que la base a gardé
    await page.reload();
    await expect(tampon(page, "Créativité")).toHaveAttribute("aria-pressed", "true");
    await expect(tampon(page, "Effort")).toHaveAttribute("aria-pressed", "false");
  });

  test("F07-AC78 — l'encouragement reste à son élève : Alice a reçu « Effort », Bilal s'occupe ensuite de la scène ; la fiche montre « Effort, pour Alice », et « Effort » se donne à Bilal", async ({ page }) => {
    const s = await classeQuiEcrit(page);
    const [sentier] = s.lisiere.scenes;
    await confier(s, [sentier], "Alice");
    await semerTexte(s.base, sentier, ["Le sentier montait."]);
    await donner(s, sentier, "effort");
    await confier(s, [sentier], "Bilal");
    await aller(page, `/projet/${s.projet}/scene/${sentier}`);
    await expect(fiche(page).getByRole("heading")).toHaveText("Encouragements pour Bilal");
    await expect(fiche(page).getByRole("list", { name: "Encouragements déjà donnés sur cette scène" })).toHaveText("Effort, pour Alice");
    await expect(tampon(page, "Effort")).toHaveAttribute("aria-pressed", "false");
    await tampon(page, "Effort").click();
    await expect(tampon(page, "Effort")).toHaveAttribute("aria-pressed", "true");
    expect((await donnes(sentier)).map((d) => d.eleve_id).sort()).toEqual([s.eleves.Alice.id, s.eleves.Bilal.id].sort());
    await expect(fiche(page).getByRole("list", { name: "Encouragements déjà donnés sur cette scène" })).toHaveText("Effort, pour Alice");
  });

  test("F07-AC79 — personne à encourager : sans élève, à l'enseignante, ou sans texte, la fiche ne propose aucun tampon et dit pourquoi ; en projet personnel, elle n'existe pas", async ({ page }) => {
    const s = await classeQuiEcrit(page);
    const [sentier, pont] = s.lisiere.scenes;
    const [autel] = s.sanctuaire.scenes;
    await semerTexte(s.base, autel, ["Personne ne s'en occupe."]);
    await confier(s, [sentier], null, true);
    await semerTexte(s.base, sentier, ["L'enseignante écrit."]);
    await confier(s, [pont], "Bilal");
    await aller(page, `/projet/${s.projet}/scene/${autel}`);
    await expect(fiche(page)).toContainText("Aucun élève ne s’occupe de cette scène.");
    await expect(fiche(page).getByRole("button")).toHaveCount(0);
    await aller(page, `/projet/${s.projet}/scene/${sentier}`);
    await expect(fiche(page)).toContainText("Aucun élève ne s’occupe de cette scène : elle est à votre nom.");
    await expect(fiche(page).getByRole("button")).toHaveCount(0);
    await aller(page, `/projet/${s.projet}/scene/${pont}`);
    await expect(fiche(page).getByRole("heading")).toHaveText("Encouragements pour Bilal");
    await expect(fiche(page)).toContainText("Pas encore de texte à encourager.");
    await expect(fiche(page).getByRole("button")).toHaveCount(0);
  });
});

test.describe("Ce que voient les élèves (F07.5)", () => {
  test("F07-AC80, AC82 — rien tant qu'il n'y a rien : Bilal ouvre sa scène sans encouragement, rien n'en parle ; « Fine plume » donnée, il voit ce tampon, sans les deux autres ; Alice, du même chapitre, n'y voit aucun tampon", async ({ page, browser }) => {
    const s = await classeQuiEcrit(page);
    const [sentier] = s.lisiere.scenes;
    await confier(s, [sentier], "Bilal");
    await semerTexte(s.base, sentier, ["Bilal a écrit une belle phrase."]);
    const bilal = await posteDe(browser, s, "Bilal");
    await aller(bilal.page, `/travail/scene/${sentier}`);
    await expect(bilal.page.getByText(/encourage|Effort|Fine plume|Créativité/)).toHaveCount(0);
    await donner(s, sentier, "plume");
    await bilal.page.reload();
    const recu = bilal.page.getByRole("region", { name: "Mme Laurent t’encourage" });
    await expect(recu.getByRole("listitem")).toHaveText(["Fine plume"]);
    await expect(bilal.page.getByText(/Effort|Créativité/)).toHaveCount(0);
    // Alice lit la scène de Bilal : aucun tampon
    const alice = await posteDe(browser, s, "Alice");
    await aller(alice.page, `/travail/scene/${sentier}`);
    await expect(alice.page.getByText("Bilal a écrit une belle phrase.")).toBeVisible();
    await expect(alice.page.getByText(/encourage|Fine plume/)).toHaveCount(0);
    await expect(alice.page.locator(".encre")).toHaveCount(0);
  });

  test("F07-AC81 — totaux dans « Mon travail » : Bilal lit « Effort 2 » et « Fine plume 1 », sans « Créativité », et ses deux scènes portent leurs tampons ; Chloé, qui n'en a reçu aucun, ne lit rien sur les encouragements", async ({ page, browser }) => {
    const s = await classeQuiEcrit(page);
    const [sentier, pont] = s.lisiere.scenes;
    await confier(s, [sentier, pont], "Bilal");
    await semerTexte(s.base, sentier, ["Un texte."]);
    await semerTexte(s.base, pont, ["Un autre texte."]);
    await donner(s, sentier, "effort");
    await donner(s, sentier, "plume");
    await donner(s, pont, "effort");
    const bilal = await posteDe(browser, s, "Bilal");
    const section = bilal.page.getByRole("region", { name: "Tes encouragements" });
    await expect(section.getByRole("list", { name: "Tes totaux" }).getByRole("listitem")).toHaveText([/^Effort\s*2$/, /^Fine plume\s*1$/]);
    await expect(section).not.toContainText("Créativité");
    // Aucun classement tant que l'enseignante ne le montre pas (AC51)
    await expect(section).not.toContainText("dans la classe");
    await expect(bilal.page.getByRole("region", { name: /^Classement,/ })).toHaveCount(0);
    const lignes = bilal.page.getByRole("region", { name: "Les scènes dont tu t’occupes" }).getByRole("listitem");
    await expect(lignes.filter({ hasText: "Le sentier" }).getByRole("img", { name: "Encouragements : Effort, Fine plume" })).toBeVisible();
    await expect(lignes.filter({ hasText: "Le pont" }).getByRole("img", { name: "Encouragement : Effort" })).toBeVisible();
    const chloe = await posteDe(browser, s, "Chloé");
    await expect(chloe.page.getByRole("heading", { name: "Mon travail" })).toBeVisible();
    await expect(chloe.page.getByText(/encouragement/i)).toHaveCount(0);
    await expect(chloe.page.locator(".encre")).toHaveCount(0);
  });

  test("F07-AC51, AC86 — classement au choix : éteint, Chloé ne voit aucun total d'un camarade ; allumé, elle lit en « Effort » Lina, Alice et Bilal, Jade, puis son propre total, 1, sans « Voir la suite »", async ({ page, browser }) => {
    const s = await classeQuiEcrit(page, ["Alice", "Bilal", "Chloé", "Jade", "Lina"]);
    await s.base.rpc("attribuer_chapitre", { p_chapitre: s.lisiere.id, p_eleves: ["Alice", "Bilal", "Chloé", "Jade", "Lina"].map((p) => ({ eleve: s.eleves[p].id })) });
    const encourager = async (prenom: string, combien: number) => {
      for (const scene of await scenesDe(s, prenom, Array.from({ length: combien }, (_, i) => `Scène ${i + 1} de ${prenom}`))) await donner(s, scene, "effort");
    };
    await encourager("Lina", 4);
    await encourager("Bilal", 3);
    await encourager("Alice", 3);
    await encourager("Jade", 2);
    await encourager("Chloé", 1);
    const chloe = await posteDe(browser, s, "Chloé");
    const section = chloe.page.getByRole("region", { name: "Tes encouragements" });
    await expect(section.getByRole("list", { name: "Tes totaux" }).getByRole("listitem")).toHaveText([/^Effort\s*1$/]);
    await expect(section).not.toContainText("Lina");
    await expect(colonne(chloe.page, "Effort")).toHaveCount(0);
    // L'enseignante allume le classement, dans la vue « Élèves » du Suivi
    await aller(page, `/projet/${s.projet}/suivi?vue=eleves`);
    await page.getByText("Montrer le classement aux élèves").click();
    await expect(page.getByRole("switch", { name: "Montrer le classement aux élèves" })).toBeChecked();
    await expect.poll(async () => (await sql<{ m: boolean }>("select classement_montre as m from projets where id = $1", [s.projet]))[0].m).toBe(true);
    await chloe.page.reload();
    await expect(colonne(chloe.page, "Effort").getByRole("listitem")).toHaveText([/^Lina\s*4$/, /^Alice, Bilal\s*3$/, /^Jade\s*2$/]);
    // Son propre total est dans l'en-tête de la colonne, hors de la liste : rien n'y dit son rang
    await expect(colonne(chloe.page, "Effort").getByRole("heading")).toHaveText(/^Effort\s*toi\s*1$/);
    await expect(colonne(chloe.page, "Effort").getByRole("list")).not.toContainText("Chloé");
    await expect(chloe.page.getByRole("button", { name: "Voir la suite" })).toHaveCount(0);
    // Aucune autre catégorie, aucun total général
    await expect(chloe.page.getByRole("region", { name: /^Classement,/ })).toHaveCount(1);
    // Alice, sur une marche, lit son prénom parmi les trois premiers, sans ligne « Toi »
    const alice = await posteDe(browser, s, "Alice");
    await expect(colonne(alice.page, "Effort").locator(".classement__moi")).toHaveText("Alice");
    await expect(colonne(alice.page, "Effort").getByRole("heading")).toHaveText(/^Effort\s*toi\s*3$/);
  });
});

test.describe("Au Suivi, vue « Élèves » (F07.5)", () => {
  test("F07-AC83, AC84 — trois meilleurs totaux par catégorie : « Effort » montre Lina, puis Alice et Bilal ex æquo, puis Jade ; « Voir la suite » ajoute Chloé ; la ligne de Bilal porte ses trois totaux ; la vue « Scènes » ne montre aucun tampon", async ({ page }) => {
    const s = await classeQuiEcrit(page, ["Alice", "Bilal", "Chloé", "Jade", "Lina", "Noé"]);
    await s.base.rpc("attribuer_chapitre", { p_chapitre: s.lisiere.id, p_eleves: ["Alice", "Bilal", "Chloé", "Jade", "Lina", "Noé"].map((p) => ({ eleve: s.eleves[p].id })) });
    const encourager = async (prenom: string, combien: number, categorie = "effort") => {
      for (const scene of await scenesDe(s, prenom, Array.from({ length: combien }, (_, i) => `Scène ${i + 1} de ${prenom}`))) await donner(s, scene, categorie);
    };
    await encourager("Lina", 4);
    await encourager("Bilal", 3);
    await encourager("Alice", 3);
    await encourager("Jade", 2);
    await encourager("Chloé", 1);
    await encourager("Bilal", 1, "plume");
    await aller(page, `/projet/${s.projet}/suivi?vue=eleves`);
    const classement = page.getByRole("region", { name: "Classement des encouragements" });
    await expect(colonne(page, "Effort").getByRole("listitem")).toHaveText([/^Lina\s*4$/, /^Alice, Bilal\s*3$/, /^Jade\s*2$/]);
    await expect(colonne(page, "Fine plume").getByRole("listitem")).toHaveText([/^Bilal\s*1$/]);
    // Aucune colonne pour une catégorie sans tampon, aucun total toutes catégories
    await expect(page.getByRole("region", { name: /^Classement,/ })).toHaveCount(2);
    await expect(classement).not.toContainText("Chloé");
    await expect(classement.getByRole("switch", { name: "Montrer le classement aux élèves" })).not.toBeChecked();
    await classement.getByRole("button", { name: "Voir la suite" }).click();
    await expect(classement).toContainText("La suite, en gris, n’est montrée qu’à vous.");
    await expect(colonne(page, "Effort").getByRole("listitem")).toHaveText([/^Lina\s*4$/, /^Alice, Bilal\s*3$/, /^Jade\s*2$/, /^Chloé\s*1$/]);
    // Noé, sans tampon, n'y figure toujours pas
    await expect(classement).not.toContainText("Noé");
    // La colonne « Encouragements » (AC84)
    const ligne = (prenom: string) => page.locator(".table-eleves tbody tr").filter({ has: page.getByRole("rowheader", { name: prenom }) });
    await expect(ligne("Bilal").getByRole("img", { name: "Effort 3, Fine plume 1, Créativité 0" })).toBeVisible();
    await expect(ligne("Noé").locator('td[data-lib="Encouragements"]')).toBeEmpty();
    // La vue « Scènes » ne montre aucun tampon
    await page.getByRole("group", { name: "Vue du suivi" }).getByRole("button", { name: "Scènes" }).click();
    await expect(page.locator(".table-suivi").first()).toBeVisible();
    await expect(page.locator(".encre, .signe-encre")).toHaveCount(0);
  });

  test("F07.5 — pas d'encouragements en projet personnel : ni fiche sur la scène, ni classement au Suivi", async ({ page }) => {
    const s = await classeQuiEcrit(page);
    const { data } = await s.base.from("projets").insert({ enseignant_id: s.compte.id, titre: "Mon roman", organisation: "personnel", recit: "classique" }).select("id").single();
    const projet = (data as { id: string }).id;
    const partie = await s.base.rpc("creer_partie", { p_projet: projet, p_titre: "Le début", p_visuel: "foret", p_titre_chapitre: "Chapitre un", p_couleur: 1, p_visuel_chapitre: "mer" });
    const chapitre = ((Array.isArray(partie.data) ? partie.data[0] : partie.data) as { chapitre_id: string }).chapitre_id;
    const cree = await s.base.rpc("creer_scene", { p_chapitre: chapitre });
    const scene = ((Array.isArray(cree.data) ? cree.data[0] : cree.data) as { scene_id: string }).scene_id;
    await semerTexte(s.base, scene, ["Un texte."]);
    await aller(page, `/projet/${projet}/scene/${scene}`);
    await expect(page.getByRole("heading", { name: /S001/ }).or(page.locator("h1"))).toBeVisible();
    await expect(page.getByRole("region", { name: /^Encouragements/ })).toHaveCount(0);
    await aller(page, `/projet/${projet}/suivi`);
    await expect(page.getByText(/Encouragements|Classement/)).toHaveCount(0);
  });
});
