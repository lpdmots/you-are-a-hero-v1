"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { useAidesIa } from "@/composants/AidesIa";
import { BoutonDouble } from "@/composants/BoutonDouble";
import { ChampQuiGrandit } from "@/composants/ChampQuiGrandit";
import { useEnregistrement } from "@/composants/Enregistrement";
import { Icone } from "@/composants/Icone";
import { ImageRepere } from "@/composants/ImageRepere";
import { Menu } from "@/composants/Menu";
import { useMessage } from "@/composants/Messages";
import { MESSAGES_IA } from "@/domaine/aides-ia";
import {
  guidage, ORIENTATION_MAX, titreQuestions, titreSynthese, type EtatPiste, type Piste, type Preparation, type Question, type Rubrique, type RubriqueTexte,
} from "@/domaine/preparation";
import type { Organisation, Recit } from "@/domaine/projets";
import type { Partie, Plan } from "@/domaine/recit";
import { pluriel, sansCoupureFautive } from "@/domaine/texte";
import { ajouterPiste, ajouterQuestion, changerPiste, ecrireRubrique, orienterLIa, supprimerPiste, supprimerQuestion } from "../../actions-preparation";
import { creerPartie } from "../../actions-recit";
import { PanneauIdeesDeParties, useAjouterDesParties, useIdeesDeParties } from "../_plan/IdeesDeParties";
import { demanderALaPreparation, useReserveIa } from "./reserve";

/** Sans idée retenue ni texte, « Rédiger » ne demande rien (le serveur dit la même chose). */
const RIEN_A_REDIGER = "Retenez d’abord une idée, ou écrivez quelques mots : l’IA rédige d’après eux.";
import styles from "./preparation.module.css";

export type ProjetDuCarnet = { id: string; titre: string; organisation: Organisation; recit: Recit };

/** Ce que la page offre autour des parties de « Grandes étapes » : réglages et suppression, hors projection. */
export type GestesDesParties = { regler: (p: Partie) => void; supprimer: (p: Partie) => void };

/**
 * Une étape de l'histoire (F02, décision du 17 octobre 2026) : sa question en grand ; à gauche
 * les questions pour la classe, qui partent des relances, et les idées avec leurs états ; à
 * droite « Nous retenons ». Questions et idées s'ajoutent à la main ou par l'IA (F13.4) ;
 * « Projeter » montre le même écran en grand.
 */
export function EtapeHistoire({
  projet, etape, preparation, plan, projection, parties,
}: {
  projet: ProjetDuCarnet;
  etape: Rubrique;
  preparation: Preparation;
  plan: Plan;
  projection?: boolean;
  parties?: GestesDesParties;
}) {
  const { proposer } = useAidesIa();
  const guide = guidage(etape, projet.organisation, projet.recit);
  const e = useEnregistrement();
  const questions = preparation.questions.filter((q) => q.etape === etape);
  const idees = preparation.pistes.filter((p) => p.rubrique === etape);

  // « Orienter l'IA » : gardée avec l'étape ; avant la première demande, le champ s'ouvre d'abord (deux clics)
  const [orientation, setOrientation] = useState(preparation.orientations[etape] ?? "");
  const [orienterOuvert, setOrienterOuvert] = useState(false);
  const [enAttenteDOrienter, setEnAttenteDOrienter] = useState<"questions" | "idees" | null>(null);
  const dejaDemande = useRef(false);

  // Le texte retenu, tenu ici : la réserve est jetée quand il change, et il part avant chaque demande
  const [retenu, setRetenu] = useState(etape === "etapes" ? "" : preparation[etape]);

  const avantDeDemander = () => e.partir();
  const reserveQ = useReserveIa({
    projetId: projet.id, etape, sorte: "questions", avantDeDemander,
    deja: [...guide.relances, ...questions.map((q) => q.texte)],
    ajouter: (texte) => ajouterQuestion(projet.id, etape, texte, "ia"),
  });
  const reserveI = useReserveIa({
    projetId: projet.id, etape, sorte: "idees", avantDeDemander,
    deja: idees.map((i) => i.texte),
    ajouter: (texte) => ajouterPiste(projet.id, etape, texte, "ia"),
  });
  /** L'étape a changé : les deux réserves sont jetées (F13-AC14) */
  const changee = () => {
    reserveQ.jeter();
    reserveI.jeter();
  };

  const demander = (sorte: "questions" | "idees") => {
    // Devant la classe, l'orientation, consigne de l'adulte, ne s'affiche pas : la demande part aussitôt
    if (!dejaDemande.current && !orientation.trim() && !projection) {
      setOrienterOuvert(true);
      setEnAttenteDOrienter(sorte);
      return;
    }
    dejaDemande.current = true;
    setEnAttenteDOrienter(null);
    void (sorte === "questions" ? reserveQ.prendre() : reserveI.prendre());
  };

  const orienterVisible = orienterOuvert || orientation.trim() !== "";
  const changerOrientation = (v: string) => {
    setOrientation(v);
    changee();
    e.prevoir(() => orienterLIa(projet.id, etape, v), 700, "orientation");
  };
  // Ouvert par un ✦ avant la première demande, le champ se pose juste au-dessus du bouton cliqué
  const orienter = (
    <Orienter
      valeur={orientation}
      focus={enAttenteDOrienter !== null}
      onChange={changerOrientation}
      proposer={
        enAttenteDOrienter ? (
          <button
            type="button"
            className="btn btn--ia"
            onClick={() => {
              dejaDemande.current = true;
              demander(enAttenteDOrienter);
            }}
          >
            <Icone nom="ia" />
            {enAttenteDOrienter === "questions" ? "Proposer une question" : "Proposer une idée"}
          </button>
        ) : null
      }
    />
  );

  return (
    <div className={`${styles.etape}${projection ? ` ${styles.etape_projetee}` : ""}`}>
      <Question question={guide.question} exemple={guide.exemple} />

      <div className={styles.colonnes}>
        <div className={styles.gauche}>
          {proposer && !projection && !enAttenteDOrienter ? (
            orienterVisible ? (
              orienter
            ) : (
              <p className={styles.orienterLien}>
                <button type="button" className="lien" onClick={() => setOrienterOuvert(true)}>
                  Orienter l’IA
                </button>
              </p>
            )
          ) : null}

          <Questions
            titre={titreQuestions(projet.organisation)}
            relances={guide.relances}
            questions={questions}
            onAjouter={(t) => ajouterQuestion(projet.id, etape, t)}
            onIa={() => demander("questions")}
            orienter={enAttenteDOrienter === "questions" ? orienter : null}
            attente={reserveQ.attente}
            erreur={reserveQ.erreur}
            reste={reserveQ.reste}
          />

          <Idees
            etape={etape}
            deClasse={projet.organisation === "classe"}
            idees={idees}
            onNoter={async (t) => {
              const fait = await ajouterPiste(projet.id, etape, t);
              if (fait.ok) changee();
              return fait;
            }}
            onEtat={(id, etat) => {
              changee();
              void changerPiste(id, etat);
            }}
            onSupprimer={(id) => void supprimerPiste(id)}
            onIa={() => demander("idees")}
            orienter={enAttenteDOrienter === "idees" ? orienter : null}
            attente={reserveI.attente}
            erreur={reserveI.erreur}
            reste={reserveI.reste}
          />
        </div>

        {etape === "etapes" ? (
          <PartiesRetenues
            projet={projet}
            plan={plan}
            gestes={projection ? undefined : parties}
            projection={projection}
            orientation={orientation}
            onOrienter={changerOrientation}
            avantDeDemander={avantDeDemander}
          />
        ) : (
          <TexteRetenu
            projet={projet}
            etape={etape}
            valeur={retenu}
            enregistrement={e}
            peutRediger={retenu.trim() !== "" || idees.some((i) => i.etat === "retenue")}
            ideesRetenues={idees.filter((i) => i.etat === "retenue").map((i) => i.texte)}
            onChange={(v) => {
              setRetenu(v);
              changee();
              e.prevoir(() => ecrireRubrique(projet.id, etape, v), 700, "retenu");
            }}
          />
        )}
      </div>
    </div>
  );
}

/** La question de l'étape, en grand, et son exemple replié : rien d'autre à lire (F02-AC18). */
export function Question({ question, exemple }: { question: string; exemple?: string }) {
  return (
    <header className={styles.tete}>
      <h2 className={styles.question}>{sansCoupureFautive(question)}</h2>
      {exemple ? (
        <details className={styles.exemple}>
          <summary>Voir un exemple</summary>
          <p>{exemple}</p>
        </details>
      ) : null}
    </header>
  );
}

function Orienter({ valeur, focus, onChange, proposer }: { valeur: string; focus: boolean; onChange: (v: string) => void; proposer: ReactNode }) {
  const id = useId();
  // Ouvert par un ✦, avant la première demande : le curseur dans le champ, le champ sous les yeux
  useEffect(() => {
    if (!focus) return;
    const champ = document.getElementById(id);
    champ?.focus();
    champ?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [focus, id]);
  return (
    <div className={styles.orienter}>
      <label htmlFor={id}>
        Orienter l’IA <span className={styles.facultatif}>facultatif</span>
      </label>
      <ChampQuiGrandit
        id={id}
        className="pchamp"
        rows={1}
        maxLength={ORIENTATION_MAX}
        value={valeur}
        placeholder="Par exemple : des animaux qui parlent, rien de magique"
        onChange={(ev) => onChange(ev.target.value)}
      />
      {proposer}
    </div>
  );
}

/** Une ligne d'ajout à la main, au bout d'une liste : Entrée ajoute et garde le champ pour la suivante. */
function Ajout({
  libelle, exemple, onAjouter, onFermer, uneSeule,
}: {
  libelle: string;
  exemple: string;
  onAjouter: (t: string) => Promise<{ ok: boolean; erreur?: string }>;
  onFermer: () => void;
  /** Le champ se referme après l'ajout, au lieu d'attendre le suivant */
  uneSeule?: boolean;
}) {
  const [texte, setTexte] = useState("");
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const ajouter = async () => {
    if (!texte.trim() || enCours) return;
    setEnCours(true);
    const fait = await onAjouter(texte);
    setEnCours(false);
    if (!fait.ok) return setErreur(fait.erreur ?? "Cela n’a pas pu être enregistré. Réessayez.");
    setErreur(null);
    setTexte("");
    if (uneSeule) onFermer();
  };
  return (
    <form
      className={styles.ajoutLigne}
      onSubmit={(ev) => {
        ev.preventDefault();
        void ajouter();
      }}
    >
      <input
        className="pchamp"
        type="text"
        maxLength={200}
        autoFocus
        aria-label={libelle}
        placeholder={exemple}
        value={texte}
        onChange={(ev) => setTexte(ev.target.value)}
        onKeyDown={(ev) => {
          if (ev.key === "Escape") onFermer();
        }}
        onBlur={(ev) => {
          // Un clic sur le bouton qui l'a ouvert ne le referme pas : il le garde ouvert
          if (!texte.trim() && !(ev.relatedTarget as HTMLElement | null)?.closest("[data-ouvre-ajout]")) onFermer();
        }}
      />
      <button type="submit" className="btn btn--petit" disabled={!texte.trim() || enCours} aria-busy={enCours || undefined}>
        Ajouter
      </button>
      {erreur ? (
        <p className="erreur" role="alert">
          {erreur}
        </p>
      ) : null}
    </form>
  );
}

/** Ce que l'IA dit sous une liste : son échec, ou les demandes qui restent aujourd'hui. */
function NoteIa({ attente, erreur, reste, cherche }: { attente: boolean; erreur: string | null; reste: string | null; cherche: string }) {
  if (attente)
    return (
      <p className={styles.noteIa} role="status">
        <Icone nom="ia" />
        {cherche}
      </p>
    );
  if (erreur)
    return (
      <p className={styles.noteIa_erreur} role="alert">
        {erreur}
      </p>
    );
  return reste ? <p className={styles.noteIa}>{reste}</p> : null;
}

function Questions({
  titre, relances, questions, onAjouter, onIa, orienter, attente, erreur, reste,
}: {
  orienter: ReactNode;
  titre: string;
  relances: string[];
  questions: Question[];
  onAjouter: (t: string) => Promise<{ ok: boolean; erreur?: string }>;
  onIa: () => void;
  attente: boolean;
  erreur: string | null;
  reste: string | null;
}) {
  const [ajout, setAjout] = useState(false);
  const id = useId();
  return (
    <section className={styles.bloc} aria-labelledby={id}>
      <h3 id={id}>{titre}</h3>
      <ul className={styles.questions}>
        {relances.map((r) => (
          <li key={r}>
            <span>{sansCoupureFautive(r)}</span>
          </li>
        ))}
        {questions.map((q) => (
          <li key={q.id} className={styles.ajoutee}>
            <span>
              {sansCoupureFautive(q.texte)}
              {q.origine === "ia" ? <MarqueIa /> : null}
            </span>
            <button type="button" className={styles.retirer} aria-label={`Supprimer la question « ${q.texte} »`} title="Supprimer" onClick={() => void supprimerQuestion(q.id)}>
              <Icone nom="fermer" />
            </button>
          </li>
        ))}
      </ul>
      {ajout ? <Ajout libelle="Nouvelle question" exemple="Une question à poser" onAjouter={onAjouter} onFermer={() => setAjout(false)} /> : null}
      <NoteIa attente={attente} erreur={erreur} reste={reste} cherche="L’IA cherche des questions…" />
      {orienter}
      <p className={styles.gestes}>
        <BoutonDouble libelle="Ajouter une question" nomIa="Demander une question à l’IA" onMain={() => setAjout(true)} onIa={onIa} attente={attente} />
      </p>
    </section>
  );
}

/** ✦ après une question ou une idée de l'IA ; aides éteintes, aucun ✦ ne s'affiche (F13, cadre commun). */
function MarqueIa() {
  const { proposer } = useAidesIa();
  return proposer ? (
    <span className={styles.marqueIa} title="Proposée par l’IA">
      <Icone nom="ia" />
      <span className="vh"> (proposée par l’IA)</span>
    </span>
  ) : null;
}

function Idees({
  etape, deClasse, idees, onNoter, onEtat, onSupprimer, onIa, orienter, attente, erreur, reste,
}: {
  orienter: ReactNode;
  etape: Rubrique;
  deClasse: boolean;
  idees: Piste[];
  onNoter: (t: string) => Promise<{ ok: boolean; erreur?: string }>;
  onEtat: (id: string, etat: EtatPiste) => void;
  onSupprimer: (id: string) => void;
  onIa: () => void;
  attente: boolean;
  erreur: string | null;
  reste: string | null;
}) {
  const [ajout, setAjout] = useState(false);
  const id = useId();
  const vivantes = idees.filter((i) => i.etat !== "ecartee");
  const ecartees = idees.filter((i) => i.etat === "ecartee");
  return (
    <section className={styles.bloc} aria-labelledby={id}>
      <h3 id={id}>Idées</h3>
      {vivantes.length ? (
        <ul className={styles.idees}>
          {vivantes.map((i) => (
            <li key={i.id} className={i.etat === "retenue" ? styles.retenue : undefined}>
              <button
                type="button"
                className={styles.retenir}
                aria-pressed={i.etat === "retenue"}
                aria-label={i.etat === "retenue" ? `Ne plus retenir « ${i.texte} »` : `Retenir « ${i.texte} »`}
                title={i.etat === "retenue" ? "Retenue : cliquer pour la remettre à discuter" : "Retenir"}
                onClick={() => onEtat(i.id, i.etat === "retenue" ? "discuter" : "retenue")}
              >
                <Icone nom="coche" />
              </button>
              <span className={styles.idee__texte}>
                {i.texte}
                {i.origine === "ia" ? <MarqueIa /> : null}
              </span>
              <span className="vh">{i.etat === "retenue" ? "retenue" : "à discuter"}</span>
              <span className={styles.idee__gestes}>
                <button type="button" className={styles.geste} aria-label={`Écarter « ${i.texte} »`} title="La garder de côté, hors de la liste" onClick={() => onEtat(i.id, "ecartee")}>
                  Écarter
                </button>
                <button type="button" className={styles.retirer} aria-label={`Supprimer l’idée « ${i.texte} »`} title="Supprimer" onClick={() => onSupprimer(i.id)}>
                  <Icone nom="fermer" />
                </button>
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className={styles.vide}>
          {deClasse
            ? etape === "etapes" ? "Les lieux et les moments que la classe propose." : "Ce que la classe propose, à retenir ou à écarter."
            : "Vos idées, à retenir ou à écarter."}
        </p>
      )}
      {ajout ? <Ajout libelle="Nouvelle idée" exemple="Une idée à noter" onAjouter={onNoter} onFermer={() => setAjout(false)} /> : null}
      <NoteIa attente={attente} erreur={erreur} reste={reste} cherche="L’IA cherche une idée…" />
      {orienter}
      <p className={styles.gestes}>
        <BoutonDouble libelle="Noter une idée" nomIa="Demander une idée à l’IA" onMain={() => setAjout(true)} onIa={onIa} attente={attente} />
      </p>
      {ecartees.length ? (
        <details className={styles.ecartees}>
          <summary>Idées écartées · {ecartees.length}</summary>
          <ul className={styles.idees}>
            {ecartees.map((i) => (
              <li key={i.id} className={styles.ecartee}>
                <span className={styles.idee__texte}>
                  {i.texte}
                  {i.origine === "ia" ? <MarqueIa /> : null}
                </span>
                <span className={styles.idee__gestes}>
                  <button type="button" className={styles.geste} aria-label={`Remettre « ${i.texte} » à discuter`} onClick={() => onEtat(i.id, "discuter")}>
                    Remettre
                  </button>
                  <button type="button" className={styles.retirer} aria-label={`Supprimer l’idée « ${i.texte} »`} title="Supprimer" onClick={() => onSupprimer(i.id)}>
                    <Icone nom="fermer" />
                  </button>
                </span>
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </section>
  );
}

/**
 * « Nous retenons » : le champ s'écrit directement ; « ✦ Rédiger d'après les idées » rend une
 * proposition, retouchable, qui ne remplace rien avant « Utiliser ce texte » (F13-AC12, AC13).
 */
function TexteRetenu({
  projet, etape, valeur, enregistrement: e, peutRediger, ideesRetenues, onChange,
}: {
  projet: ProjetDuCarnet;
  etape: RubriqueTexte;
  valeur: string;
  /** Les idées retenues de l'étape : « Reprendre les idées retenues » met dans le texte celles qui n'y sont pas */
  ideesRetenues: string[];
  enregistrement: ReturnType<typeof useEnregistrement>;
  peutRediger: boolean;
  onChange: (v: string) => void;
}) {
  const { proposer } = useAidesIa();
  const dire = useMessage();
  const [propose, setPropose] = useState<string | null>(null);
  const [attente, setAttente] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const cadre = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (propose !== null) cadre.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [propose !== null]); // eslint-disable-line react-hooks/exhaustive-deps

  const aReprendre = ideesRetenues.filter((t) => !valeur.toLocaleLowerCase("fr").includes(t.trim().toLocaleLowerCase("fr")));
  const reprendre = () => {
    const avant = valeur;
    onChange([valeur.trimEnd(), ...aReprendre].filter(Boolean).join("\n"));
    dire({ texte: aReprendre.length > 1 ? `${aReprendre.length} idées reprises dans le texte.` : "1 idée reprise dans le texte.", annuler: () => onChange(avant) });
  };
  const rediger = async () => {
    // Rien à rédiger : l'IA ne part pas, et la raison se lit
    if (!peutRediger) return setErreur(RIEN_A_REDIGER);
    setAttente(true);
    setErreur(null);
    await e.partir();
    const r = await demanderALaPreparation(projet.id, etape, "retenons");
    setAttente(false);
    if (!r.ok) return setErreur(r.message);
    if (r.sorte !== "retenons") return setErreur(MESSAGES_IA.pasDeReponse);
    setPropose(r.texte);
  };
  const utiliser = () => {
    if (propose === null) return;
    const avant = valeur;
    onChange(propose);
    void e.partir();
    setPropose(null);
    dire({ texte: "Le texte retenu est remplacé.", annuler: () => onChange(avant) });
  };

  return (
    <section className={styles.retenu} aria-labelledby="retenons">
      <h3 id="retenons">
        <label htmlFor="texte-retenu">{titreSynthese(projet.organisation)}</label>
      </h3>
      <ChampQuiGrandit
        id="texte-retenu"
        className={styles.retenu__champ}
        rows={5}
        maxLength={6000}
        value={valeur}
        placeholder={projet.organisation === "classe" ? "Ce que la classe décide." : "Ce que je décide."}
        onChange={(ev) => onChange(ev.target.value)}
        onBlur={() => void e.partir()}
      />
      <p className={styles.etat} role="status">
        {e.enCours ? "Enregistrement…" : e.erreur ? e.erreur : e.enregistre ? "Enregistré" : ""}
      </p>
      <p className={styles.gestes}>
        {proposer ? (
          <button type="button" className="btn btn--ia" onClick={() => void rediger()} disabled={attente} aria-busy={attente || undefined}>
            <Icone nom="ia" />
            Rédiger d’après les idées
          </button>
        ) : null}
        {aReprendre.length ? (
          <button type="button" className={`lien ${styles.reprendre}`} onClick={reprendre}>
            Reprendre les idées retenues
          </button>
        ) : null}
      </p>
      {proposer ? (
        <>
          {erreur ? (
            <p className={styles.noteIa_erreur} role="alert">
              {erreur}
            </p>
          ) : null}
          {propose !== null ? (
            <div ref={cadre} className={`ia-propose ia-propose--consigne ${styles.propose}`} role="group" aria-labelledby="texte-propose-t">
              <p className="ia-propose__tete" id="texte-propose-t">
                <Icone nom="ia" />
                Texte proposé · modifiable
              </p>
              <ChampQuiGrandit className={`pchamp ${styles.propose__champ}`} rows={4} maxLength={6000} value={propose} aria-label="Texte proposé" onChange={(ev) => setPropose(ev.target.value)} />
              <span className="ia-propose__gestes">
                <button type="button" className="btn btn--petit" disabled={!propose.trim()} onClick={utiliser}>
                  <Icone nom="coche" />
                  Utiliser ce texte
                </button>
                <button type="button" className="btn btn--petit btn--discret" onClick={() => setPropose(null)}>
                  Laisser
                </button>
              </span>
            </div>
          ) : null}
        </>
      ) : null}
    </section>
  );
}

/**
 * « Grandes étapes » retient les parties seules (F02, 17 octobre 2026) : leur image, leur titre,
 * leur nombre de chapitres, qui mènent à « Parties et chapitres ». Ajouter une partie lui donne
 * son premier chapitre (F02-AC08) ; le plan reste celui des deux vues.
 */
function PartiesRetenues({
  projet, plan, gestes, projection, orientation, onOrienter, avantDeDemander,
}: {
  projet: ProjetDuCarnet;
  plan: Plan;
  gestes?: GestesDesParties;
  projection?: boolean;
  /** L'orientation de l'étape, la même pour ses questions, ses idées et les idées de parties (F13.5) */
  orientation: string;
  onOrienter: (v: string) => void;
  avantDeDemander: () => Promise<void>;
}) {
  const dire = useMessage();
  const [ajout, setAjout] = useState(false);
  const [panneau, setPanneau] = useState(false);
  const idees = useIdeesDeParties(projet.id, orientation, avantDeDemander);
  // Les parties ajoutées viennent sous les yeux dès que la liste les montre
  const aMontrer = useRef<string | null>(null);
  const montrerPartie = () => {
    const ligne = aMontrer.current ? document.getElementById(`partie-retenue-${aMontrer.current}`) : null;
    if (!ligne) return;
    ligne.scrollIntoView({ behavior: "smooth", block: "nearest" });
    aMontrer.current = null;
  };
  const ajoutIdees = useAjouterDesParties(projet.id, idees, (id) => {
    aMontrer.current = id;
    requestAnimationFrame(montrerPartie);
  });
  useEffect(montrerPartie, [plan]);
  return (
    <section className={styles.retenu} aria-labelledby="retenons">
      <h3 id="retenons">{titreSynthese(projet.organisation)}</h3>
      {plan.parties.length ? (
        <ol className={styles.parties}>
          {plan.parties.map((p, i) => (
            <li key={p.id} id={`partie-retenue-${p.id}`} className={styles.partie}>
              <Link className={styles.partie__lien} href={`/projet/${projet.id}/plan#partie-${p.id}`}>
                <span className={styles.partie__image}>
                  <ImageRepere repere={p} graine={p.id} />
                </span>
                <span className={styles.partie__texte}>
                  <span className={styles.partie__rang}>Partie {i + 1}</span>
                  <b>{p.titre}</b>
                  <span className={styles.partie__compte}>{p.chapitres.length} chapitre{pluriel(p.chapitres.length)}</span>
                </span>
              </Link>
              {gestes ? (
                <Menu libelle={`Autres commandes de la partie ${p.titre}`} discret>
                  {(fermer) => (
                    <>
                      <button type="button" onClick={() => { fermer(); gestes.regler(p); }}>
                        Réglages
                      </button>
                      <button type="button" onClick={() => { fermer(); gestes.supprimer(p); }}>
                        Supprimer
                      </button>
                    </>
                  )}
                </Menu>
              ) : null}
            </li>
          ))}
        </ol>
      ) : (
        <p className={styles.vide}>Une partie par grand moment de l’histoire. Chacune reçoit son premier chapitre.</p>
      )}
      {ajout ? (
        <Ajout
          libelle="Titre de la nouvelle partie"
          exemple="La forêt, la montagne…"
          uneSeule
          onFermer={() => setAjout(false)}
          onAjouter={async (t) => {
            const fait = await creerPartie(projet.id, t);
            if (!fait.ok) dire({ texte: fait.erreur });
            return fait.ok ? { ok: true } : { ok: false, erreur: fait.erreur };
          }}
        />
      ) : null}
      <p className={styles.gestes}>
        <BoutonDouble libelle="Ajouter une partie" nomIa="Demander des idées de parties à l’IA" onMain={() => setAjout(true)} onIa={() => setPanneau(true)} />
        {plan.parties.length ? (
          <Link className={`lien ${styles.versPlan}`} href={`/projet/${projet.id}/plan`}>
            Ouvrir Parties et chapitres
          </Link>
        ) : null}
      </p>
      {panneau ? (
        <PanneauIdeesDeParties
          idees={idees}
          orientation={orientation}
          onOrienter={onOrienter}
          projection={projection}
          depuisLEtape
          ajout={ajoutIdees.ajout}
          onAjouter={(choisis) =>
            void ajoutIdees.ajouter(choisis).then((fait) => {
              if (fait) setPanneau(false);
            })
          }
          onFermer={() => setPanneau(false)}
        />
      ) : null}
    </section>
  );
}
