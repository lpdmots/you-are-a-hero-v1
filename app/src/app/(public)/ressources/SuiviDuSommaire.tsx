"use client";

import { useEffect } from "react";

/**
 * Le sommaire collant marque le temps qu'on lit (critique du 19 novembre 2026), comme celui du guide : le temps dont
 * la section passe au tiers haut de la fenêtre reçoit `aria-current` dans le sommaire.
 */
export function SuiviDuSommaire() {
  useEffect(() => {
    const sections = [...document.querySelectorAll<HTMLElement>("section[data-temps]")];
    const liens = [...document.querySelectorAll<HTMLAnchorElement>("nav[data-sommaire] a")];
    const marquer = (cle: string) => {
      for (const a of liens) {
        if (a.getAttribute("href") === `#${cle}`) a.setAttribute("aria-current", "location");
        else a.removeAttribute("aria-current");
      }
    };
    const observateur = new IntersectionObserver(
      (entrees) => {
        for (const e of entrees) if (e.isIntersecting) marquer(e.target.id);
      },
      { rootMargin: "-30% 0px -60% 0px" },
    );
    for (const s of sections) observateur.observe(s);
    return () => observateur.disconnect();
  }, []);
  return null;
}
