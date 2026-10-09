/**
 * Lance l'outil de Supabase avec l'environnement de Docker : « npm run base:demarrer »,
 * « npm run base:arreter », « npm run base:remettre-a-zero ».
 */
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { envDocker } from "./docker";

const resultat = spawnSync("npx", ["supabase", ...process.argv.slice(2)], { cwd: resolve(__dirname, ".."), stdio: "inherit", env: envDocker() });
process.exit(resultat.status ?? 1);
