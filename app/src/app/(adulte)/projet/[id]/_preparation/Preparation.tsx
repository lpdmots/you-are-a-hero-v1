"use client";

import Link from "next/link";
import { useState } from "react";
import { ChoisirImage, type ChoixImage } from "@/composants/ChoisirImage";
import { Icone } from "@/composants/Icone";
import { useMessage } from "@/composants/Messages";
import {
  estEtapeDeLHistoire, etapeFaite, etapesDe, ETAPES_FACULTATIVES, nomEtape, questionDeLEtape, type EtapePreparation, type Preparation,
} from "@/domaine/preparation";
import type { Partie, Plan } from "@/domaine/recit";
import { choisirRepere, restaurer, supprimer } from "../../actions-recit";
import { ReglagesPartie } from "../_plan/Panneaux";
import { AidePreparation } from "./AidePreparation";
import { EtapeHistoire, Question, type ProjetDuCarnet } from "./Etape";
import { RubriqueJeu } from "./RubriqueJeu";
import { RubriquePhrases } from "./RubriquePhrases";
import styles from "./preparation.module.css";

/**
 * La Préparation en étapes (F02, décision du 17 octobre 2026) : une ligne d'étapes comme au
 * Livre, un écran par étape. Rien n'est bloqué ; une étape de l'histoire est cochée quand
 * « Nous retenons » n'est pas vide. « Les choix » et « Le jeu » sont facultatives.
 */
export function PagePreparation({
  projet, preparation, plan, etape, onglet, aideMasquee, aideVue,
}: {
  projet: ProjetDuCarnet;
  preparation: Preparation;
  plan: Plan;
  etape: EtapePreparation;
  /** Dans l'étape Personnages, l'onglet ouvert : un héros ou les autres personnages */
  onglet?: string | null;
  aideMasquee: boolean;
  aideVue: boolean;
}) {
  const dire = useMessage();
  const deClasse = projet.organisation === "classe";
  const [aide, setAide] = useState(!aideMasquee && !aideVue);
  const [vue, setVue] = useState(aideVue);
  const [reglee, setReglee] = useState<{ id: string; image: boolean } | null>(null);
  const etapes = etapesDe(projet.recit);
  const rang = etapes.indexOf(etape);
  const suivante = etapes[rang + 1];
  const adresse = (x: EtapePreparation) => `/projet/${projet.id}/preparation?etape=${x}`;

  if (aide) {
    return (
      <AidePreparation
        deClasse={deClasse}
        aChoix={projet.recit === "choix"}
        dejaVue={vue}
        masquee={aideMasquee}
        onCommencer={() => {
          setVue(true);
          setAide(false);
        }}
      />
    );
  }

  const supprimerPartie = async (p: Partie) => {
    const fait = await supprimer("partie", p.id);
    if (!fait.ok) return dire({ texte: fait.erreur });
    dire({ texte: `« ${p.titre} » est supprimée. Vous la retrouvez dans la corbeille du projet, dans « Parties et chapitres ».`, annuler: () => void restaurer("partie", p.id) });
  };
  const choisirImage = async (id: string, choix: ChoixImage): Promise<string | null> => {
    if ("locale" in choix) return "Cette image n’a pas pu être importée.";
    const fait = await choisirRepere("partie", id, choix);
    return fait.ok ? null : fait.erreur;
  };
  const partieReglee = reglee ? plan.parties.find((p) => p.id === reglee.id) : undefined;

  return (
    <section className={styles.preparation} aria-label="Préparation">
      <nav className={`temps ${styles.ligne}`} aria-label="Étapes de la préparation">
        <ol>
          {etapes.map((x, i) => {
            const enCours = x === etape;
            const faite = estEtapeDeLHistoire(x) && etapeFaite(x, preparation, plan.parties.length);
            const facultative = ETAPES_FACULTATIVES.includes(x);
            return (
              <li key={x} className={`temps__etape${facultative ? ` ${styles.facultative}` : ""}${x === "choix" || (x === "jeu" && projet.recit !== "choix") ? ` ${styles.premiereFacultative}` : ""}`}>
                <Link href={adresse(x)} className={`temps__lien${enCours ? " est-en-cours" : ""}`} aria-current={enCours ? "step" : undefined}>
                  <span className={`temps__num${faite ? " temps__num--faite" : ""}${facultative ? ` ${styles.num_facultative}` : ""}`}>
                    {faite ? <Icone nom="coche" /> : i + 1}
                  </span>
                  <span className="temps__nom">{nomEtape(x, projet.recit)}</span>
                  <span className="vh">{faite ? " — fait" : facultative ? " — facultative" : ""}</span>
                </Link>
              </li>
            );
          })}
        </ol>
        <span className={styles.ligne__fin}>
          <button
            type="button"
            className="aide-bouton"
            title="Que fait-on ici ?"
            onClick={() => {
              setVue(true);
              setAide(true);
            }}
          >
            <Icone nom="aide" />
            Aide
          </button>
          {deClasse ? (
            <Link
              className="btn"
              href={`/atelier/${projet.id}/${estEtapeDeLHistoire(etape) ? etape : "univers"}`}
              // Devant la classe, tout l'écran (porteur, 18 octobre 2026) ; refusé par le navigateur, rien ne change
              onClick={() => void document.documentElement.requestFullscreen?.().catch(() => undefined)}
            >
              <Icone nom="oeil" />
              Projeter
            </Link>
          ) : null}
        </span>
      </nav>

      <div className={styles.page}>
        {estEtapeDeLHistoire(etape) ? (
          <EtapeHistoire
            key={`${etape}-${onglet ?? ""}`}
            projet={projet}
            etape={etape}
            onglet={onglet}
            preparation={preparation}
            plan={plan}
            parties={{ regler: (p) => setReglee({ id: p.id, image: false }), supprimer: (p) => void supprimerPartie(p) }}
          />
        ) : (
          <div className={styles.etape}>
            <Question question={questionDeLEtape(etape, projet.organisation, projet.recit)} />
            {etape === "choix" ? <RubriquePhrases projetId={projet.id} preparation={preparation} /> : <RubriqueJeu projet={projet} preparation={preparation} />}
          </div>
        )}

        <footer className={styles.pied}>
          {ETAPES_FACULTATIVES.includes(etape) ? <span className={styles.pied__note}>Étape facultative : elle peut attendre que l’histoire avance.</span> : <span />}
          {suivante ? (
            <Link className="btn btn--primaire" href={adresse(suivante)}>
              Étape suivante : {nomEtape(suivante, projet.recit)}
              {ETAPES_FACULTATIVES.includes(suivante) ? <span className={styles.pied__facultative}>(facultative)</span> : null}
              <Icone nom="fleche" />
            </Link>
          ) : (
            <Link className="btn btn--primaire" href={`/projet/${projet.id}/plan`}>
              Aller à Parties et chapitres
              <Icone nom="fleche" />
            </Link>
          )}
        </footer>
      </div>

      {partieReglee && reglee && !reglee.image ? (
        <ReglagesPartie key={partieReglee.id} partie={partieReglee} neuf={false} onImage={() => setReglee({ id: partieReglee.id, image: true })} onFermer={() => setReglee(null)} />
      ) : null}
      {partieReglee && reglee?.image ? (
        <ChoisirImage
          projetId={projet.id}
          actuel={partieReglee}
          pour={`de « ${partieReglee.titre} »`}
          onChoisir={(choix) => choisirImage(partieReglee.id, choix)}
          onFermer={() => setReglee({ id: partieReglee.id, image: false })}
        />
      ) : null}
    </section>
  );
}
