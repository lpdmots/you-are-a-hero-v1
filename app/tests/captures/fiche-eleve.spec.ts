import { test, type Locator, type Page } from "@playwright/test";
import { aller, autrePoste, choixAuto, classeQuiEcrit, ecrire, recit, semerBlocs, sql, supprimerComptes } from "../parcours/outils";

/**
 * Captures de la fiche de l'élève « J'écris sur le site » (ressources/sur-le-site/, 18 novembre 2026) :
 * npx playwright test --config playwright.local.config.ts fiche-eleve (serveur local 4840). Elles s'écrivent
 * directement dans ressources/sur-le-site/captures/ : une série de parcours efface test-results/.
 * Chaque capture est cadrée sur les éléments utiles, le bouton à cliquer entouré d'un repère sobre.
 * Ce n'est pas un test : rien n'y est vérifié. Aucune aide d'IA n'est demandée.
 */
const dossier = "../ressources/sur-le-site/captures";

/** Le repère autour du bouton à cliquer : un trait orangé, lisible aussi en photocopie */
const REPERE = "3px solid #e0761f";

/**
 * Capture la zone qui englobe `zone` (une ou plusieurs parties de l'écran), avec une marge,
 * après avoir entouré `boutons` d'un repère.
 */
async function capturer(page: Page, nom: string, zone: Locator[], boutons: Locator[] = [], marge = 14, dedans = false): Promise<void> {
  // La pastille des outils de développement de Next.js n'a rien à faire sur une fiche d'élève
  await page.addStyleTag({ content: "nextjs-portal { display: none !important; }" });
  for (const b of boutons) {
    await b.evaluate((el, [repere, decalage]) => {
      const e = el as HTMLElement;
      e.style.outline = repere;
      e.style.outlineOffset = decalage;
    }, [REPERE, dedans ? "-3px" : "3px"]);
  }
  await page.waitForTimeout(500);
  const boites = await Promise.all(zone.map(async (z) => (await z.boundingBox())!));
  const x = Math.max(0, Math.min(...boites.map((b) => b.x)) - marge);
  const y = Math.max(0, Math.min(...boites.map((b) => b.y)) - marge);
  const droite = Math.max(...boites.map((b) => b.x + b.width)) + marge;
  const bas = Math.max(...boites.map((b) => b.y + b.height)) + marge;
  await page.screenshot({ path: `${dossier}/${nom}.png`, clip: { x, y, width: droite - x, height: bas - y } });
  for (const b of boutons) await b.evaluate((el) => ((el as HTMLElement).style.outline = ""));
}

test.afterEach(async () => {
  await supprimerComptes();
});

test("fiche de l'élève : le parcours sur le site", async ({ page, browser }) => {
  test.setTimeout(900_000);
  const s = await classeQuiEcrit(page);
  const [sentier, pont] = s.lisiere.scenes;
  const [autel] = s.sanctuaire.scenes;

  // Le sentier, déjà écrit et validé : il sert à la lecture d'essai
  await s.base.from("scenes").update({ titre: "Le chant dans les fougères" }).eq("id", sentier);
  await s.base.from("scenes").update({ titre: "Le pont de brume" }).eq("id", pont);
  await semerBlocs(s.base, sentier, [
    recit("Un chant montait des fougères, si doux que Lou s’arrêta pour l’écouter. Au bout du sentier, un vieux pont disparaissait dans la brume."),
    choixAuto("Traverser le pont", pont),
    choixAuto("Entrer au sanctuaire", autel),
  ]);
  await sql("update scenes set etat = 'valide', prise_par_eleve = $1 where id = $2", [s.eleves.Alice.id, sentier]);
  await s.base.from("projets").update({ depart_scene_id: sentier }).eq("id", s.projet);

  // Le pont : la scène qu’Alice écrit (profil ordinaire, sans les outils d’organisation), avec sa consigne et sa liste
  await s.base
    .from("scenes")
    .update({
      prise_par_eleve: s.eleves.Alice.id,
      consigne: "Lou traverse le pont dans la brume et entend quelqu’un l’appeler.",
      verification: ["Décrire le pont et la brume.", "Écrire ce que Lou entend.", "Montrer ce que Lou ressent."],
    })
    .eq("id", pont);

  const poste = await autrePoste(browser);
  const p = poste.page;
  await p.setViewportSize({ width: 1180, height: 760 });

  // 1. Entrer dans la classe : un identifiant lisible le temps de la capture, puis les vrais pour entrer
  await aller(p, "/classe");
  const identifiant = p.getByLabel("Identifiant de la classe");
  const motDePasse = p.getByLabel("Mot de passe de la classe");
  const entrer = p.getByRole("button", { name: "Entrer", exact: true });
  await identifiant.fill("cm1-cm2-laurent");
  await motDePasse.fill(s.classe.motDePasse);
  await capturer(p, "1-entrer", [p.getByText("Écris l’identifiant de la classe"), identifiant, motDePasse, entrer], [entrer]);
  await identifiant.fill(s.classe.identifiant);
  await entrer.click();

  // 2. Le prénom, puis le code
  const alice = p.getByRole("button", { name: "Alice", exact: true });
  await alice.click();
  const code = p.getByLabel("Chiffre 1");
  await code.waitFor();
  const carteCode = p.getByRole("region", { name: "Ton code secret" });
  await capturer(p, "2-prenom-et-code", [alice, carteCode], [alice, p.getByRole("group", { name: "Code à quatre chiffres" })]);
  await code.pressSequentially(s.codes.Alice);
  await p.waitForURL(/\/travail$/);

  // 3. Mon travail : la scène à écrire
  const mesScenes = p.getByRole("region", { name: "Les scènes dont tu t’occupes" });
  const ecrireBouton = mesScenes.getByRole("link", { name: /Écrire/ }).first();
  await capturer(p, "3-mon-travail", [mesScenes], [ecrireBouton], 8);

  // 4. Écrire, cocher « J'ai pensé à »
  await aller(p, `/travail/scene/${pont}`);
  await ecrire(p, "Lou posa le pied sur le vieux pont. Les planches craquaient, et la brume était si épaisse qu’il ne voyait plus l’autre rive. Soudain, une voix l’appela par son nom.");
  for (const element of ["Décrire le pont et la brume.", "Écrire ce que Lou entend."]) await p.getByRole("checkbox", { name: element }).check();
  await p.waitForTimeout(2_600);
  const texte = p.locator(".copie__texte").first();
  const consigne = p.getByRole("region", { name: "La consigne" });
  await capturer(p, "4-ecrire", [p.getByText("Ton texte", { exact: true }), texte, consigne, p.locator(".copie__pied")], [consigne], 14, true);

  // 5. Remettre, la liste cochée en entier, puis « Modifier encore mon texte »
  await p.getByRole("checkbox", { name: "Montrer ce que Lou ressent." }).check();
  const remettre = p.getByRole("button", { name: "Remettre à Mme Laurent" });
  await capturer(p, "5-remettre", [p.locator(".copie__pied")], [remettre], 6);
  await remettre.click();
  await p.getByRole("status").filter({ hasText: "C’est remis !" }).waitFor();
  const modifier = p.getByRole("button", { name: /Modifier encore mon texte/ });
  await capturer(p, "5-modifier-encore", [p.locator(".copie__pied")], [modifier], 6);

  // 6. Reprendre après une remarque
  const [vu] = await sql<{ version: number; tour: number }>("select version, tour from scenes where id = $1", [pont]);
  await s.base.rpc("changer_etat", { p_scene: pont, p_etat: "reprendre", p_version: vu.version, p_tour: vu.tour, p_remarque: "Dis ce que ressent Lou quand la voix l’appelle." });
  await p.reload();
  const jaiLu = p.getByRole("button", { name: "J’ai lu, j’écris" });
  const carteRemarque = p.getByRole("region", { name: /te demande de reprendre ton texte/ });
  await capturer(p, "6-remarque", [carteRemarque], [jaiLu], 8);
  await jaiLu.click();
  // Pour la lecture d'essai, la scène reçoit un choix : sans lui, le passage afficherait « ni choix ni fin »
  await semerBlocs(s.base, pont, [
    recit("Lou posa le pied sur le vieux pont. Les planches craquaient, et la brume était si épaisse qu’il ne voyait plus l’autre rive. Soudain, une voix l’appela par son nom. Son cœur se mit à battre très fort."),
    choixAuto("Suivre la voix", autel),
  ]);

  // 7. Tester son chapitre : l'onglet Lire, la lecture d'essai, revenir en arrière
  const lire = p.getByRole("link", { name: "Lire", exact: true });
  await lire.click();
  const lireALEssai = p.getByRole("link", { name: "Lire à l’essai" }).first();
  await lireALEssai.click();
  await p.waitForURL(/\/travail\/lecture\//);
  const commencer = p.getByRole("link", { name: /^Commencer au début de/ }).first();
  await commencer.waitFor();
  await capturer(p, "7-commencer", [p.getByRole("link", { name: "Lire", exact: true }), p.getByText("lis l’histoire comme un lecteur"), commencer], [p.getByRole("link", { name: "Lire", exact: true }), commencer], 20);
  await commencer.click();
  await p.waitForURL(/depart=/);
  await p.getByRole("button", { name: /Traverser le pont/ }).click();
  const precedent = p.getByRole("button", { name: "Revenir au passage précédent" }).last();
  await precedent.waitFor();
  const parcours = p.getByRole("button", { name: /^Parcours ·/ });
  await capturer(p, "7-revenir", [p.locator("article").first(), precedent, parcours], [precedent, parcours], 10);

  // 8. Laisser la place : « Changer d'élève »
  const changer = p.getByRole("button", { name: "Changer d’élève" });
  await capturer(p, "8-changer-d-eleve", [p.locator("header").first()], [changer], 0);
  await poste.contexte.close();
});
