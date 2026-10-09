/**
 * Met dans le presse-papiers la clé de signature des postes, pour l'importer dans
 * Supabase (Project Settings > JWT Keys), sans l'afficher. Le presse-papiers est vidé
 * au bout d'une minute.
 *
 *   npm run cle:copier
 */
import { spawnSync } from "node:child_process";
import { lireEnv } from "./base-de-production";

const cle = lireEnv("production.env").get("CLE_SIGNATURE_POSTES");
if (!cle) {
  console.error("CLE_SIGNATURE_POSTES manque dans production.env : lancez « npm run cles ».");
  process.exit(1);
}
spawnSync("pbcopy", { input: JSON.stringify(JSON.parse(cle), null, 2) });
console.log("La clé est dans le presse-papiers. Collez-la dans Supabase ; elle en sera retirée dans une minute.");
spawnSync("sh", ["-c", "(sleep 60; printf '' | pbcopy) >/dev/null 2>&1 &"]);
