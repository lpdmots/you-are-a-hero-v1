import { test, type Page } from "@playwright/test";
import {
  aller, autrePoste, connecter, creerClasse, creerCompte, inscrire, lireCodes, nommer, ouvrirLaClasse, passerAide, sql, supprimerCompte, taperCode,
} from "../parcours/outils";

/**
 * Captures des écrans de l'étape 1, pour les comparer à la maquette :
 *   npm run captures
 * Elles s'écrivent dans test-results/captures/. Ce n'est pas un test : rien n'y est vérifié.
 */
const dossier = "test-results/captures";
let n = 0;
const capturer = async (page: Page, nom: string, toute = true) => {
  n += 1;
  await page.waitForTimeout(350);
  await page.screenshot({ path: `${dossier}/${String(n).padStart(2, "0")}-${nom}.png`, fullPage: toute });
};

const ELEVES = [
  "Adam Morel", "Alice Martin", "Bilal Haddad", "Chloé Bernard", "Dylan Petit", "Emma Dubois", "Farah Benali", "Gabin Roux", "Hugo Lambert",
  "Inès Garcia", "Jade Moreau", "Kenza Cherif", "Léo Fournier", "Lina Robin", "Maëlys Colin", "Malo Le Gall", "Nahel Diallo", "Noé", "Océane Girard",
  "Paul", "Rayan Mansouri", "Sacha", "Tom Leroy", "Yasmine Belkacem", "Zoé Henry",
];

test("écrans de l'étape 1", async ({ page, browser }) => {
  test.setTimeout(300_000);
  const compte = await creerCompte();
  await aller(page, "/entree");
  await capturer(page, "entree-enseignant");
  await connecter(page, compte);
  await page.waitForURL(/\/projets$/);
  await capturer(page, "mes-projets-aucun");
  await nommer(page, compte, "Mme Laurent");

  await aller(page, "/classes");
  await capturer(page, "mes-classes-aide");
  await passerAide(page);
  await capturer(page, "mes-classes-aucune");
  await page.getByRole("button", { name: "Créer ma classe" }).click();
  await page.getByLabel("Nom de la classe").fill("CM1-CM2");
  await capturer(page, "classe-nouvelle");
  await page.keyboard.press("Escape");
  const classe = await creerClasse(page, "CM1-CM2");
  await capturer(page, "classe-premiere-sans-eleve");

  await aller(page, `/classes/${classe.id}/inscrire`);
  await page.getByRole("textbox").fill([...ELEVES.slice(0, 6), "Alice", "Lucas Bernard", "Lucas"].join("\n"));
  await capturer(page, "inscrire-prenoms");
  await page.getByRole("button", { name: "Continuer" }).click();
  await capturer(page, "inscrire-verifier-a-regler");
  await inscrire(page, classe.id, ELEVES);
  await capturer(page, "classe");
  await page.getByRole("button", { name: "Afficher les codes" }).click();
  await capturer(page, "classe-codes-affiches");
  await page.getByRole("button", { name: "Masquer les codes" }).click();
  await page.getByRole("region", { name: "Élèves" }).getByRole("button", { name: /Bilal/ }).click();
  await capturer(page, "classe-code-oublie", false);
  await page.getByRole("button", { name: "Changer le code" }).click();
  await capturer(page, "classe-code-change", false);
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Limiter les horaires" }).click();
  await page.getByRole("complementary").filter({ hasText: "Ces horaires valent" }).getByText("Limiter les horaires", { exact: true }).click();
  await page.getByRole("button", { name: "Ajouter d’autres horaires" }).click();
  await capturer(page, "classe-horaires", false);
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Changer le mot de passe" }).click();
  await capturer(page, "classe-mot-de-passe", false);
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Terminer l’année" }).click();
  await capturer(page, "classe-terminer-annee", false);
  await page.keyboard.press("Escape");
  await aller(page, `/classes/${classe.id}/imprimer`);
  await capturer(page, "imprimer-etiquettes");
  await page.getByRole("checkbox", { name: /Avec l’identifiant/ }).check();
  await capturer(page, "imprimer-etiquettes-maison");
  await page.getByRole("button", { name: "Affiche de la classe" }).click();
  await capturer(page, "imprimer-affiche");
  await aller(page, "/classes");
  await capturer(page, "mes-classes");

  await aller(page, "/projets/nouveau");
  await page.getByRole("radio", { name: /^Ma classe/ }).check({ force: true });
  await capturer(page, "nouveau-projet-qui-ecrit");
  await page.getByRole("button", { name: "Continuer" }).click();
  await page.getByRole("radio", { name: /^À choix/ }).check({ force: true });
  await capturer(page, "nouveau-projet-quel-recit");
  await page.getByRole("button", { name: "Continuer" }).click();
  await page.getByLabel("Titre du projet").fill("Les passeurs de brume");
  await capturer(page, "nouveau-projet-titre-classe");
  await page.getByRole("button", { name: "Créer le projet" }).click();
  await page.waitForURL(/\/preparation/);
  await capturer(page, "projet-preparation");
  await aller(page, "/projets");
  await capturer(page, "mes-projets");
  await page.getByRole("button", { name: "Mme Laurent" }).click();
  await capturer(page, "mon-compte", false);
  await page.keyboard.press("Escape");

  const codes = await lireCodes(page, classe.id);
  const poste = await autrePoste(browser);
  await aller(poste.page, "/classe");
  await capturer(poste.page, "eleve-ouvrir-la-classe");
  await ouvrirLaClasse(poste.page, classe.identifiant, classe.motDePasse);
  await poste.page.getByRole("heading", { name: "Qui utilise cet ordinateur ?" }).waitFor();
  await capturer(poste.page, "eleve-qui-utilise");
  await taperCode(poste.page, "Alice", codes.Alice === "0001" ? "0002" : "0001");
  await poste.page.getByText(/Ce n’est pas le bon code/).waitFor();
  await capturer(poste.page, "eleve-code-refuse");
  await poste.page.getByRole("button", { name: "Quitter la classe sur cet ordinateur" }).click();
  await capturer(poste.page, "eleve-quitter-la-classe");
  await poste.page.getByRole("button", { name: "Rester" }).click();
  await poste.page.getByLabel("Chiffre 1").pressSequentially(codes.Alice);
  await poste.page.waitForURL(/\/travail$/);
  await capturer(poste.page, "eleve-mon-travail");
  await sql("update horaires set jours = array[$2::smallint], de = '00:00', a = '00:01' where classe_id = $1", [classe.id, ((new Date().getDay() + 5) % 7) + 1]);
  await poste.page.reload();
  await capturer(poste.page, "eleve-mon-travail-ferme");

  // En 390 px
  const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: "fr-FR" });
  const petit = await mobile.newPage();
  await connecter(petit, compte);
  await petit.waitForURL(/\/projet\//);
  await capturer(petit, "mobile-projet");
  await aller(petit, "/projets");
  await capturer(petit, "mobile-mes-projets");
  await aller(petit, `/classes/${classe.id}`);
  await capturer(petit, "mobile-classe");
  await aller(petit, "/classes");
  await passerAide(petit);
  await capturer(petit, "mobile-mes-classes");
  const petitPoste = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: "fr-FR" });
  const pp = await petitPoste.newPage();
  await sql("update classes set horaires_limites = false where id = $1", [classe.id]);
  await ouvrirLaClasse(pp, classe.identifiant, classe.motDePasse);
  await pp.getByRole("button", { name: "Bilal", exact: true }).click();
  await capturer(pp, "mobile-eleve-code");
  await supprimerCompte(compte);
});
