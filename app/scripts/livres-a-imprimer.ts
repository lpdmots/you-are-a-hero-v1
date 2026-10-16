/**
 * Charge dans la base locale (ou la vraie base), pour le compte local, deux livres finis à mener de « Relire » au
 * PDF définitif (étape 6 du plan, lot 7) ; chacun porte les cas de la mise en page :
 *
 * - « La lanterne du passeur », récit à choix de la classe d'essai : deux parties, une énigme
 *   au numéro fixé, un passage atteint par une règle du jeu (numéro fixé), des actions de jeu
 *   et la feuille d'aventure avec un dé, une image pleine page en tête d'un passage, un dessin
 *   peu défini à confirmer, une image réglée trop large, des passages de longueurs variées qui
 *   laissent des pages peu remplies ;
 * - « Le grand voyage », récit classique personnel : deux parties, trois chapitres, une image.
 *
 *   npm run livres:essai              les charge
 *   npm run livres:essai -- --refaire les retire, avec ce qui y a été écrit, puis les recharge
 *   npm run livres:essai -- --retirer les retire seulement, avec leurs images et leurs partages
 *
 *   npm run livres:essai -- --production adresse         dit ce qui serait fait dans la vraie base
 *   npm run livres:essai -- --production adresse --oui   le fait (« --refaire » s'y ajoute de même)
 *
 * La classe d'essai vient de « npm run histoire:essai » (avec « --production » pour la vraie
 * base). Rien d'autre n'est touché : seuls ces deux livres, et leurs images, sont retirés par
 * « --refaire ». Dans la vraie base, ils servent à essayer le partage (étape 7) sans projet fini.
 */
import { randomUUID } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { Client } from "pg";
import { hasard, melangeInitial, type PlanNumerote } from "@/domaine/numeros";
import { adresseDeProduction, lireEnv, racine } from "./base-de-production";
import { CLASSE } from "./passeurs-de-brume";

const locale = (adresse: string): boolean => {
  try {
    return ["127.0.0.1", "localhost"].includes(new URL(adresse).hostname);
  } catch {
    return false;
  }
};
const options = process.argv.slice(2);
const retirer = options.includes("--retirer");
const refaire = options.includes("--refaire") || retirer;
const production = options.includes("--production");
const oui = options.includes("--oui");

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
// Dans la vraie base, le compte se nomme : aucun n'est pris par défaut.
const courriel = options.find((o) => !o.startsWith("--")) ?? (!production && existsSync(compteLocal) ? readFileSync(compteLocal, "utf8").split("\n")[0].trim() : "");

const PHRASES = [
  "Lou s’approcha des lanternes, qui s’éteignaient une à une au bout du quai.",
  "La brume montait du lac et recouvrait déjà les barques amarrées.",
  "Un héron s’envola en criant, et l’eau trembla sous la passerelle.",
  "Le passeur ne répondait pas ; il regardait la rive opposée sans bouger.",
  "Plus il avançait, plus la brume s’épaississait autour de lui.",
  "Dans la cabane, une lampe éclairait une carte couverte de signes inconnus.",
  "Les arbres de la forêt engloutie se dressaient au-dessus de l’eau noire.",
  "Il entendit des pas derrière lui, mais personne n’était là quand il se retourna.",
];
/** Un texte de `n` paragraphes, chacun de quelques phrases, tiré d'une graine */
const recit = (graine: number, n: number): string[] =>
  Array.from({ length: n }, (_, i) => Array.from({ length: 3 + ((graine + i) % 4) }, (_, k) => PHRASES[(graine * 3 + i * 5 + k) % PHRASES.length]).join(" "));

type Image = "pleine" | "floue" | "large" | "simple";
type Scene = {
  ref: number; partie: number; chapitre: string; titre: string; texte: string[];
  choix?: [string, number][]; cachee?: { vers: number; libelle: string }; action?: string; image?: Image; fin?: boolean; fixe?: number;
};

const A_CHOIX = {
  titre: "La lanterne du passeur",
  parties: ["Le quai", "La tour"],
  scenes: [
    { ref: 1, partie: 0, chapitre: "Le port", titre: "Port — la dernière lanterne", texte: recit(1, 2), choix: [["Suivre la lanterne", 2], ["Monter dans la barque", 3]] },
    { ref: 2, partie: 0, chapitre: "Le port", titre: "Port — la ruelle des filets", texte: recit(2, 4), action: "Ajoute la corde à ton inventaire.", choix: [["Entrer dans la cabane", 4], ["Revenir au quai", 5]] },
    { ref: 3, partie: 0, chapitre: "Le port", titre: "Barque — l’eau noire", texte: recit(3, 1), image: "pleine", choix: [["Ramer vers la tour", 9], ["Attendre la brume", 6]] },
    { ref: 4, partie: 0, chapitre: "La passerelle", titre: "Cabane — la carte aux signes", texte: recit(4, 3), image: "floue", cachee: { vers: 12, libelle: "Déchiffrer la carte" }, choix: [["Sortir par la fenêtre", 7]] },
    { ref: 5, partie: 0, chapitre: "La passerelle", titre: "Quai — le passeur muet", texte: recit(5, 6), choix: [["Lui montrer la lanterne", 7], ["Insister", 8]] },
    { ref: 6, partie: 0, chapitre: "La passerelle", titre: "Brume — le chant du héron", texte: recit(6, 1), action: "Retire un point de volonté à ton héros.", choix: [["Suivre le chant", 9]] },
    { ref: 7, partie: 0, chapitre: "La passerelle", titre: "Passerelle — les planches qui craquent", texte: recit(7, 2), image: "large", choix: [["Courir", 9], ["Avancer pas à pas", 8]] },
    { ref: 8, partie: 0, chapitre: "La passerelle", titre: "Passerelle — la chute", texte: recit(8, 1), choix: [["Remonter", 9]] },
    { ref: 9, partie: 1, chapitre: "L’escalier", titre: "Tour — la porte basse", texte: recit(9, 3), choix: [["Monter l’escalier", 10], ["Descendre à la cave", 11]] },
    { ref: 10, partie: 1, chapitre: "L’escalier", titre: "Tour — cent marches", texte: recit(10, 5), action: "Lance le dé : sur 1 ou 2, retire un point de volonté.", choix: [["Continuer", 13]] },
    { ref: 11, partie: 1, chapitre: "L’escalier", titre: "Cave — les tonneaux vides", texte: recit(11, 2), choix: [["Remonter", 10]] },
    { ref: 12, partie: 1, chapitre: "L’escalier", titre: "Tour — le passage secret", texte: recit(12, 2), choix: [["Pousser la trappe", 13]], fixe: 12 },
    { ref: 13, partie: 1, chapitre: "L’escalier", titre: "Sommet — la grande lanterne", texte: recit(13, 3), image: "simple", fin: true },
    { ref: 14, partie: 1, chapitre: "L’escalier", titre: "Brume — plus de volonté", texte: recit(14, 1), fin: true, fixe: 14 },
  ] as Scene[],
};

const CLASSIQUE = {
  titre: "Le grand voyage",
  parties: ["Le départ", "La traversée"],
  scenes: [
    { ref: 1, partie: 0, chapitre: "Le village", titre: "Le village endormi", texte: recit(21, 3) },
    { ref: 2, partie: 0, chapitre: "Le village", titre: "La lettre du grand-père", texte: recit(22, 4), image: "simple" },
    { ref: 3, partie: 0, chapitre: "La route", titre: "La route des collines", texte: recit(23, 5) },
    { ref: 4, partie: 1, chapitre: "Le lac", titre: "Le passeur du lac", texte: recit(24, 3) },
    { ref: 5, partie: 1, chapitre: "Le lac", titre: "La tempête", texte: recit(25, 6) },
    { ref: 6, partie: 1, chapitre: "Le lac", titre: "L’autre rive", texte: recit(26, 2) },
  ] as Scene[],
};

const FEUILLE = {
  on: true,
  des: 1,
  sections: [
    { id: "heros", type: "compteurs", titre: "Ton héros", compteurs: [{ id: "vol", nom: "Volonté", depart: 5 }] },
    { id: "inv", type: "liste", titre: "Inventaire", lignes: 8 },
  ],
};
const ILLUSTRATIONS: Record<Image, { fichier: string; largeur: number; hauteur: number; taille: number }> = {
  // Les fichiers font 1 200 × 800 points ; le dessin « peu défini » se déclare plus petit, comme un dessin numérisé
  pleine: { fichier: "defaut-montagne", largeur: 1200, hauteur: 800, taille: 100 },
  floue: { fichier: "defaut-chateau", largeur: 500, hauteur: 340, taille: 100 },
  large: { fichier: "defaut-bibliotheque", largeur: 1200, hauteur: 1700, taille: 95 },
  simple: { fichier: "defaut-bateau", largeur: 1200, hauteur: 800, taille: 65 },
};

const bloc = (type: string, reste: Record<string, unknown>) => ({ type, id: randomUUID(), ...reste });

async function principal(): Promise<void> {
  if (!courriel) throw new Error(production ? "Nommez le compte : « --production adresse@du.compte »." : "Aucun compte local : lancez « npm run compte:local ».");
  const stockage = createClient(url, cleSecrete, { auth: { persistSession: false, autoRefreshToken: false } }).storage.from("images");
  const base = new Client({ connectionString: adresseBase });
  await base.connect();
  const q = async <T = Record<string, unknown>>(texte: string, valeurs: unknown[] = []): Promise<T[]> => (await base.query(texte, valeurs)).rows as T[];
  try {
    const [compte] = await q<{ id: string }>("select e.id from public.enseignants e join auth.users u on u.id = e.id where u.email = $1", [courriel]);
    if (!compte) throw new Error(production ? `Aucun compte « ${courriel} » dans la vraie base.` : "Le compte local n'est pas dans la base locale : lancez « npm run compte:local ».");
    const [schema] = await q<{ pret: boolean }>("select to_regclass('public.pdf_du_livre') is not null and exists (select 1 from information_schema.columns where table_name = 'projets' and column_name = 'ordre_decision') as pret");
    if (!schema?.pret) throw new Error(`Le schéma de ${ou} n'est pas à jour : appliquez d'abord les migrations.`);
    const [classe] = await q<{ id: string }>("select id from public.classes where enseignant_id = $1 and identifiant = $2", [compte.id, CLASSE.identifiant]);
    if (!classe) throw new Error(`La classe d'essai manque dans ${ou} : lancez d'abord « npm run histoire:essai${production ? " -- --production adresse --oui" : ""} ».`);
    const deja = await q<{ id: string }>("select id from public.projets where enseignant_id = $1 and titre = any($2::text[])", [compte.id, [A_CHOIX.titre, CLASSIQUE.titre]]);
    if (deja.length && !refaire) throw new Error("Les livres d'essai sont déjà chargés. Pour les remettre à neuf, ajoutez « --refaire ».");
    if (production && !oui) {
      if (retirer && !deja.length) {
        console.log(`Aucun livre d'essai à retirer dans la vraie base pour « ${courriel} ».`);
        return;
      }
      const faire = retirer ? "retirer" : deja.length ? "retirer puis recharger" : "charger";
      console.log(`Dans la vraie base, pour « ${courriel} » : ${faire} « ${A_CHOIX.titre} » (classe « ${CLASSE.nom} ») et « ${CLASSIQUE.titre} », avec leurs images.`);
      console.log("Rien n'est fait. Pour le faire, ajoutez « --oui ».");
      return;
    }
    for (const p of deja) {
      const { data } = await stockage.list(`${compte.id}/${p.id}`);
      if (data?.length) await stockage.remove(data.map((f) => `${compte.id}/${p.id}/${f.name}`));
      await q("delete from public.projets where id = $1", [p.id]);
    }
    if (retirer) {
      console.log(deja.length ? `Livres d'essai retirés de ${ou}.` : `Aucun livre d'essai dans ${ou}.`);
      return;
    }

    for (const livre of [A_CHOIX, CLASSIQUE]) {
      const aChoix = livre === A_CHOIX;
      const projetId = randomUUID();
      await q(
        "insert into public.projets (id, enseignant_id, organisation, recit, titre, classe_id) values ($1, $2, $3, $4, $5, $6)",
        [projetId, compte.id, aChoix ? "classe" : "personnel", aChoix ? "choix" : "classique", livre.titre, aChoix ? classe.id : null],
      );
      if (aChoix) {
        await q("update public.preparations set rubrique_jeu = true, feuille = $2, regles = $3 where projet_id = $1", [
          projetId, JSON.stringify(FEUILLE), "Tu commences avec 5 points de volonté. Si tu n’en as plus, rends-toi au 14.",
        ]);
      }
      // Les images, déposées dans le stockage comme à l'import
      const images = new Map<Image, string>();
      for (const sorte of new Set(livre.scenes.flatMap((s) => (s.image ? [s.image] : [])))) {
        const id = randomUUID();
        const i = ILLUSTRATIONS[sorte];
        const chemin = `${compte.id}/${projetId}/${id}.jpg`;
        const vignette = `${compte.id}/${projetId}/${id}-v.jpg`;
        for (const [ou, fichier] of [[chemin, `${i.fichier}.jpg`], [vignette, `${i.fichier}-v.jpg`]]) {
          const { error } = await stockage.upload(ou, readFileSync(resolve(racine, "public/illustrations", fichier)), { contentType: "image/jpeg", upsert: true });
          if (error) throw new Error(`Image non déposée : ${error.message}`);
        }
        await q("insert into public.images (id, projet_id, enseignant_id, chemin, chemin_vignette, largeur, hauteur, format) values ($1, $2, $3, $4, $5, $6, $7, 'jpeg')", [
          id, projetId, compte.id, chemin, vignette, i.largeur, i.hauteur,
        ]);
        images.set(sorte, id);
      }
      // Les parties, les chapitres, les scènes
      const chapitres = new Map<string, string>();
      const parties: string[] = [];
      for (const [rang, titre] of livre.parties.entries()) {
        const id = randomUUID();
        parties.push(id);
        await q("insert into public.parties (id, projet_id, enseignant_id, titre, rang) values ($1, $2, $3, $4, $5)", [id, projetId, compte.id, titre, rang]);
      }
      for (const s of livre.scenes) {
        if (chapitres.has(s.chapitre)) continue;
        const id = randomUUID();
        chapitres.set(s.chapitre, id);
        await q("insert into public.chapitres (id, partie_id, projet_id, enseignant_id, titre, rang, couleur) values ($1, $2, $3, $4, $5, $6, $7)", [
          id, parties[s.partie], projetId, compte.id, s.chapitre, chapitres.size, chapitres.size % 8,
        ]);
      }
      const ids = new Map(livre.scenes.map((s) => [s.ref, randomUUID()]));
      for (const [rang, s] of livre.scenes.entries()) {
        await q(
          "insert into public.scenes (id, chapitre_id, projet_id, enseignant_id, reference, titre, rang, fin, etat, numero_fixe) values ($1, $2, $3, $4, $5, $6, $7, $8, 'prete', $9)",
          [ids.get(s.ref), chapitres.get(s.chapitre), projetId, compte.id, s.ref, s.titre, rang, s.fin === true, s.fixe ?? null],
        );
      }
      // Seul un récit à choix a une scène de départ
      await q("update public.projets set reference_suivante = $2, depart_scene_id = $3 where id = $1", [projetId, livre.scenes.length + 1, aChoix ? ids.get(1) : null]);
      // Les textes : les liens du récit s'en déduisent
      for (const s of livre.scenes) {
        const image = s.image ? bloc("image", { image: images.get(s.image), largeur: ILLUSTRATIONS[s.image].taille, ...(s.image === "pleine" ? { page: true } : {}), children: [{ text: "" }] }) : null;
        const texte = [
          ...(image && s.image === "pleine" ? [image] : []),
          ...s.texte.map((t) => bloc("p", { children: [{ text: t }] })),
          ...(image && s.image !== "pleine" ? [image] : []),
          ...(s.action ? [bloc("action", { children: [{ text: s.action }] })] : []),
          ...(s.choix ?? []).map(([libelle, vers]) => bloc("choix", { auto: true, libelle, construction: "neutre", cible: ids.get(vers), children: [{ text: "" }] })),
          ...(s.cachee ? [bloc("liaison", { cible: ids.get(s.cachee.vers), libelle: s.cachee.libelle, children: [{ text: "" }] })] : []),
        ];
        await q("update public.scenes set texte = $2, version = 1, ecrit_le = now() where id = $1", [ids.get(s.ref), JSON.stringify(texte)]);
      }
      // L'ordre du livre à choix : le mélange initial, établi une fois (F11.5)
      if (aChoix) {
        const plan: PlanNumerote = {
          departSceneId: ids.get(1)!,
          parties: parties.map((id, p) => ({
            id, groupeAvecPrecedente: false, ouvertureSceneId: null,
            chapitres: [...new Set(livre.scenes.filter((s) => s.partie === p).map((s) => s.chapitre))].map((c) => ({
              horsLivre: false,
              scenes: livre.scenes.filter((s) => s.chapitre === c).map((s) => ({ id: ids.get(s.ref)!, horsLivre: false, rangLivre: null, numeroFixe: s.fixe ?? null })),
            })),
          })),
        };
        const fratries = livre.scenes.flatMap((s) => (s.choix ? [s.choix.map(([, vers]) => ids.get(vers)!)] : []));
        const rangs = melangeInitial(plan, fratries, hasard(7));
        for (const [id, rang] of rangs) await q("update public.scenes set rang_livre = $2 where id = $1", [id, rang]);
        await q("update public.projets set ordre_etabli_le = now() where id = $1", [projetId]);
      }
      console.log(`« ${livre.titre} » chargé : ${livre.scenes.length} scènes${aChoix ? `, classe « ${CLASSE.nom} »` : ""}.`);
    }
  } finally {
    await base.end();
  }
}

principal().catch((erreur: Error) => {
  console.error(erreur.message);
  process.exit(1);
});
