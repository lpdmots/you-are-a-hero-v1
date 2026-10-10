"use client";

import Link from "next/link";
import { useState, type CSSProperties } from "react";
import { Dialogue } from "@/composants/Dialogue";
import { Icone } from "@/composants/Icone";
import { ImageRepere } from "@/composants/ImageRepere";
import { couleurDeChapitre } from "@/domaine/recit";
import type { CarteChapitre, HistoireEleve } from "@/serveur/recit-eleve";
import styles from "./travail.module.css";

const vars = (rang: number): CSSProperties => {
  const c = couleurDeChapitre(rang);
  return { "--dos": c.dos, "--bandeau": c.bandeau, "--teinte": c.teinte } as CSSProperties;
};

/**
 * Toute l'histoire en cartes (F03-AC15) : l'élève voit le titre et l'image de chaque
 * chapitre. Le sien s'ouvre ; un autre montre une fiche courte, sans rien de son contenu
 * (F06-AC22), sauf quand l'enseignant a ouvert la lecture de l'histoire (F06-AC48).
 */
export function Histoire({ histoire, avecTitre }: { histoire: HistoireEleve; avecTitre: boolean }) {
  const [ferme, setFerme] = useState<CarteChapitre | null>(null);
  return (
    <section className={styles.histoire} aria-labelledby={`histoire-${histoire.id}`}>
      <h2 id={`histoire-${histoire.id}`}>{avecTitre ? histoire.titre : "Toute l’histoire"}</h2>
      <div className="parties">
        {histoire.parties.map((p) => (
          <section key={p.id} className="partie" aria-labelledby={`partie-${p.id}`}>
            <header className={`partie__tete ${styles.partie}`}>
              <div className="partie__vignette">
                <ImageRepere repere={p} graine={p.id} />
              </div>
              <div className="partie__titres">
                <h3 id={`partie-${p.id}`}>{p.titre}</h3>
              </div>
            </header>
            <ul className={`cahiers ${styles.cahiers}`}>
              {p.chapitres.map((c) => (
                <li key={c.id}>
                  <article className={`cahier cahier--ouvrable${c.profil ? " cahier--mien" : ""}`} style={vars(c.couleur)}>
                    {c.lisible ? (
                      <Link className="cahier__cible" href={`/travail/chapitre/${c.id}`} aria-label={`Ouvrir ${c.titre}`} />
                    ) : (
                      <button type="button" className={`cahier__cible ${styles.cible}`} aria-label={`${c.titre} : ce chapitre n’est pas le tien`} onClick={() => setFerme(c)} />
                    )}
                    <div className="cahier__couv">
                      <div className="cahier__vignette">
                        <ImageRepere repere={c} graine={c.id} />
                      </div>
                      <div className="etiquette">
                        <h4>{c.titre}</h4>
                      </div>
                      <div className="cahier__couv-bas" />
                    </div>
                    {/* Un chapitre qui n'est pas le sien est un cahier fermé : sa couverture, sans pied vide */}
                    {c.lisible ? (
                    <div className={`cahier__pied ${styles.pied}`}>
                      {c.profil ? (
                        <>
                          <span className="cahier__ruban">
                            <Icone nom="crayon" />
                            Ton chapitre
                          </span>
                          <p className="cahier__actions">
                            <span className="cahier__ouvrir" aria-hidden="true">
                              Ouvrir
                              <Icone nom="fleche" />
                            </span>
                          </p>
                        </>
                      ) : (
                        <p className="cahier__actions">
                          <span className="cahier__ouvrir" aria-hidden="true">
                            Lire
                            <Icone nom="fleche" />
                          </span>
                        </p>
                      )}
                    </div>
                    ) : null}
                  </article>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
      {ferme ? (
        <Dialogue titre={ferme.titre} onFermer={() => setFerme(null)} boutons={null} fermer="Fermer">
          <div className={styles.fiche__image}>
            <ImageRepere repere={ferme} graine={ferme.id} />
          </div>
          <p>Ce chapitre n’est pas le tien.</p>
        </Dialogue>
      ) : null}
    </section>
  );
}
