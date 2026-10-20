import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { enEuros } from "@/domaine/offre";
import { EntreeIllustree } from "@/composants/EntreeIllustree";
import { RENONCIATION, sessionSimulee } from "@/serveur/stripe";
import { payerEnSimulation } from "./actions";

export const metadata: Metadata = { title: "Paiement simulé" };

/**
 * La page de paiement de Stripe, simulée pour les essais (`STRIPE_SIMULE=1`) : ce qu'elle montre
 * vient de la session demandée, la case de renonciation est obligatoire. Hors essai, elle n'existe pas.
 */
export default async function Simulation({ searchParams }: { searchParams: Promise<{ session?: string; case?: string; carte?: string }> }) {
  const { session = "", case: manque, carte } = await searchParams;
  const p = sessionSimulee(session);
  if (!p) notFound();
  return (
    <EntreeIllustree titre="Paiement simulé" aide="Essais seulement : aucune carte n'est débitée.">
      <p>
        {p["line_items[0][price_data][product_data][name]"]} · <strong>{enEuros(Number(p["line_items[0][price_data][unit_amount]"]))}</strong>
      </p>
      <form action={payerEnSimulation.bind(null, session)}>
        <label>
          <input type="checkbox" name="renonciation" value="oui" /> {p["custom_text[terms_of_service_acceptance][message]"] ?? RENONCIATION}
        </label>
        <label>
          <input type="checkbox" name="carte" value="refusee" /> Carte refusée
        </label>
        {manque ? <p role="alert">Cochez la case pour payer.</p> : null}
        {carte ? <p role="alert">Votre carte a été refusée.</p> : null}
        <button type="submit" className="btn btn--primaire">Payer</button>
      </form>
      <p>
        <a href={p.cancel_url}>Retour</a>
      </p>
    </EntreeIllustree>
  );
}
