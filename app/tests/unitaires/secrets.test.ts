import { beforeAll, describe, expect, it } from "vitest";
import { generateKeyPairSync, randomBytes, randomUUID } from "node:crypto";
import { decodeProtectedHeader, importJWK, jwtVerify } from "jose";

let cleSignature: { kty: string; crv: string; x: string; y: string; d: string; kid: string; alg: string; use: string; key_ops: string[]; ext: boolean };

beforeAll(() => {
  process.env.CLE_ACCES = randomBytes(32).toString("base64");
  const { privateKey } = generateKeyPairSync("ec", { namedCurve: "P-256" });
  // La forme que donne Supabase, usages déclarés compris
  const jwk = privateKey.export({ format: "jwk" }) as { kty: string; crv: string; x: string; y: string; d: string };
  cleSignature = { ...jwk, kid: randomUUID(), alg: "ES256", use: "sig", key_ops: ["sign", "verify"], ext: true };
  process.env.CLE_SIGNATURE_POSTES = JSON.stringify(cleSignature);
});

describe("Chiffrement des codes et du mot de passe de classe (F06.4)", () => {
  it("F06-AC23 — un code chiffré se relit, et ne se lit pas dans ce qui est gardé", async () => {
    const { chiffrer, dechiffrer } = await import("@/serveur/chiffrement");
    const sujet = { sorte: "code" as const, id: "eleve-1" };
    const garde = chiffrer("4719", sujet);
    expect(garde).not.toContain("4719");
    expect(garde.startsWith("v1.")).toBe(true);
    expect(dechiffrer(garde, sujet)).toBe("4719");
  });

  it("deux chiffrements du même code ne se ressemblent pas", async () => {
    const { chiffrer } = await import("@/serveur/chiffrement");
    const sujet = { sorte: "code" as const, id: "eleve-1" };
    expect(chiffrer("4719", sujet)).not.toBe(chiffrer("4719", sujet));
  });

  it("un secret recopié sur une autre ligne, ou modifié, ne se déchiffre pas", async () => {
    const { chiffrer, dechiffrer } = await import("@/serveur/chiffrement");
    const garde = chiffrer("tigre nuage 42", { sorte: "classe", id: "classe-1" });
    expect(() => dechiffrer(garde, { sorte: "classe", id: "classe-2" })).toThrow();
    expect(() => dechiffrer(garde, { sorte: "code", id: "classe-1" })).toThrow();
    const morceaux = garde.split(".");
    morceaux[2] = Buffer.from("autre chose").toString("base64url");
    expect(() => dechiffrer(morceaux.join("."), { sorte: "classe", id: "classe-1" })).toThrow();
  });

  it("sans la clé de l'application, le secret reste illisible", async () => {
    const { chiffrer, dechiffrer } = await import("@/serveur/chiffrement");
    const sujet = { sorte: "code" as const, id: "eleve-1" };
    const garde = chiffrer("4719", sujet);
    const cle = process.env.CLE_ACCES;
    process.env.CLE_ACCES = randomBytes(32).toString("base64");
    expect(() => dechiffrer(garde, sujet)).toThrow();
    process.env.CLE_ACCES = cle;
  });

  it("compare deux secrets sans dépendre de leur longueur", async () => {
    const { memeSecret } = await import("@/serveur/chiffrement");
    expect(memeSecret("4719", "4719")).toBe(true);
    expect(memeSecret("4719", "4710")).toBe(false);
    expect(memeSecret("4719", "47190")).toBe(false);
    expect(memeSecret("", "")).toBe(true);
  });
});

describe("Jeton d'un poste d'élève", () => {
  it("porte le poste, le rôle « poste » et une durée courte, signés par la clé de l'application", async () => {
    const { signerJetonDePoste, empreinte, nouveauJeton } = await import("@/serveur/jetons");
    const poste = randomUUID();
    const jeton = await signerJetonDePoste(poste);
    const publique = { kty: cleSignature.kty, crv: cleSignature.crv, x: cleSignature.x, y: cleSignature.y };
    const { payload } = await jwtVerify(jeton, await importJWK(publique, "ES256"), { audience: "authenticated" });
    expect(payload.sub).toBe(poste);
    expect(payload.role).toBe("poste");
    expect((payload.exp ?? 0) - (payload.iat ?? 0)).toBeLessThanOrEqual(120);
    expect(decodeProtectedHeader(jeton).kid).toBe(cleSignature.kid);
    const a = nouveauJeton();
    expect(a).not.toBe(nouveauJeton());
    expect(empreinte(a)).toBe(empreinte(a));
    expect(empreinte(a)).not.toContain(a);
  });
});
