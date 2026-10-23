import { expect, test, type Page } from "@playwright/test";
import { adultePret, aller, connecter, creerClasse, inscrire, semerAttribution, semerClasse, semerImageDeposee, semerPartie, semerProjet, sql, supprimerComptes, ouvrirLeMenuDuCompte } from "./outils";

/**
 * Étape 9, lot 7 : supprimer pour de bon, vu par l'enseignant (F14-AC26 à AC28) : son compte,
 * une classe passée, la corbeille d'un projet ; puis un projet entier (F14-AC42, 23 octobre 2026).
 */

test.afterEach(async () => {
  await supprimerComptes();
});

const DIALOGUE = (page: Page) => page.getByRole("alertdialog");

async function ouvrirMonCompte(page: Page): Promise<void> {
  await ouvrirLeMenuDuCompte(page);
  await page.getByRole("link", { name: "Mon compte" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Mon compte" })).toBeVisible();
}

test("F14-AC26 — supprimer son compte en retapant son adresse : une adresse mal tapée n'efface rien ; la bonne efface tout, et le compte ne s'ouvre plus", async ({ page, browser }) => {
  const { compte, base } = await adultePret(page);
  const projet = await semerProjet(base, compte, "personnel", "choix", "Le marais", null);
  await sql(
    `insert into public.partages (projet_id, enseignant_id, code, par_lien, version, etat_du, empreinte, empreinte_lecture)
     values ($1, $2, 'qrstuvwxyz', true, '{"titre":"Le marais"}'::jsonb, now(), repeat('a', 32), repeat('b', 32))`,
    [projet, compte.id],
  );
  await aller(page, "/projets");
  await ouvrirMonCompte(page);
  await page.getByRole("button", { name: "Supprimer mon compte" }).click();
  await DIALOGUE(page).getByLabel("Pour confirmer, écrivez votre adresse").fill("pas-la-bonne@exemple.test");
  await DIALOGUE(page).getByRole("button", { name: "Supprimer mon compte" }).click();
  await expect(DIALOGUE(page).getByRole("alert")).toContainText("Ce n’est pas l’adresse du compte : rien n’est supprimé.");
  expect(await sql("select 1 from public.projets where id = $1", [projet])).toHaveLength(1);

  await DIALOGUE(page).getByLabel("Pour confirmer, écrivez votre adresse").fill(compte.courriel.toUpperCase());
  await DIALOGUE(page).getByRole("button", { name: "Supprimer mon compte" }).click();
  await expect(page).toHaveURL(/\/entree\?compte=supprime$/);
  await expect(page.getByRole("status").filter({ hasText: "supprimé" })).toContainText("Votre compte est supprimé, avec tout ce qu’il contenait.");
  expect(await sql("select 1 from auth.users where id = $1", [compte.id])).toHaveLength(0);
  expect(await sql("select 1 from public.projets where id = $1", [projet])).toHaveLength(0);

  const lecteur = await browser.newContext();
  const lire = await lecteur.newPage();
  await lire.goto("/lire/qrstuvwxyz");
  await expect(lire).toHaveTitle("Ce livre n’est plus partagé");
  await lecteur.close();

  await connecter(page, compte);
  await expect(page.getByRole("alert").filter({ hasText: "n’est pas le bon" })).toBeVisible();
});

test("F14-AC27 — supprimer une classe passée : ses élèves s'effacent, la scène d'Alice reste à son prénom, la page des auteurs ne change pas ; une classe en cours ne le propose pas", async ({ page }) => {
  const { compte, base } = await adultePret(page);
  const classe = await creerClasse(page, "CM1");
  await inscrire(page, classe.id, ["Alice Martin", "Bilal Durand"]);
  const projet = await semerProjet(base, compte, "classe", "choix", "Le marais", classe.id);
  const { chapitres } = await semerPartie(base, projet, "La traversée", [{ titre: "Le dernier bac", scenes: ["Le départ"] }]);
  const [{ id: alice }] = await sql<{ id: string }>("select e.id from public.eleves e join public.inscriptions i on i.eleve_id = e.id where i.classe_id = $1 and e.prenom = 'Alice'", [classe.id]);
  await semerAttribution(base, chapitres[0].id, [{ eleve: alice }]);
  await sql("update public.scenes set prise_par_eleve = $2, etat = 'prete' where id = $1", [chapitres[0].scenes[0], alice]);

  // En cours : rien ne propose de la supprimer avec ses élèves
  await aller(page, `/classes/${classe.id}`);
  await expect(page.getByRole("button", { name: "Supprimer la classe" })).toHaveCount(0);

  await sql("update public.classes set terminee_le = now() where id = $1", [classe.id]);
  await aller(page, `/classes/${classe.id}`);
  await page.getByRole("button", { name: "Supprimer la classe" }).click();
  await expect(DIALOGUE(page)).toContainText("Leurs textes restent dans les projets, signés de leur prénom ; les livres ne changent pas.");
  await DIALOGUE(page).getByRole("button", { name: "Supprimer la classe" }).click();
  await expect(page).toHaveURL(/\/classes/);
  await expect(page.getByText("CM1", { exact: true })).toHaveCount(0);

  expect(await sql("select 1 from public.inscriptions where classe_id = $1", [classe.id])).toHaveLength(0);
  expect(await sql("select prenom, nom from public.eleves where id = $1", [alice])).toEqual([{ prenom: "Alice", nom: null }]);
  // La page des auteurs est figée, avec les prénoms
  const [{ pages }] = await sql<{ pages: { auteurs?: { texte?: unknown } } }>("select pages_du_livre as pages from public.projets where id = $1", [projet]);
  expect(JSON.stringify(pages.auteurs)).toContain("Alice");
  expect(JSON.stringify(pages.auteurs)).toContain("Bilal");
  // La scène reste à Alice
  await aller(page, `/projet/${projet}/chapitre/${chapitres[0].id}`);
  await expect(page.locator(".fiches")).toContainText("Alice");
});

test("F14-AC28 — la corbeille : « Supprimer pour de bon » une scène, puis « Vider la corbeille », chacun après confirmation", async ({ page }) => {
  const { compte, base } = await adultePret(page);
  const projet = await semerProjet(base, compte, "personnel", "choix", "Le marais", null);
  const { chapitres } = await semerPartie(base, projet, "La traversée", [
    { titre: "Le dernier bac", scenes: ["Le départ", "La brume", "Le passeur"] },
    { titre: "Le gué", scenes: ["La rive"] },
  ]);
  const [depart, brume, passeur] = chapitres[0].scenes;
  for (const [sorte, id] of [["scene", brume], ["scene", passeur], ["chapitre", chapitres[1].id]] as const) {
    await base.rpc("supprimer_element", { p_sorte: sorte, p_id: id });
  }
  await aller(page, `/projet/${projet}/plan`);
  await page.getByRole("button", { name: /Corbeille du projet/ }).click();
  await page.getByRole("button", { name: /Supprimer pour de bon S002/ }).click();
  await expect(DIALOGUE(page).getByRole("heading")).toContainText("Supprimer pour de bon");
  await expect(DIALOGUE(page)).toContainText("On ne pourra plus la restaurer.");
  await DIALOGUE(page).getByRole("button", { name: "Supprimer pour de bon" }).click();
  await expect(page.locator(".message")).toContainText("est supprimé pour de bon");
  expect(await sql("select 1 from public.scenes where id = $1", [brume])).toHaveLength(0);

  await page.getByRole("button", { name: "Vider la corbeille" }).click();
  await DIALOGUE(page).getByRole("button", { name: "Vider la corbeille" }).click();
  await expect(page.locator(".message")).toContainText("La corbeille est vide.");
  expect(await sql("select 1 from public.scenes where id = $1", [passeur])).toHaveLength(0);
  expect(await sql("select 1 from public.chapitres where id = $1", [chapitres[1].id])).toHaveLength(0);
  expect(await sql("select 1 from public.scenes where id = $1", [depart])).toHaveLength(1);
});

test("F14-AC29 — la tournée des comptes inactifs ne répond qu'au cron, porteur de son secret", async ({ request }) => {
  expect((await request.get("/taches/comptes-inactifs")).status()).toBe(401);
  expect((await request.get("/taches/comptes-inactifs", { headers: { authorization: "Bearer pas-le-bon" } })).status()).toBe(401);
});

test("F14-AC42 — supprimer un projet depuis ses réglages, en retapant son titre : un titre mal tapé n'efface rien ; le bon efface le projet, ses images, son partage et son pass, et la classe reste", async ({ page, browser }) => {
  const { compte, base } = await adultePret(page);
  const classe = await semerClasse(base, "CM1", ["Alice"]);
  const projet = await semerProjet(base, compte, "classe", "choix", "Le marais", classe.id);
  await semerProjet(base, compte, "personnel", "choix", "La forêt", null);
  await semerPartie(base, projet, "La traversée", [{ titre: "Le dernier bac", scenes: ["Le départ"] }]);
  await semerImageDeposee(base, compte, projet);
  await sql("select public.donner_le_pass($1, 'achat')", [projet]);
  await sql(
    `insert into public.partages (projet_id, enseignant_id, code, par_lien, version, etat_du, empreinte, empreinte_lecture)
     values ($1, $2, 'zyxwvutsrq', true, '{"titre":"Le marais"}'::jsonb, now(), repeat('a', 32), repeat('b', 32))`,
    [projet, compte.id],
  );
  const fichiers = () => sql("select 1 from storage.objects where bucket_id = 'images' and name like $1", [`${compte.id}/${projet}/%`]);
  expect(await fichiers()).toHaveLength(2);

  await aller(page, `/projet/${projet}/plan`);
  await page.getByRole("button", { name: "Réglages du projet" }).click();
  await page.getByRole("button", { name: "Supprimer le projet" }).click();
  await expect(DIALOGUE(page).getByRole("heading", { name: "Supprimer ce projet ?" })).toBeVisible();
  await expect(DIALOGUE(page)).toContainText("« Le marais » est effacé aussitôt, sans retour : ses scènes, ses images et ses PDF.");
  await expect(DIALOGUE(page)).toContainText("Son pass du livre disparaît avec lui.");
  await expect(DIALOGUE(page)).toContainText("La classe et ses élèves restent, dans « Mes classes ».");
  await DIALOGUE(page).getByLabel("Pour confirmer, écrivez le titre du projet").fill("Le marécage");
  await DIALOGUE(page).getByRole("button", { name: "Supprimer le projet" }).click();
  await expect(DIALOGUE(page).getByRole("alert")).toContainText("Ce n’est pas le titre du projet : rien n’est supprimé.");
  expect(await sql("select 1 from public.projets where id = $1", [projet])).toHaveLength(1);

  // La casse et les espaces en trop ne comptent pas
  await DIALOGUE(page).getByLabel("Pour confirmer, écrivez le titre du projet").fill("  le  marais ");
  await DIALOGUE(page).getByRole("button", { name: "Supprimer le projet" }).click();
  await expect(page).toHaveURL(/\/projets$/);
  await expect(page.locator(".message")).toContainText("Le projet est supprimé.");
  await expect(page.getByText("Le marais", { exact: true })).toHaveCount(0);
  await expect(page.getByText("La forêt", { exact: true })).toBeVisible();
  expect(await sql("select 1 from public.projets where id = $1", [projet])).toHaveLength(0);
  expect(await sql("select 1 from public.images where projet_id = $1", [projet])).toHaveLength(0);
  expect(await sql("select 1 from public.passes where projet_id = $1", [projet])).toHaveLength(0);
  expect(await fichiers()).toHaveLength(0);
  expect(await sql("select 1 from public.inscriptions where classe_id = $1", [classe.id])).toHaveLength(1);

  const lecteur = await browser.newContext();
  const lire = await lecteur.newPage();
  await lire.goto("/lire/zyxwvutsrq");
  await expect(lire).toHaveTitle("Ce livre n’est plus partagé");
  await lecteur.close();
});
