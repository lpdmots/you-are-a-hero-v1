import type { Metadata } from "next";
import Link from "next/link";
import { Bulle } from "@/composants/Bulle";
import { Icone } from "@/composants/Icone";
import { ImageRepere } from "@/composants/ImageRepere";
import { prochaineOuverture } from "@/domaine/horaires";
import { majuscule } from "@/domaine/texte";
import { livresDuPoste, type LivrePropose } from "@/serveur/livres-eleve";
import { contexteEleve, histoiresDuPoste } from "@/serveur/recit-eleve";
import { EnteteEleve } from "../EnteteEleve";
import styles from "./lecture.module.css";

export const metadata: Metadata = { title: "Lire" };

/**
 * « Lire », l'unique entrée de lecture de l'élève (étape 7, 16 octobre 2026). En haut, l'histoire
 * que la classe écrit, à lire à l'essai pendant les horaires (F09.1) ; dessous, les livres
 * terminés que l'enseignant ouvre à ses classes, à lire à toute heure (F12.3, F06-AC31), celui de
 * la classe en grand.
 */
export default async function Page() {
  const contexte = await contexteEleve();
  const [histoires, livres] = await Promise.all([
    contexte.ouvert ? histoiresDuPoste(contexte).then((h) => h.filter((x) => x.parties.some((p) => p.chapitres.some((c) => c.lisible)))) : Promise.resolve([]),
    livresDuPoste(contexte),
  ]);
  const rouvre = contexte.ouvert ? null : prochaineOuverture(contexte.plages, new Date());
  const [premier, ...autres] = livres;
  const enGrand = premier?.deMaClasse ? premier : null;
  const suite = enGrand ? autres : livres;

  return (
    <>
      <EnteteEleve contexte={contexte} ici="lecture" />
      <main className={`page page--eleve ${styles.page}`}>
        <h1 className={styles.titre}>
          <Icone nom="livre" />
          Lire
        </h1>

        <section className={styles.bloc} aria-labelledby="en-cours-t">
          <h2 id="en-cours-t">{histoires.length > 1 ? "Nos histoires en cours" : "Notre histoire en cours"}</h2>
          {!contexte.ouvert ? (
            <p className={styles.ferme}>
              <Icone nom="horloge" />
              {rouvre ? (
                <span>
                  La lecture à l’essai rouvre <span className="chiffres">{rouvre}</span>, avec le travail.
                </span>
              ) : (
                "La lecture à l’essai est fermée pour le moment, comme le travail."
              )}
            </p>
          ) : histoires.length ? (
            histoires.map((h) => (
              // Une rangée basse : le livre de la classe, plus bas, reste la vedette de la page
              <article key={h.id} className={styles.enCours}>
                <div className={styles.enCours__image}>
                  <ImageRepere repere={h} graine={h.id} />
                </div>
                <div className={styles.enCours__texte}>
                  <h3>{h.titre}</h3>
                  <p>Pas encore fini : lis-le à l’essai, pour voir si tout s’enchaîne.</p>
                </div>
                <Link className="btn" href={`/travail/lecture/${h.id}`}>
                  <Icone nom="livre" />
                  Lire à l’essai
                </Link>
              </article>
            ))
          ) : (
            <p className={styles.rien}>Tu n’as pas encore de chapitre : il n’y a rien à lire à l’essai pour l’instant.</p>
          )}
        </section>

        <section className={styles.bloc} aria-labelledby="a-lire-t">
          <h2 id="a-lire-t" className={styles.titreAvecBulle}>
            Livres à lire
            <Bulle question="Quels livres trouve-t-on ici ?">
              <span>Des livres terminés que {contexte.prof} te propose. Ici, tu lis pour le plaisir : rien à écrire, rien à corriger.</span>
            </Bulle>
          </h2>
          {livres.length === 0 ? (
            <p className={styles.rien}>Pas encore de livre. Quand {contexte.prof} en proposera un, il sera ici.</p>
          ) : (
            <>
              {enGrand ? <Livre livre={enGrand} grand /> : null}
              {suite.length ? (
                <ul className={styles.livres}>
                  {suite.map((l) => (
                    <li key={l.projetId}>
                      <Livre livre={l} />
                    </li>
                  ))}
                </ul>
              ) : null}
            </>
          )}
        </section>
      </main>
    </>
  );
}

/** Un livre proposé : un objet-livre typographique, son titre, ce qu'il contient, « Lire ». */
function Livre({ livre, grand = false }: { livre: LivrePropose; grand?: boolean }) {
  const contenu = livre.aChoix ? `Livre à choix · ${livre.passages} passages` : `Récit · ${livre.chapitres} chapitre${livre.chapitres > 1 ? "s" : ""}`;
  return (
    <Link className={`${styles.propose}${grand ? ` ${styles.proposeGrand}` : ""}`} href={`/travail/lire/${livre.projetId}`}>
      <span className={styles.couverture} aria-hidden="true">
        {livre.image ? (
          // eslint-disable-next-line @next/next/no-img-element -- servie par l'application, d'après la version partagée
          <img src={`/images/classe/${livre.projetId}/${livre.image}?v=1`} alt="" />
        ) : null}
        <span className={styles.couverture__titre}>{livre.titre}</span>
        <svg viewBox="0 0 120 10">
          <path d="M0 5h52M68 5h52" />
          <path d="M60 1.5l3.5 3.5L60 8.5 56.5 5z" />
        </svg>
      </span>
      <span className={styles.propose__texte}>
        {livre.deMaClasse ? (
          <span className={styles.tampon}>
            <Icone nom="crayon" />
            Écrit par ta classe
          </span>
        ) : null}
        <span className={styles.propose__titre}>{livre.titre}</span>
        {/* La ligne de sa page de titre, comme sur la couverture : la classe, ou l'auteur (F12-AC24) */}
        {!livre.deMaClasse && livre.ligne ? <span className={`${styles.propose__ligne} recit`}>{majuscule(livre.ligne)}</span> : null}
        <span className={styles.propose__meta}>{contenu}</span>
        <span className={`btn ${grand ? "btn--primaire btn--grand" : ""} ${styles.propose__lire}`}>
          <Icone nom="livre" />
          Lire
        </span>
      </span>
    </Link>
  );
}
