import Link from "next/link";
import { Gommette } from "@/composants/Gommette";
import { Icone } from "@/composants/Icone";
import { Logo } from "@/composants/Logo";
import { VeillePoste } from "@/composants/VeillePoste";
import { nomPourEleves } from "@/domaine/eleves";
import { de } from "@/domaine/texte";
import type { ContexteEleve } from "@/serveur/recit-eleve";
import { changer } from "../classe/actions";
import styles from "./travail.module.css";

/** La barre de l'espace élève : sa classe, son prénom, « Changer d'élève ». */
export function EnteteEleve({ contexte, auTravail, ici = "travail" }: {
  contexte: ContexteEleve;
  /** La page où l'on est, dans la barre : « Mon travail » ou « Lire » (F09.1, F12.3) */
  ici?: "travail" | "lecture";
  /** La page montre le récit : elle se quitte quand la plage horaire se termine */
  auTravail?: boolean;
}) {
  return (
    <>
      <VeillePoste attendu="eleve" auTravail={auTravail} />
      <header className={styles.barre}>
        <Logo href={contexte.lectureSeule ? "/travail/lecture" : "/travail"} />
        <nav className={styles.nav} aria-label="Espace élève">
          {/* L'année terminée : « Lire » seul (F15-AC16) */}
          {contexte.lectureSeule ? null : (
            <Link href="/travail" aria-current={ici === "travail" ? "page" : undefined}>
              Mon travail
            </Link>
          )}
          <Link href="/travail/lecture" aria-current={ici === "lecture" ? "page" : undefined}>
            Lire
          </Link>
        </nav>
        <span className={styles.classe}>
          <Icone nom="eleves" />
          Classe {contexte.classe.nom}
          {contexte.nomAffiche ? ` ${de(contexte.nomAffiche)}` : ""}
        </span>
        <div className={styles.droite}>
          <span className={styles.identite}>
            <Gommette prenom={contexte.moi.prenom} couleur={contexte.moi.couleur} />
            <span className="main">{nomPourEleves(contexte.moi, contexte.eleves)}</span>
          </span>
          <form action={changer}>
            <button type="submit" className="btn btn--discret">
              Changer d’élève
            </button>
          </form>
        </div>
      </header>
    </>
  );
}
