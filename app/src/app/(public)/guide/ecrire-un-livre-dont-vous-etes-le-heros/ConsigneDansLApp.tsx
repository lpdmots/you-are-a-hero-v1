import styles from "./consigne-dans-l-app.module.css";

/**
 * La fiche « Consigne » de la page d'une scène, avant et après « ✦ Formuler » (partie 13 du guide) :
 * dessinée d'après celle de l'application, avec deux ajouts que le porteur prévoit (4 novembre
 * 2026) : un bouton pour dicter la consigne, et la liste de vérification séparée de la consigne,
 * ses éléments à cocher par l'élève, modifiables et supprimables. Avant : l'idée notée vite, sans
 * liste ; après : la consigne mise au propre et sa liste. Une image, rien ne s'y règle.
 */

type Etat = { titre: string; consigne: string; liste: string[]; brouillon?: boolean };

const AVANT: Etat = {
  titre: "Avant : votre idée, dictée ou tapée",
  consigne: "le heros doit convaincre le garde pour rentrer dans le chateau",
  liste: [],
  brouillon: true,
};
const APRES: Etat = {
  titre: "Après « Formuler »",
  consigne: "Le héros arrive devant la porte du château. Un garde lui barre la route : il doit le convaincre de le laisser entrer. Termine la scène sur la réponse du garde.",
  liste: ["Décrire le garde.", "Écrire le dialogue entre le héros et le garde.", "Montrer ce que ressent le héros."],
};

const Etincelles = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M10 4c.4 3.6 1.9 5.5 6.5 6.5-4.6 1-6.1 2.9-6.5 6.5-.4-3.6-1.9-5.5-6.5-6.5C8.1 9.5 9.6 7.6 10 4z" />
    <path d="M18 3v4M16 5h4" />
    <path d="M18 16.5v4M16 18.5h4" />
  </svg>
);

function Fiche({ etat }: { etat: Etat }) {
  return (
    <div className={styles.colonne}>
      <p className={styles.moment}>{etat.titre}</p>
      <div className={styles.fiche}>
        <p className={styles.tete}>
          Consigne <span>facultative</span>
        </p>
        <div className={styles.corps}>
          <div className={styles.champ}>
            <p className={etat.brouillon ? styles.brouillon : undefined}>{etat.consigne}</p>
            <span className={etat.brouillon ? `${styles.micro} ${styles.microActif}` : styles.micro} title="Dicter">
              <svg viewBox="0 0 24 24">
                <rect x="9" y="3.5" width="6" height="11" rx="3" />
                <path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v2.5" />
              </svg>
            </span>
          </div>
          <span className={etat.brouillon ? `${styles.ia} ${styles.iaAppuye}` : styles.ia}>
            <Etincelles />
            Formuler
          </span>

          <p className={styles.sousTitre}>Liste de vérification</p>
          {etat.liste.length ? (
            <ul className={styles.liste}>
              {etat.liste.map((l) => (
                <li key={l}>
                  <span className={styles.case} />
                  <span className={styles.element}>{l}</span>
                  <span className={styles.retirer} title="Retirer">
                    <svg viewBox="0 0 24 24">
                      <path d="M7 7l10 10M17 7L7 17" />
                    </svg>
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className={styles.vide}>Aucun élément pour l’instant.</p>
          )}
          <span className={styles.ajouter}>
            <svg viewBox="0 0 24 24">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Ajouter un élément
          </span>
        </div>
      </div>
    </div>
  );
}

export function ConsigneDansLApp() {
  return (
    <figure className={styles.cadre}>
      <div
        className={styles.paire}
        role="img"
        aria-label="La fiche « Consigne » d’une scène, avant et après « Formuler ». Avant : « le heros doit convaincre le garde pour rentrer dans le chateau », sans liste de vérification. Après : une consigne claire qui se termine sur la réponse du garde, et trois éléments à cocher : décrire le garde, écrire le dialogue, montrer ce que ressent le héros."
      >
        <Fiche etat={AVANT} />
        <span className={styles.fleche} aria-hidden="true">
          <svg viewBox="0 0 24 24">
            <path d="M4 12h15M14 6.5l5.5 5.5-5.5 5.5" />
          </svg>
        </span>
        <Fiche etat={APRES} />
      </div>
      <figcaption>Dans Il était une classe, la fiche « Consigne » d’une scène : dictez ou tapez votre idée, l’IA la met au propre et prépare la liste de vérification, que vous retouchez.</figcaption>
    </figure>
  );
}
