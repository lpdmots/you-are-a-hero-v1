/**
 * Charge dans la base LOCALE l'histoire d'essai « Les passeurs de brume », celle de la
 * maquette : sa classe et ses vingt-cinq élèves fictifs, le carnet de préparation, le plan,
 * les consignes, les textes et les choix. De quoi essayer l'application sur un vrai récit.
 *
 *   npm run histoire:essai                  pour le compte de « npm run compte:local »
 *   npm run histoire:essai -- adresse       pour un autre compte de la base locale
 *   npm run histoire:essai -- --complet     toutes les scènes écrites, comme le livre fini
 *   npm run histoire:essai -- --refaire     retire l'histoire d'essai déjà chargée, puis la recharge
 *
 * Rien d'autre n'est touché : les projets et les classes du compte restent. « --refaire » ne
 * retire que la classe d'essai, ses élèves et ses projets, avec ce qui y a été écrit depuis.
 * Le contenu est dans passeurs-de-brume.ts.
 */
import { randomUUID } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { Client } from "pg";
import { ciblesDe, estVide, nettoyerTexte, type Texte } from "@/domaine/copie";
import { hasard, melangeInitial, type PlanNumerote } from "@/domaine/numeros";
import { chiffrer } from "@/serveur/chiffrement";
import {
  ACTIONS, CLASSE, CONSIGNES, DEBUTS_PROTEGES, DEPART, ELEVES, FEUILLE, FORMULES, NOTES, OBJETS, PARTIES, PISTES, PREPARATION,
  RESUMES, TEXTES, TEXTES_EN_COURS, TITRE, VISUELS, codeDe, type SceneEssai,
} from "./passeurs-de-brume";

const racine = resolve(__dirname, "..");
config({ path: resolve(racine, ".env.local"), quiet: true });

const locale = (adresse: string): boolean => {
  try {
    return ["127.0.0.1", "localhost"].includes(new URL(adresse).hostname);
  } catch {
    return false;
  }
};
const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const adresseBase = process.env.BASE_LOCALE_URL ?? "";
if (!locale(url) || !locale(adresseBase)) {
  console.error("Cette commande ne parle qu'à la base locale : lancez « npm run base:demarrer » puis « npm run env:local ».");
  process.exit(1);
}

const options = process.argv.slice(2);
const complet = options.includes("--complet");
const refaire = options.includes("--refaire");
const compteLocal = resolve(racine, ".compte-local");
// La première ligne de .compte-local est l'adresse du compte ; la seconde, son mot de passe, n'est pas lue
const courriel = options.find((o) => !o.startsWith("--")) ?? (existsSync(compteLocal) ? readFileSync(compteLocal, "utf8").split("\n")[0].trim() : "");

// ——— Le texte d'une scène, en blocs ———

const scenes: SceneEssai[] = PARTIES.flatMap((p) => p.chapitres.flatMap((c) => c.scenes));
const idScene = new Map(scenes.map((s) => [s.ref, randomUUID()]));
const cible = (ref: number): string => {
  const id = idScene.get(ref);
  if (!id) throw new Error(`Un choix mène à S${String(ref).padStart(3, "0")}, qui n'est pas dans le plan.`);
  return id;
};

let choixPoses = 0;

function texteDe(scene: SceneEssai): Texte {
  const ecrite = complet || !scene.vide;
  const debut = DEBUTS_PROTEGES[scene.ref];
  const paragraphes = ecrite ? ((complet ? undefined : TEXTES_EN_COURS[scene.ref]) ?? TEXTES[scene.ref] ?? []) : debut ? [debut] : [];
  const actions = ecrite ? (ACTIONS[scene.ref] ?? []) : [];
  const blocs: unknown[] = [];
  const action = (texte: string) => blocs.push({ type: "action", id: randomUUID(), children: [{ text: texte }] });

  paragraphes.forEach((texte, i) => {
    actions.filter(([avant]) => Math.min(avant, paragraphes.length) === i).forEach(([, t]) => action(t));
    blocs.push({ type: "p", id: randomUUID(), ...(texte === debut ? { protege: true } : {}), children: [{ text: texte }] });
  });
  actions.filter(([avant]) => avant >= paragraphes.length).forEach(([, t]) => action(t));
  if (ecrite && NOTES[scene.ref]) blocs.push({ type: "note", id: randomUUID(), children: [{ text: NOTES[scene.ref] }] });

  const choix = scene.choix ?? [];
  if (scene.phrase) {
    // Phrase personnalisée : son texte, et un renvoi à la place de chaque rang
    blocs.push({
      type: "choix", id: randomUUID(), libelle: choix[0]?.[0] ?? "",
      children: scene.phrase.map((m) =>
        typeof m === "string" ? { text: m } : { type: "renvoi", id: randomUUID(), cible: cible(choix[m][1]), libelle: choix[m][0], children: [{ text: "" }] },
      ),
    });
  } else {
    for (const [libelle, vers] of choix) {
      // Les constructions cochées dans la préparation, chacune à son tour
      const construction = PREPARATION.constructions[choixPoses % PREPARATION.constructions.length];
      choixPoses += 1;
      blocs.push({ type: "choix", id: randomUUID(), auto: true, libelle, construction, cible: cible(vers), children: [{ text: "" }] });
    }
  }
  if (scene.cachee) blocs.push({ type: "liaison", id: randomUUID(), cible: cible(scene.cachee.cible), libelle: scene.cachee.libelle, children: [{ text: "" }] });

  // Le même contrôle que pour un texte reçu d'un navigateur : rien que l'application ne connaisse
  const propre = nettoyerTexte(blocs);
  if (!propre || propre.length !== blocs.length || ciblesDe(propre).length !== choix.length + (scene.cachee ? 1 : 0)) {
    throw new Error(`Le texte de S${String(scene.ref).padStart(3, "0")} n'est pas un texte de scène.`);
  }
  return propre;
}

// ——— Retirer l'histoire d'essai déjà chargée ———

async function retirer(base: Client, enseignant: string, classeId: string): Promise<void> {
  const { rows: projets } = await base.query<{ id: string }>("select id from public.projets where classe_id = $1", [classeId]);
  // Les images importées dans ces projets : rangées sous <compte>/<projet>/ dans le stockage
  const stockage = createClient(url, process.env.SUPABASE_CLE_SECRETE!, { auth: { persistSession: false, autoRefreshToken: false } }).storage.from("images");
  for (const projet of projets) {
    const { data: fichiers } = await stockage.list(`${enseignant}/${projet.id}`);
    if (fichiers?.length) await stockage.remove(fichiers.map((f) => `${enseignant}/${projet.id}/${f.name}`));
  }
  await base.query("begin");
  try {
    // Dans cet ordre : ce qui retient une classe part avant elle
    await base.query("delete from public.projets where classe_id = $1", [classeId]);
    const { rows: eleves } = await base.query<{ eleve_id: string }>("delete from public.inscriptions where classe_id = $1 returning eleve_id", [classeId]);
    await base.query(
      "delete from public.eleves e where e.id = any($1::uuid[]) and not exists (select 1 from public.inscriptions i where i.eleve_id = e.id)",
      [eleves.map((e) => e.eleve_id)],
    );
    await base.query("delete from public.classes where id = $1", [classeId]);
    await base.query("commit");
  } catch (erreur) {
    await base.query("rollback");
    throw erreur;
  }
}

// ——— Charger ———

async function charger(base: Client, enseignant: string): Promise<{ ecrites: number }> {
  const classeId = randomUUID();
  const projetId = randomUUID();
  // « now() » est le même instant dans toute l'opération : chaque ligne reçoit le sien, pour garder l'ordre
  const instant = (i: number) => `${i} milliseconds`;

  await base.query("insert into public.classes (id, enseignant_id, nom, annee_debut, identifiant) values ($1, $2, $3, $4, $5)", [
    classeId, enseignant, CLASSE.nom, CLASSE.anneeDebut, CLASSE.identifiant,
  ]);
  await base.query("insert into public.classes_secrets (classe_id, enseignant_id, mot_de_passe_chiffre) values ($1, $2, $3)", [
    classeId, enseignant, chiffrer(CLASSE.motDePasse, { sorte: "classe", id: classeId }),
  ]);

  const idEleve = new Map<string, string>();
  for (const [i, prenom] of ELEVES.entries()) {
    const id = randomUUID();
    idEleve.set(prenom, id);
    await base.query("insert into public.eleves (id, enseignant_id, prenom, couleur, cree_le) values ($1, $2, $3, $4, now() + $5::interval)", [id, enseignant, prenom, i % 10, instant(i)]);
    await base.query("insert into public.eleves_secrets (eleve_id, enseignant_id, code_chiffre) values ($1, $2, $3)", [id, enseignant, chiffrer(codeDe(i), { sorte: "code", id })]);
    await base.query("insert into public.inscriptions (classe_id, eleve_id, enseignant_id) values ($1, $2, $3)", [classeId, id, enseignant]);
  }
  const eleve = (prenom: string): string => {
    const id = idEleve.get(prenom);
    if (!id) throw new Error(`${prenom} n'est pas dans la classe d'essai.`);
    return id;
  };

  // Le projet ; sa ligne de préparation se crée avec lui
  await base.query(
    "insert into public.projets (id, enseignant_id, organisation, recit, titre, classe_id, visuel_choisi) values ($1, $2, 'classe', 'choix', $3, $4, $5)",
    [projetId, enseignant, TITRE, classeId, VISUELS.projet],
  );
  await base.query(
    `update public.preparations
     set univers = $2, personnages = $3, enjeu = $4, rubrique_jeu = true, feuille = $5, regles = $6, formule_renvoi = $7, constructions = $8
     where projet_id = $1`,
    [projetId, PREPARATION.univers, PREPARATION.personnages, PREPARATION.enjeu, JSON.stringify(FEUILLE), PREPARATION.regles, PREPARATION.formuleRenvoi, [...PREPARATION.constructions]],
  );
  for (const [i, [rubrique, texte, etat]] of PISTES.entries()) {
    await base.query("insert into public.pistes (projet_id, enseignant_id, rubrique, texte, etat, cree_le) values ($1, $2, $3, $4, $5, now() + $6::interval)", [projetId, enseignant, rubrique, texte, etat, instant(i)]);
  }
  for (const [i, [nom, description]] of OBJETS.entries()) {
    await base.query("insert into public.objets (projet_id, enseignant_id, nom, description, cree_le) values ($1, $2, $3, $4, now() + $5::interval)", [projetId, enseignant, nom, description, instant(i)]);
  }
  for (const [i, texte] of FORMULES.entries()) {
    await base.query("insert into public.formules (projet_id, enseignant_id, texte, cree_le) values ($1, $2, $3, now() + $4::interval)", [projetId, enseignant, texte, instant(i)]);
  }

  // Le plan : parties, chapitres, élèves des chapitres, puis les scènes, encore sans texte
  const plan: PlanNumerote = { departSceneId: cible(DEPART), parties: [] };
  for (const [rangPartie, partie] of PARTIES.entries()) {
    const partieId = randomUUID();
    await base.query("insert into public.parties (id, projet_id, enseignant_id, titre, rang, visuel_choisi) values ($1, $2, $3, $4, $5, $6)", [
      partieId, projetId, enseignant, partie.titre, rangPartie, VISUELS[partie.cle],
    ]);
    const numerotee: PlanNumerote["parties"][number] = { id: partieId, groupeAvecPrecedente: false, ouvertureSceneId: null, chapitres: [] };
    plan.parties.push(numerotee);
    for (const [rangChapitre, chapitre] of partie.chapitres.entries()) {
      const chapitreId = randomUUID();
      await base.query(
        "insert into public.chapitres (id, partie_id, projet_id, enseignant_id, titre, rang, couleur, resume, visuel_choisi) values ($1, $2, $3, $4, $5, $6, $7, $8, $9)",
        [chapitreId, partieId, projetId, enseignant, chapitre.titre, rangChapitre, chapitre.couleur, RESUMES[chapitre.cle] ?? "", VISUELS[chapitre.cle]],
      );
      for (const [prenom, profil] of chapitre.eleves) {
        await base.query("insert into public.attributions (chapitre_id, eleve_id, projet_id, enseignant_id, profil) values ($1, $2, $3, $4, $5)", [chapitreId, eleve(prenom), projetId, enseignant, profil]);
      }
      for (const [rangScene, scene] of chapitre.scenes.entries()) {
        await base.query(
          `insert into public.scenes (id, chapitre_id, projet_id, enseignant_id, reference, titre, consigne, rang, fin, prise_par_eleve)
           values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [cible(scene.ref), chapitreId, projetId, enseignant, scene.ref, scene.titre, scene.sansConsigne ? "" : (CONSIGNES[scene.ref] ?? ""), rangScene, scene.fin === true, scene.pec ? eleve(scene.pec) : null],
        );
      }
      numerotee.chapitres.push({
        horsLivre: false,
        scenes: chapitre.scenes.map((s) => ({ id: cible(s.ref), horsLivre: false, rangLivre: null, numeroFixe: scenes.find((o) => o.cachee?.cible === s.ref)?.cachee?.numero ?? null })),
      });
    }
  }
  // Une référence n'est jamais redonnée : la suivante vient après la plus grande
  await base.query("update public.projets set reference_suivante = $2, depart_scene_id = $3 where id = $1", [projetId, Math.max(...scenes.map((s) => s.ref)) + 1, cible(DEPART)]);

  // Les textes, une fois toutes les scènes en place : les liens du récit s'en déduisent
  let ecrites = 0;
  for (const [i, scene] of scenes.entries()) {
    const texte = texteDe(scene);
    if (!texte.length) continue;
    const recit = !estVide(texte.filter((b) => b.type !== "choix"));
    if (recit) ecrites += 1;
    // Écrites au fil des deux dernières semaines, dans l'ordre du plan
    await base.query(
      "update public.scenes set texte = $2, version = 1, ecrit_le = now() - $3::interval, ecrit_par = $4::uuid[] where id = $1",
      [cible(scene.ref), JSON.stringify(texte), `${(scenes.length - i) * 8} hours`, recit && scene.pec ? [eleve(scene.pec)] : []],
    );
  }
  for (const scene of scenes) {
    if (scene.cachee) await base.query("update public.scenes set numero_fixe = $2 where id = $1", [cible(scene.cachee.cible), scene.cachee.numero]);
  }

  // L'ordre du livre, comme l'application l'établit au premier choix (F11.5) : par sa propre fonction
  const { rows: liens } = await base.query<{ scene_id: string; cible_id: string | null }>("select scene_id, cible_id from public.liens where projet_id = $1", [projetId]);
  const parOrigine = new Map<string, string[]>();
  for (const l of liens) if (l.cible_id) parOrigine.set(l.scene_id, [...(parOrigine.get(l.scene_id) ?? []), l.cible_id]);
  const rangs = melangeInitial(plan, [...parOrigine.values()], hasard(2026));
  await base.query("select set_config('request.jwt.claims', $1, true)", [JSON.stringify({ role: "service_role" })]);
  const { rows: ordre } = await base.query<{ fait: boolean }>("select public.etablir_ordre($1, $2) as fait", [projetId, JSON.stringify(Object.fromEntries(rangs))]);
  if (!ordre[0]?.fait) throw new Error("L'ordre du livre n'a pas pu être établi.");

  await base.query("update public.enseignants set dernier_projet_id = $2 where id = $1", [enseignant, projetId]);
  return { ecrites };
}

async function principal(): Promise<void> {
  if (!courriel) {
    console.error("Aucun compte : lancez « npm run compte:local », ou donnez l'adresse du compte.");
    process.exit(1);
  }
  const base = new Client({ connectionString: adresseBase });
  await base.connect();
  try {
    const { rows: comptes } = await base.query<{ id: string }>("select e.id from public.enseignants e join auth.users u on u.id = e.id where u.email = $1", [courriel]);
    if (!comptes.length) throw new Error(`Aucun compte ${courriel} dans la base locale.`);
    const enseignant = comptes[0].id;

    const { rows: deja } = await base.query<{ id: string; enseignant_id: string }>("select id, enseignant_id from public.classes where identifiant = $1", [CLASSE.identifiant]);
    if (deja.length) {
      if (deja[0].enseignant_id !== enseignant) throw new Error(`La classe « ${CLASSE.identifiant} » existe déjà, pour un autre compte.`);
      if (!refaire) throw new Error("L'histoire d'essai est déjà chargée. Pour la remettre à neuf : npm run histoire:essai -- --refaire");
      await retirer(base, enseignant, deja[0].id);
    }

    await base.query("begin");
    try {
      const { ecrites } = await charger(base, enseignant);
      await base.query("commit");
      const chapitres = PARTIES.reduce((n, p) => n + p.chapitres.length, 0);
      console.log(`« ${TITRE} » chargée pour ${courriel} : ${PARTIES.length} parties, ${chapitres} chapitres, ${scenes.length} scènes dont ${ecrites} écrites.`);
      console.log(`Classe « ${CLASSE.nom} », ${ELEVES.length} élèves : son identifiant, son mot de passe et les codes se lisent dans « Mes classes ».`);
    } catch (erreur) {
      await base.query("rollback");
      throw erreur;
    }
  } finally {
    await base.end();
  }
}

principal().catch((erreur: Error) => {
  console.error(erreur.message);
  process.exit(1);
});
