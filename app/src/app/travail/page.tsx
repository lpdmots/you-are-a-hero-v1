import type { Metadata } from "next";
import { Icone } from "@/composants/Icone";
import { ImageRepere } from "@/composants/ImageRepere";
import { ecrireHeure, finDePlage, prochaineOuverture } from "@/domaine/horaires";
import { majuscule } from "@/domaine/texte";
import { contexteEleve, histoiresDuPoste } from "@/serveur/recit-eleve";
import { EnteteEleve } from "./EnteteEleve";
import { Histoire } from "./Histoire";
import styles from "./travail.module.css";

export const metadata: Metadata = { title: "Mon travail" };

/**
 * Accueil de l'élève identifié : où il en est, si le travail est ouvert (F06-AC27), puis
 * toute l'histoire en cartes — les siennes s'ouvrent, les autres montrent leur titre et
 * leur image (F03-AC15). « Mon travail » et ses scènes à écrire se construisent à l'étape 4.
 */
export default async function MonTravail() {
  const contexte = await contexteEleve();
  // Hors des horaires, la base ne rend rien du récit : la page dit seulement quand il rouvre
  const histoires = contexte.ouvert ? await histoiresDuPoste(contexte) : [];
  const miens = histoires.flatMap((h) => h.parties.flatMap((p) => p.chapitres.filter((c) => c.profil).map((c) => ({ chapitre: c, partie: p.titre }))));
  const maintenant = new Date();
  const rouvre = contexte.ouvert ? null : prochaineOuverture(contexte.plages, maintenant);
  const fin = contexte.ouvert ? finDePlage(contexte.classe.horairesLimites, contexte.plages, maintenant) : null;
  const premiere = histoires[0];

  return (
    <>
      <EnteteEleve contexte={contexte} />
      <main className="page page--eleve">
        <section className={styles.accueil}>
          <div className={styles.image}>
            <ImageRepere repere={premiere ?? { imageId: null, visuelChoisi: null, visuelDefaut: "foret" }} graine={premiere?.id ?? "accueil"} grande prioritaire />
          </div>
          <div className={styles.texte}>
            <p className={styles.bonjour}>Bonjour {contexte.moi.prenom}</p>
            <h1>Mon travail</h1>
            {contexte.ouvert ? (
              <>
                {miens.length === 0 ? (
                  <>
                    <p>Tu n’as pas encore de chapitre.</p>
                    <p className={styles.acces}>
                      <Icone nom="main" />
                      {majuscule(contexte.prof)} va t’en donner un.
                    </p>
                  </>
                ) : miens.length === 1 ? (
                  <p>
                    Ton chapitre : <b>{miens[0].chapitre.titre}</b>, dans {miens[0].partie}.
                  </p>
                ) : (
                  <p>
                    Tes chapitres : <b>{miens.map((m) => m.chapitre.titre).join(", ")}</b>.
                  </p>
                )}
                {fin ? (
                  <p className={styles.acces}>
                    <Icone nom="horloge" />
                    Aujourd’hui, le travail est ouvert jusqu’à <span className="chiffres">{ecrireHeure(fin)}</span>.
                  </p>
                ) : null}
              </>
            ) : (
              <p className={`${styles.acces} ${styles.ferme}`}>
                <Icone nom="horloge" />
                {rouvre ? (
                  <span>
                    Le travail est fermé jusqu’à <span className="chiffres">{rouvre}</span>.
                  </span>
                ) : (
                  "Le travail est fermé pour le moment."
                )}
              </p>
            )}
          </div>
        </section>
        {histoires.filter((h) => h.parties.length).map((h) => (
          <Histoire key={h.id} histoire={h} avecTitre={histoires.length > 1} />
        ))}
      </main>
    </>
  );
}
