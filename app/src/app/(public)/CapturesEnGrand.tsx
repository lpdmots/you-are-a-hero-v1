"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./accueil.module.css";

type Capture = { src: string; alt: string; note: string };

/**
 * Les captures du passage 12 s'ouvrent en grand au clic (demandé par le porteur le 23 octobre
 * 2026) : une seule à la fois, sans galerie, qui ne ferait que doubler le défilement des temps ;
 * sur grand écran et tablette seulement. Ce composant ne dessine que la fenêtre ; il écoute les
 * boutons `data-agrandir` de la rangée qui le contient. Échap, un clic à côté ou « Fermer » la
 * referment.
 */
export function CapturesEnGrand() {
  const fenetre = useRef<HTMLDialogElement>(null);
  const [capture, setCapture] = useState<Capture | null>(null);
  const aLaSouris = useRef(true);
  useEffect(() => {
    const rangee = fenetre.current?.closest("section");
    if (!rangee) return;
    const ouvrir = (evenement: MouseEvent) => {
      const bouton = (evenement.target as HTMLElement).closest<HTMLElement>("[data-agrandir]");
      // Sur téléphone, la capture prend déjà toute la largeur : l'agrandir n'apporterait rien
      if (!bouton || window.matchMedia("(max-width: 980px)").matches) return;
      aLaSouris.current = evenement.detail > 0;
      setCapture({ src: bouton.dataset.agrandir ?? "", alt: bouton.dataset.alt ?? "", note: bouton.dataset.note ?? "" });
      fenetre.current?.showModal();
    };
    rangee.addEventListener("click", ouvrir);
    return () => rangee.removeEventListener("click", ouvrir);
  }, []);
  return (
    <dialog
      ref={fenetre}
      className={styles.enGrand}
      aria-label={capture?.alt ?? "Capture en grand"}
      onClick={(e) => {
        // Un clic sur le fond, hors de l'image, referme
        if (e.target === e.currentTarget) e.currentTarget.close();
      }}
      onClose={() => {
        setCapture(null);
        // Fermée à la souris, la capture rendue ne garde pas l'anneau du clavier
        if (aLaSouris.current) (document.activeElement as HTMLElement | null)?.blur();
      }}
      onPointerDown={() => {
        aLaSouris.current = true;
      }}
      onKeyDown={() => {
        aLaSouris.current = false;
      }}
    >
      {capture ? (
        <figure>
          {/* L'original, sans passer par l'optimisation de Next : il se lit en grand */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={capture.src} alt={capture.alt} />
          <figcaption>{capture.note}</figcaption>
        </figure>
      ) : null}
      <form method="dialog">
        <button type="submit" className={styles.fermerVisite} autoFocus>
          Fermer
        </button>
      </form>
    </dialog>
  );
}
