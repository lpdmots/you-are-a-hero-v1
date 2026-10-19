"use server";

import { revalidatePath } from "next/cache";
import { clientDuPoste, etatDuPoste, noterActivite } from "@/serveur/poste";
import { estUuid } from "@/serveur/recit";
import { chercherPourLePoste, contexteEleve, numerosDuPoste, type ChapitreTrouve } from "@/serveur/recit-eleve";

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

/**
 * « Mon idée d'image » (F10.2, F10-AC10) : l'élève décrit en quelques mots l'image qu'il imagine
 * pour une scène qu'il peut écrire ; il n'a aucune commande d'IA, l'adulte la retrouve en créant
 * l'image. La base revérifie qu'il peut écrire la scène.
 */
export async function noterMonIdee(sceneId: string, idee: string): Promise<Fait> {
  const poste = await base();
  if (!poste || !estUuid(sceneId)) return refus(null);
  const { error } = await poste.rpc("eleve_noter_idee_image", { p_scene: sceneId, p_idee: String(idee ?? "").slice(0, 2000) });
  if (error) return refus(error);
  return { ok: true };
}

/** « Scènes voisines » : la préférence de l'élève, qui le suit d'un poste à l'autre (F04-AC08). */
export async function reglerVoisines(affiche: boolean): Promise<void> {
  const poste = await base();
  if (poste) await poste.rpc("regler_voisines", { p_affiche: affiche === true });
}

/** Les numéros du livre, relus : après un choix créé ou une scène ajoutée (F05-AC34). */
export async function relireNumeros(projetId: string): Promise<Record<string, number>> {
  if (!(await base())) return {};
  return numerosDuPoste(await contexteEleve(), projetId);
}

/**
 * « Nouvelle scène », depuis un choix : le profil « écriture et organisation » la crée dans
 * son chapitre, avec le libellé pour titre proposé (F05-AC16, F06-AC12).
 */
export async function creerSceneDepuisChoix(
  chapitreId: string, titre: string, projetId: string,
): Promise<Fait<{ scene: { id: string; reference: number; titre: string | null; chapitreId: string }; numeros: Record<string, number> }>> {
  const creee = await ajouterScene(chapitreId);
  if (!creee.ok) return creee;
  const propre = String(titre ?? "").replace(/\s+/g, " ").trim().slice(0, 120);
  if (propre) await titrerScene(creee.id, propre);
  return { ok: true, scene: { id: creee.id, reference: creee.reference, titre: propre || null, chapitreId }, numeros: await relireNumeros(projetId) };
}

/** « Rechercher une scène » : ce que l'élève peut lire, et rien d'autre (F05-AC48). */
export async function chercherScenes(demande: string): Promise<ChapitreTrouve[]> {
  if (!(await base())) return [];
  return chercherPourLePoste(await contexteEleve(), String(demande ?? "").slice(0, 200));
}

// ——— Étape 4 : ce que l'élève fait de ses scènes (F06.3, F07.1, F07.3) ———

export type SceneChangee = { scene: string; par: string | null; enseignant: boolean; etat: string };

/**
 * « Je m'en occupe », sur une ou plusieurs scènes de son chapitre, et « M'occuper de cette
 * scène », sur celle d'un camarade (F06-AC38, AC42). « vu » : l'élève que la page montrait
 * sur la scène. Une scène qui a changé de main entre-temps n'est pas prise : la réponse la
 * nomme, et l'élève reçoit les autres.
 */
export async function prendreScenes(scenes: { scene: string; vu: string | null }[]): Promise<Fait<{ prises: string[]; changees: SceneChangee[] }>> {
  const poste = await base();
  if (!poste || !Array.isArray(scenes) || scenes.length === 0 || scenes.length > 60 || scenes.some((s) => !estUuid(s?.scene) || (s.vu !== null && !estUuid(s.vu)))) {
    return refus(null);
  }
  const { data, error } = await poste.rpc("eleve_prendre", { p_scenes: scenes.map((s) => ({ scene: s.scene, vu: s.vu })) });
  if (error) return refus(error);
  rafraichir();
  const fait = (data ?? {}) as { prises?: string[]; changees?: SceneChangee[] };
  return { ok: true, prises: fait.prises ?? [], changees: fait.changees ?? [] };
}

/** « Je ne m'en occupe plus », tant que la scène s'écrit : son texte reste dedans (F06-AC64). */
export async function rendreScene(sceneId: string): Promise<Fait> {
  const poste = await base();
  if (!poste || !estUuid(sceneId)) return refus(null);
  const { error } = await poste.rpc("eleve_rendre", { p_scene: sceneId });
  if (error) return refus(error);
  rafraichir();
  return { ok: true };
}

/** « Annuler », juste après avoir pris ou rendu une scène : qui s'en occupait est rétabli (F06-AC66). */
export async function annulerGeste(sceneId: string): Promise<Fait> {
  const poste = await base();
  if (!poste || !estUuid(sceneId)) return refus(null);
  const { error } = await poste.rpc("eleve_annuler_geste", { p_scene: sceneId });
  if (error) return refus(error);
  rafraichir();
  return { ok: true };
}

export type RemiseFaite =
  /** Le texte est remis ; « avant » : l'élève qui s'occupait de la scène, si ce n'était pas lui (F07-AC10) */
  | { ok: true; avant: string | null }
  /** Rien n'est remis : le texte montré n'est plus celui de la scène, il est vide, ou la scène ne s'écrit plus */
  | { ok: false; motif: "conflit" | "vide" | "scene" | "arrete" | "acces" };

/**
 * « Remettre à Mme Laurent » (F07.1). La page a d'abord enregistré la dernière saisie ; la
 * base vérifie que c'est bien ce texte qu'elle conserve, et ne confirme rien sinon
 * (F07-AC28, AC29).
 */
export async function remettreScene(sceneId: string, version: number): Promise<RemiseFaite> {
  const poste = await base();
  if (!poste || !estUuid(sceneId) || !Number.isInteger(version)) return { ok: false, motif: "acces" };
  const { data, error } = await poste.rpc("eleve_remettre", { p_scene: sceneId, p_version: version });
  const fait = data as { fait?: boolean; motif?: string; avant?: string | null } | null;
  if (error || !fait) return { ok: false, motif: "acces" };
  if (!fait.fait) {
    const motif = fait.motif;
    return { ok: false, motif: motif === "conflit" || motif === "vide" || motif === "scene" || motif === "arrete" ? motif : "acces" };
  }
  rafraichir();
  return { ok: true, avant: fait.avant ?? null };
}

/** « Modifier encore mon texte » : la remise est retirée, la scène s'écrit de nouveau (F07-AC09, AC12). */
export async function retirerRemise(sceneId: string): Promise<Fait> {
  const poste = await base();
  if (!poste || !estUuid(sceneId)) return refus(null);
  const { error } = await poste.rpc("eleve_retirer_remise", { p_scene: sceneId });
  if (error) return refus(error);
  rafraichir();
  return { ok: true };
}

/** « J'ai lu, j'écris » : la remarque ne sera plus montrée seule à l'ouverture de la scène (F07.3). */
export async function remarqueLue(sceneId: string): Promise<void> {
  const poste = await base();
  if (!poste || !estUuid(sceneId)) return;
  await poste.rpc("eleve_lire_remarque", { p_scene: sceneId });
  rafraichir();
}
