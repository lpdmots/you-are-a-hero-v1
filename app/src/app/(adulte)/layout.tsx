import { cookies } from "next/headers";
import { Suspense, type ReactNode } from "react";
import { AidesIa } from "@/composants/AidesIa";
import { DicteeDeLAdulte } from "@/composants/dictee/Dictee";
import { EspaceAdulte } from "@/composants/EspaceAdulte";
import { TEMOIN_COLONNE, type Repli } from "@/domaine/projets";
import { Messages } from "@/composants/Messages";
import { OffreDuPass } from "@/composants/OffreDuPass";
import { MerciDeLaRecharge, PlusDEtoiles } from "@/composants/PlusDEtoiles";
import { ProjetCourant } from "@/composants/ProjetCourant";
import { exigerEnseignant } from "@/serveur/adulte";
import { projetDe, projetDeLaColonne } from "@/serveur/lectures";

/**
 * Espace de l'adulte : une colonne de navigation à gauche, la même partie partout (F06.5, révisé le
 * 8 novembre 2026). Elle montre le dernier projet ouvert, que chaque page du projet tient à jour.
 */
export default async function Espace({ children }: { children: ReactNode }) {
  const enseignant = await exigerEnseignant();
  const dernier = enseignant.dernierProjetId ? await projetDe(enseignant, enseignant.dernierProjetId) : null;
  const [colonne, magasin] = await Promise.all([dernier ? projetDeLaColonne(enseignant, dernier) : null, cookies()]);
  const temoin = magasin.get(TEMOIN_COLONNE)?.value;
  const repli: Repli = temoin === "repliee" || temoin === "ouverte" ? temoin : null;
  return (
    <Messages>
      <ProjetCourant depart={colonne}>
        <AidesIa reglages={enseignant.reglagesIa}>
          {/* Le micro de la dictée, dans les champs de l'adulte et sa copie (F07.4) */}
          <DicteeDeLAdulte>
            <EspaceAdulte nomAffiche={enseignant.nomAffiche} courriel={enseignant.courriel} etoiles={enseignant.etoiles} admin={enseignant.createur} repli={repli}>
              {children}
            </EspaceAdulte>
          </DicteeDeLAdulte>
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
