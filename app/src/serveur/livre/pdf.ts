import "server-only";
import type { Enseignant } from "../adulte";
import { projetDe } from "../lectures";
import { estUuid } from "../recit";
import { clientService } from "../supabase";
import { heureEnMots, jourCourt } from "@/domaine/dates";

/** Les PDF du livre déjà produits (F11.2) : les lister et les donner, sans rien composer. */

export const SEAU = "livres";

/** « état du 15 octobre, 10 h 02 » : la date que porte la mention « Version de travail ». */
export const etatEnMots = (etatDu: string): string => `état du ${jourCourt(etatDu)}, ${heureEnMots(etatDu)}`;

export type PdfDuLivre = { id: string; sorte: "travail" | "definitif"; etatDu: string; empreinte: string; taille: number; pages: number; creeLe: string };

export const pdfDe = (l: { id: string; sorte: "travail" | "definitif"; etat_du: string; empreinte: string; taille: number; pages: number; cree_le: string }): PdfDuLivre => ({
  id: l.id, sorte: l.sorte, etatDu: l.etat_du, empreinte: l.empreinte, taille: Number(l.taille), pages: l.pages, creeLe: l.cree_le,
});

/** Les PDF du projet, les plus récents en tête. */
export async function pdfDuProjet(e: Enseignant, projetId: string): Promise<PdfDuLivre[]> {
  if (!estUuid(projetId)) return [];
  const { data, error } = await e.supabase.from("pdf_du_livre").select("id, sorte, etat_du, empreinte, taille, pages, cree_le").eq("projet_id", projetId).order("cree_le", { ascending: false });
  if (error) throw new Error(`PDF illisibles : ${error.message}`);
  return (data ?? []).map(pdfDe);
}

/**
 * L'adresse signée d'un PDF, valable quelques minutes : la base dit d'abord que la personne
 * peut le lire. Le fichier ne passe pas par le serveur de l'application, dont une réponse ne
 * peut pas porter plus de 4,5 Mo chez Vercel.
 */
export async function adresseDuPdf(e: Enseignant, pdfId: string): Promise<string | null> {
  if (!estUuid(pdfId)) return null;
  const { data } = await e.supabase.from("pdf_du_livre").select("chemin, sorte, etat_du, projet_id").eq("id", pdfId).maybeSingle();
  if (!data) return null;
  const projet = await projetDe(e, data.projet_id as string);
  // Le stockage n'écrit le nom du fichier qu'en caractères simples : les accents tombent
  const titre = (projet?.titre ?? "Livre").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^A-Za-z0-9 '().,_-]+/g, " ").replace(/\s+/g, " ").trim() || "Livre";
  const nom = `${titre} - ${data.sorte === "travail" ? "version de travail" : "livre"}.pdf`;
  const signe = await clientService().storage.from(SEAU).createSignedUrl(data.chemin as string, 300, { download: nom });
  return signe.data?.signedUrl ?? null;
}
