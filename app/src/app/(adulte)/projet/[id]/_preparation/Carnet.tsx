"use client";

import Link from "next/link";
import { useState, type CSSProperties } from "react";
import { ChoisirImage, type ChoixImage } from "@/composants/ChoisirImage";
import { useEnregistrement } from "@/composants/Enregistrement";
import { Icone } from "@/composants/Icone";
import { Menu } from "@/composants/Menu";
import { useMessage } from "@/composants/Messages";
import { guidage, introCarnet, NOM_RUBRIQUE, titreSynthese, type Preparation, type RubriqueTexte } from "@/domaine/preparation";
import type { Organisation, Recit } from "@/domaine/projets";
import { chapitresDe, couleurDeChapitre, type Plan } from "@/domaine/recit";
import { ecrireRubrique } from "../../actions-preparation";
import { choisirRepere, creerPartie, restaurer, supprimer } from "../../actions-recit";
import { ReglagesChapitre, ReglagesPartie } from "../_plan/Panneaux";
import { AidePreparation } from "./AidePreparation";
import { Pistes } from "./Pistes";
import { RubriqueJeu } from "./RubriqueJeu";
import { RubriquePhrases } from "./RubriquePhrases";
import styles from "./preparation.module.css";

export type ProjetDuCarnet = { id: string; titre: string; organisation: Organisation; recit: Recit };

type Ouvert =
  | { sorte: "partie" | "chapitre"; id: string; neuf: boolean }
  | { sorte: "image"; pour: "partie" | "chapitre"; id: string }
  | null;

/**
 * Carnet de préparation (F02) : quatre rubriques souples, remplies dans l'ordre qu'on veut.
 * « Grandes étapes » montre le plan commun avec « Parties et chapitres » (F02-AC08).
 */
export function Carnet({
  projet, preparation, plan, aideMasquee, aideVue,
}: {
  projet: ProjetDuCarnet; preparation: Preparation; plan: Plan; aideMasquee: boolean; aideVue: boolean;
}) {
  const dire = useMessage();
  const deClasse = projet.organisation === "classe";
  const aChoix = projet.recit === "choix";
  const [aide, setAide] = useState(!aideMasquee && !aideVue);
  const [vue, setVue] = useState(aideVue);
  const [ouvert, setOuvert] = useState<Ouvert>(null);
  const [ajout, setAjout] = useState(false);
  const etapes = guidage("etapes", projet.organisation, projet.recit);

  if (aide) {
    return (
      <AidePreparation
        deClasse={deClasse}
        aChoix={aChoix}
        dejaVue={vue}
        masquee={aideMasquee}
        onCommencer={() => {
          setVue(true);
          setAide(false);
        }}
      />
    );
  }

  const ajouterPartie = async () => {
    setAjout(true);
    const fait = await creerPartie(projet.id);
    setAjout(false);
    if (!fait.ok) return dire({ texte: fait.erreur });
    setOuvert({ sorte: "partie", id: fait.partieId, neuf: true });
  };
  const supprimerElement = async (sorte: "partie" | "chapitre", id: string, titre: string) => {
    const fait = await supprimer(sorte, id);
    if (!fait.ok) return dire({ texte: fait.erreur });
    dire({
      texte: `« ${titre} » est ${sorte === "partie" ? "supprimée" : "supprimé"}. Vous le retrouvez dans la corbeille du projet, dans « Parties et chapitres ».`,
      annuler: () => void restaurer(sorte, id),
    });
  };
  const choisirImage = async (pour: "partie" | "chapitre", id: string, choix: ChoixImage): Promise<string | null> => {
    if ("locale" in choix) return "Cette image n’a pas pu être importée.";
    const fait = await choisirRepere(pour, id, choix);
    return fait.ok ? null : fait.erreur;
  };

  const chapitreOuvert = ouvert ? chapitresDe(plan).find((c) => c.id === ouvert.id) : undefined;
  const partieOuverte = ouvert ? plan.parties.find((p) => p.id === ouvert.id) : undefined;

  return (
    <>
      <div className={styles.intro}>
        <p>{introCarnet(projet.organisation)}</p>
        <div className={styles.actions}>
          <button
            type="button"
            className="aide-bouton"
            title="Que fait-on ici ?"
            onClick={() => {
              // Rouverte par « Aide », elle se referme par « Fermer l'aide »
              setVue(true);
              setAide(true);
            }}
          >
            <Icone nom="aide" />
            Aide
          </button>
          {deClasse ? (
            <Link className="btn btn--primaire btn--grand" href={`/atelier/${projet.id}/univers`}>
              <Icone nom="oeil" />
              Projeter l’atelier
            </Link>
          ) : null}
        </div>
      </div>

      <div className={styles.carnet}>
        {(["univers", "personnages", "enjeu"] as const).map((rubrique) => (
          <FicheRubrique key={rubrique} projet={projet} rubrique={rubrique} preparation={preparation} />
        ))}

        <section className={`carnet-fiche ${styles.rubrique} ${styles.large}`} aria-labelledby="rubrique-etapes">
          <header>
            <h2 id="rubrique-etapes">{NOM_RUBRIQUE.etapes}</h2>
            <span className={styles.fin}>même plan que Parties et chapitres</span>
          </header>
          <div className="carnet-fiche__corps">
            <p className={styles.question}>{etapes.question}</p>
            <Relances relances={etapes.relances} exemple={etapes.exemple} />
            {plan.parties.length === 0 ? (
              <p className={styles.vide}>Le plan est encore vide. Ajoutez une première partie : son premier chapitre se crée avec elle.</p>
            ) : (
              <ol className={styles.plan}>
                {plan.parties.map((p, i) => (
                  <li key={p.id}>
                    <div className={styles.plan__ligne}>
                      <b>
                        Partie {i + 1} · {p.titre}
                      </b>
                      <Menu libelle={`Autres commandes de la partie ${p.titre}`} discret>
                        {(fermer) => (
                          <>
                            <button type="button" onClick={() => { fermer(); setOuvert({ sorte: "partie", id: p.id, neuf: false }); }}>
                              Réglages
                            </button>
                            <button type="button" onClick={() => { fermer(); void supprimerElement("partie", p.id, p.titre); }}>
                              Supprimer
                            </button>
                          </>
                        )}
                      </Menu>
                    </div>
                    <ul>
                      {p.chapitres.map((c) => (
                        <li key={c.id}>
                          <span className={styles.pastille} style={{ "--c": couleurDeChapitre(c.couleur).dos } as CSSProperties} />
                          <span>
                            <button type="button" className={styles.plan__chapitre} onClick={() => setOuvert({ sorte: "chapitre", id: c.id, neuf: false })} title="Réglages du chapitre">
                              {c.titre}
                            </button>
                            {c.resume ? <span className={styles.plan__resume}>{c.resume}</span> : null}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ol>
            )}
            <div className={styles.actions}>
              <button type="button" className="btn btn--petit" disabled={ajout} aria-busy={ajout || undefined} onClick={() => void ajouterPartie()}>
                <Icone nom="plus" />
                Ajouter une partie
              </button>
              <Link className="btn btn--petit" href={`/projet/${projet.id}/plan`}>
                Ouvrir Parties et chapitres
              </Link>
            </div>
          </div>
        </section>

        {aChoix ? <RubriquePhrases projetId={projet.id} preparation={preparation} /> : null}
        <RubriqueJeu projet={projet} preparation={preparation} />
      </div>

      {ouvert?.sorte === "partie" && partieOuverte ? (
        <ReglagesPartie
          key={partieOuverte.id}
          partie={partieOuverte}
          neuf={ouvert.neuf}
          onImage={() => setOuvert({ sorte: "image", pour: "partie", id: partieOuverte.id })}
          onFermer={() => setOuvert(null)}
        />
      ) : null}
      {ouvert?.sorte === "chapitre" && chapitreOuvert ? (
        <ReglagesChapitre
          key={chapitreOuvert.id}
          chapitre={chapitreOuvert}
          neuf={false}
          lisibleParLesEleves={deClasse}
          onImage={() => setOuvert({ sorte: "image", pour: "chapitre", id: chapitreOuvert.id })}
          onFermer={() => setOuvert(null)}
        />
      ) : null}
      {ouvert?.sorte === "image" && (ouvert.pour === "chapitre" ? chapitreOuvert : partieOuverte) ? (
        <ChoisirImage
          projetId={projet.id}
          actuel={(ouvert.pour === "chapitre" ? chapitreOuvert : partieOuverte)!}
          pour={`de « ${(ouvert.pour === "chapitre" ? chapitreOuvert : partieOuverte)!.titre} »`}
          onChoisir={(choix) => choisirImage(ouvert.pour, ouvert.id, choix)}
          onFermer={() => setOuvert({ sorte: ouvert.pour, id: ouvert.id, neuf: false })}
        />
      ) : null}
    </>
  );
}

/** Les relances d'une rubrique, et son exemple replié : rien d'autre à lire (F02-AC18). */
export function Relances({ relances, exemple }: { relances: string[]; exemple: string }) {
  return (
    <div className={styles.guidage}>
      <ul>
        {relances.map((r) => (
          <li key={r}>{r}</li>
        ))}
      </ul>
      <details>
        <summary>Voir un exemple</summary>
        <p>{exemple}</p>
      </details>
    </div>
  );
}

function FicheRubrique({ projet, rubrique, preparation }: { projet: ProjetDuCarnet; rubrique: RubriqueTexte; preparation: Preparation }) {
  const guide = guidage(rubrique, projet.organisation, projet.recit);
  const [texte, setTexte] = useState(preparation[rubrique]);
  const e = useEnregistrement();
  const deClasse = projet.organisation === "classe";
  return (
    <section className={`carnet-fiche ${styles.rubrique}`} aria-labelledby={`rubrique-${rubrique}`}>
      <header>
        <h2 id={`rubrique-${rubrique}`}>{NOM_RUBRIQUE[rubrique]}</h2>
        {deClasse ? (
          <Link className={`lien ${styles.fin}`} href={`/atelier/${projet.id}/${rubrique}`} aria-label={`Projeter ${NOM_RUBRIQUE[rubrique]}`}>
            Projeter
          </Link>
        ) : null}
      </header>
      <div className="carnet-fiche__corps">
        <p className={styles.question}>{guide.question}</p>
        <Relances relances={guide.relances} exemple={guide.exemple} />
        <label className={styles.synthese} htmlFor={`texte-${rubrique}`}>
          {titreSynthese(projet.organisation)}
        </label>
        <textarea
          id={`texte-${rubrique}`}
          className={`pchamp ${styles.texte}`}
          rows={5}
          maxLength={6000}
          value={texte}
          onChange={(ev) => {
            setTexte(ev.target.value);
            e.prevoir(() => ecrireRubrique(projet.id, rubrique, ev.target.value));
          }}
          onBlur={() => void e.partir()}
        />
        <p className={styles.etat} role="status">
          {e.enCours ? "Enregistrement…" : e.erreur ? e.erreur : e.enregistre ? "Enregistré" : ""}
        </p>
        {deClasse ? <Pistes projetId={projet.id} rubrique={rubrique} pistes={preparation.pistes} /> : null}
      </div>
    </section>
  );
}
