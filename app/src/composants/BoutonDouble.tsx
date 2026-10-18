"use client";

import { Icone } from "./Icone";
import { useAidesIa } from "./AidesIa";

/**
 * Le bouton double d'une liste qui s'enrichit (F13.4, F13.5) : une large partie nommée ajoute à
 * la main, une petite partie ✦ fait ajouter par l'IA. Aides éteintes dans « Mon compte », il
 * redevient un bouton simple (F13, cadre commun).
 */
export function BoutonDouble({
  libelle, nomIa, onMain, onIa, attente, desactive,
}: {
  libelle: string;
  /** Ce que fait la partie ✦, pour le clavier et la bulle : « Demander une question à l'IA » */
  nomIa: string;
  onMain: () => void;
  onIa: () => void;
  /** L'IA prépare sa réponse : la partie ✦ attend */
  attente?: boolean;
  desactive?: boolean;
}) {
  const { proposer } = useAidesIa();
  return (
    <span className={`double${proposer ? "" : " double--seul"}`}>
      <button type="button" className="double__main" data-ouvre-ajout="" onClick={onMain} disabled={desactive}>
        <Icone nom="plus" />
        {libelle}
      </button>
      {proposer ? (
        <button
          type="button"
          className="double__ia"
          onClick={onIa}
          disabled={desactive || attente}
          aria-busy={attente || undefined}
          aria-label={nomIa}
          title="Demander à l’IA"
        >
          <Icone nom="ia" />
        </button>
      ) : null}
    </span>
  );
}
