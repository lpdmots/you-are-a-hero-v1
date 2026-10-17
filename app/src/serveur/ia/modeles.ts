import type { AideTexte } from "@/domaine/aides-ia";

/**
 * Les modèles que l'application sait appeler, et lequel sert chaque aide (F13, cadre commun).
 * Changer de modèle pour une aide, ou de fournisseur, se fait ici seulement.
 *
 * Prix en dollars par million de jetons, relevés le 17 octobre 2026 sur les pages de prix
 * d'Anthropic et d'OpenAI, à revérifier au moment d'un choix : ils servent au journal des
 * appels et aux plafonds, non à une facture.
 */

export type Fournisseur = "anthropic" | "openai";

export type Modele = {
  fournisseur: Fournisseur;
  /** L'identifiant que le fournisseur attend, tel quel */
  id: string;
  nom: string;
  entree: number;
  sortie: number;
  /**
   * Effort de raisonnement demandé : les aides sont courtes et cadrées, un effort bas suffit
   * et coûte le moins. Rien : le modèle n'en prend pas (Claude Haiku 4.5).
   */
  effort: "low" | "medium" | null;
};

export const MODELES = {
  "claude-opus-5-5": { fournisseur: "anthropic", id: "claude-opus-5-5", nom: "Claude Opus 5.5", entree: 4, sortie: 20, effort: "low" },
  "claude-sonnet-5-5": { fournisseur: "anthropic", id: "claude-sonnet-5-5", nom: "Claude Sonnet 5.5", entree: 2, sortie: 10, effort: "low" },
  "claude-haiku-4-5": { fournisseur: "anthropic", id: "claude-haiku-4-5", nom: "Claude Haiku 4.5", entree: 1, sortie: 5, effort: null },
  "gpt-5.6-sol": { fournisseur: "openai", id: "gpt-5.6-sol", nom: "GPT-5.6 Sol", entree: 4, sortie: 20, effort: "low" },
  "gpt-5.6-terra": { fournisseur: "openai", id: "gpt-5.6-terra", nom: "GPT-5.6 Terra", entree: 2, sortie: 12, effort: "low" },
  "gpt-5.6-luna": { fournisseur: "openai", id: "gpt-5.6-luna", nom: "GPT-5.6 Luna", entree: 0.2, sortie: 1.2, effort: "low" },
  "gpt-6.1-sol": { fournisseur: "openai", id: "gpt-6.1-sol", nom: "GPT-6.1 Sol", entree: 2, sortie: 10, effort: "low" },
  "gpt-6-luna": { fournisseur: "openai", id: "gpt-6-luna", nom: "GPT-6 Luna", entree: 0.1, sortie: 0.5, effort: "low" },
} as const satisfies Record<string, Modele>;

export type IdModele = keyof typeof MODELES;

export const estUnModele = (id: string): id is IdModele => Object.hasOwn(MODELES, id);

/**
 * Le modèle de chaque aide, choisi le 17 octobre 2026 à la fin du lot 1 de l'étape 8 : Claude,
 * décision du porteur (crédits d'API de son forfait), le modèle de chaque aide sur l'essai V17.
 * Opus 5.5 pour ce qui invente ou construit (idées de choix, questions et idées de la
 * Préparation, parties, chapitres), où il a été le plus juste ; Sonnet 5.5 pour le reste, la
 * correction comprise, sur décision du porteur. Haiku 4.5 n'est retenu nulle part : il a changé
 * le héros en fille au degré 5, trop réécrit au degré 4, écrit un titre à la première personne et
 * une fiche visuelle sans apparence, pour moins d'un demi-centime d'écart.
 */
export const MODELE_DES_AIDES: Record<AideTexte, IdModele> = {
  correction: "claude-sonnet-5-5",
  pistes: "claude-sonnet-5-5",
  consigne: "claude-sonnet-5-5",
  titre: "claude-sonnet-5-5",
  // Ajoutée le 17 octobre 2026. Sonnet, contre l'attente : sur le cas d'essai, Opus est passé au
  // « tu » au présent après une scène au passé simple et a inventé un signe gravé ; Sonnet a gardé
  // la personne et le temps, pour moitié moins cher
  ecriture: "claude-sonnet-5-5",
  "idees-choix": "claude-opus-5-5",
  questions: "claude-opus-5-5",
  idees: "claude-opus-5-5",
  retenons: "claude-sonnet-5-5",
  parties: "claude-opus-5-5",
  chapitres: "claude-opus-5-5",
  resume: "claude-sonnet-5-5",
  personnages: "claude-sonnet-5-5",
  "fiche-visuelle": "claude-sonnet-5-5",
  "description-image": "claude-sonnet-5-5",
};

/** Ce que coûte un appel, en dollars, d'après les jetons que le fournisseur annonce. */
export function coutDe(modele: IdModele, jetonsEntree: number, jetonsSortie: number): number {
  const m = MODELES[modele];
  return Math.round(((jetonsEntree * m.entree + jetonsSortie * m.sortie) / 1_000_000) * 1_000_000) / 1_000_000;
}
