import { expect, test, type Page } from "@playwright/test";
import { aller, classeQuiEcrit, copie, MESSAGE, motsEnBase, posteDe, sql, supprimerComptes, type Situation } from "./outils";

/**
 * La dictée de l'adulte (F07.4) : le micro dans les champs qu'il remplit et dans la barre de la
 * copie, jamais côté élève. Le navigateur d'essai a un faux micro, qui accepte sans rien demander ;
 * le fournisseur est simulé (IA_SIMULEE) et entend toujours la même phrase.
 */

/** Ce que la dictée simulée entend (`TEXTE_SIMULE` de `serveur/dictee.ts`) */
const TEXTE_SIMULE = "Le dragon ouvre son grand livre et lit la première page.";

test.use({ launchOptions: { args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream"] }, permissions: ["microphone"] });

test.afterEach(async () => {
  await supprimerComptes();
});

const champConsigne = (page: Page) => page.getByRole("textbox", { name: "Consigne", exact: true });
const micro = (page: Page, champ = champConsigne(page)) => page.locator(".dictable", { has: champ }).getByRole("button");
const consigneEnBase = async (id: string) => (await sql<{ consigne: string }>("select consigne from public.scenes where id = $1", [id]))[0].consigne;
const dictees = async (s: Situation) => (await sql("select 1 from public.dictees where enseignant_id = $1", [s.compte.id])).length;

async function lePont(page: Page) {
  const s = await classeQuiEcrit(page, ["Alice", "Bilal"]);
  const pont = s.lisiere.scenes[1];
  await aller(page, `/projet/${s.projet}/scene/${pont}`);
  return { s, pont };
}

/** Enregistre un instant, puis arrête : le texte entendu part à la transcription. */
async function dicter(page: Page, bouton = micro(page)) {
  await bouton.click();
  await expect(bouton).toHaveAttribute("aria-pressed", "true");
  await expect(bouton).toContainText("0:01");
  await bouton.click();
  await expect(bouton).toHaveAttribute("aria-pressed", "false");
}

test.describe("Dicter dans un champ de l'adulte (F07.4)", () => {
  test("F07-AC88, F07-AC89 — le texte entendu s'écrit au curseur comme une frappe, s'enregistre, et ⌘Z le retire", async ({ page }) => {
    const { s, pont } = await lePont(page);
    await champConsigne(page).fill("Lou arrive au pont.");
    await dicter(page);
    await expect(champConsigne(page)).toHaveValue(`Lou arrive au pont. ${TEXTE_SIMULE}`);
    await expect.poll(() => consigneEnBase(pont)).toBe(`Lou arrive au pont. ${TEXTE_SIMULE}`);
    expect(await dictees(s)).toBe(1);

    await champConsigne(page).press("ControlOrMeta+z");
    await expect(champConsigne(page)).toHaveValue("Lou arrive au pont.");
  });

  test("F07-AC90 — Échap annule : rien ne s'écrit, rien ne part, rien ne compte", async ({ page }) => {
    const { s } = await lePont(page);
    await champConsigne(page).fill("Lou hésite.");
    await micro(page).click();
    await expect(micro(page)).toContainText("0:01");
    await page.keyboard.press("Escape");
    await expect(micro(page)).toHaveAttribute("aria-pressed", "false");
    await page.waitForTimeout(500);
    await expect(champConsigne(page)).toHaveValue("Lou hésite.");
    expect(await dictees(s)).toBe(0);
  });

  test("F07-AC92 — trois heures dictées ce mois-ci : le premier clic le dit, sans enregistrer", async ({ page }) => {
    const { s } = await lePont(page);
    await sql("insert into public.dictees (enseignant_id, secondes, fournisseur) select $1, 600, 'simule' from generate_series(1, 18)", [s.compte.id]);
    await micro(page).click();
    await expect(MESSAGE(page)).toContainText("Vous avez dicté trois heures ce mois-ci");
    await expect(micro(page)).toHaveAttribute("aria-pressed", "false");
    await expect(champConsigne(page)).toHaveValue("");
  });

  test("F07-AC99 — le micro refusé par le navigateur : une phrase le dit, rien ne s'écrit", async ({ page }) => {
    await page.addInitScript(() => {
      navigator.mediaDevices.getUserMedia = () => Promise.reject(new DOMException("refusé", "NotAllowedError"));
    });
    await lePont(page);
    await micro(page).click();
    await expect(MESSAGE(page)).toContainText("Le micro n'est pas autorisé pour ce site.");
    await expect(champConsigne(page)).toHaveValue("");
  });
});

test.describe("Dicter dans la copie de la scène (F07.4)", () => {
  test("F07-AC98, F07-AC97 — au curseur d'un paragraphe ; pendant une dictée, les autres micros attendent", async ({ page }) => {
    const { s, pont } = await lePont(page);
    const dicterLaCopie = page.getByRole("toolbar", { name: "Outils de la copie" }).getByRole("button", { name: "Dicter" });
    await copie(page).click();
    await page.keyboard.type("Une silhouette avance.");
    await page.waitForTimeout(150);

    await dicterLaCopie.click();
    await expect(dicterLaCopie).toHaveAttribute("aria-pressed", "true");
    // Une seule dictée à la fois : le micro de la consigne attend
    await expect(micro(page)).toBeDisabled();
    await expect(dicterLaCopie).toContainText("0:01");
    await dicterLaCopie.click();
    await expect(copie(page)).toContainText(`Une silhouette avance. ${TEXTE_SIMULE}`);
    await expect(micro(page)).toBeEnabled();
    await expect.poll(() => motsEnBase(pont)).toContain(`Une silhouette avance. ${TEXTE_SIMULE}`);
    expect(await dictees(s)).toBe(1);
  });
});

test("F07-AC87 — côté élève, aucun micro : ni dans la copie, ni ailleurs sur sa scène", async ({ page, browser }) => {
  const { s } = await lePont(page);
  await expect(micro(page)).toBeVisible();
  const alice = await posteDe(browser, s, "Alice");
  await aller(alice.page, `/travail/scene/${s.lisiere.scenes[0]}`);
  await expect(copie(alice.page)).toBeVisible();
  await expect(alice.page.locator("[data-dictee]")).toHaveCount(0);
  await alice.contexte.close();
});
