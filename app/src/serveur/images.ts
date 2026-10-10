import "server-only";

/**
 * Images du projet : repères du récit (F10.1) et images posées dans les scènes (F10). Le
 * navigateur réduit l'image et la dépose lui-même dans le stockage, par une adresse à usage
 * unique ; le serveur relit ensuite ce qui a été déposé avant de l'inscrire dans le projet.
 * Rien ne se lit du stockage sans passer par lui.
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

export type FormatImage = "jpeg" | "png" | "webp";
export const TYPE_MIME: Record<FormatImage, string> = { jpeg: "image/jpeg", png: "image/png", webp: "image/webp" };

const entier32 = (o: Uint8Array, i: number): number => ((o[i] << 24) | (o[i + 1] << 16) | (o[i + 2] << 8) | o[i + 3]) >>> 0;
const lettres = (o: Uint8Array, i: number, n: number): string => String.fromCharCode(...o.subarray(i, i + n));

/**
 * Format et dimensions de ce que le navigateur a déposé, lus dans ses en-têtes ; null si ce
 * n'est ni du JPEG, ni du PNG, ni du WebP. Une image à fond transparent reste en PNG ou en
 * WebP, pour garder sa transparence (F10-AC31).
 */
export function lireImage(octets: Uint8Array): { format: FormatImage; largeur: number; hauteur: number } | null {
  const jpeg = dimensionsJpeg(octets);
  if (jpeg) return { format: "jpeg", ...jpeg };
  const valide = (largeur: number, hauteur: number, format: FormatImage) =>
    largeur > 0 && hauteur > 0 && largeur <= 20000 && hauteur <= 20000 ? { format, largeur, hauteur } : null;
  // PNG : signature, puis le bloc IHDR, largeur et hauteur sur quatre octets
  if (octets.length >= 24 && entier32(octets, 0) === 0x89504e47 && entier32(octets, 4) === 0x0d0a1a0a && lettres(octets, 12, 4) === "IHDR") {
    return valide(entier32(octets, 16), entier32(octets, 20), "png");
  }
  // WebP : conteneur RIFF, puis l'un de ses trois blocs d'image
  if (octets.length >= 30 && lettres(octets, 0, 4) === "RIFF" && lettres(octets, 8, 4) === "WEBP") {
    const bloc = lettres(octets, 12, 4);
    if (bloc === "VP8X") return valide(1 + (octets[24] | (octets[25] << 8) | (octets[26] << 16)), 1 + (octets[27] | (octets[28] << 8) | (octets[29] << 16)), "webp");
    if (bloc === "VP8L" && octets[20] === 0x2f) {
      const b = octets[21] | (octets[22] << 8) | (octets[23] << 16) | (octets[24] << 24);
      return valide(1 + (b & 0x3fff), 1 + ((b >>> 14) & 0x3fff), "webp");
    }
    if (bloc === "VP8 " && octets[23] === 0x9d && octets[24] === 0x01 && octets[25] === 0x2a) {
      return valide((octets[26] | (octets[27] << 8)) & 0x3fff, (octets[28] | (octets[29] << 8)) & 0x3fff, "webp");
    }
  }
  return null;
}
