"use client";

import { useState } from "react";
import { Icone } from "@/composants/Icone";
import { ETATS_PISTE, NOM_ETAT_PISTE, type EtatPiste, type Piste, type Rubrique } from "@/domaine/preparation";
import { ajouterPiste, changerPiste, supprimerPiste } from "../../actions-preparation";
import styles from "./preparation.module.css";

/**
 * Les pistes discutées d'une rubrique (F02, 30 septembre 2026) : l'enseignant note ce que
 * dit la classe et le statut de chaque idée. Ni collecte numérique ni vote : c'est sa saisie.
 */
export function Pistes({ projetId, rubrique, pistes, grand }: { projetId: string; rubrique: Rubrique; pistes: Piste[]; grand?: boolean }) {
  const [texte, setTexte] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);
  const ici = pistes.filter((p) => p.rubrique === rubrique);
  const vivantes = ici.filter((p) => p.etat !== "ecartee");
  const ecartees = ici.filter((p) => p.etat === "ecartee");

  const ajouter = async () => {
    if (!texte.trim() || enCours) return;
    setEnCours(true);
    const fait = await ajouterPiste(projetId, rubrique, texte);
    setEnCours(false);
    if (!fait.ok) return setErreur(fait.erreur);
    setErreur(null);
    setTexte("");
  };

  const ligne = (p: Piste) => (
    <li key={p.id} className={`${styles.piste} ${styles[`piste_${p.etat}`]}`}>
      <span className={styles.piste__texte}>{p.texte}</span>
      <label className={styles.piste__etat}>
        <span className="vh">Statut de « {p.texte} »</span>
        <select value={p.etat} onChange={(e) => void changerPiste(p.id, e.target.value as EtatPiste)}>
          {ETATS_PISTE.map((etat) => (
            <option key={etat} value={etat}>
              {NOM_ETAT_PISTE[etat]}
            </option>
          ))}
        </select>
      </label>
      <button type="button" className="btn btn--discret btn--petit" aria-label={`Supprimer l’idée « ${p.texte} »`} title="Supprimer cette idée" onClick={() => void supprimerPiste(p.id)}>
        <Icone nom="fermer" />
      </button>
    </li>
  );

  return (
    <div className={`${styles.pistes}${grand ? ` ${styles.pistes_grand}` : ""}`}>
      {vivantes.length ? <ul>{vivantes.map(ligne)}</ul> : null}
      <form
        className={styles.piste__ajout}
        onSubmit={(e) => {
          e.preventDefault();
          void ajouter();
        }}
      >
        <label className="vh" htmlFor={`piste-${rubrique}`}>
          Noter une idée
        </label>
        <input id={`piste-${rubrique}`} className="pchamp" type="text" maxLength={200} placeholder="Noter une idée" value={texte} onChange={(e) => setTexte(e.target.value)} />
        <button type="submit" className="btn btn--petit" disabled={!texte.trim() || enCours}>
          <Icone nom="plus" />
          Noter
        </button>
      </form>
      {erreur ? (
        <p className="erreur" role="alert">
          {erreur}
        </p>
      ) : null}
      {ecartees.length ? (
        <details className={styles.ecartees}>
          <summary>Pistes écartées · {ecartees.length}</summary>
          <ul>{ecartees.map(ligne)}</ul>
        </details>
      ) : null}
    </div>
  );
}
