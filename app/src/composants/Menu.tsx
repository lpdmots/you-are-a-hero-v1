"use client";

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { poser } from "./flottant";
import { Icone } from "./Icone";

/**
 * Menu à trois points : les commandes d'une partie, d'un chapitre, d'une scène. Il se
 * ferme quand on choisit, quand on clique ailleurs et par « Échap ». Sa liste s'ouvre sous
 * le bouton, ou au-dessus quand la fenêtre n'a pas la place dessous.
 */
export function Menu({
  libelle, discret, bouton, agauche, children,
}: {
  /** Ce que le menu commande, pour qui ne voit pas l'écran : « Autres commandes du chapitre La lisière » */
  libelle: string;
  discret?: boolean;
  /** Ce que montre le bouton à la place des trois points : « Alice s'en occupe » */
  bouton?: ReactNode;
  /** La liste s'ouvre sous le bord gauche du bouton, et non sous le droit */
  agauche?: boolean;
  children: (fermer: () => void) => ReactNode;
}) {
  const [ouvert, setOuvert] = useState(false);
  const ref = useRef<HTMLDetailsElement>(null);
  const liste = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const bouton = ref.current?.querySelector("summary");
    if (!ouvert || !bouton || !liste.current) return;
    return poser(bouton, liste.current, { cote: agauche ? "bottom-start" : "bottom-end" });
  }, [ouvert, agauche]);

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
    <details
      className={`menu${discret ? " menu--discret" : ""}${bouton ? " menu--mots" : ""}`}
      ref={ref}
      open={ouvert}
      onToggle={(e) => setOuvert(e.currentTarget.open)}
    >
      <summary className="btn" aria-label={libelle} title={bouton ? undefined : libelle}>
        {bouton ?? <Icone nom="points" />}
      </summary>
      {ouvert ? <div className="menu__liste flottant" ref={liste}>{children(() => setOuvert(false))}</div> : null}
    </details>
  );
}
