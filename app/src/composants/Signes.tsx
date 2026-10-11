"use client";

import { NOMS_DES_SIGNES, SIGNES_ACTION, type SigneAction } from "@/domaine/preparation";
import { Icone } from "./Icone";

/**
 * Le signe d'une action de jeu ou d'une formule (F04.2) : quatre petits boutons côte à côte,
 * celui qui sert en graphite, comme une bascule. Le crayon est le signe par défaut.
 */
export function Signes({
  valeur, onChange, libelle = "Signe devant l’action", gardeLeCurseur = false,
}: {
  valeur: SigneAction; onChange: (signe: SigneAction) => void; libelle?: string;
  /** Dans la copie, le clic ne prend pas le curseur au texte */
  gardeLeCurseur?: boolean;
}) {
  return (
    <span className="signes" role="radiogroup" aria-label={libelle}>
      {SIGNES_ACTION.map((signe) => (
        <button
          key={signe}
          type="button"
          role="radio"
          aria-checked={valeur === signe}
          aria-label={NOMS_DES_SIGNES[signe]}
          title={NOMS_DES_SIGNES[signe]}
          onMouseDown={gardeLeCurseur ? (ev) => ev.preventDefault() : undefined}
          onClick={(ev) => {
            ev.stopPropagation();
            onChange(signe);
          }}
        >
          <Icone nom={signe} />
        </button>
      ))}
    </span>
  );
}
