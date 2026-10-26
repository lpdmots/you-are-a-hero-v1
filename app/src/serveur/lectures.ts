import { avancement } from "@/domaine/suivi";
import "server-only";
import { AGE_PAR_DEFAUT, estAge, type AgeDesLecteurs } from "@/domaine/aides-ia";
import { estStyle, STYLE_PAR_DEFAUT, type Style } from "@/domaine/illustration";
import { cache } from "react";
import type { Enseignant } from "./adulte";
import type { Eleve, ProfilConnu } from "@/domaine/eleves";
import type { Plage } from "@/domaine/horaires";
import type { Onglet, Organisation, Recit } from "@/domaine/projets";
import { libelleAnnee } from "@/domaine/annee";

/**
 * Ce que lit l'adulte. Toutes ces lectures passent par son propre accès : la base ne
 * lui rend que ses lignes, quelle que soit la demande.
 */

export type ClasseCourte = { id: string; nom: string; anneeDebut: number; enCours: boolean; nombreEleves: number };
export type Projet = {
  id: string;
  titre: string;
  organisation: Organisation;
  recit: Recit;
  dernierOnglet: Onglet;
  classe: ClasseCourte | null;
  /** Image de repérage (F10.1) */
  imageId: string | null;
  visuelChoisi: string | null;
  visuelDefaut: string | null;
  /** Lecture ouverte de l'histoire aux élèves (F06-AC48) */
  lectureOuverte: boolean;
  /** Gras, italique et souligné permis aux élèves (F04-AC02) */
  miseEnFormeEleves: boolean;
  /** Le style des images et le héros absent des images (F10.2) */
  styleImages: Style;
  styleAutre: string;
  herosAbsent: boolean;
  /** « Pour l'IA, notre façon d'écrire » (18 octobre 2026) */
  consigneEcriture: string;
  /** « Âge des lecteurs » (F13, 21 octobre 2026) : le public des aides IA */
  ageDesLecteurs: AgeDesLecteurs;
};

type LigneClasseCourte = { id: string; nom: string; annee_debut: number; terminee_le: string | null; inscriptions?: { retire_le: string | null }[] };
const classeCourte = (c: LigneClasseCourte | null | undefined): ClasseCourte | null =>
  c
    ? {
        id: c.id,
        nom: c.nom,
        anneeDebut: c.annee_debut,
        enCours: c.terminee_le === null,
        nombreEleves: (c.inscriptions ?? []).filter((i) => i.retire_le === null).length,
      }
    : null;

const SELECT_PROJET =
  "id, titre, organisation, recit, dernier_onglet, image_id, visuel_choisi, visuel_defaut, lecture_ouverte, mise_en_forme_eleves, style_images, style_autre, heros_absent, consigne_ecriture, age_des_lecteurs, " +
  "classes(id, nom, annee_debut, terminee_le, inscriptions(retire_le))";

function projetDepuis(l: Record<string, unknown>): Projet {
  const classe = l.classes as LigneClasseCourte | LigneClasseCourte[] | null;
  return {
    id: l.id as string,
    titre: l.titre as string,
    organisation: l.organisation as Organisation,
    recit: l.recit as Recit,
    dernierOnglet: l.dernier_onglet as Onglet,
    classe: classeCourte(Array.isArray(classe) ? classe[0] : classe),
    imageId: (l.image_id as string | null) ?? null,
    visuelChoisi: (l.visuel_choisi as string | null) ?? null,
    visuelDefaut: (l.visuel_defaut as string | null) ?? null,
    lectureOuverte: l.lecture_ouverte === true,
    miseEnFormeEleves: l.mise_en_forme_eleves !== false,
    styleImages: estStyle(l.style_images) ? l.style_images : STYLE_PAR_DEFAUT,
    styleAutre: typeof l.style_autre === "string" ? l.style_autre : "",
    herosAbsent: l.heros_absent !== false,
    consigneEcriture: typeof l.consigne_ecriture === "string" ? l.consigne_ecriture : "",
    ageDesLecteurs: estAge(l.age_des_lecteurs) ? l.age_des_lecteurs : AGE_PAR_DEFAUT,
  };
}

export async function mesProjets(e: Enseignant): Promise<Projet[]> {
  const { data, error } = await e.supabase.from("projets").select(SELECT_PROJET).order("cree_le", { ascending: false });
  if (error) throw new Error(error.message);
  return ((data ?? []) as unknown as Record<string, unknown>[]).map(projetDepuis);
}

/**
 * Ce que la carte de chaque projet dit de son avancement (F06-AC58) : les scènes à valider,
 * et la part des scènes du livre qui sont prêtes. Les scènes de la corbeille ne comptent pas.
 */
export async function avancementDesProjets(e: Enseignant): Promise<Map<string, { aValider: number; pourCent: number }>> {
  const { data, error } = await e.supabase
    .from("scenes")
    .select("projet_id, etat, hors_livre, chapitres(hors_livre, supprime_le, parties(supprime_le))")
    .is("supprime_le", null);
  if (error) throw new Error(error.message);
  const unSeul = <T,>(v: T | T[] | null | undefined): T | null => (Array.isArray(v) ? (v[0] ?? null) : (v ?? null));
  const parProjet = new Map<string, { etat: string; horsLivre: boolean }[]>();
  for (const s of (data ?? []) as unknown as { projet_id: string; etat: string; hors_livre: boolean; chapitres: unknown }[]) {
    const chapitre = unSeul(s.chapitres as { hors_livre: boolean; supprime_le: string | null; parties: unknown } | null);
    const partie = unSeul(chapitre?.parties as { supprime_le: string | null } | null);
    if (!chapitre || chapitre.supprime_le || partie?.supprime_le) continue;
    parProjet.set(s.projet_id, [...(parProjet.get(s.projet_id) ?? []), { etat: s.etat, horsLivre: s.hors_livre || chapitre.hors_livre }]);
  }
  return new Map([...parProjet].map(([id, scenes]) => [id, avancement(scenes)]));
}

const UUID = /^[0-9a-f-]{36}$/i;

/** Un projet de l'adulte ; lu une seule fois par page, quel que soit le nombre de demandes. */
export const projetDe = cache(async (e: Enseignant, id: string): Promise<Projet | null> => {
  if (!UUID.test(id)) return null;
  const { data, error } = await e.supabase.from("projets").select(SELECT_PROJET).eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return data ? projetDepuis(data as unknown as Record<string, unknown>) : null;
});

export type EleveInscrit = Eleve & { inscriptionId: string };
export type Classe = {
  id: string;
  nom: string;
  anneeDebut: number;
  enCours: boolean;
  termineeLe: string | null;
  identifiant: string;
  horairesLimites: boolean;
  plages: Plage[];
  eleves: EleveInscrit[];
  /** Les élèves retirés de la classe : leur profil reste connu s'ils ont écrit (F01-AC22) */
  retires: Eleve[];
  projets: { id: string; titre: string; recit: Recit }[];
  /** La bibliothèque dans « Lire », allumée par défaut (F15-AC20), et l'âge qu'elle montre : celui du projet le plus récent */
  bibliothequeDansLire: boolean;
  ageDeLaBibliotheque: AgeDesLecteurs;
  /** Le projet qui donne cet âge, nommé dans la fiche « Lire » */
  projetDeLAge: string | null;
};

const SELECT_CLASSE =
  "id, nom, annee_debut, terminee_le, identifiant, horaires_limites, bibliotheque_dans_lire, cree_le, " +
  "horaires(jours, de, a, rang), " +
  "inscriptions(id, retire_le, eleves(id, prenom, nom, couleur)), " +
  "projets(id, titre, recit, cree_le, age_des_lecteurs)";

type LigneClasse = {
  id: string; nom: string; annee_debut: number; terminee_le: string | null; identifiant: string; horaires_limites: boolean; bibliotheque_dans_lire: boolean;
  horaires: { jours: number[]; de: string; a: string; rang: number }[];
  inscriptions: { id: string; retire_le: string | null; eleves: { id: string; prenom: string; nom: string | null; couleur: number } | null }[];
  projets: { id: string; titre: string; recit: Recit; cree_le: string; age_des_lecteurs: AgeDesLecteurs }[];
};

function classeDepuis(c: LigneClasse): Classe {
  return {
    id: c.id,
    nom: c.nom,
    anneeDebut: c.annee_debut,
    enCours: c.terminee_le === null,
    termineeLe: c.terminee_le,
    identifiant: c.identifiant,
    horairesLimites: c.horaires_limites,
    plages: [...(c.horaires ?? [])]
      .sort((x, y) => x.rang - y.rang)
      .map((h) => ({ jours: h.jours, de: h.de.slice(0, 5), a: h.a.slice(0, 5) })),
    eleves: (c.inscriptions ?? [])
      .filter((i) => i.retire_le === null && i.eleves)
      .map((i) => ({ ...i.eleves!, inscriptionId: i.id })),
    retires: (c.inscriptions ?? []).filter((i) => i.retire_le !== null && i.eleves).map((i) => i.eleves!),
    projets: [...(c.projets ?? [])].sort((x, y) => x.cree_le.localeCompare(y.cree_le)).map(({ id, titre, recit }) => ({ id, titre, recit })),
    bibliothequeDansLire: c.bibliotheque_dans_lire !== false,
    // Comme la base : le projet le plus récent, sinon « 8 à 10 ans »
    ageDeLaBibliotheque: [...(c.projets ?? [])].sort((x, y) => y.cree_le.localeCompare(x.cree_le))[0]?.age_des_lecteurs ?? "8-10",
    projetDeLAge: [...(c.projets ?? [])].sort((x, y) => y.cree_le.localeCompare(x.cree_le))[0]?.titre ?? null,
  };
}

export async function mesClasses(e: Enseignant): Promise<Classe[]> {
  const { data, error } = await e.supabase
    .from("classes")
    .select(SELECT_CLASSE)
    // Une classe passée supprimée ne se montre plus nulle part (F14-AC27)
    .is("supprimee_le", null)
    .order("annee_debut", { ascending: false })
    .order("cree_le", { ascending: false });
  if (error) throw new Error(error.message);
  return ((data ?? []) as unknown as LigneClasse[]).map(classeDepuis);
}

export const classeDe = cache(async (e: Enseignant, id: string): Promise<Classe | null> => {
  if (!UUID.test(id)) return null;
  const { data, error } = await e.supabase.from("classes").select(SELECT_CLASSE).eq("id", id).is("supprimee_le", null).maybeSingle();
  if (error) throw new Error(error.message);
  return data ? classeDepuis(data as unknown as LigneClasse) : null;
});

/**
 * Profils déjà connus (F01-AC06) : les élèves des autres classes de l'enseignant qui
 * ne sont pas inscrits dans celle-ci, et ceux qui ont été retirés d'une classe après y
 * avoir écrit, qu'on réinscrit avec le même code (F01-AC22). Un élève inscrit par erreur,
 * retiré sans texte ni remise, n'est plus proposé (F01-AC23).
 */
export function profilsConnus(classe: Classe, toutes: Classe[], ontEcrit: ReadonlySet<string> = new Set()): ProfilConnu[] {
  const ici = new Set(classe.eleves.map((x) => x.id));
  const vus = new Set<string>();
  const connus: ProfilConnu[] = [];
  for (const autre of toutes) {
    if (autre.id === classe.id) continue;
    for (const eleve of autre.eleves) {
      if (ici.has(eleve.id) || vus.has(eleve.id)) continue;
      vus.add(eleve.id);
      connus.push({ id: eleve.id, prenom: eleve.prenom, nom: eleve.nom, couleur: eleve.couleur, de: `${autre.nom} · ${libelleAnnee(autre.anneeDebut)}` });
    }
  }
  // Retirés, de cette classe d'abord : celui qui a écrit garde son profil
  for (const autre of [classe, ...toutes.filter((c) => c.id !== classe.id)]) {
    for (const eleve of autre.retires) {
      if (ici.has(eleve.id) || vus.has(eleve.id) || !ontEcrit.has(eleve.id)) continue;
      vus.add(eleve.id);
      connus.push({ id: eleve.id, prenom: eleve.prenom, nom: eleve.nom, couleur: eleve.couleur, de: `retiré de ${autre.nom} · ${libelleAnnee(autre.anneeDebut)}` });
    }
  }
  return connus;
}

/** Parmi ces élèves, ceux qui ont enregistré ou remis un texte : leur profil reste connu après un retrait (F01-AC22). */
export async function elevesAyantEcrit(e: Enseignant, ids: string[]): Promise<Set<string>> {
  if (ids.length === 0) return new Set();
  const [ecrit, remis] = await Promise.all([
    e.supabase.from("scenes").select("ecrit_par").overlaps("ecrit_par", ids),
    e.supabase.from("remises").select("eleve_id").in("eleve_id", ids),
  ]);
  if (ecrit.error || remis.error) throw new Error((ecrit.error ?? remis.error)!.message);
  const voulus = new Set(ids);
  return new Set([
    ...((ecrit.data ?? []) as { ecrit_par: string[] | null }[]).flatMap((s) => (s.ecrit_par ?? []).filter((id) => voulus.has(id))),
    ...((remis.data ?? []) as { eleve_id: string | null }[]).flatMap((r) => (r.eleve_id ? [r.eleve_id] : [])),
  ]);
}
