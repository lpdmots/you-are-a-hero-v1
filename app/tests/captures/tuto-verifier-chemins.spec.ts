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
 * Les vrais écrans du tuto « Vérifier les chemins » (V1/video/tuto-verifier-chemins/SCRIPT.md), joués
 * sur la base locale : npx playwright test --config playwright.local.config.ts tuto-verifier-chemins
 *
 * Même méthode que tuto-relire-livre.spec.ts : chaque écran en PNG (1440 × 810, densité 2) et
 * boites.json / boites.js, la place de ce que la vidéo vise. Ce n'est pas un test.
 * La suite du tuto 8 : « Le secret de la forêt bleue » est relu (« Livre relu. »). Le livre a deux
 * points : « Suivre le hibou » ne mène nulle part (Rayan a oublié de le relier), qu'on relie dans la
 * scène ouverte à côté ; « Le passage secret », où aucun chemin ne mène (une énigme écrite dans le
 * texte, sans lien caché), qu'on garde par « C'est voulu ». Puis la lecture d'essai, et « J'ai vérifié
 * les chemins ». Inventé pour la vidéo, sur un compte d'essai supprimé à la fin ; les images viennent
 * de V1/video/tuto-relire-livre/images/. Les aides de l'IA sont éteintes.
 */
const dossier = resolve(__dirname, "../../../video/tuto-verifier-chemins/captures");
const images = resolve(__dirname, "../../../video/tuto-relire-livre/images");
const LARGEUR = 1440;
const HAUTEUR = 810;
const CLASSE = "CM2 des Tilleuls";
const TITRE = "Le secret de la forêt bleue";
const ELEVES = [
  "Inès", "Mathis", "Léna", "Noah", "Jade", "Adam", "Louise", "Sacha", "Chloé", "Yanis", "Emma", "Rayan",
  "Lina", "Hugo", "Manon", "Ilyes", "Rose", "Tom", "Zoé", "Nolan", "Anna", "Elio", "Maëlys", "Gabin",
];
// Le choix oublié par Rayan, qui ne mène nulle part
const OUBLIE = "Suivre le hibou";

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
            ], choix: [[OUBLIE, null]],
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

/** L'arbre d'accessibilité de la page, pour régler le script (ARBRE=1). */
async function arbre(page: Page, nom: string): Promise<void> {
  if (!process.env.ARBRE) return;
  writeFileSync(`${dossier}/arbre-${nom}.txt`, await page.locator("body").ariaSnapshot());
}

test("Vérifier les chemins : les écrans du tuto", async ({ page }) => {
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
    const tete = s.image ? [figure(await deposer(base, compte, projet, s.image), s.cle === "fete" ? 65 : 100)] : [];
    const blocs: BlocSeme[] = [...tete, ...s.texte.map((t) => recit(t)), ...(s.choix ?? []).map(([libelle, vers]) => choixAuto(libelle, cible(vers)))];
    await semerBlocs(base, ids.get(s.cle)!, blocs);
    await sql("update scenes set etat = 'prete', fin = $2, prise_par_eleve = $3, etat_le = now() - interval '2 days' where id = $1", [ids.get(s.cle), Boolean(s.fin), eleves[s.eleve].id]);
  }
  // Le livre relu au tuto 8 : le Livre se rouvre sur « Relire »
  await base.from("projets").update({ depart_scene_id: ids.get("fete"), livre_relu_le: new Date().toISOString(), derniere_etape_livre: "relire" }).eq("id", projet);
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

  const colonne = page.getByRole("navigation").filter({ has: page.getByRole("link", { name: "Parties et chapitres" }) }).first();
  const livre = colonne.getByRole("link", { name: /^Livre/ });

  // 2 — Parties et chapitres, puis « Livre », qui se rouvre sur « Relire » ; puis « Vérifier les chemins »
  await aller(page, `/projet/${projet}/plan`);
  await page.locator("html[data-pret]").waitFor();
  await page.waitForTimeout(2000);
  await capturer(page, "plan", { colonne, livre });
  await capturer(page, "survol-livre", { colonne, livre }, livre);
  await livre.click();
  await page.waitForURL(/\/livre/);
  await page.locator("html[data-pret]").waitFor();
  await apercuPret(page);
  await page.waitForTimeout(2500);
  const etapes = page.getByRole("navigation", { name: "Étapes du livre" });
  const verifier = etapes.getByRole("link").filter({ hasText: "Vérifier les chemins" });
  const tache = (nom: string | RegExp) => page.locator(".fil__b").filter({ hasText: nom }).first();
  const point = (quoi: string | RegExp) => page.locator(".point").filter({ hasText: quoi }).first();
  const lieuxL = () => ({
    colonne, livre, etapes, verifier,
    relire: etapes.getByRole("link").filter({ hasText: "Relire" }),
    fiche: page.locator(".carnet-fiche--decision.controles"),
    taches: page.locator(".fil-taches"),
    departFins: tache("Départ et fins"),
    choix: tache("Choix à relier"),
    passages: tache("Passages à confirmer"),
    essai: tache("Tester la lecture"),
    panneau: page.locator(".tache-panneau"),
    ok: page.locator(".tache-panneau .tache__ok").first(),
    points: page.locator(".tache-panneau .points"),
    pointChoix: point("ne mène nulle part"),
    pointPassage: point("Aucun chemin n’y mène"),
    ouvrir: page.locator(".tache-panneau .point").first().getByRole("button", { name: "Ouvrir la scène" }),
    voirChemins: page.locator(".tache-panneau .point__chemins").first(),
    voulu: page.locator(".tache-panneau").getByRole("button", { name: "C’est voulu" }),
    acceptes: page.locator(".tache-panneau .acceptes"),
    continuer: page.getByRole("button", { name: "Continuer" }),
    tester: page.getByRole("link", { name: "Tester la lecture" }),
    declarer: page.getByRole("button", { name: "J’ai vérifié les chemins" }),
    suite: page.locator(".controles__suite"),
    message: page.locator(".message").first(),
    apercu: page.locator(".apercu"),
  });
  await capturer(page, "livre", lieuxL());
  await arbre(page, "livre");
  await capturer(page, "survol-verifier", lieuxL(), verifier);
  await verifier.click();
  await page.locator(".carnet-fiche--decision.controles").waitFor();
  await page.waitForTimeout(1500);
  await capturer(page, "chemins", lieuxL());
  await arbre(page, "chemins");
  await capturer(page, "survol-depart", lieuxL(), lieuxL().departFins);
  await lieuxL().departFins.click();
  await capturer(page, "depart-fins", lieuxL());
  await capturer(page, "survol-continuer-choix", lieuxL(), lieuxL().continuer);
  await lieuxL().continuer.click();
  await capturer(page, "choix", lieuxL());

  // 3 — « Ouvrir la scène » : la scène de Rayan à côté de l'aperçu, son choix ouvert ; on le relie
  await capturer(page, "survol-ouvrir", lieuxL(), lieuxL().ouvrir);
  await lieuxL().ouvrir.click();
  const copieA = page.locator('.a-cote .copie__texte[contenteditable="true"]');
  await copieA.waitFor({ timeout: 30_000 });
  await page.waitForTimeout(2500);
  const lieuxA = () => ({
    ...lieuxL(),
    aCote: page.locator(".a-cote"),
    tete: page.locator(".a-cote__tete"),
    copie: copieA,
    fermer: page.locator(".a-cote__fermer"),
    reglages: page.locator(".livre-plan__panneau"),
    panneauChoix: page.locator(".cx").first(),
    choisir: page.locator(".cx").first().getByRole("button", { name: /^(Choisir|Changer)/ }),
    phrase: page.locator(".cx").first().getByText("La phrase").locator(".."),
    choisie: page.locator(".apercu__choisie").first(),
  });
  await capturer(page, "a-cote", lieuxA());
  await arbre(page, "a-cote");
  const reglages = page.locator(".livre-plan__panneau");
  const choisir = reglages.getByRole("button", { name: /^Choisir/ });
  await capturer(page, "survol-choisir", lieuxA(), choisir);
  await choisir.click();
  await page.waitForTimeout(800);
  const demande = reglages.locator("#cx-demande");
  const lieuxD = () => ({ ...lieuxA(), demande, liste: reglages.locator(".cx-issues ul").first(), grottes: reglages.locator(".cx-issues li").filter({ hasText: "L’entrée des grottes" }).first() });
  await capturer(page, "choisir", lieuxD(), "tenue");
  await arbre(page, "choisir");
  await demande.click();
  await page.keyboard.type("grottes", { delay: 60 });
  await page.waitForTimeout(1200);
  await capturer(page, "cherche", lieuxD(), "tenue");
  await capturer(page, "survol-grottes", lieuxD(), lieuxD().grottes);
  await lieuxD().grottes.click();
  await page.waitForTimeout(3500);
  await capturer(page, "relie", lieuxA());
  await arbre(page, "relie");
  // l'aperçu se recompose avec le numéro du choix relié
  await page.waitForTimeout(4000);
  await apercuPret(page);
  await page.waitForTimeout(2000);
  await capturer(page, "relie-apercu", lieuxA());

  // « Fermer » : la fiche revient, « Choix à relier » coché
  await capturer(page, "survol-fermer", lieuxA(), lieuxA().fermer);
  await lieuxA().fermer.click();
  await page.locator(".fil-taches").waitFor();
  await page.waitForTimeout(2500);
  await capturer(page, "fiche-revenue", lieuxL());
  await arbre(page, "fiche-revenue");
  if (!(await lieuxL().pointPassage.count())) {
    await lieuxL().passages.click();
    await page.waitForTimeout(800);
    await capturer(page, "passages", lieuxL());
  }

  // 4 — « Aucun chemin n'y mène » : « C'est voulu »
  await capturer(page, "survol-voulu", lieuxL(), lieuxL().voulu);
  await lieuxL().voulu.click();
  await page.locator(".tache-panneau .acceptes").waitFor({ timeout: 15_000 });
  await page.waitForTimeout(600);
  n += 1;
  {
    // le message, gardé à l'écran
    const cle = `${String(n).padStart(2, "0")}-voulu-message`;
    await page.mouse.move(LARGEUR - 1, HAUTEUR - 1);
    await nettoyer(page, true);
    const places: Record<string, Boite> = {};
    for (const [quoi, c] of Object.entries(lieuxL())) {
      const b = await boite(c);
      if (b) places[quoi] = b;
    }
    places._fenetre = { x: 0, y: await page.evaluate(() => window.scrollY), l: LARGEUR, h: HAUTEUR };
    boites[cle] = places;
    await page.screenshot({ path: `${dossier}/${cle}.png` });
  }
  await page.waitForTimeout(6000);
  await capturer(page, "voulu", lieuxL());
  await arbre(page, "voulu");

  // 5 — « Continuer » : « Tester la lecture » ; la lecture d'essai, deux choix suivis, puis « Quitter »
  await capturer(page, "survol-continuer-essai", lieuxL(), lieuxL().continuer);
  await lieuxL().continuer.click();
  await page.waitForTimeout(800);
  await capturer(page, "essai", lieuxL());
  await capturer(page, "survol-tester", lieuxL(), lieuxL().tester);
  await lieuxL().tester.click();
  await page.waitForURL(/\/lecture/);
  await page.locator("html[data-pret]").waitFor();
  await page.waitForTimeout(1500);
  const commencer = page.getByRole("link", { name: "Commencer au départ" });
  const lieuxE = () => ({
    commencer,
    quitter: page.getByRole("link", { name: "Quitter" }).or(page.getByRole("button", { name: "Quitter" })).first(),
    choix: page.locator(".lu-choix-liste").last(),
    grenier: page.locator(".lu-choix").filter({ hasText: "Monter au grenier" }).last(),
    coffre: page.locator(".lu-choix").filter({ hasText: "Ouvrir le coffre" }).last(),
    article: page.locator("main article").last(),
    accueil: page.locator(".lecture__departs .carnet-fiche").first(),
  });
  await capturer(page, "par-ou", lieuxE());
  await arbre(page, "par-ou");
  await capturer(page, "survol-commencer", lieuxE(), commencer);
  await commencer.click();
  await page.locator(".lu-choix").first().waitFor({ timeout: 30_000 });
  await page.waitForTimeout(2500);
  await capturer(page, "lecture-1", lieuxE());
  await arbre(page, "lecture-1");
  // un choix suivi : le grenier ; puis un second : le coffre
  await capturer(page, "survol-grenier", lieuxE(), lieuxE().grenier);
  await lieuxE().grenier.click();
  await page.waitForTimeout(2000);
  await capturer(page, "lecture-2", lieuxE());
  await arbre(page, "lecture-2");
  await capturer(page, "survol-coffre", lieuxE(), lieuxE().coffre);
  await lieuxE().coffre.click();
  await page.waitForTimeout(2000);
  await capturer(page, "lecture-3", lieuxE());
  await capturer(page, "survol-quitter", lieuxE(), lieuxE().quitter);
  await lieuxE().quitter.click();
  await page.waitForURL(/\/livre/);
  await page.locator("html[data-pret]").waitFor();
  await page.locator(".carnet-fiche--decision.controles").waitFor();
  await apercuPret(page);
  await page.waitForTimeout(2500);
  await capturer(page, "retour-livre", lieuxL());
  await arbre(page, "retour-livre");
  if (!(await lieuxL().declarer.count())) {
    await lieuxL().essai.click();
    await page.waitForTimeout(800);
    await capturer(page, "retour-essai", lieuxL());
  }
  await capturer(page, "survol-declarer", lieuxL(), lieuxL().declarer);
  await lieuxL().declarer.click();
  await page.locator(".tache-panneau").getByText("Chemins vérifiés.").waitFor();
  await page.waitForTimeout(2000);
  await capturer(page, "verifie", lieuxL());

  // 6 — « Étape suivante : Mettre en page »
  await capturer(page, "survol-suite", lieuxL(), lieuxL().suite);

  const donnees = JSON.stringify({ largeur: LARGEUR, hauteur: HAUTEUR, densite: 2, version: Date.now(), ecrans: boites }, null, 2);
  writeFileSync(`${dossier}/boites.json`, donnees);
  writeFileSync(`${dossier}/boites.js`, `// Écrit par app/tests/captures/tuto-verifier-chemins.spec.ts — ne pas modifier\nwindow.BOITES = ${donnees};\n`);
});
