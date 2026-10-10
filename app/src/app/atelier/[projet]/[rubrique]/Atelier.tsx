"use client";

import Link from "next/link";
import { useState } from "react";
import { useEnregistrement } from "@/composants/Enregistrement";
import { Icone } from "@/composants/Icone";
import { useMessage } from "@/composants/Messages";
import { guidage, NOM_RUBRIQUE, RUBRIQUES, titreSynthese, type Preparation, type Rubrique, type RubriqueTexte } from "@/domaine/preparation";
import type { Plan } from "@/domaine/recit";
import { ecrireRubrique } from "@/app/(adulte)/projet/actions-preparation";
import { creerPartie } from "@/app/(adulte)/projet/actions-recit";
import type { ProjetDuCarnet } from "@/app/(adulte)/projet/[id]/_preparation/Carnet";
import { Pistes } from "@/app/(adulte)/projet/[id]/_preparation/Pistes";
import styles from "@/app/(adulte)/projet/[id]/_preparation/preparation.module.css";

/**
 * Une étape de l'atelier projeté : la question, lisible à distance, les idées de la classe
 * notées par l'enseignant, et ce que la classe retient. La progression est conseillée, pas
 * imposée : on passe d'une étape à l'autre comme on veut (F02-AC13).
 */
export function Atelier({ projet, rubrique, preparation, plan }: { projet: ProjetDuCarnet; rubrique: Rubrique; preparation: Preparation; plan: Plan }) {
  const rang = RUBRIQUES.indexOf(rubrique);
  const suivante = RUBRIQUES[rang + 1];
  const guide = guidage(rubrique, projet.organisation, projet.recit);
  return (
    <div className={styles.atelier}>
      <header className={styles.barre}>
        <p className={styles.barre__titre}>{projet.titre}</p>
        <nav className={styles.etapes} aria-label="Étapes de l’atelier">
          {RUBRIQUES.map((r, i) => (
            <Link key={r} href={`/atelier/${projet.id}/${r}`} aria-current={r === rubrique ? "step" : undefined}>
              <span>{i + 1}</span>
              {NOM_RUBRIQUE[r]}
            </Link>
          ))}
        </nav>
        <Link className="btn btn--petit" href={`/projet/${projet.id}/preparation`}>
          <Icone nom="fermer" />
          Quitter la projection
        </Link>
      </header>
      <main className={styles.grille}>
        <section className={styles.questionGrande}>
          <p className={styles.num}>
            Étape {rang + 1} sur {RUBRIQUES.length} · {NOM_RUBRIQUE[rubrique]}
          </p>
          <h1>{guide.question}</h1>
          <details className={styles.relances}>
            <summary>Relances pour la classe</summary>
            <ul>
              {guide.relances.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          </details>
          <div className={styles.idees}>
            <p className={styles.idees__titre}>Idées de la classe</p>
            <Pistes projetId={projet.id} rubrique={rubrique} pistes={preparation.pistes} grand />
          </div>
        </section>
        {rubrique === "etapes" ? <PlanRetenu projet={projet} plan={plan} /> : <TexteRetenu projet={projet} rubrique={rubrique} depart={preparation[rubrique]} />}
      </main>
      <footer className={styles.pied}>
        <span>Ce que vous écrivez ici se retrouve dans le carnet.</span>
        {suivante ? (
          <Link href={`/atelier/${projet.id}/${suivante}`}>
            Étape suivante : {NOM_RUBRIQUE[suivante]}
            <Icone nom="fleche" />
          </Link>
        ) : (
          <Link href={`/projet/${projet.id}/preparation`}>
            Retour au carnet
            <Icone nom="fleche" />
          </Link>
        )}
      </footer>
    </div>
  );
}

function TexteRetenu({ projet, rubrique, depart }: { projet: ProjetDuCarnet; rubrique: RubriqueTexte; depart: string }) {
  const [texte, setTexte] = useState(depart);
  const e = useEnregistrement();
  return (
    <section className={styles.retenu} aria-labelledby="retenons">
      <h2 id="retenons">
        <label htmlFor="retenu">{titreSynthese(projet.organisation)}</label>
      </h2>
      <textarea
        id="retenu"
        className="pchamp"
        maxLength={6000}
        value={texte}
        onChange={(ev) => {
          setTexte(ev.target.value);
          e.prevoir(() => ecrireRubrique(projet.id, rubrique, ev.target.value));
        }}
        onBlur={() => void e.partir()}
      />
      <p className={styles.retenu__etat} role="status">
        {e.enCours ? "Enregistrement…" : e.erreur ? e.erreur : e.enregistre ? "Enregistré dans le carnet" : ""}
      </p>
    </section>
  );
}

/** « Grandes étapes » : ce que la classe retient devient le plan, partie par partie (F02-AC08). */
function PlanRetenu({ projet, plan }: { projet: ProjetDuCarnet; plan: Plan }) {
  const dire = useMessage();
  const [titre, setTitre] = useState("");
  const [enCours, setEnCours] = useState(false);
  const ajouter = async () => {
    if (!titre.trim() || enCours) return;
    setEnCours(true);
    const fait = await creerPartie(projet.id, titre);
    setEnCours(false);
    if (!fait.ok) return dire({ texte: fait.erreur });
    setTitre("");
  };
  return (
    <section className={styles.retenu} aria-labelledby="retenons">
      <h2 id="retenons">{titreSynthese(projet.organisation)}</h2>
      {plan.parties.length ? (
        <ol className={styles.atelierPlan}>
          {plan.parties.map((p) => (
            <li key={p.id}>
              {p.titre}
              <span>{p.chapitres.map((c) => c.titre).join(" · ")}</span>
            </li>
          ))}
        </ol>
      ) : null}
      <form
        className={styles.atelierAjout}
        onSubmit={(ev) => {
          ev.preventDefault();
          void ajouter();
        }}
      >
        <label className="vh" htmlFor="partie-retenue">
          Nouvelle partie
        </label>
        <input id="partie-retenue" className="pchamp" type="text" maxLength={120} placeholder="Une partie de l’histoire" value={titre} onChange={(ev) => setTitre(ev.target.value)} />
        <button type="submit" className="btn btn--primaire" disabled={!titre.trim() || enCours} aria-busy={enCours || undefined}>
          <Icone nom="plus" />
          Ajouter
        </button>
      </form>
    </section>
  );
}
