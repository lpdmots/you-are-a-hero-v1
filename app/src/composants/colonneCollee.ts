"use client";

import { useCallback } from "react";

/** La barre du haut, qui reste à l'écran, et un peu d'air sous la colonne */
const HAUT = 70;
const AIR = 12;

/**
 * La colonne de droite de la copie (`cote-copie__colle`), collée sous la barre du haut : sa hauteur
 * suit la place qui lui reste dans la fenêtre. Calculée comme si elle était déjà collée, elle
 * descendait sous le bas de l'écran tant que la page n'avait pas défilé, et le pied d'un panneau
 * (« Ajouter » des idées de choix) passait hors de vue (lot 9 de l'étape 8). Rend la référence à
 * poser sur la colonne, qui défait ses écouteurs quand la colonne s'en va.
 */
export function useColonneCollee(): (el: HTMLDivElement | null) => (() => void) | undefined {
  return useCallback((colonne: HTMLDivElement | null) => {
    if (!colonne) return;
    let attente = 0;
    const regler = () => {
      attente = 0;
      // Sur un écran étroit, la colonne n'est pas collée : elle garde sa hauteur
      if (getComputedStyle(colonne).position !== "sticky") return void colonne.style.removeProperty("max-height");
      const haut = Math.max(colonne.getBoundingClientRect().top, HAUT);
      colonne.style.maxHeight = `${Math.max(window.innerHeight - haut - AIR, 240)}px`;
    };
    const demander = () => {
      if (!attente) attente = requestAnimationFrame(regler);
    };
    regler();
    window.addEventListener("scroll", demander, { passive: true });
    window.addEventListener("resize", demander);
    return () => {
      if (attente) cancelAnimationFrame(attente);
      window.removeEventListener("scroll", demander);
      window.removeEventListener("resize", demander);
    };
  }, []);
}
