import { enregistrerImage, preparerImport } from "@/app/(adulte)/projet/actions-images";

/**
 * Import d'une image de repérage, côté navigateur (F10.1) : le fichier est vérifié, réduit
 * à la définition gardée et à une réduction d'écran, puis déposé dans le stockage.
 */

export const REFUS_IMPORT = "Cette image n’a pas pu être importée. Choisissez un fichier JPEG, PNG ou WebP de moins de 20 Mo.";
const FORMATS = ["image/jpeg", "image/png", "image/webp"];
const POIDS_MAX = 20 * 1024 * 1024;
/** Plus grand côté gardé : de quoi imprimer en pleine page dans le format du livre (F10, 3 octobre 2026). */
const COTE_GARDE = 2600;
const COTE_VIGNETTE = 900;

export type ImageReduite = { image: Blob; vignette: Blob; apercu: string };

function dessiner(source: ImageBitmap, cote: number, qualite: number): Promise<Blob | null> {
  const echelle = Math.min(1, cote / Math.max(source.width, source.height));
  const toile = document.createElement("canvas");
  toile.width = Math.max(1, Math.round(source.width * echelle));
  toile.height = Math.max(1, Math.round(source.height * echelle));
  const contexte = toile.getContext("2d");
  if (!contexte) return Promise.resolve(null);
  // Une image à fond transparent se pose sur du blanc, comme sur la page
  contexte.fillStyle = "#fff";
  contexte.fillRect(0, 0, toile.width, toile.height);
  contexte.imageSmoothingQuality = "high";
  contexte.drawImage(source, 0, 0, toile.width, toile.height);
  return new Promise((resoudre) => toile.toBlob(resoudre, "image/jpeg", qualite));
}

/** Réduit le fichier choisi ; null s'il n'est pas d'un format accepté, trop lourd ou illisible. */
export async function reduire(fichier: File): Promise<ImageReduite | null> {
  if (!FORMATS.includes(fichier.type) || fichier.size > POIDS_MAX || fichier.size === 0) return null;
  let source: ImageBitmap;
  try {
    source = await createImageBitmap(fichier, { imageOrientation: "from-image" });
  } catch {
    return null;
  }
  try {
    const [image, vignette] = await Promise.all([dessiner(source, COTE_GARDE, 0.9), dessiner(source, COTE_VIGNETTE, 0.82)]);
    if (!image || !vignette) return null;
    return { image, vignette, apercu: URL.createObjectURL(vignette) };
  } finally {
    source.close();
  }
}

const envoyer = async (adresse: string, contenu: Blob): Promise<boolean> => {
  try {
    const reponse = await fetch(adresse, { method: "PUT", body: contenu, headers: { "content-type": "image/jpeg", "x-upsert": "false" } });
    return reponse.ok;
  } catch {
    return false;
  }
};

/** Dépose l'image réduite dans le projet et rend son identifiant. */
export async function deposer(projetId: string, reduite: ImageReduite): Promise<{ ok: true; id: string } | { ok: false; erreur: string }> {
  const depot = await preparerImport(projetId);
  if (!depot.ok) return depot;
  const [image, vignette] = await Promise.all([envoyer(depot.depot, reduite.image), envoyer(depot.depotVignette, reduite.vignette)]);
  if (!image || !vignette) return { ok: false, erreur: "L’image n’est pas arrivée. Vérifiez la connexion et réessayez." };
  return enregistrerImage(projetId, depot.id);
}
