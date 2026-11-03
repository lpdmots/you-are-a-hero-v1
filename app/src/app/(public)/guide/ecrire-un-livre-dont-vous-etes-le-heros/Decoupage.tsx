import styles from "./decoupage.module.css";

/**
 * Du livre à la scène (partie 4 du guide) : des boîtes emboîtées, le livre, ses parties, les chapitres
 * d'une partie, les scènes d'un chapitre. Un seul chemin se déplie, les autres boîtes restent fermées ;
 * le chapitre confié à un élève est mis en couleur, avec son entrée et sa sortie, en canard comme dans
 * les schémas de la partie 6. Les numéros des scènes sont dispersés, comme dans le livre imprimé.
 */
export function Decoupage() {
  return (
    <figure className={styles.decoupage} aria-label="Le livre se découpe en parties, les parties en chapitres, les chapitres en scènes numérotées ; chaque chapitre est confié à un élève ou à un binôme.">
      <div className={styles.livre} aria-hidden="true">
        <p className={styles.etiquette}>
          <b>Le livre</b>
        </p>
        <div className={styles.parties}>
          <div className={styles.partie}>
            <p className={styles.etiquette}>
              <b>Partie 1</b> une grande étape de l’aventure
            </p>
            <div className={styles.chapitres}>
              <div className={styles.chapitre}>
                <span className={`${styles.bout} ${styles.entree}`}>entrée</span>
                <p className={styles.etiquette}>
                  <b>Chapitre 1</b> confié à un élève ou à un binôme
                </p>
                <div className={styles.scenes}>
                  {[12, 37, 54, 81, 96].map((n) => (
                    <span key={n} className={styles.scene}>
                      {n}
                    </span>
                  ))}
                  <span className={styles.suite}>…</span>
                </div>
                <p className={styles.legende}>des scènes, les passages numérotés du livre</p>
                <span className={`${styles.bout} ${styles.sortie}`}>sortie</span>
              </div>
              <div className={styles.fermes}>
                <span className={styles.ferme}>Chapitre 2</span>
                <span className={styles.ferme}>Chapitre 3</span>
              </div>
            </div>
          </div>
          <div className={styles.autresParties}>
            <span className={styles.fermePartie}>Partie 2</span>
            <span className={styles.fermePartie}>Partie 3</span>
          </div>
        </div>
      </div>
    </figure>
  );
}
