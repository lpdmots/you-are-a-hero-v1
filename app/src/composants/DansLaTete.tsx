"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import { createPortal } from "react-dom";

// La ligne de titre se relit une fois la page posée : à l'arrivée d'un onglet par un lien, celle de
// l'onglet quitté est encore là pendant le rendu
const apresLaPose = (relire: () => void) => {
  const id = requestAnimationFrame(relire);
  return () => cancelAnimationFrame(id);
};

/**
 * Pose ce qu'il contient dans la ligne de titre de la page (`#tete-de-page`), à droite du nom de
 * l'onglet : le bouton « Aide » est ainsi toujours au même endroit (F06.5, 8 novembre 2026). Sans
 * ligne de titre, il reste là où la page l'a mis.
 */
export function DansLaTete({ children }: { children: ReactNode }) {
  // Côté serveur et à l'hydratation, rien : la ligne de titre n'est lue qu'une fois la page à l'écran
  const cible = useSyncExternalStore(
    apresLaPose,
    () => document.getElementById("tete-de-page"),
    () => undefined,
  );
  if (cible === undefined) return null;
  return cible ? createPortal(children, cible) : <>{children}</>;
}
