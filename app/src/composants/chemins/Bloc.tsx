"use client";

import { Fragment, useEffect, useId, useRef, useState, type KeyboardEvent as ToucheReact, type ReactNode } from "react";
import {
  BLOC, ceQuiSAjoute, EXEMPLES, estNouvelle, libelleDAjout, retirerChoix, retirerScene, totalDuChapitre,
  type ChoixPropose, type Proposition, type ReglagesBloc, type SceneProposee,
} from "@/domaine/bloc-de-scenes";
import { MESSAGES_IA } from "@/domaine/aides-ia";
import type { Chemins } from "@/domaine/chemins";
import { LIBELLE_MAX } from "@/domaine/copie";
import { nomScene } from "@/domaine/recit";
import type { ReponseBloc } from "@/serveur/bloc-de-scenes";
import { ChampQuiGrandit } from "../ChampQuiGrandit";
import { Icone } from "../Icone";
import { useMessage } from "../Messages";
import { appelerUneAide } from "../PlusDEtoiles";
import { ListeAModifier } from "../verification/Liste";

/**
 * Le bloc de scènes (F13.7), dans le panneau à droite de « Chemins » : la demande, écrite ou
 * dictée ; la proposition de l'IA, dessinée en pointillé sur le schéma et retouchable ici, en
 * arbre ; puis « Ajouter 4 scènes et 3 choix ». Rien n'existe dans le projet avant ce geste.
 */

type Resultat = { ok: true } | { ok: false; erreur: string };

/** Ce que la page offre au bloc ; absent, ou les aides éteintes, aucun ✦ ne se montre (F13-AC42). */
export type ServicesDuBloc = {
  chapitreId: string;
  /** Les scènes du chapitre aujourd'hui, pour la ligne du total */
  nombreDeScenes: number;
  reglages: ReglagesBloc;
  regler: (r: ReglagesBloc) => Promise<Resultat>;
  /** L'ajout d'un seul tenant ; la page dit le résultat avec « Annuler » ; rend les nouvelles scènes */
  ajouter: (p: Proposition, prendreConsigne: boolean) => Promise<({ ok: true; scenes: string[] }) | { ok: false; erreur: string }>;
  /** Arrivé d'un chapitre vide par « ✦ Construire avec l'IA » : le panneau s'ouvre d'office */
  auDepart?: boolean;
  /** Le panneau refermé dans un chapitre toujours vide : on revient à son invitation */
  quitter?: () => void;
};

/** L'état du bloc d'un chapitre : gardé tant que la page reste ouverte (F13.7), même en passant par « Scènes ». */
export type EtatDuBloc = {
  ouvert: boolean;
  origine: string | null;
  demande: string;
  proposition: Proposition | null;
  /** La demande qui a donné la proposition : la changer propose de redessiner */
  demandee: string;
  prendre: boolean;
  /** Les réponses de l'adulte aux questions de l'IA, par question (F13-AC36) */
  reponses: Record<string, string>;
  /** Ce qu'il a précisé, pris en compte par la proposition à l'écran */
  precisees?: { question: string; reponse: string }[];
};
const memoire = new Map<string, EtatDuBloc>();
const FERME: EtatDuBloc = { ouvert: false, origine: null, demande: "", proposition: null, demandee: "", prendre: false, reponses: {} };

export function useEtatDuBloc(chapitreId: string | undefined, auDepart: boolean) {
  const [etat, setEtatLocal] = useState<EtatDuBloc>(() => {
    const garde = chapitreId ? memoire.get(chapitreId) : undefined;
    return auDepart ? { ...(garde ?? FERME), ouvert: true } : (garde ?? FERME);
  });
  const setEtat = (suite: EtatDuBloc | ((avant: EtatDuBloc) => EtatDuBloc)) =>
    setEtatLocal((avant) => {
      const e = typeof suite === "function" ? suite(avant) : suite;
      if (chapitreId) memoire.set(chapitreId, e);
      return e;
    });
  return [etat, setEtat] as const;
}

async function demanderLeBloc(corps: Record<string, unknown>): Promise<ReponseBloc> {
  try {
    const r = await appelerUneAide("/ia/bloc-de-scenes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(corps) });
    if (r.status === 401) return { ok: false, message: "Connectez-vous de nouveau." };
    return (await r.json()) as ReponseBloc;
  } catch {
    return { ok: false, message: MESSAGES_IA.pasDeReponse };
  }
}


export function PanneauDuBloc({
  etat, setEtat, chemins, services, deClasse, ouverte, onOuvrir, onFermer, ordre,
}: {
  etat: EtatDuBloc;
  setEtat: (suite: (avant: EtatDuBloc) => EtatDuBloc) => void;
  chemins: Chemins;
  services: ServicesDuBloc;
  deClasse: boolean;
  /** La scène proposée qu'on vient de cliquer sur le schéma : sa ligne s'ouvre ici */
  ouverte: string | null;
  onOuvrir: (cle: string | null) => void;
  onFermer: () => void;
  /** Où le schéma a posé chaque scène, de gauche à droite : la liste suit le même ordre */
  ordre: (id: string) => number;
}) {
  const id = useId();
  const dire = useMessage();
  const [attente, setAttente] = useState<"proposer" | "ajouter" | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [reglages, setReglages] = useState(services.reglages);
  const [voirReglages, setVoirReglages] = useState(false);
  const corps = useRef<HTMLDivElement>(null);
  // L'exemple du champ vide change d'une ouverture à l'autre : trois chemins, des chemins qui se rejoignent, une fin
  const [exemple] = useState(() => EXEMPLES[Math.floor(Math.random() * EXEMPLES.length)]);
  const p = etat.proposition;
  const origine = etat.origine ? chemins.noeuds.find((n) => n.id === etat.origine) : undefined;
  const sansOrigine = !etat.origine && chemins.noeuds.some((n) => !n.propose);

  // La ligne de la scène proposée qu'on vient de cliquer vient sous les yeux
  useEffect(() => {
    if (!ouverte) return;
    corps.current?.querySelector(`[data-bloc="${CSS.escape(ouverte)}"]`)?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [ouverte]);

  const changer = (suite: Proposition) => setEtat((e) => ({ ...e, proposition: suite }));
  const changerScene = (cle: string, maj: Partial<SceneProposee>) => p && changer({ ...p, scenes: p.scenes.map((s) => (s.cle === cle ? { ...s, ...maj } : s)) });
  const changerChoix = (cle: string, libelle: string) => p && changer({ ...p, choix: p.choix.map((c) => (c.cle === cle ? { ...c, libelle } : c)) });

  /**
   * `avecReponses` : l'adulte a répondu aux questions ; la proposition se redessine d'après ses
   * réponses, en gardant ses retouches (F13.7, « Y répondre redessine la proposition »).
   */
  const proposer = async (avecReponses = false) => {
    const demande = (avecReponses ? etat.demandee : etat.demande).trim();
    if (!demande || attente || sansOrigine) return;
    setAttente("proposer");
    setErreur(null);
    const reponses = avecReponses && p ? p.questions.flatMap((question) => (etat.reponses[question]?.trim() ? [{ question, reponse: etat.reponses[question].trim() }] : [])) : [];
    const r = await demanderLeBloc({ chapitre: services.chapitreId, origine: etat.origine, demande, ...(avecReponses ? { reponses, actuelle: p } : {}) });
    setAttente(null);
    if (!r.ok) return setErreur(r.message);
    onOuvrir(null);
    setEtat((e) => ({ ...e, proposition: r.proposition, demandee: demande, prendre: avecReponses ? e.prendre : false, reponses: {}, precisees: avecReponses ? [...(e.precisees ?? []), ...reponses] : [] }));
    if (r.solde) dire({ texte: r.solde });
  };

  const ajouter = async () => {
    if (!p || attente) return;
    setAttente("ajouter");
    setErreur(null);
    const fait = await services.ajouter(p, etat.prendre && !!p.consigneOrigine);
    setAttente(null);
    if (!fait.ok) setErreur(fait.erreur);
  };

  const regler = (suite: ReglagesBloc) => {
    setReglages(suite);
    void services.regler(suite).then((r) => r.ok || dire({ texte: r.erreur }));
  };

  const pret = !!p && p.scenes.every((s) => s.titre.trim()) && p.choix.every((c) => c.libelle.trim()) && (p.scenes.length > 0 || p.choix.length > 0);
  const redessiner = !!p && etat.demande.trim() !== etat.demandee;
  const repondu = !!p && p.questions.some((q) => etat.reponses[q]?.trim());

  return (
    <aside className="panneau-chemin panneau-bloc" aria-labelledby={`${id}-nom`} aria-busy={attente === "proposer" || undefined}>
      <header className="panneau-chemin__tete panneau-bloc__tete">
        <h2 id={`${id}-nom`}>
          <Icone nom="ia" />
          Construire avec l’IA
        </h2>
        <button type="button" className="btn btn--discret panneau-chemin__fermer" aria-label="Fermer le panneau du bloc" onClick={onFermer}>
          <Icone nom="fermer" />
        </button>
      </header>

      <div className="panneau-chemin__corps" ref={corps}>
        {/* Le premier geste, en tête : sans scène d'origine, rien ne peut être proposé */}
        {sansOrigine ? (
          <p className="panneau-bloc__consigne-origine" role="status">
            <Icone nom="chemins" />
            Cliquez dans le schéma la scène d’où continuer.
          </p>
        ) : null}
        <div className="panneau-chemin__champ">
          <label htmlFor={`${id}-demande`}>
            {origine ? (
              <>
                La suite de <span className="panneau-bloc__origine">{nomScene(origine)}</span>
              </>
            ) : sansOrigine ? (
              "La suite"
            ) : (
              "Le début du chapitre"
            )}
          </label>
          <ChampQuiGrandit
            id={`${id}-demande`}
            className="pchamp"
            // Dans l'espace de travail, la demande seule a de la place : un champ où l'on décrit à l'aise ; il rétrécit quand la proposition arrive
            rows={p ? 2 : 4}
            value={etat.demande}
            maxLength={BLOC.demande}
            placeholder={`Par exemple : ${exemple}`}
            onChange={(e) => setEtat((x) => ({ ...x, demande: e.target.value }))}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) void proposer();
            }}
          />
        </div>
        {/* Avant toute proposition, les deux réglages sont en vue, sous la demande ; ensuite ils se rangent derrière « Réglages » */}
        {p ? null : <Reglages id={`${id}-reglages`} reglages={reglages} deClasse={deClasse} onChange={regler} />}
        <div className="panneau-bloc__envoi">
          {p ? (
            <button type="button" className="lien panneau-bloc__reglages" aria-expanded={voirReglages} aria-controls={`${id}-reglages`} onClick={() => setVoirReglages(!voirReglages)}>
              <Icone nom="reglages" />
              Réglages
            </button>
          ) : (
            <span className="panneau-bloc__promesse">Les scènes se dessinent en pointillé sur le schéma. Rien n’est ajouté avant votre accord.</span>
          )}
          {/* La demande inchangée, une proposition à l'écran : rien à redessiner, le bouton s'efface */}
          {p && !redessiner && attente === null ? null : (
          <button
            type="button"
            className="btn btn--petit btn--ia"
            title={p ? "Une nouvelle proposition remplace celle-ci, et vos retouches" : undefined}
            disabled={!etat.demande.trim() || attente !== null || sansOrigine}
            aria-busy={attente === "proposer" || undefined}
            onClick={() => void proposer()}
          >
            <Icone nom="ia" />
            {attente === "proposer" ? "L’IA dessine…" : p ? "Proposer de nouveau" : "Proposer"}
          </button>
          )}
        </div>
        {p && voirReglages ? <Reglages id={`${id}-reglages`} reglages={reglages} deClasse={deClasse} onChange={regler} /> : null}
        {attente === "proposer" ? (
          <p className="panneau-bloc__attente" role="status">
            L’IA dessine le bloc sous {origine ? "la scène" : "le chapitre"}. Cela prend une demi-minute environ.
          </p>
        ) : null}
        {erreur ? (
          <p className="erreur" role="alert">
            {erreur}
          </p>
        ) : null}

        {p ? (
          <Arbre
            p={p} chemins={chemins} deClasse={deClasse} ouverte={ouverte}
            changerScene={changerScene} changerChoix={changerChoix}
            ordre={ordre}
            questions={
              p.questions.length || p.reste || etat.precisees?.length ? (
                <Precisions
                  p={p}
                  precisees={etat.precisees ?? []}
                  reponses={etat.reponses}
                  onRepondre={(question, reponse) => setEtat((e) => ({ ...e, reponses: { ...e.reponses, [question]: reponse } }))}
                  attente={attente !== null}
                  repondu={repondu}
                  onRedessiner={() => void proposer(true)}
                />
              ) : null
            }
            avant={p?.consigneOrigine && origine ? (
          <ConsigneDOrigine
            origine={nomScene(origine)}
            consigne={p.consigneOrigine}
            deClasse={deClasse}
            prendre={etat.prendre}
            onPrendre={(prendre) => setEtat((e) => ({ ...e, prendre }))}
            onChange={(c) => changer({ ...p, consigneOrigine: c })}
          />
        ) : null}
            retirerScene={(cle) => {
              const titre = p.scenes.find((x) => x.cle === cle)?.titre || "La scène";
              changer(retirerScene(p, cle));
              dire({ texte: `« ${titre} » est retirée de la proposition.`, annuler: () => changer(p) });
            }}
            retirerChoix={(cle) => {
              changer(retirerChoix(p, cle));
              dire({ texte: "Le choix est retiré de la proposition.", annuler: () => changer(p) });
            }}
          />
        ) : null}
      </div>

      {p ? (
        <footer className="panneau-chemin__pied panneau-bloc__pied">
          <span className="panneau-bloc__ligne">
            <span className="panneau-bloc__total">{totalDuChapitre(services.nombreDeScenes, p)}</span>
            <button
              type="button"
              className="btn btn--petit btn--discret"
              disabled={attente !== null}
              onClick={() => {
                const avant = etat;
                setEtat((e) => ({ ...e, proposition: null, demandee: "" }));
                dire({ texte: "Proposition abandonnée.", annuler: () => setEtat(() => avant) });
              }}
            >
              Abandonner
            </button>
          </span>
          <button type="button" className="btn btn--petit btn--primaire panneau-bloc__ajouter" disabled={!pret || attente !== null} aria-busy={attente === "ajouter" || undefined} onClick={() => void ajouter()}>
            {libelleDAjout(p, etat.prendre && !!p.consigneOrigine)}
          </button>
        </footer>
      ) : null}
    </aside>
  );
}

function Reglages({ id, reglages, deClasse, onChange }: { id: string; reglages: ReglagesBloc; deClasse: boolean; onChange: (r: ReglagesBloc) => void }) {
  const nom = useId();
  return (
    <div className="panneau-bloc__reglages-corps" id={id}>
      <fieldset>
        <legend>Ce qui manque à ma demande</legend>
        <label>
          <input type="radio" name={`${nom}-manque`} checked={reglages.manque === "demander"} onChange={() => onChange({ ...reglages, manque: "demander" })} />
          Me le demander
        </label>
        <label>
          <input type="radio" name={`${nom}-manque`} checked={reglages.manque === "completer"} onChange={() => onChange({ ...reglages, manque: "completer" })} />
          L’IA complète
        </label>
      </fieldset>
      <fieldset>
        <legend>Consignes</legend>
        <label>
          <input type="radio" name={`${nom}-consignes`} checked={reglages.consignes} onChange={() => onChange({ ...reglages, consignes: true })} />
          {deClasse ? "Avec leur liste de vérification" : "Avec"}
        </label>
        <label>
          <input type="radio" name={`${nom}-consignes`} checked={!reglages.consignes} onChange={() => onChange({ ...reglages, consignes: false })} />
          Sans : les titres seuls
        </label>
      </fieldset>
    </div>
  );
}

/**
 * Le bloc en fiches, dans le panneau large (11 novembre 2026) : une rangée par scène d'où partent
 * des choix — la scène d'origine, puis chaque nouvelle scène qui a les siens —, dans l'ordre du
 * schéma, de gauche à droite. Chaque fiche dit ce que fait le lecteur, puis la scène où il arrive :
 * son titre, sa consigne et sa liste, visibles d'emblée.
 */
function Arbre({
  p, chemins, deClasse, ouverte, changerScene, changerChoix, retirerScene, retirerChoix, ordre, avant, questions,
}: {
  p: Proposition; chemins: Chemins; deClasse: boolean; ouverte: string | null;
  ordre: (id: string) => number;
  /** Ce qui touche la scène d'origine, en tête : la consigne qu'on peut lui donner */
  avant?: ReactNode;
  /** Les questions de l'IA et ce qu'elle a laissé d'une demande trop large, tout en haut */
  questions?: ReactNode;
  changerScene: (cle: string, maj: Partial<SceneProposee>) => void;
  changerChoix: (cle: string, libelle: string) => void;
  retirerScene: (cle: string) => void;
  retirerChoix: (cle: string) => void;
}) {
  const parCle = new Map(p.scenes.map((s) => [s.cle, s]));
  // Dans l'ordre où le schéma les montre, de gauche à droite
  const range = (choix: ChoixPropose[]) => [...choix].sort((a, b) => ordre(a.vers) - ordre(b.vers));
  const racine = p.origine ? null : (p.scenes.find((s) => !p.choix.some((c) => c.vers === s.cle)) ?? null);
  const origine = p.origine ? chemins.noeuds.find((n) => n.id === p.origine) : undefined;

  // Les rangées : d'où partent les choix, en suivant le bloc depuis son départ
  const rangees: { de: string; nom: string; choix: ChoixPropose[] }[] = [];
  const vues = new Set<string>();
  const file = [p.origine ?? racine?.cle].filter((x): x is string => !!x);
  while (file.length) {
    const de = file.shift()!;
    if (vues.has(de)) continue;
    vues.add(de);
    const choix = range(p.choix.filter((c) => c.de === de));
    if (choix.length) rangees.push({ de, nom: de === p.origine && origine ? nomScene(origine) : `« ${parCle.get(de)?.titre || "sans titre"} »`, choix });
    for (const c of choix) if (parCle.has(c.vers)) file.push(c.vers);
  }
  const montrees = new Set<string>(racine ? [racine.cle] : []);

  const fiche = (c: ChoixPropose): ReactNode => {
    const libelle = (
      <span className="bloc-fiche__choix">
        <Icone nom="fleche" />
        <ChampQuiGrandit
          className="bloc-ligne__libelle"
          aria-label="Ce que fait le lecteur"
          rows={1}
          dictee={false}
          value={c.libelle}
          maxLength={LIBELLE_MAX}
          placeholder="Ce que fait le lecteur"
          onKeyDown={sansRetour}
          onChange={(e) => changerChoix(c.cle, e.target.value.replace(/\s*\n\s*/g, " "))}
        />
      </span>
    );
    const nouvelle = parCle.get(c.vers);
    if (nouvelle && !montrees.has(nouvelle.cle)) {
      montrees.add(nouvelle.cle);
      return (
        <li key={c.cle} className={`bloc-fiche${ouverte === nouvelle.cle ? " est-ouverte" : ""}`} data-bloc={nouvelle.cle}>
          {libelle}
          <SceneDuBloc s={nouvelle} deClasse={deClasse} onChange={(m) => changerScene(nouvelle.cle, m)} onRetirer={() => retirerScene(nouvelle.cle)} />
        </li>
      );
    }
    // Vers une scène du chapitre, ou une nouvelle scène déjà montrée : le chemin la rejoint
    const existante = estNouvelle(p, c.vers) ? undefined : chemins.noeuds.find((n) => n.id === c.vers);
    return (
      <li key={c.cle} className="bloc-fiche bloc-fiche--rejoint">
        {libelle}
        <span className="bloc-ligne__rejoint">
          <Icone nom="entree" />
          {existante ? nomScene(existante) : `« ${nouvelle?.titre || "sans titre"} »`}
          <button type="button" className="btn btn--discret panneau-chemin__retirer" aria-label={`Retirer le choix « ${c.libelle || "sans libellé"} »`} title="Retirer ce choix" onClick={() => retirerChoix(c.cle)}>
            <Icone nom="corbeille" />
          </button>
        </span>
      </li>
    );
  };

  return (
    <section className="panneau-bloc__propose" aria-labelledby="bloc-propose">
      <p className="panneau-bloc__propose-tete" id="bloc-propose">
        <span className="panneau-bloc__pointille" aria-hidden="true" />
        {ceQuiSAjoute(p)} proposés
        <span>Retouchez si besoin, puis ajoutez.</span>
      </p>
      {questions}
      {avant}
      {racine ? (
        <div className="bloc-rangee">
          <p className="bloc-rangee__de">Le début du chapitre</p>
          <ul className="bloc-fiches">
            <li className={`bloc-fiche${ouverte === racine.cle ? " est-ouverte" : ""}`} data-bloc={racine.cle}>
              <SceneDuBloc s={racine} deClasse={deClasse} onChange={(m) => changerScene(racine.cle, m)} onRetirer={() => retirerScene(racine.cle)} />
            </li>
          </ul>
        </div>
      ) : null}
      {rangees.map((r) => (
        <div key={r.de} className="bloc-rangee">
          <p className="bloc-rangee__de">
            Depuis <b>{r.nom}</b>
          </p>
          <ul className="bloc-fiches">{r.choix.map((c) => <Fragment key={c.cle}>{fiche(c)}</Fragment>)}</ul>
        </div>
      ))}
    </section>
  );
}

/** Un titre ou un libellé tient sur une ligne de sens : Entrée ne va pas à la ligne */
const sansRetour = (e: ToucheReact<HTMLTextAreaElement>) => {
  if (e.key === "Enter") e.preventDefault();
};

function SceneDuBloc({
  s, deClasse, onChange, onRetirer,
}: {
  s: SceneProposee; deClasse: boolean;
  onChange: (m: Partial<SceneProposee>) => void; onRetirer: () => void;
}) {
  return (
    <div className="bloc-fiche__scene">
      <span className="bloc-fiche__titre">
        <ChampQuiGrandit
          className="bloc-ligne__titre"
          aria-label="Titre de la nouvelle scène"
          rows={1}
          dictee={false}
          value={s.titre}
          maxLength={120}
          placeholder="Son titre"
          onKeyDown={sansRetour}
          onChange={(e) => onChange({ titre: e.target.value.replace(/\s*\n\s*/g, " ") })}
        />
        <button type="button" className="btn btn--discret panneau-chemin__retirer" aria-label={`Retirer la scène « ${s.titre || "sans titre"} »`} title="Retirer cette scène" onClick={onRetirer}>
          <Icone nom="corbeille" />
        </button>
      </span>
      {s.inventee ? (
        <span className="bloc-ligne__imaginee">
          <Icone nom="ia" />
          Imaginée par l’IA, à vérifier
        </span>
      ) : null}
      {/* Les consignes se lisent d'emblée : c'est le texte qu'on relit ici ; « Consignes » éteint, le titre seul */}
      {s.consigne || s.liste.length ? (
        <div className="bloc-ligne__consigne">
          <ChampQuiGrandit className="pchamp" aria-label="Consigne proposée" rows={2} maxLength={4000} value={s.consigne} placeholder="Consigne facultative" onChange={(e) => onChange({ consigne: e.target.value })} />
          {deClasse ? <ListeAModifier depart={s.liste} onChange={(liste) => onChange({ liste })} titre="Liste proposée" etiquette="Élément proposé" cases={false} /> : null}
        </div>
      ) : null}
    </div>
  );
}

function ConsigneDOrigine({
  origine, consigne, deClasse, prendre, onPrendre, onChange,
}: {
  origine: string; consigne: { consigne: string; liste: string[] }; deClasse: boolean; prendre: boolean;
  onPrendre: (oui: boolean) => void; onChange: (c: { consigne: string; liste: string[] }) => void;
}) {
  const id = useId();
  return (
    <section className="panneau-bloc__origine-consigne">
      <label className="panneau-bloc__prendre">
        <input type="checkbox" checked={prendre} onChange={(e) => onPrendre(e.target.checked)} aria-controls={`${id}-c`} />
        <span>
          Donner aussi une consigne à <b>{origine}</b>
        </span>
      </label>
      {prendre ? (
        <div id={`${id}-c`} className="bloc-ligne__consigne">
          <ChampQuiGrandit className="pchamp" aria-label={`Consigne proposée pour ${origine}`} rows={2} maxLength={4000} value={consigne.consigne} onChange={(e) => onChange({ ...consigne, consigne: e.target.value })} />
          {deClasse ? <ListeAModifier depart={consigne.liste} onChange={(liste) => onChange({ ...consigne, liste })} titre="Liste proposée" etiquette="Élément proposé" cases={false} /> : null}
        </div>
      ) : null}
    </section>
  );
}

/**
 * Ce que l'IA ne savait pas (F13-AC36), et ce qu'elle a laissé d'une demande trop large (F13-AC40).
 * Les questions sont facultatives : les ignorer n'empêche pas d'ajouter.
 */
function Precisions({
  p, precisees, reponses, onRepondre, attente, repondu, onRedessiner,
}: {
  p: Proposition; precisees: { question: string; reponse: string }[]; reponses: Record<string, string>; onRepondre: (question: string, reponse: string) => void;
  attente: boolean; repondu: boolean; onRedessiner: () => void;
}) {
  const id = useId();
  return (
    <>
      {p.reste ? (
        <p className="panneau-bloc__reste">
          <Icone nom="ia" />
          <span>{p.reste}</span>
        </p>
      ) : null}
      {/* Ce qu'il a déjà précisé reste dit : la proposition en tient compte */}
      {precisees.length ? (
        <p className="panneau-bloc__precisees">
          <Icone nom="coche" />
          <span>Vos précisions : {precisees.map((x) => x.reponse).join(" ; ")}</span>
        </p>
      ) : null}
      {p.questions.length ? (
        <section className="panneau-bloc__questions" aria-labelledby={`${id}-q`}>
          <p className="panneau-bloc__questions-tete" id={`${id}-q`}>
            Pour mieux répondre <span>facultatif</span>
          </p>
          {p.questions.map((question, i) => (
            <div key={question} className="panneau-bloc__question">
              <label htmlFor={`${id}-${i}`}>{question}</label>
              <ChampQuiGrandit id={`${id}-${i}`} className="pchamp" rows={1} maxLength={BLOC.reponse} value={reponses[question] ?? ""} onChange={(e) => onRepondre(question, e.target.value)} />
            </div>
          ))}
          <button type="button" className="btn btn--petit btn--ia" disabled={!repondu || attente} aria-busy={attente || undefined} onClick={onRedessiner}>
            <Icone nom="ia" />
            Redessiner avec mes réponses
          </button>
        </section>
      ) : null}
    </>
  );
}
