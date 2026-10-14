import { expect, test, type Page } from "@playwright/test";
import { aller, choixAuto, classeQuiEcrit, liaison, posteDe, recit, semerAttribution, semerBlocs, semerPartie, supprimerComptes, type Situation } from "./outils";

/**
 * Étape 5 du plan, lot 4 : la lecture d'essai de l'élève (F09.1) — son entrée, son départ,
 * ce qu'il lit et ce qui lui reste fermé, la lecture ouverte, et ce que ses chemins lui disent.
 */

test.afterEach(async () => {
  await supprimerComptes();
});

/**
 * « Les passeurs de brume » : Alice et Bilal dans « La lisière » (« Le sentier », « Le pont »),
 * Chloé dans « Le sanctuaire » (« L'autel »), Bilal aussi dans « Le phare » (« La porte aux
 * symboles », « Le sommet »). Le sentier mène au pont, au sanctuaire, nulle part et au phare ;
 * le pont, exclu du livre, est une fin ; la porte n'a qu'une énigme, vers le sommet.
 */
async function recitDeClasse(page: Page) {
  const s = await classeQuiEcrit(page);
  const [sentier, pont] = s.lisiere.scenes;
  const [autel] = s.sanctuaire.scenes;
  const phare = await semerPartie(s.base, s.projet, "La tour", [{ titre: "Le phare", scenes: ["La porte aux symboles", "Le sommet"] }]);
  const [porte, sommet] = phare.chapitres[0].scenes;
  await semerAttribution(s.base, phare.chapitres[0].id, [{ eleve: s.eleves.Bilal.id }]);
  await semerBlocs(s.base, sentier, [recit("Un chant montait des fougères."), choixAuto("Traverser le pont", pont), choixAuto("Entrer au sanctuaire", autel), choixAuto("Suivre le héron", null), choixAuto("Monter au phare", porte)]);
  await semerBlocs(s.base, pont, [recit("Le pont craquait sous les pas de Lou.")]);
  await semerBlocs(s.base, autel, [recit("Le secret de l’autel.")]);
  await semerBlocs(s.base, porte, [recit("Trois symboles sur la porte."), liaison(sommet, "Déchiffrer")]);
  await semerBlocs(s.base, sommet, [recit("La lanterne s’allume.")]);
  await s.base.from("scenes").update({ fin: true }).in("id", [pont, sommet]);
  await s.base.from("scenes").update({ hors_livre: true }).eq("id", pont);
  await s.base.from("projets").update({ depart_scene_id: sentier }).eq("id", s.projet);
  return { s, sentier, pont, autel, porte, sommet, phare: phare.chapitres[0].id };
}

const page_ = (page: Page) => page.locator(".lu-page");
const choix = (page: Page, libelle: string) => page_(page).getByRole("button", { name: new RegExp(libelle) });
const departDe = (s: Situation) => `/travail/lecture/${s.projet}`;

test.describe("Lecture d'essai de l'élève (F09.1)", () => {
  test("F09-AC22, F09-AC01, F09-AC18 — « Lire à l'essai », près de « Mon travail » : le début de son chapitre, sans départ du livre ; un choix de son chapitre s'ouvre, une scène exclue se lit sans mention", async ({ page, browser }) => {
    const r = await recitDeClasse(page);
    const alice = await posteDe(browser, r.s, "Alice");
    await alice.page.getByRole("navigation", { name: "Espace élève" }).getByRole("link", { name: "Lire à l’essai" }).click();
    await alice.page.waitForURL(new RegExp(departDe(r.s)));
    await expect(alice.page.getByRole("link", { name: "Commencer au début de La lisière" })).toBeVisible();
    await expect(alice.page.getByRole("link", { name: /Commencer le livre/ })).toHaveCount(0);
    await alice.page.getByRole("link", { name: "Commencer au début de La lisière" }).click();
    await expect(page_(alice.page)).toContainText("Un chant montait des fougères.");
    await choix(alice.page, "Traverser le pont").click();
    await expect(page_(alice.page)).toContainText("Le pont craquait sous les pas de Lou.");
    await expect(alice.page.locator(".lecture")).not.toContainText("Hors du livre");
    await expect(alice.page.locator(".lecture")).not.toContainText(/S00\d/);
    await alice.contexte.close();
  });

  test("F09-AC02, F09-AC12, F09-AC23, F09-AC17 — vers un chapitre fermé : une suite à découvrir, sans rien de la destination, et le retour ; un choix sans destination : « pas encore de suite »", async ({ page, browser }) => {
    const r = await recitDeClasse(page);
    const alice = await posteDe(browser, r.s, "Alice");
    await aller(alice.page, `${departDe(r.s)}?depart=${r.sentier}`);
    const heron = page_(alice.page).locator("li").filter({ hasText: "Suivre le héron" });
    await expect(heron).toContainText("pas encore de suite");
    await expect(heron.getByRole("button")).toHaveCount(0);
    await choix(alice.page, "Entrer au sanctuaire").click();
    await expect(page_(alice.page)).toContainText("La suite se trouve dans un chapitre que tu découvriras plus tard.");
    await expect(alice.page.locator("body")).not.toContainText("Le secret de l’autel");
    await expect(alice.page.locator("body")).not.toContainText("L’autel");
    await expect(page_(alice.page)).not.toContainText(/^Fin$/);
    await alice.page.getByRole("button", { name: /Passage précédent|Revenir au passage précédent/ }).first().click();
    await expect(page_(alice.page)).toContainText("Un chant montait des fougères.");
    await alice.contexte.close();
  });

  test("F09-AC11, F09-AC19 — Bilal, dans deux chapitres de parties différentes, passe de l'un à l'autre ; l'énigme attend le bon numéro, qu'il ne lit pas", async ({ page, browser }) => {
    const r = await recitDeClasse(page);
    const bilal = await posteDe(browser, r.s, "Bilal");
    await aller(bilal.page, departDe(r.s));
    await expect(bilal.page.getByRole("link", { name: /^Commencer au début de / })).toHaveCount(2);
    await bilal.page.getByRole("link", { name: "Commencer au début de La lisière" }).click();
    await choix(bilal.page, "Monter au phare").click();
    await expect(page_(bilal.page)).toContainText("Trois symboles sur la porte.");
    const enigme = bilal.page.locator(".lu-enigme");
    await expect(enigme.locator(".lu-enigme__numero")).toHaveCount(0);
    await enigme.getByLabel("Numéro trouvé").fill("99");
    await enigme.getByRole("button", { name: "Y aller" }).click();
    await expect(enigme).toContainText("Ce n’est pas ce numéro.");
    await enigme.getByRole("button", { name: "Passer l’énigme" }).click();
    await expect(page_(bilal.page)).toContainText("La lanterne s’allume.");
    await bilal.contexte.close();
  });

  test("F06-AC48, F09-AC22 — la lecture ouverte : « Depuis le départ du livre » en premier, et le chapitre fermé se lit", async ({ page, browser }) => {
    const r = await recitDeClasse(page);
    await r.s.base.from("projets").update({ lecture_ouverte: true }).eq("id", r.s.projet);
    const alice = await posteDe(browser, r.s, "Alice");
    await aller(alice.page, departDe(r.s));
    const premier = alice.page.locator("main a").filter({ hasText: /Commencer/ }).first();
    await expect(premier).toContainText("Commencer le livre");
    await premier.click();
    await choix(alice.page, "Entrer au sanctuaire").click();
    await expect(page_(alice.page)).toContainText("Le secret de l’autel.");
    await alice.contexte.close();
  });

  test("F03-AC50 — ses chemins (révisé le 14 octobre 2026) : « Fin de l'histoire », « Départ du livre » quand la lecture est ouverte, « Sans suite » ; jamais « rien n'y mène »", async ({ page, browser }) => {
    const r = await recitDeClasse(page);
    // Une scène de plus, sans choix ni fin : sans suite ; une autre où rien ne mène
    const { data } = await r.s.base.rpc("creer_scene", { p_chapitre: r.s.lisiere.id });
    const impasse = (Array.isArray(data) ? data[0] : data) as { scene_id: string };
    await r.s.base.from("scenes").update({ titre: "La clairière" }).eq("id", impasse.scene_id);
    await semerBlocs(r.s.base, impasse.scene_id, [recit("Rien ici.")]);
    await r.s.base.from("projets").update({ lecture_ouverte: true }).eq("id", r.s.projet);
    const alice = await posteDe(browser, r.s, "Alice");
    await aller(alice.page, `/travail/chapitre/${r.s.lisiere.id}?vue=chemins`);
    await expect(alice.page.locator(".chemins")).toContainText("Départ du livre");
    await expect(alice.page.locator(".chemins")).toContainText("Fin de l’histoire");
    await expect(alice.page.locator(".chemins")).toContainText("Sans suite");
    await expect(alice.page.locator(".chemins")).not.toContainText("Rien n’y mène");
    await alice.contexte.close();
  });
});
