import { expect, test, type Page } from "@playwright/test";
import { adultePret, aller, MESSAGE, semerClasse, semerPartie, semerProjet, sql, supprimerComptes } from "./outils";

/**
 * Étape 8, lot 6 : parties, chapitres et résumés (F13.5). Le fournisseur est simulé
 * (IA_SIMULEE) : dix ensembles plausibles, « Le marais des lucioles » en tête, puis les
 * suivants pour une demande qui les a déjà vus ; six chapitres, « Le gué des saules » en tête.
 */

test.afterEach(async () => {
  await supprimerComptes();
});

async function passeurs(page: Page, options: { proposer?: boolean } = {}) {
  const { compte, base } = await adultePret(page);
  if (options.proposer === false) {
    await base.from("enseignants").update({ reglages_ia: { degre: 2, proposer: false, niveaux: [], imagesParCreation: 1, qualite: "normale" } }).eq("id", compte.id);
  }
  const classe = await semerClasse(base, "CM1-CM2", ["Alice"]);
  const projet = await semerProjet(base, compte, "classe", "choix", "Les passeurs de brume", classe.id);
  const foret = await semerPartie(base, projet, "La forêt", [{ titre: "La lisière", scenes: ["L’entrée du bois"] }]);
  const demandes: { sorte: string; orientation?: string; dejaMontres?: string[] }[] = [];
  page.on("request", (r) => {
    if (r.url().endsWith("/ia/plan") && r.method() === "POST") demandes.push(r.postDataJSON());
  });
  return { compte, base, projet, foret, demandes };
}

const panneau = (page: Page) => page.getByRole("complementary").filter({ has: page.getByRole("heading", { name: "Idées de parties" }) });
const titresParties = (page: Page) => panneau(page).getByRole("textbox", { name: "Titre de la partie" });
const partiesDe = (projet: string) =>
  sql<{ id: string; titre: string; supprime_le: string | null }>("select id, titre, supprime_le from public.parties where projet_id = $1 order by rang, cree_le", [projet]);
const chapitresDe = (partie: string) =>
  sql<{ id: string; titre: string; resume: string }>("select id, titre, resume from public.chapitres where partie_id = $1 and supprime_le is null order by rang", [partie]);

test.describe("Idées de parties (F13.5)", () => {
  test("F13-AC15, F13-AC16 — trois ensembles d'abord, rien de créé ; deux cochés, l'un retouché : seules ces deux parties, avec leur chapitre et son résumé, à la fin du plan, retrouvées dans Grandes étapes", async ({ page }) => {
    const s = await passeurs(page);
    await aller(page, `/projet/${s.projet}/plan`);
    await page.getByRole("button", { name: "Demander des idées de parties à l’IA" }).click();
    // La première ouverture ne demande rien : l'IA s'oriente d'abord, si l'on veut
    await expect(panneau(page).getByRole("textbox", { name: /Orienter l’IA/ })).toBeFocused();
    expect(s.demandes).toHaveLength(0);
    await panneau(page).getByRole("textbox", { name: /Orienter l’IA/ }).fill("un passage près de l’eau");
    await panneau(page).getByRole("button", { name: "Proposer des parties" }).click();
    await expect(titresParties(page)).toHaveCount(3);
    await expect(titresParties(page).first()).toHaveValue("Le marais des lucioles");
    await expect(panneau(page).getByRole("textbox", { name: "Titre du premier chapitre" }).first()).toHaveValue("La barque sans rames");
    await expect(panneau(page).getByRole("textbox", { name: "Résumé du premier chapitre" }).first()).toHaveValue(/lucioles/);
    expect(s.demandes).toEqual([expect.objectContaining({ sorte: "parties", orientation: "un passage près de l’eau", dejaMontres: [] })]);
    // Montrées, pas créées (F13-AC15)
    expect((await partiesDe(s.projet)).map((p) => p.titre)).toEqual(["La forêt"]);
    // L'orientation est celle de « Grandes étapes », gardée avec le projet
    await expect.poll(async () => (await sql<{ o: Record<string, string> }>("select orientations o from preparations where projet_id = $1", [s.projet]))[0].o.etapes).toBe("un passage près de l’eau");

    // Deux cochés, dont un retouché (la retouche coche)
    await panneau(page).getByRole("checkbox", { name: "Garder la partie « Le marais des lucioles »" }).check();
    await panneau(page).getByRole("textbox", { name: "Titre du premier chapitre" }).nth(2).fill("Les cloches d’en bas");
    const ajouter = panneau(page).getByRole("button", { name: "Ajouter 2 parties" });
    await expect(ajouter).toBeEnabled();
    await ajouter.click();
    await expect(MESSAGE(page)).toContainText("2 parties ajoutées à la fin du plan : « Le marais des lucioles » et « Le village englouti ».");
    await expect(panneau(page)).toHaveCount(0);

    const parties = await partiesDe(s.projet);
    expect(parties.map((p) => p.titre)).toEqual(["La forêt", "Le marais des lucioles", "Le village englouti"]);
    expect(await chapitresDe(parties[1].id)).toEqual([expect.objectContaining({ titre: "La barque sans rames", resume: expect.stringContaining("lucioles") })]);
    expect(await chapitresDe(parties[2].id)).toEqual([expect.objectContaining({ titre: "Les cloches d’en bas", resume: expect.stringContaining("cloches") })]);
    // Ni scène ni élève
    expect(await sql("select 1 from public.scenes where chapitre_id = any($1::uuid[])", [[...(await chapitresDe(parties[1].id)), ...(await chapitresDe(parties[2].id))].map((c) => c.id)])).toHaveLength(0);
    expect(await sql("select 1 from public.attributions a join public.chapitres c on c.id = a.chapitre_id where c.partie_id = any($1::uuid[])", [[parties[1].id, parties[2].id]])).toHaveLength(0);
    await expect(page.getByRole("heading", { name: "Le village englouti" })).toBeVisible();

    // Les deux vues montrent le même plan (F02-AC08)
    await aller(page, `/projet/${s.projet}/preparation?etape=etapes`);
    await expect(page.getByRole("link", { name: /Le marais des lucioles/ })).toBeVisible();
    await expect(page.getByRole("link", { name: /Le village englouti/ })).toBeVisible();
  });

  test("« Annuler » met les parties ajoutées à la corbeille et remet les ensembles, cochés", async ({ page }) => {
    const s = await passeurs(page);
    await aller(page, `/projet/${s.projet}/plan`);
    await page.getByRole("button", { name: "Demander des idées de parties à l’IA" }).click();
    await panneau(page).getByRole("button", { name: "Proposer des parties" }).click();
    await panneau(page).getByRole("checkbox", { name: "Garder la partie « La tour du guetteur »" }).check();
    await panneau(page).getByRole("button", { name: "Ajouter 1 partie" }).click();
    await MESSAGE(page).getByRole("button", { name: "Annuler" }).click();
    await expect.poll(async () => (await partiesDe(s.projet)).filter((p) => !p.supprime_le).map((p) => p.titre)).toEqual(["La forêt"]);
    await page.getByRole("button", { name: "Demander des idées de parties à l’IA" }).click();
    await expect(panneau(page).getByRole("checkbox", { name: "Garder la partie « La tour du guetteur »" })).toBeChecked();
    expect(s.demandes).toHaveLength(1);
  });

  test("dix ensembles en une demande, trois par trois : « D'autres idées » montre les suivants sans appel, puis redemande ; une nouvelle orientation jette la réserve", async ({ page }) => {
    const s = await passeurs(page);
    await aller(page, `/projet/${s.projet}/preparation?etape=etapes`);
    await page.getByRole("button", { name: "Demander des idées de parties à l’IA" }).click();
    await panneau(page).getByRole("button", { name: "Proposer des parties" }).click();
    await expect(titresParties(page)).toHaveCount(3);
    await panneau(page).getByRole("button", { name: "D’autres idées" }).click();
    await expect(titresParties(page).first()).toHaveValue("La forêt qui chuchote");
    await panneau(page).getByRole("button", { name: "D’autres idées" }).click();
    await panneau(page).getByRole("button", { name: "D’autres idées" }).click();
    // La dernière page d'une demande peut en montrer moins de trois
    await expect(titresParties(page)).toHaveCount(1);
    expect(s.demandes).toHaveLength(1);
    // La réserve est vide : « D'autres idées » redemande, en écartant ce qui a été montré
    await panneau(page).getByRole("button", { name: "D’autres idées" }).click();
    await expect(titresParties(page).first()).toHaveValue("L'île aux oiseaux");
    expect(s.demandes).toHaveLength(2);
    expect(s.demandes[1].dejaMontres).toHaveLength(10);

    // Une orientation nouvelle : la demande suivante part du nouveau contexte
    await panneau(page).getByRole("button", { name: "Orienter l’IA" }).click();
    await panneau(page).getByRole("textbox", { name: /Orienter l’IA/ }).fill("rien sous la terre");
    await panneau(page).getByRole("button", { name: "Nouvelles idées" }).click();
    await expect.poll(() => s.demandes.length).toBe(3);
    expect(s.demandes[2].orientation).toBe("rien sous la terre");
    // L'orientation est aussi celle des questions et des idées de l'étape
    await page.keyboard.press("Escape");
    await expect(page.getByRole("textbox", { name: /Orienter l’IA/ })).toHaveValue("rien sous la terre");
  });
});

test.describe("Chapitres proposés (F13.5)", () => {
  test("F13-AC27 — le ✦ au pied de la carte ouvre l'espace de l'IA ; six chapitres proposés un à un, rien de créé avant « Ajouter ce chapitre », qui ajoute le chapitre vu, retouché, à la fin de la partie ; « Annuler » le rend à la série", async ({ page }) => {
    const s = await passeurs(page);
    await aller(page, `/projet/${s.projet}/plan`);
    await page.getByRole("button", { name: "Demander des chapitres à l’IA pour « La forêt »" }).click();
    const espace = page.getByRole("group", { name: "Chapitres proposés pour « La forêt »" });
    const orienter = espace.getByRole("textbox", { name: /Orienter l’IA/ });
    await expect(orienter).toBeFocused();
    expect(s.demandes).toHaveLength(0);
    await orienter.fill("au bord de l’eau");
    await espace.getByRole("button", { name: "Proposer des chapitres" }).click();
    const titre = espace.getByRole("textbox", { name: "Titre du chapitre proposé" });
    await expect(titre).toHaveValue("Le gué des saules");
    await expect(espace.getByRole("textbox", { name: "Résumé du chapitre proposé" })).toHaveValue(/rivière/);
    await expect(espace.getByText("1 / 6")).toBeVisible();
    expect(s.demandes).toEqual([expect.objectContaining({ sorte: "chapitres", partie: s.foret.partieId, orientation: "au bord de l’eau" })]);

    // Défiler et retoucher ne crée rien
    await espace.getByRole("button", { name: "Proposition suivante" }).click();
    await expect(titre).toHaveValue("La cabane du pêcheur");
    await titre.fill("La cabane du vieux pêcheur");
    await espace.getByRole("button", { name: "Proposition précédente" }).click();
    await expect(titre).toHaveValue("Le gué des saules");
    await espace.getByRole("button", { name: "Proposition suivante" }).click();
    await expect(titre).toHaveValue("La cabane du vieux pêcheur");
    expect((await chapitresDe(s.foret.partieId)).map((c) => c.titre)).toEqual(["La lisière"]);

    // « Ajouter ce chapitre » : seul celui qu'on voit, retouché, avec son résumé ; le suivant s'affiche
    await espace.getByRole("button", { name: "Ajouter ce chapitre" }).click();
    await expect(MESSAGE(page)).toContainText("« La cabane du vieux pêcheur » est ajouté à la fin de « La forêt ».");
    await expect(page.getByRole("link", { name: "Ouvrir La cabane du vieux pêcheur" })).toBeVisible();
    expect(await chapitresDe(s.foret.partieId)).toEqual([
      expect.objectContaining({ titre: "La lisière" }),
      expect.objectContaining({ titre: "La cabane du vieux pêcheur", resume: expect.stringContaining("cabane") }),
    ]);
    await expect(titre).toHaveValue("Le chemin des lanternes");
    await expect(espace.getByText("2 / 5")).toBeVisible();
    expect(await sql("select 1 from public.scenes s join public.chapitres c on c.id = s.chapitre_id where c.partie_id = $1", [s.foret.partieId])).toHaveLength(1);

    // « Annuler » : le chapitre va à la corbeille, sa proposition revient dans la série
    await MESSAGE(page).getByRole("button", { name: "Annuler" }).click();
    await expect.poll(async () => (await chapitresDe(s.foret.partieId)).map((c) => c.titre)).toEqual(["La lisière"]);
    await expect(titre).toHaveValue("La cabane du vieux pêcheur");
    await expect(espace.getByText("2 / 6")).toBeVisible();

    // La croix referme l'espace ; le rouvrir montre la même série, sans nouvel appel
    await espace.getByRole("button", { name: "Fermer l’aide de l’IA" }).click();
    await expect(espace).toHaveCount(0);
    await page.getByRole("button", { name: "Demander des chapitres à l’IA pour « La forêt »" }).click();
    await expect(titre).toHaveValue("La cabane du vieux pêcheur");
    expect(s.demandes).toHaveLength(1);
    // « D'autres idées » redemande, en écartant ceux déjà vus
    await espace.getByRole("button", { name: "D’autres idées" }).click();
    await expect.poll(() => s.demandes.length).toBe(2);
    expect(s.demandes[1].dejaMontres).toHaveLength(6);
    await page.keyboard.press("Escape");
    await expect(espace).toHaveCount(0);
  });
});

test.describe("Résumé proposé (F13.5)", () => {
  test("le ✦ du résumé : le résumé proposé prend place dans le champ, modifiable ; « Annuler » rend l'ancien", async ({ page }) => {
    const s = await passeurs(page);
    await s.base.from("chapitres").update({ resume: "Lou entre dans le bois." }).eq("id", s.foret.chapitres[0].id);
    await aller(page, `/projet/${s.projet}/plan`);
    await page.getByLabel("Autres commandes du chapitre La lisière").click();
    await page.getByRole("button", { name: "Réglages", exact: true }).click();
    await page.getByRole("button", { name: "Proposer un autre résumé avec l’IA" }).click();
    const champ = page.getByLabel("Résumé", { exact: true });
    await expect(champ).toHaveValue(/^Lou entre dans le bois\. La brume y adoucit/);
    await expect(MESSAGE(page)).toContainText("Résumé remplacé.");
    await expect.poll(async () => (await sql<{ resume: string }>("select resume from public.chapitres where id = $1", [s.foret.chapitres[0].id]))[0].resume).toMatch(/La brume y adoucit/);
    await MESSAGE(page).getByRole("button", { name: "Annuler" }).click();
    await expect(champ).toHaveValue("Lou entre dans le bois.");
    await expect.poll(async () => (await sql<{ resume: string }>("select resume from public.chapitres where id = $1", [s.foret.chapitres[0].id]))[0].resume).toBe("Lou entre dans le bois.");
  });
});

test("aides éteintes : « Ajouter une partie » et « Ajouter un chapitre » redeviennent simples, sans ✦ ni « Proposer un résumé »", async ({ page }) => {
  const s = await passeurs(page, { proposer: false });
  await aller(page, `/projet/${s.projet}/plan`);
  await expect(page.getByRole("button", { name: "Ajouter une partie" })).toBeVisible();
  await expect(page.getByRole("button", { name: /à l’IA/ })).toHaveCount(0);
  await page.getByLabel("Autres commandes du chapitre La lisière").click();
  await page.getByRole("button", { name: "Réglages", exact: true }).click();
  await expect(page.getByRole("button", { name: /Proposer un/ })).toHaveCount(0);
  await aller(page, `/projet/${s.projet}/preparation?etape=etapes`);
  await expect(page.getByRole("button", { name: "Ajouter une partie" })).toBeVisible();
  await expect(page.getByRole("button", { name: /à l’IA/ })).toHaveCount(0);
});
