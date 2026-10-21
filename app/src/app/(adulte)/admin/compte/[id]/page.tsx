import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Icone } from "@/composants/Icone";
import { estUuid } from "@/serveur/recit";
import { exigerLePorteur, ficheDuCompte } from "@/serveur/administration";
import { offrirEtoiles, offrirPass, retirerPartage } from "../../actions";
import { regrouperLesAides } from "@/domaine/etoiles";
import styles from "../../admin.module.css";
import { LignesDAides } from "./LignesDAides";

export const metadata: Metadata = { title: "Un compte — Administration" };

const jour = (iso: string | null) =>
  iso ? new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" }).format(new Date(iso)) : "jamais";

const MOTIFS: Record<string, string> = { bienvenue: "Offertes à l’inscription", aide: "Aide IA", pass: "Pass", recharge: "Recharge", cadeau: "Offertes par vous" };
const FAITS: Record<string, string> = {
  etoiles: "Les étoiles sont offertes.",
  pass: "Le pass est offert, avec ses étoiles.",
  retire: "Le partage est retiré, et l’enseignant en est averti par courriel.",
  "retire-sans-courriel": "Le partage est retiré. Le courriel n’est pas parti : prévenez l’enseignant vous-même.",
  refus: "Rien n’a été fait.",
};

/** La note d'un mouvement ; une session de Stripe se raccourcit, entière au survol, pour la chercher chez Stripe. */
function Note({ note }: { note: string | null }) {
  if (!note) return null;
  return note.startsWith("cs_") ? <span title={note}>Stripe · …{note.slice(-8)}</span> : <>{note}</>;
}

/** Un compte (F14-AC24, AC25) : offrir des étoiles ou un pass, retirer un partage, et l'histoire des étoiles. */
export default async function Compte({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ fait?: string }> }) {
  await exigerLePorteur();
  const [{ id }, { fait }] = await Promise.all([params, searchParams]);
  if (!estUuid(id)) notFound();
  const f = await ficheDuCompte(id);
  if (!f) notFound();
  const sansPass = f.projets.filter((p) => !p.pass);
  return (
    <div className={`page ${styles.admin}`}>
      <nav className="fil">
        <Link href="/admin">
          <Icone nom="fleche-g" />
          Retour à l’administration
        </Link>
      </nav>
      <header className="page-tete">
        <h1 className={styles.adresse}>{f.compte.courriel}</h1>
      </header>
      {fait && FAITS[fait] ? (
        <p className={styles.fait} role="status">
          {FAITS[fait]}
        </p>
      ) : null}
      <dl className={styles.chiffres}>
        <div>
          <dt>Inscription</dt>
          <dd>{jour(f.compte.inscritLe)}</dd>
        </div>
        <div>
          <dt>Dernière connexion</dt>
          <dd>{jour(f.compte.connecteLe)}</dd>
        </div>
        <div>
          <dt>Étoiles</dt>
          <dd>{f.compte.createur ? "—" : `${f.compte.etoiles} ✦`}</dd>
        </div>
      </dl>

      {f.compte.createur ? null : (
        <section className={styles.bloc} aria-labelledby="adm-offrir">
          <h2 id="adm-offrir">Offrir</h2>
          <form action={offrirEtoiles.bind(null, id)} className={styles.ligne}>
            <label className={styles.champ}>
              <span>Étoiles</span>
              <input name="nombre" type="number" min={1} max={10000} defaultValue={100} className="pchamp" required />
            </label>
            <label className={`${styles.champ} ${styles.large}`}>
              <span>Pourquoi, pour mémoire</span>
              <input name="note" type="text" maxLength={200} className="pchamp" placeholder="Essai en classe, geste commercial…" />
            </label>
            <button type="submit" className="btn">
              Offrir ces étoiles
            </button>
          </form>
          {sansPass.length ? (
            <form action={offrirPass.bind(null, id)} className={styles.ligne}>
              <label className={`${styles.champ} ${styles.large}`}>
                <span>Le pass d’un projet</span>
                <select name="projet" className="pchamp">
                  {sansPass.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.titre}
                    </option>
                  ))}
                </select>
              </label>
              <button type="submit" className="btn">
                Offrir ce pass
              </button>
            </form>
          ) : null}
        </section>
      )}

      <section className={styles.bloc} aria-labelledby="adm-projets">
        <h2 id="adm-projets">Projets</h2>
        {f.projets.length ? (
          <ul className={styles.liste}>
            {f.projets.map((p) => (
              <li key={p.id}>
                <span className={styles.titre}>{p.titre}</span>
                <span className={styles.note}>{p.pass ? `pass ${p.pass.origine === "cadeau" ? "offert" : "acheté"} le ${jour(p.pass.le)}` : "sans pass"}</span>
                {p.partage ? (
                  <span className={styles.partage}>
                    <a href={`/lire/${p.partage.code}`} target="_blank" rel="noreferrer">
                      Partagé
                    </a>
                    <form action={retirerPartage.bind(null, p.id, `/admin/compte/${id}`)}>
                      <button type="submit" className="btn btn--danger btn--petit">
                        Retirer ce partage
                      </button>
                    </form>
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className={styles.note}>Aucun projet.</p>
        )}
      </section>

      <section className={styles.bloc} aria-labelledby="adm-etoiles">
        <h2 id="adm-etoiles">Étoiles, du plus récent au plus ancien</h2>
        <div className={styles.table}>
          <table>
            <thead>
              <tr>
                <th scope="col">Quand</th>
                <th scope="col">Motif</th>
                <th scope="col" className={styles.nb}>
                  Étoiles
                </th>
                <th scope="col">Note</th>
              </tr>
            </thead>
            <tbody>
              {/* Les aides qui se suivent en une ligne, leur détail à déplier */}
              {regrouperLesAides(f.mouvements).map((l, i) =>
                l.sorte === "aides" ? (
                  <LignesDAides key={i} total={l.total} premiere={l.premiere} derniere={l.derniere} aides={l.aides} />
                ) : (
                  <tr key={i}>
                    <td>{jour(l.mouvement.quand)}</td>
                    <td>{MOTIFS[l.mouvement.motif] ?? l.mouvement.motif}</td>
                    <td className={styles.nb}>{l.mouvement.nombre > 0 ? `+${l.mouvement.nombre}` : l.mouvement.nombre}</td>
                    <td className={styles.note}>{l.mouvement.motif === "cadeau" || l.mouvement.motif === "recharge" ? <Note note={l.mouvement.note} /> : null}</td>
                  </tr>
                ),
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
