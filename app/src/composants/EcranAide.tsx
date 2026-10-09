"use client";

import { useEffect, useRef, type ReactNode } from "react";

export type QuestionAide = { question: string; reponse: ReactNode };

/**
 * Écran d'aide à l'ouverture d'une page de l'adulte, comme au Suivi et au Livre :
 * quelques questions repliées, « Commencer », « Ne plus afficher ».
 */
export function EcranAide({
  titre, questions, dejaVue, masquee, onCommencer, onMasquer,
}: {
  titre: string;
  questions: QuestionAide[];
  dejaVue: boolean;
  masquee: boolean;
  onCommencer: () => void;
  onMasquer: (masquee: boolean) => void;
}) {
  const ref = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    ref.current?.focus();
  }, []);
  return (
    <section className="aide-etape" aria-labelledby="aide-t">
      <h2 id="aide-t" tabIndex={-1} ref={ref}>
        {titre}
      </h2>
      <div className="aide-etape__q">
        {questions.map((q, i) => (
          <details key={q.question} open={i === 0}>
            <summary>{q.question}</summary>
            {q.reponse}
          </details>
        ))}
      </div>
      <p className="aide-etape__cmd">
        <button type="button" className="btn btn--primaire btn--grand" onClick={onCommencer}>
          {dejaVue ? "Fermer l’aide" : "Commencer"}
        </button>
        <label className="aide-etape__plus">
          <input type="checkbox" defaultChecked={masquee} onChange={(e) => onMasquer(e.target.checked)} />
          <span>Ne plus afficher</span>
        </label>
      </p>
    </section>
  );
}
