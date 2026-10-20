/**
 * La sauvegarde de la nuit (étape 9, lot 8, F14-AC30) : la base, en trois fichiers SQL, et les
 * images du seau « images » de Supabase Storage, dans un dossier que le workflow de GitHub
 * (`.github/workflows/sauvegarde-nocturne.yml`) dépose ensuite dans le seau S3. Les PDF ne sont
 * pas copiés : ils se refont depuis le livre.
 *
 *   npm run sauvegarde:nuit -- --dossier <dossier>            la vraie base (production.env)
 *   npm run sauvegarde:nuit -- --dossier <dossier> --local    la base locale, pour essayer
 *
 * Le dossier reçoit base/ (roles.sql, schema.sql, donnees.sql) et images/ (les fichiers, à
 * leurs chemins). Un échec, de la base ou d'un fichier, fait échouer la nuit : GitHub prévient.
 */
import { config } from "dotenv";
import { resolve } from "node:path";
import { adresseDeProduction, lireEnv, racine } from "./base-de-production";
import { clientDuStockage, descendreLeSeau } from "./stockage";
import { viderLaBase } from "./vider-la-base";

const options = process.argv.slice(2);
const local = options.includes("--local");
const i = options.indexOf("--dossier");
const dossier = i >= 0 && options[i + 1] ? resolve(options[i + 1]) : resolve(racine, "sauvegardes", `${new Date().toISOString().slice(0, 10)}-nuit${local ? "-locale" : ""}`);

async function principal() {
  let url: string;
  let cle: string;
  let cible: string[];
  if (local) {
    config({ path: resolve(racine, ".env.local"), quiet: true });
    url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
    cle = process.env.SUPABASE_CLE_SECRETE ?? "";
    cible = ["--local"];
    if (!/^http:\/\/(127\.0\.0\.1|localhost)[:/]/.test(url)) throw new Error("La base locale ne répond pas : « npm run base:demarrer » puis « npm run env:local ».");
  } else {
    const env = lireEnv("production.env");
    url = env.get("NEXT_PUBLIC_SUPABASE_URL") ?? "";
    cle = env.get("SUPABASE_CLE_SECRETE") ?? "";
    cible = ["--db-url", adresseDeProduction()];
  }
  if (!url || !cle) throw new Error("Il manque NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_CLE_SECRETE.");

  console.log("La base :");
  viderLaBase(cible, resolve(dossier, "base"));
  process.stdout.write("Les images… ");
  const n = await descendreLeSeau(clientDuStockage(url, cle), "images", resolve(dossier, "images"));
  console.log(`${n} fichier${n > 1 ? "s" : ""}`);
  console.log(`\nSauvegarde de la nuit écrite dans ${dossier}`);
}

principal().catch((erreur) => {
  console.error(erreur instanceof Error ? erreur.message : erreur);
  process.exit(1);
});
