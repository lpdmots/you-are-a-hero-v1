import type { Metadata } from "next";
import Link from "next/link";
import { BoutonEnvoi } from "@/composants/Attente";
import { Icone } from "@/composants/Icone";
import { estAge, NOMS_DES_AGES } from "@/domaine/aides-ia";
import { NOMS_DES_MOTIFS } from "@/domaine/bibliotheque";
import { exigerLePorteur } from "@/serveur/administration";
import { livresARelire, MOTIFS_DE_REFUS, type LivreARelire } from "@/serveur/relecture-des-livres";
import { classerSignalement, publierLeLivre, refuserLeLivre, relancerLAnalyse, retirerLeLivre } from "./actions";
import { livresPubliesPourLePorteur, MOTIFS_DE_SIGNALEMENT, signalementsATraiter } from "@/serveur/signalements";
import styles from "../admin.module.css";

export const metadata: Metadata = { title: "Bibliothèque — Administration" };

const FAITS: Record<string, string> = {
  publie: "Le livre est publié, et l’adulte en est averti par courriel.",
  "publie-sans-courriel": "Le livre est publié. Le courriel n’est pas parti : prévenez l’adulte vous-même.",
  refuse: "La proposition est refusée, et l’adulte a reçu le motif par courriel.",
  "refuse-sans-courriel": "La proposition est refusée. Le courriel n’est pas parti : prévenez l’adulte vous-même.",
  retire: "Le livre a quitté la bibliothèque, et l’adulte a reçu le motif par courriel.",
  "retire-sans-courriel": "Le livre a quitté la bibliothèque. Le courriel n’est pas parti : prévenez l’adulte vous-même.",
  classe: "Le signalement est classé ; le livre reste publié.",
};
const REFUS: Record<string, string> = {
  refus: "Rien n’a été fait : la proposition a peut-être changé entre-temps.",
  "sans-motif": "Choisissez un motif ou écrivez-le avant de refuser.",
  "sans-motif-retrait": "Écrivez le motif du retrait : l’adulte le reçoit.",
};

const jour = (iso: string) => new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" }).format(new Date(iso));
/** « P12 » : « Passage 12 » ; « S7 » : « Scène 7 » ; « I3 » : « Image 3 » ; « livre » : ce qui est autour des passages. */
const nomDuRepere = (r: string) =>
  r === "livre" ? "Autour des passages" : `${{ P: "Passage", S: "Scène", I: "Image" }[r[0] as "P" | "S" | "I"] ?? r} ${r.slice(1)}`;
const dollars = (n: number) => `${n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 3 })} $`;

/**
 * La file « Bibliothèque » de l'administration (F15, « La file de relecture »), sur le modèle de la
 * bibliothèque d'images : pour chaque livre, ce qui permet de juger sans lire le livre entier —
 * le rapport de l'IA, chaque point ouvrant son passage, les passages changés d'une mise à jour,
 * la présentation — puis « Publier » ou « Refuser » avec un motif. Pas de tri sur la qualité.
 */
export default async function FileDesLivres({ searchParams }: { searchParams: Promise<{ fait?: string }> }) {
  await exigerLePorteur();
  const [{ fait }, livres, signalements, publies] = await Promise.all([searchParams, livresARelire(), signalementsATraiter(), livresPubliesPourLePorteur()]);
  const message = fait ? FAITS[fait] : null;
  const refus = fait ? REFUS[fait] : null;
  return (
    <div className={`page ${styles.admin}`}>
      <nav className="fil">
        <Link href="/admin">
          <Icone nom="fleche-g" />
          Retour à l’administration
        </Link>
      </nav>
      <header className="page-tete">
        <h1>Bibliothèque</h1>
      </header>
      {message ? (
        <p className={styles.fait} role="status">
          {message}
        </p>
      ) : null}
      {refus ? (
        <p className={`${styles.fait} ${styles.refus}`} role="alert">
          {refus}
        </p>
      ) : null}

      {/* Les signalements d'abord : un livre publié peut gêner tant qu'ils attendent (F15-AC14) */}
      {signalements.length ? (
        <section aria-labelledby="livres-signales" className={styles.fileLivres}>
          <h2 id="livres-signales">Signalements ({signalements.length})</h2>
          {signalements.map((x) => (
            <article key={x.id} className={`${styles.bloc} ${styles.livreAJuger}`} aria-label={`Signalement de « ${x.titre} »`}>
              <header className={styles.livreTete}>
                <h3>{x.titre}</h3>
                <span className={styles.marque}>{MOTIFS_DE_SIGNALEMENT[x.motif]}</span>
                <p className={styles.note}>
                  {x.courriel} · le {jour(x.recuLe)}
                  {x.passage ? ` · passage ${x.passage}` : ""}
                </p>
                {x.publie ? (
                  <a className="lien" href={`/bibliotheque/${x.adresse}`} target="_blank" rel="noreferrer">
                    Ouvrir le livre
                  </a>
                ) : null}
              </header>
              <p className={styles.presentation}>{x.message}</p>
              <div className={styles.decision}>
                {x.publie ? <Retirer projetId={x.projetId} /> : null}
                <form action={classerSignalement.bind(null, x.id)}>
                  <BoutonEnvoi className="lien">{x.publie ? "Classer, le livre reste publié" : "Classer"}</BoutonEnvoi>
                </form>
              </div>
            </article>
          ))}
        </section>
      ) : null}

      <section aria-labelledby="livres-relire" className={styles.fileLivres}>
        <h2 id="livres-relire">À relire ({livres.length})</h2>
        {livres.length ? (
          livres.map((l) => <LivreAJuger key={l.projetId} l={l} />)
        ) : (
          <p className={styles.note}>Aucun livre à relire.</p>
        )}
      </section>

      <section aria-labelledby="livres-publies" className={styles.bloc}>
        <h2 id="livres-publies">Dans la bibliothèque ({publies.length})</h2>
        {publies.length ? (
          <ul className={styles.liste}>
            {publies.map((l) => (
              <li key={l.projetId} id={`publie-${l.projetId}`}>
                <a className={styles.titre} href={`/bibliotheque/${l.adresse}`} target="_blank" rel="noreferrer">
                  {l.titre}
                </a>
                <span className={styles.note}>
                  {l.courriel ?? "compte sans adresse"} · publié le {jour(l.publieLe)}
                  {l.coeurs ? ` · ${l.coeurs} cœur${l.coeurs > 1 ? "s" : ""}` : ""}
                </span>
                <Retirer projetId={l.projetId} />
              </li>
            ))}
          </ul>
        ) : (
          <p className={styles.note}>Aucun livre publié.</p>
        )}
      </section>
    </div>
  );
}

function LivreAJuger({ l }: { l: LivreARelire }) {
  const lire = (passage?: string | null) => `/admin/livres/${l.projetId}/lire${passage ? `?passage=${passage}` : ""}`;
  return (
    <article className={`${styles.bloc} ${styles.livreAJuger}`} id={`livre-${l.projetId}`} aria-labelledby={`t-${l.projetId}`}>
      <header className={styles.livreTete}>
        <h3 id={`t-${l.projetId}`}>{l.titre}</h3>
        <span className={styles.marque}>{l.miseAJour ? "Mise à jour" : "Première proposition"}</span>
        <p className={styles.note}>
          {l.courriel ?? "compte sans adresse"} · le {jour(l.proposeLe)} · {estAge(l.age) ? NOMS_DES_AGES[l.age] : l.age} ·{" "}
          {l.attestation === "classe" ? "autorisation des familles attestée" : "auteur, droits des images attestés"}
        </p>
        <a className="lien" href={lire()} target="_blank" rel="noreferrer">
          Lire le livre
        </a>
      </header>

      <section className={styles.rapport} aria-label="Rapport de l’IA">
        <h4>Rapport de l’IA</h4>
        {l.rapport.etat === "fait" ? (
          l.rapport.points.length ? (
            <ol className={styles.points}>
              {l.rapport.points.map((p, i) => (
                <li key={i}>
                  <span className={styles.pointTete}>
                    {p.passage ? (
                      <a className="lien" href={lire(p.passage)} target="_blank" rel="noreferrer">
                        {nomDuRepere(p.repere)}
                      </a>
                    ) : (
                      <b>{nomDuRepere(p.repere)}</b>
                    )}
                    <span className={styles.motif}>{NOMS_DES_MOTIFS[p.motif]}</span>
                  </span>
                  <q className={styles.citation}>{p.phrase}</q>
                  {p.explication ? <span className={styles.note}>{p.explication}</span> : null}
                </li>
              ))}
            </ol>
          ) : (
            <p className={styles.rienASignaler}>
              <Icone nom="coche" />
              Rien à signaler.
            </p>
          )
        ) : l.rapport.etat === "en_cours" ? (
          <p className={styles.note}>
            <Icone nom="sablier" /> Analyse en cours… rechargez la page dans une minute.
          </p>
        ) : (
          <form action={relancerLAnalyse.bind(null, l.projetId)} className={styles.ligne}>
            <span className={styles.note}>{l.rapport.etat === "echec" ? "L’analyse n’a pas abouti." : "Pas encore d’analyse."}</span>
            <BoutonEnvoi className="btn btn--petit">{l.rapport.etat === "echec" ? "Relancer l’analyse" : "Analyser"}</BoutonEnvoi>
          </form>
        )}
        {l.rapport.lu || l.rapport.coutUsd !== null ? (
          <p className={styles.note}>
            {l.rapport.lu ? `Lu : ${l.rapport.lu.passages} passage${l.rapport.lu.passages > 1 ? "s" : ""}, ${l.rapport.lu.images} image${l.rapport.lu.images > 1 ? "s" : ""}` : ""}
            {l.rapport.lu && l.rapport.coutUsd !== null ? " · " : ""}
            {l.rapport.coutUsd !== null ? dollars(l.rapport.coutUsd) : ""}
          </p>
        ) : null}
      </section>

      {l.miseAJour ? (
        <section aria-label="Passages changés">
          <h4>Passages changés</h4>
          {l.changes.length ? (
            <ul className={styles.changes}>
              {l.changes.map((c) => (
                <li key={c.id}>
                  {c.sorte === "retire" ? (
                    <span className={styles.note}>{c.repere} retiré</span>
                  ) : (
                    <a className="lien" href={lire(c.id)} target="_blank" rel="noreferrer">
                      {c.repere}
                      {c.sorte === "ajoute" ? " (nouveau)" : ""}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          ) : l.couvertureChangee ? (
            <p className={styles.note}>Seule la couverture a changé.</p>
          ) : (
            <p className={styles.note}>Aucun passage ne change ; la mise à jour touche la présentation ou les pages autour.</p>
          )}
          {l.changes.length && l.couvertureChangee ? <p className={styles.note}>La couverture a changé aussi.</p> : null}
        </section>
      ) : null}

      <section aria-label="Présentation">
        <h4>Présentation</h4>
        <p className={styles.presentation}>{l.presentation}</p>
        {l.presentationAvant ? <p className={styles.note}>Avant : {l.presentationAvant}</p> : null}
      </section>

      <div className={styles.decision}>
        <form action={publierLeLivre.bind(null, l.projetId)}>
          <BoutonEnvoi className="btn">{l.miseAJour ? "Publier la mise à jour" : "Publier"}</BoutonEnvoi>
        </form>
        <details className={styles.refuser}>
          <summary className="lien">Refuser…</summary>
          <form action={refuserLeLivre.bind(null, l.projetId)} className={styles.formRefus}>
            <fieldset>
              <legend>Motif, envoyé à l’adulte</legend>
              {MOTIFS_DE_REFUS.map((m, i) => (
                <label key={m}>
                  <input type="radio" name="motif" value={m} defaultChecked={i === 0} />
                  {m}
                </label>
              ))}
            </fieldset>
            <label className={styles.champ}>
              <span>Précision de votre main</span>
              <textarea name="precision" rows={3} className="pchamp" maxLength={1500} placeholder="Le passage 17 nomme une enseignante réelle et se moque d’elle." />
            </label>
            <BoutonEnvoi className="btn btn--danger btn--petit">Refuser et envoyer le motif</BoutonEnvoi>
          </form>
        </details>
      </div>
    </article>
  );
}

/** Retirer un livre, motif envoyé à l'adulte (F15-AC10) : replié derrière « Retirer de la bibliothèque… ». */
function Retirer({ projetId }: { projetId: string }) {
  return (
    <details className={styles.refuser}>
      <summary className="lien lien--danger">Retirer de la bibliothèque…</summary>
      <form action={retirerLeLivre.bind(null, projetId)} className={styles.formRefus}>
        <label className={styles.champ}>
          <span>Motif, envoyé à l’adulte</span>
          <textarea name="motif" rows={3} className="pchamp" maxLength={1500} required placeholder="Le passage 17 se moque d’une enseignante réelle." />
        </label>
        <BoutonEnvoi className="btn btn--danger btn--petit">Retirer et envoyer le motif</BoutonEnvoi>
      </form>
    </details>
  );
}
