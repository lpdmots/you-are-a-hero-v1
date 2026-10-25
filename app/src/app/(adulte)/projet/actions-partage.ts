"use server";

import { revalidatePath } from "next/cache";
import { exigerEnseignant } from "@/serveur/adulte";
import { couperCanal, mettreAJourLePartage, ouvrirCanal, reglerNoms, type Canal, type Refus } from "@/serveur/partage";
import { proposerALaBibliotheque } from "@/serveur/publication";

/**
 * Les gestes du volet « Partager » (F12.1, F12.3, F15) : le partage privé et la proposition à la
 * bibliothèque. Le serveur relit le livre et revérifie la règle à chacun : la page ne fait que
 * transmettre la demande, le rappel confirmé et l'attestation cochée.
 */

type Fait = { ok: true } | Refus;
const rafraichir = (projetId: string) => revalidatePath(`/projet/${projetId}`, "layout");

export async function ouvrirUnCanal(projetId: string, canal: Canal, rappel: boolean): Promise<Fait> {
  const r = await ouvrirCanal(await exigerEnseignant(), projetId, canal, rappel);
  if (r.ok) rafraichir(projetId);
  return r;
}

export async function couperUnCanal(projetId: string, canal: Canal): Promise<Fait> {
  const r = await couperCanal(await exigerEnseignant(), projetId, canal);
  if (r.ok) rafraichir(projetId);
  return r;
}

export async function mettreAJour(projetId: string, rappel: boolean): Promise<Fait> {
  const r = await mettreAJourLePartage(await exigerEnseignant(), projetId, rappel);
  if (r.ok) rafraichir(projetId);
  return r;
}

export async function proposer(projetId: string, presentation: string, attestation: boolean): Promise<Fait> {
  const r = await proposerALaBibliotheque(await exigerEnseignant(), projetId, { presentation, attestation });
  if (r.ok) rafraichir(projetId);
  return r;
}

export async function noms(projetId: string, reglage: unknown): Promise<Fait> {
  const r = await reglerNoms(await exigerEnseignant(), projetId, reglage);
  if (r.ok) rafraichir(projetId);
  return r;
}
