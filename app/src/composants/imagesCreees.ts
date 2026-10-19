"use client";

import { laisserLesPropositions } from "@/app/(adulte)/projet/actions-personnages";
import { MESSAGES_IA } from "@/domaine/aides-ia";
import { deposer, reduire } from "./importer";

/**
 * Les images créées, côté navigateur (F10.1, F10.2) : la demande à `/ia/images`, puis l'image
 * gardée, qui passe par le chemin d'un import (réduite, déposée, relue par le serveur) ; les autres
 * propositions sont effacées.
 */

export async function demanderAuxImages<R>(corps: Record<string, unknown>, image = false): Promise<R | { ok: false; message: string }> {
  const panne = { ok: false as const, message: image ? MESSAGES_IA.pasDImage : MESSAGES_IA.pasDeReponse };
  try {
    const r = await fetch("/ia/images", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(corps) });
    if (!r.ok && r.status !== 401 && r.status !== 500) return panne;
    return (await r.json()) as R;
  } catch {
    return panne;
  }
}

const PAS_GARDEE = "L’image n’a pas pu être gardée. Réessayez.";

/** Garde une proposition parmi les images du projet ; les propositions nommées sont ensuite effacées. */
export async function garderLaProposition(projetId: string, proposition: string, aEffacer: readonly string[]): Promise<{ ok: true; id: string } | { ok: false; erreur: string }> {
  try {
    const reponse = await fetch(`/images/proposition/${projetId}/${proposition}`);
    if (!reponse.ok) return { ok: false, erreur: PAS_GARDEE };
    // Une image détourée arrive en PNG : elle garde sa transparence, comme une image importée dans une scène
    const contenu = await reponse.blob();
    const transparente = contenu.type === "image/png" || contenu.type === "image/webp";
    const reduite = await reduire(new File([contenu], `${proposition}.${transparente ? "png" : "jpg"}`, { type: contenu.type || "image/jpeg" }), transparente);
    if (!reduite) return { ok: false, erreur: PAS_GARDEE };
    URL.revokeObjectURL(reduite.apercu);
    const depot = await deposer(projetId, reduite);
    if (!depot.ok) return { ok: false, erreur: PAS_GARDEE };
    if (aEffacer.length) void laisserLesPropositions(projetId, [...aEffacer]);
    return { ok: true, id: depot.id };
  } catch {
    return { ok: false, erreur: PAS_GARDEE };
  }
}

/** « Laisser » : les images créées ne sont pas conservées (F10.1). */
export const laisser = (projetId: string, propositions: readonly string[]): void => {
  if (propositions.length) void laisserLesPropositions(projetId, [...propositions]);
};
