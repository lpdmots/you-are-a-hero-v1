import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Icone } from "@/composants/Icone";
import { contexteEleve, histoiresDuPoste } from "@/serveur/recit-eleve";
import { EnteteEleve } from "../EnteteEleve";
import styles from "./lecture.module.css";

export const metadata: Metadata = { title: "Lire à l’essai" };

/**
 * « Lire à l'essai », depuis la barre de l'élève (F09.1) : l'histoire où il a un chapitre, ou
 * dont la lecture est ouverte. Une seule : on y va ; plusieurs : il choisit.
 */
export default async function Page() {
  const contexte = await contexteEleve();
  if (!contexte.ouvert) redirect("/travail");
  const histoires = (await histoiresDuPoste(contexte)).filter((h) => h.parties.some((p) => p.chapitres.some((c) => c.lisible)));
  if (histoires.length === 1) redirect(`/travail/lecture/${histoires[0].id}`);
  return (
    <>
      <EnteteEleve contexte={contexte} auTravail ici="lecture" />
      <main className={`page page--eleve ${styles.page}`}>
        <h1 className={styles.titre}>
          <Icone nom="livre" />
          Lire à l’essai
        </h1>
        {histoires.length ? (
          <ul className={styles.histoires}>
            {histoires.map((h) => (
              <li key={h.id}>
                <Link className="btn btn--grand" href={`/travail/lecture/${h.id}`}>
                  {h.titre}
                  <Icone nom="fleche" />
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className={styles.vide}>
            <p>Tu n’as pas encore de chapitre : il n’y a rien à lire pour l’instant.</p>
            <p className={styles.vide__aide}>
              <Icone nom="main" />
              Demande à {contexte.prof} de t’en donner un.
            </p>
            <p>
              <Link className="btn" href="/travail">
                <Icone nom="fleche-g" />
                Retour à Mon travail
              </Link>
            </p>
          </div>
        )}
      </main>
    </>
  );
}
