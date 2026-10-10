/**
 * Bibliothèque de visuels de l'application (F10.1). Sans image choisie, un projet, une partie
 * ou un chapitre reçoit l'un d'eux, une fois, puis le garde : c'est son visuel par défaut.
 * L'adulte peut aussi en choisir un lui-même : c'est un visuel proposé.
 *
 * Les fichiers sont dans public/illustrations/defaut-<clé>.jpg, au format 3:2.
 */
export const VISUELS = [
  { cle: "foret", nom: "Forêt" },
  { cle: "mer", nom: "Mer" },
  { cle: "montagne", nom: "Montagne" },
  { cle: "cite", nom: "Cité" },
  { cle: "desert", nom: "Désert" },
] as const;

const CLES: readonly string[] = VISUELS.map((v) => v.cle);
export const estVisuel = (cle: string | null | undefined): cle is string => !!cle && CLES.includes(cle);

export const adresseVisuel = (cle: string): string => `/illustrations/defaut-${estVisuel(cle) ? cle : VISUELS[0].cle}.jpg`;
export const nomVisuel = (cle: string): string => VISUELS.find((v) => v.cle === cle)?.nom ?? "Visuel";

function hacher(texte: string): number {
  let h = 7;
  for (const c of texte) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return h;
}

/**
 * Visuel par défaut d'un nouvel élément : tiré d'après sa graine, en évitant, tant que la
 * bibliothèque le permet, ceux déjà donnés autour de lui — les chapitres de la même partie,
 * et la partie elle-même (F10-AC26).
 */
export function tirerVisuel(graine: string, aEviter: (string | null | undefined)[] = []): string {
  const pris = new Set(aEviter.filter(estVisuel));
  const libres = CLES.filter((c) => !pris.has(c));
  const parmi = libres.length ? libres : CLES;
  return parmi[hacher(graine) % parmi.length];
}

/** Adresse de l'image de repérage à montrer : image importée, visuel choisi, ou visuel par défaut. */
export function adresseRepere(
  repere: { imageId: string | null; visuelChoisi: string | null; visuelDefaut: string | null },
  graine: string,
  vignette = true,
): string {
  if (repere.imageId) return `/images/${repere.imageId}${vignette ? "?v=1" : ""}`;
  if (estVisuel(repere.visuelChoisi)) return adresseVisuel(repere.visuelChoisi);
  return adresseVisuel(estVisuel(repere.visuelDefaut) ? repere.visuelDefaut : tirerVisuel(graine));
}
