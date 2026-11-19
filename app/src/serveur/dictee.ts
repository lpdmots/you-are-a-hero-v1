import "server-only";
import { DICTEE, termesDeLaDictee, type RefusDictee } from "@/domaine/dictee";
import type { Enseignant } from "./adulte";
import { simulation } from "./ia/demander";
import { clientService } from "./supabase";

/**
 * La dictée de l'adulte (F07.4) : le son enregistré par le navigateur part chez ElevenLabs
 * (Scribe), le texte entendu revient, et rien n'est gardé ici ni chez nous, ni le son ni le texte :
 * le journal ne note que la durée, pour le plafond du mois. Gratuite, sans étoile (F14).
 *
 * La clé `ELEVENLABS_API_KEY` se lit dans l'environnement du serveur et ne quitte jamais ce
 * fichier. Pendant les essais, `IA_SIMULEE` remplace le fournisseur, comme pour les aides IA :
 *   1 : un texte entendu fixe ; echec : aucune réponse utilisable ; delai : aucune réponse dans le
 *   délai ; sans-cle : la clé absente.
 */

export type ResultatDictee = { ok: true; texte: string } | { ok: false; refus: RefusDictee };

/** Ce que la dictée simulée entend, pour les essais */
export const TEXTE_SIMULE = "Le dragon ouvre son grand livre et lit la première page.";

/** Ce que la dernière dictée simulée a reçu : les essais vérifient ce qui serait parti, sans rien envoyer. */
let derniereSimulee: { octets: number; termes: string[] } | null = null;
export const derniereDicteeSimulee = () => derniereSimulee;

const DELAI_MS = 60_000;
const MODELE = "scribe_v2";

function clePosee(): boolean {
  const simulee = simulation();
  if (simulee) return simulee !== "sans-cle";
  return Boolean(process.env.ELEVENLABS_API_KEY);
}

async function secondesDuMois(adulte: string): Promise<number> {
  const { data, error } = await clientService().rpc("secondes_dictees_du_mois", { p_enseignant: adulte });
  if (error) throw new Error(`Journal de la dictée : ${error.message}`);
  return Number(data ?? 0);
}

/**
 * La dictée est-elle possible pour cet adulte, avant même d'enregistrer ? Le bouton le demande au
 * premier clic : on ne lit pas cinq minutes pour apprendre ensuite que le mois est épuisé.
 */
export async function dicteePossible(adulte: Enseignant): Promise<RefusDictee | null> {
  if (!clePosee()) return "absente";
  return (await secondesDuMois(adulte.id)) >= DICTEE.secondesParMois ? "plafond" : null;
}

/** Les noms du projet, lus avec la session de l'adulte : un projet qui n'est pas le sien n'en donne aucun. */
async function termesDuProjet(adulte: Enseignant, projet: string | null): Promise<string[]> {
  if (!projet) return [];
  const [{ data: personnages }, { data: objets }] = await Promise.all([
    adulte.supabase.from("personnages").select("nom, autres_noms, heros").eq("projet_id", projet).order("heros", { ascending: false }).order("rang"),
    adulte.supabase.from("objets").select("nom").eq("projet_id", projet),
  ]);
  return termesDeLaDictee([
    ...(personnages ?? []).flatMap((p) => [p.nom as string, ...((p.autres_noms as string[] | null) ?? [])]),
    ...(objets ?? []).map((o) => o.nom as string),
  ]);
}

async function appelerScribe(audio: Blob, termes: string[], signal: AbortSignal): Promise<{ texte: string; secondes: number }> {
  const corps = new FormData();
  corps.append("model_id", MODELE);
  corps.append("file", audio, "dictee");
  corps.append("language_code", "fr");
  corps.append("tag_audio_events", "false");
  for (const t of termes) corps.append("keyterms", t);
  const r = await fetch("https://api.elevenlabs.io/v1/speech-to-text", {
    method: "POST",
    headers: { "xi-api-key": process.env.ELEVENLABS_API_KEY! },
    body: corps,
    signal,
  });
  if (!r.ok) throw new Error(`ElevenLabs ${r.status} : ${(await r.text()).slice(0, 300)}`);
  const json = (await r.json()) as { text?: unknown; audio_duration_secs?: unknown };
  return {
    texte: typeof json.text === "string" ? json.text : "",
    secondes: typeof json.audio_duration_secs === "number" ? json.audio_duration_secs : 0,
  };
}

const attendre = (ms: number, signal: AbortSignal) =>
  new Promise<void>((fin, rejet) => {
    const t = setTimeout(fin, ms);
    signal.addEventListener("abort", () => {
      clearTimeout(t);
      rejet(signal.reason);
    });
  });

/**
 * Transcrit une dictée. Rien ne part sans clé, au-delà du plafond du mois ou pour un son trop
 * lourd ; une réponse vide dit « Rien n'a été entendu ». La durée transcrite se note au journal.
 * `delaiMs` ne sert qu'aux essais automatiques.
 */
export async function transcrire(
  adulte: Enseignant,
  demande: { audio: Blob; projet: string | null },
  options: { delaiMs?: number } = {},
): Promise<ResultatDictee> {
  if (demande.audio.size > DICTEE.octetsMax) return { ok: false, refus: "trop-long" };
  const refus = await dicteePossible(adulte);
  if (refus) return { ok: false, refus };
  if (demande.audio.size === 0) return { ok: false, refus: "rien" };
  const termes = await termesDuProjet(adulte, demande.projet);

  const arret = new AbortController();
  const minuterie = setTimeout(() => arret.abort(new Error("délai")), options.delaiMs ?? DELAI_MS);
  const simulee = simulation();
  let entendu: { texte: string; secondes: number };
  try {
    if (simulee) {
      derniereSimulee = { octets: demande.audio.size, termes };
      if (simulee === "delai") await attendre(10 * 60_000, arret.signal);
      if (simulee === "echec") return { ok: false, refus: "echec" };
      entendu = { texte: TEXTE_SIMULE, secondes: 4 };
    } else {
      entendu = await appelerScribe(demande.audio, termes, arret.signal);
    }
  } catch (e) {
    if (!arret.signal.aborted) console.error(`Dictée : ${e instanceof Error ? e.message : e}`);
    return { ok: false, refus: "echec" };
  } finally {
    clearTimeout(minuterie);
  }

  const { error } = await clientService().from("dictees").insert({
    enseignant_id: adulte.id,
    secondes: Math.min(Math.max(entendu.secondes, 0), 600),
    fournisseur: simulee ? "simule" : "elevenlabs",
  });
  if (error) console.error(`Journal de la dictée : ${error.message}`);

  const texte = entendu.texte.replace(/\s+/g, " ").trim();
  return texte ? { ok: true, texte } : { ok: false, refus: "rien" };
}
