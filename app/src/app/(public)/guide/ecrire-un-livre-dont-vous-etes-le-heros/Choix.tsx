import styles from "./choix.module.css";

/**
 * Un choix et ses conséquences (partie 7 du guide), d'après le laboratoire de Vortex d'« Électro
 * Nick » : la situation et ce que le lecteur sait déjà, deux phrases de choix écrites comme dans le
 * livre, et ce que chacune fait gagner et perdre. Aucun des deux n'est le bon : chacun a son prix.
 * Les gains et les pertes restent en graphite : le vert et la brique ont déjà leur rôle sur le site.
 */

/** Les mêmes lignes dans les deux branches, l'indice puis le temps : seul le signe change */
const BRANCHES: { phrase: string; lignes: { gagne: boolean; texte: string }[] }[] = [
  { phrase: "Si tu entres dans le laboratoire, va au 87.", lignes: [{ gagne: true, texte: "un indice précieux" }, { gagne: false, texte: "du temps" }] },
  { phrase: "Si tu poursuis ta route, va au 142.", lignes: [{ gagne: false, texte: "l’indice" }, { gagne: true, texte: "du temps" }] },
];

export function Choix() {
  return (
    <figure className={styles.choix} aria-label="Exemple d’un choix et de ses conséquences, d’après « Électro Nick »">
      <p className={styles.source}>D’après « Électro Nick »</p>
      <div className={styles.situation}>
        <p className={styles.situationTitre}>Devant le laboratoire de Vortex</p>
        <p className={styles.raison}>
          <span>Ce que le lecteur sait :</span> le temps est compté sur sa feuille d’aventure.
        </p>
      </div>
      <ul className={styles.branches}>
        {BRANCHES.map((b) => (
          <li key={b.phrase}>
            <p className={styles.phrase}>{b.phrase}</p>
            <p className={styles.consequence}>
              {b.lignes.map((l) => (
                <span key={l.texte} className={l.gagne ? styles.gain : styles.perte}>
                  <b aria-label={l.gagne ? "gagné" : "perdu"}>{l.gagne ? "+" : "−"}</b> {l.texte}
                </span>
              ))}
            </p>
          </li>
        ))}
      </ul>
      <p className={styles.morale}>Aucun des deux n’est le bon choix : chacun a son prix.</p>
    </figure>
  );
}
