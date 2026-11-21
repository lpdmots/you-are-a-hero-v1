import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { resolve } from "node:path";
import { test, type Locator, type Page } from "@playwright/test";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  adultePret, aller, choixAuto, elevesDe, figure, recit, semerAttribution, semerBlocs, semerClasse, semerPartie, semerProjet, service, sql,
  supprimerComptes, type BlocSeme, type Compte,
} from "../parcours/outils";
import { hasard, melangeInitial, type PlanNumerote } from "../../src/domaine/numeros";


/**
 * Les vrais écrans du tuto « Imprimer et partager » (V1/video/tuto-imprimer-partager/SCRIPT.md),
 * joués sur la base locale, par la suite des captures (serveur 3100, IA simulée : la proposition
 * à la bibliothèque déclenche la relecture de l'IA au compte du porteur, qui ne doit pas partir
 * pour de vrai) : npm run captures -- tuto-imprimer-partager
 * Contre le serveur 4840 (`playwright.local.config.ts`), le script s'arrête avant « Proposer le
 * livre ».
 *
 * Même méthode que tuto-mettre-en-page.spec.ts : chaque écran en PNG (1440 × 810, densité 2) et
 * boites.json / boites.js, la place de ce que la vidéo vise. Ce n'est pas un test.
 * La suite du tuto 10 : « Le secret de la forêt bleue » est relu, ses chemins vérifiés, sa mise en
 * page déclarée. On ouvre « Imprimer et partager » : le PDF définitif ; « Partager » : les comptes
 * des élèves, le lien pour les familles, la proposition à la bibliothèque ; puis le livre ouvert par
 * le lien. Inventé pour la vidéo, sur un compte d'essai supprimé à la fin ; les images viennent de
 * V1/video/tuto-relire-livre/images/. Les aides de l'IA sont éteintes.
 */
const dossier = resolve(__dirname, "../../../video/tuto-imprimer-partager/captures");
const images = resolve(__dirname, "../../../video/tuto-relire-livre/images");
const LARGEUR = 1440;
const HAUTEUR = 810;
const CLASSE = "CM2 des Tilleuls";
const TITRE = "Le secret de la forêt bleue";
const ELEVES = [
  "Inès", "Mathis", "Léna", "Noah", "Jade", "Adam", "Louise", "Sacha", "Chloé", "Yanis", "Emma", "Rayan",
  "Lina", "Hugo", "Manon", "Ilyes", "Rose", "Tom", "Zoé", "Nolan", "Anna", "Elio", "Maëlys", "Gabin",
];

/** La présentation du livre pour la bibliothèque, tapée dans la vidéo */
const PRESENTATION = "Une nuit, la forêt perd sa couleur bleue. Avec Pic l’écureuil, Timéo part retrouver la pierre de lune. À toi de choisir son chemin\u00a0!";

type Scene = { cle: string; titre: string; eleve: string; image?: string; texte: string[]; choix?: [string, string | null][]; fin?: true };
type Chapitre = { titre: string; visuel: string; eleves: string[]; scenes: Scene[] };
type Partie = { titre: string; visuel: string; chapitres: Chapitre[] };

/** L'histoire entière, écrite par la classe (inventée pour la vidéo) ; typographie française. */
const HISTOIRE: Partie[] = [
  {
    titre: "Le village des racines", visuel: "jardin", chapitres: [
      {
        titre: "La fête des lucioles", visuel: "etang", eleves: ["Mathis", "Adam", "Louise"], scenes: [
          {
            cle: "fete", titre: "La fête au village", eleve: "Mathis", image: "fete", texte: [
              "Ce soir, tout le village des racines fête les lucioles. Des lanternes pendent aux branches et les enfants dansent autour du grand feu.",
              "Timéo lève les yeux. Les feuilles de l’arbre géant, d’habitude si bleues, sont devenues grises par endroits. Sur son épaule, Pic l’écureuil frissonne.",
              "« Ce n’est pas normal, murmure Pic. La forêt perd sa couleur ! »",
            ], choix: [["Aller voir la grand-mère Ama", "conte"], ["Monter au grenier", "grenier"]],
          },
          {
            cle: "conte", titre: "Le conte de la grand-mère", eleve: "Adam", image: "conte", texte: [
              "Grand-mère Ama est assise près du feu, une couverture sur les genoux. Elle sourit en voyant Timéo arriver.",
              "« Autrefois, une pierre de lune brillait au cœur de la forêt. C’est elle qui rendait les arbres bleus. Un soir, elle a disparu. Ton grand-père avait une carte pour la retrouver. Elle doit être encore dans son vieux coffre, au grenier. »",
            ], choix: [["Monter au grenier", "grenier"]],
          },
        ],
      },
      {
        titre: "Le vieux coffre", visuel: "village", eleves: ["Sacha", "Léna", "Yanis"], scenes: [
          {
            cle: "grenier", titre: "Le grenier de Timéo", eleve: "Léna", image: "grenier", texte: [
              "Timéo grimpa l’échelle du grenier, sa lampe à la main. Pic le suivait, perché sur son épaule.",
              "Il y avait de la poussière partout, des malles, un vieux fauteuil et, dans un coin, un grand coffre en bois fermé par une boucle de cuivre.",
            ], choix: [["Ouvrir le coffre", "carte"], ["Appeler Pic à l’aide", "pic"], ["Redescendre sans bruit", "cuisine"]],
          },
          {
            cle: "carte", titre: "La carte qui brille", eleve: "Sacha", image: "carte", texte: [
              "Timéo souleva le couvercle du vieux coffre. Il grinça si fort que Pic sursauta.",
              "Au fond, sous une vieille couverture, une carte brillait dans le noir.",
              "Timéo avait un peu peur, mais il la déplia doucement. Un chemin bleu s’allumait sur le papier !",
              "Le chemin traversait la forêt jusqu’à la rivière aux reflets. Au bout, une petite lune dessinée brillait plus fort que tout le reste.",
            ], choix: [["Suivre le chemin bleu", "oree"]],
          },
          {
            cle: "pic", titre: "Pic l’écureuil", eleve: "Yanis", image: "pic", texte: [
              "Pic arriva en courant, la queue toute gonflée.",
              "« Timéo ! Ne descends pas sans moi, je connais ce coffre ! »",
              "Pic sauta sur le coffre et tira la boucle de cuivre avec ses petites pattes. Le couvercle s’ouvrit dans un long grincement.",
            ], choix: [["Ouvrir le coffre avec Pic", "carte"]],
          },
          {
            cle: "cuisine", titre: "La cuisine endormie", eleve: "Yanis", image: "cuisine", texte: [
              "Timéo redescendit l’échelle sur la pointe des pieds. Dans la cuisine endormie, l’horloge faisait tic-tac et le chat ronflait près du poêle.",
              "Sur la table, quelqu’un avait laissé une lanterne allumée et un petit mot : « Le coffre t’attend. »",
            ], choix: [["Remonter au grenier", "grenier"]],
          },
        ],
      },
    ],
  },
  {
    titre: "La forêt de la nuit", visuel: "foret", chapitres: [
      {
        titre: "Le sentier interdit", visuel: "foret", eleves: ["Jade", "Rayan", "Lina"], scenes: [
          {
            cle: "oree", titre: "L’orée de la forêt", eleve: "Jade", image: "oree", texte: [
              "Au bout du village commence la forêt de la nuit. Là, les arbres sont si hauts qu’on ne voit plus le ciel.",
              "Sur la carte, le chemin bleu se sépare en deux : un sentier interdit qui monte vers les collines, et un chemin qui longe la rivière.",
            ], choix: [["Prendre le sentier interdit", "yeux"], ["Longer la rivière", "pont"]],
          },
          {
            cle: "yeux", titre: "Les yeux dans le noir", eleve: "Rayan", image: "yeux", texte: [
              "Le sentier est étroit et plein de racines. Soudain, deux grands yeux jaunes s’allument au-dessus de Timéo.",
              "C’est un vieux hibou. « Personne ne passe par ici depuis cent ans, dit-il. Mais si tu cherches la pierre de lune, suis-moi. »",
            ], choix: [["Suivre le hibou", "grotte"]],
          },
        ],
      },
      {
        titre: "La rivière aux reflets", visuel: "riviere", eleves: ["Chloé", "Emma", "Hugo", "Inès"], scenes: [
          {
            cle: "pont", titre: "Le pont de lianes", eleve: "Chloé", image: "pont", texte: [
              "La rivière brille comme un miroir sous la lune. Un pont de lianes se balance d’une rive à l’autre.",
              "Pic se cramponne au col de Timéo. « On traverse ? Je n’aime pas l’eau, moi ! »",
            ], choix: [["Traverser le pont", "reflet"]],
          },
          {
            cle: "reflet", titre: "Le reflet qui parle", eleve: "Emma", image: "reflet", texte: [
              "Au milieu du pont, Timéo se penche. Dans l’eau, son reflet ne bouge pas comme lui : il lui fait signe !",
              "« La pierre de lune est gardée sous la montagne, chuchote le reflet. Passe par les grottes qui chantent. »",
            ], choix: [["Aller vers les grottes", "grotte"]],
          },
        ],
      },
      {
        titre: "Les grottes chantantes", visuel: "grotte", eleves: ["Noah", "Manon", "Ilyes"], scenes: [
          {
            cle: "grotte", titre: "L’entrée des grottes", eleve: "Noah", image: "grotte", texte: [
              "Au pied de la montagne, une grotte s’ouvre comme une grande bouche. De l’intérieur sort une musique douce, comme des voix qui fredonnent.",
              "Timéo hésite. Pic, lui, a déjà les oreilles dressées.",
            ], choix: [["Écouter le chant", "cristaux"]],
          },
          {
            cle: "cristaux", titre: "La grotte aux cristaux", eleve: "Manon", image: "cristaux", texte: [
              "Les murs de la grotte sont couverts de cristaux bleus. Quand le vent passe entre eux, ils chantent.",
              "Au fond, un escalier de pierre monte vers une lumière pâle. Timéo serre sa carte : il est tout près du but.",
              "Sur la dernière marche, des lettres brillent : « Compte les cristaux qui chantent, et tu trouveras le numéro du passage secret. »",
            ], choix: [["Monter l’escalier", "arbre"]],
          },
          {
            cle: "secret", titre: "Le passage secret", eleve: "Ilyes", texte: [
              "Bravo, tu as compté juste ! Derrière le plus gros cristal, une porte s’ouvre sur un couloir tout bleu.",
              "Au bout du couloir, Timéo découvre un raccourci : un escalier en colimaçon qui monte droit vers le cœur de la forêt.",
            ], choix: [["Grimper l’escalier en colimaçon", "arbre"]],
          },
        ],
      },
    ],
  },
  {
    titre: "Le cœur de la forêt", visuel: "temple", chapitres: [
      {
        titre: "La pierre de lune", visuel: "temple", eleves: ["Rose", "Tom", "Zoé", "Nolan"], scenes: [
          {
            cle: "arbre", titre: "Le cœur de la forêt", eleve: "Rose", image: "arbre", texte: [
              "L’escalier débouche au cœur de la forêt, devant un arbre immense. Entre ses racines, une petite pierre ronde brille faiblement.",
              "« La pierre de lune ! » s’écrie Pic. Mais une grande ombre se dresse devant eux.",
            ], choix: [["Avancer vers la pierre", "gardien"]],
          },
        ],
      },
      {
        titre: "Le gardien de la pierre", visuel: "montagne", eleves: ["Anna", "Elio", "Maëlys", "Gabin"], scenes: [
          {
            cle: "gardien", titre: "Le gardien de la pierre", eleve: "Anna", image: "gardien", texte: [
              "C’est un cerf aux bois couverts de mousse et d’étoiles. Ses yeux sont doux, mais sa voix est grave.",
              "« Seul celui qui connaît le secret de la forêt peut emporter la pierre. Dis-moi : qu’est-ce qui rend la forêt bleue ? »",
            ], choix: [["Répondre : la lumière de la lune", "retour"], ["S’enfuir en courant", "perdu"]],
          },
          {
            cle: "retour", titre: "Le retour au village", eleve: "Elio", image: "retour", fin: true, texte: [
              "Le cerf incline la tête. « Tu as bien écouté la forêt. » Il pousse doucement la pierre vers Timéo.",
              "Quand Timéo revient au village, la pierre dans les mains, les arbres redeviennent bleus un à un. Toute la nuit, les lucioles dansent autour de lui.",
            ],
          },
          {
            cle: "perdu", titre: "Perdu dans la nuit", eleve: "Maëlys", image: "perdu", fin: true, texte: [
              "Timéo court sans se retourner. Quand il s’arrête enfin, il ne reconnaît plus rien : les arbres sont gris, la carte s’est éteinte.",
              "Pic se blottit contre lui. « Il faudra revenir, Timéo. La forêt nous attend encore. »",
            ],
          },
        ],
      },
    ],
  },
];

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
    if (!garder) document.querySelectorAll<HTMLElement>(".message").forEach((m) => (m.style.visibility = "hidden"));
    const parcours = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let t = parcours.nextNode(); t; t = parcours.nextNode()) {
      if (t.nodeValue && /localhost:(3100|4840)/.test(t.nodeValue)) t.nodeValue = t.nodeValue.replace(/localhost:(3100|4840)/g, "iletaituneclasse.com");
      // l'heure des captures (souvent le soir) : celle d'une fin de journée de classe
      if (t.nodeValue && /\b\d{1,2} h \d{2}\b/.test(t.nodeValue)) t.nodeValue = t.nodeValue.replace(/\b\d{1,2} h (\d{2})\b/g, "16 h $1");
    }
    // le lien pour les familles, dans son champ
    document.querySelectorAll<HTMLInputElement>("input").forEach((i) => {
      if (/localhost:(3100|4840)/.test(i.value)) i.value = i.value.replace(/https?:\/\/localhost:(3100|4840)/g, "https://iletaituneclasse.com");
    });
  }, messages);
}

/**
 * Un écran, et la place des éléments que la vidéo désigne. survol : la souris reste sur cet
 * élément ; tenue : la souris reste où elle est. mots : la place de mots dans un élément ; messages : les messages restent à l’écran.
 */
async function capturer(
  page: Page, nom: string, cibles: Record<string, Locator> = {}, survol?: Locator | "tenue", mots: Record<string, [string, string]> = {}, messages = false,
): Promise<void> {
  n += 1;
  const cle = `${String(n).padStart(2, "0")}-${nom}`;
  if (survol === "tenue") {
    // rien
  } else if (survol) await survol.hover();
  else await page.mouse.move(LARGEUR - 1, HAUTEUR - 1);
  await page.waitForTimeout(700);
  await nettoyer(page, messages);
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

/** Une image de la classe déposée dans le stockage, comme une image importée : son identité. */
async function deposer(base: SupabaseClient, compte: Compte, projetId: string, nom: string): Promise<string> {
  const id = randomUUID();
  const octets = readFileSync(`${images}/${nom}.jpg`);
  const chemins = [`${compte.id}/${projetId}/${id}.jpg`, `${compte.id}/${projetId}/${id}-v.jpg`];
  for (const chemin of chemins) {
    const { error } = await service().storage.from("images").upload(chemin, octets, { contentType: "image/jpeg" });
    if (error) throw new Error(error.message);
  }
  const { error } = await base.from("images").insert({ id, projet_id: projetId, enseignant_id: compte.id, chemin: chemins[0], chemin_vignette: chemins[1], largeur: 1536, hauteur: 1024, format: "jpeg" });
  if (error) throw new Error(error.message);
  return id;
}

/**
 * Une page entière, de son haut jusqu'à `hauteur` points (la vidéo la fait défiler sous ce qui reste
 * collé en haut) ; les boîtes sont en points de la page. La fenêtre revient ensuite là où elle était.
 */
async function capturerPage(page: Page, nom: string, hauteur: number, cibles: Record<string, Locator> = {}, cacher: string[] = []): Promise<void> {
  n += 1;
  const cle = `${String(n).padStart(2, "0")}-${nom}`;
  const avant = await page.evaluate(() => window.scrollY);
  await page.mouse.move(LARGEUR - 1, HAUTEUR - 1);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await page.waitForTimeout(900);
  await nettoyer(page);
  const places: Record<string, Boite> = {};
  for (const [quoi, cible] of Object.entries(cibles)) {
    const b = await boite(cible);
    if (b) places[quoi] = b;
  }
  const total = await page.evaluate(() => document.documentElement.scrollHeight);
  const h = Math.min(hauteur, total);
  places._fenetre = { x: 0, y: 0, l: LARGEUR, h };
  boites[cle] = places;
  // ce qui reste collé en haut de la fenêtre est retiré de la page entière : la vidéo le pose par-dessus
  await page.evaluate((sels) => sels.forEach((s) => document.querySelectorAll<HTMLElement>(s).forEach((e) => (e.style.visibility = "hidden"))), cacher);
  await page.screenshot({ path: `${dossier}/${cle}.png`, fullPage: true, clip: { x: 0, y: 0, width: LARGEUR, height: h } });
  await page.evaluate((sels) => sels.forEach((s) => document.querySelectorAll<HTMLElement>(s).forEach((e) => (e.style.visibility = ""))), cacher);
  await page.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), avant);
  await page.waitForTimeout(600);
}

const descendre = async (page: Page, y: number) => {
  await page.evaluate((h) => window.scrollTo({ top: h, behavior: "instant" }), y);
  await page.waitForTimeout(700);
};

test.use({ viewport: { width: LARGEUR, height: HAUTEUR }, deviceScaleFactor: 2, permissions: ["clipboard-read", "clipboard-write"], acceptDownloads: true });
test.afterAll(async () => {
  await supprimerComptes();
});

/** L'arbre d'accessibilité de la page, pour régler le script (ARBRE=1). */
async function arbre(page: Page, nom: string): Promise<void> {
  if (!process.env.ARBRE) return;
  writeFileSync(`${dossier}/arbre-${nom}.txt`, await page.locator("body").ariaSnapshot());
}

/** La petite double page est dessinée (deux toiles peintes) */
async function petitPret(page: Page): Promise<void> {
  await page.locator(".reglages__cote canvas").first().waitFor({ timeout: 120_000 });
  await page.waitForTimeout(2500);
}

test("Imprimer et partager : les écrans du tuto", async ({ page }) => {
  test.setTimeout(900_000);
  rmSync(dossier, { recursive: true, force: true });
  mkdirSync(dossier, { recursive: true });
  const { compte, base } = await adultePret(page);
  await base.from("enseignants").update({
    nom_affiche: "Mme Laurent",
    reglages_ia: { proposer: false },
    voisines: false,
    aides_masquees: ["classes", "preparation", "plan", "suivi", "livre-chemins", "livre-relire"],
  }).eq("id", compte.id);
  const classe = await semerClasse(base, CLASSE, ELEVES);
  const projet = await semerProjet(base, compte, "classe", "choix", TITRE, classe.id);
  await base.from("projets").update({ visuel_defaut: "foret" }).eq("id", projet);
  await base.from("preparations").update({
    univers: "Une immense forêt dont les arbres deviennent bleus la nuit. Au cœur de la forêt, un village caché sous les racines d’un arbre géant.",
    enjeu: "Retrouver la pierre de lune avant la fin de l’hiver. Sans elle, la forêt perdra sa couleur bleue et le village sera découvert.",
  }).eq("projet_id", projet);
  await base.from("personnages").insert({
    projet_id: projet, enseignant_id: compte.id, nom: "Timéo", heros: true, rang: 0,
    description: "Timéo, 10 ans, vit au village des racines. Curieux et courageux, mais il a peur du noir. Son ami : Pic, un écureuil qui parle.",
  });
  const eleves = await elevesDe(base, classe.id);

  // Le plan : parties, chapitres, scènes, élèves
  const ids = new Map<string, string>();
  for (const partie of HISTOIRE) {
    const posee = await semerPartie(base, projet, partie.titre, partie.chapitres.map((c) => ({ titre: c.titre, scenes: c.scenes.map((s) => s.titre) })), partie.visuel);
    for (const [k, chapitre] of partie.chapitres.entries()) {
      const ch = posee.chapitres[k];
      await base.from("chapitres").update({ visuel_defaut: chapitre.visuel }).eq("id", ch.id);
      await semerAttribution(base, ch.id, chapitre.eleves.map((p) => ({ eleve: eleves[p].id })));
      chapitre.scenes.forEach((s, j) => ids.set(s.cle, ch.scenes[j]));
    }
  }
  // Les textes, avec leur image en tête (sauf le passage secret), les choix, les fins ; tout est prêt
  const scenes = HISTOIRE.flatMap((p) => p.chapitres.flatMap((c) => c.scenes));
  const cible = (vers: string | null) => (vers ? ids.get(vers)! : null);
  for (const s of scenes) {
    const tete = s.image ? [figure(await deposer(base, compte, projet, s.image), 100)] : [];
    const blocs: BlocSeme[] = [...tete, ...s.texte.map((t) => recit(t)), ...(s.choix ?? []).map(([libelle, vers]) => choixAuto(libelle, cible(vers)))];
    await semerBlocs(base, ids.get(s.cle)!, blocs);
    await sql("update scenes set etat = 'prete', fin = $2, prise_par_eleve = $3, etat_le = now() - interval '2 days' where id = $1", [ids.get(s.cle), Boolean(s.fin), eleves[s.eleve].id]);
  }
  // La page de titre porte le portrait des héros ; la page de fin est dans le livre
  const portrait = await deposer(base, compte, projet, "portrait");
  await base.from("projets").update({
    depart_scene_id: ids.get("fete"), livre_relu_le: new Date().toISOString(), derniere_etape_livre: "chemins",
    pages_du_livre: { titre: { illustration: portrait }, fin: { presente: true } },
  }).eq("id", projet);
  // L'ordre du livre, établi une fois comme le fait l'application au premier choix écrit (assurerOrdre)
  const plan: PlanNumerote = {
    departSceneId: ids.get("fete")!,
    parties: HISTOIRE.map((p) => ({
      id: p.titre, groupeAvecPrecedente: false, ouvertureSceneId: null,
      chapitres: p.chapitres.map((c) => ({ horsLivre: false, scenes: c.scenes.map((x) => ({ id: ids.get(x.cle)!, horsLivre: false, rangLivre: null, numeroFixe: null })) })),
    })),
  };
  const rangs = melangeInitial(plan, scenes.filter((x) => x.choix).map((x) => x.choix!.flatMap(([, vers]) => (vers ? [ids.get(vers)!] : []))), hasard(8));
  const etabli = await base.rpc("etablir_ordre", { p_projet: projet, p_rangs: Object.fromEntries(rangs) });
  if (etabli.error || etabli.data !== true) throw new Error(`ordre non établi : ${etabli.error?.message}`);

  // Le tuto 9, joué hors caméra : « Le passage secret » gardé par « C'est voulu », les chemins vérifiés
  await aller(page, `/projet/${projet}/livre?etape=chemins`);
  await page.locator("html[data-pret]").waitFor();
  await page.locator(".carnet-fiche--decision.controles").waitFor();
  await page.locator(".fil__b").filter({ hasText: "Passages à confirmer" }).first().click();
  await page.locator(".tache-panneau").getByRole("button", { name: "C’est voulu" }).click();
  await page.locator(".tache-panneau .acceptes").waitFor({ timeout: 15_000 });
  await base.from("projets").update({ chemins_verifies_le: new Date().toISOString(), derniere_etape_livre: "chemins" }).eq("id", projet);

  // Le tuto 10, posé en base : la mise en page déclarée, « Imprimer et partager » ouverte
  const maintenant = new Date().toISOString();
  await base.from("projets").update({
    mise_en_page_ouverte_le: maintenant, mise_en_page_convient_le: maintenant, imprimer_ouvert_le: maintenant, derniere_etape_livre: "page",
  }).eq("id", projet);

  const arret = process.env.STOP ?? "";
  const ecrire = () => {
    const donnees = JSON.stringify({ largeur: LARGEUR, hauteur: HAUTEUR, densite: 2, version: Date.now(), ecrans: boites }, null, 2);
    writeFileSync(`${dossier}/boites.json`, donnees);
    writeFileSync(`${dossier}/boites.js`, `// Écrit par app/tests/captures/tuto-imprimer-partager.spec.ts — ne pas modifier\nwindow.BOITES = ${donnees};\n`);
  };

  // 2 — la fin du tuto 10 : « Mise en page terminée » et « Imprimer et partager » ; puis le PDF définitif
  await aller(page, `/projet/${projet}/livre?etape=page`);
  await page.locator(".volets").waitFor();
  await petitPret(page);
  const etapes = page.getByRole("navigation", { name: "Étapes du livre" });
  const lieux = () => ({
    etapes,
    etapeSortie: etapes.getByRole("link").filter({ hasText: "Imprimer et partager" }),
    volets: page.locator(".volets"),
    bascule: page.locator(".volets .bascule"),
    terminee: page.locator(".volets__coche"),
    imprimer: page.locator(".volets").getByRole("link", { name: /Imprimer et partager/ }),
    ongletImprimer: page.locator(".volets").getByRole("tab", { name: /Imprimer/ }),
    ongletPartager: page.locator(".volets").getByRole("tab", { name: /Partager/ }),
    pdf: page.locator(".imprimer__pdf"),
    pret: page.locator(".imprimer__etat"),
    creer: page.locator(".imprimer__pdf > .imprimer__cmd").getByRole("button"),
    rappel: page.locator(".imprimer__rappel").first(),
    creerRappel: page.locator(".imprimer__rappel").getByRole("button", { name: /Créer le PDF définitif|Création du PDF/ }),
    statut: page.locator(".imprimer__statut"),
    suite: page.locator(".imprimer__suite"),
    conserves: page.locator(".conserves"),
    couverture: page.locator("aside.couverture"),
    partager: page.locator(".partager"),
    public: page.locator("section[aria-labelledby='public-t']"),
    prive: page.locator("section[aria-labelledby='prive-t']"),
    canalClasses: page.locator(".canal").filter({ hasText: "Comptes des élèves" }),
    interClasses: page.locator(".canal").filter({ hasText: "Comptes des élèves" }).locator(".inter"),
    canalLien: page.locator(".canal").filter({ hasText: "Lien pour les familles" }),
    interLien: page.locator(".canal").filter({ hasText: "Lien pour les familles" }).locator(".inter"),
    rappelPartage: page.locator(".partager__rappel"),
    relu: page.locator(".partager__rappel .partager__relu"),
    confirmer: page.locator(".partager__rappel").getByRole("button").first(),
    etatPrive: page.locator(".facon__etat"),
    invitation: page.locator(".invitation"),
    lien: page.locator(".lien-de-lecture"),
    adresse: page.locator(".lien-de-lecture__adresse").first(),
    copier: page.locator(".lien-de-lecture").getByRole("button", { name: "Copier le lien" }),
    ouvrirLien: page.locator(".lien-de-lecture").getByRole("link", { name: "Ouvrir" }),
    proposer: page.getByRole("button", { name: "Proposer à la bibliothèque…" }),
    formulaire: page.locator(".proposer"),
    presentation: page.locator("#presentation-livre"),
    atteste: page.locator(".proposer__atteste"),
    proposerLivre: page.locator(".proposer").getByRole("button", { name: /Proposer le livre|Un instant/ }),
    attente: page.locator(".facon__ligne--attente"),
    message: page.locator(".message").last(),
  });
  await capturer(page, "page", lieux());
  await arbre(page, "page");
  await capturer(page, "survol-imprimer", lieux(), lieux().imprimer);
  await lieux().imprimer.click();
  await page.locator(".imprimer__pdf").waitFor({ timeout: 60_000 });
  await page.waitForTimeout(2000);
  await capturer(page, "imprimer", lieux());
  await arbre(page, "imprimer");
  if (arret === "imprimer") return ecrire();
  await capturer(page, "survol-creer", lieux(), lieux().creer);

  // la création du PDF, retenue le temps d'une capture
  let relacher = () => {};
  const retenue = new Promise<void>((r) => (relacher = r));
  await page.route("**/livre/*/definitif", async (route) => {
    await retenue;
    await route.continue();
  });
  const telechargement = page.waitForEvent("download", { timeout: 180_000 });
  await lieux().creer.click();
  await page.waitForTimeout(600);
  if (await lieux().rappel.count()) {
    await capturer(page, "rappel", lieux());
    await arbre(page, "rappel");
    await capturer(page, "survol-creer-rappel", lieux(), lieux().creerRappel);
    await lieux().creerRappel.click();
  }
  await page.getByText("Création du PDF…").first().waitFor({ timeout: 10_000 });
  await capturer(page, "creation", lieux(), "tenue");
  relacher();
  await telechargement;
  await page.locator(".imprimer__etat--fait").waitFor({ timeout: 60_000 }).catch(async () => {
    await aller(page, `/projet/${projet}/livre?etape=sortie`);
    await page.locator(".imprimer__etat--fait").waitFor({ timeout: 30_000 });
  });
  await page.waitForTimeout(1500);
  await capturer(page, "fait", lieux());
  await arbre(page, "fait");
  if (arret === "fait") return ecrire();

  // 3 — « Partager » : les comptes des élèves
  await capturer(page, "survol-partager", lieux(), lieux().ongletPartager);
  await lieux().ongletPartager.click();
  await page.locator(".partager").waitFor();
  await page.waitForTimeout(1500);
  await capturer(page, "partager", lieux());
  await arbre(page, "partager");
  await capturerPage(page, "partager-page", 4000, lieux(), [".volets"]);
  if (arret === "partager") return ecrire();
  // descendre jusqu'au privé, sous la bibliothèque
  const yPrive = await page.evaluate(() => {
    const s = document.querySelector("section[aria-labelledby='prive-t']") as HTMLElement | null;
    return s ? Math.max(0, Math.round(s.getBoundingClientRect().top + window.scrollY - 170)) : 0;
  });
  await descendre(page, yPrive);
  await capturer(page, "prive", lieux());
  const cocherEtConfirmer = async (nom: string) => {
    await page.locator(".partager__rappel").waitFor();
    await page.waitForTimeout(500);
    await capturer(page, `rappel-${nom}`, lieux());
    await arbre(page, `rappel-${nom}`);
    await capturer(page, `survol-relu-${nom}`, lieux(), lieux().relu.locator("input"));
    await lieux().relu.locator("input").check({ force: true });
    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
    await capturer(page, `relu-${nom}`, lieux());
    await capturer(page, `survol-confirmer-${nom}`, lieux(), lieux().confirmer);
    await lieux().confirmer.click();
    await page.locator(".partager__rappel").waitFor({ state: "detached", timeout: 30_000 });
    await page.waitForTimeout(900);
    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  };
  await capturer(page, "survol-classes", lieux(), lieux().interClasses.locator(".inter__piste"));
  await lieux().interClasses.locator(".inter__piste").click();
  await cocherEtConfirmer("classes");
  await capturer(page, "classes", lieux(), undefined, {}, true);
  await arbre(page, "classes");

  // 4 — le lien pour les familles
  await page.waitForTimeout(3500); // le message précédent s'en va
  await capturer(page, "survol-lien", lieux(), lieux().interLien.locator(".inter__piste"));
  await lieux().interLien.locator(".inter__piste").click();
  await cocherEtConfirmer("lien");
  await lieux().lien.waitFor();
  // le chemin du lien, lu avant que la capture ne remplace l'adresse locale par celle du site
  const adresseLien = new URL(await lieux().adresse.inputValue()).pathname;
  await capturer(page, "lien", lieux(), undefined, {}, true);
  await arbre(page, "lien");
  await page.waitForTimeout(3500);
  await capturer(page, "survol-copier", lieux(), lieux().copier);
  await lieux().copier.click();
  await page.waitForTimeout(400);
  await capturer(page, "copie", lieux(), "tenue", {}, true);
  await page.waitForTimeout(3500);
  await capturerPage(page, "partager-lien-page", 4000, lieux(), [".volets"]);
  if (arret === "lien") return ecrire();

  // 5 — la bibliothèque : « Proposer à la bibliothèque… », la présentation, l'attestation, « Proposer le livre »
  await descendre(page, 0);
  await capturer(page, "haut", lieux());
  await capturer(page, "survol-proposer", lieux(), lieux().proposer);
  await lieux().proposer.click();
  await lieux().formulaire.waitFor();
  await page.waitForTimeout(800);
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  await capturer(page, "proposer", lieux());
  await arbre(page, "proposer");
  await lieux().presentation.click();
  await lieux().presentation.fill(PRESENTATION);
  await page.waitForTimeout(500);
  await capturer(page, "presentation", lieux(), "tenue");
  // descendre pour voir la case et « Proposer le livre », la présentation encore à l'écran
  const yForm = await page.evaluate(() => {
    const s = document.querySelector("#presentation-livre") as HTMLElement | null;
    return s ? Math.max(0, Math.round(s.getBoundingClientRect().top + window.scrollY - 230)) : 0;
  });
  await descendre(page, yForm);
  await capturer(page, "presentation-bas", lieux(), "tenue");
  await capturerPage(page, "presentation-page", 4000, lieux(), [".volets"]);
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  await capturer(page, "survol-atteste", lieux(), lieux().atteste.locator("input"));
  await lieux().atteste.locator("input").check({ force: true });
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  await capturer(page, "atteste", lieux());
  await capturer(page, "survol-proposer-livre", lieux(), lieux().proposerLivre);
  // la proposition fait relire le livre par l'IA, au compte du porteur : seulement contre le serveur des captures, en IA simulée
  if (!page.url().includes(":3100/")) {
    console.log("Serveur sans IA simulée : la proposition n'est pas envoyée.");
    return ecrire();
  }
  await lieux().proposerLivre.click();
  await lieux().attente.waitFor({ timeout: 30_000 });
  await page.waitForTimeout(700);
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  await capturer(page, "propose", lieux(), undefined, {}, true);
  await arbre(page, "propose");
  await page.waitForTimeout(3500);
  await capturer(page, "propose-calme", lieux());

  // 6 — le livre, ouvert par le lien des familles (« Ouvrir », visible sous la bibliothèque)
  await capturer(page, "survol-ouvrir", lieux(), lieux().ouvrirLien);
  const lecteur = await page.context().newPage();
  await lecteur.goto(adresseLien);
  await lecteur.waitForLoadState("networkidle");
  await lecteur.waitForTimeout(3000);
  await lecteur.addStyleTag({ content: "html { scrollbar-width: none; }" });
  await capturer(lecteur, "lecteur", { livre: lecteur.locator("main") });
  await arbre(lecteur, "lecteur");
  await lecteur.close();

  ecrire();
});
