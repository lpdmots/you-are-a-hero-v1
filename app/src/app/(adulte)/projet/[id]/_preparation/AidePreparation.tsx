"use client";

import { useTransition } from "react";
import { useAidesIa } from "@/composants/AidesIa";
import { EcranAide, type QuestionAide } from "@/composants/EcranAide";
import { Icone } from "@/composants/Icone";
import { reglerAide } from "../../../actions-compte";

/**
 * L'aide de la Préparation, à sa première ouverture puis par « Aide » (10 octobre 2026, reprise
 * pour le parcours en étapes le 18 octobre). La préparation peut impressionner : elle dit
 * d'abord que rien n'y est obligatoire (F02-AC07) ; aides proposées, que ce carnet donne leur
 * contexte aux aides de la suite (F02-AC02).
 */
export function AidePreparation({
  deClasse, aChoix, dejaVue, masquee, onCommencer,
}: {
  deClasse: boolean; aChoix: boolean; dejaVue: boolean; masquee: boolean; onCommencer: () => void;
}) {
  const [, lancer] = useTransition();
  const { proposer } = useAidesIa();
  const questions: QuestionAide[] = [
    {
      question: "Que fait-on ici ?",
      reponse: (
        <>
          <p>
            {deClasse ? "On note ce que la classe décide avant d’écrire," : "On note ce que vous décidez avant d’écrire,"} une étape après
            l’autre. Rien n’est obligatoire : remplissez ce qui vous sert, et commencez à écrire quand vous voulez.
          </p>
          <ul className="aide-etape__taches">
            <li>Univers : où se passe l’histoire</li>
            <li>Personnages : qui est le héros</li>
            <li>Enjeu : ce qu’il doit réussir</li>
            <li>Grandes étapes : les parties du livre</li>
          </ul>
        </>
      ),
    },
    {
      question: "Comment avance une étape ?",
      reponse: (
        <p>
          {deClasse
            ? "Posez les questions à la classe, notez ses idées, retenez celles qui plaisent. Ce que la classe décide s’écrit dans « Nous retenons » : l’étape est alors cochée."
            : "Répondez aux questions, notez vos idées, retenez celles qui vous plaisent. Ce que vous décidez s’écrit dans « Je retiens » : l’étape est alors cochée."}
        </p>
      ),
    },
    ...(deClasse
      ? [
          {
            question: "Comment le faire avec la classe ?",
            reponse: (
              <p>
                « Projeter » montre l’étape en grand, sans le reste de l’application. Vous notez pendant la discussion : tout reste dans la
                préparation. Les élèves n’ont pas besoin de se connecter.
              </p>
            ),
          },
        ]
      : []),
    ...(proposer
      ? [
          {
            question: "Que fait l’IA ici ?",
            reponse: (
              <>
                <p>
                  Le petit bouton <Icone nom="ia" /> ajoute une question ou une idée, une à la fois. Elle arrive « à discuter » : vous la
                  retenez, l’écartez ou la supprimez. « Rédiger d’après les idées » propose un texte, qui ne remplace rien sans votre accord.
                </p>
                <p>
                  Cette préparation sert aussi aux aides de la suite : consignes, idées de choix, corrections. Plus elle est précise, mieux
                  elles tiennent compte de l’histoire.
                </p>
              </>
            ),
          },
        ]
      : []),
    {
      question: aChoix ? "Et « Les choix », « Le jeu » ?" : "Et « Les objets » ?",
      reponse: (
        <p>
          {aChoix
            ? "Deux étapes facultatives règlent le livre-jeu : la façon d’écrire un choix, les objets, la feuille d’aventure, le dé. Elles peuvent attendre que l’histoire avance."
            : "Une étape facultative, pour écrire toujours de la même façon le nom des objets qui reviennent. Elle peut attendre que l’histoire avance."}
        </p>
      ),
    },
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
