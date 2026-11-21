"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { flushSync } from "react-dom";
import { Icone } from "@/composants/Icone";
import { afficheDe, dureeLisible, numeroDe, sousTitresDe, tutoSuivant, videoDe, type Tuto } from "@/domaine/tutos";
import s from "./Tutos.module.css";

/**
 * Les tutos vidéo (F14, « Tutos vidéo ») : une fenêtre qui joue le tuto choisi, servi par le site, et
 * ses déclencheurs — la carte de la page « Aide », la vignette d'un écran d'aide, le bouton « Tuto »
 * de la ligne du titre, le lien sous un bouton. La vidéo ne part qu'au clic, jamais seule ; fermer la
 * fenêtre la met en pause. Les sous-titres sont proposés par le lecteur (bouton des sous-titres), pas
 * affichés d'office, comme ceux de la visite (porteur, 24 octobre 2026).
 */
function useLecteur(avecSuite: boolean) {
  const fenetre = useRef<HTMLDialogElement>(null);
  const lecteur = useRef<HTMLVideoElement>(null);
  const [courant, setCourant] = useState<Tuto | null>(null);
  const ouvrir = (t: Tuto) => {
    // La vidéo change de source avant d'être lancée, dans le clic lui-même
    flushSync(() => setCourant(t));
    const f = fenetre.current;
    if (f && !f.open) f.showModal();
    lecteur.current?.load();
    void lecteur.current?.play().catch(() => undefined);
  };
  const suivant = courant && avecSuite ? tutoSuivant(courant) : null;
  const element = (
    <dialog
      ref={fenetre}
      className={s.fenetre}
      aria-label={courant ? `Tuto : ${courant.titre}` : "Tuto"}
      onClose={() => lecteur.current?.pause()}
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
        <p className={s.nom}>{courant ? `${numeroDe(courant)} · ${courant.titre}` : null}</p>
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
export function TutosParTemps({ temps }: { temps: { cle: string; titre: string; tutos: Tuto[] }[] }) {
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
      </div>
      {element}
    </>
  );
}

/** En tête d'un écran d'aide : le tuto de son étape, en petite vignette (F14-AC65) */
export function VignettesDeTuto({ tutos }: { tutos: Tuto[] }) {
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
                <span>Tuto · {dureeLisible(t)}</span>
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
 * ou « Voir le tuto » sous le bouton d'un écran vide (`lien`).
 */
export function BoutonTuto({ tuto, forme = "bouton" }: { tuto: Tuto | undefined; forme?: "bouton" | "lien" }) {
  const { ouvrir, element } = useLecteur(false);
  if (!tuto) return null;
  return (
    <>
      {forme === "lien" ? (
        <button type="button" className={s.lien} onClick={() => ouvrir(tuto)}>
          <Icone nom="tuto" />
          Voir le tuto · {dureeLisible(tuto)}
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
