"use server";

import { revalidatePath } from "next/cache";
import { exigerEnseignant } from "@/serveur/adulte";
import { estUuid } from "@/serveur/recit";

/**
 * Le partage des scènes sans élève, à l'impression des fiches (F07.4). Tant que
 * l'enseignant n'a pas confirmé, rien n'est donné à personne ; confirmé, chaque scène
 * proposée passe au nom de son élève, comme une prise en charge ordinaire (F06-AC61).
 */

export type SceneDonnee = { scene: string; eleve: string };

/** « Répartir et imprimer » : une scène prise entre-temps par un autre n'est pas donnée ; la réponse dit celles qui l'ont été. */
export async function repartirScenes(projetId: string, propositions: SceneDonnee[]): Promise<{ ok: true; donnees: SceneDonnee[] } | { ok: false; erreur: string }> {
  const e = await exigerEnseignant();
  if (!estUuid(projetId) || !Array.isArray(propositions) || propositions.length > 400 || propositions.some((p) => !estUuid(p?.scene) || !estUuid(p?.eleve))) {
    return { ok: false, erreur: "Ce partage n’a pas pu être lu." };
  }
  const parEleve = new Map<string, string[]>();
  for (const p of propositions) parEleve.set(p.eleve, [...(parEleve.get(p.eleve) ?? []), p.scene]);
  const donnees: SceneDonnee[] = [];
  for (const [eleve, scenes] of parEleve) {
    // Seulement les scènes restées libres : la base vérifie que l'élève est du chapitre
    const { data, error } = await e.supabase
      .from("scenes")
      .update({ prise_par_eleve: eleve })
      .eq("projet_id", projetId)
      .in("id", scenes)
      .is("prise_par_eleve", null)
      .eq("prise_par_enseignant", false)
      .in("etat", ["cours", "reprendre"])
      .select("id");
    if (error) return { ok: false, erreur: error.code === "P0001" ? error.message : "Les scènes n’ont pas pu être réparties. Réessayez." };
    donnees.push(...((data ?? []) as { id: string }[]).map((s) => ({ scene: s.id, eleve })));
  }
  revalidatePath(`/projet/${projetId}`, "layout");
  return { ok: true, donnees };
}

/**
 * « Annuler la répartition », tant que l'enseignant reste sur la page des fiches (F07-AC73) :
 * les scènes encore au nom de l'élève proposé redeviennent « Pas encore prise ». Celle qu'un
 * autre élève a prise entre-temps lui reste.
 */
export async function annulerRepartition(projetId: string, donnees: SceneDonnee[]): Promise<{ ok: true; rendues: number } | { ok: false; erreur: string }> {
  const e = await exigerEnseignant();
  if (!estUuid(projetId) || !Array.isArray(donnees) || donnees.length > 400 || donnees.some((p) => !estUuid(p?.scene) || !estUuid(p?.eleve))) {
    return { ok: false, erreur: "Cette répartition n’a pas pu être lue." };
  }
  const parEleve = new Map<string, string[]>();
  for (const p of donnees) parEleve.set(p.eleve, [...(parEleve.get(p.eleve) ?? []), p.scene]);
  let rendues = 0;
  for (const [eleve, scenes] of parEleve) {
    const { data, error } = await e.supabase
      .from("scenes")
      .update({ prise_par_eleve: null })
      .eq("projet_id", projetId)
      .in("id", scenes)
      .eq("prise_par_eleve", eleve)
      .in("etat", ["cours", "reprendre"])
      .select("id");
    if (error) return { ok: false, erreur: "La répartition n’a pas pu être annulée. Réessayez." };
    rendues += data?.length ?? 0;
  }
  revalidatePath(`/projet/${projetId}`, "layout");
  return { ok: true, rendues };
}
