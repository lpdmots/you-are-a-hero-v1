import "server-only";
import { estCategorie, type Categorie, type Encouragement } from "@/domaine/encouragements";
import type { Enseignant } from "./adulte";
import { clientDuPoste } from "./poste";
import { estUuid } from "./recit";
import type { ContexteEleve } from "./recit-eleve";

/**
 * Encouragements (F07.5). L'adulte lit ceux de son projet par son propre accès. L'élève ne
 * lit jamais la table : son poste appelle une fonction qui ne rend que ses tampons et,
 * classement montré, les trois meilleurs totaux de chaque catégorie (F07-AC82, AC86).
 */

type Ligne = { scene_id: string; eleve_id: string; categorie: string };
const lire = (lignes: Ligne[] | null): Encouragement[] =>
  (lignes ?? []).flatMap((l) => (estCategorie(l.categorie) ? [{ sceneId: l.scene_id, eleveId: l.eleve_id, categorie: l.categorie }] : []));

/** Tous les tampons donnés dans le projet, et si le classement est montré aux élèves. */
export async function encouragementsDuProjet(e: Enseignant, projetId: string): Promise<{ donnes: Encouragement[]; classementMontre: boolean }> {
  if (!estUuid(projetId)) return { donnes: [], classementMontre: false };
  const [donnes, projet] = await Promise.all([
    e.supabase.from("encouragements").select("scene_id, eleve_id, categorie").eq("projet_id", projetId).order("donne_le"),
    e.supabase.from("projets").select("classement_montre").eq("id", projetId).maybeSingle(),
  ]);
  const erreur = donnes.error ?? projet.error;
  if (erreur) throw new Error(`Encouragements illisibles : ${erreur.message}`);
  return { donnes: lire(donnes.data as Ligne[] | null), classementMontre: projet.data?.classement_montre === true };
}

/** Les tampons d'une scène, du plus ancien au plus récent : ceux de l'élève qui s'en occupe, et ceux d'un élève d'avant (F07-AC78). */
export async function encouragementsDeScene(e: Enseignant, sceneId: string): Promise<Encouragement[]> {
  if (!estUuid(sceneId)) return [];
  const { data, error } = await e.supabase.from("encouragements").select("scene_id, eleve_id, categorie").eq("scene_id", sceneId).order("donne_le");
  if (error) throw new Error(`Encouragements illisibles : ${error.message}`);
  return lire(data as Ligne[] | null);
}

export type MesEncouragements = {
  /** Ses tampons, du plus ancien au plus récent */
  tampons: { sceneId: string; categorie: Categorie }[];
  /** Rien tant que l'enseignant ne montre pas le classement ; sinon, par catégorie, les trois meilleurs totaux */
  classement: Partial<Record<Categorie, { total: number; eleves: string[] }[]>> | null;
};

/** Ce que le poste de l'élève reçoit pour un projet de sa classe. */
export async function mesEncouragements(c: ContexteEleve, projetId: string): Promise<MesEncouragements> {
  const vide: MesEncouragements = { tampons: [], classement: null };
  if (!estUuid(projetId)) return vide;
  const base = await clientDuPoste(c.poste);
  const { data, error } = await base.rpc("mes_encouragements", { p_projet: projetId });
  if (error) throw new Error(`Encouragements illisibles : ${error.message}`);
  const recu = data as { tampons?: { scene: string; categorie: string }[]; classement?: Record<string, { total: number; eleves: string[] }[]> | null } | null;
  if (!recu) return vide;
  return {
    tampons: (recu.tampons ?? []).flatMap((t) => (estCategorie(t.categorie) ? [{ sceneId: t.scene, categorie: t.categorie }] : [])),
    classement: recu.classement ? Object.fromEntries(Object.entries(recu.classement).filter(([cle]) => estCategorie(cle))) : null,
  };
}
