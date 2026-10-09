/**
 * Prépare les clés de l'application, sans jamais les afficher.
 *
 *   npm run cles
 *
 * - supabase/signing_keys.json : clé de signature de la base locale (essais).
 * - production.env : clés de la vraie application, à compléter à la main
 *   avec les cinq valeurs du projet Supabase. Ce nom est voulu : Next.js charge de
 *   lui-même tout fichier « .env.production.local », et une application lancée en
 *   local parlerait alors à la vraie base.
 *
 * Rien n'est remplacé : une clé déjà présente est gardée, car la remplacer
 * rendrait illisibles les codes et le mot de passe de classe déjà chiffrés.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { generateKeyPairSync, randomBytes, randomUUID } from "node:crypto";
import { resolve } from "node:path";

const racine = resolve(__dirname, "..");

function cleDeSignature(): string {
  const { privateKey } = generateKeyPairSync("ec", { namedCurve: "P-256" });
  const jwk = privateKey.export({ format: "jwk" });
  return JSON.stringify({
    kty: jwk.kty,
    kid: randomUUID(),
    use: "sig",
    key_ops: ["sign", "verify"],
    alg: "ES256",
    ext: true,
    d: jwk.d,
    crv: jwk.crv,
    x: jwk.x,
    y: jwk.y,
  });
}

const cleDeChiffrement = () => randomBytes(32).toString("base64");

function lireEnv(chemin: string): Map<string, string> {
  const valeurs = new Map<string, string>();
  if (!existsSync(chemin)) return valeurs;
  for (const ligne of readFileSync(chemin, "utf8").split("\n")) {
    const m = ligne.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) valeurs.set(m[1], m[2]);
  }
  return valeurs;
}

// ——— Base locale ———
const cheminLocal = resolve(racine, "supabase/signing_keys.json");
if (existsSync(cheminLocal)) {
  console.log("supabase/signing_keys.json : déjà là, gardé.");
} else {
  writeFileSync(cheminLocal, `[${cleDeSignature()}]\n`, { mode: 0o600 });
  console.log("supabase/signing_keys.json : créé.");
}

// ——— Vraie application ———
const cheminProd = resolve(racine, "production.env");
const deja = lireEnv(cheminProd);
const garder = (nom: string, creer: () => string) => deja.get(nom) || creer();

const contenu = `# Clés de la vraie application. Ce fichier ne quitte pas cet ordinateur :
# il n'est ni dans Git, ni à coller dans une conversation.

# ——— À coller depuis le projet Supabase ———
# Project Settings > Data API > « Project URL »
NEXT_PUBLIC_SUPABASE_URL=${deja.get("NEXT_PUBLIC_SUPABASE_URL") ?? ""}
# Project Settings > API Keys > « Publishable key » (commence par sb_publishable_)
NEXT_PUBLIC_SUPABASE_CLE_PUBLIABLE=${deja.get("NEXT_PUBLIC_SUPABASE_CLE_PUBLIABLE") ?? ""}
# Project Settings > API Keys > « Secret keys » (commence par sb_secret_)
SUPABASE_CLE_SECRETE=${deja.get("SUPABASE_CLE_SECRETE") ?? ""}
# Le mot de passe de la base, choisi à la création du projet
SUPABASE_MOT_DE_PASSE_BASE=${deja.get("SUPABASE_MOT_DE_PASSE_BASE") ?? ""}
# Bouton « Connect » en haut du projet > « Session pooler » : l'adresse entière,
# telle qu'elle est affichée, avec [YOUR-PASSWORD] laissé tel quel
SUPABASE_ADRESSE_BASE=${deja.get("SUPABASE_ADRESSE_BASE") ?? ""}

# ——— Créées par « npm run cles » : ne pas modifier ———
# Chiffre les codes des élèves et le mot de passe de classe. À garder aussi dans
# votre gestionnaire de mots de passe : sans elle, une sauvegarde de la base ne
# rend pas les codes.
CLE_ACCES=${garder("CLE_ACCES", cleDeChiffrement)}
# Signe les accès des postes d'élèves. À importer une fois dans Supabase.
CLE_SIGNATURE_POSTES=${garder("CLE_SIGNATURE_POSTES", cleDeSignature)}
`;
writeFileSync(cheminProd, contenu, { mode: 0o600 });
console.log(
  deja.size ? "production.env : complété, valeurs gardées." : "production.env : créé.",
);
