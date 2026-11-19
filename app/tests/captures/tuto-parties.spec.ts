import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { test, type Locator, type Page } from "@playwright/test";
import { adultePret, aller, elevesDe, semerAttribution, semerClasse, semerPartie, semerProjet, supprimerComptes } from "../parcours/outils";

/**
 * Les vrais écrans du tuto « Parties et chapitres » (V1/video/tuto-parties/SCRIPT.md), joués sur
 * la base locale : npx playwright test --config playwright.local.config.ts tuto-parties
 *
 * Même méthode que tuto-preparer.spec.ts : chaque écran en PNG (1440 × 810, densité 2) et
 * boites.json / boites.js, la place de ce que la vidéo vise. Ce n'est pas un test.
 * Le projet des tutos 2 et 3 (« Le secret de la forêt bleue », classe « CM2 des Tilleuls »), là où
 * le tuto 3 s'arrête : trois parties, un chapitre chacune. Inventé pour la vidéo, sur un compte
 * d'essai supprimé à la fin. Les aides de l'IA sont éteintes : aucun ✦.
 */
const dossier = resolve(__dirname, "../../../video/tuto-parties/captures");
const LARGEUR = 1440;
const HAUTEUR = 810;
const CLASSE = "CM2 des Tilleuls";
const TITRE = "Le secret de la forêt bleue";
const ELEVES = [
  "Inès", "Mathis", "Léna", "Noah", "Jade", "Adam", "Louise", "Sacha", "Chloé", "Yanis", "Emma", "Rayan",
  "Lina", "Hugo", "Manon", "Ilyes", "Rose", "Tom", "Zoé", "Nolan", "Anna", "Elio", "Maëlys", "Gabin",
];
// Le chapitre ajouté devant la caméra
const NOUVEAU = "La rivière aux reflets";
const RESUME = ["Une rivière qui brille sous la lune.", " Ses reflets montrent des chemins qui n’existent pas."];
// Les élèves cochés pour ce chapitre, dans l'ordre des coches : tous dans la liste ouverte, sans la
// faire défiler (une case cochée ajoute une ligne sous l'élève)
const COCHES = ["Chloé", "Emma", "Hugo", "Inès"];

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
async function nettoyer(page: Page): Promise<void> {
  await page.evaluate(() => {
    document.querySelectorAll("nextjs-portal").forEach((e) => e.remove());
    document.querySelectorAll<HTMLElement>(".message").forEach((m) => (m.style.visibility = "hidden"));
    const parcours = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let t = parcours.nextNode(); t; t = parcours.nextNode()) {
      if (t.nodeValue && /localhost:(3100|4840)/.test(t.nodeValue)) t.nodeValue = t.nodeValue.replace(/localhost:(3100|4840)/g, "iletaituneclasse.com");
    }
  });
}

/**
 * Un écran, et la place des éléments que la vidéo désigne. survol : la souris reste sur cet
 * élément ; tenue : la souris reste où elle est (une carte qu'on tire).
 */
async function capturer(page: Page, nom: string, cibles: Record<string, Locator> = {}, survol?: Locator | "tenue", toute = false): Promise<void> {
  n += 1;
  const cle = `${String(n).padStart(2, "0")}-${nom}`;
  if (survol === "tenue") {
    // rien : la carte reste sous la souris
  } else if (survol) await survol.hover();
  else await page.mouse.move(LARGEUR - 1, HAUTEUR - 1);
  await page.waitForTimeout(600);
  await nettoyer(page);
  const places: Record<string, Boite> = {};
  for (const [quoi, cible] of Object.entries(cibles)) {
    const b = await boite(cible);
    if (b) places[quoi] = b;
  }
  // Où la page est descendue : les boîtes sont dans la fenêtre ; pour une page entière, dans la page
  const defile = await page.evaluate(() => window.scrollY);
  places._fenetre = { x: 0, y: toute ? 0 : defile, l: LARGEUR, h: toute ? await page.evaluate(() => document.documentElement.scrollHeight) : HAUTEUR };
  if (toute) for (const b of Object.values(places)) if (b !== places._fenetre) b.y += defile;
  boites[cle] = places;
  await page.screenshot({ path: `${dossier}/${cle}.png`, fullPage: toute });
}

/** Une carte tirée par la souris, pas à pas ; la souris reste enfoncée. */
async function tirer(page: Page, depuis: Locator, vers: { x: number; y: number }, prise: number, etapes = 24): Promise<void> {
  const b = (await depuis.boundingBox())!;
  const x0 = b.x + b.width / 2;
  const y0 = b.y + prise;
  await page.mouse.move(x0, y0);
  await page.mouse.down();
  await page.mouse.move(x0 + 12, y0 + 4, { steps: 3 });
  for (let i = 1; i <= etapes; i++) {
    await page.mouse.move(x0 + 12 + ((vers.x - x0 - 12) * i) / etapes, y0 + 4 + ((vers.y - y0 - 4) * i) / etapes);
    await page.waitForTimeout(16);
  }
  await page.waitForTimeout(400);
}

test.use({ viewport: { width: LARGEUR, height: HAUTEUR }, deviceScaleFactor: 2 });
test.afterAll(async () => {
  await supprimerComptes();
});

test("Parties et chapitres : les écrans du tuto", async ({ page }) => {
  test.setTimeout(300_000);
  rmSync(dossier, { recursive: true, force: true });
  mkdirSync(dossier, { recursive: true });
  const { compte, base } = await adultePret(page);
  // Aucun ✦ à l'écran ; l'écran d'aide de « Parties et chapitres » s'ouvre à la première visite
  await base.from("enseignants").update({
    nom_affiche: "Mme Laurent",
    reglages_ia: { proposer: false },
    aides_masquees: ["classes", "preparation", "suivi", "livre-chemins", "livre-relire"],
  }).eq("id", compte.id);
  const { id: classeId } = await semerClasse(base, CLASSE, ELEVES);
  const projet = await semerProjet(base, compte, "classe", "choix", TITRE, classeId);
  await base.from("projets").update({ visuel_defaut: "foret" }).eq("id", projet);

  // La Préparation telle que le tuto 3 la laisse : quatre étapes cochées, trois parties
  await base.from("preparations").update({
    univers: "Une immense forêt dont les arbres deviennent bleus la nuit. Au cœur de la forêt, un village caché sous les racines d’un arbre géant.",
    enjeu: "Retrouver la pierre de lune avant la fin de l’hiver. Sans elle, la forêt perdra sa couleur bleue et le village sera découvert.",
  }).eq("projet_id", projet);
  await base.from("personnages").insert({
    projet_id: projet, enseignant_id: compte.id, nom: "Timéo", heros: true, rang: 0,
    description: "Timéo, 10 ans, vit au village des racines. Curieux et courageux, mais il a peur du noir. Son ami : Pic, un écureuil qui parle.",
  });
  const village = await semerPartie(base, projet, "Le village des racines", [{ titre: "Le vieux coffre" }], "jardin");
  const foret = await semerPartie(base, projet, "La forêt de la nuit", [{ titre: "Le sentier interdit" }], "foret");
  const coeur = await semerPartie(base, projet, "Le cœur de la forêt", [{ titre: "La pierre de lune" }], "temple");
  const visuel = (id: string, cle: string) => base.from("chapitres").update({ visuel_defaut: cle }).eq("id", id);
  await visuel(village.chapitres[0].id, "village");
  await visuel(foret.chapitres[0].id, "foret");
  await visuel(coeur.chapitres[0].id, "temple");

  const colonne = page.getByRole("navigation").filter({ has: page.getByRole("link", { name: "Parties et chapitres" }) }).first();
  const lienPlan = page.getByRole("link", { name: "Parties et chapitres" }).first();
  const partie = (titre: string) => page.locator("section.partie").filter({ has: page.getByRole("heading", { name: titre, level: 2 }) });
  const carte = (titre: string) => page.locator("li[id^='chapitre-']").filter({ has: page.getByRole("heading", { name: titre, level: 3 }) });
  const ajouter = (titre: string) => partie(titre).getByRole("button", { name: "Ajouter un chapitre" });
  const plan = () => ({
    village: partie("Le village des racines"),
    foret: partie("La forêt de la nuit"),
    coeur: partie("Le cœur de la forêt"),
    ajouterForet: ajouter("La forêt de la nuit"),
  });

  // 2 — La Préparation, aux grandes étapes, là où le tuto 3 s'arrête
  await aller(page, `/projet/${projet}/preparation`);
  await page.getByRole("navigation", { name: "Étapes de la préparation" }).getByRole("link", { name: /Grandes étapes/ }).click();
  await page.getByText("Le cœur de la forêt").first().waitFor();
  await page.waitForTimeout(800);
  await capturer(page, "preparation", { colonne, lienPlan });

  // « Parties et chapitres » : son écran d'aide, à la première visite
  await lienPlan.click();
  const commencer = page.getByRole("button", { name: "Commencer" });
  await commencer.waitFor();
  await capturer(page, "aide", { colonne, lienPlan, commencer });
  await commencer.click();
  await partie("Le village des racines").waitFor();
  await page.waitForTimeout(800);
  await capturer(page, "plan", { ...plan(), colonne }, undefined, true);

  // 3 — Un chapitre de plus dans « La forêt de la nuit » : la partie en haut de la fenêtre, sa carte
  // « Ajouter un chapitre » entière (Playwright, lui, ne descendrait que jusqu'à son bord)
  await page.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), (await partie("La forêt de la nuit").boundingBox())!.y - 24);
  await page.waitForTimeout(500);
  await ajouter("La forêt de la nuit").click();
  const titre = page.getByLabel("Titre", { exact: true });
  await titre.waitFor();
  const panneau = page.getByRole("dialog").or(page.locator(".panneau")).first();
  const resume = page.getByLabel("Résumé");
  const choisir = page.getByRole("button", { name: "Choisir une image" });
  const reglages = () => ({ ...plan(), panneau, titre, resume, choisir });
  await capturer(page, "reglages", reglages());
  await titre.pressSequentially(NOUVEAU);
  await capturer(page, "titre-frappe", reglages());
  await resume.click();
  await capturer(page, "resume-focus", reglages());
  await resume.pressSequentially(RESUME[0]);
  await capturer(page, "resume-1", reglages());
  await resume.pressSequentially(RESUME[1]);
  await capturer(page, "resume-2", reglages());
  await choisir.click();
  // « Rivière » est en bas de la liste : on la cherche, comme le ferait l'enseignant
  const chercher = page.getByLabel("Chercher un visuel");
  await chercher.waitFor();
  await page.waitForTimeout(800);
  await capturer(page, "images", { ...plan(), panneau, chercher });
  await chercher.click();
  await capturer(page, "chercher-focus", { ...plan(), panneau, chercher });
  await chercher.pressSequentially("rivière");
  const riviere = page.getByRole("button", { name: "Rivière", exact: true });
  await riviere.waitFor();
  await page.waitForTimeout(1500);
  await capturer(page, "images-riviere", { ...plan(), panneau, chercher, riviere });
  await capturer(page, "survol-riviere", { ...plan(), panneau, chercher, riviere }, riviere);
  await riviere.click();
  await titre.waitFor();
  await page.waitForTimeout(1000);
  const fermer = page.getByRole("button", { name: "Fermer", exact: true }).last();
  await capturer(page, "image-choisie", { ...reglages(), fermer });
  await fermer.click();
  await carte(NOUVEAU).waitFor();
  await page.waitForTimeout(800);
  await capturer(page, "chapitre-ajoute", { ...plan(), nouveau: carte(NOUVEAU) });

  // Les autres chapitres, faits ensuite : semés au moment où la vidéo saute le temps.
  // « Le gardien de la pierre » est posé dans la mauvaise partie : il en changera au passage 4.
  const semer = async (partieId: string, t: string, cle: string) => {
    const { data, error } = await base.rpc("creer_chapitre", { p_partie: partieId, p_titre: t, p_couleur: 0, p_visuel: cle });
    if (error) throw new Error(error.message);
    return data as string;
  };
  await semer(village.partieId, "La fête des lucioles", "etang");
  await semer(foret.partieId, "Les grottes chantantes", "grotte");
  await semer(foret.partieId, "Le gardien de la pierre", "montagne");
  await page.reload();
  await carte("Le gardien de la pierre").waitFor();
  await page.waitForTimeout(800);
  const cartes = () => ({
    ...plan(),
    coffre: carte("Le vieux coffre"),
    fete: carte("La fête des lucioles"),
    sentier: carte("Le sentier interdit"),
    riviere: carte(NOUVEAU),
    grottes: carte("Les grottes chantantes"),
    gardien: carte("Le gardien de la pierre"),
    pierre: carte("La pierre de lune"),
  });
  await capturer(page, "plan-rempli", cartes(), undefined, true);

  // 4 — « La fête des lucioles » passe avant « Le vieux coffre ». La page descend d'abord sur la
  // première partie ; la souris reste loin des bords (le défilement automatique de la page).
  const descendre = async (y: number) => {
    await page.evaluate((v) => window.scrollTo({ top: v, behavior: "instant" }), y);
    await page.waitForTimeout(500);
  };
  const haut = async (l: Locator) => (await l.boundingBox())!.y + (await page.evaluate(() => window.scrollY));
  await descendre((await haut(partie("Le village des racines"))) - 24);
  await capturer(page, "avant-fete", cartes());
  const coffre = (await carte("Le vieux coffre").boundingBox())!;
  const fete = (await carte("La fête des lucioles").boundingBox())!;
  await tirer(page, carte("La fête des lucioles"), { x: coffre.x + coffre.width / 2 - 30, y: fete.y + 200 }, 200);
  await capturer(page, "tire-fete", { ...cartes(), volante: page.locator(".tiree") }, "tenue");
  await page.mouse.up();
  await page.waitForTimeout(1200);
  await capturer(page, "pose-fete", cartes());
  // la page entière, pour la faire défiler jusqu'à la deuxième partie
  const yFete = await page.evaluate(() => window.scrollY);
  await capturer(page, "plan-fete", cartes(), undefined, true);
  await descendre(yFete);

  // « Le gardien de la pierre » change de partie : après « La pierre de lune ». Sa carte en haut
  // de la fenêtre, la troisième partie dessous
  await descendre(await haut(carte("Le gardien de la pierre")));
  await capturer(page, "avant-gardien", cartes());
  const pierre = (await carte("La pierre de lune").boundingBox())!;
  await tirer(page, carte("Le gardien de la pierre"), { x: pierre.x + pierre.width * 1.5 + 20, y: pierre.y + 80 }, 200, 36);
  await capturer(page, "tire-gardien", { ...cartes(), volante: page.locator(".tiree") }, "tenue");
  await page.mouse.up();
  await page.waitForTimeout(1500);
  await capturer(page, "pose-gardien", cartes());
  await capturer(page, "plan-gardien", cartes(), undefined, true);

  // 5 — « Attribuer des élèves » pour « La rivière aux reflets »
  // la deuxième partie en haut de la fenêtre : la carte, son menu, puis ses prénoms sous le panneau
  // Après un glisser-déposer, la page redescend parfois d'elle-même vers la carte posée : on la
  // remet sur la deuxième partie avant chaque écran
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  const ici = (await haut(partie("La forêt de la nuit"))) - 24;
  await descendre(ici);
  const menu = carte(NOUVEAU).locator(`summary[aria-label="Autres commandes du chapitre ${NOUVEAU}"]`);
  await capturer(page, "avant-menu", { ...cartes(), menu });
  // Un clic à sa place : sans le défilement que Playwright ajoute avant un clic
  const b = (await menu.boundingBox())!;
  await page.mouse.click(b.x + b.width / 2, b.y + b.height / 2);
  const attribuer = page.getByRole("button", { name: "Attribuer des élèves" });
  await attribuer.waitFor();
  await page.waitForTimeout(800);
  await descendre(ici);
  await capturer(page, "menu", { ...cartes(), menu, attribuer }, attribuer);
  await attribuer.click();
  const liste = page.locator(".liste-eleves");
  await liste.waitFor();
  await page.waitForTimeout(600);
  await descendre(ici);
  const ligneDe = (prenom: string) => liste.locator("label.eleve-ligne").filter({ has: page.getByText(prenom, { exact: true }) });
  const lignes = () => Object.fromEntries(COCHES.map((p) => [p, ligneDe(p)]));
  await capturer(page, "attribuer", { ...cartes(), panneau, liste, ...lignes() });
  for (const [i, prenom] of COCHES.entries()) {
    await ligneDe(prenom).locator("input").check();
    await page.waitForTimeout(500);
    await capturer(page, `coche-${i + 1}`, { ...cartes(), panneau, liste, ...lignes() });
  }
  await page.getByRole("button", { name: "Fermer", exact: true }).last().click();
  await page.waitForTimeout(1200);
  // le menu rendu au clavier garde le focus : « Ouvrir » resterait souligné
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  await descendre(ici);
  await capturer(page, "attribue", cartes());

  // Les autres chapitres attribués ensuite : chaque élève a les siens
  const eleves = await elevesDe(base, classeId);
  const groupe = (prenoms: string[]) => prenoms.map((p) => ({ eleve: eleves[p].id }));
  const { data: chapitres } = await base.from("chapitres").select("id, titre").in("partie_id", [village.partieId, foret.partieId, coeur.partieId]);
  const idDe = (t: string) => chapitres!.find((c) => c.titre === t)!.id as string;
  await semerAttribution(base, idDe("La fête des lucioles"), groupe(["Mathis", "Adam", "Louise"]));
  await semerAttribution(base, idDe("Le vieux coffre"), groupe(["Sacha", "Léna", "Yanis"]));
  await semerAttribution(base, idDe("Le sentier interdit"), groupe(["Jade", "Rayan", "Lina"]));
  await semerAttribution(base, idDe("Les grottes chantantes"), groupe(["Noah", "Manon", "Ilyes"]));
  await semerAttribution(base, idDe("La pierre de lune"), groupe(["Rose", "Tom", "Zoé", "Nolan"]));
  await semerAttribution(base, idDe("Le gardien de la pierre"), groupe(["Anna", "Elio", "Maëlys", "Gabin"]));
  await page.reload();
  await carte("Le gardien de la pierre").waitFor();
  await page.waitForTimeout(800);
  await capturer(page, "tous-attribues", cartes(), undefined, true);

  // version : les captures gardent leur nom d'un jeu à l'autre ; le studio les recharge par elle
  const donnees = JSON.stringify({ largeur: LARGEUR, hauteur: HAUTEUR, densite: 2, version: Date.now(), ecrans: boites }, null, 2);
  writeFileSync(`${dossier}/boites.json`, donnees);
  writeFileSync(`${dossier}/boites.js`, `// Écrit par app/tests/captures/tuto-parties.spec.ts — ne pas modifier\nwindow.BOITES = ${donnees};\n`);
});
