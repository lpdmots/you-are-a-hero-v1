import "server-only";

/**
 * Images de repérage (F10.1). Le navigateur réduit l'image et la dépose lui-même dans le
 * stockage, par une adresse à usage unique ; le serveur relit ensuite ce qui a été déposé
 * avant de l'inscrire dans le projet. Rien ne se lit du stockage sans passer par lui.
 */

export const SEAU = "images";
/** Poids maximal de ce que le navigateur dépose, après réduction. */
export const POIDS_MAX_IMAGE = 8 * 1024 * 1024;
export const POIDS_MAX_VIGNETTE = 1024 * 1024;

export const cheminImage = (enseignantId: string, projetId: string, id: string): string => `${enseignantId}/${projetId}/${id}.jpg`;
export const cheminVignette = (enseignantId: string, projetId: string, id: string): string => `${enseignantId}/${projetId}/${id}-v.jpg`;

/**
 * Dimensions d'une image JPEG, lues dans ses en-têtes ; null si ce n'en est pas une.
 * Le navigateur dépose toujours du JPEG : tout autre contenu est refusé.
 */
export function dimensionsJpeg(octets: Uint8Array): { largeur: number; hauteur: number } | null {
  if (octets.length < 4 || octets[0] !== 0xff || octets[1] !== 0xd8) return null;
  let i = 2;
  while (i + 9 < octets.length) {
    if (octets[i] !== 0xff) return null;
    const marque = octets[i + 1];
    if (marque === 0xff) {
      i += 1;
      continue;
    }
    // Marques sans longueur : RSTn, SOI, EOI, TEM
    if ((marque >= 0xd0 && marque <= 0xd9) || marque === 0x01) {
      i += 2;
      continue;
    }
    const longueur = (octets[i + 2] << 8) | octets[i + 3];
    if (longueur < 2) return null;
    // SOF0 à SOF15, hors DHT (C4), JPG (C8) et DAC (CC) : hauteur puis largeur
    if (marque >= 0xc0 && marque <= 0xcf && marque !== 0xc4 && marque !== 0xc8 && marque !== 0xcc) {
      const hauteur = (octets[i + 5] << 8) | octets[i + 6];
      const largeur = (octets[i + 7] << 8) | octets[i + 8];
      return largeur > 0 && hauteur > 0 ? { largeur, hauteur } : null;
    }
    i += 2 + longueur;
  }
  return null;
}
