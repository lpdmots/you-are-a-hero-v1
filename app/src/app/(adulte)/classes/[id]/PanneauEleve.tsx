"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Gommette } from "@/composants/Gommette";
import { Icone } from "@/composants/Icone";
import { useMessage } from "@/composants/Messages";
import { Panneau, PiedFermer } from "@/composants/Panneau";
import { chiffresEspaces, codeValide } from "@/domaine/acces";
import { libelleAnnee } from "@/domaine/annee";
import { de } from "@/domaine/texte";
import type { Classe, EleveInscrit } from "@/serveur/lectures";
import { changerCode, modifierEleve, proposerCode, voirCode } from "../actions";
import styles from "../classes.module.css";

/**
 * Fiche d'un élève : c'est l'écran du code oublié (F06-AC69). Elle ne montre que son
 * code, pas ceux des autres (F06-AC71).
 */
export function PanneauEleve({
  classe, eleve, onFermer, onCodeChange, onRetirer,
}: {
  classe: Classe;
  eleve: EleveInscrit;
  onFermer: () => void;
  onCodeChange: (code: string) => void;
  onRetirer: () => void;
}) {
  const routeur = useRouter();
  const dire = useMessage();
  const [, lancer] = useTransition();
  const [code, setCode] = useState<string | null>(null);
  const [neuf, setNeuf] = useState<string | null>(null);
  const [erreurCode, setErreurCode] = useState(false);
  const [prenom, setPrenom] = useState(eleve.prenom);
  const [nom, setNom] = useState(eleve.nom ?? "");
  const [erreurNom, setErreurNom] = useState<string | null>(null);
  const [enregistre, setEnregistre] = useState(false);

  useEffect(() => {
    let actif = true;
    voirCode(classe.id, eleve.id).then((r) => {
      if (actif && r.ok) setCode(r.code);
    });
    return () => {
      actif = false;
    };
  }, [classe.id, eleve.id]);

  const proposer = () =>
    lancer(async () => {
      setErreurCode(false);
      setNeuf(await proposerCode());
    });

  const enregistrerCode = () => {
    if (!neuf || !codeValide(neuf)) {
      setErreurCode(true);
      return;
    }
    lancer(async () => {
      const r = await changerCode(classe.id, eleve.id, neuf);
      if (!r.ok) {
        setErreurCode(true);
        return;
      }
      setCode(neuf);
      onCodeChange(neuf);
      setNeuf(null);
      setEnregistre(true);
      dire({ texte: `Le code ${de(eleve.prenom)} est changé. Pensez à réimprimer son étiquette.` });
    });
  };

  const enregistrerNom = () => {
    if (prenom.trim() === eleve.prenom && nom.trim() === (eleve.nom ?? "")) return;
    lancer(async () => {
      const r = await modifierEleve(classe.id, eleve.id, prenom, nom);
      if (!r.ok) {
        setErreurNom(r.erreur);
        return;
      }
      setErreurNom(null);
      setEnregistre(true);
      routeur.refresh();
    });
  };

  return (
    <Panneau
      titre={
        <span className={styles.qui}>
          <Gommette prenom={prenom || eleve.prenom} couleur={eleve.couleur} taille="l" />
          <span>{prenom || eleve.prenom}</span>
        </span>
      }
      sous={`${classe.nom} · ${libelleAnnee(classe.anneeDebut)}`}
      onFermer={onFermer}
      pied={<PiedFermer enregistre={enregistre} onFermer={onFermer} />}
    >
      <section>
        <h3>{neuf !== null ? <label htmlFor="code-neuf">Nouveau code</label> : "Son code"}</h3>
        {neuf !== null ? (
          <div className={styles.changement}>
            <input
              className="pchamp"
              id="code-neuf"
              inputMode="numeric"
              maxLength={4}
              value={neuf}
              aria-describedby="code-neuf-aide"
              aria-invalid={erreurCode ? true : undefined}
              onChange={(e) => { setNeuf(e.target.value.replace(/\D/g, "")); setErreurCode(false); }}
              onKeyDown={(e) => { if (e.key === "Enter") enregistrerCode(); }}
              autoFocus
            />
            <p id="code-neuf-aide">
              Code proposé : vous pouvez en taper un autre.{code ? ` L’ancien, ${code}, ne marchera plus.` : ""}
            </p>
            {erreurCode ? (
              <p className="erreur" role="alert">
                <Icone nom="alerte" />
                Un code a quatre chiffres.
              </p>
            ) : null}
            <div className={styles.rang}>
              <button type="button" className="btn btn--primaire" onClick={enregistrerCode}>
                Enregistrer ce code
              </button>
              <button type="button" className="btn" onClick={() => setNeuf(null)}>
                Annuler
              </button>
            </div>
          </div>
        ) : (
          <>
            <p className={styles.codeGrand} aria-label={code ? `Code : ${chiffresEspaces(code)}` : "Code en cours de lecture"}>
              {code ? chiffresEspaces(code) : "· · · ·"}
            </p>
            <div className={styles.rang}>
              <button type="button" className="btn" onClick={proposer}>
                Changer le code
              </button>
              <Link className="btn" href={`/classes/${classe.id}/imprimer?qui=${eleve.id}`}>
                <Icone nom="imprimer" />
                Imprimer son étiquette
              </Link>
            </div>
          </>
        )}
      </section>
      <section>
        <h3>
          <label htmlFor="eleve-prenom">Prénom</label>
        </h3>
        <input className="pchamp" id="eleve-prenom" type="text" value={prenom} maxLength={40} onChange={(e) => { setPrenom(e.target.value); setEnregistre(false); }} onBlur={enregistrerNom} />
        <h3 className={styles.champSuivant}>
          <label htmlFor="eleve-nom">Nom</label> <span className="facultatif">facultatif</span>
        </h3>
        <input className="pchamp" id="eleve-nom" type="text" value={nom} maxLength={60} onChange={(e) => { setNom(e.target.value); setEnregistre(false); }} onBlur={enregistrerNom} />
        {erreurNom ? (
          <p className="erreur" role="alert">
            <Icone nom="alerte" />
            <span>{erreurNom}</span>
          </p>
        ) : null}
        <p>Les élèves ne voient que le prénom, et l’initiale du nom si deux élèves portent le même.</p>
      </section>
      <section>
        <button type="button" className="btn btn--danger" onClick={onRetirer}>
          Retirer de la classe
        </button>
      </section>
    </Panneau>
  );
}
