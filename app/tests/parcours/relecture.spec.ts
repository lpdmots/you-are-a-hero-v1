import { expect, test, type Page } from "@playwright/test";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  adultePret, aller, ALERTE, copie, ecrire, MESSAGE, motsEnBase, pied, semerAttribution, semerClasse, semerPartie, semerProjet, semerTexte, sql, supprimerComptes,
  type Compte,
} from "./outils";

/**
 * Étape 4 du plan, lot 1 : l'état d'une scène et la relecture, côté enseignant (F07.1,
 * F07.3, F11.1). L'état se change sur son tampon ; la fiche de décision porte l'étape
 * suivante. Les remises des élèves se construisent au lot 2 : ici, une remise est posée
 * dans la base telle que la fonction de l'élève la posera.
 */

test.afterEach(async () => {
  await supprimerComptes();
});

const sceneAdulte = (projet: string, scene: string) => `/projet/${projet}/scene/${scene}`;
const tampon = (page: Page) => page.locator("summary.tampon--menu");
const etats = (page: Page) => page.getByRole("group", { name: "État de la scène" });
const fiche = (page: Page) => page.locator(".carnet-fiche--decision");
const onglet = (page: Page, nom: string | RegExp) => page.getByRole("tab", { name: nom });
/** Le texte montré en lecture : une remise, un texte gardé à part */
const lu = (page: Page) => page.locator(".copie__texte--lu");
const etatEnBase = async (scene: string): Promise<string> => (await sql<{ etat: string }>("select etat from scenes where id = $1", [scene]))[0].etat;

/** Choisir un état sur le tampon de l'en-tête. */
async function choisir(page: Page, etat: string): Promise<void> {
  await tampon(page).click();
  await etats(page).getByRole("button", { name: new RegExp(`^${etat}`) }).click();
}

/** « 13 octobre », « 1er octobre », à l'heure de Paris : ce que porte l'onglet d'une remise. */
const jourCourt = (date: Date): string =>
  new Intl.DateTimeFormat("fr-FR", { timeZone: "Europe/Paris", day: "numeric", month: "long" }).format(date).replace(/^1 /, "1er ");

type Classe = {
  compte: Compte; base: SupabaseClient; projet: string; chapitre: string; scenes: string[];
  eleves: Record<string, { id: string; inscriptionId: string }>;
};

/** Mme Laurent et « La lisière », où écrivent Alice et Bilal : S001 et S002 à Alice, S003 à Bilal, S004 sans élève. */
async function classeEtSesScenes(page: Page): Promise<Classe> {
  const { compte, base } = await adultePret(page);
  const classe = await semerClasse(base, "CM1-CM2", ["Alice", "Bilal"]);
  const projet = await semerProjet(base, compte, "classe", "choix", "Les passeurs de brume", classe.id);
  const { chapitres } = await semerPartie(base, projet, "La forêt", [{ titre: "La lisière", scenes: ["Le sentier", "Le pont", "La souche", "Le gué"] }]);
  const [lisiere] = chapitres;
  await semerAttribution(base, lisiere.id, [{ eleve: classe.eleves.Alice.id }, { eleve: classe.eleves.Bilal.id }]);
  await base.from("scenes").update({ prise_par_eleve: classe.eleves.Alice.id }).in("id", lisiere.scenes.slice(0, 2));
  await base.from("scenes").update({ prise_par_eleve: classe.eleves.Bilal.id }).eq("id", lisiere.scenes[2]);
  return { compte, base, projet, chapitre: lisiere.id, scenes: lisiere.scenes, eleves: classe.eleves };
}

/** Ce que fera « Remettre » au lot 2 : le texte est conservé, la scène passe « À valider », le soumetteur s'en occupe. */
async function remettre(scene: string, eleve: string, ilYA = "0 minutes"): Promise<void> {
  await sql(
    `with s as (
       update scenes set etat = 'valider', tour = tour + 1, prise_par_eleve = $2 where id = $1
       returning id, projet_id, enseignant_id, texte)
     insert into remises (scene_id, projet_id, enseignant_id, eleve_id, texte, remis_le)
     select id, projet_id, enseignant_id, $2, texte, now() - $3::interval from s`,
    [scene, eleve, ilYA],
  );
}

test.describe("État de la scène, sur son tampon (F07.1)", () => {
  test("F07-AC64 — le tampon ouvre « État de la scène » : les cinq états, chacun avec ce qu'il change ; « À valider » se choisit sans remise", async ({ page }) => {
    const c = await classeEtSesScenes(page);
    await semerTexte(c.base, c.scenes[0], ["Lou s’avance sur le sentier."]);
    await aller(page, sceneAdulte(c.projet, c.scenes[0]));
    await expect(tampon(page)).toHaveText("En cours");
    await expect(fiche(page)).toContainText("Votre relecture");
    await expect(fiche(page)).toContainText("Alice n’a pas encore remis ce texte.");
    await tampon(page).click();
    await expect(etats(page).getByRole("button")).toHaveText([
      /En cours.*Les élèves peuvent écrire\./,
      /À reprendre.*Les élèves reprennent, avec votre remarque\./,
      /À valider.*À vous de relire\. Les élèves ne peuvent plus écrire\./,
      /Validé.*L’élève a fini\. À vous de finir la scène\./,
      /Prête.*Elle entre dans le livre telle quelle\./,
    ]);
    await expect(etats(page).locator('[aria-current="true"]')).toHaveText(/En cours/);
    await etats(page).getByRole("button", { name: /^À valider/ }).click();
    await expect(tampon(page)).toHaveText("À valider");
    await expect(MESSAGE(page)).toHaveText("S001 est à valider. Les élèves ne peuvent plus y écrire.");
    await expect(fiche(page)).toContainText("Cette scène attend votre relecture.");
    expect(await etatEnBase(c.scenes[0])).toBe("valider");
    expect(await sql("select 1 from remises where scene_id = $1", [c.scenes[0]])).toHaveLength(0);
    // L'état tient : la page rouverte le montre
    await page.reload();
    await expect(tampon(page)).toHaveText("À valider");
  });

  test("F07-AC02, AC63 — valider puis déclarer prête : un double-clic sur « Valider » ne déclare pas prête ; le rappel dit les défauts avant « prête », sans l'empêcher", async ({ page }) => {
    const c = await classeEtSesScenes(page);
    await semerTexte(c.base, c.scenes[0], ["Lou s’avance sur le sentier."]);
    await remettre(c.scenes[0], c.eleves.Alice.id);
    await aller(page, sceneAdulte(c.projet, c.scenes[0]));
    await expect(fiche(page)).toContainText("Alice a remis ce texte le");
    await expect(fiche(page)).toContainText("Validé : l’élève a fini. Il vous restera à finir la scène pour le livre.");
    // « Prête pour le livre » prend la place de « Valider » : le second clic du double-clic est ignoré
    await fiche(page).getByRole("button", { name: "Valider le travail élève" }).dblclick();
    await expect(tampon(page)).toHaveText("Validé");
    await expect(MESSAGE(page)).toHaveText("S001 est validée. Pour changer d’état : le tampon, en haut.");
    await expect(fiche(page)).toContainText("Pour le livre");
    await expect(fiche(page)).toContainText("Validé : Alice a fini.");
    await page.waitForTimeout(900);
    expect(await etatEnBase(c.scenes[0])).toBe("valide");
    // Aucune reprise n'a été demandée avant de valider (AC02)
    expect(await sql("select 1 from remarques where scene_id = $1", [c.scenes[0]])).toHaveLength(0);

    await fiche(page).getByRole("button", { name: "Prête pour le livre" }).click();
    await expect(fiche(page).getByRole("alert")).toHaveText("Cette scène n’a ni choix ni fin. La déclarer prête quand même ?");
    expect(await etatEnBase(c.scenes[0])).toBe("valide");
    await fiche(page).getByRole("button", { name: "Pas maintenant" }).click();
    await expect(fiche(page).getByRole("button", { name: "Prête pour le livre" })).toBeVisible();
    await fiche(page).getByRole("button", { name: "Prête pour le livre" }).click();
    await fiche(page).getByRole("button", { name: "Déclarer prête" }).click();
    await expect(tampon(page)).toHaveText("Prête");
    await expect(fiche(page)).toContainText("Prête pour le livre.");
    await expect(fiche(page)).toContainText("Vos retouches gardent cet état.");
    expect(await etatEnBase(c.scenes[0])).toBe("prete");
  });

  test("F07-AC63, F11-AC93 — de « À valider » à « Prête » d'un geste, sur le tampon ; puis « Prête » se retire", async ({ page }) => {
    const c = await classeEtSesScenes(page);
    await semerTexte(c.base, c.scenes[0], ["Lou s’avance sur le sentier."]);
    await c.base.from("scenes").update({ fin: true }).eq("id", c.scenes[0]);
    await remettre(c.scenes[0], c.eleves.Alice.id);
    await aller(page, sceneAdulte(c.projet, c.scenes[0]));
    await choisir(page, "Prête");
    await expect(tampon(page)).toHaveText("Prête");
    await expect(MESSAGE(page)).toHaveText("S001 est prête pour le livre. Pour changer d’état : le tampon, en haut.");
    expect(await etatEnBase(c.scenes[0])).toBe("prete");
    await choisir(page, "Validé");
    await expect(tampon(page)).toHaveText("Validé");
    await expect(fiche(page).getByRole("button", { name: "Prête pour le livre" })).toBeVisible();
    expect(await etatEnBase(c.scenes[0])).toBe("valide");
  });

  test("F07-AC62, AC61 — annuler une validation, puis finir soi-même une scène à reprendre et la valider, sans nouvelle remise", async ({ page }) => {
    const c = await classeEtSesScenes(page);
    await semerTexte(c.base, c.scenes[0], ["Lou s’avance sur le sentier."]);
    await remettre(c.scenes[0], c.eleves.Alice.id);
    await sql("update scenes set etat = 'valide', tour = tour + 1 where id = $1", [c.scenes[0]]);
    await aller(page, sceneAdulte(c.projet, c.scenes[0]));
    await choisir(page, "À valider");
    await expect(tampon(page)).toHaveText("À valider");
    await expect(fiche(page).getByRole("button", { name: "Valider le travail élève" })).toBeVisible();
    // Demander une reprise, que l'élève ne fera pas : l'enseignante finit le texte et valide
    await fiche(page).getByRole("button", { name: "Demander une reprise…" }).click();
    await fiche(page).getByRole("button", { name: "Demander la reprise" }).click();
    await expect(tampon(page)).toHaveText("À reprendre");
    await ecrire(page, " Elle arrive au pont.");
    await expect(pied(page)).toHaveText("Enregistré", { timeout: 6_000 });
    await choisir(page, "Validé");
    await expect(tampon(page)).toHaveText("Validé");
    expect(await etatEnBase(c.scenes[0])).toBe("valide");
    expect(await motsEnBase(c.scenes[0])).toBe("Lou s’avance sur le sentier. Elle arrive au pont.");
    expect(await sql("select 1 from remises where scene_id = $1", [c.scenes[0]])).toHaveLength(1);
    await expect(page.getByLabel(/^Qui s’occupe de S001 : Alice s’en occupe/)).toBeVisible();
  });
});

test.describe("Remarque de reprise et remises (F07.3)", () => {
  test("F07-AC15 — demander une reprise : la remarque est proposée, facultative, sans rien sélectionner dans le texte ; elle se lit ensuite à côté du texte", async ({ page }) => {
    const c = await classeEtSesScenes(page);
    await semerTexte(c.base, c.scenes[2], ["Lou se glisse dans la souche."]);
    await remettre(c.scenes[2], c.eleves.Bilal.id);
    await aller(page, sceneAdulte(c.projet, c.scenes[2]));
    await fiche(page).getByRole("button", { name: "Demander une reprise…" }).click();
    await expect(fiche(page)).toContainText("facultative · lisible par les élèves du chapitre");
    // « Annuler » ne demande rien
    await fiche(page).getByRole("button", { name: "Annuler" }).click();
    await expect(tampon(page)).toHaveText("À valider");
    await fiche(page).getByRole("button", { name: "Demander une reprise…" }).click();
    await page.getByLabel(/^Remarque pour Bilal/).fill("Ajoute ce que Lou voit à la lueur de la lanterne.");
    await fiche(page).getByRole("button", { name: "Demander la reprise" }).click();
    await expect(tampon(page)).toHaveText("À reprendre");
    await expect(MESSAGE(page)).toHaveText("Reprise demandée : Bilal la retrouvera dans « Mon travail ». Les élèves du chapitre peuvent lire la remarque.");
    await expect(fiche(page)).toContainText("En attente d’une nouvelle remise de Bilal.");
    const remarque = page.getByRole("region", { name: /Votre remarque pour Bilal/ });
    await expect(remarque).toContainText("Ajoute ce que Lou voit à la lueur de la lanterne.");
    expect(await sql("select texte from remarques where scene_id = $1", [c.scenes[2]])).toEqual([{ texte: "Ajoute ce que Lou voit à la lueur de la lanterne." }]);
    // Sans remarque écrite : la demande se lit quand même
    await choisir(page, "À valider");
    await choisir(page, "À reprendre");
    await fiche(page).getByRole("button", { name: "Demander la reprise" }).click();
    await expect(page.getByRole("region", { name: /Votre remarque pour Bilal/ })).toContainText("Reprise demandée, sans remarque écrite.");
  });

  test("F07-AC08, AC05, AC25 — remises conservées : la dernière a son onglet, les précédentes s'ouvrent depuis « Remises », avec la remarque qui a suivi ; corriger le texte ne les change pas", async ({ page }) => {
    const c = await classeEtSesScenes(page);
    await semerTexte(c.base, c.scenes[2], ["Texte A de Bilal."]);
    await remettre(c.scenes[2], c.eleves.Bilal.id, "3 days");
    await sql(
      `insert into remarques (scene_id, projet_id, enseignant_id, remise_id, eleve_id, texte, cree_le)
       select r.scene_id, r.projet_id, r.enseignant_id, r.id, r.eleve_id, 'Développe la description.', now() - interval '2 days' from remises r where r.scene_id = $1`,
      [c.scenes[2]],
    );
    await semerTexte(c.base, c.scenes[2], ["Texte B de Bilal, développé."]);
    await remettre(c.scenes[2], c.eleves.Bilal.id);
    await aller(page, sceneAdulte(c.projet, c.scenes[2]));
    const aujourdHui = jourCourt(new Date());
    const avant = jourCourt(new Date(Date.now() - 3 * 24 * 3600 * 1000));
    await expect(page.getByRole("tab")).toHaveText(["Texte de la scène", `Remis le ${aujourdHui}`]);
    // L'enseignante corrige le texte de la scène : la remise reste telle quelle
    await ecrire(page, " Corrigé.");
    await expect(pied(page)).toHaveText("Enregistré", { timeout: 6_000 });
    await onglet(page, `Remis le ${aujourdHui}`).click();
    await expect(page.locator(".copie__lecture")).toContainText("Remis par Bilal");
    await expect(page.locator(".copie__lecture")).toContainText("conservé tel quel");
    await expect(lu(page)).toHaveText("Texte B de Bilal, développé.");
    // Dans l'onglet d'une remise, la fiche ne décide pas : elle ramène au texte de la scène
    await expect(fiche(page)).toContainText(`Vous lisez le texte remis le ${aujourdHui}. Pour décider de l’état, revenez au texte de la scène.`);
    await expect(fiche(page).getByRole("button", { name: "Valider le travail élève" })).toHaveCount(0);
    // « Remises » : les deux, la plus récente d'abord, la première avec sa remarque
    const remises = page.locator("details").filter({ hasText: "Remises" });
    await remises.locator("summary").click();
    await expect(remises.getByRole("listitem")).toHaveText([new RegExp(`Remis le ${aujourdHui}.*Bilal`), new RegExp(`Remis le ${avant}.*Bilal.*Développe la description\\.`)]);
    await remises.getByRole("button", { name: `Remis le ${avant}` }).click();
    await expect(lu(page)).toHaveText("Texte A de Bilal.");
    await expect(page.getByRole("tab")).toHaveText(["Texte de la scène", `Remis le ${avant}`, `Remis le ${aujourdHui}`]);
    await fiche(page).getByRole("button", { name: "Texte de la scène" }).click();
    await expect(copie(page)).toContainText("Texte B de Bilal, développé. Corrigé.");
  });
});

test.describe("Validation suspendue et état qui attend (F07.1, F08.1)", () => {
  test("F07-AC26 — validation fondée sur le texte examiné : la remise retirée et le texte modifié entre-temps, « Valider » ne valide pas, le dit et montre le texte à jour", async ({ page }) => {
    const c = await classeEtSesScenes(page);
    await semerTexte(c.base, c.scenes[0], ["Le texte que Mme Laurent relit."]);
    await remettre(c.scenes[0], c.eleves.Alice.id);
    await aller(page, sceneAdulte(c.projet, c.scenes[0]));
    await expect(copie(page)).toContainText("Le texte que Mme Laurent relit.");
    // Depuis une autre session : Alice retire sa remise et modifie le texte
    await sql("update scenes set etat = 'cours', tour = tour + 1 where id = $1", [c.scenes[0]]);
    await semerTexte(c.base, c.scenes[0], ["Le texte qu’Alice a modifié depuis."]);
    await fiche(page).getByRole("button", { name: "Valider le travail élève" }).click();
    await expect(ALERTE(page)).toContainText("Validation suspendue : la scène est maintenant « En cours » depuis votre lecture. Relisez le texte avant de choisir l’état.");
    await expect(copie(page)).toContainText("Le texte qu’Alice a modifié depuis.");
    await expect(tampon(page)).toHaveText("En cours");
    expect(await etatEnBase(c.scenes[0])).toBe("cours");
    // Le texte relu, la décision passe
    await choisir(page, "Validé");
    await expect(tampon(page)).toHaveText("Validé");
    await expect(ALERTE(page)).toHaveCount(0);
  });

  test("F07-AC65 — état en attente de l'enregistrement : tant que les corrections ne sont pas enregistrées, l'état ne change pas et l'enseignante en est informée", async ({ page }) => {
    const c = await classeEtSesScenes(page);
    await semerTexte(c.base, c.scenes[0], ["Lou s’avance."]);
    await remettre(c.scenes[0], c.eleves.Alice.id);
    await aller(page, sceneAdulte(c.projet, c.scenes[0]));
    await page.route("**/copie", (route) => route.abort());
    await ecrire(page, " Une correction.");
    await expect(ALERTE(page)).toContainText("Vos dernières corrections ne sont pas encore enregistrées.", { timeout: 8_000 });
    await expect(fiche(page)).toContainText("Vos corrections ne sont pas enregistrées. L’état se choisira ensuite.");
    await expect(fiche(page).getByRole("button", { name: "Valider le travail élève" })).toHaveCount(0);
    await choisir(page, "Validé");
    await expect(MESSAGE(page)).toHaveText("Vos corrections ne sont pas encore enregistrées : l’état changera ensuite.");
    await expect(tampon(page)).toHaveText("À valider");
    expect(await etatEnBase(c.scenes[0])).toBe("valider");
    // L'enregistrement rattrapé, l'état se choisit, et la correction est dans le texte validé
    await page.unroute("**/copie");
    await page.getByRole("button", { name: "Réessayer maintenant" }).click();
    await expect(pied(page)).toHaveText("Enregistré", { timeout: 8_000 });
    await fiche(page).getByRole("button", { name: "Valider le travail élève" }).click();
    await expect(tampon(page)).toHaveText("Validé");
    expect(await motsEnBase(c.scenes[0])).toBe("Lou s’avance. Une correction.");
  });

  test("F08-AC21 — corrections de l'enseignante refusées : elle peut écrire et choisir l'état, mais « Validé » lui demande d'abord de relire le texte, qui a changé", async ({ page }) => {
    const c = await classeEtSesScenes(page);
    await semerTexte(c.base, c.scenes[0], ["Le texte d’Alice."]);
    await aller(page, sceneAdulte(c.projet, c.scenes[0]));
    // Alice écrit pendant que Mme Laurent corrige
    await semerTexte(c.base, c.scenes[0], ["Le texte d’Alice, qu’elle a continué."]);
    await ecrire(page, " Une correction.");
    await expect(page.getByRole("status").filter({ hasText: "Vos corrections sont gardées à part" })).toBeVisible({ timeout: 8_000 });
    await expect(copie(page)).toContainText("Le texte d’Alice, qu’elle a continué.");
    await choisir(page, "Validé");
    await expect(ALERTE(page)).toContainText("Validation suspendue : le texte a changé pendant que vous le corrigiez. Relisez-le avant de choisir l’état.");
    expect(await etatEnBase(c.scenes[0])).toBe("cours");
    await choisir(page, "Validé");
    await expect(tampon(page)).toHaveText("Validé");
    expect(await etatEnBase(c.scenes[0])).toBe("valide");
  });
});

test.describe("Scènes sans élève et projet personnel (F11.1, F06.3)", () => {
  test("F11-AC94, AC14 — scène sans élève : « En cours », « Validé » et « Prête » sont proposés, sans « À valider » ni « À reprendre » ; « Validé » dit que la scène reste à finir", async ({ page }) => {
    const c = await classeEtSesScenes(page);
    await semerTexte(c.base, c.scenes[3], ["Une scène de liaison, écrite par l’enseignante."]);
    await aller(page, sceneAdulte(c.projet, c.scenes[3]));
    await expect(fiche(page)).toContainText("Pour le livre");
    await expect(fiche(page)).toContainText("Quand le texte, l’image et les choix vous conviennent :");
    await tampon(page).click();
    await expect(etats(page).getByRole("button")).toHaveText([/En cours.*Le texte n’est pas fini\./, /Validé.*Le texte est fini\. Reste à finir la scène\./, /Prête/]);
    await etats(page).getByRole("button", { name: /^Validé/ }).click();
    await expect(tampon(page)).toHaveText("Validé");
    await expect(fiche(page)).toContainText("Le texte est fini. Quand l’image et les choix vous conviennent aussi :");
    await expect(fiche(page).getByRole("button", { name: "Prête pour le livre" })).toBeVisible();
    expect(await sql("select 1 from remises where scene_id = $1", [c.scenes[3]])).toHaveLength(0);
  });

  test("F06-AC94 — scène remise que l'enseignante s'attribue : elle reste « À valider », porte « Vous vous en occupez », et le texte remis garde le prénom de l'élève", async ({ page }) => {
    const c = await classeEtSesScenes(page);
    await semerTexte(c.base, c.scenes[2], ["Le texte de Bilal."]);
    await remettre(c.scenes[2], c.eleves.Bilal.id);
    await aller(page, sceneAdulte(c.projet, c.scenes[2]));
    await page.getByLabel(/^Qui s’occupe de S003/).click();
    await page.getByRole("button", { name: "Moi", exact: true }).click();
    await expect(page.getByLabel(/^Qui s’occupe de S003 : Vous vous en occupez/)).toBeVisible();
    await expect(tampon(page)).toHaveText("À valider");
    expect(await etatEnBase(c.scenes[2])).toBe("valider");
    await onglet(page, /^Remis le/).click();
    await expect(page.locator(".copie__lecture")).toContainText("Remis par Bilal");
    // Elle garde « À valider », qu'elle porte, sans que « À reprendre » lui soit proposé
    await tampon(page).click();
    await expect(etats(page).getByRole("button")).toHaveText([/En cours/, /À valider/, /Validé/, /Prête/]);
  });

  test("F11-AC13, AC99, AC02 — projet personnel : « En cours » et « Prête » seulement ; l'auteur déclare sa scène prête sans soumission, et ses retouches gardent cet état", async ({ page }) => {
    const { compte, base } = await adultePret(page);
    const projet = await semerProjet(base, compte, "personnel", "classique", "Mon roman");
    const { chapitres } = await semerPartie(base, projet, "Le début", [{ titre: "Chapitre un", scenes: ["La gare"] }]);
    const scene = chapitres[0].scenes[0];
    await aller(page, sceneAdulte(projet, scene));
    await expect(tampon(page)).toHaveText("Texte vide");
    await expect(fiche(page)).toContainText("Pour le livre");
    await tampon(page).click();
    await expect(etats(page).getByRole("button")).toHaveText([/En cours.*Le texte est encore vide\./, /Prête.*Elle entre dans le livre telle quelle\./]);
    await page.keyboard.press("Escape");
    // Le rappel avant « prête » : le texte est vide
    await fiche(page).getByRole("button", { name: "Prête pour le livre" }).click();
    await expect(fiche(page).getByRole("alert")).toHaveText("Le texte est vide. La déclarer prête quand même ?");
    await fiche(page).getByRole("button", { name: "Pas maintenant" }).click();
    await ecrire(page, "Le train entre en gare.");
    await expect(pied(page)).toHaveText("Enregistré", { timeout: 6_000 });
    await expect(tampon(page)).toHaveText("En cours");
    await fiche(page).getByRole("button", { name: "Prête pour le livre" }).click();
    await expect(tampon(page)).toHaveText("Prête");
    expect(await etatEnBase(scene)).toBe("prete");
    // Une retouche garde l'état (F11-AC02)
    await ecrire(page, " Il siffle.");
    await expect(pied(page)).toHaveText("Enregistré", { timeout: 6_000 });
    await page.reload();
    await expect(tampon(page)).toHaveText("Prête");
  });
});

test.describe("L'état se lit partout du même nom (F06.5, F11.1)", () => {
  test("F06-AC55, F11-AC01 — dans le chapitre, chaque scène porte le tampon de son état : « Texte vide », « À reprendre », « Validé », « Prête »", async ({ page }) => {
    const c = await classeEtSesScenes(page);
    for (const s of c.scenes.slice(0, 3)) await semerTexte(c.base, s, ["Un texte."]);
    await sql("update scenes set etat = 'reprendre' where id = $1", [c.scenes[0]]);
    await sql("update scenes set etat = 'valide' where id = $1", [c.scenes[1]]);
    await sql("update scenes set etat = 'prete' where id = $1", [c.scenes[2]]);
    await aller(page, `/projet/${c.projet}/chapitre/${c.chapitre}`);
    await expect(page.locator(".fiches .fiche .tampon")).toHaveText(["À reprendre", "Validé", "Prête", "Texte vide"]);
    // La page de la scène porte le même nom que sa carte
    await page.locator(".fiches .fiche").nth(1).getByRole("link").first().click();
    await expect(tampon(page)).toHaveText("Validé");
  });
});
