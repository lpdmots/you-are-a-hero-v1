"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
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
