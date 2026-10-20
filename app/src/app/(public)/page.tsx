import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { enEuros } from "@/domaine/offre";
import { enseignantCourant } from "@/serveur/adulte";
import { projetDe } from "@/serveur/lectures";
import { offreActuelle } from "@/serveur/offre";
import { etatDuPoste } from "@/serveur/poste";
import styles from "./public.module.css";

export const metadata: Metadata = {
  title: { absolute: "Il était une classe — écrire un livre avec sa classe" },
  description: "Un outil gratuit pour écrire un vrai livre avec sa classe, de la première idée au livre imprimé et partagé avec les familles.",
};

/** Les cinq temps du livre, du carnet à l'imprimeur. */
const TEMPS = [
  { titre: "Préparer ensemble", texte: "L’univers, le héros, les grandes étapes : la classe en discute, projetée au tableau, et vous gardez ce qu’elle retient." },
  { titre: "Écrire chacun sa scène", texte: "Chaque élève écrit ses scènes sur l’ordinateur de la classe, avec la consigne que vous lui avez donnée." },
  { titre: "Relire et valider", texte: "Vous relisez, demandez une reprise ou validez, et voyez d’un coup d’œil où en est chacun." },
  { titre: "Composer le livre", texte: "Les pages se composent toutes seules ; vous réglez ce qui doit l’être, en voyant le livre tel qu’il sera." },
  { titre: "Imprimer et partager", texte: "Un PDF prêt pour l’imprimeur, et un lien pour que les familles le lisent sur un téléphone." },
] as const;

/**
 * L'accueil (F14-AC32). Connecté, l'adulte retrouve son dernier projet, et le poste d'une classe
 * ouverte retourne à l'espace des élèves (F06-AC53) ; sinon, la page qui dit ce qu'est l'outil et
 * mène aux entrées. La promesse se montre plutôt qu'elle ne se dit : une double page de livre.
 */
export default async function Accueil() {
  const enseignant = await enseignantCourant();
  if (enseignant) {
    const projet = enseignant.dernierProjetId ? await projetDe(enseignant, enseignant.dernierProjetId) : null;
    redirect(projet ? `/projet/${projet.id}/${projet.dernierOnglet}` : "/projets");
  }
  const poste = await etatDuPoste();
  if (poste) redirect(poste.inscriptionId ? "/travail" : "/classe/qui");

  const offre = await offreActuelle();
  // Le livre à feuilleter : celui de la classe du porteur, autorisations signées, ou un livre d'essai
  const feuilleter = process.env.LIVRE_DE_L_ACCUEIL?.trim() || null;

  return (
    <main>
      <section className={styles.une} aria-labelledby="une-t">
        <div className={styles.uneTexte}>
          <h1 id="une-t" className={styles.titre}>
            Il était une classe
          </h1>
          <p className={styles.promesse}>Écrire un vrai livre avec sa classe, de la première idée au livre imprimé.</p>
          <p className={styles.sous}>
            Les élèves écrivent chacun leurs scènes, vous gardez la main sur tout, et le livre se compose de lui-même, prêt pour l’imprimeur et pour les familles.
          </p>
          <p className={styles.commandes}>
            <Link href="/entree/inscription" className="btn btn--primaire btn--grand">
              Créer un compte
            </Link>
            <Link href="/entree" className="btn btn--grand">
              Entrée enseignant
            </Link>
          </p>
          <p className={styles.gratuit1}>Gratuit · sans carte bancaire · aucun compte pour les élèves</p>
          <p className={styles.eleves}>
            Élève ? <Link href="/classe">Entre dans ta classe</Link>
          </p>
        </div>

        {/* La double page : un passage d'un livre à choix, tel que le livre l'imprime */}
        <figure className={styles.livre}>
          <div className={styles.pageGauche}>
            <Image src="/illustrations/defaut-port.jpg" alt="Un port au petit matin, un bac amarré au ponton" fill sizes="(max-width: 900px) 45vw, 300px" priority />
          </div>
          <div className={`${styles.pageDroite} recit`}>
            <p className={styles.numero}>12</p>
            <p>
              La brume monte du lac. Au bout du ponton, la lanterne du passeur tremble, mais personne ne tient la barre. Lou serre la corde dans sa main : le bac
              est prêt à partir.
            </p>
            <p className={styles.choix}>Si tu montes à bord et largues les amarres, rendez-vous au 27.</p>
            <p className={styles.choix}>Si tu préfères attendre le passeur sur le quai, rendez-vous au 8.</p>
            <p className={styles.folio}>— 12 —</p>
          </div>
          <figcaption className={styles.legende}>
            Une page d’un livre d’essai, écrit avec l’outil.
            {feuilleter ? (
              <>
                {" "}
                <Link href={`/lire/${feuilleter}`}>Feuilleter le livre</Link>
              </>
            ) : null}
          </figcaption>
        </figure>
      </section>

      <section className={styles.bande} aria-labelledby="chemin-t">
        <h2 id="chemin-t">Du carnet au livre imprimé</h2>
        <ol className={styles.temps}>
          {TEMPS.map((t, i) => (
            <li key={t.titre}>
              <span className={styles.rang} aria-hidden="true">
                {i + 1}
              </span>
              <h3>{t.titre}</h3>
              <p>{t.texte}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className={styles.bande} aria-labelledby="recits-t">
        <h2 id="recits-t">Deux sortes de livres</h2>
        <div className={styles.recits}>
          <article>
            <h3>Un livre dont le lecteur est le héros</h3>
            <p>Le lecteur choisit sa route d’un passage à l’autre ; l’outil numérote les passages, relie les choix et vérifie qu’aucun chemin ne mène nulle part.</p>
            <p className={`${styles.extrait} recit`}>« Si tu ouvres la porte aux trois symboles, rendez-vous au 14. »</p>
          </article>
          <article>
            <h3>Un récit à la suite</h3>
            <p>Une histoire en chapitres, écrite à plusieurs mains, que l’on lit du début à la fin, comme un roman de la classe.</p>
            <p className={`${styles.extrait} recit`}>« Chapitre 3 — Le gué des saules »</p>
          </article>
        </div>
      </section>

      <section className={styles.bande} aria-labelledby="qui-t">
        <h2 id="qui-t">Qui fait quoi</h2>
        <div className={styles.qui}>
          <div>
            <h3>Vous</h3>
            <ul>
              <li>préparez l’histoire et ses consignes ;</li>
              <li>donnez à chacun ses chapitres et ses scènes ;</li>
              <li>relisez, faites reprendre, validez ;</li>
              <li>composez le livre, l’imprimez, le partagez.</li>
            </ul>
          </div>
          <div>
            <h3>Vos élèves</h3>
            <ul>
              <li>entrent sans compte ni adresse : leur prénom et un code de quatre chiffres ;</li>
              <li>écrivent leurs scènes, sur l’ordinateur de la classe ;</li>
              <li>lisent celles des camarades de leur chapitre ;</li>
              <li>retrouvent le livre fini, et le font lire à la maison.</li>
            </ul>
          </div>
        </div>
        <p className={styles.materiel}>Un navigateur suffit : sur les ordinateurs ou les tablettes de la classe, plusieurs élèves écrivent en même temps.</p>
      </section>

      <section className={`${styles.bande} ${styles.origine}`} aria-labelledby="origine-t">
        <h2 id="origine-t">Né dans une classe</h2>
        <p>
          Il était une classe est fait par un enseignant d’école élémentaire, qui écrit des livres avec ses élèves depuis quatre ans. L’outil fait ce dont sa
          classe a besoin : que chacun écrive, que rien ne se perde, que le livre existe vraiment à la fin de l’année.
        </p>
      </section>

      <section className={styles.bande} aria-labelledby="offre-t">
        <h2 id="offre-t">Ce que cela coûte</h2>
        <div className={styles.offre}>
          <div className={styles.gratuit}>
            <p className={styles.prix}>Gratuit</p>
            <p>Projets, classes, élèves, livre, PDF et partage : tout l’outil.</p>
            <p>
              Les aides par l’intelligence artificielle, facultatives, s’utilisent avec des étoiles : <strong>{offre.etoilesOffertes} étoiles offertes</strong> à
              l’ouverture du compte, de quoi essayer.
            </p>
            {offre.paiementOuvert ? (
              <p>
                Un livre gratuit compte jusqu’à {offre.scenesGratuites} scènes et {offre.imagesGratuites} images. Des étoiles se rachètent :{" "}
                {enEuros(offre.prixDeLaRecharge)} pour {offre.etoilesDeLaRecharge}&nbsp;étoiles.
              </p>
            ) : null}
          </div>
          {offre.paiementOuvert ? (
            <div className={styles.gratuit}>
              <p className={styles.prix}>Le pass du livre · {enEuros(offre.prixDuPass)}</p>
              <p>Payé une fois, pour un livre : plus de limite de scènes ni d’images pour ce livre, et {offre.etoilesDuPass} étoiles pour les aides IA.</p>
              <p>Il s’achète depuis le livre, quand il atteint la taille du livre gratuit.</p>
            </div>
          ) : null}
        </div>
      </section>

      <section className={`${styles.bande} ${styles.fin}`} aria-labelledby="fin-t">
        <h2 id="fin-t">Votre classe a une histoire à écrire.</h2>
        <p className={styles.commandes}>
          <Link href="/entree/inscription" className="btn btn--primaire btn--grand">
            Créer un compte
          </Link>
          <Link href="/aide" className="btn btn--grand">
            Aide
          </Link>
        </p>
      </section>
    </main>
  );
}
