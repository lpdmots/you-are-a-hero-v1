/**
 * Sauvegarde de la base, à la main (plan, « Avant de saisir des prénoms d'élèves réels »).
 *
 *   npm run sauvegarder             la vraie base
 *   npm run sauvegarder -- --local  la base locale, pour essayer la commande
 *
 * Écrit dans sauvegardes/<date>/ : roles.sql, schema.sql et donnees.sql (comptes compris).
 * Docker doit être ouvert. Les codes des élèves et les mots de passe de classe y sont
 * chiffrés : sans CLE_ACCES, gardée à part, ils ne se relisent pas. Les fichiers de
 * Supabase Storage (images, à partir de l'étape 2) ne sont pas dans cette sauvegarde.
 */
import { execFileSync } from "node:child_process";
import { mkdirSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { adresseDeProduction, masquer, racine } from "./base-de-production";
import { envDocker } from "./docker";

const local = process.argv.includes("--local");
const cible = local ? ["--local"] : ["--db-url", adresseDeProduction()];
const horodatage = new Date().toISOString().replace(/[:T]/g, "-").slice(0, 16);
const dossier = resolve(racine, "sauvegardes", `${horodatage}${local ? "-locale" : ""}`);
mkdirSync(dossier, { recursive: true });

const fichiers: [string, string[]][] = [
  ["roles.sql", ["--role-only"]],
  ["schema.sql", []],
  // Les données de l'application et les comptes : les tables internes de Supabase se recréent seules
  ["donnees.sql", ["--data-only", "--use-copy", "--schema", "public,auth"]],
];

for (const [nom, options] of fichiers) {
  process.stdout.write(`${nom}… `);
  try {
    execFileSync("npx", ["supabase", "db", "dump", ...cible, ...options, "-f", resolve(dossier, nom)], { cwd: racine, stdio: ["ignore", "pipe", "pipe"], env: envDocker() });
  } catch (erreur) {
    const detail = erreur instanceof Error && "stderr" in erreur ? String((erreur as { stderr: Buffer }).stderr) : String(erreur);
    console.error(`\nLa sauvegarde a échoué : ${masquer(detail).trim().split("\n").slice(-3).join(" ")}`);
    console.error("Docker est-il ouvert ? La base répond-elle (un projet gratuit s'endort après une semaine) ?");
    process.exit(1);
  }
  console.log(`${Math.max(1, Math.round(statSync(resolve(dossier, nom)).size / 1024))} Ko`);
}

console.log(`\nSauvegarde écrite dans ${dossier}`);
console.log("Gardez ce dossier ailleurs que sur cet ordinateur, avec la clé CLE_ACCES à part.");
