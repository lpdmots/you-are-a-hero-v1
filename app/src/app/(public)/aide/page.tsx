import type { Metadata } from "next";
import Link from "next/link";
import { TutosParTemps } from "@/composants/Tutos";
import { ADRESSE_DE_L_AUTEUR_SEUL } from "@/domaine/auteur-seul";
import { ADRESSE_DU_GUIDE } from "@/domaine/pages-publiques";
import { ADRESSE_DES_RESSOURCES } from "@/domaine/ressources";
import { donneesDeLAide, donneesDesTutos, enJsonLd } from "@/domaine/presentation";
import { EDITEUR, MODELES, PHRASE_DU_SUPPORT, QUESTIONS } from "@/domaine/textes-publics";
import { HORS_SERIE_POSEES, TEMPS_DES_TUTOS, TUTOS_POSES, VIDEO_IA } from "@/domaine/tutos";
import { adresseDuSite } from "@/serveur/env";
import { offreActuelle } from "@/serveur/offre";
import styles from "../public.module.css";
import a from "./aide.module.css";

export const metadata: Metadata = {
  title: "Aide, tutos vidéo et questions fréquentes",
  description: "Un tuto vidéo pour chaque étape du projet, de l’accès des élèves au livre imprimé, et les réponses aux questions fréquentes : âge, durée, matériel, gratuité.",
  alternates: { canonical: "/aide" },
};

/**
 * « Aide » (F14, « Support » et « Tutos vidéo », F14-AC33, AC36, AC62 à AC64), refaite le 21 novembre 2026 :
 * les tutos par temps du projet d'abord, puis les questions, et à côté le guide, les ressources, les
 * documents pour l'école et l'adresse de contact.
 */
export default async function Aide() {
  const offre = await offreActuelle();
  const questions = QUESTIONS.filter((q) => (!q.pass || offre.livrePayant) && (!q.gratuit || !offre.livrePayant));
  const temps = TEMPS_DES_TUTOS.map((t) => ({ ...t, tutos: TUTOS_POSES.filter((x) => x.temps === t.cle) })).filter((t) => t.tutos.length);
  // La vidéo des aides de l'IA, hors série, après les onze (F14-AC68)
  const horsSerie = VIDEO_IA.pose
    ? { video: VIDEO_IA, phrase: `Une scène entière, de sa consigne à son image, avec de vraies réponses de l’IA. Le tout pour dix étoiles : ${offre.etoilesOffertes} vous sont offertes à l’inscription.` }
    : null;
  return (
    <main>
      {/* Les questions et les tutos tels qu'affichés, pour les moteurs et les IA (F14-AC48, AC64) */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: enJsonLd(donneesDeLAide(questions)) }} />
      {TUTOS_POSES.length || HORS_SERIE_POSEES.length ? <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: enJsonLd(donneesDesTutos(adresseDuSite())) }} /> : null}
      <article className={a.page}>
        <h1 className={a.titre}>Aide</h1>
        <p className={styles.chapeau}>Un tuto vidéo pour chaque étape du projet, les réponses aux questions qui reviennent, et le créateur qui vous répond.</p>

        {temps.length || horsSerie ? (
          <section className={a.tutos} aria-labelledby="tutos-t">
            <h2 id="tutos-t">Les tutos en vidéo</h2>
            <TutosParTemps temps={temps} horsSerie={horsSerie} />
          </section>
        ) : null}

        {/* Le titre au-dessus des deux colonnes : la première question et le premier encadré partent à la même hauteur */}
        <h2 id="questions-t" className={a.titreQuestions}>
          Questions fréquentes
        </h2>
        <div className={a.bas}>
          <section aria-labelledby="questions-t">
            <div className={`${styles.questions} ${a.questions}`}>
              {questions.map((q, i) => (
                <details key={q.question} open={i === 0}>
                  <summary>{q.question}</summary>
                  <p>{q.reponse}</p>
                  {q.guide !== undefined ? (
                    <p>
                      <Link href={q.guide ? `${ADRESSE_DU_GUIDE}#${q.guide}` : ADRESSE_DU_GUIDE}>Lire le guide</Link>
                    </p>
                  ) : null}
                  {q.seul ? (
                    <p>
                      {/* L'auteur seul (F14-AC76) : la page qui le développe, pour un livre-jeu */}
                      <Link href={ADRESSE_DE_L_AUTEUR_SEUL}>Lire la page</Link>
                    </p>
                  ) : null}
                  {q.ressources ? (
                    <p>
                      <Link href={ADRESSE_DES_RESSOURCES}>Voir les documents à imprimer</Link>
                    </p>
                  ) : null}
                </details>
              ))}
            </div>
          </section>

          <aside className={a.cote} aria-label="Pour aller plus loin">
            <section className={a.boite} aria-labelledby="plus-t">
              <h2 id="plus-t">Pour aller plus loin</h2>
              <ul className={styles.modeles}>
                <li>
                  <Link href={ADRESSE_DU_GUIDE} className={styles.modeleNom}>
                    Le guide
                  </Link>
                  <span>Écrire un livre dont vous êtes le héros en classe, de la lecture à l’impression.</span>
                </li>
                <li>
                  <Link href={ADRESSE_DES_RESSOURCES} className={styles.modeleNom}>
                    Ressources
                  </Link>
                  <span>Leçons, fiches et affiches à imprimer.</span>
                </li>
              </ul>
            </section>
            <section className={a.boite} aria-labelledby="modeles-t">
              <h2 id="modeles-t">Documents pour l’école</h2>
              <ul className={styles.modeles}>
                {/* L'autorisation des familles : le coupon de la lettre, sur la page « Ressources » (F14-AC33, AC61) */}
                <li>
                  <Link href={`${ADRESSE_DES_RESSOURCES}#lettre-aux-familles`} className={styles.modeleNom}>
                    Lettre aux familles et autorisation
                  </Link>
                  <span>À faire signer avant d’imprimer le livre ou de le proposer à la bibliothèque.</span>
                </li>
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
            <section className={`${a.boite} ${a.contact}`} aria-labelledby="ecrire-t">
              <h2 id="ecrire-t">Écrire au créateur</h2>
              <p>
                <a href={`mailto:${EDITEUR.contact}`}>{EDITEUR.contact}</a>
              </p>
              <p>{PHRASE_DU_SUPPORT}</p>
            </section>
          </aside>
        </div>
      </article>
    </main>
  );
}
