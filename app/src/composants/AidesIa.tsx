"use client";

import { createContext, useContext, type ReactNode } from "react";
import { REGLAGES_IA_HABITUELS, type ReglagesIa } from "@/domaine/aides-ia";

/**
 * Les réglages des aides IA de l'adulte, pour toute page de son espace (F13). Éteintes dans
 * « Mon compte », aucun ✦ ni bouton d'IA ne s'affiche, et les boutons doubles redeviennent
 * simples : chaque bouton d'IA demande `useAidesIa().proposer` avant de se montrer.
 */
const Contexte = createContext<ReglagesIa>(REGLAGES_IA_HABITUELS);

export function AidesIa({ reglages, children }: { reglages: ReglagesIa; children: ReactNode }) {
  return <Contexte.Provider value={reglages}>{children}</Contexte.Provider>;
}

export const useAidesIa = (): ReglagesIa => useContext(Contexte);
