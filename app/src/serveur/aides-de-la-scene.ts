import "server-only";
import { MESSAGES_IA } from "@/domaine/aides-ia";
import { paragraphesACorriger } from "@/domaine/correction";
import type { Enseignant } from "./adulte";
import { texteDeScene } from "./copie";
import { consigne as aideConsigne } from "./ia/aides/consigne";
import type { Carnet, Histoire } from "./ia/aides/contexte";
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

type SceneLue = { titre: string | null; consigne: string | null };
type Lieu = {
  histoire: Histoire;
  scene: SceneLue & { id: string };
  chapitre: { titre: string; resume: string | null };
  /** Les autres scènes du chapitre, dans l'ordre, la scène elle-même retirée */
  avant: SceneLue[];
  apres: SceneLue[];
  projetId: string;
};

async function lieuDeLaScene(e: Enseignant, sceneId: string): Promise<Lieu | null> {
  if (!estUuid(sceneId)) return null;
  const { data: s } = await e.supabase
    .from("scenes").select("projet_id, chapitre_id, titre, consigne").eq("id", sceneId).is("supprime_le", null).maybeSingle();
  if (!s) return null;
  const [projet, chapitre, autres] = await Promise.all([
    projetDe(e, s.projet_id as string),
    e.supabase.from("chapitres").select("titre, resume").eq("id", s.chapitre_id as string).maybeSingle(),
    e.supabase.from("scenes").select("id, titre, consigne, rang").eq("chapitre_id", s.chapitre_id as string).is("supprime_le", null).order("rang"),
  ]);
  if (!projet || !chapitre.data) return null;
  const liste = (autres.data ?? []) as (SceneLue & { id: string })[];
  const ici = liste.findIndex((x) => x.id === sceneId);
  const lue = (x: SceneLue): SceneLue => ({ titre: x.titre?.trim() || null, consigne: x.consigne?.trim() || null });
  return {
    projetId: s.projet_id as string,
    histoire: { titre: projet.titre, mode: projet.organisation, recit: projet.recit, niveaux: projet.organisation === "classe" ? e.reglagesIa.niveaux : [] },
    scene: { id: sceneId, ...lue(s as SceneLue) },
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
  const carnet: Carnet | undefined = preparation
    ? { univers: preparation.univers, personnages: preparation.personnages, enjeu: preparation.enjeu }
    : undefined;
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
