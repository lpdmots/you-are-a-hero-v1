"use client";

import { LectureClient } from "@/composants/lecture/LectureClient";
import type { LivreLu, PassageLu } from "@/domaine/lecture";

/**
 * La lecture d'essai de l'élève (F09.1) : la lecture commune, et pour bandeau le seul chapitre
 * du passage. Ni référence, ni état, ni « Hors du livre » : rien de cela ne le concerne.
 */
export function LectureEleve({ eleveId, projet, titre, livre, depart }: { eleveId: string; projet: string; titre: string; livre: LivreLu; depart: string }) {
  const bandeau = (p: PassageLu) => (
    <div className="lu-bandeau">
      <span className="lu-bandeau__chapitre">
        <span className="lu-bandeau__pastille" aria-hidden="true" />
        {p.chapitre.titre}
      </span>
    </div>
  );
  return (
    <div className="page--eleve">
        <LectureClient
          livre={livre}
          depart={depart}
          pourEleve
          cle={`lecture-essai:${projet}:${eleveId}`}
          reprendre={false}
          titre="Lire à l’essai"
          sousTitre={titre}
          quitter={`/travail/lecture/${projet}`}
          bandeau={bandeau}
        />
    </div>
  );
}
