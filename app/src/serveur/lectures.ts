import "server-only";
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
  "id, titre, organisation, recit, dernier_onglet, image_id, visuel_choisi, visuel_defaut, lecture_ouverte, " +
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
  };
}

export async function mesProjets(e: Enseignant): Promise<Projet[]> {
  const { data, error } = await e.supabase.from("projets").select(SELECT_PROJET).order("cree_le", { ascending: false });
  if (error) throw new Error(error.message);
  return ((data ?? []) as unknown as Record<string, unknown>[]).map(projetDepuis);
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
  projets: { id: string; titre: string; recit: Recit }[];
};

const SELECT_CLASSE =
  "id, nom, annee_debut, terminee_le, identifiant, horaires_limites, cree_le, " +
  "horaires(jours, de, a, rang), " +
  "inscriptions(id, retire_le, eleves(id, prenom, nom, couleur)), " +
  "projets(id, titre, recit, cree_le)";

type LigneClasse = {
  id: string; nom: string; annee_debut: number; terminee_le: string | null; identifiant: string; horaires_limites: boolean;
  horaires: { jours: number[]; de: string; a: string; rang: number }[];
  inscriptions: { id: string; retire_le: string | null; eleves: { id: string; prenom: string; nom: string | null; couleur: number } | null }[];
  projets: { id: string; titre: string; recit: Recit; cree_le: string }[];
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
    projets: [...(c.projets ?? [])].sort((x, y) => x.cree_le.localeCompare(y.cree_le)).map(({ id, titre, recit }) => ({ id, titre, recit })),
  };
}

export async function mesClasses(e: Enseignant): Promise<Classe[]> {
  const { data, error } = await e.supabase
    .from("classes")
    .select(SELECT_CLASSE)
    .order("annee_debut", { ascending: false })
    .order("cree_le", { ascending: false });
  if (error) throw new Error(error.message);
  return ((data ?? []) as unknown as LigneClasse[]).map(classeDepuis);
}

export const classeDe = cache(async (e: Enseignant, id: string): Promise<Classe | null> => {
  if (!UUID.test(id)) return null;
  const { data, error } = await e.supabase.from("classes").select(SELECT_CLASSE).eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return data ? classeDepuis(data as unknown as LigneClasse) : null;
});

/**
 * Profils déjà connus (F01-AC06) : les élèves des autres classes de l'enseignant qui
 * ne sont pas inscrits dans celle-ci. Un élève retiré de toutes ses classes n'est
 * plus proposé (F01-AC23) ; à l'étape 4, celui qui a écrit le restera (F01-AC22).
 */
export function profilsConnus(classe: Classe, toutes: Classe[]): ProfilConnu[] {
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
  return connus;
}
