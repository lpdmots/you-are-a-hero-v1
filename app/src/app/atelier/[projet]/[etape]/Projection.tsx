"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { EtapeHistoire, type ProjetDuCarnet } from "@/app/(adulte)/projet/[id]/_preparation/Etape";
import { Icone } from "@/composants/Icone";
import { etapeFaite, NOM_RUBRIQUE, RUBRIQUES, type Preparation, type Rubrique } from "@/domaine/preparation";
import type { Plan } from "@/domaine/recit";
import styles from "@/app/(adulte)/projet/[id]/_preparation/preparation.module.css";

/**
 * La Préparation projetée : les quatre étapes de l'histoire, le même écran qu'à la Préparation,
 * en grand. On passe d'une étape à l'autre comme on veut (F02-AC13) ; tout ce qui s'écrit ici
 * est la même préparation (F02-AC11).
 */
export function Projection({
  projet, etape, onglet, preparation, plan,
}: { projet: ProjetDuCarnet; etape: Rubrique; onglet: string | null; preparation: Preparation; plan: Plan }) {
  const rang = RUBRIQUES.indexOf(etape);
  const suivante = RUBRIQUES[rang + 1];
  // Plein écran : demandé par « Projeter » ; ici, si l'on est arrivé autrement, un bouton le propose
  const [pleinEcran, setPleinEcran] = useState(true);
  useEffect(() => {
    const lire = () => setPleinEcran(document.fullscreenElement !== null || !document.fullscreenEnabled);
    lire();
    document.addEventListener("fullscreenchange", lire);
    return () => document.removeEventListener("fullscreenchange", lire);
  }, []);
  const quitter = () => {
    if (document.fullscreenElement) void document.exitFullscreen().catch(() => undefined);
  };
  return (
    <div className={styles.projection}>
      <header className={styles.projection__barre}>
        <p className={styles.projection__titre}>{projet.titre}</p>
        <nav className={`temps ${styles.ligne}`} aria-label="Étapes de la préparation">
          <ol>
            {RUBRIQUES.map((x, i) => {
              const faite = etapeFaite(x, preparation, plan.parties.length);
              return (
                <li key={x} className="temps__etape">
                  <Link href={`/atelier/${projet.id}/${x}`} className={`temps__lien${x === etape ? " est-en-cours" : ""}`} aria-current={x === etape ? "step" : undefined}>
                    <span className={`temps__num${faite ? " temps__num--faite" : ""}`}>{faite ? <Icone nom="coche" /> : i + 1}</span>
                    <span className="temps__nom">{NOM_RUBRIQUE[x]}</span>
                    <span className="vh">{faite ? " — fait" : ""}</span>
                  </Link>
                </li>
              );
            })}
          </ol>
        </nav>
        {pleinEcran ? null : (
          <button type="button" className="btn" onClick={() => void document.documentElement.requestFullscreen?.().catch(() => undefined)}>
            <Icone nom="oeil" />
            Plein écran
          </button>
        )}
        <Link className="btn" href={`/projet/${projet.id}/preparation?etape=${etape}`} onClick={quitter}>
          <Icone nom="fermer" />
          Quitter la projection
        </Link>
      </header>
      <main className={styles.page}>
        <EtapeHistoire
          key={`${etape}-${onglet ?? ""}`}
          projet={projet}
          etape={etape}
          onglet={onglet}
          adresseOnglet={(o) => `/atelier/${projet.id}/personnages${o ? `?heros=${o}` : ""}`}
          preparation={preparation}
          plan={plan}
          projection
        />
        <footer className={styles.pied}>
          <span />
          {suivante ? (
            <Link className="btn btn--primaire btn--grand" href={`/atelier/${projet.id}/${suivante}`}>
              Étape suivante : {NOM_RUBRIQUE[suivante]}
              <Icone nom="fleche" />
            </Link>
          ) : (
            <Link className="btn btn--primaire btn--grand" href={`/projet/${projet.id}/preparation?etape=etapes`} onClick={quitter}>
              Quitter la projection
              <Icone nom="fleche" />
            </Link>
          )}
        </footer>
      </main>
    </div>
  );
}
