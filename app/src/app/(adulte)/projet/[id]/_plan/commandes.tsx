"use client";

import { useState, type ReactNode } from "react";
import { Dialogue } from "@/composants/Dialogue";
import { useMessage } from "@/composants/Messages";
import { departDe, nomScene, type Plan, type Scene } from "@/domaine/recit";
import { designerDepart, exclureDuLivre, marquerFin, restaurer, supprimer } from "../../actions-recit";

/**
 * Commandes du menu d'une scène, les mêmes depuis sa carte dans le chapitre et depuis sa
 * page (F03.2) : départ du livre, fin de l'histoire, hors du livre, supprimer.
 */
export function useCommandesScene({
  projetId, plan, onChoisirDepart, apresSuppression,
}: {
  projetId: string; plan: Plan; onChoisirDepart: () => void; apresSuppression?: () => void;
}): {
  designer: (scene: Scene) => void;
  retirerDepart: () => void;
  basculerFin: (scene: Scene) => void;
  basculerHorsLivre: (scene: Scene) => void;
  supprimerScene: (scene: Scene) => void;
  dialogue: ReactNode;
} {
  const dire = useMessage();
  const [aConfirmer, setAConfirmer] = useState<Scene | null>(null);
  const [enCours, setEnCours] = useState(false);
  const depart = departDe(plan);

  const poserDepart = async (scene: Scene) => {
    setEnCours(true);
    const fait = await designerDepart(projetId, scene.id);
    setEnCours(false);
    setAConfirmer(null);
    if (!fait.ok) return dire({ texte: fait.erreur });
    dire({ texte: `${nomScene(scene)} est le départ du livre.`, annuler: () => void designerDepart(projetId, fait.ancien?.id ?? null) });
  };

  return {
    // Désigner un nouveau départ nomme celui qu'il remplace (F03.2)
    designer: (scene) => (depart && depart.id !== scene.id ? setAConfirmer(scene) : void poserDepart(scene)),
    retirerDepart: () => {
      if (!depart) return;
      void designerDepart(projetId, null).then((fait) =>
        dire(fait.ok ? { texte: "Le livre n’a plus de départ.", annuler: () => void designerDepart(projetId, depart.id) } : { texte: fait.erreur }),
      );
    },
    basculerFin: (scene) => {
      void marquerFin(scene.id, !scene.fin).then((fait) =>
        dire(
          fait.ok
            ? { texte: scene.fin ? `${nomScene(scene)} n’est plus une fin de l’histoire.` : `${nomScene(scene)} est une fin de l’histoire.`, annuler: () => void marquerFin(scene.id, scene.fin) }
            : { texte: fait.erreur },
        ),
      );
    },
    basculerHorsLivre: (scene) => {
      void exclureDuLivre("scene", scene.id, !scene.horsLivre).then((fait) =>
        dire(
          fait.ok
            ? {
                texte: scene.horsLivre ? `${nomScene(scene)} est de nouveau dans le livre.` : `${nomScene(scene)} est hors du livre. Elle reste dans le projet.`,
                annuler: () => void exclureDuLivre("scene", scene.id, scene.horsLivre),
              }
            : { texte: fait.erreur },
        ),
      );
    },
    // Une scène sans texte se supprime sans confirmation, avec « Annuler » (F03.1)
    supprimerScene: (scene) => {
      const etaitDepart = depart?.id === scene.id;
      void supprimer("scene", scene.id).then((fait) => {
        if (!fait.ok) return dire({ texte: fait.erreur });
        dire({
          texte: etaitDepart
            ? `${nomScene(scene)} est supprimée. Le livre n’aura plus de départ.`
            : `${nomScene(scene)} est supprimée. Vous la retrouvez dans la corbeille du projet.`,
          annuler: () => void restaurer("scene", scene.id),
          autre: etaitDepart ? { libelle: "Choisir un autre départ", faire: onChoisirDepart } : undefined,
        });
        apresSuppression?.();
      });
    },
    dialogue: aConfirmer ? (
      <Dialogue
        titre="Changer le départ du livre ?"
        onFermer={() => setAConfirmer(null)}
        boutons={
          <button type="button" className="btn btn--primaire" disabled={enCours} aria-busy={enCours || undefined} onClick={() => void poserDepart(aConfirmer)}>
            Changer le départ
          </button>
        }
      >
        <ul className="dialogue__faits">
          <li>{nomScene(aConfirmer)} devient le départ du livre.</li>
          {depart ? <li>{nomScene(depart)} ne l’est plus : un livre n’a qu’un départ.</li> : null}
        </ul>
      </Dialogue>
    ) : null,
  };
}
