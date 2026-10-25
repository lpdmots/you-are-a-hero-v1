import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { Icone } from "./Icone";
import { Logo } from "./Logo";
import styles from "./EntreeIllustree.module.css";

/**
 * Les illustrations de la page de gauche (V1/identite/entree, générées par le porteur le
 * 23 octobre 2026) : une scène du dragon par entrée ; la classe au travail, sans personnage, pour
 * les autres pages qui prennent cette forme (erreur, paiement), le dragon ne paraissant pas aux
 * moments d'incident (design.md, « Fantaisie et mascotte »).
 */
const ILLUSTRATIONS = {
  enseignant: { src: "/entree/entree-enseignant.webp", alt: "Le dragon de la classe ouvre un livre géant comme une porte, sur un paysage de conte" },
  inscription: { src: "/entree/inscription.webp", alt: "Le dragon, ravi, devant un livre neuf aux pages blanches ; la souris en grignote un coin" },
  eleves: { src: "/entree/entree-eleves.webp", alt: "Le dragon attend sur le banc, sous les porte-manteaux de la classe ; la souris sort d'un cartable" },
  classe: { src: "/accueil/classe-au-travail.webp", alt: "" },
} as const;

export type Renvoi = { phrase: string; vers: number; href: string };

/**
 * Écran d'entrée (refait le 23 octobre 2026, design.md, « Entrées en livre-jeu ») : le grand livre
 * ouvert de l'accueil, l'illustration sur la page de gauche, le passage sur celle de droite, avec
 * son numéro, et ses choix (« rendez-vous au 3 ») qui mènent aux autres entrées. Le nom, en tête,
 * mène à l'accueil ; les écrans d'entrée le disent aussi en clair (`retourAccueil`), celui des
 * élèves compris, à la demande du porteur (22 octobre 2026).
 */
export function EntreeIllustree({
  titre,
  aide,
  parole,
  children,
  pied,
  choix,
  numero,
  illustration = "classe",
  retourAccueil = false,
}: {
  titre: ReactNode;
  aide?: ReactNode;
  /** Ce que dit le dragon : aux élèves seulement, une phrase au plus */
  parole?: string;
  children: ReactNode;
  pied?: ReactNode;
  choix?: Renvoi[];
  numero?: number;
  illustration?: keyof typeof ILLUSTRATIONS;
  retourAccueil?: boolean;
}) {
  const image = ILLUSTRATIONS[illustration];
  return (
    <div className={styles.table}>
      <header className={styles.tete}>
        <span className={styles.marque}>
          <Logo href="/" />
        </span>
        {retourAccueil ? (
          <Link href="/" className={styles.retour}>
            <Icone nom="fleche-g" />
            Retour à l’accueil
          </Link>
        ) : null}
      </header>
      <main className={styles.scene}>
        <div className={styles.livre}>
          <figure className={`${styles.gauche} ${styles[illustration]}`}>
            <Image src={image.src} alt={image.alt} fill priority sizes="(max-width: 980px) 100vw, 420px" />
          </figure>
          <section className={styles.droite} aria-labelledby="titre-entree">
            {numero ? <p className={styles.numero}>{numero}</p> : null}
            <h1 id="titre-entree">{titre}</h1>
            {parole ? <p className={styles.parole}>{parole}</p> : null}
            {aide ? <p className={styles.aide}>{aide}</p> : null}
            <div className={styles.corps}>{children}</div>
            {pied ? <p className={styles.aide}>{pied}</p> : null}
            {choix?.length ? (
              <ul className={styles.choix}>
                {choix.map((c) => (
                  <li key={c.href}>
                    <Link href={c.href}>
                      {/* « rendez‑vous » ne se coupe pas en fin de ligne : trait d'union insécable */}
                      <span className={styles.phrase}>{c.phrase.replace("rendez-vous", "rendez‑vous")}</span>{" "}
                      <span className={styles.renvoi}>{c.vers}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : null}
          </section>
        </div>
      </main>
    </div>
  );
}

/** Les numéros des passages d'entrée : chaque page porte le sien, et les choix y renvoient. */
export const PASSAGES = {
  inscription: { vers: 3, href: "/entree/inscription" },
  enseignant: { vers: 7, href: "/entree" },
  eleves: { vers: 14, href: "/classe" },
  oubli: { vers: 21, href: "/entree/oubli" },
} as const;
