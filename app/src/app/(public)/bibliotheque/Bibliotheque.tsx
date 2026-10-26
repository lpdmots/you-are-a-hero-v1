import Link from "next/link";
import type { ReactNode } from "react";
import { chercheEnAdresse, livresDeLaListe, NOM_DU_TYPE, nomDeLAge, type Demande, type LivrePublie } from "@/domaine/bibliotheque-publique";
import { Recherche } from "./Recherche";
import { Tiroir } from "./Tiroir";
import accueil from "../accueil.module.css";
import styles from "./bibliotheque.module.css";

/**
 * La bibliothèque (F15) : les livres publiés, fermés, posés comme sur une table — leur page de titre
 * en couverture, comme les livres de l'accueil —, la recherche et les filtres au-dessus. Un livre
 * ouvre son tiroir à sa propre adresse ; la page reste la même dessous.
 */
export function Bibliotheque({ livres, demande, ouvert }: { livres: LivrePublie[] | null; demande: Demande; ouvert: LivrePublie | null }) {
  const liste = livres ? livresDeLaListe(livres, demande) : [];
  const cherche = chercheEnAdresse(demande);
  const filtre = Boolean(demande.q || demande.age || demande.type);
  return (
    <main className={styles.bibliotheque}>
      <header className={styles.tete}>
        <h1 className={styles.titre}>La bibliothèque</h1>
        <p className={styles.chapeau}>Des livres écrits par des classes, et quelques-uns par des adultes, avec Il était une classe. À lire en ligne, gratuitement, sans compte.</p>
      </header>

      {livres === null ? (
        <p className={styles.vide}>La bibliothèque est momentanément indisponible. Revenez dans quelques minutes.</p>
      ) : livres.length === 0 ? (
        <p className={styles.vide}>Les premiers livres arrivent bientôt.</p>
      ) : (
        <>
          <Recherche demande={demande} trouves={liste.length} total={livres.length} />
          {liste.length ? (
            <ul className={styles.rayon}>
              {liste.map((l) => (
                <li key={l.adresse}>
                  <Carte livre={l} href={`/bibliotheque/${l.adresse}${cherche}`} />
                </li>
              ))}
            </ul>
          ) : (
            <p className={styles.vide}>
              Aucun livre ne correspond{filtre ? "." : ""}{" "}
              {filtre ? (
                <Link className="lien" href="/bibliotheque" scroll={false}>
                  Voir tous les livres
                </Link>
              ) : null}
            </p>
          )}
        </>
      )}

      {ouvert ? <Tiroir livre={ouvert} retour={`/bibliotheque${cherche}`} /> : null}
    </main>
  );
}

/** Ce qu'un livre est, en une ligne : « 8 à 10 ans · Livre-jeu » ; le nombre de passages est dans le tiroir. */
export const contenuDu = (l: LivrePublie): string =>
  [nomDeLAge(l.age), l.aChoix ? "Livre-jeu" : NOM_DU_TYPE.classique].join(" · ");

function Carte({ livre, href }: { livre: LivrePublie; href: string }) {
  return (
    <Link href={href} scroll={false} className={styles.carte} aria-label={`« ${livre.titre} », ${contenuDu(livre)}`}>
      <Couverture livre={livre} />
      <span className={styles.carteTitre}>{livre.titre}</span>
      <span className={styles.carteContenu}>{contenuDu(livre)}</span>
    </Link>
  );
}

/**
 * La page de titre en couverture, comme le lecteur l'ouvre : l'image d'une page faite à la main, ou
 * le titre, le sous-titre et l'illustration entière. `grand` pour le tiroir.
 */
export function Couverture({ livre, grand = false, enfants }: { livre: LivrePublie; grand?: boolean; enfants?: ReactNode }) {
  const image = livre.image ? `/images/publie/${livre.adresse}/${livre.image.id}?v=1` : null;
  return (
    <span className={`${accueil.volume} ${styles.volume} ${grand ? styles.volumeGrand : ""}`}>
      {livre.image?.pleinePage && image ? (
        // Servie par l'application, d'après la version publiée : pas d'optimisation de Next
        // eslint-disable-next-line @next/next/no-img-element
        <img className={accueil.pleinePage} src={image} alt="" loading="lazy" />
      ) : (
        <span className={accueil.pageDeTitre}>
          <span className={`${accueil.titreLivre} ${styles.titreLivre}`}>{livre.titre}</span>
          {livre.sousTitre ? <span className={accueil.sousTitreLivre}>{livre.sousTitre}</span> : null}
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img className={accueil.illustration} src={image} alt="" loading="lazy" style={{ aspectRatio: livre.image!.ratio }} />
          ) : null}
        </span>
      )}
      {enfants}
    </span>
  );
}
