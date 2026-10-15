import { phraseDe, type Gravite, type Probleme, type Sorte } from "@/domaine/controles";
import type { EtatChemins, EtatRelire, MarqueEtape, TacheChemins, TacheRelire } from "@/domaine/livre";
import { chapitresDe, referenceScene, type Plan } from "@/domaine/recit";

/**
 * Ce qu'un point des contrôles montre dans la destination Livre (F09.2, « Récupération ») : sa
 * scène, sa phrase courte, et de quoi le traiter. Calculé par le serveur, pour que la page
 * n'ait que des textes et des adresses.
 */
export type PointAffiche = {
  cle: string;
  sorte: Sorte;
  gravite: Gravite;
  /** La scène désignée : « S029 », et son titre */
  ref: string | null;
  titre: string | null;
  quoi: string;
  /** « Et 32 scènes qui n'ont pas d'autre accès. » */
  suite?: string;
  /** La page de la scène, avec « Retour au Livre » ; sur un choix, ce choix désigné, son panneau ouvert */
  ouvrir?: string;
  /** La scène, ouverte à côté de l'aperçu (F11-AC85), et le choix à y désigner */
  sceneId?: string;
  choix?: string;
  /** La vue Chemins de son chapitre, la scène désignée */
  chemins?: string;
  /** « Marquer comme fin » : la scène */
  fin?: string;
  /** « C'est voulu » : un avertissement ; « Garder ainsi » pour une image peu définie (F11.6) */
  accepter: boolean;
  accepterLibelle?: string;
  /** Un lien propre au point : choisir le départ, composer la feuille d'aventure */
  lien?: { href: string; texte: string };
};

export type TacheAffichee = { id: TacheChemins; nom: string; points: PointAffiche[]; acceptes: PointAffiche[]; avert: boolean; attente: boolean; faite: boolean };

export type CheminsAffiches = {
  taches: TacheAffichee[];
  aSavoir: PointAffiche[];
  finir: number;
  declaree: boolean;
  declarable: boolean;
  terminee: boolean;
  marque: MarqueEtape;
};

export function afficherPoint(p: Probleme, plan: Plan, projetId: string): PointAffiche {
  const ou = new Map(chapitresDe(plan).flatMap((c) => c.scenes.map((s) => [s.id, { scene: s, chapitre: c }] as const)));
  const sceneId = "sceneId" in p ? p.sceneId : null;
  const lu = sceneId ? ou.get(sceneId) : undefined;
  const phrase = phraseDe(p);
  const surUnChoix = p.sorte === "sans-destination" || p.sorte === "supprimee" || p.sorte === "exclue";
  const point: PointAffiche = {
    cle: p.cle, sorte: p.sorte, gravite: p.gravite,
    ref: lu ? referenceScene(lu.scene.reference) : null,
    titre: lu?.scene.titre ?? null,
    quoi: phrase.quoi,
    ...(phrase.suite ? { suite: phrase.suite } : {}),
    accepter: p.gravite === "avert",
  };
  if (lu) {
    point.sceneId = lu.scene.id;
    if (surUnChoix) point.choix = p.renvoiId;
    point.ouvrir = `/projet/${projetId}/scene/${lu.scene.id}?de=livre${surUnChoix ? `&choix=${encodeURIComponent(p.renvoiId)}` : ""}`;
    point.chemins = `/projet/${projetId}/chapitre/${lu.chapitre.id}?vue=chemins&scene=${lu.scene.id}&de=livre`;
  }
  if (p.sorte === "impasse") point.fin = p.sceneId;
  if (p.sorte === "depart" && !lu) point.lien = { href: `/projet/${projetId}/plan`, texte: "Choisir le départ" };
  if (p.sorte === "image-floue") point.accepterLibelle = "Garder ainsi";
  // Une image d'une page de présentation se règle dans « Mettre en page »
  if ((p.sorte === "image-manquante" || p.sorte === "image-floue") && p.pageDuLivre) {
    point.titre = p.pageDuLivre;
    point.lien = { href: `/projet/${projetId}/livre?etape=page`, texte: "Ouvrir les pages de début et de fin" };
  }
  if (p.sorte === "jeu-sans-feuille") point.lien = { href: `/projet/${projetId}/preparation`, texte: "Composer la feuille d’aventure" };
  return point;
}

export function afficherChemins(etat: EtatChemins, plan: Plan, projetId: string): CheminsAffiches {
  const afficher = (p: Probleme) => afficherPoint(p, plan, projetId);
  return {
    taches: etat.taches.map((t) => ({ ...t, points: t.points.map(afficher), acceptes: t.acceptes.map(afficher) })),
    aSavoir: etat.aSavoir.map(afficher),
    finir: etat.finir, declaree: etat.declaree, declarable: etat.declarable, terminee: etat.terminee, marque: etat.marque,
  };
}

export type TacheRelireAffichee = Omit<TacheAffichee, "id"> & { id: TacheRelire };

export type RelireAffiche = {
  taches: TacheRelireAffichee[];
  aSavoir: PointAffiche[];
  finir: number;
  declaree: boolean;
  declarable: boolean;
  terminee: boolean;
  marque: MarqueEtape;
};

export function afficherRelire(etat: EtatRelire, plan: Plan, projetId: string): RelireAffiche {
  const afficher = (p: Probleme) => afficherPoint(p, plan, projetId);
  return {
    taches: etat.taches.map((t) => ({ ...t, points: t.points.map(afficher), acceptes: t.acceptes.map(afficher) })),
    aSavoir: etat.aSavoir.map(afficher),
    finir: etat.finir, declaree: etat.declaree, declarable: etat.declarable, terminee: etat.terminee, marque: etat.marque,
  };
}
