"use client";

import { useState } from "react";
import { useEnregistrement } from "@/composants/Enregistrement";
import { CONSTRUCTIONS, FORMULES_RENVOI, phraseDeChoix, type Construction, type FormuleRenvoi, type Preparation } from "@/domaine/preparation";
import { reglerPhrases } from "../../actions-preparation";
import styles from "./preparation.module.css";

const EXEMPLE = { libelle: "Suivre la lumière", numero: 17 };

/**
 * L'étape « Les choix » (F05, F11.5) : la formule de renvoi, les constructions proposées à
 * la création d'un choix, la marque de fin, pour tout le livre. Ces réglages servent dès
 * l'écriture.
 */
export function RubriquePhrases({ projetId, preparation }: { projetId: string; preparation: Preparation }) {
  const [formule, setFormule] = useState<FormuleRenvoi>(preparation.formuleRenvoi);
  const [constructions, setConstructions] = useState<Construction[]>(preparation.constructions);
  const [fin, setFin] = useState(preparation.marqueFin);
  const e = useEnregistrement();

  return (
    <section className={styles.facultatif__corps} aria-label="Phrases de choix">
      <div>
        <div className={styles.reglages}>
          {/* Une seule partie : les phrases que l'on coche, écrites en entier ; au-dessus, la façon
              d'annoncer le numéro, qui vaut pour tout le livre et récrit les exemples (F05, F11.5). */}
          <div className={`${styles.formules} ${styles.deuxTiers}`}>
            <fieldset className={styles.renvoi}>
              <legend>Renvoi vers la suite</legend>
              {(Object.keys(FORMULES_RENVOI) as FormuleRenvoi[]).map((k) => (
                <label key={k}>
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
                  <span>{FORMULES_RENVOI[k].nom}</span>
                </label>
              ))}
            </fieldset>
            <fieldset className={styles.formules}>
              <legend>Formulations des nouveaux choix</legend>
              {(Object.keys(CONSTRUCTIONS) as Construction[]).map((k) => (
                <label key={k} className={styles.formule}>
                  <input
                    type="checkbox"
                    className="case"
                    checked={constructions.includes(k) && (formule !== "fleche" || k === "neutre")}
                    disabled={k === "neutre" || formule === "fleche"}
                    onChange={(ev) => {
                      const suite = ev.target.checked ? [...constructions, k] : constructions.filter((c) => c !== k);
                      setConstructions(suite);
                      e.prevoir(() => reglerPhrases(projetId, { constructions: suite }), 0, "constructions");
                    }}
                  />
                  {/* Avec la flèche, les trois autres phrases gardent leur forme en mots, grisée : elles ne servent pas */}
                  <span className={`recit ${styles.formule__ex}`}>{phraseDeChoix(EXEMPLE.libelle, EXEMPLE.numero, formule === "fleche" && k !== "neutre" ? "rends" : formule, k)}</span>
                  {k === "neutre" ? <em className={styles.formule__note}>toujours proposée</em> : null}
                </label>
              ))}
              <p className={styles.aide}>
                {formule === "fleche"
                  ? "Avec la flèche, seule la première forme est utilisée."
                  : "À chaque nouveau choix, une des formes cochées est tirée au hasard, puis conservée."}
              </p>
            </fieldset>
          </div>
          <div className={styles.formules}>
            <label className={styles.legende} htmlFor="marque-fin">
              Texte de fin
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
              <p>La brume se lève. Lou et son père rentrent au port.</p>
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
