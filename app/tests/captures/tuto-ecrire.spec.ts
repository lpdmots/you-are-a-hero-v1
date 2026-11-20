import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { test, type Locator, type Page } from "@playwright/test";
import {
  adultePret, aller, choixAuto, creerClasse, elevesDe, inscrire, lireCodes, ouvrirLaClasse, semerAttribution, semerBlocs, semerPartie,
  semerProjet, supprimerComptes, taperCode,
} from "../parcours/outils";

/**
 * Les vrais écrans du tuto « Faire écrire la classe » (V1/video/tuto-ecrire/SCRIPT.md), joués sur
 * la base locale : npx playwright test --config playwright.local.config.ts tuto-ecrire
 *
 * Même méthode que tuto-chemins.spec.ts : chaque écran en PNG (1440 × 810, densité 2) et
 * boites.json / boites.js, la place de ce que la vidéo vise. Ce n'est pas un test.
 * Le projet des tutos 2 à 5 (« Le secret de la forêt bleue », classe « CM2 des Tilleuls »), là où
 * le tuto 5 s'arrête : le chapitre « Le vieux coffre » et ses quatre scènes reliées. L'enseignante
 * donne une consigne et sa liste à « La carte qui brille » ; Sacha la prend dans « Mon travail »,
 * l'écrit, se relit et la remet ; Léna voit qu'elle est prise ; la scène attend au Suivi.
 * Inventé pour la vidéo, sur un compte d'essai supprimé à la fin. Les aides de l'IA sont éteintes.
 * La classe se crée par l'écran : les élèves s'y connectent avec leurs vrais codes.
 */
const dossier = resolve(__dirname, "../../../video/tuto-ecrire/captures");
const LARGEUR = 1440;
const HAUTEUR = 810;
const CLASSE = "CM2 des Tilleuls";
const TITRE = "Le secret de la forêt bleue";
const ELEVES = [
  "Inès", "Mathis", "Léna", "Noah", "Jade", "Adam", "Louise", "Sacha", "Chloé", "Yanis", "Emma", "Rayan",
  "Lina", "Hugo", "Manon", "Ilyes", "Rose", "Tom", "Zoé", "Nolan", "Anna", "Elio", "Maëlys", "Gabin",
];
const CHAPITRE = "Le vieux coffre";
const SCENES = ["Le grenier de Timéo", "La carte qui brille", "Pic l’écureuil", "La cuisine endormie"];
const SCENE = SCENES[1];
// La consigne, ligne après ligne, et sa liste (« J'ai pensé à : » chez l'élève)
const CONSIGNE = [
  "Timéo ouvre le vieux coffre du grenier.",
  " Raconte ce qu’il trouve au fond : une carte qui brille dans le noir.",
  " Que montre-t-elle ?",
];
const LISTE = ["décrire le coffre et la carte", "dire ce que ressent Timéo", "les majuscules et les points"];
// Le texte de Sacha, paragraphe après paragraphe
const TEXTE = [
  "Timéo souleva le couvercle du vieux coffre. Il grinça si fort que Pic sursauta.",
  "Au fond, sous une couverture pleine de poussière, une carte brillait dans le noir.",
  "Timéo avait un peu peur, mais il la déplia doucement. Un chemin bleu s’allumait sur le papier !",
];
// Les autres scènes du chapitre, qui ont déjà leur consigne
const AUTRES: Record<string, string> = {
  [SCENES[0]]: "Timéo monte au grenier avec Pic. Décris le grenier : la poussière, les vieux objets, et le coffre dans un coin.",
  [SCENES[2]]: "Timéo appelle Pic. L’écureuil arrive en courant : que dit-il à Timéo ?",
  [SCENES[3]]: "Timéo redescend sans faire de bruit. Raconte la cuisine endormie, la nuit.",
};

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
 * élément ; tenue : la souris reste où elle est (un champ où l'on écrit).
 */
async function capturer(page: Page, nom: string, cibles: Record<string, Locator> = {}, survol?: Locator | "tenue"): Promise<void> {
  n += 1;
  const cle = `${String(n).padStart(2, "0")}-${nom}`;
  if (survol === "tenue") {
    // rien
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

test("Faire écrire la classe : les écrans du tuto", async ({ page, browser }) => {
  test.setTimeout(400_000);
  rmSync(dossier, { recursive: true, force: true });
  mkdirSync(dossier, { recursive: true });
  const { compte, base } = await adultePret(page);
  await base.from("enseignants").update({
    nom_affiche: "Mme Laurent",
    reglages_ia: { proposer: false },
    aides_masquees: ["classes", "preparation", "plan", "suivi", "livre-chemins", "livre-relire"],
  }).eq("id", compte.id);
  // La classe par l'écran, pour que Sacha et Léna se connectent avec leurs codes
  const classe = await creerClasse(page, CLASSE);
  await inscrire(page, classe.id, ELEVES);
  const codes = await lireCodes(page, classe.id);
  const projet = await semerProjet(base, compte, "classe", "choix", TITRE, classe.id);
  await base.from("projets").update({ visuel_defaut: "foret" }).eq("id", projet);

  // Le plan tel que les tutos 4 et 5 le laissent
  await base.from("preparations").update({
    univers: "Une immense forêt dont les arbres deviennent bleus la nuit. Au cœur de la forêt, un village caché sous les racines d’un arbre géant.",
    enjeu: "Retrouver la pierre de lune avant la fin de l’hiver. Sans elle, la forêt perdra sa couleur bleue et le village sera découvert.",
  }).eq("projet_id", projet);
  await base.from("personnages").insert({
    projet_id: projet, enseignant_id: compte.id, nom: "Timéo", heros: true, rang: 0,
    description: "Timéo, 10 ans, vit au village des racines. Curieux et courageux, mais il a peur du noir. Son ami : Pic, un écureuil qui parle.",
  });
  const village = await semerPartie(base, projet, "Le village des racines", [{ titre: "La fête des lucioles" }, { titre: CHAPITRE, scenes: SCENES }], "jardin");
  const foret = await semerPartie(base, projet, "La forêt de la nuit", [{ titre: "Le sentier interdit" }, { titre: "La rivière aux reflets" }, { titre: "Les grottes chantantes" }], "foret");
  const coeur = await semerPartie(base, projet, "Le cœur de la forêt", [{ titre: "La pierre de lune" }, { titre: "Le gardien de la pierre" }], "temple");
  const chapitres = [...village.chapitres, ...foret.chapitres, ...coeur.chapitres];
  const ids = chapitres.map((c) => c.id);
  const [fete, coffre, sentier, riviere, grottes, pierre, gardien] = ids;
  const visuels: [string, string][] = [[fete, "etang"], [coffre, "village"], [sentier, "foret"], [riviere, "riviere"], [grottes, "grotte"], [pierre, "temple"], [gardien, "montagne"]];
  for (const [id, cle] of visuels) await base.from("chapitres").update({ visuel_defaut: cle }).eq("id", id);
  await base.from("chapitres").update({ resume: "Une rivière qui brille sous la lune. Ses reflets montrent des chemins qui n’existent pas." }).eq("id", riviere);
  const eleves = await elevesDe(base, classe.id);
  const groupe = (prenoms: string[]) => prenoms.map((p) => ({ eleve: eleves[p].id }));
  await semerAttribution(base, fete, groupe(["Mathis", "Adam", "Louise"]));
  await semerAttribution(base, coffre, groupe(["Sacha", "Léna", "Yanis"]));
  await semerAttribution(base, sentier, groupe(["Jade", "Rayan", "Lina"]));
  await semerAttribution(base, riviere, groupe(["Chloé", "Emma", "Hugo", "Inès"]));
  await semerAttribution(base, grottes, groupe(["Noah", "Manon", "Ilyes"]));
  await semerAttribution(base, pierre, groupe(["Rose", "Tom", "Zoé", "Nolan"]));
  await semerAttribution(base, gardien, groupe(["Anna", "Elio", "Maëlys", "Gabin"]));

  // Les chemins du tuto 5 : trois choix du grenier, et Pic qui rejoint la carte
  const [grenier, brille, pic, cuisine] = chapitres[1].scenes;
  await semerBlocs(base, grenier, [
    choixAuto("Ouvrir le coffre", brille), choixAuto("Appeler Pic à l’aide", pic), choixAuto("Redescendre sans bruit", cuisine),
  ]);
  await semerBlocs(base, pic, [choixAuto("Ouvrir le coffre avec Pic", brille)]);
  for (const [titre, consigne] of Object.entries(AUTRES)) {
    const id = chapitres[1].scenes[SCENES.indexOf(titre)];
    await base.from("scenes").update({ consigne }).eq("id", id);
  }

  const colonne = page.getByRole("navigation").filter({ has: page.getByRole("link", { name: "Parties et chapitres" }) }).first();
  const carteChapitre = (titre: string) => page.locator("li[id^='chapitre-']").filter({ has: page.getByRole("heading", { name: titre, level: 3 }) });
  const carte = (titre: string) => page.locator(".carte-chemin", { has: page.locator(".carte-chemin__titre", { hasText: titre }) });
  const schema = page.locator(".react-flow").first();

  // 2 — « Parties et chapitres », on ouvre « Le vieux coffre » : « Chemins », puis une scène
  await aller(page, `/projet/${projet}/plan`);
  await carteChapitre(CHAPITRE).waitFor();
  await page.waitForTimeout(800);
  await capturer(page, "plan", { colonne, coffre: carteChapitre(CHAPITRE), ouvrirCoffre: carteChapitre(CHAPITRE).getByRole("link").first() });
  await carteChapitre(CHAPITRE).getByRole("link").first().click();
  await carte(SCENE).waitFor();
  await page.waitForTimeout(1500);
  const cartes = () => ({ colonne, schema, grenier: carte(SCENES[0]), brille: carte(SCENES[1]), pic: carte(SCENES[2]), cuisine: carte(SCENES[3]) });
  await capturer(page, "chemins", cartes());
  await capturer(page, "survol-carte", cartes(), carte(SCENE));
  await carte(SCENE).click();
  const panneau = page.locator(".panneau-chemin");
  const consigne = panneau.getByLabel(/^Consigne/);
  await consigne.waitFor();
  await page.waitForTimeout(1500);
  const champs = () => ({
    ...cartes(), panneau, consigne,
    liste: panneau.locator(".verif"),
    ajouterElement: panneau.getByRole("button", { name: "Ajouter un élément" }),
    elements: panneau.getByLabel("Élément de la liste"),
  });
  await capturer(page, "panneau", champs());

  // 3 — La consigne, ligne après ligne, puis la liste, élément après élément
  await consigne.click();
  await capturer(page, "consigne-focus", champs(), "tenue");
  for (const [i, ligne] of CONSIGNE.entries()) {
    await consigne.pressSequentially(ligne, { delay: 15 });
    await page.waitForTimeout(300);
    await capturer(page, `consigne-${i + 1}`, champs(), "tenue");
  }
  await capturer(page, "survol-ajouter-element", champs(), panneau.getByRole("button", { name: "Ajouter un élément" }));
  await panneau.getByRole("button", { name: "Ajouter un élément" }).click();
  for (const [i, element] of LISTE.entries()) {
    const champ = panneau.getByLabel("Élément de la liste").nth(i);
    await champ.waitFor();
    await capturer(page, `element-${i + 1}-focus`, { ...champs(), champ }, "tenue");
    await champ.pressSequentially(element, { delay: 15 });
    await capturer(page, `element-${i + 1}`, { ...champs(), champ }, "tenue");
    if (i < LISTE.length - 1) await champ.press("Enter");
  }
  await page.locator("body").click({ position: { x: 5, y: 5 } }).catch(() => {});
  await page.waitForTimeout(2000); // enregistré
  await capturer(page, "panneau-rempli", champs());

  // Saut du temps : le jour de l'écriture, Léna et Yanis ont déjà pris leurs scènes
  await base.from("scenes").update({ prise_par_eleve: eleves["Léna"].id }).eq("id", grenier);
  await base.from("scenes").update({ prise_par_eleve: eleves["Yanis"].id }).eq("id", pic);

  // 4 — Sacha, sur son ordinateur : « Mon travail », « Choisir une scène », la carte cochée, « Je m'en occupe »
  const poste = async () => {
    const contexte = await browser.newContext({ locale: "fr-FR", timezoneId: "Europe/Paris", viewport: { width: LARGEUR, height: HAUTEUR }, deviceScaleFactor: 2 });
    return { contexte, page: await contexte.newPage() };
  };
  const sacha = await poste();
  const s = sacha.page;
  await ouvrirLaClasse(s, classe.identifiant, classe.motDePasse);
  await taperCode(s, "Sacha", codes.Sacha);
  await s.waitForURL(/\/travail$/);
  await s.locator("html[data-pret]").waitFor();
  await s.waitForTimeout(1200);
  const choisir = s.getByRole("link", { name: "Choisir une scène" });
  await capturer(s, "mon-travail", { choisir, mesScenes: s.locator("section[aria-labelledby='t-mien']") });
  await capturer(s, "survol-choisir", { choisir }, choisir);
  await choisir.click();
  await s.waitForURL(/vue=scenes/);
  await s.locator("html[data-pret]").waitFor();
  await s.waitForTimeout(1500);
  const fiche = (p: Page, titre: string) => p.locator("article.fiche").filter({ hasText: titre });
  const fiches = (p: Page) => ({
    fiches: p.locator(".fiches").first(),
    grenier: fiche(p, SCENES[0]), brille: fiche(p, SCENES[1]), pic: fiche(p, SCENES[2]), cuisine: fiche(p, SCENES[3]),
    case: fiche(p, SCENE).locator(".fiche__choisir"),
    qui: fiche(p, SCENE).locator(".fiche__qui"),
  });
  await capturer(s, "scenes", fiches(s));
  await capturer(s, "survol-fiche", fiches(s), fiche(s, SCENE).locator(".fiche__choisir"));
  await fiche(s, SCENE).locator(".fiche__choisir input").check();
  await s.waitForTimeout(600);
  const occupe = s.getByRole("region", { name: "Sélection" }).getByRole("button", { name: "Je m’en occupe" });
  await capturer(s, "cochee", { ...fiches(s), selection: s.getByRole("region", { name: "Sélection" }), occupe });
  await capturer(s, "survol-occupe", { ...fiches(s), selection: s.getByRole("region", { name: "Sélection" }), occupe }, occupe);
  await occupe.click();
  await fiche(s, SCENE).getByText("Tu t’en occupes").waitFor();
  await s.waitForTimeout(800);
  await capturer(s, "prise", fiches(s));

  // Ses camarades voient alors qu'elle est prise : le chapitre chez Léna
  const lena = await poste();
  const l = lena.page;
  await ouvrirLaClasse(l, classe.identifiant, classe.motDePasse);
  await taperCode(l, "Léna", codes["Léna"]);
  await l.waitForURL(/\/travail$/);
  await aller(l, `/travail/chapitre/${coffre}?vue=scenes`);
  await l.waitForTimeout(1500);
  await capturer(l, "chez-lena", fiches(l));

  // 5 — Sacha ouvre sa scène, écrit, se relit, remet
  await capturer(s, "survol-ouvrir", fiches(s), fiche(s, SCENE));
  await fiche(s, SCENE).locator(".fiche__cible").click();
  await s.waitForURL(/\/travail\/scene\//);
  await s.locator("html[data-pret]").waitFor();
  const copie = s.locator('.copie__texte[contenteditable="true"]');
  await copie.waitFor();
  await s.waitForTimeout(1500);
  const lieux = () => ({
    copie,
    consigne: s.locator(".consigne, [class*='consigne']").first(),
    liste: s.locator(".verif").first(),
    cases: s.locator(".verif__coche"),
    remettre: s.getByRole("button", { name: /^Remettre/ }),
    pied: s.locator(".copie__pied"),
  });
  await capturer(s, "scene", lieux());
  await copie.click();
  await s.waitForTimeout(400);
  await capturer(s, "copie-focus", lieux(), "tenue");
  for (const [i, paragraphe] of TEXTE.entries()) {
    if (i > 0) await s.keyboard.press("Enter");
    await s.keyboard.type(paragraphe, { delay: 10 });
    await s.waitForTimeout(500);
    await capturer(s, `texte-${i + 1}`, lieux(), "tenue");
  }
  await s.waitForTimeout(3000); // « Enregistré »
  await capturer(s, "texte-enregistre", lieux());
  for (const [i, element] of LISTE.entries()) {
    const coche = s.getByRole("checkbox", { name: element });
    await capturer(s, `survol-coche-${i + 1}`, { ...lieux(), coche: s.locator(".verif__coche").nth(i) }, s.locator(".verif__coche").nth(i));
    await coche.check();
    await s.waitForTimeout(500);
  }
  await s.waitForTimeout(1200);
  await capturer(s, "cochees", lieux());
  await capturer(s, "survol-remettre", lieux(), s.getByRole("button", { name: /^Remettre/ }));
  await s.getByRole("button", { name: /^Remettre/ }).click();
  await s.getByText("relit ce texte").waitFor();
  await s.waitForTimeout(1200);
  await capturer(s, "remise", { ...lieux(), etat: s.locator(".copie__etat") });

  // 6 — Chez l'enseignante : « Chemins » de nouveau, puis le Suivi, la scène « À valider »
  await page.reload();
  await page.locator("html[data-pret]").waitFor();
  await page.waitForTimeout(1500);
  const suivi = colonne.getByRole("link", { name: /^Suivi/ });
  await capturer(page, "chemins-apres", { ...cartes(), suivi });
  await capturer(page, "survol-suivi", { ...cartes(), suivi }, suivi);
  await suivi.click();
  await page.waitForURL(/\/suivi/);
  await page.locator("html[data-pret]").waitFor();
  await page.waitForTimeout(1500);
  const ligne = page.locator("li, tr").filter({ hasText: SCENE }).last();
  await capturer(page, "suivi", { colonne, suivi, ligne, tampon: ligne.locator(".tampon, [class*='tampon']").first() });

  await sacha.contexte.close();
  await lena.contexte.close();
  const donnees = JSON.stringify({ largeur: LARGEUR, hauteur: HAUTEUR, densite: 2, version: Date.now(), ecrans: boites }, null, 2);
  writeFileSync(`${dossier}/boites.json`, donnees);
  writeFileSync(`${dossier}/boites.js`, `// Écrit par app/tests/captures/tuto-ecrire.spec.ts — ne pas modifier\nwindow.BOITES = ${donnees};\n`);
});
