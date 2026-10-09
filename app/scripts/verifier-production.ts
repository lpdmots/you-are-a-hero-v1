/**
 * Vérifie la vraie base depuis ce poste, sans rien y écrire et sans rien afficher de secret.
 *
 *   npm run verifier:production
 *
 * - le schéma de l'application est en place ;
 * - quelqu'un sans compte ne lit aucune table et ne peut pas s'inscrire ;
 * - Supabase accepte un jeton de poste signé par l'application (clé importée), avec le
 *   rôle « poste », et ne lui montre rien tant qu'aucune classe n'est ouverte.
 */
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { importJWK, SignJWT } from "jose";
import { lireEnv } from "./base-de-production";

const env = lireEnv("production.env");
const url = env.get("NEXT_PUBLIC_SUPABASE_URL") ?? "";
const publiable = env.get("NEXT_PUBLIC_SUPABASE_CLE_PUBLIABLE") ?? "";
const secrete = env.get("SUPABASE_CLE_SECRETE") ?? "";
const sansSession = { auth: { persistSession: false, autoRefreshToken: false } };

let echecs = 0;
const dire = (ok: boolean, texte: string, detail = "") => {
  if (!ok) echecs += 1;
  console.log(`${ok ? "  ✓" : "  ✗"} ${texte}${detail ? ` — ${detail}` : ""}`);
};

async function principal() {
  if (!url || !publiable || !secrete) {
    console.error("production.env est incomplet.");
    process.exit(1);
  }
  console.log(`Vraie base : ${url}`);

  const service = createClient(url, secrete, sansSession);
  const tables = ["enseignants", "classes", "classes_secrets", "horaires", "eleves", "eleves_secrets", "inscriptions", "projets", "postes", "essais_entree"];
  const manquantes: string[] = [];
  for (const table of tables) {
    const { error } = await service.from(table).select("*", { count: "exact", head: true });
    if (error) manquantes.push(table);
  }
  dire(manquantes.length === 0, "Le schéma de l'application est en place", manquantes.length ? `tables absentes : ${manquantes.join(", ")}` : "");

  const inconnu = createClient(url, publiable, sansSession);
  const lues: string[] = [];
  for (const table of tables) {
    const { data, error } = await inconnu.from(table).select("*").limit(1);
    if (!error && data) lues.push(table);
  }
  dire(lues.length === 0, "Sans compte ni poste, aucune table ne se lit", lues.length ? `lisibles : ${lues.join(", ")}` : "");

  // Lu dans les réglages publics de Supabase Auth : aucun compte d'essai n'est créé
  const reglages = await (await fetch(`${url}/auth/v1/settings`, { headers: { apikey: publiable } })).json().catch(() => null);
  const fermees = reglages?.disable_signup === true;
  dire(fermees, "Les inscriptions publiques sont fermées", fermees ? "" : "à fermer dans Supabase : Authentication > Sign In / Providers > « Allow new users to sign up »");
  const google = reglages?.external?.google === true;
  dire(google, "La connexion par Google est réglée dans Supabase", google ? "" : "Authentication > Sign In / Providers > Google, avec l'identifiant et le secret créés chez Google");
  const comptes = await service.auth.admin.listUsers({ page: 1, perPage: 50 });
  console.log(`    ${comptes.data?.users.length ?? "?"} compte(s) d'adulte dans la vraie base`);

  const jwk = JSON.parse(env.get("CLE_SIGNATURE_POSTES") ?? "{}");
  const cle = await importJWK({ kty: jwk.kty, crv: jwk.crv, x: jwk.x, y: jwk.y, d: jwk.d }, "ES256");
  const maintenant = Math.floor(Date.now() / 1000);
  const jeton = await new SignJWT({ role: "poste", acces: "poste" })
    .setProtectedHeader({ alg: "ES256", kid: jwk.kid, typ: "JWT" })
    .setSubject(randomUUID())
    .setAudience("authenticated")
    .setIssuedAt(maintenant)
    .setExpirationTime(maintenant + 60)
    .sign(cle);
  const poste = createClient(url, publiable, { accessToken: async () => jeton });
  const ouvert = await poste.rpc("travail_ouvert");
  dire(!ouvert.error && ouvert.data === false, "Supabase accepte le jeton d'un poste signé par l'application", ouvert.error ? `${ouvert.error.code ?? ""} ${ouvert.error.message}`.trim() : "");
  const classes = await poste.from("classes").select("id");
  dire(!classes.error && classes.data?.length === 0, "Un poste sans classe ouverte ne lit aucune classe", classes.error?.message ?? "");
  const secrets = await poste.from("eleves_secrets").select("eleve_id");
  dire(secrets.error?.code === "42501", "Un poste ne lit pas les codes des élèves");

  console.log(echecs ? `\n${echecs} point(s) à régler.` : "\nTout est en ordre.");
  process.exit(echecs ? 1 : 0);
}

principal();
