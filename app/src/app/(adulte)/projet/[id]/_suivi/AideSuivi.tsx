"use client";

import { useTransition } from "react";
import { EcranAide, type QuestionAide } from "@/composants/EcranAide";
import { TamponScene } from "@/composants/TamponScene";
import { reglerAide } from "../../../actions-compte";

/** Ce que veut dire « Qui s'en occupe », dans l'aide comme dans la bulle de la colonne. */
export const QUI_S_EN_OCCUPE =
  "L’élève qui a pris la scène, ou qui a remis son texte. Les élèves d’un chapitre se répartissent ses scènes. « Pas encore prise » : elle attend un élève.";

/**
 * La légende des états : chaque tampon, et à qui est le tour (F06.5). Sans elle, « Validé »
 * et « Prête » se confondaient. Un projet personnel n'en a que trois (F06-AC91).
 */
export function LegendeDesEtats({ deClasse }: { deClasse: boolean }) {
  return (
    <ul className="legende-etats">
      {deClasse ? (
        <>
          <li>
            <TamponScene etat="valider" vide={false} />
            <span>
              L’élève a remis son texte. <b>À vous</b> de le relire.
            </span>
          </li>
          <li>
            <TamponScene etat="reprendre" vide={false} />
            <span>
              Vous avez demandé une reprise. <b>À l’élève</b> de retravailler.
            </span>
          </li>
        </>
      ) : null}
      <li>
        <TamponScene etat="cours" vide={false} />
        <span>{deClasse ? "L’élève écrit, ou vous écrivez." : "Vous écrivez."}</span>
      </li>
      <li>
        <TamponScene etat="cours" vide />
        <span>Rien n’est saisi. Le travail peut être sur papier.</span>
      </li>
      {deClasse ? (
        <li>
          <TamponScene etat="valide" vide={false} />
          <span>
            Travail de l’élève terminé. <b>À vous</b> de finir la scène pour le livre.
          </span>
        </li>
      ) : null}
      <li>
        <TamponScene etat="prete" vide={false} />
        <span>Bonne pour le livre.</span>
      </li>
    </ul>
  );
}

/**
 * L'aide du Suivi, à l'ouverture de l'onglet puis par « Aide » (F06-AC59) : la même que
 * celle d'une étape du Livre. Peu de questions, pour ne pas perdre le lecteur.
 */
export function AideSuivi({ deClasse, dejaVue, masquee, onCommencer }: { deClasse: boolean; dejaVue: boolean; masquee: boolean; onCommencer: () => void }) {
  const [, lancer] = useTransition();
  const questions: QuestionAide[] = [
    {
      question: "Que fait-on ici ?",
      reponse: deClasse ? (
        <>
          <p>On voit où en est chaque scène, et on ouvre celles qui attendent une relecture.</p>
          <ul className="aide-etape__taches">
            <li>Relire les scènes « À valider »</li>
            <li>Voir ce que fait chaque élève, dans la vue « Élèves »</li>
            <li>Imprimer les fiches de rédaction</li>
          </ul>
        </>
      ) : (
        <p>On voit où en est chaque scène du livre, et celles qu’il reste à écrire ou à finir.</p>
      ),
    },
    { question: "Que veulent dire les états ?", reponse: <LegendeDesEtats deClasse={deClasse} /> },
    ...(deClasse
      ? [
          { question: "Qui s’occupe d’une scène ?", reponse: <p>{QUI_S_EN_OCCUPE}</p> },
          {
            question: "Que sont les fiches de rédaction ?",
            reponse: (
              <p>
                Une feuille par chapitre ou par élève : les scènes à écrire ou à reprendre, sous leur référence, avec leur consigne. Les élèves écrivent sur leur
                cahier, puis recopient. Une scène sans consigne n’est pas imprimée.
              </p>
            ),
          },
        ]
      : []),
  ];
  return (
    <EcranAide
      titre="Suivi"
      dejaVue={dejaVue}
      masquee={masquee}
      onCommencer={() => {
        // L'aide ne revient pas avant la visite suivante
        document.cookie = "aide-suivi=vue; path=/; samesite=lax";
        onCommencer();
      }}
      onMasquer={(m) => lancer(() => reglerAide("suivi", m))}
      questions={questions}
    />
  );
}
