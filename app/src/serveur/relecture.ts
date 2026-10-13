import "server-only";
import type { Enseignant } from "./adulte";
import { estUuid } from "./recit";
import type { Texte } from "@/domaine/copie";
import { estEtat, type Etat } from "@/domaine/etats";

/**
 * La relecture d'une scène par l'adulte (F07.1, F07.3) : son état, ce que les élèves ont
 * remis, les reprises demandées. Toutes ces lectures passent par son propre accès.
 */

/** Le texte tel qu'un élève l'a remis, conservé sans jamais être modifié. */
export type Remise = { id: string; eleveId: string | null; remisLe: string; texte: Texte };

/** Retour de révision : à l'écran, « remarque ». Une ligne par reprise demandée, même sans remarque écrite. */
export type Remarque = { id: string; remiseId: string | null; eleveId: string | null; texte: string; creeLe: string };

export type Relecture = {
  etat: Etat;
  /** Avance à chaque changement d'état ou remise : la page le présente avant « Validé » ou « Prête » (F07-AC26) */
  tour: number;
  /** De la plus ancienne à la plus récente */
  remises: Remise[];
  remarques: Remarque[];
};

export async function relectureDe(e: Enseignant, sceneId: string): Promise<Relecture | null> {
  if (!estUuid(sceneId)) return null;
  const [scene, remises, remarques] = await Promise.all([
    e.supabase.from("scenes").select("etat, tour").eq("id", sceneId).maybeSingle(),
    e.supabase.from("remises").select("id, eleve_id, remis_le, texte").eq("scene_id", sceneId).order("remis_le"),
    e.supabase.from("remarques").select("id, remise_id, eleve_id, texte, cree_le").eq("scene_id", sceneId).order("cree_le"),
  ]);
  const erreur = scene.error ?? remises.error ?? remarques.error;
  if (erreur) throw new Error(`Relecture de la scène illisible : ${erreur.message}`);
  if (!scene.data) return null;
  return {
    etat: estEtat(scene.data.etat) ? scene.data.etat : "cours",
    tour: (scene.data.tour as number) ?? 0,
    remises: ((remises.data ?? []) as { id: string; eleve_id: string | null; remis_le: string; texte: Texte }[]).map((r) => ({
      id: r.id, eleveId: r.eleve_id, remisLe: r.remis_le, texte: r.texte ?? [],
    })),
    remarques: ((remarques.data ?? []) as { id: string; remise_id: string | null; eleve_id: string | null; texte: string; cree_le: string }[]).map((r) => ({
      id: r.id, remiseId: r.remise_id, eleveId: r.eleve_id, texte: r.texte, creeLe: r.cree_le,
    })),
  };
}
