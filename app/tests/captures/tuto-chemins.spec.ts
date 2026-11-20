import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { test, type Locator, type Page } from "@playwright/test";
import { adultePret, aller, elevesDe, semerAttribution, semerClasse, semerPartie, semerProjet, supprimerComptes } from "../parcours/outils";

/**
 * Les vrais écrans du tuto « Construire les chemins » (V1/video/tuto-chemins/SCRIPT.md), joués sur
 * la base locale : npx playwright test --config playwright.local.config.ts tuto-chemins
 *
 * Même méthode que tuto-parties.spec.ts : chaque écran en PNG (1440 × 810, densité 2) et
 * boites.json / boites.js, la place de ce que la vidéo vise. Ce n'est pas un test.
 * Le projet des tutos 2 à 4 (« Le secret de la forêt bleue », classe « CM2 des Tilleuls »), là où
 * le tuto 4 s'arrête : sept chapitres rangés et attribués, sans scène. On construit les chemins du
 * chapitre « Le vieux coffre ». Inventé pour la vidéo, sur un compte d'essai supprimé à la fin.
 * Les aides de l'IA sont éteintes : ni ✦ ni « Construire avec l'IA ».
 */
const dossier = resolve(__dirname, "../../../video/tuto-chemins/captures");
const LARGEUR = 1440;
const HAUTEUR = 810;
const CLASSE = "CM2 des Tilleuls";
const TITRE = "Le secret de la forêt bleue";
const ELEVES = [
  "Inès", "Mathis", "Léna", "Noah", "Jade", "Adam", "Louise", "Sacha", "Chloé", "Yanis", "Emma", "Rayan",
  "Lina", "Hugo", "Manon", "Ilyes", "Rose", "Tom", "Zoé", "Nolan", "Anna", "Elio", "Maëlys", "Gabin",
];
const CHAPITRE = "Le vieux coffre";
// La première scène, puis deux choix devant la caméra, un troisième fait pendant le saut du temps,
// et le lien tiré qui fait se rejoindre deux chemins
const PREMIERE = "Le grenier de Timéo";
const CHOIX = [
  { action: "Ouvrir le coffre", titre: "La carte qui brille" },
  { action: "Appeler Pic à l’aide", titre: "Pic l’écureuil" },
];
const SAUT = { action: "Redescendre sans bruit", titre: "La cuisine endormie" };
const LIEN = { de: "Pic l’écureuil", vers: "La carte qui brille", action: "Ouvrir le coffre avec Pic" };

type Boite = { x: number; y: number; l: number; h: number };
const boites: Record<string, Record<string, Boite>> = {};
let n = 0;

async function boite(cible: Locator): Promise<Boite | null> {
  if (!(await cible.count())) return null;
  const b = await cible.first().boundingBox({ timeout: 3000 });
  if (!b) return null;
  return { x: Math.round(b.x), y: Math.round(b.y), l: Math.round(b.width), h: Math.round(b.height) };
}

/** Nettoie l'écran : badge du serveur de développement, messages, adresse locale. */
async function nettoyer(page: Page, messages = false): Promise<void> {
  await page.evaluate((garder) => {
    document.querySelectorAll("nextjs-portal").forEach((e) => e.remove());
    // la mention de la bibliothèque du schéma, en bas à gauche du cadre
    document.querySelectorAll(".react-flow__attribution").forEach((e) => e.remove());
    if (!garder) document.querySelectorAll<HTMLElement>(".message").forEach((m) => (m.style.visibility = "hidden"));
    const parcours = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let t = parcours.nextNode(); t; t = parcours.nextNode()) {
      if (t.nodeValue && /localhost:(3100|4840)/.test(t.nodeValue)) t.nodeValue = t.nodeValue.replace(/localhost:(3100|4840)/g, "iletaituneclasse.com");
    }
  }, messages);
}

/**
 * Un écran, et la place des éléments que la vidéo désigne. survol : la souris reste sur cet
 * élément ; tenue : la souris reste où elle est (un lien qu'on tire).
 */
async function capturer(page: Page, nom: string, cibles: Record<string, Locator> = {}, survol?: Locator | "tenue"): Promise<void> {
  n += 1;
  const cle = `${String(n).padStart(2, "0")}-${nom}`;
  if (survol === "tenue") {
    // rien : la souris reste où elle est
  } else if (survol) await survol.hover();
  else await page.mouse.move(LARGEUR - 1, HAUTEUR - 1);
  await page.waitForTimeout(700);
  await nettoyer(page);
  const places: Record<string, Boite> = {};
  for (const [quoi, cible] of Object.entries(cibles)) {
    const b = await boite(cible);
    if (b) places[quoi] = b;
  }
  places._fenetre = { x: 0, y: await page.evaluate(() => window.scrollY), l: LARGEUR, h: HAUTEUR };
  boites[cle] = places;
  await page.screenshot({ path: `${dossier}/${cle}.png` });
}

test.use({ viewport: { width: LARGEUR, height: HAUTEUR }, deviceScaleFactor: 2 });
test.afterAll(async () => {
  await supprimerComptes();
});

test("Construire les chemins : les écrans du tuto", async ({ page }) => {
  test.setTimeout(300_000);
  rmSync(dossier, { recursive: true, force: true });
  mkdirSync(dossier, { recursive: true });
  const { compte, base } = await adultePret(page);
  // Aucun ✦ à l'écran ; aucun écran d'aide ne s'ouvre (« Parties et chapitres » a eu le sien au tuto 4)
  await base.from("enseignants").update({
    nom_affiche: "Mme Laurent",
    reglages_ia: { proposer: false },
    aides_masquees: ["classes", "preparation", "plan", "suivi", "livre-chemins", "livre-relire"],
  }).eq("id", compte.id);
  const { id: classeId } = await semerClasse(base, CLASSE, ELEVES);
  const projet = await semerProjet(base, compte, "classe", "choix", TITRE, classeId);
  await base.from("projets").update({ visuel_defaut: "foret" }).eq("id", projet);

  // Le plan tel que le tuto 4 le laisse : sept chapitres rangés, chacun avec ses élèves
  await base.from("preparations").update({
    univers: "Une immense forêt dont les arbres deviennent bleus la nuit. Au cœur de la forêt, un village caché sous les racines d’un arbre géant.",
    enjeu: "Retrouver la pierre de lune avant la fin de l’hiver. Sans elle, la forêt perdra sa couleur bleue et le village sera découvert.",
  }).eq("projet_id", projet);
  await base.from("personnages").insert({
    projet_id: projet, enseignant_id: compte.id, nom: "Timéo", heros: true, rang: 0,
    description: "Timéo, 10 ans, vit au village des racines. Curieux et courageux, mais il a peur du noir. Son ami : Pic, un écureuil qui parle.",
  });
  const village = await semerPartie(base, projet, "Le village des racines", [{ titre: "La fête des lucioles" }, { titre: CHAPITRE }], "jardin");
  const foret = await semerPartie(base, projet, "La forêt de la nuit", [{ titre: "Le sentier interdit" }, { titre: "La rivière aux reflets" }, { titre: "Les grottes chantantes" }], "foret");
  const coeur = await semerPartie(base, projet, "Le cœur de la forêt", [{ titre: "La pierre de lune" }, { titre: "Le gardien de la pierre" }], "temple");
  const ids = [...village.chapitres, ...foret.chapitres, ...coeur.chapitres].map((c) => c.id);
  const [fete, coffre, sentier, riviere, grottes, pierre, gardien] = ids;
  const visuels: [string, string][] = [[fete, "etang"], [coffre, "village"], [sentier, "foret"], [riviere, "riviere"], [grottes, "grotte"], [pierre, "temple"], [gardien, "montagne"]];
  for (const [id, cle] of visuels) await base.from("chapitres").update({ visuel_defaut: cle }).eq("id", id);
  await base.from("chapitres").update({ resume: "Une rivière qui brille sous la lune. Ses reflets montrent des chemins qui n’existent pas." }).eq("id", riviere);
  const eleves = await elevesDe(base, classeId);
  const groupe = (prenoms: string[]) => prenoms.map((p) => ({ eleve: eleves[p].id }));
  await semerAttribution(base, fete, groupe(["Mathis", "Adam", "Louise"]));
  await semerAttribution(base, coffre, groupe(["Sacha", "Léna", "Yanis"]));
  await semerAttribution(base, sentier, groupe(["Jade", "Rayan", "Lina"]));
  await semerAttribution(base, riviere, groupe(["Chloé", "Emma", "Hugo", "Inès"]));
  await semerAttribution(base, grottes, groupe(["Noah", "Manon", "Ilyes"]));
  await semerAttribution(base, pierre, groupe(["Rose", "Tom", "Zoé", "Nolan"]));
  await semerAttribution(base, gardien, groupe(["Anna", "Elio", "Maëlys", "Gabin"]));

  const colonne = page.getByRole("navigation").filter({ has: page.getByRole("link", { name: "Parties et chapitres" }) }).first();
  const carteChapitre = (titre: string) => page.locator("li[id^='chapitre-']").filter({ has: page.getByRole("heading", { name: titre, level: 3 }) });
  // Une carte du schéma, par son titre seul : la phrase d'un onglet peut contenir le titre d'une autre scène
  const carte = (titre: string) => page.locator(".carte-chemin", { has: page.locator(".carte-chemin__titre", { hasText: titre }) });
  const plus = (titre: string) => page.getByRole("button", { name: `Ajouter une suite à « ${titre} »` });
  const bulle = page.locator("form.geste-chemin");
  const action = page.getByLabel("Ce que fait le lecteur");
  const suite = page.getByLabel("Nouvelle scène");
  const schema = page.locator(".react-flow").first();

  // 2 — « Parties et chapitres », là où le tuto 4 s'arrête ; on ouvre « Le vieux coffre »
  await aller(page, `/projet/${projet}/plan`);
  await carteChapitre(CHAPITRE).waitFor();
  await page.waitForTimeout(800);
  await capturer(page, "plan", { colonne, coffre: carteChapitre(CHAPITRE), ouvrirCoffre: carteChapitre(CHAPITRE).getByRole("link").first() });
  await carteChapitre(CHAPITRE).getByRole("link").first().click();
  const ajouterScene = page.getByRole("button", { name: "Ajouter une scène" });
  await ajouterScene.waitFor();
  await page.waitForTimeout(800);
  const bascule = page.getByRole("group", { name: "Vue du chapitre" });
  await capturer(page, "chapitre-vide", { colonne, ajouterScene, bascule, chemins: bascule.getByRole("button", { name: "Chemins" }) });
  await capturer(page, "survol-ajouter", { colonne, ajouterScene, bascule }, ajouterScene);
  await ajouterScene.click();
  const sansTitre = page.locator(".carte-chemin").first();
  await sansTitre.waitFor();
  await page.waitForTimeout(1200);
  await capturer(page, "premiere-carte", { colonne, carte: sansTitre, schema });

  // Son titre, dans le panneau de la scène cliquée (« Cliquez-la pour lui donner un titre »)
  await sansTitre.click();
  const panneau = page.locator(".panneau-chemin");
  const titreScene = panneau.getByLabel("Titre", { exact: true });
  await titreScene.waitFor();
  await page.waitForTimeout(1200);
  await capturer(page, "panneau", { carte: sansTitre, panneau, titre: titreScene, schema });
  await titreScene.click();
  await titreScene.fill("");
  await capturer(page, "panneau-titre-focus", { carte: sansTitre, panneau, titre: titreScene, schema });
  await titreScene.pressSequentially(PREMIERE, { delay: 30 });
  await page.waitForTimeout(1800);
  await capturer(page, "panneau-titre", { carte: carte(PREMIERE), panneau, titre: titreScene, schema });
  await page.getByRole("button", { name: "Fermer le panneau de la scène" }).click();
  await page.waitForTimeout(1500);
  await capturer(page, "premiere-carte-titree", { colonne, carte: carte(PREMIERE), schema });

  // 3 — Le « + » de la carte : la bulle, ce que fait le lecteur, le titre de la scène suivante
  const ajouterChoix = async (de: string, c: { action: string; titre: string }, nom: string, filmer: boolean) => {
    await carte(de).hover();
    if (filmer) await capturer(page, `${nom}-survol`, { carte: carte(de), plus: plus(de), schema }, plus(de));
    await plus(de).click();
    await action.waitFor();
    if (filmer) await capturer(page, `${nom}-bulle`, { carte: carte(de), plus: plus(de), bulle, action, suite }, "tenue");
    await action.pressSequentially(c.action, { delay: 30 });
    if (filmer) await capturer(page, `${nom}-action`, { carte: carte(de), bulle, action, suite }, "tenue");
    await suite.click();
    if (filmer) await capturer(page, `${nom}-titre-focus`, { carte: carte(de), bulle, action, suite }, "tenue");
    await suite.pressSequentially(c.titre, { delay: 30 });
    const ajouter = bulle.getByRole("button", { name: "Ajouter" });
    if (filmer) await capturer(page, `${nom}-titre`, { carte: carte(de), bulle, action, suite, ajouter }, "tenue");
    await ajouter.click();
    await carte(c.titre).waitFor();
    await page.waitForTimeout(1500);
  };
  await ajouterChoix(PREMIERE, CHOIX[0], "choix1", true);
  const cartes = () => ({
    colonne, schema,
    grenier: carte(PREMIERE),
    carteBrille: carte(CHOIX[0].titre),
    pic: carte(CHOIX[1].titre),
    cuisine: carte(SAUT.titre),
    onglets: carte(PREMIERE).locator("xpath=..").locator(".onglet-chemin"),
  });
  await capturer(page, "choix1-ajoute", cartes());

  // 4 — Un deuxième choix, puis un troisième fait pendant le saut du temps
  await ajouterChoix(PREMIERE, CHOIX[1], "choix2", true);
  await capturer(page, "choix2-ajoute", cartes());
  await ajouterChoix(PREMIERE, SAUT, "saut", false);
  await page.waitForTimeout(6000); // le message de l'ajout est parti
  await capturer(page, "trois-choix", cartes());

  // 5 — Le « + » de « Pic l'écureuil » tiré jusqu'à « La carte qui brille » : la bulle ne demande
  // que ce que fait le lecteur, puis « Relier »
  await carte(LIEN.de).hover();
  await capturer(page, "lien-survol", { ...cartes(), plus: plus(LIEN.de) }, plus(LIEN.de));
  const depart = (await plus(LIEN.de).boundingBox())!;
  const arrivee = (await carte(LIEN.vers).boundingBox())!;
  const x0 = depart.x + depart.width / 2;
  const y0 = depart.y + depart.height / 2;
  const x1 = arrivee.x + arrivee.width / 2;
  const y1 = arrivee.y + arrivee.height / 2;
  await page.mouse.move(x0, y0);
  await page.mouse.down();
  for (let i = 1; i <= 24; i++) {
    await page.mouse.move(x0 + ((x1 - x0) * i) / 48, y0 + ((y1 - y0) * i) / 48);
    await page.waitForTimeout(16);
  }
  await capturer(page, "lien-en-route", { ...cartes(), plus: plus(LIEN.de) }, "tenue");
  for (let i = 25; i <= 48; i++) {
    await page.mouse.move(x0 + ((x1 - x0) * i) / 48, y0 + ((y1 - y0) * i) / 48);
    await page.waitForTimeout(16);
  }
  await capturer(page, "lien-sur-la-carte", { ...cartes(), plus: plus(LIEN.de) }, "tenue");
  await page.mouse.up();
  await action.waitFor();
  const relier = bulle.getByRole("button", { name: "Relier" });
  await capturer(page, "lien-bulle", { ...cartes(), bulle, action, relier }, "tenue");
  await action.pressSequentially(LIEN.action, { delay: 30 });
  await capturer(page, "lien-action", { ...cartes(), bulle, action, relier }, "tenue");
  await relier.click();
  await page.waitForTimeout(1800);
  await capturer(page, "lien-fait", cartes());

  // 6 — Tout le chapitre, le message parti
  await page.waitForTimeout(6000);
  await capturer(page, "arbre", cartes());

  // version : les captures gardent leur nom d'un jeu à l'autre ; le studio les recharge par elle
  const donnees = JSON.stringify({ largeur: LARGEUR, hauteur: HAUTEUR, densite: 2, version: Date.now(), ecrans: boites }, null, 2);
  writeFileSync(`${dossier}/boites.json`, donnees);
  writeFileSync(`${dossier}/boites.js`, `// Écrit par app/tests/captures/tuto-chemins.spec.ts — ne pas modifier\nwindow.BOITES = ${donnees};\n`);
});
