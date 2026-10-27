import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { expect, test, type Page } from "@playwright/test";
import type { SupabaseClient } from "@supabase/supabase-js";
import { MESSAGE, adultePret, aller, choixAuto, recit, semerBlocs, semerClasse, semerPartie, semerProjet, sql, supprimerComptes, type Compte } from "./outils";

/**
 * La couverture faite sur le site, lot 1 (F11.4, F11-AC110 à AC113, AC116) : le bloc « La
 * couverture » de « Imprimer et partager », dans un vrai navigateur, l'IA simulée.
 */

test.afterEach(async () => {
  await supprimerComptes();
});

const bloc = (page: Page) => page.locator("aside.couverture");

async function livreFini(base: SupabaseClient, compte: Compte) {
  const classe = await semerClasse(base, "CM1-CM2", ["Alice"]);
  const projet = await semerProjet(base, compte, "classe", "choix", "La lanterne du passeur", classe.id);
  const s = (await semerPartie(base, projet, "Le quai", [{ titre: "Le dernier bac", scenes: ["Le quai", "Le sommet"] }])).chapitres[0].scenes;
  await base.from("projets").update({ depart_scene_id: s[0] }).eq("id", projet);
  await semerBlocs(base, s[0], [recit("La sirène du dernier bac retentit trois fois."), choixAuto("Monter", s[1])]);
  await semerBlocs(base, s[1], [recit("La lanterne du sommet s’allume.")]);
  await base.from("scenes").update({ fin: true }).eq("id", s[1]);
  await sql("update scenes set etat = 'prete' where projet_id = $1", [projet]);
  await sql(
    "update projets set mise_en_page_ouverte_le = now(), livre_relu_le = now(), chemins_verifies_le = now(), mise_en_page_convient_le = now(), imprimer_ouvert_le = now() where id = $1",
    [projet],
  );
  return projet;
}

const couvertureEnBase = async (projet: string) =>
  (await sql<{ couverture_id: string | null }>("select couverture_id from projets where id = $1", [projet]))[0].couverture_id;

test("F11-AC113 — « La couverture » paraît dans les deux volets de « Imprimer et partager »", async ({ page }) => {
  const { compte, base } = await adultePret(page);
  const projet = await livreFini(base, compte);
  await aller(page, `/projet/${projet}/livre?etape=sortie`);
  await expect(bloc(page).getByRole("heading", { name: "La couverture" })).toBeVisible();
  await expect(bloc(page)).toContainText("Sans couverture, la bibliothèque montre la page de titre.");
  await page.getByRole("tab", { name: "Partager" }).click();
  await expect(bloc(page).getByRole("heading", { name: "La couverture" })).toBeVisible();
  await expect(page.getByText("La couverture, chez l’imprimeur")).toHaveCount(0);
});

test("F11-AC113 — le panneau « Proposer à la bibliothèque » montre la couverture, ou dit qu'il n'y en a pas, et mène au bloc", async ({ page }) => {
  const { compte, base } = await adultePret(page);
  const projet = await livreFini(base, compte);
  await aller(page, `/projet/${projet}/livre?etape=sortie&volet=partager`);
  await page.getByRole("button", { name: "Proposer à la bibliothèque…" }).click();
  const panneau = page.getByRole("group", { name: "Proposer à la bibliothèque" });
  await expect(panneau).toContainText("Sans couverture, la bibliothèque montre la page de titre.");
  await panneau.getByRole("button", { name: "Faire la couverture" }).click();
  await expect(bloc(page).getByLabel("Ce que montre la couverture")).toBeFocused();

  await bloc(page).locator('input[type="file"]').setInputFiles({
    name: "couverture.jpg", mimeType: "image/jpeg", buffer: readFileSync(resolve(__dirname, "../../public/illustrations/defaut-foret.jpg")),
  });
  await expect(MESSAGE(page)).toContainText("Couverture importée.");
  await expect(panneau.getByRole("img", { name: "La couverture proposée" })).toBeVisible();
  await expect(panneau.getByRole("button", { name: "Changer" })).toBeVisible();
});

test("F11-AC110 — « ✦ Créer la couverture » : elle se crée pendant qu'on continue, se pose d'office, s'annule ; elle se télécharge", async ({ page }) => {
  const { compte, base } = await adultePret(page);
  const projet = await livreFini(base, compte);
  await aller(page, `/projet/${projet}/livre?etape=sortie`);
  await expect(bloc(page).getByRole("button", { name: "Créer la couverture" })).toBeDisabled();
  await bloc(page).getByLabel("Ce que montre la couverture").fill("le bac sur le lac au lever du jour");
  await bloc(page).getByRole("button", { name: "Créer la couverture" }).click();
  await expect(MESSAGE(page)).toContainText("Couverture posée.", { timeout: 30_000 });
  const id = await couvertureEnBase(projet);
  expect(id).toBeTruthy();
  await expect(bloc(page).getByRole("img", { name: "La couverture du livre" })).toBeVisible();
  await expect(bloc(page).getByRole("link", { name: "Télécharger" })).toHaveAttribute("download", "Couverture - La lanterne du passeur.jpg");
  // L'image simulée est petite : trop floue pour l'imprimeur
  await expect(bloc(page)).toContainText("Trop floue pour l’imprimeur.");
  expect((await sql<{ aide: string; nombre: number }>("select aide, nombre from appels_ia where enseignant_id = $1", [compte.id]))).toEqual([{ aide: "couverture", nombre: 1 }]);
  await MESSAGE(page).getByRole("button", { name: "Annuler" }).click();
  await expect(bloc(page)).toContainText("Sans couverture, la bibliothèque montre la page de titre.");
  expect(await couvertureEnBase(projet)).toBeNull();
});

test("F11-AC111 — « Pour le site » dit qu'elle est trop floue pour l'imprimer, et coûte moins d'étoiles", async ({ page }) => {
  const { compte, base } = await adultePret(page);
  const projet = await livreFini(base, compte);
  await aller(page, `/projet/${projet}/livre?etape=sortie`);
  await expect(bloc(page).getByRole("button", { name: "Pour imprimer" })).toHaveAttribute("aria-pressed", "true");
  await bloc(page).getByRole("button", { name: "Pour le site" }).click();
  await expect(bloc(page)).toContainText("Trop floue pour l’imprimer, environ dix fois moins d’étoiles.");
});

test("F11-AC112 — cocher l'année, retoucher le titre, reprendre celui de la page de titre ; gardé au retour", async ({ page }) => {
  const { compte, base } = await adultePret(page);
  const projet = await livreFini(base, compte);
  await aller(page, `/projet/${projet}/livre?etape=sortie`);
  const titre = bloc(page).getByRole("textbox", { name: "Le titre, tel qu’il sera écrit" });
  await expect(titre).toHaveValue("La lanterne du passeur");
  await expect(bloc(page)).toContainText("Dites où placer le texte : en haut, sur le ciel…");
  await bloc(page).getByText("L’année").click();
  await titre.fill("La lanterne");
  await titre.blur();
  await bloc(page).getByRole("checkbox", { name: "Le titre" }).focus();
  await expect.poll(async () => (await sql<{ c: Record<string, { coche: boolean; texte: string | null }> }>("select couverture_cases as c from projets where id = $1", [projet]))[0].c.titre?.texte).toBe("La lanterne");
  await aller(page, `/projet/${projet}/livre?etape=sortie`);
  await expect(titre).toHaveValue("La lanterne");
  await expect(bloc(page).getByRole("checkbox", { name: "L’année" })).toBeChecked();
  await bloc(page).getByRole("button", { name: "Reprendre le texte de la page de titre" }).click();
  await expect(titre).toHaveValue("La lanterne du passeur");
  // La page de titre n'a pas changé
  expect((await sql<{ titre: string }>("select titre from projets where id = $1", [projet]))[0].titre).toBe("La lanterne du passeur");
});

test("F11-AC116 — une couverture entière importée est coupée à sa face avant ; un fichier trop lourd est refusé", async ({ page }) => {
  const { compte, base } = await adultePret(page);
  const projet = await livreFini(base, compte);
  await aller(page, `/projet/${projet}/livre?etape=sortie`);
  // Une image plus large que haute : quatrième, dos, face avant
  await bloc(page).locator('input[type="file"]').setInputFiles({
    name: "couverture-entiere.jpg", mimeType: "image/jpeg", buffer: readFileSync(resolve(__dirname, "../../public/illustrations/defaut-foret.jpg")),
  });
  await expect(MESSAGE(page)).toContainText("Couverture importée.");
  const id = await couvertureEnBase(projet);
  const [image] = await sql<{ largeur: number; hauteur: number; textes_demandes: unknown }>("select largeur, hauteur, textes_demandes from images where id = $1", [id]);
  expect(image).toEqual({ largeur: 576, hauteur: 800, textes_demandes: null });

  await bloc(page).locator('input[type="file"]').setInputFiles({ name: "lourde.jpg", mimeType: "image/jpeg", buffer: Buffer.alloc(25 * 1024 * 1024, 1) });
  await expect(bloc(page).getByRole("alert")).toContainText("moins de 20 Mo");
  expect(await couvertureEnBase(projet)).toBe(id);
});
