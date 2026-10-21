"use server";

import { randomUUID } from "node:crypto";
import { exigerEnseignant } from "@/serveur/adulte";
import { chercherDansLaBibliotheque, prendreDeLaBibliotheque } from "@/serveur/bibliotheque";
import { cheminImage, cheminVignette, lireImage, POIDS_MAX_IMAGE, POIDS_MAX_VIGNETTE, SEAU } from "@/serveur/images";
import { projetDe } from "@/serveur/lectures";
import { estUuid, imagesDuProjet } from "@/serveur/recit";
import { clientService } from "@/serveur/supabase";

/**
 * Import d'une image de repérage (F10.1). Le navigateur réduit l'image, la dépose dans le
 * stockage par deux adresses à usage unique, puis demande son inscription dans le projet :
 * le serveur relit alors ce qui a été déposé, et le refuse si ce n'est pas une image.
 */

type Echec = { ok: false; erreur: string };
const REFUS = "Cette image n’a pas pu être importée. Choisissez un fichier JPEG, PNG ou WebP de moins de 20 Mo.";
const echec = (erreur = REFUS): Echec => ({ ok: false, erreur });

/** Deux adresses de dépôt, pour l'image gardée et pour sa réduction d'écran. */
export async function preparerImport(projetId: string): Promise<{ ok: true; id: string; depot: string; depotVignette: string } | Echec> {
  const e = await exigerEnseignant();
  if (!(await projetDe(e, projetId))) return echec("Projet inconnu.");
  const id = randomUUID();
  const stockage = clientService().storage.from(SEAU);
  const [image, vignette] = await Promise.all([
    stockage.createSignedUploadUrl(cheminImage(e.id, projetId, id)),
    stockage.createSignedUploadUrl(cheminVignette(e.id, projetId, id)),
  ]);
  if (image.error || vignette.error || !image.data || !vignette.data) return echec("L’import n’a pas pu commencer. Réessayez.");
  return { ok: true, id, depot: image.data.signedUrl, depotVignette: vignette.data.signedUrl };
}

/** Inscrit dans le projet l'image que le navigateur vient de déposer, après l'avoir relue. */
export async function enregistrerImage(projetId: string, id: string): Promise<{ ok: true; id: string } | Echec> {
  const e = await exigerEnseignant();
  if (!estUuid(id) || !(await projetDe(e, projetId))) return echec("Projet inconnu.");
  const chemins = [cheminImage(e.id, projetId, id), cheminVignette(e.id, projetId, id)];
  const stockage = clientService().storage.from(SEAU);
  const jeter = async () => {
    await stockage.remove(chemins);
    return echec();
  };

  const [image, vignette] = await Promise.all(chemins.map((c) => stockage.download(c)));
  if (image.error || vignette.error || !image.data || !vignette.data) return jeter();
  if (image.data.size > POIDS_MAX_IMAGE || vignette.data.size > POIDS_MAX_VIGNETTE) return jeter();
  // L'image et sa réduction d'écran sont du même format : JPEG, ou PNG et WebP quand le fond est transparent
  const taille = lireImage(new Uint8Array(await image.data.arrayBuffer()));
  const reduite = lireImage(new Uint8Array(await vignette.data.arrayBuffer()));
  if (!taille || !reduite || reduite.format !== taille.format) return jeter();

  const { error } = await e.supabase.from("images").insert({
    id, projet_id: projetId, enseignant_id: e.id, chemin: chemins[0], chemin_vignette: chemins[1], largeur: taille.largeur, hauteur: taille.hauteur,
    format: taille.format,
  });
  if (error) return jeter();
  return { ok: true, id };
}

/** « Images du projet » : celles déjà importées, à réutiliser d'un clic (F10-AC05). */
export async function listerImages(projetId: string): Promise<string[]> {
  const e = await exigerEnseignant();
  return (await imagesDuProjet(e, projetId)).map((i) => i.id);
}

/** Les images de la bibliothèque (F10.1, F10-AC54), toutes ou celles d'un mot-clé : leur identité et leurs mots. */
export async function chercherDesImages(terme: string): Promise<{ id: string; mots: string[] }[]> {
  const e = await exigerEnseignant();
  return (await chercherDansLaBibliotheque(e, String(terme ?? "").slice(0, 60))).map((i) => ({ id: i.id, mots: i.mots }));
}

/** Prendre une image de la bibliothèque : copiée parmi les images du projet, elle rend son identité. */
export async function prendreUneImage(projetId: string, id: string): Promise<{ ok: true; id: string } | Echec> {
  const e = await exigerEnseignant();
  const imageId = await prendreDeLaBibliotheque(e, projetId, id);
  return imageId ? { ok: true, id: imageId } : echec("Cette image n’a pas pu être prise. Réessayez.");
}
