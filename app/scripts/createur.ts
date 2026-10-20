/**
 * Marque le compte du porteur (F14) : il n'a pas de solde d'étoiles ni de limite gratuite, et il
 * ouvre les pages d'administration. L'application ne pose jamais cette marque ; un adulte ne peut
 * pas l'écrire.
 *
 *   npm run createur                                  le compte de .compte-local, dans la base locale
 *   npm run createur -- adresse                       ce compte, dans la base locale
 *   npm run createur -- --production adresse          dit ce qui serait fait dans la vraie base
 *   npm run createur -- --production adresse --oui   le fait
 *
 * Un seul compte porte la marque : la poser sur un autre la retire du précédent.
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { config } from "dotenv";
import { Client } from "pg";
import { adresseDeProduction, masquer, racine } from "./base-de-production";

const options = process.argv.slice(2);
const production = options.includes("--production");
const oui = options.includes("--oui");
const locale = (adresse: string) => /^postgres(ql)?:\/\/[^@]*@(127\.0\.0\.1|localhost)[:/]/.test(adresse);

let adresseBase: string;
if (production) {
  adresseBase = adresseDeProduction();
} else {
  config({ path: resolve(racine, ".env.local"), quiet: true });
  adresseBase = process.env.BASE_LOCALE_URL ?? "";
  if (!locale(adresseBase)) {
    console.error("Sans « --production », cette commande ne parle qu'à la base locale : lancez « npm run base:demarrer » puis « npm run env:local ».");
    process.exit(1);
  }
}
const compteLocal = resolve(racine, ".compte-local");
// La première ligne de .compte-local est l'adresse du compte ; le mot de passe n'est pas lu
const courriel = options.find((o) => !o.startsWith("--")) ?? (!production && existsSync(compteLocal) ? readFileSync(compteLocal, "utf8").split("\n")[0].trim() : "");

async function principal() {
  if (!courriel) {
    console.error(production ? "Donnez l'adresse du compte : npm run createur -- --production adresse" : "Aucun compte : lancez « npm run compte:local », ou donnez l'adresse du compte.");
    process.exit(1);
  }
  const base = new Client({ connectionString: adresseBase });
  await base.connect();
  try {
    const { rows } = await base.query<{ id: string }>("select id from auth.users where lower(email) = lower($1)", [courriel]);
    if (rows.length !== 1) {
      console.error(`Aucun compte à l'adresse ${courriel} dans ${production ? "la vraie base" : "la base locale"}.`);
      process.exit(1);
    }
    const { rows: avant } = await base.query<{ n: number }>("select count(*)::int as n from public.enseignants where createur and id <> $1", [rows[0].id]);
    if (production && !oui) {
      console.log(`Serait marqué comme compte du porteur, dans la vraie base : ${courriel}${avant[0].n ? ` (la marque quitterait ${avant[0].n} autre compte)` : ""}. Ajoutez « --oui » pour le faire.`);
      return;
    }
    await base.query("begin");
    await base.query("update public.enseignants set createur = false where createur and id <> $1", [rows[0].id]);
    await base.query("update public.enseignants set createur = true where id = $1", [rows[0].id]);
    await base.query("commit");
    console.log(`${courriel} est le compte du porteur : ni solde ni limite, et l'administration.`);
  } catch (erreur) {
    await base.query("rollback").catch(() => {});
    console.error(masquer(erreur instanceof Error ? erreur.message : String(erreur)));
    process.exit(1);
  } finally {
    await base.end();
  }
}

principal();
