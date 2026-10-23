"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./accueil.module.css";

type Taille = "petit" | "grand";

/**
 * Le passage 40, vente ouverte (décidé par le porteur le 23 octobre 2026) : deux choix, un livre
 * jusqu'aux limites gratuites ou un grand livre avec son pass. Le choix fait reste affiché ; il
 * s'écrit sur la rangée (`data-livre`), et la feuille de style remplit la fiche aventure et fait
 * venir la souris ou le dragon. `data-touche` attend le premier clic : rien ne bouge à l'arrivée.
 * Un clic sur l'animal (`data-basculer`, demandé par le porteur le 23 octobre 2026) passe à l'autre
 * livre.
 */
export function LivreChoisi({ scenes, images, prix }: { scenes: number; images: number; prix: string }) {
  const [taille, setTaille] = useState<Taille>("petit");
  const groupe = useRef<HTMLDivElement>(null);
  const choisir = (t: Taille) => {
    setTaille(t);
    const rangee = groupe.current?.closest("section");
    if (!rangee) return;
    rangee.dataset.livre = t;
    rangee.dataset.touche = "";
    // Sur téléphone, la fiche est sous le feuillet : la page descend jusqu'à elle, pour qu'on
    // voie le changement (demandé par le porteur le 23 octobre 2026)
    if (window.matchMedia("(max-width: 980px)").matches) {
      const doux = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      rangee.querySelector<HTMLElement>("[aria-labelledby='fiche-t']")?.scrollIntoView({ behavior: doux ? "smooth" : "auto", block: "start" });
    }
  };
  useEffect(() => {
    const rangee = groupe.current?.closest("section");
    const animal = rangee?.querySelector<HTMLButtonElement>("[data-basculer]");
    if (!rangee || !animal) return;
    const basculer = () => {
      const t: Taille = rangee.dataset.livre === "grand" ? "petit" : "grand";
      setTaille(t);
      rangee.dataset.livre = t;
      rangee.dataset.touche = "";
    };
    animal.disabled = false;
    animal.addEventListener("click", basculer);
    return () => animal.removeEventListener("click", basculer);
  }, []);
  return (
    <div ref={groupe} className={styles.tailles} role="group" aria-label="La taille de votre livre">
      <button type="button" className={styles.taille} aria-pressed={taille === "petit"} onClick={() => choisir("petit")}>
        <span>
          Un livre jusqu’à {scenes} scènes{" "}
          <small>et {images} images</small>
        </span>{" "}
        <span className={styles.tarif}>Gratuit</span>
      </button>
      <button type="button" className={styles.taille} aria-pressed={taille === "grand"} onClick={() => choisir("grand")}>
        <span>
          Un grand livre{" "}
          <small>sans limite, avec le pass du livre</small>
        </span>{" "}
        <span className={styles.tarif}>
          {prix}{" "}
          <small>par livre</small>
        </span>
      </button>
    </div>
  );
}
