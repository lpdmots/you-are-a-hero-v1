"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { useAidesIa } from "@/composants/AidesIa";
import { ChampQuiGrandit } from "@/composants/ChampQuiGrandit";
import { Gommette } from "@/composants/Gommette";
import { Icone } from "@/composants/Icone";
import { ImageRepere } from "@/composants/ImageRepere";
import { useEnregistrement } from "@/composants/Enregistrement";
import { useMessage } from "@/composants/Messages";
import { Panneau, PiedFermer } from "@/composants/Panneau";
import { MESSAGES_IA } from "@/domaine/aides-ia";
import { nomPourEleves } from "@/domaine/eleves";
import {
  chapitresDe, chercherScenes, COULEURS, departDe, referenceScene, scenesDe, type Chapitre, type ElevePlan, type Partie, type Plan,
  type Profil, type Supprime,
} from "@/domaine/recit";
import { attribuerChapitre, reglerChapitre, reglerPartie } from "../../actions-recit";
import { demanderAuPlan } from "./IdeesDeParties";

function ChampTitre({ id, valeur, onChange, onSortie, selectionne }: { id: string; valeur: string; onChange: (v: string) => void; onSortie: () => void; selectionne: boolean }) {
  const ref = useRef<HTMLInputElement>(null);
  // Un élément qu'on vient d'ajouter s'ouvre titre sélectionné : on écrit le sien par-dessus
  useEffect(() => {
    if (selectionne) ref.current?.select();
  }, [selectionne]);
  return <input ref={ref} className="pchamp" id={id} type="text" value={valeur} maxLength={120} data-focus onChange={(e) => onChange(e.target.value)} onBlur={onSortie} />;
}

/** Réglages d'un chapitre : titre, image, couleur, résumé (F03.1, F10.1). */
export function ReglagesChapitre({
  chapitre, neuf, lisibleParLesEleves, onImage, onFermer,
}: {
  chapitre: Chapitre; neuf: boolean; lisibleParLesEleves: boolean; onImage: () => void; onFermer: () => void;
}) {
  const [titre, setTitre] = useState(chapitre.titre);
  const [resume, setResume] = useState(chapitre.resume);
  const e = useEnregistrement();
  const changerResume = (v: string, delai = 700) => {
    setResume(v);
    e.prevoir(() => reglerChapitre(chapitre.id, { resume: v }), delai, "resume");
  };
  return (
    <Panneau titre="Réglages du chapitre" sous={chapitre.titre} onFermer={onFermer} pied={<PiedFermer enregistre={e.enregistre} enCours={e.enCours} onFermer={onFermer} />}>
      <section>
        <h3>
          <label htmlFor="chap-titre">Titre</label>
        </h3>
        <ChampTitre
          id="chap-titre"
          valeur={titre}
          selectionne={neuf}
          onChange={(v) => {
            setTitre(v);
            if (v.trim()) e.prevoir(() => reglerChapitre(chapitre.id, { titre: v }));
          }}
          onSortie={() => void e.partir()}
        />
        {e.erreur ? (
          <p className="erreur" role="alert">
            {e.erreur}
          </p>
        ) : null}
      </section>
      <section>
        <h3>
          Image <span className="facultatif">facultative</span>
        </h3>
        <div className="reg-image">
          <span className="reg-image__vue">
            <ImageRepere repere={chapitre} graine={chapitre.id} />
          </span>
          <button type="button" className="btn btn--petit" onClick={onImage}>
            Choisir une image
          </button>
        </div>
      </section>
      <section>
        <h3 id="chap-couleur">Couleur</h3>
        <fieldset className="palette" aria-labelledby="chap-couleur">
          {COULEURS.map((c, i) => (
            <label key={c.cle} title={c.nom}>
              <input
                type="radio"
                name="chap-couleur"
                value={i}
                checked={chapitre.couleur === i}
                aria-label={c.nom}
                onChange={() => e.prevoir(() => reglerChapitre(chapitre.id, { couleur: i }), 0, "couleur")}
              />
              <span style={{ "--c": c.dos } as CSSProperties} />
            </label>
          ))}
        </fieldset>
      </section>
      <section>
        <h3>
          <label htmlFor="chap-resume">Résumé</label> <span className="facultatif">facultatif</span>
        </h3>
        <textarea
          className="pchamp"
          id="chap-resume"
          rows={5}
          maxLength={4000}
          value={resume}
          onChange={(ev) => changerResume(ev.target.value)}
          onBlur={() => void e.partir()}
        />
        <p>
          {lisibleParLesEleves
            ? "Ce qui se passe dans ce chapitre. Les élèves du chapitre peuvent le lire."
            : "Ce qui se passe dans ce chapitre, pour vous en souvenir."}
        </p>
        <ResumePropose chapitreId={chapitre.id} resume={resume} avantDeDemander={() => e.partir()} onUtiliser={(v) => changerResume(v, 0)} />
      </section>
    </Panneau>
  );
}

/**
 * « ✦ Proposer un résumé » (F13.5) : d'après le résumé enregistré, la place du chapitre dans le
 * plan et les titres et consignes de ses scènes. La proposition se retouche, et ne remplace le
 * résumé qu'à « Utiliser ce texte » ; « Annuler » dans le message rend l'ancien.
 */
function ResumePropose({
  chapitreId, resume, avantDeDemander, onUtiliser,
}: {
  chapitreId: string;
  resume: string;
  avantDeDemander: () => Promise<void>;
  onUtiliser: (v: string) => void;
}) {
  const { proposer } = useAidesIa();
  const dire = useMessage();
  const [propose, setPropose] = useState<string | null>(null);
  const [attente, setAttente] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [reste, setReste] = useState<string | null>(null);
  const cadre = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (propose !== null) cadre.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [propose !== null]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!proposer) return null;
  const demander = async () => {
    setAttente(true);
    setErreur(null);
    await avantDeDemander();
    const r = await demanderAuPlan({ sorte: "resume", chapitre: chapitreId });
    setAttente(false);
    if (!r.ok) return setErreur(r.message);
    if (r.sorte !== "resume") return setErreur(MESSAGES_IA.pasDeReponse);
    setReste(r.reste);
    // Rien de nouveau : le dire, plutôt qu'une proposition qui semble ne rien changer
    if (r.resume.trim() === resume.trim()) {
      setPropose(null);
      return setErreur("L’IA n’a rien à changer à ce résumé.");
    }
    setPropose(r.resume);
  };
  const utiliser = () => {
    if (propose === null) return;
    const avant = resume;
    onUtiliser(propose);
    setPropose(null);
    dire({ texte: avant.trim() ? "Résumé remplacé." : "Résumé ajouté.", annuler: () => onUtiliser(avant) });
  };
  return (
    <div className="resume-ia">
      {/* Pendant la décision, un seul bouton d'IA : « Un autre », dans la proposition */}
      {propose === null ? (
        <button type="button" className="btn btn--ia" onClick={() => void demander()} disabled={attente} aria-busy={attente || undefined}>
          <Icone nom="ia" />
          {resume.trim() ? "Proposer un autre résumé" : "Proposer un résumé"}
        </button>
      ) : null}
      {attente ? (
        <p className="ix__attente" role="status">
          <Icone nom="ia" />
          L’IA rédige un résumé…
        </p>
      ) : erreur ? (
        <p className={erreur.startsWith("L’IA n’a rien") ? "ix__reste" : "ix__erreur"} role="alert">
          {erreur}
        </p>
      ) : null}
      {propose !== null && !attente ? (
        <div ref={cadre} className="ia-propose ia-propose--consigne" role="group" aria-labelledby={`resume-propose-${chapitreId}`}>
          <p className="ia-propose__tete" id={`resume-propose-${chapitreId}`}>
            <Icone nom="ia" />
            Résumé proposé <span>· modifiable</span>
          </p>
          <ChampQuiGrandit className="pchamp" rows={3} maxLength={4000} value={propose} aria-label="Résumé proposé" onChange={(ev) => setPropose(ev.target.value)} />
          <span className="ia-propose__gestes">
            <button type="button" className="btn btn--petit" disabled={!propose.trim()} onClick={utiliser}>
              <Icone nom="coche" />
              Utiliser ce texte
            </button>
            <button type="button" className="btn btn--petit btn--ia" onClick={() => void demander()} disabled={attente} aria-busy={attente || undefined}>
              <Icone nom="ia" />
              Un autre
            </button>
            <button type="button" className="btn btn--petit btn--discret" onClick={() => setPropose(null)}>
              Laisser
            </button>
          </span>
          {reste ? <p className="ix__reste">{reste}</p> : null}
        </div>
      ) : null}
    </div>
  );
}

/** Réglages d'une partie : titre et image (F03.1, F10.1). */
export function ReglagesPartie({ partie, neuf, onImage, onFermer }: { partie: Partie; neuf: boolean; onImage: () => void; onFermer: () => void }) {
  const [titre, setTitre] = useState(partie.titre);
  const e = useEnregistrement();
  return (
    <Panneau titre="Réglages de la partie" sous={partie.titre} onFermer={onFermer} pied={<PiedFermer enregistre={e.enregistre} enCours={e.enCours} onFermer={onFermer} />}>
      <section>
        <h3>
          <label htmlFor="partie-titre">Titre</label>
        </h3>
        <ChampTitre
          id="partie-titre"
          valeur={titre}
          selectionne={neuf}
          onChange={(v) => {
            setTitre(v);
            if (v.trim()) e.prevoir(() => reglerPartie(partie.id, { titre: v }));
          }}
          onSortie={() => void e.partir()}
        />
        {e.erreur ? (
          <p className="erreur" role="alert">
            {e.erreur}
          </p>
        ) : null}
      </section>
      <section>
        <h3>
          Image <span className="facultatif">facultative</span>
        </h3>
        <div className="reg-image">
          <span className="reg-image__vue">
            <ImageRepere repere={partie} graine={partie.id} />
          </span>
          <button type="button" className="btn btn--petit" onClick={onImage}>
            Choisir une image
          </button>
        </div>
      </section>
    </Panneau>
  );
}

/**
 * « Attribuer des élèves » (F06.1) : un élève coché lit et écrit dans ce chapitre, tout de
 * suite. Sous un élève coché, une case dit le profil par ce qu'il permet.
 */
export function AttribuerEleves({
  chapitre, plan, eleves, classe, onFermer,
}: {
  chapitre: Chapitre; plan: Plan; eleves: ElevePlan[]; classe: { id: string; nom: string } | null; onFermer: () => void;
}) {
  const [choisis, setChoisis] = useState<Map<string, Profil>>(() => new Map(chapitre.attributions.map((a) => [a.eleveId, a.profil])));
  const e = useEnregistrement();

  const ailleurs = (eleveId: string): string[] =>
    chapitresDe(plan)
      .filter((c) => c.id !== chapitre.id && c.attributions.some((a) => a.eleveId === eleveId))
      .map((c) => c.titre);
  // L'ordre est celui de l'ouverture : les élèves du chapitre, puis ceux qui n'en ont pas, puis les autres.
  // Il ne bouge pas quand on coche.
  const [ordre] = useState(() => {
    const rang = (x: ElevePlan) => (chapitre.attributions.some((a) => a.eleveId === x.id) ? 0 : ailleurs(x.id).length === 0 ? 1 : 2);
    return [...eleves].sort((a, b) => rang(a) - rang(b)).map((x) => ({ eleve: x, groupe: rang(x) }));
  });

  const changer = (suite: Map<string, Profil>) => {
    setChoisis(suite);
    e.prevoir(() => attribuerChapitre(chapitre.id, [...suite].map(([eleve, profil]) => ({ eleve, profil }))), 0);
  };
  const cocher = (id: string, coche: boolean) => {
    const suite = new Map(choisis);
    if (coche) suite.set(id, "propositions");
    else suite.delete(id);
    changer(suite);
  };
  const profiler = (id: string, organise: boolean) => changer(new Map(choisis).set(id, organise ? "organisation" : "propositions"));

  const titres = ["Dans ce chapitre", "Sans chapitre", "Dans un autre chapitre"];
  return (
    <Panneau titre="Attribuer des élèves" sous={chapitre.titre} onFermer={onFermer} pied={<PiedFermer enregistre={e.enregistre} enCours={e.enCours} onFermer={onFermer} />}>
      {!classe ? (
        <section>
          <p>Ce projet n’a pas encore de classe. Choisissez-la sous le titre du projet, puis revenez attribuer ce chapitre.</p>
        </section>
      ) : eleves.length === 0 ? (
        <section>
          <p>Aucun élève n’est inscrit dans la classe {classe.nom}.</p>
          <Link className="btn" href={`/classes/${classe.id}/inscrire`}>
            <Icone nom="plus" />
            Inscrire des élèves
          </Link>
        </section>
      ) : (
        <section>
          <p>Un élève coché lit et écrit dans ce chapitre, tout de suite.</p>
          {e.erreur ? (
            <p className="erreur" role="alert">
              {e.erreur}
            </p>
          ) : null}
          <ul className="liste-eleves">
            {ordre.map(({ eleve, groupe }, i) => {
              const coche = choisis.has(eleve.id);
              const autres = ailleurs(eleve.id);
              return (
                <li key={eleve.id}>
                  {i === 0 || ordre[i - 1].groupe !== groupe ? <p className="liste-eleves__titre">{titres[groupe]}</p> : null}
                  <label className="eleve-ligne">
                    <input type="checkbox" className="case" checked={coche} onChange={(ev) => cocher(eleve.id, ev.target.checked)} />
                    <Gommette prenom={eleve.prenom} couleur={eleve.couleur} taille="s" />
                    <span>{nomPourEleves(eleve, eleves)}</span>
                    {autres.length ? <span className="eleve-ligne__ou">{autres.join(", ")}</span> : null}
                  </label>
                  {coche ? (
                    <label className="eleve-profil">
                      <input type="checkbox" className="case" checked={choisis.get(eleve.id) === "organisation"} onChange={(ev) => profiler(eleve.id, ev.target.checked)} />
                      <span>peut créer des scènes et des choix</span>
                    </label>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </Panneau>
  );
}

const SORTE: Record<Supprime["sorte"], string> = { partie: "Partie", chapitre: "Chapitre", scene: "Scène" };

/** « Corbeille du projet » (F03.1) : ce qui a été supprimé, et « Restaurer » qui le remet à sa place. */
export function Corbeille({
  corbeille, attente, onRestaurer, onFermer,
}: {
  corbeille: Supprime[]; attente: string | null; onRestaurer: (element: Supprime) => void; onFermer: () => void;
}) {
  return (
    <Panneau
      titre="Corbeille du projet"
      sous="Ce que vous supprimez attend ici, avec ses textes."
      onFermer={onFermer}
      pied={
        <button type="button" className="btn btn--grand" onClick={onFermer}>
          Fermer
        </button>
      }
    >
      <section>
        {corbeille.length === 0 ? (
          <p>La corbeille est vide.</p>
        ) : (
          <ul className="corbeille">
            {corbeille.map((x) => (
              <li key={`${x.sorte}-${x.id}`}>
                <span className="corbeille__nom">{x.nom}</span>
                {x.parentSupprime ? null : (
                  <button
                    type="button"
                    className="btn btn--petit"
                    disabled={attente !== null}
                    aria-busy={attente === x.id || undefined}
                    aria-label={`Restaurer ${x.nom}`}
                    onClick={() => onRestaurer(x)}
                  >
                    Restaurer
                  </button>
                )}
                <span className="corbeille__ou">
                  {SORTE[x.sorte]}
                  {x.dans ? ` · était dans « ${x.dans} »` : ""}
                </span>
                {x.parentSupprime ? <span className="corbeille__parent">Restaurez d’abord « {x.parentSupprime} ».</span> : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </Panneau>
  );
}

/**
 * « Choisir le départ du livre » (F03.2) : un champ cherche les scènes du livre entier ; en
 * choisir une la désigne. Le sélecteur ne crée pas de scène.
 */
export function ChoisirDepart({ plan, onChoisir, onFermer }: { plan: Plan; onChoisir: (sceneId: string) => void; onFermer: () => void }) {
  const [demande, setDemande] = useState("");
  const depart = departDe(plan);
  const groupes = demande.trim()
    ? chercherScenes(plan, demande)
    : chapitresDe(plan)
        .filter((c) => c.scenes.length)
        .map((chapitre) => ({ chapitre, scenes: chapitre.scenes }));
  return (
    <Panneau
      titre="Choisir le départ du livre"
      sous="La scène par laquelle le lecteur commence. Il n’y en a qu’une."
      onFermer={onFermer}
      pied={
        <button type="button" className="btn btn--grand" onClick={onFermer}>
          Fermer
        </button>
      }
    >
      <section>
        {scenesDe(plan).length === 0 ? (
          <p>Le livre n’a pas encore de scène. Ajoutez-en une dans un chapitre, puis revenez la désigner.</p>
        ) : (
          <>
            <label className="recherche">
              <span className="vh">Rechercher une scène</span>
              <Icone nom="loupe" />
              <input type="search" placeholder="Rechercher une scène" value={demande} data-focus onChange={(e) => setDemande(e.target.value)} />
            </label>
            {groupes.length === 0 ? <p>Aucune scène trouvée pour « {demande.trim()} ».</p> : null}
            {groupes.map(({ chapitre, scenes }) => (
              <div key={chapitre.id} style={{ width: "100%" }}>
                <p className="liste-eleves__titre">{chapitre.titre}</p>
                <ul className="corbeille">
                  {scenes.map((s) => (
                    <li key={s.id}>
                      <span className="corbeille__nom">
                        <span className="fiche__ref">{referenceScene(s.reference)}</span> {s.titre ?? "sans titre"}
                      </span>
                      {depart?.id === s.id ? (
                        <span className="repere repere--depart">
                          <Icone nom="drapeau" />
                          Départ du livre
                        </span>
                      ) : (
                        <button type="button" className="btn btn--petit" aria-label={`Choisir ${referenceScene(s.reference)}`} onClick={() => onChoisir(s.id)}>
                          Choisir
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </>
        )}
      </section>
    </Panneau>
  );
}
