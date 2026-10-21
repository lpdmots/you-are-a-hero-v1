import { expect, test, type Page } from "@playwright/test";
import { adresseDEssai, aller, choixAuto, connecter, courrielRecu, recit, retenirCompte, semerBlocs, semerPartie, sql, supprimerComptes } from "./outils";
import { createClient } from "@supabase/supabase-js";

/**
 * Étape 9, lot 10 : l'essai de bout en bout de l'ouverture (plan, « Terminée quand »), joué en
 * local avec un compte neuf : il s'inscrit par adresse et reçoit son courriel, écrit un petit
 * livre personnel, use ses étoiles jusqu'au message, en reçoit de l'administration, partage le
 * livre, dont la mention mène à l'accueil ; puis, « Paiement ouvert » allumé, il est bloqué à
 * 40 scènes, achète le pass et une recharge (Stripe simulé) ; enfin il supprime son compte, et
 * tout est effacé. Le PDF, la connexion par Google et la sauvegarde de la nuit s'essaient en
 * ligne, par le porteur.
 */

let avant: { paiement_ouvert: boolean };
test.beforeAll(async () => {
  [avant] = await sql<{ paiement_ouvert: boolean }>("select paiement_ouvert from public.reglages_application");
});
test.afterEach(async () => {
  await sql("update public.reglages_application set paiement_ouvert = $1", [avant.paiement_ouvert]);
  await sql("delete from public.paiements where enseignant_id is null or enseignant_id in (select id from auth.users where email like 'parcours-%@exemple.test')");
  await supprimerComptes();
});

const DIALOGUE = (page: Page) => page.getByRole("alertdialog");
const MESSAGE = (page: Page) => page.locator(".message");
const solde = async (id: string) => (await sql<{ etoiles: number }>("select etoiles from public.enseignants where id = $1", [id]))[0].etoiles;

test("Étape 9, de bout en bout — s'inscrire, écrire, user ses étoiles, en recevoir, partager ; puis le pass et une recharge ; enfin supprimer son compte", async ({ page, browser }) => {
  test.setTimeout(300_000);

  // ——— S'inscrire par adresse, ouvrir le lien reçu : « Mes projets », vide, et 30 ✦ ———
  const courriel = adresseDEssai();
  const motDePasse = "le-livre-de-la-classe";
  await aller(page, "/");
  await page.getByRole("link", { name: "Créer un compte" }).first().click();
  await page.getByLabel("Adresse électronique").fill(courriel);
  await page.getByLabel(/Mot de passe/).fill(motDePasse);
  await page.getByRole("button", { name: "Créer mon compte" }).click();
  await expect(page.getByRole("status")).toContainText("Un courriel vient de partir");
  const id = (await retenirCompte(courriel))!;
  expect(await solde(id)).toBe(0);
  const recu = await courrielRecu(courriel, "Confirmer votre adresse");
  await page.goto(recu.liens.find((l) => l.includes("token_hash="))!);
  await expect(page).toHaveURL(/\/projets$/);
  expect(await solde(id)).toBe(30);

  // ——— Un petit livre personnel, à choix ———
  await page.getByRole("link", { name: "Créer mon premier projet" }).click();
  await page.getByRole("radio", { name: /^Moi/ }).check({ force: true });
  await page.getByRole("button", { name: "Continuer" }).click();
  await page.getByRole("radio", { name: /^À choix/ }).check({ force: true });
  await page.getByRole("button", { name: "Continuer" }).click();
  await page.getByLabel("Titre du projet").fill("Le phare de minuit");
  await page.getByRole("button", { name: "Créer le projet" }).click();
  await page.waitForURL(/\/projet\/[0-9a-f-]{36}\/preparation/);
  const projet = page.url().match(/\/projet\/([0-9a-f-]{36})\//)![1];
  const base = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_CLE_PUBLIABLE!, { auth: { persistSession: false } });
  await base.auth.signInWithPassword({ email: courriel, password: motDePasse });
  const { chapitres } = await semerPartie(base, projet, "La côte", [{ titre: "La falaise", scenes: ["La plage", "Le phare", "Le retour"] }]);
  const [plage, phare, retour] = chapitres[0].scenes;
  await semerBlocs(base, plage, [recit("La plage au matin."), choixAuto("Monter au phare", phare), choixAuto("Rentrer", retour)]);
  await semerBlocs(base, phare, [recit("La lanterne s’allume.")]);
  await semerBlocs(base, retour, [recit("Tu rentres chez toi.")]);
  await base.from("projets").update({ depart_scene_id: plage }).eq("id", projet);
  await base.from("scenes").update({ fin: true }).in("id", [phare, retour]);

  // ——— User ses étoiles jusqu'au message (le fournisseur simulé ne coûte rien : le solde est usé à la main) ———
  await sql("insert into public.mouvements_etoiles (enseignant_id, nombre, motif, note) values ($1, -30, 'aide', 'essai')", [id]);
  await aller(page, `/projet/${projet}/scene/${plage}`);
  await page.getByRole("button", { name: "Proposer des titres" }).click();
  await expect(MESSAGE(page)).toContainText("Vous n'avez plus d'étoiles. Tout le reste fonctionne.");

  // ——— Le porteur lui offre 100 ✦ depuis l'administration ———
  const porteur = await browser.newContext();
  const pagePorteur = await porteur.newPage();
  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_CLE_SECRETE!, { auth: { persistSession: false } });
  const courrielPorteur = adresseDEssai();
  const cree = await admin.auth.admin.createUser({ email: courrielPorteur, password: "le-porteur-du-projet", email_confirm: true });
  await retenirCompte(courrielPorteur);
  await sql("update public.enseignants set createur = true where id = $1", [cree.data.user!.id]);
  await connecter(pagePorteur, { id: cree.data.user!.id, courriel: courrielPorteur, motDePasse: "le-porteur-du-projet" });
  await pagePorteur.waitForURL(/\/projets$/);
  await aller(pagePorteur, `/admin/compte/${id}`);
  await pagePorteur.getByLabel("Étoiles", { exact: true }).fill("100");
  await pagePorteur.getByRole("button", { name: "Offrir ces étoiles" }).click();
  await expect(pagePorteur.getByRole("status").filter({ hasText: "offert" })).toBeVisible();
  expect(await solde(id)).toBe(100);
  await aller(page, `/projet/${projet}/scene/${plage}`);
  await page.getByRole("button", { name: "Proposer des titres" }).click();
  await expect(page.getByRole("group", { name: "Titres proposés" })).toBeVisible();

  // ——— Partager le livre ; sa mention mène à l'accueil ———
  await sql("update scenes set etat = 'prete' where projet_id = $1", [projet]);
  await sql(
    "update projets set mise_en_page_ouverte_le = now(), livre_relu_le = now(), chemins_verifies_le = now(), mise_en_page_convient_le = now(), imprimer_ouvert_le = now() where id = $1",
    [projet],
  );
  await aller(page, `/projet/${projet}/livre?etape=sortie&volet=partager`);
  await page.locator("label.inter", { has: page.getByRole("switch", { name: "Par un lien" }) }).click();
  const rappel = page.getByRole("group", { name: "À relire avant de partager" });
  await rappel.getByText("J’ai relu le livre sur ces points.").click();
  await rappel.getByRole("button", { name: "Partager" }).click();
  const lien = await page.getByRole("textbox", { name: "Lien de lecture" }).inputValue();
  const lecteur = await browser.newContext();
  const lire = await lecteur.newPage();
  await lire.goto(new URL(lien).pathname);
  await lire.getByRole("link", { name: "Écrit avec Il était une classe" }).click();
  await expect(lire.getByRole("heading", { level: 1, name: "Il était une classe" })).toBeVisible();
  await lecteur.close();

  // ——— « Paiement ouvert » allumé par le porteur : à 40 scènes, le dialogue du pass ———
  await aller(pagePorteur, "/admin");
  await pagePorteur.getByRole("button", { name: "Allumer" }).click();
  await expect(pagePorteur.getByText("allumé")).toBeVisible();
  await semerPartie(base, projet, "La mer", [{ titre: "Le large", scenes: Array.from({ length: 37 }, (_, i) => `Vague ${i + 1}`) }]);
  await aller(page, `/projet/${projet}/chapitre/${chapitres[0].id}`);
  await page.getByRole("button", { name: "Ajouter une scène" }).click();
  await expect(DIALOGUE(page).getByRole("heading", { name: "Ce livre a atteint ses 40 scènes gratuites" })).toBeVisible();

  // ——— Le pass, payé : les limites sautent, ses étoiles arrivent ———
  const avantPass = await solde(id);
  await DIALOGUE(page).getByRole("button", { name: /Acheter le pass/ }).click();
  await page.getByLabel("Je demande l’accès immédiat et renonce à mon droit de rétractation.").check();
  await page.getByRole("button", { name: "Payer" }).click();
  await expect(DIALOGUE(page).getByRole("heading", { name: "Merci ! Votre livre a son pass" })).toBeVisible();
  await DIALOGUE(page).getByRole("button", { name: "Continuer l’écriture" }).click();
  expect(await solde(id)).toBe(avantPass + 400);
  await aller(page, `/projet/${projet}/chapitre/${chapitres[0].id}`);
  await page.getByRole("button", { name: "Ajouter une scène" }).click();
  await expect(MESSAGE(page)).toContainText("est ajoutée à la fin du chapitre");

  // ——— Une recharge, depuis « Mon compte » ———
  await aller(page, "/projets");
  await page.locator("header button[aria-haspopup='dialog']").first().click();
  await page.getByRole("button", { name: /Recharger/ }).click();
  await page.getByLabel("Je demande l’accès immédiat et renonce à mon droit de rétractation.").check();
  await page.getByRole("button", { name: "Payer" }).click();
  await expect(MESSAGE(page)).toContainText("Vos étoiles sont arrivées.");
  expect(await solde(id)).toBe(avantPass + 500);
  expect((await sql<{ n: number }>("select count(*)::int as n from public.paiements where enseignant_id = $1", [id]))[0].n).toBe(2);
  await porteur.close();

  // ——— Supprimer son compte : tout est effacé, la vente reste sans nom ———
  await page.locator("header button[aria-haspopup='dialog']").first().click();
  await page.getByRole("button", { name: "Supprimer mon compte" }).click();
  await DIALOGUE(page).getByLabel("Pour confirmer, écrivez votre adresse").fill(courriel);
  await DIALOGUE(page).getByRole("button", { name: "Supprimer mon compte" }).click();
  await expect(page).toHaveURL(/\/entree\?compte=supprime$/);
  expect(await sql("select 1 from auth.users where id = $1", [id])).toHaveLength(0);
  expect(await sql("select 1 from public.projets where id = $1", [projet])).toHaveLength(0);
  expect((await sql<{ n: number }>("select count(*)::int as n from public.paiements where projet_id = $1 and enseignant_id is null", [projet]))[0].n).toBe(1);
  const neutre = await browser.newContext();
  const apres = await neutre.newPage();
  await apres.goto(new URL(lien).pathname);
  await expect(apres).toHaveTitle("Ce livre n’est plus partagé");
  await neutre.close();
});
