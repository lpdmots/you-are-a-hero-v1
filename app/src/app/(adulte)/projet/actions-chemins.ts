"use server";

import { revalidatePath } from "next/cache";
import { CODES_DES_LIMITES, type Limite } from "@/domaine/offre";
import { exigerEnseignant } from "@/serveur/adulte";
import { ajouterAuPlan, ajouterSceneApres, annulerAjout, remettreChoix, retirerChoix, type EchecDuPlan } from "@/serveur/chemins";

/**
 * Les gestes de l'adulte dans « Chemins » (F03.1, F03-AC52 à AC56). Chacun est enregistré
 * aussitôt ; un échec se dit en une phrase, et le schéma reste ce qui est enregistré.
 */

// limite : une limite gratuite atteinte ; la page ouvre le dialogue du pass (F14-AC13)
type Echec = { ok: false; erreur: string; limite?: Limite };
type Fait<T = object> = ({ ok: true } & T) | Echec;

const echec = (e: EchecDuPlan, parDefaut: string): Echec => {
  if (e.dit) return { ok: false, erreur: e.dit };
  const limite = e.base?.code ? CODES_DES_LIMITES[e.base.code] : undefined;
  if (limite) return { ok: false, erreur: "La scène n’a pas été ajoutée : le livre gratuit est complet.", limite };
  // La base écrit ses refus en français pour la personne (codes P0001 à P0003) ; les autres ne se montrent pas
  return { ok: false, erreur: e.base?.code && /^P000\d$/.test(e.base.code) ? e.base.message : parDefaut };
};

const rafraichir = (projetId: string | null) => {
  if (!projetId) return;
  revalidatePath(`/projet/${projetId}`, "layout");
  revalidatePath(`/atelier/${projetId}`, "layout");
};

/** Un choix posé depuis le schéma : la scène d'où il part et l'identité de sa phrase, pour « Annuler ». */
export type ChoixPose = { de: string; id: string };

/** « + » sous une scène (F03-AC52) : une nouvelle scène et le choix qui y mène, d'un seul tenant. */
export async function ajouterSceneDepuisLeSchema(
  chapitreId: string, de: string, libelle: string, titre: string,
): Promise<Fait<{ scene: { id: string; reference: number; titre: string | null }; choix: ChoixPose }>> {
  const e = await exigerEnseignant();
  const fait = await ajouterSceneApres(e, chapitreId, de, libelle, titre);
  if (!fait.ok) return echec(fait, "La scène n’a pas pu être ajoutée. Réessayez.");
  rafraichir(fait.projetId);
  return { ok: true, scene: fait.scenes[0], choix: fait.choix[0] };
}

/** Un lien tiré d'une scène vers une scène du chapitre (F03-AC53) : un choix, aucune scène créée. */
export async function relierDepuisLeSchema(chapitreId: string, de: string, vers: string, libelle: string): Promise<Fait<{ choix: ChoixPose }>> {
  const e = await exigerEnseignant();
  const fait = await ajouterAuPlan(e, chapitreId, [], [{ de, vers, libelle }]);
  if (!fait.ok) return echec(fait, "Le choix n’a pas pu être ajouté. Réessayez.");
  rafraichir(fait.projetId);
  return { ok: true, choix: fait.choix[0] };
}

/** « Supprimer » un choix (F03-AC56) : sa phrase quitte le texte de la scène d'où il part. */
export async function supprimerChoixDuSchema(sceneId: string, renvoiId: string): Promise<Fait<{ bloc: unknown }>> {
  const e = await exigerEnseignant();
  const fait = await retirerChoix(e, sceneId, renvoiId);
  if (!fait.ok) return echec(fait, "Le choix n’a pas pu être supprimé. Réessayez.");
  rafraichir(fait.projetId);
  return { ok: true, bloc: fait.bloc };
}

/** « Annuler » la suppression d'un choix : sa phrase revient à la fin du texte. */
export async function remettreChoixDuSchema(sceneId: string, bloc: unknown): Promise<Fait> {
  const e = await exigerEnseignant();
  const fait = await remettreChoix(e, sceneId, bloc);
  if (!fait.ok) return echec(fait, "Le choix n’a pas pu être remis.");
  rafraichir(fait.projetId);
  return { ok: true };
}

/** « Annuler » un ajout : le choix quitte le texte, la scène créée avec lui rejoint la corbeille. */
export async function annulerAjoutDuSchema(choix: ChoixPose[], scenes: string[]): Promise<Fait> {
  const e = await exigerEnseignant();
  const fait = await annulerAjout(e, choix, scenes);
  if (!fait.ok) return echec(fait, "L’ajout n’a pas pu être annulé.");
  rafraichir(fait.projetId);
  return { ok: true };
}
