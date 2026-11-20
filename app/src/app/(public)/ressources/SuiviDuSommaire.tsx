"use client";

import { useEffect, useState } from "react";
import { TEMPS_DU_PROJET } from "@/domaine/ressources";
import styles from "./ressources.module.css";

/**
 * Le sommaire suit la lecture, comme celui du guide : sur grand écran, le temps dont la section passe au tiers haut
 * de la fenêtre reçoit `aria-current` dans le sommaire collant (critique du 19 novembre 2026) ; sur tablette et
 * téléphone, une fois le sommaire passé, un bouton « Sommaire » qui dit le temps qu'on lit (retour du 20 novembre 2026).
 */
export function SuiviDuSommaire() {
  const [enCours, setEnCours] = useState<string | null>(null);
  const [depasse, setDepasse] = useState(false);

  useEffect(() => {
    const sections = [...document.querySelectorAll<HTMLElement>("section[data-temps]")];
    const observateur = new IntersectionObserver(
      (entrees) => {
        for (const e of entrees) if (e.isIntersecting) setEnCours(e.target.id);
      },
      { rootMargin: "-30% 0px -60% 0px" },
    );
    for (const s of sections) observateur.observe(s);
    const sommaire = document.getElementById("sommaire");
    let attente = false;
    const placer = () => {
      attente = false;
      setDepasse(!!sommaire && sommaire.getBoundingClientRect().bottom < 0);
    };
    const defiler = () => {
      if (attente) return;
      attente = true;
      requestAnimationFrame(placer);
    };
    addEventListener("scroll", defiler, { passive: true });
    placer();
    return () => {
      observateur.disconnect();
      removeEventListener("scroll", defiler);
    };
  }, []);

  useEffect(() => {
    for (const a of document.querySelectorAll<HTMLAnchorElement>("nav[data-sommaire] a")) {
      if (a.getAttribute("href") === `#${enCours}`) a.setAttribute("aria-current", "location");
      else a.removeAttribute("aria-current");
    }
  }, [enCours]);

  // Le numéro du temps en cours, s'il en a un (« Pour mener le projet » n'en a pas)
  const numero = TEMPS_DU_PROJET.find((t) => t.cle === enCours)?.numero;
  return (
    <a className={styles.versSommaire} href="#sommaire" hidden={!depasse}>
      Sommaire
      {numero ? <span className={styles.ou}>· temps {numero}</span> : null}
    </a>
  );
}
