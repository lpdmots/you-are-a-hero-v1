/**
 * Les fichiers de Supabase Storage, pour la sauvegarde de la nuit et la restauration depuis S3
 * (étape 9, lot 8) : tout un seau descendu dans un dossier, ou un dossier remonté dans un seau.
 * Les chemins restent ceux de l'application (<compte>/<projet>/…), que la base retient.
 */
import { mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, extname, join, relative } from "node:path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export const clientDuStockage = (url: string, cleSecrete: string): SupabaseClient =>
  createClient(url, cleSecrete, { auth: { persistSession: false, autoRefreshToken: false } });

/** Tous les chemins d'un seau, sous-dossiers compris. */
export async function cheminsDuSeau(base: SupabaseClient, seau: string, dossier = ""): Promise<string[]> {
  const trouves: string[] = [];
  for (let depart = 0; ; depart += 1000) {
    const { data, error } = await base.storage.from(seau).list(dossier, { limit: 1000, offset: depart });
    if (error) throw new Error(`Stockage (${seau}) : ${error.message}`);
    if (!data?.length) break;
    for (const f of data) {
      const chemin = dossier ? `${dossier}/${f.name}` : f.name;
      // Un dossier n'a pas d'identifiant dans la liste du stockage
      if (f.id === null) trouves.push(...(await cheminsDuSeau(base, seau, chemin)));
      else trouves.push(chemin);
    }
    if (data.length < 1000) break;
  }
  return trouves;
}

/** Descend tout un seau dans un dossier ; rend le nombre de fichiers. Un fichier illisible fait échouer. */
export async function descendreLeSeau(base: SupabaseClient, seau: string, vers: string): Promise<number> {
  const chemins = await cheminsDuSeau(base, seau);
  for (const chemin of chemins) {
    const { data, error } = await base.storage.from(seau).download(chemin);
    if (error || !data) throw new Error(`Stockage : ${chemin} ne se lit pas (${error?.message ?? "vide"})`);
    const cible = join(vers, chemin);
    mkdirSync(dirname(cible), { recursive: true });
    writeFileSync(cible, Buffer.from(await data.arrayBuffer()));
  }
  return chemins.length;
}

const TYPES: Record<string, string> = { ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp", ".json": "application/json", ".pdf": "application/pdf" };

function fichiersDuDossier(dossier: string): string[] {
  const tous: string[] = [];
  for (const nom of readdirSync(dossier)) {
    const chemin = join(dossier, nom);
    if (statSync(chemin).isDirectory()) tous.push(...fichiersDuDossier(chemin));
    else tous.push(chemin);
  }
  return tous;
}

/** Remonte un dossier dans un seau, en remplaçant ce qui porte le même chemin ; rend le nombre de fichiers. */
export async function remonterLeDossier(base: SupabaseClient, seau: string, depuis: string): Promise<number> {
  const fichiers = fichiersDuDossier(depuis);
  for (const fichier of fichiers) {
    const chemin = relative(depuis, fichier).split("\\").join("/");
    const { error } = await base.storage.from(seau).upload(chemin, readFileSync(fichier), {
      upsert: true, contentType: TYPES[extname(fichier).toLowerCase()] ?? "application/octet-stream",
    });
    if (error) throw new Error(`Stockage : ${chemin} ne se dépose pas (${error.message})`);
  }
  return fichiers.length;
}
