import { expect, test } from "@playwright/test";
import {
  aller, collerEleves, connecter, creerClasse, creerCompte, ecrireEleves, inscrire, lireCodes, nommer, passerAide, supprimerCompte, type Compte,
} from "./outils";

let compte: Compte;
test.beforeEach(async ({ page }) => {
  compte = await creerCompte();
  await connecter(page, compte);
  await expect(page).toHaveURL(/\/projets$/);
});
test.afterEach(async () => {
  await supprimerCompte(compte);
});

test("Mes classes — l'écran d'aide s'affiche à l'ouverture, « Ne plus afficher » le retire, « Aide » le rouvre", async ({ page }) => {
  await page.getByRole("link", { name: "Mes classes" }).click();
  await expect(page.getByRole("heading", { level: 2, name: "Mes classes" })).toBeVisible();
  await expect(page.getByText("Que fait-on ici ?")).toBeVisible();
  await expect(page.getByText("Comment un élève se connecte-t-il ?")).toBeVisible();
  await page.getByRole("button", { name: "Commencer" }).click();
  await expect(page.getByRole("heading", { name: "Pas encore de classe" })).toBeVisible();

  // Elle ne revient pas pendant la visite
  await aller(page, "/classes");
  await expect(page.getByRole("heading", { name: "Pas encore de classe" })).toBeVisible();

  await page.getByRole("button", { name: "Aide" }).click();
  await expect(page.getByRole("button", { name: "Fermer l’aide" })).toBeVisible();
  await page.getByRole("checkbox", { name: "Ne plus afficher" }).check();
  await page.getByRole("button", { name: "Fermer l’aide" }).click();
  await expect(page.getByRole("heading", { name: "Pas encore de classe" })).toBeVisible();
});

test("F06-AC67 — les informations de la classe sont proposées, se relisent, et l'affiche s'imprime", async ({ page }) => {
  await nommer(page, compte, "Mme Laurent");
  const classe = await creerClasse(page, "CM1-CM2");
  // Forme décidée le 8 octobre 2026 : minuscules et chiffres ; deux mots simples et deux chiffres
  // « cm1cm2laurent », suivi de chiffres si une autre classe porte déjà cet identifiant
  expect(classe.identifiant).toMatch(/^cm1cm2laurent\d{0,3}$/);
  expect(classe.motDePasse).toMatch(/^[a-z]+ [a-z]+ [1-9][0-9]$/);

  // Plus tard, depuis la liste : on relit, et on imprime l'affiche
  await aller(page, "/classes");
  await passerAide(page);
  await page.getByRole("link", { name: /^Ouvrir CM1-CM2/ }).click();
  const fiche = page.getByRole("region", { name: "Pour ouvrir la classe sur un ordinateur" });
  await expect(fiche).toContainText(classe.identifiant);
  await expect(fiche).not.toContainText(classe.motDePasse);
  await fiche.getByRole("link", { name: "Imprimer l’affiche" }).click();
  const affiche = page.getByRole("img", { name: "Aperçu de l’affiche de la classe" });
  await expect(affiche).toContainText("CM1-CM2 · Mme Laurent");
  await expect(affiche).toContainText("localhost:3100/classe");
  await expect(affiche).toContainText(classe.identifiant);
  await expect(affiche).toContainText(classe.motDePasse);
  await expect(affiche).toContainText("Un souci ? Demande à Mme Laurent.");
  await expect(page.getByText("Elle porte le mot de passe de la classe, pas les codes des élèves.")).toBeVisible();
});

test("F01-AC11 — une ligne corrigée avant de confirmer ; quitter sans confirmer ne crée rien", async ({ page }) => {
  const classe = await creerClasse(page, "CM1-CM2");
  await aller(page, `/classes/${classe.id}/inscrire`);
  await ecrireEleves(page, ["Noé Garnie", "Océane"]);
  await page.getByRole("button", { name: "Continuer" }).click();
  await expect(page.getByRole("heading", { name: "Vérifiez la liste" })).toBeVisible();

  // Quitter sans confirmer : aucune inscription
  await page.getByRole("link", { name: "Retour à CM1-CM2" }).click();
  await expect(page.getByText("Aucun élève pour l’instant.")).toBeVisible();

  await aller(page, `/classes/${classe.id}/inscrire`);
  await ecrireEleves(page, ["Noé Garnie", "Océane"]);
  await page.getByRole("button", { name: "Continuer" }).click();
  await page.getByRole("button", { name: "Corriger Noé" }).click();
  await page.getByLabel("Nom, facultatif").fill("Garnier");
  await page.getByRole("button", { name: "Valider" }).click();
  await page.getByRole("button", { name: "Inscrire 2 élèves" }).click();
  await expect(page.getByText("2 élèves inscrits. Chacun a son code : imprimez les étiquettes.")).toBeVisible();
  const eleves = page.getByRole("region", { name: "Élèves" });
  await expect(eleves).toContainText("Noé Garnier");
  await expect(eleves).not.toContainText(/Garnie(?!r)/);
  await expect(eleves.getByRole("listitem")).toHaveCount(2);
});

test("F01-AC33 — prénom et nom en deux cases : un prénom composé et un nom à particule s'inscrivent comme ils sont écrits", async ({ page }) => {
  const classe = await creerClasse(page, "CM1-CM2");
  await aller(page, `/classes/${classe.id}/inscrire`);
  await page.getByLabel("Prénom, ligne 1", { exact: true }).fill("jean Marie");
  await page.getByLabel("Nom, ligne 1", { exact: true }).fill("de la Batellerie");
  // « Entrée » passe à la ligne suivante, et la feuille garde toujours une ligne vide
  await page.getByLabel("Nom, ligne 1", { exact: true }).press("Enter");
  await expect(page.getByLabel("Prénom, ligne 2", { exact: true })).toBeFocused();
  for (const [i, prenom] of ["Océane", "Noé", "Lina", "Paul"].entries()) await page.getByLabel(`Prénom, ligne ${i + 2}`, { exact: true }).fill(prenom);
  await expect(page.getByLabel("Prénom, ligne 6", { exact: true })).toBeVisible();
  await expect(page.getByText("5 élèves", { exact: true })).toBeVisible();

  // Un nom sans prénom : la ligne est montrée, rien ne passe
  await page.getByLabel("Nom, ligne 6", { exact: true }).fill("Girard");
  await page.getByRole("button", { name: "Continuer" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Ligne 6 : écrivez le prénom." })).toBeVisible();
  await page.getByRole("button", { name: "Effacer la ligne 6" }).click();

  await page.getByRole("button", { name: "Continuer" }).click();
  await page.getByRole("button", { name: "Inscrire 5 élèves" }).click();
  const eleves = page.getByRole("region", { name: "Élèves" });
  await expect(eleves.getByRole("listitem").filter({ hasText: "de la Batellerie" }).locator("b")).toHaveText("Jean Marie");
  await expect(eleves.getByRole("listitem")).toHaveCount(5);
});

test("F01-AC34 — une liste collée remplit les cases, coupée au premier espace ou aux colonnes d'un tableur, et se corrige sur place", async ({ page }) => {
  const classe = await creerClasse(page, "CM1-CM2");
  await aller(page, `/classes/${classe.id}/inscrire`);
  await collerEleves(page, "Jean Marie de la Batellerie\nOcéane\n\nNoé Garnier");
  await expect(page.getByLabel("Prénom, ligne 1", { exact: true })).toHaveValue("Jean");
  await expect(page.getByLabel("Nom, ligne 1", { exact: true })).toHaveValue("Marie de la Batellerie");
  await expect(page.getByLabel("Prénom, ligne 3", { exact: true })).toHaveValue("Noé");
  // Ce qui est mal tombé se corrige dans les cases
  await page.getByLabel("Prénom, ligne 1", { exact: true }).fill("Jean Marie");
  await page.getByLabel("Nom, ligne 1", { exact: true }).fill("de la Batellerie");

  // Depuis un tableur, à la suite : une colonne pour le prénom, une pour le nom
  await collerEleves(page, "Anne Sophie\tLe Gall\nLina\t", 4);
  await expect(page.getByLabel("Prénom, ligne 4", { exact: true })).toHaveValue("Anne Sophie");
  await expect(page.getByLabel("Nom, ligne 4", { exact: true })).toHaveValue("Le Gall");
  await expect(page.getByText("5 élèves", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Continuer" }).click();
  await page.getByRole("button", { name: "Inscrire 5 élèves" }).click();
  const eleves = page.getByRole("region", { name: "Élèves" });
  await expect(eleves.getByRole("listitem").filter({ hasText: "de la Batellerie" }).locator("b")).toHaveText("Jean Marie");
  await expect(eleves.getByRole("listitem").filter({ hasText: "Le Gall" }).locator("b")).toHaveText("Anne Sophie");
});

test("F01-AC21 — deux fois le même prénom : le nom ou son initiale est demandé avant d'inscrire", async ({ page }) => {
  const classe = await creerClasse(page, "CM1-CM2");
  await inscrire(page, classe.id, ["Lucas Bernard", "Alice"]);

  await aller(page, `/classes/${classe.id}/inscrire`);
  await ecrireEleves(page, ["Lucas"]);
  await page.getByRole("button", { name: "Continuer" }).click();
  await expect(page.getByRole("heading", { name: "À régler avant d’inscrire" })).toBeVisible();
  await expect(page.getByText("Deux Lucas dans la classe.")).toBeVisible();
  await expect(page.getByText(/les élèves liront « Lucas B\. »/)).toBeVisible();
  await expect(page.getByRole("button", { name: /^Inscrire 1 élève/ })).toBeDisabled();
  await expect(page.getByRole("button", { name: "1 point à régler" })).toBeVisible();

  await page.getByLabel("Nom du nouveau Lucas").fill("Morel");
  await page.getByLabel("Nom du nouveau Lucas").blur();
  await page.getByRole("button", { name: /^Inscrire 1 élève/ }).click();
  await expect(page.getByRole("region", { name: "Élèves" })).toContainText("Lucas Morel");
});

test("F01-AC10, F01-AC12, F01-AC06, F01-AC20 — nouvelle année : profils connus cochés, homonyme signalé, année proposée à terminer", async ({ page }) => {
  const ancienne = await creerClasse(page, "CM1-CM2");
  const quinze = Array.from({ length: 15 }, (_, i) => `Ancien${String.fromCharCode(65 + i)} Nom${i}`);
  await inscrire(page, ancienne.id, [...quinze, "Adam Morel"]);
  const codesAvant = await lireCodes(page, ancienne.id);
  const annee = new Date().getMonth() >= 6 ? new Date().getFullYear() + 1 : new Date().getFullYear();

  // F01-AC20 : proposé à la création d'une classe pour l'année suivante, jamais d'office
  const nouvelle = await creerClasse(page, "CM2", `${annee}-${annee + 1}`);
  await expect(page.getByText("est encore en cours. Son année est finie ?")).toBeVisible();
  await page.getByRole("button", { name: "Plus tard" }).click();
  await aller(page, "/classes");
  await passerAide(page);
  await expect(page.getByRole("link", { name: /^Ouvrir CM1-CM2/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /^Ouvrir CM2/ })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Années passées" })).toHaveCount(0);

  await aller(page, `/classes/${nouvelle.id}/inscrire`);
  await expect(page.getByRole("heading", { name: "Qui retrouvez-vous cette année ?" })).toBeVisible();
  await page.getByRole("button", { name: "Tout cocher" }).click();
  await page.getByRole("checkbox", { name: /Adam Morel/ }).uncheck();
  await expect(page.getByText("15 élèves cochés")).toBeVisible();
  await page.getByRole("button", { name: "Continuer" }).click();
  const dix = [...Array.from({ length: 9 }, (_, i) => `Nouveau${String.fromCharCode(65 + i)}`), "Adam Morel"];
  await collerEleves(page, dix.join("\n"));
  await expect(page.getByText("10 nouveaux élèves")).toBeVisible();
  await page.getByRole("button", { name: "Continuer" }).click();

  // F01-AC12 : le nom déjà connu est signalé ; le système ne décide pas à la place de l'enseignant
  await expect(page.getByText(/Adam Morel était déjà dans CM1-CM2 · \d{4}-\d{4}\. Est-ce le même élève \?/)).toBeVisible();
  await expect(page.getByRole("button", { name: /^Inscrire 25 élèves/ })).toBeDisabled();
  await page.getByRole("button", { name: "Non, un autre élève" }).click();
  await expect(page.getByText(/15 gardent leur code, 10 nouveaux/)).toBeVisible();
  await page.getByRole("button", { name: "Inscrire 25 élèves" }).click();

  // F01-AC10 : 25 inscriptions ; F01-AC06 : les 15 réinscrits gardent leur code
  await expect(page.getByText(/· 25 élèves/)).toBeVisible();
  const codesApres = await lireCodes(page, nouvelle.id);
  expect(Object.keys(codesApres)).toHaveLength(25);
  for (const prenom of quinze.map((l) => l.split(" ")[0])) expect(codesApres[prenom], prenom).toBe(codesAvant[prenom]);
  // L'ancienne classe garde ses 16 élèves : rien n'a été déplacé
  await aller(page, `/classes/${ancienne.id}`);
  await expect(page.getByText(/· 16 élèves/)).toBeVisible();
});

test("F06-AC71, F06-AC69, F06-AC23 — codes masqués à l'ouverture ; code oublié : le lire, le remplacer, imprimer sa seule étiquette", async ({ page }) => {
  const classe = await creerClasse(page, "CM1-CM2");
  await inscrire(page, classe.id, ["Alice Martin", "Bilal Haddad", "Chloé"]);
  const codes = await lireCodes(page, classe.id);
  expect(Object.values(codes).every((c) => /^\d{4}$/.test(c))).toBe(true);

  // À l'ouverture, ni les codes ni le mot de passe ne se lisent
  await aller(page, `/classes/${classe.id}`);
  const eleves = page.getByRole("region", { name: "Élèves" });
  await expect(eleves.getByRole("listitem")).toHaveCount(3);
  for (const code of Object.values(codes)) await expect(page.locator("body")).not.toContainText(code);
  await expect(page.locator("body")).not.toContainText(classe.motDePasse);

  // La fiche de Bilal ne montre que son code
  await eleves.getByRole("button", { name: /Bilal/ }).click();
  const fiche = page.getByRole("complementary").filter({ hasText: "Retirer de la classe" });
  await expect(fiche.getByLabel(new RegExp(`Code : ${codes.Bilal.split("").join(" ")}`))).toBeVisible();
  await expect(page.locator("body")).not.toContainText(codes.Alice);
  await expect(page.locator("body")).not.toContainText(codes["Chloé"]);

  // Le remplacer : un code proposé, que l'on peut écrire soi-même
  await fiche.getByRole("button", { name: "Changer le code" }).click();
  await expect(fiche.getByLabel("Nouveau code")).toHaveValue(/^\d{4}$/);
  await fiche.getByLabel("Nouveau code").fill("12");
  await fiche.getByRole("button", { name: "Enregistrer ce code" }).click();
  await expect(fiche.getByText("Un code a quatre chiffres.")).toBeVisible();
  const neuf = codes.Bilal === "8052" ? "8053" : "8052";
  await fiche.getByLabel("Nouveau code").fill(neuf);
  await fiche.getByRole("button", { name: "Enregistrer ce code" }).click();
  await expect(page.getByText("Le code de Bilal est changé. Pensez à réimprimer son étiquette.")).toBeVisible();
  await expect(fiche.getByLabel(new RegExp(`Code : ${neuf.split("").join(" ")}`))).toBeVisible();

  // Imprimer sa seule étiquette
  await fiche.getByRole("link", { name: "Imprimer son étiquette" }).click();
  await expect(page.getByText("1 étiquette sur 1 feuille")).toBeVisible();
  const feuille = page.getByRole("img", { name: /Feuille d’étiquettes 1 sur 1/ });
  await expect(feuille).toContainText("Bilal");
  await expect(feuille).toContainText(neuf.split("").join(" "));
  await expect(feuille).not.toContainText("Alice");

  // « Afficher les codes » les montre tous ; les autres n'ont pas changé
  const apres = await lireCodes(page, classe.id);
  expect(apres).toEqual({ ...codes, Bilal: neuf });
});

test("F06-AC70 — étiquettes : le prénom et le code ; avec l'option, les informations de la classe aussi", async ({ page }) => {
  const classe = await creerClasse(page, "CM1-CM2");
  await inscrire(page, classe.id, ["Alice", "Lucas Bernard", "Lucas Morel"]);
  const codes = await lireCodes(page, classe.id);
  await page.getByRole("link", { name: "Imprimer les étiquettes" }).click();
  await expect(page.getByText("3 étiquettes sur 1 feuille")).toBeVisible();
  const feuille = page.getByRole("img", { name: /Feuille d’étiquettes/ });
  await expect(feuille).toContainText("Alice");
  await expect(feuille).toContainText(codes.Alice.split("").join(" "));
  // Deux Lucas : les élèves lisent l'initiale du nom (F01-AC21)
  await expect(feuille).toContainText("Lucas B.");
  await expect(feuille).toContainText("Lucas M.");
  await expect(feuille).not.toContainText(classe.identifiant);
  await expect(feuille).not.toContainText(classe.motDePasse);

  await page.getByRole("checkbox", { name: /Avec l’identifiant et le mot de passe de la classe/ }).check();
  await expect(feuille).toContainText("localhost:3100/classe");
  await expect(feuille).toContainText(`Identifiant : ${classe.identifiant}`);
  await expect(feuille).toContainText(`Mot de passe : ${classe.motDePasse}`);
});

test("F01-AC18, F01-AC19, F01-AC26 — terminer l'année, consulter la classe en lecture, la rouvrir", async ({ page }) => {
  const classe = await creerClasse(page, "CM1-CM2");
  await inscrire(page, classe.id, ["Alice", "Bilal"]);
  const codes = await lireCodes(page, classe.id);

  await page.getByRole("button", { name: "Terminer l’année" }).click();
  const dialogue = page.getByRole("alertdialog");
  await expect(dialogue).toContainText("Les élèves ne pourront plus ouvrir la classe sur un ordinateur.");
  await expect(dialogue).toContainText("Rien n’est supprimé");
  await expect(dialogue).toContainText("Vous pourrez rouvrir la classe.");
  await dialogue.getByRole("button", { name: "Terminer l’année" }).click();
  await expect(page.getByText(/Année terminée le \d+ \S+ \d{4}\./)).toBeVisible();

  // F01-AC26 : en lecture, sans commande pour inscrire, retirer, changer un code ou régler les horaires
  await expect(page.getByRole("region", { name: "Élèves" }).getByRole("listitem")).toHaveCount(2);
  for (const commande of ["Inscrire des élèves", "Afficher les codes", "Imprimer les étiquettes", "Changer les horaires", "Limiter les horaires", "Changer le mot de passe", "Terminer l’année"]) {
    await expect(page.getByRole("button", { name: commande }).or(page.getByRole("link", { name: commande }))).toHaveCount(0);
  }
  await expect(page.getByRole("region", { name: "Élèves" }).getByRole("button")).toHaveCount(0);
  await page.goto(`/classes/${classe.id}/inscrire`);
  await expect(page).toHaveURL(new RegExp(`/classes/${classe.id}$`));

  // F01-AC18 : elle se range sous « Années passées »
  await aller(page, "/classes");
  await passerAide(page);
  await expect(page.getByRole("heading", { name: "Années passées" })).toBeVisible();
  await expect(page.getByText("Aucune classe en cours.")).toBeVisible();
  await page.getByRole("link", { name: /CM1-CM2.*2 élèves · 0 projet/ }).click();

  // F01-AC19 : rouverte, mêmes informations de classe et mêmes codes
  await page.getByRole("button", { name: "Rouvrir la classe" }).click();
  await expect(page.getByText(/est rouverte : mêmes informations de classe, mêmes codes\./)).toBeVisible();
  const fiche = page.getByRole("region", { name: "Pour ouvrir la classe sur un ordinateur" });
  await expect(fiche).toContainText(classe.identifiant);
  await fiche.getByRole("button", { name: "Afficher le mot de passe" }).click();
  await expect(fiche).toContainText(classe.motDePasse);
  expect(await lireCodes(page, classe.id)).toEqual(codes);
});

test("F06-AC72 — horaires : des jours cochés et une plage, puis d'autres horaires pour le mercredi", async ({ page }) => {
  const classe = await creerClasse(page, "CM1-CM2");
  const fiche = page.getByRole("region", { name: "Horaires" });
  await expect(fiche).toContainText("Pas de limite d’horaire");
  await fiche.getByRole("button", { name: "Limiter les horaires" }).click();
  const panneau = page.getByRole("complementary").filter({ hasText: "Ces horaires valent pour tous les projets de la classe." });
  await panneau.getByText("Limiter les horaires", { exact: true }).click();
  await expect(panneau.getByText("Enregistré")).toBeVisible();
  await panneau.getByRole("button", { name: "Ajouter d’autres horaires" }).click();
  await expect(panneau.getByRole("group", { name: "Horaires 2" })).toBeVisible();
  await panneau.getByRole("button", { name: "Fermer", exact: true }).last().click();
  await expect(fiche).toContainText("Lun., mar., jeu., ven. · 8 h 30 – 16 h 30");
  await expect(fiche).toContainText("Mer. · 8 h 30 – 11 h 30");
  await expect(fiche).toContainText("Hors de ces horaires, les élèves ne peuvent ni lire ni écrire.");
  void classe;
});

test("F01.1 — une classe se renomme sans changer d'identifiant ; sans élève ni projet, elle se supprime", async ({ page }) => {
  const classe = await creerClasse(page, "CM1");
  await page.getByLabel("Autres commandes de la classe").click();
  await page.getByRole("button", { name: "Renommer la classe" }).click();
  await page.getByRole("alertdialog").getByLabel("Nom de la classe").fill("CM1-CM2");
  // Changer l'identifiant est proposé, jamais fait d'office (F06-AC84)
  await expect(page.getByRole("alertdialog").getByRole("checkbox", { name: /Changer aussi l’identifiant/ })).not.toBeChecked();
  await page.getByRole("alertdialog").getByRole("button", { name: "Enregistrer" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "CM1-CM2" })).toBeVisible();
  await expect(page.getByRole("region", { name: "Pour ouvrir la classe sur un ordinateur" })).toContainText(classe.identifiant);

  await page.getByLabel("Autres commandes de la classe").click();
  await page.getByRole("button", { name: "Supprimer la classe" }).click();
  await expect(page).toHaveURL(/\/classes$/);
  await expect(page.getByText("La classe est supprimée.")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Pas encore de classe" })).toBeVisible();

  // Une classe qui a un élève ne propose pas de la supprimer
  const pleine = await creerClasse(page, "CE2");
  await inscrire(page, pleine.id, ["Alice"]);
  await page.getByLabel("Autres commandes de la classe").click();
  await expect(page.getByRole("button", { name: "Supprimer la classe" })).toHaveCount(0);
});

test("F06-AC70 — à l'impression : une feuille A4 par planche d'étiquettes, une pour l'affiche, sans le reste de l'écran", async ({ page }) => {
  const classe = await creerClasse(page, "CM1-CM2");
  await inscrire(page, classe.id, Array.from({ length: 30 }, (_, i) => `Eleve${String.fromCharCode(65 + (i % 26))}${i}`));
  const pages = async (): Promise<number> => {
    const pdf = await page.pdf({ preferCSSPageSize: true, printBackground: true });
    return (pdf.toString("latin1").match(/\/Type\s*\/Page[^s]/g) ?? []).length;
  };
  await aller(page, `/classes/${classe.id}/imprimer`);
  await expect(page.getByText("30 étiquettes sur 2 feuilles")).toBeVisible();
  expect(await pages()).toBe(2);
  await page.getByRole("checkbox", { name: /Avec l’identifiant/ }).check();
  await expect(page.getByText("30 étiquettes sur 3 feuilles")).toBeVisible();
  expect(await pages()).toBe(3);
  await page.getByRole("button", { name: "Affiche de la classe" }).click();
  expect(await pages()).toBe(1);
  // À l'impression, ni la barre du haut ni les réglages ne sortent
  await page.emulateMedia({ media: "print" });
  await expect(page.getByRole("banner")).toBeHidden();
  await expect(page.getByRole("button", { name: "Imprimer l’affiche" })).toBeHidden();
  await expect(page.getByRole("img", { name: "Aperçu de l’affiche de la classe" })).toBeVisible();
});
