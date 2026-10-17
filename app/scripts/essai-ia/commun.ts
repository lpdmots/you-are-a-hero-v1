import type { AideTexte } from "@/domaine/aides-ia";
import type { IdModele } from "@/serveur/ia/modeles";

/** Ce que partagent le lanceur de l'essai V17 et sa page de jugement. */

export const FICHIER_RESULTATS = "essais-ia/resultats.json";
export const FICHIER_JUGEMENTS = "essais-ia/jugements.json";

/**
 * Les modèles candidats (F13, cadre commun) : Claude Sonnet 5.5 et Opus 5.5, GPT-5.6 Terra et
 * Sol pour toutes les aides ; en plus, Claude Haiku 4.5 et GPT-5.6 Luna pour la correction, les
 * titres et les prompts d'image.
 */
export const LOURDS: IdModele[] = ["claude-sonnet-5-5", "claude-opus-5-5", "gpt-5.6-terra", "gpt-5.6-sol"];
export const LEGERS: IdModele[] = ["claude-haiku-4-5", "gpt-5.6-luna"];
const AIDES_LEGERES: AideTexte[] = ["correction", "titre", "fiche-visuelle", "description-image"];

export const CANDIDATS = (aide: AideTexte): IdModele[] => (AIDES_LEGERES.includes(aide) ? [...LOURDS, ...LEGERS] : LOURDS);

export type Resultat = {
  cas: string;
  modele: IdModele;
  le: string;
  brut: unknown;
  valeur: unknown;
  erreur: string | null;
  jetonsEntree: number;
  jetonsSortie: number;
  cout: number;
  duree: number;
};

export type Resultats = {
  resultats: Resultat[];
  /** L'ordre, tiré au hasard, dans lequel la page montre les propositions de chaque cas */
  ordres: Record<string, IdModele[]>;
};

export type Note = "bonne" | "passable" | "mauvaise";
/** « aucune » : aucune proposition n'est bonne, ce qui juge le cas sans donner de point à personne. */
export type Jugement = { meilleur: IdModele | "aucune" | null; notes: Partial<Record<IdModele, Note>>; remarque: string };
export type Jugements = Record<string, Jugement>;
