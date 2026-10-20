"use server";

import { redirect } from "next/navigation";
import { inscrireLePaiement, sessionSimulee } from "@/serveur/stripe";

/**
 * La page de paiement simulée (`STRIPE_SIMULE=1`, essais seulement) : « Payer » inscrit le
 * paiement comme le ferait l'avis de Stripe, puis renvoie à l'adresse de remerciement ;
 * « Retour » renvoie à l'adresse d'abandon. Sans la case de renonciation, rien ne se paie.
 */
export async function payerEnSimulation(session: string, formulaire: FormData): Promise<void> {
  const p = sessionSimulee(session);
  if (!p) redirect("/projets");
  if (formulaire.get("renonciation") !== "oui") redirect(`/paiement/simulation?session=${session}&case=manquante`);
  if (formulaire.get("carte") === "refusee") redirect(`/paiement/simulation?session=${session}&carte=refusee`);
  await inscrireLePaiement({
    id: session, payee: true, montant: Number(p["line_items[0][price_data][unit_amount]"]),
    achat: p["metadata[achat]"] ?? null, enseignant: p["metadata[enseignant]"] ?? null, projet: p["metadata[projet]"] ?? null,
  });
  redirect(p.success_url.replace("{CHECKOUT_SESSION_ID}", session));
}
