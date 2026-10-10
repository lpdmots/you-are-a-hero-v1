"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Icone } from "./Icone";

/** Bulle d'information : un « i » nommé par une question, qui s'ouvre au clic et se ferme par « Échap ». */
export function Bulle({ question, children }: { question: string; children: ReactNode }) {
  const [ouverte, setOuverte] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!ouverte) return;
    const dehors = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOuverte(false);
    };
    const touche = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOuverte(false);
    };
    document.addEventListener("click", dehors);
    document.addEventListener("keydown", touche);
    return () => {
      document.removeEventListener("click", dehors);
      document.removeEventListener("keydown", touche);
    };
  }, [ouverte]);
  return (
    <span className="bulle" ref={ref}>
      <button type="button" className="bulle__i" aria-label={question} aria-expanded={ouverte} title={question} onClick={() => setOuverte((o) => !o)}>
        <Icone nom="info" />
      </button>
      {ouverte ? (
        <span className="bulle__texte" role="note">
          <b>{question}</b>
          {children}
        </span>
      ) : null}
    </span>
  );
}
