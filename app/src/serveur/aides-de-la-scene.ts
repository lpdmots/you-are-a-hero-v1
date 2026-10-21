import "server-only";
import { MESSAGES_IA } from "@/domaine/aides-ia";
import { paragraphesACorriger } from "@/domaine/correction";
import { lettresDe, sansRecit, type Texte } from "@/domaine/copie";
import type { Enseignant } from "./adulte";
import { remplacerSiInchange, type Remplacement } from "./correction";
import { texteDeScene, type TexteDeScene } from "./copie";
import { consigne as aideConsigne } from "./ia/aides/consigne";
import { ecriture as aideEcriture } from "./ia/aides/ecriture";
import { carnetDe, type Carnet, type Histoire, histoireDuProjet } from "./ia/aides/contexte";
import { titre as aideTitre } from "./ia/aides/titre";
import { demanderUneAide } from "./ia/demander";
import { projetDe } from "./lectures";
import { estUuid, preparationDe } from "./recit";

/**
 * L'aide à la consigne (F13.2) et le ✦ du titre de scène (F05), côté serveur. Comme pour la
 * correction, le serveur relit lui-même ce qui part : la consigne enregistrée, le début du
 * texte, les titres et consignes du chapitre ; la page enregistre d'abord ce que l'adulte a
 * tapé. Jamais un prénom d'élève, une remarque ni le nom de l'adulte (F13, ce qui est transmis).
 * Rien n'est écrit ici : l'adulte retient ou laisse la proposition (F13-AC07, F05-AC04).
 */

/** Les scènes du chapitre que reçoit l'aide à la consigne : les plus proches, dans l'ordre du chapitre. */
export const VOISINES_ENVOYEES = 6;
/** Le début du texte qui part pour un titre : quelques paragraphes, jamais toute la scène. */
export const DEBUT_ENVOYE = 800;

type SceneLue = { id?: string; titre: string | null; consigne: string | null };
type Lieu = {
  histoire: Histoire;
  scene: SceneLue & { id: string };
  chapitre: { titre: string; resume: string | null };
  /** Les autres scènes du chapitre, dans l'ordre, la scène elle-même retirée */
  avant: SceneLue[];
  apres: SceneLue[];
  projetId: string;
  recit: "choix" | "classique";
  /** L'élève qui s'occupe de la scène, s'il y en a un */
  eleveId: string | null;
};

export async function lieuDeLaScene(e: Enseignant, sceneId: string): Promise<Lieu | null> {
  if (!estUuid(sceneId)) return null;
  const { data: s } = await e.supabase
    .from("scenes").select("projet_id, chapitre_id, titre, consigne, prise_par_eleve").eq("id", sceneId).is("supprime_le", null).maybeSingle();
  if (!s) return null;
  const [projet, chapitre, autres] = await Promise.all([
    projetDe(e, s.projet_id as string),
    e.supabase.from("chapitres").select("titre, resume").eq("id", s.chapitre_id as string).maybeSingle(),
    e.supabase.from("scenes").select("id, titre, consigne, rang").eq("chapitre_id", s.chapitre_id as string).is("supprime_le", null).order("rang"),
  ]);
  if (!projet || !chapitre.data) return null;
  const liste = (autres.data ?? []) as (SceneLue & { id: string })[];
  const ici = liste.findIndex((x) => x.id === sceneId);
  const lue = (x: SceneLue): SceneLue => ({ id: x.id, titre: x.titre?.trim() || null, consigne: x.consigne?.trim() || null });
  return {
    projetId: s.projet_id as string,
    recit: projet.recit,
    eleveId: (s.prise_par_eleve as string | null) ?? null,
    histoire: histoireDuProjet(projet),
    scene: { ...lue(s as SceneLue), id: sceneId },
    chapitre: { titre: chapitre.data.titre as string, resume: (chapitre.data.resume as string | null)?.trim() || null },
    avant: (ici < 0 ? [] : liste.slice(0, ici)).map(lue),
    apres: (ici < 0 ? liste : liste.slice(ici + 1)).map(lue),
  };
}

/** Les scènes voisines d'une consigne : les plus proches d'abord de part et d'autre, rendues dans l'ordre du chapitre. */
export function voisinesDe(avant: SceneLue[], apres: SceneLue[], n = VOISINES_ENVOYEES): SceneLue[] {
  const prises: { s: SceneLue; rang: number }[] = [];
  for (let d = 1; prises.length < n && (d <= avant.length || d <= apres.length); d++) {
    if (d <= avant.length) prises.push({ s: avant[avant.length - d], rang: -d });
    if (prises.length < n && d <= apres.length) prises.push({ s: apres[d - 1], rang: d });
  }
  return prises.sort((a, b) => a.rang - b.rang).map((p) => p.s);
}

/** Le début du texte, en paragraphes de récit entiers, jusqu'à `DEBUT_ENVOYE` lettres environ. */
export function debutDuTexte(paragraphes: string[], max = DEBUT_ENVOYE): string | null {
  const pris: string[] = [];
  let longueur = 0;
  for (const p of paragraphes) {
    const t = p.trim();
    if (!t) continue;
    if (longueur + t.length > max) {
      if (!pris.length) pris.push(`${t.slice(0, max).replace(/\s+\S*$/, "")}…`);
      break;
    }
    pris.push(t);
    longueur += t.length;
  }
  return pris.length ? pris.join("\n") : null;
}

export type ReponseConsigne = { ok: true; consigne: string; reste: string | null } | { ok: false; message: string };

export const SANS_INDICATION = "Écrivez d’abord en quelques mots ce que la scène doit raconter.";

/**
 * « ✦ Formuler » (F13.2) : d'après l'indication de l'adulte, c'est-à-dire la consigne telle
 * qu'elle est enregistrée. En classe, le modèle fixe (« Décris : » et deux ou trois points) ;
 * en mode personnel, une note d'intention pour soi.
 */
export async function demanderUneConsigne(e: Enseignant, sceneId: string): Promise<ReponseConsigne> {
  const lieu = await lieuDeLaScene(e, sceneId);
  if (!lieu) return { ok: false, message: "Cette scène n’existe plus." };
  const indication = lieu.scene.consigne;
  if (!indication) return { ok: false, message: SANS_INDICATION };
  const preparation = await preparationDe(e, lieu.projetId);
  const carnet: Carnet | undefined = carnetDe(preparation);
  const r = await demanderUneAide(e, aideConsigne, {
    histoire: lieu.histoire,
    indication: indication.slice(0, 1500),
    carnet,
    chapitre: { titre: lieu.chapitre.titre, resume: lieu.chapitre.resume ?? undefined },
    voisines: voisinesDe(lieu.avant, lieu.apres)
      .filter((v) => v.titre || v.consigne)
      .map((v) => ({ titre: v.titre ?? "Sans titre", consigne: v.consigne?.slice(0, 600) })),
  });
  return r.ok ? { ok: true, consigne: r.valeur.texte, reste: r.reste } : { ok: false, message: r.message };
}

export type ReponseTitres = { ok: true; titres: string[]; reste: string | null } | { ok: false; message: string };

export const RIEN_POUR_UN_TITRE = "Écrivez d’abord une consigne ou le début du texte.";

/**
 * Le ✦ du titre de scène (F05) : trois titres en une demande, d'après la consigne et le début
 * du texte s'il existe. La page les montre un à un.
 */
export async function demanderDesTitres(e: Enseignant, sceneId: string): Promise<ReponseTitres> {
  const lieu = await lieuDeLaScene(e, sceneId);
  if (!lieu) return { ok: false, message: "Cette scène n’existe plus." };
  const texte = await texteDeScene(e, sceneId);
  const debut = texte ? debutDuTexte(paragraphesACorriger(texte.texte).map((p) => p.texte)) : null;
  const consigne = lieu.scene.consigne?.slice(0, 1500) ?? null;
  if (!consigne && !debut) return { ok: false, message: RIEN_POUR_UN_TITRE };
  const r = await demanderUneAide(e, aideTitre, {
    histoire: lieu.histoire,
    consigne,
    debut,
    chapitre: lieu.chapitre.titre,
    autresTitres: [...lieu.avant, ...lieu.apres].flatMap((s) => (s.titre ? [s.titre] : [])).slice(0, 30),
    titreActuel: lieu.scene.titre ?? undefined,
  });
  if (!r.ok) return { ok: false, message: r.message };
  return r.valeur.titres.length ? { ok: true, titres: r.valeur.titres, reste: r.reste } : { ok: false, message: MESSAGES_IA.pasDeReponse };
}

/** « ✦ Écrire » : 150 mots par défaut, entre 30 et 1 500 (F13.6). */
export const MOTS_ECRITS = { defaut: 150, min: 30, max: 1500 } as const;
export const bornerMots = (n: unknown): number =>
  typeof n === "number" && Number.isFinite(n) ? Math.min(MOTS_ECRITS.max, Math.max(MOTS_ECRITS.min, Math.round(n))) : MOTS_ECRITS.defaut;

/** La fin d'un texte, en paragraphes de récit entiers depuis la fin, `DEBUT_ENVOYE` lettres environ. */
export function finDuTexte(paragraphes: string[], max = DEBUT_ENVOYE): string | null {
  return debutDuTexte([...paragraphes].reverse(), max)?.split("\n").reverse().join("\n") ?? null;
}

export type ReponseEcriture =
  | { ok: true; version: number; paragraphes: string[]; reste: string | null }
  | { ok: false; change?: boolean; message: string };

export const SANS_CONSIGNE = "Écrivez d’abord la consigne de la scène : l’IA écrit d’après elle.";
export const DEJA_ECRITE = "La scène a déjà un texte.";

/**
 * Ce qui mène à la scène, pour que le récit s'enchaîne (F13.6) : en récit à choix, la fin des
 * deux premières scènes dont un choix y conduit, avec la phrase de ce choix ; en récit
 * classique, la fin de la scène d'avant dans le chapitre. Jamais un prénom d'élève.
 */
async function ceQuiMeneIci(e: Enseignant, lieu: Lieu): Promise<{ fin: string; choix?: string }[]> {
  let sources: { id: string; choix?: string }[] = [];
  if (lieu.recit === "choix") {
    const { data } = await e.supabase.from("liens").select("scene_id, libelle").eq("cible_id", lieu.scene.id!).order("rang").limit(6);
    const vues = new Set<string>();
    for (const l of (data ?? []) as { scene_id: string; libelle: string | null }[]) {
      if (vues.has(l.scene_id) || l.scene_id === lieu.scene.id) continue;
      vues.add(l.scene_id);
      sources.push({ id: l.scene_id, choix: l.libelle?.trim() || undefined });
    }
    sources = sources.slice(0, 2);
  } else {
    const avant = lieu.avant[lieu.avant.length - 1];
    if (avant?.id) sources = [{ id: avant.id }];
  }
  const lus = await Promise.all(sources.map(async (x) => {
    const t = await texteDeScene(e, x.id);
    const fin = t ? finDuTexte(paragraphesACorriger(t.texte).map((p) => p.texte)) : null;
    return fin ? [{ fin, choix: x.choix }] : [];
  }));
  return lus.flat();
}

/**
 * « ✦ Écrire » (F13.6) : le texte d'une scène sans récit écrit, d'après sa consigne ; elle peut déjà avoir ses choix. `version` est celle que
 * la page montre ; si le texte a changé avant ou pendant la demande, rien ne se propose.
 */
export async function demanderUneEcriture(e: Enseignant, sceneId: string, version: number, mots: unknown): Promise<ReponseEcriture> {
  const lieu = await lieuDeLaScene(e, sceneId);
  if (!lieu) return { ok: false, message: "Cette scène n’existe plus." };
  const texte = await texteDeScene(e, sceneId);
  if (!texte) return { ok: false, message: "Cette scène n’existe plus." };
  if (texte.version !== version) return { ok: false, change: true, message: MESSAGES_IA.texteChange };
  if (!sansRecit(texte.texte)) return { ok: false, message: DEJA_ECRITE };
  if (!lieu.scene.consigne) return { ok: false, message: SANS_CONSIGNE };
  const [preparation, avant] = await Promise.all([preparationDe(e, lieu.projetId), ceQuiMeneIci(e, lieu)]);
  const r = await demanderUneAide(e, aideEcriture, {
    histoire: lieu.histoire,
    consigne: lieu.scene.consigne.slice(0, 1500),
    titre: lieu.scene.titre ?? undefined,
    carnet: carnetDe(preparation),
    chapitre: { titre: lieu.chapitre.titre, resume: lieu.chapitre.resume ?? undefined },
    voisines: voisinesDe(lieu.avant, lieu.apres)
      .filter((v) => v.titre || v.consigne)
      .map((v) => ({ titre: v.titre ?? "Sans titre", consigne: v.consigne?.slice(0, 600) })),
    avant,
    cible: bornerMots(mots),
  });
  if (!r.ok) return { ok: false, message: r.message };
  const { data: apres } = await e.supabase.from("scenes").select("version").eq("id", sceneId).maybeSingle();
  if (apres?.version !== version) return { ok: false, change: true, message: MESSAGES_IA.texteChange };
  return { ok: true, version, paragraphes: r.valeur.paragraphes, reste: r.reste };
}

/**
 * Le texte écrit, en paragraphes de récit, tel qu'il entre dans la scène : au-dessus de ce qui
 * s'y trouve déjà (choix, actions de jeu, images, notes), les lignes vides retirées.
 */
export const texteEcrit = (paragraphes: string[], deja: Texte = []): Texte => [
  ...(paragraphes.map((p) => ({ type: "p", id: crypto.randomUUID(), children: [{ text: p }] })) as Texte),
  ...deja.filter((b) => b.type !== "p" || lettresDe(b).trim() !== ""),
];

export type EcritureMise =
  | {
      ok: true; scene: TexteDeScene; /** L'élève qui s'en occupait, et ne s'en occupe plus */ eleveRetire: string | null;
      /** Le texte d'avant, choix compris : « Annuler » le rend */
      avant: Texte;
    }
  | { ok: false; change: boolean; message: string };

/**
 * « Mettre ce texte dans la scène » (F13.6), seulement si elle est toujours sans récit à `version`. Une
 * scène dont un élève s'occupait passe à l'adulte (« Vous ») : l'adulte en a été prévenu, et
 * l'élève ne l'écrit plus.
 */
export async function mettreUneEcriture(e: Enseignant, sceneId: string, version: number, brut: unknown): Promise<EcritureMise> {
  const paragraphes = Array.isArray(brut) && brut.length > 0 && brut.length <= 40
    ? brut.map((p) => (typeof p === "string" ? p.replace(/\s+/g, " ").trim().slice(0, 6000) : "")).filter(Boolean)
    : [];
  if (!paragraphes.length) return { ok: false, change: false, message: "Ce texte n’a pas pu être mis dans la scène." };
  const lieu = await lieuDeLaScene(e, sceneId);
  const actuel = await texteDeScene(e, sceneId);
  if (!lieu || !actuel) return { ok: false, change: false, message: "Cette scène n’existe plus." };
  if (actuel.version !== version || !sansRecit(actuel.texte)) return { ok: false, change: true, message: MESSAGES_IA.texteChange };
  const fait = await remplacerSiInchange(e, sceneId, version, texteEcrit(paragraphes, actuel.texte));
  if (!fait.ok) return fait;
  if (lieu.eleveId) {
    await e.supabase.from("scenes").update({ prise_par_enseignant: true, prise_par_eleve: null }).eq("id", sceneId);
  }
  return { ok: true, scene: fait.scene, eleveRetire: lieu.eleveId, avant: actuel.texte };
}

/** « Annuler », juste après : la scène retrouve son texte d'avant, choix compris, et l'élève qui s'en occupait la retrouve. */
export async function annulerUneEcriture(e: Enseignant, sceneId: string, version: number, texte: unknown, eleve: unknown): Promise<Remplacement> {
  const fait = await remplacerSiInchange(e, sceneId, version, texte);
  if (!fait.ok) return fait.change ? { ...fait, message: "Le texte a changé entre-temps : rien n’a été annulé." } : fait;
  if (estUuid(eleve)) {
    await e.supabase.from("scenes").update({ prise_par_enseignant: false, prise_par_eleve: eleve }).eq("id", sceneId).eq("prise_par_enseignant", true);
  }
  return fait;
}
