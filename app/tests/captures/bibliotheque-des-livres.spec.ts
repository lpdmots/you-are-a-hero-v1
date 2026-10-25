import { readFileSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { action, adultePret, aller, choixAuto, recit, semerBlocs, semerClasse, semerImage, semerPartie, semerProjet, sql, supprimerComptes, type Compte } from "../parcours/outils";

/**
 * Captures de la bibliothèque publique des livres (F15) : npm run captures -- bibliotheque-des-livres,
 * ou, contre le serveur local déjà lancé, npx playwright test --config playwright.local.config.ts bibliotheque-des-livres.
 * Elles s'écrivent dans test-results/captures/. Ce n'est pas un test : rien n'y est vérifié.
 */
const dossier = "test-results/captures";
let n = 1500;
/** Une fenêtre haute plutôt qu'une capture « pleine page » : la barre collée du haut ne se répète pas au milieu. */
const capturer = async (page: Page, nom: string, toute = false) => {
  n += 1;
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${dossier}/${n}-${nom}.png`, fullPage: toute });
};
const HAUTE = { width: 1366, height: 1500 };

test.afterEach(async () => {
  await supprimerComptes();
});

/** Une vraie image dans le seau, pour que la page de titre la montre. */
async function image(base: SupabaseClient, compte: Compte, projet: string, nom: string): Promise<string> {
  const service = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_CLE_SECRETE!, { auth: { persistSession: false } });
  const id = await semerImage(base, compte, projet);
  for (const [suffixe, fichier] of [["", `defaut-${nom}.jpg`], ["-v", `defaut-${nom}-v.jpg`]]) {
    await service.storage.from("images").upload(`${compte.id}/${projet}/${id}${suffixe}.jpg`, readFileSync(`public/illustrations/${fichier}`), { contentType: "image/jpeg", upsert: true });
  }
  return id;
}

/** Un livre fini, « Imprimer et partager » ouverte, rien de partagé. */
async function livreFini(base: SupabaseClient, compte: Compte, titre: string, classeId: string | null, illustration?: string) {
  const projet = await semerProjet(base, compte, classeId ? "classe" : "personnel", "choix", titre, classeId);
  const s = (await semerPartie(base, projet, "Le quai aux lanternes", [{ titre: "Le dernier bac", scenes: ["Le quai", "La porte", "Le sommet"] }])).chapitres[0].scenes;
  await base.from("projets").update({ depart_scene_id: s[0] }).eq("id", projet);
  const img = illustration ? await image(base, compte, projet, illustration) : null;
  await semerBlocs(base, s[0], [
    recit("La sirène du dernier bac retentit trois fois. Lou courut sur le quai, son sac rebondissant dans son dos, pendant que la brume avalait les lanternes une à une."),
    action("Ajoute la lanterne de secours à ton inventaire."),
    choixAuto("Monter vers la porte", s[1]), choixAuto("Attendre le prochain bac", s[2]),
  ]);
  await semerBlocs(base, s[1], [recit("Trois symboles brillent sur la porte."), choixAuto("Redescendre", s[0]), choixAuto("Pousser la porte", s[2])]);
  await semerBlocs(base, s[2], [recit("La lanterne du sommet s’allume.")]);
  await base.from("scenes").update({ fin: true }).eq("id", s[2]);
  if (img) await sql(`update projets set pages_du_livre = jsonb_build_object('titre', jsonb_build_object('illustration', $2::text)) where id = $1`, [projet, img]);
  await sql("update scenes set etat = 'prete' where projet_id = $1", [projet]);
  await sql(
    "update projets set mise_en_page_ouverte_le = now(), livre_relu_le = now(), chemins_verifies_le = now(), mise_en_page_convient_le = now(), imprimer_ouvert_le = now() where id = $1",
    [projet],
  );
  return { projet, s };
}

const PRESENTATION = "Au bord du fleuve, la brume ne se lève plus. Tu suis le vieux passeur et sa lanterne vers l’autre rive, là où personne n’ose aller.";

test("lot 1 : partager en privé ou en public", async ({ page }) => {
  test.setTimeout(240_000);
  const { compte, base } = await adultePret(page);
  await page.setViewportSize(HAUTE);
  const classe = await semerClasse(base, "CM1-CM2", ["Alice", "Bilal"]);
  const { projet, s } = await livreFini(base, compte, "La lanterne du passeur", classe.id, "foret");
  const partager = `/projet/${projet}/livre?etape=sortie&volet=partager`;

  await aller(page, partager);
  await capturer(page, "partager-rien");
  await page.getByRole("button", { name: "Proposer à la bibliothèque…" }).click();
  await page.getByLabel("Présentation").fill(PRESENTATION);
  await capturer(page, "partager-proposer-classe");
  await page.getByText("J’ai l’autorisation écrite").click();
  await page.getByRole("button", { name: "Proposer le livre" }).click();
  await expect(page.getByText("En attente de relecture")).toBeVisible();
  await capturer(page, "partager-en-attente");

  // Le partage privé, ouvert, puis le livre publié par le porteur
  await page.locator("label.inter", { has: page.getByRole("switch", { name: "À mes classes" }) }).click();
  await page.getByText("J’ai relu le livre sur ces points.").click();
  await page.getByRole("button", { name: "Partager à mes classes" }).click();
  await expect(page.getByText(/À jour depuis le/)).toBeVisible();
  await sql(
    `update publications set adresse = 'la-lanterne-du-passeur', version = proposee, presentation = presentation_proposee, age = age_propose, empreinte = empreinte_proposee,
       publiee_le = now(), mise_a_jour_le = now(), proposee = null, presentation_proposee = null, age_propose = null, empreinte_proposee = null, proposee_le = null, attestation = null
     where projet_id = $1`,
    [projet],
  );
  await aller(page, partager);
  await capturer(page, "partager-publie");

  // Le livre change : la version privée et la version publiée le disent
  await semerBlocs(base, s[2], [recit("La lanterne du sommet s’allume enfin.")]);
  await sql("update scenes set etat = 'prete' where projet_id = $1", [projet]);
  await aller(page, partager);
  await capturer(page, "partager-publie-change");

  // Une mise à jour refusée
  await sql("update publications set refus_motif = $2, refusee_le = now() where projet_id = $1", [
    projet, "Contenu inadapté à l’âge des lecteurs. Le passage 3 décrit une chute trop violente pour des lecteurs de 8 ans.",
  ]);
  await aller(page, partager);
  await capturer(page, "partager-maj-refusee");

  // Refusée avant toute publication
  await sql("update publications set version = null, presentation = null, age = null, empreinte = null, publiee_le = null, mise_a_jour_le = null, derniere_presentation = $2 where projet_id = $1", [projet, PRESENTATION]);
  await aller(page, partager);
  await capturer(page, "partager-refuse");

  // En 390
  await page.setViewportSize({ width: 390, height: 844 });
  await aller(page, partager);
  await page.getByRole("button", { name: "Proposer de nouveau…" }).click();
  await capturer(page, "partager-proposer-390");
});

test("lot 1 : mode personnel sans classe", async ({ page }) => {
  test.setTimeout(120_000);
  const { compte, base } = await adultePret(page);
  await page.setViewportSize(HAUTE);
  const { projet } = await livreFini(base, compte, "Le phare", null);
  await aller(page, `/projet/${projet}/livre?etape=sortie&volet=partager`);
  await page.getByRole("button", { name: "Proposer à la bibliothèque…" }).click();
  await capturer(page, "partager-proposer-personnel");
});
