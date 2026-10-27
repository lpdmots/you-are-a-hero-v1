import "server-only";
import { nomsDesObjets } from "./lecteur";
import { clientDuPoste } from "./poste";
import { estUuid } from "./recit";
import type { ContexteEleve } from "./recit-eleve";
import { versionAvecObjets } from "@/domaine/inventaire";
import type { VersionPartagee } from "@/domaine/partage";
import { ADRESSE_VALIDE } from "@/domaine/bibliotheque";

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
  /** La couverture de la version partagée (F11-AC114) : elle se montre à la place de la page de titre */
  couverture: string | null;
};

export async function livresDuPoste(c: ContexteEleve): Promise<LivrePropose[]> {
  const base = await clientDuPoste(c.poste);
  const { data, error } = await base.rpc("livres_du_poste");
  if (error) throw new Error(`Livres illisibles : ${error.message}`);
  return ((data ?? []) as { projet_id: string; titre: string; a_choix: boolean; ligne: string | null; de_ma_classe: boolean; passages: number; chapitres: number; image: string | null; couverture: string | null }[]).map((l) => ({
    projetId: l.projet_id, titre: l.titre, aChoix: l.a_choix, ligne: l.ligne, deMaClasse: l.de_ma_classe, passages: l.passages, chapitres: l.chapitres, image: l.image,
    couverture: l.couverture ?? null,
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

// ——— La bibliothèque dans « Lire » (F15-AC20) ———

export type LivreDeLaBibliotheque = {
  adresse: string;
  titre: string;
  aChoix: boolean;
  presentation: string;
  /** La ligne de sa page de titre : la classe qui l'a écrit, ou son auteur */
  ligne: string | null;
  /** L'image de la page de titre, servie par l'adresse du livre */
  image: string | null;
  /** La couverture de la version publiée (F11-AC114) */
  couverture: string | null;
  passages: number;
  coeurs: number;
  /** Le cœur de cet élève, pour son profil */
  donne: boolean;
};

/** Les livres de la bibliothèque de l'âge de la classe, si l'enseignant ne l'a pas éteinte ; jamais « Adultes ». */
export async function bibliothequeDuPoste(c: ContexteEleve): Promise<LivreDeLaBibliotheque[]> {
  const base = await clientDuPoste(c.poste);
  const { data, error } = await base.rpc("bibliotheque_du_poste");
  if (error) throw new Error(`Bibliothèque illisible : ${error.message}`);
  type Ligne = { adresse: string; titre: string; a_choix: boolean; page: { image?: string | null; illustration?: string | null; ligne?: string | null } | null; dernier: number | null; presentation: string; coeurs: number; donne: boolean; couverture: string | null };
  return ((data ?? []) as Ligne[]).map((l) => ({
    adresse: l.adresse, titre: l.titre, aChoix: l.a_choix, presentation: l.presentation, ligne: l.page?.ligne?.trim() || null,
    image: l.page?.image ?? l.page?.illustration ?? null, couverture: l.couverture ?? null, passages: l.a_choix ? (l.dernier ?? 0) : 0, coeurs: l.coeurs ?? 0, donne: l.donne === true,
  }));
}

export async function livreDeLaBibliothequeDuPoste(c: ContexteEleve, adresse: string): Promise<{ version: VersionPartagee; lecture: unknown; coeurs: number; donne: boolean } | null> {
  if (!ADRESSE_VALIDE.test(adresse)) return null;
  const base = await clientDuPoste(c.poste);
  const { data, error } = await base.rpc("livre_de_la_bibliotheque_du_poste", { p_adresse: adresse });
  if (error) throw new Error(`Livre illisible : ${error.message}`);
  const lu = data as { version: VersionPartagee | null; projet: string; lecture: unknown; coeurs: number; donne: boolean } | null;
  return lu?.version
    ? { version: versionAvecObjets(lu.version, await nomsDesObjets(lu.projet)), lecture: lu.lecture ?? null, coeurs: lu.coeurs ?? 0, donne: lu.donne === true }
    : null;
}
