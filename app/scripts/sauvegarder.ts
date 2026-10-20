/**
 * Sauvegarde de la base, à la main (plan, « Avant de saisir des prénoms d'élèves réels »).
 *
 *   npm run sauvegarder             la vraie base
 *   npm run sauvegarder -- --local  la base locale, pour essayer la commande
 *
 * Écrit dans sauvegardes/<date>/ : roles.sql, schema.sql et donnees.sql (comptes compris).
 * Docker doit être ouvert. Les codes des élèves et les mots de passe de classe y sont
 * chiffrés : sans CLE_ACCES, gardée à part, ils ne se relisent pas. Les fichiers de
 * Supabase Storage ne sont pas dans cette sauvegarde : celle de la nuit les copie
 * (`npm run sauvegarde:nuit`, étape 9).
 */
import { resolve } from "node:path";
import { adresseDeProduction, racine } from "./base-de-production";
import { viderLaBase } from "./vider-la-base";

const local = process.argv.includes("--local");
const cible = local ? ["--local"] : ["--db-url", adresseDeProduction()];
const horodatage = new Date().toISOString().replace(/[:T]/g, "-").slice(0, 16);
const dossier = resolve(racine, "sauvegardes", `${horodatage}${local ? "-locale" : ""}`);

try {
  viderLaBase(cible, dossier);
} catch (erreur) {
  console.error(`\n${erreur instanceof Error ? erreur.message : erreur}`);
  console.error("Docker est-il ouvert ? La base répond-elle (un projet gratuit s'endort après une semaine) ?");
  process.exit(1);
}

console.log(`\nSauvegarde écrite dans ${dossier}`);
console.log("Gardez ce dossier ailleurs que sur cet ordinateur, avec la clé CLE_ACCES à part.");
