"use server";

import { headers } from "next/headers";
import { exigerEnseignant } from "@/serveur/adulte";
import { adresseDuSite } from "@/serveur/env";
import { offreActuelle } from "@/serveur/offre";
import { estUuid } from "@/serveur/recit";
import { ouvrirLePaiement, paiementInstalle } from "@/serveur/stripe";

/**
 * Acheter (F14-AC18, AC19) : le pass d'un projet ou une recharge d'étoiles, par Stripe Checkout.
 * Rien ne se vend « Paiement ouvert » éteint, ni au porteur. Le prix vient des réglages de
 * l'application (F14-AC21). `retour` : la page d'où l'on part, où ramène un abandon (F14-AC20).
 */
type Reponse = { ok: true; adresse: string } | { ok: false; erreur: string };

const FERME = "Les achats ne sont pas ouverts.";
const PAS_OUVERT = "Le paiement n’a pas pu s’ouvrir. Réessayez dans un moment.";

/** Une page de ce site, et rien d'autre : un abandon n'envoie jamais ailleurs. */
const pageDuSite = (chemin: unknown, parDefaut: string): string =>
  typeof chemin === "string" && /^\/(?!\/)[^\s\\]{0,300}$/.test(chemin) ? chemin : parDefaut;

export async function acheterLePass(projetId: string, retour?: string): Promise<Reponse> {
  const e = await exigerEnseignant();
  if (!estUuid(projetId)) return { ok: false, erreur: "Projet inconnu." };
  const [offre, { data: projet }, { data: pass }] = await Promise.all([
    offreActuelle(),
    e.supabase.from("projets").select("titre").eq("id", projetId).maybeSingle(),
    e.supabase.from("passes").select("projet_id").eq("projet_id", projetId).maybeSingle(),
  ]);
  if (!projet) return { ok: false, erreur: "Projet inconnu." };
  if (!offre.paiementOuvert || e.createur || !paiementInstalle()) return { ok: false, erreur: FERME };
  if (pass) return { ok: false, erreur: "Ce livre a déjà son pass." };
  const site = adresseDuSite((await headers()).get("host"));
  const adresse = await ouvrirLePaiement({
    achat: "pass", projetId, enseignantId: e.id, courriel: e.courriel, montant: offre.prixDuPass,
    libelle: `Pass du livre « ${String(projet.titre).slice(0, 120)} »`,
    merci: `${site}/paiement/merci`,
    abandon: `${site}${pageDuSite(retour, `/projet/${projetId}/plan`)}`,
  });
  return adresse ? { ok: true, adresse } : { ok: false, erreur: PAS_OUVERT };
}

export async function acheterUneRecharge(retour?: string): Promise<Reponse> {
  const e = await exigerEnseignant();
  const offre = await offreActuelle();
  if (!offre.paiementOuvert || e.createur || !paiementInstalle()) return { ok: false, erreur: FERME };
  const site = adresseDuSite((await headers()).get("host"));
  const adresse = await ouvrirLePaiement({
    achat: "recharge", enseignantId: e.id, courriel: e.courriel, montant: offre.prixDeLaRecharge,
    libelle: `Recharge de ${offre.etoilesDeLaRecharge} étoiles pour les aides IA`,
    merci: `${site}/paiement/merci`,
    abandon: `${site}${pageDuSite(retour, "/projets")}`,
  });
  return adresse ? { ok: true, adresse } : { ok: false, erreur: PAS_OUVERT };
}
