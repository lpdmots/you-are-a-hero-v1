"use client";

import { useEffect, useSyncExternalStore } from "react";

const abonner = () => () => {};

/**
 * Vrai une fois la page prête à réagir. Un formulaire envoyé avant cet instant
 * partirait sans son écran : ses boutons d'envoi attendent donc ce signal.
 */
export const usePret = (): boolean => useSyncExternalStore(abonner, () => true, () => false);

/** Marque la page comme prête, pour les essais automatiques. */
export function MarquePret() {
  useEffect(() => {
    document.documentElement.dataset.pret = "1";
  }, []);
  return null;
}
