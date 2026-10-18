"use server";

import { revalidatePath } from "next/cache";
import { DESCRIPTION_MAX, FICHE_MAX, ligne, lireAutresNoms, NOM_MAX, paragraphes } from "@/domaine/personnages";
import { exigerEnseignant } from "@/serveur/adulte";
import { jeterLesPropositions, type SorteDeCarte } from "@/serveur/personnages";
import { estUuid } from "@/serveur/recit";

/**
 * Les cartes des personnages de l'histoire, et les fiches et images de référence des objets
 * (F10.2, F02, F04.2). L'adulte seul les écrit : la base ne donne aucun droit sur ces tables à un
 * poste d'élève, qui ne reçoit que les noms, pour `/personnage`.
 */

type Echec = { ok: false; erreur: string };
type Fait<T = object> = ({ ok: true } & T) | Echec;
const echec = (erreur: string): Echec => ({ ok: false, erreur });
const NON_ENREGISTRE = "Cela n’a pas pu être enregistré. Réessayez.";
const rafraichir = (projetId: string) => {
  revalidatePath(`/projet/${projetId}`, "layout");
  revalidatePath(`/atelier/${projetId}`, "layout");
};

export type CarteSaisie = { nom: string; autresNoms?: string | string[]; heros?: boolean; description?: string; fiche?: string };

function valeursDe(c: CarteSaisie): { nom: string; autres_noms: string[]; heros: boolean; description: string; fiche: string } | null {
  const nom = ligne(c?.nom, NOM_MAX);
  if (!nom) return null;
  return {
    nom,
    autres_noms: lireAutresNoms(c.autresNoms ?? "", nom),
    heros: c.heros === true,
    description: paragraphes(c.description, DESCRIPTION_MAX),
    fiche: paragraphes(c.fiche, FICHE_MAX),
  };
}

/**
 * Ajoute des cartes à la fin de la liste : une écrite à la main, ou celles que l'adulte coche
 * parmi les personnages repérés par l'IA (F10.2, sans rien créer d'office).
 */
export async function ajouterDesPersonnages(projetId: string, cartes: CarteSaisie[]): Promise<Fait<{ ids: string[] }>> {
  const e = await exigerEnseignant();
  if (!estUuid(projetId) || !Array.isArray(cartes) || !cartes.length || cartes.length > 20) return echec("Projet inconnu.");
  const valeurs = cartes.map(valeursDe);
  if (valeurs.some((v) => !v)) return echec("Donnez un nom à chaque personnage.");
  const { data: derniere } = await e.supabase.from("personnages").select("rang").eq("projet_id", projetId).order("rang", { ascending: false }).limit(1);
  const depart = ((derniere?.[0]?.rang as number | undefined) ?? -1) + 1;
  const { data, error } = await e.supabase
    .from("personnages")
    .insert(valeurs.map((v, i) => ({ ...v!, rang: depart + i, projet_id: projetId, enseignant_id: e.id })))
    .select("id, rang");
  if (error || !data?.length) return echec(NON_ENREGISTRE);
  rafraichir(projetId);
  return { ok: true, ids: [...data].sort((a, b) => (a.rang as number) - (b.rang as number)).map((d) => d.id as string) };
}

/** Le nom, les autres noms, la marque « héros », la description ou la fiche visuelle d'une carte. */
export async function reglerPersonnage(personnageId: string, valeurs: Partial<CarteSaisie>): Promise<Fait> {
  const e = await exigerEnseignant();
  if (!estUuid(personnageId)) return echec("Personnage inconnu.");
  const maj: Record<string, unknown> = {};
  if (valeurs.nom !== undefined) {
    const nom = ligne(valeurs.nom, NOM_MAX);
    if (!nom) return echec("Donnez un nom au personnage.");
    maj.nom = nom;
  }
  if (valeurs.autresNoms !== undefined) maj.autres_noms = lireAutresNoms(valeurs.autresNoms, typeof maj.nom === "string" ? maj.nom : "");
  if (valeurs.heros !== undefined) maj.heros = valeurs.heros === true;
  if (valeurs.description !== undefined) maj.description = paragraphes(valeurs.description, DESCRIPTION_MAX);
  if (valeurs.fiche !== undefined) maj.fiche = paragraphes(valeurs.fiche, FICHE_MAX);
  if (!Object.keys(maj).length) return { ok: true };
  const { data, error } = await e.supabase.from("personnages").update(maj).eq("id", personnageId).select("projet_id");
  if (error || !data?.length) return echec(NON_ENREGISTRE);
  rafraichir(data[0].projet_id as string);
  return { ok: true };
}

export type CarteSupprimee = CarteSaisie & { rang: number; portraitId: string | null };

/**
 * Supprime des cartes, et rend ce qu'il faut pour « Annuler » : la même carte revient à sa place,
 * avec son portrait. Le portrait reste parmi les images du projet.
 */
export async function supprimerDesPersonnages(projetId: string, ids: string[]): Promise<Fait<{ cartes: CarteSupprimee[] }>> {
  const e = await exigerEnseignant();
  if (!estUuid(projetId) || !Array.isArray(ids) || !ids.length || ids.some((i) => !estUuid(i))) return echec("Personnage inconnu.");
  const { data, error } = await e.supabase
    .from("personnages")
    .delete()
    .eq("projet_id", projetId)
    .in("id", ids)
    .select("nom, autres_noms, heros, description, fiche, rang, portrait_id");
  if (error || !data?.length) return echec(NON_ENREGISTRE);
  rafraichir(projetId);
  return {
    ok: true,
    cartes: data.map((c) => ({
      nom: c.nom as string, autresNoms: (c.autres_noms as string[]) ?? [], heros: c.heros as boolean, description: c.description as string,
      fiche: c.fiche as string, rang: c.rang as number, portraitId: (c.portrait_id as string | null) ?? null,
    })),
  };
}

/** « Annuler » une suppression : les cartes reviennent à leur rang, avec leur portrait. */
export async function remettreDesPersonnages(projetId: string, cartes: CarteSupprimee[]): Promise<Fait> {
  const e = await exigerEnseignant();
  if (!estUuid(projetId) || !Array.isArray(cartes) || !cartes.length || cartes.length > 20) return echec("Projet inconnu.");
  const lignes = cartes.map((c) => {
    const v = valeursDe(c);
    return v ? { ...v, rang: Number.isInteger(c.rang) ? c.rang : 0, portrait_id: estUuid(c.portraitId) ? c.portraitId : null, projet_id: projetId, enseignant_id: e.id } : null;
  });
  if (lignes.some((l) => !l)) return echec(NON_ENREGISTRE);
  const { error } = await e.supabase.from("personnages").insert(lignes.flatMap((l) => (l ? [l] : [])));
  if (error) return echec(NON_ENREGISTRE);
  rafraichir(projetId);
  return { ok: true };
}

/** La fiche visuelle d'un objet de l'histoire (F10.2), reprise mot pour mot dans ses images. */
export async function reglerFicheDeLObjet(objetId: string, fiche: string): Promise<Fait> {
  const e = await exigerEnseignant();
  if (!estUuid(objetId)) return echec("Objet inconnu.");
  const { data, error } = await e.supabase.from("objets").update({ fiche: paragraphes(fiche, FICHE_MAX) }).eq("id", objetId).select("projet_id");
  if (error || !data?.length) return echec(NON_ENREGISTRE);
  rafraichir(data[0].projet_id as string);
  return { ok: true };
}

/**
 * Garde l'image créée que l'adulte a choisie comme portrait de référence, ou comme image de
 * référence d'un objet ; la page l'a déposée parmi les images du projet. Les autres propositions
 * sont effacées : une image écartée n'est pas conservée (F10.1). `null` retire le portrait, sans
 * effacer l'image du projet.
 */
export async function poserLaReference(sorte: SorteDeCarte, id: string, imageId: string | null, propositions: string[] = []): Promise<Fait> {
  const e = await exigerEnseignant();
  if (!estUuid(id) || (imageId !== null && !estUuid(imageId))) return echec("Image inconnue.");
  const table = sorte === "personnage" ? "personnages" : sorte === "objet" ? "objets" : null;
  if (!table) return echec("Image inconnue.");
  const { data, error } = await e.supabase
    .from(table)
    .update(sorte === "personnage" ? { portrait_id: imageId } : { image_id: imageId })
    .eq("id", id)
    .select("projet_id");
  // La base refuse une image d'un autre projet
  if (error || !data?.length) return echec("L’image n’a pas pu être gardée.");
  const projetId = data[0].projet_id as string;
  await jeterLesPropositions(e, projetId, Array.isArray(propositions) ? propositions : []).catch(() => undefined);
  rafraichir(projetId);
  return { ok: true };
}

/** « Laisser » des images créées : elles sont effacées sans rien changer à la carte. */
export async function laisserLesPropositions(projetId: string, propositions: string[]): Promise<Fait> {
  const e = await exigerEnseignant();
  if (!estUuid(projetId) || !Array.isArray(propositions)) return echec("Projet inconnu.");
  await jeterLesPropositions(e, projetId, propositions).catch(() => undefined);
  return { ok: true };
}
