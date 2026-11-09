import { test, type Page } from "@playwright/test";
import { adultePret, aller, semerClasse, semerPartie, semerProjet, supprimerComptes } from "../parcours/outils";
import { ELEVES, FORMULES, OBJETS, PARTIES, PISTES, PREPARATION } from "../../scripts/passeurs-de-brume";

/**
 * Captures de la révision d'ergonomie de la Préparation (novembre 2026) :
 * npm run captures -- revision-preparation
 * Elles s'écrivent dans test-results/captures/preparation/. Ce n'est pas un test : rien n'y est vérifié.
 */
const dossier = "test-results/captures/preparation";
let n = 0;
const capturer = async (page: Page, nom: string, toute = false) => {
  n += 1;
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${dossier}/${String(n).padStart(2, "0")}-${nom}.png`, fullPage: toute });
};

test.afterEach(async () => {
  await supprimerComptes();
});

test("Préparation : « Les passeurs de brume », de l'aide au jeu, en 1366 et 390 px", async ({ page, request }) => {
  test.setTimeout(400_000);
  const { compte, base } = await adultePret(page);
  const classe = await semerClasse(base, "CM1-CM2 d’essai", [...ELEVES]);
  const projet = await semerProjet(base, compte, "classe", "choix", "Les passeurs de brume", classe.id);
  await base.from("preparations").update({
    univers: PREPARATION.univers, enjeu: PREPARATION.enjeu, rubrique_jeu: true, regles: PREPARATION.regles,
    formule_renvoi: PREPARATION.formuleRenvoi, constructions: [...PREPARATION.constructions],
  }).eq("projet_id", projet);
  for (const [rubrique, texte, etat] of PISTES) {
    await base.from("pistes").insert({ projet_id: projet, enseignant_id: compte.id, rubrique, texte, etat, origine: "main" });
  }
  await base.from("questions").insert([
    { projet_id: projet, enseignant_id: compte.id, etape: "univers", texte: "Qu’est-ce qui rend la brume dangereuse ?", origine: "ia" },
  ]);
  await base.from("personnages").insert([
    { projet_id: projet, enseignant_id: compte.id, nom: "Lou", heros: true, rang: 0, description: "Lou, 10 ans, fils du dernier passeur du village. Il connaît le chant des lanternes mais a peur de l’eau." },
    { projet_id: projet, enseignant_id: compte.id, nom: "Marius", heros: false, rang: 1, description: "Le père de Lou, parti chercher la première lanterne." },
    { projet_id: projet, enseignant_id: compte.id, nom: "la chouette messagère", heros: false, rang: 2, description: "Aux plumes argentées, elle montre le chemin sans parler." },
  ]);
  for (const [nom, description] of OBJETS) await base.from("objets").insert({ projet_id: projet, enseignant_id: compte.id, nom, description });
  for (const texte of FORMULES) await base.from("formules").insert({ projet_id: projet, enseignant_id: compte.id, texte });
  const visuels = ["mer", "foret", "montagne", "cite", "desert"];
  for (const [i, partie] of PARTIES.entries()) {
    await semerPartie(base, projet, partie.titre, partie.chapitres.map((c) => ({ titre: c.titre })), visuels[i % visuels.length]);
  }
  const adresse = (etape: string) => `/projet/${projet}/preparation?etape=${etape}`;

  await page.setViewportSize({ width: 1366, height: 768 });

  // L'écran d'aide, à la première ouverture
  await base.from("enseignants").update({ aides_masquees: [] }).eq("id", compte.id);
  await aller(page, `/projet/${projet}/preparation`);
  await page.getByRole("button", { name: "Commencer" }).waitFor();
  await capturer(page, "aide");
  await page.getByRole("button", { name: "Commencer" }).click();
  await page.waitForTimeout(300);
  await capturer(page, "ouverture");

  // Les quatre étapes de l'histoire, remplies
  for (const etape of ["univers", "personnages", "enjeu", "etapes"]) {
    await aller(page, adresse(etape));
    await capturer(page, etape);
    await capturer(page, `${etape}-toute`, true);
  }
  await aller(page, adresse("personnages"));
  await page.getByRole("link", { name: /Autres personnages/ }).click();
  await page.waitForTimeout(500);
  await capturer(page, "autres-personnages", true);

  // Les deux étapes facultatives
  await aller(page, adresse("choix"));
  await capturer(page, "choix");
  await capturer(page, "choix-toute", true);
  await aller(page, adresse("jeu"));
  await capturer(page, "jeu");
  await capturer(page, "jeu-toute", true);

  // Ce qui s'ouvre : exemple, idées écartées, ajout d'une question, orientation, IA, menu d'une partie
  await aller(page, adresse("univers"));
  await page.getByText("Voir un exemple").click();
  await page.getByText(/Idées écartées/).click();
  await capturer(page, "univers-ouvert", true);
  await page.getByRole("button", { name: "Ajouter une question" }).click();
  await capturer(page, "ajouter-question");
  await page.keyboard.press("Escape");
  await aller(page, adresse("enjeu"));
  await page.getByRole("button", { name: "Demander une idée à l’IA" }).click();
  await page.getByRole("button", { name: "Proposer une idée" }).waitFor();
  await capturer(page, "orienter");
  await page.getByRole("button", { name: "Proposer une idée" }).click();
  await page.waitForTimeout(1500);
  await capturer(page, "idee-ia");
  await page.getByRole("button", { name: "Rédiger d’après les idées" }).click();
  await page.getByText("Texte proposé · modifiable").waitFor();
  await capturer(page, "rediger", true);
  await aller(page, adresse("etapes"));
  await page.locator('summary[aria-label^="Autres commandes de la partie"]').first().click({ timeout: 5000 }).catch(() => undefined);
  await capturer(page, "menu-partie");

  // L'IA en panne
  try {
    await request.post("/ia/simulation", { data: { mode: "echec" } });
    await aller(page, adresse("univers"));
    await page.getByRole("button", { name: "Demander une idée à l’IA" }).click();
    await page.getByRole("button", { name: "Proposer une idée" }).click();
    await page.locator(".message, [role=alert]").first().waitFor({ timeout: 8000 }).catch(() => undefined);
    await capturer(page, "ia-en-panne");
  } finally {
    await request.post("/ia/simulation", { data: { mode: null } });
  }

  // Projeter
  await aller(page, adresse("univers"));
  await page.getByRole("link", { name: "Projeter" }).click();
  await page.getByRole("link", { name: "Quitter la projection" }).first().waitFor();
  await capturer(page, "projetee");

  // Aides éteintes
  await base.from("enseignants").update({ reglages_ia: { proposer: false } }).eq("id", compte.id);
  await aller(page, adresse("univers"));
  await capturer(page, "sans-ia");
  await base.from("enseignants").update({ reglages_ia: {} }).eq("id", compte.id);

  // Un projet neuf : tout est vide
  const neuf = await semerProjet(base, compte, "classe", "choix", "Le grenier aux secrets", classe.id);
  await aller(page, `/projet/${neuf}/preparation`);
  await capturer(page, "vide-univers");
  await aller(page, `/projet/${neuf}/preparation?etape=etapes`);
  await capturer(page, "vide-etapes");
  await aller(page, `/projet/${neuf}/preparation?etape=jeu`);
  await capturer(page, "vide-jeu", true);

  // Projet personnel, récit classique
  const seul = await semerProjet(base, compte, "personnel", "classique", "Carnet de voyage");
  await aller(page, `/projet/${seul}/preparation`);
  await capturer(page, "personnel");

  // Sur téléphone
  await page.setViewportSize({ width: 390, height: 844 });
  for (const etape of ["univers", "personnages", "etapes", "jeu"]) {
    await aller(page, adresse(etape));
    await capturer(page, `390-${etape}`);
    await capturer(page, `390-${etape}-toute`, true);
  }
  await page.getByRole("button", { name: "Menu" }).click({ timeout: 5000 }).catch(() => undefined);
  await capturer(page, "390-menu");
});
