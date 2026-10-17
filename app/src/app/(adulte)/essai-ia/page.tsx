import type { Metadata } from "next";
import Link from "next/link";
import { DOLLARS_PAR_EURO, NOMS_DES_AIDES, type AideTexte } from "@/domaine/aides-ia";
import { exigerEnseignant } from "@/serveur/adulte";
import { bilans, casAffiches, exigerEnLocal, type Bilan } from "./donnees";
import { Jugement } from "./Jugement";
import styles from "./essai.module.css";

export const metadata: Metadata = { title: "Essai des aides IA" };
export const dynamic = "force-dynamic";

/**
 * L'essai de qualité V17, à l'aveugle (étape 8, lot 1) : en local seulement. Le porteur note
 * chaque proposition sans savoir de quel modèle elle vient, puis choisit le fournisseur des
 * textes sur les résultats, révélés à sa demande.
 */
export default async function EssaiIa({ searchParams }: { searchParams: Promise<{ resultats?: string }> }) {
  exigerEnLocal();
  await exigerEnseignant();
  const { resultats } = await searchParams;
  const cas = casAffiches();

  if (!cas.length) {
    return (
      <div className="page">
        <header className="page-tete">
          <h1>Essai des aides IA</h1>
        </header>
        <p className={styles.vide}>Aucune proposition pour l’instant : l’essai se lance par « npm run ia:essai ».</p>
      </div>
    );
  }

  if (resultats) {
    const b = bilans();
    return (
      <div className="page">
        <header className="page-tete">
          <h1>Résultats de l’essai</h1>
          <div className="page-tete__cmd">
            <Link className="btn" href="/essai-ia">Retour au jugement</Link>
          </div>
        </header>
        <p className={styles.depense}>
          Dépense de l’essai : {nombre(b.depense, 2)} $, environ {nombre(b.depense / DOLLARS_PAR_EURO, 2)} €. Points par cas noté :
          bonne 2, passable 1, à écarter 0, et 1 de plus pour la meilleure.
        </p>
        <TableBilan titre="Toutes les aides" lignes={b.total} />
        {b.parAide.map((a) => <TableBilan key={a.aide} titre={NOMS_DES_AIDES[a.aide as AideTexte]} lignes={a.lignes} replie />)}
      </div>
    );
  }

  return <Jugement cas={cas} />;
}

const nombre = (n: number, decimales: number) => n.toLocaleString("fr-FR", { minimumFractionDigits: decimales, maximumFractionDigits: decimales });

function TableBilan({ titre, lignes, replie = false }: { titre: string; lignes: Bilan[]; replie?: boolean }) {
  const table = lignes.length ? (
    <div className={styles.defile}>
        <table>
          <thead>
            <tr>
              <th scope="col">Modèle</th>
              <th scope="col">Points</th>
              <th scope="col">Cas notés</th>
              <th scope="col">Meilleure</th>
              <th scope="col">Bonne</th>
              <th scope="col">Passable</th>
              <th scope="col">À écarter</th>
              <th scope="col">Échec</th>
              <th scope="col">Coût moyen par appel</th>
              <th scope="col">Durée moyenne</th>
            </tr>
          </thead>
          <tbody>
            {lignes.map((l) => (
              <tr key={l.modele}>
                <th scope="row">
                  {l.nom} <span className={styles.fournisseur}>{l.fournisseur}</span>
                </th>
                <td>{l.notes ? nombre(l.points, 1) : "—"}</td>
                <td>{l.notes} sur {l.cas}</td>
                <td>{l.meilleures}</td>
                <td>{l.bonnes}</td>
                <td>{l.passables}</td>
                <td>{l.ecartees}</td>
                <td>{l.echecs}</td>
                <td>{nombre(l.coutMoyen / DOLLARS_PAR_EURO, 4)} €</td>
                <td>{nombre(l.dureeMoyenne / 1000, 1)} s</td>
              </tr>
            ))}
          </tbody>
        </table>
    </div>
  ) : (
    <p className={styles.nonLance}>Aucun modèle lancé pour cette aide.</p>
  );
  return replie ? (
    <details className={styles.bilan}>
      <summary>{titre}</summary>
      {table}
    </details>
  ) : (
    <section className={styles.bilan}>
      <h2>{titre}</h2>
      {table}
    </section>
  );
}
