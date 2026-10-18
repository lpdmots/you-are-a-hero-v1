"use client";

import { useId } from "react";
import { DEGRES, NIVEAUX, NOMS_DES_DEGRES, QUALITES, type Degre, type ReglagesIa } from "@/domaine/aides-ia";
import styles from "./BarreAdulte.module.css";

/**
 * La rubrique « Aides IA » de « Mon compte » (F13, cadre commun) : valable pour tous les
 * projets du compte. Une seule section, l'interrupteur en tête ; éteintes, les aides
 * disparaissent de partout et leurs réglages se replient. Une ligne d'aide au plus par réglage.
 */
export function ReglagesAidesIa({ reglages, onChanger }: { reglages: ReglagesIa; onChanger: (r: Partial<ReglagesIa>) => void }) {
  const id = useId();
  return (
    <section className={styles.aidesIa}>
      <h3>Aides IA</h3>
      <label className="inter">
        <input type="checkbox" role="switch" checked={reglages.proposer} onChange={(e) => onChanger({ proposer: e.target.checked })} />
        <span className="inter__piste" aria-hidden="true" />
        <span>Proposer les aides IA</span>
      </label>
      <p>
        {reglages.proposer
          ? "Éteintes : aucun bouton d’IA, par exemple pour projeter devant la classe."
          : "Aucune aide IA dans vos projets. Tout le reste fonctionne."}
      </p>

      {reglages.proposer ? (
        <>
          <div className={styles.sousReglage}>
            <h4>
              <label htmlFor={`${id}-degre`}>Degré de correction par défaut</label>
            </h4>
            <select id={`${id}-degre`} className={`pchamp ${styles.choix}`} value={reglages.degre} onChange={(e) => onChanger({ degre: Number(e.target.value) as Degre })}>
              {DEGRES.map((d) => (
                <option key={d} value={d}>
                  Degré {d} · {NOMS_DES_DEGRES[d]}
                </option>
              ))}
            </select>
            <p>Modifiable à chaque correction.</p>
          </div>

          <div className={styles.sousReglage}>
            <h4 id={`${id}-niveaux`}>Niveau des élèves</h4>
            <div className={styles.pastilles} role="group" aria-labelledby={`${id}-niveaux`}>
              {NIVEAUX.map((n) => (
                <label key={n} className={styles.pastille}>
                  <input
                    type="checkbox"
                    checked={reglages.niveaux.includes(n)}
                    onChange={(e) => onChanger({ niveaux: e.target.checked ? [...reglages.niveaux, n] : reglages.niveaux.filter((x) => x !== n) })}
                  />
                  <span>{n}</span>
                </label>
              ))}
            </div>
            <p>{reglages.niveaux.length ? "Plusieurs pour un cours double." : "Sans niveau coché : des mots simples, pour tout l’élémentaire."}</p>
          </div>

          <div className={styles.sousReglage}>
            <h4>Images créées</h4>
            <div className={styles.lignesReglage}>
              <span id={`${id}-nombre`}>Par création</span>
              <div className="bascule" role="group" aria-labelledby={`${id}-nombre`}>
                {([1, 2] as const).map((n) => (
                  <button key={n} type="button" aria-pressed={reglages.imagesParCreation === n} onClick={() => onChanger({ imagesParCreation: n })}>
                    {n === 1 ? "Une" : "Deux"}
                  </button>
                ))}
              </div>
              <span id={`${id}-qualite`}>Qualité</span>
              <div className="bascule" role="group" aria-labelledby={`${id}-qualite`}>
                {QUALITES.map((q) => (
                  <button key={q} type="button" aria-pressed={reglages.qualite === q} onClick={() => onChanger({ qualite: q })}>
                    {q === "auto" ? "Automatique" : q === "normale" ? "Normale" : "Haute"}
                  </button>
                ))}
              </div>
            </div>
            <p>Automatique : haute pour une pleine page, normale ailleurs. Une image haute coûte environ quatre fois plus.</p>
          </div>
        </>
      ) : null}
    </section>
  );
}
