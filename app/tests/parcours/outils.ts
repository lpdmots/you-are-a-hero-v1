import { randomBytes, randomUUID } from "node:crypto";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { Client } from "pg";
import { expect, type Browser, type BrowserContext, type Page } from "@playwright/test";

config({ path: resolve(__dirname, "../../.env.local"), quiet: true });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
if (!/^http:\/\/(127\.0\.0\.1|localhost)[:/]/.test(url)) {
  throw new Error("Les parcours ne se jouent que contre la base locale : « npm run base:demarrer » puis « npm run env:local ».");
}
const service = () => createClient(url, process.env.SUPABASE_CLE_SECRETE!, { auth: { persistSession: false, autoRefreshToken: false } });

export type Compte = { id: string; courriel: string; motDePasse: string };

/** Avant l'ouverture, un compte ne se crée que depuis Supabase (F01-AC28). */
export async function creerCompte(): Promise<Compte> {
  const courriel = `parcours-${randomUUID()}@exemple.test`;
  const motDePasse = `parcours-${randomBytes(9).toString("base64url")}`;
  const { data, error } = await service().auth.admin.createUser({ email: courriel, password: motDePasse, email_confirm: true });
  if (error || !data.user) throw new Error(error?.message);
  return { id: data.user.id, courriel, motDePasse };
}

export async function supprimerCompte(compte: Compte | undefined): Promise<void> {
  if (compte) await service().auth.admin.deleteUser(compte.id);
}

export async function sql<T extends Record<string, unknown> = Record<string, unknown>>(requete: string, valeurs: unknown[] = []): Promise<T[]> {
  const client = new Client({ connectionString: process.env.BASE_LOCALE_URL });
  await client.connect();
  try {
    return (await client.query(requete, valeurs)).rows as T[];
  } finally {
    await client.end();
  }
}

/** Ouvre une adresse et attend que la page soit prête à réagir. */
export async function aller(page: Page, adresse: string): Promise<void> {
  await page.goto(adresse);
  await page.locator("html[data-pret]").waitFor();
}

export async function connecter(page: Page, compte: Compte, motDePasse = compte.motDePasse): Promise<void> {
  await aller(page, "/entree");
  await page.getByLabel("Adresse électronique").fill(compte.courriel);
  await page.getByLabel("Mot de passe").fill(motDePasse);
  await page.getByRole("button", { name: "Entrer" }).click();
}

/** Ferme l'écran d'aide de « Mes classes » s'il s'affiche. */
export async function passerAide(page: Page): Promise<void> {
  const commencer = page.getByRole("button", { name: "Commencer" });
  if (await commencer.isVisible().catch(() => false)) await commencer.click();
}

/** Donne le nom affiché aux élèves, depuis « Mon compte ». */
export async function nommer(page: Page, compte: Compte, nom: string): Promise<void> {
  await page.getByRole("button", { name: new RegExp(compte.courriel.slice(0, 12)) }).click();
  await page.getByLabel("Nom affiché aux élèves").fill(nom);
  await page.getByLabel("Nom affiché aux élèves").blur();
  await expect(page.getByText("Enregistré")).toBeVisible();
  await page.getByRole("button", { name: "Fermer", exact: true }).last().click();
}

export type ClasseCreee = { id: string; identifiant: string; motDePasse: string };

/** Un identifiant que personne n'a : la base locale garde les classes d'autres essais. */
export const identifiantLibre = (): string => `essai${randomBytes(6).toString("hex")}`;

/**
 * Crée une classe par l'écran et relit ses informations de connexion. L'identifiant
 * proposé, tiré du nom, peut être pris par une autre classe : on en écrit un qui est libre.
 */
export async function creerClasse(page: Page, nom: string, annee?: string, choisi: string | null = identifiantLibre()): Promise<ClasseCreee> {
  await aller(page, "/classes");
  await passerAide(page);
  await page.getByRole("button", { name: /Nouvelle classe|Créer ma classe/ }).click();
  await page.getByLabel("Nom de la classe").fill(nom);
  // null : on garde l'identifiant proposé, pour une classe dont le nom est lui-même unique
  if (choisi) await page.getByLabel("Identifiant", { exact: true }).fill(choisi);
  if (annee) await page.getByRole("radio", { name: annee }).check();
  await page.getByRole("button", { name: "Créer la classe" }).click();
  await page.waitForURL(/\/classes\/[0-9a-f-]{36}/);
  await expect(page.getByRole("heading", { level: 1, name: nom })).toBeVisible();
  const id = page.url().match(/\/classes\/([0-9a-f-]{36})/)![1];
  const fiche = page.getByRole("region", { name: "Pour ouvrir la classe sur un ordinateur" });
  const identifiant = (await fiche.locator("dd").nth(1).innerText()).trim();
  await fiche.getByRole("button", { name: "Afficher le mot de passe" }).click();
  await expect(fiche.getByRole("button", { name: "Masquer le mot de passe" })).toBeVisible();
  const motDePasse = (await fiche.locator("dd").nth(2).locator("span").first().innerText()).trim();
  await fiche.getByRole("button", { name: "Masquer le mot de passe" }).click();
  return { id, identifiant, motDePasse };
}

/**
 * Écrit des élèves dans la feuille de saisie, une ligne chacun : « Prénom » ou « Prénom Nom »,
 * le premier mot allant dans la case du prénom, la suite dans celle du nom.
 */
export async function ecrireEleves(page: Page, lignes: string[]): Promise<void> {
  for (const [i, ligne] of lignes.entries()) {
    const [prenom, ...nom] = ligne.trim().split(/\s+/);
    await page.getByLabel(`Prénom, ligne ${i + 1}`, { exact: true }).fill(prenom);
    if (nom.length) await page.getByLabel(`Nom, ligne ${i + 1}`, { exact: true }).fill(nom.join(" "));
  }
}

/** Colle une liste dans la feuille de saisie, comme depuis un traitement de texte ou un tableur. */
export async function collerEleves(page: Page, texte: string, ligne = 1): Promise<void> {
  await page.getByLabel(`Prénom, ligne ${ligne}`, { exact: true }).evaluate((champ, colle) => {
    const donnees = new DataTransfer();
    donnees.setData("text/plain", colle);
    champ.dispatchEvent(new ClipboardEvent("paste", { clipboardData: donnees, bubbles: true, cancelable: true }));
  }, texte);
}

/** Inscrit de nouveaux élèves par l'écran (classe sans profil connu à cocher). */
export async function inscrire(page: Page, classeId: string, lignes: string[]): Promise<void> {
  await aller(page, `/classes/${classeId}/inscrire`);
  const connus = page.getByRole("heading", { name: "Qui retrouvez-vous cette année ?" });
  if (await connus.isVisible().catch(() => false)) await page.getByRole("button", { name: "Continuer" }).click();
  await ecrireEleves(page, lignes);
  await page.getByRole("button", { name: "Continuer" }).click();
  await page.getByRole("button", { name: new RegExp(`^Inscrire ${lignes.length} élève`) }).click();
  await page.waitForURL(new RegExp(`/classes/${classeId}(\\?|$)`));
  await expect(page.getByRole("heading", { name: "Élèves" })).toBeVisible();
}

/** Les codes de la classe, lus par « Afficher les codes » : prénom → code. */
export async function lireCodes(page: Page, classeId: string): Promise<Record<string, string>> {
  await aller(page, `/classes/${classeId}`);
  await page.getByRole("button", { name: "Afficher les codes" }).click();
  await expect(page.getByRole("button", { name: "Masquer les codes" })).toBeVisible();
  const lignes = page.getByRole("region", { name: "Élèves" }).getByRole("listitem");
  await expect(lignes.first()).toContainText(/\d{4}/);
  const codes: Record<string, string> = {};
  for (const ligne of await lignes.all()) {
    const prenom = (await ligne.locator("b").innerText()).trim();
    const code = (await ligne.innerText()).match(/\d{4}/)?.[0] ?? "";
    codes[prenom] = code;
  }
  return codes;
}

/** Un autre ordinateur : un navigateur sans rien en mémoire. */
export async function autrePoste(browser: Browser): Promise<{ contexte: BrowserContext; page: Page }> {
  const contexte = await browser.newContext({ locale: "fr-FR", timezoneId: "Europe/Paris", viewport: { width: 1366, height: 768 } });
  return { contexte, page: await contexte.newPage() };
}

export async function ouvrirLaClasse(page: Page, identifiant: string, motDePasse: string): Promise<void> {
  await aller(page, "/classe");
  await page.getByLabel("Identifiant de la classe").fill(identifiant);
  await page.getByLabel("Mot de passe de la classe").fill(motDePasse);
  await page.getByRole("button", { name: "Entrer", exact: true }).click();
}

export async function taperCode(page: Page, prenom: string, code: string): Promise<void> {
  await page.getByRole("button", { name: prenom, exact: true }).click();
  await page.getByLabel("Chiffre 1").pressSequentially(code);
}

export const ALERTE = (page: Page) => page.getByRole("alert").filter({ hasText: /\S/ });
