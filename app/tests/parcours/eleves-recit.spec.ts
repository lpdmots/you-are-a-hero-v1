import { resolve } from "node:path";
import { expect, test, type Browser, type Page } from "@playwright/test";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  aller, autrePoste, baseDe, connecter, creerClasse, creerCompte, elevesDe, inscrire, lireCodes, masquerAides, MESSAGE, nommer, ouvrirLaClasse,
  scenesDuChapitre, semerAttribution, semerPartie, semerProjet, supprimerComptes, taperCode, tirer, type ClasseCreee, type Compte,
} from "./outils";

test.afterEach(async () => {
  await supprimerComptes();
});

type Situation = {
  compte: Compte; base: SupabaseClient; classe: ClasseCreee; codes: Record<string, string>;
  eleves: Record<string, { id: string; inscriptionId: string }>; projet: string;
  lisiere: { id: string; scenes: string[] }; sanctuaire: { id: string; scenes: string[] };
};

/** Mme Laurent, sa classe, « Les passeurs de brume » : Alice et Bilal dans « La lisière », Chloé dans « Le sanctuaire ». */
async function classeAuTravail(page: Page): Promise<Situation> {
  const compte = await creerCompte();
  const base = await baseDe(compte);
  await masquerAides(base, compte);
  await connecter(page, compte);
  await page.waitForURL(/\/projets$/);
  await nommer(page, compte, "Mme Laurent");
  const classe = await creerClasse(page, "CM1-CM2");
  await inscrire(page, classe.id, ["Alice", "Bilal", "Chloé", "Dylan"]);
  const codes = await lireCodes(page, classe.id);
  const eleves = await elevesDe(base, classe.id);
  const projet = await semerProjet(base, compte, "classe", "choix", "Les passeurs de brume", classe.id);
  const foret = await semerPartie(base, projet, "La forêt", [
    { titre: "La lisière", scenes: ["L’entrée du bois", "La souche creuse"] },
    { titre: "Le sanctuaire", scenes: ["L’autel de pierre"] },
  ]);
  const [lisiere, sanctuaire] = foret.chapitres;
  await semerAttribution(base, lisiere.id, [{ eleve: eleves.Alice.id }, { eleve: eleves.Bilal.id, profil: "organisation" }]);
  await semerAttribution(base, sanctuaire.id, [{ eleve: eleves.Chloé.id }]);
  return { compte, base, classe, codes, eleves, projet, lisiere, sanctuaire };
}

async function poste(browser: Browser, s: Situation, prenom: string) {
  const p = await autrePoste(browser);
  await ouvrirLaClasse(p.page, s.classe.identifiant, s.classe.motDePasse);
  await taperCode(p.page, prenom, s.codes[prenom]);
  await p.page.waitForURL(/\/travail$/);
  return p;
}

test("F03-AC15, F06-AC22 — l'élève voit toutes les cartes ; la sienne s'ouvre, une autre montre une fiche courte, sans rien de son contenu", async ({ page, browser }) => {
  const s = await classeAuTravail(page);
  await s.base.from("chapitres").update({ resume: "Le héros découvre l’autel." }).eq("id", s.sanctuaire.id);
  await s.base.from("scenes").update({ consigne: "Décris l’autel." }).eq("id", s.sanctuaire.scenes[0]);
  const alice = await poste(browser, s, "Alice");

  await expect(alice.page.getByText("Ton chapitre : La lisière, dans La forêt.")).toBeVisible();
  await expect(alice.page.getByRole("heading", { level: 2, name: "Toute l’histoire" })).toBeVisible();
  await expect(alice.page.locator(".etiquette")).toHaveText(["La lisière", "Le sanctuaire"]);
  await expect(alice.page.locator(".cahier--mien")).toContainText("Ton chapitre");
  // Chaque carte porte son image, sans visuel de remplacement pour le chapitre qui n'est pas le sien
  await expect(alice.page.locator(".cahier__vignette img")).toHaveCount(2);

  await alice.page.getByRole("button", { name: "Le sanctuaire : ce chapitre n’est pas le tien" }).click();
  const fiche = alice.page.getByRole("alertdialog", { name: "Le sanctuaire" });
  await expect(fiche).toContainText("Ce chapitre n’est pas le tien.");
  await expect(fiche).not.toContainText(/autel|S003/);
  await fiche.getByRole("button", { name: "Fermer" }).click();
  // Même par son adresse, le chapitre ne s'ouvre pas
  const reponse = await alice.page.goto(`/travail/chapitre/${s.sanctuaire.id}`);
  expect(reponse?.status()).toBe(404);
  await expect(alice.page.getByText(/autel/)).toHaveCount(0);
  await alice.contexte.close();
});

test("F03-AC42, F06-AC20, F03-AC17 — dans son chapitre, l'élève lit toutes les scènes, sans commande ; une scène ajoutée par l'enseignant s'y retrouve", async ({ page, browser }) => {
  const s = await classeAuTravail(page);
  await s.base.from("scenes").update({ consigne: "Lou entre dans la forêt. Décris ce qu’il voit." }).eq("id", s.lisiere.scenes[0]);
  await s.base.from("chapitres").update({ resume: "Lou entre dans la forêt et découvre que les chemins bougent." }).eq("id", s.lisiere.id);
  const alice = await poste(browser, s, "Alice");
  await alice.page.getByRole("link", { name: "Ouvrir La lisière" }).click();
  await expect(alice.page.getByRole("heading", { level: 1, name: "La lisière" })).toBeVisible();
  expect(await scenesDuChapitre(alice.page)).toEqual(["S001", "S002"]);
  await expect(alice.page.getByRole("list", { name: "Élèves du chapitre" })).toContainText("Toi");
  await expect(alice.page.getByRole("list", { name: "Élèves du chapitre" })).toContainText("Bilal");
  // La consigne se lit, son absence n'empêche rien (F07-AC19) ; le résumé se consulte sans être imposé (F02-AC15, AC16)
  await expect(alice.page.locator(".fiche").first()).toContainText("Lou entre dans la forêt. Décris ce qu’il voit.");
  await expect(alice.page.getByText("Lou entre dans la forêt et découvre que les chemins bougent.")).toBeHidden();
  await alice.page.getByText("Ce qui se passe dans ce chapitre").click();
  await expect(alice.page.getByText("Lou entre dans la forêt et découvre que les chemins bougent.")).toBeVisible();
  // Profil par défaut : ni ajout, ni menu, ni carte à tirer (F06-AC11)
  await expect(alice.page.getByRole("button", { name: "Ajouter une scène" })).toHaveCount(0);
  await expect(alice.page.getByLabel(/Autres commandes/)).toHaveCount(0);
  await expect(alice.page.getByRole("button", { name: /^Déplacer/ })).toHaveCount(0);

  // L'enseignant ajoute une scène : l'élève la retrouve, sans avoir acquis le droit d'en créer
  await aller(page, `/projet/${s.projet}/chapitre/${s.lisiere.id}`);
  await page.getByRole("button", { name: "Ajouter une scène" }).click();
  await expect(MESSAGE(page)).toContainText("S004 est ajoutée");
  await alice.page.reload();
  expect(await scenesDuChapitre(alice.page)).toEqual(["S001", "S002", "S004"]);
  await expect(alice.page.getByRole("button", { name: "Ajouter une scène" })).toHaveCount(0);
  await alice.contexte.close();
});

test("F06-AC12, F06-AC86, F06-AC87, F06-AC89 — le profil « écriture et organisation » ajoute, titre, déplace, et supprime la scène qu'il a créée", async ({ page, browser }) => {
  const s = await classeAuTravail(page);
  const bilal = await poste(browser, s, "Bilal");
  await bilal.page.getByRole("link", { name: "Ouvrir La lisière" }).click();
  await bilal.page.getByRole("button", { name: "Ajouter une scène" }).click();
  await expect(MESSAGE(bilal.page)).toContainText("S004 est ajoutée à la fin du chapitre.");
  await expect.poll(() => scenesDuChapitre(bilal.page)).toEqual(["S001", "S002", "S004"]);

  await bilal.page.getByLabel("Autres commandes de la scène S004").click();
  await bilal.page.getByRole("button", { name: "Donner un titre" }).click();
  await bilal.page.getByLabel("Titre de la scène").fill("La souche qui parle");
  await bilal.page.getByRole("button", { name: "Enregistrer" }).click();
  await expect(bilal.page.locator(".fiche", { hasText: "S004" })).toContainText("La souche qui parle");

  const fiche = (ref: string) => bilal.page.locator(".fiches > li", { hasText: ref });
  await tirer(bilal.page, fiche("S004").locator(".fiche__ref"), fiche("S001").locator(".fiche__ref"));
  await expect(MESSAGE(bilal.page)).toContainText("S004 est placée avant S001.");
  await expect.poll(() => scenesDuChapitre(bilal.page)).toEqual(["S004", "S001", "S002"]);

  // La scène de l'enseignant n'a pas de « Supprimer » ; la sienne se supprime, après confirmation
  await bilal.page.getByLabel("Autres commandes de la scène S001").click();
  await expect(bilal.page.getByRole("button", { name: "Supprimer" })).toHaveCount(0);
  await bilal.page.keyboard.press("Escape");
  await bilal.page.getByLabel("Autres commandes de la scène S004").click();
  await bilal.page.getByRole("button", { name: "Supprimer" }).click();
  const dialogue = bilal.page.getByRole("alertdialog", { name: "Supprimer S004 ?" });
  await expect(dialogue).toContainText("Mme Laurent pourra la remettre.");
  await dialogue.getByRole("button", { name: "Supprimer la scène" }).click();
  await expect.poll(() => scenesDuChapitre(bilal.page)).toEqual(["S001", "S002"]);

  // L'enseignante la retrouve dans la corbeille du projet ; l'élève n'a aucune corbeille
  await expect(bilal.page.getByText(/Corbeille/)).toHaveCount(0);
  await aller(page, `/projet/${s.projet}/plan`);
  await page.getByRole("button", { name: /Corbeille du projet · 1 élément/ }).click();
  await expect(page.getByRole("complementary")).toContainText("S004 « La souche qui parle »");

  // Dans « Le sanctuaire », Bilal n'a rien : la carte ne s'ouvre pas pour lui
  await bilal.page.goto("/travail");
  await expect(bilal.page.getByRole("button", { name: "Le sanctuaire : ce chapitre n’est pas le tien" })).toBeVisible();
  await bilal.contexte.close();
});

test("F06-AC48, F06-AC49 — la lecture ouverte laisse lire les autres chapitres, sans consigne ni écriture ; refermée, plus rien", async ({ page, browser }) => {
  const s = await classeAuTravail(page);
  await s.base.from("scenes").update({ consigne: "Décris l’autel." }).eq("id", s.sanctuaire.scenes[0]);
  const bilal = await poste(browser, s, "Bilal");

  await aller(page, `/projet/${s.projet}/plan`);
  await page.getByLabel("Autres commandes du projet Les passeurs de brume").click();
  await page.getByRole("button", { name: "Réglages du projet" }).click();
  await page.getByText("Les élèves lisent toute l’histoire").click();
  await expect(page.getByText("Chaque élève lit les scènes de tous les chapitres. Il n’écrit que dans les siens.")).toBeVisible();

  await bilal.page.reload();
  await bilal.page.getByRole("link", { name: "Ouvrir Le sanctuaire" }).click();
  await expect(bilal.page.getByText("Ce chapitre n’est pas le tien : tu peux le lire, pas l’écrire.")).toBeVisible();
  expect(await scenesDuChapitre(bilal.page)).toEqual(["S003"]);
  await expect(bilal.page.locator(".fiche")).toContainText("L’autel de pierre");
  await expect(bilal.page.getByText("Décris l’autel.")).toHaveCount(0);
  // Même avec le profil d'organisation dans son propre chapitre, il n'organise rien ici
  await expect(bilal.page.getByRole("button", { name: "Ajouter une scène" })).toHaveCount(0);
  await expect(bilal.page.getByLabel(/Autres commandes/)).toHaveCount(0);

  await page.getByText("Les élèves lisent toute l’histoire").click();
  await expect(page.getByText(/pour garder la surprise du livre/)).toBeVisible();
  const reponse = await bilal.page.reload();
  expect(reponse?.status()).toBe(404);
  await bilal.contexte.close();
});

test("F06-AC18, F06-AC19, F01-AC09 — sans chapitre, l'élève n'ouvre aucune scène ; dès l'attribution, il y est, sans autre ouverture", async ({ page, browser }) => {
  const s = await classeAuTravail(page);
  const dylan = await poste(browser, s, "Dylan");
  await expect(dylan.page.getByText("Tu n’as pas encore de chapitre.")).toBeVisible();
  await expect(dylan.page.getByText("Mme Laurent va t’en donner un.")).toBeVisible();
  await expect(dylan.page.getByRole("link", { name: /^Ouvrir/ })).toHaveCount(0);
  expect((await dylan.page.goto(`/travail/chapitre/${s.lisiere.id}`))?.status()).toBe(404);

  await aller(page, `/projet/${s.projet}/plan`);
  await page.getByLabel("Autres commandes du chapitre Le sanctuaire").click();
  await page.getByRole("button", { name: "Attribuer des élèves" }).click();
  await page.getByRole("complementary").getByRole("checkbox", { name: "Dylan" }).check();
  await expect(page.getByRole("complementary").getByText("Enregistré")).toBeVisible();

  await dylan.page.goto("/travail");
  await expect(dylan.page.getByText("Ton chapitre : Le sanctuaire, dans La forêt.")).toBeVisible();
  await dylan.page.getByRole("link", { name: "Ouvrir Le sanctuaire" }).click();
  await expect.poll(() => scenesDuChapitre(dylan.page)).toEqual(["S003"]);
  await dylan.contexte.close();
});

test("F03-AC28 — un chapitre supprimé disparaît pour ses élèves, et revient avec la restauration", async ({ page, browser }) => {
  const s = await classeAuTravail(page);
  const chloe = await poste(browser, s, "Chloé");
  await expect(chloe.page.getByText("Ton chapitre : Le sanctuaire, dans La forêt.")).toBeVisible();

  await s.base.rpc("supprimer_element", { p_sorte: "chapitre", p_id: s.sanctuaire.id });
  await chloe.page.reload();
  await expect(chloe.page.getByText("Tu n’as pas encore de chapitre.")).toBeVisible();
  await expect(chloe.page.locator(".etiquette")).toHaveText(["La lisière"]);
  expect((await chloe.page.goto(`/travail/chapitre/${s.sanctuaire.id}`))?.status()).toBe(404);
  // L'enseignante la compte de nouveau parmi les élèves sans chapitre
  await aller(page, `/projet/${s.projet}/plan`);
  await expect(page.locator(".reste__manques")).toContainText("2 élèves sans chapitre");

  await s.base.rpc("restaurer_element", { p_sorte: "chapitre", p_id: s.sanctuaire.id });
  await chloe.page.goto("/travail");
  await expect(chloe.page.getByText("Ton chapitre : Le sanctuaire, dans La forêt.")).toBeVisible();
  await chloe.contexte.close();
});

test("F10-AC06 — l'élève voit l'image de repérage d'un chapitre qui n'est pas le sien, pas une autre image du projet", async ({ page, browser }) => {
  const s = await classeAuTravail(page);
  const importer = async (titre: string) => {
    await page.getByLabel(`Autres commandes du chapitre ${titre}`).click();
    await page.getByRole("button", { name: "Réglages" }).click();
    await page.getByRole("complementary").getByRole("button", { name: "Choisir une image" }).click();
    await page.getByLabel("Fichier de l’image").setInputFiles(resolve(__dirname, "../../public/illustrations/defaut-desert.jpg"));
    await expect(page.locator(".reg-image__vue img")).toHaveAttribute("src", /^\/images\//);
    const adresse = (await page.locator(".reg-image__vue img").getAttribute("src"))!;
    await page.getByRole("button", { name: "Fermer", exact: true }).last().click();
    return adresse;
  };
  await aller(page, `/projet/${s.projet}/plan`);
  const repere = await importer("Le sanctuaire");
  // Une seconde image, importée puis remplacée : elle reste une image du projet, sans être le repère de rien
  const autre = await importer("La lisière");
  await page.getByLabel("Autres commandes du chapitre La lisière").click();
  await page.getByRole("button", { name: "Réglages" }).click();
  await page.getByRole("complementary").getByRole("button", { name: "Choisir une image" }).click();
  await page.getByRole("button", { name: "Revenir au visuel par défaut" }).click();
  await expect(page.locator(".reg-image__vue img")).toHaveAttribute("src", /^\/illustrations\//);

  const alice = await poste(browser, s, "Alice");
  await expect(alice.page.locator("li", { hasText: "Le sanctuaire" }).locator("img")).toHaveAttribute("src", repere);
  expect((await alice.page.request.get(repere)).status()).toBe(200);
  expect((await alice.page.request.get(autre)).status()).toBe(404);
  await alice.contexte.close();
});
