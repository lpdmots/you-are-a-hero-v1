"use server";

import { revalidatePath } from "next/cache";
import { defautsDEcriture, estEtat, type Etat } from "@/domaine/etats";
import { exigerEnseignant } from "@/serveur/adulte";
import { texteDeScene, type TexteDeScene } from "@/serveur/copie";
import { estUuid } from "@/serveur/recit";
import { relectureDe, type Relecture } from "@/serveur/relecture";

/**
 * Ce que l'enseignant décide d'une scène (F07.1, F11.1) : la mettre dans l'état qu'il
 * veut, depuis n'importe quel état. La base revérifie à qui est la scène, quels états
 * elle peut prendre, et que le texte et l'état sont encore ceux qu'il a lus.
 */

export type SuiteEtat =
  /** L'état a changé */
  | { ok: true; fait: true; relecture: Relecture }
  /** Avant « prête » : les défauts d'écriture de la scène, à confirmer (F09.2) */
  | { ok: true; fait: false; rappel: string[] }
  /** Le texte ou l'état a changé depuis la lecture : rien n'est décidé, la page montre le texte à jour (F07-AC26) */
  | { ok: true; fait: false; suspendu: true; scene: TexteDeScene; relecture: Relecture }
  | { ok: false; erreur: string };

const echec = (erreur: string): SuiteEtat => ({ ok: false, erreur });

export async function changerEtat(
  sceneId: string, etat: Etat, lu: { version: number; tour: number }, options: { remarque?: string; confirme?: boolean } = {},
): Promise<SuiteEtat> {
  const e = await exigerEnseignant();
  if (!estUuid(sceneId) || !estEtat(etat) || !Number.isInteger(lu?.version) || !Number.isInteger(lu?.tour)) return echec("Cette scène n’existe plus.");
  const { data: scene } = await e.supabase
    .from("scenes")
    .select("projet_id, texte_vide, fin, etat")
    .eq("id", sceneId)
    .is("supprime_le", null)
    .maybeSingle();
  if (!scene) return echec("Cette scène n’existe plus.");
  const projetId = scene.projet_id as string;

  // Le rappel avant « prête » se fait d'après le texte enregistré, que la page vient d'envoyer (F11.1)
  if (etat === "prete" && scene.etat !== "prete" && options.confirme !== true) {
    const [{ data: projet }, { data: liens }] = await Promise.all([
      e.supabase.from("projets").select("recit").eq("id", projetId).maybeSingle(),
      e.supabase.from("liens").select("cible_id, cache").eq("scene_id", sceneId),
    ]);
    const defauts = defautsDEcriture({
      vide: scene.texte_vide !== false,
      aChoix: projet?.recit === "choix",
      fin: scene.fin === true,
      liens: ((liens ?? []) as { cible_id: string | null; cache: boolean }[]).map((l) => ({ cibleId: l.cible_id, cache: l.cache })),
    });
    if (defauts.length) return { ok: true, fait: false, rappel: defauts };
  }

  const { data, error } = await e.supabase.rpc("changer_etat", {
    p_scene: sceneId, p_etat: etat, p_version: lu.version, p_tour: lu.tour,
    p_remarque: etat === "reprendre" ? String(options.remarque ?? "").slice(0, 2000) : null,
  });
  if (error) return echec(error.code && /^P000\d$/.test(error.code) ? error.message : "L’état n’a pas pu être changé. Réessayez.");
  const relecture = await relectureDe(e, sceneId);
  if (!relecture) return echec("Cette scène n’existe plus.");
  if ((data as { suspendu?: boolean } | null)?.suspendu) {
    const texte = await texteDeScene(e, sceneId);
    return texte ? { ok: true, fait: false, suspendu: true, scene: texte, relecture } : echec("Cette scène n’existe plus.");
  }
  revalidatePath(`/projet/${projetId}`, "layout");
  return { ok: true, fait: true, relecture };
}

/** L'état, les remises et les remarques tels qu'ils sont maintenant : après un conflit, avant de décider. */
export async function relireRelecture(sceneId: string): Promise<Relecture | null> {
  const e = await exigerEnseignant();
  return relectureDe(e, sceneId);
}
