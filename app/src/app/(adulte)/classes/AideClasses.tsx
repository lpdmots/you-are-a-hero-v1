"use client";

import { useTransition } from "react";
import { EcranAide } from "@/composants/EcranAide";
import { reglerAide } from "../actions-compte";

/** L'aide de « Mes classes », rouverte par « Aide » depuis la liste comme depuis une classe. */
export function AideClasses({ dejaVue, masquee, onCommencer }: { dejaVue: boolean; masquee: boolean; onCommencer: () => void }) {
  const [, lancer] = useTransition();
  return (
    <EcranAide
      titre="Mes classes"
      dejaVue={dejaVue}
      masquee={masquee}
      onCommencer={() => {
        // L'aide ne revient pas avant la visite suivante
        document.cookie = "aide-classes=vue; path=/; samesite=lax";
        onCommencer();
      }}
      onMasquer={(m) => lancer(() => reglerAide("classes", m))}
      questions={[
        {
          question: "Que fait-on ici ?",
          reponse: (
            <>
              <p>On inscrit ses élèves et on leur donne de quoi se connecter.</p>
              <ul className="aide-etape__taches">
                <li>Inscrire les élèves de la classe</li>
                <li>Imprimer leurs étiquettes, avec leur code</li>
                <li>Régler les horaires, si on le souhaite</li>
              </ul>
            </>
          ),
        },
        {
          question: "Comment un élève se connecte-t-il ?",
          reponse: (
            <p>
              Sur l’ordinateur, on ouvre la classe avec son identifiant et son mot de passe. L’élève clique sur son prénom,
              puis tape son code à quatre chiffres.
            </p>
          ),
        },
        {
          question: "Un élève a oublié son code ?",
          reponse: (
            <p>
              Ouvrez la classe et cliquez sur son prénom : son code s’affiche. Vous pouvez le changer et réimprimer son
              étiquette.
            </p>
          ),
        },
        {
          question: "Et l’année prochaine ?",
          reponse: (
            <p>
              Vous terminez l’année de cette classe, puis vous en créez une nouvelle. Les élèves que vous gardez se
              réinscrivent d’une coche, avec le même code.
            </p>
          ),
        },
      ]}
    />
  );
}
