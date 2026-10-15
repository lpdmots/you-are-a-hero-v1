import "server-only";
import { cache } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Enseignant } from "./adulte";
import { projetDe } from "./lectures";
import { estUuid, planDe, preparationDe } from "./recit";
import { controler, type Probleme } from "@/domaine/controles";
import { estEtapeLivre, type Acceptation, type Changement, type EtapeLivre } from "@/domaine/livre";

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

/** Ce que la destination Livre lit, en plus des contrôles : les « C'est voulu », les changements de chemins depuis, la déclaration. */
export type EtatDuLivre = {
  problemes: Probleme[];
  acceptations: Acceptation[];
  changements: Changement[];
  /** « J'ai vérifié les chemins » est posée */
  cheminsVerifies: boolean;
  /** « J'ai relu le livre » est posée */
  livreRelu: boolean;
  /** La dernière étape quittée, où le Livre se rouvre */
  derniereEtape: EtapeLivre | null;
};

export const etatDuLivre = cache(async (e: Enseignant, projetId: string): Promise<EtatDuLivre | null> => {
  const problemes = await controlesDuLivre(e, projetId);
  if (!problemes) return null;
  const [acceptees, projet] = await Promise.all([
    e.supabase.from("avertissements_acceptes").select("cle, empreinte, accepte_le").eq("projet_id", projetId),
    e.supabase.from("projets").select("chemins_verifies_le, livre_relu_le, derniere_etape_livre").eq("id", projetId).maybeSingle(),
  ]);
  const erreur = acceptees.error ?? projet.error;
  if (erreur) throw new Error(`Livre illisible : ${erreur.message}`);
  const acceptations: Acceptation[] = ((acceptees.data ?? []) as { cle: string; empreinte: string; accepte_le: string }[]).map((a) => ({
    cle: a.cle, empreinte: a.empreinte, accepteLe: a.accepte_le,
  }));
  // Seuls comptent les changements venus après la plus ancienne acceptation
  let changements: Changement[] = [];
  if (acceptations.length) {
    const depuis = acceptations.map((a) => a.accepteLe).sort()[0];
    const { data, error } = await e.supabase.from("chemins_changes").select("scene_id, sens, le").eq("projet_id", projetId).gt("le", depuis);
    if (error) throw new Error(`Livre illisible : ${error.message}`);
    changements = ((data ?? []) as { scene_id: string; sens: "entree" | "sortie"; le: string }[]).map((c) => ({ sceneId: c.scene_id, sens: c.sens, le: c.le }));
  }
  const derniere = projet.data?.derniere_etape_livre;
  return {
    problemes, acceptations, changements,
    cheminsVerifies: Boolean(projet.data?.chemins_verifies_le),
    livreRelu: Boolean(projet.data?.livre_relu_le),
    derniereEtape: estEtapeLivre(derniere) ? derniere : null,
  };
});
