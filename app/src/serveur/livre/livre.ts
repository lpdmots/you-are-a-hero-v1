import "server-only";
import { randomUUID } from "node:crypto";
import type { Enseignant } from "../adulte";
import { controlesDuLivre } from "../controles";
import { estUuid } from "../recit";
import { clientService } from "../supabase";
import { SEAU as SEAU_DES_IMAGES, TYPE_MIME } from "../images";
import type { LivreACompose } from "@/domaine/composition";
import { composer, type Composition } from "./composer";
import { contenuDuLivre, livreDuContenu, type ImageDuProjet } from "./contenu";
import { etatEnMots, pdfDe, SEAU, type PdfDuLivre } from "./pdf";

/**
 * Le livre d'un projet tel que la base le donne à l'instant : un instantané (F11.2). Tout est
 * lu après avoir noté l'heure ; une modification arrivée pendant le calcul n'y figure pas et
 * se voit à l'empreinte, qui diffère alors de celle du PDF.
 */

export type Instantane = {
  livre: LivreACompose;
  /** L'heure de l'état composé */
  etatDu: string;
  /** L'empreinte du contenu, sans les marques du PDF de travail */
  empreinte: string;
  /** Pour lire une image dans le stockage : seulement celles du projet */
  images: Map<string, ImageDuProjet>;
};

export async function instantaneDuLivre(e: Enseignant, projetId: string): Promise<Instantane | null> {
  if (!estUuid(projetId)) return null;
  const etatDu = new Date().toISOString();
  const [contenu, problemes] = await Promise.all([contenuDuLivre(e, projetId), controlesDuLivre(e, projetId)]);
  if (!contenu) return null;
  return { livre: livreDuContenu(contenu, problemes ?? []), etatDu, empreinte: contenu.empreinte, images: contenu.images };
}

/**
 * Composer l'instantané : les images sont lues dans le stockage, au moment où Chromium les
 * demande. L'aperçu les prend allégées (900 points, la vignette de l'import) : leurs boîtes
 * ne changent pas, ses pages sont donc celles du PDF.
 */
export function composerLInstantane(i: Instantane, travail: boolean, allege = false): Promise<Composition> {
  const service = clientService();
  return composer(i.livre, {
    travail, etatDu: etatEnMots(i.etatDu),
    lireImage: async (id) => {
      const image = i.images.get(id);
      if (!image) return null;
      const { data, error } = await service.storage.from(SEAU_DES_IMAGES).download(allege ? image.vignette : image.chemin);
      if (error || !data) return null;
      return { octets: Buffer.from(await data.arrayBuffer()), type: TYPE_MIME[image.format] };
    },
  });
}

/**
 * Produire un PDF de travail (F11.2) : composé avec ses marques, déposé dans le seau privé,
 * inscrit dans la base ; le précédent PDF de travail est retiré, seul le dernier étant gardé
 * (15 octobre 2026).
 */
export async function produirePdfDeTravail(e: Enseignant, projetId: string): Promise<{ ok: true; pdf: PdfDuLivre } | { ok: false; erreur: string }> {
  const instantane = await instantaneDuLivre(e, projetId);
  if (!instantane) return { ok: false, erreur: "Ce projet est introuvable." };
  const composition = await composerLInstantane(instantane, true);
  const id = randomUUID();
  const chemin = `${e.id}/${projetId}/${id}.pdf`;
  const service = clientService();
  const depot = await service.storage.from(SEAU).upload(chemin, composition.pdf, { contentType: "application/pdf", upsert: false });
  if (depot.error) throw new Error(`PDF non déposé : ${depot.error.message}`);
  const anciens = await e.supabase.from("pdf_du_livre").select("id, chemin").eq("projet_id", projetId).eq("sorte", "travail");
  const inscrit = await e.supabase.from("pdf_du_livre").insert({
    id, projet_id: projetId, enseignant_id: e.id, sorte: "travail", etat_du: instantane.etatDu, empreinte: instantane.empreinte,
    chemin, taille: composition.pdf.length, pages: composition.rapport.pages + composition.rapport.horsPagination,
  }).select("id, sorte, etat_du, empreinte, taille, pages, cree_le").single();
  if (inscrit.error) {
    await service.storage.from(SEAU).remove([chemin]);
    throw new Error(`PDF non inscrit : ${inscrit.error.message}`);
  }
  const vieux = (anciens.data ?? []) as { id: string; chemin: string }[];
  if (vieux.length) {
    await e.supabase.from("pdf_du_livre").delete().in("id", vieux.map((v) => v.id));
    await service.storage.from(SEAU).remove(vieux.map((v) => v.chemin));
  }
  return { ok: true, pdf: pdfDe(inscrit.data) };
}

