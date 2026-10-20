import type { Metadata } from "next";
import Link from "next/link";
import { enEuros } from "@/domaine/offre";
import { codeDuLien, exigerLePorteur, partageDuLien, tableau } from "@/serveur/administration";
import { basculerLePaiement, chercherLePartage, retirerPartage } from "./actions";
import styles from "./admin.module.css";

export const metadata: Metadata = { title: "Administration" };

const jour = (iso: string | null) =>
  iso ? new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", year: "numeric", timeZone: "Europe/Paris" }).format(new Date(iso)) : "jamais";
const mois = () => new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric", timeZone: "Europe/Paris" }).format(new Date());
const nombre = (n: number, d = 2) => n.toLocaleString("fr-FR", { minimumFractionDigits: d, maximumFractionDigits: d });

const FAITS: Record<string, string> = {
  retire: "Le partage est retiré, et l’enseignant en est averti par courriel.",
  "retire-sans-courriel": "Le partage est retiré. Le courriel n’est pas parti : prévenez l’enseignant vous-même.",
  refus: "Rien n’a été fait.",
};

/**
 * L'administration du porteur (F14-AC22, AC23, AC25), sans maquette : une page de travail, dense
 * et sobre. Le mois en une ligne, l'interrupteur, un lien signalé à retirer, puis les comptes.
 */
export default async function Administration({ searchParams }: { searchParams: Promise<{ partage?: string; fait?: string }> }) {
  await exigerLePorteur();
  const [t, demande] = await Promise.all([tableau(), searchParams]);
  const signale = demande.partage && demande.partage !== "introuvable" && codeDuLien(demande.partage) ? await partageDuLien(demande.partage) : null;
  const fait = demande.fait ? FAITS[demande.fait] : null;

  return (
    <div className={`page ${styles.admin}`}>
      <header className="page-tete">
        <h1>Administration</h1>
      </header>
      {fait ? (
        <p className={styles.fait} role="status">
          {fait}
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
