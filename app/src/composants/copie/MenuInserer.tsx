"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { poser } from "@/composants/flottant";
import { Icone, type NomIcone } from "@/composants/Icone";

export type Commande = { cle: string; nom: string; aide: string; icone: NomIcone; faire: () => void };

/**
 * « + Insérer », dans la barre de la copie (décidé par le porteur le 9 novembre 2026) : les
 * commandes que « / » propose dans le texte, sauf « Choix », qui garde son bouton. Un bouton à la
 * place de cinq ; « / » reste le raccourci, rappelé au pied de la liste. Ni le bouton ni la liste ne
 * prennent le curseur au texte : ce qu'on insère va là où il était.
 */
export function MenuInserer({ commandes }: { commandes: Commande[] }) {
  const [ouvert, setOuvert] = useState(false);
  const [choisie, setChoisie] = useState(0);
  const bouton = useRef<HTMLButtonElement>(null);
  const liste = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!ouvert || !bouton.current || !liste.current) return;
    return poser(bouton.current, liste.current, { cote: "bottom-end", fixe: true });
  }, [ouvert]);

  const lancer = (c: Commande | undefined) => {
    setOuvert(false);
    c?.faire();
  };

  // Hors de la liste, un clic la ferme ; au clavier, les flèches la parcourent, Entrée lance, Échap ferme
  useEffect(() => {
    if (!ouvert) return;
    const dehors = (e: MouseEvent) => {
      if (!bouton.current?.contains(e.target as Node) && !liste.current?.contains(e.target as Node)) setOuvert(false);
    };
    const touche = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        setOuvert(false);
      } else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        setChoisie((n) => (n + (e.key === "ArrowDown" ? 1 : -1) + commandes.length) % commandes.length);
      } else if (e.key === "Enter") {
        e.preventDefault();
        lancer(commandes[choisie]);
      }
    };
    document.addEventListener("mousedown", dehors);
    document.addEventListener("keydown", touche, true);
    return () => {
      document.removeEventListener("mousedown", dehors);
      document.removeEventListener("keydown", touche, true);
    };
  });

  if (commandes.length === 0) return null;
  return (
    <>
      <button
        ref={bouton}
        type="button"
        className="outil outil--texte"
        aria-haspopup="menu"
        aria-expanded={ouvert}
        onMouseDown={(ev) => ev.preventDefault()}
        onClick={() => {
          setChoisie(0);
          setOuvert(!ouvert);
        }}
      >
        <Icone nom="plus" />
        Insérer
        <Icone nom="chevron-bas" className="outil__chevron" />
      </button>
      {ouvert ? (
        <div className="slash slash--inserer flottant" role="menu" aria-label="Insérer" ref={liste}>
          {commandes.map((c, i) => (
            <button
              key={c.cle}
              type="button"
              role="menuitem"
              // Le nom, puis ce qu'il fait : « Image, dans le texte, ou sur la ligne », et non « ImageDans le texte »
              aria-label={`${c.nom}, ${c.aide.charAt(0).toLocaleLowerCase("fr")}${c.aide.slice(1)}`}
              className={i === choisie ? "est-choisie" : undefined}
              onMouseDown={(ev) => ev.preventDefault()}
              onMouseEnter={() => setChoisie(i)}
              onClick={() => lancer(c)}
            >
              <Icone nom={c.icone} />
              <span>
                <b>{c.nom}</b>
                {c.aide}
              </span>
            </button>
          ))}
          <p className="slash__astuce">
            ou tapez <kbd>/</kbd> dans le texte
          </p>
        </div>
      ) : null}
    </>
  );
}
