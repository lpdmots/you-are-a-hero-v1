import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { test, type Locator, type Page } from "@playwright/test";
import {
  adultePret, aller, choixAuto, creerClasse, elevesDe, inscrire, lireCodes, ouvrirLaClasse, semerAttribution, semerBlocs, semerPartie,
  semerProjet, semerTexte, sql, supprimerComptes, taperCode,
} from "../parcours/outils";

/**
 * Les vrais écrans du tuto « Relire et valider » (V1/video/tuto-relire/SCRIPT.md), joués sur la
 * base locale : npx playwright test --config playwright.local.config.ts tuto-relire
 *
 * Même méthode que tuto-ecrire.spec.ts : chaque écran en PNG (1440 × 810, densité 2) et
 * boites.json / boites.js, la place de ce que la vidéo vise. Ce n'est pas un test.
 * La suite du tuto 6 : « La carte qui brille », remise par Sacha, attend au Suivi. Mme Laurent
 * la relit, corrige une faute, demande une reprise avec une remarque ; Sacha lit la remarque,
 * ajoute un paragraphe et remet de nouveau ; elle valide, et l'application propose la suivante
 * (« Pic l'écureuil », remise par Yanis). Inventé pour la vidéo, sur un compte d'essai supprimé à
 * la fin. Les aides de l'IA sont éteintes. La classe se crée par l'écran : Sacha se connecte avec
 * son vrai code.
 */
const dossier = resolve(__dirname, "../../../video/tuto-relire/captures");
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
const CONSIGNE = "Timéo ouvre le vieux coffre du grenier. Raconte ce qu’il trouve au fond : une carte qui brille dans le noir. Que montre-t-elle ?";
const LISTE = ["décrire le coffre et la carte", "dire ce que ressent Timéo", "les majuscules et les points"];
// Le texte remis par Sacha (tuto 6), avec une faute : « brillé », que l'enseignante corrige
const FAUTE = "brillé";
const CORRIGE = "brillait";
const TEXTE = [
  "Timéo souleva le couvercle du vieux coffre. Il grinça si fort que Pic sursauta.",
  `Au fond, sous une vieille couverture, une carte ${FAUTE} dans le noir.`,
  "Timéo avait un peu peur, mais il la déplia doucement. Un chemin bleu s’allumait sur le papier !",
];
// La remarque, ligne après ligne (le champ passe à la ligne de lui-même)
const REMARQUE = ["Bravo pour ton début ! Raconte aussi ce que montre", " la carte : où mène le chemin bleu ?"];
// Ce que Sacha ajoute après la remarque
const AJOUT = "Le chemin traversait la forêt jusqu’à la rivière aux reflets. Au bout, une petite lune dessinée brillait plus fort que tout le reste.";
// La suivante à valider : la scène de Yanis
const TEXTE_YANIS = [
  "Pic arriva en courant, la queue toute gonflée.",
  "« Timéo ! Ne descends pas sans moi, je connais ce coffre ! »",
];
const TEXTE_LENA = ["Timéo grimpa l’échelle du grenier, sa lampe à la main. Pic le suivait, perché sur son épaule."];
const AUTRES: Record<string, string> = {
  [SCENES[0]]: "Timéo monte au grenier avec Pic. Décris le grenier : la poussière, les vieux objets, et le coffre dans un coin.",
  [SCENES[2]]: "Timéo appelle Pic. L’écureuil arrive en courant : que dit-il à Timéo ?",
  [SCENES[3]]: "Timéo redescend sans faire de bruit. Raconte la cuisine endormie, la nuit.",
};

type Boite = { x: number; y: number; l: number; h: number };
const boites: Record<string, Record<string, Boite>> = {};
let n = 0;

async function boite(cible: Locator): Promise<Boite | null> {
  if (!(await cible.count())) return null;
  const b = await cible.first().boundingBox({ timeout: 3000 }).catch(() => null);
  if (!b) return null;
  return { x: Math.round(b.x), y: Math.round(b.y), l: Math.round(b.width), h: Math.round(b.height) };
}

/** La place d'un mot dans un élément (sa première occurrence), en points de la fenêtre. */
async function boiteDuMot(page: Page, conteneur: string, mot: string): Promise<Boite | null> {
  return page.evaluate(
    ([sel, m]) => {
      const racine = document.querySelector(sel);
      if (!racine) return null;
      const parcours = document.createTreeWalker(racine, NodeFilter.SHOW_TEXT);
      for (let t = parcours.nextNode(); t; t = parcours.nextNode()) {
        const i = (t.nodeValue ?? "").indexOf(m);
        if (i < 0) continue;
        const r = document.createRange();
        r.setStart(t, i);
        r.setEnd(t, i + m.length);
        const b = r.getBoundingClientRect();
        return { x: Math.round(b.x), y: Math.round(b.y), l: Math.round(b.width), h: Math.round(b.height) };
      }
      return null;
    },
    [conteneur, mot] as const,
  );
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
 * élément ; tenue : la souris reste où elle est (un champ où l'on écrit). mots : la place de
 * mots dans un élément ([sélecteur, mot]).
 */
async function capturer(
  page: Page, nom: string, cibles: Record<string, Locator> = {}, survol?: Locator | "tenue", mots: Record<string, [string, string]> = {},
): Promise<void> {
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
  for (const [quoi, [sel, mot]] of Object.entries(mots)) {
    const b = await boiteDuMot(page, sel, mot);
    if (b) places[quoi] = b;
  }
  places._fenetre = { x: 0, y: await page.evaluate(() => window.scrollY), l: LARGEUR, h: HAUTEUR };
  boites[cle] = places;
  await page.screenshot({ path: `${dossier}/${cle}.png` });
}

/** Ce que fait « Remettre » : le texte est conservé, la scène passe « À valider » (comme eleve_remettre). */
async function remettre(scene: string, eleve: string, ilYA: string): Promise<void> {
  await sql(
    `with s as (
       update scenes set etat = 'valider', tour = tour + 1, etat_le = now() - $3::interval, prise_par_eleve = $2 where id = $1
       returning id, projet_id, enseignant_id, texte)
     insert into remises (scene_id, projet_id, enseignant_id, eleve_id, texte, remis_le)
     select id, projet_id, enseignant_id, $2, texte, now() - $3::interval from s`,
    [scene, eleve, ilYA],
  );
}

test.use({ viewport: { width: LARGEUR, height: HAUTEUR }, deviceScaleFactor: 2 });
test.afterAll(async () => {
  await supprimerComptes();
});

test("Relire et valider : les écrans du tuto", async ({ page, browser }) => {
  test.setTimeout(400_000);
  rmSync(dossier, { recursive: true, force: true });
  mkdirSync(dossier, { recursive: true });
  const { compte, base } = await adultePret(page);
  await base.from("enseignants").update({
    nom_affiche: "Mme Laurent",
    reglages_ia: { proposer: false },
    aides_masquees: ["classes", "preparation", "plan", "suivi", "livre-chemins", "livre-relire"],
  }).eq("id", compte.id);
  const classe = await creerClasse(page, CLASSE);
  await inscrire(page, classe.id, ELEVES);
  const codes = await lireCodes(page, classe.id);
  const projet = await semerProjet(base, compte, "classe", "choix", TITRE, classe.id);
  await base.from("projets").update({ visuel_defaut: "foret" }).eq("id", projet);

  // Le plan tel que les tutos 4 à 6 le laissent
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
  const eleves = await elevesDe(base, classe.id);
  const groupe = (prenoms: string[]) => prenoms.map((p) => ({ eleve: eleves[p].id }));
  await semerAttribution(base, fete, groupe(["Mathis", "Adam", "Louise"]));
  await semerAttribution(base, coffre, groupe(["Sacha", "Léna", "Yanis"]));
  await semerAttribution(base, sentier, groupe(["Jade", "Rayan", "Lina"]));
  await semerAttribution(base, riviere, groupe(["Chloé", "Emma", "Hugo", "Inès"]));
  await semerAttribution(base, grottes, groupe(["Noah", "Manon", "Ilyes"]));
  await semerAttribution(base, pierre, groupe(["Rose", "Tom", "Zoé", "Nolan"]));
  await semerAttribution(base, gardien, groupe(["Anna", "Elio", "Maëlys", "Gabin"]));

  // Les chemins du tuto 5
  const [grenier, brille, pic, cuisine] = chapitres[1].scenes;
  await semerBlocs(base, grenier, [
    choixAuto("Ouvrir le coffre", brille), choixAuto("Appeler Pic à l’aide", pic), choixAuto("Redescendre sans bruit", cuisine),
  ]);
  await semerBlocs(base, pic, [choixAuto("Ouvrir le coffre avec Pic", brille)]);
  for (const [titre, consigne] of Object.entries(AUTRES)) {
    const id = chapitres[1].scenes[SCENES.indexOf(titre)];
    await base.from("scenes").update({ consigne }).eq("id", id);
  }
  // Le tuto 6 : la consigne et la liste de « La carte qui brille », le texte de Sacha, ses coches, sa remise
  await base.from("scenes").update({ consigne: CONSIGNE, verification: LISTE }).eq("id", brille);
  await semerTexte(base, brille, TEXTE);
  // les coches de l'élève : la colonne n'est pas ouverte au compte adulte
  await sql("update scenes set verification_cochee = $2 where id = $1", [brille, LISTE]);
  // Léna écrit encore la sienne (la scène voisine, au-dessus de la copie, n'est pas vide)
  await base.from("scenes").update({ prise_par_eleve: eleves["Léna"].id }).eq("id", grenier);
  await semerTexte(base, grenier, TEXTE_LENA);
  // Yanis a remis la sienne un peu avant Sacha : la suivante à valider
  await semerTexte(base, pic, TEXTE_YANIS);
  await remettre(pic, eleves["Yanis"].id, "40 minutes");
  await remettre(brille, eleves["Sacha"].id, "25 minutes");

  const colonne = page.getByRole("navigation").filter({ has: page.getByRole("link", { name: "Parties et chapitres" }) }).first();
  const carte = (titre: string) => page.locator(".carte-chemin", { has: page.locator(".carte-chemin__titre", { hasText: titre }) });
  const suivi = colonne.getByRole("link", { name: /^Suivi/ });

  // 2 — « Chemins » du chapitre, là où le tuto 6 s'arrête, puis le Suivi, la scène « À valider », « Relire »
  await aller(page, `/projet/${projet}/chapitre/${coffre}`);
  await carte(SCENE).waitFor();
  await page.waitForTimeout(1500);
  await capturer(page, "chemins", { colonne, suivi, brille: carte(SCENE) });
  await capturer(page, "survol-suivi", { colonne, suivi }, suivi);
  await suivi.click();
  await page.waitForURL(/\/suivi/);
  await page.locator("html[data-pret]").waitFor();
  await page.waitForTimeout(1500);
  const ligne = page.locator("tr").filter({ hasText: SCENE }).last();
  const relire = ligne.getByRole("link", { name: /^Relire/ });
  const lignes = () => ({
    colonne, suivi, ligne, tampon: ligne.locator(".tampon, [class*='tampon']").first(), relire,
    lignePic: page.locator("tr").filter({ hasText: "Pic l’écureuil" }).last(),
    table: page.locator("table.table-scenes").first(),
  });
  await capturer(page, "suivi", lignes());
  await capturer(page, "survol-relire", lignes(), relire);

  // 3 — La scène : son texte, la fiche « Votre relecture » ; une faute corrigée sur place
  await relire.click();
  await page.waitForURL(/\/scene\//);
  await page.locator("html[data-pret]").waitFor();
  const copie = page.locator('.copie__texte[contenteditable="true"]');
  await copie.waitFor();
  await page.waitForTimeout(1500);
  const fiche = page.locator(".carnet-fiche--decision");
  const lieux = () => ({
    copie, fiche,
    tampon: page.locator("summary.tampon--menu").first(),
    valider: fiche.getByRole("button", { name: "Valider le travail élève" }),
    reprise: fiche.getByRole("button", { name: /^Demander une reprise/ }),
    remis: fiche.locator("p").first(),
    remarque: page.locator("#remarque"),
    demander: fiche.getByRole("button", { name: "Demander la reprise" }),
    suivante: fiche.getByRole("link", { name: /^Suivante à valider/ }),
    ficheRemarque: page.locator(".carnet-fiche--retour"),
  });
  const mots = { faute: ['.copie__texte[contenteditable="true"]', FAUTE] as [string, string] };
  await capturer(page, "scene", lieux(), undefined, mots);
  const b = await boiteDuMot(page, '.copie__texte[contenteditable="true"]', FAUTE);
  if (!b) throw new Error("mot introuvable");
  await page.mouse.move(b.x + b.l / 2, b.y + b.h / 2);
  await capturer(page, "survol-faute", lieux(), "tenue", mots);
  await page.mouse.dblclick(b.x + b.l / 2, b.y + b.h / 2);
  await page.waitForTimeout(300);
  await capturer(page, "faute-choisie", lieux(), "tenue", mots);
  // lettre après lettre : dès la première, la sélection disparaît et le reste de la ligne se décale
  for (const [i, lettre] of [...CORRIGE].entries()) {
    await page.keyboard.type(lettre);
    const nom = i === CORRIGE.length - 1 ? "corrige" : `corrige-${i + 1}`;
    await capturer(page, nom, lieux(), "tenue", { corrige: ['.copie__texte[contenteditable="true"]', CORRIGE.slice(0, i + 1)] });
  }
  await page.waitForTimeout(3500); // enregistré
  await capturer(page, "corrige-enregistre", lieux(), undefined, { corrige: ['.copie__texte[contenteditable="true"]', CORRIGE] });

  // 4 — « Demander une reprise… », la remarque pour Sacha, « Demander la reprise »
  await capturer(page, "survol-reprise", lieux(), lieux().reprise);
  await lieux().reprise.click();
  await page.locator("#remarque").waitFor();
  await page.waitForTimeout(600);
  await capturer(page, "remarque-focus", lieux(), "tenue");
  for (const [i, morceau] of REMARQUE.entries()) {
    await page.locator("#remarque").pressSequentially(morceau, { delay: 15 });
    await page.waitForTimeout(300);
    await capturer(page, `remarque-${i + 1}`, lieux(), "tenue");
  }
  await capturer(page, "survol-demander", lieux(), lieux().demander);
  await lieux().demander.click();
  await page.locator(".carnet-fiche--retour").waitFor();
  await page.waitForTimeout(1500);
  await capturer(page, "reprise-demandee", lieux());

  // 5 — Sacha, sur son ordinateur : « Mon travail », sa scène, la remarque en grand, puis la copie
  const contexte = await browser.newContext({ locale: "fr-FR", timezoneId: "Europe/Paris", viewport: { width: LARGEUR, height: HAUTEUR }, deviceScaleFactor: 2 });
  const s = await contexte.newPage();
  await ouvrirLaClasse(s, classe.identifiant, classe.motDePasse);
  await taperCode(s, "Sacha", codes.Sacha);
  await s.waitForURL(/\/travail$/);
  await s.locator("html[data-pret]").waitFor();
  await s.waitForTimeout(1200);
  const mien = s.locator("section[aria-labelledby='t-mien']");
  const ouvrir = mien.getByRole("link").filter({ hasText: /\S/ }).first();
  await capturer(s, "mon-travail", { mien, ouvrir, ligne: mien.locator("li").first() });
  await capturer(s, "survol-ouvrir", { mien, ouvrir }, ouvrir);
  await ouvrir.click();
  await s.waitForURL(/\/travail\/scene\//);
  await s.locator("html[data-pret]").waitFor();
  await s.waitForTimeout(1500);
  const grand = s.locator(".retour-grand");
  const lu = grand.getByRole("button", { name: /J’ai lu/ });
  await capturer(s, "remarque-en-grand", { grand, lu, texte: grand.locator(".retour-grand__texte") });
  await capturer(s, "survol-lu", { grand, lu }, lu);
  await lu.click();
  const copieS = s.locator('.copie__texte[contenteditable="true"]');
  await copieS.waitFor();
  await s.waitForTimeout(1500);
  const lieuxS = () => ({
    copie: copieS,
    ficheRemarque: s.locator(".carnet-fiche--retour, [class*='retour']").first(),
    liste: s.locator(".verif").first(),
    remettre: s.getByRole("button", { name: /^Remettre/ }),
    pied: s.locator(".copie__pied"),
    dernier: copieS.locator("p").last(),
  });
  await capturer(s, "scene-eleve", lieuxS());
  // à la fin du dernier paragraphe, un paragraphe de plus
  const dernier = await boite(copieS.locator("p").last());
  if (!dernier) throw new Error("dernier paragraphe introuvable");
  await s.mouse.click(dernier.x + dernier.l - 4, dernier.y + dernier.h - 6);
  await s.keyboard.press("End");
  await s.waitForTimeout(300);
  await capturer(s, "copie-focus", lieuxS(), "tenue");
  await s.keyboard.press("Enter");
  await s.keyboard.type(AJOUT, { delay: 10 });
  await s.waitForTimeout(500);
  await capturer(s, "ajout", lieuxS(), "tenue");
  await s.waitForTimeout(3000); // « Enregistré »
  await capturer(s, "ajout-enregistre", lieuxS());
  await capturer(s, "survol-remettre", lieuxS(), lieuxS().remettre);
  await lieuxS().remettre.click();
  await s.getByText("relit ce texte").waitFor();
  await s.waitForTimeout(1200);
  await capturer(s, "remise", { ...lieuxS(), etat: s.locator(".copie__etat") });

  // 6 — Chez l'enseignante : la scène de nouveau « À valider », « Valider le travail élève », la suivante
  await page.reload();
  await page.locator("html[data-pret]").waitFor();
  await copie.waitFor();
  await page.waitForTimeout(1500);
  await capturer(page, "scene-remise", lieux(), undefined, { ajout: ['.copie__texte[contenteditable="true"]', "Le chemin traversait"] });
  await capturer(page, "survol-valider", lieux(), lieux().valider);
  await lieux().valider.click();
  await lieux().suivante.waitFor();
  await page.waitForTimeout(1200);
  await capturer(page, "validee", lieux());
  await capturer(page, "survol-suivante", lieux(), lieux().suivante);

  await contexte.close();
  const donnees = JSON.stringify({ largeur: LARGEUR, hauteur: HAUTEUR, densite: 2, version: Date.now(), ecrans: boites }, null, 2);
  writeFileSync(`${dossier}/boites.json`, donnees);
  writeFileSync(`${dossier}/boites.js`, `// Écrit par app/tests/captures/tuto-relire.spec.ts — ne pas modifier\nwindow.BOITES = ${donnees};\n`);
});
