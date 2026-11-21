"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { VignettesDeTuto } from "@/composants/Tutos";
import type { Tuto } from "@/domaine/tutos";

export type QuestionAide = { question: string; reponse: ReactNode };

/**
 * Écran d'aide à l'ouverture d'une page de l'adulte, comme au Suivi et au Livre :
 * quelques questions repliées, « Commencer », « Ne plus afficher ». Le tuto vidéo de l'étape, s'il
 * y en a un, en tête (F14-AC65).
 */
export function EcranAide({
  titre, rang, questions, tutos = [], dejaVue, masquee, onCommencer, onMasquer,
}: {
  titre: string;
  /** Au-dessus du titre, pour une étape du Livre : « Étape 2 » */
  rang?: string;
  questions: QuestionAide[];
  /** Les tutos de l'étape (`tutosDeLEcran`), en petites vignettes sous le titre */
  tutos?: Tuto[];
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
      {rang ? <p className="aide-etape__rang">{rang}</p> : null}
      <h2 id="aide-t" tabIndex={-1} ref={ref}>
        {titre}
      </h2>
      <VignettesDeTuto tutos={tutos} />
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
