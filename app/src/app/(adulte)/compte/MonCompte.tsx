"use client";

import { useRouter } from "next/navigation";
import { useId, useState, useTransition, type ReactNode } from "react";
import { enregistrerNomAffiche, reglerAidesIa, supprimerMonCompte } from "@/app/(adulte)/actions-compte";
import { acheterUneRecharge } from "@/app/(adulte)/projet/actions-paiement";
import { Bulle } from "@/composants/Bulle";
import { Dialogue } from "@/composants/Dialogue";
import { Icone } from "@/composants/Icone";
import { MessageAuChargement } from "@/composants/MessageAuChargement";
import { Connexion } from "./Connexion";
import { DEGRES, NOMS_DES_DEGRES, QUALITES, enEtoiles, type Degre, type ReglagesIa } from "@/domaine/aides-ia";
import { EDITEUR } from "@/domaine/textes-publics";
import styles from "./compte.module.css";

type Props = {
  nomAffiche: string | null;
  courriel: string | null;
  reglagesIa: ReglagesIa;
  /** Le solde d'étoiles (F14-AC07) ; null pour le compte du porteur */
  etoiles: number | null;
  /** « Recharger · 5 € pour 100 ✦ », quand on peut acheter des étoiles ; sinon rien (F14-AC19) */
  recharge: string | null;
  /** Le compte du porteur : ni solde ni suppression d'ici (F14-AC11, AC26) */
  porteur: boolean;
  /** Le compte a un mot de passe ; ouvert par Google seul, il n'en a pas encore */
  motDePasse: boolean;
  /** La nouvelle adresse demandée, tant que ses liens n'ont pas été ouverts */
  adresseEnAttente: string | null;
  /** Ce qu'on vient de faire ailleurs : une recharge payée, un lien de changement d'adresse ouvert */
  message?: string;
};

/**
 * « Mon compte », en page : ce que lisent les élèves, les étoiles, les aides IA, puis, au pied, le
 * contact et la suppression. Chaque réglage s'enregistre aussitôt, et le dit au bout de sa ligne. Une ligne par réglage, son nom à gauche, sa commande à droite, l'aide dans un « i ».
 */
export function MonCompte({ nomAffiche, courriel, reglagesIa, etoiles, recharge, porteur, motDePasse, adresseEnAttente, message }: Props) {
  const id = useId();
  const routeur = useRouter();
  const [nom, setNom] = useState(nomAffiche ?? "");
  // L'enregistrement se dit au bout de la ligne qu'on vient de changer, pas en tête de page
  const [etat, setEtat] = useState<{
    cle: string;
    sorte: "attente" | "fait" | "echec";
    fois?: number;
    reprendre?: () => void;
  } | null>(null);
  const [, lancer] = useTransition();
  // Montrés aussitôt, gardés ensuite : un réglage ne doit pas attendre le serveur pour changer
  const [ia, setIa] = useState(reglagesIa);
  const [rechargeEnCours, lancerRecharge] = useTransition();
  const [erreurRecharge, setErreurRecharge] = useState<string | null>(null);
  // « Supprimer mon compte » : l'adresse retapée, puis la suppression (F14-AC26)
  const [supprimer, setSupprimer] = useState<string | null>(null);
  const [erreurSuppression, setErreurSuppression] = useState<string | null>(null);
  const [suppressionEnCours, lancerSuppression] = useTransition();

  const garder = (cle: string, envoi: () => Promise<void>) => {
    setEtat({ cle, sorte: "attente" });
    lancer(async () => {
      try {
        await envoi();
        // « fois » relance l'effacement de « Enregistré » à chaque nouveau réglage de la même ligne
        setEtat({ cle, sorte: "fait", fois: Date.now() });
        routeur.refresh();
      } catch {
        setEtat({ cle, sorte: "echec", reprendre: () => garder(cle, envoi) });
      }
    });
  };
  const reglerIa = (cle: string, changes: Partial<ReglagesIa>) => {
    setIa((r) => ({ ...r, ...changes }));
    garder(cle, () => reglerAidesIa(changes));
  };
  const garderNom = () => {
    if (nom.trim() === (nomAffiche ?? "").trim()) return;
    garder("nom", () => enregistrerNomAffiche(nom));
  };
  /** Au bout d'une ligne : « Enregistrement… », « ✓ Enregistré », ou l'échec et « Réessayer » */
  const etatDe = (cle: string): ReactNode => (
    <span className={styles.etat} role="status">
      {etat?.cle !== cle ? null : etat.sorte === "attente" ? (
        <span className={styles.attente}>Enregistrement…</span>
      ) : etat.sorte === "fait" ? (
        <span className={styles.fait} key={etat.fois}>
          <Icone nom="coche" />
          Enregistré
        </span>
      ) : (
        <span className={styles.echec}>
          Pas enregistré ·{" "}
          <button type="button" className="lien" onClick={etat.reprendre}>
            Réessayer
          </button>
        </span>
      )}
    </span>
  );
  const recharger = () =>
    lancerRecharge(async () => {
      setErreurRecharge(null);
      const r = await acheterUneRecharge(`${window.location.pathname}${window.location.search}`);
      if (r.ok) window.location.assign(r.adresse);
      else setErreurRecharge(r.erreur);
    });

  return (
    <div className={`page ${styles.page}`}>
      {message ? <MessageAuChargement texte={message} /> : null}
      <header className={`page-tete ${styles.tete}`}>
        <h1>Mon compte</h1>
      </header>

      <section className={styles.bloc} aria-labelledby={`${id}-eleves`}>
        <h2 id={`${id}-eleves`}>Pour vos élèves</h2>
        <div className={styles.lignes}>
          <div className={styles.ligne}>
            <label className={styles.nomReglage} htmlFor="compte-nom">
              Nom affiché aux élèves
            </label>
            <div className={styles.commande}>
              <input
                className={`pchamp ${styles.champ}`}
                id="compte-nom"
                type="text"
                value={nom}
                maxLength={60}
                placeholder="Mme Laurent"
                autoComplete="off"
                onChange={(e) => {
                  setNom(e.target.value);
                  if (etat?.cle === "nom") setEtat(null);
                }}
                onBlur={garderNom}
                onKeyDown={(e) => {
                  if (e.key === "Enter") e.currentTarget.blur();
                }}
              />
              {etatDe("nom")}
              <p className={styles.apercu}>
                {nom.trim() ? (
                  <>Les élèves lisent : « Demande à {nom.trim()}. »</>
                ) : (
                  <>Sans nom, les élèves lisent : « Demande à ton enseignant(e). »</>
                )}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Le solde, seul prix que l'enseignant voit ; le compte du porteur n'en a pas (F14-AC07, AC11) */}
      {etoiles !== null ? (
        <section className={styles.bloc} aria-labelledby={`${id}-etoiles`}>
          <div className={styles.titre}>
            <h2 id={`${id}-etoiles`}>Étoiles</h2>
            <Bulle question="À quoi servent les étoiles ?">
              Chaque demande à une aide IA use des étoiles, selon ce qu’elle coûte : une image en use plus qu’un texte. Si une aide échoue,
              aucune étoile n’est retirée.
            </Bulle>
          </div>
          <div className={styles.solde}>
            <p>
              Il vous reste <strong>{enEtoiles(etoiles)}</strong> pour les aides.
            </p>
            {recharge ? (
              <button type="button" className="btn" onClick={recharger} disabled={rechargeEnCours} aria-busy={rechargeEnCours || undefined}>
                {recharge}
              </button>
            ) : null}
          </div>
          {erreurRecharge ? (
            <p className="erreur" role="alert">
              {erreurRecharge}
            </p>
          ) : null}
        </section>
      ) : null}

      <section className={styles.bloc} aria-labelledby={`${id}-ia`}>
        <div className={styles.titre}>
          <h2 id={`${id}-ia`}>Aides IA</h2>
          <Bulle question="Que se passe-t-il si on les éteint ?">
            Plus aucun bouton d’IA ne s’affiche, dans aucun de vos projets. Tout le reste fonctionne comme avant. Cela sert si vous préférez
            travailler sans IA, ou si vous projetez l’écran devant la classe sans vouloir que les élèves voient ces boutons.
          </Bulle>
          <span className={styles.interTitre}>
            {etatDe("proposer")}
            <label className="inter">
              <input
                type="checkbox"
                role="switch"
                checked={ia.proposer}
                onChange={(e) => reglerIa("proposer", { proposer: e.target.checked })}
              />
              <span className="inter__piste" aria-hidden="true" />
              <span>Proposer les aides IA</span>
            </label>
          </span>
        </div>
        {ia.proposer ? null : <p className={styles.note}>Aucune aide IA dans vos projets. Tout le reste fonctionne.</p>}

        {ia.proposer ? (
          <>
            <h3 className={styles.sousTitre}>Textes</h3>
            <div className={styles.lignes}>
              <div className={styles.ligne}>
                <span className={styles.nomReglage}>
                  <label htmlFor={`${id}-degre`}>Degré de correction par défaut</label>
                  <Bulle question="Peut-on changer de degré ?">
                    Oui. Ce degré est proposé en premier quand vous demandez une correction, et vous pouvez en choisir un autre à chaque
                    fois.
                  </Bulle>
                </span>
                <div className={styles.commande}>
                  <select
                    id={`${id}-degre`}
                    className={`pchamp ${styles.champ}`}
                    value={ia.degre}
                    onChange={(e) =>
                      reglerIa("degre", {
                        degre: Number(e.target.value) as Degre,
                      })
                    }
                  >
                    {DEGRES.map((d) => (
                      <option key={d} value={d}>
                        Degré {d} · {NOMS_DES_DEGRES[d]}
                      </option>
                    ))}
                  </select>
                  {etatDe("degre")}
                </div>
              </div>
            </div>

            <h3 className={styles.sousTitre}>Images</h3>
            <div className={styles.lignes}>
              <div className={styles.ligne}>
                <span className={styles.nomReglage}>
                  <span id={`${id}-nombre`}>Images par création</span>
                  <Bulle question="Une ou deux images ?">
                    Avec « Deux », l’IA propose deux images à chaque demande, et vous gardez celle que vous préférez. Cela use deux fois
                    plus d’étoiles.
                  </Bulle>
                </span>
                <div className={styles.commande}>
                  <div className="bascule" role="group" aria-labelledby={`${id}-nombre`}>
                    {([1, 2] as const).map((n) => (
                      <button
                        key={n}
                        type="button"
                        aria-pressed={ia.imagesParCreation === n}
                        onClick={() => reglerIa("nombre", { imagesParCreation: n })}
                      >
                        {n === 1 ? "Une" : "Deux"}
                      </button>
                    ))}
                  </div>
                  {etatDe("nombre")}
                </div>
              </div>

              <div className={styles.ligne}>
                <span className={styles.nomReglage}>
                  <span id={`${id}-qualite`}>Qualité des images</span>
                  <Bulle question="Quelle qualité choisir ?">
                    En « Automatique », une image en pleine page est créée en haute qualité, et les autres en qualité normale. Une image en
                    haute qualité use environ quatre fois plus d’étoiles.
                  </Bulle>
                </span>
                <div className={styles.commande}>
                  <div className="bascule" role="group" aria-labelledby={`${id}-qualite`}>
                    {QUALITES.map((q) => (
                      <button key={q} type="button" aria-pressed={ia.qualite === q} onClick={() => reglerIa("qualite", { qualite: q })}>
                        {q === "auto" ? "Automatique" : q === "normale" ? "Normale" : "Haute"}
                      </button>
                    ))}
                  </div>
                  {etatDe("qualite")}
                </div>
              </div>

              <div className={styles.ligne}>
                <span className={styles.nomReglage}>
                  <span>Image créée à l’ajout</span>
                  <Bulle question="Que fait ce réglage ?">
                    Quand vous ajoutez une partie ou un chapitre proposé par l’IA, une image est créée d’après son résumé. Elle use des
                    étoiles. Si ce réglage est éteint, aucune image n’est créée : vous en choisissez une vous-même depuis « Choisir une
                    image ».
                  </Bulle>
                </span>
                <div className={styles.commande}>
                  <label className="inter">
                    <input
                      type="checkbox"
                      role="switch"
                      aria-label="Créer l’image des parties et chapitres ajoutés par l’IA"
                      checked={ia.imageALAjout}
                      onChange={(e) => reglerIa("ajout", { imageALAjout: e.target.checked })}
                    />
                    <span className="inter__piste" aria-hidden="true" />
                  </label>
                  {etatDe("ajout")}
                </div>
              </div>

              {/* La bibliothèque d'images (F10.1, 21 octobre 2026) : allumé par défaut, décision du porteur */}
              <div className={styles.ligne}>
                <span className={styles.nomReglage}>
                  <span>Bibliothèque d’images</span>
                  <Bulle question="Que devient une image proposée ?">
                    Une image créée par l’IA qui ne montre aucun personnage, un lieu ou un décor, peut rejoindre la bibliothèque d’images.
                    Le créateur du site relit chaque image avant de la publier ; tout enseignant peut ensuite la choisir pour ses projets.
                    Une image publiée y reste, même si vous supprimez votre compte.
                  </Bulle>
                </span>
                <div className={styles.commande}>
                  <label className="inter">
                    <input
                      type="checkbox"
                      role="switch"
                      aria-label="Proposer mes images sans personnage à la bibliothèque"
                      checked={ia.bibliotheque}
                      onChange={(e) => reglerIa("bibliotheque", { bibliotheque: e.target.checked })}
                    />
                    <span className="inter__piste" aria-hidden="true" />
                  </label>
                  {etatDe("bibliotheque")}
                </div>
              </div>
            </div>
          </>
        ) : null}
      </section>

      <Connexion courriel={courriel} motDePasse={motDePasse} adresseEnAttente={adresseEnAttente} />

      <footer className={styles.pied}>
        {/* Le support : un courriel, sans délai promis (F14-AC36) */}
        <p>
          Une question, une idée ?{" "}
          <a className="lien" href={`mailto:${EDITEUR.contact}`}>
            Écrire au créateur
          </a>
        </p>
        {porteur ? null : (
          <button
            type="button"
            className="lien lien--danger"
            onClick={() => {
              setSupprimer("");
              setErreurSuppression(null);
            }}
          >
            Supprimer mon compte
          </button>
        )}
      </footer>

      {supprimer !== null ? (
        <Dialogue
          titre="Supprimer votre compte ?"
          onFermer={() => setSupprimer(null)}
          boutons={
            <button
              type="button"
              className="btn btn--danger"
              disabled={suppressionEnCours || !supprimer.trim()}
              aria-busy={suppressionEnCours || undefined}
              onClick={() =>
                lancerSuppression(async () => {
                  const r = await supprimerMonCompte(supprimer);
                  if (r && !r.ok) setErreurSuppression(r.erreur);
                })
              }
            >
              Supprimer mon compte
            </button>
          }
        >
          <ul className="dialogue__faits">
            <li>Vos projets, vos classes et leurs élèves, vos images et vos livres partagés sont effacés aussitôt, sans retour.</li>
            <li>Les liens de lecture de vos livres ne mènent plus à rien.</li>
            {etoiles !== null && etoiles > 0 ? <li>Vos {enEtoiles(etoiles)} restantes sont perdues.</li> : null}
          </ul>
          <label className="champ champ--plein">
            <span>Pour confirmer, écrivez votre adresse</span>
            <input type="email" value={supprimer} autoComplete="off" onChange={(e) => setSupprimer(e.target.value)} />
          </label>
          {erreurSuppression ? (
            <p className="erreur" role="alert">
              {erreurSuppression}
            </p>
          ) : null}
        </Dialogue>
      ) : null}
    </div>
  );
}
