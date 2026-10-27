"use server";

import { DESCRIPTION_IMAGE_MAX, IDEE_MAX } from "@/domaine/illustration";
import { paragraphes } from "@/domaine/personnages";
import { exigerEnseignant } from "@/serveur/adulte";
import {
  couvertureDuProjet, demandeDe, demandeParId, fermerLaDemande, noterLesCasesDeLaCouverture, poserLaCouverture, type CouvertureDuProjet, noterLaPropositionPosee, rendreLaProposition, reserverLaProposition, imagesEnRoute, lireDemandeDeScene, ouvrirLImageDeScene, promptDeLaCouverture, promptDeLImageDeScene, type Cible, type DemandeDeScene,
  type DemandeDImage, type OuvertureDeLImage,
} from "@/serveur/images-creees";
import { estUuid } from "@/serveur/recit";

/**
 * Ce qui accompagne les images créées sans IA (F10.2, F11.4) : ouvrir le panneau d'une image de
 * scène, garder l'idée et la description (la dernière, attachée à la scène ou au projet, pour la
 * reprendre plus tard), copier le prompt assemblé. Les demandes à l'IA passent par `/ia/images`.
 */

type Echec = { ok: false; erreur: string };
const echec = (erreur: string): Echec => ({ ok: false, erreur });
const NON_ENREGISTRE = "Cela n’a pas pu être enregistré. Réessayez.";

export async function ouvrirLImage(sceneId: string): Promise<OuvertureDeLImage | null> {
  return ouvrirLImageDeScene(await exigerEnseignant(), sceneId);
}

export type NoteDImage = { idee?: string; description?: string };

/** L'idée (« Ce que montre l'image ») et la description d'une image de scène, gardées avec elle. */
export async function noterLImage(sceneId: string, note: NoteDImage): Promise<{ ok: true } | Echec> {
  const e = await exigerEnseignant();
  if (!estUuid(sceneId)) return echec(NON_ENREGISTRE);
  const maj: Record<string, string> = {};
  if (typeof note?.idee === "string") maj.idee_image = paragraphes(note.idee, IDEE_MAX);
  if (typeof note?.description === "string") maj.description_image = paragraphes(note.description, DESCRIPTION_IMAGE_MAX);
  if (!Object.keys(maj).length) return { ok: true };
  const { data, error } = await e.supabase.from("scenes").update(maj).eq("id", sceneId).select("id");
  return error || !data?.length ? echec(NON_ENREGISTRE) : { ok: true };
}

/** « Copier le prompt » d'une image de scène, sans IA (F10-AC07). */
export async function promptDeLImage(sceneId: string, demande: DemandeDeScene): Promise<{ ok: true; prompt: string } | Echec> {
  const d = lireDemandeDeScene(demande ?? {});
  if (!d) return echec("Choisissez un cadrage.");
  const r = await promptDeLImageDeScene(await exigerEnseignant(), sceneId, d);
  return r.ok ? r : echec(r.message);
}

/** L'idée et la description de l'illustration de couverture (F11.4), gardées avec le projet. */
export async function noterLaCouverture(projetId: string, note: NoteDImage): Promise<{ ok: true } | Echec> {
  const e = await exigerEnseignant();
  if (!estUuid(projetId)) return echec(NON_ENREGISTRE);
  const maj: Record<string, string> = {};
  if (typeof note?.idee === "string") maj.idee_couverture = paragraphes(note.idee, IDEE_MAX);
  if (typeof note?.description === "string") maj.description_couverture = paragraphes(note.description, DESCRIPTION_IMAGE_MAX);
  if (!Object.keys(maj).length) return { ok: true };
  const { data, error } = await e.supabase.from("projets").update(maj).eq("id", projetId).select("id");
  return error || !data?.length ? echec(NON_ENREGISTRE) : { ok: true };
}

/** Le bloc « La couverture » (F11.4, 26 octobre 2026) relu après une demande ou un import. */
export async function lireLaCouverture(projetId: string): Promise<CouvertureDuProjet | null> {
  return couvertureDuProjet(await exigerEnseignant(), projetId);
}

/** Les cases de « Écrire sur la couverture » (F11-AC112), gardées avec le projet. */
export async function noterLesCases(projetId: string, cases: unknown): Promise<{ ok: true } | Echec> {
  return (await noterLesCasesDeLaCouverture(await exigerEnseignant(), projetId, cases)) ? { ok: true } : echec(NON_ENREGISTRE);
}

/** Poser une couverture importée, remettre la précédente (« Annuler »), ou la retirer. */
export async function poserUneCouverture(projetId: string, imageId: string | null): Promise<{ ok: true } | Echec> {
  return (await poserLaCouverture(await exigerEnseignant(), projetId, imageId)) ? { ok: true } : echec("La couverture n’a pas pu être posée. Réessayez.");
}

/** « Copier le prompt » de la couverture, sans IA (F11.4). */
export async function promptDeCouverture(projetId: string): Promise<{ ok: true; prompt: string } | Echec> {
  const r = await promptDeLaCouverture(await exigerEnseignant(), projetId);
  return r.ok ? r : echec(r.message);
}

/** La demande d'image en route, ou prête, d'un élément (reprise du 18 octobre 2026). */
export async function demandeDImage(cible: Cible, cibleId: string): Promise<DemandeDImage | null> {
  if (!["projet", "partie", "chapitre", "scene", "personnage", "objet", "couverture"].includes(cible)) return null;
  return demandeDe(await exigerEnseignant(), cible, cibleId);
}

/** Une demande suivie jusqu'à son arrivée. */
export async function suivreLaDemande(demandeId: string): Promise<DemandeDImage | null> {
  return demandeParId(await exigerEnseignant(), demandeId);
}

/** Les éléments du projet dont l'image est en route : leurs cartes portent le signe d'attente. */
export async function enRoute(projetId: string): Promise<string[]> {
  return imagesEnRoute(await exigerEnseignant(), projetId);
}

/** Une proposition réservée est posée dans le texte par la copie. */
export async function propositionPosee(demandeId: string, proposition: string, imageId: string): Promise<void> {
  await noterLaPropositionPosee(await exigerEnseignant(), demandeId, proposition, imageId);
}

/** Réserver une proposition avant de la poser : une seule voie l'emporte (« Garder » ou la pose d'office). */
export async function reserverUneProposition(demandeId: string, proposition: string): Promise<boolean> {
  return reserverLaProposition(await exigerEnseignant(), demandeId, proposition);
}

export async function rendreUneProposition(demandeId: string, proposition: string): Promise<void> {
  await rendreLaProposition(await exigerEnseignant(), demandeId, proposition);
}

/** Garder une proposition (déjà déposée par la page) ou les laisser : la demande se ferme. */
export async function fermerUneDemande(demandeId: string): Promise<void> {
  await fermerLaDemande(await exigerEnseignant(), demandeId);
}
