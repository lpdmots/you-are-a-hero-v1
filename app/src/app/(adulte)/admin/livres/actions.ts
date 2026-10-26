"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { exigerLePorteur } from "@/serveur/administration";
import { estUuid } from "@/serveur/recit";
import { MOTIFS_DE_REFUS, publier, refuser, relireLaProposition } from "@/serveur/relecture-des-livres";

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
