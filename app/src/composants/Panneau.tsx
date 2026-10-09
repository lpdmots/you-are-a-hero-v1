"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { Icone } from "./Icone";

/** Panneau latéral : un réglage à la fois, sans quitter la page. */
export function Panneau({
  titre, sous, pied, onFermer, children,
}: {
  titre: ReactNode;
  sous?: string;
  pied?: ReactNode;
  onFermer: () => void;
  children: ReactNode;
}) {
  const id = useId();
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const avant = document.activeElement as HTMLElement | null;
    const cible = ref.current?.querySelector<HTMLElement>("[data-focus]") ?? ref.current?.querySelector<HTMLElement>(".panneau__fermer");
    cible?.focus();
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
    <>
      <div className="voile" onClick={onFermer} />
      <aside className="panneau" aria-labelledby={id} ref={ref}>
        <div className="panneau__tete">
          <button type="button" className="btn btn--discret panneau__fermer" onClick={onFermer} aria-label="Fermer">
            <Icone nom="fermer" />
          </button>
          <h2 id={id}>{titre}</h2>
          {sous ? <p>{sous}</p> : null}
        </div>
        <div className="panneau__corps">{children}</div>
        {pied ? <div className="panneau__pied">{pied}</div> : null}
      </aside>
    </>
  );
}

/** Pied ordinaire d'un panneau : « Enregistré » après un changement, puis « Fermer ». */
export function PiedFermer({ enregistre, onFermer }: { enregistre: boolean; onFermer: () => void }) {
  return (
    <>
      {enregistre ? (
        <p className="enregistre" role="status">
          <Icone nom="coche" />
          Enregistré
        </p>
      ) : null}
      <button type="button" className="btn btn--grand" onClick={onFermer}>
        Fermer
      </button>
    </>
  );
}
