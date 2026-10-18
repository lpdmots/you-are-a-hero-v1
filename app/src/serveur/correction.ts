import "server-only";
import { DEGRES, MESSAGES_IA, type Degre } from "@/domaine/aides-ia";
import { appliquerCorrection, cibleDe, compterMots, longueurReglable, MEME_LONGUEUR, paragraphesACorriger, type Longueur, type Proposition } from "@/domaine/correction";
import { nettoyerTexte, type Texte } from "@/domaine/copie";
import { nomsPropresDeLHistoire } from "@/domaine/personnages";
import type { Enseignant } from "./adulte";
import { enregistrerPourAdulte, texteDeScene, type TexteDeScene } from "./copie";
import { correction } from "./ia/aides/correction";
import { pistes, remarqueDesPistes } from "./ia/aides/pistes";
import { type Histoire, histoireDuProjet } from "./ia/aides/contexte";
import { demanderUneAide } from "./ia/demander";
import { projetDe } from "./lectures";
import { estUuid, preparationDe } from "./recit";

/**
 * La correction d'une scène et les pistes de reprise (F13.1), côté serveur. Le serveur relit
 * lui-même le texte de la scène : ce qui part chez l'aide, et la version sur laquelle la
 * proposition se fonde, ne viennent jamais du navigateur. Ne partent que les paragraphes de
 * récit, la consigne et les noms des personnages et des objets de l'histoire ; jamais un prénom d'élève, une
 * remarque ni le nom de l'adulte (F13, ce qui est transmis).
 */

type Lieu = { scene: TexteDeScene; consigne: string | null; histoire: Histoire; nomsPropres: string[]; deClasse: boolean };

async function lieuDeLaScene(e: Enseignant, sceneId: string): Promise<Lieu | null> {
  if (!estUuid(sceneId)) return null;
  const { data } = await e.supabase.from("scenes").select("projet_id, consigne").eq("id", sceneId).maybeSingle();
  if (!data) return null;
  const [projet, scene, preparation] = await Promise.all([projetDe(e, data.projet_id as string), texteDeScene(e, sceneId), preparationDe(e, data.projet_id as string)]);
  if (!projet || !scene) return null;
  const consigne = (data.consigne as string | null)?.trim() || null;
  return {
    scene,
    consigne,
    histoire: histoireDuProjet(projet, e.reglagesIa.niveaux),
    // Les noms des personnages, leurs autres noms et ceux des objets ne se corrigent pas (F10.2)
    nomsPropres: nomsPropresDeLHistoire(preparation?.personnagesDeLHistoire ?? [], preparation?.objets ?? []),
    deClasse: projet.organisation === "classe",
  };
}

/** Ce que rend une demande de correction à la page. */
export type ReponseCorrection =
  | { ok: true; version: number; texte: Texte; propositions: Proposition[]; reste: string | null }
  | { ok: false; change: true; message: string }
  | { ok: false; change?: undefined; message: string };

const CHANGE = { ok: false, change: true, message: MESSAGES_IA.texteChange } as const;

/**
 * Demander une correction (F13.1) : au degré choisi pour cette demande, sur toute la scène ou
 * sur les paragraphes que la sélection touche, et aux degrés 4 et 5 à la longueur demandée. `version` est celle que la page montre : si le
 * texte a changé avant ou pendant la demande, rien ne se propose (« Redemander ? »).
 */
export async function demanderUneCorrection(
  e: Enseignant, sceneId: string, version: number, degre: Degre, selection: string[] | null, longueur: Longueur = MEME_LONGUEUR,
): Promise<ReponseCorrection> {
  if (!DEGRES.includes(degre)) return { ok: false, message: MESSAGES_IA.pasDeReponse };
  const lieu = await lieuDeLaScene(e, sceneId);
  if (!lieu) return { ok: false, message: "Cette scène n’existe plus." };
  if (lieu.scene.version !== version) return CHANGE;
  const parts = paragraphesACorriger(lieu.scene.texte, selection);
  if (!parts.length) return { ok: false, message: selection ? "La sélection ne touche aucun paragraphe de récit." : "Le texte est vide." };

  // Aux degrés 4 et 5, la longueur se compte sur ce que le serveur a relu, jamais sur ce que dit la page
  const cible = longueurReglable(degre) ? cibleDe(longueur, compterMots(parts.map((p) => p.texte).join(" "))) : null;
  const r = await demanderUneAide(e, correction, {
    histoire: lieu.histoire, degre, paragraphes: parts.map((p) => p.texte), consigne: lieu.consigne, nomsPropres: lieu.nomsPropres, cible,
  });
  if (!r.ok) return { ok: false, message: r.message };
  // Pendant la demande, un élève a pu écrire, ou l'adulte lui-même dans une autre fenêtre
  const { data: apres } = await e.supabase.from("scenes").select("version").eq("id", sceneId).maybeSingle();
  if (apres?.version !== version) return CHANGE;
  return {
    ok: true, version, texte: lieu.scene.texte, reste: r.reste,
    propositions: parts.map((p, i) => ({ id: p.id, avant: p.texte, apres: r.valeur.paragraphes[i] })),
  };
}

/** Les pistes, déjà mises en lignes comme l'élève les lira dans la remarque. */
export type ReponsePistes = { ok: true; remarque: string; reste: string | null } | { ok: false; message: string };

/** « Proposer des pistes », sous la remarque de reprise (F13.1, F07.3) : mode classe seulement. */
export async function demanderDesPistes(e: Enseignant, sceneId: string): Promise<ReponsePistes> {
  const lieu = await lieuDeLaScene(e, sceneId);
  if (!lieu) return { ok: false, message: "Cette scène n’existe plus." };
  if (!lieu.deClasse) return { ok: false, message: MESSAGES_IA.pasDeReponse };
  const parts = paragraphesACorriger(lieu.scene.texte);
  if (!parts.length) return { ok: false, message: "Le texte est vide." };
  const r = await demanderUneAide(e, pistes, { histoire: lieu.histoire, paragraphes: parts.map((p) => p.texte), consigne: lieu.consigne });
  return r.ok ? { ok: true, remarque: remarqueDesPistes(r.valeur), reste: r.reste } : { ok: false, message: r.message };
}

export type Remplacement = { ok: true; scene: TexteDeScene } | { ok: false; change: boolean; message: string };

/**
 * Mettre un texte dans la scène, seulement si elle n'a pas changé depuis `version` : « Garder
 * les changements », « Mettre ce texte dans la scène », et leur « Annuler ». La version est
 * relue avant d'écrire : un texte devenu ancien ne passe pas par l'enregistrement, qui le
 * garderait à part comme un conflit (F08.1) ; il ne s'applique pas, simplement. L'état de la
 * scène, ses choix, ses remises et l'élève qui s'en occupe ne changent pas (F13-AC03, AC04).
 */
export async function remplacerSiInchange(e: Enseignant, sceneId: string, version: number, brut: unknown): Promise<Remplacement> {
  const texte = nettoyerTexte(brut);
  if (!estUuid(sceneId) || !Number.isInteger(version) || !texte) return { ok: false, change: false, message: "Ce texte n’a pas pu être mis dans la scène." };
  const { data } = await e.supabase.from("scenes").select("version").eq("id", sceneId).maybeSingle();
  if (!data) return { ok: false, change: false, message: "Cette scène n’existe plus." };
  if (data.version !== version) return { ok: false, change: true, message: MESSAGES_IA.texteChange };
  const fait = await enregistrerPourAdulte(e, sceneId, version, texte);
  if (fait.etat !== "enregistre") return { ok: false, change: true, message: MESSAGES_IA.texteChange };
  const scene = await texteDeScene(e, sceneId);
  return scene ? { ok: true, scene } : { ok: false, change: false, message: "Cette scène n’existe plus." };
}

/**
 * « Garder les changements » ou « Mettre ce texte dans la scène » : le texte corrigé se
 * recompose ici, d'après le texte que le serveur relit à la version de la demande. La page ne
 * dit que les changements refusés (degrés 1 à 3) ou les paragraphes retouchés (4 et 5) ; un
 * paragraphe qui n'est plus celui qu'on a corrigé arrête tout (« Redemander ? »).
 */
export async function garderUneCorrection(e: Enseignant, sceneId: string, version: number, propositions: unknown, refuses: unknown): Promise<Remplacement> {
  const scene = estUuid(sceneId) ? await texteDeScene(e, sceneId) : null;
  if (!scene) return { ok: false, change: false, message: "Cette scène n’existe plus." };
  if (scene.version !== version) return { ok: false, change: true, message: MESSAGES_IA.texteChange };
  const lues = lirePropositions(propositions);
  const actuels = new Map(paragraphesACorriger(scene.texte).map((p) => [p.id, p.texte]));
  if (!lues || lues.some((p) => actuels.get(p.id) !== p.avant)) return { ok: false, change: true, message: MESSAGES_IA.texteChange };
  const refus = Array.isArray(refuses) ? refuses.filter((n): n is number => Number.isInteger(n)) : [];
  return remplacerSiInchange(e, sceneId, version, appliquerCorrection(scene.texte, lues, new Set(refus)));
}

/** Les propositions renvoyées par la page, relues sans confiance. */
function lirePropositions(v: unknown): Proposition[] | null {
  if (!Array.isArray(v) || v.length === 0 || v.length > 2000) return null;
  const sortie: Proposition[] = [];
  for (const p of v) {
    const o = p && typeof p === "object" ? (p as Record<string, unknown>) : null;
    if (!o || typeof o.id !== "string" || typeof o.avant !== "string" || typeof o.apres !== "string" || o.apres.length > 20_000) return null;
    sortie.push({ id: o.id, avant: o.avant, apres: o.apres.replace(/\s*\n\s*/g, " ") });
  }
  return sortie;
}
