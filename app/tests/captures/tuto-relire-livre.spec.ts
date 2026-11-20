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
 * Les vrais écrans du tuto « Relire le livre » (V1/video/tuto-relire-livre/SCRIPT.md), joués sur la
 * base locale : npx playwright test --config playwright.local.config.ts tuto-relire-livre
 *
 * Même méthode que tuto-relire.spec.ts : chaque écran en PNG (1440 × 810, densité 2) et
 * boites.json / boites.js, la place de ce que la vidéo vise. Ce n'est pas un test.
 * La suite du tuto 7 : toutes les scènes de « Le secret de la forêt bleue » sont validées, chacune
 * avec son image. Mme Laurent déclare « La carte qui brille » prête pour le livre ; les autres le
 * sont déjà (saut du temps). Au Livre, « Relire » : les trois premières tâches sont faites, elle lit
 * l'aperçu, corrige une coquille dans la scène ouverte à côté, puis déclare « J'ai relu le livre ».
 * Inventé pour la vidéo, sur un compte d'essai supprimé à la fin ; les images viennent de
 * V1/video/tuto-relire-livre/images/ (créées par outils/image-ia.mts). Les aides de l'IA sont éteintes.
 */
const dossier = resolve(__dirname, "../../../video/tuto-relire-livre/captures");
const images = resolve(__dirname, "../../../video/tuto-relire-livre/images");
const LARGEUR = 1440;
const HAUTEUR = 810;
const CLASSE = "CM2 des Tilleuls";
const TITRE = "Le secret de la forêt bleue";
const ELEVES = [
  "Inès", "Mathis", "Léna", "Noah", "Jade", "Adam", "Louise", "Sacha", "Chloé", "Yanis", "Emma", "Rayan",
  "Lina", "Hugo", "Manon", "Ilyes", "Rose", "Tom", "Zoé", "Nolan", "Anna", "Elio", "Maëlys", "Gabin",
];
// La coquille que l'enseignante corrige dans l'aperçu, au premier passage du livre
const COQUILLE = "brances";
const CORRIGE = "branches";

type Scene = { cle: string; titre: string; eleve: string; image: string; texte: string[]; choix?: [string, string][]; fin?: true };
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
              `Ce soir, tout le village des racines fête les lucioles. Des lanternes pendent aux ${COQUILLE} et les enfants dansent autour du grand feu.`,
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
            ], choix: [["Monter l’escalier", "arbre"]],
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
    }
  }, messages);
}

/**
 * Un écran, et la place des éléments que la vidéo désigne. survol : la souris reste sur cet
 * élément ; tenue : la souris reste où elle est. mots : la place de mots dans un élément.
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

const apercuPret = (page: Page) => page.locator(".apercu__etat").filter({ hasText: "passages" }).first().waitFor({ timeout: 120_000 });

test.use({ viewport: { width: LARGEUR, height: HAUTEUR }, deviceScaleFactor: 2 });
test.afterAll(async () => {
  await supprimerComptes();
});

test("Relire le livre : les écrans du tuto", async ({ page }) => {
  test.setTimeout(600_000);
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
  const chapitreDe = new Map<string, string>();
  for (const partie of HISTOIRE) {
    const posee = await semerPartie(base, projet, partie.titre, partie.chapitres.map((c) => ({ titre: c.titre, scenes: c.scenes.map((s) => s.titre) })), partie.visuel);
    for (const [k, chapitre] of partie.chapitres.entries()) {
      const ch = posee.chapitres[k];
      await base.from("chapitres").update({ visuel_defaut: chapitre.visuel }).eq("id", ch.id);
      await semerAttribution(base, ch.id, chapitre.eleves.map((p) => ({ eleve: eleves[p].id })));
      chapitre.scenes.forEach((s, j) => {
        ids.set(s.cle, ch.scenes[j]);
        chapitreDe.set(s.cle, ch.id);
      });
    }
  }
  // Les textes, chacun avec son image en tête, les choix, les fins ; tout est validé
  const scenes = HISTOIRE.flatMap((p) => p.chapitres.flatMap((c) => c.scenes));
  for (const s of scenes) {
    const image = await deposer(base, compte, projet, s.image);
    // l'image du premier passage, moins large : sa coquille reste dans l'aperçu, sans défiler
    const blocs: BlocSeme[] = [figure(image, s.cle === "fete" ? 65 : 100), ...s.texte.map((t) => recit(t)), ...(s.choix ?? []).map(([libelle, vers]) => choixAuto(libelle, ids.get(vers)!))];
    await semerBlocs(base, ids.get(s.cle)!, blocs);
    await sql("update scenes set etat = 'valide', fin = $2, prise_par_eleve = $3, etat_le = now() - interval '2 days' where id = $1", [ids.get(s.cle), Boolean(s.fin), eleves[s.eleve].id]);
  }
  await base.from("projets").update({ depart_scene_id: ids.get("fete") }).eq("id", projet);
  // L'ordre du livre, établi une fois comme le fait l'application au premier choix écrit (assurerOrdre),
  // sur un tirage fixé : sans lui, la première correction l'établirait et renumérotait les passages
  const plan: PlanNumerote = {
    departSceneId: ids.get("fete")!,
    parties: HISTOIRE.map((p) => ({
      id: p.titre, groupeAvecPrecedente: false, ouvertureSceneId: null,
      chapitres: p.chapitres.map((c) => ({ horsLivre: false, scenes: c.scenes.map((x) => ({ id: ids.get(x.cle)!, horsLivre: false, rangLivre: null, numeroFixe: null })) })),
    })),
  };
  const rangs = melangeInitial(plan, scenes.filter((x) => x.choix).map((x) => x.choix!.map(([, vers]) => ids.get(vers)!)), hasard(8));
  const etabli = await base.rpc("etablir_ordre", { p_projet: projet, p_rangs: Object.fromEntries(rangs) });
  if (etabli.error || etabli.data !== true) throw new Error(`ordre non établi : ${etabli.error?.message}`);

  const colonne = page.getByRole("navigation").filter({ has: page.getByRole("link", { name: "Parties et chapitres" }) }).first();
  const livre = colonne.getByRole("link", { name: /^Livre/ });

  // 2 — La scène validée de Sacha, son image en place : « Prête pour le livre »
  const carte = ids.get("carte")!;
  await aller(page, `/projet/${projet}/scene/${carte}`);
  await page.locator("html[data-pret]").waitFor();
  const copie = page.locator('.copie__texte[contenteditable="true"]');
  await copie.waitFor();
  await page.waitForTimeout(2000);
  const fiche = page.locator(".carnet-fiche--decision");
  const lieux = () => ({
    colonne, livre, copie, fiche,
    image: copie.locator("img").first(),
    tampon: page.locator("summary.tampon--menu").first(),
    prete: fiche.getByRole("button", { name: "Prête pour le livre" }),
    fait: fiche.locator(".decision__fait"),
  });
  await capturer(page, "scene", lieux());
  await capturer(page, "survol-prete", lieux(), lieux().prete);
  await lieux().prete.click();
  await fiche.locator(".decision__fait").waitFor();
  await page.waitForTimeout(1200);
  await capturer(page, "prete", lieux());

  // Saut du temps : toutes les autres scènes sont prêtes
  await sql("update scenes set etat = 'prete' where projet_id = $1", [projet]);

  // 3 — « Livre », puis « Relire » : quatre tâches, les trois premières faites
  await capturer(page, "survol-livre", lieux(), livre);
  await livre.click();
  await page.waitForURL(/\/livre/);
  await page.locator("html[data-pret]").waitFor();
  await apercuPret(page);
  await page.waitForTimeout(2500);
  const etapes = page.getByRole("navigation", { name: "Étapes du livre" });
  const relire = etapes.getByRole("link").filter({ hasText: "Relire" });
  const tache = (nom: string | RegExp) => page.locator(".fil__b").filter({ hasText: nom }).first();
  const lieuxL = () => ({
    colonne, livre, etapes, relire,
    chemins: etapes.getByRole("link").filter({ hasText: "Vérifier les chemins" }),
    ficheRelire: page.locator(".carnet-fiche--decision.controles"),
    taches: page.locator(".fil-taches"),
    ecrire: tache("Ce qui reste à écrire"),
    graves: tache("Erreurs graves"),
    confirmer: tache("À confirmer"),
    lire: tache("Lire et corriger"),
    panneau: page.locator(".tache-panneau"),
    ok: page.locator(".tache-panneau .tache__ok").first(),
    continuer: page.getByRole("button", { name: "Continuer" }),
    aide: page.locator(".tache-panneau .tache__aide").first(),
    declarer: page.getByRole("button", { name: "J’ai relu le livre" }),
    suite: page.locator(".controles__suite"),
    apercu: page.locator(".apercu"),
    pages: page.locator(".apercu__pages"),
    page1: page.locator(".apercu__page").first(),
    etat: page.locator(".apercu__etat"),
  });
  await capturer(page, "livre", lieuxL());
  await capturer(page, "survol-relire", lieuxL(), relire);
  await relire.click();
  await page.waitForTimeout(1500);
  await capturer(page, "relire", lieuxL());
  await capturer(page, "survol-ecrire", lieuxL(), lieuxL().ecrire);
  await lieuxL().ecrire.click();
  await capturer(page, "ecrire", lieuxL());
  for (const nom of ["graves", "confirmer", "lire"]) {
    await capturer(page, `survol-continuer-${nom}`, lieuxL(), lieuxL().continuer);
    await lieuxL().continuer.click();
    await capturer(page, nom, lieuxL());
  }

  // 4 — L'aperçu ; la coquille du premier passage ; un clic l'ouvre à côté ; « branches » corrigé sur place
  await capturer(page, "apercu", lieuxL());
  const p1 = await boite(lieuxL().page1);
  if (!p1) throw new Error("page de l'aperçu introuvable");
  // la coquille, au premier paragraphe du passage (mesurée sur la capture « apercu »)
  const clic = { x: p1.x + p1.l * 0.49, y: p1.y + p1.h * 0.49 };
  await page.mouse.move(clic.x, clic.y);
  await capturer(page, "survol-passage", lieuxL(), "tenue");
  await page.mouse.click(clic.x, clic.y);
  const copieA = page.locator('.a-cote .copie__texte[contenteditable="true"]');
  await copieA.waitFor({ timeout: 30_000 });
  await page.waitForTimeout(2500);
  const lieuxA = () => ({
    ...lieuxL(),
    aCote: page.locator(".a-cote"),
    tete: page.locator(".a-cote__tete"),
    copie: copieA,
    fermer: page.locator(".a-cote__fermer"),
    choisie: page.locator(".apercu__choisie").first(),
  });
  const SEL = '.a-cote .copie__texte[contenteditable="true"]';
  await capturer(page, "a-cote", lieuxA(), undefined, { coquille: [SEL, COQUILLE] });
  const b = await boiteDuMot(page, SEL, COQUILLE);
  if (!b) throw new Error("coquille introuvable");
  await page.mouse.move(b.x + b.l / 2, b.y + b.h / 2);
  await capturer(page, "survol-coquille", lieuxA(), "tenue", { coquille: [SEL, COQUILLE] });
  await page.mouse.dblclick(b.x + b.l / 2, b.y + b.h / 2);
  await page.waitForTimeout(300);
  await capturer(page, "coquille-choisie", lieuxA(), "tenue", { coquille: [SEL, COQUILLE] });
  for (const [i, lettre] of [...CORRIGE].entries()) {
    await page.keyboard.type(lettre);
    const nom = i === CORRIGE.length - 1 ? "corrige" : `corrige-${i + 1}`;
    await capturer(page, nom, lieuxA(), "tenue", { corrige: [SEL, CORRIGE.slice(0, i + 1)] });
  }
  // enregistré, puis l'aperçu se recompose
  await page.waitForTimeout(3500);
  await capturer(page, "corrige-enregistre", lieuxA(), undefined, { corrige: [SEL, CORRIGE] });
  await page.waitForTimeout(6000);
  await apercuPret(page);
  await page.waitForTimeout(2000);
  await capturer(page, "apercu-corrige", lieuxA(), undefined, { corrige: [SEL, CORRIGE] });

  // 5 — « Fermer », puis « J'ai relu le livre »
  await capturer(page, "survol-fermer", lieuxA(), lieuxA().fermer);
  await lieuxA().fermer.click();
  await page.locator(".fil-taches").waitFor();
  await page.waitForTimeout(2500);
  await capturer(page, "fiche-revenue", lieuxL());
  await capturer(page, "survol-declarer", lieuxL(), lieuxL().declarer);
  await lieuxL().declarer.click();
  await page.locator(".tache-panneau").getByText("Livre relu.").waitFor();
  await page.waitForTimeout(2000);
  await capturer(page, "relu", lieuxL());

  // 6 — « Étape suivante : Vérifier les chemins »
  await capturer(page, "survol-suite", lieuxL(), lieuxL().suite);

  const donnees = JSON.stringify({ largeur: LARGEUR, hauteur: HAUTEUR, densite: 2, version: Date.now(), ecrans: boites }, null, 2);
  writeFileSync(`${dossier}/boites.json`, donnees);
  writeFileSync(`${dossier}/boites.js`, `// Écrit par app/tests/captures/tuto-relire-livre.spec.ts — ne pas modifier\nwindow.BOITES = ${donnees};\n`);
});
