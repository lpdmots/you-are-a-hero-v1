"use client";

import { useEffect, useState } from "react";
import styles from "./guide.module.css";

/**
 * Le sommaire suit la lecture (F14-AC52) : sur grand écran, la question qu'on lit en canard dans le
 * sommaire collant ; sur téléphone, un bouton « Sommaire », une fois le sommaire dépassé, qui dit la
 * question en cours.
 */
export function SuiviDuSommaire({ total }: { total: number }) {
  const [enCours, setEnCours] = useState<number | null>(null);
  const [depasse, setDepasse] = useState(false);

  useEffect(() => {
    const parties = [...document.querySelectorAll<HTMLElement>("[data-partie]")];
    const suivi = new IntersectionObserver(
      (entrees) => {
        for (const e of entrees) if (e.isIntersecting) setEnCours(Number((e.target as HTMLElement).dataset.partie));
      },
      { rootMargin: "-15% 0px -75% 0px" },
    );
    parties.forEach((p) => suivi.observe(p));
    // Le bouton ne paraît qu'une fois le sommaire passé au-dessus de l'écran
    const sommaire = document.getElementById("sommaire");
    let attente = false;
    const placer = () => {
      attente = false;
      setDepasse(!!sommaire && sommaire.getBoundingClientRect().bottom < 0);
      // Au-dessus de la première question (retour en haut d'un coup), aucune n'est en cours
      if (parties[0] && parties[0].getBoundingClientRect().top > innerHeight * 0.15) setEnCours(null);
    };
    const defiler = () => {
      if (attente) return;
      attente = true;
      requestAnimationFrame(placer);
    };
    addEventListener("scroll", defiler, { passive: true });
    placer();
    return () => {
      suivi.disconnect();
      removeEventListener("scroll", defiler);
    };
  }, []);

  useEffect(() => {
    document.querySelectorAll<HTMLAnchorElement>("[data-sommaire] a[data-numero]").forEach((a) => {
      if (Number(a.dataset.numero) === enCours) a.setAttribute("aria-current", "location");
      else a.removeAttribute("aria-current");
    });
  }, [enCours]);

  return (
    <a className={styles.versSommaire} href="#sommaire" hidden={!depasse}>
      Sommaire
      {enCours !== null ? (
        <span className={styles.ou}>
          · {enCours} / {total}
        </span>
      ) : null}
    </a>
  );
}
