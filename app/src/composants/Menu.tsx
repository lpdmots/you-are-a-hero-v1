"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Icone } from "./Icone";

/**
 * Menu à trois points : les commandes d'une partie, d'un chapitre, d'une scène. Il se
 * ferme quand on choisit, quand on clique ailleurs et par « Échap ».
 */
export function Menu({
  libelle, discret, children,
}: {
  /** Ce que le menu commande, pour qui ne voit pas l'écran : « Autres commandes du chapitre La lisière » */
  libelle: string;
  discret?: boolean;
  children: (fermer: () => void) => ReactNode;
}) {
  const [ouvert, setOuvert] = useState(false);
  const ref = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    if (!ouvert) return;
    const dehors = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOuvert(false);
    };
    const touche = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOuvert(false);
      ref.current?.querySelector("summary")?.focus();
    };
    document.addEventListener("click", dehors);
    document.addEventListener("keydown", touche);
    return () => {
      document.removeEventListener("click", dehors);
      document.removeEventListener("keydown", touche);
    };
  }, [ouvert]);

  return (
    <details className={`menu${discret ? " menu--discret" : ""}`} ref={ref} open={ouvert} onToggle={(e) => setOuvert(e.currentTarget.open)}>
      <summary className="btn" aria-label={libelle} title={libelle}>
        <Icone nom="points" />
      </summary>
      {ouvert ? <div className="menu__liste">{children(() => setOuvert(false))}</div> : null}
    </details>
  );
}
