import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { test, type Locator, type Page } from "@playwright/test";
import { adultePret, aller, collerEleves, ecrireEleves, elevesDe, semerAttribution, semerPartie, semerProjet, supprimerComptes } from "../parcours/outils";

/**
 * Les vrais écrans du tuto « Donner l'accès aux élèves » (V1/video/tuto-acces-eleves/SCRIPT.md),
 * joués sur la base locale : npm run captures -- tuto-acces-eleves
 *
 * Chaque écran s'écrit en PNG (1440 × 810, au double de la densité, net sous la caméra de la
 * vidéo), et boites.json garde la place de ce que le curseur vise : quand un écran change, on
 * relance cette commande, et la vidéo suit. Ce n'est pas un test : rien n'y est vérifié.
 * La classe est inventée pour la vidéo, sur un compte d'essai supprimé à la fin.
 */
const dossier = resolve(__dirname, "../../../video/tuto-acces-eleves/captures");
const LARGEUR = 1440;
const HAUTEUR = 810;
const CLASSE = "CM2 des Tilleuls";
const TROIS = ["Inès", "Mathis", "Léna"];
const LISTE = [
  "Noah", "Jade", "Adam", "Louise", "Sacha", "Chloé", "Yanis", "Emma", "Rayan", "Lina",
  "Hugo", "Manon", "Ilyes", "Rose", "Tom", "Zoé", "Nolan", "Anna", "Elio", "Maëlys", "Gabin",
];

type Boite = { x: number; y: number; l: number; h: number };
const boites: Record<string, Record<string, Boite>> = {};
let n = 0;

async function boite(cible: Locator): Promise<Boite> {
  const b = await cible.boundingBox();
  if (!b) throw new Error("Élément hors de l'écran.");
  return { x: Math.round(b.x), y: Math.round(b.y), l: Math.round(b.width), h: Math.round(b.height) };
}

/**
 * Un écran, et la place des éléments que la vidéo désigne sur lui. toute : la page entière, pour
 * la faire défiler dans la vidéo (sa hauteur est gardée sous « _page »).
 */
async function capturer(page: Page, nom: string, cibles: Record<string, Locator> = {}, toute = false): Promise<void> {
  n += 1;
  const cle = `${String(n).padStart(2, "0")}-${nom}`;
  await page.mouse.move(LARGEUR - 1, HAUTEUR - 1);
  await page.waitForTimeout(600);
  // L'adresse du serveur d'essai devient celle du site, que l'enseignant lira sur son affiche
  await page.evaluate(() => {
    const parcours = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let t = parcours.nextNode(); t; t = parcours.nextNode()) {
      if (t.nodeValue?.includes("localhost:3100")) t.nodeValue = t.nodeValue.replaceAll("localhost:3100", "iletaituneclasse.com");
    }
  });
  const places: Record<string, Boite> = {};
  for (const [quoi, cible] of Object.entries(cibles)) places[quoi] = await boite(cible);
  // la page entière défile sous un message qui, lui, reste en place : on ne le garde pas
  if (toute) await page.evaluate(() => document.querySelectorAll<HTMLElement>(".message").forEach((m) => (m.style.visibility = "hidden")));
  if (toute) places._page = { x: 0, y: 0, l: LARGEUR, h: await page.evaluate(() => document.documentElement.scrollHeight) };
  boites[cle] = places;
  await page.screenshot({ path: `${dossier}/${cle}.png`, fullPage: toute });
}

test.use({ viewport: { width: LARGEUR, height: HAUTEUR }, deviceScaleFactor: 2 });
test.afterAll(async () => {
  await supprimerComptes();
});

test("Donner l'accès aux élèves : les écrans du tuto", async ({ page, browser }) => {
  test.setTimeout(240_000);
  rmSync(dossier, { recursive: true, force: true });
  mkdirSync(dossier, { recursive: true });
  const { compte, base } = await adultePret(page);
  await base.from("enseignants").update({ nom_affiche: "Mme Laurent" }).eq("id", compte.id);

  // 2 — La classe
  await aller(page, "/classes");
  const creer = page.getByRole("button", { name: /Nouvelle classe|Créer ma classe/ }).first();
  await capturer(page, "mes-classes-vide", { creer });
  await creer.click();
  const nom = page.getByLabel("Nom de la classe");
  await nom.waitFor();
  const annees = page.getByRole("radiogroup").first();
  const valider = page.getByRole("button", { name: "Créer la classe" });
  await capturer(page, "nouvelle-classe", { nom, annees, valider });
  await nom.fill(CLASSE);
  const annee = page.getByRole("radio").first();
  await annee.check();
  await capturer(page, "nouvelle-classe-remplie", { nom, annee: annee.locator(".."), identifiant: page.getByLabel("Identifiant", { exact: true }), valider });
  await valider.click();
  await page.waitForURL(/\/classes\/[0-9a-f-]{36}/);
  const id = page.url().match(/\/classes\/([0-9a-f-]{36})/)![1];
  await page.getByRole("heading", { level: 1, name: CLASSE }).waitFor();
  const inscrireLien = page.getByRole("link", { name: /Inscrire des élèves/ }).first();
  await capturer(page, "classe-creee", { inscrire: inscrireLien });

  // 3 — Les élèves
  await inscrireLien.click();
  await page.waitForURL(new RegExp(`/classes/${id}/inscrire`));
  const ligne1 = page.getByLabel("Prénom, ligne 1", { exact: true });
  await ligne1.waitFor();
  await capturer(page, "inscrire-vide", { ligne1 });
  await ecrireEleves(page, TROIS);
  await capturer(page, "inscrire-trois", { ligne1, ligne3: page.getByLabel("Prénom, ligne 3", { exact: true }) });
  await collerEleves(page, LISTE.join("\n"), 4);
  await page.getByLabel(`Prénom, ligne ${TROIS.length + LISTE.length}`, { exact: true }).waitFor();
  const continuer = page.getByRole("button", { name: "Continuer" }).last();
  await capturer(page, "inscrire-liste-collee", { ligne4: page.getByLabel("Prénom, ligne 4", { exact: true }) });
  // la même, en entier : la vidéo la fait défiler jusqu'à « Continuer », la colonne restant en place
  await capturer(page, "inscrire-liste-entiere", { continuer, colonne: page.getByRole("navigation", { name: "Espace adulte" }) }, true);
  await continuer.click();
  const confirmer = page.getByRole("button", { name: /^Inscrire \d+ élève/ });
  await confirmer.waitFor();
  await capturer(page, "inscrire-confirmer", { confirmer });
  await confirmer.click();
  await page.waitForURL(new RegExp(`/classes/${id}(\\?|$)`));
  const eleves = page.getByRole("region", { name: "Élèves" });
  await eleves.waitFor();
  const afficher = page.getByRole("button", { name: "Afficher les codes" });
  await capturer(page, "classe-eleves", { eleves, afficher });
  await afficher.click();
  await page.getByRole("button", { name: "Masquer les codes" }).waitFor();
  const premiere = eleves.getByRole("listitem").first();
  await capturer(page, "classe-codes", { eleves, premiere, affiche: page.getByRole("link", { name: /Imprimer l’affiche/ }) });
  const codes: Record<string, string> = {};
  for (const ligne of await eleves.getByRole("listitem").all()) {
    const prenom = (await ligne.locator("b").innerText()).trim();
    codes[prenom] = (await ligne.innerText()).match(/\d{4}/)?.[0] ?? "";
  }
  await page.getByRole("button", { name: "Masquer les codes" }).click();

  // Un chapitre des « Passeurs de brume » pour la classe, dont Inès écrit deux scènes : son
  // « Mon travail » aura de quoi s'occuper (passage 5)
  const inscrits = await elevesDe(base, id);
  const projet = await semerProjet(base, compte, "classe", "choix", "Les passeurs de brume", id);
  const { chapitres } = await semerPartie(base, projet, "Le village", [{ titre: "La nuit de pleine lune", scenes: ["Le départ", "La lanterne", "Le vieux pont"] }]);
  await semerAttribution(base, chapitres[0].id, Object.values(inscrits).map((e) => ({ eleve: e.id })));
  const consignes = [
    "Lou quitte le village à la nuit tombée. Raconte ce qu’il emporte et ce qu’il ressent.",
    "Au bord du chemin, une lanterne s’allume toute seule. Que fait Lou ?",
  ];
  for (const [i, scene] of chapitres[0].scenes.slice(0, 2).entries()) {
    await base.from("scenes").update({ prise_par_eleve: inscrits["Inès"].id, consigne: consignes[i] }).eq("id", scene);
  }

  // 4 — Imprimer
  const fiche = page.getByRole("region", { name: "Pour ouvrir la classe sur un ordinateur" });
  const identifiant = (await fiche.locator("dd").nth(1).innerText()).trim();
  await fiche.getByRole("button", { name: "Afficher le mot de passe" }).click();
  await fiche.getByRole("button", { name: "Masquer le mot de passe" }).waitFor();
  const motDePasse = (await fiche.locator("dd").nth(2).locator("span").first().innerText()).trim();
  await fiche.getByRole("button", { name: "Masquer le mot de passe" }).click();
  await aller(page, `/classes/${id}/imprimer?quoi=affiche`);
  await page.getByText("Ouvre cette adresse").waitFor();
  await capturer(page, "affiche", {
    adresse: page.getByText("Ouvre cette adresse").locator(".."),
    identifiant: page.getByText("Écris l’identifiant de la classe").locator(".."),
    motDePasse: page.getByText("Écris le mot de passe de la classe").locator(".."),
  });
  await aller(page, `/classes/${id}/imprimer`);
  await page.getByText("À découper", { exact: false }).first().waitFor();
  await capturer(page, "etiquettes");

  // 5 — En classe, sur un autre ordinateur
  const poste = await browser.newContext({ locale: "fr-FR", timezoneId: "Europe/Paris", viewport: { width: LARGEUR, height: HAUTEUR }, deviceScaleFactor: 2 });
  const eleve = await poste.newPage();
  await aller(eleve, "/classe");
  const champId = eleve.getByLabel("Identifiant de la classe");
  const champMdp = eleve.getByLabel("Mot de passe de la classe");
  const entrer = eleve.getByRole("button", { name: "Entrer", exact: true });
  await champId.waitFor();
  await capturer(eleve, "poste-classe", { identifiant: champId, motDePasse: champMdp, entrer });
  await champId.fill(identifiant);
  await champMdp.fill(motDePasse);
  await capturer(eleve, "poste-classe-rempli", { identifiant: champId, motDePasse: champMdp, entrer });
  await entrer.click();
  const qui = eleve.getByRole("list", { name: "Élèves de la classe" });
  await qui.waitFor();
  const prenom = "Inès";
  const bouton = eleve.getByRole("button", { name: prenom, exact: true });
  await capturer(eleve, "poste-qui", { eleves: qui, prenom: bouton });
  await bouton.click();
  const chiffre1 = eleve.getByLabel("Chiffre 1");
  await chiffre1.waitFor();
  const cases = eleve.getByRole("group", { name: "Code à quatre chiffres" });
  await capturer(eleve, "poste-code", { cases });
  // les quatre chiffres un par un ; le quatrième envoie le code tout seul : on retient la requête
  // le temps de prendre l'écran aux quatre points
  const code = codes[prenom];
  for (const i of [1, 2, 3]) {
    await eleve.getByLabel(`Chiffre ${i}`).pressSequentially(code[i - 1]);
    await capturer(eleve, `poste-code-${i}`, { cases });
  }
  let lacher: () => void = () => {};
  const retenue = new Promise<void>((r) => (lacher = r));
  await eleve.route("**/*", async (requete) => {
    if (requete.request().method() === "POST") await retenue;
    await requete.continue();
  });
  await eleve.getByLabel("Chiffre 4").pressSequentially(code[3]);
  await capturer(eleve, "poste-code-4", { cases });
  lacher();
  await eleve.waitForURL((u) => !u.pathname.startsWith("/classe"));
  await eleve.unroute("**/*");
  await eleve.waitForLoadState("networkidle");
  await capturer(eleve, "poste-dans-la-classe", { ecrire: eleve.getByRole("link", { name: /^Écrire/ }).or(eleve.getByRole("button", { name: /^Écrire/ })).first() });
  await poste.close();

  // 6 — Un code oublié
  await aller(page, `/classes/${id}`);
  const ines = page.getByRole("region", { name: "Élèves" }).getByRole("button", { name: new RegExp(prenom) }).first();
  await capturer(page, "classe-avant-code", { prenom: ines });
  await ines.click();
  await page.waitForTimeout(400);
  const panneau = page.locator("aside.panneau").first();
  await capturer(page, "code-retrouve", { panneau });

  const donnees = JSON.stringify({ largeur: LARGEUR, hauteur: HAUTEUR, densite: 2, ecrans: boites }, null, 2);
  writeFileSync(`${dossier}/boites.json`, donnees);
  // la même chose pour la vidéo, qui la lit à son chargement, sans attendre
  writeFileSync(`${dossier}/boites.js`, `// Écrit par app/tests/captures/tuto-acces-eleves.spec.ts — ne pas modifier\nwindow.BOITES = ${donnees};\n`);
});
