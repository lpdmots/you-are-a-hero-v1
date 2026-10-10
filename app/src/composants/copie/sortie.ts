"use client";

/**
 * Avant de quitter une scène, l'application enregistre d'abord, puis agit (F08.2). Une
 * copie ouverte s'inscrit ici ; toute commande qui fait partir attend sa réponse.
 */

type Garde = {
  /** Rend vrai quand plus rien n'attend d'être enregistré : on peut partir. */
  partir: () => Promise<boolean>;
  /** Un texte de cette page a-t-il été gardé à part ? */
  garde: () => boolean;
};

const gardes = new Set<Garde>();

export function garderLaSortie(garde: Garde): () => void {
  gardes.add(garde);
  return () => {
    gardes.delete(garde);
  };
}

/** Enregistre ce qui attend. Faux : un texte n'a pas pu être enregistré, on reste sur la page (F08-AC38). */
export async function avantDePartir(): Promise<boolean> {
  for (const garde of [...gardes]) {
    if (!(await garde.partir())) return false;
  }
  return true;
}

/**
 * Ce que l'écran de fermeture peut dire du texte de la page qu'on quitte : enregistré, ou
 * gardé à part — auquel cas il ne promet rien (F08-AC28). Rien quand aucune copie n'est ouverte.
 */
export const texteQuitte = (): "enregistre" | "garde" | null =>
  gardes.size === 0 ? null : [...gardes].some((g) => g.garde()) ? "garde" : "enregistre";
