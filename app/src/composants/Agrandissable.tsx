"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Icone } from "./Icone";

/**
 * Une image qu'un clic agrandit, par-dessus la page ; un clic ou Échap la referme (lot 7 de
 * l'étape 8, repris au lot 8 pour toutes les images créées et l'image choisie d'un élément).
 */
export function Agrandissable({
  src, nom, fichier, className, children,
}: {
  src: string; nom: string;
  /** « Image de La lisière.jpg » : l'image agrandie se télécharge sous ce nom (« Image.jpg » sinon) */
  fichier?: string;
  className?: string; children: ReactNode;
}) {
  const [ouverte, setOuverte] = useState(false);
  useEffect(() => {
    if (!ouverte) return;
    const touche = (ev: KeyboardEvent) => {
      if (ev.key !== "Escape") return;
      // Échap referme l'image, pas le panneau dessous
      ev.stopImmediatePropagation();
      setOuverte(false);
    };
    document.addEventListener("keydown", touche, true);
    return () => document.removeEventListener("keydown", touche, true);
  }, [ouverte]);
  return (
    <>
      <button type="button" className={`agrandir${className ? ` ${className}` : ""}`} onClick={() => setOuverte(true)} aria-label={`Voir ${nom} en grand`} title="Voir en grand">
        {children}
      </button>
      {/* Hors de la page, dans le corps : un clic dans l'image agrandie ne coche pas l'étiquette qui l'ouvre */}
      {ouverte ? createPortal(
        <div className="agrandie" role="dialog" aria-label={nom} onClick={() => setOuverte(false)}>
          {/* eslint-disable-next-line @next/next/no-img-element -- image servie par l'application */}
          <img src={src} alt={nom} />
          {/* Toute image agrandie se télécharge : le petit signe en haut à droite, à côté de la croix */}
          <a className="agrandie__telecharger" href={src} download={fichier ?? "Image.jpg"} onClick={(ev) => ev.stopPropagation()} aria-label="Télécharger l’image" title="Télécharger">
            <Icone nom="telecharger" />
          </a>
          <button type="button" className="agrandie__fermer" aria-label="Fermer" onClick={() => setOuverte(false)}>
            <Icone nom="fermer" />
          </button>
        </div>,
        document.body,
      ) : null}
    </>
  );
}
