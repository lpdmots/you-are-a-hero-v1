import "server-only";
import { cache } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Enseignant } from "./adulte";
import { projetDe } from "./lectures";
import { estUuid, planDe, preparationDe } from "./recit";
import { controler, type Probleme } from "@/domaine/controles";

/**
 * Les contrôles du livre (F09.2), tels que l'adulte les lit : la règle est celle du domaine,
 * le serveur ne fait que lui donner le plan, la feuille d'aventure et les scènes qui portent
 * une action de jeu.
 */

/** Les scènes du projet dont le texte porte au moins une action de jeu (F04.2), lues sans les textes. */
export async function scenesAvecActions(base: SupabaseClient, projetId: string): Promise<Set<string>> {
  if (!estUuid(projetId)) return new Set();
  const { data, error } = await base.from("scenes").select("id").eq("projet_id", projetId).is("supprime_le", null).contains("texte", JSON.stringify([{ type: "action" }]));
  if (error) throw new Error(`Actions de jeu illisibles : ${error.message}`);
  return new Set((data ?? []).map((s: { id: string }) => s.id));
}

export const controlesDuLivre = cache(async (e: Enseignant, projetId: string): Promise<Probleme[] | null> => {
  const projet = await projetDe(e, projetId);
  if (!projet) return null;
  const [plan, preparation, actions] = await Promise.all([planDe(e, projetId), preparationDe(e, projetId), scenesAvecActions(e.supabase, projetId)]);
  const feuille = preparation?.feuille;
  return controler({ plan, aChoix: projet.recit === "choix", scenesAvecActions: actions, feuille: Boolean(feuille?.on && feuille.sections.length) });
});
