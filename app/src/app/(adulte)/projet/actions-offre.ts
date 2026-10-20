"use server";

import { exigerEnseignant } from "@/serveur/adulte";
import { estUuid } from "@/serveur/recit";
import { limitesDuProjet, offreActuelle } from "@/serveur/offre";
import { posesDImages, type Limites, type Offre } from "@/domaine/offre";

/**
 * L'offre d'un projet (F14) : ce que le dialogue du pass montre quand une limite gratuite est
 * atteinte, et ce que les réglages du projet disent. Rien quand « Paiement ouvert » est éteint :
 * ni limite ni vente (F14-AC12).
 */
export type OffreDuProjet = { projetId: string; titre: string; limites: Limites; offre: Offre };

export async function offreDuProjet(projetId: string): Promise<OffreDuProjet | null> {
  const e = await exigerEnseignant();
  if (!estUuid(projetId)) return null;
  const { data: projet } = await e.supabase.from("projets").select("id, titre").eq("id", projetId).maybeSingle();
  if (!projet) return null;
  const [offre, limites] = await Promise.all([offreActuelle(), limitesDuProjet(e.supabase, projetId)]);
  if (!offre.paiementOuvert || !limites) return null;
  return { projetId, titre: projet.titre as string, limites, offre };
}

/**
 * Une image de plus tient-elle dans le livre gratuit (F14-AC14) ? Le compte du livre, moins ce que
 * la scène portait à son dernier enregistrement, plus ce que la copie porte maintenant. Une scène
 * hors du livre ou dans la corbeille ne compte pas.
 */
export async function imagePossible(sceneId: string, dansLaScene: number): Promise<boolean> {
  const e = await exigerEnseignant();
  if (!estUuid(sceneId) || !Number.isInteger(dansLaScene) || dansLaScene < 0) return true;
  const { data: scene } = await e.supabase.from("scenes").select("projet_id, texte, hors_livre, supprime_le").eq("id", sceneId).maybeSingle();
  if (!scene || scene.hors_livre || scene.supprime_le) return true;
  const limites = await limitesDuProjet(e.supabase, scene.projet_id as string);
  if (!limites?.limite) return true;
  const ailleurs = limites.images - posesDImages((scene.texte as unknown[] | null) ?? []);
  return ailleurs + dansLaScene + 1 <= limites.imagesGratuites;
}
