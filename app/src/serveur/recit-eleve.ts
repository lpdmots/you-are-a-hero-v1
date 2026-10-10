import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import type { Eleve } from "@/domaine/eleves";
import type { Plage } from "@/domaine/horaires";
import type { Motif, Texte } from "@/domaine/copie";
import type { Profil, Repere } from "@/domaine/recit";
import { nomPourLesEleves } from "./adulte";
import { clientDuPoste, etatDuPoste, type EtatPoste } from "./poste";
import { estUuid } from "./recit";

/**
 * Ce que lit un élève depuis son poste. Toutes ces lectures passent par l'accès du poste :
 * la base ne lui rend que le récit de sa classe, les scènes de ses chapitres, et rien de
 * la préparation (F06.2, F02-AC04).
 */

export type ContexteEleve = {
  poste: EtatPoste;
  classe: { nom: string; horairesLimites: boolean };
  /** Nom que les élèves lisent : « Mme Laurent », ou « ton enseignant(e) » */
  prof: string;
  nomAffiche: string | null;
  eleves: Eleve[];
  moi: Eleve;
  ouvert: boolean;
  plages: Plage[];
};

/** L'élève identifié sur ce poste ; sinon, la page revient à l'écran qui convient. */
export const contexteEleve = cache(async (): Promise<ContexteEleve> => {
  const poste = await etatDuPoste();
  if (!poste) redirect("/classe");
  if (!poste.inscriptionId || !poste.eleveId) redirect("/classe/qui");
  const base = await clientDuPoste(poste);
  const [{ data: classe }, { data: inscriptions, error }, { data: horaires }, { data: ouvert }] = await Promise.all([
    base.from("classes").select("nom, enseignant_id, horaires_limites").eq("id", poste.classeId).maybeSingle(),
    base.from("inscriptions").select("id, eleves(id, prenom, nom, couleur)").eq("classe_id", poste.classeId),
    base.from("horaires").select("jours, de, a, rang").eq("classe_id", poste.classeId).order("rang"),
    base.rpc("travail_ouvert"),
  ]);
  if (!classe) redirect("/classe");
  if (error) throw new Error(`Liste des élèves illisible : ${error.message}`);
  const { data: enseignant } = await base.from("enseignants").select("nom_affiche").eq("id", classe.enseignant_id).maybeSingle();
  const eleves = ((inscriptions ?? []) as unknown as { eleves: Eleve | null }[]).flatMap((i) => (i.eleves ? [i.eleves] : []));
  const moi = eleves.find((e) => e.id === poste.eleveId);
  if (!moi) redirect("/classe/qui");
  return {
    poste,
    classe: { nom: classe.nom, horairesLimites: classe.horaires_limites },
    prof: nomPourLesEleves(enseignant?.nom_affiche),
    nomAffiche: enseignant?.nom_affiche ?? null,
    eleves,
    moi,
    ouvert: ouvert === true,
    plages: (horaires ?? []).map((h) => ({ jours: h.jours, de: h.de.slice(0, 5), a: h.a.slice(0, 5) })),
  };
});

export type CarteChapitre = Repere & {
  id: string; titre: string; couleur: number;
  /** Le profil de l'élève dans ce chapitre, s'il lui est attribué */
  profil: Profil | null;
  /** Ses scènes se lisent : c'est son chapitre, ou la lecture de l'histoire est ouverte */
  lisible: boolean;
};
export type HistoireEleve = Repere & {
  id: string; titre: string;
  parties: (Repere & { id: string; titre: string; chapitres: CarteChapitre[] })[];
};

type LigneCarte = { id: string; titre: string; rang: number; image_id: string | null; visuel_choisi: string | null; visuel_defaut: string | null };
const repere = (l: { image_id: string | null; visuel_choisi: string | null; visuel_defaut: string | null }): Repere => ({
  imageId: l.image_id, visuelChoisi: l.visuel_choisi, visuelDefaut: l.visuel_defaut,
});

/** Les histoires de la classe : toutes les cartes, et pour chacune ce que l'élève peut y faire (F03-AC15). */
export async function histoiresDuPoste(c: ContexteEleve): Promise<HistoireEleve[]> {
  const base = await clientDuPoste(c.poste);
  const [projets, parties, chapitres, attributions] = await Promise.all([
    base.from("projets").select("id, titre, image_id, visuel_choisi, visuel_defaut, lecture_ouverte").order("titre"),
    base.from("parties").select("id, projet_id, titre, rang, image_id, visuel_choisi, visuel_defaut").order("rang"),
    base.from("chapitres").select("id, partie_id, titre, rang, couleur, image_id, visuel_choisi, visuel_defaut").order("rang"),
    base.from("attributions").select("chapitre_id, profil").eq("eleve_id", c.moi.id),
  ]);
  const erreur = projets.error ?? parties.error ?? chapitres.error ?? attributions.error;
  if (erreur) throw new Error(`Histoires illisibles : ${erreur.message}`);
  const profilDe = new Map(((attributions.data ?? []) as { chapitre_id: string; profil: Profil }[]).map((a) => [a.chapitre_id, a.profil]));
  return ((projets.data ?? []) as (LigneCarte & { lecture_ouverte: boolean })[]).map((p) => ({
    id: p.id, titre: p.titre, ...repere(p),
    parties: ((parties.data ?? []) as (LigneCarte & { projet_id: string })[])
      .filter((pa) => pa.projet_id === p.id)
      .map((pa) => ({
        id: pa.id, titre: pa.titre, ...repere(pa),
        chapitres: ((chapitres.data ?? []) as (LigneCarte & { partie_id: string; couleur: number })[])
          .filter((ch) => ch.partie_id === pa.id)
          .map((ch) => ({
            id: ch.id, titre: ch.titre, couleur: ch.couleur, ...repere(ch),
            profil: profilDe.get(ch.id) ?? null,
            lisible: profilDe.has(ch.id) || p.lecture_ouverte,
          })),
      })),
  }));
}

export type SceneEleve = {
  id: string; reference: number; titre: string | null; consigne: string | null; creeParMoi: boolean;
  /** Qui s'occupe de la scène (F06-AC04) : l'élève lui-même, un camarade, l'enseignant, ou personne */
  prise: Prise;
  /** La scène n'a ni mot ni image : « Texte vide » */
  texteVide: boolean;
  /** Un texte de l'élève est gardé à part pour cette scène : il n'y écrit plus (F08-AC17) */
  arrete: boolean;
};
export type Prise = { par: "moi" | "enseignant" } | { par: "eleve"; eleve: Eleve } | null;
export type ChapitreEleve = Repere & {
  id: string; titre: string; couleur: number; partie: string; projetId: string;
  profil: Profil | null;
  resume: string;
  camarades: Eleve[];
  scenes: SceneEleve[];
};

/**
 * Un chapitre que l'élève peut ouvrir : le sien, avec son résumé et ses consignes, ou un
 * autre quand la lecture est ouverte, sans consigne (F06-AC48). Sinon, rien : la base ne
 * lui en rend pas les scènes (F06-AC21, F06-AC22).
 */
export async function chapitreDuPoste(c: ContexteEleve, chapitreId: string): Promise<ChapitreEleve | null> {
  if (!estUuid(chapitreId)) return null;
  const base = await clientDuPoste(c.poste);
  const { data: chapitre } = await base
    .from("chapitres")
    .select("id, partie_id, projet_id, titre, couleur, image_id, visuel_choisi, visuel_defaut")
    .eq("id", chapitreId)
    .maybeSingle();
  if (!chapitre) return null;
  const [partie, projet, attributions, scenes, consignes, resume, arrets] = await Promise.all([
    base.from("parties").select("titre").eq("id", chapitre.partie_id).maybeSingle(),
    base.from("projets").select("lecture_ouverte").eq("id", chapitre.projet_id).maybeSingle(),
    base.from("attributions").select("eleve_id, profil").eq("chapitre_id", chapitreId),
    base
      .from("scenes")
      .select("id, reference, titre, rang, cree_par_eleve, prise_par_eleve, prise_par_enseignant, texte_vide")
      .eq("chapitre_id", chapitreId)
      .order("rang"),
    base.rpc("consignes_du_chapitre", { p_chapitre: chapitreId }),
    base.rpc("resume_du_chapitre", { p_chapitre: chapitreId }),
    base.rpc("scenes_ou_je_suis_arrete", { p_chapitre: chapitreId }),
  ]);
  const arrete = new Set(((arrets.data ?? []) as unknown[]).map((x) => (typeof x === "string" ? x : String((x as { scenes_ou_je_suis_arrete?: string })?.scenes_ou_je_suis_arrete ?? ""))));
  if (scenes.error) throw new Error(`Scènes illisibles : ${scenes.error.message}`);
  const lesAttributions = (attributions.data ?? []) as { eleve_id: string; profil: Profil }[];
  const profil = lesAttributions.find((a) => a.eleve_id === c.moi.id)?.profil ?? null;
  if (!profil && projet.data?.lecture_ouverte !== true) return null;
  const consigneDe = new Map(((consignes.data ?? []) as { scene_id: string; consigne: string }[]).map((x) => [x.scene_id, x.consigne]));
  return {
    id: chapitre.id, titre: chapitre.titre, couleur: chapitre.couleur, partie: partie.data?.titre ?? "", projetId: chapitre.projet_id,
    ...repere(chapitre),
    profil,
    resume: typeof resume.data === "string" ? resume.data : "",
    camarades: c.eleves.filter((e) => lesAttributions.some((a) => a.eleve_id === e.id)),
    scenes: (
      (scenes.data ?? []) as {
        id: string; reference: number; titre: string | null; cree_par_eleve: string | null; prise_par_eleve: string | null; prise_par_enseignant: boolean;
        texte_vide: boolean;
      }[]
    ).map((s) => {
      return {
        id: s.id, reference: s.reference, titre: s.titre,
        consigne: profil ? (consigneDe.get(s.id) ?? "") : null,
        creeParMoi: s.cree_par_eleve === c.moi.id,
        prise: priseDe(c, s.prise_par_eleve, s.prise_par_enseignant),
        texteVide: s.texte_vide !== false,
        arrete: arrete.has(s.id),
      };
    }),
  };
}

const priseDe = (c: ContexteEleve, parEleve: string | null, parEnseignant: boolean): Prise => {
  if (parEnseignant) return { par: "enseignant" };
  if (parEleve === c.moi.id) return { par: "moi" };
  const camarade = c.eleves.find((e) => e.id === parEleve);
  return camarade ? { par: "eleve", eleve: camarade } : null;
};

export type SceneOuverte = {
  id: string; reference: number; titre: string | null;
  chapitre: { id: string; titre: string; couleur: number };
  /** Rien quand l'élève lit hors de son chapitre : la lecture ouverte n'ouvre pas les consignes (F06-AC48) */
  consigne: string | null;
  profil: Profil | null;
  prise: Prise;
  /** Le texte de la scène, sans les notes de l'enseignant */
  texte: Texte;
  version: number;
  vide: boolean;
  /** Gras, italique et souligné permis aux élèves de ce projet (F04-AC03) */
  marques: boolean;
  /** Pourquoi l'élève ne peut pas écrire ici ; rien s'il le peut */
  refus: Motif | null;
  /** De quoi faire accepter ses enregistrements : rien quand il lit seulement */
  ecriture: string | null;
};

/**
 * Une scène ouverte par un élève (F06-AC20, AC21). La base ne rend que ce qu'il peut lire,
 * et jamais les notes de l'enseignant, ni les textes gardés à part, ni les versions
 * précédentes (F08-AC17, AC43).
 */
export async function sceneDuPoste(c: ContexteEleve, sceneId: string): Promise<SceneOuverte | null> {
  if (!estUuid(sceneId)) return null;
  const base = await clientDuPoste(c.poste);
  const { data, error } = await base.rpc("scene_du_poste", { p_scene: sceneId });
  if (error) throw new Error(`Scène illisible : ${error.message}`);
  const s = data as {
    id: string; chapitre: string; reference: number; titre: string | null; consigne: string | null; texte: Texte; version: number; vide: boolean;
    profil: Profil | null; prise_par_eleve: string | null; prise_par_enseignant: boolean; marques: boolean | null; refus: Motif | null;
  } | null;
  if (!s) return null;
  const { data: chapitre } = await base.from("chapitres").select("id, titre, couleur").eq("id", s.chapitre).maybeSingle();
  if (!chapitre) return null;
  const prise = priseDe(c, s.prise_par_eleve, s.prise_par_enseignant);
  // La scène dont un camarade s'occupe se lit : la prendre à son nom se fera à l'étape 4 (F06.3)
  const ecrit = s.refus === null && prise?.par !== "eleve";
  let ecriture: string | null = null;
  if (ecrit) {
    const { data: ouverte, error: refusee } = await base.rpc("eleve_ouvrir_ecriture", { p_scene: sceneId });
    if (refusee) throw new Error(`Scène illisible : ${refusee.message}`);
    ecriture = typeof ouverte === "string" ? ouverte : null;
  }
  return {
    id: s.id, reference: s.reference, titre: s.titre,
    chapitre: { id: chapitre.id, titre: chapitre.titre, couleur: chapitre.couleur },
    consigne: s.consigne, profil: s.profil, prise,
    texte: s.texte ?? [], version: s.version, vide: s.vide, marques: s.marques !== false,
    refus: s.refus, ecriture,
  };
}
