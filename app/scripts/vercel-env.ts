/**
 * Envoie à Vercel les variables de la vraie application, lues dans production.env, sans
 * les afficher. Le mot de passe et l'adresse de la base n'y vont pas : ils ne servent
 * qu'aux commandes de ce poste (schéma, sauvegarde).
 *
 *   npm run vercel:env
 */
import { spawnSync } from "node:child_process";
import { lireEnv, racine } from "./base-de-production";

const env = lireEnv("production.env");
const noms = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_CLE_PUBLIABLE", "SUPABASE_CLE_SECRETE", "CLE_ACCES", "CLE_SIGNATURE_POSTES"];

for (const nom of noms) {
  const valeur = env.get(nom);
  if (!valeur) {
    console.error(`${nom} manque dans production.env.`);
    process.exit(1);
  }
  const sorte = nom.startsWith("NEXT_PUBLIC_") ? "--no-sensitive" : "--sensitive";
  const r = spawnSync("vercel", ["env", "add", nom, "production", "--force", "--yes", sorte], { cwd: racine, input: valeur, encoding: "utf8" });
  console.log(`${r.status === 0 ? "  ✓" : "  ✗"} ${nom}`);
  if (r.status !== 0) {
    console.error((r.stderr ?? "").split("\n").filter(Boolean).slice(-2).join(" "));
    process.exit(1);
  }
}
console.log("Variables envoyées. Elles valent au prochain déploiement.");
