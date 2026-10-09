/**
 * Crée un compte d'enseignant dans la base LOCALE, pour essayer l'application à la main.
 *
 *   npm run compte:local -- prenom@exemple.test
 *
 * Le mot de passe est écrit dans .compte-local (hors de Git), jamais affiché.
 */
import { randomBytes } from "node:crypto";
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

const racine = resolve(__dirname, "..");
config({ path: resolve(racine, ".env.local"), quiet: true });
const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
if (!/^http:\/\/(127\.0\.0\.1|localhost)[:/]/.test(url)) {
  console.error("Cette commande ne parle qu'à la base locale.");
  process.exit(1);
}

async function principal() {
  const courriel = process.argv[2] ?? "essai@exemple.test";
  const motDePasse = `local-${randomBytes(9).toString("base64url")}`;
  const admin = createClient(url, process.env.SUPABASE_CLE_SECRETE!, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: liste } = await admin.auth.admin.listUsers();
  const deja = liste?.users.find((u) => u.email === courriel);
  const { error } = deja
    ? await admin.auth.admin.updateUserById(deja.id, { password: motDePasse })
    : await admin.auth.admin.createUser({ email: courriel, password: motDePasse, email_confirm: true });
  if (error) {
    console.error(`Le compte n'a pas pu être créé : ${error.message}`);
    process.exit(1);
  }
  writeFileSync(resolve(racine, ".compte-local"), `${courriel}\n${motDePasse}\n`, { mode: 0o600 });
  console.log(`Compte local ${courriel} prêt. Son mot de passe est dans app/.compte-local.`);
}

principal();
