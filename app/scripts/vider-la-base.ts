/**
 * Le contenu d'une base, écrit en trois fichiers SQL par l'outil de Supabase : rôles, schéma, et
 * données de l'application avec les comptes. Docker doit être ouvert. Commun à la sauvegarde à la
 * main et à celle de la nuit.
 */
import { execFileSync } from "node:child_process";
import { mkdirSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { masquer, racine } from "./base-de-production";
import { envDocker } from "./docker";

const FICHIERS: [string, string[]][] = [
  ["roles.sql", ["--role-only"]],
  ["schema.sql", []],
  // Les données de l'application et les comptes : les tables internes de Supabase se recréent seules
  ["donnees.sql", ["--data-only", "--use-copy", "--schema", "public,auth"]],
];

/** Écrit la base visée (« --local », ou « --db-url <adresse> ») dans le dossier ; lève une erreur lisible sinon. */
export function viderLaBase(cible: string[], dossier: string, dire: (texte: string) => void = (t) => process.stdout.write(t)): void {
  mkdirSync(dossier, { recursive: true });
  for (const [nom, options] of FICHIERS) {
    dire(`${nom}… `);
    try {
      execFileSync("npx", ["supabase", "db", "dump", ...cible, ...options, "-f", resolve(dossier, nom)], { cwd: racine, stdio: ["ignore", "pipe", "pipe"], env: envDocker() });
    } catch (erreur) {
      const detail = erreur instanceof Error && "stderr" in erreur ? String((erreur as { stderr: Buffer }).stderr) : String(erreur);
      throw new Error(`La sauvegarde a échoué : ${masquer(detail).trim().split("\n").slice(-3).join(" ")}`);
    }
    dire(`${Math.max(1, Math.round(statSync(resolve(dossier, nom)).size / 1024))} Ko\n`);
  }
}
