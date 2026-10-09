import { expect, test, type Page } from "@playwright/test";
import {
  aller, autrePoste, connecter, creerClasse, creerCompte, inscrire, lireCodes, nommer, ouvrirLaClasse, sql,
  supprimerCompte, taperCode, type ClasseCreee, type Compte,
} from "./outils";

let compte: Compte;
let classe: ClasseCreee;
let codes: Record<string, string>;

// Une enseignante, sa classe de trois élèves : l'adulte garde sa page, les élèves ont d'autres ordinateurs.
test.beforeEach(async ({ page }) => {
  compte = await creerCompte();
  await connecter(page, compte);
  await expect(page).toHaveURL(/\/projets$/);
  await nommer(page, compte, "Mme Laurent");
  classe = await creerClasse(page, "CM1-CM2");
  await inscrire(page, classe.id, ["Alice Martin", "Bilal Haddad", "Chloé"]);
  codes = await lireCodes(page, classe.id);
});
test.afterEach(async () => {
  await supprimerCompte(compte);
});

const codeFaux = (bon: string): string => (bon === "0001" ? "0002" : "0001");
const choixDesProfils = (page: Page) => page.getByRole("heading", { level: 1, name: "Qui utilise cet ordinateur ?" });
const entreeDeLaClasse = (page: Page) => page.getByRole("heading", { level: 1, name: /Ouvrir la classe/ });

async function entrer(page: Page, prenom: string): Promise<void> {
  await ouvrirLaClasse(page, classe.identifiant, classe.motDePasse);
  await expect(choixDesProfils(page)).toBeVisible();
  await taperCode(page, prenom, codes[prenom]);
  await expect(page).toHaveURL(/\/travail$/);
}

test("F06-AC43, F06-AC81 — connexion en deux étapes, saisie tolérante aux majuscules et aux espaces", async ({ browser }) => {
  const poste = await autrePoste(browser);
  // Sans la classe, ni le choix des profils ni le travail ne s'ouvrent (F06-AC25)
  await poste.page.goto("/classe/qui");
  await expect(poste.page).toHaveURL(/\/classe$/);
  await poste.page.goto("/travail");
  await expect(poste.page).toHaveURL(/\/classe$/);

  const [premier, second, chiffres] = classe.motDePasse.split(" ");
  await ouvrirLaClasse(poste.page, ` ${classe.identifiant.toUpperCase()} `, `${premier[0].toUpperCase()}${premier.slice(1)}  ${second} ${chiffres} `);
  await expect(choixDesProfils(poste.page)).toBeVisible();
  await expect(poste.page.getByText("Classe CM1-CM2 de Mme Laurent")).toBeVisible();
  // Prénoms dans l'ordre alphabétique, sans les noms ; aucun code à l'écran
  await expect(poste.page.getByRole("list", { name: "Élèves de la classe" }).getByRole("button")).toHaveText([/Alice$/, /Bilal$/, /Chloé$/]);
  await expect(poste.page.locator("body")).not.toContainText("Martin");
  await expect(poste.page.getByText("Clique sur ton prénom.")).toBeVisible();

  // Les informations de la classe ne donnent pas le travail d'un élève, ni l'espace enseignant
  await poste.page.goto("/travail");
  await expect(poste.page).toHaveURL(/\/classe\/qui$/);
  await poste.page.goto("/projets");
  await expect(poste.page).toHaveURL(/\/entree$/);

  await aller(poste.page, "/classe/qui");
  await taperCode(poste.page, "Alice", codes.Alice);
  await expect(poste.page).toHaveURL(/\/travail$/);
  await expect(poste.page.getByText("Bonjour Alice")).toBeVisible();
  await expect(poste.page.getByRole("banner")).toContainText("Alice");
  await expect(poste.page.getByText("Mme Laurent va t’en donner un.")).toBeVisible();
  await poste.contexte.close();
});

test("F06-AC15, F06-AC16, F06-AC44 — changer d'élève garde la classe ouverte ; quitter la classe ferme tout", async ({ browser }) => {
  const poste = await autrePoste(browser);
  await entrer(poste.page, "Alice");

  await poste.page.getByRole("button", { name: "Changer d’élève" }).click();
  await expect(choixDesProfils(poste.page)).toBeVisible();
  // L'accès d'Alice est terminé : son travail ne se rouvre pas sans son code
  await poste.page.goto("/travail");
  await expect(poste.page).toHaveURL(/\/classe\/qui$/);

  // Bilal entre sans ressaisir les informations de la classe ; l'identité affichée est la sienne
  await aller(poste.page, "/classe/qui");
  await taperCode(poste.page, "Bilal", codes.Bilal);
  await expect(poste.page).toHaveURL(/\/travail$/);
  await expect(poste.page.getByText("Bonjour Bilal")).toBeVisible();
  await expect(poste.page.getByRole("banner")).not.toContainText("Alice");
  await poste.page.goto("/classes");
  await expect(poste.page).toHaveURL(/\/entree$/);

  // « Quitter la classe » demande une confirmation, puis ne laisse aucun accès
  await aller(poste.page, "/travail");
  await poste.page.getByRole("button", { name: "Changer d’élève" }).click();
  await poste.page.getByRole("button", { name: "Quitter la classe sur cet ordinateur" }).click();
  await expect(poste.page.getByRole("alertdialog")).toContainText("Pour revenir, il faudra le mot de passe de la classe.");
  await poste.page.getByRole("button", { name: "Rester" }).click();
  await expect(choixDesProfils(poste.page)).toBeVisible();
  await poste.page.getByRole("button", { name: "Quitter la classe sur cet ordinateur" }).click();
  await poste.page.getByRole("button", { name: "Quitter", exact: true }).click();
  await expect(entreeDeLaClasse(poste.page)).toBeVisible();
  await poste.page.goto("/classe/qui");
  await expect(poste.page).toHaveURL(/\/classe$/);
  await poste.contexte.close();
});

test("F06-AC73 — cinq codes faux : Bilal attend deux minutes, Alice entre sur le poste voisin", async ({ browser }) => {
  const poste = await autrePoste(browser);
  await ouvrirLaClasse(poste.page, classe.identifiant, classe.motDePasse);
  const faux = codeFaux(codes.Bilal);
  for (let essai = 1; essai <= 4; essai += 1) {
    await taperCode(poste.page, "Bilal", faux);
    await expect(poste.page.getByText("Ce n’est pas le bon code. Essaie encore, ou demande à Mme Laurent.")).toBeVisible();
    await poste.page.getByRole("button", { name: "Ce n’est pas moi" }).click();
  }
  await taperCode(poste.page, "Bilal", faux);
  await expect(poste.page.getByText("Trop d’essais. Attends deux minutes, ou demande à Mme Laurent.")).toBeVisible();

  // Le sixième essai, même avec le bon code, est refusé
  await poste.page.getByLabel("Chiffre 1").pressSequentially(codes.Bilal);
  await expect(poste.page.getByText(/Trop d’essais\. Attends (deux|une) minutes?/)).toBeVisible();
  await expect(poste.page).toHaveURL(/\/classe\/qui$/);

  // Sur le poste voisin, Alice entre sans attendre
  const voisin = await autrePoste(browser);
  await entrer(voisin.page, "Alice");
  await voisin.contexte.close();

  // Deux minutes plus tard, le bon code de Bilal est accepté
  await sql("update eleves_secrets set bloque_jusqua = now() - interval '1 second' where eleve_id in (select e.id from eleves e join inscriptions i on i.eleve_id = e.id where i.classe_id = $1 and e.prenom = 'Bilal')", [classe.id]);
  await poste.page.getByRole("button", { name: "Ce n’est pas moi" }).click();
  await taperCode(poste.page, "Bilal", codes.Bilal);
  await expect(poste.page).toHaveURL(/\/travail$/);
  await poste.contexte.close();
});

test("F06-AC74 — dix essais faux à l'entrée de la classe : cinq minutes d'attente sur ce poste, pas sur un autre", async ({ browser }) => {
  const poste = await autrePoste(browser);
  for (let essai = 1; essai <= 9; essai += 1) {
    await ouvrirLaClasse(poste.page, classe.identifiant, "pas le bon 11");
    await expect(poste.page.getByText(/Ce n’est pas le bon identifiant, ou pas le bon mot de passe\./)).toBeVisible();
  }
  await ouvrirLaClasse(poste.page, "classeinconnue", classe.motDePasse);
  await expect(poste.page.getByText(/Trop d’essais\. Attends 5 minutes, ou demande à ton enseignant\(e\)\./)).toBeVisible();

  // Le onzième essai, avec les bonnes informations, est refusé
  await ouvrirLaClasse(poste.page, classe.identifiant, classe.motDePasse);
  await expect(poste.page.getByText(/Trop d’essais\./)).toBeVisible();
  await expect(poste.page).toHaveURL(/\/classe$/);

  // Un autre poste ouvre la classe
  const autre = await autrePoste(browser);
  await ouvrirLaClasse(autre.page, classe.identifiant, classe.motDePasse);
  await expect(choixDesProfils(autre.page)).toBeVisible();
  await autre.contexte.close();
  await poste.contexte.close();
});

test("F06-AC68, F06-AC77 — mot de passe remplacé : les postes ouverts redemandent la classe, l'ancien est refusé", async ({ page, browser }) => {
  const postes = [await autrePoste(browser), await autrePoste(browser)];
  await entrer(postes[0].page, "Alice");
  await ouvrirLaClasse(postes[1].page, classe.identifiant, classe.motDePasse);
  await expect(choixDesProfils(postes[1].page)).toBeVisible();

  await aller(page, `/classes/${classe.id}`);
  await page.getByRole("button", { name: "Changer le mot de passe" }).click();
  const dialogue = page.getByRole("alertdialog");
  await expect(dialogue).toContainText("Les codes des élèves ne changent pas.");
  const nouveau = (await dialogue.locator("b").first().innerText()).trim();
  expect(nouveau).toMatch(/^[a-z]+ [a-z]+ [1-9][0-9]$/);
  expect(nouveau).not.toBe(classe.motDePasse);
  await dialogue.getByRole("button", { name: "Changer le mot de passe" }).click();
  await expect(page.getByText("Le mot de passe de la classe est changé.")).toBeVisible();

  // Les postes ouverts reviennent à l'entrée de la classe, celui d'Alice compris
  for (const poste of postes) {
    await poste.page.reload();
    await expect(entreeDeLaClasse(poste.page)).toBeVisible();
  }
  // L'ancien mot de passe est refusé, le nouveau ouvre ; les codes n'ont pas changé
  await ouvrirLaClasse(postes[0].page, classe.identifiant, classe.motDePasse);
  await expect(postes[0].page.getByText(/Ce n’est pas le bon identifiant, ou pas le bon mot de passe\./)).toBeVisible();
  await ouvrirLaClasse(postes[0].page, classe.identifiant, nouveau);
  await expect(choixDesProfils(postes[0].page)).toBeVisible();
  await taperCode(postes[0].page, "Alice", codes.Alice);
  await expect(postes[0].page).toHaveURL(/\/travail$/);
  for (const poste of postes) await poste.contexte.close();
});

test("F06-AC78 — élève retiré : son poste revient au choix des profils, sans lui ; année terminée : tous les postes se ferment", async ({ page, browser }) => {
  const bilal = await autrePoste(browser);
  const alice = await autrePoste(browser);
  await entrer(bilal.page, "Bilal");
  await entrer(alice.page, "Alice");

  await aller(page, `/classes/${classe.id}`);
  await page.getByRole("region", { name: "Élèves" }).getByRole("button", { name: /Bilal/ }).click();
  await page.getByRole("button", { name: "Retirer de la classe" }).click();
  await expect(page.getByText("Bilal n’est plus dans la classe.")).toBeVisible();
  await expect(page.getByRole("region", { name: "Élèves" }).getByRole("listitem")).toHaveCount(2);

  await bilal.page.reload();
  await expect(choixDesProfils(bilal.page)).toBeVisible();
  await expect(bilal.page.getByRole("list", { name: "Élèves de la classe" }).getByRole("button")).toHaveText([/Alice$/, /Chloé$/]);
  // Alice continue
  await alice.page.reload();
  await expect(alice.page.getByText("Bonjour Alice")).toBeVisible();

  // « Annuler » : Bilal est de retour, avec le même code
  await page.getByRole("button", { name: "Annuler" }).click();
  await expect(page.getByText("Bilal est de retour dans la classe.")).toBeVisible();
  await bilal.page.reload();
  await taperCode(bilal.page, "Bilal", codes.Bilal);
  await expect(bilal.page).toHaveURL(/\/travail$/);

  // Année terminée : les deux postes se ferment de la même façon, et la classe ne s'ouvre plus (F01-AC18)
  await page.getByRole("button", { name: "Terminer l’année" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Terminer l’année" }).click();
  await expect(page.getByText(/Année terminée le/)).toBeVisible();
  for (const poste of [bilal, alice]) {
    await poste.page.reload();
    await expect(entreeDeLaClasse(poste.page)).toBeVisible();
  }
  await ouvrirLaClasse(alice.page, classe.identifiant, classe.motDePasse);
  await expect(alice.page.getByText(/Ce n’est pas le bon identifiant, ou pas le bon mot de passe\./)).toBeVisible();

  // Rouverte : Alice entre avec les mêmes informations de classe et le même code (F01-AC19)
  await page.getByRole("button", { name: "Rouvrir la classe" }).click();
  await expect(page.getByText(/est rouverte/)).toBeVisible();
  await entrer(alice.page, "Alice");
  await bilal.contexte.close();
  await alice.contexte.close();
});

test("F06-AC24, F06-AC79 — code remplacé pendant la séance : Alice continue ; ensuite, seul le nouveau code est accepté", async ({ page, browser }) => {
  const poste = await autrePoste(browser);
  await entrer(poste.page, "Alice");

  await aller(page, `/classes/${classe.id}`);
  await page.getByRole("region", { name: "Élèves" }).getByRole("button", { name: /Alice/ }).click();
  const fiche = page.getByRole("complementary").filter({ hasText: "Retirer de la classe" });
  await fiche.getByRole("button", { name: "Changer le code" }).click();
  const neuf = codes.Alice === "3141" ? "2718" : "3141";
  await fiche.getByLabel("Nouveau code").fill(neuf);
  await fiche.getByRole("button", { name: "Enregistrer ce code" }).click();
  await expect(page.getByText("Le code d’Alice est changé. Pensez à réimprimer son étiquette.")).toBeVisible();

  // Sa séance n'est pas coupée
  await poste.page.reload();
  await expect(poste.page.getByText("Bonjour Alice")).toBeVisible();

  // À sa prochaine identification : l'ancien est refusé, le nouveau accepté
  await poste.page.getByRole("button", { name: "Changer d’élève" }).click();
  await taperCode(poste.page, "Alice", codes.Alice);
  await expect(poste.page.getByText(/Ce n’est pas le bon code\./)).toBeVisible();
  await poste.page.getByLabel("Chiffre 1").pressSequentially(neuf);
  await expect(poste.page).toHaveURL(/\/travail$/);
  await expect(poste.page.getByText("Bonjour Alice")).toBeVisible();
  await poste.contexte.close();
});

test("F06-AC27, F06-AC28, F06-AC31 — hors des horaires, le travail est fermé pour l'élève, pas pour l'enseignant", async ({ page, browser }) => {
  const poste = await autrePoste(browser);
  await entrer(poste.page, "Alice");
  await expect(poste.page.getByText(/Le travail est fermé/)).toHaveCount(0);

  // Une plage qui ne contient pas l'instant présent : hier seulement, une minute
  const hier = ((new Date().getDay() + 5) % 7) + 1;
  await sql("insert into horaires (classe_id, enseignant_id, jours, de, a) select id, enseignant_id, array[$2::smallint], '00:00', '00:01' from classes where id = $1", [classe.id, hier]);
  await sql("update classes set horaires_limites = true where id = $1", [classe.id]);

  await poste.page.reload();
  await expect(poste.page.getByText(/Le travail est fermé jusqu’à /)).toBeVisible();
  await expect(poste.page.getByText("Bonjour Alice")).toBeVisible();
  // L'enseignant garde son accès
  await aller(page, `/classes/${classe.id}`);
  await expect(page.getByRole("region", { name: "Élèves" }).getByRole("listitem")).toHaveCount(3);
  await expect(page.getByRole("region", { name: "Horaires" })).toContainText("Hors de ces horaires, les élèves ne peuvent ni lire ni écrire.");

  // De retour dans une plage autorisée : rien n'est à refaire
  await sql("update classes set horaires_limites = false where id = $1", [classe.id]);
  await poste.page.reload();
  await expect(poste.page.getByText(/Le travail est fermé/)).toHaveCount(0);
  await expect(poste.page.getByText("Bonjour Alice")).toBeVisible();
  await poste.contexte.close();
});

test("F06-AC75, F06-AC76 — la classe se ferme pendant la nuit ; deux heures sans activité terminent l'accès de l'élève", async ({ browser }) => {
  const poste = await autrePoste(browser);
  await entrer(poste.page, "Alice");

  // Une heure sans activité : Alice retrouve sa page
  await sql("update postes set actif_le = now() - interval '1 hour' where classe_id = $1", [classe.id]);
  await poste.page.reload();
  await expect(poste.page.getByText("Bonjour Alice")).toBeVisible();

  // Deux heures : son accès individuel se termine, le choix des profils s'affiche
  await sql("update postes set actif_le = now() - interval '2 hours 1 minute' where classe_id = $1", [classe.id]);
  await poste.page.reload();
  await expect(choixDesProfils(poste.page)).toBeVisible();

  // Le lendemain matin : l'entrée redemande les informations de la classe, la liste ne se lit pas
  await sql("update postes set expire_le = now() - interval '1 minute' where classe_id = $1", [classe.id]);
  await poste.page.reload();
  await expect(entreeDeLaClasse(poste.page)).toBeVisible();
  await expect(poste.page.locator("body")).not.toContainText("Alice");
  await poste.contexte.close();
});
