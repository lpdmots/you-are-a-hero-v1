import { test, type Browser, type Page } from "@playwright/test";
import { adultePret, aller, choixAuto, classeQuiEcrit, posteDe, recit, semerBlocs, semerClasse, semerPartie, semerProjet, sql, supprimerComptes } from "../parcours/outils";
import { poserLeMarais } from "../../scripts/marais-des-feux-follets";
import { ELEVES } from "../../scripts/passeurs-de-brume";

/**
 * Captures des « Choix en onglets » (F03.1, 11 novembre 2026, F03-AC62 à AC69) : la carte et ses
 * onglets sur « Le marais des feux follets », trente-deux scènes — au repos, survolée, cliquée, un
 * retour en arrière tracé à la demande, « À regarder » sur un onglet, la vue de loin, le lien tiré
 * depuis un onglet « Sans destination », la proposition de l'IA, et ce que lit un élève. Contre le
 * serveur des captures, en IA simulée (aucun appel payé) :
 * AVEC_IA=1 npm run captures -- choix-en-onglets
 * ou contre le serveur local déjà lancé, sans la proposition de l'IA — elle ne se demande que si AVEC_IA=1
 * le dit, parce que ce serveur-là, s'il n'est pas en IA simulée, ferait un vrai appel :
 * npx playwright test --config playwright.local.config.ts choix-en-onglets
 * Elles s'écrivent dans test-results/captures/choix-en-onglets/. Ce n'est pas un test : rien n'y est vérifié.
 */
const dossier = "test-results/captures/choix-en-onglets";
let n = 0;
const capturer = async (page: Page, nom: string) => {
  n += 1;
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${dossier}/${String(n).padStart(2, "0")}-${nom}.png` });
};
// Par son titre : celui d'une scène se lit aussi dans l'onglet d'un retour en arrière qui y ramène
const carte = (page: Page, titre: string) => page.locator(".carte-chemin", { has: page.locator(".carte-chemin__titre", { hasText: titre }) });
const onglet = (page: Page, phrase: string) => page.locator(".onglet-chemin", { hasText: phrase });
const bloc = (page: Page) => page.locator(".panneau-bloc");

// Des images deux fois plus fines : les phrases des onglets se jugent à leur taille réelle
test.use({ deviceScaleFactor: 2 });

test.afterEach(async () => {
  await supprimerComptes();
});

/** Le marais dans un projet de classe, quelques scènes avancées dans leur état : les tampons se voient tous. */
async function semerLeMarais(page: Page) {
  const { compte, base } = await adultePret(page);
  await base.from("enseignants").update({ nom_affiche: "Mme Laurent" }).eq("id", compte.id);
  const classe = await semerClasse(base, "CM1-CM2 d’essai", [...ELEVES]);
  const projet = await semerProjet(base, compte, "classe", "choix", "Les passeurs de brume", classe.id);
  const { partieId, chapitres } = await semerPartie(base, projet, "La forêt engloutie", [
    { titre: "La lisière", scenes: ["Le gué"] },
    { titre: "Le moulin noyé", scenes: ["La roue du moulin"] },
    { titre: "Le sanctuaire", scenes: ["La grille du sanctuaire"] },
  ]);
  const [lisiere, moulin, sanctuaire] = chapitres;
  const eleves = new Map(Object.entries(classe.eleves).map(([prenom, e]) => [prenom, e.id]));
  const marais = await poserLeMarais(sql, {
    projetId: projet, partieId, enseignantId: compte.id, ailleurs: { moulin: moulin.scenes[0], sanctuaire: sanctuaire.scenes[0] }, entreeDepuis: lisiere.scenes[0], eleves,
  });
  const etat = (titre: string, e: string) => sql("update public.scenes set etat = $1 where chapitre_id = $2 and titre = $3", [e, marais.chapitreId, titre]);
  await etat("Marais — la barque s’enlise", "prete");
  await etat("Roseaux — les feux follets dansent", "valide");
  await etat("Digue — les planches pourries", "valide");
  await etat("Ponton — la voix du héron", "valider");
  await etat("Roseaux — le feu follet dans le bocal", "reprendre");
  return { projet, chapitre: `/projet/${projet}/chapitre/${marais.chapitreId}` };
}

test("Choix en onglets, l'adulte : le marais au repos, survolé, cliqué, à regarder, de loin, relié", async ({ page }) => {
  test.setTimeout(240_000);
  await page.setViewportSize({ width: 1366, height: 768 });
  const { chapitre } = await semerLeMarais(page);

  // ——— Le plan : chaque carte porte ses onglets, dans l'ordre du texte ; plus rien n'est écrit sur un trait ———
  await aller(page, chapitre);
  await carte(page, "Ponton — la voix du héron").waitFor();
  await capturer(page, "plan");
  await carte(page, "Ponton — le marché du héron").hover();
  await capturer(page, "plan-carte-survolee");
  // On descend en tirant le fond : la molette change la taille (F03-AC58, révisé le 11 novembre 2026)
  const monter = async (dy: number) => {
    // Un point du bas du cadre où il n'y a que le fond : tirer une carte ne déplace rien
    const point = await page.evaluate(() => {
      const r = document.querySelector(".chemins__cadre")!.getBoundingClientRect();
      for (let y = r.bottom - 12; y > r.bottom - 200; y -= 20)
        for (let x = r.left + 12; x < r.right - 300; x += 20)
          if (document.elementFromPoint(x, y)?.classList.contains("react-flow__pane")) return { x, y };
      return null;
    });
    if (!point) throw new Error("Aucun fond libre à tirer");
    await page.mouse.move(point.x, point.y);
    await page.mouse.down();
    await page.mouse.move(point.x, point.y - dy, { steps: 10 });
    await page.mouse.up();
  };
  await monter(520);
  await capturer(page, "plan-plus-bas");
  await monter(620);
  await capturer(page, "plan-encore-plus-bas");
  // Survolée, la carte grandit tout entière pour donner la note coupée en entier (F03-AC63, retouché le 11 novembre 2026)
  await carte(page, "Cabane — le coffre de la passeuse").hover();
  await capturer(page, "plan-carte-depliee");

  // ——— « À regarder » : le parcours choisit la carte et encadre l'onglet ———
  await page.getByRole("button", { name: "Suivant" }).click();
  await capturer(page, "a-regarder-sans-destination");
  await page.getByRole("button", { name: "Suivant" }).click();
  await capturer(page, "a-regarder-scene-supprimee");
  await page.getByRole("button", { name: "Suivant" }).click();
  await capturer(page, "a-regarder-rien-n-y-mene");
  await page.keyboard.press("Escape");

  // ——— Un retour en arrière : écrit dans l'onglet, sa ligne tracée pour la carte cliquée ———
  await page.getByRole("button", { name: "Tout voir" }).click();
  await capturer(page, "de-loin");
  await carte(page, "Cercle de pierres — l’énigme des pierres").click();
  await page.getByRole("button", { name: "Taille lisible" }).click();
  await capturer(page, "retour-et-lien-cache");
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Tout voir" }).click();
  await carte(page, "Île — le cercle de pierres").click();
  await page.getByRole("button", { name: "Taille lisible" }).click();
  await capturer(page, "travail-trois-onglets-dont-un-ambre");

  // ——— Relier en tirant l'onglet « Sans destination » jusqu'à une scène ———
  const depart = (await onglet(page, "Écouter ce que disent les pierres").boundingBox())!;
  const arrivee = (await carte(page, "Cercle de pierres — le passage s’ouvre").boundingBox())!;
  await page.mouse.move(depart.x + depart.width / 2, depart.y + depart.height / 2);
  await page.mouse.down();
  await page.mouse.move(arrivee.x + arrivee.width / 2, arrivee.y + 30, { steps: 12 });
  await capturer(page, "onglet-tire");
  await page.mouse.up();
  await page.waitForTimeout(1200);
  await capturer(page, "onglet-relie");
  await page.keyboard.press("Escape");

  // ——— En 1440 × 900, la colonne ouverte ———
  await page.setViewportSize({ width: 1440, height: 900 });
  await aller(page, chapitre);
  await carte(page, "Ponton — la voix du héron").waitFor();
  await capturer(page, "1440-plan");
});

test("Choix en onglets, la proposition de l'IA : ses onglets en pointillé", async ({ page }) => {
  test.skip(process.env.AVEC_IA !== "1", "La proposition de l'IA ne se demande qu'à un serveur en IA simulée : AVEC_IA=1 le dit.");
  test.setTimeout(200_000);
  await page.setViewportSize({ width: 1366, height: 768 });
  const { chapitre } = await semerLeMarais(page);
  await aller(page, chapitre);
  await carte(page, "Ponton — la voix du héron").waitFor();
  await carte(page, "Ponton — la voix du héron").click();
  await page.locator(".panneau-chemin").getByRole("button", { name: "Construire avec l’IA" }).click();
  await bloc(page).getByRole("textbox").first().fill("Le héron propose trois épreuves");
  await bloc(page).getByRole("button", { name: "Proposer" }).click();
  await page.locator(".carte-chemin--proposee").first().waitFor();
  await page.waitForTimeout(900);
  await capturer(page, "bloc-proposition");
});

test("Choix en onglets, l'élève : les mêmes onglets, « Toi » sur sa scène, sans rien à tirer", async ({ page, browser }: { page: Page; browser: Browser }) => {
  test.setTimeout(200_000);
  const s = await classeQuiEcrit(page);
  const [sentier, pont] = s.lisiere.scenes;
  await semerBlocs(s.base, sentier, [recit("Le sentier s’enfonce sous les arbres."), choixAuto("Traverser le pont de cordes", pont), choixAuto("Rebrousser chemin", null)]);
  await semerBlocs(s.base, pont, [recit("Le pont grince."), choixAuto("Revenir au sentier", sentier)]);
  await s.base.from("scenes").update({ prise_par_eleve: s.eleves.Alice.id }).eq("id", sentier);
  await s.base.from("scenes").update({ prise_par_eleve: s.eleves.Bilal.id }).eq("id", pont);
  const poste = await posteDe(browser, s, "Alice");
  await poste.page.setViewportSize({ width: 1366, height: 768 });
  await aller(poste.page, `/travail/chapitre/${s.lisiere.id}`);
  await carte(poste.page, "Le sentier").waitFor();
  await capturer(poste.page, "eleve-chemins");
  await carte(poste.page, "Le pont").click();
  await capturer(poste.page, "eleve-scene-cliquee");
  await poste.contexte.close();
});
