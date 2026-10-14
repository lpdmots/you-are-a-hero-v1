import "server-only";
import type { Enseignant } from "./adulte";
import { projetDe } from "./lectures";
import { estUuid, planDe, preparationDe } from "./recit";
import type { Texte } from "@/domaine/copie";
import { livrePourLAdulte, type LivreLu } from "@/domaine/lecture";
import type { Plan } from "@/domaine/recit";

/**
 * La lecture d'essai de l'adulte (F09.1) : le livre entier, texte courant de chaque scène, lu
 * en une fois. Les notes de l'enseignant n'en sortent pas : la lecture montre le livre.
 */
export async function livreALirePourLAdulte(e: Enseignant, projetId: string): Promise<{ livre: LivreLu; plan: Plan; titre: string; aChoix: boolean } | null> {
  if (!estUuid(projetId)) return null;
  const projet = await projetDe(e, projetId);
  if (!projet) return null;
  const [plan, preparation, textes] = await Promise.all([
    planDe(e, projetId),
    preparationDe(e, projetId),
    e.supabase.from("scenes").select("id, texte").eq("projet_id", projetId).is("supprime_le", null),
  ]);
  if (textes.error) throw new Error(`Textes illisibles : ${textes.error.message}`);
  const aChoix = projet.recit === "choix";
  const livre = livrePourLAdulte(plan, new Map(((textes.data ?? []) as { id: string; texte: Texte | null }[]).map((s) => [s.id, s.texte ?? []])), {
    aChoix, formule: preparation?.formuleRenvoi ?? "rends", marqueFin: preparation?.marqueFin ?? "Fin",
    feuille: preparation?.feuille ?? null, regles: preparation?.regles ?? "",
  });
  return { livre, plan, titre: projet.titre, aChoix };
}
