"use client";

import {
  KeyboardSensor, PointerSensor, TouchSensor, useSensor, useSensors, type Announcements, type ScreenReaderInstructions,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import type { ButtonHTMLAttributes, Ref } from "react";
import { Icone } from "./Icone";

/**
 * Glisser-déposer du plan (F03.1, 10 octobre 2026) : une partie, un chapitre et une scène
 * se déplacent en les tirant. Un clic ouvre toujours la carte : elle ne se déplace qu'une
 * fois tirée de quelques points. Au clavier, on saisit le repère de prise par Espace, on
 * déplace aux flèches, on repose par Espace. Sur un écran tactile, un appui long saisit.
 */
export function useCapteurs() {
  return useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
      // « Entrée » reste la touche qui ouvre un lien ou un bouton
      keyboardCodes: { start: ["Space"], cancel: ["Escape"], end: ["Space"] },
    }),
  );
}

export const CONSIGNES_CLAVIER: ScreenReaderInstructions = {
  draggable: "Pour déplacer, appuyez sur Espace, puis sur les flèches, et de nouveau sur Espace pour poser. Échap annule.",
};

/** Ce que dit le lecteur d'écran pendant un déplacement ; « nom » rend le nom d'un élément d'après son identifiant. */
export function annonces(nom: (id: string | number) => string): Announcements {
  return {
    onDragStart: ({ active }) => `${nom(active.id)} est saisi.`,
    onDragOver: ({ active, over }) => (over ? `${nom(active.id)} est au-dessus de ${nom(over.id)}.` : `${nom(active.id)} n’est au-dessus de rien.`),
    onDragEnd: ({ active, over }) => (over ? `${nom(active.id)} est posé.` : `${nom(active.id)} est remis à sa place.`),
    onDragCancel: ({ active }) => `Déplacement annulé : ${nom(active.id)} est remis à sa place.`,
  };
}

/** Repère de prise : six petits points, discrets mais présents, qui disent que la carte se déplace. */
export function Prise({
  nom, ref, ...reste
}: { nom: string; ref?: Ref<HTMLButtonElement> } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type="button" className="prise" title="Tirer pour déplacer" {...reste} ref={ref} aria-label={`Déplacer ${nom}`} aria-roledescription="élément à déplacer">
      <Icone nom="prise" />
    </button>
  );
}
