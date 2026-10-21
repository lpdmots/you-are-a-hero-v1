import "server-only";
import { randomUUID } from "node:crypto";
import { demanderUneAide } from "./ia/demander";
import { motsCles } from "./ia/aides/mots-cles";
import { cheminImage, cheminVignette, SEAU, TYPE_MIME, type FormatImage } from "./images";
import type { Enseignant } from "./adulte";
import { projetDe } from "./lectures";
import { estUuid } from "./recit";
import { clientService } from "./supabase";

/**
 * La bibliothèque d'images (F10.1, décidée par le porteur le 21 octobre 2026) : les images créées
 * par l'IA sans personnage, relues par le porteur, rejoignent les visuels proposés à tous. Une image
 * acceptée est copiée hors des dossiers de son compte ; ses mots-clés sont lus dans l'image. Choisie
 * dans un projet, elle y est copiée comme une image importée. Voir la migration
 * `bibliotheque_d_images`.
 */

export type ImageARelire = { image: string; cible: string; largeur: number; hauteur: number };
export type ImageDeLaBibliotheque = { id: string; mots: string[]; motsEn: string[]; largeur: number; hauteur: number };

const cheminDeLaBibliotheque = (id: string) => `bibliotheque/${id}.jpg`;
const vignetteDeLaBibliotheque = (id: string) => `bibliotheque/${id}-v.jpg`;

/** Des mots-clés tapés à la main : « forêt, rivière » ; courts, en minuscules, sans doublon. */
export function lireMots(texte: string): string[] {
  const mots = texte
    .split(/[,;\n]/)
    .map((m) => m.trim().replace(/\s+/g, " ").toLocaleLowerCase("fr").slice(0, 40))
    .filter(Boolean);
  return [...new Set(mots)].slice(0, 20);
}

/** Sans accents ni majuscules, pour chercher « foret » comme « Forêt ». */
const simple = (t: string) => t.normalize("NFD").replace(/\p{M}/gu, "").toLocaleLowerCase("fr").trim();

/** Les images à relire par le porteur : gardées, sans personnage, d'un adulte qui ne refuse pas. */
export async function imagesARelire(limite = 60): Promise<ImageARelire[]> {
  const { data, error } = await clientService().rpc("images_pour_la_bibliotheque", { p_limite: limite });
  if (error) throw new Error(`Bibliothèque illisible : ${error.message}`);
  return ((data ?? []) as { image: string; cible: string; largeur: number; hauteur: number }[]).map((l) => ({
    image: l.image, cible: l.cible, largeur: l.largeur, hauteur: l.hauteur,
  }));
}

/** Les images de la bibliothèque, les plus récentes d'abord, pour l'administration. */
export async function imagesAcceptees(): Promise<ImageDeLaBibliotheque[]> {
  const { data, error } = await clientService()
    .from("bibliotheque")
    .select("id, mots, mots_en, largeur, hauteur")
    .eq("etat", "acceptee")
    .order("decide_le", { ascending: false })
    .limit(500);
  if (error) throw new Error(`Bibliothèque illisible : ${error.message}`);
  return (data ?? []).map((l) => ({ id: l.id as string, mots: (l.mots as string[]) ?? [], motsEn: (l.mots_en as string[]) ?? [], largeur: l.largeur as number, hauteur: l.hauteur as number }));
}

/** Une image à relire, telle que la base la garde : seulement si elle l'est encore. */
async function candidate(imageId: string): Promise<{ chemin: string; chemin_vignette: string; format: FormatImage; largeur: number; hauteur: number } | null> {
  if (!estUuid(imageId)) return null;
  const relire = await imagesARelire(200);
  if (!relire.some((r) => r.image === imageId)) return null;
  const { data } = await clientService().from("images").select("chemin, chemin_vignette, format, largeur, hauteur").eq("id", imageId).maybeSingle();
  return (data as { chemin: string; chemin_vignette: string; format: FormatImage; largeur: number; hauteur: number } | null) ?? null;
}

/**
 * « Accepter » (F10-AC53) : l'image et sa vignette sont copiées dans la bibliothèque, puis l'IA lit
 * la vignette pour en tirer les mots-clés. Sans réponse de l'IA, l'image entre sans mots-clés, que le
 * porteur écrit lui-même.
 */
export async function accepterLImage(porteur: Enseignant, imageId: string): Promise<{ ok: true; sansMots: boolean } | { ok: false; erreur: string }> {
  const source = await candidate(imageId);
  if (!source) return { ok: false, erreur: "Cette image n’est plus à relire." };
  const stockage = clientService().storage.from(SEAU);
  const [grande, petite] = await Promise.all([stockage.download(source.chemin), stockage.download(source.chemin_vignette)]);
  if (!grande.data || !petite.data) return { ok: false, erreur: "Le fichier de cette image est introuvable." };
  const octetsVignette = new Uint8Array(await petite.data.arrayBuffer());

  const id = randomUUID();
  const chemins = [cheminDeLaBibliotheque(id), vignetteDeLaBibliotheque(id)];
  const options = { contentType: TYPE_MIME[source.format] ?? "image/jpeg", upsert: false };
  const deposes = await Promise.all([stockage.upload(chemins[0], grande.data, options), stockage.upload(chemins[1], octetsVignette, options)]);
  if (deposes.some((d) => d.error)) {
    await stockage.remove(chemins);
    return { ok: false, erreur: "L’image n’a pas pu être copiée. Réessayez." };
  }

  const lus = await demanderUneAide(porteur, motsCles, { image: { octets: octetsVignette, format: source.format } });
  const { error } = await clientService().from("bibliotheque").insert({
    id, image_source: imageId, etat: "acceptee", chemin: chemins[0], chemin_vignette: chemins[1], format: source.format,
    largeur: source.largeur, hauteur: source.hauteur, mots: lus.ok ? lus.valeur.mots : [], mots_en: lus.ok ? lus.valeur.motsEn : [],
  });
  if (error) {
    await stockage.remove(chemins);
    return { ok: false, erreur: "L’image n’a pas pu entrer dans la bibliothèque. Réessayez." };
  }
  return { ok: true, sansMots: !lus.ok };
}

/** « Refuser » (F10-AC53) : l'image n'est plus proposée ; rien n'est copié. */
export async function refuserLImage(imageId: string): Promise<boolean> {
  if (!(await candidate(imageId))) return false;
  const { error } = await clientService().from("bibliotheque").insert({ image_source: imageId, etat: "refusee" });
  return !error;
}

/** « Retirer de la bibliothèque » : ses fichiers s'effacent ; les projets qui l'ont prise gardent leur copie. */
export async function retirerDeLaBibliotheque(id: string): Promise<boolean> {
  if (!estUuid(id)) return false;
  const base = clientService();
  const { data } = await base.from("bibliotheque").select("chemin, chemin_vignette").eq("id", id).eq("etat", "acceptee").maybeSingle();
  if (!data) return false;
  await base.storage.from(SEAU).remove([data.chemin as string, data.chemin_vignette as string]);
  const { error } = await base
    .from("bibliotheque")
    .update({ etat: "refusee", chemin: null, chemin_vignette: null, format: null, largeur: null, hauteur: null, mots: [], mots_en: [], decide_le: new Date().toISOString() })
    .eq("id", id);
  return !error;
}

/** Les mots-clés retouchés par le porteur, en français et en anglais. */
export async function changerLesMots(id: string, mots: string, motsEn: string): Promise<boolean> {
  if (!estUuid(id)) return false;
  const { error } = await clientService().from("bibliotheque").update({ mots: lireMots(mots), mots_en: lireMots(motsEn) }).eq("id", id).eq("etat", "acceptee");
  return !error;
}

/**
 * Les images de la bibliothèque pour « Choisir une image » (F10-AC54) : toutes, les plus récentes
 * d'abord, ou celles dont un mot-clé, français ou anglais, contient le terme, sans tenir compte des
 * accents ni des majuscules.
 */
export async function chercherDansLaBibliotheque(e: Enseignant, terme: string): Promise<ImageDeLaBibliotheque[]> {
  const { data, error } = await e.supabase
    .from("bibliotheque")
    .select("id, mots, mots_en, largeur, hauteur")
    .eq("etat", "acceptee")
    .order("decide_le", { ascending: false })
    .limit(500);
  if (error) return [];
  const cherche = simple(terme);
  return (data ?? [])
    .map((l) => ({ id: l.id as string, mots: (l.mots as string[]) ?? [], motsEn: (l.mots_en as string[]) ?? [], largeur: l.largeur as number, hauteur: l.hauteur as number }))
    .filter((l) => !cherche || [...l.mots, ...l.motsEn].some((m) => simple(m).includes(cherche)))
    .slice(0, 60);
}

/** Le fichier d'une image de la bibliothèque, pour tout adulte connecté. */
export async function fichierDeLaBibliotheque(e: Enseignant, id: string, vignette: boolean): Promise<{ octets: Blob; format: FormatImage } | null> {
  if (!estUuid(id)) return null;
  const { data } = await e.supabase.from("bibliotheque").select("chemin, chemin_vignette, format").eq("id", id).eq("etat", "acceptee").maybeSingle();
  if (!data) return null;
  const { data: fichier } = await clientService().storage.from(SEAU).download((vignette ? data.chemin_vignette : data.chemin) as string);
  return fichier ? { octets: fichier, format: data.format as FormatImage } : null;
}

/**
 * Prendre une image de la bibliothèque pour un projet (F10-AC54) : elle y est copiée comme une
 * image importée, parmi les images du projet, et rend son identité.
 */
export async function prendreDeLaBibliotheque(e: Enseignant, projetId: string, id: string): Promise<string | null> {
  if (!estUuid(id) || !(await projetDe(e, projetId))) return null;
  const { data: ligne } = await e.supabase.from("bibliotheque").select("chemin, chemin_vignette, format, largeur, hauteur").eq("id", id).eq("etat", "acceptee").maybeSingle();
  if (!ligne) return null;
  const stockage = clientService().storage.from(SEAU);
  const [grande, petite] = await Promise.all([stockage.download(ligne.chemin as string), stockage.download(ligne.chemin_vignette as string)]);
  if (!grande.data || !petite.data) return null;
  const imageId = randomUUID();
  const chemins = [cheminImage(e.id, projetId, imageId), cheminVignette(e.id, projetId, imageId)];
  const options = { contentType: TYPE_MIME[ligne.format as FormatImage] ?? "image/jpeg", upsert: false };
  const deposes = await Promise.all([stockage.upload(chemins[0], grande.data, options), stockage.upload(chemins[1], petite.data, options)]);
  if (deposes.some((d) => d.error)) {
    await stockage.remove(chemins);
    return null;
  }
  const { error } = await e.supabase.from("images").insert({
    id: imageId, projet_id: projetId, enseignant_id: e.id, chemin: chemins[0], chemin_vignette: chemins[1],
    largeur: ligne.largeur, hauteur: ligne.hauteur, format: ligne.format,
  });
  if (error) {
    await stockage.remove(chemins);
    return null;
  }
  return imageId;
}

/** Le fichier d'une image à relire, pour le porteur seul : il la voit avant de décider. */
export async function fichierARelire(imageId: string, vignette: boolean): Promise<{ octets: Blob; format: FormatImage } | null> {
  if (!estUuid(imageId)) return null;
  const { data } = await clientService().from("images").select("chemin, chemin_vignette, format").eq("id", imageId).maybeSingle();
  if (!data) return null;
  const { data: fichier } = await clientService().storage.from(SEAU).download((vignette ? data.chemin_vignette : data.chemin) as string);
  return fichier ? { octets: fichier, format: data.format as FormatImage } : null;
}
