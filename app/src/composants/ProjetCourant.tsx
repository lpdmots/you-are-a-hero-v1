"use client";

import { createContext, useCallback, useContext, useEffect, useEffectEvent, useState, type ReactNode } from "react";
import { noterProjetOuvert } from "@/app/(adulte)/projets/actions";
import type { Onglet, ProjetDeLaColonne } from "@/domaine/projets";

export type ProjetDeLaBarre = ProjetDeLaColonne | null;

type Contexte = {
  projet: ProjetDeLaBarre;
  /** L'onglet que la colonne désigne : celui de la page, ou celui d'où l'on vient (F06-AC99) */
  actif: Onglet | null;
  signaler: (p: ProjetDeLaColonne, actif: Onglet | null) => void;
  /** La page du projet se ferme : la colonne garde le projet, sans onglet désigné */
  quitter: () => void;
};

const Contexte = createContext<Contexte>({ projet: null, actif: null, signaler: () => {}, quitter: () => {} });

/** Le dernier projet ouvert, tel que la colonne de navigation le montre pendant la visite. */
export function ProjetCourant({ depart, children }: { depart: ProjetDeLaBarre; children: ReactNode }) {
  const [projet, setProjet] = useState<ProjetDeLaBarre>(depart);
  const [actif, setActif] = useState<Onglet | null>(null);
  // Le serveur change d'avis : le projet supprimé quitte la colonne (F14-AC42), sa classe supprimée ou
  // renommée s'y lit aussitôt. Seul ce qu'il dit compte, pas l'objet refait à chaque rendu.
  const cle = JSON.stringify(depart);
  const [departVu, setDepartVu] = useState(cle);
  if (cle !== departVu) {
    setDepartVu(cle);
    setProjet(depart);
  }
  const signaler = useCallback((p: ProjetDeLaColonne, a: Onglet | null) => {
    setProjet(p);
    setActif(a);
  }, []);
  const quitter = useCallback(() => setActif(null), []);
  return <Contexte value={{ projet, actif, signaler, quitter }}>{children}</Contexte>;
}

export const useProjetCourant = () => useContext(Contexte);

/**
 * Posé par une page du projet. La colonne porte aussitôt son projet et désigne l'onglet `actif`
 * (celui de la page, ou celui d'où l'on vient, F06-AC99) ; le compte retient ce projet et cet
 * onglet comme les derniers ouverts (F06-AC53). Cela se note quand la page est affichée, non quand
 * le serveur la prépare : un lien simplement préchargé par le navigateur ne compte pas pour une visite.
 * Quitter la page laisse le projet dans la colonne, sans onglet désigné. Ses réglages (`actif` nul) ne
 * désignent aucun onglet et ne se notent pas : on ne revient pas sur eux à la connexion suivante.
 */
export function ProjetOuvert({ projet, actif }: { projet: ProjetDeLaColonne; actif: Onglet | null }) {
  const { signaler, quitter } = useContext(Contexte);
  const poser = useEffectEvent(() => signaler(actif ? { ...projet, onglet: actif } : projet, actif));
  // Le nombre à valider, le titre ou la classe changent sans nouvelle visite : la colonne suit (F06-AC100)
  const cle = JSON.stringify(projet);
  useEffect(() => {
    poser();
  }, [cle, actif]);
  useEffect(() => {
    if (actif) noterProjetOuvert(projet.id, actif).catch(() => {});
  }, [projet.id, actif]);
  useEffect(() => quitter, [quitter]);
  return null;
}
