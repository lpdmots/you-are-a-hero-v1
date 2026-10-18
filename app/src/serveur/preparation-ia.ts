import "server-only";
import { MESSAGES_IA } from "@/domaine/aides-ia";
import { guidage, type Rubrique } from "@/domaine/preparation";
import type { Enseignant } from "./adulte";
import { idees as aideIdees, questions as aideQuestions, retenons as aideRetenons, type EntreeEtape } from "./ia/aides/preparation";
import { demanderUneAide } from "./ia/demander";
import { projetDe } from "./lectures";
import { estUuid, planDe, preparationDe } from "./recit";

/**
 * Les aides d'une étape de la Préparation (F13.4), côté serveur. Comme pour les aides de la
 * scène, le serveur relit lui-même ce qui part : la question de l'étape, ses relances et ses
 * questions, ses idées et leurs états, le texte retenu, les autres étapes, le plan pour
 * « Grandes étapes » et l'orientation gardée. Jamais un texte d'élève, un prénom ni le nom de
 * l'adulte (F13, ce qui est transmis). Rien n'est écrit ici : la page ajoute ce qu'elle livre,
 * une question ou une idée à la fois, et « Nous retenons » ne change qu'à « Utiliser ce texte »
 * (F13-AC12).
 */

export type SorteAidePreparation = "questions" | "idees" | "retenons";
export const estSorteAidePreparation = (v: unknown): v is SorteAidePreparation => v === "questions" || v === "idees" || v === "retenons";

export type ReponsePreparation =
  | { ok: true; sorte: "questions" | "idees"; elements: string[]; reste: string | null }
  | { ok: true; sorte: "retenons"; texte: string; reste: string | null }
  | { ok: false; message: string };

export const RIEN_A_REDIGER = "Retenez d’abord une idée, ou écrivez quelques mots : l’IA rédige d’après eux.";

/** Ce que l'aide d'une étape reçoit, relu dans la base. Null si le projet n'est pas à l'adulte. */
export async function entreeDeLEtape(e: Enseignant, projetId: string, etape: Rubrique): Promise<EntreeEtape | null> {
  if (!estUuid(projetId)) return null;
  const [projet, preparation] = await Promise.all([projetDe(e, projetId), preparationDe(e, projetId)]);
  if (!projet || !preparation) return null;
  const plan = etape === "etapes" ? await planDe(e, projetId) : null;
  const guide = guidage(etape, projet.organisation, projet.recit);
  return {
    histoire: { titre: projet.titre, mode: projet.organisation, recit: projet.recit, niveaux: projet.organisation === "classe" ? e.reglagesIa.niveaux : [] },
    etape,
    question: guide.question,
    // Les relances sont les premières questions de la liste : l'IA ne les redemande pas
    questions: [...guide.relances, ...preparation.questions.filter((q) => q.etape === etape).map((q) => q.texte)],
    idees: preparation.pistes.filter((p) => p.rubrique === etape).map((p) => ({ texte: p.texte, etat: p.etat })),
    retenu: etape === "etapes" ? "" : preparation[etape],
    carnet: { univers: preparation.univers, personnages: preparation.personnages, enjeu: preparation.enjeu },
    plan: plan?.parties.map((p) => ({ partie: p.titre, chapitres: p.chapitres.map((c) => ({ titre: c.titre, resume: c.resume || undefined })) })),
    orientation: preparation.orientations[etape],
  };
}

/** Six questions ou six idées en une demande, ou une proposition pour « Nous retenons ». */
export async function demanderPourLEtape(e: Enseignant, projetId: string, etape: Rubrique, sorte: SorteAidePreparation): Promise<ReponsePreparation> {
  const entree = await entreeDeLEtape(e, projetId, etape);
  if (!entree) return { ok: false, message: "Ce projet n’existe plus." };
  if (sorte === "retenons") {
    // « Grandes étapes » retient des parties, pas un texte : le lot 6 y apporte ses idées de parties
    if (etape === "etapes") return { ok: false, message: MESSAGES_IA.pasDeReponse };
    if (!entree.retenu.trim() && !entree.idees.some((i) => i.etat === "retenue")) return { ok: false, message: RIEN_A_REDIGER };
    const r = await demanderUneAide(e, aideRetenons, entree);
    return r.ok ? { ok: true, sorte, texte: r.valeur.texte, reste: r.reste } : { ok: false, message: r.message };
  }
  if (sorte === "questions") {
    const r = await demanderUneAide(e, aideQuestions, entree);
    return r.ok ? { ok: true, sorte, elements: r.valeur.questions, reste: r.reste } : { ok: false, message: r.message };
  }
  const r = await demanderUneAide(e, aideIdees, entree);
  return r.ok ? { ok: true, sorte, elements: r.valeur.idees, reste: r.reste } : { ok: false, message: r.message };
}
