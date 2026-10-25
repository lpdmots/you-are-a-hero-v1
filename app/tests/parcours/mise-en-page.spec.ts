import { expect, test, type Page } from "@playwright/test";
import type { SupabaseClient } from "@supabase/supabase-js";
import { adultePret, aller, choixAuto, recit, semerBlocs, semerImage, semerPartie, semerProjet, sql, supprimerComptes, type Compte } from "./outils";

/**
 * Étape 6 du plan, lot 3 : les images à confirmer à « Relire » (F11-AC84), l'ouverture de
 * « Mettre en page » (F11-AC63), ses réglages (F11-AC60) et ses pages de présentation (F11.4),
 * les règles du jeu à portée de main dans la lecture (F04-AC24).
 */

test.afterEach(async () => {
  await supprimerComptes();
});

type Livre = { compte: Compte; base: SupabaseClient; projet: string; s: string[]; image: string };

/** « Le phare » : S001, départ, une image à 60 %, mène à S002, une fin. Tout est prêt. */
async function phare(page: Page): Promise<Livre> {
  const { compte, base } = await adultePret(page);
  const projet = await semerProjet(base, compte, "personnel", "choix", "Le phare");
  const { chapitres } = await semerPartie(base, projet, "La côte", [{ titre: "La plage", scenes: ["La plage au matin", "La lanterne"] }]);
  const s = chapitres[0].scenes;
  const image = await semerImage(base, compte, projet);
  await base.from("projets").update({ depart_scene_id: s[0] }).eq("id", projet);
  await semerBlocs(base, s[0], [recit("Le phare clignote dans la brume."), { type: "image", id: crypto.randomUUID(), image, largeur: 60, children: [{ text: "" }] }, choixAuto("Monter au phare", s[1])]);
  await semerBlocs(base, s[1], [recit("La lanterne s’allume.")]);
  await base.from("scenes").update({ fin: true }).eq("id", s[1]);
  await sql("update scenes set etat = 'prete' where projet_id = $1", [projet]);
  return { compte, base, projet, s, image };
}
const fiche = (page: Page) => page.locator(".controles");
const tache = (page: Page, nom: string) => fiche(page).getByRole("list", { name: "Tâches de l’étape" }).getByRole("button", { name: new RegExp(nom) });

test("F11-AC84, F11-AC63 — un dessin peu défini attend à « À confirmer » ; « Mettre en page » reste fermée, et dit pourquoi, jusqu'à « Garder ainsi » et aux deux déclarations", async ({ page }) => {
  const l = await phare(page);
  await sql("update images set largeur = 500, hauteur = 400 where id = $1", [l.image]);
  await aller(page, `/projet/${l.projet}/livre?etape=relire`);
  await tache(page, "À confirmer").click();
  await expect(fiche(page).locator(".point")).toContainText("Image peu définie.");
  await aller(page, `/projet/${l.projet}/livre?etape=page`);
  await expect(page.getByRole("heading", { name: "« Mettre en page » n’est pas encore ouverte" })).toBeVisible();
  await expect(page.locator(".porte__reste")).toContainText("1 point à traiter");
  await expect(page.locator(".porte__reste")).toContainText("« J’ai vérifié les chemins » à déclarer");

  await aller(page, `/projet/${l.projet}/livre?etape=relire`);
  await tache(page, "À confirmer").click();
  await fiche(page).getByRole("button", { name: "Garder ainsi" }).click();
  await expect(fiche(page).getByText("Tout est confirmé.")).toBeVisible();
  await tache(page, "Lire et corriger").click();
  await fiche(page).getByRole("button", { name: "J’ai relu le livre" }).click();
  await expect(fiche(page).getByText("Livre relu.")).toBeVisible();
  await aller(page, `/projet/${l.projet}/livre?etape=chemins`);
  await tache(page, "Tester la lecture").click();
  await fiche(page).getByRole("button", { name: "J’ai vérifié les chemins" }).click();
  await expect(fiche(page).getByText("Chemins vérifiés.")).toBeVisible();
  await aller(page, `/projet/${l.projet}/livre?etape=page`);
  await expect(page.getByRole("tab", { name: "Réglages" })).toBeVisible();
  // À « Mettre en page », aucun défaut ne se présente
  await expect(page.getByText("Image peu définie.")).toHaveCount(0);
});

test.describe("« Mettre en page », volet « Réglages »", () => {
  const ouvrir = async (page: Page, l: Livre) => {
    await sql("update projets set mise_en_page_ouverte_le = now() where id = $1", [l.projet]);
    await aller(page, `/projet/${l.projet}/livre?etape=page`);
  };

  test("F11-AC60 — la marge intérieure portée à 23 mm est gardée ; 8 mm est refusé et la valeur reste ; « Valeurs de départ » la ramène à 20", async ({ page }) => {
    const l = await phare(page);
    await ouvrir(page, l);
    const marges = () => sql<{ m: { marges: { interieur: number } } | null }>("select mise_en_page as m from projets where id = $1", [l.projet]);
    await page.getByRole("button", { name: "Modifier", exact: true }).first().click();
    const interieur = page.getByLabel("Intérieur, côté reliure");
    await interieur.fill("23");
    await interieur.press("Enter");
    await expect.poll(async () => (await marges())[0].m?.marges.interieur).toBe(23);
    await expect(page.locator(".marges__valeurs")).toHaveText("Haut 16 · Bas 20 · Extérieur 15 · Intérieur 23 mm");
    await interieur.fill("8");
    await interieur.press("Tab");
    await expect(page.getByRole("alert").filter({ hasText: "8 mm refusé : 10 mm au moins." })).toBeVisible();
    await expect(interieur).toHaveValue("23");
    await page.getByRole("button", { name: "Valeurs de départ" }).click();
    await expect.poll(async () => (await marges())[0].m?.marges.interieur).toBe(20);
  });

  test("F11-AC105, F11-AC50 — la page des auteurs se modifie dans le panneau à droite : sa phrase, ses prénoms, sa place ; tout est gardé", async ({ page }) => {
    const l = await phare(page);
    await ouvrir(page, l);
    const pages = () => sql<{ p: { auteurs?: { introduction: string; noms: string[]; place: string; presente: boolean } } | null }>("select pages_du_livre as p from projets where id = $1", [l.projet]);
    const ligne = page.locator(".page-du-livre").filter({ hasText: "Page des auteurs" });
    // En projet personnel, pas de page des auteurs d'office : on l'ajoute
    await ligne.locator("label.inter").click();
    await expect(ligne.getByRole("switch")).toBeChecked();
    // Mise dans le livre, la page s'ouvre aussitôt dans le panneau
    const panneau = page.getByRole("region", { name: "Page des auteurs" });
    await expect(panneau).toBeVisible();
    await panneau.getByLabel("Phrase d’introduction").fill("Ce livre a été écrit par les marins du phare");
    await panneau.getByLabel("Prénoms, un par ligne").fill("Zoé\nAdam\nÉlie");
    await panneau.getByRole("radio", { name: "À la fin" }).check();
    await expect.poll(async () => (await pages())[0].p?.auteurs).toMatchObject({ presente: true, introduction: "Ce livre a été écrit par les marins du phare", noms: ["Zoé", "Adam", "Élie"], place: "fin" });
    await panneau.getByRole("button", { name: "Fermer le panneau" }).click();
    await expect(panneau).toHaveCount(0);
    await expect(ligne).toContainText("3 prénoms · à la fin");
  });

  test("F11.4 — « Comment lire ce livre » s'écrit dans une grande fenêtre, la double page à côté ; ses règles du jeu s'y corrigent et changent celles de la Préparation ; Échap la ferme", async ({ page }) => {
    const l = await phare(page);
    await sql("update preparations set regles = 'Lance le dé.' where projet_id = $1", [l.projet]);
    await ouvrir(page, l);
    await page.locator(".page-du-livre").filter({ hasText: "Comment lire ce livre" }).getByRole("button", { name: "Modifier" }).click();
    const fenetre = page.getByRole("dialog").getByRole("region", { name: "Comment lire ce livre" });
    await expect(fenetre).toBeVisible();
    await expect(fenetre.locator(".petite-double")).toBeVisible();
    await expect(fenetre.getByRole("textbox", { name: "Texte de « Comment lire ce livre »" })).toBeVisible();
    const regles = fenetre.getByRole("textbox", { name: "Règles du jeu" });
    await expect(regles).toHaveValue("Lance le dé.");
    await regles.fill("Lance le dé quand le livre le demande.");
    await expect.poll(async () => (await sql<{ regles: string }>("select regles from preparations where projet_id = $1", [l.projet]))[0].regles).toBe("Lance le dé quand le livre le demande.");
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });
});

test("F04-AC24 — à la lecture, « Règles du jeu » ouvre les règles sans quitter le passage, et la feuille reste telle qu'elle était", async ({ page }) => {
  const l = await phare(page);
  await sql(
    `update preparations set regles = 'Tu commences avec 5 points de volonté.', feuille = $2 where projet_id = $1`,
    [l.projet, JSON.stringify({ on: true, des: 1, sections: [{ id: "v", type: "compteurs", titre: "Caractéristiques", compteurs: [{ id: "c", nom: "Volonté", depart: 5 }] }] })],
  );
  await aller(page, `/projet/${l.projet}/lecture?depart=${l.s[0]}&de=livre`);
  await page.getByRole("button", { name: "Monter au phare" }).click();
  await expect(page.locator(".lu-page")).toContainText("La lanterne s’allume.");
  await page.getByRole("button", { name: "Règles du jeu" }).click();
  await expect(page.locator(".fa-regles")).toHaveAttribute("open", "");
  await expect(page.locator(".fa-regles")).toContainText("Tu commences avec 5 points de volonté.");
  await page.getByRole("button", { name: "Ranger" }).first().click();
  await expect(page.locator(".lu-page")).toContainText("La lanterne s’allume.");
  await expect(page.getByRole("button", { name: /Ma feuille/ })).toContainText("Volonté 5");
});
