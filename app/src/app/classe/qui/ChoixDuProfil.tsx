"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Gommette } from "@/composants/Gommette";
import { Icone } from "@/composants/Icone";
import { entrer, quitter } from "../actions";
import styles from "./qui.module.css";

type Profil = { inscriptionId: string; prenom: string; couleur: number; affiche: string };

/** Prénoms en étiquettes de porte-manteau ; la place du code est réservée, la grille ne bouge pas. */
export function ChoixDuProfil({ classe, enseignant, profils }: { classe: string; enseignant: string; profils: Profil[] }) {
  const [choisi, setChoisi] = useState<Profil | null>(null);
  const [chiffres, setChiffres] = useState(["", "", "", ""]);
  const [erreur, setErreur] = useState<string | null>(null);
  const [quitterOuvert, setQuitterOuvert] = useState(false);
  const [enCours, lancer] = useTransition();
  const cases = useRef<(HTMLInputElement | null)[]>([]);
  const rester = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (choisi) cases.current[0]?.focus();
  }, [choisi]);
  useEffect(() => {
    if (quitterOuvert) rester.current?.focus();
  }, [quitterOuvert]);

  const choisir = (p: Profil | null) => {
    setChoisi(p);
    setChiffres(["", "", "", ""]);
    setErreur(null);
  };

  const valider = (code: string) => {
    if (!choisi || code.length !== 4 || enCours) return;
    lancer(async () => {
      const r = await entrer(choisi.inscriptionId, code);
      if (!r || r.ok) return;
      setChiffres(["", "", "", ""]);
      cases.current[0]?.focus();
      if (r.raison === "attente") {
        setErreur(`Trop d’essais. Attends ${r.minutes > 1 ? `${r.minutes === 2 ? "deux" : r.minutes} minutes` : "une minute"}, ou demande à ${enseignant}.`);
      } else if (r.raison === "faux") {
        setErreur(`Ce n’est pas le bon code. Essaie encore, ou demande à ${enseignant}.`);
      } else {
        setErreur(`Ton prénom n’est plus dans la liste. Demande à ${enseignant}.`);
      }
    });
  };

  const taper = (i: number, valeur: string) => {
    const propres = valeur.replace(/\D/g, "");
    if (!propres && valeur) return;
    const suivants = [...chiffres];
    // Un code collé ou tapé d'un trait remplit les cases à la suite
    propres.split("").slice(0, 4 - i).forEach((c, k) => { suivants[i + k] = c; });
    if (!propres) suivants[i] = "";
    setChiffres(suivants);
    setErreur(null);
    const prochain = Math.min(3, i + Math.max(1, propres.length));
    if (propres) cases.current[prochain]?.focus();
    if (suivants.every(Boolean) && propres) valider(suivants.join(""));
  };

  return (
    <main className={`page page--eleve ${styles.page}`}>
      <header className={styles.tete}>
        <div>
          <p className={styles.classe}>
            <Icone nom="eleves" />
            {classe}
          </p>
          <h1>Qui utilise cet ordinateur ?</h1>
        </div>
        <div className={styles.quitter}>
          <button type="button" className="btn btn--discret" aria-expanded={quitterOuvert} onClick={() => setQuitterOuvert(!quitterOuvert)}>
            Quitter la classe sur cet ordinateur
          </button>
          {quitterOuvert ? (
            <div className={styles.bulle} role="alertdialog" aria-labelledby="titre-quitter">
              <p>
                <b id="titre-quitter">Quitter la classe ?</b> Pour revenir, il faudra le mot de passe de la classe.
              </p>
              <div>
                <form action={quitter}>
                  <button type="submit" className="btn btn--petit">
                    Quitter
                  </button>
                </form>
                <button type="button" className="btn btn--petit btn--primaire" ref={rester} onClick={() => setQuitterOuvert(false)}>
                  Rester
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </header>

      <div className={styles.grille}>
        {profils.length ? (
          <ul className={styles.porteManteaux} aria-label="Élèves de la classe">
            {profils.map((p) => (
              <li key={p.inscriptionId}>
                <button
                  type="button"
                  className={`${styles.porteManteau} ${choisi?.inscriptionId === p.inscriptionId ? styles.choisi : ""}`}
                  aria-pressed={choisi?.inscriptionId === p.inscriptionId}
                  onClick={() => choisir(p)}
                >
                  <Gommette prenom={p.prenom} couleur={p.couleur} />
                  <span className={styles.nom}>{p.affiche}</span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className={styles.personne}>Aucun élève n’est encore inscrit dans cette classe. Demande à {enseignant}.</p>
        )}

        {choisi ? (
          <section className={styles.code} aria-labelledby="titre-code">
            <p className={styles.qui}>
              <Gommette prenom={choisi.prenom} couleur={choisi.couleur} taille="l" />
              <span className="main">{choisi.affiche}</span>
            </p>
            <h2 id="titre-code">Ton code secret</h2>
            <div className={styles.cases} role="group" aria-label="Code à quatre chiffres">
              {chiffres.map((c, i) => (
                <input
                  key={i}
                  ref={(el) => { cases.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  maxLength={4}
                  aria-label={`Chiffre ${i + 1}`}
                  aria-invalid={erreur ? true : undefined}
                  value={c}
                  onChange={(e) => taper(i, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Backspace" && !chiffres[i] && i > 0) cases.current[i - 1]?.focus();
                    if (e.key === "Enter") valider(chiffres.join(""));
                  }}
                />
              ))}
            </div>
            {erreur ? (
              <p className={styles.erreur} role="alert">
                <Icone nom="alerte" />
                <span>{erreur}</span>
              </p>
            ) : null}
            <button type="button" className="btn btn--primaire btn--grand btn--large" disabled={enCours || chiffres.some((c) => !c)} onClick={() => valider(chiffres.join(""))}>
              Entrer
              <Icone nom="fleche" />
            </button>
            <button type="button" className="lien" onClick={() => choisir(null)}>
              Ce n’est pas moi
            </button>
          </section>
        ) : (
          <section className={`${styles.code} ${styles.codeVide}`}>
            <p>
              <Icone nom="main" />
              Clique sur ton prénom.
            </p>
          </section>
        )}
      </div>
    </main>
  );
}
