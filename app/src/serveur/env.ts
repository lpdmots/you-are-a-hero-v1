import "server-only";

/** Variables d'environnement du serveur : une erreur claire plutôt qu'un « undefined ». */
function lire(nom: string): string {
  const valeur = process.env[nom];
  if (!valeur) throw new Error(`Variable d'environnement manquante : ${nom}`);
  return valeur;
}

export const env = {
  get supabaseUrl() {
    return lire("NEXT_PUBLIC_SUPABASE_URL");
  },
  get clePubliable() {
    return lire("NEXT_PUBLIC_SUPABASE_CLE_PUBLIABLE");
  },
  /** Clé secrète de Supabase : contourne les règles d'accès, ne sert qu'à l'entrée des élèves. */
  get cleSecrete() {
    return lire("SUPABASE_CLE_SECRETE");
  },
  /** Clé de chiffrement des codes et des mots de passe de classe, en base64 (32 octets). */
  get cleAcces() {
    return lire("CLE_ACCES");
  },
  /** Clé privée (JWK) qui signe les jetons des postes d'élèves. */
  get cleSignaturePostes() {
    return lire("CLE_SIGNATURE_POSTES");
  },
};

/** Adresse publique de l'application, sans barre finale : sert à l'affiche et aux courriels. */
export function adresseDuSite(hote?: string | null): string {
  if (process.env.ADRESSE_SITE) return process.env.ADRESSE_SITE.replace(/\/$/, "");
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  if (hote) return `${hote.startsWith("localhost") || hote.startsWith("127.") ? "http" : "https"}://${hote}`;
  return "http://localhost:3000";
}
