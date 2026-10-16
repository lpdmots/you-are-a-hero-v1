import "server-only";
import { randomUUID } from "node:crypto";
import type { Enseignant } from "../adulte";
import { controlesDuLivre } from "../controles";
import { estUuid } from "../recit";
import { clientService } from "../supabase";
import { SEAU as SEAU_DES_IMAGES, TYPE_MIME } from "../images";
import type { LivreACompose } from "@/domaine/composition";
import type { Probleme } from "@/domaine/controles";
import { conditionsDuLivre, type RaisonDeRefus } from "@/domaine/livre";
import type { Composition } from "./composer";
import { contenuDuLivre, empreinteDeLecture, livreDuContenu, type ImageDuProjet } from "./contenu";
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
  /** Les points des contrôles, sur ce même état */
  problemes: Probleme[];
};

export async function instantaneDuLivre(e: Enseignant, projetId: string): Promise<Instantane | null> {
  if (!estUuid(projetId)) return null;
  const etatDu = new Date().toISOString();
  const [contenu, problemes] = await Promise.all([contenuDuLivre(e, projetId), controlesDuLivre(e, projetId)]);
  if (!contenu) return null;
  return { livre: livreDuContenu(contenu, problemes ?? []), etatDu, empreinte: contenu.empreinte, images: contenu.images, problemes: problemes ?? [] };
}

/**
 * Composer l'instantané : les images sont lues dans le stockage, au moment où Chromium les
 * demande. L'aperçu les prend allégées (900 points, la vignette de l'import) : leurs boîtes
 * ne changent pas, ses pages sont donc celles du PDF.
 */
export async function composerLInstantane(i: Instantane, travail: boolean, allege = false): Promise<Composition> {
  // Chromium n'est chargé qu'au moment de composer : les pages du projet, qui lisent le livre
  // sans le composer, n'emportent pas ses fichiers chez Vercel (seules les routes /livre/** les ont)
  const { composer } = await import("./composer");
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
  }).select("id, sorte, etat_du, empreinte, empreinte_lecture, taille, pages, cree_le").single();
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


/**
 * Produire le PDF définitif (F11.2) : la règle unique est vérifiée sur l'instantané même que
 * l'on compose, sans contournement (F09-AC10) ; le livre est composé sans marques, ses images
 * entières, puis déposé et inscrit. Tous les PDF définitifs sont gardés (15 octobre 2026).
 */
export async function produirePdfDefinitif(e: Enseignant, projetId: string): Promise<{ ok: true; pdf: PdfDuLivre } | { ok: false; erreur: string; raisons?: RaisonDeRefus[] }> {
  if (!estUuid(projetId)) return { ok: false, erreur: "Ce projet est introuvable." };
  const [instantane, projet] = await Promise.all([
    instantaneDuLivre(e, projetId),
    e.supabase.from("projets").select("recit, mise_en_page_convient_le, imprimer_ouvert_le").eq("id", projetId).maybeSingle(),
  ]);
  if (!instantane || !projet.data) return { ok: false, erreur: "Ce projet est introuvable." };
  const conditions = conditionsDuLivre(instantane.problemes, {
    aChoix: projet.data.recit === "choix", convient: Boolean(projet.data.mise_en_page_convient_le), doute: false, imprimerOuvert: Boolean(projet.data.imprimer_ouvert_le),
  });
  if (!conditions.pdf.possible) return { ok: false, erreur: "Le PDF définitif n’est pas encore possible.", raisons: conditions.pdf.raisons };
  const composition = await composerLInstantane(instantane, false);
  const id = randomUUID();
  const chemin = `${e.id}/${projetId}/${id}.pdf`;
  const service = clientService();
  const depot = await service.storage.from(SEAU).upload(chemin, composition.pdf, { contentType: "application/pdf", upsert: false });
  if (depot.error) throw new Error(`PDF non déposé : ${depot.error.message}`);
  const inscrit = await e.supabase.from("pdf_du_livre").insert({
    id, projet_id: projetId, enseignant_id: e.id, sorte: "definitif", etat_du: instantane.etatDu, empreinte: instantane.empreinte,
    // Ce que lit le lecteur, pour dire si la version partagée a le même texte (F12-AC22)
    empreinte_lecture: empreinteDeLecture(instantane.livre),
    chemin, taille: composition.pdf.length, pages: composition.rapport.pages + composition.rapport.horsPagination,
  }).select("id, sorte, etat_du, empreinte, empreinte_lecture, taille, pages, cree_le").single();
  if (inscrit.error) {
    await service.storage.from(SEAU).remove([chemin]);
    throw new Error(`PDF non inscrit : ${inscrit.error.message}`);
  }
  return { ok: true, pdf: pdfDe(inscrit.data) };
}

/** Supprimer un PDF définitif dont l'adulte n'a plus besoin, après confirmation à l'écran (F11-AC101). */
export async function supprimerPdfDefinitif(e: Enseignant, pdfId: string): Promise<{ ok: true; projetId: string } | { ok: false; erreur: string }> {
  if (!estUuid(pdfId)) return { ok: false, erreur: "PDF inconnu." };
  const { data } = await e.supabase.from("pdf_du_livre").select("chemin, projet_id, sorte").eq("id", pdfId).maybeSingle();
  if (!data || data.sorte !== "definitif") return { ok: false, erreur: "PDF inconnu." };
  const { error } = await e.supabase.from("pdf_du_livre").delete().eq("id", pdfId);
  if (error) return { ok: false, erreur: "Le PDF n’a pas pu être supprimé." };
  await clientService().storage.from(SEAU).remove([data.chemin as string]);
  return { ok: true, projetId: data.projet_id as string };
}
