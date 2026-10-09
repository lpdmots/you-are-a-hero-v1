"use server";

import { revalidatePath } from "next/cache";
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
