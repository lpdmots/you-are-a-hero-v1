import type { AideTexte } from "@/domaine/aides-ia";
import type { Schema } from "./fournisseurs";

/**
 * Une aide qui rend du texte : sa consigne au modèle, son message, le schéma de sa réponse,
 * la lecture de cette réponse, et ce qu'elle rend quand les essais automatiques la simulent.
 * Chaque aide a la sienne dans `aides/` ; l'essai de qualité les appelle telles quelles.
 */
export type DefinitionAide<E, S> = {
  aide: AideTexte;
  /** Consigne fixe ; elle varie seulement avec ce qui change la tâche (degré, mode personnel) */
  systeme: (entree: E) => string;
  message: (entree: E) => string;
  schema: Schema;
  /** Borne de la réponse, en jetons : la plus longue utile, pas davantage */
  sortieMax: number;
  /** Relue sans confiance : null si la réponse ne tient pas ce qu'on attend */
  lire: (json: unknown, entree: E) => S | null;
  /** Une réponse plausible, sans fournisseur, pour les essais automatiques */
  simuler: (entree: E) => unknown;
};

/** Un objet JSON dont toutes les propriétés sont requises et aucune autre admise (OpenAI comme Anthropic). */
export function objet(proprietes: Record<string, Record<string, unknown>>): Record<string, unknown> {
  return { type: "object", properties: proprietes, required: Object.keys(proprietes), additionalProperties: false };
}

export const chaine = { type: "string" } as const;
export const liste = (elements: Record<string, unknown>) => ({ type: "array", items: elements });

/** Une chaîne propre ou null : espaces réduits, longueur bornée, jamais vide. */
export function texte(v: unknown, max = 2000): string | null {
  if (typeof v !== "string") return null;
  const propre = v.replace(/[ \t]+/g, " ").replace(/\s*\n\s*/g, "\n").trim();
  return propre && propre.length <= max ? propre : null;
}

/** Les chaînes propres d'une liste, sans doublon ; null si ce n'est pas une liste. */
export function textes(v: unknown, max = 400): string[] | null {
  if (!Array.isArray(v)) return null;
  const vus = new Set<string>();
  const sortie: string[] = [];
  for (const e of v) {
    const t = texte(e, max);
    if (t && !vus.has(t.toLocaleLowerCase("fr"))) {
      vus.add(t.toLocaleLowerCase("fr"));
      sortie.push(t);
    }
  }
  return sortie;
}

/** Les champs d'un objet JSON, ou null. */
export const champs = (v: unknown): Record<string, unknown> | null =>
  v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null;

/** Un bloc de contexte nommé, omis s'il est vide : le modèle ne lit pas de rubrique creuse. */
export function bloc(titre: string, contenu: string | null | undefined | readonly string[]): string {
  const corps = Array.isArray(contenu) ? contenu.filter(Boolean).map((l) => `- ${l}`).join("\n") : (contenu as string | null | undefined)?.trim();
  return corps ? `<${titre}>\n${corps}\n</${titre}>` : "";
}

export const assembler = (...blocs: string[]): string => blocs.filter(Boolean).join("\n\n");
