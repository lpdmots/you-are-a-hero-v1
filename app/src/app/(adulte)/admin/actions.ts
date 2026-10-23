"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { choisirPourLAccueil, echangerLesLivres, retirerLaCouverture } from "@/serveur/accueil";
import { accepterLImage, changerLesMots, refuserLImage, retirerDeLaBibliotheque } from "@/serveur/bibliotheque";
import { estUuid } from "@/serveur/recit";
import { exigerLePorteur, offrirDesEtoiles, offrirUnPass, partageDuLien, reglerLePaiement, retirerLePartage } from "@/serveur/administration";

/**
 * Les gestes de l'administration (F14-AC22 à AC25). Chacun revérifie que c'est le porteur : un
 * autre compte reçoit la réponse d'une page qui n'existe pas, comme pour les pages.
 */

export async function basculerLePaiement(ouvert: boolean): Promise<void> {
  await exigerLePorteur();
  await reglerLePaiement(ouvert);
  revalidatePath("/", "layout");
}

export async function offrirEtoiles(compteId: string, formulaire: FormData): Promise<void> {
  await exigerLePorteur();
  if (!estUuid(compteId)) return;
  const nombre = Number(formulaire.get("nombre"));
  const ok = await offrirDesEtoiles(compteId, nombre, String(formulaire.get("note") ?? ""));
  revalidatePath(`/admin/compte/${compteId}`);
  redirect(`/admin/compte/${compteId}?fait=${ok ? "etoiles" : "refus"}`);
}

export async function offrirPass(compteId: string, formulaire: FormData): Promise<void> {
  await exigerLePorteur();
  const projet = String(formulaire.get("projet") ?? "");
  if (!estUuid(compteId) || !estUuid(projet)) return;
  const ok = await offrirUnPass(projet);
  revalidatePath(`/admin/compte/${compteId}`);
  redirect(`/admin/compte/${compteId}?fait=${ok ? "pass" : "refus"}`);
}

export async function chercherLePartage(formulaire: FormData): Promise<void> {
  await exigerLePorteur();
  const lien = String(formulaire.get("lien") ?? "").trim().slice(0, 300);
  const trouve = await partageDuLien(lien);
  redirect(trouve ? `/admin?partage=${trouve.code}` : `/admin?partage=introuvable`);
}

export async function retirerPartage(projetId: string, retour: string): Promise<void> {
  await exigerLePorteur();
  if (!estUuid(projetId)) return;
  const r = await retirerLePartage(projetId);
  revalidatePath("/admin", "layout");
  const ici = retour.startsWith("/admin") ? retour.split("?")[0] : "/admin";
  redirect(`${ici}?fait=${r.ok ? (r.courriel ? "retire" : "retire-sans-courriel") : "refus"}`);
}

// ——— La bibliothèque d'images (F10.1, 21 octobre 2026) ———

export async function accepterPourLaBibliotheque(imageId: string): Promise<void> {
  const porteur = await exigerLePorteur();
  const r = await accepterLImage(porteur, imageId);
  revalidatePath("/admin", "layout");
  redirect(`/admin/bibliotheque?fait=${r.ok ? (r.sansMots ? "acceptee-sans-mots" : "acceptee") : "refus"}`);
}

export async function refuserPourLaBibliotheque(imageId: string): Promise<void> {
  await exigerLePorteur();
  const ok = await refuserLImage(imageId);
  revalidatePath("/admin", "layout");
  redirect(`/admin/bibliotheque?fait=${ok ? "refusee" : "refus"}`);
}

export async function retirerDeLaBibliothequeAdmin(id: string): Promise<void> {
  await exigerLePorteur();
  const ok = await retirerDeLaBibliotheque(id);
  revalidatePath("/admin", "layout");
  redirect(`/admin/bibliotheque?fait=${ok ? "retiree" : "refus"}`);
}

export async function changerLesMotsAdmin(id: string, formulaire: FormData): Promise<void> {
  await exigerLePorteur();
  const ok = await changerLesMots(id, String(formulaire.get("mots") ?? ""), String(formulaire.get("motsEn") ?? ""));
  revalidatePath("/admin/bibliotheque");
  redirect(`/admin/bibliotheque?fait=${ok ? "mots" : "refus"}`);
}

// ——— Les livres de l'accueil (F14-AC40, 23 octobre 2026) ———

export async function choisirPourLAccueilAdmin(code: string, oui: boolean): Promise<void> {
  const porteur = await exigerLePorteur();
  const r = await choisirPourLAccueil(porteur, code, oui);
  revalidatePath("/", "layout");
  redirect(`/admin?fait=${r === "fait" ? (oui ? "accueil-pose" : "accueil-retire") : r === "plein" ? "accueil-plein" : "refus"}#adm-accueil`);
}

export async function echangerLesLivresAdmin(): Promise<void> {
  await exigerLePorteur();
  const ok = await echangerLesLivres();
  revalidatePath("/", "layout");
  redirect(`/admin?fait=${ok ? "accueil-ordre" : "refus"}#adm-accueil`);
}

export async function retirerLaCouvertureAdmin(code: string): Promise<void> {
  await exigerLePorteur();
  const ok = await retirerLaCouverture(code);
  revalidatePath("/", "layout");
  redirect(`/admin?fait=${ok ? "couverture-retiree" : "refus"}#adm-accueil`);
}
