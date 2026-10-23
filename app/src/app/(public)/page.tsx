import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { Icone } from "@/composants/Icone";
import { enEuros } from "@/domaine/offre";
import { livresDeLAccueil } from "@/serveur/accueil";
import { enseignantCourant } from "@/serveur/adulte";
import { projetDe } from "@/serveur/lectures";
import { offreActuelle } from "@/serveur/offre";
import { etatDuPoste } from "@/serveur/poste";
import styles from "./accueil.module.css";
import { TempsQuiDefilent } from "./TempsQuiDefilent";
import { VisiteEnVideo } from "./VisiteEnVideo";

export const metadata: Metadata = {
  title: { absolute: "Il était une classe — votre classe écrit son livre-jeu" },
  description:
    "Chaque élève écrit ses scènes, l'application guide l'enseignant à chaque étape, et l'histoire devient un vrai livre, à imprimer et à lire en ligne. Gratuit.",
};

/**
 * Ce qui attend le porteur : ses poses du dragon et de la souris (des découpes des planches de
 * référence en attendant), l'illustration de la première page, la photo des deux livres imprimés,
 * la visite en vidéo (un bouton sur l'illustration, quand
 * elle existera, design.md). Sans fichier, rien ne s'affiche à leur place, sauf en développement, où un
 * cadre en pointillé dit ce qui manque.
 */
const PHOTO_DES_LIVRES: string | null = null;
/** La visite en vidéo, MP4 hébergé avec l'application, et ses sous-titres (WebVTT) */
const VIDEO_DE_LA_VISITE: string | null = null;
const SOUS_TITRES_DE_LA_VISITE: string | null = null;
const EN_DEVELOPPEMENT = process.env.NODE_ENV !== "production";

/**
 * L'accueil (F14-AC32, « Pages publiques », refait le 22 octobre 2026) : un livre-jeu. Chaque
 * section est un passage numéroté ; ses choix, de la forme des phrases de choix du livre, sont les
 * liens de la page. Le premier passage s'écrit sur un grand livre ouvert ; les autres sont des
 * feuillets du même papier, de même hauteur, à gauche, à droite ou au milieu, avec autour des
 * captures de l'outil et les personnages (design.md, « Accueil en livre-jeu »).
 *
 * Connecté, l'adulte retrouve son dernier projet, et le poste d'une classe ouverte retourne à
 * l'espace des élèves (F06-AC53).
 */
export default async function Accueil() {
  const enseignant = await enseignantCourant();
  if (enseignant) {
    const projet = enseignant.dernierProjetId ? await projetDe(enseignant, enseignant.dernierProjetId) : null;
    redirect(projet ? `/projet/${projet.id}/${projet.dernierOnglet}` : "/projets");
  }
  const poste = await etatDuPoste();
  if (poste) redirect(poste.inscriptionId ? "/travail" : "/classe/qui");

  const [offre, livres] = await Promise.all([offreActuelle(), livresDeLAccueil()]);
  // Sans livre réglé, le passage 27 n'existe pas, et aucun choix n'y renvoie (en développement, son cadre dit ce qui manque)
  const avecLivres = livres.length > 0 || EN_DEVELOPPEMENT;

  return (
    <main className={styles.accueil}>
      {/* 1 — Le grand livre ouvert */}
      <section className={styles.scene} aria-labelledby="p1">
        <div className={styles.livre}>
          <figure className={styles.gauche}>
            <Image src="/accueil/classe-au-travail.webp" alt="" fill sizes="(max-width: 980px) 1px, 380px" priority />
            {VIDEO_DE_LA_VISITE || EN_DEVELOPPEMENT ? <VisiteEnVideo video={VIDEO_DE_LA_VISITE} sousTitres={SOUS_TITRES_DE_LA_VISITE} /> : null}
          </figure>
          <div className={styles.droite}>
            <Numero n={1} />
            <h1 id="p1">Votre classe écrit son livre-jeu.</h1>
            <p className={styles.recit}>
              Chaque élève écrit ses scènes, l’application vous guide à chaque étape, et l’histoire devient un vrai livre, à imprimer et à lire en ligne.
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
        <Feuillet n={12} titre="Un projet, en trois temps.">
          <p className={`${styles.recit} ${styles.petit}`}>Quelques semaines ou quelques mois, selon l’histoire que vous voulez.</p>
          <ol className={styles.temps}>
            <li>
              <a href="#temps-1" className={styles.allerAuTemps} data-aller="1">
              <SigneTableau />
              <div>
                <b>On prépare ensemble.</b>
                <span>Projeté au tableau, étape par étape : le monde, les héros, l’enjeu. La classe propose, vous retenez.</span>
              </div>
              </a>
            </li>
            <li>
              <a href="#temps-2" className={styles.allerAuTemps} data-aller="2">
              <SigneFeuille />
              <div>
                <b>Chacun écrit ses scènes.</b>
                <span>D’abord sur le cahier, puis sur les ordinateurs de la classe. Vous relisez, faites retravailler si besoin, puis validez.</span>
              </div>
              </a>
            </li>
            <li>
              <a href="#temps-3" className={styles.allerAuTemps} data-aller="3">
              <SigneLivre />
              <div>
                <b>Le livre se fait.</b>
                <span>Relire, vérifier les chemins, mettre en page : trois étapes guidées, puis le PDF.</span>
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
              <span className={styles.tirage} style={"ratio" in c ? { aspectRatio: c.ratio } : undefined}>
                <Image src={c.src} alt={c.alt} fill sizes="(max-width: 980px) 100vw, 600px" />
              </span>
              <figcaption className={styles.note}>{c.note}</figcaption>
            </figure>
            )
          ))}
        </div>
      </section>

      {/* 27 — Deux livres de la classe ; à côté, la photo des livres imprimés */}
      {avecLivres ? (
      <section className={`${styles.rangee} ${styles.aDroite}`}>
        <Feuillet n={27} titre={livres.length === 1 ? "Un livre écrit par une classe." : "Deux livres écrits par une classe."}>
          <p className={`${styles.recit} ${styles.petit}`}>Écrits par mes élèves, scène par scène, puis imprimés et lus par leurs familles.</p>
          {livres.length > 0 ? (
            <ul className={styles.livres}>
              {livres.map((l) => (
                <li key={l.code}>
                  <Link href={`/lire/${l.code}`} className={styles.couverture}>
                    <span className={styles.objet}>
                      {l.image ? (
                        // L'image passe par le lien de lecture, qui la sert sans compte : pas d'optimisation de Next
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={l.image} alt="" loading="lazy" />
                      ) : (
                        <span className={styles.sansImage} />
                      )}
                      <span className={styles.titreLivre}>
                        {l.titre}
                        {l.ligne ? <small>{l.ligne}</small> : null}
                      </span>
                    </span>
                    <span className={styles.feuilleter}>Feuilleter</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : EN_DEVELOPPEMENT ? (
            <p className={styles.aVenir}>Les deux livres : leurs codes de lecture dans LIVRES_DE_L_ACCUEIL</p>
          ) : null}
          <Choix>
            <Renvoi vers={33}>Si vous vous demandez si cela marchera dans votre classe, rendez-vous au</Renvoi>
            <Renvoi vers={40}>Si vous vous demandez ce que cela coûte, rendez-vous au</Renvoi>
          </Choix>
        </Feuillet>
        <div className={styles.cote}>
          {PHOTO_DES_LIVRES ? (
            <Tirage src={PHOTO_DES_LIVRES} alt="Les deux livres imprimés de la classe" cadre="photo" />
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
              Si vous le voulez, un coup de pouce de l’IA : idées, corrections, illustrations.
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

      {/* 40 — L'IA, et ce que cela coûte */}
      <section className={`${styles.rangee} ${styles.aDroite}`}>
        <Feuillet n={40} titre="L’IA, si vous voulez. Et ce que cela coûte.">
          <p className={`${styles.recit} ${styles.petit}`}>
            Elle vous aide, vous, quand vous le demandez : corriger une scène, trouver une idée de choix, illustrer. Les élèves écrivent eux-mêmes.
          </p>
          <ul className={styles.offre}>
            <li>
              <span className={styles.quoi}>
                Tout le reste
                <small>Classes, élèves, projets, livre, PDF, lecture en ligne.</small>
              </span>
              <span className={`${styles.prix} ${styles.gratuit}`}>Gratuit</span>
            </li>
            <li>
              <span className={styles.quoi}>
                Les aides de l’IA
                <small>
                  Facultatives : de quoi faire une vingtaine de corrections ou une dizaine d’images
                  {offre.paiementOuvert ? `, puis ${enEuros(offre.prixDeLaRecharge)} les ${offre.etoilesDeLaRecharge} étoiles.` : "."}
                </small>
              </span>
              <span className={styles.prix}>{offre.etoilesOffertes} ✦ offertes</span>
            </li>
            {offre.paiementOuvert ? (
              <li>
                <span className={styles.quoi}>
                  Le pass du livre
                  <small>
                    Une fois, pour un livre : au-delà de {offre.scenesGratuites} scènes et {offre.imagesGratuites} images, et {offre.etoilesDuPass} étoiles.
                  </small>
                </span>
                <span className={styles.prix}>{enEuros(offre.prixDuPass)}</span>
              </li>
            ) : null}
          </ul>
          <Choix>
            <ChoixCompte phrase="Si vous voulez essayer," />
            <Renvoi vers={52}>Si vous voulez savoir d’où vient cet outil, rendez-vous au</Renvoi>
          </Choix>
        </Feuillet>
        <div className={styles.cote}>
          <Tirage src="/accueil/detail-scene.webp" alt="Dans la scène, « Corriger » et « Idées de choix », au-dessus du texte" cadre="aides" />
          <Note>« Corriger » et « Idées de choix », au-dessus du texte.</Note>
        </div>
      </section>

      {/* 52 — Né dans une classe, et la fin */}
      <section className={`${styles.rangee} ${styles.auMilieu}`}>
        <div className={`${styles.cote} ${styles.avant}`} />
        <Feuillet n={52} titre="Né dans une classe." dernier>
          <p className={styles.recit}>
            Depuis quatre ans, j’écris des livres-jeux avec mes élèves. J’ai construit l’outil que j’aurais voulu avoir : pour que toute la classe écrive, et que
            chacun tienne le livre à la fin.
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
 * Les captures du passage 12, quatre par temps, choisies par le porteur le 22 octobre 2026 (les
 * originaux dans V1/identite/accueil/captures/).
 */
const CAPTURES_DES_TEMPS = [
  { temps: "1", src: "/accueil/prep-heros.webp", ratio: "2000 / 1128", alt: "Le héros, Lou, et ce que la classe a retenu de lui, après le monde et avant l’enjeu", note: "La classe définit son histoire : le monde, le héros, l’enjeu." },
  { temps: "1", collage: true, src: "", alt: "", note: "Les chapitres et les scènes, prêts à écrire." },
  { temps: "1", src: "/accueil/prep-chemins.webp", ratio: "2000 / 1197", alt: "Les chemins d’un chapitre : chaque choix mène à une scène", note: "Et les chemins entre les scènes, d’un coup d’œil." },
  { temps: "2", src: "/accueil/ecrire-fiche.webp", ratio: "1454 / 1390", alt: "Une fiche de rédaction imprimée : la consigne de chaque scène", note: "Chacun écrit d’abord sur son cahier, d’après sa fiche." },
  { temps: "2", src: "/accueil/ecrire-correction.webp", ratio: "1684 / 1026", alt: "La scène recopiée par l’élève, avec la correction proposée par l’IA : chaque changement visible, que l’enseignant garde ou refuse", note: "Il recopie sa scène sur l’ordinateur, puis vous corrigez." },
  { temps: "2", src: "/accueil/ecrire-suivi.webp", ratio: "2000 / 1012", alt: "Le Suivi des élèves : qui s’occupe de quoi, ce qui reste à régler", note: "Vous voyez où en est chacun." },
  { temps: "3", src: "/accueil/livre-relire.webp", ratio: "2000 / 1206", alt: "Relire : le livre mis en page, et la liste de ce qu’il reste à vérifier", note: "Vous relisez le livre tel qu’il sera imprimé." },
  { temps: "3", src: "/accueil/livre-mise-en-page.webp", ratio: "2000 / 1196", alt: "La mise en page : une page peu remplie, signalée avec sa solution", note: "L’outil signale ce qui cloche, jusqu’au PDF prêt à imprimer." },
  { temps: "3", src: "/accueil/livre-en-ligne.webp", ratio: "1694 / 1542", alt: "« Électro Nick », lu en ligne : la page de titre et « Commencer la lecture »", note: "Et un lien pour le lire en ligne, en famille." },
] as const;

/** La pile du passage 33, de bas en haut : chaque écran montre une ligne de la page */
const PILE = [
  { src: "/accueil/classe-recits.webp", ratio: "1414 / 472", classe: "pile1" },
  { src: "/accueil/classe-etiquettes-2.webp", ratio: "1330 / 326", classe: "pile2" },
  { src: "/accueil/classe-code.webp", ratio: "552 / 474", classe: "pile3" },
  { src: "/accueil/classe-encouragements.webp", ratio: "772 / 270", classe: "pile4" },
] as const;

const DANS_LA_CLASSE = [
  "Pour les jeunes auteurs, dès 6 ans : l’âge se règle pour chaque livre.",
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
        <span className={styles.phrase}>{typeof children === "string" ? children.replace("rendez-vous", "rendez\u2011vous") : children}</span>
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
    <span className={styles.collage} role="img" aria-label="Deux cartes de chapitre, « La lisière » et « Le gué des saules », et deux cartes de scène">
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
