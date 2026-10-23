"use client";

import { useRef } from "react";
import styles from "./accueil.module.css";

/**
 * La visite en vidéo de l'accueil (design.md, « Accueil en livre-jeu ») : un bouton sur l'image de
 * la première page, qui ouvre une fenêtre ; la vidéo ne part qu'à ce clic, jamais seule ni en
 * boucle. Sans fichier, la fenêtre dit qu'elle arrive (en développement seulement : l'accueil ne
 * montre pas le bouton en production tant que la vidéo n'existe pas).
 */
export function VisiteEnVideo({ video, sousTitres }: { video: string | null; sousTitres: string | null }) {
  const fenetre = useRef<HTMLDialogElement>(null);
  const lecteur = useRef<HTMLVideoElement>(null);
  return (
    <>
      <button
        type="button"
        className={styles.lancerVisite}
        onClick={() => {
          fenetre.current?.showModal();
          // Lancée par ce clic seulement : la vidéo est dans la page dès le départ, mais ne part qu'ici
          void lecteur.current?.play().catch(() => undefined);
        }}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M8 5.5v13l11-6.5z" fill="currentColor" />
        </svg>
        Le tour en vidéo
      </button>
      <dialog ref={fenetre} className={styles.visite} aria-label="Le tour de l’outil, en vidéo" onClose={() => lecteur.current?.pause()}>
        {video ? (
          <video ref={lecteur} controls playsInline preload="none">
            <source src={video} type="video/mp4" />
            {sousTitres ? <track kind="subtitles" src={sousTitres} srcLang="fr" label="Français" default /> : null}
          </video>
        ) : (
          <p className={styles.visiteAVenir}>La vidéo arrive : une minute trente, sous-titrée, pour voir l’outil en classe.</p>
        )}
        <form method="dialog">
          <button className={styles.fermerVisite}>Fermer</button>
        </form>
      </dialog>
    </>
  );
}
