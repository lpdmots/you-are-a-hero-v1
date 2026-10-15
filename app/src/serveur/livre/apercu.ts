import "server-only";
import type { Enseignant } from "../adulte";
import { clientService } from "../supabase";
import type { BlocPlace } from "./dans-la-page";
import { composerLInstantane, instantaneDuLivre } from "./livre";
import { cheminDeLApercu, etatEnMots, SEAU } from "./pdf";

/**
 * L'aperçu du livre (F11.2) : la composition du PDF de travail, avec les mêmes marques, ses
 * images allégées, calculée par le Chromium du serveur (ADR 0003). Le PDF et sa carte des blocs
 * sont gardés dans le seau privé sous l'empreinte du contenu : tant que le livre ne change
 * pas, l'aperçu ne se recompose pas ; seul le dernier est gardé.
 */

export type Apercu = {
  empreinte: string;
  /** « état du 15 octobre, 10 h 02 » */
  etat: string;
  /** L'adresse signée du PDF de l'aperçu, valable dix minutes */
  adresse: string;
  /** Pages du livre ; celles d'avant (récapitulatif) ne s'affichent pas */
  pages: number;
  horsPagination: number;
  carte: BlocPlace[];
  /** La page où commence chaque passage */
  pageDe: Record<string, number>;
  /** Le numéro de chaque passage (récit à choix) */
  numeros: Record<string, number | null>;
  passages: number;
  /** Ce qui dépasse des marges : les contrôles le lisent ici (F11-AC57) */
  debordements: { page: number; sceneId: string | null }[];
  /** La première page du récit, après les pages de présentation */
  premierePageDuRecit: number;
  /** La page de chaque page de présentation (« titre », « comment-lire »…), pour la petite double page des réglages */
  presentation: Record<string, number>;
  /** Les pages peu remplies et leur blanc, en millimètres sur la page (F11.3) */
  peuRemplies: { page: number; mm: number; x: number; y: number; l: number; h: number }[];
};

type Garde = Omit<Apercu, "adresse" | "empreinte">;

export async function apercuDuLivre(e: Enseignant, projetId: string): Promise<Apercu | null> {
  const instantane = await instantaneDuLivre(e, projetId);
  if (!instantane) return null;
  const seau = clientService().storage.from(SEAU);
  const dossier = `${e.id}/${projetId}`;
  const base = cheminDeLApercu(e.id, projetId, instantane.empreinte);
  let garde: Garde | null = null;
  const lu = await seau.download(`${base}.json`);
  if (!lu.error && lu.data) garde = JSON.parse(await lu.data.text()) as Garde;
  // Un aperçu gardé avant les lots 3 et 4 de l'étape 6 ne dit ni où sont les pages de présentation, ni les blancs
  if (garde && (!garde.presentation || !garde.peuRemplies)) garde = null;
  if (!garde) {
    const c = await composerLInstantane(instantane, true, true);
    garde = {
      etat: etatEnMots(instantane.etatDu), pages: c.rapport.pages, horsPagination: c.rapport.horsPagination, carte: c.rapport.carte, pageDe: c.rapport.pageDe,
      numeros: Object.fromEntries(instantane.livre.passages.map((p) => [p.sceneId, p.numero])), passages: instantane.livre.passages.length,
      debordements: c.rapport.debordements.map((d) => ({ page: d.page, sceneId: d.scene })),
      premierePageDuRecit: c.rapport.premierePageDuRecit,
      presentation: Object.fromEntries(c.rapport.presentation.map((x) => [x.nom, x.page])),
      peuRemplies: c.rapport.peuRemplies,
    };
    const depot = await seau.upload(`${base}.pdf`, c.pdf, { contentType: "application/pdf", upsert: true });
    if (depot.error) throw new Error(`Aperçu non déposé : ${depot.error.message}`);
    await seau.upload(`${base}.json`, JSON.stringify(garde), { contentType: "application/json", upsert: true });
    // Seul le dernier aperçu est gardé
    const { data: anciens } = await seau.list(dossier, { search: "apercu-" });
    const aRetirer = (anciens ?? []).map((o) => `${dossier}/${o.name}`).filter((n) => n.startsWith(`${dossier}/apercu-`) && !n.startsWith(base));
    if (aRetirer.length) await seau.remove(aRetirer);
  }
  const signe = await seau.createSignedUrl(`${base}.pdf`, 600);
  if (!signe.data) throw new Error("Aperçu illisible");
  return { ...garde, empreinte: instantane.empreinte, adresse: signe.data.signedUrl };
}
