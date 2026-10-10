import { randomBytes, randomUUID } from "node:crypto";
import { resolve } from "node:path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { Client } from "pg";
import { expect, type Browser, type BrowserContext, type Locator, type Page } from "@playwright/test";
import { supprimerComptesDEssai } from "../comptes-d-essai";

config({ path: resolve(__dirname, "../../.env.local"), quiet: true });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
if (!/^http:\/\/(127\.0\.0\.1|localhost)[:/]/.test(url)) {
  throw new Error("Les parcours ne se jouent que contre la base locale : « npm run base:demarrer » puis « npm run env:local ».");
}
const service = () => createClient(url, process.env.SUPABASE_CLE_SECRETE!, { auth: { persistSession: false, autoRefreshToken: false } });

export type Compte = { id: string; courriel: string; motDePasse: string };
const crees: string[] = [];

/** Avant l'ouverture, un compte ne se crée que depuis Supabase (F01-AC28). */
export async function creerCompte(): Promise<Compte> {
  const courriel = `parcours-${randomUUID()}@exemple.test`;
  const motDePasse = `parcours-${randomBytes(9).toString("base64url")}`;
  const { data, error } = await service().auth.admin.createUser({ email: courriel, password: motDePasse, email_confirm: true });
  if (error || !data.user) throw new Error(error?.message);
  crees.push(data.user.id);
  return { id: data.user.id, courriel, motDePasse };
}

/** Supprime les comptes que le test a créés, avec leurs classes, élèves et projets ; un reste fait échouer le test. */
export async function supprimerComptes(): Promise<void> {
  await supprimerComptesDEssai(crees.splice(0));
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

/** Un identifiant que personne n'a : la base locale garde les classes créées à la main. */
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

// ——— Étape 2 : préparer une situation sans passer par les écrans ———

/** L'accès de l'adulte à la base, avec ses seuls droits, comme depuis son navigateur. */
export async function baseDe(compte: Compte): Promise<SupabaseClient> {
  const base = createClient(url, process.env.NEXT_PUBLIC_SUPABASE_CLE_PUBLIABLE!, { auth: { persistSession: false, autoRefreshToken: false } });
  const { error } = await base.auth.signInWithPassword({ email: compte.courriel, password: compte.motDePasse });
  if (error) throw new Error(error.message);
  return base;
}

export async function semerProjet(
  base: SupabaseClient, compte: Compte, organisation: "classe" | "personnel", recit: "choix" | "classique", titre: string, classeId: string | null = null,
): Promise<string> {
  const { data, error } = await base.from("projets").insert({ enseignant_id: compte.id, organisation, recit, titre, classe_id: classeId, visuel_defaut: "montagne" }).select("id").single();
  if (error || !data) throw new Error(error?.message);
  await base.from("enseignants").update({ dernier_projet_id: data.id }).eq("id", compte.id);
  return data.id;
}

/** Une partie et ses chapitres, chacun avec ses scènes titrées. Rend les identifiants des chapitres et des scènes, dans l'ordre. */
export async function semerPartie(
  base: SupabaseClient, projetId: string, titre: string, chapitres: { titre: string; scenes?: string[] }[], visuel = "foret",
): Promise<{ partieId: string; chapitres: { id: string; scenes: string[] }[] }> {
  const visuels = ["mer", "montagne", "cite", "desert", "foret"];
  const { data, error } = await base.rpc("creer_partie", {
    p_projet: projetId, p_titre: titre, p_visuel: visuel, p_titre_chapitre: chapitres[0].titre, p_couleur: Math.floor(Math.random() * 8), p_visuel_chapitre: visuels[0],
  });
  const ligne = (Array.isArray(data) ? data[0] : data) as { partie_id: string; chapitre_id: string } | null;
  if (error || !ligne) throw new Error(error?.message);
  const crees: { id: string; scenes: string[] }[] = [];
  for (const [i, chapitre] of chapitres.entries()) {
    let id = ligne.chapitre_id;
    if (i > 0) {
      const cree = await base.rpc("creer_chapitre", { p_partie: ligne.partie_id, p_titre: chapitre.titre, p_couleur: (i * 3) % 8, p_visuel: visuels[i % visuels.length] });
      if (cree.error) throw new Error(cree.error.message);
      id = cree.data as string;
    }
    const scenes: string[] = [];
    for (const titreScene of chapitre.scenes ?? []) {
      const scene = await base.rpc("creer_scene", { p_chapitre: id });
      const s = (Array.isArray(scene.data) ? scene.data[0] : scene.data) as { scene_id: string } | null;
      if (scene.error || !s) throw new Error(scene.error?.message);
      if (titreScene) await base.from("scenes").update({ titre: titreScene }).eq("id", s.scene_id);
      scenes.push(s.scene_id);
    }
    crees.push({ id, scenes });
  }
  return { partieId: ligne.partie_id, chapitres: crees };
}

/** Les élèves d'une classe, par prénom : leur profil et leur inscription. */
export async function elevesDe(base: SupabaseClient, classeId: string): Promise<Record<string, { id: string; inscriptionId: string }>> {
  const { data, error } = await base.from("inscriptions").select("id, eleves(id, prenom)").eq("classe_id", classeId).is("retire_le", null);
  if (error) throw new Error(error.message);
  return Object.fromEntries(((data ?? []) as unknown as { id: string; eleves: { id: string; prenom: string } }[]).map((i) => [i.eleves.prenom, { id: i.eleves.id, inscriptionId: i.id }]));
}

export async function semerAttribution(base: SupabaseClient, chapitreId: string, eleves: { eleve: string; profil?: "propositions" | "organisation" }[]): Promise<void> {
  const { error } = await base.rpc("attribuer_chapitre", { p_chapitre: chapitreId, p_eleves: eleves });
  if (error) throw new Error(error.message);
}

/** Ne plus afficher les écrans d'aide de ce compte : un parcours qui ne porte pas sur l'aide n'a pas à la fermer. */
export async function masquerAides(base: SupabaseClient, compte: Compte): Promise<void> {
  await base.from("enseignants").update({ aides_masquees: ["classes", "plan", "preparation"] }).eq("id", compte.id);
}

/** Une classe et ses élèves, créés sans passer par les écrans : pour les parcours où aucun élève ne se connecte. */
export async function semerClasse(base: SupabaseClient, nom: string, prenoms: string[]): Promise<{ id: string; eleves: Record<string, { id: string; inscriptionId: string }> }> {
  const id = randomUUID();
  const creee = await base.rpc("creer_classe", { p_id: id, p_nom: nom, p_annee_debut: 2026, p_identifiant: identifiantLibre(), p_mot_de_passe_chiffre: "non-lu-par-ce-parcours" });
  if (creee.error) throw new Error(creee.error.message);
  const inscrits = await base.rpc("inscrire_eleves", {
    p_classe: id, p_connus: [],
    p_nouveaux: prenoms.map((prenom, i) => ({ id: randomUUID(), prenom, nom: null, couleur: i % 10, code_chiffre: "non-lu-par-ce-parcours" })),
  });
  if (inscrits.error) throw new Error(inscrits.error.message);
  return { id, eleves: await elevesDe(base, id) };
}

/** Un adulte connecté, ses écrans d'aide déjà masqués, et son accès à la base pour préparer la situation. */
export async function adultePret(page: Page): Promise<{ compte: Compte; base: SupabaseClient }> {
  const compte = await creerCompte();
  const base = await baseDe(compte);
  await masquerAides(base, compte);
  await connecter(page, compte);
  await page.waitForURL(/\/projets$/);
  return { compte, base };
}

/** Tire un élément à la souris et le pose sur un autre : le glisser-déposer du plan (F03.1). */
export async function tirer(page: Page, source: Locator, cible: Locator): Promise<void> {
  await source.scrollIntoViewIfNeeded();
  const a = (await source.boundingBox())!;
  await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2);
  await page.mouse.down();
  await page.mouse.move(a.x + a.width / 2 + 14, a.y + a.height / 2 + 14, { steps: 4 });
  const b = (await cible.boundingBox())!;
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 16 });
  await page.mouse.move(b.x + b.width / 2 + 2, b.y + b.height / 2 + 2, { steps: 2 });
  await page.waitForTimeout(200);
  await page.mouse.up();
}

/** Les titres des chapitres d'une partie, dans l'ordre de l'écran. */
export const chapitresDeLaPartie = (page: Page, partie: string): Promise<string[]> =>
  page.getByRole("region", { name: partie, exact: true }).locator(".etiquette h3").allTextContents();

/** Les références des scènes du chapitre ouvert, dans l'ordre de l'écran. */
export const scenesDuChapitre = (page: Page): Promise<string[]> => page.locator(".fiches .fiche__ref").allTextContents();

export const MESSAGE = (page: Page) => page.locator(".message");
