import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { Dragon } from "./Dragon";
import { Icone } from "./Icone";
import styles from "./EntreeIllustree.module.css";

/**
 * Écran d'entrée : l'illustration donne l'ambiance, la carte porte le formulaire. Le nom, en tête de
 * carte, mène à l'accueil ; les écrans de l'adulte le disent aussi en clair (`retourAccueil`), pas
 * l'entrée des élèves, qu'un lien vers la page des enseignants ne servirait pas (22 octobre 2026).
 */
export function EntreeIllustree({
  titre,
  aide,
  children,
  pied,
  retourAccueil = false,
}: {
  titre: ReactNode;
  aide?: ReactNode;
  children: ReactNode;
  pied?: ReactNode;
  retourAccueil?: boolean;
}) {
  return (
    <main className={styles.entree}>
      <div className={styles.image}>
        <Image src="/illustrations/defaut-cite.jpg" alt="" fill priority sizes="(max-width: 720px) 100vw, 55vw" />
      </div>
      <section className={styles.carte} aria-labelledby="titre-entree">
        {retourAccueil ? (
          <nav className={`fil ${styles.retour}`} aria-label="Fil d’Ariane">
            <Link href="/">
              <Icone nom="fleche-g" />
              Retour à l’accueil
            </Link>
          </nav>
        ) : null}
        <Link href="/" className={styles.marque}>
          <Dragon dessin="grand" className={styles.dragon} />
          <span>Il était une classe</span>
        </Link>
        <h1 id="titre-entree">{titre}</h1>
        {aide ? <p className={styles.aide}>{aide}</p> : null}
        {children}
        {pied ? <p className={styles.aide}>{pied}</p> : null}
      </section>
    </main>
  );
}
