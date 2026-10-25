import "server-only";
import { nomsDesObjets } from "./lecteur";
import { clientDuPoste } from "./poste";
import { estUuid } from "./recit";
import type { ContexteEleve } from "./recit-eleve";
import { versionAvecObjets } from "@/domaine/inventaire";
import type { VersionPartagee } from "@/domaine/partage";

/**
 * Les livres que l'élève lit pour le plaisir (F12.3) : les versions que l'enseignant de sa
 * classe ouvre « À mes classes ». La base ne rend au poste que ces versions, à toute heure
 * (F06-AC31), et la lecture que l'élève y a laissée (F12-AC26).
 */

export type LivrePropose = {
  projetId: string;
  titre: string;
  aChoix: boolean;
  /** La ligne de la page de titre de la version : « La classe de CM1-CM2 de Mme Laurent » */
  ligne: string | null;
  deMaClasse: boolean;
  passages: number;
  chapitres: number;
  /** L'image de la page de titre, s'il y en a une */
  image: string | null;
};

export async function livresDuPoste(c: ContexteEleve): Promise<LivrePropose[]> {
  const base = await clientDuPoste(c.poste);
  const { data, error } = await base.rpc("livres_du_poste");
  if (error) throw new Error(`Livres illisibles : ${error.message}`);
  return ((data ?? []) as { projet_id: string; titre: string; a_choix: boolean; ligne: string | null; de_ma_classe: boolean; passages: number; chapitres: number; image: string | null }[]).map((l) => ({
    projetId: l.projet_id, titre: l.titre, aChoix: l.a_choix, ligne: l.ligne, deMaClasse: l.de_ma_classe, passages: l.passages, chapitres: l.chapitres, image: l.image,
  }));
}

export async function livreDuPoste(c: ContexteEleve, projetId: string): Promise<{ version: VersionPartagee; lecture: unknown } | null> {
  if (!estUuid(projetId)) return null;
  const base = await clientDuPoste(c.poste);
  const { data, error } = await base.rpc("livre_du_poste", { p_projet: projetId });
  if (error) throw new Error(`Livre illisible : ${error.message}`);
  const lu = data as { version: VersionPartagee | null; lecture: unknown } | null;
  return lu?.version ? { version: versionAvecObjets(lu.version, await nomsDesObjets(projetId)), lecture: lu.lecture ?? null } : null;
}
