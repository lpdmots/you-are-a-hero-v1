"use server";

import { revalidatePath } from "next/cache";
import { avertissementsAcceptes, empreinteDe, estEtapeLivre, etatChemins, etatRelire } from "@/domaine/livre";
import { exigerEnseignant } from "@/serveur/adulte";
import { etatDuLivre } from "@/serveur/controles";
import { estUuid, planDe } from "@/serveur/recit";
import { projetDe } from "@/serveur/lectures";
import { donneesDeLaScene, type DonneesDeLaScene } from "@/serveur/scene";
import { scenesDe, type Plan } from "@/domaine/recit";

/**
 * Les deux jugements de « Vérifier les chemins » (F11.6) : « C'est voulu » sur un
 * avertissement, et la déclaration de l'étape. Le serveur recalcule les contrôles avant
 * chacun : il ne se fie pas à ce que la page a montré.
 */

type Fait = { ok: true } | { ok: false; erreur: string };
const rafraichir = (projetId: string) => revalidatePath(`/projet/${projetId}`, "layout");

/** « C'est voulu » : seulement sur un avertissement que les contrôles donnent encore. */
export async function accepterAvertissement(projetId: string, cle: string): Promise<Fait> {
  const e = await exigerEnseignant();
  if (!estUuid(projetId) || typeof cle !== "string") return { ok: false, erreur: "Projet inconnu." };
  const livre = await etatDuLivre(e, projetId);
  const point = livre?.problemes.find((p) => p.cle === cle && p.gravite === "avert" && !p.reporte);
  if (!point) return { ok: false, erreur: "Ce point a changé. La liste est à jour." };
  const { error } = await e.supabase.rpc("accepter_avertissement", { p_projet: projetId, p_cle: cle, p_empreinte: empreinteDe(point) });
  if (error) return { ok: false, erreur: "Cela n’a pas pu être enregistré." };
  rafraichir(projetId);
  return { ok: true };
}

/** « Revoir » : l'avertissement est de nouveau à traiter. */
export async function retirerAcceptation(projetId: string, cle: string): Promise<Fait> {
  const e = await exigerEnseignant();
  if (!estUuid(projetId) || typeof cle !== "string") return { ok: false, erreur: "Projet inconnu." };
  const { error } = await e.supabase.from("avertissements_acceptes").delete().eq("projet_id", projetId).eq("cle", cle);
  if (error) return { ok: false, erreur: "Cela n’a pas pu être enregistré." };
  rafraichir(projetId);
  return { ok: true };
}

/** « J'ai vérifié les chemins », posée quand il ne reste rien, ou retirée. */
export async function declarerChemins(projetId: string, declaree: boolean): Promise<Fait> {
  const e = await exigerEnseignant();
  if (!estUuid(projetId)) return { ok: false, erreur: "Projet inconnu." };
  if (declaree) {
    const livre = await etatDuLivre(e, projetId);
    if (!livre) return { ok: false, erreur: "Projet inconnu." };
    const etat = etatChemins(livre.problemes, avertissementsAcceptes(livre.problemes, livre.acceptations, livre.changements), false);
    if (!etat.declarable) return { ok: false, erreur: "Il reste quelque chose à faire avant de le déclarer." };
  }
  const { data, error } = await e.supabase
    .from("projets")
    .update({ chemins_verifies_le: declaree ? new Date().toISOString() : null })
    .eq("id", projetId)
    .select("id");
  if (error || !data?.length) return { ok: false, erreur: "Cela n’a pas pu être enregistré." };
  rafraichir(projetId);
  return { ok: true };
}

/** « J'ai relu le livre » (F11-AC88), posée quand il ne reste rien à « Relire », ou retirée. */
export async function declarerRelu(projetId: string, declaree: boolean): Promise<Fait> {
  const e = await exigerEnseignant();
  if (!estUuid(projetId)) return { ok: false, erreur: "Projet inconnu." };
  if (declaree) {
    const livre = await etatDuLivre(e, projetId);
    if (!livre) return { ok: false, erreur: "Projet inconnu." };
    const etat = etatRelire(livre.problemes, avertissementsAcceptes(livre.problemes, livre.acceptations, livre.changements), false);
    if (!etat.declarable) return { ok: false, erreur: "Il reste quelque chose à faire avant de le déclarer." };
  }
  const { data, error } = await e.supabase
    .from("projets")
    .update({ livre_relu_le: declaree ? new Date().toISOString() : null })
    .eq("id", projetId)
    .select("id");
  if (error || !data?.length) return { ok: false, erreur: "Cela n’a pas pu être enregistré." };
  rafraichir(projetId);
  return { ok: true };
}

/** La dernière étape du Livre ouverte : le Livre s'y rouvre (F11.6). */
export async function noterEtapeDuLivre(projetId: string, etape: string): Promise<void> {
  const e = await exigerEnseignant();
  if (!estUuid(projetId) || !estEtapeLivre(etape)) return;
  await e.supabase.from("projets").update({ derniere_etape_livre: etape }).eq("id", projetId);
}

/** La scène ouverte à côté de l'aperçu (F11.2) : ce que son éditeur demande, comme sa page. */
export async function ouvrirSceneDuLivre(projetId: string, sceneId: string): Promise<{ ok: true; plan: Plan; donnees: DonneesDeLaScene } | { ok: false; erreur: string }> {
  const e = await exigerEnseignant();
  if (!estUuid(projetId) || !estUuid(sceneId)) return { ok: false, erreur: "Scène introuvable." };
  const projet = await projetDe(e, projetId);
  if (!projet) return { ok: false, erreur: "Projet inconnu." };
  const plan = await planDe(e, projetId);
  if (!scenesDe(plan).some((s) => s.id === sceneId)) return { ok: false, erreur: "Cette scène n’est plus dans le plan." };
  const donnees = await donneesDeLaScene(e, projet, plan, sceneId);
  return donnees ? { ok: true, plan, donnees } : { ok: false, erreur: "Scène introuvable." };
}
