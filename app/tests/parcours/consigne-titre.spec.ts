import { expect, test, type Page } from "@playwright/test";
import { adultePret, aller, MESSAGE, recit, semerAttribution, semerBlocs, semerClasse, semerPartie, semerProjet, sql, supprimerComptes } from "./outils";

/**
 * Étape 8, lot 3 : « ✦ Formuler » sous la consigne (F13.2) et le ✦ du titre de scène (F05),
 * dans la page de scène. Le fournisseur est simulé (IA_SIMULEE) : la consigne reprend
 * l'indication, puis « Décris : » et deux points ; les titres sont « Le pont de brume », « La
 * lanterne qui tremble » et « Rencontre sur le pont ».
 */

test.afterEach(async () => {
  await supprimerComptes();
});

const consigneEnBase = async (id: string) => (await sql<{ consigne: string }>("select consigne from public.scenes where id = $1", [id]))[0].consigne;
const titreEnBase = async (id: string) => (await sql<{ titre: string | null }>("select titre from public.scenes where id = $1", [id]))[0].titre;

async function lePont(page: Page, organisation: "classe" | "personnel" = "classe") {
  const { compte, base } = await adultePret(page);
  const classe = organisation === "classe" ? await semerClasse(base, "CM1-CM2", ["Alice"]) : null;
  const projet = await semerProjet(base, compte, organisation, "choix", "Les passeurs de brume", classe?.id ?? null);
  const { chapitres } = await semerPartie(base, projet, "La forêt", [{ titre: "La lisière", scenes: ["La grotte", "Le pont"] }]);
  const pont = chapitres[0].scenes[1];
  await semerBlocs(base, pont, [recit("Une silhouette avance sur le pont.")]);
  await aller(page, `/projet/${projet}/scene/${pont}`);
  return { compte, base, projet, pont };
}

const champConsigne = (page: Page) => page.getByRole("textbox", { name: "Consigne", exact: true });
const titre = (page: Page) => page.getByRole("textbox", { name: "Titre de la scène" });

test.describe("« ✦ Formuler » sous la consigne (F13.2)", () => {
  test("F13-AC06, F13-AC07 — l'indication devient une consigne proposée, retouchée sur place, puis utilisée ; « Annuler » rend l'indication", async ({ page }) => {
    const s = await lePont(page);
    await champConsigne(page).fill("le passeur apparaît sur le pont");
    await page.getByRole("button", { name: "Formuler" }).click();
    const proposee = page.getByRole("textbox", { name: "Consigne proposée" });
    await expect(proposee).toHaveValue("Le passeur apparaît sur le pont. Raconte ce qui se passe.\nDécris :\n– le lieu ;\n– ce que ressent ton héros.");
    // Une génération seule ne publie rien : la consigne reste l'indication (F13-AC07)
    await expect(champConsigne(page)).toHaveValue("le passeur apparaît sur le pont");
    expect(await consigneEnBase(s.pont)).toBe("le passeur apparaît sur le pont");

    await proposee.fill("Le passeur apparaît sur le pont. Raconte ce qu'il dit à Lou.\nDécris :\n– sa lanterne ;\n– sa voix.");
    await page.getByRole("button", { name: "Utiliser" }).click();
    await expect(proposee).toHaveCount(0);
    await expect(champConsigne(page)).toHaveValue("Le passeur apparaît sur le pont. Raconte ce qu'il dit à Lou.\nDécris :\n– sa lanterne ;\n– sa voix.");
    await expect(MESSAGE(page)).toContainText("Consigne remplacée.");
    await expect.poll(() => consigneEnBase(s.pont)).toContain("Décris :\n– sa lanterne ;");

    await MESSAGE(page).getByRole("button", { name: "Annuler" }).click();
    await expect(champConsigne(page)).toHaveValue("le passeur apparaît sur le pont");
    await expect.poll(() => consigneEnBase(s.pont)).toBe("le passeur apparaît sur le pont");
  });

  test("F13-AC07 — « Laisser » retire la proposition, la consigne ne change pas ; sans indication, rien ne part", async ({ page }) => {
    const s = await lePont(page);
    await page.getByRole("button", { name: "Formuler" }).click();
    await expect(MESSAGE(page)).toContainText("Écrivez d’abord en quelques mots ce que la scène doit raconter.");
    await expect(champConsigne(page)).toBeFocused();

    await champConsigne(page).fill("lou hésite");
    await page.getByRole("button", { name: "Formuler" }).click();
    await expect(page.getByRole("textbox", { name: "Consigne proposée" })).toBeVisible();
    await page.getByRole("button", { name: "Laisser" }).click();
    await expect(page.getByRole("textbox", { name: "Consigne proposée" })).toHaveCount(0);
    await expect(champConsigne(page)).toHaveValue("lou hésite");
    expect(await consigneEnBase(s.pont)).toBe("lou hésite");
  });

  test("en projet personnel, une note d'intention pour soi, sans « Décris : »", async ({ page }) => {
    await lePont(page, "personnel");
    await champConsigne(page).fill("la rencontre avec le passeur");
    await page.getByRole("button", { name: "Formuler" }).click();
    const note = page.getByRole("textbox", { name: "Consigne proposée" });
    await expect(note).toHaveValue("la rencontre avec le passeur ; à faire sentir : le lieu, l'émotion.");
  });
});

test.describe("Le ✦ du titre de scène (F05)", () => {
  test("F05-AC04 — les trois titres ensemble ; « Laisser », Échap ou un clic ailleurs ne changent rien ; un clic sur un titre l'utilise", async ({ page }) => {
    const s = await lePont(page);
    const signe = page.getByRole("button", { name: "Proposer des titres" });
    const liste = page.getByRole("group", { name: "Titres proposés" });
    const titres = liste.locator(".ia-titres__choix");
    await signe.click();
    await expect(titres).toHaveText(["Le pont de brume", "La lanterne qui tremble", "Rencontre sur le pont"]);
    await expect(titres.first()).toBeFocused();
    await liste.getByRole("button", { name: "Laisser" }).click();
    await expect(liste).toHaveCount(0);
    await signe.click();
    await expect(liste).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(liste).toHaveCount(0);
    await expect(signe).toBeFocused();
    await signe.click();
    await expect(liste).toBeVisible();
    await page.getByRole("textbox", { name: "Consigne", exact: true }).click();
    await expect(liste).toHaveCount(0);
    await expect(titre(page)).toHaveValue("Le pont");
    expect(await titreEnBase(s.pont)).toBe("Le pont");

    await signe.click();
    await expect(titres.first()).toBeFocused();
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("ArrowDown");
    await expect(titres.nth(2)).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(liste).toHaveCount(0);
    await expect(titre(page)).toHaveValue("Rencontre sur le pont");
    await expect.poll(() => titreEnBase(s.pont)).toBe("Rencontre sur le pont");
    await expect(MESSAGE(page)).toContainText("Titre changé.");
    await MESSAGE(page).getByRole("button", { name: "Annuler" }).click();
    await expect(titre(page)).toHaveValue("Le pont");
    await expect.poll(() => titreEnBase(s.pont)).toBe("Le pont");

    // « D'autres titres » redemande
    await signe.click();
    await liste.getByRole("button", { name: "D’autres titres" }).click();
    await expect.poll(async () => (await sql("select aide from public.appels_ia where enseignant_id = $1 and aide = 'titre'", [s.compte.id])).length).toBe(6);
    await expect(titres).toHaveCount(3);
  });

  test("la consigne prend la hauteur de son texte, sans défiler", async ({ page }) => {
    await lePont(page);
    const champ = champConsigne(page);
    await champ.fill(Array.from({ length: 12 }, (_, i) => `Ligne ${i + 1} de la consigne.`).join("\n"));
    await expect.poll(() => champ.evaluate((t) => t.scrollHeight - t.clientHeight)).toBeLessThanOrEqual(1);
  });

  test("aides éteintes : ni ✦ du titre, ni « Formuler »", async ({ page }) => {
    const s = await lePont(page);
    await s.base.from("enseignants").update({ reglages_ia: { degre: 2, proposer: false, niveaux: [], imagesParCreation: 1, qualite: "normale" } }).eq("id", s.compte.id);
    await page.reload();
    await expect(titre(page)).toBeVisible();
    await expect(page.getByRole("button", { name: /titre/ })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Formuler" })).toHaveCount(0);
    await expect(champConsigne(page)).toHaveAttribute("placeholder", "Ce que la scène doit raconter.");
  });
});

test.describe("« ✦ Écrire » une scène vide (F13.6)", () => {
  /** « La grotte », vide, avec sa consigne ; Alice s'en occupe si on le demande. */
  async function grotteVide(page: Page, avecAlice: boolean) {
    const { compte, base } = await adultePret(page);
    const classe = await semerClasse(base, "CM1-CM2", ["Alice"]);
    const projet = await semerProjet(base, compte, "classe", "choix", "Les passeurs de brume", classe.id);
    const { chapitres } = await semerPartie(base, projet, "La forêt", [{ titre: "La lisière", scenes: ["La grotte", "Le pont"] }]);
    const grotte = chapitres[0].scenes[0];
    await semerAttribution(base, chapitres[0].id, [{ eleve: classe.eleves.Alice.id }]);
    await base.from("scenes").update({ consigne: "Lou entre dans la grotte du dragon. Décris la grotte.", prise_par_eleve: avecAlice ? classe.eleves.Alice.id : null }).eq("id", grotte);
    await aller(page, `/projet/${projet}/scene/${grotte}`);
    return { compte, base, grotte, alice: classe.eleves.Alice.id };
  }
  const mots = async (id: string) => (await sql<{ t: string }>("select string_agg(c->>'text', ' ') as t from public.scenes, jsonb_array_elements(texte) b, jsonb_array_elements(b->'children') c where id = $1", [id]))[0].t?.trim() ?? "";

  test("F13-AC22 — « Écrire » à la place de « Corriger » : la proposition se retouche, puis « Mettre ce texte dans la scène » ; rien avant", async ({ page }) => {
    const s = await grotteVide(page, false);
    await expect(page.getByRole("button", { name: "Corriger", exact: true })).toHaveCount(0);
    await page.getByRole("button", { name: "Écrire", exact: true }).click();
    const champs = page.getByRole("textbox", { name: "Paragraphe proposé" });
    await expect(champs.first()).toBeVisible();
    expect(await mots(s.grotte)).toBe("");
    await champs.first().fill("Lou entre dans la grotte, la lanterne levée.");
    await page.getByRole("button", { name: "Mettre ce texte dans la scène" }).click();
    await expect(MESSAGE(page)).toContainText("Le texte est dans la scène.");
    await expect.poll(() => mots(s.grotte)).toContain("Lou entre dans la grotte, la lanterne levée.");
    await expect(page.getByRole("button", { name: "Corriger", exact: true })).toBeVisible();
  });

  test("F13-AC24 — la scène d'Alice : prévenu d'abord ; le texte gardé, « Vous » s'en occupe ; « Annuler » la rend vide, à Alice", async ({ page }) => {
    const s = await grotteVide(page, true);
    await page.getByRole("button", { name: "Écrire", exact: true }).click();
    const dialogue = page.getByRole("alertdialog", { name: "Alice s’occupe de cette scène" });
    await expect(dialogue).toContainText("Alice ne l’écrira plus.");
    await dialogue.getByRole("button", { name: "Écrire quand même" }).click();
    await page.getByRole("button", { name: "Mettre ce texte dans la scène" }).click();
    await expect(MESSAGE(page)).toContainText("Vous vous en occupez maintenant.");
    await expect.poll(async () => (await sql<{ e: string | null; m: boolean }>("select prise_par_eleve as e, prise_par_enseignant as m from public.scenes where id = $1", [s.grotte]))[0]).toEqual({ e: null, m: true });
    await MESSAGE(page).getByRole("button", { name: "Annuler" }).click();
    await expect(MESSAGE(page)).toContainText("La scène est de nouveau vide.");
    await expect.poll(async () => (await sql<{ e: string | null; m: boolean }>("select prise_par_eleve as e, prise_par_enseignant as m from public.scenes where id = $1", [s.grotte]))[0]).toEqual({ e: s.alice, m: false });
    expect(await mots(s.grotte)).toBe("");
  });

  test("F13-AC23 — sans consigne, rien ne part : le champ de la consigne s'ouvre", async ({ page }) => {
    const s = await grotteVide(page, false);
    await s.base.from("scenes").update({ consigne: "" }).eq("id", s.grotte);
    await page.reload();
    await page.getByRole("button", { name: "Écrire", exact: true }).click();
    await expect(MESSAGE(page)).toContainText("Écrivez d’abord la consigne de la scène");
    await expect(champConsigne(page)).toBeFocused();
  });
});
