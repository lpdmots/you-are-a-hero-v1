"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { noterProjetOuvert } from "@/app/(adulte)/projets/actions";

export type ProjetDeLaBarre = { id: string; titre: string; onglet: string } | null;

const Contexte = createContext<{ projet: ProjetDeLaBarre; signaler: (p: ProjetDeLaBarre) => void }>({ projet: null, signaler: () => {} });

/** Le dernier projet ouvert, tel que la barre du haut le montre pendant la visite. */
export function ProjetCourant({ depart, children }: { depart: ProjetDeLaBarre; children: ReactNode }) {
  const [projet, signaler] = useState<ProjetDeLaBarre>(depart);
  return <Contexte value={{ projet, signaler }}>{children}</Contexte>;
}

export const useProjetCourant = () => useContext(Contexte).projet;

/**
 * Posé par la page d'un projet. La barre du haut porte aussitôt son nom et son onglet,
 * et le compte retient ce projet et cet onglet comme les derniers ouverts (F06-AC53).
 * Cela se note quand la page est affichée, non quand le serveur la prépare : un lien
 * simplement préchargé par le navigateur ne compte pas pour une visite.
 */
export function ProjetOuvert({ id, titre, onglet }: { id: string; titre: string; onglet: string }) {
  const { signaler } = useContext(Contexte);
  useEffect(() => {
    signaler({ id, titre, onglet });
    noterProjetOuvert(id, onglet).catch(() => {});
  }, [id, titre, onglet, signaler]);
  return null;
}
