"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
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
