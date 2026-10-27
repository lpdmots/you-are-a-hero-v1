import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { expect, test, type Page } from "@playwright/test";
import type { SupabaseClient } from "@supabase/supabase-js";
import { action, adultePret, aller, choixAuto, classeQuiEcrit, posteDe, recit, semerBlocs, semerClasse, semerPartie, semerProjet, service, sql, supprimerComptes, type Compte } from "../parcours/outils";

/**
 * Captures de la couverture faite sur le site (F11.4, lot 1) : npm run captures -- couverture.
 * Elles s'écrivent dans test-results/captures/. Ce n'est pas un test : rien n'y est vérifié.
 */
const dossier = "test-results/captures";
let n = 1700;
const capturer = async (page: Page, nom: string, toute = false) => {
  n += 1;
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${dossier}/${n}-${nom}.png`, fullPage: toute });
};
const HAUTE = { width: 1366, height: 1300 };

test.afterEach(async () => {
  await supprimerComptes();
});

/** Une vraie image en hauteur, déposée dans le seau : une couverture importée. */
async function couverture(base: SupabaseClient, compte: Compte, projet: string): Promise<string> {
  const id = randomUUID();
  const octets = readFileSync(resolve(__dirname, "../../scripts/exemples/passeurs-de-brume/images/01.jpg"));
  for (const chemin of [`${compte.id}/${projet}/${id}.jpg`, `${compte.id}/${projet}/${id}-v.jpg`]) {
    await service().storage.from("images").upload(chemin, octets, { contentType: "image/jpeg", upsert: true });
  }
  const { error } = await base.from("images").insert({
    id, projet_id: projet, enseignant_id: compte.id, chemin: `${compte.id}/${projet}/${id}.jpg`, chemin_vignette: `${compte.id}/${projet}/${id}-v.jpg`, largeur: 1024, hauteur: 1536, format: "jpeg",
  });
  if (error) throw new Error(error.message);
  return id;
}

async function livreFini(base: SupabaseClient, compte: Compte, classeId: string) {
  const projet = await semerProjet(base, compte, "classe", "choix", "La lanterne du passeur", classeId);
  const s = (await semerPartie(base, projet, "Le quai aux lanternes", [{ titre: "Le dernier bac", scenes: ["Le quai", "La porte", "Le sommet"] }])).chapitres[0].scenes;
  await base.from("projets").update({ depart_scene_id: s[0] }).eq("id", projet);
  await semerBlocs(base, s[0], [
    recit("La sirène du dernier bac retentit trois fois. Lou courut sur le quai, pendant que la brume avalait les lanternes une à une."),
    action("Ajoute la lanterne de secours à ton inventaire."),
    choixAuto("Monter vers la porte", s[1]), choixAuto("Attendre le prochain bac", s[2]),
  ]);
  await semerBlocs(base, s[1], [recit("Trois symboles brillent sur la porte."), choixAuto("Pousser la porte", s[2])]);
  await semerBlocs(base, s[2], [recit("La lanterne du sommet s’allume.")]);
  await base.from("scenes").update({ fin: true }).eq("id", s[2]);
  await sql("update scenes set etat = 'prete' where projet_id = $1", [projet]);
  await sql(
    "update projets set mise_en_page_ouverte_le = now(), livre_relu_le = now(), chemins_verifies_le = now(), mise_en_page_convient_le = now(), imprimer_ouvert_le = now() where id = $1",
    [projet],
  );
  await sql("update preparations set univers = 'Un pays de lacs noyé dans la brume.', enjeu = 'Retrouver le passeur disparu.' where projet_id = $1", [projet]);
  return projet;
}

test("lot 1 : le bloc « La couverture »", async ({ page }) => {
  test.setTimeout(240_000);
  const { compte, base } = await adultePret(page);
  await page.setViewportSize(HAUTE);
  const classe = await semerClasse(base, "CM1-CM2", ["Alice", "Bilal"]);
  const projet = await livreFini(base, compte, classe.id);
  const imprimer = `/projet/${projet}/livre?etape=sortie`;
  const bloc = page.locator("aside.couverture");

  await aller(page, imprimer);
  await capturer(page, "couverture-vide");

  // Ce que montre la couverture, la description proposée, l'année cochée et le titre retouché
  await bloc.getByLabel("Ce que montre la couverture").fill("le bac sur le lac au lever du jour");
  await bloc.getByRole("button", { name: "Proposer la description avec l’IA" }).click();
  await bloc.locator(".ci__decrit").waitFor();
  await bloc.getByText("L’année").click();
  await bloc.getByRole("textbox", { name: "Le titre, tel qu’il sera écrit" }).fill("La lanterne");
  await bloc.getByRole("textbox", { name: "Le titre, tel qu’il sera écrit" }).blur();
  await capturer(page, "couverture-textes");

  // En route : une demande ouverte, la page rechargée
  await sql("insert into demandes_d_images (enseignant_id, projet_id, cible, cible_id) values ($1, $2, 'couverture', $2)", [compte.id, projet]);
  await aller(page, imprimer);
  await capturer(page, "couverture-en-route");
  await sql("delete from demandes_d_images where projet_id = $1", [projet]);

  // Créée (réponse simulée), posée d'office
  await aller(page, imprimer);
  await bloc.getByRole("button", { name: "Pour le site" }).click();
  await capturer(page, "couverture-pour-le-site");
  await bloc.getByRole("button", { name: "Créer la couverture" }).click();
  await expect(page.getByText("Couverture posée.")).toBeVisible({ timeout: 30_000 });
  await capturer(page, "couverture-posee");

  // Une vraie couverture en hauteur, dans le volet « Partager »
  const id = await couverture(base, compte, projet);
  await base.from("projets").update({ couverture_id: id }).eq("id", projet);
  await aller(page, `${imprimer}&volet=partager`);
  await capturer(page, "couverture-partager");

  await page.setViewportSize({ width: 390, height: 844 });
  await aller(page, imprimer);
  await bloc.scrollIntoViewIfNeeded();
  await capturer(page, "couverture-390", true);

  // Sans les aides : ni ✦, ni « Créer la couverture » ; l'import et le prompt restent
  await page.setViewportSize(HAUTE);
  await sql("update enseignants set reglages_ia = reglages_ia || '{\"proposer\": false}'::jsonb where id = $1", [compte.id]);
  await base.from("projets").update({ couverture_id: null }).eq("id", projet);
  await aller(page, imprimer);
  await capturer(page, "couverture-sans-aides");
});

test("lot 2 : la couverture dans « Proposer à la bibliothèque »", async ({ page }) => {
  test.setTimeout(120_000);
  n = 1720;
  const { compte, base } = await adultePret(page);
  await page.setViewportSize(HAUTE);
  const classe = await semerClasse(base, "CM1-CM2", ["Alice", "Bilal"]);
  const projet = await livreFini(base, compte, classe.id);
  const partager = `/projet/${projet}/livre?etape=sortie&volet=partager`;
  await aller(page, partager);
  await page.getByRole("button", { name: "Proposer à la bibliothèque…" }).click();
  await capturer(page, "proposer-sans-couverture");
  const id = await couverture(base, compte, projet);
  await base.from("projets").update({ couverture_id: id }).eq("id", projet);
  await aller(page, partager);
  await page.getByRole("button", { name: "Proposer à la bibliothèque…" }).click();
  await capturer(page, "proposer-avec-couverture");
});

test("lot 3 : la couverture dans « Lire », la bibliothèque et la page de titre", async ({ page, browser }) => {
  test.setTimeout(180_000);
  n = 1730;
  const s = await classeQuiEcrit(page);
  await page.setViewportSize(HAUTE);
  const projet = await livreFini(s.base, s.compte, s.classe.id);
  const id = await couverture(s.base, s.compte, projet);
  await s.base.from("projets").update({ couverture_id: id }).eq("id", projet);
  await aller(page, `/projet/${projet}/livre?etape=sortie&volet=partager`);
  await page.locator("label.inter", { has: page.getByRole("switch", { name: "À mes classes" }) }).click();
  await page.getByText("J’ai relu le livre sur ces points.").click();
  await page.getByRole("button", { name: "Partager à mes classes" }).click();
  await expect(page.getByText(/À jour depuis le/)).toBeVisible();

  const alice = await posteDe(browser, s, "Alice");
  await alice.page.setViewportSize({ width: 1366, height: 1300 });
  await alice.page.goto("/travail/lecture");
  await capturer(alice.page, "lire-avec-couverture");
  await alice.page.setViewportSize({ width: 390, height: 844 });
  await capturer(alice.page, "lire-avec-couverture-390", true);

  await aller(page, "/bibliotheque");
  await capturer(page, "bibliotheque-avec-couvertures");

  await aller(page, `/projet/${projet}/livre?etape=page`);
  await page.locator(".page-du-livre").filter({ hasText: "Page de titre" }).getByRole("button", { name: "Modifier" }).click();
  await page.getByRole("radio", { name: "Image pleine page" }).check();
  await capturer(page, "page-de-titre-reprendre");
});
