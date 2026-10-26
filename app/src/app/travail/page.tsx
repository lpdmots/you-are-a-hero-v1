import type { Metadata } from "next";
import { Icone } from "@/composants/Icone";
import { ImageRepere } from "@/composants/ImageRepere";
import { ecrireHeure, finDePlage, prochaineOuverture } from "@/domaine/horaires";
import { majuscule } from "@/domaine/texte";
import type { Categorie } from "@/domaine/encouragements";
import { mesEncouragements } from "@/serveur/encouragements";
import { contexteDeTravail, histoiresDuPoste } from "@/serveur/recit-eleve";
import { monTravail } from "@/serveur/travail-eleve";
import { Encouragements } from "./Encouragements";
import { EnteteEleve } from "./EnteteEleve";
import { Histoire } from "./Histoire";
import { MesScenes } from "./MesScenes";
import { RechercheEleve } from "./RechercheEleve";
import styles from "./travail.module.css";

export const metadata: Metadata = { title: "Mon travail" };

/**
 * Accueil de l'élève identifié : où il en est, si le travail est ouvert (F06-AC27), les
 * scènes dont il s'occupe, par urgence (F06-AC95), puis toute l'histoire en cartes — les
 * siennes s'ouvrent, les autres montrent leur titre et leur image (F03-AC15).
 */
export default async function MonTravail({ searchParams }: { searchParams: Promise<{ texte?: string }> }) {
  const contexte = await contexteDeTravail();
  // Ce que la page d'une scène vient de faire du texte en la quittant (F06-AC29, F08-AC28)
  const { texte } = await searchParams;
  // Hors des horaires, la base ne rend rien du récit : la page dit seulement quand il rouvre
  const [histoires, travail] = contexte.ouvert ? await Promise.all([histoiresDuPoste(contexte), monTravail(contexte)]) : [[], null];
  // Ses encouragements, histoire par histoire ; ceux d'un camarade n'arrivent jamais jusqu'ici (F07-AC82)
  const encouragements = await Promise.all(histoires.map(async (h) => ({ id: h.id, titre: h.titre, recu: await mesEncouragements(contexte, h.id) })));
  const tampons: Record<string, Categorie[]> = {};
  for (const t of encouragements.flatMap((h) => h.recu.tampons)) tampons[t.sceneId] = [...(tampons[t.sceneId] ?? []), t.categorie];
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
            {texte === "garde" ? (
              <p className={styles.acces}>
                <Icone nom="apart" />
                Ton texte est gardé à part. {majuscule(contexte.prof)} doit le regarder.
              </p>
            ) : texte === "enregistre" && !contexte.ouvert ? (
              <p className={styles.acces}>
                <Icone nom="coche" />
                Ton texte a été enregistré. Tu le retrouveras à la prochaine séance.
              </p>
            ) : null}
          </div>
        </section>
        {/* Hors des horaires, « Mon travail » ne liste rien (F06.4) ; sans chapitre, rien non plus à lister */}
        {travail && miens.length > 0 ? <MesScenes travail={travail} prof={contexte.prof} tampons={tampons} /> : null}
        <Encouragements histoires={encouragements} eleves={contexte.eleves} moi={contexte.moi} />
        {histoires.some((h) => h.parties.length) ? (
          <div className={styles.recherche}>
            <RechercheEleve />
          </div>
        ) : null}
        {histoires.filter((h) => h.parties.length).map((h) => (
          <Histoire key={h.id} histoire={h} avecTitre={histoires.length > 1} />
        ))}
      </main>
    </>
  );
}
