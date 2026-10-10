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
export function EnteteEleve({ contexte }: { contexte: ContexteEleve }) {
  return (
    <>
      <VeillePoste attendu="eleve" />
      <header className={styles.barre}>
        <Logo href="/travail" />
        <nav className={styles.nav} aria-label="Espace élève">
          <Link href="/travail" aria-current="page">
            Mon travail
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
