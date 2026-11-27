import { test, type Page } from "@playwright/test";
import { randomBytes } from "node:crypto";
import { aller, baseDe, collerEleves, connecter, creerClasse, creerCompte, inscrire, masquerAides, nommer, semerProjet, supprimerComptes } from "../parcours/outils";
import { ELEVES } from "../../scripts/passeurs-de-brume";

/**
 * Captures de la révision d'ergonomie de « Mes classes » et de la page d'une classe (novembre 2026),
 * contre le serveur local, sans recompiler :
 * npx playwright test --config playwright.local.config.ts revision-classes
 * Elles s'écrivent dans test-results/captures/classes/. Ce n'est pas un test : rien n'y est vérifié.
 * Aucun appel d'IA n'y part.
 */
const dossier = process.env.DOSSIER ?? "test-results/captures/classes";
let n = 0;
const capturer = async (page: Page, nom: string, toute = false) => {
  n += 1;
  await page.waitForTimeout(450);
  await page.screenshot({ path: `${dossier}/${String(n).padStart(2, "0")}-${nom}.png`, fullPage: toute });
};
const echap = async (page: Page) => {
  await page.keyboard.press("Escape");
  await page.waitForTimeout(250);
};
const bureau = (page: Page) => page.setViewportSize({ width: 1366, height: 768 });
const telephone = (page: Page) => page.setViewportSize({ width: 390, height: 844 });

test.afterEach(async () => {
  await supprimerComptes();
});

/** Vingt-trois élèves des « Passeurs de brume », quelques noms, et deux Lucas. */
const LISTE = [
  ...ELEVES.slice(0, 23).map((p, i) => (["Alice", "Bilal", "Chloé", "Hugo", "Malo"].includes(p) ? `${p}\t${["Martin", "Haddad", "Petit", "Roux", "Garnier"][i % 5]}` : p)),
  "Lucas\tBernard",
  "Lucas",
].join("\n");

test("Mes classes et la page d'une classe : vide, 25 élèves, inscription, impression, fin d'année, 390 px", async ({ page }) => {
  test.setTimeout(1_800_000);
  page.setDefaultTimeout(30_000);
  const compte = await creerCompte();
  const base = await baseDe(compte);
  await masquerAides(base, compte);
  await connecter(page, compte);
  await page.waitForURL(/\/projets$/);
  await nommer(page, compte, "Mme Laurent");
  const libre = `cm1cm2${randomBytes(2).toString("hex")}`;

  // ——— Rien encore : l'aide, puis « Pas encore de classe » ———
  await bureau(page);
  const { data: e } = await base.from("enseignants").select("aides_masquees").eq("id", compte.id).single();
  await base.from("enseignants").update({ aides_masquees: (e?.aides_masquees ?? []).filter((x: string) => x !== "classes") }).eq("id", compte.id);
  await aller(page, "/classes");
  await page.getByRole("button", { name: "Commencer" }).waitFor();
  await capturer(page, "aide");
  await page.getByRole("button", { name: "Commencer" }).click();
  await capturer(page, "vide");
  await telephone(page);
  await capturer(page, "390-vide");
  await bureau(page);

  // ——— Nouvelle classe ———
  await page.getByRole("button", { name: "Créer ma classe" }).click();
  await capturer(page, "nouvelle-classe");
  await page.getByRole("button", { name: "Créer la classe" }).click();
  await capturer(page, "nouvelle-classe-sans-nom");
  await page.getByLabel("Nom de la classe").fill("CM1-CM2");
  await capturer(page, "nouvelle-classe-remplie");
  await page.getByLabel("Identifiant", { exact: true }).fill(libre);
  await page.getByRole("button", { name: "Créer la classe" }).click();
  await page.waitForURL(/\/classes\/[0-9a-f-]{36}/);
  const classe1 = page.url().match(/\/classes\/([0-9a-f-]{36})/)![1];
  await capturer(page, "classe-creee");
  await telephone(page);
  await capturer(page, "390-classe-sans-eleve");
  await bureau(page);

  // ——— Inscrire : la feuille, une liste collée, une ligne sans prénom, vérifier ———
  await page.getByRole("link", { name: "Inscrire des élèves" }).first().click();
  await page.getByLabel("Prénom, ligne 1", { exact: true }).waitFor();
  await capturer(page, "inscrire-feuille");
  await collerEleves(page, LISTE);
  await page.waitForTimeout(300);
  await capturer(page, "inscrire-collee");
  await capturer(page, "inscrire-collee-toute", true);
  await page.getByLabel("Nom, ligne 26", { exact: true }).fill("Durand");
  await page.getByRole("button", { name: "Continuer" }).click();
  await capturer(page, "inscrire-ligne-sans-prenom");
  await page.getByRole("button", { name: "Effacer la ligne 26" }).click();
  await page.getByRole("button", { name: "Continuer" }).click();
  await page.getByRole("heading", { name: "Vérifiez la liste" }).waitFor();
  await capturer(page, "inscrire-verifier-point");
  await capturer(page, "inscrire-verifier-toute", true);
  await telephone(page);
  await capturer(page, "390-inscrire-verifier");
  await bureau(page);
  await page.getByLabel(/^Nom du nouveau Lucas/).fill("Morel");
  await page.getByLabel(/^Nom du nouveau Lucas/).blur();
  await capturer(page, "inscrire-verifier-regle");
  await page.getByRole("button", { name: /^Inscrire 25 élèves/ }).click();
  await page.waitForURL(new RegExp(`/classes/${classe1}\\?`));
  await page.getByRole("heading", { name: "Élèves" }).waitFor();

  // ——— La classe de vingt-cinq élèves ———
  await capturer(page, "classe-inscrits");
  await aller(page, `/classes/${classe1}`);
  await capturer(page, "classe");
  await capturer(page, "classe-toute", true);
  await page.getByRole("button", { name: "Afficher les codes" }).click();
  await page.getByRole("button", { name: "Masquer les codes" }).waitFor();
  await capturer(page, "codes");
  await page.getByRole("button", { name: "Masquer les codes" }).click();
  await page.getByRole("button", { name: "Afficher le mot de passe" }).click();
  await capturer(page, "mot-de-passe");
  await page.getByRole("button", { name: "Masquer le mot de passe" }).click();

  // La fiche d'un élève : le code oublié
  const eleves = page.getByRole("region", { name: "Élèves" });
  await eleves.getByRole("button", { name: /Bilal/ }).click();
  await page.waitForTimeout(600);
  await capturer(page, "eleve");
  await page.getByRole("button", { name: "Changer le code" }).click();
  await capturer(page, "eleve-code-propose");
  await page.locator("#code-neuf").fill("12");
  await page.getByRole("button", { name: "Enregistrer ce code" }).click();
  await capturer(page, "eleve-code-faux");
  await page.locator("#code-neuf").fill("4821");
  await page.getByRole("button", { name: "Enregistrer ce code" }).click();
  await page.waitForTimeout(500);
  await capturer(page, "eleve-code-change");
  await page.getByLabel("Nom", { exact: true }).fill("Haddad-Benali");
  await page.getByLabel("Nom", { exact: true }).blur();
  await page.waitForTimeout(600);
  await capturer(page, "eleve-nom-enregistre");
  await echap(page);
  // Un élève sans nom de famille : « Lucas »
  await eleves.getByRole("button", { name: /Lucas Morel/ }).click();
  await page.waitForTimeout(500);
  await page.getByLabel("Prénom", { exact: true }).fill("");
  await page.getByLabel("Prénom", { exact: true }).blur();
  await page.waitForTimeout(500);
  await capturer(page, "eleve-sans-prenom");
  await page.getByLabel("Prénom", { exact: true }).fill("Lucas");
  await page.getByLabel("Prénom", { exact: true }).blur();
  await page.waitForTimeout(400);
  await echap(page);

  // Retirer un élève, d'un geste, avec « Annuler »
  await eleves.getByRole("button", { name: /Zoé/ }).click();
  await page.waitForTimeout(400);
  await page.getByRole("button", { name: "Retirer de la classe" }).click();
  await page.waitForTimeout(700);
  await capturer(page, "eleve-retire");
  await page.getByRole("button", { name: "Annuler" }).click().catch(() => undefined);
  await page.waitForTimeout(700);

  // Horaires
  await aller(page, `/classes/${classe1}`);
  // « Limiter les horaires » ouvre le panneau l'interrupteur allumé
  await page.getByRole("button", { name: "Limiter les horaires" }).click();
  await page.waitForTimeout(900);
  await capturer(page, "horaires-limites");
  const de = page.getByLabel(/^De/).first();
  await de.fill("huit heures");
  await de.blur();
  await capturer(page, "horaires-erreur");
  await de.fill("8 h 30");
  await de.blur();
  await page.getByRole("button", { name: "Ajouter d’autres horaires" }).click();
  await page.waitForTimeout(600);
  await capturer(page, "horaires-deux-plages");
  await echap(page);
  await capturer(page, "classe-horaires-regles");

  // Changer le mot de passe ; renommer ; le menu
  await page.getByRole("button", { name: "Changer le mot de passe" }).click();
  await page.getByRole("alertdialog").waitFor();
  await capturer(page, "mot-de-passe-changer");
  await echap(page);
  await page.locator('summary[aria-label="Autres commandes de la classe"]').click();
  await capturer(page, "menu");
  await page.getByRole("button", { name: "Renommer la classe" }).click();
  await capturer(page, "renommer");
  await page.getByRole("alertdialog").getByLabel("Nom de la classe").fill("CM1-CM2 B");
  await capturer(page, "renommer-identifiant");
  await echap(page);

  // Imprimer : étiquettes, pour la maison, un élève, l'affiche, et ce qui sort de l'imprimante
  await page.getByRole("link", { name: "Imprimer les étiquettes" }).click();
  await page.waitForURL(/imprimer/);
  await capturer(page, "etiquettes");
  await capturer(page, "etiquettes-toute", true);
  await page.locator("label", { hasText: "Avec l’identifiant et le mot de passe" }).click();
  await capturer(page, "etiquettes-maison");
  await page.emulateMedia({ media: "print" });
  await capturer(page, "etiquettes-maison-impression", true);
  await page.emulateMedia({ media: "screen" });
  await page.locator("select").selectOption({ label: "Bilal Haddad-Benali" });
  await capturer(page, "etiquette-un-eleve");
  await page.getByRole("button", { name: "Affiche de la classe" }).click();
  await capturer(page, "affiche");
  await page.emulateMedia({ media: "print" });
  await capturer(page, "affiche-impression", true);
  await page.emulateMedia({ media: "screen" });

  // Deux projets dans la classe
  await semerProjet(base, compte, "classe", "choix", "Les passeurs de brume", classe1);
  await semerProjet(base, compte, "classe", "classique", "Le hérisson qui voulait voir la mer", classe1);
  await page.setViewportSize({ width: 1024, height: 768 });
  await aller(page, `/classes/${classe1}`);
  await capturer(page, "1024-classe");
  await bureau(page);

  // ——— Une nouvelle classe l'année suivante : l'identifiant pris, puis la proposition ———
  await aller(page, "/classes");
  await capturer(page, "liste-une-classe");
  await page.getByRole("button", { name: "Nouvelle classe" }).click();
  await page.getByLabel("Nom de la classe").fill("CM2");
  await page.getByLabel("Identifiant", { exact: true }).fill(libre);
  await page.getByRole("radio", { name: "2027-2028" }).check();
  await page.getByRole("button", { name: "Créer la classe" }).click();
  await page.waitForTimeout(800);
  await capturer(page, "nouvelle-classe-identifiant-pris");
  await page.getByLabel("Identifiant", { exact: true }).fill(`cm2${randomBytes(2).toString("hex")}`);
  await page.getByRole("button", { name: "Créer la classe" }).click();
  await page.waitForURL(/\/classes\/[0-9a-f-]{36}/);
  const classe2 = page.url().match(/\/classes\/([0-9a-f-]{36})/)![1];
  await capturer(page, "proposition-terminer");
  await page.getByRole("button", { name: "Terminer son année" }).click();
  await capturer(page, "terminer-dialogue");
  await page.getByRole("alertdialog").getByRole("button", { name: "Terminer l’année" }).click();
  await page.waitForTimeout(900);
  await capturer(page, "terminee-message");

  // Inscrire dans la nouvelle classe : élèves déjà connus, un homonyme
  await aller(page, `/classes/${classe2}/inscrire`);
  await page.getByRole("heading", { name: "Qui retrouvez-vous cette année ?" }).waitFor();
  await capturer(page, "inscrire-connus");
  for (const p of ["Bilal", "Chloé", "Dylan", "Emma", "Farah", "Gabin", "Hugo", "Inès", "Jade", "Kenza", "Léo", "Lina"]) {
    await page.getByRole("checkbox", { name: new RegExp(p) }).check();
  }
  await capturer(page, "inscrire-connus-coches");
  await page.getByRole("button", { name: "Continuer" }).click();
  await collerEleves(page, "Alice\tMartin\nNina\nUgo\tLefèvre");
  await capturer(page, "inscrire-nouveaux");
  await page.getByRole("button", { name: "Continuer" }).click();
  await page.getByRole("heading", { name: "Vérifiez la liste" }).waitFor();
  await capturer(page, "inscrire-verifier-meme");
  await page.getByRole("button", { name: /Oui, le même/ }).click();
  await capturer(page, "inscrire-verifier-connus");
  await page.getByRole("button", { name: /^Inscrire \d+ élèves/ }).click();
  await page.waitForURL(new RegExp(`/classes/${classe2}\\?`));

  // Une troisième classe, sans élève, et la liste
  await aller(page, "/classes");
  await page.getByRole("button", { name: "Nouvelle classe" }).click();
  await page.getByLabel("Nom de la classe").fill("Atelier d’écriture du mercredi");
  await page.getByLabel("Identifiant", { exact: true }).fill(`atelier${randomBytes(2).toString("hex")}`);
  await page.getByRole("radio", { name: "2027-2028" }).check();
  await page.getByRole("button", { name: "Créer la classe" }).click();
  await page.waitForURL(/\/classes\/[0-9a-f-]{36}/);
  await semerProjet(base, compte, "classe", "choix", "La forêt des énigmes", classe2);
  await aller(page, "/classes");
  await capturer(page, "liste");
  await capturer(page, "liste-toute", true);

  // ——— La classe passée, en lecture ———
  await aller(page, `/classes/${classe1}`);
  await capturer(page, "passee");
  await capturer(page, "passee-toute", true);
  await page.getByRole("button", { name: "Supprimer la classe" }).click();
  await capturer(page, "passee-supprimer");
  await echap(page);

  // ——— Sur téléphone ———
  await telephone(page);
  await aller(page, "/classes");
  await capturer(page, "390-liste");
  await capturer(page, "390-liste-toute", true);
  await aller(page, `/classes/${classe2}`);
  await capturer(page, "390-classe");
  await capturer(page, "390-classe-toute", true);
  await page.getByRole("region", { name: "Élèves" }).getByRole("button", { name: /Bilal/ }).click();
  await page.waitForTimeout(500);
  await capturer(page, "390-eleve");
  await echap(page);
  await aller(page, `/classes/${classe2}`);
  await page.getByRole("button", { name: "Limiter les horaires" }).click();
  await page.waitForTimeout(900);
  await capturer(page, "390-horaires");
  await echap(page);
  await aller(page, `/classes/${classe2}/inscrire`);
  await page.getByRole("button", { name: "Continuer" }).click();
  await capturer(page, "390-inscrire-feuille");
  await aller(page, `/classes/${classe2}/imprimer`);
  await capturer(page, "390-etiquettes");
  await aller(page, `/classes/${classe1}`);
  await capturer(page, "390-passee");
  await aller(page, "/classes");
  await page.getByRole("button", { name: "Nouvelle classe" }).click();
  await capturer(page, "390-nouvelle-classe");
});

test("classe passée en lecture : informations de connexion, codes, fiche d'un élève, étiquettes", async ({ page }) => {
  test.setTimeout(300_000);
  page.setDefaultTimeout(30_000);
  const compte = await creerCompte();
  const base = await baseDe(compte);
  await masquerAides(base, compte);
  await connecter(page, compte);
  await page.waitForURL(/\/projets$/);
  await bureau(page);
  const classe = await creerClasse(page, "CM1-CM2");
  await inscrire(page, classe.id, ["Alice Martin", "Bilal", "Chloé Petit", "Dylan", "Emma"]);
  await page.getByRole("button", { name: "Terminer l’année" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Terminer l’année" }).click();
  await page.getByText(/Année terminée le/).waitFor();
  await aller(page, `/classes/${classe.id}`);
  await capturer(page, "passee-lecture");
  await page.getByRole("button", { name: "Afficher les codes" }).click();
  await page.getByRole("button", { name: "Afficher le mot de passe" }).click();
  await capturer(page, "passee-codes");
  await page.getByRole("region", { name: "Élèves" }).getByRole("button", { name: /Bilal/ }).click();
  await page.waitForTimeout(600);
  await capturer(page, "passee-eleve");
  await echap(page);
  await page.getByRole("link", { name: "Imprimer les étiquettes" }).click();
  await page.waitForURL(/imprimer/);
  await capturer(page, "passee-etiquettes");
  await telephone(page);
  await aller(page, `/classes/${classe.id}`);
  await capturer(page, "390-passee-lecture");
});
