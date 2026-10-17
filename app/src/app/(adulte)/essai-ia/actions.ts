"use server";

import { exigerEnseignant } from "@/serveur/adulte";
import type { Note } from "../../../../scripts/essai-ia/commun";
import { ecrireJugements, exigerEnLocal, lireJugements, modeleDe } from "./donnees";

/** Noter une proposition, la désigner comme la meilleure, ou écrire une remarque sur un cas. */
export async function juger(casId: string, geste: { lettre: string; note: Note | null } | { meilleure: string | null } | { remarque: string }): Promise<void> {
  exigerEnLocal();
  await exigerEnseignant();
  const jugements = lireJugements();
  const j = jugements[casId] ?? { meilleur: null, notes: {}, remarque: "" };
  if ("lettre" in geste) {
    const m = modeleDe(casId, geste.lettre);
    if (!m) return;
    if (geste.note) j.notes[m] = geste.note;
    else delete j.notes[m];
  } else if ("meilleure" in geste) {
    j.meilleur = geste.meilleure === "aucune" ? "aucune" : geste.meilleure ? modeleDe(casId, geste.meilleure) : null;
  } else {
    j.remarque = geste.remarque.slice(0, 2000);
  }
  jugements[casId] = j;
  ecrireJugements(jugements);
}
