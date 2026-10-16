/**
 * Prépare l'essai du partage (étape 7 du plan, lot 4) dans la base locale (ou la vraie base), pour le compte
 * local : les deux livres finis de « npm run livres:essai », « La lanterne du passeur » (récit
 * à choix de la classe d'essai) et « Le grand voyage » (récit classique personnel), sont menés
 * jusqu'à l'étape « Imprimer et partager », ouverte ; leur partage éventuel est retiré, pour
 * repartir d'un livre qui n'est pas encore partagé. Rien n'est partagé : l'essai le fait à
 * l'écran, rappel compris.
 *
 *   npm run partages:essai
 *   npm run partages:essai -- --production adresse         dit ce qui serait fait dans la vraie base
 *   npm run partages:essai -- --production adresse --oui   le fait
 *
 * Seuls ces deux livres sont touchés ; les autres projets du compte restent tels quels.
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { config } from "dotenv";
import { Client } from "pg";
import { adresseDeProduction, racine } from "./base-de-production";

const locale = (adresse: string): boolean => {
  try {
    return ["127.0.0.1", "localhost"].includes(new URL(adresse).hostname);
  } catch {
    return false;
  }
};
const options = process.argv.slice(2);
const production = options.includes("--production");
const oui = options.includes("--oui");
let adresseBase: string;
if (production) {
  adresseBase = adresseDeProduction();
} else {
  config({ path: resolve(racine, ".env.local"), quiet: true });
  adresseBase = process.env.BASE_LOCALE_URL ?? "";
  if (!locale(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "") || !locale(adresseBase)) {
    console.error("Sans « --production », cette commande ne parle qu'à la base locale : lancez « npm run base:demarrer » puis « npm run env:local ».");
    process.exit(1);
  }
}
const ou = production ? "la vraie base" : "la base locale";
const compteLocal = resolve(racine, ".compte-local");
// La première ligne de .compte-local est l'adresse du compte ; la seconde, son mot de passe, n'est pas lue.
// Dans la vraie base, le compte se nomme : aucun n'est pris par défaut.
const courriel = options.find((o) => !o.startsWith("--")) ?? (!production && existsSync(compteLocal) ? readFileSync(compteLocal, "utf8").split("\n")[0].trim() : "");
const LIVRES = ["La lanterne du passeur", "Le grand voyage"];

async function principal(): Promise<void> {
  if (!courriel) throw new Error(production ? "Nommez le compte : « --production adresse@du.compte »." : "Pas de compte local : « npm run compte:local » d'abord.");
  const base = new Client({ connectionString: adresseBase });
  await base.connect();
  try {
    const [schema] = (await base.query("select to_regclass('public.lectures_en_cours') is not null as pret")).rows as { pret: boolean }[];
    if (!schema.pret) throw new Error(`Les migrations de l'étape 7 manquent dans ${ou}.`);
    const [compte] = (await base.query("select e.id from public.enseignants e join auth.users u on u.id = e.id where u.email = $1", [courriel])).rows as { id: string }[];
    if (!compte) throw new Error(`Aucun compte « ${courriel} » dans ${ou}.`);
    const projets = (await base.query("select id, titre from public.projets where enseignant_id = $1 and titre = any($2::text[])", [compte.id, LIVRES])).rows as { id: string; titre: string }[];
    if (projets.length < LIVRES.length) throw new Error(`Les livres d'essai manquent dans ${ou} : « npm run livres:essai${production ? " -- --production adresse --oui" : " -- --refaire"} » d'abord.`);
    if (production && !oui) {
      console.log(`Dans la vraie base, pour « ${courriel} » : mener « ${LIVRES.join(" » et « ")} » à « Imprimer et partager », leurs partages éventuels retirés.`);
      console.log("Rien n'est fait. Pour le faire, ajoutez « --oui ».");
      return;
    }
    for (const p of projets) {
      await base.query("update public.scenes set etat = 'prete' where projet_id = $1 and supprime_le is null", [p.id]);
      await base.query(
        `update public.projets set livre_relu_le = coalesce(livre_relu_le, now()), chemins_verifies_le = coalesce(chemins_verifies_le, now()),
           mise_en_page_ouverte_le = coalesce(mise_en_page_ouverte_le, now()), mise_en_page_convient_le = coalesce(mise_en_page_convient_le, now()),
           imprimer_ouvert_le = coalesce(imprimer_ouvert_le, now()), derniere_etape_livre = 'sortie'
         where id = $1`,
        [p.id],
      );
      await base.query("delete from public.lectures_en_cours where projet_id = $1", [p.id]);
      await base.query("delete from public.partages where projet_id = $1", [p.id]);
      console.log(`« ${p.titre} » : « Imprimer et partager » ouverte, pas encore partagé.`);
    }
  } finally {
    await base.end();
  }
}

principal().catch((erreur: Error) => {
  console.error(erreur.message);
  process.exit(1);
});
