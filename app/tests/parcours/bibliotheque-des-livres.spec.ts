import { expect, test, type Browser, type Page } from "@playwright/test";
import type { SupabaseClient } from "@supabase/supabase-js";
import { adultePret, aller, choixAuto, courrielRecu, recit, semerBlocs, semerPartie, semerProjet, sql, supprimerComptes, type Compte } from "./outils";

/**
 * Bibliothèque publique des livres (F15), de l'écran : proposer depuis « Imprimer et partager »,
 * la relecture par l'IA (simulée), la file « Bibliothèque » de l'administration, « Publier » et
 * « Refuser » avec leurs courriels, et ce que l'étape en dit à l'adulte.
 */

test.afterEach(async () => {
  await supprimerComptes();
});

type Livre = { compte: Compte; base: SupabaseClient; projet: string; s: string[] };

/** « La lanterne du passeur », de M. Bernard, en mode personnel : deux passages, tout prêt. */
async function lanterne(page: Page, titre = "La lanterne du passeur"): Promise<Livre> {
  const { compte, base } = await adultePret(page);
  const projet = await semerProjet(base, compte, "personnel", "choix", titre);
  const { chapitres } = await semerPartie(base, projet, "Le fleuve", [{ titre: "Le quai", scenes: ["Le quai", "La rive"] }]);
  const s = chapitres[0].scenes;
  await base.from("projets").update({ depart_scene_id: s[0] }).eq("id", projet);
  await semerBlocs(base, s[0], [recit("La brume s’épaissi sur le fleuve."), choixAuto("Suivre le passeur", s[1])]);
  await semerBlocs(base, s[1], [recit("« La maîtresse Mme Dupont est bête et grosse », ricane le passeur. La lanterne s’allume.")]);
  await base.from("scenes").update({ fin: true }).eq("id", s[1]);
  await sql("update scenes set etat = 'prete' where projet_id = $1", [projet]);
  await sql(
    "update projets set mise_en_page_ouverte_le = now(), livre_relu_le = now(), chemins_verifies_le = now(), mise_en_page_convient_le = now(), imprimer_ouvert_le = now() where id = $1",
    [projet],
  );
  return { compte, base, projet, s };
}

async function proposer(page: Page, projet: string) {
  await aller(page, `/projet/${projet}/livre?etape=sortie&volet=partager`);
  await page.getByRole("button", { name: /^Proposer (à la bibliothèque|de nouveau)…$/ }).click();
  const panneau = page.getByRole("group", { name: "Proposer à la bibliothèque" });
  await panneau.getByLabel("Présentation").fill("Au bord du fleuve, la brume ne se lève plus. Tu suis le passeur vers l’autre rive.");
  await panneau.getByText("Je suis l’auteur de ce livre").click();
  await panneau.getByRole("button", { name: /^Proposer/ }).click();
  await expect(page.getByText(/En attente de relecture depuis le/)).toBeVisible();
}

/** Le porteur, dans un autre navigateur : un compte d'essai marqué « createur » le temps du test. */
async function porteur(browser: Browser): Promise<Page> {
  const page = await (await browser.newContext()).newPage();
  const { compte } = await adultePret(page);
  await sql("update public.enseignants set createur = true where id = $1", [compte.id]);
  return page;
}

/** La file, une fois le rapport arrivé : l'IA relit après la réponse de « Proposer ». */
async function fileAvecRapport(page: Page, titre: string) {
  await expect(async () => {
    await aller(page, "/admin/livres");
    await expect(page.getByRole("article", { name: titre }).getByRole("region", { name: "Rapport de l’IA" })).not.toContainText("Analyse en cours");
  }).toPass({ timeout: 30_000 });
  return page.getByRole("article", { name: titre });
}

test("F15-AC03, F15-AC04 — le rapport cite le passage en cause ; publié, le livre a son adresse, l'adulte reçoit un courriel et l'étape le dit", async ({ page, browser }) => {
  const l = await lanterne(page);
  await proposer(page, l.projet);
  const admin = await porteur(browser);
  await aller(admin, "/admin");
  await expect(admin.getByRole("link", { name: /\d+ livres? à relire/ })).toBeVisible();

  const livre = await fileAvecRapport(admin, "La lanterne du passeur");
  const rapport = livre.getByRole("region", { name: "Rapport de l’IA" });
  await expect(rapport.getByRole("link", { name: "Passage 2" })).toHaveAttribute("href", `/admin/livres/${l.projet}/lire?passage=${l.s[1]}`);
  await expect(rapport).toContainText("Moquerie d’une personne réelle");
  await expect(rapport).toContainText("Mme Dupont est bête et grosse");
  await expect(rapport).not.toContainText(l.compte.courriel);

  // Le point ouvre son passage dans le lecteur
  await aller(admin, `/admin/livres/${l.projet}/lire?passage=${l.s[1]}`);
  await expect(admin.locator(".lecteur__corps")).toContainText("Mme Dupont");

  await aller(admin, "/admin/livres");
  await admin.getByRole("article", { name: "La lanterne du passeur" }).getByRole("button", { name: "Publier" }).click();
  await expect(admin.getByRole("status").filter({ hasText: /\S/ })).toContainText("Le livre est publié");
  const [{ adresse }] = await sql<{ adresse: string }>("select adresse from publications where projet_id = $1", [l.projet]);
  expect(adresse).toMatch(/^la-lanterne-du-passeur(-\d+)?$/);

  const recu = await courrielRecu(l.compte.courriel, "est dans la bibliothèque");
  expect(recu.sujet).toBe("« La lanterne du passeur » est dans la bibliothèque — Il était une classe");
  await aller(page, `/projet/${l.projet}/livre?etape=sortie&volet=partager`);
  await expect(page.getByText(/Publié, version du/)).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Adresse du livre dans la bibliothèque" })).toHaveValue(new RegExp(`/bibliotheque/${adresse}$`));

});

test("F15-AC05 — refuser avec une phrase prête et une phrase de sa main : l'adulte reçoit le motif, le lit dans l'étape et propose de nouveau", async ({ page, browser }) => {
  const l = await lanterne(page, "Le gué des saules");
  await proposer(page, l.projet);
  const admin = await porteur(browser);
  const livre = await fileAvecRapport(admin, "Le gué des saules");
  await livre.getByText("Refuser…").click();
  await livre.getByLabel("Contenu inadapté à l’âge des lecteurs.").check();
  await livre.getByLabel("Précision de votre main").fill("Le passage 2 se moque d’une enseignante réelle.");
  await livre.getByRole("button", { name: "Refuser et envoyer le motif" }).click();
  await expect(admin.getByRole("status").filter({ hasText: /\S/ })).toContainText("La proposition est refusée");

  const recu = await courrielRecu(l.compte.courriel, "n’est pas publié");
  expect(recu.sujet).toBe("« Le gué des saules » n’est pas publié — Il était une classe");
  await aller(page, `/projet/${l.projet}/livre?etape=sortie&volet=partager`);
  const refus = page.getByRole("group", { name: "Refusé" });
  await expect(refus).toContainText("Contenu inadapté à l’âge des lecteurs. Le passage 2 se moque d’une enseignante réelle.");
  await proposer(page, l.projet);
});
