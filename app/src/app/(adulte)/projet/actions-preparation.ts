"use server";

import { revalidatePath } from "next/cache";
import {
  estConstruction, estFormuleRenvoi, estRubrique, ETATS_PISTE, feuillePropre, type Construction, type EtatPiste, type Feuille, type RubriqueTexte,
} from "@/domaine/preparation";
import { exigerEnseignant } from "@/serveur/adulte";
import { estUuid } from "@/serveur/recit";

/**
 * Commandes du carnet de préparation (F02) et de ses rubriques du jeu et des phrases de
 * choix (F04.2, F05, F11.5). L'adulte seul écrit la préparation : la base ne donne aucun
 * droit sur ces tables à un poste d'élève.
 */

type Echec = { ok: false; erreur: string };
type Fait<T = object> = ({ ok: true } & T) | Echec;
const echec = (erreur: string): Echec => ({ ok: false, erreur });
const ligne = (texte: unknown, max: number): string => String(texte ?? "").trim().replace(/\s+/g, " ").slice(0, max);
const texteLong = (texte: unknown, max: number): string => String(texte ?? "").replace(/\r\n/g, "\n").slice(0, max);
const rafraichir = (projetId: string) => {
  revalidatePath(`/projet/${projetId}`, "layout");
  revalidatePath(`/atelier/${projetId}`, "layout");
};

const NON_ENREGISTRE = "Cela n’a pas pu être enregistré. Réessayez.";

/** « Nous retenons… » : le texte d'une rubrique, enregistré sans rien exiger des autres (F02-AC07). */
export async function ecrireRubrique(projetId: string, rubrique: RubriqueTexte, texte: string): Promise<Fait> {
  const e = await exigerEnseignant();
  if (!estUuid(projetId) || !["univers", "personnages", "enjeu"].includes(rubrique)) return echec("Rubrique inconnue.");
  const { data, error } = await e.supabase.from("preparations").update({ [rubrique]: texteLong(texte, 6000) }).eq("projet_id", projetId).select("projet_id");
  if (error || !data?.length) return echec(NON_ENREGISTRE);
  rafraichir(projetId);
  return { ok: true };
}

/** Une piste évoquée par la classe, notée par l'enseignant : « à discuter » tant qu'elle n'est ni retenue ni écartée. */
export async function ajouterPiste(projetId: string, rubrique: string, texte: string): Promise<Fait<{ id: string }>> {
  const e = await exigerEnseignant();
  const propre = ligne(texte, 200);
  if (!estUuid(projetId) || !estRubrique(rubrique)) return echec("Rubrique inconnue.");
  if (!propre) return echec("Écrivez l’idée à noter.");
  const { data, error } = await e.supabase.from("pistes").insert({ projet_id: projetId, enseignant_id: e.id, rubrique, texte: propre }).select("id").single();
  if (error || !data) return echec(NON_ENREGISTRE);
  rafraichir(projetId);
  return { ok: true, id: data.id };
}

/** Le statut d'une piste : retenue, à discuter, écartée. Une piste écartée reste dans le carnet (F02-AC17). */
export async function changerPiste(pisteId: string, etat: EtatPiste): Promise<Fait> {
  const e = await exigerEnseignant();
  if (!estUuid(pisteId) || !(ETATS_PISTE as readonly string[]).includes(etat)) return echec("Piste inconnue.");
  const { data, error } = await e.supabase.from("pistes").update({ etat }).eq("id", pisteId).select("projet_id");
  if (error || !data?.length) return echec(NON_ENREGISTRE);
  rafraichir(data[0].projet_id);
  return { ok: true };
}

export async function supprimerPiste(pisteId: string): Promise<Fait> {
  const e = await exigerEnseignant();
  if (!estUuid(pisteId)) return echec("Piste inconnue.");
  const { data, error } = await e.supabase.from("pistes").delete().eq("id", pisteId).select("projet_id");
  if (error || !data?.length) return echec(NON_ENREGISTRE);
  rafraichir(data[0].projet_id);
  return { ok: true };
}

/** La rubrique facultative « Objets et formules » s'ajoute au carnet, et se retire tant qu'elle est vide. */
export async function activerRubriqueJeu(projetId: string, active: boolean): Promise<Fait> {
  const e = await exigerEnseignant();
  if (!estUuid(projetId)) return echec("Projet inconnu.");
  const { data, error } = await e.supabase.from("preparations").update({ rubrique_jeu: active === true }).eq("projet_id", projetId).select("projet_id");
  if (error || !data?.length) return echec(NON_ENREGISTRE);
  rafraichir(projetId);
  return { ok: true };
}

/** Un objet de l'histoire : son nom, tel qu'il s'écrit dans une phrase, et sa description (F04.2). */
export async function enregistrerObjet(projetId: string, objetId: string | null, nom: string, description: string): Promise<Fait> {
  const e = await exigerEnseignant();
  const nomPropre = ligne(nom, 60);
  if (!estUuid(projetId) || (objetId !== null && !estUuid(objetId))) return echec("Objet inconnu.");
  if (!nomPropre) return echec("Écrivez le nom de l’objet, avec son article.");
  const valeurs = { nom: nomPropre, description: ligne(description, 120) };
  const { data, error } = objetId
    ? await e.supabase.from("objets").update(valeurs).eq("id", objetId).eq("projet_id", projetId).select("id")
    : await e.supabase.from("objets").insert({ ...valeurs, projet_id: projetId, enseignant_id: e.id }).select("id");
  if (error || !data?.length) return echec(NON_ENREGISTRE);
  rafraichir(projetId);
  return { ok: true };
}

export async function supprimerObjet(projetId: string, objetId: string): Promise<Fait> {
  const e = await exigerEnseignant();
  if (!estUuid(projetId) || !estUuid(objetId)) return echec("Objet inconnu.");
  const { error } = await e.supabase.from("objets").delete().eq("id", objetId).eq("projet_id", projetId);
  if (error) return echec(NON_ENREGISTRE);
  rafraichir(projetId);
  return { ok: true };
}

/** Une formule d'action : une demande au lecteur qui revient souvent (F04.2). */
export async function enregistrerFormule(projetId: string, formuleId: string | null, texte: string): Promise<Fait> {
  const e = await exigerEnseignant();
  const propre = ligne(texte, 140);
  if (!estUuid(projetId) || (formuleId !== null && !estUuid(formuleId))) return echec("Formule inconnue.");
  if (!propre) return echec("Écrivez la formule.");
  const { data, error } = formuleId
    ? await e.supabase.from("formules").update({ texte: propre }).eq("id", formuleId).eq("projet_id", projetId).select("id")
    : await e.supabase.from("formules").insert({ texte: propre, projet_id: projetId, enseignant_id: e.id }).select("id");
  if (error || !data?.length) return echec(NON_ENREGISTRE);
  rafraichir(projetId);
  return { ok: true };
}

export async function supprimerFormule(projetId: string, formuleId: string): Promise<Fait> {
  const e = await exigerEnseignant();
  if (!estUuid(projetId) || !estUuid(formuleId)) return echec("Formule inconnue.");
  const { error } = await e.supabase.from("formules").delete().eq("id", formuleId).eq("projet_id", projetId);
  if (error) return echec(NON_ENREGISTRE);
  rafraichir(projetId);
  return { ok: true };
}

/** La feuille d'aventure du lecteur, ses sections et son dé ; les règles du jeu (F04.2). */
export async function reglerJeu(projetId: string, valeurs: { feuille?: Feuille; regles?: string }): Promise<Fait> {
  const e = await exigerEnseignant();
  if (!estUuid(projetId)) return echec("Projet inconnu.");
  const maj: Record<string, unknown> = {};
  if (valeurs.feuille !== undefined) maj.feuille = feuillePropre(valeurs.feuille);
  if (valeurs.regles !== undefined) maj.regles = texteLong(valeurs.regles, 6000);
  if (Object.keys(maj).length === 0) return { ok: true };
  const { data, error } = await e.supabase.from("preparations").update(maj).eq("projet_id", projetId).select("projet_id");
  if (error || !data?.length) return echec(NON_ENREGISTRE);
  rafraichir(projetId);
  return { ok: true };
}

/** Phrases de choix : formule de renvoi, constructions proposées, marque de fin (F05, F11.5). */
export async function reglerPhrases(projetId: string, valeurs: { formuleRenvoi?: string; constructions?: string[]; marqueFin?: string }): Promise<Fait> {
  const e = await exigerEnseignant();
  if (!estUuid(projetId)) return echec("Projet inconnu.");
  const maj: Record<string, unknown> = {};
  if (valeurs.formuleRenvoi !== undefined) {
    if (!estFormuleRenvoi(valeurs.formuleRenvoi)) return echec("Formule inconnue.");
    maj.formule_renvoi = valeurs.formuleRenvoi;
  }
  if (valeurs.constructions !== undefined) {
    const choisies = [...new Set(valeurs.constructions.filter(estConstruction))] as Construction[];
    // La première construction reste toujours disponible (F05)
    maj.constructions = choisies.includes("neutre") ? choisies : ["neutre", ...choisies];
  }
  if (valeurs.marqueFin !== undefined) maj.marque_fin = ligne(valeurs.marqueFin, 40);
  if (Object.keys(maj).length === 0) return { ok: true };
  const { data, error } = await e.supabase.from("preparations").update(maj).eq("projet_id", projetId).select("projet_id");
  if (error || !data?.length) return echec(NON_ENREGISTRE);
  rafraichir(projetId);
  return { ok: true };
}
