"use server";

import { revalidatePath } from "next/cache";
import { CODES_DES_LIMITES, type Limite } from "@/domaine/offre";
import { exigerEnseignant } from "@/serveur/adulte";
import { ajouterUnBloc, annulerUnBloc, enregistrerReglagesDuBloc } from "@/serveur/bloc-de-scenes";
import { ajouterAuPlan, ajouterSceneApres, annulerAjout, relierChoix, remettreChoix, retirerChoix, type EchecDuPlan } from "@/serveur/chemins";

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

/**
 * L'onglet d'un choix « Sans destination », tiré jusqu'à une scène du chapitre (F03-AC67) : il y mène, à sa
 * place dans le texte. Sans scène donnée, « Annuler » : il redevient sans destination.
 */
export async function relierChoixDuSchema(sceneId: string, renvoiId: string, vers: string | null): Promise<Fait> {
  const e = await exigerEnseignant();
  const fait = await relierChoix(e, sceneId, renvoiId, vers);
  if (!fait.ok) return echec(fait, vers ? "Le choix n’a pas pu être relié. Réessayez." : "La liaison n’a pas pu être annulée.");
  rafraichir(fait.projetId);
  return { ok: true };
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

/**
 * « Ajouter 4 scènes et 3 choix » (F13-AC38) : le bloc proposé par l'IA, tel que l'adulte l'a
 * retouché, entre au chapitre d'un seul tenant ; la consigne proposée à la scène d'origine, s'il
 * la prend.
 */
export async function ajouterBlocDepuisLeSchema(
  chapitreId: string, proposition: unknown, prendreConsigne: boolean,
): Promise<Fait<{ scenes: { cle: string; id: string; reference: number; titre: string | null }[]; choix: ChoixPose[]; consignePrise: string | null }>> {
  const e = await exigerEnseignant();
  const fait = await ajouterUnBloc(e, chapitreId, proposition, { prendreConsigne });
  if (!fait.ok) return echec(fait, "Le bloc n’a pas pu être ajouté. Réessayez.");
  rafraichir(fait.projetId);
  return { ok: true, scenes: fait.scenes, choix: fait.choix, consignePrise: fait.consignePrise };
}

/** « Annuler » un bloc ajouté : ses choix quittent le texte, ses scènes la corbeille, la consigne prise s'efface. */
export async function annulerBlocDuSchema(choix: ChoixPose[], scenes: string[], consigne?: { scene: string; texte: string }): Promise<Fait> {
  const e = await exigerEnseignant();
  const fait = await annulerUnBloc(e, choix, scenes, consigne);
  if (!fait.ok) return echec(fait, "L’ajout n’a pas pu être annulé.");
  rafraichir(fait.projetId);
  return { ok: true };
}

/** Les deux réglages du bloc, gardés avec le compte (F13.7). */
export async function reglerLeBloc(reglages: unknown): Promise<Fait> {
  const e = await exigerEnseignant();
  return (await enregistrerReglagesDuBloc(e, reglages)) ? { ok: true } : { ok: false, erreur: "Ce réglage n’a pas pu être enregistré." };
}
