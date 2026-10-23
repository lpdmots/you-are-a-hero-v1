import { Suspense, type ReactNode } from "react";
import { AidesIa } from "@/composants/AidesIa";
import { BarreAdulte } from "@/composants/BarreAdulte";
import { Messages } from "@/composants/Messages";
import { OffreDuPass } from "@/composants/OffreDuPass";
import { MerciDeLaRecharge, PlusDEtoiles } from "@/composants/PlusDEtoiles";
import { ProjetCourant } from "@/composants/ProjetCourant";
import { exigerEnseignant } from "@/serveur/adulte";
import { projetDe } from "@/serveur/lectures";

/** Espace de l'adulte : la barre du haut est globale (F06.5, 4 octobre 2026). */
export default async function EspaceAdulte({ children }: { children: ReactNode }) {
  const enseignant = await exigerEnseignant();
  const dernier = enseignant.dernierProjetId ? await projetDe(enseignant, enseignant.dernierProjetId) : null;
  return (
    <Messages>
      <ProjetCourant depart={dernier ? { id: dernier.id, titre: dernier.titre, onglet: dernier.dernierOnglet } : null}>
        <AidesIa reglages={enseignant.reglagesIa}>
          <BarreAdulte nomAffiche={enseignant.nomAffiche} courriel={enseignant.courriel} etoiles={enseignant.etoiles} admin={enseignant.createur} />
          <main>{children}</main>
          {/* Le dialogue d'une limite gratuite atteinte, ouvert d'où qu'on soit (F14-AC13, AC14) */}
          <OffreDuPass />
          {/* La recharge, quand une aide est refusée faute d'étoiles (F14-AC38) */}
          <PlusDEtoiles />
          {/* Le merci d'une recharge payée, sur la page d'où l'on a rechargé (F14-AC44) */}
          <Suspense fallback={null}>
            <MerciDeLaRecharge solde={enseignant.etoiles} />
          </Suspense>
        </AidesIa>
      </ProjetCourant>
    </Messages>
  );
}
