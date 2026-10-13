"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Bulle } from "@/composants/Bulle";
import { Gommette } from "@/composants/Gommette";
import { Icone } from "@/composants/Icone";
import { useMessage } from "@/composants/Messages";
import { TamponScene } from "@/composants/TamponScene";
import { nomPourEleves } from "@/domaine/eleves";
import {
  completer, decompte, elevesACompleter, feuilles, horsFiche, repartir, surAucuneFeuille, type Feuille, type HorsFiche, type Partage,
} from "@/domaine/fiches";
import { couleurDeChapitre, nomScene, referenceScene, type Chapitre, type ElevePlan, type Plan, type Scene } from "@/domaine/recit";
import { pluriel } from "@/domaine/texte";
import type { ContenuDeFiche } from "@/serveur/fiches";
import { annulerRepartition, repartirScenes, type SceneDonnee } from "../../actions-fiches";

const vars = (rang: number): CSSProperties => {
  const c = couleurDeChapitre(rang);
  return { "--dos": c.dos, "--bandeau": c.bandeau, "--teinte": c.teinte } as CSSProperties;
};
const POURQUOI: Record<HorsFiche, string> = {
  "sans-consigne": "sans consigne : pas imprimée",
  enseignant: "à votre nom : pas de fiche",
  "ne-s-ecrit-plus": "plus rien à écrire",
};
const SANS_PARTAGE: Partage = { propositions: new Map(), sansEleve: [] };

/**
 * Fiches de rédaction (F07.4 ; docs/design.md, « Suivi repris après critique », « Page des
 * fiches ») : à gauche, les scènes à travailler sur papier ; à droite, comment les feuilles
 * se font, ce qui va sortir, et la feuille. Ce qui est affiché est ce qui s'imprime. En
 * « par élève », les scènes que personne n'a prises peuvent être réparties entre les élèves
 * de leur chapitre : ce n'est qu'une proposition, donnée à l'impression, après un message.
 */
export function Fiches({
  projet, plan, eleves, contenus, depart, retour,
}: {
  projet: { id: string; titre: string };
  plan: Plan; eleves: ElevePlan[];
  contenus: Record<string, ContenuDeFiche>;
  /** Ce que le Suivi listait en ouvrant les fiches : les scènes cochées, l'élève choisi (F06-AC57) */
  depart: { choisies: string[]; eleve: string | null };
  /** L'adresse du Suivi d'où l'on vient, avec ses filtres */
  retour: string;
}) {
  const dire = useMessage();
  const [choisies, setChoisies] = useState(() => new Set(depart.choisies));
  const [eleveId, setEleveId] = useState(depart.eleve);
  const [par, setPar] = useState<"chapitre" | "eleve">(depart.eleve ? "eleve" : "chapitre");
  const [suite, setSuite] = useState(false);
  const [repartit, setRepartit] = useState(false);
  const [plafondOuvert, setPlafondOuvert] = useState(false);
  const [plafond, setPlafond] = useState<number | null>(null);
  const [completes, setCompletes] = useState<string[]>([]);
  const [vue, setVue] = useState(0);
  const [confirme, setConfirme] = useState(false);
  // Le partage fait à la confirmation : il s'annule tant qu'on reste sur la page (F07-AC73)
  const [faites, setFaites] = useState<SceneDonnee[]>([]);
  const [occupe, setOccupe] = useState(false);
  const titreMessage = useRef<HTMLParagraphElement>(null);
  const boutonImprimer = useRef<HTMLButtonElement>(null);
  const lienDuNombre = useRef<HTMLButtonElement>(null);

  const nom = (e: ElevePlan) => nomPourEleves(e, eleves);
  const eleve = eleves.find((e) => e.id === eleveId) ?? null;
  const parEleve = par === "eleve";
  const chapitres = plan.parties.flatMap((p) => p.chapitres);
  const toutes = chapitres.flatMap((c) => c.scenes);
  const montree = (s: Scene) => !eleve || s.priseParEleve === eleve.id;

  // Le partage n'existe qu'en « par élève », tous élèves affichés (F07-AC60)
  const partageable = parEleve && !eleve;
  const partage: Partage = !partageable
    ? SANS_PARTAGE
    : repartit
      ? repartir(plan, eleves, choisies, plafond)
      : plafond !== null && completes.length
        ? completer(plan, eleves, choisies, plafond, completes)
        : SANS_PARTAGE;
  // Ce qui vient d'être donné reste sur les feuilles, que la page ait relu le plan ou non
  const propositions = new Map(partage.propositions);
  for (const d of faites) if (!toutes.find((s) => s.id === d.scene)?.priseParEleve) propositions.set(d.scene, d.eleve);
  const reglage = { par, eleve: eleveId, propositions };
  const lesFeuilles = feuilles(plan, eleves, choisies, reglage);
  const aucune = surAucuneFeuille(plan, choisies, reglage);
  const attribuable = (s: Scene) => (chapitres.find((c) => c.id === s.chapitreId)?.attributions.length ?? 0) > 0;
  const aRepartir = partageable && !repartit ? aucune.filter(attribuable).length : 0;
  const aCompleter = partageable && !repartit ? elevesACompleter(plan, eleves, choisies, plafond) : [];
  // Un prénom ne se clique que s'il reste une scène libre à lui proposer
  const recevrait = (id: string): boolean =>
    plafond !== null && [...completer(plan, eleves, choisies, plafond, [...completes, id]).propositions.values()].includes(id);
  const nProp = partage.propositions.size;
  const feuille = lesFeuilles[Math.min(vue, Math.max(0, lesFeuilles.length - 1))] ?? null;
  const nScenes = lesFeuilles.reduce((n, f) => n + f.chapitres.reduce((m, c) => m + c.scenes.length, 0), 0);

  useEffect(() => {
    if (confirme) titreMessage.current?.focus({ preventScroll: true });
  }, [confirme]);
  // Le message refermé sans rien donner : le clavier revient au bouton qui l'avait ouvert
  const refermer = () => {
    setConfirme(false);
    window.requestAnimationFrame(() => boutonImprimer.current?.focus({ preventScroll: true }));
  };

  const cocher = (ids: string[], oui: boolean) => {
    setConfirme(false);
    setChoisies((avant) => {
      const suivant = new Set(avant);
      for (const id of ids) {
        if (oui) suivant.add(id);
        else suivant.delete(id);
      }
      return suivant;
    });
  };
  const ajouter = (lesquelles: (s: Scene) => boolean) => cocher(toutes.filter((s) => montree(s) && horsFiche(s) === null && lesquelles(s)).map((s) => s.id), true);
  const changerDeTirage = (suivant: "chapitre" | "eleve") => {
    setPar(suivant);
    setVue(0);
    setConfirme(false);
  };

  const imprimer = () => {
    // Des scènes sont proposées : un message demande d'abord de le confirmer (F07-AC59)
    if (nProp) return setConfirme(true);
    window.print();
  };
  const repartirEtImprimer = async () => {
    setOccupe(true);
    const fait = await repartirScenes(projet.id, [...partage.propositions].map(([scene, e]) => ({ scene, eleve: e })));
    setOccupe(false);
    setConfirme(false);
    if (!fait.ok) return dire({ texte: fait.erreur });
    setFaites((avant) => [...avant, ...fait.donnees]);
    setRepartit(false);
    setCompletes([]);
    const manque = nProp - fait.donnees.length;
    if (manque) dire({ texte: `${manque} scène${pluriel(manque)} ${manque > 1 ? "venaient d’être prises : elles restent" : "venait d’être prise : elle reste"} à l’élève qui s’en occupe.` });
    // La fenêtre d'impression s'ouvre une fois les feuilles à jour
    window.setTimeout(() => window.print(), 150);
  };
  const annuler = async () => {
    setOccupe(true);
    const fait = await annulerRepartition(projet.id, faites);
    setOccupe(false);
    if (!fait.ok) return dire({ texte: fait.erreur });
    const gardees = faites.length - fait.rendues;
    setFaites([]);
    dire({
      texte: `${fait.rendues} scène${pluriel(fait.rendues)} ${fait.rendues > 1 ? "sont de nouveau" : "est de nouveau"} « Pas encore prise ».${
        gardees ? ` ${gardees} ${gardees > 1 ? "ont été prises" : "a été prise"} entre-temps par un autre élève.` : ""
      }`,
    });
  };

  // ——— La liste : par partie et chapitre, ce qui se choisit et ce qui ne se choisit pas ———
  const ligne = (s: Scene) => {
    const raison = horsFiche(s);
    const tenue = eleves.find((e) => e.id === s.priseParEleve);
    const proposee = eleves.find((e) => e.id === propositions.get(s.id));
    const ref = referenceScene(s.reference);
    return (
      <label key={s.id} className={`lot-scene${raison ? " lot-scene--hors" : ""}`}>
        <input
          type="checkbox"
          className="case"
          aria-label={`${ref}${s.titre ? ` ${s.titre}` : ""}${raison ? `, ${POURQUOI[raison]}` : ""}`}
          checked={!raison && choisies.has(s.id)}
          disabled={!!raison}
          onChange={(e) => cocher([s.id], e.target.checked)}
        />
        <span className="fiche__ref">{ref}</span>
        <span className="lot-scene__titre">
          {s.titre ?? <span className="sans-consigne">sans titre</span>}
          {raison ? <span className="sans-consigne">{POURQUOI[raison]}</span> : null}
        </span>
        {tenue ? (
          <span className="lot-scene__qui" title={`${nom(tenue)} s’en occupe`}>
            <Gommette prenom={tenue.prenom} couleur={tenue.couleur} taille="s" />
          </span>
        ) : proposee ? (
          // L'élève proposé, en pointillé : rien ne lui est donné avant l'impression
          <span className="lot-scene__qui lot-scene__qui--propose" title={`Proposée à ${nom(proposee)}`}>
            <Gommette prenom={proposee.prenom} couleur={proposee.couleur} taille="s" />
            <span className="vh">proposée à {nom(proposee)}</span>
          </span>
        ) : null}
        <TamponScene etat={s.etat} vide={s.texteVide} />
      </label>
    );
  };
  const liste = plan.parties.flatMap((p) => {
    const lesChapitres = p.chapitres.filter((c) => c.scenes.some(montree));
    return lesChapitres.length
      ? [
          <section key={p.id} className="lot-partie">
            <h2>{p.titre}</h2>
            {lesChapitres.map((c) => (
              <fieldset key={c.id} className="lot-chap" style={vars(c.couleur)}>
                <legend>{c.titre}</legend>
                {c.scenes.filter(montree).map(ligne)}
              </fieldset>
            ))}
          </section>,
        ]
      : [];
  });

  // ——— Ce que la page dit du tirage, à la place où le message de demande s'ouvrira ———
  const versChapitre = (
    <button type="button" className="lien" onClick={() => changerDeTirage("chapitre")}>
      Passer par chapitre
    </button>
  );
  const lesRepartir = aRepartir ? (
    <>
      <button type="button" className="lien" onClick={() => { setRepartit(true); setCompletes([]); setVue(0); }}>
        {aRepartir > 1 ? "Les répartir" : "La répartir"} entre les élèves du chapitre
      </button>{" "}
      ·{" "}
    </>
  ) : null;
  const une = nProp === 1 ? [...partage.propositions][0] : null;
  const nomDe = (id: string) => {
    const e = eleves.find((x) => x.id === id);
    return e ? nom(e) : "un élève";
  };
  const refDe = (id: string) => referenceScene(toutes.find((s) => s.id === id)?.reference ?? 0);
  const nomDeScene = (id: string) => {
    const laScene = toutes.find((x) => x.id === id);
    return laScene ? nomScene(laScene) : refDe(id);
  };
  // Pourquoi des scènes restent sans élève après un partage : le nombre fixé, quand leur chapitre a des élèves
  const aucunePlafond = repartit && plafond !== null && aucune.length > 0 && aucune.every(attribuable);

  let note = null;
  if (confirme && nProp) {
    note = (
      <div
        className="lot-confirme"
        role="alertdialog"
        aria-labelledby="lot-confirme-t"
        onKeyDown={(e) => {
          if (e.key === "Escape" && !occupe) refermer();
        }}
      >
        <p id="lot-confirme-t" tabIndex={-1} ref={titreMessage}>
          <b>{une ? `${nomDe(une[1])} s’occupe de ${nomDeScene(une[0])} ?` : `Les élèves proposés s’occupent de ces ${nProp} scènes ?`}</b>
        </p>
        <p>{une ? "Elle sera à son nom" : "Elles seront à leur nom"}, comme les scènes déjà prises. Vous pourrez encore changer d’élève.</p>
        <div>
          <button type="button" className="btn btn--primaire" disabled={occupe} aria-busy={occupe || undefined} onClick={() => void repartirEtImprimer()}>
            Répartir et imprimer
          </button>
          <button type="button" className="btn" disabled={occupe} onClick={refermer}>
            Annuler
          </button>
        </div>
      </div>
    );
  } else if (nProp) {
    note = (
      <p className="lot-note lot-note--prop" role="status">
        {une
          ? `${refDe(une[0])} est proposée à ${nomDe(une[1])} : elle sera à son nom à l’impression.`
          : `${nProp} scènes sans élève sont ${repartit ? "réparties entre les élèves de leur chapitre" : "proposées"} : elles seront à leur nom à l’impression.`}
        {aucune.length ? (
          <span className="lot-note__reste">
            {" "}
            {aucune.length} {aucune.length > 1 ? "restent" : "reste"} sans élève, sur aucune feuille
            {aucunePlafond ? ` : chaque élève du chapitre a déjà ${plafond} scène${pluriel(plafond ?? 0)} à écrire.` : "."}
          </span>
        ) : null}{" "}
        {repartit ? (
          <button type="button" className="lien" onClick={() => { setRepartit(false); setVue(0); }}>
            Ne pas répartir
          </button>
        ) : null}
      </p>
    );
  } else if (aucune.length && lesFeuilles.length) {
    note = (
      <p className="lot-note">
        {aucune.length} des {nScenes + aucune.length} scènes choisies {aucune.length > 1 ? "n’ont" : "n’a"} pas d’élève : sur aucune feuille. {lesRepartir}
        {versChapitre}
      </p>
    );
  }

  const rien = eleve && liste.length === 0
    ? null
    : aucune.length && !lesFeuilles.length
      ? (
        <>
          Aucune scène choisie n’a encore d’élève : rien à imprimer par élève. {lesRepartir}
          {versChapitre}
        </>
      )
      : eleve
        ? `Rien à imprimer pour ${nom(eleve)}.`
        : depart.choisies.length === 0 && choisies.size === 0
          ? "Rien à écrire ni à reprendre dans les scènes listées. Cochez des scènes dans la liste."
          : "Aucune scène choisie. Cochez des scènes dans la liste.";

  return (
    <div className="page--fiches">
      <nav className="fil hors-impression" aria-label="Fil d’Ariane">
        <Link href={retour}>
          <Icone nom="fleche-g" />
          Retour au Suivi
        </Link>
      </nav>
      <header className="page-tete hors-impression">
        <div>
          <h1>Fiches de rédaction</h1>
          <p className="lot-intro">
            Choisissez les scènes à travailler sur papier.
            <Bulle question="Que change l’impression des fiches ?">
              <span>Une scène sans consigne n’est pas imprimée. Imprimer ne remet aucun texte et ne donne aucun accès aux élèves.</span>
            </Bulle>
          </p>
        </div>
      </header>

      <div className="lot">
        <div className="lot-liste hors-impression">
          <div className="lot-filtres">
            <label className="suivi-champ">
              <span>Élève</span>
              <span className="suivi-champ__select">
                <select
                  aria-label="Élève"
                  value={eleveId ?? ""}
                  onChange={(e) => {
                    setEleveId(e.target.value || null);
                    setVue(0);
                    setConfirme(false);
                  }}
                >
                  <option value="">Tous les élèves</option>
                  {eleves.map((e) => (
                    <option key={e.id} value={e.id}>
                      {nom(e)}
                    </option>
                  ))}
                </select>
                <Icone nom="chevron-bas" />
              </span>
            </label>
            <p className="lot-raccourcis">
              Ajouter :{" "}
              <button type="button" className="lien" onClick={() => ajouter((s) => s.texteVide && s.etat === "cours")}>
                les textes vides
              </button>{" "}
              ·{" "}
              <button type="button" className="lien" onClick={() => ajouter((s) => s.etat === "reprendre")}>
                à reprendre
              </button>
              <button type="button" className="lien lot-raccourcis__vider" onClick={() => cocher(toutes.filter(montree).map((s) => s.id), false)}>
                Tout décocher
              </button>
            </p>
          </div>
          {liste.length ? (
            liste
          ) : eleve ? (
            <p className="suivi-aucun">
              {nom(eleve)} {chapitres.some((c) => c.attributions.some((a) => a.eleveId === eleve.id)) ? "ne s’occupe d’aucune scène" : "n’a aucun chapitre"}.{" "}
              <button type="button" className="lien" onClick={() => setEleveId(null)}>
                Tous les élèves
              </button>
            </p>
          ) : (
            <p className="suivi-aucun">Ce projet n’a pas encore de scène.</p>
          )}
        </div>

        <div className="lot-apercu">
          <div className="lot-reglage hors-impression">
            <span id="lot-reglage">Une feuille</span>
            <div className="seg-mini" role="group" aria-labelledby="lot-reglage">
              <button type="button" aria-pressed={!parEleve} onClick={() => changerDeTirage("chapitre")}>
                par chapitre
              </button>
              <button type="button" aria-pressed={parEleve} onClick={() => changerDeTirage("eleve")}>
                par élève
              </button>
            </div>
            <label className="lot-suite">
              <input type="checkbox" className="case" checked={suite} onChange={(e) => setSuite(e.target.checked)} />
              À la suite, à découper
            </label>
          </div>

          {/* Le nombre de scènes à écrire par élève : une commande qui ne s'affiche que là où elle sert, en « par élève » (F07-AC74) */}
          {partageable ? (
            <div className="lot-plafond hors-impression">
              {plafondOuvert ? (
                <>
                  <label className="lot-plafond__phrase">
                    Au plus
                    <input
                      type="number"
                      inputMode="numeric"
                      min={1}
                      max={99}
                      aria-label="Nombre de scènes à écrire par élève, au plus"
                      value={plafond ?? ""}
                      autoFocus
                      onChange={(e) => {
                        const n = Math.floor(Number(e.target.value));
                        setPlafond(e.target.value !== "" && Number.isFinite(n) && n >= 1 ? Math.min(n, 99) : null);
                        setCompletes([]);
                        setConfirme(false);
                      }}
                    />
                    scène{pluriel(plafond ?? 2)} à écrire par élève
                  </label>
                  <Bulle question="Que compte ce nombre ?">
                    <span>Ce qu’il reste à écrire à l’élève dans tout le projet, scènes déjà à son nom comprises. Un élève qui en a déjà autant ne reçoit rien de plus.</span>
                    <span>Le nombre ne donne rien à lui seul : il sert quand vous répartissez les scènes, ou quand vous complétez un élève.</span>
                  </Bulle>
                  <button
                    type="button"
                    className="lien"
                    onClick={() => {
                      setPlafond(null);
                      setPlafondOuvert(false);
                      setCompletes([]);
                      window.requestAnimationFrame(() => lienDuNombre.current?.focus({ preventScroll: true }));
                    }}
                  >
                    Retirer
                  </button>
                </>
              ) : (
                <button type="button" className="lien" ref={lienDuNombre} onClick={() => setPlafondOuvert(true)}>
                  Fixer un nombre de scènes par élève
                </button>
              )}
            </div>
          ) : null}

          <div className="lot-apercu__barre hors-impression">
            <p role="status">{decompte(lesFeuilles, suite, !suite && feuille?.eleve ? feuille.eleve : null)}</p>
            {lesFeuilles.length > 1 && !suite ? (
              <div className="lot-pager">
                <button type="button" className="btn btn--petit" aria-label="Feuille précédente" disabled={vue === 0} onClick={() => setVue((v) => Math.max(0, v - 1))}>
                  <Icone nom="fleche-g" />
                </button>
                <span>
                  {Math.min(vue, lesFeuilles.length - 1) + 1} / {lesFeuilles.length}
                </span>
                <button type="button" className="btn btn--petit" aria-label="Feuille suivante" disabled={vue >= lesFeuilles.length - 1} onClick={() => setVue((v) => Math.min(lesFeuilles.length - 1, v + 1))}>
                  <Icone nom="fleche" />
                </button>
              </div>
            ) : null}
            {/* Le message de demande porte alors le seul bouton plein de l'écran */}
            <button type="button" ref={boutonImprimer} className={`btn${confirme ? "" : " btn--primaire"} lot-imprimer`} disabled={!lesFeuilles.length || confirme || occupe} onClick={imprimer}>
              <Icone nom="imprimer" />
              {!lesFeuilles.length ? "Imprimer" : suite && lesFeuilles.length > 1 ? "Imprimer à la suite" : `Imprimer ${lesFeuilles.length} feuille${pluriel(lesFeuilles.length)}`}
            </button>
          </div>

          <div className="lot-notes hors-impression">
            {note}
            {/* Compléter un élève, à la suite de « répartir » : la même question, les scènes sans élève (F07-AC75) */}
            {plafond !== null && aCompleter.length ? (
              <div className="lot-completer" role="group" aria-labelledby="lot-completer-t">
                <span id="lot-completer-t">
                  {aRepartir && !nProp && lesFeuilles.length ? "ou compléter" : "Compléter"} jusqu’à {plafond} scène{pluriel(plafond)} :
                </span>
                {aCompleter.map(({ eleve: e, reste }) => {
                  const complete = completes.includes(e.id);
                  const recu = [...partage.propositions.values()].filter((id) => id === e.id).length;
                  const possible = complete || recevrait(e.id);
                  return (
                    <button
                      key={e.id}
                      type="button"
                      className="lot-eleve"
                      aria-pressed={complete}
                      aria-label={`${nom(e)} : ${reste} scène${pluriel(reste)} à écrire${complete ? `, ${recu} de plus proposée${pluriel(recu)}` : ""}`}
                      disabled={!possible || confirme}
                      onClick={() => {
                        setCompletes((avant) => (complete ? avant.filter((id) => id !== e.id) : [...avant, e.id]));
                        setVue(0);
                      }}
                    >
                      <Gommette prenom={e.prenom} couleur={e.couleur} taille="s" />
                      <span>{nom(e)}</span>
                      <b>
                        {reste}
                        <i data-vu={complete && recu ? "oui" : "non"}> + {recu || 1}</i>
                      </b>
                    </button>
                  );
                })}
                {aCompleter.some(({ eleve: e }) => !completes.includes(e.id) && !recevrait(e.id)) ? <small>Plus de scène libre cochée.</small> : null}
              </div>
            ) : null}
            {faites.length && !confirme ? (
              <p className="lot-note lot-note--fait" role="status">
                <Icone nom="coche" />
                <span>
                  {faites.length} scène{pluriel(faites.length)} répartie{pluriel(faites.length)}.
                </span>
                <button type="button" className="lien" disabled={occupe} onClick={() => void annuler()}>
                  Annuler la répartition
                </button>
                <small>tant que vous restez sur cette page</small>
              </p>
            ) : null}
          </div>

          {!feuille ? (
            rien ? <p className="suivi-aucun hors-impression">{rien}</p> : null
          ) : suite ? (
            <article className="fr-feuille fr-feuille--suite" aria-label="Aperçu des fiches à la suite, à découper">
              {lesFeuilles.map((f, i) => (
                <div key={f.cle}>
                  {i > 0 ? (
                    <p className="fr-coupe">
                      <span>à découper</span>
                    </p>
                  ) : null}
                  <PartieDeFeuille projet={projet.titre} feuille={f} contenus={contenus} plan={plan} nom={nom} />
                </div>
              ))}
              <p className="fr-pied">Fiches de rédaction · à recopier dans l’application</p>
            </article>
          ) : (
            lesFeuilles.map((f) => (
              <article
                key={f.cle}
                className="fr-feuille"
                data-vue={f === feuille ? "oui" : "non"}
                aria-label={`Aperçu de la feuille ${f.eleve ? `de ${nom(f.eleve)}` : `du chapitre ${f.chapitres[0].chapitre.titre}`}`}
              >
                <PartieDeFeuille projet={projet.titre} feuille={f} contenus={contenus} plan={plan} nom={nom} />
                <p className="fr-pied">Fiche de rédaction · à recopier dans l’application</p>
              </article>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Une feuille, ou la part d'un élève ou d'un chapitre quand elles se suivent : le projet,
 * le chapitre et le prénom ; puis chaque scène sous sa référence, avec sa consigne, ce qui
 * est déjà écrit, la reprise demandée et les choix de fin. Aucune place pour écrire :
 * l'élève écrit sur son cahier (F07-AC52).
 */
function PartieDeFeuille({
  projet, feuille, contenus, plan, nom,
}: {
  projet: string; feuille: Feuille; contenus: Record<string, ContenuDeFiche>; plan: Plan; nom: (e: ElevePlan) => string;
}) {
  const premiere = feuille.chapitres[0];
  const choixDe = (s: Scene): string[] => plan.liens.filter((l) => l.sceneId === s.id && !l.cache && l.libelle.trim()).map((l) => l.libelle);
  const scene = (s: Scene, chapitre: Chapitre) => {
    const c = contenus[s.id];
    const choix = choixDe(s);
    return (
      <li key={s.id} className="fr-scene">
        <span className="fr-num">{referenceScene(s.reference)}</span>
        <div className="fr-corps">
          <h3>{s.titre ?? chapitre.titre}</h3>
          <p className="fr-consigne">{s.consigne}</p>
          {c?.texte.length ? (
            <>
              <p className="fr-lib">Déjà écrit</p>
              <div className="fr-texte">
                {c.texte.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
            </>
          ) : null}
          {c?.remarque !== null && c?.remarque !== undefined ? (
            <>
              <p className="fr-lib">À reprendre</p>
              <p className="fr-reprise">{c.remarque || "Reprise demandée, sans remarque écrite."}</p>
            </>
          ) : null}
          {choix.length ? <p className="fr-choix">À la fin, le lecteur pourra : {choix.join(" · ")}</p> : null}
        </div>
        {c?.image ? (
          <span className="fr-image">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/images/${c.image}?v=1`} alt="" />
          </span>
        ) : null}
      </li>
    );
  };
  return (
    <section className="fr-partie" style={vars(premiere.chapitre.couleur)}>
      <header className="fr-tete">
        <p>
          {projet} · <b>{feuille.chapitres.map((x) => x.chapitre.titre).join(", ")}</b>
        </p>
        <p>Prénom : {feuille.eleve ? <b>{nom(feuille.eleve)}</b> : "______________"}</p>
      </header>
      <p className="fr-mode">Sur ton cahier, recopie le repère de la scène ({referenceScene(premiere.scenes[0].reference)}), puis écris ton texte.</p>
      {feuille.chapitres.map(({ chapitre, scenes }) => (
        <div key={chapitre.id}>
          {/* Un élève de plusieurs chapitres : ses scènes rangées par chapitre (F07-AC72) */}
          {feuille.chapitres.length > 1 ? <p className="fr-chapitre">{chapitre.titre}</p> : null}
          <ol className="fr-liste">{scenes.map((s) => scene(s, chapitre))}</ol>
        </div>
      ))}
    </section>
  );
}
