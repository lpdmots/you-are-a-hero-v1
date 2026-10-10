"use client";

import { useTransition } from "react";
import { EcranAide, type QuestionAide } from "@/composants/EcranAide";
import { reglerAide } from "../../../actions-compte";

/**
 * L'aide de la Préparation, à sa première ouverture puis par « Aide » (10 octobre 2026). Le
 * carnet peut impressionner : elle dit d'abord que rien n'y est obligatoire, et qu'on
 * commence à écrire sans l'avoir rempli (F02-AC07).
 */
export function AidePreparation({
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
          <p>
            {deClasse ? "On note ce que la classe décide avant d’écrire." : "On note ce que vous décidez avant d’écrire."} Rien n’est
            obligatoire : remplissez ce qui vous sert, et commencez à écrire quand vous voulez.
          </p>
          <ul className="aide-etape__taches">
            <li>Où se passe l’histoire</li>
            <li>Qui est le héros</li>
            <li>Ce qu’il doit réussir</li>
            <li>Par où passe l’histoire : ses grandes étapes</li>
          </ul>
        </>
      ),
    },
    {
      question: "Faut-il tout remplir avant d’écrire ?",
      reponse: (
        <p>
          Non. Une ligne suffit, ou rien du tout. Les parties, les chapitres et les scènes se créent sans attendre le carnet, et vous y
          revenez à tout moment.
        </p>
      ),
    },
    ...(deClasse
      ? [
          {
            question: "Comment le faire avec la classe ?",
            reponse: (
              <p>
                « Projeter l’atelier » montre une question à la fois, en grand. Vous notez les idées des élèves, puis ce que la classe
                retient : tout se retrouve dans le carnet. Les élèves n’ont pas besoin de se connecter.
              </p>
            ),
          },
        ]
      : []),
    ...(aChoix
      ? [
          {
            question: "À quoi servent les rubriques du bas ?",
            reponse: (
              <p>
                « Phrases de choix » et « Objets et formules » règlent le livre-jeu : la façon d’écrire un choix, la feuille d’aventure, le
                dé. Elles peuvent attendre que l’histoire avance.
              </p>
            ),
          },
        ]
      : []),
  ];
  return (
    <EcranAide
      titre="Préparation"
      dejaVue={dejaVue}
      masquee={masquee}
      onCommencer={() => {
        // L'aide ne revient pas avant la visite suivante
        document.cookie = "aide-preparation=vue; path=/; samesite=lax";
        onCommencer();
      }}
      onMasquer={(m) => lancer(() => reglerAide("preparation", m))}
      questions={questions}
    />
  );
}
