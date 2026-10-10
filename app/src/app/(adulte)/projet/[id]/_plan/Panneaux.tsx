"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Gommette } from "@/composants/Gommette";
import { Icone } from "@/composants/Icone";
import { ImageRepere } from "@/composants/ImageRepere";
import { Panneau, PiedFermer } from "@/composants/Panneau";
import { nomPourEleves } from "@/domaine/eleves";
import {
  chapitresDe, chercherScenes, COULEURS, departDe, referenceScene, scenesDe, type Chapitre, type ElevePlan, type Partie, type Plan,
  type Profil, type Supprime,
} from "@/domaine/recit";
import { attribuerChapitre, reglerChapitre, reglerPartie } from "../../actions-recit";

/** Enregistre un champ après une courte pause dans la frappe, et à la sortie du champ. */
function useEnregistrement() {
  const [enregistre, setEnregistre] = useState(false);
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const minuteur = useRef<ReturnType<typeof setTimeout> | null>(null);
  const attente = useRef<(() => Promise<{ ok: boolean; erreur?: string }>) | null>(null);

  const partir = async () => {
    if (minuteur.current) clearTimeout(minuteur.current);
    minuteur.current = null;
    const envoi = attente.current;
    attente.current = null;
    if (!envoi) return;
    setEnCours(true);
    const fait = await envoi();
    setEnCours(false);
    if (fait.ok) {
      setErreur(null);
      setEnregistre(true);
    } else setErreur(fait.erreur ?? "Cela n’a pas pu être enregistré.");
  };
  const prevoir = (envoi: () => Promise<{ ok: boolean; erreur?: string }>, delai = 700) => {
    setEnregistre(false);
    attente.current = envoi;
    if (minuteur.current) clearTimeout(minuteur.current);
    minuteur.current = setTimeout(() => void partir(), delai);
  };
  // Le panneau qui se ferme n'abandonne pas ce qui attendait d'être enregistré
  useEffect(
    () => () => {
      if (minuteur.current) clearTimeout(minuteur.current);
      void attente.current?.();
    },
    [],
  );
  return { enregistre, enCours, erreur, prevoir, partir, setErreur };
}

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
                onChange={() => e.prevoir(() => reglerChapitre(chapitre.id, { couleur: i }), 0)}
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
          onChange={(ev) => {
            setResume(ev.target.value);
            e.prevoir(() => reglerChapitre(chapitre.id, { resume: ev.target.value }));
          }}
          onBlur={() => void e.partir()}
        />
        <p>
          {lisibleParLesEleves
            ? "Ce qui se passe dans ce chapitre. Les élèves du chapitre peuvent le lire."
            : "Ce qui se passe dans ce chapitre, pour vous en souvenir."}
        </p>
      </section>
    </Panneau>
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
