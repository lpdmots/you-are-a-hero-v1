import "server-only";
import { createHash } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Enseignant } from "./adulte";
import { empreinteDuPoste } from "./poste";
import { estUuid } from "./recit";
import { clientService } from "./supabase";
import {
  ciblesDe, controlerTexte, enMots, estAuto, estRenvoi, nettoyerTexte, renvoisDe, type Droits, type Enregistrement, type Motif, type Texte,
} from "@/domaine/copie";
import { melangeInitial, numeroter, type Numeros, type PlanNumerote } from "@/domaine/numeros";

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

/** Une identité tirée d'une autre, toujours la même pour une scène donnée : le texte ne change pas d'un enregistrement à l'autre. */
const identiteDerivee = (id: string, sceneId: string): string => {
  const h = createHash("sha256").update(`${sceneId}:${id}`).digest("hex");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-8${h.slice(17, 20)}-${h.slice(20, 32)}`;
};

/**
 * Un même choix ne figure jamais dans deux scènes (F05.2). Coupé ici, collé ailleurs, puis
 * le couper annulé : le choix revenu porte une identité déjà prise par l'autre scène. Il
 * devient alors un autre choix, de même contenu.
 */
export async function sansIdentitePrise(base: SupabaseClient, sceneId: string, texte: Texte): Promise<Texte> {
  const ids = texte.flatMap((b) => renvoisDe(b).map((r) => r.id));
  if (ids.length === 0) return texte;
  const { data, error } = await base.from("liens").select("renvoi_id").in("renvoi_id", ids).neq("scene_id", sceneId);
  if (error) throw new Error(`Enregistrement impossible : ${error.message}`);
  const prises = new Set(((data ?? []) as { renvoi_id: string }[]).map((l) => l.renvoi_id));
  if (prises.size === 0) return texte;
  return texte.map((b) => {
    if (b.type !== "choix") return b;
    if (estAuto(b)) return prises.has(b.id) ? { ...b, id: identiteDerivee(b.id, sceneId) } : b;
    return { ...b, children: b.children.map((x) => (estRenvoi(x) && prises.has(x.id) ? { ...x, id: identiteDerivee(x.id, sceneId) } : x)) };
  });
}

/** L'adulte enregistre le texte d'une de ses scènes. */
export async function enregistrerPourAdulte(e: Enseignant, sceneId: string, version: number, brut: unknown): Promise<Enregistrement> {
  const propre = nettoyerTexte(brut);
  if (!estUuid(sceneId) || !Number.isInteger(version) || !propre) return { etat: "refuse", motif: "controle" };
  const texte = await sansIdentitePrise(e.supabase, sceneId, propre);
  const { data, error } = await e.supabase.rpc("enregistrer_texte", { p_scene: sceneId, p_version: version, p_texte: texte });
  if (error) throw new Error(`Enregistrement impossible : ${error.message}`);
  const fait = resultat(data);
  // Un premier renvoi vient d'être enregistré : son numéro doit s'afficher, l'ordre du livre s'établit (F05-AC34)
  if (fait.etat === "enregistre" && ciblesDe(texte).length) await assurerOrdreDeLaScene(e.supabase, sceneId);
  return fait;
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
  const propre = nettoyerTexte(brut);
  // Un texte que l'application ne reconnaît pas n'entre pas dans la scène ; rien ne s'en garde
  if (!propre) return { etat: "refuse", motif: "controle" };
  const texte = await sansIdentitePrise(service, (ouverte as { scene: string }).scene, propre);
  // Ce que l'élève a le droit de changer se contrôle ici, sur le texte enregistré : choix,
  // raccords, blocs préparés (F05-AC32, F06-AC13). Un texte refusé est gardé à part (F08.2).
  const o = ouverte as { scene: string; texte: Texte; profil: "propositions" | "organisation" | null; scenes_du_chapitre: string[] };
  const droits: Droits = { role: "eleve", profil: o.profil ?? "propositions", scenesDuChapitre: new Set(o.scenes_du_chapitre ?? []) };
  const refus = controlerTexte(vuParUnEleve(o.texte ?? []), texte, droits);
  const { data, error } = await service.rpc("ecriture_enregistrer", {
    p_ecriture: ecritureId, p_jeton_hash: jeton, p_version: version, p_texte: texte, p_refus: refus ? "controle" : null,
  });
  if (error) throw new Error(`Enregistrement impossible : ${error.message}`);
  const fait = resultat(data);
  if (fait.etat === "enregistre" && ciblesDe(texte).length) await assurerOrdreDeLaScene(service, o.scene);
  return fait;
}

/** Le texte tel qu'un élève le reçoit : sans les notes de l'enseignant, que la base ne lui envoie pas. */
export const vuParUnEleve = (texte: Texte): Texte => texte.filter((b) => (b as { type: string }).type !== "note");

// ——— Ordre du livre et numéros (F11.5) ———

type LigneOrdre = { id: string; chapitre_id: string; hors_livre: boolean; rang: number; rang_livre: number | null; numero_fixe: number | null; cree_le: string };

/** La structure que lit la numérotation, pour l'adulte ou pour le serveur. */
async function structure(base: SupabaseClient, projetId: string): Promise<{ plan: PlanNumerote; etabli: boolean; aChoix: boolean } | null> {
  const [projet, parties, chapitres, scenes] = await Promise.all([
    base.from("projets").select("recit, depart_scene_id, ordre_etabli_le").eq("id", projetId).maybeSingle(),
    base.from("parties").select("id, rang, cree_le, groupe_avec_precedente, ouverture_scene_id").eq("projet_id", projetId).is("supprime_le", null),
    base.from("chapitres").select("id, partie_id, rang, cree_le, hors_livre").eq("projet_id", projetId).is("supprime_le", null),
    base.from("scenes").select("id, chapitre_id, hors_livre, rang, rang_livre, numero_fixe, cree_le").eq("projet_id", projetId).is("supprime_le", null),
  ]);
  const erreur = projet.error ?? parties.error ?? chapitres.error ?? scenes.error;
  if (erreur) throw new Error(`Ordre du livre illisible : ${erreur.message}`);
  if (!projet.data) return null;
  const parRang = <T extends { rang: number; cree_le: string }>(a: T, b: T) => a.rang - b.rang || a.cree_le.localeCompare(b.cree_le);
  const lesScenes = ((scenes.data ?? []) as LigneOrdre[]).sort(parRang);
  const lesChapitres = ((chapitres.data ?? []) as { id: string; partie_id: string; rang: number; cree_le: string; hors_livre: boolean }[]).sort(parRang);
  const lesParties = ((parties.data ?? []) as { id: string; rang: number; cree_le: string; groupe_avec_precedente: boolean; ouverture_scene_id: string | null }[]).sort(parRang);
  return {
    etabli: projet.data.ordre_etabli_le !== null,
    aChoix: projet.data.recit === "choix",
    plan: {
      departSceneId: projet.data.depart_scene_id as string | null,
      parties: lesParties.map((p) => ({
        id: p.id, groupeAvecPrecedente: p.groupe_avec_precedente, ouvertureSceneId: p.ouverture_scene_id,
        chapitres: lesChapitres.filter((c) => c.partie_id === p.id).map((c) => ({
          horsLivre: c.hors_livre,
          scenes: lesScenes.filter((s) => s.chapitre_id === c.id).map((s) => ({ id: s.id, horsLivre: s.hors_livre, rangLivre: s.rang_livre, numeroFixe: s.numero_fixe })),
        })),
      })),
    },
  };
}

/**
 * Établit l'ordre du livre s'il ne l'est pas encore : les scènes de chaque partie sont
 * mélangées, une fois, puis l'ordre est gardé (F11-AC16, AC19). Les destinations d'un même
 * choix ne sont pas mises côte à côte, autant que possible.
 */
export async function assurerOrdre(base: SupabaseClient, projetId: string): Promise<void> {
  const lu = await structure(base, projetId);
  if (!lu || lu.etabli || !lu.aChoix) return;
  const { data: liens } = await base.from("liens").select("scene_id, cible_id").eq("projet_id", projetId);
  const parOrigine = new Map<string, string[]>();
  for (const l of (liens ?? []) as { scene_id: string; cible_id: string | null }[]) {
    if (l.cible_id) parOrigine.set(l.scene_id, [...(parOrigine.get(l.scene_id) ?? []), l.cible_id]);
  }
  const rangs = melangeInitial(lu.plan, [...parOrigine.values()]);
  const { error } = await base.rpc("etablir_ordre", { p_projet: projetId, p_rangs: Object.fromEntries(rangs) });
  if (error) throw new Error(`L'ordre du livre n'a pas pu être établi : ${error.message}`);
}

async function assurerOrdreDeLaScene(base: SupabaseClient, sceneId: string): Promise<void> {
  const { data } = await base.from("scenes").select("projet_id").eq("id", sceneId).maybeSingle();
  if (data?.projet_id) await assurerOrdre(base, data.projet_id as string);
}

/** Les numéros du livre, relus dans la base. */
export async function numerosDuProjet(base: SupabaseClient, projetId: string): Promise<Numeros | null> {
  const lu = await structure(base, projetId);
  return lu?.aChoix ? numeroter(lu.plan) : null;
}

export type Trouvee = { id: string; extrait: string };

/**
 * Recherche d'une destination dans les textes du projet (F05-AC01) : les scènes dont le
 * texte contient tous les mots, avec le passage trouvé. Les notes de l'adulte en font partie.
 */
export async function chercherDansLesTextes(e: Enseignant, projetId: string, demande: string): Promise<Trouvee[]> {
  if (!estUuid(projetId)) return [];
  const sansAccent = (t: string) => t.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const mots = sansAccent(demande).split(/\s+/).filter(Boolean).slice(0, 8);
  if (mots.length === 0) return [];
  const { data, error } = await e.supabase.from("scenes").select("id, texte").eq("projet_id", projetId).is("supprime_le", null);
  if (error) throw new Error(`Recherche impossible : ${error.message}`);
  return ((data ?? []) as { id: string; texte: Texte }[]).flatMap((s) => {
    const clair = enMots(s.texte ?? []).replace(/\s+/g, " ");
    const cle = sansAccent(clair);
    if (!mots.every((m) => cle.includes(m))) return [];
    const ou = Math.max(0, cle.indexOf(mots[0]) - 40);
    return [{ id: s.id, extrait: `${ou > 0 ? "… " : ""}${clair.slice(ou, ou + 140).trim()}${ou + 140 < clair.length ? " …" : ""}` }];
  });
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
