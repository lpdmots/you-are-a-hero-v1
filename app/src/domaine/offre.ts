/**
 * L'offre (F14) : l'outil gratuit, deux limites par projet sans pass quand « Paiement ouvert » est
 * allumé, un pass par livre et des recharges d'étoiles. Les valeurs viennent des réglages de
 * l'application (`reglages_application`), en un seul endroit (F14-AC21) ; ce fichier ne fait que
 * les lire et les dire.
 */

export type Offre = {
  paiementOuvert: boolean;
  scenesGratuites: number;
  imagesGratuites: number;
  /** En centimes d'euro */
  prixDuPass: number;
  etoilesDuPass: number;
  prixDeLaRecharge: number;
  etoilesDeLaRecharge: number;
  etoilesOffertes: number;
};

/** Où en est un projet au regard des limites gratuites (F14-AC13, AC14). */
export type Limites = {
  /** Les limites valent pour ce projet : interrupteur allumé, sans pass, hors porteur */
  limite: boolean;
  pass: boolean;
  /** Le jour où le pass a été reçu */
  passLe: string | null;
  scenes: number;
  scenesGratuites: number;
  images: number;
  imagesGratuites: number;
};

export type Limite = "scenes" | "images";

/** Ce que la base répond à une création refusée par une limite (codes de la migration `limites_et_pass`). */
export const CODES_DES_LIMITES: Record<string, Limite> = { LIM01: "scenes", LIM02: "images" };

export function lireOffre(o: Record<string, unknown> | null | undefined): Offre {
  const n = (v: unknown, defaut: number) => (typeof v === "number" && Number.isFinite(v) ? v : defaut);
  return {
    paiementOuvert: o?.paiement_ouvert === true,
    scenesGratuites: n(o?.scenes_gratuites, 40),
    imagesGratuites: n(o?.images_gratuites, 10),
    prixDuPass: n(o?.prix_du_pass, 2000),
    etoilesDuPass: n(o?.etoiles_du_pass, 400),
    prixDeLaRecharge: n(o?.prix_de_la_recharge, 500),
    etoilesDeLaRecharge: n(o?.etoiles_de_la_recharge, 100),
    etoilesOffertes: n(o?.etoiles_offertes, 30),
  };
}

/** « 20 € », « 4,50 € » : un prix en centimes, dit en euros. */
export function enEuros(centimes: number): string {
  const euros = centimes / 100;
  return `${Number.isInteger(euros) ? euros : euros.toFixed(2).replace(".", ",")} €`;
}

/** La phrase d'une création refusée, pour l'adulte : le dialogue du pass dit la suite (F14-AC13, AC14). */
export function messageDeLaLimite(limite: Limite, offre: Pick<Offre, "scenesGratuites" | "imagesGratuites">): string {
  return limite === "scenes"
    ? `Ce livre a ses ${offre.scenesGratuites} scènes gratuites.`
    : `Ce livre a ses ${offre.imagesGratuites} images gratuites.`;
}

/** La même, pour un élève : il ne voit ni le pass ni son prix. */
export const LIMITE_POUR_L_ELEVE = "Le livre a atteint sa taille pour l’instant. Demande à ton enseignant(e).";

/** « 38 scènes sur 40 » quand la limite vaut ; sinon le seul nombre. */
export function scenesSurLaLimite(nombre: number, limites: Pick<Limites, "limite" | "scenesGratuites"> | null): string {
  const mot = nombre > 1 ? "scènes" : "scène";
  return limites?.limite ? `${nombre} ${mot} sur ${limites.scenesGratuites}` : `${nombre} ${mot}`;
}

/**
 * Les images posées dans un texte de scène, chaque pose comptée, hors des notes de l'enseignant :
 * le même compte que la base (`prive.poses_d_images`).
 */
export function posesDImages(blocs: readonly unknown[]): number {
  const compter = (n: unknown): number => {
    if (!n || typeof n !== "object") return 0;
    const o = n as { type?: unknown; children?: unknown };
    const ici = o.type === "image" || o.type === "image-ligne" ? 1 : 0;
    return ici + (Array.isArray(o.children) ? o.children.reduce((t: number, c) => t + compter(c), 0) : 0);
  };
  return blocs.reduce((t: number, b) => t + ((b as { type?: unknown })?.type === "note" ? 0 : compter(b)), 0);
}
