"use server";

import { clientDuPoste, etatDuPoste } from "@/serveur/poste";
import { estUuid } from "@/serveur/recit";
import { ADRESSE_VALIDE } from "@/domaine/bibliotheque";

/**
 * Garder la lecture de l'élève, pour la retrouver sur un autre poste (F12-AC26, F04-AC22). La
 * base vérifie que l'élève est identifié et que le livre est toujours ouvert à sa classe.
 */
export async function garderLecture(projetId: string, lecture: unknown): Promise<boolean> {
  if (!estUuid(projetId) || !lecture || typeof lecture !== "object") return false;
  const poste = await etatDuPoste();
  if (!poste?.inscriptionId) return false;
  const base = await clientDuPoste(poste);
  const { data, error } = await base.rpc("garder_lecture_du_poste", { p_projet: projetId, p_lecture: lecture });
  return !error && data === true;
}

/** Garder la lecture de l'élève dans un livre de la bibliothèque, pour son profil (F15-AC20). */
export async function garderLectureBibliotheque(adresse: string, lecture: unknown): Promise<boolean> {
  if (!ADRESSE_VALIDE.test(adresse) || !lecture || typeof lecture !== "object") return false;
  const poste = await etatDuPoste();
  if (!poste?.inscriptionId) return false;
  const base = await clientDuPoste(poste);
  const { data, error } = await base.rpc("garder_lecture_bibliotheque_du_poste", { p_adresse: adresse, p_lecture: lecture });
  return !error && data === true;
}

/** Le cœur d'un élève à un livre de la bibliothèque, un par profil (F15-AC20). */
export async function coeurDeLEleve(adresse: string, oui: boolean): Promise<{ ok: boolean; coeurs?: number; donne?: boolean }> {
  if (!ADRESSE_VALIDE.test(adresse) || typeof oui !== "boolean") return { ok: false };
  const poste = await etatDuPoste();
  if (!poste?.inscriptionId) return { ok: false };
  const base = await clientDuPoste(poste);
  const { data, error } = await base.rpc("coeur_du_poste", { p_adresse: adresse, p_oui: oui });
  const r = data as { etat: string; coeurs?: number; donne?: boolean } | null;
  return error || !r || r.etat !== "fait" ? { ok: false } : { ok: true, coeurs: r.coeurs, donne: r.donne };
}
