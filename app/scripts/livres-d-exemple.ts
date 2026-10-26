/**
 * Les livres d'exemple du site (plan, point 3 de « Suite recommandée après l'ouverture ») :
 * écrits par Claude avec les aides de l'application, dans les limites gratuites, présentés
 * comme des livres d'exemple, jamais comme le travail d'une vraie classe. Chacun est un projet
 * de classe sans classe ni élève, sur le compte qui le reçoit.
 *
 *   npm run livres:exemple -- passeurs                    charge le livre fini dans la base locale (compte local)
 *   npm run livres:exemple -- passeurs --refaire          le retire, puis le recharge
 *   npm run livres:exemple -- passeurs --retirer          le retire seulement, avec ses images
 *
 *   npm run livres:exemple -- passeurs --production adresse         dit ce qui serait fait dans la vraie base
 *   npm run livres:exemple -- passeurs --production adresse --oui   le fait (« --refaire » s'y ajoute de même)
 *
 * Pour l'écrire, en local seulement :
 *   npm run livres:exemple -- passeurs --brouillon        crée le projet de travail d'après la conception
 *                                                         (scripts/exemples/<livre>.ts), sans IA
 *   npm run livres:exemple -- passeurs --exporter         garde le projet fini de la base locale dans
 *                                                         l'instantané scripts/exemples/<livre>/ (sous Git)
 *
 * Le livre se recharge depuis cet instantané, tel qu'il était fini : textes, images, ordre et
 * numéros fixes, mise en page et étapes du Livre déclarées ; aucune aide n'est rappelée. Seul le
 * PDF définitif se refait, dans l'application. Rien d'autre n'est touché sur le compte.
 */
import { randomUUID } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { Client } from "pg";
import { ciblesDe, nettoyerTexte, type Texte } from "@/domaine/copie";
import { hasard, melangeInitial, type PlanNumerote } from "@/domaine/numeros";
import { lireImage } from "@/serveur/images";
import { adresseDeProduction, lireEnv, masquer, racine } from "./base-de-production";
import type { Conception } from "./exemples/conception";
import { livre as dragon } from "./exemples/dragon";
import * as passeurs from "./exemples/passeurs-de-brume";

const LIVRES: Record<string, { conception: Conception; dossier: string }> = {
  passeurs: { conception: passeurs, dossier: "passeurs-de-brume" },
  dragon: { conception: dragon, dossier: "bouquin-mene-l-enquete" },
};
type CleLivre = keyof typeof LIVRES;
const TYPE_DE: Record<string, string> = { png: "image/png", webp: "image/webp", jpeg: "image/jpeg" };

const locale = (adresse: string): boolean => {
  try {
    return ["127.0.0.1", "localhost"].includes(new URL(adresse).hostname);
  } catch {
    return false;
  }
};

const options = process.argv.slice(2);
const cle = options.find((o) => o in LIVRES) as CleLivre | undefined;
const brouillon = options.includes("--brouillon");
const exporter = options.includes("--exporter");
const retirerSeulement = options.includes("--retirer");
const refaire = options.includes("--refaire") || retirerSeulement;
const production = options.includes("--production");
const oui = options.includes("--oui");

if (!cle) {
  console.error(`Nommez le livre : ${Object.keys(LIVRES).join(", ")}.`);
  process.exit(1);
}
if (production && (brouillon || exporter)) {
  console.error("Le brouillon et l'export se font en local seulement.");
  process.exit(1);
}
const livre = LIVRES[cle];
const c = livre.conception;
const dossier = resolve(racine, "scripts/exemples", livre.dossier);

// La base visée, et les clés qui vont avec : jamais celles de l'une pour l'autre
let url: string;
let adresseBase: string;
let cleSecrete: string;
if (production) {
  const env = lireEnv("production.env");
  url = env.get("NEXT_PUBLIC_SUPABASE_URL") ?? "";
  cleSecrete = env.get("SUPABASE_CLE_SECRETE") ?? "";
  if (!url || !cleSecrete || locale(url)) {
    console.error("Il manque NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_CLE_SECRETE dans production.env.");
    process.exit(1);
  }
  adresseBase = adresseDeProduction();
} else {
  config({ path: resolve(racine, ".env.local"), quiet: true });
  url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  adresseBase = process.env.BASE_LOCALE_URL ?? "";
  cleSecrete = process.env.SUPABASE_CLE_SECRETE ?? "";
  if (!locale(url) || !locale(adresseBase)) {
    console.error("Sans « --production », cette commande ne parle qu'à la base locale : lancez « npm run base:demarrer » puis « npm run env:local ».");
    process.exit(1);
  }
}
const ou = production ? "la vraie base" : "la base locale";
const compteLocal = resolve(racine, ".compte-local");
// La première ligne de .compte-local est l'adresse du compte ; la seconde, son mot de passe, n'est pas lue.
const courriel = options.find((o) => !o.startsWith("--") && !(o in LIVRES))
  ?? (!production && existsSync(compteLocal) ? readFileSync(compteLocal, "utf8").split("\n")[0].trim() : "");

const stockage = (seau = "images") => createClient(url, cleSecrete, { auth: { persistSession: false, autoRefreshToken: false } }).storage.from(seau);
type Q = <T = Record<string, unknown>>(texte: string, valeurs?: unknown[]) => Promise<T[]>;

/** Le livre d'exemple sur ce compte : un projet de classe à ce titre, sans classe. */
async function existants(q: Q, compte: string): Promise<string[]> {
  const lignes = await q<{ id: string }>(
    "select id from public.projets where enseignant_id = $1 and titre = any($2) and organisation = 'classe' and classe_id is null",
    [compte, [c.TITRE, ...(c.ANCIENS_TITRES ?? [])]],
  );
  return lignes.map((l) => l.id);
}

async function retirer(q: Q, compte: string, ids: string[]): Promise<void> {
  for (const id of ids) {
    // Ses images, et ses PDF de travail et définitifs
    for (const seau of ["images", "livres"]) {
      const { data } = await stockage(seau).list(`${compte}/${id}`, { limit: 1000 });
      if (data?.length) await stockage(seau).remove(data.map((f) => `${compte}/${id}/${f.name}`));
    }
    await q("delete from public.projets where id = $1", [id]);
  }
}

// ——— Le brouillon : le projet de travail, d'après la conception ———

const SIGNE_DE_L_ACTION = (texte: string): string | undefined =>
  /volonté/i.test(texte) ? "coeur" : /inventaire/i.test(texte) ? "sac" : /(^|\s)(le |du )?dé(?!\p{L})/iu.test(texte) ? "de" : undefined;

async function creerLeBrouillon(q: Q, compte: string): Promise<void> {
  const projetId = randomUUID();
  const scenes = c.PARTIES.flatMap((p) => p.chapitres.flatMap((ch) => ch.scenes));
  const ids = new Map(scenes.map((s) => [s.ref, randomUUID()]));
  const id = (ref: number): string => {
    const v = ids.get(ref);
    if (!v) throw new Error(`Un choix mène à S${String(ref).padStart(3, "0")}, qui n'est pas dans le plan.`);
    return v;
  };
  const instant = (i: number) => `${i} milliseconds`;

  await q(
    `insert into public.projets (id, enseignant_id, organisation, recit, titre, classe_id, visuel_choisi, age_des_lecteurs, heros_absent, style_images, style_autre, consigne_ecriture)
     values ($1, $2, 'classe', 'choix', $3, null, $4, $5, false, $6, $7, $8)`,
    [projetId, compte, c.TITRE, c.VISUEL_DU_PROJET, c.AGE, c.STYLE?.style ?? "lumineuse", c.STYLE?.autre ?? "", c.CONSIGNE_ECRITURE ?? ""],
  );
  const p = c.PREPARATION;
  await q(
    `update public.preparations set univers = $2, personnages = $3, enjeu = $4, rubrique_jeu = true, feuille = $5, regles = $6, formule_renvoi = $7, constructions = $8
     where projet_id = $1`,
    [projetId, p.univers, p.personnages, p.enjeu, JSON.stringify(c.FEUILLE), p.regles, p.formuleRenvoi, [...p.constructions]],
  );
  for (const [i, perso] of c.PERSONNAGES.entries()) {
    // Une planche déjà dessinée (les mascottes) devient le portrait, déposée comme à l'import
    let portrait: string | null = null;
    if (perso.planche) {
      const octets = readFileSync(resolve(racine, perso.planche));
      const lu = lireImage(new Uint8Array(octets));
      if (!lu) throw new Error(`Planche illisible : ${perso.planche}`);
      portrait = randomUUID();
      const chemins = [`${compte}/${projetId}/${portrait}.jpg`, `${compte}/${projetId}/${portrait}-v.jpg`];
      for (const ch of chemins) {
        const { error } = await stockage().upload(ch, octets, { contentType: TYPE_DE[lu.format], upsert: true });
        if (error) throw new Error(`Planche non déposée : ${error.message}`);
      }
      await q("insert into public.images (id, projet_id, enseignant_id, chemin, chemin_vignette, largeur, hauteur, format) values ($1, $2, $3, $4, $5, $6, $7, $8)", [
        portrait, projetId, compte, chemins[0], chemins[1], lu.largeur, lu.hauteur, lu.format,
      ]);
    }
    await q(
      "insert into public.personnages (projet_id, enseignant_id, nom, autres_noms, heros, description, rang, portrait_id, cree_le) values ($1, $2, $3, $4, $5, $6, $7, $8, now() + $9::interval)",
      [projetId, compte, perso.nom, perso.autresNoms, perso.heros, perso.description, i, portrait, instant(i)],
    );
  }
  for (const [i, [nom, description]] of c.OBJETS.entries()) {
    await q("insert into public.objets (projet_id, enseignant_id, nom, description, cree_le) values ($1, $2, $3, $4, now() + $5::interval)", [projetId, compte, nom, description, instant(i)]);
  }
  for (const [i, [texte, signe]] of c.FORMULES.entries()) {
    await q("insert into public.formules (projet_id, enseignant_id, texte, signe, cree_le) values ($1, $2, $3, $4, now() + $5::interval)", [projetId, compte, texte, signe, instant(i)]);
  }

  const plan: PlanNumerote = { departSceneId: id(c.DEPART), parties: [] };
  for (const [rangPartie, partie] of c.PARTIES.entries()) {
    const partieId = randomUUID();
    await q("insert into public.parties (id, projet_id, enseignant_id, titre, rang, visuel_choisi) values ($1, $2, $3, $4, $5, $6)", [
      partieId, projetId, compte, partie.titre, rangPartie, partie.visuel,
    ]);
    const numerotee: PlanNumerote["parties"][number] = { id: partieId, groupeAvecPrecedente: false, ouvertureSceneId: null, chapitres: [] };
    plan.parties.push(numerotee);
    for (const [rangChapitre, chapitre] of partie.chapitres.entries()) {
      const chapitreId = randomUUID();
      await q(
        "insert into public.chapitres (id, partie_id, projet_id, enseignant_id, titre, rang, couleur, resume, visuel_choisi) values ($1, $2, $3, $4, $5, $6, $7, $8, $9)",
        [chapitreId, partieId, projetId, compte, chapitre.titre, rangChapitre, chapitre.couleur, chapitre.resume, chapitre.visuel],
      );
      for (const [rang, s] of chapitre.scenes.entries()) {
        await q(
          "insert into public.scenes (id, chapitre_id, projet_id, enseignant_id, reference, titre, consigne, rang, fin, prise_par_enseignant) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, true)",
          [id(s.ref), chapitreId, projetId, compte, s.ref, s.titre, s.consigne, rang, s.fin === true],
        );
      }
      numerotee.chapitres.push({
        horsLivre: false,
        scenes: chapitre.scenes.map((s) => ({ id: id(s.ref), horsLivre: false, rangLivre: null, numeroFixe: s.numero ?? null })),
      });
    }
  }
  await q("update public.projets set reference_suivante = $2, depart_scene_id = $3 where id = $1", [projetId, Math.max(...scenes.map((s) => s.ref)) + 1, id(c.DEPART)]);

  // Les textes : le récit de base, les actions de jeu, puis les choix ; les liens s'en déduisent
  let poses = 0;
  for (const s of scenes) {
    const blocs: unknown[] = [];
    for (const t of c.TEXTES_DE_BASE[s.ref] ?? []) blocs.push({ type: "p", id: randomUUID(), children: [{ text: t }] });
    for (const t of c.ACTIONS[s.ref] ?? []) {
      const signe = SIGNE_DE_L_ACTION(t);
      blocs.push({ type: "action", id: randomUUID(), ...(signe ? { signe } : {}), children: [{ text: t }] });
    }
    const choix = s.choix ?? [];
    if (s.phrase) {
      blocs.push({
        type: "choix", id: randomUUID(), libelle: choix[0]?.[0] ?? "",
        children: s.phrase.map((m) => (typeof m === "string" ? { text: m } : { type: "renvoi", id: randomUUID(), cible: id(choix[m][1]), libelle: choix[m][0], children: [{ text: "" }] })),
      });
    } else {
      for (const [libelle, vers] of choix) {
        const construction = p.constructions[poses % p.constructions.length];
        poses += 1;
        blocs.push({ type: "choix", id: randomUUID(), auto: true, libelle, construction, cible: id(vers), children: [{ text: "" }] });
      }
    }
    if (s.cachee) blocs.push({ type: "liaison", id: randomUUID(), cible: id(s.cachee.cible), libelle: s.cachee.libelle, children: [{ text: "" }] });
    const propre = nettoyerTexte(blocs) as Texte | null;
    if (!propre || propre.length !== blocs.length || ciblesDe(propre).length !== choix.length + (s.cachee ? 1 : 0)) {
      throw new Error(`Le texte de S${String(s.ref).padStart(3, "0")} n'est pas un texte de scène.`);
    }
    await q("update public.scenes set texte = $2, version = 1, ecrit_le = now() where id = $1", [id(s.ref), JSON.stringify(propre)]);
  }
  for (const s of scenes) if (s.numero) await q("update public.scenes set numero_fixe = $2 where id = $1", [id(s.ref), s.numero]);

  // L'ordre du livre, comme l'application l'établit au premier choix (F11.5)
  const liens = await q<{ scene_id: string; cible_id: string | null }>("select scene_id, cible_id from public.liens where projet_id = $1", [projetId]);
  const parOrigine = new Map<string, string[]>();
  for (const l of liens) if (l.cible_id) parOrigine.set(l.scene_id, [...(parOrigine.get(l.scene_id) ?? []), l.cible_id]);
  const rangs = melangeInitial(plan, [...parOrigine.values()], hasard(2026));
  await q("select set_config('request.jwt.claims', $1, true)", [JSON.stringify({ role: "service_role" })]);
  const [ordre] = await q<{ fait: boolean }>("select public.etablir_ordre($1, $2) as fait", [projetId, JSON.stringify(Object.fromEntries(rangs))]);
  if (!ordre?.fait) throw new Error("L'ordre du livre n'a pas pu être établi.");
  await q("update public.enseignants set dernier_projet_id = $2 where id = $1", [compte, projetId]);
  console.log(`Brouillon de « ${c.TITRE} » créé dans ${ou} : ${scenes.length} scènes, dont ${Object.keys(c.TEXTES_DE_BASE).length} avec leur texte de base.`);
}

// ——— L'instantané : le livre fini, gardé sous Git ———

/** Les tables du livre et la colonne qui les rattache au projet, dans l'ordre où elles se rechargent. */
const TABLES = [
  ["parties", "projet_id"], ["chapitres", "projet_id"], ["personnages", "projet_id"], ["objets", "projet_id"], ["formules", "projet_id"], ["scenes", "projet_id"],
  // Les « C'est voulu » de « Vérifier les chemins » et de « Mettre en page », dont la clé nomme les scènes
  ["avertissements_acceptes", "projet_id"],
] as const;
/** Ce qui ne se garde pas : le compte, les dates de création, ce que la base recalcule. */
const SANS = new Set(["enseignant_id", "accepte_le", "cree_le", "supprime_le", "prise_par_eleve", "cree_par_eleve", "geste_eleve", "geste_avant", "geste_le", "ecrit_par", "images_vues", "texte_vide", "classe_id", "dernier_onglet", "lecture_ouverte"]);
type Instantane = {
  projet: Record<string, unknown>;
  preparation: Record<string, unknown>;
  tables: Record<string, Record<string, unknown>[]>;
  images: { id: string; fichier: string; largeur: number; hauteur: number; format: string }[];
};

const garder = (ligne: Record<string, unknown>): Record<string, unknown> => Object.fromEntries(Object.entries(ligne).filter(([k]) => !SANS.has(k)));

async function exporterLeLivre(q: Q, compte: string): Promise<void> {
  const [projetId, ...autres] = await existants(q, compte);
  if (!projetId) throw new Error(`Aucun « ${c.TITRE} » d'exemple dans ${ou}.`);
  if (autres.length) throw new Error(`Plusieurs « ${c.TITRE} » d'exemple dans ${ou} : n'en gardez qu'un.`);
  const [projet] = await q("select * from public.projets where id = $1", [projetId]);
  const [preparation] = await q("select * from public.preparations where projet_id = $1", [projetId]);
  const tables: Instantane["tables"] = {};
  for (const [table] of TABLES) {
    const filtre = table === "parties" || table === "chapitres" || table === "scenes" ? " and supprime_le is null" : "";
    tables[table] = (await q(`select * from public.${table} where projet_id = $1${filtre} order by ${table === "scenes" ? "reference" : table === "objets" || table === "formules" ? "cree_le" : table === "avertissements_acceptes" ? "cle" : "rang, cree_le"}`, [projetId])).map(garder);
  }
  // Les images que le livre emploie encore, ou que le projet montre (portraits, repérage)
  const lignes = await q<{ id: string; chemin: string; largeur: number; hauteur: number; format: string }>(
    "select id, chemin, largeur, hauteur, format from public.images where projet_id = $1 order by cree_le", [projetId],
  );
  const texteDuLivre = JSON.stringify({ projet, tables, preparation });
  const employees = lignes.filter((i) => texteDuLivre.includes(i.id));
  rmSync(resolve(dossier, "images"), { recursive: true, force: true });
  mkdirSync(resolve(dossier, "images"), { recursive: true });
  const images: Instantane["images"] = [];
  for (const [n, i] of employees.entries()) {
    const { data, error } = await stockage().download(i.chemin);
    if (error || !data) throw new Error(`Image illisible : ${i.chemin}`);
    const fichier = `${String(n + 1).padStart(2, "0")}.${i.format === "jpeg" ? "jpg" : i.format}`;
    writeFileSync(resolve(dossier, "images", fichier), Buffer.from(await data.arrayBuffer()));
    images.push({ id: i.id, fichier, largeur: i.largeur, hauteur: i.hauteur, format: i.format });
  }
  const instantane: Instantane = { projet: garder(projet), preparation: garder(preparation), tables, images };
  delete instantane.preparation.projet_id;
  writeFileSync(resolve(dossier, "livre.json"), `${JSON.stringify(instantane, null, 1)}\n`);
  console.log(`« ${c.TITRE} » exporté dans scripts/exemples/${livre.dossier}/ : ${tables.scenes.length} scènes, ${images.length} images.`);
}

/** Recharge l'instantané sur le compte : de nouvelles identités partout, les mêmes liens entre elles. */
async function chargerLeLivre(q: Q, compte: string): Promise<void> {
  const chemin = resolve(dossier, "livre.json");
  if (!existsSync(chemin)) throw new Error(`L'instantané de « ${c.TITRE} » manque : écrivez d'abord le livre (« --brouillon »), puis « --exporter ».`);
  const brut = readFileSync(chemin, "utf8");
  const lu = JSON.parse(brut) as Instantane;
  // Toute identité du livre est remplacée, partout où elle paraît (textes, mise en page, portraits)
  const anciennes = new Set<string>([String(lu.projet.id), ...lu.images.map((i) => i.id), ...Object.values(lu.tables).flatMap((t) => t.flatMap((l) => (l.id ? [String(l.id)] : [])))]);
  const nouvelles = new Map([...anciennes].map((a) => [a, randomUUID()]));
  const remplace = (v: string) => v.replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/g, (m) => nouvelles.get(m) ?? m);
  const s = JSON.parse(remplace(brut)) as Instantane;
  const projetId = String(s.projet.id);

  // Seules les colonnes que la base visée connaît : la base locale peut avoir une migration d'avance
  const colonnes = new Map<string, Map<string, string>>();
  for (const t of ["projets", "preparations", ...TABLES.map(([t]) => t)]) {
    const r = await q<{ column_name: string; data_type: string }>("select column_name, data_type from information_schema.columns where table_schema = 'public' and table_name = $1", [t]);
    colonnes.set(t, new Map(r.map((x) => [x.column_name, x.data_type])));
  }
  // Une colonne json reçoit son texte JSON, tableau compris ; une colonne tableau, le tableau lui-même
  const valeur = (table: string, k: string, v: unknown) => (v !== null && /json/.test(colonnes.get(table)!.get(k) ?? "") ? JSON.stringify(v) : v);
  const inserer = async (table: string, ligne: Record<string, unknown>, sauf: string[] = []) => {
    const cles = Object.keys(ligne).filter((k) => colonnes.get(table)!.has(k) && !sauf.includes(k));
    const valeurs = cles.map((k) => valeur(table, k, ligne[k]));
    await q(
      `insert into public.${table} (enseignant_id, ${cles.join(", ")}) values ($1, ${cles.map((_, i) => `$${i + 2}`).join(", ")})`,
      [compte, ...valeurs],
    );
  };

  // Le projet d'abord, sans ce qui renvoie à ses scènes ni aux pages, posés à la fin
  const finDuProjet = ["depart_scene_id", "image_id", "mise_en_page", "pages_du_livre", "ordre_pages"];
  await inserer("projets", { ...s.projet, classe_id: null }, finDuProjet);
  const prep = Object.entries(s.preparation).filter(([k]) => colonnes.get("preparations")!.has(k));
  await q(`update public.preparations set ${prep.map(([k], i) => `${k} = $${i + 2}`).join(", ")} where projet_id = $1`, [
    projetId, ...prep.map(([k, v]) => valeur("preparations", k, v)),
  ]);

  // Les images, déposées comme à l'import
  for (const i of s.images) {
    const octets = readFileSync(resolve(dossier, "images", lu.images.find((a) => nouvelles.get(a.id) === i.id)!.fichier));
    const chemins = [`${compte}/${projetId}/${i.id}.jpg`, `${compte}/${projetId}/${i.id}-v.jpg`];
    for (const ch of chemins) {
      const { error } = await stockage().upload(ch, octets, { contentType: TYPE_DE[i.format] ?? "image/jpeg", upsert: true });
      if (error) throw new Error(`Image non déposée : ${error.message}`);
    }
    await q("insert into public.images (id, projet_id, enseignant_id, chemin, chemin_vignette, largeur, hauteur, format) values ($1, $2, $3, $4, $5, $6, $7, $8)", [
      i.id, projetId, compte, chemins[0], chemins[1], i.largeur, i.hauteur, i.format,
    ]);
  }

  // Le plan, puis les textes des scènes une fois toutes en place : les liens s'en déduisent
  for (const [table] of TABLES) {
    for (const ligne of s.tables[table]) await inserer(table, ligne, table === "scenes" ? ["texte"] : []);
  }
  for (const ligne of s.tables.scenes) {
    await q("update public.scenes set texte = $2 where id = $1", [ligne.id, JSON.stringify(ligne.texte)]);
  }
  // Poser les textes a noté chaque chemin comme neuf : le livre arrive tel qu'il était vérifié,
  // ses « C'est voulu » et sa déclaration « J'ai vérifié les chemins » tenant toujours (F11-AC75)
  await q("delete from public.chemins_changes where projet_id = $1", [projetId]);
  for (const k of finDuProjet.filter((k) => colonnes.get("projets")!.has(k))) {
    const v = s.projet[k];
    await q(`update public.projets set ${k} = $2 where id = $1`, [projetId, valeur("projets", k, v)]);
  }
  console.log(`« ${c.TITRE} » chargé dans ${ou} pour ${courriel} : ${s.tables.scenes.length} scènes, ${s.images.length} images. Le PDF définitif se refait dans « Imprimer et partager ».`);
}

async function principal(): Promise<void> {
  if (!courriel) throw new Error(production ? "Nommez le compte : « --production adresse ». " : "Aucun compte local : lancez « npm run compte:local ».");
  const base = new Client({ connectionString: adresseBase });
  await base.connect();
  const q: Q = async (texte, valeurs = []) => (await base.query(texte, valeurs)).rows;
  try {
    const [compte] = await q<{ id: string }>("select e.id from public.enseignants e join auth.users u on u.id = e.id where u.email = $1", [courriel]);
    if (!compte) throw new Error(`Aucun compte « ${courriel} » dans ${ou}.`);
    if (exporter) return await exporterLeLivre(q, compte.id);

    const deja = await existants(q, compte.id);
    if (deja.length && !refaire) throw new Error(`« ${c.TITRE} » d'exemple est déjà dans ${ou}. Pour le remettre à neuf, ajoutez « --refaire ».`);
    if (production && !oui) {
      const faire = retirerSeulement ? "retirer" : deja.length ? "retirer puis recharger" : "charger";
      console.log(`Dans la vraie base, pour « ${courriel} » : ${faire} le livre d'exemple « ${c.TITRE} », avec ses images.`);
      console.log("Rien n'est fait. Pour le faire, ajoutez « --oui ».");
      return;
    }
    await retirer(q, compte.id, deja);
    if (retirerSeulement) {
      console.log(deja.length ? `« ${c.TITRE} » d'exemple retiré de ${ou}.` : `Aucun « ${c.TITRE} » d'exemple dans ${ou}.`);
      return;
    }
    await q("begin");
    try {
      if (brouillon) await creerLeBrouillon(q, compte.id);
      else await chargerLeLivre(q, compte.id);
      await q("commit");
    } catch (erreur) {
      await q("rollback");
      throw erreur;
    }
  } finally {
    await base.end();
  }
}

principal().catch((erreur: Error) => {
  console.error(masquer(erreur.message));
  process.exit(1);
});
