/**
 * Met le schéma de la vraie base à jour d'après supabase/migrations.
 *
 *   npm run production:schema            montre ce qui serait appliqué
 *   npm run production:schema -- --oui   l'applique
 */
import { spawnSync } from "node:child_process";
import { adresseDeProduction, masquer, racine } from "./base-de-production";
import { envDocker } from "./docker";

const appliquer = process.argv.includes("--oui");
const r = spawnSync("npx", ["supabase", "db", "push", "--db-url", adresseDeProduction(), ...(appliquer ? ["--yes"] : ["--dry-run"])], { cwd: racine, encoding: "utf8", env: envDocker() });
console.log(masquer(`${r.stdout ?? ""}${r.stderr ?? ""}`).trim());
process.exit(r.status ?? 1);
