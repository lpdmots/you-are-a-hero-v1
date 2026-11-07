import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Fragment, type ReactNode } from "react";
import { Dragon } from "@/composants/Dragon";
import {
  ADRESSE_DU_GUIDE,
  ancreDe,
  COUVERTURES_DU_GUIDE,
  DECOUPAGE_EN_IMAGES,
  DATE_DE_PUBLICATION_DU_GUIDE,
  DATE_DU_GUIDE,
  DESCRIPTION_DU_GUIDE,
  donneesDuGuide,
  IMAGES_DES_ENCARTS,
  IMAGES_DU_GUIDE,
  IMAGE_DE_PARTAGE_DU_GUIDE,
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
import { ConsigneDansLApp } from "./ConsigneDansLApp";
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
  openGraph: { type: "article", title: T.titre, description: DESCRIPTION_DU_GUIDE, url: ADRESSE_DU_GUIDE, publishedTime: DATE_DE_PUBLICATION_DU_GUIDE, modifiedTime: DATE_DU_GUIDE, authors: ["Nicolas Coussot"], images: [{ url: IMAGE_DE_PARTAGE_DU_GUIDE.src, width: IMAGE_DE_PARTAGE_DU_GUIDE.largeur, height: IMAGE_DE_PARTAGE_DU_GUIDE.hauteur, alt: IMAGE_DE_PARTAGE_DU_GUIDE.alt }] },
  // Sa propre image aussi pour X, sans quoi il hériterait de celle des pages publiques
  twitter: { card: "summary_large_image", images: [{ url: IMAGE_DE_PARTAGE_DU_GUIDE.src, alt: IMAGE_DE_PARTAGE_DU_GUIDE.alt }] },
};

const DATE_LISIBLE = new Date(`${DATE_DU_GUIDE}T12:00:00Z`).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

/** Le texte d'un lien vers un autre site et sa flèche, liée au dernier mot pour ne jamais passer seule à la ligne */
function LienExterne({ texte, italique }: { texte: string; italique?: boolean }) {
  const coupe = texte.lastIndexOf(" ") + 1;
  const fin = (
    <span className={styles.insecable}>
      {texte.slice(coupe)}
      <svg className={styles.externe} viewBox="0 0 12 12" aria-hidden="true">
        <path d="M4.5 2.5h5v5M9.5 2.5 3 9" />
      </svg>
    </span>
  );
  const tout = (
    <>
      {texte.slice(0, coupe)}
      {fin}
    </>
  );
  return italique ? <em>{tout}</em> : tout;
}

/**
 * Un texte du guide, ses marques rendues : gras, italique, liens, renvois cerclés vers une question. En
 * renvoi `court` (les erreurs à éviter, partie 14), le numéro cerclé seul, son titre au survol : le gras de
 * chaque erreur dit déjà le sujet.
 */
function EnLigne({ texte, court }: { texte: string; court?: boolean }) {
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
            <LienExterne texte={m.texte} italique={m.italique} />
            <span className="vh"> (nouvel onglet)</span>
          </a>
        );
      case "renvoi":
        if (court)
          return (
            <span key={i} className={styles.insecable}>
              {"\u2060"}
              <a className={`${styles.renvoi} ${styles.renvoiCourt}`} href={`#${ancreDe(m.numero)}`} aria-label={`question ${m.numero} : ${m.titre}`} title={m.titre}>
                <span>{m.numero}</span>
              </a>
            </span>
          );
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
  const classe = [styles.photo, image.portrait ? styles.photoPortrait : "", image.moyenne ? styles.photoMoyenne : ""].filter(Boolean).join(" ");
  return (
    <figure className={classe}>
      <Image
        className={image.telephone ? styles.surOrdinateur : undefined}
        src={image.src}
        alt={image.alt}
        width={image.largeur}
        height={image.hauteur}
        sizes={image.portrait ? "(max-width: 560px) 100vw, 380px" : image.moyenne ? "(max-width: 680px) 100vw, 640px" : "(max-width: 1040px) 100vw, 830px"}
      />
      {/* Sur téléphone, la même capture cadrée plus serré, pour rester lisible */}
      {image.telephone ? <Image className={styles.surTelephone} src={image.telephone.src} alt={image.alt} width={image.telephone.largeur} height={image.telephone.hauteur} sizes="100vw" /> : null}
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
        // Une liste ordinaire, sauf celle des erreurs à éviter (partie 14), marquée d'une croix
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
                  <EnLigne texte={e} court />
                </p>
              </li>
            ))}
          </ol>
        );
      case "tableau": {
        // Un tableau de cinq colonnes ou plus (les prix) : sur téléphone, les colonnes du milieu (pages,
        // images) passent sous le nom du livre, pour laisser sa largeur à la première colonne
        const replie = (j: number) => b.entete.length >= 5 && j >= 1 && j <= b.entete.length - 3;
        return (
          <div key={i} className={b.entete.length > 2 ? `${styles.tableau} ${styles.colonnes}` : styles.tableau}>
            <table>
              <thead>
                <tr>
                  {b.entete.map((c, j) => (
                    <th key={c} scope="col" className={replie(j) ? styles.replie : undefined}>
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
                      {b.entete.some((_, j) => replie(j)) ? (
                        <span className={styles.repliees}>
                          {r
                            .map((c, j) => (replie(j) ? `${c} ${b.entete[j].toLowerCase()}` : null))
                            .filter(Boolean)
                            .join(" · ")}
                        </span>
                      ) : null}
                    </th>
                    {r.slice(1).map((c, j) => (
                      <td key={j} className={replie(j + 1) ? styles.replie : undefined}>
                        <EnLigne texte={c} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }
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
        const image = IMAGES_DES_ENCARTS[ancreDe(partie.numero)] ?? null;
        return (
          <aside key={i} className={`${styles.encart} ${image ? (image.portrait ? styles.encartPortrait : styles.encartPaysage) : ""}`} aria-label="L’outil Il était une classe">
            <span className={styles.encartSigne} aria-hidden="true">
              <Dragon dessin="petit" />
            </span>
            <p>
              <EnLigne texte={b.texte} />
            </p>
            {/* La fiche « Consigne » avant et après « Formuler » (partie 13), sur toute la largeur de l'encart */}
            {ancreDe(partie.numero) === "ia" ? (
              <div className={styles.encartLarge}>
                <ConsigneDansLApp />
              </div>
            ) : null}
            {image ? (
              <Image
                className={image.telephone ? `${styles.encartImage} ${styles.surOrdinateur}` : styles.encartImage}
                src={image.src}
                alt={image.alt}
                width={image.largeur}
                height={image.hauteur}
                sizes={image.portrait ? "260px" : "(max-width: 1040px) 100vw, 640px"}
              />
            ) : null}
            {/* Sur téléphone, la même capture cadrée plus serré, pour rester lisible */}
            {image?.telephone ? (
              <Image className={`${styles.encartImage} ${styles.surTelephone}`} src={image.telephone.src} alt={image.alt} width={image.telephone.largeur} height={image.telephone.hauteur} sizes="100vw" />
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
          {/* Du livre à la scène (partie 4), en deux captures de l'application sous son paragraphe */}
          {ancreDe(partie.numero) === "inventer" && b.sorte === "paragraphe" && b.tete?.startsWith("Découpez l’aventure") ? (
            <div className={`${styles.large} ${styles.suite}`}>
              {DECOUPAGE_EN_IMAGES.map((image) => (
                <Photo key={image.src} image={image} />
              ))}
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
 * Le guide « Comment écrire un livre dont vous êtes le héros en classe » (F14-AC52, AC53 ;
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
        {/* Visible dès l'ouverture, sans être l'élément du LCP (le titre) : chargé d'emblée, sans préchargement */}
        <Image className={styles.dragon} src="/accueil/dragon-grand-livre.webp" alt="" width={500} height={620} sizes="(max-width: 720px) 92px, 230px" loading="eager" />
      </header>
      <div className={styles.grille}>
        <nav className={styles.sommaire} aria-label="Sommaire" data-sommaire>
          <p className={styles.sommaireTitre}>Sommaire</p>
          <Sommaire />
        </nav>
        <article className={styles.article}>
          {/* La note de l'auteur, dans la forme de « Dans ma classe » : ce qui suit est un retour d'expérience */}
          <aside className={`${styles.classe} ${styles.avant}`} aria-label="Avant de commencer">
            <p className={styles.classeTitre}>Avant de commencer</p>
            <p>
              <EnLigne texte={T.avantDeCommencer} />
            </p>
          </aside>
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
                {/* Le numéro posé par la feuille de style : le texte de l'intertitre reste la seule question,
                    sans « 1Pourquoi… » pour un robot qui lit le HTML (audit du 7 novembre 2026) */}
                <span className={styles.numero} aria-hidden="true">
                  <span data-numero={p.numero} />
                </span>
                <span>{p.titre}</span>
              </h2>
              <Corps partie={p} />
            </section>
          ))}
          <section className={styles.lectures} aria-labelledby="plus-loin-t">
            <h2 id="plus-loin-t">Pour aller plus loin</h2>
            <ul>
              {T.lectures.map((l) => (
                <li key={l}>
                  <EnLigne texte={l} />
                </li>
              ))}
            </ul>
          </section>
          <footer className={styles.plusLoin}>
            <h2>Lire et essayer</h2>
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
