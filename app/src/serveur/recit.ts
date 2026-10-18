import "server-only";
import { cache } from "react";
import type { Enseignant } from "./adulte";
import { estUnPronomDuLecteur } from "@/domaine/personnages";
import type { Attribution, Chapitre, ElevePlan, Partie, Plan, Profil, Scene, Supprime } from "@/domaine/recit";
import { nomScene } from "@/domaine/recit";
import { estEtat } from "@/domaine/etats";
import {
  estConstruction, estFormuleRenvoi, estRubrique, feuillePropre, orientationsPropres, type Construction, type EtatPiste, type Preparation, signeDe,
} from "@/domaine/preparation";

/**
 * Ce que l'adulte lit de son récit. Toutes ces lectures passent par son propre accès : la
 * base ne lui rend que ses lignes.
 */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const estUuid = (v: unknown): v is string => typeof v === "string" && UUID.test(v);

type LigneScene = {
  id: string; chapitre_id: string; reference: number; titre: string | null; consigne: string; rang: number;
  fin: boolean; hors_livre: boolean; cree_par_eleve: string | null; supprime_le: string | null; cree_le: string;
  prise_par_eleve: string | null; prise_par_enseignant: boolean; texte_vide: boolean; ecrit_par: string[] | null; etat: string | null;
  rang_livre: number | null; numero_fixe: number | null; nouvelle_page: boolean;
};
type LigneChapitre = {
  id: string; partie_id: string; titre: string; rang: number; couleur: number; resume: string; image_id: string | null;
  visuel_choisi: string | null; visuel_defaut: string | null; hors_livre: boolean; supprime_le: string | null; cree_le: string;
};
type LignePartie = {
  id: string; titre: string; rang: number; image_id: string | null; visuel_choisi: string | null; visuel_defaut: string | null;
  supprime_le: string | null; cree_le: string; groupe_avec_precedente: boolean; ouverture_scene_id: string | null;
};

const parRang = <T extends { rang: number; cree_le: string }>(a: T, b: T): number => a.rang - b.rang || a.cree_le.localeCompare(b.cree_le);

const sceneDepuis = (s: LigneScene): Scene => ({
  id: s.id, chapitreId: s.chapitre_id, reference: s.reference, titre: s.titre, consigne: s.consigne, fin: s.fin,
  horsLivre: s.hors_livre, creeParEleve: s.cree_par_eleve, priseParEleve: s.prise_par_eleve, priseParEnseignant: s.prise_par_enseignant,
  ancien: null, etat: estEtat(s.etat) ? s.etat : "cours", texteVide: s.texte_vide !== false, ecritPar: s.ecrit_par ?? [],
  rangLivre: s.rang_livre ?? null, numeroFixe: s.numero_fixe ?? null, nouvellePage: s.nouvelle_page === true,
});

/** Le plan du récit et sa corbeille, lus une seule fois par page. */
export const planDe = cache(async (e: Enseignant, projetId: string): Promise<Plan> => {
  if (!estUuid(projetId)) return { parties: [], corbeille: [], departSceneId: null, liens: [] };
  const [parties, chapitres, scenes, attributions, projet, liens] = await Promise.all([
    e.supabase
      .from("parties")
      .select("id, titre, rang, image_id, visuel_choisi, visuel_defaut, supprime_le, cree_le, groupe_avec_precedente, ouverture_scene_id")
      .eq("projet_id", projetId),
    e.supabase
      .from("chapitres")
      .select("id, partie_id, titre, rang, couleur, resume, image_id, visuel_choisi, visuel_defaut, hors_livre, supprime_le, cree_le")
      .eq("projet_id", projetId),
    e.supabase
      .from("scenes")
      .select("id, chapitre_id, reference, titre, consigne, rang, fin, hors_livre, cree_par_eleve, prise_par_eleve, prise_par_enseignant, etat, texte_vide, ecrit_par, rang_livre, numero_fixe, nouvelle_page, supprime_le, cree_le")
      .eq("projet_id", projetId),
    e.supabase.from("attributions").select("chapitre_id, eleve_id, profil, cree_le").eq("projet_id", projetId).order("cree_le"),
    e.supabase.from("projets").select("depart_scene_id").eq("id", projetId).maybeSingle(),
    e.supabase.from("liens").select("scene_id, renvoi_id, cible_id, libelle, cache, rang").eq("projet_id", projetId).order("rang"),
  ]);
  const erreur = parties.error ?? chapitres.error ?? scenes.error ?? attributions.error ?? projet.error ?? liens.error;
  if (erreur) throw new Error(`Plan du récit illisible : ${erreur.message}`);

  const lesParties = ((parties.data ?? []) as LignePartie[]).sort(parRang);
  const lesChapitres = ((chapitres.data ?? []) as LigneChapitre[]).sort(parRang);
  const lesScenes = ((scenes.data ?? []) as LigneScene[]).sort(parRang);
  const partieDe = new Map(lesParties.map((p) => [p.id, p]));
  const chapitreDe = new Map(lesChapitres.map((c) => [c.id, c]));

  const attribuesA = new Map<string, Attribution[]>();
  for (const a of (attributions.data ?? []) as { chapitre_id: string; eleve_id: string; profil: Profil }[]) {
    attribuesA.set(a.chapitre_id, [...(attribuesA.get(a.chapitre_id) ?? []), { eleveId: a.eleve_id, profil: a.profil }]);
  }

  // Les élèves indiqués sur une scène sans plus être de son chapitre : leur prénom se relit à part
  const partis = [
    ...new Set(
      lesScenes.flatMap((s) =>
        s.prise_par_eleve && s.supprime_le === null && !(attribuesA.get(s.chapitre_id) ?? []).some((a) => a.eleveId === s.prise_par_eleve) ? [s.prise_par_eleve] : [],
      ),
    ),
  ];
  const anciens = new Map<string, ElevePlan>();
  if (partis.length) {
    const { data: lus, error: illisible } = await e.supabase.from("eleves").select("id, prenom, nom, couleur").in("id", partis);
    if (illisible) throw new Error(`Plan du récit illisible : ${illisible.message}`);
    for (const eleve of (lus ?? []) as ElevePlan[]) anciens.set(eleve.id, eleve);
  }
  const avecAncien = (s: LigneScene): Scene => ({ ...sceneDepuis(s), ancien: (s.prise_par_eleve && anciens.get(s.prise_par_eleve)) || null });

  const plan: Partie[] = lesParties
    .filter((p) => p.supprime_le === null)
    .map((p) => ({
      id: p.id, titre: p.titre, imageId: p.image_id, visuelChoisi: p.visuel_choisi, visuelDefaut: p.visuel_defaut,
      groupeAvecPrecedente: p.groupe_avec_precedente === true, ouvertureSceneId: p.ouverture_scene_id ?? null,
      chapitres: lesChapitres
        .filter((c) => c.partie_id === p.id && c.supprime_le === null)
        .map((c): Chapitre => ({
          id: c.id, partieId: c.partie_id, titre: c.titre, couleur: c.couleur, resume: c.resume, horsLivre: c.hors_livre,
          imageId: c.image_id, visuelChoisi: c.visuel_choisi, visuelDefaut: c.visuel_defaut,
          scenes: lesScenes.filter((s) => s.chapitre_id === c.id && s.supprime_le === null).map(avecAncien),
          attributions: attribuesA.get(c.id) ?? [],
        })),
    }));

  // Corbeille : chaque élément supprimé, avec l'endroit où il était (F03.1)
  const corbeille: Supprime[] = [
    ...lesParties.filter((p) => p.supprime_le).map((p): Supprime => ({ sorte: "partie", id: p.id, nom: p.titre, dans: null, parentSupprime: null, supprimeLe: p.supprime_le! })),
    ...lesChapitres.filter((c) => c.supprime_le).map((c): Supprime => {
      const partie = partieDe.get(c.partie_id);
      return { sorte: "chapitre", id: c.id, nom: c.titre, dans: partie?.titre ?? null, parentSupprime: partie?.supprime_le ? partie.titre : null, supprimeLe: c.supprime_le! };
    }),
    ...lesScenes.filter((s) => s.supprime_le).map((s): Supprime => {
      const chapitre = chapitreDe.get(s.chapitre_id);
      const partie = chapitre ? partieDe.get(chapitre.partie_id) : undefined;
      const parent = chapitre?.supprime_le ? chapitre.titre : partie?.supprime_le ? partie.titre : null;
      return { sorte: "scene", id: s.id, nom: nomScene(s), dans: chapitre?.titre ?? null, parentSupprime: parent, supprimeLe: s.supprime_le! };
    }),
  ].sort((a, b) => b.supprimeLe.localeCompare(a.supprimeLe));

  return {
    parties: plan, corbeille, departSceneId: (projet.data?.depart_scene_id as string | null) ?? null,
    liens: ((liens.data ?? []) as { scene_id: string; renvoi_id: string; cible_id: string | null; libelle: string; cache: boolean }[]).map((l) => ({
      sceneId: l.scene_id, renvoiId: l.renvoi_id, cibleId: l.cible_id, libelle: l.libelle, cache: l.cache,
    })),
  };
});

/** Les élèves inscrits dans la classe du projet, par prénom. */
export const elevesDeLaClasse = cache(async (e: Enseignant, classeId: string | null): Promise<ElevePlan[]> => {
  if (!classeId) return [];
  const { data, error } = await e.supabase
    .from("inscriptions")
    .select("eleves(id, prenom, nom, couleur)")
    .eq("classe_id", classeId)
    .is("retire_le", null);
  if (error) throw new Error(`Élèves de la classe illisibles : ${error.message}`);
  return ((data ?? []) as unknown as { eleves: ElevePlan | null }[])
    .flatMap((i) => (i.eleves ? [i.eleves] : []))
    .sort((a, b) => a.prenom.localeCompare(b.prenom, "fr") || (a.nom ?? "").localeCompare(b.nom ?? "", "fr"));
});

/** Images déjà importées dans le projet, les plus récentes d'abord (F10-AC05). */
export async function imagesDuProjet(e: Enseignant, projetId: string): Promise<{ id: string }[]> {
  if (!estUuid(projetId)) return [];
  const { data, error } = await e.supabase.from("images").select("id").eq("projet_id", projetId).order("cree_le", { ascending: false });
  if (error) throw new Error(`Images du projet illisibles : ${error.message}`);
  return data ?? [];
}

/** Le carnet de préparation du projet (F02). */
export const preparationDe = cache(async (e: Enseignant, projetId: string): Promise<Preparation | null> => {
  if (!estUuid(projetId)) return null;
  const [carnet, pistes, objets, formules, questions, personnages] = await Promise.all([
    e.supabase
      .from("preparations")
      .select("univers, personnages, enjeu, rubrique_jeu, feuille, regles, formule_renvoi, constructions, marque_fin, orientations")
      .eq("projet_id", projetId)
      .maybeSingle(),
    e.supabase.from("pistes").select("id, rubrique, texte, etat, origine, personnage_id").eq("projet_id", projetId).order("cree_le").order("id"),
    e.supabase.from("objets").select("id, nom, description, fiche, image_id").eq("projet_id", projetId).order("cree_le"),
    e.supabase.from("formules").select("id, texte, signe").eq("projet_id", projetId).order("cree_le"),
    e.supabase.from("questions").select("id, etape, texte, origine, personnage_id").eq("projet_id", projetId).order("cree_le").order("id"),
    e.supabase
      .from("personnages")
      .select("id, nom, autres_noms, heros, description, fiche, portrait_id")
      .eq("projet_id", projetId)
      .order("rang")
      .order("cree_le")
      .order("id"),
  ]);
  const erreur = carnet.error ?? pistes.error ?? objets.error ?? formules.error ?? questions.error ?? personnages.error;
  if (erreur) throw new Error(`Préparation illisible : ${erreur.message}`);
  const c = carnet.data;
  if (!c) return null;
  const constructions = ((c.constructions ?? []) as string[]).filter(estConstruction) as Construction[];
  return {
    univers: c.univers, personnages: c.personnages, enjeu: c.enjeu, rubriqueJeu: c.rubrique_jeu,
    feuille: feuillePropre(c.feuille), regles: c.regles,
    formuleRenvoi: estFormuleRenvoi(c.formule_renvoi) ? c.formule_renvoi : "rends",
    constructions: constructions.length ? constructions : ["neutre"],
    marqueFin: c.marque_fin,
    pistes: ((pistes.data ?? []) as { id: string; rubrique: string; texte: string; etat: EtatPiste; origine: string; personnage_id: string | null }[]).flatMap((p) =>
      estRubrique(p.rubrique)
        ? [{ id: p.id, rubrique: p.rubrique, texte: p.texte, etat: p.etat, origine: p.origine === "ia" ? ("ia" as const) : ("main" as const), personnageId: p.personnage_id }]
        : [],
    ),
    questions: ((questions.data ?? []) as { id: string; etape: string; texte: string; origine: string; personnage_id: string | null }[]).flatMap((q) =>
      estRubrique(q.etape)
        ? [{ id: q.id, etape: q.etape, texte: q.texte, origine: q.origine === "ia" ? ("ia" as const) : ("main" as const), personnageId: q.personnage_id }]
        : [],
    ),
    orientations: orientationsPropres(c.orientations),
    objets: ((objets.data ?? []) as { id: string; nom: string; description: string; fiche: string; image_id: string | null }[]).map((o) => ({
      id: o.id, nom: o.nom, description: o.description, fiche: o.fiche, imageId: o.image_id,
    })),
    formules: ((formules.data ?? []) as { id: string; texte: string; signe: string }[]).map((f) => ({ id: f.id, texte: f.texte, signe: signeDe(f) })),
    personnagesDeLHistoire: (
      (personnages.data ?? []) as { id: string; nom: string; autres_noms: string[] | null; heros: boolean; description: string; fiche: string; portrait_id: string | null }[]
    ).map((p) => ({
      // « tu » n'est jamais un autre nom (18 octobre 2026) : une carte écrite avant se lit sans lui
      id: p.id, nom: p.nom, autresNoms: (p.autres_noms ?? []).filter((n) => !estUnPronomDuLecteur(n)), heros: p.heros, description: p.description, fiche: p.fiche, portraitId: p.portrait_id,
    })),
  };
});
