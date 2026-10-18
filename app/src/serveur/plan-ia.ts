import "server-only";
import { MESSAGES_IA } from "@/domaine/aides-ia";
import { chapitresDe, type Plan as PlanDuRecit } from "@/domaine/recit";
import type { Enseignant } from "./adulte";
import { chapitres as aideChapitres, parties as aideParties, resume as aideResume, type ChapitrePropose, type Ensemble, type EntreePlan } from "./ia/aides/plan";
import { carnetDe, type Plan } from "./ia/aides/contexte";
import { demanderUneAide } from "./ia/demander";
import { lireDejaMontrees, lireOrientation } from "./idees-de-choix";
import { projetDe } from "./lectures";
import { estUuid, planDe, preparationDe } from "./recit";

/**
 * Parties, chapitres et résumés (F13.5), côté serveur. Comme pour les autres aides, le serveur
 * relit lui-même ce qui part : la Préparation (univers, personnages, enjeu), le plan avec les
 * résumés des chapitres, et pour un résumé les titres et consignes des scènes du chapitre —
 * jamais un texte d'élève, un prénom ni le nom de l'adulte (F13, ce qui est transmis). La page
 * ne redit que l'orientation et les titres déjà montrés. Rien n'est écrit ici : la demande seule
 * ne change pas le projet (F13-AC15) ; les parties et les chapitres s'ajoutent par les actions
 * ordinaires, et le résumé à « Utiliser ce texte ».
 */

export type SortePlan = "parties" | "chapitres" | "resume";
export const estSortePlan = (v: unknown): v is SortePlan => v === "parties" || v === "chapitres" || v === "resume";

export type ReponsePlan =
  | { ok: true; sorte: "parties"; ensembles: Ensemble[]; reste: string | null }
  | { ok: true; sorte: "chapitres"; chapitres: ChapitrePropose[]; reste: string | null }
  | { ok: true; sorte: "resume"; resume: string; reste: string | null }
  | { ok: false; message: string };

const INTROUVABLE = "Ce projet n’existe plus.";
const cle = (t: string) => t.replace(/\s+/g, " ").trim().toLocaleLowerCase("fr");

/** Le plan tel que les aides le lisent : titres et résumés, sans élève ni état. */
export const planPourLesAides = (plan: PlanDuRecit): Plan =>
  plan.parties.map((p) => ({ partie: p.titre, chapitres: p.chapitres.map((c) => ({ titre: c.titre, resume: c.resume || undefined })) }));

async function entreeDuProjet(e: Enseignant, projetId: string): Promise<{ entree: Omit<EntreePlan, "orientation" | "dejaMontres">; plan: PlanDuRecit } | null> {
  if (!estUuid(projetId)) return null;
  const [projet, preparation, plan] = await Promise.all([projetDe(e, projetId), preparationDe(e, projetId), planDe(e, projetId)]);
  if (!projet || !preparation) return null;
  return {
    plan,
    entree: {
      histoire: { titre: projet.titre, mode: projet.organisation, recit: projet.recit, niveaux: projet.organisation === "classe" ? e.reglagesIa.niveaux : [] },
      carnet: carnetDe(preparation),
      plan: planPourLesAides(plan),
    },
  };
}

/**
 * « Ajouter une partie │ ✦ » (F13.5) : dix ensembles « partie, premier chapitre, résumé » en une
 * demande. Une partie dont le titre est déjà dans le plan, ou déjà montré, n'est pas reproposée.
 */
export async function demanderDesParties(e: Enseignant, projetId: string, options: { orientation?: unknown; dejaMontres?: unknown } = {}): Promise<ReponsePlan> {
  const lu = await entreeDuProjet(e, projetId);
  if (!lu) return { ok: false, message: INTROUVABLE };
  const dejaMontres = lireDejaMontrees(options.dejaMontres);
  const r = await demanderUneAide(e, aideParties, { ...lu.entree, orientation: lireOrientation(options.orientation), dejaMontres });
  if (!r.ok) return { ok: false, message: r.message };
  const pris = new Set([...lu.plan.parties.map((p) => cle(p.titre)), ...dejaMontres.map(cle)]);
  const ensembles = r.valeur.ensembles.filter((x) => {
    const k = cle(x.partie);
    if (pris.has(k)) return false;
    pris.add(k);
    return true;
  });
  if (!ensembles.length) return { ok: false, message: MESSAGES_IA.pasDeReponse };
  return { ok: true, sorte: "parties", ensembles, reste: r.reste };
}

/**
 * « Ajouter un chapitre │ ✦ » (F13.5) : six chapitres pour une partie, d'après la Préparation, la
 * partie, ses chapitres et l'orientation. Un titre déjà dans la partie n'est pas reproposé.
 */
export async function demanderDesChapitres(e: Enseignant, partieId: string, options: { orientation?: unknown; dejaMontres?: unknown } = {}): Promise<ReponsePlan> {
  if (!estUuid(partieId)) return { ok: false, message: "Cette partie n’existe plus." };
  const { data } = await e.supabase.from("parties").select("projet_id").eq("id", partieId).is("supprime_le", null).maybeSingle();
  const lu = data ? await entreeDuProjet(e, data.projet_id as string) : null;
  const partie = lu?.plan.parties.find((p) => p.id === partieId);
  if (!lu || !partie) return { ok: false, message: "Cette partie n’existe plus." };
  const dejaMontres = lireDejaMontrees(options.dejaMontres);
  const r = await demanderUneAide(e, aideChapitres, { ...lu.entree, partie: partie.titre, orientation: lireOrientation(options.orientation), dejaMontres });
  if (!r.ok) return { ok: false, message: r.message };
  const pris = new Set([...partie.chapitres.map((c) => cle(c.titre)), ...dejaMontres.map(cle)]);
  const chapitres = r.valeur.chapitres.filter((x) => {
    const k = cle(x.titre);
    if (pris.has(k)) return false;
    pris.add(k);
    return true;
  });
  if (!chapitres.length) return { ok: false, message: MESSAGES_IA.pasDeReponse };
  return { ok: true, sorte: "chapitres", chapitres, reste: r.reste };
}

/**
 * « ✦ Proposer un résumé » (F13.5) : d'après le résumé enregistré (la page l'enregistre d'abord),
 * la place du chapitre dans le plan, et les titres et consignes de ses scènes.
 */
export async function demanderUnResume(e: Enseignant, chapitreId: string): Promise<ReponsePlan> {
  if (!estUuid(chapitreId)) return { ok: false, message: "Ce chapitre n’existe plus." };
  const { data } = await e.supabase.from("chapitres").select("projet_id").eq("id", chapitreId).is("supprime_le", null).maybeSingle();
  const lu = data ? await entreeDuProjet(e, data.projet_id as string) : null;
  const chapitre = lu ? chapitresDe(lu.plan).find((c) => c.id === chapitreId) : undefined;
  const partie = chapitre ? lu?.plan.parties.find((p) => p.id === chapitre.partieId) : undefined;
  if (!lu || !chapitre || !partie) return { ok: false, message: "Ce chapitre n’existe plus." };
  const r = await demanderUneAide(e, aideResume, {
    ...lu.entree,
    partie: partie.titre,
    chapitre: chapitre.titre,
    resumeActuel: chapitre.resume,
    // Soixante scènes au plus : un titre et une consigne d'adulte chacune, jamais leur texte
    scenes: chapitre.scenes.slice(0, 60).flatMap((s) => (s.titre || s.consigne.trim() ? [{ titre: s.titre ?? "Sans titre", consigne: s.consigne.trim().slice(0, 400) || undefined }] : [])),
  });
  return r.ok ? { ok: true, sorte: "resume", resume: r.valeur.resume, reste: r.reste } : { ok: false, message: r.message };
}
