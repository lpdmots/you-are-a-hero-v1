import { test, type Page } from "@playwright/test";
import {
  aller, autrePoste, baseDe, connecter, creerClasse, creerCompte, elevesDe, inscrire, lireCodes, masquerAides, nommer, ouvrirLaClasse, semerAttribution,
  semerPartie, semerProjet, supprimerComptes, taperCode,
} from "../parcours/outils";

/**
 * Captures des écrans de l'étape 2 : npm run captures -- etape2
 * Elles s'écrivent dans test-results/captures/. Ce n'est pas un test : rien n'y est vérifié.
 */
const dossier = "test-results/captures";
let n = 100;
const capturer = async (page: Page, nom: string, toute = true) => {
  n += 1;
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${dossier}/${n}-${nom}.png`, fullPage: toute });
};

test.afterEach(async () => {
  await supprimerComptes();
});

test("écrans de l'étape 2 : le plan du récit", async ({ page }) => {
  test.setTimeout(300_000);
  const compte = await creerCompte();
  await connecter(page, compte);
  await page.waitForURL(/\/projets$/);
  await nommer(page, compte, "Mme Laurent");
  const classe = await creerClasse(page, "CM1-CM2");
  await inscrire(page, classe.id, ["Alice Martin", "Bilal Haddad", "Chloé Bernard", "Dylan Petit", "Emma Dubois", "Farah Benali"]);
  const base = await baseDe(compte);
  const projet = await semerProjet(base, compte, "classe", "choix", "Les passeurs de brume", classe.id);

  await aller(page, `/projet/${projet}/plan`);
  await capturer(page, "plan-aide");
  await page.getByRole("button", { name: "Commencer" }).click();
  await capturer(page, "plan-vide");
  await page.getByRole("button", { name: "Ajouter une partie" }).first().click();
  await page.getByRole("heading", { name: "Réglages de la partie" }).waitFor();
  await capturer(page, "partie-ajoutee-reglages");
  await page.getByLabel("Titre").fill("Le départ");
  await page.getByRole("button", { name: "Choisir une image" }).click();
  await page.getByRole("heading", { name: "Choisir une image" }).waitFor();
  await capturer(page, "choisir-une-image");
  await page.getByRole("button", { name: "Mer", exact: true }).click();
  await page.getByRole("heading", { name: "Réglages de la partie" }).waitFor();
  await page.getByRole("button", { name: "Fermer", exact: true }).last().click();

  await masquerAides(base, compte);
  const eleves = await elevesDe(base, classe.id);
  const foret = await semerPartie(base, projet, "La forêt", [
    { titre: "La lisière", scenes: ["L’entrée du bois", "Souche creuse — la lanterne de secours", "Souche — la chouette messagère", "Le sentier qui bouge", "", "La clairière"] },
    { titre: "Le sanctuaire", scenes: ["L’autel de pierre", "Le gardien"] },
    { titre: "Les racines" },
  ]);
  await semerPartie(base, projet, "La montagne", [{ titre: "Le col", scenes: ["La dernière lanterne"] }], "montagne");
  await semerAttribution(base, foret.chapitres[0].id, [{ eleve: eleves.Alice.id }, { eleve: eleves.Bilal.id, profil: "organisation" }, { eleve: eleves.Chloé.id }]);
  await semerAttribution(base, foret.chapitres[1].id, [{ eleve: eleves.Dylan.id }]);
  await base.from("scenes").update({ consigne: "Lou entre dans la forêt. Décris ce qu’il voit et ce qu’il entend." }).eq("id", foret.chapitres[0].scenes[0]);
  await base.from("scenes").update({ fin: true }).eq("id", foret.chapitres[0].scenes[5]);
  await base.from("projets").update({ depart_scene_id: foret.chapitres[0].scenes[0] }).eq("id", projet);

  await aller(page, `/projet/${projet}/plan`);
  await capturer(page, "plan");
  await page.getByLabel("Autres commandes du chapitre La lisière").click();
  await capturer(page, "plan-menu-chapitre", false);
  await page.getByRole("button", { name: "Attribuer des élèves" }).click();
  await capturer(page, "attribuer-des-eleves", false);
  await page.getByRole("button", { name: "Fermer", exact: true }).last().click();
  await page.getByLabel("Autres commandes du chapitre La lisière").click();
  await page.getByRole("button", { name: "Réglages" }).click();
  await capturer(page, "reglages-du-chapitre", false);
  await page.getByRole("button", { name: "Fermer", exact: true }).last().click();
  await page.getByPlaceholder("Rechercher une scène").fill("souche");
  await capturer(page, "plan-recherche");
  await page.getByPlaceholder("Rechercher une scène").fill("");
  await page.getByLabel("Autres commandes du chapitre Le sanctuaire").click();
  await page.getByRole("button", { name: "Supprimer" }).click();
  await capturer(page, "chapitre-supprime", false);
  await page.getByRole("button", { name: /Corbeille du projet/ }).click();
  await capturer(page, "corbeille", false);
  await page.getByRole("button", { name: "Fermer", exact: true }).last().click();

  await page.getByRole("link", { name: "Ouvrir La lisière" }).click();
  await page.waitForURL(/\/chapitre\//);
  await capturer(page, "chapitre");
  await page.getByLabel(/^Qui s’occupe de S003/).click();
  await capturer(page, "chapitre-qui-s-en-occupe", false);
  await page.getByRole("button", { name: "Bilal" }).click();
  await page.getByLabel("Autres commandes de la scène S002").click();
  await capturer(page, "chapitre-menu-scene", false);
  await page.getByRole("button", { name: "Départ du livre" }).click();
  await capturer(page, "changer-le-depart", false);
  await page.getByRole("alertdialog").getByRole("button", { name: "Annuler" }).click();
  await page.getByRole("link", { name: /Ouvrir S001/ }).click();
  await page.waitForURL(/\/scene\//);
  await capturer(page, "scene");

  await page.setViewportSize({ width: 390, height: 844 });
  await aller(page, `/projet/${projet}/plan`);
  await capturer(page, "plan-390");
  await aller(page, `/projet/${projet}/chapitre/${foret.chapitres[0].id}`);
  await capturer(page, "chapitre-390");
});

test("écrans de l'étape 2 : préparation, création, élève", async ({ page, browser }) => {
  test.setTimeout(300_000);
  const compte = await creerCompte();
  await connecter(page, compte);
  await page.waitForURL(/\/projets$/);
  await nommer(page, compte, "Mme Laurent");
  const classe = await creerClasse(page, "CM1-CM2");
  await inscrire(page, classe.id, ["Alice Martin", "Bilal Haddad", "Chloé Bernard"]);

  // Création d'un projet : la carte et le choix de l'image à la troisième question
  await aller(page, "/projets/nouveau");
  await page.getByRole("radio", { name: /^Ma classe/ }).check({ force: true });
  await page.getByRole("button", { name: "Continuer" }).click();
  await page.getByRole("radio", { name: /^À choix/ }).check({ force: true });
  await page.getByRole("button", { name: "Continuer" }).click();
  await page.getByLabel("Titre du projet").fill("Les passeurs de brume");
  await capturer(page, "nouveau-projet-carte");
  await page.getByRole("button", { name: "Créer le projet" }).click();
  await page.waitForURL(/\/projet\/[0-9a-f-]{36}\/preparation/);
  const projet = page.url().match(/\/projet\/([0-9a-f-]{36})/)![1];
  await capturer(page, "preparation-aide");
  await page.getByRole("button", { name: "Commencer" }).click();
  await capturer(page, "preparation-vide");

  const base = await baseDe(compte);
  await masquerAides(base, compte);
  await base.from("preparations").update({
    univers: "Un pays de lacs et de forêts noyé dans la brume. Des passeurs guident les voyageurs avec des lanternes.",
    personnages: "Lou, 10 ans, fils du dernier passeur. Il connaît le chant des lanternes mais a peur de l’eau.",
    rubrique_jeu: true,
    feuille: { on: true, des: 1, sections: [{ id: "s1", type: "compteurs", titre: "Compteurs", compteurs: [{ id: "c1", nom: "Volonté", depart: 5 }] }, { id: "s2", type: "liste", titre: "Inventaire", lignes: 6 }] },
  }).eq("projet_id", projet);
  const piste = (texte: string, etat: string) => ({ projet_id: projet, enseignant_id: compte.id, rubrique: "personnages", texte, etat });
  await base.from("pistes").insert([piste("Lou, fils du dernier passeur", "retenue"), piste("Un renard qui parle", "discuter"), piste("Des jumeaux inséparables", "ecartee")]);
  await base.from("objets").insert([{ projet_id: projet, enseignant_id: compte.id, nom: "la lanterne sourde", description: "Éclaire sans être vue." }]);
  await base.from("formules").insert([{ projet_id: projet, enseignant_id: compte.id, texte: "Retire un point de volonté à ton héros." }]);
  const foret = await semerPartie(base, projet, "La forêt", [{ titre: "La lisière", scenes: ["L’entrée du bois", "La souche creuse"] }, { titre: "Le sanctuaire", scenes: ["L’autel"] }]);
  await semerPartie(base, projet, "La montagne", [{ titre: "Le col" }], "montagne");
  await base.from("chapitres").update({ resume: "Lou entre dans la forêt et découvre que les chemins bougent." }).eq("id", foret.chapitres[0].id);
  await base.from("scenes").update({ consigne: "Lou entre dans la forêt. Décris ce qu’il voit et ce qu’il entend." }).eq("id", foret.chapitres[0].scenes[0]);
  const eleves = await elevesDe(base, classe.id);
  await semerAttribution(base, foret.chapitres[0].id, [{ eleve: eleves.Alice.id, profil: "organisation" }, { eleve: eleves.Bilal.id }]);

  await aller(page, `/projet/${projet}/preparation`);
  await capturer(page, "preparation");
  await page.getByText("Feuille d’aventure du lecteur").click();
  await capturer(page, "preparation-feuille");
  await page.setViewportSize({ width: 1366, height: 768 });
  await aller(page, `/atelier/${projet}/personnages`);
  await capturer(page, "atelier-personnages", false);
  await aller(page, `/atelier/${projet}/etapes`);
  await capturer(page, "atelier-etapes", false);
  await aller(page, "/projets");
  await capturer(page, "mes-projets");

  // L'élève
  const codes = await lireCodes(page, classe.id);
  const poste = await autrePoste(browser);
  await ouvrirLaClasse(poste.page, classe.identifiant, classe.motDePasse);
  await taperCode(poste.page, "Alice", codes.Alice);
  await poste.page.waitForURL(/\/travail$/);
  await capturer(poste.page, "eleve-mon-travail");
  await poste.page.getByRole("button", { name: /Le sanctuaire/ }).click();
  await capturer(poste.page, "eleve-chapitre-pas-le-sien", false);
  await poste.page.getByRole("button", { name: "Fermer" }).click();
  await poste.page.getByRole("link", { name: "Ouvrir La lisière" }).click();
  await poste.page.waitForURL(/\/travail\/chapitre\//);
  await capturer(poste.page, "eleve-chapitre");
  await poste.contexte.close();
});
