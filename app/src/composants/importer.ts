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

function dessiner(source: ImageBitmap, cote: number, qualite: number, transparente = false): Promise<Blob | null> {
  const echelle = Math.min(1, cote / Math.max(source.width, source.height));
  const toile = document.createElement("canvas");
  toile.width = Math.max(1, Math.round(source.width * echelle));
  toile.height = Math.max(1, Math.round(source.height * echelle));
  const contexte = toile.getContext("2d");
  if (!contexte) return Promise.resolve(null);
  // Une image de repérage à fond transparent se pose sur du blanc, comme sur la page ; une
  // image posée dans une scène garde sa transparence (F10-AC31)
  if (!transparente) {
    contexte.fillStyle = "#fff";
    contexte.fillRect(0, 0, toile.width, toile.height);
  }
  contexte.imageSmoothingQuality = "high";
  contexte.drawImage(source, 0, 0, toile.width, toile.height);
  // WebP garde la transparence sans le poids du PNG ; le navigateur qui ne sait pas l'écrire rend du PNG
  return new Promise((resoudre) => toile.toBlob(resoudre, transparente ? "image/webp" : "image/jpeg", qualite));
}

/** L'image a-t-elle un fond transparent ? On le lit sur une réduction, ce qui suffit pour un détourage. */
function aDeLaTransparence(source: ImageBitmap): boolean {
  const toile = document.createElement("canvas");
  const echelle = Math.min(1, 96 / Math.max(source.width, source.height));
  toile.width = Math.max(1, Math.round(source.width * echelle));
  toile.height = Math.max(1, Math.round(source.height * echelle));
  const contexte = toile.getContext("2d", { willReadFrequently: true });
  if (!contexte) return false;
  contexte.drawImage(source, 0, 0, toile.width, toile.height);
  const points = contexte.getImageData(0, 0, toile.width, toile.height).data;
  for (let i = 3; i < points.length; i += 4) if (points[i] < 250) return true;
  return false;
}

/**
 * Réduit le fichier choisi ; null s'il n'est pas d'un format accepté, trop lourd ou illisible.
 * Pour une image posée dans une scène, `garderLaTransparence` conserve un fond transparent.
 */
export async function reduire(
  fichier: File,
  garderLaTransparence = false,
  /** La part de l'image à garder (la face avant d'une couverture entière, F11-AC116) : le reste ne quitte pas le poste */
  cadre?: (largeur: number, hauteur: number) => { gauche: number; largeur: number; hauteur: number },
): Promise<ImageReduite | null> {
  if (!FORMATS.includes(fichier.type) || fichier.size > POIDS_MAX || fichier.size === 0) return null;
  let source: ImageBitmap;
  try {
    source = await createImageBitmap(fichier, { imageOrientation: "from-image" });
    if (cadre) {
      const c = cadre(source.width, source.height);
      if (c.gauche > 0 || c.largeur < source.width) {
        const entiere = source;
        source = await createImageBitmap(entiere, c.gauche, 0, c.largeur, c.hauteur);
        entiere.close();
      }
    }
  } catch {
    return null;
  }
  try {
    const transparente = garderLaTransparence && fichier.type !== "image/jpeg" && aDeLaTransparence(source);
    const [image, vignette] = await Promise.all([dessiner(source, COTE_GARDE, 0.9, transparente), dessiner(source, COTE_VIGNETTE, 0.82, transparente)]);
    if (!image || !vignette || image.type !== vignette.type) return null;
    return { image, vignette, apercu: URL.createObjectURL(vignette) };
  } finally {
    source.close();
  }
}

const envoyer = async (adresse: string, contenu: Blob): Promise<boolean> => {
  try {
    const reponse = await fetch(adresse, { method: "PUT", body: contenu, headers: { "content-type": contenu.type || "image/jpeg", "x-upsert": "false" } });
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
