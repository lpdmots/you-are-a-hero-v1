import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Fragment, type ReactNode } from "react";
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
import { Annee } from "./Annee";
import { Choix } from "./Choix";
import { Decoupage } from "./Decoupage";
import { JetDeDe } from "./JetDeDe";
import { Parcours } from "./Parcours";
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
          // Un lien vers un autre site s'ouvre dans un nouvel onglet, pour ne pas perdre sa place dans le guide ; il le dit
          <a key={i} href={m.adresse} target="_blank" rel="noopener noreferrer">
            {m.italique ? <em>{m.texte}</em> : m.texte}
            <svg className={styles.externe} viewBox="0 0 12 12" aria-hidden="true">
              <path d="M4.5 2.5h5v5M9.5 2.5 3 9" />
            </svg>
            <span className="vh"> (nouvel onglet)</span>
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
                <span>{m.numero}</span>
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

/** Une liste dont chaque ligne est « **Titre · précision** — *Accroche.* texte » se montre en cartes, dans ces questions */
const EN_CARTES: string[] = ["age", "choix"];
/** Les cinq pistes pour imaginer des choix (partie 7) : un pictogramme par carte */
const PICTOS: Record<string, ReactNode> = {
  Explorer: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M15.5 8.5 13 13l-4.5 2.5L11 11z" />
    </>
  ),
  "Changer de méthode": (
    <>
      <circle cx="8" cy="16" r="4" />
      <path d="M11 13l8-8M16 8l2 2M14 10l2 2" />
    </>
  ),
  "Observer et réfléchir": (
    <>
      <circle cx="10.5" cy="10.5" r="6" />
      <path d="M15 15l5 5" />
    </>
  ),
  "Faire un compromis": <path d="M12 4v16M8 20h8M5 7h14M5 7l-3 6h6zM19 7l-3 6h6z" />,
  "Adopter une attitude": <path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10z" />,
};
const CARTE = /^\*\*([^*]+)\*\*\s+—\s+(?:\*([^*]+)\*\s*)?(.*)$/;

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
        // Le parcours d'une scène (partie 5) se montre en schéma
        if (b.ordonnee && ancreDe(partie.numero) === "repartir")
          return (
            <div key={i} className={styles.large}>
              <Parcours elements={b.elements} enLigne={(t) => <EnLigne texte={t} />} />
            </div>
          );
        if (b.ordonnee)
          return (
            <ol key={i} className={styles.etapes}>
              {b.elements.map((e) => (
                <li key={e}>
                  <EnLigne texte={e} />
                </li>
              ))}
            </ol>
          );
        // Les niveaux (partie 2) se comparent en cartes, côte à côte
        if (EN_CARTES.includes(ancreDe(partie.numero)) && b.elements.every((e) => CARTE.test(e)))
          return (
            <ul key={i} className={`${styles.large} ${styles.cartes} ${b.elements.length > 3 ? styles.cartesPetites : ""}`}>
              {b.elements.map((e) => {
                const [, tete, accroche, texte] = e.match(CARTE)!;
                const [titre, precision] = tete.split(" · ");
                return (
                  <li key={e} className={styles.carte}>
                    <p className={styles.carteTitre}>
                      {PICTOS[titre] ? (
                        <svg className={styles.cartePicto} viewBox="0 0 24 24" aria-hidden="true">
                          {PICTOS[titre]}
                        </svg>
                      ) : null}
                      {titre}
                      {precision ? <span className={styles.cartePrecision}>{precision}</span> : null}
                    </p>
                    {accroche ? <p className={styles.carteAccroche}>{accroche}</p> : null}
                    <p className={styles.carteTexte}>
                      <EnLigne texte={texte} />
                    </p>
                  </li>
                );
              })}
            </ul>
          );
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
          <div key={i} className={b.entete.length > 2 ? `${styles.tableau} ${styles.colonnes}` : styles.tableau}>
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
                    {r.slice(1).map((c, j) => (
                      <td key={j}>
                        <EnLigne texte={c} />
                      </td>
                    ))}
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
            {place && "apresDansMaClasse" in place ? enGrand(place.image) : null}
          </Fragment>
        );
      case "exemple": {
        // La feuille d'écriture que reçoit l'élève : sa consigne, puis sa liste à cocher
        const consigne = b.texte.replace(/^Consigne\s*:\s*/, "");
        return (
          <figure key={i} className={styles.fiche} aria-label={`Exemple de consigne : ${b.titre.replace(/\.$/, "")}`}>
            <p className={styles.ficheSorte}>Exemple</p>
            <p className={styles.ficheTitre}>{b.titre.replace(/\.$/, "")}</p>
            <p className={styles.ficheEtiquette}>Consigne</p>
            <p className={styles.ficheConsigne}>{consigne}</p>
            <p className={styles.ficheRappel}>{b.rappel}</p>
            <ul>
              {(b.elements ?? []).map((e) => (
                <li key={e}>
                  <span className={styles.case} aria-hidden="true" />
                  {e.replace(/\s*[;.]$/, "")}
                </li>
              ))}
            </ul>
          </figure>
        );
      }
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
  // L'image se pose après le paragraphe nommé, ou après la liste ou le tableau qui le suit
  const apres = place && "apres" in place ? partie.blocs.findIndex((b) => b.sorte === "paragraphe" && b.tete === place.apres) : -1;
  const suivant = partie.blocs[apres + 1]?.sorte;
  const ou = apres >= 0 && (suivant === "liste" || suivant === "tableau") ? apres + 1 : apres;
  return (
    <>
      {partie.blocs.map((b, i) => (
        <Fragment key={i}>
          {bloc(b, i)}
          {i === ou && place && "apres" in place ? enGrand(place.image) : null}
          {/* Du livre à la scène (partie 4), en boîtes emboîtées sous son paragraphe */}
          {ancreDe(partie.numero) === "inventer" && b.sorte === "paragraphe" && b.tete?.startsWith("Découpez l’aventure") ? (
            <div className={styles.large}>
              <Decoupage />
            </div>
          ) : null}
          {/* Un choix et ses conséquences (partie 7), sous « Donnez une raison de choisir » */}
          {ancreDe(partie.numero) === "choix" && b.sorte === "paragraphe" && b.tete === "Donnez une raison de choisir." ? (
            <div className={styles.large}>
              <Choix />
            </div>
          ) : null}
          {/* L'année d'un grand livre (partie 11), en frise sous « Dans l'année » */}
          {ancreDe(partie.numero) === "temps" && b.sorte === "paragraphe" && b.tete === "Dans l’année." ? (
            <div className={styles.large}>
              <Annee />
            </div>
          ) : null}
          {/* La règle du dé (partie 9), en schéma sous son paragraphe */}
          {ancreDe(partie.numero) === "objets" && b.sorte === "paragraphe" && b.tete?.startsWith("Le dé") ? <JetDeDe /> : null}
        </Fragment>
      ))}
    </>
  );
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
                        <span>{ligne.partie}</span>
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
                  <span>{p.numero}</span>
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
