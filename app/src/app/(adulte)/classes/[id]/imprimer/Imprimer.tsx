"use client";

import { useState } from "react";
import { Gommette } from "@/composants/Gommette";
import { Icone } from "@/composants/Icone";
import { chiffresEspaces } from "@/domaine/acces";
import { pluriel } from "@/domaine/texte";
import styles from "./imprimer.module.css";

type EleveImprime = { id: string; prenom: string; nom: string | null; couleur: number; affiche: string; code: string };
type Quoi = "etiquettes" | "affiche";

const decouper = <T,>(liste: T[], taille: number): T[][] =>
  Array.from({ length: Math.max(1, Math.ceil(liste.length / taille)) }, (_, i) => liste.slice(i * taille, (i + 1) * taille));

/** Ce qu'on voit est ce qui s'imprime : des étiquettes à découper, ou l'affiche. */
export function Imprimer({
  classe, adresse, enseignant, pourLesEleves, eleves, departQuoi, departQui,
}: {
  classe: { nom: string; identifiant: string; motDePasse: string };
  adresse: string;
  enseignant: string | null;
  pourLesEleves: string;
  eleves: EleveImprime[];
  departQuoi: Quoi;
  departQui: string;
}) {
  const [quoi, setQuoi] = useState<Quoi>(departQuoi);
  const [qui, setQui] = useState(departQui);
  const [maison, setMaison] = useState(false);

  const liste = qui ? eleves.filter((e) => e.id === qui) : eleves;
  const n = liste.length;
  const parFeuille = maison ? 14 : 27;
  const feuilles = decouper(liste, parFeuille);
  const nf = feuilles.length;

  return (
    <div className={styles.imprimer}>
      <div className={`${styles.reglages} hors-impression`}>
        <div className="bascule" role="group" aria-label="Ce qu’on imprime">
          <button type="button" aria-pressed={quoi === "etiquettes"} onClick={() => setQuoi("etiquettes")}>
            Étiquettes des élèves
          </button>
          <button type="button" aria-pressed={quoi === "affiche"} onClick={() => setQuoi("affiche")}>
            Affiche de la classe
          </button>
        </div>
        {quoi === "etiquettes" ? (
          <>
            <label className={`champ ${styles.champ}`}>
              <span>Élèves</span>
              <span className="champ__select">
                <select value={qui} onChange={(e) => setQui(e.target.value)}>
                  <option value="">Toute la classe</option>
                  {eleves.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.prenom}
                      {e.nom ? ` ${e.nom}` : ""}
                    </option>
                  ))}
                </select>
                <Icone nom="chevron-bas" />
              </span>
            </label>
            <label className={styles.option}>
              <input type="checkbox" className="case" checked={maison} onChange={(e) => setMaison(e.target.checked)} />
              <span>
                <b>Avec l’identifiant et le mot de passe de la classe</b>
                <span>Pour travailler à la maison. Si le mot de passe change, ces étiquettes sont à réimprimer.</span>
              </span>
            </label>
            <p className={styles.compte}>
              {n ? (
                <>
                  <b>
                    {n} étiquette{pluriel(n)}
                  </b>{" "}
                  sur {nf} feuille{pluriel(nf)}
                </>
              ) : (
                "Aucun élève inscrit : rien à imprimer."
              )}
            </p>
            <button type="button" className={`btn btn--primaire btn--grand ${styles.bouton}`} disabled={!n} onClick={() => window.print()}>
              <Icone nom="imprimer" />
              Imprimer{n ? ` ${nf} feuille${pluriel(nf)}` : ""}
            </button>
            <p className={styles.aide}>À découper : chaque élève garde la sienne.</p>
          </>
        ) : (
          <>
            <p className={styles.compte}>
              <b>1 feuille</b>, à afficher près des ordinateurs.
            </p>
            <button type="button" className={`btn btn--primaire btn--grand ${styles.bouton}`} onClick={() => window.print()}>
              <Icone nom="imprimer" />
              Imprimer l’affiche
            </button>
            <p className={styles.aide}>Elle porte le mot de passe de la classe, pas les codes des élèves.</p>
          </>
        )}
      </div>

      <div className={styles.apercu}>
        {quoi === "etiquettes" ? (
          n ? (
            feuilles.map((feuille, i) => (
              <div key={i} className={styles.cadre}>
                <div className={`feuille ${styles.planche} ${maison ? styles.plancheMaison : ""}`} role="img" aria-label={`Feuille d’étiquettes ${i + 1} sur ${nf}`}>
                  {feuille.map((e) => (
                    <div key={e.id} className={styles.etiquette}>
                      <Gommette prenom={e.prenom} couleur={e.couleur} />
                      <span className={styles.prenom}>{e.affiche}</span>
                      <span className={styles.code}>
                        <span>Ton code</span>
                        {chiffresEspaces(e.code)}
                      </span>
                      {maison ? (
                        <span className={styles.classe}>
                          {adresse}
                          <br />
                          Identifiant : <b>{classe.identifiant}</b>
                          <br />
                          Mot de passe : <b>{classe.motDePasse}</b>
                        </span>
                      ) : null}
                    </div>
                  ))}
                </div>
                {nf > 1 ? (
                  <p className={`${styles.aide} hors-impression`}>
                    Feuille {i + 1} sur {nf}
                  </p>
                ) : null}
              </div>
            ))
          ) : null
        ) : (
          <div className={styles.cadre}>
            <div className={`feuille ${styles.affiche}`} role="img" aria-label="Aperçu de l’affiche de la classe">
              <p className={styles.afficheClasse}>
                {classe.nom}
                {enseignant ? ` · ${enseignant}` : ""}
              </p>
              <h2>Pour ouvrir la classe</h2>
              <ol>
                <li>
                  <b>Ouvre cette adresse</b>
                  <span className={styles.valeur}>{adresse}</span>
                </li>
                <li>
                  <b>Écris l’identifiant de la classe</b>
                  <span className={styles.valeur}>{classe.identifiant}</span>
                </li>
                <li>
                  <b>Écris le mot de passe de la classe</b>
                  <span className={styles.valeur}>{classe.motDePasse}</span>
                </li>
                <li>
                  <b>Clique sur ton prénom, puis tape ton code</b>
                  <span>Ton code est sur ton étiquette.</span>
                </li>
              </ol>
              <p className={styles.affichePied}>Un souci ? Demande à {pourLesEleves}.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
