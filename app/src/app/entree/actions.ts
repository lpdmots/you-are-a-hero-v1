"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { adresseDuSite } from "@/serveur/env";
import { sessionDeRecuperation } from "@/serveur/adulte";
import { clientAdulte } from "@/serveur/supabase";

export type EtatFormulaire = { erreur?: string; fait?: boolean };

/** Entrée de l'enseignant (F01-AC27) : la phrase ne dit pas lequel des deux est faux. */
export async function seConnecter(_avant: EtatFormulaire, formulaire: FormData): Promise<EtatFormulaire> {
  const adresse = String(formulaire.get("adresse") ?? "").trim();
  const motDePasse = String(formulaire.get("mot-de-passe") ?? "");
  if (!adresse || !motDePasse) return { erreur: "Écrivez votre adresse et votre mot de passe." };
  const supabase = await clientAdulte();
  const { error } = await supabase.auth.signInWithPassword({ email: adresse, password: motDePasse });
  if (error) {
    if (error.status === 429) return { erreur: "Trop d’essais. Attendez quelques minutes." };
    return { erreur: "L’adresse ou le mot de passe n’est pas le bon." };
  }
  redirect("/");
}

/** « Mot de passe oublié » (F01-AC29) : la même phrase, que l'adresse soit connue ou non. */
export async function demanderNouveauMotDePasse(_avant: EtatFormulaire, formulaire: FormData): Promise<EtatFormulaire> {
  const adresse = String(formulaire.get("adresse") ?? "").trim();
  if (!adresse.includes("@")) return { erreur: "Écrivez votre adresse électronique." };
  const supabase = await clientAdulte();
  const site = adresseDuSite((await headers()).get("host"));
  await supabase.auth.resetPasswordForEmail(adresse, { redirectTo: `${site}/entree/confirmer` });
  return { fait: true };
}

/** Le nouveau mot de passe, choisi après le lien reçu par courriel. */
export async function choisirMotDePasse(_avant: EtatFormulaire, formulaire: FormData): Promise<EtatFormulaire> {
  const motDePasse = String(formulaire.get("mot-de-passe") ?? "");
  if (motDePasse.length < 8) return { erreur: "Choisissez un mot de passe d’au moins huit caractères." };
  if (!(await sessionDeRecuperation())) return { erreur: "Ce lien n’est plus valable. Demandez-en un nouveau." };
  const supabase = await clientAdulte();
  const { error } = await supabase.auth.updateUser({ password: motDePasse });
  if (error) {
    return { erreur: error.code === "same_password" ? "Choisissez un mot de passe différent de l’ancien." : "Ce mot de passe n’a pas été accepté. Essayez-en un autre." };
  }
  redirect("/");
}

export async function seDeconnecter(): Promise<void> {
  const supabase = await clientAdulte();
  await supabase.auth.signOut({ scope: "local" });
  redirect("/entree");
}
