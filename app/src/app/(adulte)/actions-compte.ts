"use server";

import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { aUnMotDePasse } from "@/serveur/compte";
import { adresseDuSite, env } from "@/serveur/env";
import { clientService } from "@/serveur/supabase";
import { supprimerLeCompte } from "@/serveur/suppression";
import { lireReglagesIa, type ReglagesIa } from "@/domaine/aides-ia";
import { exigerEnseignant } from "@/serveur/adulte";

/** Nom sous lequel les élèves voient l'adulte (F01-AC13, F01-AC30). */
export async function enregistrerNomAffiche(nom: string): Promise<void> {
  const enseignant = await exigerEnseignant();
  const propre = nom.trim().replace(/\s+/g, " ").slice(0, 60);
  const { error } = await enseignant.supabase
    .from("enseignants")
    .update({ nom_affiche: propre || null })
    .eq("id", enseignant.id);
  if (error) throw new Error(error.message);
  revalidatePath("/", "layout");
}

/** « Ne plus afficher » d'un écran d'aide, tenu par le compte et non par le navigateur. */
export async function reglerAide(cle: string, masquee: boolean): Promise<void> {
  const enseignant = await exigerEnseignant();
  if (!/^[a-z-]{1,30}$/.test(cle)) return;
  const autres = enseignant.aidesMasquees.filter((c) => c !== cle);
  const { error } = await enseignant.supabase
    .from("enseignants")
    .update({ aides_masquees: masquee ? [...autres, cle] : autres })
    .eq("id", enseignant.id);
  if (error) throw new Error(error.message);
  revalidatePath("/", "layout");
}

/** Les réglages des aides IA, pour tous les projets du compte (F13). Relus sans confiance. */
export async function reglerAidesIa(reglages: Partial<ReglagesIa>): Promise<void> {
  const enseignant = await exigerEnseignant();
  const { error } = await enseignant.supabase
    .from("enseignants")
    .update({ reglages_ia: lireReglagesIa({ ...enseignant.reglagesIa, ...reglages }) })
    .eq("id", enseignant.id);
  if (error) throw new Error(error.message);
  revalidatePath("/", "layout");
}

/**
 * « Supprimer mon compte » (F14-AC26), confirmé par l'adresse retapée : projets, classes, élèves,
 * images et partages s'effacent aussitôt, et le compte ne s'ouvre plus. Une adresse mal tapée
 * n'efface rien. Le compte du porteur ne se supprime pas d'ici.
 */
export async function supprimerMonCompte(adresse: string): Promise<{ ok: false; erreur: string } | void> {
  const enseignant = await exigerEnseignant();
  if (enseignant.createur) return { ok: false, erreur: "Le compte du porteur ne se supprime pas d’ici." };
  if (!enseignant.courriel || adresse.trim().toLowerCase() !== enseignant.courriel.toLowerCase()) {
    return { ok: false, erreur: "Ce n’est pas l’adresse du compte : rien n’est supprimé." };
  }
  try {
    await supprimerLeCompte(enseignant.id);
  } catch (erreur) {
    console.error(erreur);
    return { ok: false, erreur: "Le compte n’a pas pu être supprimé. Réessayez, ou écrivez au créateur." };
  }
  await enseignant.supabase.auth.signOut({ scope: "local" });
  redirect("/entree?compte=supprime");
}

export type Reponse = { ok: true } | { ok: false; erreur: string };

/**
 * Changer d'adresse (F01, 21 octobre 2026) : un lien part vers la nouvelle adresse, et un autre
 * vers l'actuelle quand Supabase demande les deux confirmations ; l'adresse ne change qu'une
 * fois les liens ouverts. Jusque-là, on entre avec l'ancienne.
 */
export async function changerAdresse(nouvelle: string): Promise<Reponse> {
  const enseignant = await exigerEnseignant();
  const adresse = nouvelle.trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adresse)) return { ok: false, erreur: "Écrivez une adresse électronique." };
  if (adresse.toLowerCase() === (enseignant.courriel ?? "").toLowerCase()) return { ok: false, erreur: "C’est déjà votre adresse." };
  const site = adresseDuSite((await headers()).get("host"));
  const { error } = await enseignant.supabase.auth.updateUser({ email: adresse }, { emailRedirectTo: `${site}/entree/confirmer/adresse` });
  if (!error) return { ok: true };
  if (error.status === 429) return { ok: false, erreur: "Trop de demandes. Attendez quelques minutes." };
  if (error.code === "email_exists") return { ok: false, erreur: "Cette adresse a déjà un compte." };
  return { ok: false, erreur: "Le lien n’a pas pu partir. Réessayez." };
}

/**
 * Changer de mot de passe (F01, 21 octobre 2026) : l'actuel d'abord, vérifié sans toucher à la
 * session de ce poste ; un compte ouvert par Google, sans mot de passe, en choisit un.
 */
export async function changerMotDePasse(actuel: string, nouveau: string): Promise<Reponse> {
  const enseignant = await exigerEnseignant();
  if (nouveau.length < 8) return { ok: false, erreur: "Choisissez un mot de passe d’au moins huit caractères." };
  const { data } = await enseignant.supabase.auth.getUser();
  if (aUnMotDePasse(data.user)) {
    if (!actuel) return { ok: false, erreur: "Écrivez votre mot de passe actuel." };
    const verification = createClient(env.supabaseUrl, env.clePubliable, { auth: { persistSession: false, autoRefreshToken: false } });
    const { error } = await verification.auth.signInWithPassword({ email: enseignant.courriel ?? "", password: actuel });
    if (error) return { ok: false, erreur: error.status === 429 ? "Trop d’essais. Attendez quelques minutes." : "Ce n’est pas votre mot de passe actuel." };
    await verification.auth.signOut({ scope: "local" });
  }
  const { error } = await enseignant.supabase.auth.updateUser({ password: nouveau });
  if (!error) {
    if (!aUnMotDePasse(data.user)) await clientService().auth.admin.updateUserById(enseignant.id, { app_metadata: { mot_de_passe: true } });
    return { ok: true };
  }
  if (error.code === "same_password") return { ok: false, erreur: "C’est déjà votre mot de passe." };
  if (error.code === "weak_password") return { ok: false, erreur: "Ce mot de passe n’a pas été accepté. Essayez-en un autre." };
  if (error.code === "reauthentication_needed") return { ok: false, erreur: "Déconnectez-vous, puis reconnectez-vous avant de changer de mot de passe." };
  return { ok: false, erreur: "Le mot de passe n’a pas pu changer. Réessayez." };
}
