import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { resolve } from "node:path";
import { test, type Locator, type Page } from "@playwright/test";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  adultePret, aller, choixAuto, creerClasse, elevesDe, inscrire, lireCodes, ouvrirLaClasse, semerAttribution, semerBlocs, semerPartie,
  semerProjet, semerTexte, service, sql, supprimerComptes, taperCode, type Compte,
} from "../parcours/outils";

/**
 * Les vrais écrans de la vidéo « Gagner du temps avec l'IA » (V1/video/aides-ia/SCRIPT.md), hors
 * série des tutos : une scène suivie de sa consigne à son image, avec de **vraies réponses de
 * l'IA**. Ce n'est pas un test.
 *
 *   Mise au point, sans rien dépenser, contre un serveur en IA simulée :
 *     ADRESSE=http://localhost:3101 npx playwright test --config playwright.local.config.ts aides-ia
 *   Les vraies captures, contre le serveur local sans IA_SIMULEE (appels payés, sur accord du porteur) :
 *     VRAIE_IA=1 ADRESSE=http://localhost:4840 npx playwright test --config playwright.local.config.ts aides-ia
 *   Les portraits de Timéo et de Pic, créés une fois par l'application (deux images payées), puis
 *   gardés dans video/aides-ia/portraits/ et déposés à chaque jeu :
 *     PORTRAITS=1 VRAIE_IA=1 ADRESSE=http://localhost:4840 npx playwright test … aides-ia
 *
 * Le script refuse de partir si le serveur n'est pas dans le mode annoncé : aucun appel payé par
 * mégarde. ARRET=<étape> arrête après cette étape ; ARBRE=1 écrit l'arbre d'accessibilité des écrans.
 * Il écrit captures/NN-<nom>.png, boites.json / boites.js, et mesures.json : le solde après chaque
 * aide, sa durée, et le journal des appels du compte d'essai (supprimé à la fin).
 */
const video = resolve(__dirname, "../../../video/aides-ia");
const dossier = `${video}/captures`;
const portraits = `${video}/portraits`;
const arbres = resolve(__dirname, "../../test-results/captures/aides-ia-arbres");
const ADRESSE = process.env.ADRESSE ?? "http://localhost:3101";
const VRAIE = process.env.VRAIE_IA === "1";
const ARRET = process.env.ARRET ?? "";
const LARGEUR = 1440;
const HAUTEUR = 810;
const CLASSE = "CM2 des Tilleuls";
const TITRE = "Le secret de la forêt bleue";
const ELEVES = [
  "Inès", "Mathis", "Léna", "Noah", "Jade", "Adam", "Louise", "Sacha", "Chloé", "Yanis", "Emma", "Rayan",
  "Lina", "Hugo", "Manon", "Ilyes", "Rose", "Tom", "Zoé", "Nolan", "Anna", "Elio", "Maëlys", "Gabin",
];
const COFFRE = ["Le grenier de Timéo", "La carte qui brille", "Pic l’écureuil", "La cuisine endormie"];
const CHAPITRE = "La rivière aux reflets";
const SCENE = "Au bord de la rivière";
/** La phrase dictée, approximative exprès (SCRIPT.md) ; tapée si la dictée ne se capture pas */
const DICTEE = "Timéo et Pic arrivent à la rivière. Ils veulent traverser. Ça se passe la nuit.";
const DEMANDE = "Ajoute trois choix.";
/** « Vous pouvez l'ajuster » : un verbe de la consigne proposée remplacé par un autre, selon ce que l'IA a écrit */
const RETOUCHES: [string, string][] = [["explique", "imagine"], ["Explique", "Imagine"], ["dis", "imagine"], ["Dis", "Imagine"], ["raconte", "imagine"], ["Raconte", "Imagine"], ["passe", "produit"]];
/** Le texte d'Inès, inventé, avec sept fautes d'orthographe ; phrase après phrase */
const TEXTE_INES = [
  "Timéo et Pic arrive au bord de la rivière.",
  " L’eau brille comme si il y avait des étoile dedans.",
  " Pic a peur de tombé, il s’acroche au pull de Timéo.",
  " De l’autre coté, on voit le chemin bleu qui continu entre les arbres.",
  " Timéo cherche un moyen de traversé.",
  // En IA simulée, la correction ne connaît que quelques fautes : une phrase de plus, pour la mise au point seulement
  ...(VRAIE ? [] : [" Soudin, la grote ouvri ses pied."]),
];
const PERSONNAGES = [
  {
    cle: "timeo", nom: "Timéo", autres_noms: [] as string[], heros: true,
    description: "Timéo, 10 ans, vit au village des racines. Curieux et courageux, mais il a peur du noir.",
    fiche: "Garçon de dix ans, cheveux bruns en bataille, yeux noisette, taches de rousseur. Pull vert sapin un peu trop grand, pantalon brun, bottines. Un petit sac à dos rouge sur le dos, une petite lanterne à la main.",
  },
  {
    cle: "pic", nom: "Pic", autres_noms: ["l’écureuil"], heros: false,
    description: "Pic, un écureuil qui parle, l’ami de Timéo. Bavard, prudent, toujours perché sur son épaule.",
    fiche: "Petit écureuil roux au ventre crème, grande queue touffue, oreilles à pinceaux, yeux noirs brillants. Un foulard bleu noué autour du cou.",
  },
];

type Boite = { x: number; y: number; l: number; h: number };
const boites: Record<string, Record<string, Boite>> = {};
type Mesure = { aide: string; ms: number; solde: number };
const mesures: Mesure[] = [];
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

/** La place d'un morceau du texte d'un champ de plusieurs lignes (de a à b), mesurée sur un double invisible du champ. */
async function boiteDansChamp(champ: Locator, a: number, b: number): Promise<Boite> {
  return champ.evaluate(
    (t, [debut, fin]) => {
      const champTexte = t as HTMLTextAreaElement;
      const s = getComputedStyle(champTexte);
      const m = document.createElement("div");
      const reprises = [
        "fontFamily", "fontSize", "fontWeight", "fontStyle", "lineHeight", "letterSpacing", "wordSpacing", "textIndent", "boxSizing",
        "paddingTop", "paddingRight", "paddingBottom", "paddingLeft", "borderTopWidth", "borderRightWidth", "borderBottomWidth", "borderLeftWidth",
      ] as const;
      for (const p of reprises) m.style[p] = s[p];
      const r = champTexte.getBoundingClientRect();
      m.style.cssText += `;position:fixed;left:${r.left}px;top:${r.top}px;width:${r.width}px;white-space:pre-wrap;overflow-wrap:break-word;visibility:hidden;border-style:solid`;
      const mot = document.createElement("span");
      mot.textContent = champTexte.value.slice(debut, fin);
      m.append(champTexte.value.slice(0, debut), mot, champTexte.value.slice(fin));
      document.body.append(m);
      const q = mot.getBoundingClientRect();
      m.remove();
      return { x: Math.round(q.x), y: Math.round(q.y - champTexte.scrollTop), l: Math.round(q.width), h: Math.round(q.height) };
    },
    [a, b] as const,
  );
}

/** Nettoie l'écran : badge du serveur de développement, messages, adresse locale. */
async function nettoyer(page: Page, messages: boolean): Promise<void> {
  await page.evaluate((garder) => {
    document.querySelectorAll("nextjs-portal").forEach((e) => e.remove());
    document.querySelectorAll(".react-flow__attribution").forEach((e) => e.remove());
    document.querySelectorAll<HTMLElement>(".message").forEach((m) => (m.style.visibility = garder ? "" : "hidden"));
    const parcours = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let t = parcours.nextNode(); t; t = parcours.nextNode()) {
      if (t.nodeValue && /localhost:\d{4}/.test(t.nodeValue)) t.nodeValue = t.nodeValue.replace(/localhost:\d{4}/g, "iletaituneclasse.com");
      // L'adresse du compte d'essai, dans le menu du nom
      if (t.nodeValue && /parcours-[0-9a-f-]+@exemple\.test/.test(t.nodeValue)) t.nodeValue = t.nodeValue.replace(/parcours-[0-9a-f-]+@exemple\.test/g, "c.laurent@ecole-tilleuls.fr");
    }
  }, messages);
}

type Options = {
  /** La souris reste sur cet élément ; « tenue » : elle reste où elle est */
  survol?: Locator | "tenue";
  /** La place de mots dans un élément : [sélecteur, mot] */
  mots?: Record<string, [string, string]>;
  /** Les messages du bas restent visibles (« Consigne et liste remplacées. ») */
  messages?: boolean;
  /** Sans attendre (un état qui ne dure pas : « Correction… ») */
  vite?: boolean;
  /** Des places déjà mesurées (un mot dans un champ) */
  boites?: Record<string, Boite>;
};

/** Un écran, et la place des éléments que la vidéo désigne. */
async function capturer(page: Page, nom: string, cibles: Record<string, Locator> = {}, o: Options = {}): Promise<void> {
  n += 1;
  const cle = `${String(n).padStart(2, "0")}-${nom}`;
  if (o.survol === "tenue") {
    // rien
  } else if (o.survol) await o.survol.hover();
  else await page.mouse.move(LARGEUR - 1, HAUTEUR - 1);
  if (!o.vite) await page.waitForTimeout(700);
  await nettoyer(page, !!o.messages);
  const places: Record<string, Boite> = {};
  for (const [quoi, cible] of Object.entries(cibles)) {
    const b = await boite(cible);
    if (b) places[quoi] = b;
  }
  for (const [quoi, [sel, mot]] of Object.entries(o.mots ?? {})) {
    const b = await boiteDuMot(page, sel, mot);
    if (b) places[quoi] = b;
  }
  Object.assign(places, o.boites ?? {});
  places._fenetre = { x: 0, y: await page.evaluate(() => window.scrollY), l: LARGEUR, h: HAUTEUR };
  boites[cle] = places;
  await page.screenshot({ path: `${dossier}/${cle}.png` });
  if (process.env.ARBRE) {
    mkdirSync(arbres, { recursive: true });
    writeFileSync(`${arbres}/${cle}.txt`, await page.locator("body").ariaSnapshot());
  }
}

type Attente = Boite & { images: number; pas: number };
const attentes: Record<string, Attente> = {};

/** La zone qui contient ces éléments, avec une marge, dans la fenêtre. */
async function zoneDe(cibles: Locator[], marge = 4): Promise<Boite> {
  const b = (await Promise.all(cibles.map((c) => boite(c)))).filter((x): x is Boite => x !== null);
  if (!b.length) throw new Error("zone introuvable");
  const x = Math.max(0, Math.min(...b.map((v) => v.x)) - marge);
  const y = Math.max(0, Math.min(...b.map((v) => v.y)) - marge);
  const droite = Math.min(LARGEUR, Math.max(...b.map((v) => v.x + v.l)) + marge);
  const bas = Math.min(HAUTEUR, Math.max(...b.map((v) => v.y + v.h)) + marge);
  return { x, y, l: droite - x, h: bas - y };
}

/**
 * Une attente, image par image (retour du porteur : un anneau figé « n'est pas joli ») : les
 * animations de la page sont arrêtées puis avancées pas à pas, si bien que chaque image est exacte
 * — l'anneau qui tourne, les points, l'icône qui scintille. Seule la zone animée est capturée
 * (attentes/<nom>-NNN.png) ; la vidéo rejoue ces images en boucle par-dessus l'écran figé.
 */
async function animer(page: Page, nom: string, zone: Boite, secondes: number, pas = 0.05): Promise<void> {
  mkdirSync(`${dossier}/attentes`, { recursive: true });
  const images = Math.round(secondes / pas);
  for (let k = 0; k < images; k += 1) {
    await page.evaluate((t) => {
      for (const a of document.getAnimations()) {
        a.pause();
        a.currentTime = t;
      }
    }, k * pas * 1000);
    await page.screenshot({ path: `${dossier}/attentes/${nom}-${String(k).padStart(3, "0")}.png`, clip: { x: zone.x, y: zone.y, width: zone.l, height: zone.h } });
  }
  await page.evaluate(() => {
    for (const a of document.getAnimations()) a.play();
  });
  attentes[nom] = { ...zone, images, pas };
}

/**
 * La réponse d'une aide est retenue le temps de capturer son attente, puis lâchée ; sa durée réelle
 * est celle du serveur (`derniereDuree`), que la retenue ne change pas.
 */
let retenue: Promise<void> | null = null;
let derniereDuree = 0;
async function surveillerLesAides(page: Page): Promise<void> {
  await page.route(
    (url) => /^\/(ia\/|dictee)/.test(url.pathname),
    async (route) => {
      if (route.request().method() !== "POST") return route.continue();
      const t0 = Date.now();
      const reponse = await route.fetch({ timeout: 240_000 });
      derniereDuree = Date.now() - t0;
      if (retenue) await retenue;
      await route.fulfill({ response: reponse });
    },
  );
}
function retenir(): () => void {
  let lacher = () => {};
  retenue = new Promise<void>((fait) => (lacher = fait));
  return () => {
    lacher();
    retenue = null;
  };
}

/** La page entière, pour la faire défiler dans la vidéo : les boîtes sont en points de la page. */
async function capturerPage(page: Page, nom: string, cibles: Record<string, Locator> = {}): Promise<void> {
  n += 1;
  const cle = `${String(n).padStart(2, "0")}-${nom}`;
  await page.mouse.move(LARGEUR - 1, HAUTEUR - 1);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await page.waitForTimeout(500);
  await nettoyer(page, false);
  const places: Record<string, Boite> = {};
  for (const [quoi, cible] of Object.entries(cibles)) {
    const b = await boite(cible);
    if (b) places[quoi] = b;
  }
  places._fenetre = { x: 0, y: 0, l: LARGEUR, h: await page.evaluate(() => document.documentElement.scrollHeight) };
  boites[cle] = places;
  await page.screenshot({ path: `${dossier}/${cle}.png`, fullPage: true });
}

/** Une image déposée comme une image importée (le portrait d'un personnage). */
async function deposer(base: SupabaseClient, compte: Compte, projetId: string, fichier: string): Promise<string> {
  const id = randomUUID();
  const octets = readFileSync(fichier);
  const png = fichier.endsWith(".png");
  const ext = png ? "png" : "jpg";
  const chemins = [`${compte.id}/${projetId}/${id}.${ext}`, `${compte.id}/${projetId}/${id}-v.${ext}`];
  for (const chemin of chemins) {
    const { error } = await service().storage.from("images").upload(chemin, octets, { contentType: png ? "image/png" : "image/jpeg" });
    if (error) throw new Error(error.message);
  }
  const { error } = await base.from("images").insert({ id, projet_id: projetId, enseignant_id: compte.id, chemin: chemins[0], chemin_vignette: chemins[1], largeur: 1024, hauteur: 1536, format: png ? "png" : "jpeg" });
  if (error) throw new Error(error.message);
  return id;
}

/** Le serveur est-il dans le mode annoncé ? Un appel payé ne part jamais par mégarde. */
async function verifierLeMode(): Promise<void> {
  const r = await fetch(`${ADRESSE}/ia/simulation`, { method: "POST", headers: { "content-type": "application/json" }, body: "{}" }).catch(() => null);
  if (!r) throw new Error(`Aucun serveur à ${ADRESSE}.`);
  const simulee = r.status !== 404;
  if (simulee && VRAIE) throw new Error(`${ADRESSE} est en IA simulée : VRAIE_IA=1 demande un serveur sans IA_SIMULEE.`);
  if (!simulee && !VRAIE) throw new Error(`${ADRESSE} appelle les vrais fournisseurs : ajoutez VRAIE_IA=1 (appels payés), ou visez un serveur en IA simulée.`);
}

const solde = async (compte: Compte): Promise<number> => Number((await sql<{ etoiles: number }>("select etoiles from enseignants where id = $1", [compte.id]))[0].etoiles);

/** Le solde une fois le débit de la dernière aide inscrit : le journal se ferme un instant après la réponse. */
async function mesurer(compte: Compte, aide: string, ms: number, appels: number): Promise<void> {
  for (let i = 0; i < 40; i += 1) {
    const [l] = await sql<{ n: string }>("select count(*) as n from appels_ia where enseignant_id = $1 and issue is not null", [compte.id]);
    if (Number(l.n) >= appels) break;
    await new Promise((f) => setTimeout(f, 250));
  }
  mesures.push({ aide, ms, solde: await solde(compte) });
}

async function ecrireLesDonnees(compte: Compte | null): Promise<void> {
  const version = Date.now();
  const donnees = JSON.stringify({ largeur: LARGEUR, hauteur: HAUTEUR, densite: 2, version, ecrans: boites }, null, 2);
  writeFileSync(`${dossier}/boites.json`, donnees);
  const journal = compte
    ? await sql(
        `select a.aide, a.sorte, a.nombre, a.issue, a.fournisseur, a.modele, a.jetons_entree, a.jetons_sortie, a.cout_usd,
                round(extract(epoch from (a.termine_le - a.commence_le))::numeric, 1) as secondes, m.nombre as etoiles
         from appels_ia a left join mouvements_etoiles m on m.appel_id = a.id
         where a.enseignant_id = $1 order by a.commence_le`,
        [compte.id],
      )
    : [];
  const releve = { vraieIa: VRAIE, le: new Date().toISOString(), depart: 30, mesures, journal };
  writeFileSync(`${dossier}/mesures.json`, JSON.stringify(releve, null, 2));
  writeFileSync(
    `${dossier}/boites.js`,
    `// Écrit par app/tests/captures/aides-ia.spec.ts — ne pas modifier\nwindow.BOITES = ${donnees};\nwindow.MESURES = ${JSON.stringify(releve, null, 2)};\nwindow.ATTENTES = ${JSON.stringify({ version, zones: attentes }, null, 2)};\n`,
  );
}

/** L'histoire des tutos, telle que les tutos 4 à 7 la laissent, plus la première scène de « La rivière aux reflets ». */
async function semerLHistoire(page: Page) {
  const { compte, base } = await adultePret(page);
  await base.from("enseignants").update({
    nom_affiche: "Mme Laurent",
    voisines: false,
    aides_masquees: ["classes", "preparation", "plan", "suivi", "livre-chemins", "livre-relire"],
  }).eq("id", compte.id);
  const classe = await creerClasse(page, CLASSE);
  await inscrire(page, classe.id, ELEVES);
  const codes = await lireCodes(page, classe.id);
  const projet = await semerProjet(base, compte, "classe", "choix", TITRE, classe.id);
  // Timéo est un héros nommé, dessiné dans les images (par défaut, le héros est le lecteur : jamais dessiné)
  await base.from("projets").update({ visuel_defaut: "foret", heros_absent: false }).eq("id", projet);
  await base.from("preparations").update({
    univers: "Une immense forêt dont les arbres deviennent bleus la nuit. Au cœur de la forêt, un village caché sous les racines d’un arbre géant.",
    enjeu: "Retrouver la pierre de lune avant la fin de l’hiver. Sans elle, la forêt perdra sa couleur bleue et le village sera découvert.",
  }).eq("projet_id", projet);
  const village = await semerPartie(base, projet, "Le village des racines", [{ titre: "La fête des lucioles" }, { titre: "Le vieux coffre", scenes: COFFRE }], "jardin");
  const foret = await semerPartie(base, projet, "La forêt de la nuit", [{ titre: "Le sentier interdit" }, { titre: CHAPITRE, scenes: [SCENE] }, { titre: "Les grottes chantantes" }], "foret");
  const coeur = await semerPartie(base, projet, "Le cœur de la forêt", [{ titre: "La pierre de lune" }, { titre: "Le gardien de la pierre" }], "temple");
  const chapitres = [...village.chapitres, ...foret.chapitres, ...coeur.chapitres];
  const [fete, coffre, sentier, riviere, grottes, pierre, gardien] = chapitres.map((c) => c.id);
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
  // « Le vieux coffre », écrit aux tutos 5 à 7 : ses chemins, ses consignes, deux textes
  const [grenier, brille, pic, cuisine] = chapitres[1].scenes;
  await semerBlocs(base, grenier, [
    choixAuto("Ouvrir le coffre", brille), choixAuto("Appeler Pic à l’aide", pic), choixAuto("Redescendre sans bruit", cuisine),
  ]);
  await semerBlocs(base, pic, [choixAuto("Ouvrir le coffre avec Pic", brille)]);
  const consignes: [string, string][] = [
    [grenier, "Timéo monte au grenier avec Pic. Décris le grenier : la poussière, les vieux objets, et le coffre dans un coin."],
    [brille, "Timéo ouvre le vieux coffre du grenier. Raconte ce qu’il trouve au fond : une carte qui brille dans le noir. Que montre-t-elle ?"],
    [pic, "Timéo appelle Pic. L’écureuil arrive en courant : que dit-il à Timéo ?"],
    [cuisine, "Timéo redescend sans faire de bruit. Raconte la cuisine endormie, la nuit."],
  ];
  for (const [id, consigne] of consignes) await base.from("scenes").update({ consigne }).eq("id", id);
  await semerTexte(base, brille, [
    "Timéo souleva le couvercle du vieux coffre. Il grinça si fort que Pic sursauta.",
    "Au fond, sous une vieille couverture, une carte brillait dans le noir.",
    "Timéo avait un peu peur, mais il la déplia doucement. Un chemin bleu s’allumait sur le papier !",
    "Le chemin traversait la forêt jusqu’à la rivière aux reflets. Au bout, une petite lune dessinée brillait plus fort que tout le reste.",
  ]);
  // Les personnages et leurs portraits, créés une fois par l'application (PORTRAITS=1)
  for (const [rang, p] of PERSONNAGES.entries()) {
    const fichier = [`${portraits}/${p.cle}.png`, `${portraits}/${p.cle}.jpg`].find((f) => existsSync(f));
    const portrait = fichier && !process.env.PORTRAITS ? await deposer(base, compte, projet, fichier) : null;
    const { error } = await base.from("personnages").insert({
      projet_id: projet, enseignant_id: compte.id, nom: p.nom, autres_noms: p.autres_noms, heros: p.heros, description: p.description, fiche: p.fiche, portrait_id: portrait, rang,
    });
    if (error) throw new Error(error.message);
  }
  return { compte, base, classe, codes, projet, riviere, scene: chapitres[3].scenes[0], eleves };
}

test.use({
  baseURL: ADRESSE,
  actionTimeout: 15_000,
  viewport: { width: LARGEUR, height: HAUTEUR },
  deviceScaleFactor: 2,
  permissions: ["microphone"],
  launchOptions: {
    args: [
      "--use-fake-ui-for-media-stream",
      "--use-fake-device-for-media-stream",
      ...(existsSync(`${video}/son/dictee.wav`) ? [`--use-file-for-fake-audio-capture=${video}/son/dictee.wav%noloop`] : []),
    ],
  },
});
test.afterAll(async () => {
  await supprimerComptes();
});

test("Gagner du temps avec l'IA : les écrans de la vidéo", async ({ page, browser }) => {
  test.skip(!!process.env.PORTRAITS, "PORTRAITS=1 ne crée que les portraits");
  test.setTimeout(900_000);
  await verifierLeMode();
  rmSync(dossier, { recursive: true, force: true });
  mkdirSync(dossier, { recursive: true });
  const h = await semerLHistoire(page);
  await surveillerLesAides(page);
  const { compte, base, projet, riviere, scene } = h;
  let appels = 0;
  const fin = async () => {};
  try {

  const colonne = page.getByRole("navigation").filter({ has: page.getByRole("link", { name: "Parties et chapitres" }) }).first();
  const carte = (titre: string) => page.locator(".carte-chemin", { has: page.locator(".carte-chemin__titre", { hasText: titre }) });
  const schema = page.locator(".react-flow").first();
  const panneau = page.locator(".panneau-chemin");
  const consigne = panneau.getByLabel(/^Consigne/).first();
  const micro = panneau.getByRole("button", { name: "Dicter" });
  const formuler = panneau.getByRole("button", { name: "Formuler" });
  const propose = panneau.locator(".ia-propose--consigne");
  const construire = panneau.getByRole("button", { name: "Construire avec l’IA" });
  const lieux = () => ({
    colonne, schema, carte: carte(SCENE), panneau, consigne, micro, formuler, construire, propose,
    proposee: propose.getByLabel("Consigne proposée"),
    listeProposee: propose.locator(".verif, ul, ol").first(),
    utiliser: propose.getByRole("button", { name: "Utiliser" }),
    liste: panneau.locator(".verif").first(),
    choix: panneau.locator(".panneau-chemin__choix"),
  });

  // 2 — « Chemins » du chapitre, sa seule scène, sans consigne ; on la dicte, puis « Formuler »
  await aller(page, `/projet/${projet}/chapitre/${riviere}`);
  await carte(SCENE).waitFor();
  await page.waitForTimeout(1500);
  await capturer(page, "chemins", lieux());
  await capturer(page, "survol-carte", lieux(), { survol: carte(SCENE) });
  await carte(SCENE).click();
  await consigne.waitFor();
  await page.waitForTimeout(1500);
  await capturer(page, "panneau", lieux());
  await capturer(page, "survol-micro", lieux(), { survol: micro });
  // La dictée : la pastille et son temps, seconde après seconde, puis le texte entendu dans le champ
  await consigne.click();
  await micro.click();
  const debutDictee = Date.now();
  const secondesDeDictee = existsSync(`${video}/son/dictee.wav`) ? Number(process.env.DICTEE_S ?? 6) : 3;
  for (let s = 1; s <= secondesDeDictee; s += 1) {
    await panneau.locator(".dictee__temps", { hasText: `0:${String(s).padStart(2, "0")}` }).waitFor({ timeout: 5000 });
    await capturer(page, `dictee-${s}`, lieux(), { survol: "tenue", vite: true });
  }
  const zoneMicro = await zoneDe([micro], 6);
  let lacher = retenir();
  await micro.click();
  const msEnregistre = Date.now() - debutDictee;
  await capturer(page, "dictee-transcrit", lieux(), { survol: "tenue", vite: true });
  await animer(page, "dictee", zoneMicro, 1.2);
  lacher();
  await page.waitForFunction((sel) => (document.querySelector<HTMLTextAreaElement>(sel)?.value ?? "").trim().length > 0, `#${await consigne.getAttribute("id")}`, { timeout: 60_000 });
  const msDictee = msEnregistre + derniereDuree;
  await page.waitForTimeout(1200);
  await capturer(page, "dictee-posee", lieux(), { survol: "tenue" });
  mesures.push({ aide: "dictee", ms: msDictee, solde: await solde(compte) });
  writeFileSync(`${dossier}/dictee.txt`, await consigne.inputValue());
  if (ARRET === "dictee") return fin();

  await capturer(page, "survol-formuler", lieux(), { survol: formuler });
  // les zones se mesurent avant le clic : un bouton occupé cache son contenu, et son nom avec
  const zoneFormuler = await zoneDe([formuler]);
  lacher = retenir();
  await formuler.click();
  await capturer(page, "formuler-attente", lieux(), { survol: "tenue", vite: true });
  await animer(page, "formuler", zoneFormuler, 0.7);
  lacher();
  await propose.waitFor({ timeout: 90_000 });
  let ms = derniereDuree;
  await mesurer(compte, "consigne", ms, (appels += 1));
  await page.waitForTimeout(800);
  await capturer(page, "consigne-proposee", lieux());
  writeFileSync(`${dossier}/consigne-proposee.txt`, `${await lieux().proposee.inputValue()}\n— ${(await propose.getByLabel("Élément proposé").evaluateAll((e) => e.map((c) => (c as HTMLInputElement).value))).join(" / ")}`);
  // Un mot retouché dans la consigne proposée : le premier de ces mots que la vraie réponse contient
  const proposee = lieux().proposee;
  const textePropose = await proposee.inputValue();
  const retouche = RETOUCHES.map(([mot, nouveau]) => ({ mot, nouveau, i: textePropose.search(new RegExp(`(?<!\\p{L})${mot}(?!\\p{L})`, "u")) })).find((r) => r.i >= 0);
  if (retouche) {
    const place = await boiteDansChamp(proposee, retouche.i, retouche.i + retouche.mot.length);
    await page.mouse.move(place.x + place.l / 2, place.y + place.h / 2);
    await capturer(page, "survol-mot", lieux(), { survol: "tenue", boites: { mot: place } });
    await page.mouse.dblclick(place.x + place.l / 2, place.y + place.h / 2);
    await page.waitForTimeout(300);
    await capturer(page, "mot-choisi", lieux(), { survol: "tenue", boites: { mot: place } });
    for (const [i, lettre] of [...retouche.nouveau].entries()) {
      await page.keyboard.type(lettre);
      const nomCapture = i === retouche.nouveau.length - 1 ? "mot-retouche" : `mot-retouche-${i + 1}`;
      await capturer(page, nomCapture, lieux(), { survol: "tenue", vite: true, boites: { mot: await boiteDansChamp(proposee, retouche.i, retouche.i + i + 1) } });
    }
    writeFileSync(`${dossier}/retouche.txt`, `${retouche.mot} → ${retouche.nouveau}\n${await proposee.inputValue()}`);
  }
  if (ARRET === "formuler") return fin();
  await capturer(page, "survol-utiliser", lieux(), { survol: lieux().utiliser });
  await lieux().utiliser.click();
  await page.waitForTimeout(1500);
  await capturer(page, "consigne-utilisee", lieux(), { messages: true });
  await page.waitForTimeout(1500);

  // 3 — « Construire avec l'IA », « Ajoute trois choix. », la proposition en pointillé, l'ajout
  const bloc = page.locator(".panneau-bloc");
  const demande = bloc.getByRole("textbox").first();
  const proposer = bloc.getByRole("button", { name: /Proposer/ });
  const proposees = page.locator(".carte-chemin--proposee");
  const ajouter = bloc.getByRole("button", { name: /^Ajouter \d/ });
  const blocs = () => ({
    colonne, schema, carte: carte(SCENE), bloc, demande, proposer, ajouter,
    proposee1: proposees.nth(0), proposee2: proposees.nth(1), proposee3: proposees.nth(2),
    accord: bloc.getByText("Rien n’est ajouté avant votre accord"),
    tete: bloc.locator("h2, header").first(),
  });
  await capturer(page, "survol-construire", lieux(), { survol: construire });
  await construire.click();
  await demande.waitFor();
  await page.waitForTimeout(1200);
  await capturer(page, "bloc-vide", blocs());
  await demande.click();
  await capturer(page, "bloc-focus", blocs(), { survol: "tenue" });
  await demande.pressSequentially(DEMANDE, { delay: 15 });
  await capturer(page, "bloc-demande", blocs(), { survol: "tenue" });
  await capturer(page, "survol-proposer", blocs(), { survol: proposer });
  const zoneProposer = await zoneDe([proposer]);
  lacher = retenir();
  await proposer.click();
  await page.waitForTimeout(600);
  await capturer(page, "bloc-attente", blocs(), { survol: "tenue", vite: true });
  await animer(page, "bloc", zoneProposer, 0.7);
  lacher();
  await proposees.first().waitFor({ timeout: 120_000 });
  ms = derniereDuree;
  await mesurer(compte, "bloc", ms, (appels += 1));
  await page.waitForTimeout(2000);
  await capturer(page, "proposition", blocs());
  if (ARRET === "bloc") return fin();

  // Une fiche en entier : son titre, sa consigne, puis sa liste (le panneau défile)
  const listeDeLaFiche = bloc.getByText("Liste proposée").first();
  if (await listeDeLaFiche.count()) {
    await listeDeLaFiche.evaluate((e) => e.scrollIntoView({ block: "center", behavior: "instant" }));
    await page.waitForTimeout(600);
    await capturer(page, "proposition-liste", { ...blocs(), liste: listeDeLaFiche, fiche: bloc.locator("li, article, section").filter({ has: listeDeLaFiche }).last() });
  }
  await capturer(page, "survol-proposee", blocs(), { survol: proposees.last() });
  await capturer(page, "survol-ajouter", blocs(), { survol: ajouter });
  await ajouter.click();
  await proposees.first().waitFor({ state: "detached" });
  await page.waitForTimeout(2000);
  await capturer(page, "ajoutees", { ...blocs(), cartes: page.locator(".carte-chemin") }, { messages: true });
  await page.waitForTimeout(500);
  await capturer(page, "ajoutees-sans-message", { ...blocs(), cartes: page.locator(".carte-chemin") });
  if (ARRET === "ajout") return fin();

  // 4 — Saut du temps : Inès s'occupe de la scène ; son écran, sans étincelles, son texte, « Remettre »
  await base.from("scenes").update({ prise_par_eleve: h.eleves["Inès"].id }).eq("id", scene);
  const contexte = await browser.newContext({ baseURL: ADRESSE, locale: "fr-FR", timezoneId: "Europe/Paris", viewport: { width: LARGEUR, height: HAUTEUR }, deviceScaleFactor: 2 });
  const e = await contexte.newPage();
  await ouvrirLaClasse(e, h.classe.identifiant, h.classe.motDePasse);
  await taperCode(e, "Inès", h.codes["Inès"]);
  await e.waitForURL(/\/travail$/);
  await aller(e, `/travail/scene/${scene}`);
  await e.locator("html[data-pret]").waitFor();
  const copieE = e.locator('.copie__texte[contenteditable="true"]');
  await copieE.waitFor();
  await e.waitForTimeout(1500);
  const chezInes = () => ({
    copie: copieE,
    barre: e.getByRole("toolbar").first(),
    consigne: e.locator(".consigne, [class*='consigne']").first(),
    liste: e.locator(".verif").first(),
    remettre: e.getByRole("button", { name: /^Remettre/ }),
    pied: e.locator(".copie__pied"),
    cote: e.locator("aside").first(),
  });
  await capturer(e, "ines-scene", chezInes());
  // Dans le paragraphe vide du haut : au milieu de la copie, le clic tomberait sur une phrase de choix, protégée
  await copieE.locator("p").first().click();
  await e.waitForTimeout(400);
  await capturer(e, "ines-focus", chezInes(), { survol: "tenue" });
  for (const [i, phrase] of TEXTE_INES.entries()) {
    await e.keyboard.type(phrase, { delay: 8 });
    await e.waitForTimeout(400);
    if (i === 0 && !(await copieE.innerText()).includes("Timéo et Pic arrive")) throw new Error("Le texte d'Inès ne s'écrit pas dans la copie.");
    await capturer(e, `ines-texte-${i + 1}`, chezInes(), { survol: "tenue" });
  }
  await e.waitForTimeout(3000); // « Enregistré »
  await capturer(e, "ines-enregistre", chezInes());
  // Elle coche sa liste, hors caméra : la remise ne rappelle rien
  for (const coche of await e.locator(".verif").first().getByRole("checkbox").all()) await coche.check({ force: true });
  await e.waitForTimeout(1200);
  await capturer(e, "ines-cochee", chezInes());
  await capturer(e, "ines-survol-remettre", chezInes(), { survol: chezInes().remettre });
  await chezInes().remettre.click();
  await e.getByText("relit ce texte").waitFor();
  await e.waitForTimeout(1200);
  await capturer(e, "ines-remise", { ...chezInes(), etat: e.locator(".copie__etat") });
  await contexte.close();
  if (ARRET === "ines") return fin();

  // 5 — Chez l'enseignante : la scène « À valider », le degré 1, « Corriger », un changement refusé, « Garder »
  await aller(page, `/projet/${projet}/scene/${scene}`);
  await page.locator("html[data-pret]").waitFor();
  const copie = page.locator('.copie__texte[contenteditable="true"]');
  await copie.waitFor();
  await page.waitForTimeout(1500);
  const corriger = page.locator(".corriger").getByRole("button").first();
  const degre = page.locator(".corriger summary").first();
  const garder = page.getByRole("button", { name: "Garder les changements" });
  const marques = page.locator(".corr-texte .corr");
  const laScene = () => ({
    colonne, copie, corriger, degre, garder,
    barre: page.getByRole("toolbar", { name: "Outils de la copie" }),
    tampon: page.locator("summary.tampon--menu").first(),
    menu: page.getByRole("group", { name: "Degré de correction" }),
    degre1: page.getByRole("menuitemradio", { name: /^Degré 1 ·/ }),
    texte: page.locator(".corr-texte"),
    compte: page.locator(".corr-compte"),
    inserer: page.getByRole("toolbar", { name: "Outils de la copie" }).getByRole("button", { name: "Insérer" }),
    consigne: page.locator(".carnet-fiche").first(),
  });
  await capturer(page, "scene-a-valider", laScene());
  await capturer(page, "survol-degre", laScene(), { survol: degre });
  await degre.click();
  await page.getByRole("menuitemradio", { name: /^Degré 1 ·/ }).waitFor();
  await page.waitForTimeout(500);
  await capturer(page, "degres", laScene(), { survol: "tenue" });
  await capturer(page, "survol-degre-1", laScene(), { survol: page.getByRole("menuitemradio", { name: /^Degré 1 ·/ }) });
  await page.getByRole("menuitemradio", { name: /^Degré 1 ·/ }).click();
  await page.waitForTimeout(600);
  await capturer(page, "degre-1", laScene());
  await capturer(page, "survol-corriger", laScene(), { survol: corriger });
  await corriger.click();
  await capturer(page, "correction-attente", laScene(), { survol: "tenue", vite: true });
  await marques.first().waitFor({ timeout: 120_000 });
  ms = derniereDuree;
  await mesurer(compte, "correction", ms, (appels += 1));
  await page.waitForTimeout(1000);
  const changements = await marques.count();
  const lesMarques = async () => Object.fromEntries(await Promise.all(Array.from({ length: changements }, async (_, i) => [`marque${i + 1}`, marques.nth(i)] as const)));
  await capturer(page, "correction", { ...laScene(), ...(await lesMarques()) });
  writeFileSync(`${dossier}/correction.txt`, (await marques.evaluateAll((m) => m.map((c) => c.getAttribute("aria-label")))).join("\n"));
  // Le changement refusé : « si il » s'il a été touché (une élision plus qu'une faute), sinon le dernier
  const noms = await marques.evaluateAll((m) => m.map((c) => c.getAttribute("aria-label") ?? ""));
  const iRefus = Math.max(0, noms.findIndex((nom) => /si il|s[’']il/.test(nom)) >= 0 ? noms.findIndex((nom) => /si il|s[’']il/.test(nom)) : noms.length - 1);
  await capturer(page, "survol-refus", { ...laScene(), ...(await lesMarques()), refus: marques.nth(iRefus) }, { survol: marques.nth(iRefus) });
  await marques.nth(iRefus).click();
  await page.waitForTimeout(500);
  await capturer(page, "refuse", { ...laScene(), ...(await lesMarques()), refus: marques.nth(iRefus) });
  // Une vraie faute ne se laisse pas (retour du porteur) : un second clic rétablit le changement, avant de garder
  await capturer(page, "survol-retablir", { ...laScene(), ...(await lesMarques()), refus: marques.nth(iRefus) }, { survol: marques.nth(iRefus) });
  await marques.nth(iRefus).click();
  await page.waitForTimeout(500);
  await capturer(page, "retabli", { ...laScene(), ...(await lesMarques()), refus: marques.nth(iRefus) });
  await capturer(page, "survol-garder", { ...laScene(), refus: marques.nth(iRefus) }, { survol: garder });
  await garder.click();
  await marques.first().waitFor({ state: "detached" });
  await page.waitForTimeout(1500);
  await capturer(page, "gardes", laScene(), { messages: true });
  await page.waitForTimeout(2500);
  if (ARRET === "correction") return fin();

  // 6 — « + Insérer », « Image », « Créer une image » : la description, les portraits, l'image, « Garder »
  // Le curseur à la fin du récit : l'image suit le texte d'Inès, avant les phrases de choix
  const recit = await boite(copie.locator("p").first());
  if (!recit) throw new Error("récit introuvable");
  await page.mouse.click(recit.x + recit.l - 6, recit.y + recit.h - 8);
  await page.keyboard.press("End");
  await page.waitForTimeout(300);
  await capturer(page, "scene-corrigee", laScene(), { survol: "tenue" });
  await capturer(page, "survol-inserer", laScene(), { survol: laScene().inserer });
  await laScene().inserer.click();
  const menuInserer = page.getByRole("menu", { name: "Insérer" });
  const entreeImage = menuInserer.getByRole("menuitem", { name: /^Image\b/ });
  await entreeImage.waitFor();
  await page.waitForTimeout(400);
  await capturer(page, "menu-inserer", { ...laScene(), menu: menuInserer, image: entreeImage }, { survol: "tenue" });
  await capturer(page, "survol-image", { ...laScene(), menu: menuInserer, image: entreeImage }, { survol: entreeImage });
  await entreeImage.click();
  const creerUne = page.getByRole("button", { name: "Créer une image" }).first();
  await creerUne.waitFor();
  await page.waitForTimeout(800);
  await capturer(page, "fiche-image", { ...laScene(), creerUne });
  await capturer(page, "survol-creer-une", { ...laScene(), creerUne }, { survol: creerUne });
  await creerUne.click();
  const creer = page.getByRole("region", { name: "Créer une image" });
  await creer.waitFor();
  await page.waitForTimeout(1000);
  const decrire = creer.getByRole("button", { name: "Proposer la description" });
  const creerLImage = creer.getByRole("button", { name: "Créer l’image" });
  const proposition = creer.getByRole("group", { name: /Proposition/ });
  const lImage = () => ({
    ...laScene(), creer, decrire, creerLImage, proposition,
    description: creer.getByLabel("Ce que montre l’image"),
    badges: creer.getByRole("group", { name: "Dans l’image" }),
    image: proposition.getByRole("img").first(),
    garderLImage: proposition.getByRole("button", { name: "Garder" }),
  });
  await capturer(page, "creer-une-image", lImage());
  await capturer(page, "survol-decrire", lImage(), { survol: decrire });
  const zoneDecrire = await zoneDe([decrire, lImage().description]);
  lacher = retenir();
  await decrire.click();
  await capturer(page, "description-attente", lImage(), { survol: "tenue", vite: true });
  await animer(page, "description", zoneDecrire, 3.0);
  lacher();
  await page.waitForFunction((el) => ((el as HTMLTextAreaElement | null)?.value ?? "").trim().length > 0, await lImage().description.elementHandle(), { timeout: 90_000 });
  ms = derniereDuree;
  await mesurer(compte, "description", ms, (appels += 1));
  await page.waitForTimeout(800);
  await capturer(page, "description", lImage());
  writeFileSync(`${dossier}/description.txt`, await lImage().description.inputValue());
  if (ARRET === "description") return fin();
  await capturer(page, "survol-creer-l-image", lImage(), { survol: creerLImage });
  const t0 = Date.now();
  await creerLImage.click();
  await page.waitForTimeout(700);
  await capturer(page, "image-attente", lImage(), { survol: "tenue", vite: true });
  await animer(page, "image", await zoneDe([creer.locator(".ci__attente")]), 2.2);
  await proposition.getByRole("img").first().waitFor({ timeout: 240_000 });
  ms = Date.now() - t0;
  await mesurer(compte, "image", ms, (appels += 1));
  await page.waitForTimeout(2500);
  await capturer(page, "image-proposee", lImage());
  // La proposition entière à l'écran, avec les portraits juste au-dessus
  await lImage().garderLImage.evaluate((e) => e.scrollIntoView({ block: "end", behavior: "instant" }));
  await page.waitForTimeout(800);
  await capturer(page, "image-proposee-vue", lImage());
  await capturer(page, "survol-garder-l-image", lImage(), { survol: lImage().garderLImage });
  await lImage().garderLImage.click();
  await copie.locator(".image-bloc").waitFor();
  await page.waitForTimeout(2500);
  await capturer(page, "image-gardee", { ...laScene(), imageBloc: copie.locator(".image-bloc") }, { messages: true });
  // La page entière, telle qu'elle est après « Garder » : la vidéo la fait descendre jusqu'à l'image
  await capturerPage(page, "image-gardee-page", { copie, imageBloc: copie.locator(".image-bloc"), recit: copie.locator("p").first() });
  if (ARRET === "image") return fin();

  // 7 — La scène finie, puis le menu du nom : le solde
  await page.reload();
  await page.locator("html[data-pret]").waitFor();
  await copie.waitFor();
  await page.waitForTimeout(2000);
  const nom = page.locator("#colonne-adulte summary", { hasText: "Mme Laurent" }).first();
  // La consigne et sa liste, dépliées : la scène finie se lit d'un coup
  const fiche = page.locator("details", { has: page.getByRole("heading", { name: /^Consigne/ }) }).first();
  await fiche.locator("summary").click();
  await page.waitForTimeout(600);
  await capturer(page, "scene-finie", { ...laScene(), imageBloc: copie.locator(".image-bloc"), nom });
  await capturerPage(page, "scene-finie-page", { copie, imageBloc: copie.locator(".image-bloc"), recit: copie.locator("p").first(), consigne: fiche });
  await capturer(page, "survol-nom", { ...laScene(), nom }, { survol: nom });
  await nom.click();
  await page.waitForTimeout(800);
  await capturer(page, "menu-du-nom", { ...laScene(), nom, solde: page.getByText("pour les aides").first() }, { survol: "tenue" });
  } finally {
    // Même si le jeu s'arrête en route : ce qui a été dépensé se lit dans mesures.json
    await ecrireLesDonnees(compte);
  }
});

test("Les portraits de Timéo et de Pic, créés une fois par l'application", async ({ page }) => {
  test.skip(!process.env.PORTRAITS, "seulement avec PORTRAITS=1");
  test.setTimeout(600_000);
  await verifierLeMode();
  const sortie = VRAIE ? portraits : resolve(arbres, "../aides-ia-portraits-simules");
  mkdirSync(sortie, { recursive: true });
  const h = await semerLHistoire(page);
  await aller(page, `/projet/${h.projet}/preparation?etape=personnages`);
  await page.locator("html[data-pret]").waitFor();
  await page.waitForTimeout(1500);
  if (process.env.ARBRE) {
    mkdirSync(arbres, { recursive: true });
    writeFileSync(`${arbres}/portraits-etape.txt`, await page.locator("body").ariaSnapshot());
  }
  const releve: Record<string, unknown>[] = [];
  // PORTRAITS=timeo : un seul portrait à refaire
  for (const p of PERSONNAGES.filter((x) => process.env.PORTRAITS === "1" || process.env.PORTRAITS === x.cle)) {
    const ouvrir = page.getByRole("button", { name: new RegExp(`carte de ${p.nom}`) }).first();
    if (!(await ouvrir.count())) {
      await page.getByRole("link", { name: /^Autres personnages/ }).click();
      await page.waitForTimeout(1500);
      if (process.env.ARBRE) writeFileSync(`${arbres}/portraits-autres.txt`, await page.locator("body").ariaSnapshot());
    }
    await ouvrir.click();
    const creer = page.locator(".panneau").getByRole("button", { name: "Créer son portrait" });
    await creer.waitFor();
    if (process.env.ARBRE) writeFileSync(`${arbres}/portraits-carte-${p.cle}.txt`, await page.locator("body").ariaSnapshot());
    const t0 = Date.now();
    await creer.click();
    let id: string | null = null;
    for (let i = 0; i < 480 && !id; i += 1) {
      await page.waitForTimeout(500);
      const [l] = await sql<{ portrait_id: string | null }>("select portrait_id from personnages where projet_id = $1 and nom = $2", [h.projet, p.nom]);
      id = l?.portrait_id ?? null;
    }
    if (!id) throw new Error(`Aucun portrait pour ${p.nom}.`);
    const ms = Date.now() - t0;
    const [image] = await sql<{ chemin: string; format: string; largeur: number; hauteur: number }>("select chemin, format, largeur, hauteur from images where id = $1", [id]);
    const { data, error } = await service().storage.from("images").download(image.chemin);
    if (error || !data) throw new Error(error?.message ?? "image illisible");
    const ext = image.format === "png" ? "png" : "jpg";
    writeFileSync(`${sortie}/${p.cle}.${ext}`, Buffer.from(await data.arrayBuffer()));
    releve.push({ personnage: p.nom, ms, solde: await solde(h.compte), largeur: image.largeur, hauteur: image.hauteur });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `${sortie}/${p.cle}-ecran.png` });
    await page.locator(".panneau").getByRole("button", { name: "Fermer", exact: true }).last().click();
    await page.waitForTimeout(800);
  }
  const journal = await sql(
    `select a.aide, a.sorte, a.issue, a.modele, a.cout_usd, round(extract(epoch from (a.termine_le - a.commence_le))::numeric, 1) as secondes, m.nombre as etoiles
     from appels_ia a left join mouvements_etoiles m on m.appel_id = a.id where a.enseignant_id = $1 order by a.commence_le`,
    [h.compte.id],
  );
  writeFileSync(`${sortie}/mesures.json`, JSON.stringify({ vraieIa: VRAIE, le: new Date().toISOString(), depart: 30, releve, journal }, null, 2));
});
