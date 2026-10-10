import { createClient } from "@supabase/supabase-js";
import { Client } from "pg";

/**
 * Suppression des comptes d'essai, commune aux essais contre la base, aux parcours et à
 * « npm run base:purger-essais ».
 *
 * La base refuse de supprimer une classe qui a des élèves ou un projet (F01.1) : supprimer
 * le compte seul échoue donc dès qu'il en a une. On retire d'abord ce que le compte possède,
 * puis le compte. Tout échec est levé : un essai qui laisse des restes échoue.
 */

/** Les adresses que créent les essais : « parcours-<uuid>@exemple.test », « essai-<uuid>@exemple.test ». */
const ADRESSE_D_ESSAI = "^(parcours|essai)-[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}@exemple\\.test$";

const locale = (adresse: string): boolean => {
  try {
    return ["127.0.0.1", "localhost"].includes(new URL(adresse).hostname);
  } catch {
    return false;
  }
};

async function avecLaBase<T>(travail: (base: Client) => Promise<T>): Promise<T> {
  const adresse = process.env.BASE_LOCALE_URL ?? "";
  if (!locale(adresse) || !locale(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "")) {
    throw new Error("Les comptes d'essai ne se suppriment que dans la base locale.");
  }
  const base = new Client({ connectionString: adresse });
  await base.connect();
  try {
    return await travail(base);
  } finally {
    await base.end();
  }
}

/** Supprime des comptes d'essai avec leurs projets, leurs élèves et leurs classes. */
export async function supprimerComptesDEssai(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const comptes = await avecLaBase(async (base) => {
    const { rows } = await base.query<{ id: string; essai: boolean }>("select id, email ~ $2 as essai from auth.users where id = any($1::uuid[])", [ids, ADRESSE_D_ESSAI]);
    // Jamais le compte de « npm run compte:local » ni un compte créé à la main
    if (rows.some((compte) => !compte.essai)) throw new Error("Nettoyage refusé : un de ces comptes n'est pas un compte d'essai.");
    const aSupprimer = rows.map((compte) => compte.id);
    await base.query("begin");
    try {
      // Dans cet ordre : ce qui retient une classe part avant elle
      for (const table of ["projets", "inscriptions", "eleves", "classes"]) {
        await base.query(`delete from public.${table} where enseignant_id = any($1::uuid[])`, [aSupprimer]);
      }
      await base.query("commit");
    } catch (erreur) {
      await base.query("rollback");
      throw erreur;
    }
    return aSupprimer;
  });
  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_CLE_SECRETE!, { auth: { persistSession: false, autoRefreshToken: false } });
  // Les images importées par ces comptes : rangées sous <compte>/<projet>/ dans le stockage
  const stockage = admin.storage.from("images");
  for (const id of comptes) {
    const { data: projets } = await stockage.list(id);
    for (const projet of projets ?? []) {
      const { data: fichiers } = await stockage.list(`${id}/${projet.name}`);
      if (fichiers?.length) await stockage.remove(fichiers.map((f) => `${id}/${projet.name}/${f.name}`));
    }
  }
  const echecs: string[] = [];
  for (const id of comptes) {
    const { error } = await admin.auth.admin.deleteUser(id);
    if (error) echecs.push(`${id} (${error.message})`);
  }
  if (echecs.length > 0) throw new Error(`Nettoyage : ${echecs.length} compte(s) d'essai non supprimé(s) : ${echecs.join(", ")}`);
}

/** Supprime tous les comptes d'essai de la base locale, restes d'un lancement interrompu compris. */
export async function purgerComptesDEssai(): Promise<number> {
  const ids = await avecLaBase(async (base) => (await base.query<{ id: string }>("select id from auth.users where email ~ $1", [ADRESSE_D_ESSAI])).rows.map((compte) => compte.id));
  await supprimerComptesDEssai(ids);
  return ids.length;
}
