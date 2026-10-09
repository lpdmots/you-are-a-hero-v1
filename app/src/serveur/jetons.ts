import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { importJWK, SignJWT } from "jose";
import { env } from "./env";

/**
 * Jetons des postes d'élèves.
 *
 * Le navigateur du poste ne garde qu'un jeton opaque, dans un cookie illisible par
 * les scripts ; la base n'en garde que l'empreinte. Pour lire la base au nom du
 * poste, le serveur signe un jeton court dont le « sub » est l'identifiant du poste
 * et le rôle « poste » : ce jeton ne quitte pas le serveur.
 */

export const nouveauJeton = (): string => randomBytes(32).toString("base64url");

export const empreinte = (valeur: string): string => createHash("sha256").update(valeur, "utf8").digest("base64url");

const DUREE_SECONDES = 120;

export async function signerJetonDePoste(posteId: string): Promise<string> {
  const jwk = JSON.parse(env.cleSignaturePostes) as { kid?: string; kty: string; crv: string; x: string; y: string; d: string };
  // Seuls les champs de la clé elle-même : ses usages déclarés (« sign » et « verify ») sont
  // ceux de Supabase, qui vérifie aussi avec elle ; ici, elle ne fait que signer.
  const cle = await importJWK({ kty: jwk.kty, crv: jwk.crv, x: jwk.x, y: jwk.y, d: jwk.d }, "ES256");
  const maintenant = Math.floor(Date.now() / 1000);
  return new SignJWT({ role: "poste", acces: "poste" })
    .setProtectedHeader({ alg: "ES256", kid: jwk.kid, typ: "JWT" })
    .setSubject(posteId)
    .setAudience("authenticated")
    .setIssuedAt(maintenant)
    .setExpirationTime(maintenant + DUREE_SECONDES)
    .sign(cle);
}
