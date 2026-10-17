import { expect, test, type Page } from "@playwright/test";
import { adultePret, aller, MESSAGE, recit, semerBlocs, semerClasse, semerPartie, semerProjet, sql, supprimerComptes } from "./outils";

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
  test("F05-AC04 — « Laisser » ne change rien ; un nouveau clic montre le titre suivant, « Utiliser » le garde", async ({ page }) => {
    const s = await lePont(page);
    await page.getByRole("button", { name: "Proposer un titre" }).click();
    const propose = page.getByRole("group", { name: "Titre proposé" });
    await expect(propose).toContainText("Le pont de brume");
    await propose.getByRole("button", { name: "Laisser" }).click();
    await expect(propose).toHaveCount(0);
    await expect(titre(page)).toHaveValue("Le pont");
    expect(await titreEnBase(s.pont)).toBe("Le pont");

    await page.getByRole("button", { name: "Proposer un titre" }).click();
    await expect(propose).toContainText("La lanterne qui tremble");
    await page.getByRole("button", { name: "Proposer un autre titre" }).click();
    await expect(propose).toContainText("Rencontre sur le pont");
    await propose.getByRole("button", { name: "Utiliser" }).click();
    await expect(titre(page)).toHaveValue("Rencontre sur le pont");
    await expect.poll(() => titreEnBase(s.pont)).toBe("Rencontre sur le pont");
    // Les trois titres vus, un nouveau clic redemande
    await page.getByRole("button", { name: "Proposer un titre" }).click();
    await expect(propose).toContainText("Le pont de brume");
    expect(await sql("select aide from public.appels_ia where enseignant_id = $1 and aide = 'titre'", [s.compte.id])).toHaveLength(2);
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
