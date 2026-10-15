"use server";

import { revalidatePath } from "next/cache";
import { exigerEnseignant } from "@/serveur/adulte";
import { nomScene } from "@/domaine/recit";
import {
  assurerOrdre, chercherDansLesTextes, enregistrerPourAdulte, numerosDuProjet, texteDeScene, versionsPrecedentes, type TexteDeScene, type Trouvee, type VersionPrecedente,
} from "@/serveur/copie";
import { estUuid } from "@/serveur/recit";
import { enregistrerFormule, enregistrerObjet } from "./actions-preparation";

/**
 * Ce que l'adulte fait des textes d'une scène (F08.1, F08.2) : ne plus garder un texte
 * gardé à part, le mettre dans la scène, relire une version précédente. Le texte lui-même
 * s'enregistre par l'adresse /copie. La base revérifie à qui est la scène.
 */

type Echec = { ok: false; erreur: string };
type Fait<T = object> = ({ ok: true } & T) | Echec;
const echec = (erreur: string): Echec => ({ ok: false, erreur });
const refus = (erreur: { code?: string; message: string } | null, parDefaut: string): Echec =>
  echec(erreur?.code && /^P000\d$/.test(erreur.code) ? erreur.message : parDefaut);

const rafraichir = (projetId: string) => revalidatePath(`/projet/${projetId}`, "layout");

async function projetDeLaScene(sceneId: string): Promise<{ projetId: string } | null> {
  const e = await exigerEnseignant();
  if (!estUuid(sceneId)) return null;
  const { data } = await e.supabase.from("scenes").select("projet_id").eq("id", sceneId).maybeSingle();
  return data ? { projetId: data.projet_id as string } : null;
}

/** Le texte de la scène tel qu'il est maintenant, avec ce qui est gardé à part (F08-AC21). */
export async function relireTexte(sceneId: string): Promise<Fait<{ scene: TexteDeScene }>> {
  const e = await exigerEnseignant();
  const scene = await texteDeScene(e, sceneId);
  return scene ? { ok: true, scene } : echec("Cette scène n’existe plus.");
}

/**
 * « Tout annuler » (F11-AC47) : la scène ouverte à côté de l'aperçu retrouve le texte qu'elle
 * avait à l'ouverture de l'éditeur. Le texte est réécrit comme une correction de l'adulte, sur la
 * version qu'il lit : si quelqu'un l'a modifié entre-temps, rien n'est annulé.
 */
export async function retablirTexte(sceneId: string, version: number, texte: unknown): Promise<Fait<{ scene: TexteDeScene }>> {
  const e = await exigerEnseignant();
  const fait = await enregistrerPourAdulte(e, sceneId, version, texte);
  if (fait.etat !== "enregistre") return echec("Le texte a changé entre-temps : rien n’a été annulé.");
  const scene = await texteDeScene(e, sceneId);
  return scene ? { ok: true, scene } : echec("Cette scène n’existe plus.");
}

/** « Ne plus garder ce texte » (F08-AC07). L'élève arrêté retrouve l'écriture. */
export async function nePlusGarder(copieId: string, sceneId: string): Promise<Fait> {
  const e = await exigerEnseignant();
  const lieu = await projetDeLaScene(sceneId);
  if (!lieu || !estUuid(copieId)) return echec("Ce texte n’est plus gardé à part.");
  const { error } = await e.supabase.rpc("ne_plus_garder", { p_copie: copieId });
  if (error) return refus(error, "Cela n’a pas pu être fait. Réessayez.");
  rafraichir(lieu.projetId);
  return { ok: true };
}

/** « Annuler », tant que l'adulte reste sur la page : le texte est de nouveau gardé à part (F08-AC13). */
export async function garderDeNouveau(copieId: string, sceneId: string): Promise<Fait<{ scene: TexteDeScene }>> {
  const e = await exigerEnseignant();
  const lieu = await projetDeLaScene(sceneId);
  if (!lieu || !estUuid(copieId)) return echec("Ce texte ne peut plus être retrouvé.");
  const { error } = await e.supabase.rpc("garder_de_nouveau", { p_copie: copieId });
  if (error) return refus(error, "Ce texte ne peut plus être retrouvé.");
  rafraichir(lieu.projetId);
  const scene = await texteDeScene(e, sceneId);
  return scene ? { ok: true, scene } : echec("Cette scène n’existe plus.");
}

/**
 * « Mettre ce texte dans la scène » : un échange (F08-AC08). L'état de la scène, l'élève
 * qui s'en occupe et les remises ne changent pas (F08-AC25).
 */
export async function mettreDansLaScene(copieId: string, sceneId: string): Promise<Fait<{ scene: TexteDeScene; ancien: string | null }>> {
  const e = await exigerEnseignant();
  const lieu = await projetDeLaScene(sceneId);
  if (!lieu || !estUuid(copieId)) return echec("Ce texte n’est plus gardé à part.");
  const { data, error } = await e.supabase.rpc("mettre_copie_dans_scene", { p_copie: copieId });
  if (error) return refus(error, "Le texte n’a pas pu être mis dans la scène. Réessayez.");
  rafraichir(lieu.projetId);
  const scene = await texteDeScene(e, sceneId);
  return scene ? { ok: true, scene, ancien: ((data as { ancien?: string | null } | null)?.ancien ?? null) } : echec("Cette scène n’existe plus.");
}

/** « Versions précédentes » : l'adulte seul les lit (F08-AC43). */
export async function lireVersions(sceneId: string): Promise<Fait<{ versions: VersionPrecedente[] }>> {
  const e = await exigerEnseignant();
  return { ok: true, versions: await versionsPrecedentes(e, sceneId) };
}

/** « Mettre ce texte dans la scène », depuis une version précédente : le même échange (F08-AC42). */
export async function remettreVersion(versionId: string, sceneId: string): Promise<Fait<{ scene: TexteDeScene }>> {
  const e = await exigerEnseignant();
  const lieu = await projetDeLaScene(sceneId);
  if (!lieu || !estUuid(versionId)) return echec("Cette version n’existe plus.");
  const { error } = await e.supabase.rpc("mettre_version_dans_scene", { p_version: versionId });
  if (error) return refus(error, "Le texte n’a pas pu être mis dans la scène. Réessayez.");
  rafraichir(lieu.projetId);
  const scene = await texteDeScene(e, sceneId);
  return scene ? { ok: true, scene } : echec("Cette scène n’existe plus.");
}

// ——— Choix, destinations et numéros (F05, F05.2, F11.5) ———

const enTable = (numeros: Map<string, number>): Record<string, number> => Object.fromEntries(numeros);

/** Les numéros du livre, relus : après un choix créé, une scène ajoutée, un numéro fixé. */
export async function relireNumeros(projetId: string): Promise<{ numeros: Record<string, number>; total: number }> {
  const e = await exigerEnseignant();
  const lus = await numerosDuProjet(e.supabase, projetId);
  return { numeros: lus ? enTable(lus.de) : {}, total: lus?.total ?? 0 };
}

/** Chercher une destination dans les textes du projet (F05-AC01). Aucune IA : une simple recherche de mots. */
export async function chercherDestinations(projetId: string, demande: string): Promise<Trouvee[]> {
  const e = await exigerEnseignant();
  return chercherDansLesTextes(e, projetId, String(demande ?? "").slice(0, 200));
}

export type SceneCreee = { id: string; reference: number; titre: string | null; chapitreId: string };

/**
 * « Nouvelle scène », depuis un choix (F05-AC16) : une scène vide, dans le chapitre voulu,
 * avec le libellé pour titre proposé (F05-AC12). L'auteur reste dans la scène où il écrit.
 */
export async function creerSceneDepuisChoix(chapitreId: string, titre: string): Promise<Fait<{ scene: SceneCreee; numeros: Record<string, number> }>> {
  const e = await exigerEnseignant();
  if (!estUuid(chapitreId)) return echec("Ce chapitre n’existe pas.");
  const { data, error } = await e.supabase.rpc("creer_scene", { p_chapitre: chapitreId });
  const ligne = (Array.isArray(data) ? data[0] : data) as { scene_id: string; reference: number } | null;
  if (error || !ligne) return refus(error, "La scène n’a pas pu être créée. Réessayez.");
  const propre = String(titre ?? "").trim().replace(/\s+/g, " ").slice(0, 120) || null;
  const { data: scene } = await e.supabase.from("scenes").update({ titre: propre }).eq("id", ligne.scene_id).select("projet_id").maybeSingle();
  const projetId = scene?.projet_id as string | undefined;
  if (projetId) rafraichir(projetId);
  const lus = projetId ? await numerosDuProjet(e.supabase, projetId) : null;
  return { ok: true, scene: { id: ligne.scene_id, reference: ligne.reference, titre: propre, chapitreId }, numeros: lus ? enTable(lus.de) : {} };
}

/** Le numéro que porte un passage, l'ordre du livre étant établi s'il ne l'était pas (F11-AC96). */
export async function numeroDeLaScene(sceneId: string): Promise<Fait<{ numero: number | null; total: number }>> {
  const e = await exigerEnseignant();
  const lieu = await projetDeLaScene(sceneId);
  if (!lieu) return echec("Cette scène n’existe plus.");
  await assurerOrdre(e.supabase, lieu.projetId);
  const lus = await numerosDuProjet(e.supabase, lieu.projetId);
  return { ok: true, numero: lus?.de.get(sceneId) ?? null, total: lus?.total ?? 0 };
}

/**
 * « Fixer son numéro… » (F11-AC96). Un numéro déjà fixé pour une autre scène est refusé,
 * et cette scène est nommée (F05-AC36).
 */
export async function fixerNumero(sceneId: string, numero: number): Promise<Fait<{ numeros: Record<string, number>; total: number }> | { ok: false; erreur: string; prise: string }> {
  const e = await exigerEnseignant();
  const lieu = await projetDeLaScene(sceneId);
  if (!lieu || !Number.isInteger(numero)) return echec("Écrivez un numéro entre 1 et 9999.");
  await assurerOrdre(e.supabase, lieu.projetId);
  const { data, error } = await e.supabase.rpc("fixer_numero", { p_scene: sceneId, p_numero: numero });
  if (error) return refus(error, "Le numéro n’a pas pu être fixé. Réessayez.");
  const fait = data as { fixe: boolean; prise?: { reference: number; titre: string | null } };
  if (!fait.fixe && fait.prise) {
    const nom = nomScene(fait.prise);
    return { ok: false, prise: nom, erreur: `Le n° ${numero} est déjà celui de ${nom}.` };
  }
  rafraichir(lieu.projetId);
  const lus = await numerosDuProjet(e.supabase, lieu.projetId);
  return { ok: true, numeros: lus ? enTable(lus.de) : {}, total: lus?.total ?? 0 };
}

/**
 * Le numéro de la destination d'une liaison cachée (F05.1) : celui que donne l'énigme, ou
 * celui que le passage porte. Une scène déjà fixée garde son numéro (F11.5), et le départ
 * porte toujours le n° 1 : rien à fixer pour eux.
 */
export async function fixerPourLiaison(sceneId: string, numero: number | null): Promise<Fait<{ numero: number | null }>> {
  const e = await exigerEnseignant();
  const lieu = await projetDeLaScene(sceneId);
  if (!lieu) return echec("Cette scène n’existe plus.");
  await assurerOrdre(e.supabase, lieu.projetId);
  const [{ data: scene }, { data: projet }] = await Promise.all([
    e.supabase.from("scenes").select("numero_fixe").eq("id", sceneId).maybeSingle(),
    e.supabase.from("projets").select("depart_scene_id").eq("id", lieu.projetId).maybeSingle(),
  ]);
  if (projet?.depart_scene_id === sceneId) return numero === null || numero === 1 ? { ok: true, numero: 1 } : echec("Le départ du livre porte toujours le n° 1.");
  const deja = (scene?.numero_fixe as number | null) ?? null;
  if (numero === null && deja !== null) return { ok: true, numero: deja };
  const voulu = numero ?? (await numerosDuProjet(e.supabase, lieu.projetId))?.de.get(sceneId) ?? null;
  // Une scène hors du livre n'a pas de numéro : la liaison existe, le contrôle du livre le dira
  if (voulu === null) return { ok: true, numero: null };
  const fait = await fixerNumero(sceneId, voulu);
  return fait.ok ? { ok: true, numero: voulu } : echec(fait.erreur);
}

/**
 * Ajouter un objet ou une formule depuis la scène, sans la quitter (F04-AC29). La rubrique
 * « Objets et formules » de la préparation s'ouvre du même coup : l'objet y figure.
 */
export async function ajouterObjetDepuisLaScene(projetId: string, nom: string, description: string): Promise<Fait> {
  const e = await exigerEnseignant();
  if (!estUuid(projetId)) return echec("Projet inconnu.");
  const fait = await enregistrerObjet(projetId, null, nom, description);
  if (fait.ok) await e.supabase.from("preparations").update({ rubrique_jeu: true }).eq("projet_id", projetId);
  return fait;
}
export async function ajouterFormuleDepuisLaScene(projetId: string, texte: string, signe: string = "crayon"): Promise<Fait> {
  const e = await exigerEnseignant();
  if (!estUuid(projetId)) return echec("Projet inconnu.");
  const fait = await enregistrerFormule(projetId, null, texte, signe);
  if (fait.ok) await e.supabase.from("preparations").update({ rubrique_jeu: true }).eq("projet_id", projetId);
  return fait;
}

/** « Scènes voisines » : la préférence de l'adulte, conservée avec son compte (F04-AC08). */
export async function reglerVoisines(affiche: boolean): Promise<void> {
  const e = await exigerEnseignant();
  await e.supabase.from("enseignants").update({ voisines: affiche === true }).eq("id", e.id);
}

/** « Libérer le numéro » : le passage prend place à la suite de son groupe (F11-AC97). */
export async function libererNumero(sceneId: string): Promise<Fait> {
  const e = await exigerEnseignant();
  const lieu = await projetDeLaScene(sceneId);
  if (!lieu) return echec("Cette scène n’existe plus.");
  const { error } = await e.supabase.rpc("liberer_numero", { p_scene: sceneId });
  if (error) return refus(error, "Le numéro n’a pas pu être libéré. Réessayez.");
  rafraichir(lieu.projetId);
  return { ok: true };
}
