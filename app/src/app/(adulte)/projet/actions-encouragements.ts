"use server";

import { revalidatePath } from "next/cache";
import { estCategorie, type Encouragement } from "@/domaine/encouragements";
import { exigerEnseignant } from "@/serveur/adulte";
import { encouragementsDeScene } from "@/serveur/encouragements";
import { estUuid } from "@/serveur/recit";

/**
 * Encouragements de l'enseignant (F07.5) : donner ou retirer un tampon sur une scène, et
 * montrer ou non le classement aux élèves. La base décide à qui va le tampon : à l'élève
 * qui s'occupe de la scène à ce moment-là.
 */

/** Un clic donne, un second retire (F07-AC76). La réponse rend les tampons de la scène, tels que la base les tient. */
export async function encourager(sceneId: string, categorie: string, donner: boolean): Promise<{ ok: true; donnes: Encouragement[] } | { ok: false; erreur: string }> {
  const e = await exigerEnseignant();
  if (!estUuid(sceneId) || !estCategorie(categorie) || typeof donner !== "boolean") return { ok: false, erreur: "Cet encouragement n’existe pas." };
  const { error } = await e.supabase.rpc("encourager", { p_scene: sceneId, p_categorie: categorie, p_donner: donner });
  if (error) return { ok: false, erreur: error.code === "P0001" ? error.message : "L’encouragement n’a pas pu être enregistré. Réessayez." };
  return { ok: true, donnes: await encouragementsDeScene(e, sceneId) };
}

/** « Montrer le classement aux élèves » : un réglage du projet, éteint par défaut (F07-AC51). */
export async function montrerClassement(projetId: string, montre: boolean): Promise<{ ok: true } | { ok: false; erreur: string }> {
  const e = await exigerEnseignant();
  if (!estUuid(projetId) || typeof montre !== "boolean") return { ok: false, erreur: "Ce réglage n’a pas pu être lu." };
  const { data, error } = await e.supabase.from("projets").update({ classement_montre: montre }).eq("id", projetId).eq("organisation", "classe").select("id");
  if (error || !data?.length) return { ok: false, erreur: "Le réglage n’a pas pu être enregistré. Réessayez." };
  revalidatePath(`/projet/${projetId}`, "layout");
  return { ok: true };
}
