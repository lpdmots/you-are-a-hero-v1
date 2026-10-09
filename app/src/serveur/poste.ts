import "server-only";
import { cache } from "react";
import { cookies, headers } from "next/headers";
import type { SupabaseClient } from "@supabase/supabase-js";
import { normaliserIdentifiant, normaliserMotDePasse, codeValide } from "@/domaine/acces";
import { dechiffrer, memeSecret } from "./chiffrement";
import { env } from "./env";
import { empreinte, nouveauJeton, signerJetonDePoste } from "./jetons";
import { clientPoste, clientService } from "./supabase";

/**
 * Accès de classe sur un poste, puis accès individuel de l'élève (F06.4).
 *
 * Le poste garde un jeton opaque dans un cookie. À chaque demande, le serveur relit
 * l'état du poste dans la base : classe encore ouverte, mot de passe inchangé, année
 * en cours, élève toujours inscrit et actif depuis moins de deux heures.
 */

const COOKIE_POSTE = "poste";
const COOKIE_NAVIGATEUR = "navigateur";

const optionsCookie = (dureeSecondes: number) => ({
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: dureeSecondes,
});

export type EtatPoste = { posteId: string; classeId: string; inscriptionId: string | null; eleveId: string | null };

/** État du poste d'après son cookie ; null si la classe n'y est pas, ou plus, ouverte. */
export const etatDuPoste = cache(async (): Promise<EtatPoste | null> => {
  const jeton = (await cookies()).get(COOKIE_POSTE)?.value;
  if (!jeton) return null;
  const { data, error } = await clientService().rpc("etat_poste", { p_jeton_hash: empreinte(jeton) });
  if (error) throw new Error(`État du poste illisible : ${error.message}`);
  const ligne = Array.isArray(data) ? data[0] : data;
  if (!ligne) return null;
  return {
    posteId: ligne.poste_id,
    classeId: ligne.classe_id,
    inscriptionId: ligne.inscription_id ?? null,
    eleveId: ligne.eleve_id ?? null,
  };
});

/** Client de lecture au nom du poste : la base n'y montre que sa classe. */
export async function clientDuPoste(etat: EtatPoste): Promise<SupabaseClient> {
  return clientPoste(await signerJetonDePoste(etat.posteId));
}

/** Clés des essais faux : le navigateur du poste, et son adresse réseau, en empreintes. */
async function clesEssais(creerNavigateur: boolean): Promise<{ navigateur: string; reseau: string }> {
  const magasin = await cookies();
  let navigateur = magasin.get(COOKIE_NAVIGATEUR)?.value;
  if (!navigateur && creerNavigateur) {
    navigateur = nouveauJeton();
    magasin.set(COOKIE_NAVIGATEUR, navigateur, optionsCookie(60 * 60 * 24 * 365));
  }
  const entetes = await headers();
  const adresse = (entetes.get("x-forwarded-for") ?? "").split(",")[0].trim() || entetes.get("x-real-ip") || "inconnue";
  return {
    navigateur: `n:${empreinte(navigateur ?? "sans-cookie")}`,
    reseau: `r:${empreinte(`${adresse}|${env.cleAcces}`)}`,
  };
}

export type ResultatEntree = { ok: true } | { ok: false; raison: "faux" } | { ok: false; raison: "attente"; minutes: number };

const minutesRestantes = (jusqua: string): number =>
  Math.max(1, Math.ceil((new Date(jusqua).getTime() - Date.now()) / 60000));

/**
 * Ouvrir la classe sur ce poste (F06-AC43). Dix essais faux depuis ce navigateur, ou
 * cent en cinq minutes depuis cette adresse réseau, imposent cinq minutes d'attente
 * (F06-AC74, F06-AC83). Une classe dont l'année est terminée est refusée (F01-AC18).
 */
export async function ouvrirLaClasse(identifiantSaisi: string, motDePasseSaisi: string): Promise<ResultatEntree> {
  const service = clientService();
  const cles = await clesEssais(true);

  // L'essai est compté avant toute comparaison : dix demandes parties ensemble font dix essais
  const { data: attente, error: refus } = await service.rpc("prendre_essai_entree", { p_navigateur: cles.navigateur, p_reseau: cles.reseau });
  if (refus) throw new Error(`Essais d'entrée illisibles : ${refus.message}`);
  if (attente) return { ok: false, raison: "attente", minutes: minutesRestantes(attente) };

  const identifiant = normaliserIdentifiant(identifiantSaisi);
  const motDePasse = normaliserMotDePasse(motDePasseSaisi);
  const { data: classe } = await service
    .from("classes")
    .select("id, terminee_le, classes_secrets(mot_de_passe_chiffre)")
    .eq("identifiant", identifiant)
    .maybeSingle();

  let juste = false;
  const secret = classe?.classes_secrets as { mot_de_passe_chiffre: string } | { mot_de_passe_chiffre: string }[] | null | undefined;
  const chiffre = Array.isArray(secret) ? secret[0]?.mot_de_passe_chiffre : secret?.mot_de_passe_chiffre;
  if (classe && chiffre) {
    const attendu = dechiffrer(chiffre, { sorte: "classe", id: classe.id });
    juste = memeSecret(attendu, motDePasse) && classe.terminee_le === null;
  } else {
    memeSecret(motDePasse, "une comparaison pour rien"); // même durée, que l'identifiant existe ou non
  }

  if (!classe || !juste) {
    // Cet essai faux était peut-être le dixième : l'attente commence alors tout de suite
    const { data: depuis } = await service.rpc("entree_bloquee_jusqua", { p_navigateur: cles.navigateur, p_reseau: cles.reseau });
    return depuis ? { ok: false, raison: "attente", minutes: minutesRestantes(depuis) } : { ok: false, raison: "faux" };
  }

  await service.rpc("noter_entree_juste", { p_navigateur: cles.navigateur, p_reseau: cles.reseau });
  const jeton = nouveauJeton();
  const { data: posteId, error } = await service.rpc("ouvrir_poste", { p_classe: classe.id, p_jeton_hash: empreinte(jeton) });
  if (error) throw new Error(`La classe n'a pas pu être ouverte sur ce poste : ${error.message}`);
  // L'année a pu être terminée à l'instant : la classe ne s'ouvre plus (F01-AC18)
  if (!posteId) return { ok: false, raison: "faux" };
  // Le cookie dure un peu plus que l'accès : c'est la base qui ferme la classe à 3 h.
  (await cookies()).set(COOKIE_POSTE, jeton, optionsCookie(60 * 60 * 26));
  return { ok: true };
}

export type ResultatCode = { ok: true } | { ok: false; raison: "faux" | "inconnu" } | { ok: false; raison: "attente"; minutes: number };

/**
 * L'élève tape son code (F06-AC43). Le code n'est comparé que sur le serveur. Cinq
 * codes faux de suite : ce profil attend deux minutes, les autres non (F06-AC73).
 */
export async function entrerLeCode(inscriptionId: string, codeSaisi: string): Promise<ResultatCode> {
  const etat = await etatDuPoste();
  if (!etat) return { ok: false, raison: "inconnu" };

  // L'inscription doit être dans la classe ouverte sur ce poste : la base en répond.
  const { data: inscription } = await (await clientDuPoste(etat))
    .from("inscriptions")
    .select("id, eleve_id")
    .eq("id", inscriptionId)
    .maybeSingle();
  if (!inscription) return { ok: false, raison: "inconnu" };

  const service = clientService();
  // L'essai est compté avant toute comparaison : des demandes parties ensemble ne font pas
  // plus de cinq essais en deux minutes
  const { data: essai, error: refus } = await service.rpc("prendre_essai_code", { p_eleve: inscription.eleve_id });
  if (refus) throw new Error(`Essais de code illisibles : ${refus.message}`);
  const pris = (Array.isArray(essai) ? essai[0] : essai) as { autorise: boolean; attente_jusqua: string | null } | null;
  if (!pris) return { ok: false, raison: "inconnu" };
  if (!pris.autorise) return { ok: false, raison: "attente", minutes: minutesRestantes(pris.attente_jusqua ?? new Date().toISOString()) };

  const { data: secret } = await service.from("eleves_secrets").select("code_chiffre").eq("eleve_id", inscription.eleve_id).maybeSingle();
  if (!secret) return { ok: false, raison: "inconnu" };

  const code = codeSaisi.trim();
  const attendu = dechiffrer(secret.code_chiffre, { sorte: "code", id: inscription.eleve_id });
  if (!codeValide(code) || !memeSecret(attendu, code)) {
    // Ce code faux était peut-être le cinquième : l'attente commence alors tout de suite
    return pris.attente_jusqua ? { ok: false, raison: "attente", minutes: minutesRestantes(pris.attente_jusqua) } : { ok: false, raison: "faux" };
  }

  const { data: identifie } = await service.rpc("identifier_eleve", { p_poste: etat.posteId, p_inscription: inscription.id });
  return identifie ? { ok: true } : { ok: false, raison: "inconnu" };
}

/** « Changer d'élève » : l'accès individuel se termine, la classe reste ouverte (F06-AC15). */
export async function changerDEleve(): Promise<void> {
  const etat = await etatDuPoste();
  if (etat) await clientService().rpc("changer_eleve", { p_poste: etat.posteId });
}

/** « Quitter la classe » : plus aucun accès sur ce poste (F06-AC44). */
export async function quitterLaClasse(): Promise<void> {
  const etat = await etatDuPoste();
  if (etat) await clientService().rpc("quitter_classe", { p_poste: etat.posteId });
  (await cookies()).delete(COOKIE_POSTE);
}

/** L'élève a fait quelque chose : son accès individuel est prolongé (F06-AC76). */
export async function noterActivite(): Promise<void> {
  const etat = await etatDuPoste();
  if (etat?.inscriptionId) await clientService().rpc("noter_activite", { p_poste: etat.posteId });
}
