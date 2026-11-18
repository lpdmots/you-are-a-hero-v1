import "server-only";
import { LIEU_NOM_MAX, LIEU_PHRASE_MAX, type Lieu } from "@/domaine/preparation";
import type { Enseignant } from "./adulte";
import { estUuid } from "./recit";

/**
 * Les lieux de l'étape « Univers » (F02.1, 18 novembre 2026), sur le modèle des objets de
 * l'histoire : ajouter, renommer, supprimer avec « Annuler », ranger en tirant les lignes. L'adulte
 * seul les écrit : la base ne donne aucun droit sur la table à un poste d'élève (F02-AC24).
 */

type Echec = { ok: false; erreur: string };
export type FaitLieu<T = object> = ({ ok: true } & T) | Echec;
const echec = (erreur: string): Echec => ({ ok: false, erreur });
const NON_ENREGISTRE = "Cela n’a pas pu être enregistré. Réessayez.";
const ligne = (texte: unknown, max: number): string => String(texte ?? "").trim().replace(/\s+/g, " ").slice(0, max);

/** Un lieu supprimé, avec son rang : « Annuler » le remet à sa place (F02-AC25). */
export type LieuSupprime = Lieu & { rang: number };

/** Un nouveau lieu, au bout de la liste. */
export async function ajouterLieu(e: Enseignant, projetId: string, nom: string, phrase: string): Promise<FaitLieu<{ lieu: Lieu }>> {
  const propre = ligne(nom, LIEU_NOM_MAX);
  if (!estUuid(projetId)) return echec("Projet inconnu.");
  if (!propre) return echec("Écrivez le nom du lieu.");
  const { data: dernier, error: lecture } = await e.supabase
    .from("lieux").select("rang").eq("projet_id", projetId).order("rang", { ascending: false }).limit(1).maybeSingle();
  if (lecture) return echec(NON_ENREGISTRE);
  const { data, error } = await e.supabase
    .from("lieux")
    .insert({ projet_id: projetId, enseignant_id: e.id, nom: propre, phrase: ligne(phrase, LIEU_PHRASE_MAX), rang: dernier ? Number(dernier.rang) + 1 : 0 })
    .select("id, nom, phrase")
    .single();
  if (error || !data) return echec(NON_ENREGISTRE);
  return { ok: true, lieu: data as Lieu };
}

/** Le nom ou la phrase d'un lieu ; un nom vide est refusé, le lieu garde le sien. */
export async function reglerLieu(e: Enseignant, lieuId: string, valeurs: { nom?: string; phrase?: string }): Promise<FaitLieu<{ projetId: string }>> {
  if (!estUuid(lieuId)) return echec("Ce lieu n’existe plus.");
  const maj: Record<string, string> = {};
  if (valeurs.nom !== undefined) {
    const nom = ligne(valeurs.nom, LIEU_NOM_MAX);
    if (!nom) return echec("Donnez un nom au lieu.");
    maj.nom = nom;
  }
  if (valeurs.phrase !== undefined) maj.phrase = ligne(valeurs.phrase, LIEU_PHRASE_MAX);
  const { data, error } = await e.supabase.from("lieux").update(maj).eq("id", lieuId).select("projet_id");
  if (error) return echec(NON_ENREGISTRE);
  if (!data?.length) return echec("Ce lieu n’existe plus.");
  return { ok: true, projetId: data[0].projet_id as string };
}

/** Supprime un lieu et rend ce qu'il faut pour « Annuler ». */
export async function supprimerLieu(e: Enseignant, lieuId: string): Promise<FaitLieu<{ projetId: string; lieu: LieuSupprime }>> {
  if (!estUuid(lieuId)) return echec("Ce lieu n’existe plus.");
  const { data, error } = await e.supabase.from("lieux").delete().eq("id", lieuId).select("id, projet_id, nom, phrase, rang");
  if (error || !data?.length) return echec(NON_ENREGISTRE);
  const l = data[0] as { id: string; projet_id: string; nom: string; phrase: string; rang: number };
  return { ok: true, projetId: l.projet_id, lieu: { id: l.id, nom: l.nom, phrase: l.phrase, rang: l.rang } };
}

/**
 * « Annuler » : le lieu revient sous le même identifiant et le même rang, donc à sa place, les
 * autres n'ayant pas bougé. Déjà revenu (un double clic), il n'est pas recréé.
 */
export async function remettreLieu(e: Enseignant, projetId: string, lieu: LieuSupprime): Promise<FaitLieu> {
  const nom = ligne(lieu.nom, LIEU_NOM_MAX);
  if (!estUuid(projetId) || !estUuid(lieu.id) || !nom) return echec("Ce lieu ne peut pas revenir.");
  const rang = Number.isInteger(lieu.rang) && lieu.rang >= 0 ? lieu.rang : 0;
  const { error } = await e.supabase
    .from("lieux")
    .upsert({ id: lieu.id, projet_id: projetId, enseignant_id: e.id, nom, phrase: ligne(lieu.phrase, LIEU_PHRASE_MAX), rang }, { onConflict: "id", ignoreDuplicates: true });
  if (error) return echec(NON_ENREGISTRE);
  return { ok: true };
}

/** L'ordre tiré par l'adulte, d'un seul geste. */
export async function ordonnerLieux(e: Enseignant, projetId: string, ids: readonly string[]): Promise<FaitLieu> {
  if (!estUuid(projetId) || !ids.every(estUuid) || new Set(ids).size !== ids.length) return echec("Ces lieux n’existent plus.");
  const { error } = await e.supabase.rpc("ordonner_lieux", { p_projet: projetId, p_lieux: ids });
  if (error) return echec(NON_ENREGISTRE);
  return { ok: true };
}
