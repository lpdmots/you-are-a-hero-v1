/**
 * Bibliothèque de visuels de l'application (F10.1). Sans image choisie, un projet, une partie
 * ou un chapitre reçoit l'un d'eux, une fois, puis le garde : c'est son visuel par défaut.
 * L'adulte peut aussi en choisir un lui-même : c'est un visuel proposé.
 *
 * Les fichiers sont dans public/illustrations/, au format 3:2 : defaut-<clé>.jpg
 * (1 200 × 800) et sa vignette defaut-<clé>-v.jpg (480 × 320), pour les cartes et le sélecteur.
 */
export const VISUELS = [
  { cle: "foret", nom: "Forêt" },
  { cle: "mer", nom: "Mer" },
  { cle: "montagne", nom: "Montagne" },
  { cle: "cite", nom: "Cité" },
  { cle: "desert", nom: "Désert" },
  { cle: "mine", nom: "Mine" },
  { cle: "bateau", nom: "Bateau" },
  { cle: "savane", nom: "Savane" },
  { cle: "volcan", nom: "Volcan" },
  { cle: "jardin", nom: "Jardin" },
  { cle: "port", nom: "Port" },
  { cle: "ciel", nom: "Îles du ciel" },
  { cle: "recif", nom: "Fond marin" },
  { cle: "moulin", nom: "Moulin" },
  { cle: "temple", nom: "Temple" },
  { cle: "etang", nom: "Étang" },
  { cle: "bibliotheque", nom: "Bibliothèque" },
  { cle: "lagon", nom: "Lagon" },
  { cle: "neige", nom: "Neige" },
  { cle: "riviere", nom: "Rivière" },
  { cle: "village", nom: "Village" },
  { cle: "chateau", nom: "Château" },
  { cle: "grotte", nom: "Grotte" },
] as const;

const CLES: readonly string[] = VISUELS.map((v) => v.cle);
export const estVisuel = (cle: string | null | undefined): cle is string => !!cle && CLES.includes(cle);

/** Adresse d'un visuel ; « petite » : sa vignette, pour une carte ou le sélecteur d'image. */
export const adresseVisuel = (cle: string, petite = false): string =>
  `/illustrations/defaut-${estVisuel(cle) ? cle : VISUELS[0].cle}${petite ? "-v" : ""}.jpg`;
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

/**
 * Adresse de l'image de repérage à montrer : image importée, visuel choisi, ou visuel par
 * défaut. « grande » : pour une image large à l'écran, le visuel entier plutôt que sa
 * vignette ; une image importée se montre toujours par sa réduction d'écran, qui y suffit.
 */
export function adresseRepere(
  repere: { imageId: string | null; visuelChoisi: string | null; visuelDefaut: string | null },
  graine: string,
  grande = false,
): string {
  if (repere.imageId) return `/images/${repere.imageId}?v=1`;
  if (estVisuel(repere.visuelChoisi)) return adresseVisuel(repere.visuelChoisi, !grande);
  return adresseVisuel(estVisuel(repere.visuelDefaut) ? repere.visuelDefaut : tirerVisuel(graine), !grande);
}
