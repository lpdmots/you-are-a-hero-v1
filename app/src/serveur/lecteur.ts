import "server-only";
import { headers } from "next/headers";
import { env } from "./env";
import { SEAU, TYPE_MIME, type FormatImage } from "./images";
import { empreinte } from "./jetons";
import { estUuid } from "./recit";
import { clientService } from "./supabase";
import { versionAvecObjets } from "@/domaine/inventaire";
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
  /** Un lien d'avant la bibliothèque, dont le livre y est publié : il y mène (F15, « Les livres de l'accueil ») */
  | { sorte: "bibliotheque"; adresse: string }
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
      ? await service.from("partages").select("version, projet_id").eq("code", code).eq("par_lien", true).not("version", "is", null).maybeSingle()
      : { data: null, error: null };
    if (lu.error) return { sorte: "indisponible" };
    if (lu.data?.version) return { sorte: "livre", version: versionAvecObjets(lu.data.version as VersionPartagee, await nomsDesObjets(lu.data.projet_id as string)) };
    // Un lien coupé dont le livre est dans la bibliothèque : le lien donné aux familles y mène encore
    if (code) {
      const { data: ancien } = await service.from("partages").select("projet_id").eq("code", code).maybeSingle();
      const { data: publie } = ancien
        ? await service.from("publications").select("adresse").eq("projet_id", ancien.projet_id).not("version", "is", null).maybeSingle()
        : { data: null };
      if (publie?.adresse) return { sorte: "bibliotheque", adresse: publie.adresse as string };
    }
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

/**
 * Les noms des objets de l'histoire, pour les actions de jeu qui en nomment (inventaire.ts) :
 * lus avec la clé de service, seulement après que l'accès au livre a été vérifié. Le lecteur
 * n'en reçoit que ceux que ses actions nomment déjà (F04-AC20). Une liste illisible ne prive
 * pas de la lecture : les actions ne proposent alors rien.
 */
export async function nomsDesObjets(projetId: string): Promise<string[]> {
  const { data, error } = await clientService().from("objets").select("nom").eq("projet_id", projetId);
  return error ? [] : ((data ?? []) as { nom: string }[]).map((o) => o.nom);
}
