"use client";

import { createContext, useContext } from "react";
import type { Droits } from "@/domaine/copie";
import type { Construction, Formule, FormuleRenvoi, Objet } from "@/domaine/preparation";

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
  /** Scène → numéro fixé, pour l'adulte : « n° 38 fixé » (F11.5) */
  fixes: Record<string, number>;
  /** Le départ du livre, qui porte toujours le n° 1 et ne se fixe pas */
  depart: string | null;
};

/** Les deux listes du projet que la copie propose : objets de l'histoire et formules d'action (F04.2). */
export type Jeu = { objets: Objet[]; formules: Formule[] };
export const SANS_JEU: Jeu = { objets: [], formules: [] };

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
  /** Le numéro que porte un passage, l'ordre du livre établi s'il ne l'était pas : pour l'adulte seul */
  numeroDe?: (sceneId: string) => Promise<{ ok: true; numero: number | null; total: number } | { ok: false; erreur: string }>;
  /** Fixer le numéro de la destination d'une liaison cachée : celui qu'elle porte, ou celui de l'énigme (F05.1) */
  fixerNumero?: (sceneId: string, numero: number | null) => Promise<{ ok: true; numero: number | null } | { ok: false; erreur: string }>;
  libererNumero?: (sceneId: string) => Promise<{ ok: boolean; erreur?: string }>;
  /** Ajouter un objet ou une formule à la liste sans quitter la scène : pour l'adulte seul (F04-AC29) */
  ajouterObjet?: (nom: string, description: string) => Promise<{ ok: boolean; erreur?: string }>;
  ajouterFormule?: (texte: string) => Promise<{ ok: boolean; erreur?: string }>;
  /** Importer une image dans le projet, et retrouver celles qui y sont déjà : pour l'adulte seul (F10-AC27) */
  importerImage?: (fichier: File) => Promise<{ ok: true; id: string } | { ok: false; erreur: string }>;
  imagesDuProjet?: () => Promise<string[]>;
};

export type Lieu = { projetId: string; sceneId: string; chapitreId: string };

/** La fiche ouverte dans la copie : un choix qu'on crée, ou les réglages d'un bloc. */
export type FicheOuverte =
  /** Création : la phrase prendra place après ce bloc, ou le remplacera s'il est vide */
  | { sorte: "creation"; apres: string | null; remplace: boolean }
  /** Une action de jeu à créer après ce bloc, ou les formules pour le texte d'une action qui existe */
  | { sorte: "action"; apres: string; remplace: boolean }
  | { sorte: "formules"; bloc: string }
  /** Les objets de l'histoire, sous le bloc du curseur */
  | { sorte: "objets"; bloc: string }
  /** Poser une image (F10) : sous le bloc du curseur. Régler une image en bloc, ou une image sur la ligne */
  | { sorte: "poser-image"; bloc: string }
  | { sorte: "image"; bloc: string }
  | { sorte: "symbole"; bloc: string; symbole: string }
  | { sorte: "reglages"; bloc: string; confirmer?: "dernier-renvoi"; auClavier?: boolean };

export type ContexteDeCopie = {
  livre: Livre;
  droits: Droits;
  lieu: Lieu;
  /** L'élève ne lit que le lieu, sans la référence, à côté d'une phrase de choix (F05-AC42) */
  pourEleve: boolean;
  /** Le nom que l'enseignant affiche aux élèves, pour « Préparé par M. Dupont » (F01-AC13) */
  enseignant: string | null;
  /** Ouvrir un paragraphe au-dessus d'un bloc fermé : le « + » de la marge (F06.1) */
  ecrireAvant: (bloc: string) => void;
  /** Les commandes d'une action de jeu où l'on écrit : ses formules, sa suppression (F04.2) */
  ouvrirFormules: (bloc: string) => void;
  supprimerBloc: (bloc: string) => void;
  /** Régler une image en bloc, ou une image sur la ligne : pour l'adulte seul (F10) */
  ouvrirImage: (bloc: string) => void;
  ouvrirSymbole: (symbole: string) => void;
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
export const LIVRE_SANS_CHOIX: Livre = {
  aChoix: false, formule: "rends", constructions: ["neutre"], numeros: {}, scenes: [], ailleurs: {}, chapitres: [], fixes: {}, depart: null,
};
