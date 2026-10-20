"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { adresseDuSite } from "@/serveur/env";
import { sessionDeRecuperation } from "@/serveur/adulte";
import { clientAdulte } from "@/serveur/supabase";

// adresse : ce qui était écrit, rendu au formulaire après un refus pour ne pas le retaper
// nonConfirmee : le compte existe mais son adresse attend la confirmation (F14-AC01)
export type EtatFormulaire = { erreur?: string; fait?: boolean; adresse?: string; nonConfirmee?: boolean };

/** Entrée de l'enseignant (F01-AC27) : la phrase ne dit pas lequel des deux est faux. */
export async function seConnecter(_avant: EtatFormulaire, formulaire: FormData): Promise<EtatFormulaire> {
  const adresse = String(formulaire.get("email") ?? "").trim();
  const motDePasse = String(formulaire.get("password") ?? "");
  if (!adresse || !motDePasse) return { erreur: "Écrivez votre adresse et votre mot de passe." };
  const supabase = await clientAdulte();
  const { error } = await supabase.auth.signInWithPassword({ email: adresse, password: motDePasse });
  if (error) {
    if (error.status === 429) return { erreur: "Trop d’essais. Attendez quelques minutes.", adresse };
    // Le bon mot de passe, mais l'adresse pas encore confirmée : seul son titulaire l'apprend
    if (error.code === "email_not_confirmed") {
      return { erreur: "Votre adresse n’est pas encore confirmée : ouvrez le lien du courriel reçu.", adresse, nonConfirmee: true };
    }
    return { erreur: "L’adresse ou le mot de passe n’est pas le bon.", adresse };
  }
  redirect("/");
}

/**
 * Créer un compte par adresse (F14-AC01) : un courriel de confirmation part, et le compte
 * ne s'ouvre qu'avec son lien. Une adresse qui a déjà un compte reçoit un autre courriel,
 * qui propose d'entrer ou de choisir un nouveau mot de passe ; l'écran dit la même chose
 * dans les deux cas, et rien n'apprend à un inconnu que l'adresse existe (F14-AC04).
 */
export async function sInscrire(_avant: EtatFormulaire, formulaire: FormData): Promise<EtatFormulaire> {
  const adresse = String(formulaire.get("email") ?? "").trim();
  const motDePasse = String(formulaire.get("password") ?? "");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adresse)) return { erreur: "Écrivez votre adresse électronique.", adresse };
  if (motDePasse.length < 8) return { erreur: "Choisissez un mot de passe d’au moins huit caractères.", adresse };
  const supabase = await clientAdulte();
  const site = adresseDuSite((await headers()).get("host"));
  const { data, error } = await supabase.auth.signUp({
    email: adresse,
    password: motDePasse,
    options: { emailRedirectTo: `${site}/entree/confirmer` },
  });
  // Une adresse qui a déjà un compte : Supabase le dit (ou rend un compte sans identité) et
  // n'écrit rien ; le courriel « Vous avez déjà un compte » part par son lien magique, dont le
  // modèle ne contient aucun lien de connexion
  const dejaPrise = error?.code === "user_already_exists" || (!error && (data.user?.identities ?? []).length === 0);
  if (dejaPrise) {
    await supabase.auth.signInWithOtp({ email: adresse, options: { shouldCreateUser: false, emailRedirectTo: `${site}/entree` } });
  } else if (error) {
    if (error.status === 429) return { erreur: "Trop d’essais. Attendez quelques minutes.", adresse };
    if (error.code === "weak_password") return { erreur: "Ce mot de passe n’a pas été accepté. Essayez-en un autre.", adresse };
    return { erreur: "Le compte n’a pas pu être créé. Réessayez.", adresse };
  }
  return { fait: true, adresse };
}

/** « Renvoyer le courriel » de confirmation, depuis l'entrée ou l'inscription. */
export async function renvoyerConfirmation(_avant: EtatFormulaire, formulaire: FormData): Promise<EtatFormulaire> {
  const adresse = String(formulaire.get("email") ?? "").trim();
  if (!adresse.includes("@")) return { erreur: "Écrivez votre adresse électronique." };
  const supabase = await clientAdulte();
  const site = adresseDuSite((await headers()).get("host"));
  const { error } = await supabase.auth.resend({ type: "signup", email: adresse, options: { emailRedirectTo: `${site}/entree/confirmer` } });
  if (error?.status === 429) return { erreur: "Un courriel vient déjà de partir. Attendez une minute.", adresse };
  return { fait: true, adresse };
}

/** « Mot de passe oublié » (F01-AC29) : la même phrase, que l'adresse soit connue ou non. */
export async function demanderNouveauMotDePasse(_avant: EtatFormulaire, formulaire: FormData): Promise<EtatFormulaire> {
  const adresse = String(formulaire.get("email") ?? "").trim();
  if (!adresse.includes("@")) return { erreur: "Écrivez votre adresse électronique." };
  const supabase = await clientAdulte();
  const site = adresseDuSite((await headers()).get("host"));
  await supabase.auth.resetPasswordForEmail(adresse, { redirectTo: `${site}/entree/confirmer` });
  return { fait: true };
}

/** Le nouveau mot de passe, choisi après le lien reçu par courriel. */
export async function choisirMotDePasse(_avant: EtatFormulaire, formulaire: FormData): Promise<EtatFormulaire> {
  const motDePasse = String(formulaire.get("password") ?? "");
  if (motDePasse.length < 8) return { erreur: "Choisissez un mot de passe d’au moins huit caractères." };
  if (!(await sessionDeRecuperation())) return { erreur: "Ce lien n’est plus valable. Demandez-en un nouveau." };
  const supabase = await clientAdulte();
  const { error } = await supabase.auth.updateUser({ password: motDePasse });
  if (error) {
    return { erreur: error.code === "same_password" ? "Choisissez un mot de passe différent de l’ancien." : "Ce mot de passe n’a pas été accepté. Essayez-en un autre." };
  }
  redirect("/");
}

/**
 * « Continuer avec Google » (F01-AC31, F14-AC02) : l'adulte choisit son compte chez Google,
 * puis revient par /entree/confirmer. Le compte de même adresse s'ouvre ; sans compte, il
 * se crée.
 */
export async function entrerAvecGoogle(): Promise<void> {
  const supabase = await clientAdulte();
  const site = adresseDuSite((await headers()).get("host"));
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    // Sur un ordinateur partagé, Google demande toujours quel compte utiliser
    options: { redirectTo: `${site}/entree/confirmer`, queryParams: { prompt: "select_account" } },
  });
  redirect(error || !data.url ? "/entree?refus=echec" : data.url);
}

export async function seDeconnecter(): Promise<void> {
  const supabase = await clientAdulte();
  await supabase.auth.signOut({ scope: "local" });
  redirect("/entree");
}
