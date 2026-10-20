/**
 * Restaurer une sauvegarde de la nuit, depuis le seau S3 (étape 9, lot 8, F14-AC31) : la base,
 * puis les images, remontées à leurs chemins dans le stockage.
 *
 *   npm run restaurer:s3 -- <jour>                   dans la base locale (essai)
 *   npm run restaurer:s3 -- <jour> --production      dans la vraie base, après un accident
 *   npm run restaurer:s3 -- --depuis <dossier>       un dossier déjà descendu du seau
 *
 * <jour> : le dossier du seau, « 2026-10-21 ». La descente passe par l'outil d'AWS en ligne de
 * commande, avec un accès qui lit le seau (celui du porteur, pas celui de GitHub, qui ne fait que
 * déposer) ; le nom du seau est lu dans SEAU_S3, ou dans production.env. Docker doit être ouvert.
 * La base visée est remplacée, comme par « npm run restaurer » ; les images s'ajoutent, et
 * remplacent celles qui portent le même chemin.
 */
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { config } from "dotenv";
import { lireEnv, racine } from "./base-de-production";
import { clientDuStockage, remonterLeDossier } from "./stockage";

const options = process.argv.slice(2);
const production = options.includes("--production");
const i = options.indexOf("--depuis");
const jour = options.find((o, n) => !o.startsWith("--") && options[n - 1] !== "--depuis");

async function principal() {
  let dossier: string;
  if (i >= 0 && options[i + 1]) {
    dossier = resolve(options[i + 1]);
  } else {
    if (!jour || !/^\d{4}-\d{2}-\d{2}$/.test(jour)) throw new Error("Indiquez le jour de la sauvegarde : npm run restaurer:s3 -- 2026-10-21");
    const seau = process.env.SEAU_S3 ?? lireEnv("production.env").get("SEAU_S3");
    if (!seau) throw new Error("Le nom du seau manque : SEAU_S3=… dans production.env.");
    dossier = resolve(racine, "sauvegardes", `${jour}-s3`);
    console.log(`Descente de s3://${seau}/${jour}/…`);
    const r = spawnSync("aws", ["s3", "cp", `s3://${seau}/${jour}/`, dossier, "--recursive", "--only-show-errors"], { stdio: "inherit" });
    if (r.status !== 0) throw new Error("La descente du seau a échoué : l'outil « aws » est-il installé et réglé avec un accès qui lit le seau ?");
  }
  if (!existsSync(resolve(dossier, "base", "donnees.sql"))) throw new Error(`Pas de sauvegarde dans ${dossier} (base/donnees.sql manque).`);

  // La base : « npm run restaurer », qui demande confirmation vers la vraie base
  const base = spawnSync("npx", ["tsx", "scripts/restaurer.ts", resolve(dossier, "base"), ...(production ? ["--production"] : [])], { cwd: racine, stdio: "inherit" });
  if (base.status !== 0) process.exit(base.status ?? 1);

  // Les images, dans le stockage visé
  let url: string;
  let cle: string;
  if (production) {
    const env = lireEnv("production.env");
    url = env.get("NEXT_PUBLIC_SUPABASE_URL") ?? "";
    cle = env.get("SUPABASE_CLE_SECRETE") ?? "";
  } else {
    config({ path: resolve(racine, ".env.local"), quiet: true });
    url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
    cle = process.env.SUPABASE_CLE_SECRETE ?? "";
  }
  const images = resolve(dossier, "images");
  if (!existsSync(images)) {
    console.log("Aucune image dans cette sauvegarde.");
    return;
  }
  process.stdout.write("Les images… ");
  const n = await remonterLeDossier(clientDuStockage(url, cle), "images", images);
  console.log(`${n} fichier${n > 1 ? "s" : ""} remis à leur place.`);
}

principal().catch((erreur) => {
  console.error(erreur instanceof Error ? erreur.message : erreur);
  process.exit(1);
});
