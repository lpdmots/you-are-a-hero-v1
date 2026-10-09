"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type ProjetDeLaBarre = { id: string; titre: string; onglet: string } | null;

const Contexte = createContext<{ projet: ProjetDeLaBarre; signaler: (p: ProjetDeLaBarre) => void }>({ projet: null, signaler: () => {} });

/** Le dernier projet ouvert, tel que la barre du haut le montre pendant la visite. */
export function ProjetCourant({ depart, children }: { depart: ProjetDeLaBarre; children: ReactNode }) {
  const [projet, signaler] = useState<ProjetDeLaBarre>(depart);
  return <Contexte value={{ projet, signaler }}>{children}</Contexte>;
}

export const useProjetCourant = () => useContext(Contexte).projet;

/** Posé par la page d'un projet : la barre du haut porte aussitôt son nom et son onglet. */
export function ProjetOuvert({ id, titre, onglet }: { id: string; titre: string; onglet: string }) {
  const { signaler } = useContext(Contexte);
  useEffect(() => {
    signaler({ id, titre, onglet });
  }, [id, titre, onglet, signaler]);
  return null;
}
