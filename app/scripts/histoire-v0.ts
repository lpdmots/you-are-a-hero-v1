/**
 * Importe une histoire de la V0 (lue chez Sanity, en lecture seule) dans un projet personnel
 * du compte, pour la lire en exemple : plan, textes, choix, actions de jeu, images, objets,
 * feuille d'aventure, pages de présentation et numéros du livre imprimé. Les scènes sont
 * « prêtes », « Relire » et « Vérifier les chemins » terminées, « Mettre en page » ouverte :
 * reste à juger l'aperçu, puis à partager depuis l'application.
 *
 *   npm run histoire:v0 -- labyrinthe                 dans la base locale, pour le compte local
 *   npm run histoire:v0 -- labyrinthe --refaire       retire le projet déjà importé, puis le recharge
 *   npm run histoire:v0 -- labyrinthe --essai         convertit et dit ce qui serait fait, sans rien écrire
 *
 *   npm run histoire:v0 -- labyrinthe --production adresse         dit ce qui serait fait dans la vraie base
 *   npm run histoire:v0 -- labyrinthe --production adresse --oui   le fait
 *
 * Seul le projet de ce titre est touché par « --refaire », avec ses images.
 */
import { randomUUID } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { Client } from "pg";
import { nettoyerTexte, type Lettres } from "@/domaine/copie";
import { numeroter, type PlanNumerote } from "@/domaine/numeros";
import type { Feuille } from "@/domaine/preparation";
import { cheminImage, cheminVignette, lireImage, POIDS_MAX_IMAGE, POIDS_MAX_VIGNETTE, SEAU } from "@/serveur/images";
import { adresseDeProduction, lireEnv, masquer, racine } from "./base-de-production";
import { convertir, corpsDuLivre, imagesDe, texteLeger, type DonneesV0, type SceneV0 } from "./v0/convertir";

// ——— Les histoires de la V0, et ce qui ne se déduit pas de leurs données ———

type Histoire = {
  id: string;
  titresDesParties: string[];
  /** La ligne et l'année de la page de titre : la classe, sans prénoms */
  ligne: string;
  annee: string;
  /** La préface qui devient « Comment lire ce livre », et le titre où commencent les règles du jeu */
  preface: string;
  regles: string;
  /** La préface dont l'image devient la feuille d'aventure imprimée */
  ficheAventure: string;
  feuille: Feuille;
  marqueFin: string;
};

const HISTOIRES: Record<string, Histoire> = {
  labyrinthe: {
    id: "7s63ToBX20ba20OQzQ0GXv",
    titresDesParties: ["Première partie", "Deuxième partie"],
    ligne: "Les CE2-CM1-CM2 de l’école de Müllheim",
    annee: "2025-2026",
    preface: "Préface 3",
    regles: "Règles du jeu et conseils",
    ficheAventure: "Fiche aventure",
    // La fiche aventure de la V0 : volonté, compétences, inventaire, notes, unités de temps, sauvegardes
    feuille: {
      on: true,
      des: 0,
      sections: [
        { id: "heros", type: "compteurs", titre: "Ton héros", compteurs: [{ id: "volonte", nom: "Volonté", depart: 3 }, { id: "temps", nom: "Unités de temps", depart: 4 }] },
        { id: "competences", type: "liste", titre: "Compétences (3)", lignes: 3 },
        { id: "inventaire", type: "liste", titre: "Inventaire", lignes: 8 },
        { id: "notes", type: "notes", titre: "Notes" },
        { id: "sauvegarde", type: "notes", titre: "Sauvegarde (50, 100, 150)" },
      ],
    },
    marqueFin: "Fin de l’histoire",
  },
};

const SANITY = "https://wf39vc37.api.sanity.io/v2021-10-21/data/query/production";
const CDN = "https://cdn.sanity.io/images/wf39vc37/production";

const options = process.argv.slice(2);
const cle = options.find((o) => !o.startsWith("--") && o in HISTOIRES) ?? "";
const refaire = options.includes("--refaire");
const essai = options.includes("--essai");
const production = options.includes("--production");
const oui = options.includes("--oui");

const locale = (adresse: string): boolean => {
  try {
    return ["127.0.0.1", "localhost"].includes(new URL(adresse).hostname);
  } catch {
    return false;
  }
};

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
  if (!essai && (!locale(url) || !locale(adresseBase))) {
    console.error("Sans « --production », cette commande ne parle qu'à la base locale : lancez « npm run base:demarrer » puis « npm run env:local ».");
    process.exit(1);
  }
}
const ou = production ? "la vraie base" : "la base locale";
const compteLocal = resolve(racine, ".compte-local");
// La première ligne de .compte-local est l'adresse du compte ; la seconde, son mot de passe, n'est pas lue.
const courriel = options.find((o) => !o.startsWith("--") && !(o in HISTOIRES)) ?? (!production && existsSync(compteLocal) ? readFileSync(compteLocal, "utf8").split("\n")[0].trim() : "");

// ——— Lire la V0 ———

async function groq<T>(requete: string, params: Record<string, unknown>): Promise<T> {
  const adresse = new URL(SANITY);
  adresse.searchParams.set("query", requete);
  for (const [k, v] of Object.entries(params)) adresse.searchParams.set(`$${k}`, JSON.stringify(v));
  const reponse = await fetch(adresse);
  if (!reponse.ok) throw new Error(`Sanity ne répond pas (${reponse.status}).`);
  return ((await reponse.json()) as { result: T }).result;
}

async function lireLaV0(id: string): Promise<DonneesV0> {
  const d = await groq<DonneesV0>(
    `{ "histoire": *[_id == $id][0], "chapitres": *[_type == "chapter" && story._ref == $id], "scenes": *[_type == "scene" && story._ref == $id],
       "plan": *[_type == "bookPlan" && story._ref == $id] | order(_updatedAt desc)[0] }`,
    { id },
  );
  if (!d.histoire) throw new Error("Cette histoire n'est pas dans la V0.");
  return d;
}

/** L'adresse d'un fichier d'image de Sanity : « image-<empreinte>-<l>x<h>-<ext> ». */
const adresseCdn = (ref: string, cote: number, format: "jpg" | "webp"): string => {
  const [, empreinte, dimensions, extension] = ref.split("-");
  const fond = format === "jpg" ? "&bg=ffffff" : "";
  return `${CDN}/${empreinte}-${dimensions}.${extension}?w=${cote}&h=${cote}&fit=max&fm=${format}&q=${format === "jpg" ? 90 : 88}${fond}`;
};

const telecharger = async (adresse: string): Promise<Uint8Array> => {
  const reponse = await fetch(adresse);
  if (!reponse.ok) throw new Error(`Image introuvable chez Sanity (${reponse.status}).`);
  return new Uint8Array(await reponse.arrayBuffer());
};

/** L'image d'une préface : la première posée dans son texte. */
const imageDeLaPreface = (s: SceneV0 | undefined): string | null => {
  const bloc = corpsDuLivre(s ?? ({} as SceneV0)).find((b) => b._type === "imageRef") as { imageKey: string } | undefined;
  return s?.images?.find((i) => i._key === bloc?.imageKey)?.image?.asset?._ref ?? null;
};

// ——— Charger ———

async function principal(): Promise<void> {
  const h = HISTOIRES[cle];
  if (!h) throw new Error(`Nommez l'histoire : ${Object.keys(HISTOIRES).join(", ")}.`);
  const d = await lireLaV0(h.id);
  const prefaces = (d.histoire.prefaceScenes ?? []).map((r) => d.scenes.find((s) => s._id === r._ref)).filter((s): s is SceneV0 => !!s);
  const preface = prefaces.find((s) => s.title.trim() === h.preface);
  const fiche = imageDeLaPreface(prefaces.find((s) => s.title.trim() === h.ficheAventure));
  const couverture = d.histoire.coverImages?.[0]?.asset?._ref ?? d.histoire.image?.asset?._ref ?? null;

  // Les identités de la V1, tirées avant la conversion
  const idScene = new Map(d.scenes.filter((s) => s.chapter && s.lifecycle !== "trash").map((s) => [s._id, randomUUID()]));
  const images = imagesDe(d, d.scenes.filter((s) => idScene.has(s._id)));
  for (const ref of [couverture, fiche]) if (ref && !images.has(ref)) images.set(ref, { dansUneScene: false });
  const idImage = new Map([...images.keys()].map((ref) => [ref, randomUUID()]));
  const livre = convertir(d, { scene: (v0) => idScene.get(v0) ?? null, image: (ref) => idImage.get(ref) ?? null, titresDesParties: h.titresDesParties });

  // Le même contrôle que pour un texte reçu d'un navigateur : rien que l'application ne connaisse
  const scenes = livre.parties.flatMap((p) => p.chapitres.flatMap((c) => c.scenes));
  for (const s of scenes) {
    const propre = nettoyerTexte(s.texte);
    if (!propre || propre.length !== s.texte.length) throw new Error(`Le texte de « ${s.titre} » n'est pas un texte de scène.`);
    s.texte = propre as unknown as typeof s.texte;
  }

  // « Comment lire ce livre » et les règles du jeu, tirés de la préface
  const morceaux = preface ? texteLeger(preface) : [];
  const debutRegles = morceaux.findIndex((m) => m.titre === h.regles);
  const commentLire: Lettres[][] = (debutRegles < 0 ? morceaux : morceaux.slice(0, debutRegles)).flatMap((m) => m.paragraphes).slice(0, 40);
  const regles = (debutRegles < 0 ? [] : morceaux.slice(debutRegles))
    .flatMap((m, i) => (i === 0 ? m.paragraphes.slice(1) : m.paragraphes))
    .map((p) => p.map((l) => l.text).join("").trim())
    .join("\n")
    .slice(0, 6000);

  // Les numéros : chaque scène garde celui du livre imprimé par la V0
  const rang = new Map<string, number>();
  let horsPlan = 0;
  for (const s of scenes) rang.set(idScene.get(s.v0)!, s.numeroV0 ?? 100000 + (horsPlan += 1));
  const idPartie = livre.parties.map(() => randomUUID());
  const plan: PlanNumerote = {
    departSceneId: livre.departV0 ? (idScene.get(livre.departV0) ?? null) : null,
    parties: livre.parties.map((p, i) => ({
      id: idPartie[i], groupeAvecPrecedente: false, ouvertureSceneId: p.ouvertureV0 ? idScene.get(p.ouvertureV0)! : null,
      chapitres: p.chapitres.map((c) => ({
        horsLivre: false,
        scenes: c.scenes.map((s) => ({ id: idScene.get(s.v0)!, horsLivre: s.horsLivre, rangLivre: rang.get(idScene.get(s.v0)!)!, numeroFixe: s.numeroFixe })),
      })),
    })),
  };
  const numeros = numeroter(plan);
  const ecarts = scenes.filter((s) => s.numeroV0 !== null && numeros.de.get(idScene.get(s.v0)!) !== s.numeroV0);

  const chapitres = livre.parties.reduce((n, p) => n + p.chapitres.length, 0);
  const choix = scenes.reduce((n, s) => n + s.texte.filter((b) => b.type === "choix").length, 0);
  const actions = scenes.reduce((n, s) => n + s.texte.filter((b) => b.type === "action").length, 0);
  console.log(`« ${livre.titre} » : ${livre.parties.length} parties, ${chapitres} chapitres, ${scenes.length} scènes (${scenes.filter((s) => s.horsLivre).length} hors du livre, ${scenes.filter((s) => s.fin).length} fins), ${choix} phrases de choix, ${actions} actions de jeu, ${images.size} images, ${livre.objets.length} objets.`);
  console.log(`Numéros : ${numeros.total} passages, ${ecarts.length ? `${ecarts.length} différents du livre de la V0` : "tous ceux du livre de la V0"}${numeros.problemes.length ? `, ${numeros.problemes.length} problèmes` : ""}.`);
  for (const a of new Set(livre.avertissements)) console.log(`  · ${a}`);
  if (essai) return;

  if (!courriel) throw new Error(production ? "Nommez le compte : « --production adresse@du.compte »." : "Aucun compte local : lancez « npm run compte:local ».");
  const stockage = createClient(url, cleSecrete, { auth: { persistSession: false, autoRefreshToken: false } }).storage.from(SEAU);
  const base = new Client({ connectionString: adresseBase });
  await base.connect();
  const q = async <T = Record<string, unknown>>(texte: string, valeurs: unknown[] = []): Promise<T[]> => (await base.query(texte, valeurs)).rows as T[];
  const deposes: string[] = [];
  try {
    const [compte] = await q<{ id: string }>("select e.id from public.enseignants e join auth.users u on u.id = e.id where u.email = $1", [courriel]);
    if (!compte) throw new Error(`Aucun compte « ${courriel} » dans ${ou}.`);
    const [schema] = await q<{ pret: boolean }>("select exists (select 1 from information_schema.columns where table_name = 'projets' and column_name = 'pages_du_livre') as pret");
    if (!schema?.pret) throw new Error(`Le schéma de ${ou} n'est pas à jour : appliquez d'abord les migrations.`);
    const deja = await q<{ id: string }>("select id from public.projets where enseignant_id = $1 and titre = $2", [compte.id, livre.titre]);
    if (deja.length && !refaire) throw new Error(`« ${livre.titre} » est déjà dans ${ou}. Pour le remettre à neuf, ajoutez « --refaire ».`);
    if (production && !oui) {
      console.log(`Dans la vraie base, pour « ${courriel} » : ${deja.length ? "retirer le projet déjà importé, avec ses images, puis l'importer de nouveau" : "importer ce projet personnel"}.`);
      console.log("Rien n'est fait. Pour le faire, ajoutez « --oui ».");
      return;
    }
    for (const p of deja) {
      const { data } = await stockage.list(`${compte.id}/${p.id}`, { limit: 1000 });
      if (data?.length) await stockage.remove(data.map((f) => `${compte.id}/${p.id}/${f.name}`));
      await q("delete from public.projets where id = $1", [p.id]);
    }

    // Les images, déposées comme à l'import : réduites au plus grand côté gardé, avec leur vignette
    const projetId = randomUUID();
    const formats = await groq<{ _id: string; opaque: boolean }[]>(`*[_id in $ids]{ _id, "opaque": coalesce(metadata.isOpaque, true) }`, { ids: [...images.keys()] });
    const opaque = new Map(formats.map((f) => [f._id, f.opaque]));
    const lignesImages: unknown[][] = [];
    let n = 0;
    for (const [ref, usage] of images) {
      // Une image posée dans une scène garde sa transparence (F10-AC31), en WebP ; les autres se posent sur du blanc
      const format = usage.dansUneScene && opaque.get(ref) === false ? "webp" : "jpg";
      const [image, vignette] = await Promise.all([telecharger(adresseCdn(ref, 2600, format)), telecharger(adresseCdn(ref, 900, format))]);
      const lue = lireImage(image);
      if (!lue || image.length > POIDS_MAX_IMAGE || vignette.length > POIDS_MAX_VIGNETTE) throw new Error(`Image trop lourde ou illisible : ${ref}.`);
      const id = idImage.get(ref)!;
      const type = format === "jpg" ? "image/jpeg" : "image/webp";
      for (const [chemin, octets] of [[cheminImage(compte.id, projetId, id), image], [cheminVignette(compte.id, projetId, id), vignette]] as const) {
        const { error } = await stockage.upload(chemin, octets, { contentType: type, upsert: true });
        if (error) throw new Error(`Image non déposée : ${error.message}`);
        deposes.push(chemin);
      }
      lignesImages.push([id, cheminImage(compte.id, projetId, id), cheminVignette(compte.id, projetId, id), lue.largeur, lue.hauteur, lue.format]);
      n += 1;
      if (n % 20 === 0) console.log(`  ${n} / ${images.size} images déposées…`);
    }

    await q("begin");
    try {
      await q("insert into public.projets (id, enseignant_id, organisation, recit, titre) values ($1, $2, 'personnel', 'choix', $3)", [projetId, compte.id, livre.titre]);
      for (const [id, chemin, vignette, largeur, hauteur, format] of lignesImages) {
        await q("insert into public.images (id, projet_id, enseignant_id, chemin, chemin_vignette, largeur, hauteur, format) values ($1, $2, $3, $4, $5, $6, $7, $8)", [
          id, projetId, compte.id, chemin, vignette, largeur, hauteur, format,
        ]);
      }
      await q(
        `update public.preparations set rubrique_jeu = true, feuille = $2, regles = $3, formule_renvoi = 'rends', constructions = '{neutre,pour,si}', marque_fin = $4
         where projet_id = $1`,
        [projetId, JSON.stringify(h.feuille), regles, h.marqueFin],
      );
      for (const [i, o] of livre.objets.entries()) {
        await q("insert into public.objets (projet_id, enseignant_id, nom, description, cree_le) values ($1, $2, $3, $4, now() + $5::interval)", [projetId, compte.id, o.nom, o.description, `${i} milliseconds`]);
      }

      // Le plan, puis les scènes, encore sans texte
      let reference = 0;
      let couleur = 0;
      for (const [rangPartie, p] of livre.parties.entries()) {
        await q("insert into public.parties (id, projet_id, enseignant_id, titre, rang) values ($1, $2, $3, $4, $5)", [idPartie[rangPartie], projetId, compte.id, p.titre, rangPartie]);
        for (const [rangChapitre, c] of p.chapitres.entries()) {
          const chapitreId = randomUUID();
          await q("insert into public.chapitres (id, partie_id, projet_id, enseignant_id, titre, rang, couleur, image_id) values ($1, $2, $3, $4, $5, $6, $7, $8)", [
            chapitreId, idPartie[rangPartie], projetId, compte.id, c.titre, rangChapitre, couleur++ % 8, c.image ? idImage.get(c.image) : null,
          ]);
          const lignes = c.scenes.map((s, i) => ({
            id: idScene.get(s.v0), reference: (reference += 1), titre: s.titre, consigne: s.consigne, rang: i, fin: s.fin, hors: s.horsLivre, fixe: s.numeroFixe,
          }));
          await q(
            `insert into public.scenes (id, chapitre_id, projet_id, enseignant_id, reference, titre, consigne, rang, fin, hors_livre, etat, numero_fixe)
             select x.id, $1, $2, $3, x.reference, x.titre, x.consigne, x.rang, x.fin, x.hors, 'prete', x.fixe
             from jsonb_to_recordset($4::jsonb) as x(id uuid, reference integer, titre text, consigne text, rang integer, fin boolean, hors boolean, fixe integer)`,
            [chapitreId, projetId, compte.id, JSON.stringify(lignes)],
          );
        }
      }
      for (const [i, p] of plan.parties.entries()) {
        if (p.ouvertureSceneId) await q("update public.parties set ouverture_scene_id = $2 where id = $1", [idPartie[i], p.ouvertureSceneId]);
      }
      await q("update public.projets set reference_suivante = $2, depart_scene_id = $3, image_id = $4 where id = $1", [
        projetId, reference + 1, plan.departSceneId, couverture ? idImage.get(couverture) : null,
      ]);

      // Les textes, une fois toutes les scènes en place : les liens du récit s'en déduisent
      await q(
        "update public.scenes s set texte = x.texte, version = 1, ecrit_le = now() from jsonb_to_recordset($1::jsonb) as x(id uuid, texte jsonb) where s.id = x.id",
        [JSON.stringify(scenes.map((s) => ({ id: idScene.get(s.v0), texte: s.texte })))],
      );

      // L'ordre du livre : celui de la V0, établi par la fonction de l'application (F11.5)
      await q("select set_config('request.jwt.claims', $1, true)", [JSON.stringify({ role: "service_role" })]);
      const [ordre] = await q<{ fait: boolean }>("select public.etablir_ordre($1, $2) as fait", [projetId, JSON.stringify(Object.fromEntries(rang))]);
      if (!ordre?.fait) throw new Error("L'ordre du livre n'a pas pu être établi.");

      // Les pages de présentation : la couverture sur la page de titre, la classe sans prénoms, la préface, la fiche aventure de la V0
      const pages = {
        titre: { forme: "modele", imageId: null, sousTitre: "", ligne: h.ligne, annee: h.annee, illustration: couverture ? idImage.get(couverture) ?? null : null },
        auteurs: { presente: false, forme: "modele", imageId: null, place: "debut", introduction: "Ce livre a été écrit par", noms: [], conclusion: "" },
        commentLire: { presente: true, forme: "modele", imageId: null, texte: commentLire, enigmes: false },
        feuille: { forme: fiche ? "image" : "modele", imageId: fiche ? idImage.get(fiche) : null },
        fin: { presente: false, forme: "modele", imageId: null, texte: [[{ text: "Fin" }]] },
      };
      // Les textes sont ceux de la V0, déjà relus et validés : « Relire » et « Vérifier les chemins » sont terminées
      await q(
        `update public.projets set pages_du_livre = $2, livre_relu_le = now(), chemins_verifies_le = now(), mise_en_page_ouverte_le = now(), derniere_etape_livre = 'page'
         where id = $1`,
        [projetId, JSON.stringify(pages)],
      );
      await q("commit");
    } catch (erreur) {
      await q("rollback");
      throw erreur;
    }
    console.log(`Importé dans ${ou} pour « ${courriel} », projet personnel « ${livre.titre} ».`);
  } catch (erreur) {
    if (deposes.length) await stockage.remove(deposes);
    throw erreur;
  } finally {
    await base.end();
  }
}

principal().catch((erreur: Error) => {
  console.error(masquer(erreur.message));
  process.exit(1);
});
