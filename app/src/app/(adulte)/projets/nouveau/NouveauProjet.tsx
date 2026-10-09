"use client";

import { useEffect, useRef, useState, useTransition, type CSSProperties, type ReactNode } from "react";
import { Etapes } from "@/composants/Etapes";
import { Icone } from "@/composants/Icone";
import { couleurDe, initiales } from "@/domaine/eleves";
import { creerProjet } from "../actions";
import styles from "./nouveau.module.css";

type ClasseOfferte = { id: string; nom: string; annee: string; eleves: number };
type Qui = "classe" | "personnel";
type Recit = "choix" | "classique";

const Fichette = ({ x, y }: { x: number; y: number }) => (
  <>
    <rect x={x} y={y} width="34" height="24" rx="4" />
    <path className={styles.filet} d={`M${x + 5} ${y + 8}h24`} />
  </>
);

// Les choix sont dessinés avec les objets du système : des gommettes pour la classe,
// des fiches reliées pour le récit à choix, des fiches en ligne pour le récit classique.
const DESSINS: Record<Qui | Recit, ReactNode> = {
  classe: (
    <span className={styles.ronde}>
      {["Alice", "Bilal", "Chloé", "Dylan", "Emma", "Farah", "Gabin"].map((prenom, i) => (
        <span key={prenom} className="gommette" style={{ "--g": couleurDe(i) } as CSSProperties}>
          {initiales(prenom)}
        </span>
      ))}
    </span>
  ),
  personnel: (
    <span className={styles.ronde}>
      <span className="gommette" style={{ "--g": "#4A5157" } as CSSProperties}>
        <Icone nom="crayon" />
      </span>
    </span>
  ),
  choix: (
    <svg className={styles.plan} viewBox="0 0 190 84" aria-hidden="true">
      <path className={styles.trait} d="M36 42h18M54 42c12 0 10-26 24-26M54 42c12 0 10 26 24 26M112 16h20M112 68c14 0 8-26 20-26M112 16c14 0 8 26 20 26M112 68h20" />
      <Fichette x={2} y={30} />
      <Fichette x={78} y={4} />
      <Fichette x={78} y={56} />
      <Fichette x={132} y={4} />
      <Fichette x={132} y={30} />
      <Fichette x={132} y={56} />
    </svg>
  ),
  classique: (
    <svg className={styles.plan} viewBox="0 0 190 84" aria-hidden="true">
      <path className={styles.trait} d="M36 42h14M84 42h14M132 42h14" />
      <Fichette x={2} y={30} />
      <Fichette x={50} y={30} />
      <Fichette x={98} y={30} />
      <Fichette x={146} y={30} />
    </svg>
  ),
};

function Choix<T extends Qui | Recit>({
  groupe, valeur, choisi, titre, texte, onChoisir,
}: {
  groupe: string; valeur: T; choisi: boolean; titre: string; texte: string; onChoisir: (v: T) => void;
}) {
  return (
    <label className={styles.choix}>
      <input type="radio" name={groupe} value={valeur} checked={choisi} onChange={() => onChoisir(valeur)} />
      <span className={styles.dessin} aria-hidden="true">
        {DESSINS[valeur]}
      </span>
      <span className={styles.texte}>
        <b>{titre}</b>
        <span>{texte}</span>
      </span>
      <span className={styles.coche} aria-hidden="true">
        <Icone nom="coche" />
      </span>
    </label>
  );
}

export function NouveauProjet({ classes }: { classes: ClasseOfferte[] }) {
  const [etape, setEtape] = useState(1);
  const [qui, setQui] = useState<Qui | null>(null);
  const [recit, setRecit] = useState<Recit | null>(null);
  const [titre, setTitre] = useState("");
  // Une seule classe en cours : elle est proposée ; sinon « Choisir plus tard »
  const [classe, setClasse] = useState<string>(classes.length === 1 ? classes[0].id : "");
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, lancer] = useTransition();
  const question = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    question.current?.focus();
  }, [etape]);

  const creer = () => {
    if (!qui || !recit || enCours) return;
    setErreur(null);
    lancer(async () => {
      const resultat = await creerProjet({ organisation: qui, recit, titre, classeId: qui === "classe" && classe ? classe : null });
      if (resultat?.erreur) setErreur(resultat.erreur);
    });
  };

  return (
    <>
      <Etapes noms={["Qui écrit ?", "Quel récit ?", "Le titre"]} enCours={etape} />
      <section className="etape" aria-labelledby="question">
        <h2 id="question" tabIndex={-1} ref={question}>
          {etape === 1 ? "Qui écrit ?" : etape === 2 ? "Quel récit ?" : "Quel titre ?"}
        </h2>

        {etape === 1 ? (
          <>
            <div className={styles.grille} role="radiogroup" aria-labelledby="question">
              <Choix groupe="qui" valeur="classe" choisi={qui === "classe"} titre="Ma classe" texte="Les élèves écrivent les scènes. Vous préparez, relisez et validez." onChoisir={setQui} />
              <Choix groupe="qui" valeur="personnel" choisi={qui === "personnel"} titre="Moi" texte="Vous écrivez votre histoire, sans élèves." onChoisir={setQui} />
            </div>
            <p className={styles.fixe}>
              Ce choix ne se change pas ensuite. Avec une classe, vous préparez d’abord l’histoire sans les élèves : ils
              n’entrent que quand vous le décidez.
            </p>
          </>
        ) : null}

        {etape === 2 ? (
          <>
            <div className={styles.grille} role="radiogroup" aria-labelledby="question">
              <Choix groupe="recit" valeur="choix" choisi={recit === "choix"} titre="À choix" texte="Le lecteur choisit sa route, comme dans un livre dont on est le héros." onChoisir={setRecit} />
              <Choix groupe="recit" valeur="classique" choisi={recit === "classique"} titre="Classique" texte="L’histoire se lit du début à la fin, comme un roman." onChoisir={setRecit} />
            </div>
            <p className={styles.fixe}>Ce choix ne se change pas ensuite.</p>
          </>
        ) : null}

        {etape === 3 ? (
          <>
            <label className={styles.champ}>
              <span className="vh">Titre du projet</span>
              <input
                className={styles.titre}
                type="text"
                value={titre}
                maxLength={120}
                placeholder="Le titre de votre histoire"
                autoComplete="off"
                onChange={(e) => setTitre(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && titre.trim()) creer(); }}
              />
              <span className={styles.aide}>Vous pourrez le changer.</span>
            </label>
            {qui === "classe" ? (
              classes.length ? (
                <fieldset className={styles.classes}>
                  <legend>Classe</legend>
                  {classes.map((c) => (
                    <label key={c.id} className={styles.classe}>
                      <input type="radio" name="classe" value={c.id} checked={classe === c.id} onChange={() => setClasse(c.id)} />
                      <span>
                        <b>{c.nom}</b>
                        <span>
                          {c.annee} · {c.eleves ? `${c.eleves} élève${c.eleves > 1 ? "s" : ""}` : "aucun élève inscrit"}
                        </span>
                      </span>
                    </label>
                  ))}
                  <label className={styles.classe}>
                    <input type="radio" name="classe" value="" checked={classe === ""} onChange={() => setClasse("")} />
                    <span>
                      <b>Choisir plus tard</b>
                      <span>Vous préparez d’abord l’histoire.</span>
                    </span>
                  </label>
                </fieldset>
              ) : (
                <p className={styles.sansClasse}>
                  Vous n’avez pas encore de classe. Vous la créerez quand vos élèves commenceront à écrire.
                </p>
              )
            ) : null}
            <p className={styles.recap}>
              <span className="repere">{qui === "personnel" ? "Projet personnel" : "Projet de classe"}</span>
              <span className="repere">{recit === "classique" ? "Récit classique" : "Récit à choix"}</span>
              <span>ne se changent pas ensuite. {qui === "personnel" ? "Le titre, si." : "Le titre et la classe, si."}</span>
            </p>
            {erreur ? (
              <p className="erreur" role="alert">
                <Icone nom="alerte" />
                <span>{erreur}</span>
              </p>
            ) : null}
          </>
        ) : null}

        <footer className={styles.pied}>
          {etape > 1 ? (
            <button type="button" className="btn btn--grand" onClick={() => setEtape(etape - 1)}>
              Retour
            </button>
          ) : (
            <span />
          )}
          {etape < 3 ? (
            <button type="button" className="btn btn--primaire btn--grand" disabled={etape === 1 ? !qui : !recit} onClick={() => setEtape(etape + 1)}>
              Continuer
              <Icone nom="fleche" />
            </button>
          ) : (
            <button type="button" className="btn btn--primaire btn--grand" disabled={!titre.trim() || enCours} aria-busy={enCours || undefined} onClick={creer}>
              Créer le projet
            </button>
          )}
        </footer>
      </section>
    </>
  );
}
