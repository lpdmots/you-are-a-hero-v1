import "server-only";
import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { clientService } from "./supabase";

/**
 * Stripe Checkout (F14, « Paiement ») : deux achats uniques, par carte, sans abonnement. On parle à
 * l'API de Stripe directement, sans sa bibliothèque : trois appels suffisent (créer une session,
 * la relire, vérifier un avis signé).
 *
 * La page de paiement est celle de Stripe : elle exige la case de renonciation au droit de
 * rétractation (F14-AC18) et produit la facture. Un paiement reçu s'inscrit une seule fois, qu'il
 * arrive par l'avis de Stripe ou par la page de remerciement, qui relit la session (F14-AC19).
 *
 * Pendant les essais automatiques, `STRIPE_SIMULE=1` remplace Stripe : aucune session n'est
 * créée chez lui, la dernière demande se garde pour être vérifiée, et la page de paiement simulée
 * renvoie à l'adresse de retour, ou d'abandon. Aucun essai n'appelle Stripe.
 */

export const RENONCIATION = "Je demande l’accès immédiat et renonce à mon droit de rétractation.";

export type Achat = { achat: "pass"; projetId: string } | { achat: "recharge" };
export type Commande = Achat & {
  enseignantId: string;
  courriel: string | null;
  /** En centimes d'euro, lu dans les réglages de l'application */
  montant: number;
  libelle: string;
  /** Après le paiement, et après un abandon : les deux sur ce site */
  merci: string;
  abandon: string;
};

const simule = () => process.env.STRIPE_SIMULE === "1";
// Les sessions simulées, partagées entre les pages et les adresses du serveur d'essai
const memoire = globalThis as { __sessionsSimulees?: Map<string, Record<string, string>>; __derniereSession?: string };
const sessions = () => (memoire.__sessionsSimulees ??= new Map());
/** La dernière session demandée en simulation, telle qu'elle serait partie chez Stripe. */
export const derniereSessionSimulee = (): Record<string, string> | null => (memoire.__derniereSession ? (sessions().get(memoire.__derniereSession) ?? null) : null);
/** Une session simulée, par son identifiant ; null hors simulation. */
export const sessionSimulee = (id: string): Record<string, string> | null => (simule() ? (sessions().get(id) ?? null) : null);
export const estSimule = simule;

function cle(): string | null {
  return process.env.STRIPE_CLE_SECRETE || null;
}

/** Le paiement est-il installé sur ce site ? Sans clé, aucun achat ne se propose. */
export const paiementInstalle = (): boolean => simule() || Boolean(cle());

/** Les paramètres de la session, à la façon des formulaires que l'API de Stripe reçoit. */
export function parametresDeLaSession(c: Commande): Record<string, string> {
  return {
    mode: "payment",
    locale: "fr",
    // Les moyens de paiement se règlent dans le tableau de bord de Stripe (la carte seule) :
    // son API refuse désormais `payment_method_types` pour une session de paiement.
    "line_items[0][quantity]": "1",
    "line_items[0][price_data][currency]": "eur",
    "line_items[0][price_data][unit_amount]": String(c.montant),
    "line_items[0][price_data][product_data][name]": c.libelle,
    ...(c.courriel ? { customer_email: c.courriel } : {}),
    client_reference_id: c.enseignantId,
    "metadata[achat]": c.achat,
    "metadata[enseignant]": c.enseignantId,
    ...(c.achat === "pass" ? { "metadata[projet]": c.projetId } : {}),
    // La facture, envoyée par Stripe à chaque paiement
    "invoice_creation[enabled]": "true",
    // La case obligatoire de renonciation au droit de rétractation (F14-AC18)
    "consent_collection[terms_of_service]": "required",
    "custom_text[terms_of_service_acceptance][message]": RENONCIATION,
    success_url: `${c.merci}${c.merci.includes("?") ? "&" : "?"}session={CHECKOUT_SESSION_ID}`,
    cancel_url: c.abandon,
  };
}

/** Ouvre une session de paiement et rend son adresse chez Stripe ; null si elle n'a pas pu s'ouvrir. */
export async function ouvrirLePaiement(c: Commande): Promise<string | null> {
  const parametres = parametresDeLaSession(c);
  if (simule()) {
    const session = `cs_simule_${randomUUID().replace(/-/g, "")}`;
    sessions().set(session, parametres);
    memoire.__derniereSession = session;
    return `/paiement/simulation?session=${session}`;
  }
  const secrete = cle();
  if (!secrete) return null;
  const reponse = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: { Authorization: `Bearer ${secrete}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(parametres),
  });
  if (!reponse.ok) {
    const erreur = ((await reponse.json().catch(() => null)) as { error?: { param?: string; message?: string } } | null)?.error;
    console.error(`Stripe : session refusée (${reponse.status}${erreur?.param ? `, ${erreur.param}` : ""}) ${erreur?.message ?? ""}`.trim());
    return null;
  }
  const json = (await reponse.json()) as { url?: string };
  return json.url ?? null;
}

/** Une session telle que Stripe la décrit : ce qui sert à inscrire le paiement. */
export type SessionPayee = { id: string; payee: boolean; montant: number; achat: string | null; enseignant: string | null; projet: string | null };

export function lireLaSession(objet: unknown): SessionPayee | null {
  const o = objet as { id?: unknown; payment_status?: unknown; amount_total?: unknown; metadata?: Record<string, unknown> } | null;
  if (!o || typeof o.id !== "string") return null;
  const m = o.metadata ?? {};
  return {
    id: o.id,
    payee: o.payment_status === "paid",
    montant: typeof o.amount_total === "number" ? o.amount_total : 0,
    achat: typeof m.achat === "string" ? m.achat : null,
    enseignant: typeof m.enseignant === "string" ? m.enseignant : null,
    projet: typeof m.projet === "string" ? m.projet : null,
  };
}

/** Relit une session chez Stripe, depuis la page de remerciement. */
export async function relireLaSession(id: string): Promise<SessionPayee | null> {
  const secrete = cle();
  if (!secrete || !/^cs_[A-Za-z0-9_]+$/.test(id)) return null;
  const reponse = await fetch(`https://api.stripe.com/v1/checkout/sessions/${id}`, { headers: { Authorization: `Bearer ${secrete}` } });
  return reponse.ok ? lireLaSession(await reponse.json()) : null;
}

/**
 * Vérifie la signature d'un avis de Stripe (en-tête « Stripe-Signature » : « t=…,v1=… »), sur le
 * corps tel qu'il est arrivé, et rend l'événement ; null s'il n'est pas de Stripe ou trop vieux.
 */
export function avisVerifie(corps: string, signature: string | null, secret: string | undefined, maintenant = Date.now()): { type: string; data: { object: unknown } } | null {
  if (!signature || !secret) return null;
  const parties = Object.fromEntries(signature.split(",").map((p) => p.split("=", 2) as [string, string]));
  const t = Number(parties.t);
  const v1 = signature.split(",").filter((p) => p.startsWith("v1=")).map((p) => p.slice(3));
  if (!Number.isFinite(t) || !v1.length || Math.abs(maintenant / 1000 - t) > 300) return null;
  const attendu = createHmac("sha256", secret).update(`${t}.${corps}`).digest();
  const bon = v1.some((s) => {
    const recu = Buffer.from(s, "hex");
    return recu.length === attendu.length && timingSafeEqual(recu, attendu);
  });
  if (!bon) return null;
  try {
    return JSON.parse(corps);
  } catch {
    return null;
  }
}

/** Signe un avis comme Stripe le ferait : pour les essais seulement. */
export function signerUnAvis(corps: string, secret: string, t = Math.floor(Date.now() / 1000)): string {
  return `t=${t},v1=${createHmac("sha256", secret).update(`${t}.${corps}`).digest("hex")}`;
}

/**
 * Inscrit un paiement reçu et donne ce qu'il achète, une seule fois (F14-AC19). Une session non
 * payée, ou qui ne dit pas ce qu'elle achète, n'inscrit rien.
 */
export async function inscrireLePaiement(s: SessionPayee): Promise<boolean> {
  if (!s.payee || !s.enseignant || (s.achat !== "pass" && s.achat !== "recharge") || (s.achat === "pass" && !s.projet) || s.montant <= 0) return false;
  const { data, error } = await clientService().rpc("enregistrer_paiement", {
    p_session: s.id, p_enseignant: s.enseignant, p_achat: s.achat, p_projet: s.projet, p_montant: s.montant,
  });
  if (error) throw new Error(`Paiement : ${error.message}`);
  return data === true;
}
