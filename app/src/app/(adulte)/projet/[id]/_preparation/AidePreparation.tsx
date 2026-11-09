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
            {deClasse ? "Posez les repères de l’histoire avec la classe." : "Posez les repères de votre histoire."} Rien n’est obligatoire :
            commencez à écrire quand vous voulez, puis complétez au besoin.
          </p>
          <ul className="aide-etape__taches">
            <li>Univers : le lieu, l’époque, l’ambiance</li>
            <li>Personnages : leurs envies, leurs liens</li>
            <li>Enjeu : le but et les risques</li>
            <li>Grandes étapes : les moments clés</li>
          </ul>
        </>
      ),
    },
    {
      question: "Comment préparer une étape ?",
      reponse: (
        <p>
          {deClasse
            ? "Discutez des questions, notez les idées, puis choisissez celles qui servent l’histoire. Rassemblez vos décisions dans « Nous retenons » ; pour les grandes étapes, ajoutez les parties."
            : "Explorez les questions, notez vos idées, puis choisissez celles qui servent l’histoire. Rassemblez vos décisions dans « Je retiens » ; pour les grandes étapes, ajoutez les parties."}
        </p>
      ),
    },
    ...(deClasse
      ? [
          {
            question: "Comment le faire avec la classe ?",
            reponse: (
              <p>
                « Projeter » affiche l’étape en grand pour discuter ensemble. Vos notes sont enregistrées dans la préparation ; les élèves
                n’ont pas besoin de se connecter.
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
                  Le bouton <Icone nom="ia" /> propose une question ou une idée à la fois. Vous choisissez quoi garder.
                  « Rédiger d’après les idées » prépare un texte à relire et à modifier avant de l’utiliser.
                </p>
                <p>
                  La préparation guide aussi l’IA pour les consignes, les choix et les corrections. Des repères précis l’aident à respecter
                  l’histoire.
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
            ? "« Les choix » règle les phrases qui orientent le lecteur. « Le jeu » réunit objets, actions, feuille d’aventure et règles. Complétez ces étapes facultatives au fil de l’écriture."
            : "Gardez les noms et les rôles des objets pour rester cohérent pendant l’écriture. Cette étape est facultative."}
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
