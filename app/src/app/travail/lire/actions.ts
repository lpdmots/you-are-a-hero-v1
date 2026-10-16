"use server";

import { clientDuPoste, etatDuPoste } from "@/serveur/poste";
import { estUuid } from "@/serveur/recit";

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
