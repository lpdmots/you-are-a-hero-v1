"use server";

import { revalidatePath } from "next/cache";
import { avertissementsAcceptes, empreinteDe, estEtapeLivre, etatChemins, etatRelire } from "@/domaine/livre";
import { exigerEnseignant } from "@/serveur/adulte";
import { etatDuLivre } from "@/serveur/controles";
import { estUuid, planDe } from "@/serveur/recit";
import { projetDe } from "@/serveur/lectures";
import { donneesDeLaScene, type DonneesDeLaScene } from "@/serveur/scene";
import { scenesDe, type Plan } from "@/domaine/recit";
import { MARGE_MINIMALE, reglagesPropres } from "@/domaine/mise-en-page";
import { pagesPropres } from "@/domaine/pages";
import { contenuDuLivre } from "@/serveur/livre/contenu";
import { supprimerPdfDefinitif } from "@/serveur/livre/livre";
import type { Enseignant } from "@/serveur/adulte";
import { assurerOrdre, structure } from "@/serveur/copie";
import { deplacer, rangsActuels, type Deplacement } from "@/domaine/ordre";

/**
 * Les deux jugements de « Vérifier les chemins » (F11.6) : « C'est voulu » sur un
 * avertissement, et la déclaration de l'étape. Le serveur recalcule les contrôles avant
 * chacun : il ne se fie pas à ce que la page a montré.
 */

type Fait = { ok: true } | { ok: false; erreur: string; limite?: "images" };
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

/**
 * Les réglages de « Texte et pages » (F11.3, F11.4) : ce qui ne convient pas prend la valeur
 * de départ ; une marge sous 10 mm est refusée (F11-AC60), la page dit laquelle.
 */
export async function reglerMiseEnPage(projetId: string, brut: unknown): Promise<Fait> {
  const e = await exigerEnseignant();
  if (!estUuid(projetId)) return { ok: false, erreur: "Projet inconnu." };
  const contenu = await contenuDuLivre(e, projetId);
  if (!contenu) return { ok: false, erreur: "Projet inconnu." };
  const feuille = contenu.preparation?.feuille;
  const marges = (brut as { marges?: Record<string, unknown> } | null)?.marges ?? {};
  if (Object.values(marges).some((m) => typeof m === "number" && m < MARGE_MINIMALE)) return { ok: false, erreur: `Aucune marge sous ${MARGE_MINIMALE} mm, pour qu’un texte ne soit pas rogné.` };
  const reglages = reglagesPropres(brut, { aChoix: contenu.aChoix, des: feuille?.on ? feuille.des : 0 });
  const { data, error } = await e.supabase.from("projets").update({ mise_en_page: reglages }).eq("id", projetId).select("id");
  if (error || !data?.length) return { ok: false, erreur: "Cela n’a pas pu être enregistré." };
  rafraichir(projetId);
  return { ok: true };
}

/** Les pages de présentation (F11.4) : leurs formes et leurs textes. */
export async function reglerPagesDuLivre(projetId: string, brut: unknown): Promise<Fait> {
  const e = await exigerEnseignant();
  if (!estUuid(projetId)) return { ok: false, erreur: "Projet inconnu." };
  const contenu = await contenuDuLivre(e, projetId);
  if (!contenu) return { ok: false, erreur: "Projet inconnu." };
  const pages = pagesPropres(brut, contenu.pages);
  // Une image de page doit être une image du projet
  const images = [pages.titre.imageId, pages.titre.illustration, pages.auteurs.imageId, pages.commentLire.imageId, pages.feuille.imageId, pages.fin.imageId].filter((x): x is string => Boolean(x));
  if (images.some((id) => !contenu.images.has(id))) return { ok: false, erreur: "Cette image n’est pas dans le projet." };
  const { data, error } = await e.supabase.from("projets").update({ pages_du_livre: pages }).eq("id", projetId).select("id");
  // Une image de plus au-delà des images gratuites : rien n'est enregistré (F14-AC14)
  if (error?.code === "LIM02") return { ok: false, erreur: "L’image n’a pas été posée : le livre gratuit est complet.", limite: "images" };
  if (error || !data?.length) return { ok: false, erreur: "Cela n’a pas pu être enregistré." };
  rafraichir(projetId);
  return { ok: true };
}

// ——— « Mettre en page », volet « Aperçu » (étape 6, lot 4) ———

/**
 * Un passage déplacé à la main : la page de chaque passage se relèvera à la prochaine
 * composition, sans faire naître de doute, et « Réordonner à nouveau » saura qu'il y a des
 * déplacements à abandonner (F11-AC81). Un réglage du mélange ne compte pas comme déplacement.
 */
async function retouche(e: Enseignant, projetId: string, deplacement = true): Promise<void> {
  await e.supabase.from("projets").update(deplacement ? { ordre_pages: null, ordre_retouche_le: new Date().toISOString() } : { ordre_pages: null }).eq("id", projetId);
}

export type Place = { ok: true; avant: number; apres: number; annuler: Record<string, number> } | { ok: false; erreur: string };

/**
 * « Monter d'un rang », « Descendre d'un rang », « Placer après le n° … » (F11.3) : les rangs
 * gardés du groupe sont récrits ; les anciens reviennent à l'appelant, pour « Annuler ».
 */
export async function deplacerPassage(projetId: string, sceneId: string, d: Deplacement): Promise<Place> {
  const e = await exigerEnseignant();
  if (!estUuid(projetId) || !estUuid(sceneId)) return { ok: false, erreur: "Passage inconnu." };
  if (!d || (d.sorte !== "monter" && d.sorte !== "descendre" && !(d.sorte === "apres" && Number.isInteger(d.numero)))) return { ok: false, erreur: "Déplacement inconnu." };
  await assurerOrdre(e.supabase, projetId);
  const lu = await structure(e.supabase, projetId);
  if (!lu?.aChoix) return { ok: false, erreur: "Seul un récit à choix numérote ses passages." };
  const r = deplacer(lu.plan, sceneId, d);
  if (!r.ok) return { ok: false, erreur: r.refus };
  const annuler = rangsActuels(lu.plan, Object.keys(r.rangs));
  const { error } = await e.supabase.rpc("placer_passages", { p_projet: projetId, p_rangs: r.rangs });
  if (error) return { ok: false, erreur: "Le passage n’a pas pu être déplacé." };
  await retouche(e, projetId);
  rafraichir(projetId);
  return { ok: true, avant: r.avant, apres: r.apres, annuler };
}

/** « Annuler » : les rangs d'avant la dernière action reviennent (F11-AC45). */
export async function annulerPlacement(projetId: string, rangs: Record<string, number>): Promise<Fait> {
  const e = await exigerEnseignant();
  const propres = rangs && typeof rangs === "object" && Object.entries(rangs).every(([id, n]) => estUuid(id) && Number.isInteger(n));
  if (!estUuid(projetId) || !propres) return { ok: false, erreur: "Rien à annuler." };
  const { error } = await e.supabase.rpc("placer_passages", { p_projet: projetId, p_rangs: rangs });
  if (error) return { ok: false, erreur: "L’annulation n’a pas pu se faire." };
  await retouche(e, projetId);
  rafraichir(projetId);
  return { ok: true };
}

/** « Commencer sur une nouvelle page » (F11.3) : un ajustement gardé d'un export à l'autre (F11-AC10). */
export async function reglerNouvellePage(sceneId: string, oui: boolean): Promise<Fait> {
  const e = await exigerEnseignant();
  if (!estUuid(sceneId)) return { ok: false, erreur: "Passage inconnu." };
  const { data, error } = await e.supabase.from("scenes").update({ nouvelle_page: oui === true }).eq("id", sceneId).select("projet_id");
  if (error || !data?.length) return { ok: false, erreur: "Cela n’a pas pu être enregistré." };
  await retouche(e, data[0].projet_id as string);
  rafraichir(data[0].projet_id as string);
  return { ok: true };
}

/**
 * « Mélanger les parties 1 et 2 » (F11.5, F11-AC17) : la partie rejoint le groupe de mélange de
 * la précédente, ou le quitte. Les rangs gardés ne changent pas : ses passages se mêlent à
 * ceux du groupe selon eux, et les renvois suivent.
 */
export async function melangerAvecPrecedente(projetId: string, partieId: string, oui: boolean): Promise<Fait> {
  const e = await exigerEnseignant();
  if (!estUuid(projetId) || !estUuid(partieId)) return { ok: false, erreur: "Partie inconnue." };
  const plan = await planDe(e, projetId);
  if (plan.parties[0]?.id === partieId || !plan.parties.some((p) => p.id === partieId)) return { ok: false, erreur: "La première partie n’a pas de partie avant elle." };
  const { error } = await e.supabase.from("parties").update({ groupe_avec_precedente: oui === true }).eq("id", partieId).eq("projet_id", projetId);
  if (error) return { ok: false, erreur: "Cela n’a pas pu être enregistré." };
  await retouche(e, projetId, false);
  rafraichir(projetId);
  return { ok: true };
}

/**
 * « La mise en page me convient » (F11.6, F11-AC77), et « Reprendre », qui la retire.
 * La première déclaration ouvre « Imprimer et partager », qui ne se referme plus.
 */
export async function declarerMiseEnPage(projetId: string, convient: boolean): Promise<Fait> {
  const e = await exigerEnseignant();
  if (!estUuid(projetId)) return { ok: false, erreur: "Projet inconnu." };
  const { data: projet } = await e.supabase.from("projets").select("mise_en_page_ouverte_le, imprimer_ouvert_le").eq("id", projetId).maybeSingle();
  if (!projet) return { ok: false, erreur: "Projet inconnu." };
  if (convient && !projet.mise_en_page_ouverte_le) return { ok: false, erreur: "« Mettre en page » n’est pas encore ouverte." };
  const maintenant = new Date().toISOString();
  const { error } = await e.supabase
    .from("projets")
    .update(convient ? { mise_en_page_convient_le: maintenant, imprimer_ouvert_le: projet.imprimer_ouvert_le ?? maintenant } : { mise_en_page_convient_le: null })
    .eq("id", projetId);
  if (error) return { ok: false, erreur: "Cela n’a pas pu être enregistré." };
  rafraichir(projetId);
  return { ok: true };
}

/** Supprimer un PDF définitif conservé (F11-AC101) : la confirmation se fait sur place, à l'écran. */
export async function supprimerPdf(pdfId: string): Promise<Fait> {
  const e = await exigerEnseignant();
  const fait = await supprimerPdfDefinitif(e, pdfId);
  if (!fait.ok) return fait;
  rafraichir(fait.projetId);
  return { ok: true };
}

// ——— Ordre des passages (étape 6, lot 6) ———

/** « Annuler » un agencement : les rangs d'avant, et la décision d'avant. */
export async function annulerAgencement(projetId: string, rangs: Record<string, number>, decision: string | null): Promise<Fait> {
  const e = await exigerEnseignant();
  const propres = rangs && typeof rangs === "object" && Object.entries(rangs).every(([id, n]) => estUuid(id) && Number.isInteger(n));
  if (!estUuid(projetId) || !propres || (decision !== null && decision !== "reordonne" && decision !== "garde")) return { ok: false, erreur: "Rien à annuler." };
  const { error } = await e.supabase.rpc("placer_passages", { p_projet: projetId, p_rangs: rangs });
  if (error) return { ok: false, erreur: "L’annulation n’a pas pu se faire." };
  await e.supabase.from("projets").update({ ordre_decision: decision, ordre_pages: null }).eq("id", projetId);
  rafraichir(projetId);
  return { ok: true };
}

/** « Garder cet ordre » (F11-AC64, AC86) : la décision est prise, le doute levé, aucun numéro ne change. */
export async function garderOrdre(projetId: string): Promise<Fait> {
  const e = await exigerEnseignant();
  if (!estUuid(projetId)) return { ok: false, erreur: "Projet inconnu." };
  const { error } = await e.supabase.from("projets").update({ ordre_decision: "garde", ordre_pages: null }).eq("id", projetId);
  if (error) return { ok: false, erreur: "Cela n’a pas pu être enregistré." };
  rafraichir(projetId);
  return { ok: true };
}
