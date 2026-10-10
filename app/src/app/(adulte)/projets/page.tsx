import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Icone } from "@/composants/Icone";
import { ImageRepere } from "@/composants/ImageRepere";
import { libelleRecit } from "@/domaine/projets";
import { exigerEnseignant } from "@/serveur/adulte";
import { mesProjets, type Projet } from "@/serveur/lectures";
import styles from "./projets.module.css";

export const metadata: Metadata = { title: "Mes projets" };

const meta = (p: Projet): string =>
  `${p.organisation === "personnel" ? "Projet personnel" : p.classe ? `Classe ${p.classe.nom}` : "Sans classe"} · ${libelleRecit(p.recit)}`;

/** « Mes projets » : peu de projets, donc de grandes cartes (F06.5). */
export default async function MesProjets() {
  const enseignant = await exigerEnseignant();
  const projets = await mesProjets(enseignant);

  if (!projets.length) {
    return (
      <div className="page">
        <header className="page-tete">
          <h1>Mes projets</h1>
        </header>
        <section className={styles.vide} aria-labelledby="vide-t">
          <div className={styles.cahier} aria-hidden="true">
            <div className={styles.couverture}>
              <div className={styles.vignette}>
                <Image src="/illustrations/defaut-montagne.jpg" alt="" fill sizes="260px" />
              </div>
              <div className={styles.etiquette}>
                <span />
                <span />
              </div>
            </div>
          </div>
          <div className={styles.videTexte}>
            <h2 id="vide-t">Votre premier livre commence ici</h2>
            <p>Un projet, c’est une histoire : vous la préparez, elle s’écrit, puis elle devient un livre.</p>
            <Link className="btn btn--primaire btn--grand" href="/projets/nouveau">
              <Icone nom="plus" />
              Créer mon premier projet
            </Link>
            <p className={styles.videPlus}>
              Vous écrivez avec une classe ? Vous l’inscrirez plus tard, quand les élèves commenceront.
            </p>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="page">
      <header className="page-tete">
        <h1>Mes projets</h1>
        <Link className="btn" href="/projets/nouveau">
          <Icone nom="plus" />
          Nouveau projet
        </Link>
      </header>
      <ul className={styles.projets}>
        {projets.map((p) => {
          const dernier = p.id === enseignant.dernierProjetId;
          return (
            <li key={p.id}>
              <div className={styles.projet}>
                <span className={styles.image}>
                  <ImageRepere repere={p} graine={p.id} grande />
                </span>
                <span className={styles.texte}>
                  <b>{p.titre}</b>
                  <span>{meta(p)}</span>
                </span>
                <span className={styles.faits}>
                  {/* Les scènes à valider et les scènes prêtes se comptent à partir de l'étape 4 (F06-AC58). */}
                  <span className={styles.livre}>
                    <span className={styles.jauge} role="img" aria-label="0 % des scènes prêtes pour le livre">
                      <span style={{ width: "0%" }} />
                    </span>
                    <span>
                      <b>0 %</b> des scènes prêtes pour le livre
                    </span>
                  </span>
                </span>
                <span className={styles.pied}>
                  <Link
                    className={`btn ${dernier ? "btn--primaire" : ""} ${styles.ouvrir}`}
                    href={`/projet/${p.id}/${p.dernierOnglet}`}
                    aria-label={`${dernier ? "Continuer" : "Ouvrir"} ${p.titre}`}
                  >
                    {dernier ? "Continuer" : "Ouvrir"}
                  </Link>
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
