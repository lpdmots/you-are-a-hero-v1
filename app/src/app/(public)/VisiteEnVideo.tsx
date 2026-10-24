"use client";

import { useEffect, useRef } from "react";
import styles from "./accueil.module.css";
import v from "./VisiteEnVideo.module.css";

/**
 * La visite en vidéo de l'accueil (design.md, « Accueil en livre-jeu ») : un bouton sur l'image de
 * la première page, qui ouvre une fenêtre ; la vidéo ne part qu'à ce clic, jamais seule ni en
 * boucle. Un clic sur l'image l'ouvre aussi, un clic hors du cadre la ferme (porteur, 24 octobre 2026). Sans fichier, la fenêtre dit qu'elle arrive (en développement seulement : l'accueil ne
 * montre pas le bouton en production tant que la vidéo n'existe pas).
 */
export function VisiteEnVideo({ video, sousTitres }: { video: string | null; sousTitres: string | null }) {
  const fenetre = useRef<HTMLDialogElement>(null);
  const lecteur = useRef<HTMLVideoElement>(null);
  const ouvrir = () => {
    fenetre.current?.showModal();
    // Lancée par ce clic seulement : la vidéo est dans la page dès le départ, mais ne part qu'ici
    void lecteur.current?.play().catch(() => undefined);
  };
  // La note à la main au-dessus du livre (NoteDeLaVisite) l'ouvre aussi
  useEffect(() => {
    const surNote = () => ouvrir();
    window.addEventListener(OUVRIR, surNote);
    return () => window.removeEventListener(OUVRIR, surNote);
  });
  return (
    <>
      {/* Toute l'image ouvre la visite, à la souris ; le bouton reste le repère du clavier et des lecteurs d'écran */}
      <button
        type="button"
        tabIndex={-1}
        aria-hidden="true"
        className={v.zone}
        onClick={ouvrir}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", padding: 0, border: 0, background: "transparent", cursor: "pointer" }}
      />
      <button type="button" className={`${styles.lancerVisite} ${v.lancer}`} onClick={ouvrir}>
        <span className={v.rond}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M8 5.5v13l11-6.5z" fill="currentColor" />
          </svg>
        </span>
        <span className={v.texte}>Le tour en vidéo</span>
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
          <video ref={lecteur} controls playsInline preload="none" poster={video.replace(/\.mp4$/, ".webp")}>
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

const OUVRIR = "visite:ouvrir";

/**
 * La note à la main au-dessus du livre, sur grand écran : « le tour en vidéo » et sa flèche vers
 * l'illustration, comme dans la vidéo (porteur, 24 octobre 2026). Un clic ouvre la visite ; le
 * bouton de lecture sur l'image reste le repère du clavier et des lecteurs d'écran. Elle se pose
 * dans le livre (.livre), hors de l'illustration, que son cadrage en trapèze couperait.
 */
export function NoteDeLaVisite() {
  return (
    <button type="button" tabIndex={-1} aria-hidden="true" className={v.note} onClick={() => window.dispatchEvent(new Event(OUVRIR))}>
      le tour en vidéo
      <svg viewBox="0 0 80 66" aria-hidden="true">
        <path d="M2 14 C 40 4, 72 18, 66 58" />
        <path d="M53 45 L66 60 L78 44" />
      </svg>
    </button>
  );
}
