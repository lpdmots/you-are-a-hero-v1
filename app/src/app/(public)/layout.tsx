import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "@/composants/Logo";
import { EDITEUR } from "@/domaine/textes-publics";
import styles from "./public.module.css";

// Les pages publiques se trouvent : l'application, elle, reste hors des moteurs de recherche
export const metadata: Metadata = { robots: { index: true, follow: true } };

/** Les pages publiques (F14, « Pages publiques ») : un en-tête qui mène aux entrées, un pied qui mène aux textes. */
export default function PagesPubliques({ children }: { children: ReactNode }) {
  return (
    <div className={styles.public}>
      <header className={styles.tete}>
        <span className={styles.marque}>
          <Logo href="/" />
        </span>
        <nav className={styles.nav} aria-label="Entrer">
          <Link href="/aide" className={styles.navAide}>
            Aide
          </Link>
          <Link href="/classe" aria-label="Entrée des élèves">
            <span className={styles.navLong}>Entrée des élèves</span>
            <span className={styles.navCourt}>Élèves</span>
          </Link>
          <Link href="/entree" className="btn">
            Se connecter
          </Link>
        </nav>
      </header>
      {children}
      <footer className={styles.pied}>
        <nav aria-label="Pages du site">
          <Link href="/aide">Aide</Link>
          <Link href="/entree">Entrée enseignant</Link>
          <Link href="/classe">Entrée des élèves</Link>
          <Link href="/confidentialite">Confidentialité</Link>
          <Link href="/conditions">Conditions d’utilisation</Link>
          <Link href="/mentions-legales">Mentions légales</Link>
          <a href={`mailto:${EDITEUR.contact}`}>{EDITEUR.contact}</a>
        </nav>
        <p>Fait par un enseignant, pour écrire avec sa classe.</p>
      </footer>
    </div>
  );
}
