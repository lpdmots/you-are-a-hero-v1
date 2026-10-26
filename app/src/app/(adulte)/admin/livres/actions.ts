"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { exigerLePorteur } from "@/serveur/administration";
import { estUuid } from "@/serveur/recit";
import { MOTIFS_DE_REFUS, publier, refuser, relireLaProposition } from "@/serveur/relecture-des-livres";
import { classerLeSignalement, retirerParLePorteur } from "@/serveur/signalements";

/**
 * Les gestes de la file « Bibliothèque » de l'administration (F15) : publier, refuser avec un
 * motif, relancer l'analyse. Chacun revérifie que c'est le porteur.
 */

export async function publierLeLivre(projetId: string): Promise<void> {
  await exigerLePorteur();
  if (!estUuid(projetId)) return;
  const r = await publier(projetId);
  revalidatePath("/", "layout");
  redirect(`/admin/livres?fait=${r.ok ? (r.courriel ? "publie" : "publie-sans-courriel") : "refus"}`);
}

export async function refuserLeLivre(projetId: string, formulaire: FormData): Promise<void> {
  await exigerLePorteur();
  if (!estUuid(projetId)) return;
  const phrase = String(formulaire.get("motif") ?? "");
  const precision = String(formulaire.get("precision") ?? "").trim();
  const prete = (MOTIFS_DE_REFUS as readonly string[]).includes(phrase) && phrase !== "Autre." ? phrase : "";
  const motif = [prete, precision].filter(Boolean).join(" ");
  if (!motif) redirect(`/admin/livres?fait=sans-motif#livre-${projetId}`);
  const r = await refuser(projetId, motif);
  revalidatePath("/admin", "layout");
  redirect(`/admin/livres?fait=${r.ok ? (r.courriel ? "refuse" : "refuse-sans-courriel") : "refus"}`);
}

export async function relancerLAnalyse(projetId: string): Promise<void> {
  await exigerLePorteur();
  if (!estUuid(projetId)) return;
  await relireLaProposition(projetId);
  revalidatePath("/admin", "layout");
  redirect(`/admin/livres#livre-${projetId}`);
}

/** Retirer un livre de la bibliothèque, signalé ou non, avec un motif envoyé à l'adulte (F15-AC10). */
export async function retirerLeLivre(projetId: string, formulaire: FormData): Promise<void> {
  await exigerLePorteur();
  if (!estUuid(projetId)) return;
  const motif = String(formulaire.get("motif") ?? "").trim();
  if (!motif) redirect(`/admin/livres?fait=sans-motif-retrait#publie-${projetId}`);
  const r = await retirerParLePorteur(projetId, motif);
  revalidatePath("/", "layout");
  redirect(`/admin/livres?fait=${r.ok ? (r.courriel ? "retire" : "retire-sans-courriel") : "refus"}`);
}

/** Classer un signalement sans suite : le livre reste publié. */
export async function classerSignalement(id: string): Promise<void> {
  await exigerLePorteur();
  const ok = await classerLeSignalement(id);
  revalidatePath("/admin", "layout");
  redirect(`/admin/livres?fait=${ok ? "classe" : "refus"}`);
}
