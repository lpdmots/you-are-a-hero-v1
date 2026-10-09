import { createHash, randomBytes, randomUUID } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { Client } from "pg";
import { chiffrer } from "@/serveur/chiffrement";
import { signerJetonDePoste } from "@/serveur/jetons";

/** Outils des essais contre la base locale : comptes, classes, élèves, postes. */

const url = () => process.env.NEXT_PUBLIC_SUPABASE_URL!;
const publiable = () => process.env.NEXT_PUBLIC_SUPABASE_CLE_PUBLIABLE!;
const sansSession = { auth: { persistSession: false, autoRefreshToken: false } };

export const service = (): SupabaseClient => createClient(url(), process.env.SUPABASE_CLE_SECRETE!, sansSession);
/** Quelqu'un sans compte ni poste : la seule clé publiable. */
export const inconnu = (): SupabaseClient => createClient(url(), publiable(), sansSession);

/** Accès direct à la base, pour préparer une situation ou avancer l'horloge d'une ligne. */
export async function sql<T extends Record<string, unknown> = Record<string, unknown>>(requete: string, valeurs: unknown[] = []): Promise<T[]> {
  const client = new Client({ connectionString: process.env.BASE_LOCALE_URL });
  await client.connect();
  try {
    return (await client.query(requete, valeurs)).rows as T[];
  } finally {
    await client.end();
  }
}

/** Ce que la base répond à un poste : la fonction interne est appelée avec son jeton, dans une même transaction. */
export async function inscriptionVueParLaBase(posteId: string): Promise<string | null> {
  const client = new Client({ connectionString: process.env.BASE_LOCALE_URL });
  await client.connect();
  try {
    await client.query("begin");
    await client.query("select set_config('request.jwt.claims', $1, true)", [JSON.stringify({ sub: posteId, role: "poste" })]);
    const { rows } = await client.query("select prive.inscription_du_poste() as i");
    await client.query("rollback");
    return rows[0].i ?? null;
  } finally {
    await client.end();
  }
}

export type Adulte = { id: string; courriel: string; motDePasse: string; base: SupabaseClient };
const crees: string[] = [];

export async function creerEnseignant(nomAffiche?: string): Promise<Adulte> {
  const courriel = `essai-${randomUUID()}@exemple.test`;
  const motDePasse = `essai-${randomBytes(9).toString("base64url")}`;
  const { data, error } = await service().auth.admin.createUser({ email: courriel, password: motDePasse, email_confirm: true });
  if (error || !data.user) throw new Error(`Compte d'essai : ${error?.message}`);
  crees.push(data.user.id);
  const base = createClient(url(), publiable(), sansSession);
  const connexion = await base.auth.signInWithPassword({ email: courriel, password: motDePasse });
  if (connexion.error) throw new Error(`Connexion d'essai : ${connexion.error.message}`);
  if (nomAffiche) await base.from("enseignants").update({ nom_affiche: nomAffiche }).eq("id", data.user.id);
  return { id: data.user.id, courriel, motDePasse, base };
}

/** Supprime les comptes d'essai : leurs classes, élèves et projets partent avec eux. */
export async function nettoyer(): Promise<void> {
  const admin = service();
  for (const id of crees.splice(0)) await admin.auth.admin.deleteUser(id);
}

export type ClasseEssai = { id: string; identifiant: string; motDePasse: string };

export async function creerClasse(adulte: Adulte, nom = "CM1-CM2", anneeDebut = 2026, motDePasse = "tigre nuage 42"): Promise<ClasseEssai> {
  const id = randomUUID();
  const identifiant = `essai${randomBytes(5).toString("hex")}`;
  const { error } = await adulte.base.rpc("creer_classe", {
    p_id: id, p_nom: nom, p_annee_debut: anneeDebut, p_identifiant: identifiant,
    p_mot_de_passe_chiffre: chiffrer(motDePasse, { sorte: "classe", id }),
  });
  if (error) throw new Error(`Classe d'essai : ${error.message}`);
  return { id, identifiant, motDePasse };
}

export type EleveEssai = { id: string; prenom: string; nom: string | null; code: string; inscriptionId: string };

export async function inscrire(adulte: Adulte, classeId: string, noms: string[], connus: string[] = []): Promise<EleveEssai[]> {
  const nouveaux = noms.map((ligne, i) => {
    const [prenom, ...reste] = ligne.split(" ");
    const id = randomUUID();
    const code = String(1000 + ((i * 37 + 4719) % 9000));
    return { id, prenom, nom: reste.join(" ") || null, couleur: i % 10, code, code_chiffre: chiffrer(code, { sorte: "code", id }) };
  });
  const { error } = await adulte.base.rpc("inscrire_eleves", {
    p_classe: classeId, p_connus: connus,
    p_nouveaux: nouveaux.map(({ id, prenom, nom, couleur, code_chiffre }) => ({ id, prenom, nom, couleur, code_chiffre })),
  });
  if (error) throw new Error(`Inscription d'essai : ${error.message}`);
  const { data } = await adulte.base.from("inscriptions").select("id, eleve_id").eq("classe_id", classeId);
  const inscription = new Map((data ?? []).map((i) => [i.eleve_id, i.id]));
  return nouveaux.map((n) => ({ id: n.id, prenom: n.prenom, nom: n.nom, code: n.code, inscriptionId: inscription.get(n.id)! }));
}

export type PosteEssai = { id: string; jetonHash: string; base: () => Promise<SupabaseClient> };

/** Ouvre la classe sur un poste, comme le fait le serveur une fois le mot de passe accepté. */
export async function ouvrirPoste(classeId: string): Promise<PosteEssai | null> {
  const jetonHash = createHash("sha256").update(randomBytes(32)).digest("base64url");
  const { data, error } = await service().rpc("ouvrir_poste", { p_classe: classeId, p_jeton_hash: jetonHash });
  if (error) throw new Error(`Poste d'essai : ${error.message}`);
  if (!data) return null;
  const id = data as string;
  // Un jeton neuf à chaque lecture, comme le serveur : il ne vaut que deux minutes
  return { id, jetonHash, base: async () => createClient(url(), publiable(), { accessToken: async () => signerJetonDePoste(id) }) };
}

export async function identifier(poste: PosteEssai, inscriptionId: string): Promise<boolean> {
  const { data, error } = await service().rpc("identifier_eleve", { p_poste: poste.id, p_inscription: inscriptionId });
  if (error) throw new Error(error.message);
  return data === true;
}

export async function etat(poste: PosteEssai): Promise<{ classe_id: string; inscription_id: string | null; eleve_id: string | null } | null> {
  const { data, error } = await service().rpc("etat_poste", { p_jeton_hash: poste.jetonHash });
  if (error) throw new Error(error.message);
  return (Array.isArray(data) ? data[0] : data) ?? null;
}

/** Lignes qu'un accès lit dans une table ; une table interdite compte pour zéro, avec son refus. */
export async function lire(base: SupabaseClient, table: string, colonnes = "*"): Promise<{ lignes: Record<string, unknown>[]; refus: string | null }> {
  const { data, error } = await base.from(table).select(colonnes);
  return { lignes: (data as unknown as Record<string, unknown>[] | null) ?? [], refus: error ? `${error.code} ${error.message}` : null };
}
