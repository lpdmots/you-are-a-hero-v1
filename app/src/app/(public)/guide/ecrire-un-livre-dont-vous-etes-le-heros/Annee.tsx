import styles from "./annee.module.css";

/**
 * L'année d'un grand livre (partie 11 du guide), en deux lignes : avec la classe, de novembre à mai,
 * puis la fabrication, de la fin des textes à la livraison. Ce que fait la classe sur la feuille
 * blanche, ce que vous faites seul sur le papier chaud (comme le parcours d'une scène, partie 5) ;
 * la livraison et la marge en vert. Du texte, pas une image : les moteurs le lisent.
 */

const AVEC_LA_CLASSE = [
  { quand: "Novembre-décembre", quoi: "Découvrir", precision: "période 2" },
  { quand: "Janvier-février", quoi: "Préparer", precision: "période 3" },
  { quand: "Vacances d’hiver", quoi: "Les scènes et les consignes", precision: "vous, seul", vous: true },
  { quand: "Mars à début mai", quoi: "Écrire", precision: "périodes 4 et 5" },
];

const JUSQU_A_LA_LIVRAISON = [
  { quand: "Début mai", quoi: "Textes terminés, mise en page" },
  { quand: "Mi-mai", quoi: "Exemplaire d’essai" },
  { quand: "Ensuite", quoi: "Corrections" },
  { quand: "Fin mai", quoi: "Commande définitive" },
  { quand: "Mi-juin", quoi: "Réception des livres", fait: true },
];

export function Annee() {
  return (
    <figure className={styles.annee} aria-label="Le calendrier d’un grand livre, de novembre à la livraison mi-juin">
      <p className={styles.ligneTitre}>Avec la classe</p>
      <ol className={styles.classe}>
        {AVEC_LA_CLASSE.map((e) => (
          <li key={e.quand} className={e.vous ? styles.vous : undefined}>
            <span className={styles.quand}>{e.quand}</span>
            <span className={styles.quoi}>{e.quoi}</span>
            <span className={styles.precision}>{e.precision}</span>
          </li>
        ))}
      </ol>
      <p className={styles.ligneTitre}>Jusqu’à la livraison</p>
      <ol className={styles.livraison}>
        {JUSQU_A_LA_LIVRAISON.map((e) => (
          <li key={e.quoi} className={e.fait ? styles.fait : undefined}>
            <span className={styles.quand}>{e.quand}</span>
            <span className={styles.quoi}>{e.quoi}</span>
          </li>
        ))}
      </ol>
      <p className={styles.marge}>Une quinzaine de jours de marge avant les vacances.</p>
    </figure>
  );
}
