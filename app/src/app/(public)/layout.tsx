import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "@/composants/Logo";
import { EDITEUR } from "@/domaine/textes-publics";
import { adresseDuSite } from "@/serveur/env";
import styles from "./public.module.css";

// Les pages publiques se trouvent : l'application, elle, reste hors des moteurs de recherche. Les
// adresses de l'aperçu de partage partent de l'adresse publique du site.
export const metadata: Metadata = { metadataBase: new URL(adresseDuSite()), robots: { index: true, follow: true } };

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
          <Link href="/entree" className={styles.navConnexion}>
            Se connecter
          </Link>
          {/* L'inscription toujours à portée, en bouton cerné : le seul bouton plein reste celui de la page */}
          <Link href="/entree/inscription" className={`btn ${styles.navCompte}`}>
            Créer un compte
          </Link>
        </nav>
      </header>
      {children}
      {/* Le pied (repris le 23 octobre 2026, à la demande du porteur) : la marque et sa promesse, les
          pages rangées par sujet, puis une barre basse. Son filet du haut est le sol de la table de
          l'accueil, où dorment les personnages. */}
      <footer className={styles.pied}>
        <div className={styles.piedHaut}>
          <div className={styles.piedMarque}>
            <span className={styles.marque}>
              <Logo href="/" />
            </span>
            <p>Votre classe écrit son livre-jeu.</p>
          </div>
          <nav className={styles.piedPages} aria-label="Pages du site">
            <div>
              <p className={styles.piedTitre}>Commencer</p>
              <ul>
                <li>
                  <Link href="/entree/inscription">Créer un compte</Link>
                </li>
                <li>
                  <Link href="/entree">Entrée enseignant</Link>
                </li>
                <li>
                  <Link href="/classe">Entrée des élèves</Link>
                </li>
              </ul>
            </div>
            <div>
              <p className={styles.piedTitre}>Besoin d’aide ?</p>
              <ul>
                <li>
                  <Link href="/aide">Aide</Link>
                </li>
                <li>
                  <a href={`mailto:${EDITEUR.contact}`} title={EDITEUR.contact}>
                    Écrire au créateur
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <p className={styles.piedTitre}>Informations</p>
              <ul>
                <li>
                  <Link href="/confidentialite">Confidentialité</Link>
                </li>
                <li>
                  <Link href="/conditions">Conditions d’utilisation</Link>
                </li>
                <li>
                  <Link href="/mentions-legales">Mentions légales</Link>
                </li>
              </ul>
            </div>
          </nav>
        </div>
        <div className={styles.piedBas}>
          <p>Fait par un enseignant, pour écrire avec sa classe.</p>
          <p>© {new Date().getFullYear()} Il était une classe</p>
        </div>
      </footer>
    </div>
  );
}
