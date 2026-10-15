import "server-only";
import type { Enseignant } from "../adulte";
import { clientService } from "../supabase";
import { agencer, doute, liensDuPlan, mesuresDuModele, passagesOrdonnes, rangsDeLOrdre, type Modele, type PassageOrdonne } from "@/domaine/agencement";
import { hauteurDeLigne } from "@/domaine/mise-en-page";
import { planNumerote } from "@/domaine/numeros";
import { rangsActuels } from "@/domaine/ordre";
import { apercuDuLivre, VERSION_DE_LA_MESURE, type Apercu } from "./apercu";
import { contenuDuLivre, livreDuContenu, type ContenuDuLivre } from "./contenu";
import { composerLInstantane } from "./livre";
import { cheminDeLApercu, SEAU } from "./pdf";

/**
 * L'ordre des passages (F11.5, F11.6) : « Réordonner les passages » sur les hauteurs de la
 * dernière composition, et le doute qui naît quand un passage change de page après que
 * l'adulte a décidé de l'ordre.
 */

/** L'aperçu déjà gardé pour ce contenu, sans rien composer ; rien s'il n'est pas encore calculé. */
export async function apercuGarde(e: Enseignant, projetId: string, empreinte: string): Promise<Omit<Apercu, "adresse" | "empreinte"> | null> {
  const lu = await clientService().storage.from(SEAU).download(`${cheminDeLApercu(e.id, projetId, empreinte)}.json`);
  if (lu.error || !lu.data) return null;
  const garde = JSON.parse(await lu.data.text()) as Omit<Apercu, "adresse" | "empreinte">;
  return (garde as { version?: number }).version === VERSION_DE_LA_MESURE ? garde : null;
}

/** Les passages dans l'ordre imprimé, et les chemins : ce que l'écran lit pour suggérer un passage. */
export function ordreDuContenu(c: ContenuDuLivre): { ordre: PassageOrdonne[]; liens: Record<string, string[]> } {
  return { ordre: passagesOrdonnes(planNumerote(c.plan), livreDuContenu(c, []).passages), liens: liensDuPlan(c.plan.liens) };
}

export type Reordonne = { ok: true; annuler: Record<string, number>; decision: string | null; avant: number; apres: number } | { ok: false; erreur: string; rien?: boolean };

/**
 * « Réordonner les passages » : le livre est mesuré (l'aperçu de ce contenu, composé au besoin),
 * puis chaque groupe reçoit l'ordre qui laisse le moins de blanc selon le modèle. Une nouvelle
 * déclaration « La mise en page me convient » est demandée (F11.6).
 */
export async function reordonnerLeLivre(e: Enseignant, projetId: string): Promise<Reordonne> {
  const contenu = await contenuDuLivre(e, projetId);
  if (!contenu || !contenu.aChoix) return { ok: false, erreur: "Seul un récit à choix numérote ses passages." };
  if (!contenu.plan.parties.length) return { ok: false, erreur: "Le livre n’a pas encore de passages." };
  const apercu = await apercuDuLivre(e, projetId);
  if (!apercu?.hauteurUtile) return { ok: false, erreur: "Le livre n’a pas pu être mesuré. Réessayez dans un instant." };
  const { ordre, liens } = ordreDuContenu(contenu);
  const ligne = hauteurDeLigne(contenu.reglages) * 1.36;
  const modele: Modele = { hauteur: apercu.hauteurUtile, ligne, premiere: apercu.premierePageDuRecit || 1, mesures: mesuresDuModele(apercu.mesures, ligne), liens };
  const r = agencer(ordre, modele);
  const plan = planNumerote(contenu.plan);
  const rangs = rangsDeLOrdre(plan, r.suites, ordre);
  const annuler = rangsActuels(plan, Object.keys(rangs));
  // Le modèle est approché : l'ordre proposé est composé une fois, et gardé seulement s'il laisse moins de blanc
  const essai = {
    ...contenu,
    plan: { ...contenu.plan, parties: contenu.plan.parties.map((p) => ({ ...p, chapitres: p.chapitres.map((c) => ({ ...c, scenes: c.scenes.map((s) => (s.id in rangs ? { ...s, rangLivre: rangs[s.id] } : s)) })) })) },
  };
  const compose = await composerLInstantane({ livre: livreDuContenu(essai, []), etatDu: new Date().toISOString(), empreinte: "", images: contenu.images, problemes: [] }, true, true);
  const avant = apercu.blancTotal;
  const apres = compose.rapport.blancTotal;
  if (apres >= avant - 1 && compose.rapport.pages >= apercu.pages) {
    return { ok: false, rien: true, erreur: "Aucun autre ordre ne laisse moins de blanc : l’ordre actuel est gardé tel quel." };
  }
  const { data: projet } = await e.supabase.from("projets").select("ordre_decision").eq("id", projetId).maybeSingle();
  const place = await e.supabase.rpc("placer_passages", { p_projet: projetId, p_rangs: rangs });
  if (place.error) return { ok: false, erreur: "L’ordre n’a pas pu être changé." };
  await e.supabase
    .from("projets")
    .update({ ordre_decision: "reordonne", ordre_pages: null, ordre_agence_le: new Date().toISOString(), mise_en_page_convient_le: null })
    .eq("id", projetId);
  return { ok: true, annuler, decision: (projet?.ordre_decision as string | null) ?? null, avant: Math.round(avant), apres: Math.round(apres) };
}

export type EtatDeLOrdre = {
  decision: "reordonne" | "garde" | null;
  /** Un passage a changé de page depuis la décision : « Garder cet ordre » ou « Réordonner à nouveau » */
  doute: boolean;
  /** Des déplacements faits à la main depuis le dernier agencement : les relancer les abandonne */
  retouche: boolean;
};

/**
 * Où en est l'ordre : la décision, et le doute. La page de chaque passage se relève à la
 * première composition qui suit une décision ou un déplacement ; ensuite, un passage qui
 * change de page fait naître le doute (F11-AC86).
 */
export async function etatDeLOrdre(e: Enseignant, projetId: string, empreinte: string): Promise<EtatDeLOrdre> {
  const { data } = await e.supabase.from("projets").select("ordre_decision, ordre_pages, ordre_retouche_le, ordre_agence_le").eq("id", projetId).maybeSingle();
  const decision = (data?.ordre_decision as EtatDeLOrdre["decision"]) ?? null;
  const retouche = Boolean(data?.ordre_retouche_le && (!data.ordre_agence_le || data.ordre_retouche_le > data.ordre_agence_le));
  if (!decision) return { decision, doute: false, retouche };
  const apercu = await apercuGarde(e, projetId, empreinte);
  if (!apercu) return { decision, doute: false, retouche };
  const reference = data?.ordre_pages as Record<string, number> | null;
  if (!reference) {
    await e.supabase.from("projets").update({ ordre_pages: apercu.pageDe }).eq("id", projetId);
    return { decision, doute: false, retouche };
  }
  return { decision, doute: doute(reference, apercu.pageDe), retouche };
}
