import "server-only";
import { headers } from "next/headers";
import { env } from "./env";
import { SEAU, TYPE_MIME, type FormatImage } from "./images";
import { empreinte } from "./jetons";
import { estUuid } from "./recit";
import { clientService } from "./supabase";
import { codeSaisi, type VersionPartagee } from "@/domaine/partage";

/**
 * Le lecteur en ligne par le lien, sans compte (F12.1). Personne n'y est connecté : le serveur
 * lit la version partagée avec la clé de service, par son seul code, et ne rend rien d'autre
 * — ni le projet, ni la classe, ni l'atelier. Un code inconnu, un lien coupé ou changé mènent
 * à la même page neutre (F12-AC10, AC11).
 *
 * Les codes faux se comptent comme les essais d'entrée d'une classe (F06-AC74, AC83) : dix de
 * suite depuis une adresse réseau, ou cent en cinq minutes, imposent cinq minutes pendant
 * lesquelles aucun lien ne s'ouvre depuis elle. Seuls les codes faux comptent : une famille qui
 * relit le livre n'use rien.
 */

export type LuParLeLien =
  | { sorte: "livre"; version: VersionPartagee }
  /** Lien coupé, changé, inconnu, ou trop d'essais faux : la page neutre */
  | { sorte: "neutre" }
  /** La base ne répond pas (offre gratuite en sommeil, panne) : « momentanément indisponible » */
  | { sorte: "indisponible" };

async function clesDuReseau(): Promise<{ navigateur: string; reseau: string }> {
  const entetes = await headers();
  const adresse = (entetes.get("x-forwarded-for") ?? "").split(",")[0].trim() || entetes.get("x-real-ip") || "inconnue";
  return {
    // Une famille n'a pas de cookie : la règle des dix essais de suite porte sur l'adresse
    navigateur: `l:${empreinte(`${adresse}|lien|${env.cleAcces}`)}`,
    reseau: `r:${empreinte(`${adresse}|${env.cleAcces}`)}`,
  };
}

export async function versionParLeLien(saisi: string): Promise<LuParLeLien> {
  const code = codeSaisi(decodeURIComponent(saisi));
  const service = clientService();
  try {
    const cles = await clesDuReseau();
    const bloque = await service.rpc("entree_bloquee_jusqua", { p_navigateur: cles.navigateur, p_reseau: cles.reseau });
    if (bloque.error) return { sorte: "indisponible" };
    if (bloque.data) return { sorte: "neutre" };
    const lu = code
      ? await service.from("partages").select("version").eq("code", code).eq("par_lien", true).not("version", "is", null).maybeSingle()
      : { data: null, error: null };
    if (lu.error) return { sorte: "indisponible" };
    if (lu.data?.version) return { sorte: "livre", version: lu.data.version as VersionPartagee };
    await service.rpc("prendre_essai_entree", { p_navigateur: cles.navigateur, p_reseau: cles.reseau });
    return { sorte: "neutre" };
  } catch {
    return { sorte: "indisponible" };
  }
}

/**
 * Une image de la version partagée, par le lien : seulement si la version la montre. La
 * vignette (900 points) sert les petits écrans, l'image entière (2 600) les grands.
 */
export async function imageParLeLien(saisi: string, imageId: string, vignette: boolean): Promise<{ octets: Blob; type: string } | null> {
  const code = codeSaisi(decodeURIComponent(saisi));
  if (!code || !estUuid(imageId)) return null;
  const service = clientService();
  // Seules les images de la version, sans lire la version entière
  const { data: partage } = await service.from("partages").select("projet_id, images:version->images").eq("code", code).eq("par_lien", true).maybeSingle();
  const images = (partage?.images ?? null) as Record<string, unknown> | null;
  if (!partage || !images || !(imageId in images)) return null;
  const { data: image } = await service.from("images").select("chemin, chemin_vignette, format").eq("id", imageId).eq("projet_id", partage.projet_id).maybeSingle();
  if (!image) return null;
  const { data, error } = await service.storage.from(SEAU).download(vignette ? image.chemin_vignette : image.chemin);
  if (error || !data) return null;
  return { octets: data, type: TYPE_MIME[image.format as FormatImage] ?? "image/jpeg" };
}
