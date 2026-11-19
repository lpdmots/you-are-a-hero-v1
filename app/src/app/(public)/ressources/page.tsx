import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Dragon } from "@/composants/Dragon";
import { Icone } from "@/composants/Icone";
import { ADRESSE_DU_GUIDE } from "@/domaine/pages-publiques";
import { enJsonLd } from "@/domaine/presentation";
import {
  ADRESSE_DES_RESSOURCES,
  DATE_DES_RESSOURCES,
  DESCRIPTION_DES_RESSOURCES,
  donneesDesRessources,
  GRAND_TITRE_DES_RESSOURCES,
  LICENCE_DES_RESSOURCES,
  TEMPS_DU_PROJET,
  TITRE_DES_RESSOURCES,
  versionCompleteDe,
  vignetteDe,
  type DocumentAImprimer,
} from "@/domaine/ressources";
import { adresseDuSite } from "@/serveur/env";
import { SuiviDuSommaire } from "./SuiviDuSommaire";
import styles from "./ressources.module.css";

export const metadata: Metadata = {
  // Le titre arrêté, sans le nom du site après lui, comme le guide
  title: { absolute: TITRE_DES_RESSOURCES },
  description: DESCRIPTION_DES_RESSOURCES,
  alternates: { canonical: ADRESSE_DES_RESSOURCES },
  openGraph: { type: "website", title: TITRE_DES_RESSOURCES, description: DESCRIPTION_DES_RESSOURCES, url: ADRESSE_DES_RESSOURCES },
};

const DATE_LISIBLE = new Date(`${DATE_DES_RESSOURCES}T12:00:00Z`).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

/** Un document : sa première feuille posée sur la table, qui ouvre la version complète, puis ce qu'il est et ses PDF */
function Document({ d }: { d: DocumentAImprimer }) {
  return (
    <li className={styles.document} id={d.cle}>
      <a className={styles.feuille} href={versionCompleteDe(d)} target="_blank" rel="noopener" tabIndex={-1} aria-hidden="true">
        {/* Une vignette déjà à sa taille : sans l'optimisation d'images de Vercel (F14, « Précisions ») */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={vignetteDe(d)} alt="" width={556} height={786} loading="lazy" decoding="async" />
      </a>
      <div className={styles.fiche}>
        <h3>{d.titre}</h3>
        {d.avecLOutil ? (
          <p className={styles.outil}>
            <Dragon dessin="petit" className={styles.outilSigne} />
            Avec Il était une classe
          </p>
        ) : null}
        <p className={styles.phrase}>{d.phrase}</p>
        <p className={styles.format}>{d.format}</p>
        {d.livre ? (
          <p className={styles.livre}>
            <Link href={d.livre.adresse}>
              {d.livre.titre}
              <span aria-hidden="true"> →</span>
            </Link>
          </p>
        ) : null}
        <ul className={styles.versions} aria-label={`Télécharger « ${d.titre} »`}>
          {d.versions.map((v) => (
            <li key={v.fichier}>
              <a className="btn btn--petit" href={v.fichier} target="_blank" rel="noopener">
                <Icone nom="telecharger" />
                {v.libelle}
                <span className="vh"> (PDF, nouvel onglet)</span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </li>
  );
}

/** Les programmes en texte (F14-AC58) : ce que le projet travaille et les textes en vigueur ; les citations restent dans le PDF */
function Programmes() {
  return (
    <aside className={styles.programmes} id="programmes" aria-labelledby="programmes-t">
      <h3 id="programmes-t">Les programmes</h3>
      <p>
        Le projet fait lire, écrire et parler, comme les programmes de français le demandent. Au cycle 3, les élèves produisent des écrits longs, à plusieurs, et améliorent leur texte à partir des pistes de l’enseignant et de leurs camarades. Au cycle 2, la classe lit des livres-jeux ensemble et écrit d’abord à plusieurs, puis chacun ses scènes au CE1 et au CE2.
      </p>
      <p>
        La feuille <a href="/ressources/programmes.pdf" target="_blank" rel="noopener"><cite>Le livre-jeu et les programmes</cite><span className="vh"> (PDF, nouvel onglet)</span></a> met chaque moment du projet en regard des textes, cités mot pour mot.
      </p>
      <p className={styles.textes}>
        Cycle 2 : arrêté du 22 octobre 2024, Bulletin officiel n° 41 du 31 octobre 2024. Cycle 3 : arrêté du 10 avril 2025, Bulletin officiel n° 16 du 17 avril 2025.
      </p>
    </aside>
  );
}

/**
 * La page « Ressources » (F14, « Page « Ressources » », F14-AC55 à AC58) : une page de titre sur papier comme le guide,
 * le sommaire collant, puis le bloc « Pour mener le projet » et les quatre temps du déroulé, chaque document posé sur
 * la table avec sa première feuille. La page présente et donne accès ; les documents font foi.
 */
export default function Ressources() {
  return (
    <main className={styles.ressources}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: enJsonLd(donneesDesRessources(adresseDuSite())) }} />
      <header className={styles.titre}>
        <div>
          <h1>{GRAND_TITRE_DES_RESSOURCES}</h1>
          <p className={styles.chapeau}>
            Les leçons, les fiches et les affiches d’un projet de production d’écrit&nbsp;: la classe découvre le livre dont vous êtes le héros, puis écrit le sien, du CE1 au CM2 (7 à 11&nbsp;ans). Tout est gratuit, à imprimer, et sert aussi aux classes qui n’utilisent pas Il était une classe.
          </p>
          <p className={styles.usage}>
            Libres de photocopier et de partager pour la classe, sans les vendre, en citant Il était une classe (licence{" "}
            <a href={LICENCE_DES_RESSOURCES.adresse} target="_blank" rel="noopener noreferrer license">
              {LICENCE_DES_RESSOURCES.nom}
              <span className="vh"> (nouvel onglet)</span>
            </a>
            ). Mis à jour le <time dateTime={DATE_DES_RESSOURCES}>{DATE_LISIBLE}</time>.
          </p>
        </div>
        {/* Bouquin déroule le chemin qui mène au livre : le dessin d'en-tête du déroulé */}
        <Image className={styles.dragon} src="/accueil/dragon-deroule.webp" alt="" width={588} height={720} sizes="(max-width: 720px) 92px, 210px" loading="eager" />
      </header>

      <div className={styles.grille}>
        <nav className={styles.sommaire} aria-label="Sommaire" data-sommaire>
          <p className={styles.sommaireTitre}>Sur cette page</p>
          <ol>
            {TEMPS_DU_PROJET.map((t) => (
              <li key={t.cle}>
                <a href={`#${t.cle}`}>
                  <span className={styles.n} aria-hidden="true">
                    {t.numero ?? ""}
                  </span>
                  <span>{t.titre}</span>
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className={styles.contenu}>
          {TEMPS_DU_PROJET.map((t) => (
            <section key={t.cle} className={styles.temps} id={t.cle} data-temps aria-labelledby={`${t.cle}-t`}>
              <h2 id={`${t.cle}-t`}>
                {t.numero ? (
                  <span className={styles.numero} aria-hidden="true">
                    <span data-numero={t.numero} />
                  </span>
                ) : null}
                <span>{t.titre}</span>
              </h2>
              <p className={styles.tempsPhrase}>
                {t.phrase}
                {t.renvoi ? (
                  <>
                    {" "}
                    {t.renvoi.avant}
                    <a href={`#${t.renvoi.cle}`}>{t.renvoi.lien}</a>
                    {t.renvoi.apres}
                  </>
                ) : null}
              </p>
              {t.documents.length ? (
                <ul className={styles.documents}>
                  {t.documents.map((d) => (
                    <Document key={d.cle} d={d} />
                  ))}
                </ul>
              ) : null}
              {t.cle === "mener-le-projet" ? <Programmes /> : null}
            </section>
          ))}
        </div>
      </div>

      {/* La fin, sur une feuille qui répond à la page de titre : où s'écrit le livre, et le seul bouton plein */}
      <footer className={styles.fin} aria-labelledby="fin-t">
        <div>
          <h2 id="fin-t">Et pour écrire le livre&nbsp;?</h2>
          <p className={styles.finTexte}>
            Avec Il était une classe, chaque élève écrit ses scènes sur l’ordinateur, l’enseignant les relit et les relie, et le livre se met en page pour l’impression et la lecture en ligne.
          </p>
          <p className={styles.finSuite}>
            <Link className="btn btn--primaire btn--grand" href="/entree/inscription">
              Créer un compte
            </Link>
            <Link href={ADRESSE_DU_GUIDE}>Lire le guide</Link>
          </p>
        </div>
        {/* Le dragon s'est endormi sur son livre, comme à la fin du guide */}
        <Image className={styles.dragonEndormi} src="/accueil/dragon-endormi.webp" alt="" width={720} height={559} sizes="(max-width: 720px) 150px, 210px" />
      </footer>
      <SuiviDuSommaire />
    </main>
  );
}
