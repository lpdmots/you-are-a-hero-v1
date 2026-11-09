import { expect, test, type Page } from "@playwright/test";
import { aller, classeQuiEcrit, ecrire, posteDe, sql, supprimerComptes, type Situation } from "./outils";

/**
 * La liste de vérification sous la consigne (F13.2, F07.2, F07.4) : Alice coche « J'ai pensé à »
 * en se relisant, ses coches restent avec la scène, la remise le lui rappelle s'il en manque ;
 * Mme Laurent voit ce qui est coché et l'imprime sur les fiches, une case par élément.
 */

test.afterEach(async () => {
  await supprimerComptes();
});

const LISTE = ["Décrire le sentier.", "Écrire ce que dit Lou."];
const tampon = (page: Page) => page.locator("header .tampon");
const jAiPense = (page: Page) => page.getByRole("group", { name: "J'ai pensé à :" });
const cochees = async (id: string) => (await sql<{ c: string[] }>("select verification_cochee as c from public.scenes where id = $1", [id]))[0].c;

/** « Le sentier » (S001), avec sa consigne et sa liste ; Alice s'en occupe et l'ouvre. */
async function leSentier(page: Page, browser: import("@playwright/test").Browser) {
  const s = await classeQuiEcrit(page, ["Alice", "Bilal"]);
  const sentier = s.lisiere.scenes[0];
  await s.base.from("scenes").update({ consigne: "Lou suit le sentier jusqu'à la lisière. Raconte ce qu'il entend.", verification: LISTE, prise_par_eleve: s.eleves.Alice.id }).eq("id", sentier);
  const alice = await posteDe(browser, s, "Alice");
  await aller(alice.page, `/travail/scene/${sentier}`);
  return { s, sentier, alice };
}

test.describe("« J'ai pensé à », chez l'élève (F07.2)", () => {
  test("F07-AC100 — Alice coche en se relisant ; ses coches restent avec la scène, d'une séance à l'autre", async ({ page, browser }) => {
    const { sentier, alice } = await leSentier(page, browser);
    const liste = jAiPense(alice.page);
    await expect(liste.getByRole("checkbox")).toHaveCount(2);
    await liste.getByRole("checkbox", { name: "Décrire le sentier." }).check();
    await expect.poll(() => cochees(sentier)).toEqual(["Décrire le sentier."]);
    await aller(alice.page, alice.page.url());
    await expect(jAiPense(alice.page).getByRole("checkbox", { name: "Décrire le sentier." })).toBeChecked();
    await expect(jAiPense(alice.page).getByRole("checkbox", { name: "Écrire ce que dit Lou." })).not.toBeChecked();
    await alice.contexte.close();
  });

  test("F07-AC103, F07-AC104 — un élément sans coche : « Remettre » le rappelle d'abord, sans bloquer ; l'adulte lit ce qui est coché sur la consigne repliée", async ({ page, browser }) => {
    const { s, sentier, alice } = await leSentier(page, browser);
    await ecrire(alice.page, "Lou suit le sentier. Il entend le vent.");
    await jAiPense(alice.page).getByRole("checkbox", { name: "Décrire le sentier." }).check();
    await alice.page.getByRole("button", { name: "Remettre à Mme Laurent" }).click();
    await expect(alice.page.getByRole("alert").filter({ hasText: "Il te reste 1 élément à vérifier dans « J'ai pensé à »." })).toBeVisible();
    await expect(tampon(alice.page)).not.toHaveText("À valider");
    // Alice remet quand même
    await alice.page.getByRole("button", { name: "Remettre quand même" }).click();
    await expect(tampon(alice.page)).toHaveText("À valider");
    // La scène ne s'écrit plus : les cases se lisent sans se cocher
    await expect(jAiPense(alice.page).getByRole("checkbox", { name: "Écrire ce que dit Lou." })).toBeDisabled();
    await alice.contexte.close();

    await aller(page, `/projet/${s.projet}/scene/${sentier}`);
    // La consigne se replie pendant la relecture : « 1 sur 2 coché » se lit sur son titre
    await expect(page.locator(".fiche-tete__coches")).toHaveText("1 sur 2 coché");
    await page.locator("summary", { hasText: "Consigne" }).click();
    await expect(page.locator(".verif__case.est-cochee")).toHaveCount(1);
    await expect(page.locator(".verif__case.est-cochee")).toHaveAttribute("title", "Coché par Alice");
  });

  test("F07-AC103 — tout coché, « Remettre » remet aussitôt", async ({ page, browser }) => {
    const { alice } = await leSentier(page, browser);
    await ecrire(alice.page, "Lou suit le sentier.");
    for (const c of await jAiPense(alice.page).getByRole("checkbox").all()) await c.check();
    await alice.page.getByRole("button", { name: "Remettre à Mme Laurent" }).click();
    await expect(tampon(alice.page)).toHaveText("À valider");
    await alice.contexte.close();
  });
});

test("F07-AC105 — les fiches de rédaction impriment la liste sous la consigne, une case par élément", async ({ page }) => {
  const s: Situation = await classeQuiEcrit(page, ["Alice", "Bilal"]);
  await s.base.from("scenes").update({ consigne: "Lou suit le sentier.", verification: LISTE }).eq("id", s.lisiere.scenes[0]);
  await aller(page, `/projet/${s.projet}/fiches`);
  const scene = page.locator(".fr-feuille:visible .fr-scene").filter({ hasText: "Lou suit le sentier." });
  await expect(scene.locator(".fr-lib").first()).toHaveText("J'ai pensé à");
  await expect(scene.locator(".fr-verif li")).toHaveText(LISTE);
  await expect(scene.locator(".fr-case")).toHaveCount(2);
});
