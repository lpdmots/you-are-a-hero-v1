import { expect, test, type Page } from "@playwright/test";
import sharp from "sharp";
import { adultePret, aller, courrielRecu, semerProjet, service, sql, supprimerComptes, type Compte, ouvrirLeMenuDuCompte } from "./outils";

/**
 * Étape 9, lot 6 : l'administration du porteur (F14-AC22 à AC25). Le porteur est un compte
 * d'essai marqué « createur » le temps du test ; M. Bernard, un autre compte d'essai.
 */

let avant: boolean;
let accueil: unknown;
test.beforeAll(async () => {
  [{ p: avant, l: accueil }] = await sql<{ p: boolean; l: unknown }>("select paiement_ouvert as p, livres_de_l_accueil as l from public.reglages_application");
});
test.afterEach(async () => {
  await sql("update public.reglages_application set paiement_ouvert = $1, livres_de_l_accueil = $2", [avant, JSON.stringify(accueil)]);
  await sql("delete from public.paiements where session like 'cs_admin_%'");
  await supprimerComptes();
});

const marquer = (c: Compte) => sql("update public.enseignants set createur = true where id = $1", [c.id]);

/** M. Bernard, avec un projet partagé par lien, puis le porteur connecté dans la page. */
async function deuxComptes(page: Page, browser: import("@playwright/test").Browser) {
  const autre = await browser.newContext();
  const pageBernard = await autre.newPage();
  const bernard = await adultePret(pageBernard);
  const marais = await semerProjet(bernard.base, bernard.compte, "personnel", "choix", "Le marais", null);
  const code = "abcdefghjk".split("").sort(() => Math.random() - 0.5).join("");
  await sql(
    `insert into public.partages (projet_id, enseignant_id, code, par_lien, version, etat_du, empreinte, empreinte_lecture)
     values ($1, $2, $3, true, '{"titre":"Le marais"}'::jsonb, now(), repeat('a', 32), repeat('b', 32))`,
    [marais, bernard.compte.id, code],
  );
  await autre.close();
  const porteur = await adultePret(page);
  await marquer(porteur.compte);
  return { bernard: bernard.compte, marais, code, porteur: porteur.compte, base: porteur.base };
}

test("F14-AC22 — l'administration est refusée à un autre compte, comme une page qui n'existe pas", async ({ page }) => {
  const { compte } = await adultePret(page);
  for (const adresse of ["/admin", `/admin/compte/${compte.id}`]) {
    const reponse = await page.goto(adresse);
    expect(reponse?.status()).toBe(404);
    await expect(page.getByRole("heading", { name: "Cette page n’existe pas" })).toBeVisible();
  }
  // Rien ne la propose dans le menu du compte
  await aller(page, "/projets");
  await ouvrirLeMenuDuCompte(page);
  await expect(page.getByRole("link", { name: "Mon compte" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Administration" })).toHaveCount(0);
});

test("F14-AC23 — le porteur voit chaque compte, sa date d'inscription, sa dernière connexion et son solde, la dépense d'IA et les ventes du mois", async ({ page, browser }) => {
  const s = await deuxComptes(page, browser);
  await sql("insert into public.appels_ia (enseignant_id, aide, sorte, termine_le, issue, cout_usd) values ($1, 'correction', 'texte', now(), 'reussi', 1.5), ($1, 'image-scene', 'image', now(), 'reussi', 0.75)", [s.bernard.id]);
  await sql("insert into public.paiements (session, enseignant_id, achat, montant, etoiles) values ('cs_admin_' || gen_random_uuid(), $1, 'recharge', 500, 100)", [s.bernard.id]);
  await aller(page, "/projets");
  await ouvrirLeMenuDuCompte(page);
  await page.getByRole("link", { name: "Administration" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Administration" })).toBeVisible();
  const ligne = page.getByRole("row").filter({ hasText: s.bernard.courriel });
  await expect(ligne).toContainText("30 ✦");
  await expect(ligne.getByRole("cell").nth(0)).toContainText(/\d{4}/);
  await expect(ligne.getByRole("cell").nth(1)).toContainText(/\d{4}/);
  await expect(page.getByRole("row").filter({ hasText: s.porteur.courriel })).toContainText("vous");
  // Le mois de toute l'application : ce que dit le journal, ces deux demandes comprises
  const [{ usd, n }] = await sql<{ usd: string; n: number }>(
    "select coalesce(sum(cout_usd), 0)::text as usd, count(*)::int as n from public.appels_ia where commence_le >= date_trunc('month', now() at time zone 'Europe/Paris') at time zone 'Europe/Paris'",
  );
  expect(Number(usd)).toBeGreaterThanOrEqual(2.25);
  const attendu = Number(usd).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  await expect(page.getByRole("definition").filter({ hasText: `${attendu} $` })).toContainText(`${n} demande`);
  await expect(page.getByRole("definition").filter({ hasText: "recharge" })).toContainText(/\d+ pass · \d+ recharges?/);
});

test("F14-AC24 — offrir 100 ✦ puis un pass à M. Bernard : son solde et son projet les reçoivent, et les gestes restent inscrits avec leur date", async ({ page, browser }) => {
  const s = await deuxComptes(page, browser);
  await aller(page, `/admin/compte/${s.bernard.id}`);
  await page.getByLabel("Étoiles", { exact: true }).fill("100");
  await page.getByLabel("Pourquoi, pour mémoire").fill("Essai en classe");
  await page.getByRole("button", { name: "Offrir ces étoiles" }).click();
  await expect(page.getByRole("status").filter({ hasText: "offert" })).toContainText("Les étoiles sont offertes.");
  expect((await sql<{ etoiles: number }>("select etoiles from public.enseignants where id = $1", [s.bernard.id]))[0].etoiles).toBe(130);
  await expect(page.getByRole("row").filter({ hasText: "Offertes par vous" })).toContainText("+100");
  await expect(page.getByRole("row").filter({ hasText: "Offertes par vous" })).toContainText("Essai en classe");

  await page.getByLabel("Le pass d’un projet").selectOption({ label: "Le marais" });
  await page.getByRole("button", { name: "Offrir ce pass" }).click();
  await expect(page.getByRole("status").filter({ hasText: "offert" })).toContainText("Le pass est offert, avec ses étoiles.");
  expect(await sql("select origine from public.passes where projet_id = $1", [s.marais])).toEqual([{ origine: "cadeau" }]);
  await expect(page.getByText(/pass offert le \d+/)).toBeVisible();
  expect((await sql<{ etoiles: number }>("select etoiles from public.enseignants where id = $1", [s.bernard.id]))[0].etoiles).toBe(530);
});

test("F14-AC25 — retirer le partage d'un livre signalé : le lien mène à la page neutre, M. Bernard reçoit un courriel, son projet ne change pas", async ({ page, browser }) => {
  const s = await deuxComptes(page, browser);
  await aller(page, "/admin");
  await page.getByLabel("Lien de lecture").fill(`http://localhost:3100/lire/${s.code}`);
  await page.getByRole("button", { name: "Chercher" }).click();
  await expect(page.getByText("« Le marais »")).toBeVisible();
  await page.getByRole("button", { name: "Retirer ce partage" }).click();
  await expect(page.getByRole("status").filter({ hasText: "partage" })).toContainText("Le partage est retiré, et l’enseignant en est averti par courriel.");

  const lecteur = await browser.newContext();
  const lire = await lecteur.newPage();
  await lire.goto(`/lire/${s.code}`);
  await expect(lire).toHaveTitle("Ce livre n’est plus partagé");
  await lecteur.close();

  const recu = await courrielRecu(s.bernard.courriel, "n’est plus partagé");
  expect(recu.sujet).toBe("Votre livre « Le marais » n’est plus partagé — Il était une classe");
  expect(await sql("select titre from public.projets where id = $1", [s.marais])).toEqual([{ titre: "Le marais" }]);
  expect(await sql("select titre from public.partages_retires where projet_id = $1", [s.marais])).toEqual([{ titre: "Le marais" }]);
});

/** Publier un projet dans la bibliothèque, sans passer par l'écran : une version réduite au titre */
async function publierVite(projet: string, compte: Compte, titre: string): Promise<string> {
  const adresse = `${titre.toLowerCase().replace(/[^a-z]+/g, "-")}-${Math.random().toString(36).slice(2, 8)}`;
  await sql(
    `insert into public.publications (projet_id, enseignant_id, adresse, version, presentation, age, empreinte, publiee_le, mise_a_jour_le)
     values ($1, $2, $3, jsonb_build_object('titre', $4::text, 'aChoix', true, 'passages', '[]'::jsonb, 'images', '{}'::jsonb), 'Une histoire.', '8-10', repeat('a', 32), now(), now())`,
    [projet, compte.id, adresse, titre],
  );
  return adresse;
}

test("F14-AC40, F15-AC19, F11-AC117 — les livres de l'accueil se choisissent parmi tous les livres de la bibliothèque, avec la couverture de leur auteur ; retiré de la bibliothèque, un livre quitte l'accueil", async ({ page, browser }) => {
  const { bernard, marais, porteur, base } = await deuxComptes(page, browser);
  await sql("update public.reglages_application set livres_de_l_accueil = '[]'");
  const phare = await semerProjet(base, porteur, "personnel", "choix", "Le phare", null);
  await publierVite(phare, porteur, "Le phare");
  const deBernard = await publierVite(marais, bernard, "Le marais");
  // La couverture que M. Bernard a faite, figée dans sa version publiée (F11-AC114)
  const couverture = crypto.randomUUID();
  const bleue = await sharp({ create: { width: 616, height: 864, channels: 3, background: "#0000c0" } }).jpeg().toBuffer();
  for (const chemin of [`${bernard.id}/${marais}/${couverture}.jpg`, `${bernard.id}/${marais}/${couverture}-v.jpg`]) {
    await service().storage.from("images").upload(chemin, bleue, { contentType: "image/jpeg", upsert: true });
  }
  await sql(
    "insert into public.images (id, projet_id, enseignant_id, chemin, chemin_vignette, largeur, hauteur, format) values ($1, $2, $3, $4, $5, 616, 864, 'jpeg')",
    [couverture, marais, bernard.id, `${bernard.id}/${marais}/${couverture}.jpg`, `${bernard.id}/${marais}/${couverture}-v.jpg`],
  );
  await sql(
    `update public.publications set version = version || jsonb_build_object('couverture', jsonb_build_object('id', $2::text, 'largeur', 616, 'hauteur', 864, 'textes', null),
       'images', jsonb_build_object($2::text, jsonb_build_object('largeur', 616, 'hauteur', 864))) where projet_id = $1`,
    [marais, couverture],
  );

  // Tous les livres de la bibliothèque se proposent, ceux des autres comptes compris, sans rien à déposer
  await aller(page, "/admin");
  const section = page.getByRole("region", { name: "Livres de l’accueil" });
  const ligne = section.getByRole("listitem").filter({ hasText: "Le marais" });
  await expect(ligne).toBeVisible();
  await expect(section.getByRole("listitem").filter({ hasText: "Le phare" })).toBeVisible();
  await ligne.getByRole("button", { name: "Mettre sur l’accueil" }).click();
  await expect(page.getByRole("status").filter({ hasText: /./ })).toHaveText("Le livre est sur l’accueil.");
  await expect(ligne.getByRole("img", { name: "Couverture de « Le marais »" })).toBeVisible();
  await expect(section.locator('input[type="file"]')).toHaveCount(0);

  // Un visiteur la voit sur l'accueil, et le livre mène à sa lecture dans la bibliothèque
  const visiteur = await (await browser.newContext()).newPage();
  await visiteur.goto("http://localhost:3100/");
  const livre = visiteur.getByRole("link", { name: "Feuilleter « Le marais »" });
  await expect(livre).toHaveAttribute("href", `/lire/bibliotheque/${deBernard}`);
  const adresse = await livre.locator("img").getAttribute("src");
  expect(adresse).toBe(`/images/publie/${deBernard}/${couverture}?v=1`);
  const reponse = await visiteur.request.get(`http://localhost:3100${adresse}`);
  const { dominant } = await sharp(await reponse.body()).stats();
  expect(dominant.b).toBeGreaterThan(150);

  // Plus de dépôt de face avant : ni l'adresse du dépôt, ni celle des faces avant déposées
  expect((await visiteur.request.post("http://localhost:3100/admin/couverture", { multipart: { projet: marais } })).status()).toBeGreaterThanOrEqual(400);
  expect((await visiteur.request.get(`http://localhost:3100/images/accueil/${phare}`)).status()).toBe(404);

  // Retiré de la bibliothèque, le livre quitte l'accueil (F15-AC19)
  await sql("update public.publications set version = null, presentation = null, age = null, empreinte = null, retiree_le = now(), retrait_par = 'adulte' where projet_id = $1", [marais]);
  await visiteur.goto("http://localhost:3100/");
  await expect(visiteur.getByRole("link", { name: /Feuilleter/ })).toHaveCount(0);
  await aller(page, "/admin");
  await expect(section.getByRole("listitem").filter({ hasText: "Le marais" })).toHaveCount(0);
  await visiteur.context().close();
});
