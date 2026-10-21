import "server-only";
import { PLAFONDS, TAILLES_DES_IMAGES, messageDuRefus, qualiteDeLImage, resteDEtoiles, type AideImage, type RefusIa, type ReglagesIa, type UsageDImage } from "@/domaine/aides-ia";
import { clientService } from "../supabase";
import type { DefinitionAide } from "./aide";
import { appelerLeFournisseur, creerDesImages, jetonsDe, type RequeteImages } from "./fournisseurs";
import { OBJET_1, OBJET_2, PORTRAIT_1, PORTRAIT_2, SCENE_1, SCENE_2 } from "./images-simulees";
import { MODELES, MODELE_DES_AIDES, MODELE_DES_IMAGES, coutDe, coutDesImages, type IdModele } from "./modeles";

/**
 * Demander une aide (F13, cadre commun ; F14, étoiles) : tant que le solde d'étoiles est positif,
 * soixante secondes au plus, notée au journal sans son contenu ; la base débite le coût réel
 * d'une demande réussie (`appels_ia_debit`). Rien de ce qui arrive ici ne change le travail de
 * l'adulte : l'aide rend une proposition, ou dit pourquoi elle n'en a pas.
 *
 * Pendant les essais automatiques, `IA_SIMULEE` remplace le fournisseur par la réponse simulée
 * de l'aide : aucun test n'appelle un vrai fournisseur ni ne dépense quoi que ce soit.
 *   IA_SIMULEE=1        la réponse simulée
 *   IA_SIMULEE=echec    une réponse inutilisable
 *   IA_SIMULEE=delai    aucune réponse dans le délai
 *   IA_SIMULEE=sans-cle les clés des fournisseurs absentes, comme sur un site où on ne les a pas mises
 * Un parcours change le mode du serveur d'essai le temps d'un test, par `/ia/simulation`
 * (`reglerLaSimulation`), qui n'existe que si `IA_SIMULEE` est posée.
 */

export type ResultatIa<S> =
  | { ok: true; valeur: S; /** « Il vous reste 8 ✦. », ou rien */ reste: string | null }
  | { ok: false; refus: RefusIa; message: string };

export type Demandeur = { id: string; reglagesIa: ReglagesIa };

const refus = <S>(r: RefusIa): ResultatIa<S> => ({ ok: false, refus: r, message: messageDuRefus(r) });

export type ModeSimule = "reponse" | "echec" | "delai" | "sans-cle";
const MODES: Record<string, ModeSimule> = { "1": "reponse", echec: "echec", delai: "delai", "sans-cle": "sans-cle" };
const reglage = globalThis as { __iaSimulee?: ModeSimule };

/** Le mode simulé est-il demandé ? Une valeur inconnue est une erreur : mieux vaut un essai qui tombe qu'un appel payé. */
export function simulation(): ModeSimule | null {
  const v = process.env.IA_SIMULEE;
  if (!v) return null;
  if (reglage.__iaSimulee) return reglage.__iaSimulee;
  if (MODES[v]) return MODES[v];
  throw new Error(`IA_SIMULEE inconnue : ${v}`);
}

/** Le mode d'un serveur d'essai, le temps d'un parcours ; null le rend à `IA_SIMULEE`. Sans `IA_SIMULEE`, rien ne change. */
export function reglerLaSimulation(mode: ModeSimule | null): boolean {
  if (!process.env.IA_SIMULEE) return false;
  reglage.__iaSimulee = mode ?? undefined;
  return true;
}

/**
 * Les clés du fournisseur sont-elles posées ? Sans elles, rien ne part et rien ne se débite : « Les aides IA ne sont pas installées sur ce site » (lot 9 de l'étape 8).
 */
function clePosee(fournisseur: "anthropic" | "openai"): boolean {
  const simulee = simulation();
  if (simulee) return simulee !== "sans-cle";
  return Boolean(process.env[fournisseur === "anthropic" ? "ANTHROPIC_API_KEY" : "OPENAI_API_KEY"]);
}

const attendre = (ms: number, signal: AbortSignal) =>
  new Promise<void>((fin, rejet) => {
    const t = setTimeout(fin, ms);
    signal.addEventListener("abort", () => {
      clearTimeout(t);
      rejet(signal.reason);
    });
  });

type Brut = { json: unknown; jetonsEntree: number; jetonsSortie: number; fournisseur: "anthropic" | "openai" | "simule" };

async function obtenir<E, S>(def: DefinitionAide<E, S>, entree: E, modele: IdModele, signal: AbortSignal): Promise<Brut> {
  const simulee = simulation();
  if (simulee === "reponse") return { json: def.simuler(entree), jetonsEntree: 0, jetonsSortie: 0, fournisseur: "simule" };
  if (simulee === "echec" || simulee === "sans-cle") return { json: null, jetonsEntree: 0, jetonsSortie: 0, fournisseur: "simule" };
  if (simulee === "delai") {
    await attendre(10 * 60_000, signal);
    throw new Error("inatteignable");
  }
  const r = await appelerLeFournisseur({
    modele, systeme: def.systeme(entree), message: def.message(entree), pieces: def.pieces?.(entree), schema: def.schema, sortieMax: def.sortieMax, signal,
  });
  return { ...r, fournisseur: MODELES[modele].fournisseur };
}

/**
 * Ouvre la demande au journal, sous le verrou de la ligne de l'adulte : refusée si son solde
 * d'étoiles est épuisé (F14-AC08), jamais pour un plafond. Les plafonds d'avant ne se passent plus.
 */
async function commencer(adulte: string, aide: string, sorte: "texte" | "image", nombre: number, delaiMs: number): Promise<{ id?: string; refus?: RefusIa }> {
  const { data, error } = await clientService().rpc("commencer_appel_ia", {
    p_enseignant: adulte, p_aide: aide, p_sorte: sorte, p_nombre: nombre,
    p_par_jour: null, p_mois_usd: null, p_attente: Math.ceil(delaiMs / 1000) + 15,
  });
  if (error) throw new Error(`Journal des aides : ${error.message}`);
  const r = data as { id?: string; refus?: string };
  return r.refus ? { refus: r.refus === "etoiles" ? "etoiles" : "echec" } : { id: r.id };
}

/** Le solde après une demande, à dire s'il en reste peu (F14-AC07) ; rien pour le porteur. */
async function resteApres(adulte: string): Promise<string | null> {
  const base = clientService();
  const [{ data: compte }, { data: reglages }] = await Promise.all([
    base.from("enseignants").select("etoiles, createur").eq("id", adulte).single(),
    base.from("reglages_application").select("etoiles_peu").single(),
  ]);
  if (!compte || compte.createur) return null;
  return resteDEtoiles(compte.etoiles as number, (reglages?.etoiles_peu as number | undefined) ?? 10);
}

/**
 * Demande une aide de texte pour l'adulte. `delai` ne sert qu'aux essais automatiques, pour ne
 * pas attendre la minute entière.
 */
export async function demanderUneAide<E, S>(
  adulte: Demandeur,
  def: DefinitionAide<E, S>,
  entree: E,
  options: { delaiMs?: number } = {},
): Promise<ResultatIa<S>> {
  if (!adulte.reglagesIa.proposer) return refus("eteint");
  const modele = MODELE_DES_AIDES[def.aide];
  if (!clePosee(MODELES[modele].fournisseur)) return refus("absentes");
  const base = clientService();
  const delaiMs = options.delaiMs ?? PLAFONDS.secondes * 1000;

  const commence = await commencer(adulte.id, def.aide, "texte", 1, delaiMs);
  if (commence.refus || !commence.id) return refus(commence.refus ?? "echec");

  const arret = new AbortController();
  const minuterie = setTimeout(() => arret.abort(new Error("délai")), delaiMs);
  let issue: "reussi" | "echec" | "delai" = "echec";
  let jetons = { jetonsEntree: 0, jetonsSortie: 0 };
  let fournisseur: Brut["fournisseur"] = simulation() ? "simule" : MODELES[modele].fournisseur;
  let valeur: S | null = null;
  try {
    const brut = await obtenir(def, entree, modele, arret.signal);
    jetons = brut;
    fournisseur = brut.fournisseur;
    valeur = def.lire(brut.json, entree);
    issue = valeur === null ? "echec" : "reussi";
  } catch (e) {
    jetons = jetonsDe(e);
    issue = arret.signal.aborted ? "delai" : "echec";
    if (!arret.signal.aborted) console.error(`Aide « ${def.aide} » : ${e instanceof Error ? e.message : e}`);
  } finally {
    clearTimeout(minuterie);
  }

  const cout = fournisseur === "simule" ? 0 : coutDe(modele, jetons.jetonsEntree, jetons.jetonsSortie);
  const { error: fin } = await base.rpc("terminer_appel_ia", {
    p_id: commence.id, p_issue: issue, p_fournisseur: fournisseur, p_modele: MODELES[modele].id,
    p_entree: jetons.jetonsEntree, p_sortie: jetons.jetonsSortie, p_cout: cout,
  });
  if (fin) console.error(`Journal des aides : ${fin.message}`);

  if (issue !== "reussi" || valeur === null) return refus(issue === "delai" ? "delai" : "echec");
  return { ok: true, valeur, reste: await resteApres(adulte.id) };
}

export type ResultatImages =
  | { ok: true; images: Uint8Array[]; qualite: "normale" | "haute"; /** « Il vous reste 8 ✦. », ou rien */ reste: string | null }
  | { ok: false; refus: RefusIa; message: string };

export type DemandeDImages = {
  aide: AideImage;
  usage: UsageDImage;
  /** Le prompt assemblé par l'application, en français */
  prompt: string;
  /** Sinon le réglage « Images par création » de l'adulte */
  nombre?: 1 | 2;
  /** Détourée : sur fond transparent, en PNG (18 octobre 2026) */
  transparente?: boolean;
  /** Les portraits et images de référence des badges, joints à une image de scène (F10.2) */
  references?: RequeteImages["references"];
};

/**
 * Ce que la dernière création simulée a reçu (`IA_SIMULEE`) : le prompt, l'usage, la qualité et le
 * nombre d'images de référence, pour que les essais vérifient ce qui serait parti sans rien payer.
 */
let derniereSimulee: { prompt: string; usage: UsageDImage; qualite: "normale" | "haute"; nombre: number; references: number } | null = null;
export const derniereCreationSimulee = () => derniereSimulee;

const refusImage = (r: RefusIa): ResultatImages => ({ ok: false, refus: r, message: messageDuRefus(r, "image") });
const decoder = (b64: string) => new Uint8Array(Buffer.from(b64, "base64"));

/**
 * Crée une ou deux images pour l'adulte (F10.1, F10.2), sous les mêmes règles que les aides de
 * texte : un solde d'étoiles positif au départ, plusieurs créations à la fois (F14-AC09, AC10 ;
 * une seule en route pour un même élément, `demandes_d_images`), le journal sans contenu. La qualité suit le réglage
 * du compte et l'usage (F10-AC37). Rien n'est gardé ici : la page propose, l'adulte garde.
 */
export async function demanderDesImages(adulte: Demandeur, demande: DemandeDImages, options: { delaiMs?: number } = {}): Promise<ResultatImages> {
  if (!adulte.reglagesIa.proposer) return refusImage("eteint");
  if (!clePosee("openai")) return refusImage("absentes");
  const base = clientService();
  const nombre = demande.nombre ?? adulte.reglagesIa.imagesParCreation;
  const qualite = qualiteDeLImage(adulte.reglagesIa.qualite, demande.usage);
  const delaiMs = options.delaiMs ?? PLAFONDS.secondesImage * 1000;

  const commence = await commencer(adulte.id, demande.aide, "image", nombre, delaiMs);
  if (commence.refus || !commence.id) return refusImage(commence.refus ?? "echec");

  const arret = new AbortController();
  const minuterie = setTimeout(() => arret.abort(new Error("délai")), delaiMs);
  let issue: "reussi" | "echec" | "delai" = "echec";
  let jetons = { texteEntree: 0, imageEntree: 0, sortie: 0 };
  let images: Uint8Array[] = [];
  const simulee = simulation();
  try {
    if (simulee) derniereSimulee = { prompt: demande.prompt, usage: demande.usage, qualite, nombre, references: demande.references?.length ?? 0 };
    if (simulee === "reponse") {
      const deux = demande.usage === "objet" ? [OBJET_1, OBJET_2] : demande.usage === "portrait" ? [PORTRAIT_1, PORTRAIT_2] : [SCENE_1, SCENE_2];
      images = deux.slice(0, nombre).map(decoder);
    } else if (simulee === "delai") {
      await attendre(10 * 60_000, arret.signal);
    } else if (!simulee) {
      const r = await creerDesImages({
        prompt: demande.prompt, taille: TAILLES_DES_IMAGES[demande.usage], qualite, nombre, transparente: demande.transparente === true, references: demande.references, signal: arret.signal,
      });
      jetons = r;
      images = r.images;
    }
    issue = images.length ? "reussi" : "echec";
  } catch (e) {
    const j = (e && typeof e === "object" && "jetonsImages" in e ? (e as { jetonsImages: typeof jetons }).jetonsImages : null);
    if (j) jetons = j;
    issue = arret.signal.aborted ? "delai" : "echec";
    if (!arret.signal.aborted) console.error(`Images « ${demande.aide} » : ${e instanceof Error ? e.message : e}`);
  } finally {
    clearTimeout(minuterie);
  }

  const { error: fin } = await base.rpc("terminer_appel_ia", {
    p_id: commence.id, p_issue: issue, p_fournisseur: simulee ? "simule" : "openai", p_modele: MODELE_DES_IMAGES.id,
    p_entree: jetons.texteEntree + jetons.imageEntree, p_sortie: jetons.sortie, p_cout: simulee ? 0 : coutDesImages(jetons),
  });
  if (fin) console.error(`Journal des aides : ${fin.message}`);

  if (issue !== "reussi") return refusImage(issue === "delai" ? "delai" : "echec");
  return { ok: true, images, qualite, reste: await resteApres(adulte.id) };
}

/**
 * L'essai de qualité (lot 1 de l'étape 8) : la même aide, sur un modèle choisi, sans journal
 * ni plafond — l'essai tient son propre compte. Jamais depuis une page de l'application.
 */
export async function essayerUneAide<E, S>(def: DefinitionAide<E, S>, entree: E, modele: IdModele) {
  if (simulation()) throw new Error("L'essai de qualité appelle les vrais fournisseurs : retirez IA_SIMULEE.");
  const arret = new AbortController();
  const minuterie = setTimeout(() => arret.abort(new Error("délai")), 3 * PLAFONDS.secondes * 1000);
  const debut = Date.now();
  try {
    const r = await appelerLeFournisseur({
      modele, systeme: def.systeme(entree), message: def.message(entree), pieces: def.pieces?.(entree), schema: def.schema, sortieMax: def.sortieMax, signal: arret.signal,
    });
    return { brut: r.json, valeur: def.lire(r.json, entree), jetonsEntree: r.jetonsEntree, jetonsSortie: r.jetonsSortie, cout: coutDe(modele, r.jetonsEntree, r.jetonsSortie), duree: Date.now() - debut, erreur: null };
  } catch (e) {
    const j = jetonsDe(e);
    return { brut: null, valeur: null, ...j, cout: coutDe(modele, j.jetonsEntree, j.jetonsSortie), duree: Date.now() - debut, erreur: e instanceof Error ? e.message : String(e) };
  } finally {
    clearTimeout(minuterie);
  }
}
