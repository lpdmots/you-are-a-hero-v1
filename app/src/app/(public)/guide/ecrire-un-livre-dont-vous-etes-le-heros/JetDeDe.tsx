import styles from "./jet-de-de.module.css";

/**
 * La règle du dé (partie 9 du guide), en schéma : une épreuve de difficulté 5, un héros à 2 d'agilité,
 * deux lancers. 3 au dé fait 5, l'épreuve est réussie ; 2 au dé fait 4, elle est ratée.
 * Le schéma porte seul l'exemple chiffré : le texte ne donne que la règle.
 */

const POINTS: Record<number, [number, number][]> = {
  2: [[13, 13], [27, 27]],
  3: [[12, 12], [20, 20], [28, 28]],
};

function De({ valeur }: { valeur: 2 | 3 }) {
  return (
    <svg className={styles.de} viewBox="0 0 40 40" role="img" aria-label={`${valeur} au dé`}>
      <rect x="2" y="2" width="36" height="36" rx="8" />
      {POINTS[valeur].map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r="3.4" />
      ))}
    </svg>
  );
}

const LANCERS = [
  { de: 3 as const, reussi: true, suite: "Réussi" },
  { de: 2 as const, reussi: false, suite: "Raté" },
];

export function JetDeDe() {
  return (
    <figure className={styles.jet} aria-label="Exemple de jet de dé : 2 d’agilité, difficulté 5">
      <p className={styles.epreuve}>
        Épreuve de difficulté <strong>5</strong>, avec <strong>2</strong> d’agilité
      </p>
      <ul className={styles.lancers}>
        {LANCERS.map((l) => (
          <li key={l.de} className={l.reussi ? styles.reussi : styles.rate}>
            <De valeur={l.de} />
            <span className={styles.signe} aria-hidden="true">
              +
            </span>
            <span className={styles.competence}>
              <strong>2</strong> agilité
            </span>
            <span className={styles.signe} aria-hidden="true">
              =
            </span>
            <span className={styles.total}>{l.de + 2}</span>
            <span className={styles.comparaison}>{l.reussi ? "≥ 5" : "< 5"}</span>
            <span className={styles.issue}>{l.suite}</span>
          </li>
        ))}
      </ul>
    </figure>
  );
}
