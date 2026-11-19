import "server-only";
import { casesMasquees, composerLaFiche, type CaseDeFiche, type FicheDeLHistoire } from "@/domaine/fiche-histoire";
import type { Organisation } from "@/domaine/projets";
import type { Enseignant } from "./adulte";
import { projetDe } from "./lectures";
import { estUuid, planDe, preparationDe } from "./recit";

/**
 * La fiche de l'histoire d'un projet de l'adulte (F02.1), relue dans la Préparation et le plan à
 * chaque ouverture : une description de partie écrite y figure sans autre geste (F02-AC22). Un projet qui n'est pas le
 * sien ne rend rien : la base ne lui donne ni le projet ni sa Préparation (F02-AC24).
 */
export async function ficheDuProjet(
  e: Enseignant, projetId: string,
): Promise<{ fiche: FicheDeLHistoire; organisation: Organisation; masquees: CaseDeFiche[] } | null> {
  const projet = await projetDe(e, projetId);
  if (!projet) return null;
  const [preparation, plan, reglage] = await Promise.all([
    preparationDe(e, projet.id), planDe(e, projet.id), e.supabase.from("projets").select("fiche_masquee").eq("id", projet.id).maybeSingle(),
  ]);
  if (!preparation) return null;
  return {
    organisation: projet.organisation,
    // Les rubriques décochées sous « Réglages », gardées avec le projet (19 novembre 2026)
    masquees: casesMasquees(reglage.data?.fiche_masquee),
    fiche: composerLaFiche(
      { titre: projet.titre, organisation: projet.organisation, recit: projet.recit, consigneEcriture: projet.consigneEcriture },
      preparation,
      plan.parties,
    ),
  };
}

/** Garde les rubriques décochées de la fiche avec le projet ; un projet qui n'est pas le sien n'est pas touché. */
export async function garderLesRubriques(e: Enseignant, projetId: string, masquees: unknown): Promise<{ ok: true } | { ok: false; erreur: string }> {
  if (!estUuid(projetId)) return { ok: false, erreur: "Projet inconnu." };
  const { data, error } = await e.supabase.from("projets").update({ fiche_masquee: casesMasquees(masquees) }).eq("id", projetId).select("id");
  if (error || !data?.length) return { ok: false, erreur: "Ce réglage n’a pas pu être gardé. Réessayez." };
  return { ok: true };
}
