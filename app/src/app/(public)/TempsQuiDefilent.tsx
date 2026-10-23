"use client";

import { useEffect, useRef } from "react";

/**
 * Le passage 12 de l'accueil : la feuille reste en place, les captures défilent à côté, et le temps
 * qu'elles montrent s'allume sur la feuille. Ce composant ne dessine rien : il observe les captures
 * (`data-temps`) de la rangée qui le contient et y écrit le temps de celle qui passe au milieu de
 * l'écran (`data-actif`), que la feuille de style met en évidence. Chaque temps de la feuille est
 * un lien vers sa première capture, qui marche sans script ; le script le rend doux et centré.
 */
export function TempsQuiDefilent() {
  const repere = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const rangee = repere.current?.closest("section");
    if (!rangee) return;
    const captures = [...rangee.querySelectorAll<HTMLElement>("[data-temps]")];
    // Pendant le défilement lancé par un clic, le temps choisi reste allumé : les captures
    // traversées en chemin ne le font pas clignoter
    let enRoute = false;
    let fin: ReturnType<typeof setTimeout> | undefined;
    const arrive = () => {
      enRoute = false;
      clearTimeout(fin);
    };
    const observateur = new IntersectionObserver(
      (entrees) => {
        if (enRoute) return;
        for (const e of entrees) if (e.isIntersecting) rangee.dataset.actif = (e.target as HTMLElement).dataset.temps;
      },
      // Une bande au milieu de l'écran : la capture qui la traverse donne le temps
      { rootMargin: "-45% 0px -45% 0px" },
    );
    captures.forEach((c) => observateur.observe(c));
    const allerAuTemps = (evenement: MouseEvent) => {
      const bouton = (evenement.target as HTMLElement).closest<HTMLElement>("[data-aller]");
      const temps = bouton?.dataset.aller;
      const cible = temps ? rangee.querySelector<HTMLElement>(`[data-temps="${temps}"]`) : null;
      if (!temps || !cible) return;
      evenement.preventDefault();
      rangee.dataset.actif = temps;
      const doux = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const boite = cible.getBoundingClientRect();
      let haut = boite.top + window.scrollY - (window.innerHeight - boite.height) / 2;
      // La feuille doit déjà être arrêtée à sa place : jamais en deçà du point où elle se fixe,
      // pour qu'elle soit au même niveau quel que soit le temps choisi
      const feuille = rangee.querySelector<HTMLElement>("article");
      if (feuille && getComputedStyle(feuille).position === "sticky") {
        const arret = parseFloat(getComputedStyle(feuille).top) || 0;
        // Sans le décalage de la fixation, la feuille commence au haut de la rangée, après sa marge
        const debutDeLaRangee = rangee.getBoundingClientRect().top + window.scrollY + (parseFloat(getComputedStyle(rangee).paddingTop) || 0);
        const depart = debutDeLaRangee - arret;
        haut = Math.max(haut, depart);
      }
      enRoute = true;
      clearTimeout(fin);
      // « scrollend » dit l'arrivée ; à défaut, un délai largement supérieur au défilement
      fin = setTimeout(arrive, 1500);
      window.scrollTo({ top: haut, behavior: doux ? "smooth" : "auto" });
    };
    rangee.addEventListener("click", allerAuTemps);
    window.addEventListener("scrollend", arrive);
    // Qui reprend la main (molette, doigt, clavier) reprend aussi le temps affiché
    const reprendre = () => enRoute && arrive();
    window.addEventListener("wheel", reprendre, { passive: true });
    window.addEventListener("touchstart", reprendre, { passive: true });
    window.addEventListener("keydown", reprendre);
    return () => {
      observateur.disconnect();
      arrive();
      rangee.removeEventListener("click", allerAuTemps);
      window.removeEventListener("scrollend", arrive);
      window.removeEventListener("wheel", reprendre);
      window.removeEventListener("touchstart", reprendre);
      window.removeEventListener("keydown", reprendre);
    };
  }, []);
  return <span ref={repere} hidden />;
}
