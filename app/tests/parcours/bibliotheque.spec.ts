import { expect, test, type Page } from "@playwright/test";
import { adultePret, aller, semerDansLaBibliotheque, semerImageDeposee, semerProjet, sql, supprimerComptes, viderLaBibliotheque, type Compte } from "./outils";

/**
 * La bibliothèque d'images (F10.1, 21 octobre 2026) : M. Bernard crée des images ; le porteur, un
 * compte d'essai marqué « createur » le temps du test, relit celles sans personnage ; Mme Laurent
 * les trouve ensuite dans « Choisir une image ». Les images sont semées comme des images créées
 * gardées (`demandes_d_images.image_posee`).
 */

const sources: string[] = [];
test.afterEach(async () => {
  // La bibliothèque survit aux comptes : ses lignes et ses fichiers d'essai s'effacent ici
  await viderLaBibliotheque(sources.splice(0));
  await supprimerComptes();
});

/** Une image créée et gardée par l'IA, pour une cible donnée, sans personnage ou non. */
async function imageCreee(c: { compte: Compte; base: Parameters<typeof semerImageDeposee>[0] }, projet: string, cible: "chapitre" | "scene" | "personnage", sansPersonnage: boolean): Promise<string> {
  const image = await semerImageDeposee(c.base, c.compte, projet);
  sources.push(image);
  await sql(
    `insert into public.demandes_d_images (enseignant_id, projet_id, cible, cible_id, etat, image_posee, sans_personnage, termine_le)
     values ($1, $2, $3, gen_random_uuid(), 'posee', $4, $5, now())`,
    [c.compte.id, projet, cible, image, sansPersonnage],
  );
  return image;
}

const carte = (page: Page, image: string) => page.locator("li").filter({ has: page.locator(`img[src^="/admin/images/${image}"]`) });

test("F10-AC53, F10-AC55 — le porteur relit les images sans personnage : acceptée, elle reçoit ses mots-clés ; refusée, elle ne revient plus ; les autres ne lui sont jamais montrées", async ({ page, browser }) => {
  const autre = await browser.newContext();
  const bernard = await adultePret(await autre.newPage());
  await autre.close();
  const marais = await semerProjet(bernard.base, bernard.compte, "personnel", "choix", "Le marais", null);
  const lisiere = await imageCreee(bernard, marais, "chapitre", true);
  const pont = await imageCreee(bernard, marais, "scene", true);
  const avecLou = await imageCreee(bernard, marais, "scene", false);
  const portrait = await imageCreee(bernard, marais, "personnage", false);

  const porteur = await adultePret(page);
  await sql("update public.enseignants set createur = true where id = $1", [porteur.compte.id]);
  await aller(page, "/admin");
  await page.getByRole("link", { name: /images? à relire/ }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Bibliothèque d’images" })).toBeVisible();
  await expect(carte(page, lisiere)).toContainText("Repérage d’un chapitre");
  await expect(carte(page, pont)).toContainText("Image de scène");
  // Ni l'image de scène avec un personnage, ni le portrait
  await expect(carte(page, avecLou)).toHaveCount(0);
  await expect(carte(page, portrait)).toHaveCount(0);

  await carte(page, lisiere).getByRole("button", { name: "Accepter" }).click();
  await expect(page.getByRole("status").filter({ hasText: /\S/ })).toContainText("L’image est dans la bibliothèque, avec ses mots-clés.");
  const [entree] = await sql<{ id: string; mots: string[]; mots_en: string[]; chemin: string }>("select id, mots, mots_en, chemin from public.bibliotheque where image_source = $1", [lisiere]);
  expect(entree.mots).toEqual(["forêt", "rivière", "brume", "matin"]);
  expect(entree.mots_en).toContain("forest");
  // Copiée hors des dossiers de M. Bernard : elle survit à son compte
  expect(entree.chemin).toMatch(/^bibliotheque\//);
  await expect(carte(page, lisiere)).toHaveCount(0);

  // Les mots-clés se retouchent
  const dedans = page.locator("li").filter({ has: page.locator(`img[src^="/images/bibliotheque/${entree.id}"]`) });
  await dedans.getByLabel("Mots-clés").fill("forêt, lisière, Brume, forêt");
  await dedans.getByRole("button", { name: "Enregistrer" }).click();
  await expect(page.getByRole("status").filter({ hasText: /\S/ })).toContainText("Les mots-clés sont enregistrés.");
  expect((await sql<{ mots: string[] }>("select mots from public.bibliotheque where id = $1", [entree.id]))[0].mots).toEqual(["forêt", "lisière", "brume"]);

  await carte(page, pont).getByRole("button", { name: "Refuser" }).click();
  await expect(page.getByRole("status").filter({ hasText: /\S/ })).toContainText("L’image ne sera plus proposée.");
  await expect(carte(page, pont)).toHaveCount(0);
  expect((await sql<{ etat: string }>("select etat from public.bibliotheque where image_source = $1", [pont]))[0].etat).toBe("refusee");
});

test("F10-AC55 — un adulte qui refuse de proposer ses images dans « Mon compte » n'en voit aucune relue", async ({ page, browser }) => {
  const autre = await browser.newContext();
  const pageBernard = await autre.newPage();
  const bernard = await adultePret(pageBernard);
  const marais = await semerProjet(bernard.base, bernard.compte, "personnel", "choix", "Le marais", null);
  const lisiere = await imageCreee(bernard, marais, "chapitre", true);
  await aller(pageBernard, "/compte");
  const reglage = pageBernard.getByRole("switch", { name: "Proposer mes images sans personnage à la bibliothèque" });
  await expect(reglage).toBeChecked();
  await pageBernard.getByText("Bibliothèque d’images", { exact: true }).locator("..").locator("..").locator("label.inter").click();
  await expect(reglage).not.toBeChecked();
  await expect(pageBernard.getByText("Enregistré")).toBeVisible();
  await autre.close();

  const porteur = await adultePret(page);
  await sql("update public.enseignants set createur = true where id = $1", [porteur.compte.id]);
  await aller(page, "/admin/bibliotheque");
  await expect(page.getByRole("heading", { level: 1, name: "Bibliothèque d’images" })).toBeVisible();
  await expect(carte(page, lisiere)).toHaveCount(0);
});

test("F10-AC54 — dans « Choisir une image », un mot cherche dans les visuels et la bibliothèque ; l'image prise est copiée dans le projet et devient son repère", async ({ page }) => {
  const laurent = await adultePret(page);
  const phare = await semerProjet(laurent.base, laurent.compte, "personnel", "choix", "Le phare", null);
  // Une image déjà dans la bibliothèque, venue d'un autre projet de Mme Laurent
  const source = await semerImageDeposee(laurent.base, laurent.compte, phare);
  sources.push(source);
  await semerDansLaBibliotheque(source, ["étang", "roseaux", "matin"], ["pond", "reeds", "morning"]);

  await aller(page, `/projet/${phare}/plan`);
  await page.getByRole("button", { name: "Réglages du projet" }).click();
  await page.getByRole("button", { name: "Choisir une image" }).click();
  const chercher = page.getByRole("searchbox", { name: "Chercher un visuel" });
  await chercher.fill("roseau");
  await expect(page.getByRole("button", { name: "Image de la bibliothèque : étang, roseaux, matin" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Forêt" })).toHaveCount(0);
  await chercher.fill("foret");
  await expect(page.getByRole("button", { name: "Forêt" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Image de la bibliothèque : étang, roseaux, matin" })).toHaveCount(0);
  await chercher.fill("pond");
  await page.getByRole("button", { name: "Image de la bibliothèque : étang, roseaux, matin" }).click();

  await expect
    .poll(async () => (await sql<{ image_id: string | null }>("select image_id from public.projets where id = $1", [phare]))[0].image_id)
    .not.toBeNull();
  const [{ image_id }] = await sql<{ image_id: string }>("select image_id from public.projets where id = $1", [phare]);
  expect(image_id).not.toBe(source);
  const [copie] = await sql<{ chemin: string }>("select chemin from public.images where id = $1", [image_id]);
  expect(copie.chemin).toBe(`${laurent.compte.id}/${phare}/${image_id}.jpg`);
});
