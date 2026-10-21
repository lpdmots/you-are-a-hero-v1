import type { Metadata } from "next";
import { exigerEnseignant } from "@/serveur/adulte";
import { aUnMotDePasse } from "@/serveur/compte";
import { offreActuelle } from "@/serveur/offre";
import { paiementInstalle } from "@/serveur/stripe";
import { enEuros } from "@/domaine/offre";
import { MonCompte } from "./MonCompte";

export const metadata: Metadata = { title: "Mon compte" };

const MESSAGES: Record<string, string> = {
  recharge: "Vos étoiles sont arrivées.",
  adresse: "Votre nouvelle adresse est confirmée. Entrez désormais avec elle.",
  "adresse-une": "Lien accepté. Ouvrez aussi celui envoyé à l’autre adresse.",
  "adresse-refusee": "Ce lien ne vaut plus. Demandez-en un nouveau.",
};

/** « Mon compte » : une page depuis le 21 octobre 2026, le volet ne tenant plus tant de réglages (F01-AC30, F13, F14). */
export default async function PageMonCompte({ searchParams }: { searchParams: Promise<{ message?: string }> }) {
  const enseignant = await exigerEnseignant();
  const [offre, { message }, { data }] = await Promise.all([offreActuelle(), searchParams, enseignant.supabase.auth.getUser()]);
  // « Recharger » : « Paiement ouvert » allumé, le paiement installé, hors porteur (F14-AC19)
  const recharge =
    offre.paiementOuvert && !enseignant.createur && paiementInstalle()
      ? `Recharger · ${enEuros(offre.prixDeLaRecharge)} pour ${offre.etoilesDeLaRecharge} ✦`
      : null;
  return (
    <MonCompte
      nomAffiche={enseignant.nomAffiche}
      courriel={enseignant.courriel}
      reglagesIa={enseignant.reglagesIa}
      etoiles={enseignant.etoiles}
      recharge={recharge}
      porteur={enseignant.createur}
      motDePasse={aUnMotDePasse(data.user)}
      adresseEnAttente={data.user?.new_email ?? null}
      // Au retour d'une recharge payée (F14-AC19) ou d'un lien de changement d'adresse
      message={message ? MESSAGES[message] : undefined}
    />
  );
}
