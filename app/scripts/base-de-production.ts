/**
 * Adresse de la vraie base, lue dans production.env, pour les commandes de
 * sauvegarde, de restauration et de mise à jour du schéma. Elle n'est jamais affichée.
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

export const racine = resolve(__dirname, "..");

export function lireEnv(fichier: string): Map<string, string> {
  const chemin = resolve(racine, fichier);
  const valeurs = new Map<string, string>();
  if (!existsSync(chemin)) return valeurs;
  for (const ligne of readFileSync(chemin, "utf8").split("\n")) {
    const m = ligne.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) valeurs.set(m[1], m[2].trim());
  }
  return valeurs;
}

/** Adresse de connexion à la vraie base, mot de passe compris et encodé. */
export function adresseDeProduction(): string {
  const env = lireEnv("production.env");
  const adresse = env.get("SUPABASE_ADRESSE_BASE");
  const motDePasse = env.get("SUPABASE_MOT_DE_PASSE_BASE");
  if (!adresse || !motDePasse) {
    console.error("Il manque SUPABASE_ADRESSE_BASE ou SUPABASE_MOT_DE_PASSE_BASE dans production.env.");
    process.exit(1);
  }
  if (!adresse.includes("[YOUR-PASSWORD]")) {
    console.error("SUPABASE_ADRESSE_BASE doit garder [YOUR-PASSWORD] tel quel : le mot de passe est lu sur sa propre ligne.");
    process.exit(1);
  }
  return adresse.replace("[YOUR-PASSWORD]", encodeURIComponent(motDePasse));
}

/** Masque le mot de passe d'une adresse dans un message d'erreur. */
export const masquer = (texte: string): string => texte.replace(/(postgres(?:ql)?:\/\/[^:\s]+:)[^@\s]+@/g, "$1•••@");
