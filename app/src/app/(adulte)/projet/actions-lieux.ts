"use server";

import { revalidatePath } from "next/cache";
import type { Lieu } from "@/domaine/preparation";
import { exigerEnseignant } from "@/serveur/adulte";
import * as lieux from "@/serveur/lieux";
import type { FaitLieu, LieuSupprime } from "@/serveur/lieux";

/**
 * Les lieux de l'étape « Univers » (F02.1) : la Préparation, la projection et la fiche de
 * l'histoire les relisent ; chaque geste les rafraîchit.
 */

const rafraichir = (projetId: string) => {
  revalidatePath(`/projet/${projetId}`, "layout");
  revalidatePath(`/atelier/${projetId}`, "layout");
};

export async function ajouterLieu(projetId: string, nom: string, phrase: string): Promise<FaitLieu<{ lieu: Lieu }>> {
  const fait = await lieux.ajouterLieu(await exigerEnseignant(), projetId, nom, phrase);
  if (fait.ok) rafraichir(projetId);
  return fait;
}

export async function reglerLieu(lieuId: string, valeurs: { nom?: string; phrase?: string }): Promise<FaitLieu> {
  const fait = await lieux.reglerLieu(await exigerEnseignant(), lieuId, valeurs);
  if (fait.ok) rafraichir(fait.projetId);
  return fait.ok ? { ok: true } : fait;
}

export async function supprimerLieu(lieuId: string): Promise<FaitLieu<{ lieu: LieuSupprime }>> {
  const fait = await lieux.supprimerLieu(await exigerEnseignant(), lieuId);
  if (!fait.ok) return fait;
  rafraichir(fait.projetId);
  return { ok: true, lieu: fait.lieu };
}

export async function remettreLieu(projetId: string, lieu: LieuSupprime): Promise<FaitLieu> {
  const fait = await lieux.remettreLieu(await exigerEnseignant(), projetId, lieu);
  if (fait.ok) rafraichir(projetId);
  return fait;
}

export async function ordonnerLieux(projetId: string, ids: string[]): Promise<FaitLieu> {
  const fait = await lieux.ordonnerLieux(await exigerEnseignant(), projetId, ids);
  if (fait.ok) rafraichir(projetId);
  return fait;
}
