"use client";

import { createContext, useContext } from "react";
import type { Droits } from "@/domaine/copie";
import type { Construction, FormuleRenvoi } from "@/domaine/preparation";

/**
 * Ce que la copie sait du livre autour de la scène ouverte : les numéros, les scènes que la
 * personne peut nommer ou choisir pour destination, la façon d'annoncer un numéro (F05, F11.5).
 */

/** Une scène que la personne peut lire : elle la nomme et, si elle en a le droit, la choisit pour destination. */
export type SceneConnue = {
  id: string;
  reference: number;
  titre: string | null;
  chapitreId: string;
  chapitre: string;
  partie: string;
  vide: boolean;
};

export type Livre = {
  /** Récit à choix : sans lui, ni phrase de choix ni numéro (F05-AC19) */
  aChoix: boolean;
  formule: FormuleRenvoi;
  /** Les constructions cochées dans la préparation, pour tirer celle d'un nouveau choix */
  constructions: Construction[];
  /** Scène → numéro imprimé */
  numeros: Record<string, number>;
  scenes: SceneConnue[];
  /** Destination hors de ce que la personne lit → titre public de son chapitre (F05-AC03) */
  ailleurs: Record<string, string>;
  /** Les chapitres où l'adulte peut créer une scène depuis un choix */
  chapitres: { id: string; titre: string; partie: string }[];
};

export type Trouvee = { id: string; extrait: string };
export type SceneCreee = { id: string; reference: number; titre: string | null; chapitreId: string };

/** Ce que la copie demande au serveur, pour l'adulte comme pour l'élève. */
export type Services = {
  /** Chercher une destination dans les textes ; sans cette recherche, seuls les titres sont cherchés */
  chercher?: (demande: string) => Promise<Trouvee[]>;
  creerScene: (chapitreId: string, titre: string) => Promise<{ ok: true; scene: SceneCreee; numeros: Record<string, number> } | { ok: false; erreur: string }>;
  /** « Supprimer aussi la scène », après l'annulation d'un choix qui l'avait créée (F05-AC44) */
  supprimerScene: (sceneId: string) => Promise<{ ok: boolean; erreur?: string }>;
  relireNumeros: () => Promise<Record<string, number>>;
};

export type Lieu = { projetId: string; sceneId: string; chapitreId: string };

/** La fiche ouverte dans la copie : un choix qu'on crée, ou les réglages d'un bloc. */
export type FicheOuverte =
  /** Création : la phrase prendra place après ce bloc, ou le remplacera s'il est vide */
  | { sorte: "creation"; apres: string | null; remplace: boolean }
  | { sorte: "reglages"; bloc: string; confirmer?: "dernier-renvoi"; auClavier?: boolean };

export type ContexteDeCopie = {
  livre: Livre;
  droits: Droits;
  lieu: Lieu;
  /** L'élève ne lit que le lieu, sans la référence, à côté d'une phrase de choix (F05-AC42) */
  pourEleve: boolean;
  fiche: FicheOuverte | null;
  /** Place gardée sous un bloc pour la fiche qui s'y pose */
  espace: { bloc: string; hauteur: number } | null;
  ouvrir: (bloc: string) => void;
  /** Le bloc qu'on tire par son repère, et l'endroit où il se poserait */
  tire: { bloc: string; avant: string | null } | null;
  commencerATirer: (bloc: string, ev: React.PointerEvent) => void;
};

export const Contexte = createContext<ContexteDeCopie | null>(null);

export function useCopie(): ContexteDeCopie {
  const c = useContext(Contexte);
  if (!c) throw new Error("Bloc de copie hors d'une copie");
  return c;
}

/** Sans récit à choix ni livre autour : une copie de récit classique, ou un texte en lecture. */
export const LIVRE_SANS_CHOIX: Livre = { aChoix: false, formule: "rends", constructions: ["neutre"], numeros: {}, scenes: [], ailleurs: {}, chapitres: [] };
