"use server";

import { estStyle, STYLE_AUTRE_MAX } from "@/domaine/illustration";
import { revalidatePath } from "next/cache";
import { chapitresDe, couleurNouvelle, departDe, nomScene, TITRE_CHAPITRE, TITRE_PARTIE, COULEURS, type Profil } from "@/domaine/recit";
import { estVisuel, tirerVisuel } from "@/domaine/visuels";
import { exigerEnseignant, type Enseignant } from "@/serveur/adulte";
import { elevesDeLaClasse, estUuid, planDe } from "@/serveur/recit";
import { numerosDuProjet } from "@/serveur/copie";

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
  const [faite] = await creerDesParties(e, projetId, plan, [{ partie: titrePartie, chapitre: TITRE_CHAPITRE, resume: "" }]);
  if (!faite.ok) return faite;
  rafraichir(projetId);
  return faite;
}

/**
 * Les parties l'une après l'autre, à la fin du plan, chacune avec son premier chapitre et son
 * résumé (F13.5). Les visuels par défaut évitent ceux qu'on vient de tirer (F10.1).
 */
async function creerDesParties(
  e: Enseignant,
  projetId: string,
  plan: Awaited<ReturnType<typeof planDe>>,
  ensembles: { partie: string; chapitre: string; resume: string }[],
): Promise<Fait<{ partieId: string; chapitreId: string }>[]> {
  const visuels = plan.parties.map((p) => p.visuelDefaut);
  const couleurs = chapitresDe(plan).map((c) => c.couleur);
  const faites: Fait<{ partieId: string; chapitreId: string }>[] = [];
  for (const [i, x] of ensembles.entries()) {
    const graine = `${projetId}:${plan.parties.length + i}:${plan.corbeille.length}`;
    const visuelPartie = tirerVisuel(`p:${graine}`, visuels);
    const couleur = couleurNouvelle(couleurs);
    const { data, error } = await e.supabase.rpc("creer_partie", {
      p_projet: projetId, p_titre: x.partie, p_visuel: visuelPartie, p_titre_chapitre: x.chapitre, p_couleur: couleur,
      p_visuel_chapitre: tirerVisuel(`c:${graine}`, [visuelPartie]),
    });
    const ligne = (Array.isArray(data) ? data[0] : data) as { partie_id: string; chapitre_id: string } | null;
    if (error || !ligne) {
      faites.push(refus(error, "La partie n’a pas pu être ajoutée. Réessayez."));
      break;
    }
    if (x.resume) {
      const { error: erreurResume } = await e.supabase.from("chapitres").update({ resume: x.resume }).eq("id", ligne.chapitre_id);
      if (erreurResume) {
        faites.push({ ok: true, partieId: ligne.partie_id, chapitreId: ligne.chapitre_id }, echec("La partie n’a pas pu être ajoutée. Réessayez."));
        break;
      }
    }
    visuels.push(visuelPartie);
    couleurs.push(couleur);
    faites.push({ ok: true, partieId: ligne.partie_id, chapitreId: ligne.chapitre_id });
  }
  return faites;
}

/**
 * « Ajouter 2 parties » (F13.5, F13-AC16) : les ensembles retenus, retouchés ou non, à la fin du
 * plan, chacun avec son premier chapitre et le résumé retenu, sans scène, choix ni élève. Si
 * l'une ne se crée pas, celles déjà créées vont à la corbeille et rien n'est ajouté.
 */
export async function ajouterDesParties(
  projetId: string,
  ensembles: { partie: string; chapitre: string; resume: string }[],
): Promise<Fait<{ parties: string[] }>> {
  const e = await exigerEnseignant();
  if (!estUuid(projetId) || !Array.isArray(ensembles) || ensembles.length === 0 || ensembles.length > 10) return echec("Rien à ajouter.");
  const propres = ensembles.map((x) => ({ partie: propre(x?.partie, 120), chapitre: propre(x?.chapitre, 120), resume: texteLong(x?.resume, 4000) }));
  if (propres.some((x) => !x.partie || !x.chapitre)) return echec("Chaque partie cochée demande un titre, et son premier chapitre aussi.");
  const plan = await planDe(e, projetId);
  const faites = await creerDesParties(e, projetId, plan, propres);
  const ratee = faites.find((f) => !f.ok);
  if (ratee && !ratee.ok) {
    for (const f of faites) if (f.ok) await e.supabase.rpc("supprimer_element", { p_sorte: "partie", p_id: f.partieId });
    rafraichir(projetId);
    return ratee;
  }
  rafraichir(projetId);
  return { ok: true, parties: faites.flatMap((f) => (f.ok ? [f.partieId] : [])) };
}

/**
 * Un chapitre se crée à la fin de sa partie, sans scène ni élève (F03-AC11). Un chapitre proposé
 * par l'IA arrive avec son titre et son résumé (F13.5).
 */
export async function creerChapitre(partieId: string, propose?: { titre: string; resume: string }): Promise<Fait<{ id: string }>> {
  const e = await exigerEnseignant();
  const projetId = await projetDeLElement(e, "partie", partieId);
  if (!projetId) return echec("Partie inconnue.");
  const titre = propose ? propre(propose.titre, 120) : TITRE_CHAPITRE;
  if (!titre) return echec("Donnez un titre au chapitre.");
  const plan = await planDe(e, projetId);
  const partie = plan.parties.find((p) => p.id === partieId);
  if (!partie) return echec("Partie inconnue.");
  // Le visuel par défaut évite ceux de la partie et de ses autres chapitres (F10.1)
  const visuel = tirerVisuel(`c:${partieId}:${partie.chapitres.length}:${plan.corbeille.length}`, [partie.visuelDefaut, ...partie.chapitres.map((c) => c.visuelDefaut)]);
  const { data, error } = await e.supabase.rpc("creer_chapitre", {
    p_partie: partieId, p_titre: titre, p_couleur: couleurNouvelle(chapitresDe(plan).map((c) => c.couleur)), p_visuel: visuel,
  });
  if (error || !data) return refus(error, "Le chapitre n’a pas pu être ajouté. Réessayez.");
  const resume = propose ? texteLong(propose.resume, 4000) : "";
  if (resume) await e.supabase.from("chapitres").update({ resume }).eq("id", data as string);
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

/**
 * « Exclure du livre » ou « Réintégrer dans le livre » (F11.2) : l'écriture continue. Une fois
 * l'ordre du livre établi, un passage réintégré sans numéro fixé prend place à la suite de son
 * groupe de mélange, et son numéro est rendu pour le dire (F11-AC32). « Annuler » une exclusion
 * qui vient d'être faite lui rend sa place (`garderLaPlace`).
 */
export async function exclureDuLivre(sorte: "chapitre" | "scene", id: string, exclu: boolean, garderLaPlace = false): Promise<Fait<{ numero?: number; aLaSuite?: boolean }>> {
  const e = await exigerEnseignant();
  if ((sorte !== "chapitre" && sorte !== "scene") || !estUuid(id)) return echec("Élément inconnu.");
  const { data, error } = await e.supabase.from(TABLE[sorte]).update({ hors_livre: exclu === true }).eq("id", id).select("projet_id");
  if (error || !data?.length) return echec("Cela n’a pas pu être enregistré.");
  const projetId = data[0].projet_id as string;
  let numero: number | undefined;
  let aLaSuite = false;
  if (!exclu && !garderLaPlace) {
    const { data: projet } = await e.supabase.from("projets").select("ordre_etabli_le").eq("id", projetId).maybeSingle();
    if (projet?.ordre_etabli_le) {
      const colonne = sorte === "scene" ? "id" : "chapitre_id";
      const [{ data: scenes }, { data: dernier }] = await Promise.all([
        e.supabase.from("scenes").select("id, numero_fixe, hors_livre").eq(colonne, id).is("supprime_le", null).order("rang"),
        e.supabase.from("scenes").select("rang_livre").eq("projet_id", projetId).not("rang_livre", "is", null).order("rang_livre", { ascending: false }).limit(1),
      ]);
      const aPlacer = ((scenes ?? []) as { id: string; numero_fixe: number | null; hors_livre: boolean }[]).filter((x) => x.numero_fixe === null && (sorte === "scene" || !x.hors_livre));
      const depart = ((dernier?.[0]?.rang_livre as number | undefined) ?? -1) + 1;
      if (aPlacer.length) {
        await e.supabase.rpc("placer_passages", { p_projet: projetId, p_rangs: Object.fromEntries(aPlacer.map((x, i) => [x.id, depart + i])) });
        aLaSuite = true;
        if (sorte === "scene") numero = (await numerosDuProjet(e.supabase, projetId))?.de.get(id);
      }
    }
  }
  rafraichir(projetId);
  return { ok: true, aLaSuite, ...(numero ? { numero } : {}) };
}

/**
 * « Qui s'en occupe » (F06.3) : l'enseignant désigne un élève du chapitre, s'attribue la
 * scène (« moi »), ou retire la prise en charge (null). Rien de ce que la scène contient
 * n'est touché (F06-AC07).
 */
export async function confierScene(sceneId: string, a: string | null): Promise<Fait> {
  const e = await exigerEnseignant();
  if (!estUuid(sceneId) || (a !== null && a !== "moi" && !estUuid(a))) return echec("Scène inconnue.");
  const { data, error } = await e.supabase
    .from("scenes")
    .update({ prise_par_enseignant: a === "moi", prise_par_eleve: a === null || a === "moi" ? null : a })
    .eq("id", sceneId)
    .select("projet_id");
  if (error || !data?.length) return refus(error, "Cela n’a pas pu être enregistré.");
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

/**
 * Réglages du projet : son titre, la lecture ouverte de l'histoire aux élèves (F06-AC48),
 * leur mise en forme (F04-AC03), le style des images et le héros absent (F10.2).
 */
export async function reglerProjet(
  projetId: string,
  valeurs: {
    titre?: string; lectureOuverte?: boolean; miseEnFormeEleves?: boolean; styleImages?: string; styleAutre?: string; herosAbsent?: boolean; consigneEcriture?: string;
  },
): Promise<Fait> {
  const e = await exigerEnseignant();
  if (!estUuid(projetId)) return echec("Projet inconnu.");
  const maj: Record<string, unknown> = {};
  if (valeurs.titre !== undefined) {
    const titre = propre(valeurs.titre, 120);
    if (!titre) return echec("Donnez un titre à votre histoire.");
    maj.titre = titre;
  }
  if (valeurs.lectureOuverte !== undefined) maj.lecture_ouverte = valeurs.lectureOuverte === true;
  if (valeurs.miseEnFormeEleves !== undefined) maj.mise_en_forme_eleves = valeurs.miseEnFormeEleves === true;
  // Le style des images et le héros absent (F10.2) : repris par toutes les images créées ensuite
  if (valeurs.styleImages !== undefined) {
    if (!estStyle(valeurs.styleImages)) return echec("Style inconnu.");
    maj.style_images = valeurs.styleImages;
  }
  if (valeurs.styleAutre !== undefined) maj.style_autre = propre(valeurs.styleAutre, STYLE_AUTRE_MAX);
  if (valeurs.herosAbsent !== undefined) maj.heros_absent = valeurs.herosAbsent === true;
  // « Pour l'IA, notre façon d'écrire » : une ligne, reprise par les aides qui écrivent (18 octobre 2026)
  if (valeurs.consigneEcriture !== undefined) maj.consigne_ecriture = propre(valeurs.consigneEcriture, 300);
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
