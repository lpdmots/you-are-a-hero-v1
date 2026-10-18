import { expect, test, type Page } from "@playwright/test";
import { adultePret, aller, recit, semerBlocs, semerClasse, semerPartie, semerProjet, sql, supprimerComptes } from "./outils";

/**
 * Étape 8, lot 4 : les idées de choix (F13.3), dans le panneau à droite du texte de la page de
 * scène. Le fournisseur est simulé (IA_SIMULEE) : dix idées « Idée 1 » à « Idée 10 », la
 * deuxième vers la première scène du chapitre (« La grotte »), les autres vers une « Nouvelle
 * scène n » ; une demande suivante continue la numérotation après les idées déjà montrées.
 */

test.afterEach(async () => {
  await supprimerComptes();
});

async function lePont(page: Page, options: { recit?: "choix" | "classique"; proposer?: boolean } = {}) {
  const { compte, base } = await adultePret(page);
  if (options.proposer === false) {
    await base.from("enseignants").update({ reglages_ia: { degre: 2, proposer: false, niveaux: [], imagesParCreation: 1, qualite: "normale" } }).eq("id", compte.id);
  }
  const classe = await semerClasse(base, "CM1-CM2", ["Alice"]);
  const projet = await semerProjet(base, compte, "classe", options.recit ?? "choix", "Les passeurs de brume", classe.id);
  const { chapitres } = await semerPartie(base, projet, "La forêt", [{ titre: "La lisière", scenes: ["La grotte", "Le pont"] }]);
  const [grotte, pont] = chapitres[0].scenes;
  await semerBlocs(base, pont, [recit("Une silhouette avance sur le pont.")]);
  // Les demandes d'idées que la page envoie : « D'autres idées » n'en ajoute pas tant qu'il en reste
  const demandes: { orientation?: string; dejaMontrees?: string[] }[] = [];
  page.on("request", (r) => {
    if (r.url().endsWith("/ia/idees-choix") && r.method() === "POST") demandes.push(r.postDataJSON());
  });
  await aller(page, `/projet/${projet}/scene/${pont}`);
  return { compte, base, projet, chapitre: chapitres[0].id, grotte, pont, demandes };
}

const panneau = (page: Page) => page.getByRole("region", { name: "Idées de choix" });
/** « ✦ Proposer des idées », dans le panneau ouvert pour la première fois */
const proposer = (page: Page) => panneau(page).getByRole("button", { name: "Proposer des idées" }).click();
const idee = (page: Page, n: number) => panneau(page).getByRole("listitem").nth(n);
const libelles = (page: Page) => panneau(page).getByRole("textbox", { name: "Ce que fait le lecteur" });
/** Les libellés montrés, dans l'ordre */
const valeurs = (page: Page) => libelles(page).evaluateAll((champs) => champs.map((c) => (c as HTMLInputElement).value));
const copieMessage = (page: Page) => page.locator(".copie__message");
const liensDe = (scene: string) => sql<{ cible_id: string; libelle: string }>("select cible_id, libelle from public.liens where scene_id = $1 order by rang", [scene]);
const scenesDe = (chapitre: string) =>
  sql<{ id: string; titre: string | null; consigne: string; texte: unknown[]; prise_par_eleve: string | null }>(
    "select id, titre, consigne, texte, prise_par_eleve from public.scenes where chapitre_id = $1 and supprime_le is null order by rang",
    [chapitre],
  );

test.describe("Idées de choix (F13.3)", () => {
  test("F13-AC08, F13-AC09 — trois idées d'abord, rien d'ajouté ; deux cochées, l'une vers une scène existante, l'autre vers une nouvelle : seuls ces deux choix et une scène", async ({ page }) => {
    const s = await lePont(page);
    await page.getByRole("button", { name: "Idées de choix" }).click();
    // La première ouverture ne demande rien : l'IA s'oriente d'abord, si l'on veut
    await expect(panneau(page).getByRole("textbox", { name: /Orienter l’IA/ })).toBeFocused();
    expect(s.demandes).toHaveLength(0);
    await proposer(page);
    await expect(libelles(page)).toHaveCount(3);
    await expect(libelles(page).nth(0)).toHaveValue("Idée 1");
    await expect(idee(page, 1)).toContainText("La grotte");
    // Montrées, pas appliquées : ni choix, ni lien, ni scène (F13-AC08)
    expect(await liensDe(s.pont)).toHaveLength(0);
    expect(await scenesDe(s.chapitre)).toHaveLength(2);

    const ajouter = panneau(page).getByRole("button", { name: /^Ajouter/ });
    await expect(ajouter).toBeDisabled();
    await idee(page, 0).getByRole("checkbox").check();
    await idee(page, 1).getByRole("checkbox").check();
    await expect(ajouter).toHaveText("Ajouter 2 choix et 1 scène");
    // Cocher seul n'ajoute rien (F13-AC10)
    expect(await liensDe(s.pont)).toHaveLength(0);
    await ajouter.click();

    await expect(copieMessage(page)).toContainText("2 choix ajoutés à la fin de la scène, et 1 scène créée dans le chapitre : « Nouvelle scène 1 ».");
    await expect(panneau(page)).toHaveCount(0);
    await expect.poll(async () => (await liensDe(s.pont)).length).toBe(2);
    const scenes = await scenesDe(s.chapitre);
    expect(scenes).toHaveLength(3);
    const nouvelle = scenes[2];
    // La nouvelle scène, à la fin du chapitre : son titre, l'intention pour consigne, ni texte ni élève
    expect(nouvelle).toMatchObject({ titre: "Nouvelle scène 1", consigne: "Le lecteur découvre un nouveau lieu.", prise_par_eleve: null });
    expect(nouvelle.texte).toEqual([]);
    const liens = await liensDe(s.pont);
    expect(liens.map((l) => [l.libelle, l.cible_id])).toEqual([["Idée 1", nouvelle.id], ["Idée 2", s.grotte]]);
    // Les choix à la fin de la scène, après le récit
    const texte = (await sql<{ texte: { type: string }[] }>("select texte from public.scenes where id = $1", [s.pont]))[0].texte;
    expect(texte.map((b) => b.type)).toEqual(["p", "choix", "choix"]);
    expect(s.demandes).toHaveLength(1);
  });

  test("F13-AC10 — le libellé et le titre retouchés sur place sont ceux qui s'ajoutent, sans nouvel appel", async ({ page }) => {
    const s = await lePont(page);
    await page.getByRole("button", { name: "Idées de choix" }).click();
    await proposer(page);
    await expect(libelles(page)).toHaveCount(3);
    await libelles(page).nth(2).fill("Suivre la chouette");
    // Une retouche coche l'idée
    await expect(idee(page, 2).getByRole("checkbox")).toBeChecked();
    await idee(page, 2).getByRole("textbox", { name: "Titre de la nouvelle scène" }).fill("Le nid de la chouette");
    await idee(page, 2).getByRole("textbox", { name: "Ce que ce choix fait vivre au lecteur" }).fill("Lou grimpe vers le nid et trouve une plume d'argent.");
    await panneau(page).getByRole("button", { name: "Ajouter 1 choix et 1 scène" }).click();
    await expect.poll(async () => (await liensDe(s.pont)).map((l) => l.libelle)).toEqual(["Suivre la chouette"]);
    const scenes = await scenesDe(s.chapitre);
    expect(scenes[2]).toMatchObject({ titre: "Le nid de la chouette", consigne: "Lou grimpe vers le nid et trouve une plume d'argent." });
    expect(s.demandes).toHaveLength(1);
  });

  test("une destination changée par le menu de « Nouveau choix » : une scène existante, ou une nouvelle scène qui ne se crée qu'à l'ajout", async ({ page }) => {
    const s = await lePont(page);
    await page.getByRole("button", { name: "Idées de choix" }).click();
    await proposer(page);
    await idee(page, 0).getByRole("button", { name: "Changer" }).click();
    // Le menu s'ouvre sur la destination actuelle : une nouvelle scène, son titre rempli
    await expect(idee(page, 0).getByRole("radio", { name: "Nouvelle scène" })).toBeChecked();
    await expect(idee(page, 0).getByRole("textbox", { name: "Titre de la nouvelle scène" })).toHaveValue("Nouvelle scène 1");
    await idee(page, 0).getByRole("radio", { name: "Scène existante" }).check();
    await idee(page, 0).getByRole("option", { name: /La grotte/ }).click();
    await expect(idee(page, 0)).toContainText("La grotte");
    await expect(idee(page, 0).getByRole("checkbox")).toBeChecked();
    await idee(page, 1).getByRole("button", { name: "Changer" }).click();
    await idee(page, 1).getByRole("radio", { name: "Nouvelle scène" }).check();
    await idee(page, 1).getByRole("textbox", { name: "Titre de la nouvelle scène" }).last().fill("Le passage secret");
    await idee(page, 1).getByRole("button", { name: "Mener à cette nouvelle scène" }).click();
    await expect(idee(page, 1).getByRole("textbox", { name: "Titre de la nouvelle scène" })).toHaveValue("Le passage secret");
    // Rien n'est créé avant l'ajout
    expect(await scenesDe(s.chapitre)).toHaveLength(2);
    await panneau(page).getByRole("button", { name: "Ajouter 2 choix et 1 scène" }).click();
    await expect.poll(async () => (await scenesDe(s.chapitre)).map((x) => x.titre)).toEqual(["La grotte", "Le pont", "Le passage secret"]);
    expect((await liensDe(s.pont)).map((l) => l.cible_id)[0]).toBe(s.grotte);
  });

  test("« D'autres idées » : les trois suivantes sans appel, les idées cochées gardées ; une nouvelle demande une fois les dix vues, qui les écarte ; l'orientation jette la réserve", async ({ page }) => {
    const s = await lePont(page);
    await page.getByRole("button", { name: "Idées de choix" }).click();
    await proposer(page);
    await idee(page, 0).getByRole("checkbox").check();
    const autres = panneau(page).getByRole("button", { name: "D’autres idées" });
    await autres.click();
    await expect.poll(() => valeurs(page)).toEqual(["Idée 1", "Idée 4", "Idée 5", "Idée 6"]);
    await autres.click();
    await autres.click();
    await expect.poll(() => valeurs(page)).toEqual(["Idée 1", "Idée 10"]);
    expect(s.demandes).toHaveLength(1);
    // Les dix vues : une nouvelle demande, qui dit ce qui a déjà été montré
    await autres.click();
    await expect.poll(() => valeurs(page)).toEqual(["Idée 1", "Idée 11", "Idée 12", "Idée 13"]);
    expect(s.demandes).toHaveLength(2);
    expect(s.demandes[1].dejaMontrees).toEqual(Array.from({ length: 10 }, (_, i) => `Idée ${i + 1}`));

    // Orienter l'IA : ce qui restait de la demande est jeté, la suivante part avec l'orientation
    await panneau(page).getByRole("button", { name: "Orienter l’IA" }).click();
    await panneau(page).getByRole("textbox", { name: /Orienter l’IA/ }).fill("une fausse piste");
    await panneau(page).getByRole("button", { name: "Nouvelles idées" }).click();
    await expect.poll(() => s.demandes.length).toBe(3);
    expect(s.demandes[2].orientation).toBe("une fausse piste");
    await expect(libelles(page).nth(1)).toHaveValue("Idée 14");
  });

  test("« Annuler » retire les choix et les scènes créées, et rend les idées, cochées ; refermer le panneau garde les idées, sans nouvel appel", async ({ page }) => {
    const s = await lePont(page);
    await page.getByRole("button", { name: "Idées de choix" }).click();
    await proposer(page);
    await idee(page, 0).getByRole("checkbox").check();
    await idee(page, 1).getByRole("checkbox").check();
    await panneau(page).getByRole("button", { name: "Ajouter 2 choix et 1 scène" }).click();
    await expect.poll(async () => (await liensDe(s.pont)).length).toBe(2);
    await copieMessage(page).getByRole("button", { name: "Annuler" }).click();
    await expect(copieMessage(page)).toContainText("Les choix et les scènes créées sont retirés.");
    await expect.poll(async () => (await liensDe(s.pont)).length).toBe(0);
    await expect.poll(async () => (await scenesDe(s.chapitre)).length).toBe(2);

    await page.getByRole("button", { name: "Idées de choix" }).click();
    await expect.poll(() => valeurs(page)).toEqual(["Idée 1", "Idée 2", "Idée 3"]);
    await expect(idee(page, 0).getByRole("checkbox")).toBeChecked();
    await panneau(page).getByRole("button", { name: "Fermer les idées de choix" }).click();
    await page.getByRole("button", { name: "Idées de choix" }).click();
    await expect(libelles(page)).toHaveCount(3);
    expect(s.demandes).toHaveLength(1);
  });

  test("aides éteintes, ou récit classique : pas d'« Idées de choix »", async ({ page }) => {
    await lePont(page, { proposer: false });
    await expect(page.getByRole("button", { name: "Choix", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Idées de choix" })).toHaveCount(0);
    await supprimerComptes();
    await lePont(page, { recit: "classique" });
    await expect(page.getByRole("button", { name: /Corriger/ })).toBeVisible();
    await expect(page.getByRole("button", { name: "Idées de choix" })).toHaveCount(0);
  });
});
