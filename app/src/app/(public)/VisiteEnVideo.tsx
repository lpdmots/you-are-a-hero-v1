"use client";

import { useRef } from "react";
import styles from "./accueil.module.css";
import v from "./VisiteEnVideo.module.css";

/**
 * La visite en vidéo de l'accueil (design.md, « Accueil en livre-jeu ») : un bouton sur l'image de
 * la première page, qui ouvre une fenêtre ; la vidéo ne part qu'à ce clic, jamais seule ni en
 * boucle. Un clic sur l'image l'ouvre aussi, un clic hors du cadre la ferme (porteur, 24 octobre 2026). Sans fichier, la fenêtre dit qu'elle arrive (en développement seulement : l'accueil ne
 * montre pas le bouton en production tant que la vidéo n'existe pas).
 */
export function VisiteEnVideo({ video, sousTitres, duree }: { video: string | null; sousTitres: string | null; duree?: string }) {
  const fenetre = useRef<HTMLDialogElement>(null);
  const lecteur = useRef<HTMLVideoElement>(null);
  const ouvrir = () => {
    fenetre.current?.showModal();
    // Lancée par ce clic seulement : la vidéo est dans la page dès le départ, mais ne part qu'ici
    void lecteur.current?.play().catch(() => undefined);
  };
  return (
    <>
      {/* Toute l'image ouvre la visite, à la souris ; le bouton reste le repère du clavier et des lecteurs d'écran */}
      <button
        type="button"
        tabIndex={-1}
        aria-hidden="true"
        onClick={ouvrir}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", padding: 0, border: 0, background: "transparent", cursor: "pointer" }}
      />
      <button type="button" className={`${styles.lancerVisite} ${v.lancer}`} onClick={ouvrir}>
        <span className={v.rond}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M8 5.5v13l11-6.5z" fill="currentColor" />
          </svg>
        </span>
        <span className={v.texte}>
          Le tour en vidéo
          {duree ? <span className={v.duree}>{duree}</span> : null}
        </span>
      </button>
      <dialog
        ref={fenetre}
        className={styles.visite}
        aria-label="Le tour de l’outil, en vidéo"
        onClose={() => lecteur.current?.pause()}
        onClick={(e) => {
          // Un clic sur le fond assombri arrive sur la fenêtre elle-même, hors de son cadre : il la ferme
          const f = fenetre.current;
          if (!f || e.target !== f) return;
          const r = f.getBoundingClientRect();
          if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) f.close();
        }}
      >
        {video ? (
          <video ref={lecteur} controls playsInline preload="none">
            <source src={video} type="video/mp4" />
            {/* Sous-titres proposés par le lecteur (bouton CC), pas affichés d'office : ils couvraient l'image (porteur, 24 octobre 2026) */}
            {sousTitres ? <track kind="subtitles" src={sousTitres} srcLang="fr" label="Français" /> : null}
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
