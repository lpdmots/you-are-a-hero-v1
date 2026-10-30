import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Fragment } from "react";
import { Dragon } from "@/composants/Dragon";
import {
  ADRESSE_DU_GUIDE,
  ancreDe,
  COUVERTURES_DU_GUIDE,
  DATE_DU_GUIDE,
  DESCRIPTION_DU_GUIDE,
  donneesDuGuide,
  IMAGES_DU_GUIDE,
  morceaux,
  type Bloc,
  type ImageDuGuide,
  type Partie,
} from "@/domaine/guide";
import { enJsonLd } from "@/domaine/presentation";
import { TEXTE_DU_GUIDE as T } from "@/domaine/texte-du-guide";
import { adresseDuSite } from "@/serveur/env";
import { Schemas } from "./Schemas";
import { SuiviDuSommaire } from "./SuiviDuSommaire";
import styles from "./guide.module.css";

export const metadata: Metadata = {
  // Le titre d'onglet arrêté pour le guide, sans le nom du site après lui
  title: { absolute: T.titre },
  description: DESCRIPTION_DU_GUIDE,
  alternates: { canonical: ADRESSE_DU_GUIDE },
  openGraph: { type: "article", title: T.titre, description: DESCRIPTION_DU_GUIDE, url: ADRESSE_DU_GUIDE, publishedTime: DATE_DU_GUIDE, modifiedTime: DATE_DU_GUIDE, authors: ["Nicolas Coussot"] },
};

const DATE_LISIBLE = new Date(`${DATE_DU_GUIDE}T12:00:00Z`).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

/** Un texte du guide, ses marques rendues : gras, italique, liens, renvois cerclés vers une question */
function EnLigne({ texte }: { texte: string }) {
  return morceaux(texte, T.parties).map((m, i) => {
    switch (m.sorte) {
      case "gras":
        return <strong key={i}>{m.texte}</strong>;
      case "italique":
        return <em key={i}>{m.texte}</em>;
      case "lien":
        return m.adresse.startsWith("/") ? (
          <Link key={i} href={m.adresse}>
            {m.italique ? <em>{m.texte}</em> : m.texte}
          </Link>
        ) : (
          <a key={i} href={m.adresse} rel="noopener">
            {m.italique ? <em>{m.texte}</em> : m.texte}
          </a>
        );
      case "renvoi":
        return (
          <span key={i}>
            (voir{" "}
            <a className={styles.voir} href={`#${ancreDe(m.numero)}`}>
              {"«\u00a0"}{m.titre}{"\u00a0»"}
            </a>
            {/* Le numéro reste sur la ligne du titre qu'il suit */}
            <span className={styles.insecable}>
              {"\u2060"}
              <a className={styles.renvoi} href={`#${ancreDe(m.numero)}`} aria-label={`question ${m.numero}`}>
                {m.numero}
              </a>
              )
            </span>
          </span>
        );
      default:
        return m.texte;
    }
  });
}

function Photo({ image }: { image: ImageDuGuide }) {
  return (
    <figure className={image.portrait ? `${styles.photo} ${styles.photoPortrait}` : styles.photo}>
      <Image src={image.src} alt={image.alt} width={image.largeur} height={image.hauteur} sizes={image.portrait ? "(max-width: 560px) 100vw, 380px" : "(max-width: 1040px) 100vw, 830px"} />
      {image.legende ? <figcaption>{image.legende}</figcaption> : null}
    </figure>
  );
}

function Couvertures() {
  return (
    <figure className={styles.couvertures}>
      <div className={styles.couvRang}>
        {COUVERTURES_DU_GUIDE.map((c) => (
          <Link key={c.titre} className={styles.couv} href="/bibliotheque">
            <Image src={c.src} alt={c.alt} width={c.largeur} height={c.hauteur} sizes="(max-width: 560px) 30vw, 180px" />
            <span className={styles.couvTitre}>{c.titre}</span>
            <span className={styles.couvNote}>{c.note}</span>
          </Link>
        ))}
      </div>
    </figure>
  );
}

function Corps({ partie }: { partie: Partie }) {
  const place = IMAGES_DU_GUIDE[ancreDe(partie.numero)];
  const enGrand = (image: "couvertures" | "schemas" | ImageDuGuide) => (
    <div className={styles.large}>{image === "couvertures" ? <Couvertures /> : image === "schemas" ? <Schemas /> : <Photo image={image} />}</div>
  );
  const bloc = (b: Bloc, i: number) => {
    switch (b.sorte) {
      case "paragraphe":
        return (
          <Fragment key={i}>
            <p>
              {b.tete ? (
                <>
                  <strong>
                    <EnLigne texte={b.tete} />
                  </strong>{" "}
                </>
              ) : null}
              <EnLigne texte={b.texte} />
            </p>
            {place && "apres" in place && b.tete === place.apres ? enGrand(place.image) : null}
          </Fragment>
        );
      case "intertitre":
        return (
          <h3 key={i}>
            <EnLigne texte={b.texte} />
          </h3>
        );
      case "liste":
        // Une liste ordinaire, sauf celle des erreurs à éviter (partie 13), marquée d'une croix
        if (ancreDe(partie.numero) !== "erreurs")
          return (
            <ul key={i} className={styles.liste}>
              {b.elements.map((e) => (
                <li key={e}>
                  <EnLigne texte={e} />
                </li>
              ))}
            </ul>
          );
        return (
          <ol key={i} className={styles.erreurs}>
            {b.elements.map((e) => (
              <li key={e}>
                <svg className={styles.croix} viewBox="0 0 24 24" aria-hidden="true">
                  <circle cx="12" cy="12" r="11" />
                  <path d="M8 8l8 8M16 8l-8 8" />
                </svg>
                <p>
                  <EnLigne texte={e} />
                </p>
              </li>
            ))}
          </ol>
        );
      case "tableau":
        return (
          <div key={i} className={styles.tableau}>
            <table>
              <thead>
                <tr>
                  {b.entete.map((c) => (
                    <th key={c} scope="col">
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {b.rangs.map((r) => (
                  <tr key={r[0]}>
                    <th scope="row">
                      <EnLigne texte={r[0]} />
                    </th>
                    <td>
                      <EnLigne texte={r[1]} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      case "classe":
        return (
          <Fragment key={i}>
            {place && "avantDansMaClasse" in place ? enGrand(place.image) : null}
            <aside className={styles.classe} aria-label="Dans ma classe">
              <p className={styles.classeTitre}>Dans ma classe</p>
              <p>
                <EnLigne texte={b.texte} />
              </p>
              {b.elements ? (
                <ul>
                  {b.elements.map((e) => (
                    <li key={e}>
                      <EnLigne texte={e} />
                    </li>
                  ))}
                </ul>
              ) : null}
            </aside>
          </Fragment>
        );
      case "encart": {
        const image = place && "dansLEncart" in place ? place.image : null;
        return (
          <aside key={i} className={`${styles.encart} ${image ? (image.portrait ? styles.encartPortrait : styles.encartPaysage) : ""}`} aria-label="L’outil Il était une classe">
            <span className={styles.encartSigne} aria-hidden="true">
              <Dragon dessin="petit" />
            </span>
            <p>
              <EnLigne texte={b.texte} />
            </p>
            {image ? (
              <Image className={styles.encartImage} src={image.src} alt={image.alt} width={image.largeur} height={image.hauteur} sizes={image.portrait ? "260px" : "(max-width: 1040px) 100vw, 640px"} />
            ) : null}
          </aside>
        );
      }
    }
  };
  return <>{partie.blocs.map(bloc)}</>;
}

function Sommaire() {
  return (
    <ol className={styles.sommaireListe}>
      {T.parties.map((p) => (
        <li key={p.numero}>
          <a href={`#${ancreDe(p.numero)}`} data-numero={p.numero}>
            <span className={styles.n}>{p.numero}</span>
            <span>{p.titre}</span>
          </a>
        </li>
      ))}
    </ol>
  );
}

/**
 * Le guide « Comment écrire un livre dont vous êtes le héros avec sa classe » (F14-AC52, AC53 ;
 * design.md, « Guide… : maquettes », A2 validée le 30 octobre 2026) : une page de titre sur papier, le
 * sommaire collant, une colonne de lecture d'où débordent les images.
 */
export default function Guide() {
  return (
    <main className={styles.guide}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: enJsonLd(donneesDuGuide(T, adresseDuSite())) }} />
      <header className={styles.titre}>
        <div>
          <h1>{T.titre}</h1>
          <p className={styles.definition}>
            <EnLigne texte={T.definition} />
          </p>
          <p className={styles.auteur}>
            {T.auteur} Mis à jour le <time dateTime={DATE_DU_GUIDE}>{DATE_LISIBLE}</time>.
          </p>
        </div>
        <Image className={styles.dragon} src="/accueil/dragon-grand-livre.webp" alt="" width={500} height={620} sizes="(max-width: 720px) 92px, 230px" />
      </header>
      <div className={styles.grille}>
        <nav className={styles.sommaire} aria-label="Sommaire" data-sommaire>
          <p className={styles.sommaireTitre}>Sommaire</p>
          <Sommaire />
        </nav>
        <article className={styles.article}>
          <section className={styles.bref} aria-labelledby="en-bref">
            <h2 id="en-bref">En bref</h2>
            <ul>
              {T.enBref.map((ligne) => (
                <li key={ligne.chiffre}>
                  <span className={styles.chiffre}>{ligne.chiffre}</span>
                  <span>
                    <EnLigne texte={ligne.texte} />
                    <span className={styles.insecable}>
                      {"\u2060"}
                      <a className={styles.renvoi} href={`#${ancreDe(ligne.partie)}`} aria-label={`question ${ligne.partie}`}>
                        {ligne.partie}
                      </a>
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </section>
          <nav className={styles.sommaireCourt} id="sommaire" aria-label="Sommaire" data-sommaire>
            <p className={styles.sommaireTitre}>Sommaire</p>
            <Sommaire />
          </nav>
          {T.parties.map((p) => (
            <section key={p.numero} className={styles.partie} id={ancreDe(p.numero)} data-partie={p.numero} aria-labelledby={`${ancreDe(p.numero)}-t`}>
              <h2 id={`${ancreDe(p.numero)}-t`}>
                <span className={styles.numero} aria-hidden="true">
                  {p.numero}
                </span>
                <span>{p.titre}</span>
              </h2>
              <Corps partie={p} />
            </section>
          ))}
          <footer className={styles.plusLoin}>
            <h2>Pour aller plus loin</h2>
            {T.plusLoin.map((l) =>
              l.adresse === "/" ? (
                <p key={l.adresse} className={styles.essayer}>
                  <Link href={l.adresse} className="btn btn--primaire btn--grand">
                    {l.libelle}
                  </Link>
                </p>
              ) : (
                <p key={l.adresse} className={styles.choix}>
                  <Link href={l.adresse}>{l.libelle}</Link>
                  <span aria-hidden="true">→</span>
                </p>
              ),
            )}
          </footer>
        </article>
      </div>
      <SuiviDuSommaire total={T.parties.length} />
    </main>
  );
}
