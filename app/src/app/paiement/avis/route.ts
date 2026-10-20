import { avisVerifie, inscrireLePaiement, lireLaSession } from "@/serveur/stripe";

/**
 * L'avis de Stripe (F14-AC19) : une session de paiement terminée. Seul un avis signé du secret
 * de ce site est lu ; un paiement déjà inscrit ne donne rien de plus. Stripe réessaie tant que
 * la réponse n'est pas 200.
 */
export async function POST(request: Request): Promise<Response> {
  const corps = await request.text();
  const avis = avisVerifie(corps, request.headers.get("stripe-signature"), process.env.STRIPE_SECRET_AVIS);
  if (!avis) return new Response(null, { status: 400 });
  if (avis.type === "checkout.session.completed" || avis.type === "checkout.session.async_payment_succeeded") {
    const session = lireLaSession(avis.data?.object);
    if (session) await inscrireLePaiement(session);
  }
  return new Response(null, { status: 200 });
}
