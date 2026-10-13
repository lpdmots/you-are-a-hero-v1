import Link from "next/link";
import { Icone } from "@/composants/Icone";
import { TamponScene } from "@/composants/TamponScene";
import { referenceScene } from "@/domaine/recit";
import { attendLEleve, ceQueDitLaScene, phraseAPrendre, sceneSuivante } from "@/domaine/travail";
import type { MonTravail } from "@/serveur/travail-eleve";
import styles from "./travail.module.css";

/**
 * « Les scènes dont tu t'occupes » (F06.5, 13 octobre 2026) : une ligne par scène, la plus
 * urgente en tête, une seule avec le bouton plein. Sous la liste, ce qu'il reste à prendre
 * dans son chapitre, qui est le seul endroit où l'on prend une scène. Les scènes des
 * camarades n'y sont pas : elles se lisent dans le chapitre.
 */
export function MesScenes({ travail, prof }: { travail: MonTravail; prof: string }) {
  const { scenes, aPrendre, chapitres } = travail;
  const suivante = sceneSuivante(scenes);
  const plusieurs = chapitres.length > 1;
  // « Choisir une scène » : quand rien ne l'attend plus, vers le chapitre où il en reste à prendre
  const ouChoisir = aPrendre[0]?.chapitreId ?? chapitres[0]?.id;
  const choisir = !suivante && (scenes.length === 0 || aPrendre.length > 0);
  return (
    <section className={styles.travail} aria-labelledby="t-mien">
      <h2 id="t-mien">Les scènes dont tu t’occupes</h2>
      {scenes.length === 0 ? (
        <p className={styles.aucune}>
          Tu ne t’occupes encore d’aucune scène.{" "}
          {aPrendre.length ? "Choisis-en une dans ton chapitre." : `Demande à ${prof} laquelle écrire.`}
        </p>
      ) : (
        <ul className={styles.scenes}>
          {scenes.map((s) => {
            const { phrase, bouton } = ceQueDitLaScene(s, prof);
            const ref = referenceScene(s.reference);
            return (
              <li key={s.id} className={attendLEleve(s) ? undefined : styles.finie}>
                <span className="fiche__ref">{ref}</span>
                <div className={styles.sceneCorps}>
                  <p className={styles.sceneTitre}>
                    {s.titre ?? <span className="sans-consigne">sans titre</span>}
                    {plusieurs ? <span className={styles.sceneChapitre}>{s.chapitre}</span> : null}
                  </p>
                  <p className={s.arrete ? `${styles.sceneDit} ${styles.arret}` : styles.sceneDit}>
                    {s.arrete ? <Icone nom="apart" /> : null}
                    {phrase}
                  </p>
                </div>
                <TamponScene etat={s.etat} vide={s.vide} />
                <Link className={`btn${s === suivante ? " btn--primaire" : ""}`} href={`/travail/scene/${s.id}`} aria-label={`${bouton} : ${ref}${s.titre ? ` — ${s.titre}` : ""}`}>
                  {bouton}
                  <Icone nom="fleche" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
      {aPrendre.map((a) => (
        <p key={a.chapitreId} className={styles.aPrendre}>
          <Icone nom="main" />
          <span>{phraseAPrendre(a.nombre, a.chapitre, !plusieurs)}</span>
          <Link className="lien" href={`/travail/chapitre/${a.chapitreId}`} aria-label={`Voir les scènes à prendre dans ${a.chapitre}`}>
            Voir
          </Link>
        </p>
      ))}
      {choisir && ouChoisir ? (
        <p>
          <Link className="btn btn--primaire btn--grand" href={`/travail/chapitre/${ouChoisir}`}>
            Choisir une scène
            <Icone nom="fleche" />
          </Link>
        </p>
      ) : null}
    </section>
  );
}
