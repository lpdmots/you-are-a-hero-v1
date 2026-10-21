import type { Metadata } from "next";
import Link from "next/link";
import { Agrandissable } from "@/composants/Agrandissable";
import { BoutonEnvoi } from "@/composants/Attente";
import { Icone } from "@/composants/Icone";
import { exigerLePorteur } from "@/serveur/administration";
import { imagesAcceptees, imagesARelire } from "@/serveur/bibliotheque";
import { accepterPourLaBibliotheque, changerLesMotsAdmin, refuserPourLaBibliotheque, retirerDeLaBibliothequeAdmin } from "../actions";
import styles from "../admin.module.css";

export const metadata: Metadata = { title: "Bibliothèque d’images — Administration" };

const FAITS: Record<string, string> = {
  acceptee: "L’image est dans la bibliothèque, avec ses mots-clés.",
  "acceptee-sans-mots": "L’image est dans la bibliothèque, mais l’IA n’a pas donné ses mots-clés : écrivez-les vous-même.",
  refusee: "L’image ne sera plus proposée.",
  retiree: "L’image est retirée de la bibliothèque. Les projets qui l’ont prise gardent leur copie.",
  mots: "Les mots-clés sont enregistrés.",
  refus: "Rien n’a été fait.",
};

const SORTES: Record<string, string> = { projet: "Repérage d’un projet", partie: "Repérage d’une partie", chapitre: "Repérage d’un chapitre", scene: "Image de scène" };

/**
 * La bibliothèque d'images (F10.1, F10-AC53), pour le porteur : les images créées sans personnage,
 * à accepter ou refuser une à une, puis celles qui y sont, avec leurs mots-clés à retoucher.
 */
export default async function Bibliotheque({ searchParams }: { searchParams: Promise<{ fait?: string }> }) {
  await exigerLePorteur();
  const [{ fait }, aRelire, acceptees] = await Promise.all([searchParams, imagesARelire(), imagesAcceptees()]);
  const message = fait ? FAITS[fait] : null;
  return (
    <div className={`page ${styles.admin}`}>
      <nav className="fil">
        <Link href="/admin">
          <Icone nom="fleche-g" />
          Retour à l’administration
        </Link>
      </nav>
      <header className="page-tete">
        <h1>Bibliothèque d’images</h1>
      </header>
      {message ? (
        <p className={fait === "refus" ? `${styles.fait} ${styles.rate}` : styles.fait} role="status">
          {message}
        </p>
      ) : null}

      <section className={styles.bloc} aria-labelledby="bib-relire">
        <h2 id="bib-relire">À relire ({aRelire.length})</h2>
        <p className={styles.note}>
          Des images créées par l’IA sans personnage, d’adultes qui acceptent de les proposer. Acceptée, une image est copiée dans la
          bibliothèque et l’IA lit ses mots-clés ; tout adulte peut ensuite la choisir.
        </p>
        {aRelire.length ? (
          <ul className={styles.galerie}>
            {aRelire.map((i) => (
              <li key={i.image} className={styles.carteImage}>
                <Agrandissable src={`/admin/images/${i.image}`} nom="l’image à relire" className={styles.vignetteImage}>
                  {/* eslint-disable-next-line @next/next/no-img-element -- images servies par l'application */}
                  <img src={`/admin/images/${i.image}?v=1`} alt="" loading="lazy" />
                </Agrandissable>
                <p className={styles.note}>{SORTES[i.cible] ?? "Image"}</p>
                <div className={styles.gestes}>
                  <form action={accepterPourLaBibliotheque.bind(null, i.image)}>
                    <BoutonEnvoi className="btn btn--petit">Accepter</BoutonEnvoi>
                  </form>
                  <form action={refuserPourLaBibliotheque.bind(null, i.image)}>
                    <BoutonEnvoi className="lien">Refuser</BoutonEnvoi>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className={styles.note}>Aucune image à relire.</p>
        )}
      </section>

      <section className={styles.bloc} aria-labelledby="bib-dedans">
        <h2 id="bib-dedans">Dans la bibliothèque ({acceptees.length})</h2>
        {acceptees.length ? (
          <ul className={styles.galerie}>
            {acceptees.map((i) => (
              <li key={i.id} className={styles.carteImage}>
                <Agrandissable src={`/images/bibliotheque/${i.id}`} nom="l’image de la bibliothèque" className={styles.vignetteImage}>
                  {/* eslint-disable-next-line @next/next/no-img-element -- images servies par l'application */}
                  <img src={`/images/bibliotheque/${i.id}?v=1`} alt="" loading="lazy" />
                </Agrandissable>
                <form action={changerLesMotsAdmin.bind(null, i.id)} className={styles.mots}>
                  <label className={styles.champ}>
                    <span>Mots-clés</span>
                    <input name="mots" type="text" className="pchamp" defaultValue={i.mots.join(", ")} placeholder="forêt, rivière, brume" />
                  </label>
                  <label className={styles.champ}>
                    <span>En anglais</span>
                    <input name="motsEn" type="text" className="pchamp" defaultValue={i.motsEn.join(", ")} placeholder="forest, river, mist" />
                  </label>
                  <BoutonEnvoi className="btn btn--petit">Enregistrer</BoutonEnvoi>
                </form>
                <form action={retirerDeLaBibliothequeAdmin.bind(null, i.id)}>
                  <BoutonEnvoi className="lien lien--danger">Retirer de la bibliothèque</BoutonEnvoi>
                </form>
              </li>
            ))}
          </ul>
        ) : (
          <p className={styles.note}>La bibliothèque est vide.</p>
        )}
      </section>
    </div>
  );
}
