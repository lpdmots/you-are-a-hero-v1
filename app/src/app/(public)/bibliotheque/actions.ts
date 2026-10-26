"use server";

import { signaler, type ResultatSignalement } from "@/serveur/signalements";

/** « Signaler ce livre » (F15-AC14), depuis son tiroir, sans compte. */
export async function signalerCeLivre(adresse: string, demande: { motif: string; passage: string; message: string; courriel: string }): Promise<ResultatSignalement> {
  return signaler(adresse, demande);
}
