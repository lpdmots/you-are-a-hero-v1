import "server-only";
import type { Enseignant } from "./adulte";
import { empreinteDuPoste } from "./poste";
import { estUuid } from "./recit";
import { clientService } from "./supabase";
import { nettoyerTexte, type Enregistrement, type Motif, type Texte } from "@/domaine/copie";

/**
 * Le texte d'une scène : ce qu'on en lit et comment il s'enregistre (F08.1, F08.2). Le
 * navigateur n'écrit jamais dans la base : le serveur nettoie ce qu'il reçoit, puis la
 * base compare les versions et écrit, d'un seul tenant.
 */

/** Copie de récupération : à l'écran, « texte gardé à part ». */
export type CopieGardee = {
  id: string;
  /** « refus » : née d'un enregistrement refusé ; « ancien » : sortie de la scène par un échange */
  sorte: "refus" | "ancien";
  /** L'élève dont c'est le texte ; personne pour l'adulte et pour un ancien texte */
  eleveId: string | null;
  gardeLe: string;
  texte: Texte;
};

export type TexteDeScene = { texte: Texte; version: number; copies: CopieGardee[] };

const resultat = (data: unknown): Enregistrement => {
  const r = (data ?? {}) as { etat?: string; version?: number; motif?: Motif; dernier?: boolean };
  if (r.etat === "enregistre" && typeof r.version === "number") return { etat: "enregistre", version: r.version, dernier: r.dernier };
  if (r.etat === "garde") return { etat: "garde", motif: r.motif ?? "conflit", version: r.version, dernier: r.dernier };
  if (r.etat === "ferme") return { etat: "ferme" };
  return { etat: "refuse", motif: r.motif, version: r.version, dernier: r.dernier };
};

/** Le texte d'une scène de l'adulte, avec ce qui est gardé à part pour elle (F08-AC06). */
export async function texteDeScene(e: Enseignant, sceneId: string): Promise<TexteDeScene | null> {
  if (!estUuid(sceneId)) return null;
  const [scene, copies] = await Promise.all([
    e.supabase.from("scenes").select("texte, version").eq("id", sceneId).maybeSingle(),
    e.supabase
      .from("copies_recuperation")
      .select("id, sorte, eleve_id, garde_le, texte")
      .eq("scene_id", sceneId)
      .is("retire_le", null)
      .order("garde_le"),
  ]);
  if (scene.error || copies.error) throw new Error(`Texte de la scène illisible : ${(scene.error ?? copies.error)!.message}`);
  if (!scene.data) return null;
  return {
    texte: (scene.data.texte ?? []) as Texte,
    version: scene.data.version as number,
    copies: ((copies.data ?? []) as { id: string; sorte: "refus" | "ancien"; eleve_id: string | null; garde_le: string; texte: Texte }[]).map((c) => ({
      id: c.id, sorte: c.sorte, eleveId: c.eleve_id, gardeLe: c.garde_le, texte: c.texte,
    })),
  };
}

/** L'adulte enregistre le texte d'une de ses scènes. */
export async function enregistrerPourAdulte(e: Enseignant, sceneId: string, version: number, brut: unknown): Promise<Enregistrement> {
  const texte = nettoyerTexte(brut);
  if (!estUuid(sceneId) || !Number.isInteger(version) || !texte) return { etat: "refuse", motif: "controle" };
  const { data, error } = await e.supabase.rpc("enregistrer_texte", { p_scene: sceneId, p_version: version, p_texte: texte });
  if (error) throw new Error(`Enregistrement impossible : ${error.message}`);
  return resultat(data);
}

/**
 * Un élève enregistre le texte d'une scène qu'il a ouverte pour écrire. Le poste est
 * reconnu par son cookie, même si l'accès vient de se fermer : le dernier enregistrement
 * est accepté une fois (F06-AC29).
 */
export async function enregistrerPourEleve(ecritureId: string, version: number, brut: unknown): Promise<Enregistrement> {
  const jeton = await empreinteDuPoste();
  if (!jeton || !estUuid(ecritureId) || !Number.isInteger(version)) return { etat: "ferme" };
  const service = clientService();
  const { data: ouverte, error: illisible } = await service.rpc("ecriture_lire", { p_ecriture: ecritureId, p_jeton_hash: jeton });
  if (illisible) throw new Error(`Enregistrement impossible : ${illisible.message}`);
  if (!ouverte) return { etat: "ferme" };
  const texte = nettoyerTexte(brut);
  // Un texte que l'application ne reconnaît pas n'entre pas dans la scène ; rien ne s'en garde
  if (!texte) return { etat: "refuse", motif: "controle" };
  const { data, error } = await service.rpc("ecriture_enregistrer", {
    p_ecriture: ecritureId, p_jeton_hash: jeton, p_version: version, p_texte: texte, p_refus: null,
  });
  if (error) throw new Error(`Enregistrement impossible : ${error.message}`);
  return resultat(data);
}

export type VersionPrecedente = {
  id: string;
  /** « avant » : gardée avant les modifications d'une personne ; « remplace » : sortie de la scène par un échange */
  sorte: "avant" | "remplace";
  eleveId: string | null;
  deLAdulte: boolean;
  jour: string;
  creeLe: string;
  texte: Texte;
};

/** Les versions précédentes d'une scène, les plus récentes d'abord (F08-AC40). L'adulte seul les lit. */
export async function versionsPrecedentes(e: Enseignant, sceneId: string): Promise<VersionPrecedente[]> {
  if (!estUuid(sceneId)) return [];
  const { data, error } = await e.supabase
    .from("versions_precedentes")
    .select("id, sorte, eleve_id, de_l_adulte, jour, cree_le, texte")
    .eq("scene_id", sceneId)
    .order("cree_le", { ascending: false });
  if (error) throw new Error(`Versions précédentes illisibles : ${error.message}`);
  return ((data ?? []) as { id: string; sorte: "avant" | "remplace"; eleve_id: string | null; de_l_adulte: boolean; jour: string; cree_le: string; texte: Texte }[]).map(
    (v) => ({ id: v.id, sorte: v.sorte, eleveId: v.eleve_id, deLAdulte: v.de_l_adulte, jour: v.jour, creeLe: v.cree_le, texte: v.texte }),
  );
}

export type RappelTextes = {
  sceneId: string; reference: number; titre: string | null; nombre: number;
  /** Le premier texte gardé à part de la scène : la ligne de rappel ouvre la scène sur son onglet */
  copieId: string;
};

/** Les scènes du plan où un texte est gardé à part : la ligne de rappel du Suivi (F08-AC11). */
export async function textesGardesDuProjet(e: Enseignant, projetId: string): Promise<RappelTextes[]> {
  if (!estUuid(projetId)) return [];
  const { data, error } = await e.supabase
    .from("copies_recuperation")
    .select("id, scene_id")
    .eq("projet_id", projetId)
    .is("retire_le", null)
    .order("garde_le");
  if (error) throw new Error(`Textes gardés à part illisibles : ${error.message}`);
  const nombres = new Map<string, number>();
  const premier = new Map<string, string>();
  for (const c of (data ?? []) as { id: string; scene_id: string }[]) {
    nombres.set(c.scene_id, (nombres.get(c.scene_id) ?? 0) + 1);
    if (!premier.has(c.scene_id)) premier.set(c.scene_id, c.id);
  }
  if (nombres.size === 0) return [];
  const { data: scenes, error: illisible } = await e.supabase
    .from("scenes")
    .select("id, reference, titre, supprime_le, chapitres(supprime_le, parties(supprime_le))")
    .in("id", [...nombres.keys()]);
  if (illisible) throw new Error(`Textes gardés à part illisibles : ${illisible.message}`);
  type Ligne = { id: string; reference: number; titre: string | null; supprime_le: string | null; chapitres: unknown };
  const unSeul = <T,>(v: T | T[] | null | undefined): T | null => (Array.isArray(v) ? (v[0] ?? null) : (v ?? null));
  return ((scenes ?? []) as Ligne[])
    .filter((s) => {
      // Une scène dans la corbeille garde son texte à part, qui revient avec elle (F08-AC36)
      const chapitre = unSeul(s.chapitres as { supprime_le: string | null; parties: unknown } | null);
      const partie = unSeul(chapitre?.parties as { supprime_le: string | null } | null);
      return !s.supprime_le && !chapitre?.supprime_le && !partie?.supprime_le;
    })
    .sort((a, b) => a.reference - b.reference)
    .map((s) => ({ sceneId: s.id, reference: s.reference, titre: s.titre, nombre: nombres.get(s.id) ?? 1, copieId: premier.get(s.id)! }));
}
