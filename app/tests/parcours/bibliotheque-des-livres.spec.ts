import { expect, test, type Browser, type Page } from "@playwright/test";
import type { SupabaseClient } from "@supabase/supabase-js";
import { adultePret, aller, choixAuto, classeQuiEcrit, courrielRecu, posteDe, recit, semerBlocs, semerPartie, semerProjet, sql, supprimerComptes, type Compte } from "./outils";

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

  // Le public le lit, sans compte, depuis son tiroir (F15-AC04, AC06)
  const lecteur = await (await browser.newContext()).newPage();
  await lecteur.goto(`/bibliotheque/${adresse}`);
  await lecteur.getByRole("link", { name: "Lire le livre" }).click();
  await lecteur.getByRole("button", { name: "Commencer la lecture" }).click();
  await expect(lecteur.locator(".lecteur__corps")).toContainText("La brume s’épaissi sur le fleuve.");
  await expect(lecteur.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
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

/** Trois livres publiés sans passer par l'écran : une version réduite au titre et à son récit. */
async function publierVite(compte: Compte, base: SupabaseClient, titre: string, x: { age: string; choix: boolean; presentation: string; le: string }): Promise<string> {
  const projet = await semerProjet(base, compte, "personnel", x.choix ? "choix" : "classique", titre);
  const adresse = `${titre.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "").replace(/[^a-z0-9]+/g, "-")}-${Date.now().toString(36)}`;
  await sql(
    `insert into publications (projet_id, enseignant_id, adresse, version, presentation, age, empreinte, publiee_le, mise_a_jour_le)
     values ($1, $2, $3, jsonb_build_object('titre', $4::text, 'aChoix', $5::boolean, 'passages', '[]'::jsonb, 'images', '{}'::jsonb), $6, $7, repeat('a', 32), $8, $8)`,
    [projet, compte.id, adresse, titre, x.choix, x.presentation, x.age, x.le],
  );
  return adresse;
}

test("F15-AC11, F15-AC12 — la liste, ses filtres et sa recherche ; l'adresse d'un livre ouvre son tiroir, hors des moteurs", async ({ page }) => {
  const { compte, base } = await adultePret(page);
  const marque = Date.now().toString(36);
  await publierVite(compte, base, `Lanterne ${marque}`, { age: "8-10", choix: true, presentation: "Le passeur de brume attend sur le quai.", le: "2026-11-02T10:00:00Z" });
  await publierVite(compte, base, `Voyage ${marque}`, { age: "6-8", choix: false, presentation: "Une longue route.", le: "2026-11-05T10:00:00Z" });
  const nick = await publierVite(compte, base, `Nick ${marque}`, { age: "8-10", choix: true, presentation: "Une panne géante.", le: "2026-11-09T10:00:00Z" });

  await aller(page, `/bibliotheque?q=${marque}`);
  const titres = page.locator("ul li a span:nth-child(2)");
  await expect(titres).toHaveText([`Nick ${marque}`, `Voyage ${marque}`, `Lanterne ${marque}`]);
  await page.getByLabel("Âge des lecteurs").selectOption("8-10");
  await page.getByLabel("Type de récit").selectOption("choix");
  await expect(titres).toHaveText([`Nick ${marque}`, `Lanterne ${marque}`]);
  await page.getByRole("searchbox", { name: "Chercher un livre" }).fill(`passeur de brume ${marque}`);
  await expect(titres).toHaveText([`Lanterne ${marque}`]);
  await expect(page).toHaveURL(/age=8-10/);

  // L'adresse d'un livre : la bibliothèque, son tiroir ouvert, « noindex »
  await aller(page, `/bibliotheque/${nick}`);
  const tiroir = page.getByRole("dialog", { name: `Nick ${marque}` });
  await expect(tiroir).toContainText("Une panne géante.");
  await expect(tiroir.getByRole("link", { name: "Lire le livre" })).toHaveAttribute("href", `/lire/bibliotheque/${nick}`);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  await page.keyboard.press("Escape");
  await expect(page).toHaveURL(/\/bibliotheque$/);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /^index/);

  // Une adresse inconnue : la page neutre, sans titre ni nom
  await aller(page, "/bibliotheque/un-livre-qui-n-existe-pas");
  await expect(page.getByText("Ce livre n’est plus dans la bibliothèque.")).toBeVisible();
});

/** Publier sans passer par la file : la proposition devient la version publiée, comme « Publier ». */
async function publierLaProposition(projet: string): Promise<string> {
  const adresse = `lanterne-${Date.now().toString(36)}`;
  await sql(
    `update publications set adresse = $2, version = proposee, presentation = presentation_proposee, age = age_propose, empreinte = empreinte_proposee,
       publiee_le = now(), mise_a_jour_le = now(), proposee = null, presentation_proposee = null, age_propose = null, empreinte_proposee = null, proposee_le = null, attestation = null
     where projet_id = $1`,
    [projet, adresse],
  );
  return adresse;
}

test("F15-AC13 — un cœur dans le tiroir et après la fin, jamais pendant la lecture ; un clic donne, un second retire ; à zéro, le cœur vide sans « 0 »", async ({ page, browser }) => {
  const marque = Date.now().toString(36);
  const l = await lanterne(page, `La lanterne ${marque}`);
  await proposer(page, l.projet);
  const adresse = await publierLaProposition(l.projet);

  const lecteur = await (await browser.newContext()).newPage();
  await lecteur.goto(`/bibliotheque/${adresse}`);
  const coeur = lecteur.getByRole("dialog").getByRole("button", { name: "Donner un cœur à ce livre" });
  await expect(coeur).toHaveAttribute("aria-pressed", "false");
  await expect(coeur).toHaveText("");
  await coeur.click();
  const donne = lecteur.getByRole("dialog").getByRole("button", { name: "Retirer mon cœur" });
  await expect(donne).toHaveText("1");
  await expect.poll(async () => (await sql<{ c: number }>("select coeurs as c from publications where projet_id = $1", [l.projet]))[0].c).toBe(1);
  // Le même navigateur ne compte pas deux fois : rechargé, le cœur est donné, toujours 1
  await lecteur.reload();
  await expect(donne).toHaveAttribute("aria-pressed", "true");
  await expect(donne).toHaveText("1");
  await donne.click();
  await expect(coeur).toHaveText("");
  // Le bouton change aussitôt ; la base suit la réponse du serveur
  await expect.poll(async () => (await sql<{ c: number }>("select coeurs as c from publications where projet_id = $1", [l.projet]))[0].c).toBe(0);

  // Dans le lecteur : rien pendant la lecture, la question après la fin
  await lecteur.goto(`/lire/bibliotheque/${adresse}`);
  await lecteur.getByRole("button", { name: "Commencer la lecture" }).click();
  await expect(lecteur.getByText("Ce livre t’a plu ?")).toHaveCount(0);
  await lecteur.locator(".lecteur__corps").getByRole("button", { name: /Suivre le passeur/ }).click();
  await expect(lecteur.getByText("Ce livre t’a plu ?")).toBeVisible();
  await lecteur.getByRole("button", { name: "Donner un cœur à ce livre" }).click();
  await expect(lecteur.getByRole("button", { name: "Retirer mon cœur" })).toHaveText("1");

  // La carte le dit, et « Les plus aimés » le range
  await lecteur.goto(`/bibliotheque?q=${marque}&tri=aimes`);
  await expect(lecteur.getByRole("link", { name: /La lanterne/ })).toContainText("1");
});

test("F15-AC09 — retiré par l'adulte : son adresse dit « Ce livre n'est plus dans la bibliothèque » ; proposé de nouveau et publié, il retrouve son adresse et ses cœurs", async ({ page }) => {
  const marque = Date.now().toString(36);
  const l = await lanterne(page, `La lanterne ${marque}`);
  await proposer(page, l.projet);
  const adresse = await publierLaProposition(l.projet);
  await sql("insert into coeurs (projet_id, lecteur, reseau) select $1, 'n:parcours-' || g, 'r:parcours-local' from generate_series(1, 12) g", [l.projet]);

  await aller(page, `/projet/${l.projet}/livre?etape=sortie&volet=partager`);
  await page.getByRole("button", { name: "Retirer de la bibliothèque…" }).click();
  const confirmer = page.getByRole("group", { name: "Retirer le livre de la bibliothèque ?" });
  await expect(confirmer).toContainText("il retrouvera son adresse et ses cœurs");
  await confirmer.getByRole("button", { name: "Retirer de la bibliothèque" }).click();
  await expect(page.getByText(/par vous, le/)).toBeVisible();

  const visiteur = page.context().browser()!;
  const autre = await (await visiteur.newContext()).newPage();
  await autre.goto(`/bibliotheque/${adresse}`);
  await expect(autre.getByText("Ce livre n’est plus dans la bibliothèque.")).toBeVisible();
  await expect(autre.locator("body")).not.toContainText("La lanterne");
  await autre.goto(`/bibliotheque?q=${marque}`);
  await expect(autre.getByText("Aucun livre ne correspond.")).toBeVisible();

  // Proposé de nouveau, puis publié par le porteur : la même adresse, les mêmes cœurs
  await proposer(page, l.projet);
  await sql(
    `update publications set version = proposee, presentation = presentation_proposee, age = age_propose, empreinte = empreinte_proposee, publiee_le = now(), mise_a_jour_le = now(),
       proposee = null, presentation_proposee = null, age_propose = null, empreinte_proposee = null, proposee_le = null, attestation = null, retiree_le = null, retrait_par = null
     where projet_id = $1`,
    [l.projet],
  );
  await autre.goto(`/bibliotheque/${adresse}`);
  await expect(autre.getByRole("dialog").getByRole("button", { name: "Donner un cœur à ce livre" })).toHaveText("12");
});

test("F15-AC14, F15-AC10 — signaler depuis le tiroir : un accusé de réception, « 1 signalement » chez le porteur, le livre reste publié ; retiré par lui avec un motif, l'adulte le reçoit", async ({ page, browser }) => {
  const marque = Date.now().toString(36);
  const l = await lanterne(page, `La lanterne ${marque}`);
  await proposer(page, l.projet);
  const adresse = await publierLaProposition(l.projet);

  const parent = await (await browser.newContext()).newPage();
  await parent.goto(`/bibliotheque/${adresse}`);
  await parent.getByRole("button", { name: "Signaler ce livre" }).click();
  const formulaire = parent.getByRole("form", { name: "Signaler ce livre" });
  await formulaire.getByLabel("Haine ou insultes").check();
  await formulaire.getByLabel("Numéro du passage (facultatif)").fill("2");
  await formulaire.getByLabel("Ce qui pose problème").fill("Le passage 2 se moque d’une enseignante.");
  const courriel = `parent-${marque}@exemple.test`;
  await formulaire.getByLabel("Votre adresse électronique, pour la réponse").fill(courriel);
  await formulaire.getByRole("button", { name: "Envoyer le signalement" }).click();
  await expect(parent.getByRole("status")).toContainText("Votre signalement est envoyé");
  expect((await courrielRecu(courriel, "signalement est reçu")).sujet).toBe("Votre signalement est reçu — Il était une classe");
  await parent.goto(`/bibliotheque/${adresse}`);
  await expect(parent.getByRole("dialog")).toContainText(`La lanterne ${marque}`);

  const admin = await porteur(browser);
  await aller(admin, "/admin");
  await expect(admin.getByRole("link", { name: /\d+ signalements?/ })).toBeVisible();
  await aller(admin, "/admin/livres");
  const signale = admin.getByRole("article", { name: `Signalement de « La lanterne ${marque} »` });
  await expect(signale).toContainText("Haine ou insultes");
  await expect(signale).toContainText("passage 2");
  await signale.getByText("Retirer de la bibliothèque…").click();
  await signale.getByLabel("Motif, envoyé à l’adulte").fill("Le passage 2 se moque d’une enseignante réelle.");
  await signale.getByRole("button", { name: "Retirer et envoyer le motif" }).click();
  await expect(admin.getByRole("status").filter({ hasText: /\S/ })).toContainText("Le livre a quitté la bibliothèque");

  expect((await courrielRecu(l.compte.courriel, "n’est plus dans la bibliothèque")).sujet).toBe(`« La lanterne ${marque} » n’est plus dans la bibliothèque — Il était une classe`);
  await aller(page, `/projet/${l.projet}/livre?etape=sortie&volet=partager`);
  await expect(page.getByRole("group", { name: "Retiré de la bibliothèque par l’éditeur" })).toContainText("se moque d’une enseignante réelle");
  expect(await sql("select titre from projets where id = $1", [l.projet])).toEqual([{ titre: `La lanterne ${marque}` }]);
});

test("F15-AC20 — dans « Lire », après les livres de l'enseignante, ceux de la bibliothèque de l'âge de la classe ; un cœur par profil ; éteinte dans la classe, la partie disparaît", async ({ page, browser }) => {
  const marque = Date.now().toString(36);
  // Un livre d'un autre adulte, publié pour les 8 à 10 ans
  const autre = await (await browser.newContext()).newPage();
  const l = await lanterne(autre, `La lanterne ${marque}`);
  await proposer(autre, l.projet);
  await publierLaProposition(l.projet);

  const s = await classeQuiEcrit(page);
  const alice = await posteDe(browser, s, "Alice");
  await alice.page.getByRole("navigation", { name: "Espace élève" }).getByRole("link", { name: "Lire", exact: true }).click();
  const rayon = alice.page.getByRole("region", { name: "La bibliothèque" });
  await expect(rayon.getByRole("link", { name: new RegExp(`La lanterne ${marque}`) })).toBeVisible();
  await rayon.getByRole("link", { name: new RegExp(`La lanterne ${marque}`) }).click();
  await alice.page.getByRole("button", { name: "Commencer la lecture" }).click();
  await alice.page.locator(".lecteur__corps").getByRole("button", { name: /Suivre le passeur/ }).click();
  await alice.page.getByRole("button", { name: "Donner un cœur à ce livre" }).click();
  await expect(alice.page.getByRole("button", { name: "Retirer mon cœur" })).toHaveText("1");
  await expect.poll(async () => (await sql<{ lecteur: string }>("select lecteur from coeurs where projet_id = $1", [l.projet])).map((c) => c.lecteur)).toEqual([`e:${s.eleves.Alice.id}`]);

  // Mme Laurent l'éteint dans les réglages de la classe
  await aller(page, `/classes/${s.classe.id}`);
  await page.locator("label.inter", { has: page.getByRole("switch", { name: "La bibliothèque dans « Lire »" }) }).click();
  await expect(page.getByText("Vos élèves ne trouvent que vos livres.")).toBeVisible();
  await alice.page.goto("/travail/lecture");
  await expect(alice.page.getByRole("region", { name: "La bibliothèque" })).toHaveCount(0);
  await alice.contexte.close();
});

test("F15, les livres de l'accueil — un lien de lecture d'avant la bibliothèque mène au livre une fois publié", async ({ page, browser }) => {
  const l = await lanterne(page, `La lanterne ${Date.now().toString(36)}`);
  const code = "pqrstuvwxy".split("").sort(() => Math.random() - 0.5).join("");
  await sql(
    `insert into partages (projet_id, enseignant_id, code, par_lien, version, etat_du, empreinte, empreinte_lecture)
     values ($1, $2, $3, false, null, null, null, null)`,
    [l.projet, l.compte.id, code],
  );
  await proposer(page, l.projet);
  const adresse = await publierLaProposition(l.projet);
  const famille = await (await browser.newContext()).newPage();
  await famille.goto(`/lire/${code}`);
  await expect(famille).toHaveURL(new RegExp(`/bibliotheque/${adresse}$`));
  await expect(famille.getByRole("dialog")).toContainText("La lanterne");
});
