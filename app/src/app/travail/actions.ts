"use server";

import { revalidatePath } from "next/cache";
import { clientDuPoste, etatDuPoste, noterActivite } from "@/serveur/poste";
import { estUuid } from "@/serveur/recit";

/**
 * Ce qu'un élève du profil « écriture et organisation » peut changer dans son chapitre
 * (F06.1, 10 octobre 2026) : créer une scène, lui donner un titre, changer l'ordre des
 * scènes, supprimer une scène qu'il a créée. La base revérifie son attribution à chaque
 * appel : rien ici ne fait confiance au navigateur.
 */

type Fait<T = object> = ({ ok: true } & T) | { ok: false; erreur: string };
const REFUS = "Tu ne peux pas faire cela dans ce chapitre.";
const refus = (erreur: { code?: string; message: string } | null): { ok: false; erreur: string } => ({
  ok: false, erreur: erreur?.code === "P0001" ? erreur.message : REFUS,
});

async function base() {
  const poste = await etatDuPoste();
  if (!poste?.inscriptionId) return null;
  await noterActivite();
  return clientDuPoste(poste);
}
const rafraichir = () => revalidatePath("/travail", "layout");

export async function ajouterScene(chapitreId: string): Promise<Fait<{ id: string; reference: number }>> {
  const poste = await base();
  if (!poste || !estUuid(chapitreId)) return refus(null);
  const { data, error } = await poste.rpc("eleve_creer_scene", { p_chapitre: chapitreId });
  const ligne = (Array.isArray(data) ? data[0] : data) as { scene_id: string; reference: number } | null;
  if (error || !ligne) return refus(error);
  rafraichir();
  return { ok: true, id: ligne.scene_id, reference: ligne.reference };
}

export async function titrerScene(sceneId: string, titre: string): Promise<Fait> {
  const poste = await base();
  if (!poste || !estUuid(sceneId)) return refus(null);
  const { error } = await poste.rpc("eleve_titrer_scene", { p_scene: sceneId, p_titre: String(titre ?? "").replace(/\s+/g, " ").trim().slice(0, 120) });
  if (error) return refus(error);
  rafraichir();
  return { ok: true };
}

export async function placerScene(sceneId: string, position: number): Promise<Fait> {
  const poste = await base();
  if (!poste || !estUuid(sceneId) || !Number.isInteger(position) || position < 0 || position > 10000) return refus(null);
  const { error } = await poste.rpc("eleve_placer_scene", { p_scene: sceneId, p_position: position });
  if (error) return refus(error);
  rafraichir();
  return { ok: true };
}

export async function supprimerScene(sceneId: string): Promise<Fait> {
  const poste = await base();
  if (!poste || !estUuid(sceneId)) return refus(null);
  const { error } = await poste.rpc("eleve_supprimer_scene", { p_scene: sceneId });
  if (error) return refus(error);
  rafraichir();
  return { ok: true };
}
