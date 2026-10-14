import "server-only";
import type { Enseignant } from "./adulte";
import { projetDe } from "./lectures";
import { estUuid, planDe, preparationDe } from "./recit";
import type { Texte } from "@/domaine/copie";
import { livrePourLAdulte, livrePourLEleve, type DonneesDuPoste, type LivreDeLEleve, type LivreLu } from "@/domaine/lecture";
import { feuillePropre } from "@/domaine/preparation";
import { clientDuPoste } from "./poste";
import { numerosDuPoste, type ContexteEleve } from "./recit-eleve";
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

/**
 * La lecture d'essai d'un élève (F09.1) : la base ne rend au poste que ce qu'il peut lire
 * (`lecture_du_poste`), et le serveur n'envoie à la page que le livre qu'il en tire — ni le
 * titre ni le texte d'un chapitre fermé, ni ce qu'une scène est hors du livre (F09-AC23).
 */
export async function livreALirePourLEleve(c: ContexteEleve, projetId: string): Promise<{ livre: LivreDeLEleve; titre: string } | null> {
  if (!estUuid(projetId) || !c.ouvert) return null;
  const base = await clientDuPoste(c.poste);
  const [lu, projet, numeros] = await Promise.all([
    base.rpc("lecture_du_poste", { p_projet: projetId }),
    base.from("projets").select("titre").eq("id", projetId).maybeSingle(),
    numerosDuPoste(c, projetId),
  ]);
  if (lu.error) throw new Error(`Lecture illisible : ${lu.error.message}`);
  const donnees = lu.data as DonneesDuPoste | null;
  if (!donnees || !projet.data) return null;
  return { livre: livrePourLEleve(donnees, numeros, donnees.feuille ? feuillePropre(donnees.feuille) : null), titre: projet.data.titre as string };
}
