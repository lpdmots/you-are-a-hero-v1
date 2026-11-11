"use server";

import { revalidatePath } from "next/cache";
import { CODES_DES_LIMITES, type Limite } from "@/domaine/offre";
import { exigerEnseignant } from "@/serveur/adulte";
import { ajouterUnBloc, annulerUnBloc, enregistrerReglagesDuBloc } from "@/serveur/bloc-de-scenes";
import {
  ajouterAuPlan, ajouterSceneApres, annulerAjout, cacherChoix, lireChoix, modifierChoix, proposerLiaison, relierChoix, remettreChoix, remettreLiaison, retirerChoix, retirerLiaison,
  type EchecDuPlan, type Place,
} from "@/serveur/chemins";
import type { Choix, Liaison } from "@/domaine/copie";
import type { Construction, FormuleRenvoi } from "@/domaine/preparation";
import { fixerPourLiaison } from "./actions-texte";

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

/**
 * « Supprimer » un choix (F03-AC56) : sa phrase quitte le texte de la scène d'où il part. `entiere` : depuis
 * l'écran du choix, la phrase part avec toutes ses destinations (F03-AC74).
 */
export async function supprimerChoixDuSchema(sceneId: string, renvoiId: string, entiere = false): Promise<Fait<{ bloc: unknown; place: Place }>> {
  const e = await exigerEnseignant();
  const fait = await retirerChoix(e, sceneId, renvoiId, entiere === true);
  if (!fait.ok) return echec(fait, "Le choix n’a pas pu être supprimé. Réessayez.");
  rafraichir(fait.projetId);
  return { ok: true, bloc: fait.bloc, place: fait.place };
}

/**
 * « Annuler » la suppression d'un choix : sa phrase revient à sa place dans le texte (F03-AC74). `retire` :
 * le lien caché qui l'avait remplacée, quand on annule « Cacher ce choix ».
 */
export async function remettreChoixDuSchema(sceneId: string, bloc: unknown, place?: Partial<Place>, retire?: string): Promise<Fait> {
  const e = await exigerEnseignant();
  const fait = await remettreChoix(e, sceneId, bloc, place ?? {}, typeof retire === "string" ? [retire] : []);
  if (!fait.ok) return echec(fait, "Le choix n’a pas pu être remis.");
  rafraichir(fait.projetId);
  return { ok: true };
}

// ——— Modifier un choix depuis « Chemins » (F03-AC70 à AC75) ———

/** Le choix qu'un onglet désigne, lu dans le texte de sa scène : sa phrase, ou son lien caché (F03-AC70). */
export async function lireChoixDuSchema(sceneId: string, lienId: string): Promise<Fait<{ bloc: Choix | Liaison; formule: FormuleRenvoi; constructions: Construction[] }>> {
  const e = await exigerEnseignant();
  const fait = await lireChoix(e, sceneId, lienId);
  return fait.ok ? fait : echec(fait, "Ce choix n’a pas pu être ouvert. Réessayez.");
}

/** La phrase d'un choix, ses destinations ou leur ordre, changés depuis « Chemins » : enregistrés aussitôt, à sa place dans le texte (F03-AC72, AC73). */
export async function modifierChoixDuSchema(sceneId: string, bloc: unknown): Promise<Fait> {
  const e = await exigerEnseignant();
  const fait = await modifierChoix(e, sceneId, bloc);
  if (!fait.ok) return echec(fait, "Le choix n’a pas pu être enregistré. Réessayez.");
  rafraichir(fait.projetId);
  return { ok: true };
}

/**
 * « Cacher ce choix (énigme) » : le numéro de la destination est fixé, la phrase quitte le texte et un lien
 * caché la remplace, hors du récit (F05-AC26). Rend de quoi « Annuler ».
 */
export async function cacherChoixDuSchema(sceneId: string, blocId: string, cible: string): Promise<Fait<{ bloc: unknown; place: Place; liaison: string; numero: number | null }>> {
  const e = await exigerEnseignant();
  const fixe = await fixerPourLiaison(cible, null);
  if (!fixe.ok) return fixe;
  const fait = await cacherChoix(e, sceneId, blocId);
  if (!fait.ok) return echec(fait, "Le choix n’a pas pu être caché. Réessayez.");
  rafraichir(fait.projetId);
  return { ok: true, bloc: fait.bloc, place: fait.place, liaison: fait.liaison.id, numero: fixe.numero };
}

/** « Proposer comme choix » : une phrase automatique reprend le lien caché, à la fin du texte (F05-AC26). */
export async function proposerLiaisonDuSchema(sceneId: string, liaisonId: string, libelle: string): Promise<Fait<{ liaison: unknown; choix: string }>> {
  const e = await exigerEnseignant();
  const fait = await proposerLiaison(e, sceneId, liaisonId, libelle);
  if (!fait.ok) return echec(fait, "Le lien caché n’a pas pu devenir un choix. Réessayez.");
  rafraichir(fait.projetId);
  return { ok: true, liaison: fait.liaison, choix: fait.choix.id };
}

/** « Retirer ce lien caché ». */
export async function retirerLiaisonDuSchema(sceneId: string, liaisonId: string): Promise<Fait<{ liaison: unknown }>> {
  const e = await exigerEnseignant();
  const fait = await retirerLiaison(e, sceneId, liaisonId);
  if (!fait.ok) return echec(fait, "Le lien caché n’a pas pu être retiré. Réessayez.");
  rafraichir(fait.projetId);
  return { ok: true, liaison: fait.liaison };
}

/** « Annuler » : le lien caché revient ; `retire` : la phrase qui l'avait remplacé. */
export async function remettreLiaisonDuSchema(sceneId: string, liaison: unknown, retire?: string): Promise<Fait> {
  const e = await exigerEnseignant();
  const fait = await remettreLiaison(e, sceneId, liaison, typeof retire === "string" ? [retire] : []);
  if (!fait.ok) return echec(fait, "Le lien caché n’a pas pu être remis.");
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
