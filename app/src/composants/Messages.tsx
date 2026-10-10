"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";

/** « autre » : une suite proposée avec le message, par exemple « Choisir un autre départ ». */
type Message = { texte: string; annuler?: () => void; autre?: { libelle: string; faire: () => void } };
const Contexte = createContext<(m: Message) => void>(() => {});

/** Dit ce qui vient d'être fait, en une phrase, parfois avec « Annuler ». */
export const useMessage = () => useContext(Contexte);

export function Messages({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState<Message | null>(null);
  const minuteur = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dire = useCallback((m: Message) => {
    if (minuteur.current) clearTimeout(minuteur.current);
    setMessage(m);
    minuteur.current = setTimeout(() => setMessage(null), m.autre ? 12000 : m.annuler ? 8000 : 5000);
  }, []);

  useEffect(() => () => {
    if (minuteur.current) clearTimeout(minuteur.current);
  }, []);

  return (
    <Contexte value={dire}>
      {children}
      <div role="status" aria-live="polite">
        {message ? (
          <div className="message hors-impression">
            <span>{message.texte}</span>
            {message.autre ? (
              <button
                type="button"
                className="message__act"
                onClick={() => {
                  message.autre?.faire();
                  setMessage(null);
                }}
              >
                {message.autre.libelle}
              </button>
            ) : null}
            {message.annuler ? (
              <button
                type="button"
                className="message__act"
                onClick={() => {
                  message.annuler?.();
                  setMessage(null);
                }}
              >
                Annuler
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </Contexte>
  );
}
