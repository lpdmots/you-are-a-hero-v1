import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { test, type Locator, type Page } from "@playwright/test";
import { adultePret, aller, semerClasse, semerPartie, semerProjet, supprimerComptes } from "../parcours/outils";

/**
 * Les vrais écrans du tuto « Préparer son histoire avec la classe »
 * (V1/video/tuto-preparer/SCRIPT.md), joués sur la base locale :
 * npx playwright test --config playwright.local.config.ts tuto-preparer
 *
 * Même méthode que tuto-creer-un-projet.spec.ts : chaque écran en PNG (1440 × 810, densité 2) et
 * boites.json / boites.js, la place de ce que la vidéo vise. Ce n'est pas un test.
 * Le projet du tuto 2 (« Le secret de la forêt bleue », classe « CM2 des Tilleuls »), inventé
 * pour la vidéo, sur un compte d'essai supprimé à la fin. Les aides de l'IA sont éteintes : aucun ✦.
 */
const dossier = resolve(__dirname, "../../../video/tuto-preparer/captures");
const LARGEUR = 1440;
const HAUTEUR = 810;
const CLASSE = "CM2 des Tilleuls";
const TITRE = "Le secret de la forêt bleue";
const ELEVES = [
  "Inès", "Mathis", "Léna", "Noah", "Jade", "Adam", "Louise", "Sacha", "Chloé", "Yanis", "Emma", "Rayan",
  "Lina", "Hugo", "Manon", "Ilyes", "Rose", "Tom", "Zoé", "Nolan", "Anna", "Elio", "Maëlys", "Gabin",
];

// Les idées de la classe pour l'Univers, dans l'ordre où l'enseignant les note
const IDEES = [
  "Une forêt où les arbres deviennent bleus la nuit",
  "Un village caché sous les racines d’un arbre géant",
  "Il y a très longtemps, sans électricité",
  "Les animaux de la forêt savent parler",
  "Une ville avec des voitures volantes",
];
const RETENONS =
  "Une immense forêt dont les arbres deviennent bleus la nuit. Au cœur de la forêt, un village caché sous les racines d’un arbre géant. La règle : ne jamais quitter le sentier après le coucher du soleil.";

type Boite = { x: number; y: number; l: number; h: number };
const boites: Record<string, Record<string, Boite>> = {};
let n = 0;

/** La place d'un élément ; absent de cet écran (« Étape suivante » à la dernière étape), rien. */
async function boite(cible: Locator): Promise<Boite | null> {
  if (!(await cible.count())) return null;
  const b = await cible.first().boundingBox({ timeout: 3000 });
  if (!b) return null;
  return { x: Math.round(b.x), y: Math.round(b.y), l: Math.round(b.width), h: Math.round(b.height) };
}

/** Un écran, et la place des éléments que la vidéo désigne. survol : la souris reste sur cet élément. */
async function capturer(page: Page, nom: string, cibles: Record<string, Locator> = {}, survol?: Locator): Promise<void> {
  n += 1;
  const cle = `${String(n).padStart(2, "0")}-${nom}`;
  if (survol) await survol.hover();
  else await page.mouse.move(LARGEUR - 1, HAUTEUR - 1);
  await page.waitForTimeout(600);
  // le badge du serveur de développement, les messages déjà lus, le bouton « Plein écran » (la vraie
  // projection est en plein écran : ce bouton n'y paraît pas)
  await page.evaluate(() => {
    document.querySelectorAll("nextjs-portal").forEach((e) => e.remove());
    document.querySelectorAll<HTMLElement>(".message").forEach((m) => (m.style.visibility = "hidden"));
    document.querySelectorAll<HTMLButtonElement>("button").forEach((b) => {
      if (b.textContent?.trim() === "Plein écran") b.style.display = "none";
    });
  });
  await page.evaluate(() => {
    const parcours = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let t = parcours.nextNode(); t; t = parcours.nextNode()) {
      if (t.nodeValue && /localhost:(3100|4840)/.test(t.nodeValue)) t.nodeValue = t.nodeValue.replace(/localhost:(3100|4840)/g, "iletaituneclasse.com");
    }
  });
  const places: Record<string, Boite> = {};
  for (const [quoi, cible] of Object.entries(cibles)) {
    const b = await boite(cible);
    if (b) places[quoi] = b;
  }
  boites[cle] = places;
  await page.screenshot({ path: `${dossier}/${cle}.png` });
}

test.use({ viewport: { width: LARGEUR, height: HAUTEUR }, deviceScaleFactor: 2 });
test.afterAll(async () => {
  await supprimerComptes();
});

test("Préparer son histoire : les écrans du tuto", async ({ page }) => {
  test.setTimeout(300_000);
  rmSync(dossier, { recursive: true, force: true });
  mkdirSync(dossier, { recursive: true });
  const { compte, base } = await adultePret(page);
  // Aucun ✦ à l'écran : les aides de l'IA ont leur propre tuto
  await base.from("enseignants").update({ nom_affiche: "Mme Laurent", reglages_ia: { proposer: false } }).eq("id", compte.id);
  const { id: classeId } = await semerClasse(base, CLASSE, ELEVES);
  const projet = await semerProjet(base, compte, "classe", "choix", TITRE, classeId);
  await base.from("projets").update({ visuel_defaut: "foret" }).eq("id", projet);

  const ligne = (p: Page) => p.getByRole("navigation", { name: "Étapes de la préparation" });
  const etape = (p: Page, nom: string) => ligne(p).getByRole("link", { name: new RegExp(nom) });
  const question = page.getByRole("heading", { level: 2 });
  const questions = page.getByRole("region", { name: "Questions pour la classe" });
  const idees = page.getByRole("region", { name: "Idées" });
  const noter = page.getByRole("button", { name: "Noter une idée" });
  const retenons = page.getByRole("region", { name: /Nous retenons/ });
  const suivante = page.getByRole("link", { name: /Étape suivante/ });
  const idee = (texte: string) => idees.locator("li").filter({ hasText: texte });

  // 2 — La Préparation, là où le tuto 2 s'arrête : l'Univers, rien encore de noté
  await aller(page, `/projet/${projet}/preparation`);
  await ligne(page).waitFor();
  const projeter = page.getByRole("link", { name: "Projeter" });
  await capturer(page, "preparation", {
    ligne: ligne(page),
    univers: etape(page, "Univers"),
    personnages: etape(page, "Personnages"),
    enjeu: etape(page, "Enjeu"),
    etapes: etape(page, "Grandes étapes"),
    question,
    projeter,
    questions,
    idees,
    retenons,
  });

  // 3 — « Projeter » : le même écran en grand, sans la barre de l'application
  await projeter.click();
  await page.waitForURL(/\/atelier\/[0-9a-f-]{36}\/univers/);
  await ligne(page).waitFor();
  const projection = () => ({
    ligne: ligne(page),
    univers: etape(page, "Univers"),
    personnages: etape(page, "Personnages"),
    enjeu: etape(page, "Enjeu"),
    etapes: etape(page, "Grandes étapes"),
    question,
    questions,
    relances: questions.locator("ul"),
    idees,
    noter,
    retenons,
    suivante,
  });
  await capturer(page, "projection", projection());

  // 4 — Les idées de la classe, notées l'une après l'autre
  await noter.click();
  const champ = page.getByLabel("Nouvelle idée");
  await champ.waitFor();
  await capturer(page, "idee-champ", { ...projection(), champ });
  for (const [i, texte] of IDEES.entries()) {
    await champ.pressSequentially(texte);
    if (i === 0) await capturer(page, "idee-frappee", { ...projection(), champ });
    await champ.press("Enter");
    await idee(texte).waitFor();
    await capturer(page, `idees-${i + 1}`, { ...projection(), champ, derniere: idee(texte) });
  }
  // retenir les deux premières ; les deux suivantes restent à discuter ; la dernière est écartée
  const cibles = () => ({ ...projection(), ...Object.fromEntries(IDEES.map((t, i) => [`idee${i + 1}`, idee(t)])) });
  for (const i of [0, 1]) {
    await idee(IDEES[i]).getByRole("button", { name: /^Retenir/ }).click();
    await idee(IDEES[i]).getByRole("button", { name: /^Ne plus retenir/ }).waitFor();
    // la coche cliquée garderait le focus, et les gestes de sa ligne (« Écarter ») resteraient visibles
    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
    await capturer(page, `retenue-${i + 1}`, { ...cibles(), coche: idee(IDEES[i]).getByRole("button", { name: /retenir/i }) });
  }
  const ecarter = idee(IDEES[4]).getByRole("button", { name: /^Écarter/ });
  await capturer(page, "survol-ecarter", { ...cibles(), ecarter }, idee(IDEES[4]));
  await ecarter.click();
  const ecartees = page.getByText(/Idées écartées · 1/);
  await ecartees.waitFor();
  await capturer(page, "ecartee", { ...projection(), ecartees, ...Object.fromEntries(IDEES.slice(0, 4).map((t, i) => [`idee${i + 1}`, idee(t)])) });

  // 5 — « Nous retenons… » : le résumé de la classe ; l'étape se coche
  const texte = page.locator("#texte-retenu");
  await texte.click();
  await capturer(page, "retenons-focus", { ...projection(), texte });
  // le champ grandit quand le texte passe à la quatrième ligne : l'écran à cet instant (« après »,
  // le premier mot qui n'y tient plus), pour que la vidéo l'agrandisse au moment où la ligne commence
  await texte.fill(RETENONS.slice(0, RETENONS.indexOf("après") + 5));
  await capturer(page, "retenons-agrandi", { ...projection(), texte });
  await texte.fill(RETENONS);
  await capturer(page, "retenons-rempli", { ...projection(), texte });
  await texte.blur();
  await page.getByText("Enregistré").waitFor();
  await page.waitForTimeout(1500);
  await capturer(page, "univers-coche", { ...projection(), texte, coche: etape(page, "Univers").locator(".temps__num") });

  // Les autres étapes, faites ensuite avec la classe : semées pour la vidéo. Les idées gardent
  // l'ordre où elles ont été notées (une seconde d'écart chacune)
  await base.from("preparations").update({
    enjeu: "Retrouver la pierre de lune avant la fin de l’hiver. Sans elle, la forêt perdra sa couleur bleue et le village sera découvert.",
  }).eq("projet_id", projet);
  const [heros] = (await base.from("personnages").insert({
    projet_id: projet, enseignant_id: compte.id, nom: "Timéo", heros: true, rang: 0,
    description: "Timéo, 10 ans, vit au village des racines. Curieux et courageux, mais il a peur du noir. Son ami : Pic, un écureuil qui parle.",
  }).select("id")).data!;
  let seconde = 0;
  const pistes = (rubrique: string, liste: [string, "retenue" | "discuter" | "ecartee"][], personnage: string | null = null) =>
    liste.map(([t, etat]) => ({
      projet_id: projet, enseignant_id: compte.id, rubrique, texte: t, etat, personnage_id: personnage,
      cree_le: new Date(Date.now() - 3_600_000 + 1000 * seconde++).toISOString(),
    }));
  await base.from("pistes").insert([
    ...pistes("personnages", [["Un garçon de 10 ans, Timéo", "retenue"], ["Il a peur du noir", "retenue"], ["Un écureuil qui parle l’accompagne", "retenue"], ["Il a une sœur jumelle", "discuter"]], heros.id),
    ...pistes("enjeu", [["La pierre de lune a disparu", "retenue"], ["Si la forêt perd sa couleur, le village sera découvert", "retenue"], ["Un sorcier veut la pierre", "discuter"]]),
    ...pistes("etapes", [["Timéo trouve une carte dans un vieux coffre", "retenue"], ["Deux chemins : la rivière ou les grottes", "retenue"], ["Plusieurs fins possibles", "discuter"]]),
  ]);

  // Étape suivante : Personnages ; puis, par la ligne d'étapes, Enjeu et Grandes étapes
  await suivante.click();
  await page.waitForURL(/\/atelier\/[0-9a-f-]{36}\/personnages/);
  await page.getByText("Timéo, 10 ans").waitFor();
  await page.waitForTimeout(800);
  await capturer(page, "personnages", projection());
  await etape(page, "Enjeu").click();
  await page.waitForURL(/\/atelier\/[0-9a-f-]{36}\/enjeu/);
  await page.getByText("Retrouver la pierre de lune").waitFor();
  await page.waitForTimeout(800);
  await capturer(page, "enjeu", projection());
  // les deux premières parties, retenues avec la classe
  await semerPartie(base, projet, "Le village des racines", [{ titre: "Le vieux coffre" }], "jardin");
  await semerPartie(base, projet, "La forêt de la nuit", [{ titre: "Le sentier interdit" }], "foret");
  await base.from("parties").update({ description: "Des maisons creusées dans les racines, éclairées par des lucioles." }).eq("projet_id", projet).eq("titre", "Le village des racines");
  await base.from("parties").update({ description: "Des arbres bleus, des sentiers qui bougent, des bruits étranges." }).eq("projet_id", projet).eq("titre", "La forêt de la nuit");
  await etape(page, "Grandes étapes").click();
  await page.waitForURL(/\/atelier\/[0-9a-f-]{36}\/etapes/);
  await page.getByText("Le village des racines").waitFor();
  await page.waitForTimeout(800);
  const ajouter = page.getByRole("button", { name: "Ajouter une partie" });
  const parties = () => ({ ...projection(), ajouter, liste: retenons.locator("ol") });
  await capturer(page, "grandes-etapes", parties());

  // 6 — Une partie de plus, ajoutée devant la classe
  await ajouter.click();
  const champPartie = page.getByLabel("Titre de la nouvelle partie");
  await champPartie.waitFor();
  await capturer(page, "partie-champ", { ...parties(), champ: champPartie });
  await champPartie.pressSequentially("Le cœur de la forêt");
  await capturer(page, "partie-frappee", { ...parties(), champ: champPartie });
  await champPartie.press("Enter");
  await page.getByText("Le cœur de la forêt").waitFor();
  // le visuel d'une nouvelle partie est tiré au hasard : le temple caché va avec la pierre de lune
  await base.from("parties").update({ visuel_defaut: "temple" }).eq("projet_id", projet).eq("titre", "Le cœur de la forêt");
  await page.reload();
  await page.getByText("Le cœur de la forêt").waitFor();
  await page.waitForTimeout(800);
  await capturer(page, "parties", { ...parties(), nouvelle: retenons.locator("li").filter({ hasText: "Le cœur de la forêt" }) });

  const donnees = JSON.stringify({ largeur: LARGEUR, hauteur: HAUTEUR, densite: 2, ecrans: boites }, null, 2);
  writeFileSync(`${dossier}/boites.json`, donnees);
  writeFileSync(`${dossier}/boites.js`, `// Écrit par app/tests/captures/tuto-preparer.spec.ts — ne pas modifier\nwindow.BOITES = ${donnees};\n`);
});
