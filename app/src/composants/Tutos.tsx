"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { flushSync } from "react-dom";
import { Icone } from "@/composants/Icone";
import { afficheDe, dureeLisible, numeroDe, sousTitresDe, tutoSuivant, videoDe, type HorsSerie, type Tuto, type VideoDeLAide } from "@/domaine/tutos";
import s from "./Tutos.module.css";

/**
 * Les tutos vidéo (F14, « Tutos vidéo ») : une fenêtre qui joue le tuto choisi, servi par le site, et
 * ses déclencheurs — la carte de la page « Aide », la vignette d'un écran d'aide, le bouton « Tuto »
 * de la ligne du titre, le lien sous un bouton. La vidéo ne part qu'au clic, jamais seule ; fermer la
 * fenêtre la met en pause. Les sous-titres sont proposés par le lecteur (bouton des sous-titres), pas
 * affichés d'office, comme ceux de la visite (porteur, 24 octobre 2026). Le même lecteur joue une vidéo
 * hors série (« Gagner du temps avec l'IA », F14-AC68), sans numéro ni suite.
 */
export function useLecteur(avecSuite: boolean, options: { note?: string; onFermer?: () => void } = {}) {
  const fenetre = useRef<HTMLDialogElement>(null);
  const lecteur = useRef<HTMLVideoElement>(null);
  const [courant, setCourant] = useState<VideoDeLAide | null>(null);
  const ouvrir = (t: VideoDeLAide) => {
    // La vidéo change de source avant d'être lancée, dans le clic lui-même
    flushSync(() => setCourant(t));
    const f = fenetre.current;
    if (f && !f.open) f.showModal();
    lecteur.current?.load();
    void lecteur.current?.play().catch(() => undefined);
  };
  const suivant = courant && avecSuite ? tutoSuivant(courant) : null;
  const numero = courant ? numeroDe(courant) : 0;
  const element = (
    <dialog
      ref={fenetre}
      className={s.fenetre}
      aria-label={courant ? `${numero ? "Tuto" : "Vidéo"} : ${courant.titre}` : "Tuto"}
      onClose={() => {
        lecteur.current?.pause();
        options.onFermer?.();
      }}
      onClick={(e) => {
        // Un clic sur le fond assombri arrive sur la fenêtre elle-même, hors de son cadre : il la ferme
        const f = fenetre.current;
        if (!f || e.target !== f) return;
        const r = f.getBoundingClientRect();
        if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) f.close();
      }}
    >
      {courant ? (
        <video key={courant.cle} ref={lecteur} controls playsInline preload="none" poster={afficheDe(courant)}>
          <source src={videoDe(courant)} type="video/mp4" />
          <track kind="subtitles" src={sousTitresDe(courant)} srcLang="fr" label="Français" />
        </video>
      ) : null}
      <div className={s.barre}>
        <p className={s.nom}>
          {courant ? (numero ? `${numero} · ${courant.titre}` : courant.titre) : null}
          {options.note ? <span className={s.note}>{options.note}</span> : null}
        </p>
        {suivant ? (
          <button type="button" className={s.suite} onClick={() => ouvrir(suivant)}>
            Tuto suivant : {suivant.titre}
          </button>
        ) : null}
        <form method="dialog">
          <button className={s.fermer}>Fermer</button>
        </form>
      </div>
    </dialog>
  );
  return { ouvrir, element };
}

const Lecture = ({ className }: { className: string }) => (
  <span className={className} aria-hidden="true">
    <svg viewBox="0 0 24 24">
      <path d="M8 5.5v13l11-6.5z" fill="currentColor" />
    </svg>
  </span>
);

/** La page « Aide » : les tutos par temps du projet, en cartes ; la fenêtre propose le suivant (F14-AC62, AC63) */
export function TutosParTemps({
  temps, horsSerie,
}: {
  temps: { cle: string; titre: string; tutos: Tuto[] }[];
  /** La vidéo des aides de l'IA, après la série, sans numéro (F14-AC68) : sa carte et sa phrase */
  horsSerie?: { video: HorsSerie; phrase: string } | null;
}) {
  const { ouvrir, element } = useLecteur(true);
  return (
    <>
      <div className={s.temps}>
        {temps.map((g) => (
          <section key={g.cle} className={s.unTemps} aria-labelledby={`tutos-${g.cle}`}>
            <h3 id={`tutos-${g.cle}`}>{g.titre}</h3>
            <ul className={s.cartes}>
              {g.tutos.map((t) => (
                <li key={t.cle}>
                  <button type="button" className={s.carte} onClick={() => ouvrir(t)}>
                    <span className={s.affiche}>
                      <Image src={afficheDe(t)} alt="" fill sizes="(max-width: 700px) 46vw, 220px" />
                      <Lecture className={s.rond} />
                    </span>
                    <span className={s.titre}>
                      <span className={s.num}>{numeroDe(t)}</span>
                      {t.titre}
                    </span>
                    <span className={s.meta}>
                      {dureeLisible(t)}
                      {t.aChoix ? <span className={s.etiquette}>Récit à choix</span> : null}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ))}
        {horsSerie ? (
          <section id="video-ia" className={`${s.unTemps} ${s.horsSerie}`} aria-labelledby="tutos-ia">
            <h3 id="tutos-ia">
              <Icone nom="ia" /> Avec l’IA
            </h3>
            <div className={s.cartes}>
              <button type="button" className={s.carte} onClick={() => ouvrir(horsSerie.video)}>
                <span className={s.affiche}>
                  <Image src={afficheDe(horsSerie.video)} alt="" fill sizes="(max-width: 700px) 46vw, 220px" />
                  <Lecture className={s.rond} />
                </span>
                <span className={s.titre}>{horsSerie.video.titre}</span>
                <span className={`${s.meta} ${s.metaSeule}`}>{dureeLisible(horsSerie.video)}</span>
              </button>
              <p className={s.phrase}>{horsSerie.phrase}</p>
            </div>
          </section>
        ) : null}
      </div>
      {element}
    </>
  );
}

/** En tête d'un écran d'aide : le tuto de son étape, en petite vignette (F14-AC65) */
export function VignettesDeTuto({ tutos }: { tutos: VideoDeLAide[] }) {
  const { ouvrir, element } = useLecteur(false);
  if (!tutos.length) return null;
  return (
    <>
      <ul className={s.vignettes}>
        {tutos.map((t) => (
          <li key={t.cle}>
            <button type="button" className={s.vignette} onClick={() => ouvrir(t)}>
              <span className={s.petiteAffiche}>
                <Image src={afficheDe(t)} alt="" fill sizes="112px" />
                <Lecture className={s.petitRond} />
              </span>
              <span className={s.vignetteTexte}>
                <b>{t.titre}</b>
                <span>
                  {"horsSerie" in t ? "Vidéo" : "Tuto"} · {dureeLisible(t)}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>
      {element}
    </>
  );
}

/**
 * Une étape sans écran d'aide : « Tuto » dans la ligne du titre, à la place de « Aide » (F14-AC66),
 * ou « Voir le tuto » sous le bouton d'un écran vide (`lien`) ; pour une vidéo hors série, « Voir en
 * vidéo » (sous l'aparté de l'accueil, F14-AC69).
 */
export function BoutonTuto({ tuto, forme = "bouton", className }: { tuto: VideoDeLAide | undefined; forme?: "bouton" | "lien"; className?: string }) {
  const { ouvrir, element } = useLecteur(false);
  if (!tuto) return null;
  return (
    <>
      {forme === "lien" ? (
        <button type="button" className={className ? `${s.lien} ${className}` : s.lien} onClick={() => ouvrir(tuto)}>
          <Icone nom="tuto" />
          {"horsSerie" in tuto ? "Voir en vidéo" : "Voir le tuto"} · {dureeLisible(tuto)}
        </button>
      ) : (
        <button type="button" className="aide-bouton" title={`Le tuto : ${tuto.titre}, ${dureeLisible(tuto)}`} onClick={() => ouvrir(tuto)}>
          <Icone nom="tuto" />
          Tuto
        </button>
      )}
      {element}
    </>
  );
}
