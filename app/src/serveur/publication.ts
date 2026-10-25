import "server-only";
import type { Enseignant } from "./adulte";
import { demanderUneAide } from "./ia/demander";
import { presentation as aidePresentation } from "./ia/aides/presentation";
import { carnetDe, histoireDuProjet } from "./ia/aides/contexte";
import { instantaneDuLivre } from "./livre/livre";
import { projetDe } from "./lectures";
import { planPourLesAides } from "./plan-ia";
import { livreAPartager, partageDuProjet, versionsDe, type Refus } from "./partage";
import { estUuid, planDe, preparationDe } from "./recit";
import { clientService } from "./supabase";
import { etatDeLaPublication, peutProposer, presentationPropre, texteDuPassage, type Attestation, type EtatPublication, type LignePublication } from "@/domaine/bibliotheque";
import { MESSAGES_IA } from "@/domaine/aides-ia";
import { NOMS_COMME_LE_LIVRE, versionDuLivre, type VersionPartagee } from "@/domaine/partage";

/**
 * Proposer un livre à la bibliothèque, côté adulte (F15) : une copie figée à part de la version
 * partagée, sous la même règle que le partage, revérifiée sur l'instantané même que l'on fige
 * (F15-AC02) ; la présentation et l'attestation ; une seule proposition en attente par projet
 * (F15-AC18). L'adulte lit sa ligne, le serveur seul l'écrit (migration `bibliotheque_des_livres`).
 */

export type PublicationLue = {
  etat: EtatPublication;
  /** La présentation publiée, sinon la dernière proposée : le point de départ d'une nouvelle proposition */
  presentation: string;
  /** L'empreinte de la version publiée : « le livre a changé depuis la version publiée » */
  empreinte: string | null;
};

const COLONNES = "adresse, version, presentation, empreinte, mise_a_jour_le, proposee, presentation_proposee, derniere_presentation, proposee_le, refus_motif, refusee_le";
type Ligne = LignePublication & { presentation: string | null; empreinte: string | null; presentation_proposee: string | null; derniere_presentation: string | null };

export async function publicationDuProjet(e: Enseignant, projetId: string): Promise<PublicationLue | null> {
  if (!estUuid(projetId)) return null;
  const { data, error } = await e.supabase.from("publications").select(COLONNES).eq("projet_id", projetId).maybeSingle();
  if (error) throw new Error(`Publication illisible : ${error.message}`);
  const l = data as Ligne | null;
  return {
    etat: etatDeLaPublication(l),
    presentation: l?.presentation_proposee ?? l?.derniere_presentation ?? l?.presentation ?? "",
    empreinte: l?.empreinte ?? null,
  };
}

type Fait = { ok: true } | Refus;
const INTROUVABLE: Refus = { ok: false, erreur: "Ce projet est introuvable." };

/**
 * « Proposer à la bibliothèque » et « Proposer la mise à jour » (F15-AC01, AC07) : le livre est
 * figé à cet instant, avec ce que le partage montre des auteurs (F15-AC06), et attend la relecture
 * du porteur ; rien n'est lisible en public avant sa décision. Une version déjà publiée reste
 * lisible pendant ce temps. Le dernier refus s'efface : l'adulte propose de nouveau.
 */
export async function proposerALaBibliotheque(
  e: Enseignant, projetId: string, demande: { presentation: unknown; attestation: unknown },
): Promise<Fait> {
  if (!estUuid(projetId)) return INTROUVABLE;
  const projet = await projetDe(e, projetId);
  if (!projet) return INTROUVABLE;
  const attendue: Attestation = projet.organisation === "classe" ? "classe" : "auteur";
  if (demande.attestation !== true) {
    return { ok: false, erreur: attendue === "classe" ? "Cochez d’abord l’autorisation des familles." : "Cochez d’abord que vous êtes l’auteur du livre." };
  }
  const presentation = presentationPropre(demande.presentation);
  if (!presentation) return { ok: false, erreur: "Écrivez la présentation du livre, en deux ou trois phrases." };

  const actuelle = await publicationDuProjet(e, projetId);
  if (actuelle && !peutProposer(actuelle.etat)) return { ok: false, erreur: "Une proposition attend déjà sa relecture." };

  const livre = await livreAPartager(e, projetId);
  if (!livre) return INTROUVABLE;
  if (livre.raisons.length) return { ok: false, erreur: "Le livre ne peut pas encore être proposé.", raisons: livre.raisons };
  const partage = await partageDuProjet(e, projetId);
  const { version, empreinte } = versionsDe(livre.instantane, partage?.noms ?? NOMS_COMME_LE_LIVRE);

  const proposee = {
    proposee: version satisfies VersionPartagee, presentation_proposee: presentation, derniere_presentation: presentation, age_propose: projet.ageDesLecteurs,
    empreinte_proposee: empreinte, proposee_le: new Date().toISOString(), attestation: attendue,
    refus_motif: null, refusee_le: null, modifie_le: new Date().toISOString(),
  };
  const base = clientService();
  // La règle « une seule en attente » tient aussi contre deux envois simultanés : la ligne ne change que sans proposition
  const { error } = await base.from("publications").upsert({ projet_id: projetId, enseignant_id: e.id }, { onConflict: "projet_id", ignoreDuplicates: true });
  if (error) return { ok: false, erreur: "La proposition n’a pas pu être enregistrée." };
  const { data: ecrite, error: erreur } = await base
    .from("publications").update(proposee).eq("projet_id", projetId).eq("enseignant_id", e.id).is("proposee", null).select("projet_id");
  if (erreur) return { ok: false, erreur: "La proposition n’a pas pu être enregistrée." };
  if (!ecrite?.length) return { ok: false, erreur: "Une proposition attend déjà sa relecture." };
  return { ok: true };
}

/** Le début du livre que lit l'aide de la présentation : les premiers passages, 2 000 caractères au plus. */
function debutDuLivre(v: VersionPartagee): string | null {
  let texte = "";
  for (const p of v.passages) {
    if (texte.length >= 2000) break;
    texte += `${texte ? "\n\n" : ""}${texteDuPassage(p)}`;
  }
  return texte.slice(0, 2000).trim() || null;
}

export type ReponsePresentation = { ok: true; presentation: string; reste: string | null } | { ok: false; message: string };

/**
 * « ✦ Proposer » la présentation (F15) : d'après la Préparation, le plan et le début du livre ;
 * une autre tournure si l'adulte en a déjà une. Payée en étoiles comme les autres aides.
 */
export async function demanderUnePresentation(e: Enseignant, projetId: string, actuelle: unknown): Promise<ReponsePresentation> {
  if (!estUuid(projetId)) return { ok: false, message: "Ce projet n’existe plus." };
  const [projet, preparation, plan, instantane] = await Promise.all([projetDe(e, projetId), preparationDe(e, projetId), planDe(e, projetId), instantaneDuLivre(e, projetId)]);
  if (!projet || !instantane) return { ok: false, message: "Ce projet n’existe plus." };
  const version = versionDuLivre(instantane.livre, NOMS_COMME_LE_LIVRE, instantane.chapitres);
  const r = await demanderUneAide(e, aidePresentation, {
    histoire: histoireDuProjet(projet), carnet: carnetDe(preparation), plan: planPourLesAides(plan), debut: debutDuLivre(version),
    actuelle: presentationPropre(actuelle) ?? undefined,
  });
  if (!r.ok) return { ok: false, message: r.message };
  return r.valeur.presentation ? { ok: true, presentation: r.valeur.presentation, reste: r.reste } : { ok: false, message: MESSAGES_IA.pasDeReponse };
}
