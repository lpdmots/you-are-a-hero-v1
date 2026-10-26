import { expect, test, type Browser, type Page } from "@playwright/test";
import { adultePret, aller, choixAuto, classeQuiEcrit, courrielRecu, posteDe, recit, semerBlocs, semerPartie, semerProjet, sql, supprimerComptes } from "./outils";

/**
 * Bibliothèque publique des livres (F15), de bout en bout : Mme Laurent propose le livre de sa
 * classe ; le porteur lit le rapport de l'IA (simulée) et le publie ; un visiteur le trouve, le lit
 * et lui donne un cœur ; Alice, élève d'une autre classe du même âge, le trouve dans « Lire » ; un
 * parent le signale ; le porteur le retire : il quitte la bibliothèque, l'accueil et « Lire ».
 */

test.afterEach(async () => {
  await supprimerComptes();
});
test.beforeEach(async () => {
  await sql("delete from essais_entree");
});

async function porteur(browser: Browser): Promise<Page> {
  const page = await (await browser.newContext()).newPage();
  const { compte } = await adultePret(page);
  await sql("update public.enseignants set createur = true where id = $1", [compte.id]);
  return page;
}

test("F15 — proposer, relire, publier, lire, aimer, trouver dans « Lire », signaler, retirer", async ({ page, browser }) => {
  test.setTimeout(240_000);
  const marque = Date.now().toString(36);
  const titre = `Le phare ${marque}`;
  const [{ l: accueilAvant }] = await sql<{ l: unknown }>("select livres_de_l_accueil as l from public.reglages_application");
  await sql("update public.reglages_application set livres_de_l_accueil = '[]'");

  // ——— Mme Laurent propose le livre de sa classe ———
  const laurent = await (await browser.newContext()).newPage();
  const { compte, base } = await adultePret(laurent);
  await sql("insert into public.classes (enseignant_id, nom, annee_debut, identifiant) values ($1, 'CM1', 2026, $2)", [compte.id, `bout${marque}`]);
  const projet = await semerProjet(base, compte, "personnel", "choix", titre);
  const { chapitres } = await semerPartie(base, projet, "La côte", [{ titre: "La plage", scenes: ["La plage au matin", "La lanterne"] }]);
  const [depart, fin] = chapitres[0].scenes;
  await base.from("projets").update({ depart_scene_id: depart }).eq("id", projet);
  await semerBlocs(base, depart, [recit("Le phare clignote dans la brume."), choixAuto("Monter au phare", fin)]);
  await semerBlocs(base, fin, [recit("La lanterne s’allume.")]);
  await base.from("scenes").update({ fin: true }).eq("id", fin);
  await sql("update scenes set etat = 'prete' where projet_id = $1", [projet]);
  await sql(
    "update projets set mise_en_page_ouverte_le = now(), livre_relu_le = now(), chemins_verifies_le = now(), mise_en_page_convient_le = now(), imprimer_ouvert_le = now() where id = $1",
    [projet],
  );
  await aller(laurent, `/projet/${projet}/livre?etape=sortie&volet=partager`);
  await laurent.getByRole("button", { name: "Proposer à la bibliothèque…" }).click();
  const panneau = laurent.getByRole("group", { name: "Proposer à la bibliothèque" });
  await panneau.getByRole("button", { name: "Écrire" }).click();
  await expect(panneau.getByLabel("Présentation")).not.toHaveValue("");
  await panneau.getByText("Je suis l’auteur de ce livre").click();
  await panneau.getByRole("button", { name: "Proposer le livre" }).click();
  await expect(laurent.getByText(/En attente de relecture/)).toBeVisible();

  // ——— Le porteur relit et publie ———
  const admin = await porteur(browser);
  await expect(async () => {
    await aller(admin, "/admin/livres");
    await expect(admin.getByRole("article", { name: titre }).getByRole("region", { name: "Rapport de l’IA" })).toContainText("Rien à signaler");
  }).toPass({ timeout: 30_000 });
  await admin.getByRole("article", { name: titre }).getByRole("button", { name: "Publier" }).click();
  await expect(admin.getByRole("status").filter({ hasText: /\S/ })).toContainText("Le livre est publié");
  await courrielRecu(compte.courriel, "est dans la bibliothèque");
  const [{ adresse }] = await sql<{ adresse: string }>("select adresse from publications where projet_id = $1", [projet]);

  // Il va sur l'accueil
  await aller(admin, "/admin");
  await admin.getByRole("region", { name: "Livres de l’accueil" }).getByRole("listitem").filter({ hasText: titre }).getByRole("button", { name: "Mettre sur l’accueil" }).click();

  // ——— Un visiteur le trouve, le lit et l'aime ———
  const visiteur = await (await browser.newContext()).newPage();
  await visiteur.goto(`/bibliotheque?q=${marque}`);
  await visiteur.getByRole("link", { name: new RegExp(titre) }).click();
  await expect(visiteur).toHaveURL(new RegExp(`/bibliotheque/${adresse}`));
  await visiteur.getByRole("dialog").getByRole("link", { name: "Lire le livre" }).click();
  await visiteur.getByRole("button", { name: "Commencer la lecture" }).click();
  await visiteur.locator(".lecteur__corps").getByRole("button", { name: /Monter au phare/ }).click();
  await visiteur.getByRole("button", { name: "Donner un cœur à ce livre" }).click();
  await expect(visiteur.getByRole("button", { name: "Retirer mon cœur" })).toHaveText("1");
  await visiteur.goto("/");
  await expect(visiteur.getByRole("link", { name: new RegExp(`Feuilleter « ${titre} »`) })).toBeVisible();

  // ——— Alice, d'une autre classe du même âge, le trouve dans « Lire » ———
  const s = await classeQuiEcrit(await (await browser.newContext()).newPage());
  const alice = await posteDe(browser, s, "Alice");
  await alice.page.goto("/travail/lecture");
  await expect(alice.page.getByRole("region", { name: "La bibliothèque" }).getByRole("link", { name: new RegExp(titre) })).toBeVisible();

  // ——— Un parent le signale ; le porteur le retire ———
  await visiteur.goto(`/bibliotheque/${adresse}`);
  await visiteur.getByRole("button", { name: "Signaler ce livre" }).click();
  const formulaire = visiteur.getByRole("form", { name: "Signaler ce livre" });
  await formulaire.getByLabel("Vie privée").check();
  await formulaire.getByLabel("Ce qui pose problème").fill("Le nom de famille d’un élève paraît dans le passage 2.");
  await formulaire.getByLabel("Votre adresse électronique, pour la réponse").fill(`parent-${marque}@exemple.test`);
  await formulaire.getByRole("button", { name: "Envoyer le signalement" }).click();
  await expect(visiteur.getByRole("status")).toContainText("Votre signalement est envoyé");

  await aller(admin, "/admin/livres");
  const signale = admin.getByRole("article", { name: `Signalement de « ${titre} »` });
  await signale.getByText("Retirer de la bibliothèque…").click();
  await signale.getByLabel("Motif, envoyé à l’adulte").fill("Un nom de famille d’élève paraît dans le passage 2.");
  await signale.getByRole("button", { name: "Retirer et envoyer le motif" }).click();
  await courrielRecu(compte.courriel, "n’est plus dans la bibliothèque");

  await visiteur.goto(`/bibliotheque/${adresse}`);
  await expect(visiteur.getByText("Ce livre n’est plus dans la bibliothèque.")).toBeVisible();
  await visiteur.goto("/");
  await expect(visiteur.getByRole("link", { name: new RegExp(`Feuilleter « ${titre} »`) })).toHaveCount(0);
  await alice.page.goto("/travail/lecture");
  await expect(alice.page.getByRole("link", { name: new RegExp(titre) })).toHaveCount(0);
  await aller(laurent, `/projet/${projet}/livre?etape=sortie&volet=partager`);
  await expect(laurent.getByRole("group", { name: "Retiré de la bibliothèque par l’éditeur" })).toContainText("passage 2");

  await sql("update public.reglages_application set livres_de_l_accueil = $1", [JSON.stringify(accueilAvant)]);
  await alice.contexte.close();
  void page;
});
