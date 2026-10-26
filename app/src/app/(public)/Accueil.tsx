import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { Icone } from "@/composants/Icone";
import { enEuros } from "@/domaine/offre";
import { EDITEUR } from "@/domaine/textes-publics";
import { livresDeLAccueil, type LivreDeLAccueil } from "@/serveur/accueil";
import { offreActuelle } from "@/serveur/offre";
import styles from "./accueil.module.css";
import { TempsQuiDefilent } from "./TempsQuiDefilent";
import { CapturesEnGrand } from "./CapturesEnGrand";
import { LivreChoisi } from "./LivreChoisi";
import { VisiteEnVideo } from "./VisiteEnVideo";
import { DonneesDeLAccueil } from "./DonneesDeLAccueil";
import type { Video } from "@/domaine/presentation";

const DESCRIPTION =
  "Chaque élève écrit ses scènes. À chaque étape, l’application guide et aide l’enseignant. Au bout, un vrai livre, à imprimer et à lire en ligne. Gratuit.";

// L'aperçu d'un lien partagé (courriel, messagerie, ENT) : l'image est opengraph-image.jpg, le premier écran
export const METADATA_ACCUEIL: Metadata = {
  title: { absolute: "Il était une classe — votre classe écrit son livre-jeu" },
  description: DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    siteName: "Il était une classe",
    url: "/",
    title: "Votre classe écrit son livre-jeu.",
    description: DESCRIPTION,
  },
  twitter: { card: "summary_large_image" },
};

/**
 * Ce qui attend le porteur : ses poses du dragon et de la souris (des découpes des planches de
 * référence en attendant), l'illustration de la première page, la photo des deux livres imprimés.
 * Sans fichier, rien ne s'affiche à leur place, sauf en développement, où un cadre en pointillé
 * dit ce qui manque.
 */
const PHOTO_DES_LIVRES: string | null = "/accueil/photo-des-livres.webp";
/** La visite en vidéo, MP4 hébergé avec l'application, et ses sous-titres (WebVTT) ; ses sources
 * et sa fabrication : video/visite (le skill « video-du-site ») */
const VIDEO_DE_LA_VISITE: string | null = "/accueil/visite-fr.mp4";
const SOUS_TITRES_DE_LA_VISITE: string | null = "/accueil/visite-fr.vtt";
/** Ce que les moteurs en lisent (F14-AC48) : son affiche, sa durée, le jour de sa mise en ligne */
const VIDEO_POUR_LES_MOTEURS: Video | null = VIDEO_DE_LA_VISITE
  ? { fichier: VIDEO_DE_LA_VISITE, sousTitres: SOUS_TITRES_DE_LA_VISITE, image: "/accueil/visite-fr.webp", duree: "PT1M33S", publieeLe: "2026-10-24" }
  : null;
const EN_DEVELOPPEMENT = process.env.NODE_ENV !== "production";

/**
 * L'accueil (F14-AC32, « Pages publiques », refait le 22 octobre 2026) : un livre-jeu. Chaque
 * section est un passage numéroté ; ses choix, de la forme des phrases de choix du livre, sont les
 * liens de la page. Le premier passage s'écrit sur un grand livre ouvert ; les autres sont des
 * feuillets du même papier, de même hauteur, à gauche, à droite ou au milieu, avec autour des
 * captures de l'outil et les personnages (design.md, « Accueil en livre-jeu »).
 *
 * Le même pour tous : il se compose sans lire la personne ni le poste, pour être gardé en cache
 * (`vitrine/page.tsx`) ; `page.tsx` renvoie d'abord l'adulte connecté et le poste d'une classe.
 */
export async function Accueil() {
  const [offre, livres] = await Promise.all([offreActuelle(), livresDeLAccueil()]);
  // Sans livre réglé, le passage 27 n'existe pas, et aucun choix n'y renvoie (en développement, son cadre dit ce qui manque)
  const avecLivres = livres.length > 0 || EN_DEVELOPPEMENT;
  // Deux livres du porteur, l'un bien plus court que l'autre (323 et 24 passages) : « le grand » et « le petit »,
  // que les nombres de passages sous les couvertures désignent
  const tailles = livres.map((l) => l.passages ?? 0);
  const grandEtPetit = livres.length === 2 && livres.every((l) => l.duPorteur) && Math.min(...tailles) > 0 && Math.max(...tailles) >= 3 * Math.min(...tailles);

  return (
    <main className={styles.accueil}>
      <DonneesDeLAccueil offre={offre} video={VIDEO_POUR_LES_MOTEURS} />
      {/* 1 — Le grand livre ouvert */}
      <section className={styles.scene} aria-labelledby="p1">
        <div className={styles.livre}>
          <figure className={styles.gauche}>
            <Image src="/accueil/classe-au-travail.webp" alt="" fill sizes="(max-width: 980px) 100vw, 380px" priority />
            {VIDEO_DE_LA_VISITE || EN_DEVELOPPEMENT ? <VisiteEnVideo video={VIDEO_DE_LA_VISITE} sousTitres={SOUS_TITRES_DE_LA_VISITE} /> : null}
          </figure>
          <div className={styles.droite}>
            <Numero n={1} />
            <h1 id="p1">Votre classe écrit son livre-jeu.</h1>
            <p className={styles.recit}>
              Chaque élève écrit ses scènes. À chaque étape, l’application vous guide et vous aide. Au bout, un vrai livre, à imprimer et à lire en ligne.
            </p>
            <Choix>
              <ChoixCompte phrase="Si vous voulez essayer avec votre classe," />
              <Renvoi vers={12}>Pour voir comment se passe un projet, rendez-vous au</Renvoi>
              {avecLivres ? (
                <Renvoi vers={27}>Pour lire un livre écrit par une classe, rendez-vous au</Renvoi>
              ) : (
                <Renvoi vers={33}>Pour savoir si cela marchera dans votre classe, rendez-vous au</Renvoi>
              )}
            </Choix>
            <p className={styles.garanties}>Gratuit, sans carte bancaire. Rien à installer.</p>
          </div>
        </div>
        <div className={styles.dragonLit} role="img" aria-label="Le dragon de la classe, assis à côté du livre" />
      </section>

      {/* 12 — Un projet, en trois temps : la feuille reste en place, les captures de chaque temps
          défilent à côté, et le temps qu'elles montrent s'allume sur la feuille */}
      <section className={`${styles.rangee} ${styles.aGauche} ${styles.defile}`} data-actif="1">
        <TempsQuiDefilent />
        <CapturesEnGrand />
        <Feuillet n={12} titre="Un projet, en trois temps.">
          <p className={`${styles.recit} ${styles.petit}`}>Quelques semaines ou quelques mois, selon l’histoire que vous voulez.</p>
          <ol className={styles.temps}>
            <li>
              <a href="#temps-1" className={styles.allerAuTemps} data-aller="1">
              <SigneTableau />
              <div>
                <b>On prépare ensemble.</b>{" "}
                <span>Projeté au tableau, étape par étape : le monde, les héros, l’enjeu. La classe propose, vous retenez.</span>
              </div>
              </a>
            </li>
            <li>
              <a href="#temps-2" className={styles.allerAuTemps} data-aller="2">
              <SigneFeuille />
              <div>
                <b>Chacun écrit ses scènes.</b>{" "}
                <span>D’abord sur le cahier, puis sur les ordinateurs de la classe. Vous relisez, faites retravailler si besoin, puis validez.</span>
              </div>
              </a>
            </li>
            <li>
              <a href="#temps-3" className={styles.allerAuTemps} data-aller="3">
              <SigneLivre />
              <div>
                <b>Le livre se fait.</b>{" "}
                <span>Relire, vérifier les chemins, mettre en page : trois étapes guidées, puis le PDF.</span>
              </div>
              </a>
            </li>
          </ol>
          <Choix>
            {avecLivres ? <Renvoi vers={27}>Si vous voulez voir le résultat, rendez-vous au</Renvoi> : null}
            <Renvoi vers={33}>Si vous vous demandez si cela marchera dans votre classe, rendez-vous au</Renvoi>
            {avecLivres ? null : <Renvoi vers={40}>Si vous vous demandez ce que cela coûte, rendez-vous au</Renvoi>}
          </Choix>
        </Feuillet>
        <div className={styles.defilement}>
          {CAPTURES_DES_TEMPS.map((c, i) => (
            "collage" in c ? (
              <figure key={i} className={classeDeCapture(i)} data-temps={c.temps}>
                <ChapitresEtScenes />
                <figcaption className={styles.note}>{c.note}</figcaption>
              </figure>
            ) : (
            <figure
              key={i}
              id={i === 0 || CAPTURES_DES_TEMPS[i - 1].temps !== c.temps ? `temps-${c.temps}` : undefined}
              className={classeDeCapture(i)}
              data-temps={c.temps}
            >
              {/* La capture d'un livre de l'accueil mène à sa lecture ; les autres s'ouvrent en grand (CapturesEnGrand) */}
              {"livre" in c && livres.some((l) => l.titre === c.livre) ? (
                <Link href={`/lire/bibliotheque/${livres.find((l) => l.titre === c.livre)?.adresse}`} className={styles.lireLeLivre} aria-label={`Lire « ${c.livre} » en ligne`}>
                  <span className={styles.tirage} style={{ aspectRatio: c.ratio }}>
                    <Image src={c.src} alt={c.alt} fill sizes="(max-width: 980px) 100vw, 680px" quality={90} />
                    <span className={styles.badgeLire}>Lire le livre →</span>
                  </span>
                </Link>
              ) : (
                <button type="button" className={styles.agrandir} data-agrandir={c.src} data-alt={c.alt} data-ratio={"ratio" in c ? c.ratio : undefined} aria-label={`Agrandir : ${c.alt}`}>
                  <span className={styles.tirage} style={"ratio" in c ? { aspectRatio: c.ratio } : undefined}>
                    <Image src={c.src} alt={c.alt} fill sizes="(max-width: 980px) 100vw, 680px" quality={90} />
                  </span>
                </button>
              )}
              <figcaption className={styles.note}>{c.note}</figcaption>
            </figure>
            )
          ))}
        </div>
      </section>

      {/* 27 — Deux livres à feuilleter ; à côté, la photo des livres imprimés */}
      {avecLivres ? (
      <section className={`${styles.rangee} ${styles.aDroite}`}>
        <Feuillet n={27} titre={grandEtPetit ? "Deux livres à feuilleter." : livres.length === 1 ? "Un livre écrit par une classe." : "Deux livres écrits par une classe."}>
          <p className={`${styles.recit} ${styles.petit}`}>
            {/* Les livres de l'accueil viennent de la bibliothèque (F15-AC19) : « mes élèves » pour ceux du porteur seulement.
                Un grand livre de sa classe et un petit (le 26 octobre 2026, « Bouquin mène l'enquête ») : le petit
                montre un livre court, sans dire qui l'a écrit */}
            {grandEtPetit
              ? "Le grand a été écrit par mes élèves, scène par scène, puis imprimé et lu par leurs familles. Le petit se lit en quelques minutes. Les deux sont à lire en ligne, gratuitement."
              : livres.every((l) => l.duPorteur)
              ? livres.length === 1
                ? "Écrit par mes élèves, scène par scène, puis imprimé et lu par leurs familles."
                : "Écrits par mes élèves, scène par scène, puis imprimés et lus par leurs familles."
              : livres.length === 1
                ? "Écrit par des élèves, scène par scène, et publié dans la bibliothèque du site."
                : "Écrits par des élèves, scène par scène, et publiés dans la bibliothèque du site."}
          </p>
          {livres.length > 0 || EN_DEVELOPPEMENT ? (
            <ul className={styles.livres}>
              {livres.map((l) => (
                <li key={l.adresse}>
                  <LivreFerme livre={l} />
                </li>
              ))}
              {EN_DEVELOPPEMENT && livres.length < 2 ? (
                <li>
                  <p className={`${styles.aVenir} ${styles.livreAVenir}`}>
                    {livres.length === 0 ? "Les deux livres" : "Le second livre"} : à choisir dans l’administration
                  </p>
                </li>
              ) : null}
            </ul>
          ) : null}
          <Choix>
            <Renvoi vers={33}>Si vous vous demandez si cela marchera dans votre classe, rendez-vous au</Renvoi>
            <Renvoi vers={40}>Si vous vous demandez ce que cela coûte, rendez-vous au</Renvoi>
          </Choix>
        </Feuillet>
        <div className={styles.cote}>
          {PHOTO_DES_LIVRES ? (
            <Tirage
              src={PHOTO_DES_LIVRES}
              alt="Les livres imprimés : « Électro Nick », relié, et « Le labyrinthe oublié », ouvert sur sa fiche aventure et son premier passage, avec un crayon et un dé"
              cadre="photo"
            />
          ) : EN_DEVELOPPEMENT ? (
            <div className={`${styles.tirage} ${styles.photo}`}>
              <p className={styles.aVenir}>La photo des deux livres imprimés</p>
            </div>
          ) : null}
          {PHOTO_DES_LIVRES || EN_DEVELOPPEMENT ? <Note>Les vrais livres, imprimés pour chaque élève.</Note> : null}
        </div>
      </section>
      ) : null}

      {/* 33 — Dans votre classe : ce que le passage 12 ne dit pas (fusionné avec l'ancien 19, « Tout est
          prévu », sur décision du porteur le 22 octobre 2026) */}
      <section className={`${styles.rangee} ${styles.aGauche}`}>
        <Feuillet n={33} titre="Dans votre classe.">
          <ul className={`${styles.liste} ${styles.aere}`}>
            {DANS_LA_CLASSE.map((ligne) => (
              <li key={ligne}>
                <SigneCoche />
                {ligne}
              </li>
            ))}
            {/* L'IA, une ligne à part, marquée de ses étincelles : facultative, et pour l'enseignant */}
            <li className={styles.ligneIa}>
              <Icone nom="ia" className={styles.coche} />
              Si vous le voulez, un coup de pouce de l’IA : idées, corrections, illustrations.
            </li>
          </ul>
          <Choix>
            <Renvoi vers={40}>Si vous vous demandez ce que cela coûte, rendez-vous au</Renvoi>
            <Renvoi vers={52}>Si vous voulez savoir d’où vient cet outil, rendez-vous au</Renvoi>
          </Choix>
        </Feuillet>
        <div className={styles.cote}>
          {/* Une pile bancale des écrans dont parle la page, la souris perchée au sommet */}
          <div className={styles.pile} role="img" aria-label="Une pile d’écrans de l’outil : les deux sortes de récit, les étiquettes des élèves, le code secret de l’un d’eux et ses encouragements">
            {PILE.map((m) => (
              <span key={m.src} className={`${styles.morceauPile} ${styles[m.classe]}`} style={{ aspectRatio: m.ratio }}>
                <Image src={m.src} alt="" fill sizes="520px" />
              </span>
            ))}
            <span className={styles.sourisPerchee} />
          </div>
        </div>
      </section>

      {/* 40 — Ce que cela coûte : le feuillet à gauche, la fiche aventure de l'enseignant à droite, qui
          porte les chiffres comme celle d'un livre-jeu ses ressources, et entre les deux la souris ;
          vente ouverte, deux choix, un livre jusqu'aux limites gratuites ou un grand livre, que le
          dragon vient tenir (décidé par le porteur le 23 octobre 2026) */}
      <section className={`${styles.rangee} ${styles.quarante}`} data-livre="petit">
        <Feuillet n={40} titre="Ce que cela coûte.">
          {offre.paiementOuvert ? (
            <LivreChoisi scenes={offre.scenesGratuites} images={offre.imagesGratuites} prix={enEuros(offre.prixDuPass)} />
          ) : (
            <>
              <p className={styles.reponse}>Gratuit.</p>
              <p className={`${styles.recit} ${styles.petit}`}>Tout l’outil, du premier projet au livre imprimé, sans carte bancaire.</p>
            </>
          )}
          {/* L'IA est l'aide de l'enseignant seul, jamais des élèves ; les illustrations, où les héros
              se retrouvent d'une image à l'autre d'après leur portrait, mises en avant (porteur, 23 octobre 2026) */}
          <h3 className={styles.intertitre}>
            <Icone nom="ia" className={styles.etoileTitre} />
            L’IA, pour vous seulement.
          </h3>
          <p className={`${styles.recit} ${styles.petit}`}>
            Jamais pour les élèves : ils écrivent eux-mêmes. Quand vous le voulez, elle corrige une scène, propose une idée de choix et{" "}
            <strong>illustre le livre, vos héros reconnaissables d’une image à l’autre</strong>. Chaque demande se paie en{" "}
            <span className={styles.insecable}>
              étoiles <Icone nom="ia" className={styles.etoileTexte} />,
            </span>{" "}
            et {offre.etoilesOffertes} vous sont offertes.
          </p>
          <Choix>
            <ChoixCompte phrase="Si vous voulez essayer," />
            <Renvoi vers={52}>Si vous voulez savoir d’où vient cet outil, rendez-vous au</Renvoi>
          </Choix>
        </Feuillet>
        {offre.paiementOuvert ? (
          // Vente ouverte : un clic sur l'animal passe à l'autre livre (le script l'active)
          <button type="button" className={`${styles.mascotte} ${styles.animal}`} data-basculer disabled aria-label="Changer de livre : un livre jusqu’à 40 scènes ou un grand livre">
            <span className={styles.souris40} />
            <span className={styles.bouffee} />
            <span className={styles.dragon40} />
          </button>
        ) : (
          <div className={styles.mascotte}>
            <span className={styles.souris40} role="img" aria-label="La souris, fière de son petit livre" />
          </div>
        )}
        <div className={styles.cote}>
          <FicheAventure offre={offre} />
        </div>
      </section>

      {/* 52 — D'où vient cet outil, et la fin : le récit du porteur, signé ; la souris et le dragon
          posés sur la ligne du pied de page, le sol de la table (décidé par le porteur le 23 octobre 2026) */}
      <section className={`${styles.rangee} ${styles.auMilieu} ${styles.finale}`}>
        <div className={`${styles.cote} ${styles.avant}`} />
        <Feuillet n={52} titre="D’où vient cet outil." dernier>
          <p className={styles.recit}>
            {/* Espaces insécables dans les guillemets et devant la ponctuation haute : rien ne part seul à la ligne */}
            Enfant, je dévorais les « livres dont vous êtes le héros ». Il y a sept ans, j’ai appris seul à programmer, avec une idée : que mes
            élèves écrivent le leur.
          </p>
          <p className={styles.recit}>
            Depuis quatre ans, ma classe écrit ses livres-jeux avec les versions successives de cet outil. Celle-ci est la plus aboutie.
          </p>
          <p className={`${styles.recit} ${styles.petit}`}>
            Une question, une idée ? Écrivez-moi : <a href={`mailto:${EDITEUR.contact}`}>{EDITEUR.contact}</a>
          </p>
          <p className={styles.signature}>Nicolas, professeur des écoles</p>
          <Choix>
            <ChoixCompte phrase="Si vous voulez commencer le vôtre," />
          </Choix>
          <p className={styles.fin}>FIN</p>
          <div className={styles.souris} role="img" aria-label="Une souris grignote le coin de la page" />
        </Feuillet>
        <div className={`${styles.cote} ${styles.enBas}`}>
          <div className={styles.dragonDort} role="img" aria-label="Le dragon s’est endormi sur son livre" />
        </div>
      </section>
    </main>
  );
}

/**
 * Les captures du passage 12, choisies par le porteur le 22 octobre 2026 (les originaux dans
 * V1/identite/accueil/captures/) ; deux par temps depuis la critique du 23 octobre 2026, chacune
 * lisible sans l'agrandir : les chemins, le Suivi et « Relire » sont retirés.
 */
const CAPTURES_DES_TEMPS = [
  { temps: "1", src: "/accueil/prep-heros.webp", ratio: "2000 / 1128", alt: "Le héros, Lou, et ce que la classe a retenu de lui, après le monde et avant l’enjeu", note: "La classe définit son histoire : le monde, le héros, l’enjeu." },
  { temps: "1", collage: true, src: "", alt: "", note: "Les chapitres et les scènes, prêts à écrire." },
  { temps: "2", src: "/accueil/ecrire-fiche.webp", ratio: "1454 / 1390", alt: "Une fiche de rédaction imprimée : la consigne de chaque scène", note: "Chacun écrit d’abord sur son cahier, d’après sa fiche." },
  { temps: "2", src: "/accueil/ecrire-correction.webp", ratio: "1684 / 1026", alt: "La scène recopiée par l’élève, avec la correction proposée par l’IA : chaque changement visible, que l’enseignant garde ou refuse", note: "Les élèves recopient leur scène sur l’ordinateur, puis vous corrigez." },
  { temps: "3", src: "/accueil/livre-pages-peu-remplies.webp", ratio: "1000 / 1145", alt: "La mise en page : une page peu remplie, signalée avec ce qu’on peut y faire", note: "L’outil signale ce qui cloche, jusqu’au PDF prêt à imprimer." },
  { temps: "3", src: "/accueil/lecture-electro-nick.webp", ratio: "1434 / 1290", livre: "Électro Nick", alt: "« Électro Nick », lu en ligne : un passage, son illustration et ses trois choix", note: "Et un lien pour le lire en ligne, en famille." },
] as const;

/** La pile du passage 33, de bas en haut : chaque écran montre une ligne de la page */
const PILE = [
  { src: "/accueil/classe-recits.webp", ratio: "1414 / 472", classe: "pile1" },
  { src: "/accueil/classe-etiquettes-2.webp", ratio: "1330 / 326", classe: "pile2" },
  { src: "/accueil/classe-code.webp", ratio: "552 / 474", classe: "pile3" },
  { src: "/accueil/classe-encouragements.webp", ratio: "772 / 270", classe: "pile4" },
] as const;

const DANS_LA_CLASSE = [
  "Pour les jeunes auteurs, dès 6 ans : l’âge se règle pour chaque livre.",
  "Rien à installer, et quelques postes suffisent.",
  "Chaque élève reçoit ses identifiants et se connecte seul, sans adresse.",
  "Des fiches de rédaction nominatives, pour écrire à l’école ou à la maison.",
  "Des tampons pour encourager.",
  "Une histoire à choix, ou un récit classique.",
  "Une aide à chaque étape.",
] as const;

// ——— Les pièces du livre ———

function Numero({ n }: { n: number }) {
  return (
    <p className={styles.numero}>
      {n}
    </p>
  );
}

/** Un passage sur un feuillet détaché : même papier, même hauteur partout. */
function Feuillet({ n, titre, dernier = false, children }: { n: number; titre: string; dernier?: boolean; children: ReactNode }) {
  return (
    <article id={`p${n}`} className={`${styles.feuillet} ${dernier ? styles.dernier : ""}`} aria-labelledby={`t${n}`}>
      <Numero n={n} />
      <h2 id={`t${n}`}>{titre}</h2>
      {children}
    </article>
  );
}

/** Les phrases de choix du passage, entre deux filets, comme dans le livre. */
function Choix({ children }: { children: ReactNode }) {
  return <ul className={styles.choix}>{children}</ul>;
}

function Renvoi({ vers, children }: { vers: number; children: ReactNode }) {
  return (
    <li>
      <a href={`#p${vers}`}>
        {/* « rendez‑vous » ne se coupe pas en fin de ligne : trait d'union insécable */}
        <span className={styles.phrase}>{typeof children === "string" ? children.replace("rendez-vous", "rendez\u2011vous") : children}</span>{" "}
        <span className={styles.renvoi}>{vers}</span>
      </a>
    </li>
  );
}

/** Le choix qui mène hors du livre : « Créez un compte », le seul bouton plein de la page,
 * à l'impératif : il achève la phrase du choix, comme « rendez-vous au ». */
function ChoixCompte({ phrase }: { phrase: string }) {
  return (
    <li className={styles.principal}>
      <span className={styles.phrase}>{phrase}</span>
      <Link href="/entree/inscription" className="btn btn--primaire btn--grand">
        Créez un compte
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      </Link>
    </li>
  );
}

/**
 * Un livre de la classe, fermé, posé sur le feuillet : la face avant du livre imprimé, déposée dans
 * l'administration ; sinon sa page de titre, ce que le lecteur en ligne ouvre (le titre, le
 * sous-titre, l'illustration entière), ou l'image d'une page de titre faite à la main. Dessous, ce
 * qu'il contient et « Feuilleter ».
 */
function LivreFerme({ livre }: { livre: LivreDeLAccueil }) {
  const nom = `Feuilleter « ${livre.titre} »${livre.passages ? `, ${livre.passages} passages` : ""}`;
  return (
    <Link href={`/lire/bibliotheque/${livre.adresse}`} className={styles.livreFerme} aria-label={nom}>
      <span className={styles.volume}>
        {livre.couverture ? (
          // La face avant du livre imprimé, déposée dans l'administration (F14-AC40)
          // eslint-disable-next-line @next/next/no-img-element
          <img className={styles.pleinePage} src={livre.couverture} alt="" loading="lazy" />
        ) : livre.pleinePage && livre.image ? (
          // L'image passe par le lien de lecture, qui la sert sans compte : pas d'optimisation de Next
          // eslint-disable-next-line @next/next/no-img-element
          <img className={styles.pleinePage} src={livre.image} alt="" loading="lazy" />
        ) : (
          <span className={styles.pageDeTitre}>
            <span className={styles.titreLivre}>{livre.titre}</span>
            {livre.sousTitre ? <span className={styles.sousTitreLivre}>{livre.sousTitre}</span> : null}
            {livre.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img className={styles.illustration} src={livre.image} alt="" loading="lazy" style={{ aspectRatio: livre.ratio }} />
            ) : null}
          </span>
        )}
      </span>
      {livre.passages ? <span className={styles.contenu}>{livre.passages} passages</span> : null}
      <span className={styles.feuilleter}>
        Feuilleter
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      </span>
    </Link>
  );
}

/**
 * La fiche aventure de l'enseignant, à côté du passage 40 : ses ressources, remplies au crayon de
 * papier, comme la fiche d'un livre-jeu. Les chiffres viennent des réglages de l'offre (F14-AC21).
 */
function FicheAventure({ offre }: { offre: Awaited<ReturnType<typeof offreActuelle>> }) {
  const ouvert = offre.paiementOuvert;
  return (
    <div className={styles.fiche} role="group" aria-labelledby="fiche-t" aria-live="polite">
      <p id="fiche-t" className={styles.ficheTitre}>
        Fiche aventure
      </p>
      <p className={styles.aventurier}>
        Aventurier : <span className={styles.crayon}>vous</span>
      </p>
      <div className={styles.cases}>
        <CaseDeFiche
          nom={
            <>
              <PictoBourse /> Bourse
            </>
          }
          petit="0 €" grand={ouvert ? { valeur: enEuros(offre.prixDuPass), note: "par livre" } : null} />
        <CaseDeFiche
          nom={
            <>
              <Icone nom="ia" className={styles.etoile} /> Étoiles
            </>
          }
          petit={String(offre.etoilesOffertes)}
          notePetit="offertes"
          grand={ouvert ? { valeur: String(offre.etoilesOffertes + offre.etoilesDuPass), note: `dont ${offre.etoilesDuPass} du pass` } : null}
        />
        {ouvert ? (
          <>
            <CaseDeFiche
              nom={
                <>
                  <PictoScenes /> Scènes
                </>
              }
              petit={String(offre.scenesGratuites)} notePetit="au plus" grand={{ valeur: "illimitées", note: "" }} />
            <CaseDeFiche
              nom={
                <>
                  <PictoImages /> Images
                </>
              }
              petit={String(offre.imagesGratuites)} notePetit="au plus" grand={{ valeur: "illimitées", note: "" }} />
          </>
        ) : null}
      </div>
      <p className={styles.rubrique}>
        <PictoSac /> Inventaire
      </p>
      <ul className={styles.inventaire}>
        {INVENTAIRE.map((chose) => (
          <li key={chose}>
            <CaseCochee />
            {chose}
          </li>
        ))}
      </ul>
      {ouvert ? (
        <p className={styles.recharge}>
          Plus d’étoiles : {enEuros(offre.prixDeLaRecharge)} les {offre.etoilesDeLaRecharge}.
        </p>
      ) : null}
      {/* Sur la table, contre la fiche : le dé, et le crayon qui l'a remplie */}
      <span className={styles.de} aria-hidden="true" />
      <span className={styles.crayonPose} aria-hidden="true" />
    </div>
  );
}

/**
 * Une case de la fiche, remplie au crayon : la valeur d'un livre jusqu'aux limites gratuites et,
 * vente ouverte, celle d'un grand livre ; la feuille de style montre celle du livre choisi.
 */
function CaseDeFiche({ nom, petit, notePetit, grand }: { nom: ReactNode; petit: string; notePetit?: string; grand: { valeur: string; note: string } | null }) {
  const mot = (v: string) => (/^[\d\s€ ]+$/.test(v) ? styles.crayon : `${styles.crayon} ${styles.mot}`);
  return (
    <p className={styles.caseFiche}>
      <span>{nom}</span>
      <span className={styles.boite}>
        <span className={`${mot(petit)} ${grand ? styles.pourPetit : ""}`}>{petit}</span>
        {grand ? <span className={`${mot(grand.valeur)} ${styles.pourGrand}`}>{grand.valeur}</span> : null}
      </span>
      {/* Les notes des deux livres, l'une sur l'autre : la case garde sa taille quand le livre change */}
      {notePetit || grand?.note ? (
        <span className={styles.notesCase}>
          {notePetit ? <small className={grand ? styles.pourPetit : undefined}>{notePetit}</small> : null}
          {grand?.note ? <small className={styles.pourGrand}>{grand.note}</small> : null}
        </span>
      ) : null}
    </p>
  );
}

// ——— Les pictogrammes de la fiche, au trait graphite, comme sur une fiche de livre-jeu imprimée ———

function Picto({ children }: { children: ReactNode }) {
  return (
    <svg className={styles.picto} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  );
}
/** Une bourse nouée, une pièce devant */
function PictoBourse() {
  return (
    <Picto>
      <path d="M9 7.5 7.4 4.2c1.6.6 3 .8 4.6.8s3-.2 4.6-.8L15 7.5" />
      <path d="M9 7.5c-3.2 2.2-5 5.4-4.6 8.6.4 3 3.4 4.4 7.6 4.4s7.2-1.4 7.6-4.4c.4-3.2-1.4-6.4-4.6-8.6z" />
      <path d="M8.6 7.6h6.8" />
      <circle cx="12" cy="14.2" r="2.6" />
    </Picto>
  );
}
/** Un livre ouvert */
function PictoScenes() {
  return (
    <Picto>
      <path d="M12 6.5C10 5 6.8 4.6 3.5 5v13c3.3-.4 6.5 0 8.5 1.5 2-1.5 5.2-1.9 8.5-1.5V5c-3.3-.4-6.5 0-8.5 1.5z" />
      <path d="M12 6.5v13" />
    </Picto>
  );
}
/** Un cadre, une montagne et un soleil */
function PictoImages() {
  return (
    <Picto>
      <rect x="3.5" y="5" width="17" height="14" rx="1.5" />
      <path d="M4 17l5-5.5 3.5 3.8 2.5-2.6L20 17" />
      <circle cx="15.5" cy="9" r="1.6" />
    </Picto>
  );
}
/** Un sac d'aventurier */
function PictoSac() {
  return (
    <Picto>
      <path d="M9 6.5V5a3 3 0 0 1 6 0v1.5" />
      <path d="M6.5 9.5a3 3 0 0 1 3-3h5a3 3 0 0 1 3 3V19a1.5 1.5 0 0 1-1.5 1.5h-8A1.5 1.5 0 0 1 6.5 19z" />
      <path d="M9.5 13h5v3.5h-5z" />
    </Picto>
  );
}

const INVENTAIRE = ["Vos classes et vos élèves", "Vos projets", "Les fiches de rédaction", "Le livre en PDF, à imprimer", "La lecture en ligne"] as const;

/** Une case de la fiche, cochée au crayon */
function CaseCochee() {
  return (
    <svg className={styles.caseCochee} viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2.5" y="3.5" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="1.6" />
      <path className={styles.trait} d="M6.5 12.5l4 4.5L21 3" strokeWidth="2.4" />
    </svg>
  );
}

/** Une capture de l'outil, imprimée et scotchée sur la table ; `cadre` choisit son recadrage et sa pente. */
function Tirage({ src, alt, cadre }: { src: string; alt: string; cadre: string }) {
  return (
    <figure className={`${styles.tirage} ${styles[cadre] ?? ""}`}>
      <Image src={src} alt={alt} fill sizes="(max-width: 980px) 100vw, 560px" />
    </figure>
  );
}

/** La première capture d'un temps porte son ancre et s'espace des précédentes ; sur téléphone, elle seule paraît */
function classeDeCapture(i: number): string {
  const debut = i === 0 || CAPTURES_DES_TEMPS[i - 1].temps !== CAPTURES_DES_TEMPS[i].temps;
  return debut ? `${styles.capture} ${styles.debutDeTemps}` : styles.capture;
}

/** Deux chapitres et deux scènes, découpés dans l'écran et scotchés sur la table */
function ChapitresEtScenes() {
  return (
    <span className={styles.collage} role="img" aria-label="Deux cartes de chapitre, « La lisière » et « Le gué des saules », et deux cartes de scène">
      <span className={`${styles.morceau} ${styles.chapitre1}`}>
        <Image src="/accueil/prep-chapitre-1.webp" alt="" fill sizes="200px" />
      </span>
      <span className={`${styles.morceau} ${styles.chapitre2}`}>
        <Image src="/accueil/prep-chapitre-2.webp" alt="" fill sizes="200px" />
      </span>
      <span className={`${styles.morceau} ${styles.scene1}`}>
        <Image src="/accueil/prep-scene-1.webp" alt="" fill sizes="340px" />
      </span>
      <span className={`${styles.morceau} ${styles.scene2}`}>
        <Image src="/accueil/prep-scene-2.webp" alt="" fill sizes="340px" />
      </span>
    </span>
  );
}

/** Une note à la main, dans la cursive de l'accueil, avec sa flèche s'il le faut. */
function Note({ fleche = false, children }: { fleche?: boolean; children: ReactNode }) {
  return (
    <p className={styles.note}>
      {fleche ? (
        <svg viewBox="0 0 46 34" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
          <path d="M4 30C14 26 26 18 38 6" />
          <path d="M30 6h8v8" />
        </svg>
      ) : null}
      {children}
    </p>
  );
}

// ——— Les signes, au trait, en canard ———

function SigneTableau() {
  return (
    <svg className={styles.signe} viewBox="0 0 52 52" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="7" y="9" width="38" height="25" rx="2" />
      <path d="M26 34v7M18 43h16M14 18h12M14 24h18" />
      <circle cx="37" cy="19" r="3" />
    </svg>
  );
}
function SigneFeuille() {
  return (
    <svg className={styles.signe} viewBox="0 0 52 52" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 8h22l8 8v28H12z" />
      <path d="M34 8v8h8M18 24h18M18 30h18M18 36h11" />
    </svg>
  );
}
function SigneLivre() {
  return (
    <svg className={styles.signe} viewBox="0 0 52 52" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M26 14c-5-4-12-5-18-4v30c6-1 13 0 18 4 5-4 12-5 18-4V10c-6-1-13 0-18 4z" />
      <path d="M26 14v30" />
    </svg>
  );
}
function SigneCoche() {
  return (
    <svg className={styles.coche} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 10.5l4 4 8-9" />
    </svg>
  );
}
