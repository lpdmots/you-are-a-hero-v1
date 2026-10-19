"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Agrandissable } from "@/composants/Agrandissable";
import { useAidesIa } from "@/composants/AidesIa";
import { Gommette } from "@/composants/Gommette";
import { Icone } from "@/composants/Icone";
import { ImageRepere } from "@/composants/ImageRepere";
import { useEnregistrement } from "@/composants/Enregistrement";
import { useMessage } from "@/composants/Messages";
import { Panneau, PiedFermer } from "@/composants/Panneau";
import { MESSAGES_IA } from "@/domaine/aides-ia";
import { nomPourEleves } from "@/domaine/eleves";
import { nomDeFichier } from "@/domaine/illustration";
import { adresseRepereEnGrand } from "@/domaine/visuels";
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
  chapitre, neuf, lisibleParLesEleves, entrer, onImage, onFermer,
}: {
  chapitre: Chapitre; neuf: boolean; lisibleParLesEleves: boolean;
  /** Depuis « Parties et chapitres » : « Entrer dans le chapitre » au bas des réglages ; rien dans la page du chapitre */
  entrer?: string;
  onImage: () => void; onFermer: () => void;
}) {
  const routeur = useRouter();
  const [titre, setTitre] = useState(chapitre.titre);
  const [resume, setResume] = useState(chapitre.resume);
  const e = useEnregistrement();
  const changerResume = (v: string, delai = 700) => {
    setResume(v);
    e.prevoir(() => reglerChapitre(chapitre.id, { resume: v }), delai, "resume");
  };
  const resumeIa = useResumeIa(chapitre.id, resume, () => e.partir(), (v) => changerResume(v, 0));
  return (
    <Panneau
      titre="Réglages du chapitre"
      sous={chapitre.titre}
      onFermer={onFermer}
      pied={
        <>
          {entrer ? (
            // Ce qui vient d'être tapé s'enregistre avant d'entrer
            <button type="button" className="btn btn--primaire btn--grand" onClick={() => void e.partir().then(() => routeur.push(entrer))}>
              Entrer dans le chapitre
              <Icone nom="fleche" />
            </button>
          ) : null}
          <PiedFermer enregistre={e.enregistre} enCours={e.enCours} onFermer={onFermer} />
        </>
      }
    >
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
        <h3 className="reg-resume__tete">
          <span>
            <label htmlFor="chap-resume">Résumé</label> <span className="facultatif">facultatif</span>
          </span>
          {resumeIa.proposer ? (
            <button
              type="button"
              className="btn btn--ia ci__ia"
              disabled={resumeIa.attente}
              aria-busy={resumeIa.attente || undefined}
              onClick={() => void resumeIa.demander()}
              aria-label={resume.trim() ? "Proposer un autre résumé avec l’IA" : "Proposer un résumé avec l’IA"}
              title="Demander à l’IA"
            >
              <Icone nom="ia" />
            </button>
          ) : null}
        </h3>
        <span className="ci__zone">
          <textarea
            className="pchamp"
            id="chap-resume"
            rows={5}
            maxLength={4000}
            value={resumeIa.attente ? "" : resume}
            readOnly={resumeIa.attente}
            onChange={(ev) => changerResume(ev.target.value)}
            onBlur={() => void e.partir()}
          />
          {resumeIa.attente ? (
            <span className="ci__points" role="status" aria-label="L’IA rédige un résumé">
              <i />
              <i />
              <i />
            </span>
          ) : null}
        </span>
        <p>
          {lisibleParLesEleves
            ? "Le lieu et son ambiance, en une ou deux phrases. Les élèves du chapitre peuvent le lire."
            : "Le lieu et son ambiance, en une ou deux phrases, pour vous en souvenir."}
        </p>
      </section>
      <section>
        <h3>
          Image <span className="facultatif">facultative</span>
        </h3>
        <div className="reg-image">
          <Agrandissable className="reg-image__vue" src={adresseRepereEnGrand(chapitre, chapitre.id)} nom={`l’image de « ${chapitre.titre} »`} fichier={nomDeFichier("Image de", chapitre.titre)}>
            <ImageRepere repere={chapitre} graine={chapitre.id} />
          </Agrandissable>
          {/* Le résumé tapé s'enregistre d'abord : l'image se crée d'après lui (F10.1) */}
          <span className="reg-image__gestes">
            <button type="button" className="btn btn--petit" onClick={() => void e.partir().then(onImage)}>
              Choisir une image
            </button>
            {chapitre.imageId ? (
              <a className="lien cx-discret" href={`/images/${chapitre.imageId}`} download={nomDeFichier("Image de", chapitre.titre)}>
                <Icone nom="telecharger" />
                Télécharger
              </a>
            ) : null}
          </span>
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
    </Panneau>
  );
}

/**
 * « ✦ Proposer un résumé » (F13.5, repris le 18 octobre 2026 sur la remarque du porteur) : un petit ✦
 * rond au niveau du libellé, comme pour l'image d'une scène ; pendant la demande il scintille et trois
 * points battent dans le champ ; le résumé proposé prend place dans le champ, modifiable, avec
 * « Annuler » dans le message. D'après le résumé enregistré, la place du chapitre dans le plan et
 * les titres et consignes de ses scènes.
 */
function useResumeIa(chapitreId: string, resume: string, avantDeDemander: () => Promise<void>, utiliser: (v: string) => void) {
  const { proposer } = useAidesIa();
  const dire = useMessage();
  const [attente, setAttente] = useState(false);
  const demander = async () => {
    if (attente) return;
    setAttente(true);
    await avantDeDemander();
    const r = await demanderAuPlan({ sorte: "resume", chapitre: chapitreId });
    setAttente(false);
    if (!r.ok) return dire({ texte: r.message });
    if (r.sorte !== "resume") return dire({ texte: MESSAGES_IA.pasDeReponse });
    // Rien de nouveau : le dire, plutôt qu'un résumé qui semble ne rien changer
    if (r.resume.trim() === resume.trim()) return dire({ texte: "L’IA n’a rien à changer à ce résumé." });
    const avant = resume;
    utiliser(r.resume);
    dire({ texte: avant.trim() ? "Résumé remplacé." : "Résumé ajouté.", annuler: () => utiliser(avant) });
  };
  return { proposer, attente, demander };
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
          <Agrandissable className="reg-image__vue" src={adresseRepereEnGrand(partie, partie.id)} nom={`l’image de « ${partie.titre} »`} fichier={nomDeFichier("Image de", partie.titre)}>
            <ImageRepere repere={partie} graine={partie.id} />
          </Agrandissable>
          <span className="reg-image__gestes">
            <button type="button" className="btn btn--petit" onClick={onImage}>
              Choisir une image
            </button>
            {partie.imageId ? (
              <a className="lien cx-discret" href={`/images/${partie.imageId}`} download={nomDeFichier("Image de", partie.titre)}>
                <Icone nom="telecharger" />
                Télécharger
              </a>
            ) : null}
          </span>
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
