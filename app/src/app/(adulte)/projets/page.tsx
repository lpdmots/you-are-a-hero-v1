import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Icone } from "@/composants/Icone";
import { MessageAuChargement } from "@/composants/MessageAuChargement";
import { ImageRepere } from "@/composants/ImageRepere";
import { libelleRecit } from "@/domaine/projets";
import { exigerEnseignant } from "@/serveur/adulte";
import { pluriel } from "@/domaine/texte";
import { avancementDesProjets, mesProjets, type Projet } from "@/serveur/lectures";
import { projetsAvecPass } from "@/serveur/offre";
import styles from "./projets.module.css";

export const metadata: Metadata = { title: "Mes projets" };

const meta = (p: Projet): string =>
  `${p.organisation === "personnel" ? "Projet personnel" : p.classe ? `Classe ${p.classe.nom}` : "Sans classe"} · ${libelleRecit(p.recit)}`;

/** « Mes projets » : peu de projets, donc de grandes cartes (F06.5). */
export default async function MesProjets({ searchParams }: { searchParams: Promise<{ projet?: string }> }) {
  const enseignant = await exigerEnseignant();
  // Au retour d'une suppression (F14-AC42), une phrase, puis l'adresse se nettoie
  const supprime = (await searchParams).projet === "supprime" ? <MessageAuChargement texte="Le projet est supprimé." /> : null;
  const [projets, avancements, avecPass] = await Promise.all([
    mesProjets(enseignant),
    avancementDesProjets(enseignant),
    projetsAvecPass(enseignant.supabase, enseignant.createur),
  ]);

  if (!projets.length) {
    return (
      <div className="page">
        {supprime}
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
              Vous écrivez avec une classe ? Inscrivez-la maintenant ou plus tard : votre histoire peut commencer sans elle.
            </p>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="page">
      {supprime}
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
          const { aValider, pourCent } = avancements.get(p.id) ?? { aValider: 0, pourCent: 0 };
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
                  {/* L'information d'un côté, le lien de l'autre : « Voir » ouvre le Suivi sur ces scènes, sans son écran d'aide (F06-AC58, AC60) */}
                  {aValider ? (
                    <span className={styles.aValider}>
                      <Icone nom="sablier" />
                      <span>
                        {aValider} scène{pluriel(aValider)} à valider
                      </span>
                      <Link className="lien" href={`/projet/${p.id}/suivi?etat=valider&direct=1`} aria-label={`Voir les scènes à valider de ${p.titre}`}>
                        Voir
                      </Link>
                    </span>
                  ) : null}
                  <span className={styles.livre}>
                    <span className={styles.jauge} role="img" aria-label={`${pourCent} % des scènes prêtes pour le livre`}>
                      <span style={{ width: `${pourCent}%` }} />
                    </span>
                    <span>
                      <b>{pourCent} %</b> des scènes prêtes pour le livre
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
                  {/* Une marque discrète, sur le seul projet qui a son pass : rien sur les autres (F14-AC41) */}
                  {avecPass.has(p.id) ? <span className={styles.pass}>Pass du livre</span> : null}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
