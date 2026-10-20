import type { ReactNode } from "react";
import { AidesIa } from "@/composants/AidesIa";
import { BarreAdulte } from "@/composants/BarreAdulte";
import { Messages } from "@/composants/Messages";
import { OffreDuPass } from "@/composants/OffreDuPass";
import { ProjetCourant } from "@/composants/ProjetCourant";
import { exigerEnseignant } from "@/serveur/adulte";
import { projetDe } from "@/serveur/lectures";
import { offreActuelle } from "@/serveur/offre";
import { paiementInstalle } from "@/serveur/stripe";
import { enEuros } from "@/domaine/offre";

/** Espace de l'adulte : la barre du haut est globale (F06.5, 4 octobre 2026). */
export default async function EspaceAdulte({ children }: { children: ReactNode }) {
  const enseignant = await exigerEnseignant();
  const [dernier, offre] = await Promise.all([
    enseignant.dernierProjetId ? projetDe(enseignant, enseignant.dernierProjetId) : Promise.resolve(null),
    offreActuelle(),
  ]);
  // « Recharger », dans « Mon compte » : « Paiement ouvert » allumé, le paiement installé, hors porteur (F14-AC19)
  const recharge = offre.paiementOuvert && !enseignant.createur && paiementInstalle() ? `Recharger · ${enEuros(offre.prixDeLaRecharge)} pour ${offre.etoilesDeLaRecharge} ✦` : null;
  return (
    <Messages>
      <ProjetCourant depart={dernier ? { id: dernier.id, titre: dernier.titre, onglet: dernier.dernierOnglet } : null}>
        <AidesIa reglages={enseignant.reglagesIa}>
          <BarreAdulte nomAffiche={enseignant.nomAffiche} courriel={enseignant.courriel} reglagesIa={enseignant.reglagesIa} etoiles={enseignant.etoiles} recharge={recharge} />
          <main>{children}</main>
          {/* Le dialogue d'une limite gratuite atteinte, ouvert d'où qu'on soit (F14-AC13, AC14) */}
          <OffreDuPass />
        </AidesIa>
      </ProjetCourant>
    </Messages>
  );
}
