"use client";

import Link from "next/link";
import { useEffect, useState, type CSSProperties } from "react";
import { Icone } from "@/composants/Icone";
import { ImageRepere } from "@/composants/ImageRepere";
import { couleurDeChapitre, type Repere } from "@/domaine/recit";
import type { ChapitreTrouve } from "@/serveur/recit-eleve";
import { chercherScenes } from "../../actions";
import styles from "../lecture.module.css";

export type CahierDeDepart = { id: string; titre: string; couleur: number; repere: Repere; debut: string };

const teinte = (rang: number): CSSProperties => {
  const c = couleurDeChapitre(rang);
  return { "--dos": c.dos, "--bandeau": c.bandeau, "--teinte": c.teinte } as CSSProperties;
};

/**
 * « Par où commencer ? », pour l'élève (F09.1, F09-AC22) : ses chapitres sont ses cahiers, tels
 * qu'il les connaît sur « Mon travail » ; chacun s'ouvre au début. Une scène se trouve par la
 * même recherche que sur « Mon travail ». La lecture ouverte ajoute, en premier, le départ du livre.
 */
export function DepartEleve({
  projet, titre, prof, cahiers, departDuLivre, lisibles,
}: {
  projet: string;
  titre: string;
  /** « Mme Laurent » : à qui demander un chapitre */
  prof: string;
  cahiers: CahierDeDepart[];
  departDuLivre: { id: string; repere: Repere } | null;
  /** Les scènes que la lecture peut ouvrir : une scène trouvée hors d'elles ne se propose pas */
  lisibles: string[];
}) {
  const lire = (scene: string) => `/travail/lecture/${projet}?depart=${scene}`;
  const [demande, setDemande] = useState("");
  const [trouves, setTrouves] = useState<{ pour: string; chapitres: ChapitreTrouve[] } | null>(null);
  const voulu = demande.trim();
  useEffect(() => {
    if (voulu.length < 2) return;
    let actif = true;
    const minuteur = setTimeout(() => {
      void chercherScenes(voulu).then((chapitres) => {
        if (actif) setTrouves({ pour: voulu, chapitres });
      });
    }, 300);
    return () => {
      actif = false;
      clearTimeout(minuteur);
    };
  }, [voulu]);
  const ouvrables = new Set(lisibles);
  const montres =
    voulu.length >= 2 && trouves?.pour === voulu
      ? trouves.chapitres.map((c) => ({ ...c, scenes: c.scenes.filter((s) => ouvrables.has(s.id)) })).filter((c) => c.scenes.length)
      : null;

  return (
    <main className={`page page--eleve ${styles.page}`}>
      <header className={styles.tete}>
        <h1 className={styles.titre}>
          <Icone nom="livre" />
          Lire à l’essai
        </h1>
        <p className={styles.chapo}>
          <b>{titre}</b> : lis l’histoire comme un lecteur, en suivant les choix.
        </p>
      </header>

      {departDuLivre ? (
        <section className={styles.livre} aria-labelledby="depart-livre">
          <div className={styles.livre__image}>
            <ImageRepere repere={departDuLivre.repere} graine={projet} grande />
          </div>
          <div className={styles.livre__texte}>
            <h2 id="depart-livre">Depuis le départ du livre</h2>
            <p>Tout le livre est ouvert : lis-le depuis sa première page.</p>
            <p>
              <Link className="btn btn--primaire btn--grand" href={lire(departDuLivre.id)}>
                Commencer le livre
                <Icone nom="fleche" />
              </Link>
            </p>
          </div>
        </section>
      ) : null}

      {cahiers.length ? (
        <section className={styles.bloc} aria-labelledby="mes-chapitres">
          <h2 id="mes-chapitres">{cahiers.length > 1 ? "Depuis le début d’un de tes chapitres" : "Depuis le début de ton chapitre"}</h2>
          <ul className={`cahiers ${styles.cahiers}`}>
            {cahiers.map((c) => (
              <li key={c.id}>
                <article className="cahier cahier--ouvrable cahier--mien" style={teinte(c.couleur)}>
                  <Link className="cahier__cible" href={lire(c.debut)} aria-label={`Commencer au début de ${c.titre}`} />
                  <div className="cahier__couv">
                    <div className="cahier__vignette">
                      <ImageRepere repere={c.repere} graine={c.id} />
                    </div>
                    <div className="etiquette">
                      <h3>{c.titre}</h3>
                    </div>
                    <div className="cahier__couv-bas" />
                  </div>
                  <div className={`cahier__pied ${styles.pied}`}>
                    <span className={styles.commencer} aria-hidden="true">
                      Commencer au début
                      <Icone nom="fleche" />
                    </span>
                  </div>
                </article>
              </li>
            ))}
          </ul>
        </section>
      ) : departDuLivre ? null : (
        <div className={styles.vide}>
          <p>Tu n’as pas encore de chapitre : il n’y a rien à lire pour l’instant.</p>
          <p className={styles.vide__aide}>
            <Icone nom="main" />
            Demande à {prof} de t’en donner un.
          </p>
          <p>
            <Link className="btn" href="/travail">
              <Icone nom="fleche-g" />
              Retour à Mon travail
            </Link>
          </p>
        </div>
      )}

      {cahiers.length || departDuLivre ? (
        <section className={styles.bloc} aria-labelledby="une-scene">
          <h2 id="une-scene">Depuis une scène</h2>
          <label className={`recherche ${styles.recherche}`}>
            <span className="vh">Chercher une scène à lire</span>
            <Icone nom="loupe" />
            <input type="search" placeholder="Chercher une scène à lire" value={demande} onChange={(e) => setDemande(e.target.value)} />
          </label>
          {montres ? (
            montres.length ? (
              <ul className={styles.trouves} aria-live="polite">
                {montres.map((c) => (
                  <li key={c.id} style={teinte(c.couleur)}>
                    <p className={styles.trouves__chap}>
                      <span className={styles.pastille} aria-hidden="true" />
                      {c.titre}
                    </p>
                    <ul>
                      {c.scenes.map((s) => (
                        <li key={s.id}>
                          <Link href={lire(s.id)}>
                            <span className={styles.trouve}>
                              {s.titre ?? "Scène sans titre"}
                              {s.extrait ? <small>{s.extrait}</small> : null}
                            </span>
                            <span className={styles.lire}>
                              Lire d’ici
                              <Icone nom="fleche" />
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
            ) : (
              <p className={styles.aucune} aria-live="polite">
                Aucune scène à lire ne contient « {voulu} ».
              </p>
            )
          ) : null}
        </section>
      ) : null}
    </main>
  );
}
