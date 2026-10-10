"use server";

import { revalidatePath } from "next/cache";
import { exigerEnseignant } from "@/serveur/adulte";
import { texteDeScene, versionsPrecedentes, type TexteDeScene, type VersionPrecedente } from "@/serveur/copie";
import { estUuid } from "@/serveur/recit";

/**
 * Ce que l'adulte fait des textes d'une scène (F08.1, F08.2) : ne plus garder un texte
 * gardé à part, le mettre dans la scène, relire une version précédente. Le texte lui-même
 * s'enregistre par l'adresse /copie. La base revérifie à qui est la scène.
 */

type Echec = { ok: false; erreur: string };
type Fait<T = object> = ({ ok: true } & T) | Echec;
const echec = (erreur: string): Echec => ({ ok: false, erreur });
const refus = (erreur: { code?: string; message: string } | null, parDefaut: string): Echec =>
  echec(erreur?.code && /^P000\d$/.test(erreur.code) ? erreur.message : parDefaut);

const rafraichir = (projetId: string) => revalidatePath(`/projet/${projetId}`, "layout");

async function projetDeLaScene(sceneId: string): Promise<{ projetId: string } | null> {
  const e = await exigerEnseignant();
  if (!estUuid(sceneId)) return null;
  const { data } = await e.supabase.from("scenes").select("projet_id").eq("id", sceneId).maybeSingle();
  return data ? { projetId: data.projet_id as string } : null;
}

/** Le texte de la scène tel qu'il est maintenant, avec ce qui est gardé à part (F08-AC21). */
export async function relireTexte(sceneId: string): Promise<Fait<{ scene: TexteDeScene }>> {
  const e = await exigerEnseignant();
  const scene = await texteDeScene(e, sceneId);
  return scene ? { ok: true, scene } : echec("Cette scène n’existe plus.");
}

/** « Ne plus garder ce texte » (F08-AC07). L'élève arrêté retrouve l'écriture. */
export async function nePlusGarder(copieId: string, sceneId: string): Promise<Fait> {
  const e = await exigerEnseignant();
  const lieu = await projetDeLaScene(sceneId);
  if (!lieu || !estUuid(copieId)) return echec("Ce texte n’est plus gardé à part.");
  const { error } = await e.supabase.rpc("ne_plus_garder", { p_copie: copieId });
  if (error) return refus(error, "Cela n’a pas pu être fait. Réessayez.");
  rafraichir(lieu.projetId);
  return { ok: true };
}

/** « Annuler », tant que l'adulte reste sur la page : le texte est de nouveau gardé à part (F08-AC13). */
export async function garderDeNouveau(copieId: string, sceneId: string): Promise<Fait<{ scene: TexteDeScene }>> {
  const e = await exigerEnseignant();
  const lieu = await projetDeLaScene(sceneId);
  if (!lieu || !estUuid(copieId)) return echec("Ce texte ne peut plus être retrouvé.");
  const { error } = await e.supabase.rpc("garder_de_nouveau", { p_copie: copieId });
  if (error) return refus(error, "Ce texte ne peut plus être retrouvé.");
  rafraichir(lieu.projetId);
  const scene = await texteDeScene(e, sceneId);
  return scene ? { ok: true, scene } : echec("Cette scène n’existe plus.");
}

/**
 * « Mettre ce texte dans la scène » : un échange (F08-AC08). L'état de la scène, l'élève
 * qui s'en occupe et les remises ne changent pas (F08-AC25).
 */
export async function mettreDansLaScene(copieId: string, sceneId: string): Promise<Fait<{ scene: TexteDeScene; ancien: string | null }>> {
  const e = await exigerEnseignant();
  const lieu = await projetDeLaScene(sceneId);
  if (!lieu || !estUuid(copieId)) return echec("Ce texte n’est plus gardé à part.");
  const { data, error } = await e.supabase.rpc("mettre_copie_dans_scene", { p_copie: copieId });
  if (error) return refus(error, "Le texte n’a pas pu être mis dans la scène. Réessayez.");
  rafraichir(lieu.projetId);
  const scene = await texteDeScene(e, sceneId);
  return scene ? { ok: true, scene, ancien: ((data as { ancien?: string | null } | null)?.ancien ?? null) } : echec("Cette scène n’existe plus.");
}

/** « Versions précédentes » : l'adulte seul les lit (F08-AC43). */
export async function lireVersions(sceneId: string): Promise<Fait<{ versions: VersionPrecedente[] }>> {
  const e = await exigerEnseignant();
  return { ok: true, versions: await versionsPrecedentes(e, sceneId) };
}

/** « Mettre ce texte dans la scène », depuis une version précédente : le même échange (F08-AC42). */
export async function remettreVersion(versionId: string, sceneId: string): Promise<Fait<{ scene: TexteDeScene }>> {
  const e = await exigerEnseignant();
  const lieu = await projetDeLaScene(sceneId);
  if (!lieu || !estUuid(versionId)) return echec("Cette version n’existe plus.");
  const { error } = await e.supabase.rpc("mettre_version_dans_scene", { p_version: versionId });
  if (error) return refus(error, "Le texte n’a pas pu être mis dans la scène. Réessayez.");
  rafraichir(lieu.projetId);
  const scene = await texteDeScene(e, sceneId);
  return scene ? { ok: true, scene } : echec("Cette scène n’existe plus.");
}
