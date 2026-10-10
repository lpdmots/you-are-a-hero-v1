import Link from "next/link";
import { ImageRepere } from "@/composants/ImageRepere";
import { ProjetOuvert } from "@/composants/ProjetCourant";
import { libelleAnnee } from "@/domaine/annee";
import { libelleRecit, NOM_ONGLET, ongletsDe, type Onglet } from "@/domaine/projets";
import { chapitresDe } from "@/domaine/recit";
import { pluriel } from "@/domaine/texte";
import type { Enseignant } from "@/serveur/adulte";
import { mesClasses, type Projet } from "@/serveur/lectures";
import { planDe } from "@/serveur/recit";
import { ClasseDuProjet } from "../[onglet]/ClasseDuProjet";
import styles from "../[onglet]/projet.module.css";
import { MenuProjet } from "./MenuProjet";

/** En-tête commun aux onglets d'un projet : son image, son titre, sa classe, ses onglets. */
export async function EnteteProjet({ enseignant, projet, onglet }: { enseignant: Enseignant; projet: Projet; onglet: Onglet }) {
  const deClasse = projet.organisation === "classe";
  const [classes, plan] = await Promise.all([deClasse ? mesClasses(enseignant) : Promise.resolve([]), planDe(enseignant, projet.id)]);
  const attribue = chapitresDe(plan).some((c) => c.attributions.length > 0);
  return (
    <section className={styles.histoire}>
      <ProjetOuvert id={projet.id} titre={projet.titre} onglet={onglet} />
      <div className={styles.vignette}>
        <ImageRepere repere={projet} graine={projet.id} prioritaire />
      </div>
      <div className={styles.titre}>
        <div>
          <h1>{projet.titre}</h1>
          <div className={styles.meta}>
            {deClasse ? (
              <ClasseDuProjet
                projetId={projet.id}
                titre={projet.titre}
                classeId={projet.classe?.id ?? null}
                attribue={attribue}
                libelle={
                  projet.classe
                    ? `Classe ${projet.classe.nom} · ${projet.classe.nombreEleves ? `${projet.classe.nombreEleves} élève${pluriel(projet.classe.nombreEleves)}` : "aucun élève inscrit"}`
                    : "Sans classe"
                }
                classes={classes.filter((c) => c.enCours).map((c) => ({ id: c.id, nom: c.nom, annee: libelleAnnee(c.anneeDebut), eleves: c.eleves.length }))}
              />
            ) : (
              "Projet personnel"
            )}
            {" · "}
            {libelleRecit(projet.recit)}
          </div>
        </div>
        <MenuProjet
          projet={{
            id: projet.id, titre: projet.titre, deClasse, lectureOuverte: projet.lectureOuverte,
            imageId: projet.imageId, visuelChoisi: projet.visuelChoisi, visuelDefaut: projet.visuelDefaut,
          }}
        />
      </div>
      <nav className={styles.onglets} aria-label="Sections du projet">
        {ongletsDe(projet.organisation).map((o) => (
          <Link key={o} href={`/projet/${projet.id}/${o}`} aria-current={o === onglet ? "page" : undefined}>
            {NOM_ONGLET[o]}
          </Link>
        ))}
      </nav>
    </section>
  );
}
