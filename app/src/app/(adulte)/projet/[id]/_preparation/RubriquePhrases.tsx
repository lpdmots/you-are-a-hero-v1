"use client";

import { useState } from "react";
import { useEnregistrement } from "@/composants/Enregistrement";
import { CONSTRUCTIONS, FORMULES_RENVOI, phraseDeChoix, type Construction, type FormuleRenvoi, type Preparation } from "@/domaine/preparation";
import { reglerPhrases } from "../../actions-preparation";
import styles from "./preparation.module.css";

const EXEMPLE = { libelle: "Plonger la main", numero: 17 };

/**
 * Rubrique « Phrases de choix » (F05, F11.5) : la formule de renvoi, les constructions
 * proposées à la création d'un choix, la marque de fin. Ces réglages servent dès l'écriture.
 */
export function RubriquePhrases({ projetId, preparation }: { projetId: string; preparation: Preparation }) {
  const [formule, setFormule] = useState<FormuleRenvoi>(preparation.formuleRenvoi);
  const [constructions, setConstructions] = useState<Construction[]>(preparation.constructions);
  const [fin, setFin] = useState(preparation.marqueFin);
  const e = useEnregistrement();

  return (
    <section className={`carnet-fiche ${styles.rubrique} ${styles.large}`} aria-labelledby="rubrique-phrases">
      <header>
        <h2 id="rubrique-phrases">Phrases de choix</h2>
        <span className={styles.fin}>pour tout le livre</span>
      </header>
      <div className="carnet-fiche__corps">
        <p className={styles.question}>Comment écrit-on un choix, et comment finit une histoire ?</p>
        <div className={styles.reglages}>
          <fieldset className={styles.formules}>
            <legend>Formule de renvoi</legend>
            {(Object.keys(FORMULES_RENVOI) as FormuleRenvoi[]).map((k) => (
              <label key={k} className={styles.formule}>
                <input
                  type="radio"
                  name="formule-renvoi"
                  value={k}
                  checked={formule === k}
                  onChange={() => {
                    setFormule(k);
                    e.prevoir(() => reglerPhrases(projetId, { formuleRenvoi: k }), 0, "formule");
                  }}
                />
                <span className={styles.formule__nom}>
                  {FORMULES_RENVOI[k].nom}
                  {k === "rends" ? <em> par défaut</em> : null}
                </span>
                <span className={`recit ${styles.formule__ex}`}>{phraseDeChoix(EXEMPLE.libelle, EXEMPLE.numero, k, "neutre")}</span>
              </label>
            ))}
          </fieldset>
          <fieldset className={styles.formules}>
            <legend>Constructions proposées à la création d’un choix</legend>
            {(Object.keys(CONSTRUCTIONS) as Construction[]).map((k) => (
              <label key={k} className={styles.formule}>
                <input
                  type="checkbox"
                  className="case"
                  checked={constructions.includes(k)}
                  disabled={k === "neutre"}
                  onChange={(ev) => {
                    const suite = ev.target.checked ? [...constructions, k] : constructions.filter((c) => c !== k);
                    setConstructions(suite);
                    e.prevoir(() => reglerPhrases(projetId, { constructions: suite }), 0, "constructions");
                  }}
                />
                <span className={styles.formule__nom}>
                  {CONSTRUCTIONS[k].nom}
                  {k === "neutre" ? <em> toujours disponible</em> : null}
                </span>
                <span className={`recit ${styles.formule__ex}`}>{phraseDeChoix(EXEMPLE.libelle, EXEMPLE.numero, formule, k)}</span>
              </label>
            ))}
            <p className={styles.aide}>Avec plusieurs constructions cochées, l’une est tirée au hasard à la création de chaque choix, puis gardée.</p>
          </fieldset>
          <div className={styles.formules}>
            <label className={styles.legende} htmlFor="marque-fin">
              Marque de fin
            </label>
            <input
              id="marque-fin"
              className="pchamp"
              type="text"
              maxLength={40}
              value={fin}
              onChange={(ev) => {
                setFin(ev.target.value);
                e.prevoir(() => reglerPhrases(projetId, { marqueFin: ev.target.value }), 700, "fin");
              }}
              onBlur={() => void e.partir()}
            />
            <div className={`recit ${styles.extrait}`} aria-hidden="true">
              <p>…la carte froissée dans la main. Le dernier bac était parti.</p>
              <p className={styles.extrait__fin}>{fin.trim() || "Fin"}</p>
            </div>
          </div>
        </div>
        <p className={styles.etat} role="status">
          {e.enCours ? "Enregistrement…" : e.erreur ? e.erreur : e.enregistre ? "Enregistré" : ""}
        </p>
      </div>
    </section>
  );
}
