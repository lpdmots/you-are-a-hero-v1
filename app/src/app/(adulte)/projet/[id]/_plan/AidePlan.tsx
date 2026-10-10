"use client";

import { useTransition } from "react";
import { EcranAide, type QuestionAide } from "@/composants/EcranAide";
import { reglerAide } from "../../../actions-compte";

/** L'aide de « Parties et chapitres », à sa première ouverture puis par « Aide » (F03.1). */
export function AidePlan({
  deClasse, aChoix, dejaVue, masquee, onCommencer,
}: {
  deClasse: boolean; aChoix: boolean; dejaVue: boolean; masquee: boolean; onCommencer: () => void;
}) {
  const [, lancer] = useTransition();
  const questions: QuestionAide[] = [
    {
      question: "Que fait-on ici ?",
      reponse: (
        <>
          <p>On dessine le plan de l’histoire, avant de l’écrire.</p>
          <ul className="aide-etape__taches">
            <li>Ajouter les parties et leurs chapitres</li>
            <li>Ajouter les scènes de chaque chapitre, avec leur consigne si on veut</li>
            {deClasse ? <li>Attribuer chaque chapitre à des élèves</li> : null}
            {aChoix ? <li>Désigner la scène de départ du livre, et ses fins</li> : null}
          </ul>
        </>
      ),
    },
    {
      question: "Partie, chapitre, scène : quelle différence ?",
      reponse: (
        <p>
          Une partie regroupe des chapitres, comme un grand lieu de l’histoire. Un chapitre regroupe des scènes.{" "}
          {aChoix ? "Une scène est un passage numéroté du livre : le lecteur y arrive par un choix." : "Une scène est un passage du récit : elles se lisent dans l’ordre."}
        </p>
      ),
    },
    ...(deClasse
      ? [
          {
            question: "Qui peut écrire où ?",
            reponse: (
              <p>
                Un élève lit et écrit dans les chapitres que vous lui attribuez, et seulement là. Il voit les cartes des autres
                chapitres, leur titre et leur image, sans pouvoir les ouvrir.
              </p>
            ),
          },
        ]
      : []),
    {
      question: "Comment changer l’ordre ?",
      reponse: <p>Tirez une carte pour la déplacer. Un chapitre se pose aussi dans une autre partie.</p>,
    },
    {
      question: "Et si je supprime par erreur ?",
      reponse: <p>Rien ne se perd : ce que vous supprimez attend dans la corbeille du projet, au bas de la page, d’où vous le restaurez.</p>,
    },
  ];
  return (
    <EcranAide
      titre="Parties et chapitres"
      dejaVue={dejaVue}
      masquee={masquee}
      onCommencer={() => {
        // L'aide ne revient pas avant la visite suivante
        document.cookie = "aide-plan=vue; path=/; samesite=lax";
        onCommencer();
      }}
      onMasquer={(m) => lancer(() => reglerAide("plan", m))}
      questions={questions}
    />
  );
}
