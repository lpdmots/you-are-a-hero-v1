import "server-only";
import { randomBytes } from "node:crypto";
import type { Enseignant } from "./adulte";
import { estUuid } from "./recit";
import { empreinteDeLaVersion, empreinteDeLecture } from "./livre/contenu";
import { instantaneDuLivre, type Instantane } from "./livre/livre";
import { conditionsDuLivre, type RaisonDeRefus } from "@/domaine/livre";
import { codeDepuis, nomsPropres, NOMS_COMME_LE_LIVRE, versionDuLivre, type NomsDuPartage, type VersionPartagee } from "@/domaine/partage";

/**
 * Le partage d'un livre, côté adulte (F12.1, F12.3) : la version figée, ses deux canaux, sa
 * mise à jour, son retrait, le changement de lien et ce qu'elle montre des auteurs. Chaque
 * geste relit le livre et revérifie la règle unique sur l'instantané même qu'il fige, sans se
 * fier à ce que la page a montré ; aucun canal ne s'ouvre et rien n'est remplacé sans le
 * rappel confirmé (F12-AC17).
 */

export type Canal = "lien" | "classes";

export type PartageLu = {
  code: string;
  parLien: boolean;
  auxClasses: boolean;
  noms: NomsDuPartage;
  /** La version lisible ; rien quand le partage est retiré ou n'a jamais eu lieu */
  version: { contenu: VersionPartagee; etatDu: string; empreinte: string; empreinteLecture: string } | null;
};

type Ligne = {
  code: string; par_lien: boolean; aux_classes: boolean; noms: unknown;
  version: VersionPartagee | null; etat_du: string | null; empreinte: string | null; empreinte_lecture: string | null;
};

const lu = (l: Ligne): PartageLu => ({
  code: l.code, parLien: l.par_lien, auxClasses: l.aux_classes, noms: nomsPropres(l.noms),
  version: l.version && l.etat_du && l.empreinte && l.empreinte_lecture
    ? { contenu: l.version, etatDu: l.etat_du, empreinte: l.empreinte, empreinteLecture: l.empreinte_lecture }
    : null,
});

export async function partageDuProjet(e: Enseignant, projetId: string): Promise<PartageLu | null> {
  if (!estUuid(projetId)) return null;
  const { data, error } = await e.supabase
    .from("partages").select("code, par_lien, aux_classes, noms, version, etat_du, empreinte, empreinte_lecture").eq("projet_id", projetId).maybeSingle();
  if (error) throw new Error(`Partage illisible : ${error.message}`);
  return data ? lu(data as Ligne) : null;
}

/**
 * La version que le lecteur verrait aujourd'hui : avec les réglages des noms (pour dire si le
 * livre a changé depuis la version partagée), et sans eux (pour la comparer au PDF définitif,
 * qui imprime les noms du livre, F12-AC22).
 */
export function versionsDe(i: Instantane, noms: NomsDuPartage): { version: VersionPartagee; empreinte: string; empreinteLecture: string } {
  const version = versionDuLivre(i.livre, noms, i.chapitres);
  return { version, empreinte: empreinteDeLaVersion(version), empreinteLecture: empreinteDeLecture(i.livre, i.chapitres) };
}

/** Un nouveau code au hasard (F12.1, 16 octobre 2026). */
export const nouveauCode = (): string => codeDepuis(randomBytes(32));

/** Le compte a-t-il une classe en cours ? Sans elle, « À mes classes » n'a personne à qui ouvrir le livre (F12-AC24). */
export async function aDesClassesEnCours(e: Enseignant): Promise<boolean> {
  const { count, error } = await e.supabase.from("classes").select("id", { count: "exact", head: true }).is("terminee_le", null);
  if (error) throw new Error(`Classes illisibles : ${error.message}`);
  return (count ?? 0) > 0;
}

export type Refus = { ok: false; erreur: string; raisons?: RaisonDeRefus[] };
type Fait = { ok: true } | Refus;

/** La règle unique du partage (F11.2, F12.1), sur l'instantané même que l'on figera. */
async function livreAPartager(e: Enseignant, projetId: string): Promise<{ instantane: Instantane; raisons: RaisonDeRefus[]; aChoix: boolean } | null> {
  const [instantane, projet] = await Promise.all([
    instantaneDuLivre(e, projetId),
    e.supabase.from("projets").select("recit, mise_en_page_convient_le, imprimer_ouvert_le").eq("id", projetId).maybeSingle(),
  ]);
  if (!instantane || !projet.data) return null;
  const aChoix = projet.data.recit === "choix";
  const conditions = conditionsDuLivre(instantane.problemes, {
    aChoix, convient: Boolean(projet.data.mise_en_page_convient_le), doute: false, imprimerOuvert: Boolean(projet.data.imprimer_ouvert_le),
  });
  return { instantane, raisons: conditions.partage.raisons, aChoix };
}

const SANS_RAPPEL: Refus = { ok: false, erreur: "Confirmez d’abord le rappel avant de partager." };
const INTROUVABLE: Refus = { ok: false, erreur: "Ce projet est introuvable." };

/**
 * Ouvrir un canal (F12.1, F12.3). Sans version lisible, le livre est figé à cet instant, si la
 * règle le permet ; une version déjà lisible par l'autre canal est la même pour celui-ci, sans
 * nouvel instantané (F12-AC20). Le rappel est demandé à chaque ouverture.
 */
export async function ouvrirCanal(e: Enseignant, projetId: string, canal: Canal, rappel: boolean): Promise<Fait> {
  if (!estUuid(projetId) || (canal !== "lien" && canal !== "classes")) return INTROUVABLE;
  if (rappel !== true) return SANS_RAPPEL;
  if (canal === "classes" && !(await aDesClassesEnCours(e))) return { ok: false, erreur: "Aucune classe en cours ne peut lire ce livre." };
  const actuel = await partageDuProjet(e, projetId);
  const colonne = canal === "lien" ? "par_lien" : "aux_classes";
  if (actuel?.version) {
    const { error } = await e.supabase.from("partages").update({ [colonne]: true, modifie_le: new Date().toISOString() }).eq("projet_id", projetId);
    return error ? { ok: false, erreur: "Le partage n’a pas pu être enregistré." } : { ok: true };
  }
  return figer(e, projetId, actuel, { [colonne]: true });
}

/**
 * Mettre à jour la version partagée (F12-AC08, AC09) : la règle est revérifiée, le contenu
 * remplacé sous le même lien, pour les deux canaux ; refusée, la version précédente reste lisible.
 */
export async function mettreAJourLePartage(e: Enseignant, projetId: string, rappel: boolean): Promise<Fait> {
  if (!estUuid(projetId)) return INTROUVABLE;
  if (rappel !== true) return SANS_RAPPEL;
  const actuel = await partageDuProjet(e, projetId);
  if (!actuel?.version) return { ok: false, erreur: "Ce livre n’est pas partagé." };
  return figer(e, projetId, actuel, {});
}

async function figer(e: Enseignant, projetId: string, actuel: PartageLu | null, canaux: Partial<Record<"par_lien" | "aux_classes", boolean>>): Promise<Fait> {
  const livre = await livreAPartager(e, projetId);
  if (!livre) return INTROUVABLE;
  if (livre.raisons.length) return { ok: false, erreur: "Le partage n’est pas encore possible.", raisons: livre.raisons };
  const noms = actuel?.noms ?? NOMS_COMME_LE_LIVRE;
  const { version, empreinte, empreinteLecture } = versionsDe(livre.instantane, noms);
  const figee = { version, etat_du: livre.instantane.etatDu, empreinte, empreinte_lecture: empreinteLecture, modifie_le: new Date().toISOString(), ...canaux };
  const { error } = actuel
    ? await e.supabase.from("partages").update(figee).eq("projet_id", projetId)
    : await e.supabase.from("partages").insert({ projet_id: projetId, enseignant_id: e.id, code: nouveauCode(), noms: {}, ...figee });
  return error ? { ok: false, erreur: "Le partage n’a pas pu être enregistré." } : { ok: true };
}

/**
 * Couper un canal (F12.3) ; couper le dernier retire le partage (F12-AC03, AC10) : la version
 * figée est effacée, le code reste celui du projet, et un nouveau partage réactive le même lien.
 */
export async function couperCanal(e: Enseignant, projetId: string, canal: Canal): Promise<Fait> {
  if (!estUuid(projetId) || (canal !== "lien" && canal !== "classes")) return INTROUVABLE;
  const actuel = await partageDuProjet(e, projetId);
  if (!actuel?.version) return { ok: true };
  const parLien = canal === "lien" ? false : actuel.parLien;
  const auxClasses = canal === "classes" ? false : actuel.auxClasses;
  const retire = !parLien && !auxClasses;
  const { error } = await e.supabase.from("partages").update({
    par_lien: parLien, aux_classes: auxClasses, modifie_le: new Date().toISOString(),
    ...(retire ? { version: null, etat_du: null, empreinte: null, empreinte_lecture: null } : {}),
  }).eq("projet_id", projetId);
  return error ? { ok: false, erreur: "Le partage n’a pas pu être enregistré." } : { ok: true };
}

/** Changer de lien (F12-AC11) : un nouveau code, sans interrompre le partage ; l'ancien ne mène plus qu'à la page neutre. */
export async function changerDeLien(e: Enseignant, projetId: string): Promise<{ ok: true; code: string } | Refus> {
  if (!estUuid(projetId)) return INTROUVABLE;
  const actuel = await partageDuProjet(e, projetId);
  if (!actuel?.parLien) return { ok: false, erreur: "Le lien n’est pas ouvert." };
  const code = nouveauCode();
  const { error } = await e.supabase.from("partages").update({ code, modifie_le: new Date().toISOString() }).eq("projet_id", projetId);
  return error ? { ok: false, erreur: "Le lien n’a pas pu être changé." } : { ok: true, code };
}

/**
 * Ce que la version montre des auteurs (F12.1) : réglé avant le premier partage, ou après ; un
 * réglage changé après le partage vaut pour la prochaine mise à jour, et l'état le dit.
 */
export async function reglerNoms(e: Enseignant, projetId: string, brut: unknown): Promise<Fait> {
  if (!estUuid(projetId)) return INTROUVABLE;
  const noms = nomsPropres(brut);
  const actuel = await partageDuProjet(e, projetId);
  const { error } = actuel
    ? await e.supabase.from("partages").update({ noms }).eq("projet_id", projetId)
    : await e.supabase.from("partages").insert({ projet_id: projetId, enseignant_id: e.id, code: nouveauCode(), noms });
  return error ? { ok: false, erreur: "Le réglage n’a pas pu être enregistré." } : { ok: true };
}
