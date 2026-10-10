"use server";

import { revalidatePath } from "next/cache";
import { chapitresDe, couleurNouvelle, departDe, nomScene, TITRE_CHAPITRE, TITRE_PARTIE, COULEURS, type Profil } from "@/domaine/recit";
import { estVisuel, tirerVisuel } from "@/domaine/visuels";
import { exigerEnseignant, type Enseignant } from "@/serveur/adulte";
import { elevesDeLaClasse, estUuid, planDe } from "@/serveur/recit";

/**
 * Commandes du plan du récit (F03.1, F03.2, F06.1, F10.1). Chacune revérifie qui demande ;
 * la base refuse de son côté ce qui touche le récit d'un autre.
 */

type Echec = { ok: false; erreur: string };
type Fait<T = object> = ({ ok: true } & T) | Echec;
const echec = (erreur: string): Echec => ({ ok: false, erreur });
const propre = (texte: unknown, max: number): string => String(texte ?? "").trim().replace(/\s+/g, " ").slice(0, max);
const texteLong = (texte: unknown, max: number): string => String(texte ?? "").replace(/\r\n/g, "\n").trim().slice(0, max);

// La base écrit ses refus en français pour la personne (codes P0001 à P0003) ; les autres ne se montrent pas.
const refus = (erreur: { code?: string; message: string } | null, parDefaut: string): Echec =>
  echec(erreur?.code && /^P000\d$/.test(erreur.code) ? erreur.message : parDefaut);

const rafraichir = (projetId: string) => {
  revalidatePath(`/projet/${projetId}`, "layout");
  revalidatePath(`/atelier/${projetId}`, "layout");
};

type Sorte = "partie" | "chapitre" | "scene";
const TABLE: Record<Sorte, "parties" | "chapitres" | "scenes"> = { partie: "parties", chapitre: "chapitres", scene: "scenes" };
const estSorte = (v: unknown): v is Sorte => v === "partie" || v === "chapitre" || v === "scene";

async function projetDeLElement(e: Enseignant, sorte: Sorte, id: string): Promise<string | null> {
  if (!estUuid(id)) return null;
  const { data } = await e.supabase.from(TABLE[sorte]).select("projet_id").eq("id", id).maybeSingle();
  return (data?.projet_id as string | undefined) ?? null;
}

/** Une partie se crée à la fin du plan, avec son premier chapitre vide (F03-AC10). */
export async function creerPartie(projetId: string, titre?: string): Promise<Fait<{ partieId: string; chapitreId: string }>> {
  const e = await exigerEnseignant();
  if (!estUuid(projetId)) return echec("Projet inconnu.");
  // Depuis la préparation, la partie retenue arrive avec son titre (F02-AC08)
  const titrePartie = titre === undefined ? TITRE_PARTIE : propre(titre, 120);
  if (!titrePartie) return echec("Donnez un titre à la partie.");
  const plan = await planDe(e, projetId);
  const graine = `${projetId}:${plan.parties.length}:${plan.corbeille.length}`;
  const visuelPartie = tirerVisuel(`p:${graine}`, plan.parties.map((p) => p.visuelDefaut));
  const { data, error } = await e.supabase.rpc("creer_partie", {
    p_projet: projetId, p_titre: titrePartie, p_visuel: visuelPartie, p_titre_chapitre: TITRE_CHAPITRE,
    p_couleur: couleurNouvelle(chapitresDe(plan).map((c) => c.couleur)), p_visuel_chapitre: tirerVisuel(`c:${graine}`, [visuelPartie]),
  });
  const ligne = (Array.isArray(data) ? data[0] : data) as { partie_id: string; chapitre_id: string } | null;
  if (error || !ligne) return refus(error, "La partie n’a pas pu être ajoutée. Réessayez.");
  rafraichir(projetId);
  return { ok: true, partieId: ligne.partie_id, chapitreId: ligne.chapitre_id };
}

/** Un chapitre se crée à la fin de sa partie, sans scène ni élève (F03-AC11). */
export async function creerChapitre(partieId: string): Promise<Fait<{ id: string }>> {
  const e = await exigerEnseignant();
  const projetId = await projetDeLElement(e, "partie", partieId);
  if (!projetId) return echec("Partie inconnue.");
  const plan = await planDe(e, projetId);
  const partie = plan.parties.find((p) => p.id === partieId);
  if (!partie) return echec("Partie inconnue.");
  // Le visuel par défaut évite ceux de la partie et de ses autres chapitres (F10.1)
  const visuel = tirerVisuel(`c:${partieId}:${partie.chapitres.length}:${plan.corbeille.length}`, [partie.visuelDefaut, ...partie.chapitres.map((c) => c.visuelDefaut)]);
  const { data, error } = await e.supabase.rpc("creer_chapitre", {
    p_partie: partieId, p_titre: TITRE_CHAPITRE, p_couleur: couleurNouvelle(chapitresDe(plan).map((c) => c.couleur)), p_visuel: visuel,
  });
  if (error || !data) return refus(error, "Le chapitre n’a pas pu être ajouté. Réessayez.");
  rafraichir(projetId);
  return { ok: true, id: data as string };
}

/** « Ajouter une scène » : une scène vide, à la fin du chapitre, munie de sa référence (F03-AC16). */
export async function creerScene(chapitreId: string): Promise<Fait<{ id: string; reference: number }>> {
  const e = await exigerEnseignant();
  const projetId = await projetDeLElement(e, "chapitre", chapitreId);
  if (!projetId) return echec("Chapitre inconnu.");
  const { data, error } = await e.supabase.rpc("creer_scene", { p_chapitre: chapitreId });
  const ligne = (Array.isArray(data) ? data[0] : data) as { scene_id: string; reference: number } | null;
  if (error || !ligne) return refus(error, "La scène n’a pas pu être ajoutée. Réessayez.");
  rafraichir(projetId);
  return { ok: true, id: ligne.scene_id, reference: ligne.reference };
}

/** Réglages d'une partie : son titre (F03.1). */
export async function reglerPartie(partieId: string, valeurs: { titre: string }): Promise<Fait> {
  const e = await exigerEnseignant();
  const titre = propre(valeurs.titre, 120);
  if (!titre) return echec("Donnez un titre à la partie.");
  if (!estUuid(partieId)) return echec("Partie inconnue.");
  const { data, error } = await e.supabase.from("parties").update({ titre }).eq("id", partieId).select("projet_id");
  if (error || !data?.length) return echec("Le titre n’a pas pu être enregistré.");
  rafraichir(data[0].projet_id);
  return { ok: true };
}

/** Réglages d'un chapitre : titre, couleur, résumé (F03.1, F02-AC14). */
export async function reglerChapitre(chapitreId: string, valeurs: { titre?: string; couleur?: number; resume?: string }): Promise<Fait> {
  const e = await exigerEnseignant();
  if (!estUuid(chapitreId)) return echec("Chapitre inconnu.");
  const maj: Record<string, unknown> = {};
  if (valeurs.titre !== undefined) {
    const titre = propre(valeurs.titre, 120);
    if (!titre) return echec("Donnez un titre au chapitre.");
    maj.titre = titre;
  }
  if (valeurs.couleur !== undefined) {
    if (!Number.isInteger(valeurs.couleur) || valeurs.couleur < 0 || valeurs.couleur >= COULEURS.length) return echec("Couleur inconnue.");
    maj.couleur = valeurs.couleur;
  }
  if (valeurs.resume !== undefined) maj.resume = texteLong(valeurs.resume, 4000);
  if (Object.keys(maj).length === 0) return { ok: true };
  const { data, error } = await e.supabase.from("chapitres").update(maj).eq("id", chapitreId).select("projet_id");
  if (error || !data?.length) return echec("Ce réglage n’a pas pu être enregistré.");
  rafraichir(data[0].projet_id);
  return { ok: true };
}

/** Titre et consigne d'une scène (F03.1, F07.1) : tous deux facultatifs. */
export async function reglerScene(sceneId: string, valeurs: { titre?: string; consigne?: string }): Promise<Fait> {
  const e = await exigerEnseignant();
  if (!estUuid(sceneId)) return echec("Scène inconnue.");
  const maj: Record<string, unknown> = {};
  if (valeurs.titre !== undefined) maj.titre = propre(valeurs.titre, 120) || null;
  if (valeurs.consigne !== undefined) maj.consigne = texteLong(valeurs.consigne, 4000);
  if (Object.keys(maj).length === 0) return { ok: true };
  const { data, error } = await e.supabase.from("scenes").update(maj).eq("id", sceneId).select("projet_id");
  if (error || !data?.length) return echec("Cela n’a pas pu être enregistré.");
  rafraichir(data[0].projet_id);
  return { ok: true };
}

/** Glisser-déposer (F03.1, 10 octobre 2026). La position se compte parmi les autres éléments. */
export async function placerPartie(partieId: string, position: number): Promise<Fait> {
  return placer("partie", partieId, (e) => e.supabase.rpc("placer_partie", { p_partie: partieId, p_position: position }), position);
}

export async function placerChapitre(chapitreId: string, partieId: string, position: number): Promise<Fait> {
  if (!estUuid(partieId)) return echec("Partie inconnue.");
  return placer("chapitre", chapitreId, (e) => e.supabase.rpc("placer_chapitre", { p_chapitre: chapitreId, p_partie: partieId, p_position: position }), position);
}

export async function placerScene(sceneId: string, position: number): Promise<Fait> {
  return placer("scene", sceneId, (e) => e.supabase.rpc("placer_scene", { p_scene: sceneId, p_position: position }), position);
}

async function placer(
  sorte: Sorte, id: string, appel: (e: Enseignant) => PromiseLike<{ error: { code?: string; message: string } | null }>, position: number,
): Promise<Fait> {
  const e = await exigerEnseignant();
  if (!Number.isInteger(position) || position < 0 || position > 10000) return echec("Position inconnue.");
  const projetId = await projetDeLElement(e, sorte, id);
  if (!projetId) return echec("Élément inconnu.");
  const { error } = await appel(e);
  if (error) return refus(error, "Le déplacement n’a pas pu être enregistré.");
  rafraichir(projetId);
  return { ok: true };
}

/** « Supprimer » : l'élément va dans la corbeille du projet (F03-AC22). */
export async function supprimer(sorte: Sorte, id: string): Promise<Fait> {
  const e = await exigerEnseignant();
  if (!estSorte(sorte)) return echec("Élément inconnu.");
  const projetId = await projetDeLElement(e, sorte, id);
  if (!projetId) return echec("Élément inconnu.");
  const { error } = await e.supabase.rpc("supprimer_element", { p_sorte: sorte, p_id: id });
  if (error) return refus(error, "La suppression n’a pas pu être faite. Réessayez.");
  rafraichir(projetId);
  return { ok: true };
}

/** « Restaurer » : l'élément revient à sa place, avec ses élèves et ses liens (F03-AC27). */
export async function restaurer(sorte: Sorte, id: string): Promise<Fait<{ eleves: number }>> {
  const e = await exigerEnseignant();
  if (!estSorte(sorte)) return echec("Élément inconnu.");
  const projetId = await projetDeLElement(e, sorte, id);
  if (!projetId) return echec("Élément inconnu.");
  const { error } = await e.supabase.rpc("restaurer_element", { p_sorte: sorte, p_id: id });
  if (error) return refus(error, "La restauration n’a pas pu être faite. Réessayez.");
  rafraichir(projetId);
  // Les élèves qui retrouvent l'élément : ceux qui y sont attribués et encore inscrits
  let eleves = 0;
  if (sorte !== "scene") {
    const plan = await planDe(e, projetId);
    const chapitres = chapitresDe(plan).filter((c) => (sorte === "chapitre" ? c.id === id : c.partieId === id));
    const { data: projet } = await e.supabase.from("projets").select("classe_id").eq("id", projetId).maybeSingle();
    const inscrits = new Set((await elevesDeLaClasse(e, (projet?.classe_id as string | null) ?? null)).map((x) => x.id));
    eleves = new Set(chapitres.flatMap((c) => c.attributions.map((a) => a.eleveId)).filter((x) => inscrits.has(x))).size;
  }
  return { ok: true, eleves };
}

/**
 * « Départ du livre » (F03.2) : un seul départ, celui qu'on désigne remplace l'ancien.
 * Rend le nom du départ remplacé, pour que le message le dise et qu'« Annuler » le remette.
 */
export async function designerDepart(projetId: string, sceneId: string | null): Promise<Fait<{ ancien: { id: string; nom: string } | null }>> {
  const e = await exigerEnseignant();
  if (!estUuid(projetId) || (sceneId !== null && !estUuid(sceneId))) return echec("Scène inconnue.");
  const ancien = departDe(await planDe(e, projetId));
  const { data, error } = await e.supabase.from("projets").update({ depart_scene_id: sceneId }).eq("id", projetId).select("id");
  if (error || !data?.length) return refus(error, "Le départ n’a pas pu être changé.");
  rafraichir(projetId);
  return { ok: true, ancien: ancien ? { id: ancien.id, nom: nomScene(ancien) } : null };
}

/** « Fin de l'histoire » : le repère se pose et se retire, plusieurs fins coexistent (F03-AC06). */
export async function marquerFin(sceneId: string, fin: boolean): Promise<Fait> {
  const e = await exigerEnseignant();
  if (!estUuid(sceneId)) return echec("Scène inconnue.");
  const { data, error } = await e.supabase.from("scenes").update({ fin: fin === true }).eq("id", sceneId).select("projet_id");
  if (error || !data?.length) return echec("Le repère de fin n’a pas pu être changé.");
  rafraichir(data[0].projet_id);
  return { ok: true };
}

/** « Exclure du livre » ou « Réintégrer dans le livre » (F11.2) : l'écriture continue. */
export async function exclureDuLivre(sorte: "chapitre" | "scene", id: string, exclu: boolean): Promise<Fait> {
  const e = await exigerEnseignant();
  if ((sorte !== "chapitre" && sorte !== "scene") || !estUuid(id)) return echec("Élément inconnu.");
  const { data, error } = await e.supabase.from(TABLE[sorte]).update({ hors_livre: exclu === true }).eq("id", id).select("projet_id");
  if (error || !data?.length) return echec("Cela n’a pas pu être enregistré.");
  rafraichir(data[0].projet_id);
  return { ok: true };
}

/** « Attribuer des élèves » : un élève coché lit et écrit dans ce chapitre, tout de suite (F06-AC18). */
export async function attribuerChapitre(chapitreId: string, eleves: { eleve: string; profil: Profil }[]): Promise<Fait> {
  const e = await exigerEnseignant();
  const projetId = await projetDeLElement(e, "chapitre", chapitreId);
  if (!projetId) return echec("Chapitre inconnu.");
  if (!Array.isArray(eleves) || eleves.some((x) => !estUuid(x?.eleve) || (x.profil !== "propositions" && x.profil !== "organisation"))) {
    return echec("Cette liste d’élèves n’a pas pu être lue.");
  }
  const { error } = await e.supabase.rpc("attribuer_chapitre", { p_chapitre: chapitreId, p_eleves: eleves.map((x) => ({ eleve: x.eleve, profil: x.profil })) });
  if (error) return refus(error, "Les élèves n’ont pas pu être attribués. Réessayez.");
  rafraichir(projetId);
  return { ok: true };
}

/** Réglages du projet : son titre, et la lecture ouverte de l'histoire aux élèves (F06-AC48). */
export async function reglerProjet(projetId: string, valeurs: { titre?: string; lectureOuverte?: boolean }): Promise<Fait> {
  const e = await exigerEnseignant();
  if (!estUuid(projetId)) return echec("Projet inconnu.");
  const maj: Record<string, unknown> = {};
  if (valeurs.titre !== undefined) {
    const titre = propre(valeurs.titre, 120);
    if (!titre) return echec("Donnez un titre à votre histoire.");
    maj.titre = titre;
  }
  if (valeurs.lectureOuverte !== undefined) maj.lecture_ouverte = valeurs.lectureOuverte === true;
  if (Object.keys(maj).length === 0) return { ok: true };
  const { data, error } = await e.supabase.from("projets").update(maj).eq("id", projetId).select("id");
  if (error || !data?.length) return echec("Ce réglage n’a pas pu être enregistré.");
  revalidatePath("/", "layout");
  return { ok: true };
}

export type ChoixRepere = { image: string } | { visuel: string } | { defaut: true };

/**
 * « Choisir une image » (F10.1) : une image du projet, un visuel proposé, ou le retour au
 * visuel par défaut. Un usage ne change pas les autres (F10-AC25).
 */
export async function choisirRepere(sorte: "projet" | "partie" | "chapitre", id: string, choix: ChoixRepere): Promise<Fait> {
  const e = await exigerEnseignant();
  if (!estUuid(id)) return echec("Élément inconnu.");
  let maj: Record<string, unknown>;
  if ("image" in choix) {
    if (!estUuid(choix.image)) return echec("Image inconnue.");
    maj = { image_id: choix.image };
  } else if ("visuel" in choix) {
    if (!estVisuel(choix.visuel)) return echec("Visuel inconnu.");
    maj = { image_id: null, visuel_choisi: choix.visuel };
  } else {
    maj = { image_id: null, visuel_choisi: null };
  }
  const table = sorte === "projet" ? "projets" : sorte === "partie" ? "parties" : sorte === "chapitre" ? "chapitres" : null;
  if (!table) return echec("Élément inconnu.");
  const colonne = sorte === "projet" ? "id" : "projet_id";
  const { data, error } = await e.supabase.from(table).update(maj).eq("id", id).select(colonne);
  // La base refuse une image d'un autre projet : elle ne se réutilise que dans le sien
  if (error || !data?.length) return echec("L’image n’a pas pu être changée.");
  revalidatePath("/", "layout");
  return { ok: true };
}
