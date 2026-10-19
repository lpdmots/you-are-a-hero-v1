import "server-only";
import { PLAFONDS, TAILLES_DES_IMAGES, messageDuRefus, qualiteDeLImage, resteDuJour, type AideImage, type RefusIa, type ReglagesIa, type UsageDImage } from "@/domaine/aides-ia";
import { clientService } from "../supabase";
import type { DefinitionAide } from "./aide";
import { appelerLeFournisseur, creerDesImages, jetonsDe, type RequeteImages } from "./fournisseurs";
import { OBJET_1, OBJET_2, PORTRAIT_1, PORTRAIT_2, SCENE_1, SCENE_2 } from "./images-simulees";
import { MODELES, MODELE_DES_AIDES, MODELE_DES_IMAGES, coutDe, coutDesImages, type IdModele } from "./modeles";

/**
 * Demander une aide (F13, cadre commun) : une demande à la fois par adulte, sous les plafonds
 * du jour et du mois, soixante secondes au plus, notée au journal sans son contenu. Rien de
 * ce qui arrive ici ne change le travail de l'adulte : l'aide rend une proposition, ou dit
 * pourquoi elle n'en a pas.
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
  | { ok: true; valeur: S; /** « Encore 8 demandes aujourd'hui. », ou rien */ reste: string | null }
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
 * Les clés du fournisseur sont-elles posées ? Sans elles, rien ne part et rien ne compte dans les
 * plafonds : « Les aides IA ne sont pas installées sur ce site » (lot 9 de l'étape 8).
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
    modele, systeme: def.systeme(entree), message: def.message(entree), schema: def.schema, sortieMax: def.sortieMax, signal,
  });
  return { ...r, fournisseur: MODELES[modele].fournisseur };
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

  const { data: debut, error } = await base.rpc("commencer_appel_ia", {
    p_enseignant: adulte.id, p_aide: def.aide, p_sorte: "texte", p_nombre: 1,
    p_par_jour: PLAFONDS.textesParJour, p_mois_usd: null, p_attente: Math.ceil(delaiMs / 1000) + 15,
  });
  if (error) throw new Error(`Journal des aides : ${error.message}`);
  const commence = debut as { id?: string; restant?: number; refus?: "occupe" | "jour" | "mois" };
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
  return { ok: true, valeur, reste: resteDuJour("texte", commence.restant ?? PLAFONDS.textesParJour) };
}

export type ResultatImages =
  | { ok: true; images: Uint8Array[]; qualite: "normale" | "haute"; /** « Encore 3 images aujourd'hui. », ou rien */ reste: string | null }
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
 * texte : une demande à la fois, vingt images par jour (chaque image d'une création compte), le
 * plafond du mois pour toute l'application, le journal sans contenu. La qualité suit le réglage
 * du compte et l'usage (F10-AC37). Rien n'est gardé ici : la page propose, l'adulte garde.
 */
export async function demanderDesImages(adulte: Demandeur, demande: DemandeDImages, options: { delaiMs?: number } = {}): Promise<ResultatImages> {
  if (!adulte.reglagesIa.proposer) return refusImage("eteint");
  if (!clePosee("openai")) return refusImage("absentes");
  const base = clientService();
  const nombre = demande.nombre ?? adulte.reglagesIa.imagesParCreation;
  const qualite = qualiteDeLImage(adulte.reglagesIa.qualite, demande.usage);
  const delaiMs = options.delaiMs ?? PLAFONDS.secondesImage * 1000;

  const { data: debut, error } = await base.rpc("commencer_appel_ia", {
    p_enseignant: adulte.id, p_aide: demande.aide, p_sorte: "image", p_nombre: nombre,
    p_par_jour: PLAFONDS.imagesParJour, p_mois_usd: PLAFONDS.imagesParMoisUsd, p_attente: Math.ceil(delaiMs / 1000) + 15,
  });
  if (error) throw new Error(`Journal des aides : ${error.message}`);
  const commence = debut as { id?: string; restant?: number; refus?: "occupe" | "jour" | "mois" };
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
  return { ok: true, images, qualite, reste: resteDuJour("image", commence.restant ?? PLAFONDS.imagesParJour) };
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
      modele, systeme: def.systeme(entree), message: def.message(entree), schema: def.schema, sortieMax: def.sortieMax, signal: arret.signal,
    });
    return { brut: r.json, valeur: def.lire(r.json, entree), jetonsEntree: r.jetonsEntree, jetonsSortie: r.jetonsSortie, cout: coutDe(modele, r.jetonsEntree, r.jetonsSortie), duree: Date.now() - debut, erreur: null };
  } catch (e) {
    const j = jetonsDe(e);
    return { brut: null, valeur: null, ...j, cout: coutDe(modele, j.jetonsEntree, j.jetonsSortie), duree: Date.now() - debut, erreur: e instanceof Error ? e.message : String(e) };
  } finally {
    clearTimeout(minuterie);
  }
}
