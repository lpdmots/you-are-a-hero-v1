import "server-only";
import { createCipheriv, createDecipheriv, randomBytes, timingSafeEqual } from "node:crypto";
import { env } from "./env";

/**
 * Chiffrement des codes personnels et du mot de passe de classe (F06.4, architecture).
 *
 * L'enseignant doit pouvoir relire ces secrets : ils sont donc chiffrés, non hachés,
 * avec une clé gardée hors de la base (AES-256-GCM). Chaque texte chiffré est lié à
 * la ligne qu'il protège : recopié sur une autre ligne, il ne se déchiffre pas.
 *
 * Forme gardée : « v1.<iv>.<texte chiffré>.<sceau> », en base64url.
 */

export type Sujet = { sorte: "code" | "classe"; id: string };

const VERSION = "v1";

function cle(): Buffer {
  const octets = Buffer.from(env.cleAcces, "base64");
  if (octets.length !== 32) throw new Error("CLE_ACCES doit contenir 32 octets en base64.");
  return octets;
}

const lien = (sujet: Sujet): Buffer => Buffer.from(`${sujet.sorte}:${sujet.id}`, "utf8");

export function chiffrer(clair: string, sujet: Sujet): string {
  const iv = randomBytes(12);
  const chiffre = createCipheriv("aes-256-gcm", cle(), iv);
  chiffre.setAAD(lien(sujet));
  const corps = Buffer.concat([chiffre.update(clair, "utf8"), chiffre.final()]);
  return [VERSION, iv.toString("base64url"), corps.toString("base64url"), chiffre.getAuthTag().toString("base64url")].join(".");
}

export function dechiffrer(garde: string, sujet: Sujet): string {
  const [version, iv, corps, sceau] = garde.split(".");
  if (version !== VERSION || !iv || corps === undefined || !sceau) throw new Error("Secret illisible.");
  const dechiffre = createDecipheriv("aes-256-gcm", cle(), Buffer.from(iv, "base64url"));
  dechiffre.setAAD(lien(sujet));
  dechiffre.setAuthTag(Buffer.from(sceau, "base64url"));
  return Buffer.concat([dechiffre.update(Buffer.from(corps, "base64url")), dechiffre.final()]).toString("utf8");
}

/** Comparaison dont la durée ne dépend pas de l'endroit où les deux textes diffèrent. */
export function memeSecret(a: string, b: string): boolean {
  const x = Buffer.from(a, "utf8");
  const y = Buffer.from(b, "utf8");
  const longueur = Math.max(x.length, y.length, 1);
  const px = Buffer.alloc(longueur);
  const py = Buffer.alloc(longueur);
  x.copy(px);
  y.copy(py);
  return timingSafeEqual(px, py) && x.length === y.length;
}
