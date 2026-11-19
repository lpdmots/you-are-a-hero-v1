import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { test, type Locator, type Page } from "@playwright/test";
import { adultePret, aller, creerClasse, inscrire, supprimerComptes } from "../parcours/outils";

/**
 * Les vrais écrans du tuto « Créer un projet » (V1/video/tuto-creer-un-projet/SCRIPT.md),
 * joués sur la base locale : npm run captures -- tuto-creer-un-projet
 *
 * Même méthode que tuto-acces-eleves.spec.ts : chaque écran en PNG (1440 × 810, densité 2) et
 * boites.json / boites.js, la place de ce que la vidéo vise. Ce n'est pas un test.
 * La classe est inventée pour la vidéo (« CM2 des Tilleuls », comme au tuto 1), sur un compte
 * d'essai supprimé à la fin.
 */
const dossier = resolve(__dirname, "../../../video/tuto-creer-un-projet/captures");
const LARGEUR = 1440;
const HAUTEUR = 810;
const CLASSE = "CM2 des Tilleuls";
const TITRE = "Le secret de la forêt bleue";
const VISUEL = "foret";
const ELEVES = [
  "Inès", "Mathis", "Léna", "Noah", "Jade", "Adam", "Louise", "Sacha", "Chloé", "Yanis", "Emma", "Rayan",
  "Lina", "Hugo", "Manon", "Ilyes", "Rose", "Tom", "Zoé", "Nolan", "Anna", "Elio", "Maëlys", "Gabin",
];

type Boite = { x: number; y: number; l: number; h: number };
const boites: Record<string, Record<string, Boite>> = {};
let n = 0;

async function boite(cible: Locator): Promise<Boite> {
  const b = await cible.boundingBox();
  if (!b) throw new Error("Élément hors de l'écran.");
  return { x: Math.round(b.x), y: Math.round(b.y), l: Math.round(b.width), h: Math.round(b.height) };
}

async function capturer(page: Page, nom: string, cibles: Record<string, Locator> = {}, sansMessage = false): Promise<void> {
  n += 1;
  const cle = `${String(n).padStart(2, "0")}-${nom}`;
  await page.mouse.move(LARGEUR - 1, HAUTEUR - 1);
  await page.waitForTimeout(600);
  // le serveur local de développement pose son badge en bas à droite ; un message déjà lu peut se retirer
  await page.evaluate((retirer) => {
    document.querySelectorAll("nextjs-portal").forEach((e) => e.remove());
    if (retirer) document.querySelectorAll<HTMLElement>(".message").forEach((m) => (m.style.visibility = "hidden"));
  }, sansMessage);
  await page.evaluate(() => {
    const parcours = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let t = parcours.nextNode(); t; t = parcours.nextNode()) {
      if (t.nodeValue && /localhost:(3100|4840)/.test(t.nodeValue)) t.nodeValue = t.nodeValue.replace(/localhost:(3100|4840)/g, "iletaituneclasse.com");
    }
  });
  const places: Record<string, Boite> = {};
  for (const [quoi, cible] of Object.entries(cibles)) places[quoi] = await boite(cible);
  boites[cle] = places;
  await page.screenshot({ path: `${dossier}/${cle}.png` });
}

test.use({ viewport: { width: LARGEUR, height: HAUTEUR }, deviceScaleFactor: 2 });
test.afterAll(async () => {
  await supprimerComptes();
});

test("Créer un projet : les écrans du tuto", async ({ page }) => {
  test.setTimeout(240_000);
  rmSync(dossier, { recursive: true, force: true });
  mkdirSync(dossier, { recursive: true });
  const { compte, base } = await adultePret(page);
  await base.from("enseignants").update({ nom_affiche: "Mme Laurent" }).eq("id", compte.id);

  // La classe du tuto 1, déjà inscrite : elle se choisira à la création
  const { id } = await creerClasse(page, CLASSE, undefined, null);
  await inscrire(page, id, ELEVES);
  // L'écran d'aide de la Préparation, comme pour un enseignant qui découvre : seul celui-là revient
  await base.from("enseignants").update({ aides_masquees: ["classes", "plan", "suivi", "livre-chemins", "livre-relire"] }).eq("id", compte.id);

  const colonne = page.getByRole("navigation", { name: "Espace adulte" });

  // Le visuel de la carte est tiré au hasard : la forêt, pour aller avec le titre, à chaque fois
  await page.route(/\/projets\/nouveau/, async (requete) => {
    const reponse = await requete.fetch();
    let corps = await reponse.text();
    const tire = corps.match(/visuelDefaut\\?"\s*:\s*\\?"([a-z]+)/)?.[1];
    if (tire) corps = corps.split(`defaut-${tire}`).join(`defaut-${VISUEL}`).replace(new RegExp(`(visuelDefaut\\\\?"\\s*:\\s*\\\\?")${tire}`, "g"), `$1${VISUEL}`);
    await requete.fulfill({ response: reponse, body: corps });
  });

  // 2 — Mes projets, depuis la page de la classe
  await aller(page, `/classes/${id}`);
  await page.getByRole("heading", { level: 1, name: CLASSE }).waitFor();
  const mesProjets = colonne.getByRole("link", { name: "Mes projets" });
  await capturer(page, "classe", { mesProjets, colonne });
  await mesProjets.click();
  await page.waitForURL(/\/projets$/);
  const premier = page.getByRole("link", { name: /Créer mon premier projet|Nouveau projet/ }).first();
  await premier.waitFor();
  await capturer(page, "mes-projets-vide", { creer: premier, mesProjets });
  await premier.click();
  await page.waitForURL(/\/projets\/nouveau/);

  // 3 — Qui écrit ? Quel récit ?
  const continuer = page.getByRole("button", { name: "Continuer" });
  const maClasse = page.locator("label").filter({ hasText: "Ma classe" });
  const moi = page.locator("label").filter({ hasText: /^Moi/ });
  const etapes = page.locator("ol").first();
  await maClasse.waitFor();
  await capturer(page, "qui-ecrit", { maClasse, moi, continuer, fixe: page.getByText("Ce choix ne se change pas ensuite.", { exact: false }), etapes });
  await maClasse.click();
  await capturer(page, "qui-ecrit-classe", { maClasse, moi, continuer, fixe: page.getByText("Ce choix ne se change pas ensuite.", { exact: false }) });
  await continuer.click();
  const aChoix = page.locator("label").filter({ hasText: "À choix" });
  const classique = page.locator("label").filter({ hasText: "Classique" });
  await aChoix.waitFor();
  await page.waitForTimeout(300);
  await capturer(page, "quel-recit", { aChoix, classique, continuer, fixe: page.getByText("Ce choix ne se change pas ensuite.") });
  await aChoix.click();
  await capturer(page, "quel-recit-choix", { aChoix, classique, continuer, fixe: page.getByText("Ce choix ne se change pas ensuite.") });
  await continuer.click();

  // 4 — Le titre et la classe
  const titre = page.getByLabel("Titre du projet");
  await titre.waitFor();
  await page.waitForTimeout(300);
  const laClasse = page.locator("label").filter({ hasText: CLASSE });
  const plusTard = page.locator("label").filter({ hasText: "Choisir plus tard" });
  const creer = page.getByRole("button", { name: "Créer le projet" });
  const carte = page.getByRole("complementary", { name: "La carte du projet" });
  const recap = page.locator("p").filter({ hasText: "ne se changent pas ensuite" });
  const cibles = { titre, laClasse, plusTard, creer, carte, recap };
  await capturer(page, "titre-vide", cibles);
  await titre.click();
  await capturer(page, "titre-focus", cibles);
  await titre.pressSequentially(TITRE);
  await capturer(page, "titre-rempli", cibles);
  // la classe, cochée d'office quand il n'y en a qu'une : on la clique quand même, sans rien changer
  await laClasse.click();
  await capturer(page, "titre-classe", cibles);

  // 5 — Le projet créé : l'écran d'aide de la Préparation, puis la Préparation et la colonne
  await creer.click();
  await page.waitForURL(/\/projet\/[0-9a-f-]{36}\/preparation/);
  const commencer = page.getByRole("button", { name: "Commencer" });
  await commencer.waitFor();
  await capturer(page, "aide-preparation", { commencer, colonne });
  await commencer.click();
  await page.locator("nav[aria-label='Étapes de la préparation']").waitFor();
  const sections = colonne.getByRole("navigation", { name: "Sections du projet" });
  const lien = (nom: string) => sections.getByRole("link", { name: nom });
  await capturer(page, "preparation", {
    colonne,
    projet: colonne.getByRole("region", { name: /Projet en cours/ }),
    sections,
    preparation: lien("Préparation"),
    plan: lien("Parties et chapitres"),
    suivi: lien("Suivi"),
    livre: lien("Livre"),
    etapes: page.locator("nav[aria-label='Étapes de la préparation']"),
  }, true);

  const donnees = JSON.stringify({ largeur: LARGEUR, hauteur: HAUTEUR, densite: 2, ecrans: boites }, null, 2);
  writeFileSync(`${dossier}/boites.json`, donnees);
  writeFileSync(`${dossier}/boites.js`, `// Écrit par app/tests/captures/tuto-creer-un-projet.spec.ts — ne pas modifier\nwindow.BOITES = ${donnees};\n`);
});
