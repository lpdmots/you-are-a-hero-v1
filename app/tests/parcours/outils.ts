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

// ——— Étape 3 : la copie d'une scène ———

export type Situation = {
  compte: Compte; base: SupabaseClient; classe: ClasseCreee; codes: Record<string, string>;
  eleves: Record<string, { id: string; inscriptionId: string }>; projet: string;
  lisiere: { id: string; scenes: string[] }; sanctuaire: { id: string; scenes: string[] };
};

/**
 * Mme Laurent, sa classe et « Les passeurs de brume » : Alice et Bilal dans « La lisière »
 * (S001 « Le sentier », S002 « Le pont »), Chloé dans « Le sanctuaire » (S003 « L'autel »).
 */
export async function classeQuiEcrit(page: Page, prenoms = ["Alice", "Bilal", "Chloé"]): Promise<Situation> {
  const compte = await creerCompte();
  const base = await baseDe(compte);
  await masquerAides(base, compte);
  await connecter(page, compte);
  await page.waitForURL(/\/projets$/);
  await nommer(page, compte, "Mme Laurent");
  const classe = await creerClasse(page, "CM1-CM2");
  await inscrire(page, classe.id, prenoms);
  const codes = await lireCodes(page, classe.id);
  const eleves = await elevesDe(base, classe.id);
  const projet = await semerProjet(base, compte, "classe", "choix", "Les passeurs de brume", classe.id);
  const foret = await semerPartie(base, projet, "La forêt", [
    { titre: "La lisière", scenes: ["Le sentier", "Le pont"] },
    { titre: "Le sanctuaire", scenes: ["L’autel"] },
  ]);
  const [lisiere, sanctuaire] = foret.chapitres;
  await semerAttribution(base, lisiere.id, [{ eleve: eleves.Alice.id }, { eleve: eleves.Bilal.id, profil: "organisation" }]);
  if (eleves.Chloé) await semerAttribution(base, sanctuaire.id, [{ eleve: eleves.Chloé.id }]);
  return { compte, base, classe, codes, eleves, projet, lisiere, sanctuaire };
}

/** Un poste de la salle où un élève s'est identifié. */
export async function posteDe(browser: Browser, s: Situation, prenom: string): Promise<{ contexte: BrowserContext; page: Page }> {
  const p = await autrePoste(browser);
  await ouvrirLaClasse(p.page, s.classe.identifiant, s.classe.motDePasse);
  await taperCode(p.page, prenom, s.codes[prenom]);
  await p.page.waitForURL(/\/travail$/);
  return p;
}

/** La copie où l'on écrit : le texte de la scène, dans l'éditeur. */
export const copie = (page: Page): Locator => page.locator('.copie__texte[contenteditable="true"]');
export const pied = (page: Page): Locator => page.locator(".copie__pied");

/** Pose le curseur à la fin du texte et tape, comme au clavier. */
export async function ecrire(page: Page, texte: string, delai = 0): Promise<void> {
  await copie(page).click();
  await page.keyboard.press("ControlOrMeta+End");
  // Slate reporte la sélection du navigateur avec un léger retard
  await page.waitForTimeout(150);
  await page.keyboard.type(texte, { delay: delai });
}

type BlocEnBase = { type: string; id: string; children: { text?: string; bold?: boolean; italic?: boolean; underline?: boolean }[] };
export type SceneEnBase = { texte: BlocEnBase[]; version: number; texte_vide: boolean };

export async function sceneEnBase(sceneId: string): Promise<SceneEnBase> {
  return (await sql<SceneEnBase>("select texte, version, texte_vide from scenes where id = $1", [sceneId]))[0];
}

/** Les paragraphes enregistrés d'une scène, mise en forme entre signes : *gras*, /italique/, _souligné_. */
export const enClair = (texte: BlocEnBase[]): string[] =>
  texte.map((b) => b.children.map((l) => `${l.bold ? "*" : ""}${l.italic ? "/" : ""}${l.underline ? "_" : ""}${l.text ?? ""}${l.underline ? "_" : ""}${l.italic ? "/" : ""}${l.bold ? "*" : ""}`).join(""));

export const motsEnBase = async (sceneId: string): Promise<string> => enClair((await sceneEnBase(sceneId)).texte).join(" / ");

/** Attend que le texte de la scène contienne ces mots dans la base : l'enregistrement est arrivé. */
export async function attendreEnBase(sceneId: string, mots: string | RegExp): Promise<void> {
  await expect.poll(() => motsEnBase(sceneId), { timeout: 15_000 }).toMatch(typeof mots === "string" ? new RegExp(mots.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")) : mots);
}

/** Écrit le texte d'une scène sans passer par l'écran, au nom de l'adulte. */
export async function semerTexte(base: SupabaseClient, sceneId: string, paragraphes: string[]): Promise<void> {
  const { version } = await sceneEnBase(sceneId);
  const { data, error } = await base.rpc("enregistrer_texte", {
    p_scene: sceneId, p_version: version,
    p_texte: paragraphes.map((t) => ({ type: "p", id: randomUUID(), children: [{ text: t }] })),
  });
  if (error || (data as { etat: string }).etat !== "enregistre") throw new Error(error?.message ?? "Texte non enregistré");
}

/** Les textes gardés à part d'une scène, tels que la base les tient. */
export const copiesGardees = (sceneId: string) =>
  sql<{ id: string; sorte: string; eleve_id: string | null; texte: BlocEnBase[] }>(
    "select id, sorte, eleve_id, texte from copies_recuperation where scene_id = $1 and retire_le is null order by garde_le, id",
    [sceneId],
  );

/** Met dans le presse-papiers ce qu'un autre logiciel y aurait mis, puis colle au clavier. */
export async function collerDepuisAilleurs(page: Page, html: string, brut: string): Promise<void> {
  await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.evaluate(
    async ([h, t]) => {
      await navigator.clipboard.write([new ClipboardItem({ "text/html": new Blob([h], { type: "text/html" }), "text/plain": new Blob([t], { type: "text/plain" }) })]);
    },
    [html, brut] as const,
  );
  await page.keyboard.press("ControlOrMeta+v");
}

/** La page d'un poste vérifie ses accès tout de suite, sans attendre la minute. */
export const veiller = (page: Page): Promise<void> => page.evaluate(() => void window.dispatchEvent(new Event("veille-poste")));

// ——— Étape 3, lot 2 : phrases de choix ———

export type BlocSeme = Record<string, unknown> & { id: string; type: string };
export const recit = (texte: string, id = randomUUID()): BlocSeme => ({ type: "p", id, children: [{ text: texte }] });
export const choixAuto = (libelle: string, cible: string | null, construction = "neutre", id = randomUUID()): BlocSeme => ({
  type: "choix", id, auto: true, libelle, construction, cible, children: [{ text: "" }],
});
export const renvoi = (cible: string | null, id = randomUUID()) => ({ type: "renvoi", id, cible, children: [{ text: "" }] });
export const choixPerso = (libelle: string, enfants: (string | ReturnType<typeof renvoi>)[], id = randomUUID()): BlocSeme => ({
  type: "choix", id, libelle, children: enfants.map((x) => (typeof x === "string" ? { text: x } : x)),
});

/** Écrit les blocs d'une scène sans passer par l'écran, au nom de l'adulte. */
export async function semerBlocs(base: SupabaseClient, sceneId: string, blocs: BlocSeme[]): Promise<void> {
  const { version } = await sceneEnBase(sceneId);
  const { data, error } = await base.rpc("enregistrer_texte", { p_scene: sceneId, p_version: version, p_texte: blocs });
  if (error || (data as { etat: string }).etat !== "enregistre") throw new Error(error?.message ?? "Texte non enregistré");
}

type PointDeCopie = { bloc: number; enfant?: number; offset: number };

/** Pose le curseur, ou une sélection, par programme ; les frappes qui suivent sont réelles. */
export async function selectionner(page: Page, debut: PointDeCopie, fin: PointDeCopie = debut): Promise<void> {
  await page.evaluate(
    ([d, f]) => {
      const e = (window as unknown as { __copie: { tf: { focus: () => void; select: (s: unknown) => void } } }).__copie;
      const point = (p: PointDeCopie) => ({ path: [p.bloc, p.enfant ?? 0], offset: p.offset });
      e.tf.focus();
      e.tf.select({ anchor: point(d), focus: point(f) });
    },
    [debut, fin] as const,
  );
  await copie(page).focus();
  await page.waitForTimeout(120);
}

/** Les blocs que tient l'éditeur, avant tout enregistrement. */
export const blocsEditeur = (page: Page): Promise<BlocSeme[]> =>
  page.evaluate(() => JSON.parse(JSON.stringify((window as unknown as { __copie: { children: unknown } }).__copie.children)) as BlocSeme[]);

/** Les types des blocs enregistrés d'une scène, dans l'ordre. */
export const typesEnBase = async (sceneId: string): Promise<string[]> => (await sceneEnBase(sceneId)).texte.map((b) => b.type);

/** Les liens du projet : « S001 > S003 », ou « S001 > ? » sans destination. */
export async function liensEnBase(projetId: string): Promise<string[]> {
  const lignes = await sql<{ de: number; vers: number | null }>(
    "select o.reference as de, c.reference as vers from liens l join scenes o on o.id = l.scene_id left join scenes c on c.id = l.cible_id where l.projet_id = $1 order by o.reference, l.rang",
    [projetId],
  );
  return lignes.map((l) => `S${String(l.de).padStart(3, "0")} > ${l.vers === null ? "?" : `S${String(l.vers).padStart(3, "0")}`}`);
}

export const BANDEAU = (page: Page): Locator => page.locator(".copie__message");
export const FICHE = (page: Page): Locator => page.locator(".cx").first();
export const PHRASES = (page: Page): Locator => copie(page).locator(".phrase-choix");

/** Attend que le pied de la copie dise « Enregistré », après le geste qui vient d'être fait. */
export async function attendreEnregistre(page: Page): Promise<void> {
  // Le temps que la copie note le changement : « Enregistré » d'avant le geste ne compte pas
  await page.waitForTimeout(250);
  await expect(pied(page)).toHaveText("Enregistré", { timeout: 8_000 });
}

/** Ce que contient le presse-papiers, en texte simple. */
export async function presseTexte(page: Page): Promise<string> {
  await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
  return page.evaluate(() => navigator.clipboard.readText());
}

/** Les numéros du livre tels que l'application les calcule, d'après la base : scène → numéro. */
export async function numerosEnBase(projetId: string): Promise<Record<string, number>> {
  const { numeroter } = await import("../../src/domaine/numeros");
  const [{ depart }] = await sql<{ depart: string | null }>("select depart_scene_id as depart from projets where id = $1", [projetId]);
  const parties = await sql<{ id: string; groupe: boolean; ouverture: string | null }>(
    "select id, groupe_avec_precedente as groupe, ouverture_scene_id as ouverture from parties where projet_id = $1 and supprime_le is null order by rang, cree_le",
    [projetId],
  );
  const chapitres = await sql<{ id: string; partie_id: string; hors: boolean }>(
    "select id, partie_id, hors_livre as hors from chapitres where projet_id = $1 and supprime_le is null order by rang, cree_le",
    [projetId],
  );
  const scenes = await sql<{ id: string; chapitre_id: string; hors: boolean; rang_livre: number | null; numero_fixe: number | null }>(
    "select id, chapitre_id, hors_livre as hors, rang_livre, numero_fixe from scenes where projet_id = $1 and supprime_le is null order by rang, cree_le",
    [projetId],
  );
  const n = numeroter({
    departSceneId: depart,
    parties: parties.map((p) => ({
      id: p.id, groupeAvecPrecedente: p.groupe, ouvertureSceneId: p.ouverture,
      chapitres: chapitres.filter((c) => c.partie_id === p.id).map((c) => ({
        horsLivre: c.hors,
        scenes: scenes.filter((s) => s.chapitre_id === c.id).map((s) => ({ id: s.id, horsLivre: s.hors, rangLivre: s.rang_livre, numeroFixe: s.numero_fixe })),
      })),
    })),
  });
  return Object.fromEntries(n.de);
}
