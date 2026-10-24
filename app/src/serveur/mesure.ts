import "server-only";
import { track } from "@vercel/analytics/server";
import { headers } from "next/headers";
import { clientService } from "./supabase";

/**
 * Les conversions (F14-AC50), envoyées par le serveur à Vercel Web Analytics : elles ne dépendent ni
 * d'un bloqueur de publicité ni d'un témoin. Le seul point d'envoi : une conversion publicitaire
 * (Google Ads, derrière le bandeau) s'y ajoutera le jour où elle viendra. Les chiffres qui font foi
 * restent ceux de la base.
 */
export type Conversion =
  | { evenement: "compte_cree"; methode: "adresse" | "google" }
  | { evenement: "projet_cree"; organisation: "classe" | "personnel" }
  | { evenement: "pass_achete"; euros: number }
  | { evenement: "recharge_achetee"; euros: number };

/**
 * Envoie une conversion, sans le nom ni l'adresse de personne ; les comptes du porteur n'en envoient
 * aucune. Une mesure qui échoue n'empêche rien. Hors de Vercel, elle ne part pas (la bibliothèque
 * l'écrit seulement dans le journal).
 */
export async function mesurer(conversion: Conversion, enseignantId: string, createur?: boolean): Promise<void> {
  try {
    if (createur ?? (await estLePorteur(enseignantId))) return;
    const { evenement, ...proprietes } = conversion;
    // Le navigateur et l'adresse réseau de la demande, pour reconnaître le visiteur comme le fait la page
    // vue ; pas ses témoins, que la bibliothèque enverrait sinon
    const entetes = await headers();
    await track(evenement, proprietes, {
      headers: { "user-agent": entetes.get("user-agent") ?? undefined, "x-forwarded-for": entetes.get("x-forwarded-for") ?? undefined },
    });
  } catch {
    // La mesure ne compte pas assez pour faire échouer un compte, un projet ou un paiement
  }
}

async function estLePorteur(enseignantId: string): Promise<boolean> {
  const { data } = await clientService().from("enseignants").select("createur").eq("id", enseignantId).maybeSingle();
  return data?.createur === true;
}
