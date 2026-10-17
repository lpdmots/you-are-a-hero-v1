import "server-only";
import { PLAFONDS, messageDuRefus, resteDuJour, type RefusIa, type ReglagesIa } from "@/domaine/aides-ia";
import { clientService } from "../supabase";
import type { DefinitionAide } from "./aide";
import { appelerLeFournisseur, jetonsDe } from "./fournisseurs";
import { MODELES, MODELE_DES_AIDES, coutDe, type IdModele } from "./modeles";

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
 */

export type ResultatIa<S> =
  | { ok: true; valeur: S; /** « Encore 8 demandes aujourd'hui. », ou rien */ reste: string | null }
  | { ok: false; refus: RefusIa; message: string };

export type Demandeur = { id: string; reglagesIa: ReglagesIa };

const refus = <S>(r: RefusIa): ResultatIa<S> => ({ ok: false, refus: r, message: messageDuRefus(r) });

/** Le mode simulé est-il demandé ? Une valeur inconnue est une erreur : mieux vaut un essai qui tombe qu'un appel payé. */
export function simulation(): "reponse" | "echec" | "delai" | null {
  const v = process.env.IA_SIMULEE;
  if (!v) return null;
  if (v === "1") return "reponse";
  if (v === "echec" || v === "delai") return v;
  throw new Error(`IA_SIMULEE inconnue : ${v}`);
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
  if (simulee === "echec") return { json: null, jetonsEntree: 0, jetonsSortie: 0, fournisseur: "simule" };
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
  const base = clientService();
  const modele = MODELE_DES_AIDES[def.aide];
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
