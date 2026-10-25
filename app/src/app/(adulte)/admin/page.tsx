import type { Metadata } from "next";
import Link from "next/link";
import { NePasCompterCeNavigateur } from "@/composants/Mesure";
import { enEuros } from "@/domaine/offre";
import { livresAChoisir } from "@/serveur/accueil";
import { codeDuLien, exigerLePorteur, partageDuLien, tableau } from "@/serveur/administration";
import { imagesARelire } from "@/serveur/bibliotheque";
import {
  basculerLePaiement, chercherLePartage, choisirPourLAccueilAdmin, echangerLesLivresAdmin, retirerLaCouvertureAdmin, retirerPartage,
} from "./actions";
import styles from "./admin.module.css";
import { DeposerCouverture } from "./DeposerCouverture";

export const metadata: Metadata = { title: "Administration" };

const jour = (iso: string | null) =>
  iso ? new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", year: "numeric", timeZone: "Europe/Paris" }).format(new Date(iso)) : "jamais";
const mois = () => new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric", timeZone: "Europe/Paris" }).format(new Date());
const nombre = (n: number, d = 2) => n.toLocaleString("fr-FR", { minimumFractionDigits: d, maximumFractionDigits: d });

const FAITS: Record<string, string> = {
  retire: "Le partage est retiré, et l’enseignant en est averti par courriel.",
  "retire-sans-courriel": "Le partage est retiré. Le courriel n’est pas parti : prévenez l’enseignant vous-même.",
  refus: "Rien n’a été fait.",
  "accueil-pose": "Le livre est sur l’accueil.",
  "accueil-retire": "Le livre a quitté l’accueil.",
  "accueil-ordre": "Les deux livres ont changé de place.",
  "couverture-posee": "La couverture est sur l’accueil.",
  "couverture-retiree": "La couverture est retirée : le livre montre sa page de titre.",
};

/** Ce qui n'a pas pu se faire, en brique : la raison, et que faire */
const REFUS: Record<string, string> = {
  "accueil-plein": "Deux livres sont déjà sur l’accueil : retirez-en un d’abord.",
  "couverture-format": "Cette image ne convient pas : JPEG, PNG ou WebP, 4 Mo au plus.",
};

/**
 * L'administration du porteur (F14-AC22, AC23, AC25), sans maquette : une page de travail, dense
 * et sobre. Le mois en une ligne, l'interrupteur, un lien signalé à retirer, puis les comptes.
 */
export default async function Administration({ searchParams }: { searchParams: Promise<{ partage?: string; fait?: string }> }) {
  const porteur = await exigerLePorteur();
  const [t, demande, aRelire, livres] = await Promise.all([tableau(), searchParams, imagesARelire(), livresAChoisir(porteur)]);
  const surLAccueil = livres.filter((l) => l.surLAccueil).length;
  const signale = demande.partage && demande.partage !== "introuvable" && codeDuLien(demande.partage) ? await partageDuLien(demande.partage) : null;
  const fait = demande.fait ? FAITS[demande.fait] : null;
  const refus = demande.fait ? REFUS[demande.fait] : null;

  return (
    <div className={`page ${styles.admin}`}>
      {/* Ce navigateur est celui du porteur : ses visites de l'accueil ne se comptent plus (F14-AC49) */}
      <NePasCompterCeNavigateur />
      <header className="page-tete">
        <h1>Administration</h1>
      </header>
      {fait ? (
        <p className={styles.fait} role="status">
          {fait}
        </p>
      ) : null}
      {refus ? (
        <p className={`${styles.fait} ${styles.refus}`} role="alert">
          {refus}
        </p>
      ) : null}

      <section className={styles.mois} aria-labelledby="adm-mois">
        <h2 id="adm-mois">En {mois()}</h2>
        <dl className={styles.chiffres}>
          <div>
            <dt>Dépense d’IA</dt>
            <dd>
              {nombre(t.depenseUsd)} $ <span>≈ {nombre(t.depenseEuros)} € · {t.appels} demande{t.appels > 1 ? "s" : ""}</span>
            </dd>
          </div>
          <div>
            <dt>Ventes</dt>
            <dd>
              {enEuros(t.ventes.montant)}{" "}
              <span>
                {t.ventes.pass} pass · {t.ventes.recharges} recharge{t.ventes.recharges > 1 ? "s" : ""}
              </span>
            </dd>
          </div>
          <div>
            <dt>Comptes</dt>
            <dd>{t.comptes.length}</dd>
          </div>
        </dl>
        <form action={basculerLePaiement.bind(null, !t.paiementOuvert)} className={styles.interrupteur}>
          <span>
            Paiement ouvert : <strong>{t.paiementOuvert ? "allumé" : "éteint"}</strong>
            <small>{t.paiementOuvert ? " — limites gratuites et vente actives." : " — ni limite ni vente."}</small>
          </span>
          <button type="submit" className="btn btn--petit">
            {t.paiementOuvert ? "Éteindre" : "Allumer"}
          </button>
        </form>
      </section>

      {/* La bibliothèque d'images (F10.1) : les images à relire, sur leur page */}
      <section className={`${styles.bloc} ${styles.lienBloc}`} aria-labelledby="adm-bibliotheque">
        <h2 id="adm-bibliotheque">Bibliothèque d’images</h2>
        <Link className="btn" href="/admin/bibliotheque">
          {aRelire.length ? `${aRelire.length} image${aRelire.length > 1 ? "s" : ""} à relire` : "Ouvrir"}
        </Link>
      </section>

      {/* Les livres de l'accueil (F14-AC40) : deux au plus, parmi ceux du porteur partagés par lien */}
      <section className={styles.bloc} id="adm-accueil" aria-labelledby="adm-accueil-t">
        <h2 id="adm-accueil-t">Livres de l’accueil</h2>
        {livres.length === 0 ? (
          <p className={styles.note}>Aucun de vos livres n’est partagé par lien. Partagez-en un depuis « Imprimer et partager ».</p>
        ) : (
          <>
            <p className={styles.note}>
              Deux au plus, parmi vos livres partagés par lien. Couverture : la face avant, ou la couverture entière, dont seule la face avant est gardée.
            </p>
            <ul className={styles.liste}>
              {livres.map((l) => (
                <li key={l.code} className={styles.livreAccueil}>
                  {l.surLAccueil ? (
                    <span className={styles.couverture}>
                      {l.couverture ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={l.couverture} alt={`Couverture de « ${l.titre} »`} />
                      ) : (
                        <span>Page de titre</span>
                      )}
                    </span>
                  ) : null}
                  <span className={styles.titre}>{l.titre}</span>
                  <a href={`/lire/${l.code}`} target="_blank" rel="noreferrer">
                    Lire
                  </a>
                  <span className={styles.partage}>
                    {l.surLAccueil ? (
                      <>
                        <DeposerCouverture code={l.code} remplacer={Boolean(l.couverture)} />
                        {l.couverture ? (
                          <form action={retirerLaCouvertureAdmin.bind(null, l.code)}>
                            <button type="submit" className="lien">
                              Retirer la couverture
                            </button>
                          </form>
                        ) : null}
                        <form action={choisirPourLAccueilAdmin.bind(null, l.code, false)}>
                          <button type="submit" className="btn btn--petit">
                            Retirer de l’accueil
                          </button>
                        </form>
                      </>
                    ) : (
                      <form action={choisirPourLAccueilAdmin.bind(null, l.code, true)}>
                        <button type="submit" className="btn btn--petit" disabled={surLAccueil >= 2} title={surLAccueil >= 2 ? "Deux livres sont déjà sur l’accueil" : undefined}>
                          Mettre sur l’accueil
                        </button>
                      </form>
                    )}
                  </span>
                </li>
              ))}
            </ul>
            {surLAccueil === 2 ? (
              <form action={echangerLesLivresAdmin} className={styles.ligne}>
                <button type="submit" className="btn btn--petit">
                  Échanger leur place
                </button>
              </form>
            ) : null}
          </>
        )}
      </section>

      <section className={styles.bloc} aria-labelledby="adm-partage">
        <h2 id="adm-partage">Un livre signalé</h2>
        <form action={chercherLePartage} className={styles.ligne}>
          <label className={`${styles.champ} ${styles.large}`}>
            <span>Lien de lecture</span>
            <input name="lien" type="text" className="pchamp" placeholder="https://iletaituneclasse.com/lire/…" defaultValue={demande.partage && demande.partage !== "introuvable" ? demande.partage : ""} required />
          </label>
          <button type="submit" className="btn">
            Chercher
          </button>
        </form>
        {demande.partage === "introuvable" ? <p className={styles.note}>Aucun livre partagé derrière ce lien.</p> : null}
        {signale ? (
          <div className={styles.trouve}>
            <p>
              <strong>« {signale.titre} »</strong> · {signale.courriel ?? "compte sans adresse"} ·{" "}
              <a href={`/lire/${signale.code}`} target="_blank" rel="noreferrer">
                Lire
              </a>
            </p>
            <form action={retirerPartage.bind(null, signale.projetId, "/admin")}>
              <button type="submit" className="btn btn--danger btn--petit">
                Retirer ce partage
              </button>
            </form>
          </div>
        ) : null}
      </section>

      <section className={styles.bloc} aria-labelledby="adm-comptes">
        <h2 id="adm-comptes">Comptes</h2>
        <div className={styles.table}>
          <table>
            <thead>
              <tr>
                <th scope="col">Adresse</th>
                <th scope="col">Inscription</th>
                <th scope="col">Dernière connexion</th>
                <th scope="col" className={styles.nb}>
                  Étoiles
                </th>
                <th scope="col" className={styles.nb}>
                  Projets
                </th>
                <th scope="col" className={styles.nb}>
                  Pass
                </th>
              </tr>
            </thead>
            <tbody>
              {t.comptes.map((c) => (
                <tr key={c.id}>
                  <th scope="row">
                    <Link href={`/admin/compte/${c.id}`}>{c.courriel}</Link>
                    {c.createur ? <span className={styles.marque}>vous</span> : null}
                    {!c.confirme ? <span className={styles.marque}>non confirmé</span> : null}
                  </th>
                  <td>{jour(c.inscritLe)}</td>
                  <td>{jour(c.connecteLe)}</td>
                  <td className={styles.nb}>{c.createur ? "—" : `${c.etoiles} ✦`}</td>
                  <td className={styles.nb}>{c.projets}</td>
                  <td className={styles.nb}>{c.pass}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
