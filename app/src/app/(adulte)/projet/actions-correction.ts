"use server";

import { revalidatePath } from "next/cache";
import { exigerEnseignant } from "@/serveur/adulte";
import { garderUneCorrection, remplacerSiInchange, type Remplacement } from "@/serveur/correction";

/**
 * Ce que l'adulte fait d'une correction proposée (F13.1) : la garder, puis, quelques
 * secondes, l'annuler. La demande elle-même passe par l'adresse /ia/correction.
 */

async function rafraichir(e: Awaited<ReturnType<typeof exigerEnseignant>>, sceneId: string, fait: Remplacement): Promise<Remplacement> {
  if (!fait.ok) return fait;
  const { data } = await e.supabase.from("scenes").select("projet_id").eq("id", sceneId).maybeSingle();
  if (data) revalidatePath(`/projet/${data.projet_id}`, "layout");
  return fait;
}

/** « Garder les changements » (degrés 1 à 3) ou « Mettre ce texte dans la scène » (4 et 5). */
export async function garderLaCorrection(sceneId: string, version: number, propositions: unknown, refuses: unknown): Promise<Remplacement> {
  const e = await exigerEnseignant();
  return rafraichir(e, sceneId, await garderUneCorrection(e, sceneId, version, propositions, refuses));
}

/** « Annuler », juste après : la scène retrouve son texte d'avant la correction, si personne n'y a écrit depuis. */
export async function annulerLaCorrection(sceneId: string, version: number, texte: unknown): Promise<Remplacement> {
  const e = await exigerEnseignant();
  const fait = await remplacerSiInchange(e, sceneId, version, texte);
  return rafraichir(e, sceneId, fait.ok || !fait.change ? fait : { ...fait, message: "Le texte a changé entre-temps : rien n’a été annulé." });
}
