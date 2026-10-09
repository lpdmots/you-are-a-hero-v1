import Image from "next/image";
import type { ReactNode } from "react";
import styles from "./EntreeIllustree.module.css";

/** Écran d'entrée : l'illustration donne l'ambiance, la carte porte le formulaire. */
export function EntreeIllustree({ titre, aide, children, pied }: { titre: ReactNode; aide?: ReactNode; children: ReactNode; pied?: ReactNode }) {
  return (
    <main className={styles.entree}>
      <div className={styles.image}>
        <Image src="/illustrations/defaut-cite.jpg" alt="" fill priority sizes="(max-width: 720px) 100vw, 55vw" />
      </div>
      <section className={styles.carte} aria-labelledby="titre-entree">
        <p className={styles.marque}>Il était une classe</p>
        <h1 id="titre-entree">{titre}</h1>
        {aide ? <p className={styles.aide}>{aide}</p> : null}
        {children}
        {pied ? <p className={styles.aide}>{pied}</p> : null}
      </section>
    </main>
  );
}
