import type { Metadata } from "next";
import Link from "next/link";
import { EDITEUR, MODELES, PHRASE_DU_SUPPORT, QUESTIONS } from "@/domaine/textes-publics";
import { offreActuelle } from "@/serveur/offre";
import styles from "../public.module.css";

export const metadata: Metadata = { title: "Aide", description: "Questions fréquentes, modèles à télécharger, et l’adresse pour écrire au créateur.", alternates: { canonical: "/aide" } };

/** « Aide » (F14, « Support », F14-AC33, AC36) : une petite foire aux questions, les modèles, l'adresse de contact. */
export default async function Aide() {
  const offre = await offreActuelle();
  const questions = QUESTIONS.filter((q) => !q.vente || offre.paiementOuvert);
  return (
    <main>
      <article className={styles.texte}>
        <h1>Aide</h1>
        <p className={styles.chapeau}>Les questions qui reviennent, les modèles pour les familles et l’école, et l’adresse pour écrire au créateur.</p>
        <div className={styles.questions}>
          {questions.map((q, i) => (
            <details key={q.question} open={i === 0}>
              <summary>{q.question}</summary>
              <p>{q.reponse}</p>
            </details>
          ))}
        </div>
        <section>
          <h2>Modèles à télécharger</h2>
          <ul className={styles.modeles}>
            {MODELES.map((m) => (
              <li key={m.cle}>
                <Link href={`/modeles/${m.cle}`} className={styles.modeleNom}>
                  {m.nom}
                </Link>
                <span>{m.pour}</span>
              </li>
            ))}
          </ul>
        </section>
        <section className={styles.encadre} aria-labelledby="ecrire-t">
          <h2 id="ecrire-t">Écrire au créateur</h2>
          <p>
            <a href={`mailto:${EDITEUR.contact}`}>{EDITEUR.contact}</a>
          </p>
          <p>{PHRASE_DU_SUPPORT}</p>
        </section>
      </article>
    </main>
  );
}
