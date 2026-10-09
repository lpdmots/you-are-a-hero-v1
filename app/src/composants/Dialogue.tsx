"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";

/** Dialogue de confirmation : quelques faits, la décision, « Annuler ». */
export function Dialogue({
  titre, children, boutons, onFermer,
}: {
  titre: string;
  children: ReactNode;
  boutons: ReactNode;
  onFermer: () => void;
}) {
  const id = useId();
  const ref = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const avant = document.activeElement as HTMLElement | null;
    ref.current?.focus();
    const touche = (e: KeyboardEvent) => {
      if (e.key === "Escape") onFermer();
    };
    document.addEventListener("keydown", touche);
    return () => {
      document.removeEventListener("keydown", touche);
      avant?.focus?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="dialogue-voile">
      <div className="dialogue" role="alertdialog" aria-modal="true" aria-labelledby={id}>
        <h2 id={id} tabIndex={-1} ref={ref}>
          {titre}
        </h2>
        {children}
        <p className="dialogue__cmd">
          {boutons}
          <button type="button" className="btn" onClick={onFermer}>
            Annuler
          </button>
        </p>
      </div>
    </div>
  );
}
