"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { reglerAide } from "@/app/(adulte)/actions-compte";
import { AIDE_UTILISEE, enEtoiles } from "@/domaine/aides-ia";
import { afficheDe, CLE_INVITATION_IA, dureeLisible, VIDEO_IA } from "@/domaine/tutos";
import { Icone } from "./Icone";
import { useLecteur } from "./Tutos";
import styles from "./EspaceAdulte.module.css";

/**
 * L'invitation à la vidéo « Gagner du temps avec l'IA », au pied de la colonne de l'adulte, au-dessus
 * de son nom (F14-AC70, AC71) : pour qui n'a encore utilisé aucune aide. Une petite carte, un seul
 * endroit ; rien ne s'ouvre seul. Elle s'en va par sa croix (« Ne plus afficher », gardé avec le
 * compte), une fois la vidéo ouverte d'ici puis refermée, ou dès qu'une aide répond.
 */
export function InvitationVideoIa({ etoiles }: { etoiles: number | null }) {
  const [montree, setMontree] = useState(true);
  const nePlusAfficher = () => {
    setMontree(false);
    void reglerAide(CLE_INVITATION_IA, true).catch(() => undefined);
  };
  // Une invitation suivie n'a plus à rester : la vidéo se retrouve dans « Mon compte »
  const { ouvrir, element } = useLecteur(false, { note: "À revoir dans « Mon compte »", onFermer: nePlusAfficher });
  useEffect(() => {
    const partir = () => setMontree(false);
    window.addEventListener(AIDE_UTILISEE, partir);
    return () => window.removeEventListener(AIDE_UTILISEE, partir);
  }, []);
  const duree = dureeLisible(VIDEO_IA);
  return (
    <>
      {montree ? (
        <div className={styles.invitationIa}>
          <button type="button" className={styles.invVoir} onClick={() => ouvrir(VIDEO_IA)} title={`${VIDEO_IA.titre} · vidéo de ${duree}`}>
            <span className={styles.invAffiche} aria-hidden="true">
              <Image src={afficheDe(VIDEO_IA)} alt="" fill sizes="64px" />
              <span className={styles.invRond}>
                <svg viewBox="0 0 24 24">
                  <path d="M8 5.5v13l11-6.5z" fill="currentColor" />
                </svg>
              </span>
            </span>
            {/* Colonne repliée : le signe de l'IA seul, le titre en bulle */}
            <Icone nom="ia" className={styles.invSigne} />
            <span className={styles.invTexte}>
              <b>{VIDEO_IA.titre}</b>
              <span>
                {duree}
                {etoiles ? ` · ${enEtoiles(etoiles)} pour essayer` : null}
              </span>
            </span>
          </button>
          <button type="button" className={styles.invFermer} onClick={nePlusAfficher} aria-label="Ne plus afficher cette vidéo" title="Ne plus afficher">
            <Icone nom="fermer" />
          </button>
        </div>
      ) : null}
      {element}
    </>
  );
}
