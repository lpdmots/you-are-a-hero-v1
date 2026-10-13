import "server-only";
import type { Enseignant } from "./adulte";
import { estUuid } from "./recit";
import { lettresDe, type Texte } from "@/domaine/copie";

/**
 * Ce qu'une fiche de rédaction imprime d'une scène, en plus de sa consigne (F07.4) : le
 * texte déjà écrit, la reprise demandée, l'image posée dans la scène. L'adulte seul le lit.
 */
export type ContenuDeFiche = {
  /** Les paragraphes de récit déjà écrits, sans les notes de l'enseignant ni les phrases de choix */
  texte: string[];
  /** La première image posée dans la scène */
  image: string | null;
  /** La dernière reprise demandée : sa remarque, vide quand elle a été demandée sans rien écrire */
  remarque: string | null;
};

export async function contenusDesFiches(e: Enseignant, projetId: string): Promise<Record<string, ContenuDeFiche>> {
  if (!estUuid(projetId)) return {};
  const [scenes, remarques] = await Promise.all([
    e.supabase.from("scenes").select("id, texte, etat").eq("projet_id", projetId).is("supprime_le", null),
    e.supabase.from("remarques").select("scene_id, texte, cree_le").eq("projet_id", projetId).order("cree_le"),
  ]);
  const erreur = scenes.error ?? remarques.error;
  if (erreur) throw new Error(`Fiches de rédaction illisibles : ${erreur.message}`);
  // La plus récente l'emporte : les lignes arrivent de la plus ancienne à la plus récente
  const derniere = new Map(((remarques.data ?? []) as { scene_id: string; texte: string }[]).map((r) => [r.scene_id, r.texte]));
  return Object.fromEntries(
    ((scenes.data ?? []) as { id: string; texte: Texte | null; etat: string }[]).map((s) => {
      const texte = s.texte ?? [];
      const image = texte.find((b) => b.type === "image");
      return [
        s.id,
        {
          texte: texte.flatMap((b) => (b.type === "p" && lettresDe(b).trim() ? [lettresDe(b).trim()] : [])),
          image: image?.type === "image" ? image.image : null,
          remarque: s.etat === "reprendre" ? (derniere.get(s.id) ?? "") : null,
        },
      ];
    }),
  );
}
