"use client";

import { Fragment, useEffect, useId, useRef, useState, type ReactNode } from "react";
import {
  BLOC, ceQuiSAjoute, estNouvelle, libelleDAjout, retirerChoix, retirerScene, totalDuChapitre,
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
};
const memoire = new Map<string, EtatDuBloc>();
const FERME: EtatDuBloc = { ouvert: false, origine: null, demande: "", proposition: null, demandee: "", prendre: false };

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

/** L'exemple sous le champ vide : la forme d'une demande, avec les mots d'un collègue. */
const EXEMPLE = "Par exemple : le héros arrive dans la forêt, où trois chemins s’offrent à lui : le sentier des fougères, le ruisseau, la grotte.";

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

  const proposer = async () => {
    const demande = etat.demande.trim();
    if (!demande || attente || sansOrigine) return;
    setAttente("proposer");
    setErreur(null);
    const r = await demanderLeBloc({ chapitre: services.chapitreId, origine: etat.origine, demande });
    setAttente(null);
    if (!r.ok) return setErreur(r.message);
    onOuvrir(null);
    setEtat((e) => ({ ...e, proposition: r.proposition, demandee: demande, prendre: false }));
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
        <div className="panneau-chemin__champ">
          <label htmlFor={`${id}-demande`}>
            {origine ? (
              <>
                La suite de <span className="panneau-bloc__origine">{nomScene(origine)}</span>
              </>
            ) : sansOrigine ? (
              "Cliquez la scène d’où partir"
            ) : (
              "Le début du chapitre"
            )}
          </label>
          <ChampQuiGrandit
            id={`${id}-demande`}
            className="pchamp"
            rows={3}
            value={etat.demande}
            maxLength={BLOC.demande}
            placeholder={EXEMPLE}
            onChange={(e) => setEtat((x) => ({ ...x, demande: e.target.value }))}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) void proposer();
            }}
          />
        </div>
        <div className="panneau-bloc__envoi">
          <button type="button" className="lien panneau-bloc__reglages" aria-expanded={voirReglages} aria-controls={`${id}-reglages`} onClick={() => setVoirReglages(!voirReglages)}>
            <Icone nom="reglages" />
            Réglages
          </button>
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
        {voirReglages ? <Reglages id={`${id}-reglages`} reglages={reglages} deClasse={deClasse} onChange={regler} /> : null}
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
            p={p} chemins={chemins} deClasse={deClasse} ouverte={ouverte} onOuvrir={onOuvrir}
            changerScene={changerScene} changerChoix={changerChoix}
            ordre={ordre}
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
                dire({ texte: "La proposition est laissée.", annuler: () => setEtat(() => avant) });
              }}
            >
              Laisser
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
 * Le bloc en arbre, dans l'ordre où le lecteur le parcourt : chaque choix, ce que fait le lecteur
 * et où il arrive ; sous une nouvelle scène, sa consigne repliée et ses propres choix.
 */
function Arbre({
  p, chemins, deClasse, ouverte, onOuvrir, changerScene, changerChoix, retirerScene, retirerChoix, ordre, avant,
}: {
  p: Proposition; chemins: Chemins; deClasse: boolean; ouverte: string | null; onOuvrir: (cle: string | null) => void;
  ordre: (id: string) => number;
  /** Ce qui touche la scène d'origine, en tête : la consigne qu'on peut lui donner */
  avant?: ReactNode;
  changerScene: (cle: string, maj: Partial<SceneProposee>) => void;
  changerChoix: (cle: string, libelle: string) => void;
  retirerScene: (cle: string) => void;
  retirerChoix: (cle: string) => void;
}) {
  const parCle = new Map(p.scenes.map((s) => [s.cle, s]));
  // Dans l'ordre où le schéma les montre, de gauche à droite
  const range = (choix: ChoixPropose[]) => [...choix].sort((a, b) => ordre(a.vers) - ordre(b.vers));
  const montrees = new Set<string>();
  const racine = p.origine ?? p.scenes.find((s) => !p.choix.some((c) => c.vers === s.cle))?.cle ?? null;

  const scene = (s: SceneProposee, enTete: ReactNode, niveau: number): ReactNode => {
    montrees.add(s.cle);
    const suites = range(p.choix.filter((c) => c.de === s.cle));
    return (
      <li key={s.cle} className={`bloc-ligne${ouverte === s.cle ? " est-ouverte" : ""}`} data-bloc={s.cle}>
        {enTete}
        <SceneDuBloc s={s} deClasse={deClasse} ouverte={ouverte === s.cle} onOuvrir={(oui) => onOuvrir(oui ? s.cle : null)} onChange={(m) => changerScene(s.cle, m)} onRetirer={() => retirerScene(s.cle)} />
        {suites.length && niveau < 4 ? <ul className="bloc-arbre bloc-arbre--sous">{suites.map((c) => choix(c, niveau + 1))}</ul> : null}
      </li>
    );
  };
  const choix = (c: ChoixPropose, niveau: number): ReactNode => {
    const libelle = (
      <input
        className="bloc-ligne__libelle"
        aria-label="Ce que fait le lecteur"
        value={c.libelle}
        maxLength={LIBELLE_MAX}
        placeholder="Ce que fait le lecteur"
        onChange={(e) => changerChoix(c.cle, e.target.value)}
      />
    );
    const nouvelle = parCle.get(c.vers);
    if (nouvelle && !montrees.has(nouvelle.cle)) {
      return scene(nouvelle, <span className="bloc-ligne__choix"><Icone nom="fleche" />{libelle}</span>, niveau);
    }
    // Vers une scène du chapitre, ou une nouvelle scène déjà montrée plus haut : le chemin la rejoint
    const existante = estNouvelle(p, c.vers) ? undefined : chemins.noeuds.find((n) => n.id === c.vers);
    return (
      <li key={c.cle} className="bloc-ligne bloc-ligne--rejoint">
        <span className="bloc-ligne__choix"><Icone nom="fleche" />{libelle}</span>
        <span className="bloc-ligne__rejoint">
          <Icone nom="entree" />
          {existante ? nomScene(existante) : `« ${nouvelle?.titre || "sans titre"} »`}
        </span>
        <button type="button" className="btn btn--discret panneau-chemin__retirer" aria-label={`Retirer le choix « ${c.libelle || "sans libellé"} »`} title="Retirer ce choix" onClick={() => retirerChoix(c.cle)}>
          <Icone nom="corbeille" />
        </button>
      </li>
    );
  };

  const premiers = p.origine ? range(p.choix.filter((c) => c.de === p.origine)) : [];
  const debut = !p.origine && racine ? parCle.get(racine) : undefined;
  return (
    <section className="panneau-bloc__propose" aria-labelledby="bloc-propose">
      <p className="panneau-bloc__propose-tete" id="bloc-propose">
        <span className="panneau-bloc__pointille" aria-hidden="true" />
        {ceQuiSAjoute(p)} proposés
        <span>Retouchez si besoin, puis ajoutez.</span>
      </p>
      {avant}
      <ul className="bloc-arbre">
        {debut ? scene(debut, null, 0) : premiers.map((c) => <Fragment key={c.cle}>{choix(c, 1)}</Fragment>)}
      </ul>
    </section>
  );
}

function SceneDuBloc({
  s, deClasse, ouverte, onOuvrir, onChange, onRetirer,
}: {
  s: SceneProposee; deClasse: boolean; ouverte: boolean; onOuvrir: (oui: boolean) => void;
  onChange: (m: Partial<SceneProposee>) => void; onRetirer: () => void;
}) {
  const id = useId();
  return (
    <div className="bloc-ligne__scene">
      <input
        className="bloc-ligne__titre"
        aria-label="Titre de la nouvelle scène"
        value={s.titre}
        maxLength={120}
        placeholder="Son titre"
        onChange={(e) => onChange({ titre: e.target.value })}
      />
      <button type="button" className="btn btn--discret panneau-chemin__retirer" aria-label={`Retirer la scène « ${s.titre || "sans titre"} »`} title="Retirer cette scène" onClick={onRetirer}>
        <Icone nom="corbeille" />
      </button>
      <button type="button" className="lien bloc-ligne__deplier" aria-expanded={ouverte} aria-controls={`${id}-consigne`} onClick={() => onOuvrir(!ouverte)}>
        <Icone nom={ouverte ? "chevron-haut" : "chevron-bas"} />
        {s.consigne ? (deClasse ? "Consigne et liste" : "Consigne") : "Sans consigne"}
      </button>
      {ouverte ? (
        <div className="bloc-ligne__consigne" id={`${id}-consigne`}>
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
