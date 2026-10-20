/**
 * Écrit .env.local d'après la base locale de Supabase (Docker).
 *
 *   npm run base:demarrer   puis   npm run env:local
 *
 * La clé de chiffrement locale est gardée d'une fois sur l'autre ; la clé de signature
 * est celle de supabase/signing_keys.json, que la base locale connaît aussi. Les clés des
 * fournisseurs d'IA, posées à la main par le porteur, sont gardées telles quelles, sans
 * jamais être affichées.
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { resolve } from "node:path";
import { envDocker } from "./docker";

const racine = resolve(__dirname, "..");
const cheminCles = resolve(racine, "supabase/signing_keys.json");
if (!existsSync(cheminCles)) {
  console.error("supabase/signing_keys.json manque : lancez d'abord « npm run cles ».");
  process.exit(1);
}

let sortie: string;
try {
  sortie = execFileSync("npx", ["supabase", "status", "-o", "env"], { cwd: racine, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], env: envDocker() });
} catch {
  console.error("La base locale ne répond pas : lancez « npm run base:demarrer » (Docker doit être ouvert).");
  process.exit(1);
}
const etat = new Map<string, string>();
for (const ligne of sortie.split("\n")) {
  const m = ligne.match(/^([A-Z0-9_]+)="?(.*?)"?$/);
  if (m) etat.set(m[1], m[2]);
}
const lire = (...noms: string[]): string => {
  for (const nom of noms) if (etat.get(nom)) return etat.get(nom)!;
  console.error(`Valeur introuvable dans « supabase status » : ${noms.join(" ou ")}`);
  process.exit(1);
};

const chemin = resolve(racine, ".env.local");
const avant = existsSync(chemin) ? readFileSync(chemin, "utf8") : "";
const cleAcces = avant.match(/^CLE_ACCES=(.+)$/m)?.[1] ?? randomBytes(32).toString("base64");
// Les clés des aides IA (étape 8) et de Stripe en mode d'essai (étape 9) : recopiées sans être
// lues ailleurs que dans ce fichier
const clesIa = ["ANTHROPIC_API_KEY", "OPENAI_API_KEY", "STRIPE_CLE_SECRETE", "STRIPE_SECRET_AVIS"]
  .map((nom) => avant.match(new RegExp(`^${nom}=.*$`, "m"))?.[0])
  .filter((ligne): ligne is string => !!ligne);
const cleSignature = JSON.stringify(JSON.parse(readFileSync(cheminCles, "utf8"))[0]);

writeFileSync(
  chemin,
  `# Base locale de Supabase (Docker). Écrit par « npm run env:local » : ne pas modifier.
NEXT_PUBLIC_SUPABASE_URL=${lire("API_URL")}
NEXT_PUBLIC_SUPABASE_CLE_PUBLIABLE=${lire("PUBLISHABLE_KEY", "ANON_KEY")}
SUPABASE_CLE_SECRETE=${lire("SECRET_KEY", "SERVICE_ROLE_KEY")}
CLE_ACCES=${cleAcces}
CLE_SIGNATURE_POSTES=${cleSignature}
# Pour les essais automatiques seulement
BASE_LOCALE_URL=${lire("DB_URL")}
COURRIER_LOCAL_URL=${etat.get("MAILPIT_URL") ?? etat.get("INBUCKET_URL") ?? "http://127.0.0.1:54324"}
# Les courriels de l'application (étape 9) : dans la même boîte locale
SMTP_HOTE=127.0.0.1
SMTP_PORT=54325
${clesIa.length ? `# Aides IA : clés posées à la main, gardées d'une fois sur l'autre\n${clesIa.join("\n")}\n` : ""}`,
  { mode: 0o600 },
);
console.log(`.env.local : écrit pour la base locale${clesIa.length ? `, ${clesIa.length} clé${clesIa.length > 1 ? "s" : ""} d'IA gardée${clesIa.length > 1 ? "s" : ""}` : ""}.`);
