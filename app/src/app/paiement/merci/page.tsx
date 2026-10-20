import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { exigerEnseignant } from "@/serveur/adulte";
import { estSimule, inscrireLePaiement, relireLaSession } from "@/serveur/stripe";
import { EntreeIllustree } from "@/composants/EntreeIllustree";

export const metadata: Metadata = { title: "Paiement" };

/**
 * Le retour de Stripe après un paiement (F14-AC18, AC19). La session se relit chez Stripe et
 * s'inscrit, si l'avis ne l'a pas déjà fait ; puis l'enseignant retrouve son projet, ou ses
 * étoiles. Tant que Stripe n'a pas confirmé, la page se relit seule.
 */
export default async function Merci({ searchParams }: { searchParams: Promise<{ session?: string }> }) {
  const e = await exigerEnseignant();
  const { session } = await searchParams;
  if (!session || !/^cs_[A-Za-z0-9_]{3,200}$/.test(session)) redirect("/projets");
  if (!estSimule()) {
    const lue = await relireLaSession(session);
    if (lue && lue.enseignant === e.id) await inscrireLePaiement(lue);
  }
  const { data: paiement } = await e.supabase.from("paiements").select("achat, projet_id").eq("session", session).maybeSingle();
  if (paiement?.achat === "pass") redirect(`/projet/${paiement.projet_id}/plan?message=pass`);
  if (paiement?.achat === "recharge") redirect("/projets?message=recharge");
  return (
    <EntreeIllustree titre="Paiement reçu" aide="Stripe confirme le paiement : cela prend quelques secondes.">
      <meta httpEquiv="refresh" content="3" />
      <p role="status">Cette page se met à jour toute seule.</p>
    </EntreeIllustree>
  );
}
