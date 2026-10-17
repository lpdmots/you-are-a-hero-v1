"use client";

import { closestCenter, DndContext, type DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Fragment, useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Bulle } from "@/composants/Bulle";
import { Icone, type NomIcone } from "@/composants/Icone";
import { Prise, useCapteurs } from "@/composants/Tirer";
import { estAuto, estRenvoi, morceauxDe, renvoisDe, tirerConstruction, nouvelId, type Choix, type Liaison, type Morceau, type Renvoi } from "@/domaine/copie";
import { constructionsUtiles, phraseDeChoix } from "@/domaine/preparation";
import { scenesProposees } from "@/domaine/proposer";
import { referenceScene } from "@/domaine/recit";
import { cle } from "@/domaine/texte";
import { useCopie, type ApercuDeChoix, type SceneConnue, type SceneCreee, type Services } from "./contexte";
import { useLigneVisible } from "./FicheJeu";

/**
 * La fiche d'un choix, ouverte dans le panneau à droite du texte (F05.2 ; docs/design.md,
 * « Panneau des réglages ») : filet canard, celui de la décision. Elle sert à créer un choix
 * — « Ce que fait le lecteur », puis « Où mène ce choix ? » — et à régler un choix existant.
 */

/** Le libellé donné en exemple, dans le champ et dans la phrase en attente du texte. */
export const LIBELLE_EXEMPLE = "Traverser le pont";

type Issue = "existante" | "nouvelle";
export type Destination = { cible: string | null; creee?: SceneCreee };

/**
 * Le nom d'une destination tel qu'on le lit près d'un choix : le titre de la scène, sans sa
 * référence, que personne ne retient (décidé le 11 octobre 2026). Sans titre, la référence
 * sert de nom à l'adulte.
 */
export function nomDeDestination(s: SceneConnue | undefined, pourEleve: boolean): string {
  if (!s) return "";
  return s.titre ?? (pourEleve ? "scène sans titre" : `${referenceScene(s.reference)}, sans titre`);
}

/** Combien de scènes le libellé fait remonter au plus, dont combien d'un autre chapitre. */
const PROPOSEES_MAX = 5;
const D_AILLEURS_MAX = 3;

/**
 * « Où mène ce choix ? » (F05.2) : une scène existante ou une nouvelle scène, et rien d'autre
 * à l'écran que ce que l'issue choisie demande. La scène existante se retient d'un clic dans
 * la liste, ou aux flèches puis Entrée (F05-AC39) : les scènes du chapitre, celles qui
 * ressemblent au libellé en tête (F05-AC56) ; le filtre cherche dans tout le livre, et le
 * bouton des chapitres en ouvre un autre. « Décider plus tard » laisse le choix sans destination.
 */
export function ChoisirDestination({
  libelle, services, valider, actuelle, creer, focus, seulementExistante = false, differer, sansPlusTard = false, titreNouvelle, chapitreNouvelle, issueDeDepart,
}: {
  libelle: string; services: Services;
  valider: (destination: Destination) => void;
  actuelle?: string | null;
  /** Ce que dit le bouton d'une nouvelle scène : « Créer le choix et la scène » */
  creer?: string;
  focus?: boolean;
  /** Un lien caché ne mène qu'à une scène qui existe : ni « nouvelle scène » ni « plus tard » */
  seulementExistante?: boolean;
  /**
   * Une idée de choix (F13.3) : la nouvelle scène n'est créée qu'à l'ajout. Le titre et le
   * chapitre retenus sont rendus tels quels, sans rien créer.
   */
  differer?: (nouvelle: { titre: string; chapitreId: string }) => void;
  /** Sans « Décider plus tard » : une idée retenue a toujours une destination */
  sansPlusTard?: boolean;
  /** Le titre proposé pour une nouvelle scène, quand il n'est pas le libellé */
  titreNouvelle?: string;
  /** Le chapitre déjà retenu pour cette nouvelle scène, quand ce n'est pas celui de la scène */
  chapitreNouvelle?: string;
  /** L'issue ouverte d'abord : celle de la destination qu'on change */
  issueDeDepart?: Issue;
}) {
  const { livre, droits, lieu } = useCopie();
  const adulte = droits.role === "adulte";
  const autres = useMemo(() => livre.scenes.filter((s) => s.id !== lieu.sceneId), [livre.scenes, lieu.sceneId]);
  // Sans autre scène à choisir, il ne reste qu'à en créer une
  const [issue, setIssue] = useState<Issue>(issueDeDepart ?? (seulementExistante || autres.length > 0 ? "existante" : "nouvelle"));
  const [demande, setDemande] = useState("");
  const [chapitre, setChapitre] = useState(lieu.chapitreId);
  const [surligne, setSurligne] = useState(0);
  const [extraits, setExtraits] = useState<Record<string, string>>({});
  const [titre, setTitre] = useState<string | null>(titreNouvelle ?? null);
  const [ou, setOu] = useState(chapitreNouvelle ?? lieu.chapitreId);
  const [ailleurs, setAilleurs] = useState(!!chapitreNouvelle && chapitreNouvelle !== lieu.chapitreId);
  const [attente, setAttente] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const champ = useRef<HTMLInputElement>(null);
  const champTitre = useRef<HTMLInputElement>(null);
  const lignes = useRef<HTMLUListElement>(null);
  const suivre = useLigneVisible(lignes, surligne);

  useEffect(() => {
    if (focus) (champ.current ?? champTitre.current)?.focus();
  }, [focus]);

  // Les textes se cherchent sur le serveur, après une courte pause ; les titres, sur place
  useEffect(() => {
    if (!services.chercher || demande.trim().length < 2) return;
    let actif = true;
    const minuteur = setTimeout(() => {
      void services.chercher!(demande).then((trouvees) => {
        if (actif) setExtraits(Object.fromEntries(trouvees.map((t) => [t.id, t.extrait])));
      });
    }, 300);
    return () => {
      actif = false;
      clearTimeout(minuteur);
    };
  }, [demande, services]);

  const mots = cle(demande).split(" ").filter(Boolean);
  // Sans filtre : d'abord les scènes qui ressemblent au libellé, du chapitre et, pour l'adulte,
  // de quelques autres ; puis le reste du chapitre. Un autre chapitre ouvert se lit tel quel
  const proposees = useMemo(() => {
    if (mots.length > 0 || chapitre !== lieu.chapitreId) return [];
    const trouvees = scenesProposees(libelle, autres);
    let ailleurs = 0;
    return trouvees.filter((s) => s.chapitreId === lieu.chapitreId || (ailleurs += 1) <= D_AILLEURS_MAX).slice(0, PROPOSEES_MAX);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autres, libelle, demande, chapitre, lieu.chapitreId]);
  const resultats = useMemo(() => {
    if (mots.length === 0) return [...proposees, ...autres.filter((s) => s.chapitreId === chapitre && !proposees.includes(s))];
    const parTexte = demande.trim().length >= 2 ? extraits : {};
    return autres.filter((s) => mots.every((m) => cle(`${referenceScene(s.reference)} ${s.titre ?? ""}`).includes(m)) || s.id in parTexte);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autres, proposees, demande, extraits, chapitre]);
  const choisie = resultats[Math.min(surligne, resultats.length - 1)];

  const creerLaScene = async () => {
    if (differer) {
      const propre = (titre ?? libelle).trim();
      if (propre) differer({ titre: propre, chapitreId: ou });
      return;
    }
    setAttente(true);
    setErreur(null);
    const fait = await services.creerScene(ou, (titre ?? libelle).trim());
    setAttente(false);
    if (!fait.ok) return setErreur(fait.erreur);
    valider({ cible: fait.scene.id, creee: fait.scene });
  };

  return (
    <fieldset className="cx-issues">
      <legend>{seulementExistante ? "Où mène ce lien caché ?" : "Où mène ce choix ?"}</legend>
      {seulementExistante || autres.length === 0 ? null : (
        <div className="cx-seg cx-seg--deux" role="radiogroup" aria-label="Où mène ce choix ?">
          {(
            [
              ["existante", "Scène existante"],
              ["nouvelle", "Nouvelle scène"],
            ] as [Issue, string][]
          ).map(([valeur, nom]) => (
            <label key={valeur}>
              <input type="radio" name="issue" checked={issue === valeur} onChange={() => setIssue(valeur)} />
              <span>{nom}</span>
            </label>
          ))}
        </div>
      )}

      {issue === "existante" ? (
        <>
          <label className="vh" htmlFor="cx-demande">
            Chercher une scène
          </label>
          <div className="cx-chercher">
          <input
            id="cx-demande"
            ref={champ}
            className="pchamp cx-demande"
            type="search"
            value={demande}
            autoComplete="off"
            placeholder={adulte ? "Chercher une scène du livre" : "Chercher dans ton chapitre"}
            onChange={(e) => {
              setDemande(e.target.value);
              setSurligne(0);
            }}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                suivre();
                setSurligne((n) => Math.min(n + 1, resultats.length - 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                suivre();
                setSurligne((n) => Math.max(n - 1, 0));
              } else if (e.key === "Enter") {
                e.preventDefault();
                e.stopPropagation();
                if (choisie) valider({ cible: choisie.id });
              }
            }}
          />
          {/* Les autres chapitres, rangés par parties : pour l'adulte, qui peut seul créer un raccord (F06.1) */}
          {adulte && livre.chapitres.length > 1 ? (
            <span className={`cx-chapitres${chapitre === lieu.chapitreId ? "" : " est-ailleurs"}`} title="Voir les scènes d’un autre chapitre">
              <Icone nom="cahier" />
              <select
                aria-label="Chapitre"
                value={chapitre}
                onChange={(e) => {
                  setChapitre(e.target.value);
                  setDemande("");
                  setSurligne(0);
                }}
              >
                {[...new Set(livre.chapitres.map((c) => c.partie))].map((partie) => (
                  <optgroup key={partie} label={partie}>
                    {livre.chapitres.filter((c) => c.partie === partie).map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.titre}
                        {c.id === lieu.chapitreId ? " (ce chapitre)" : ""}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </span>
          ) : null}
          </div>
          {resultats.length === 0 ? (
            <p className="cx-aide">{mots.length ? "Aucune scène trouvée." : chapitre === lieu.chapitreId ? "Aucune autre scène dans ce chapitre." : "Aucune scène dans ce chapitre."}</p>
          ) : (
            <ul className="cx-liste" role="listbox" aria-label="Scènes" ref={lignes}>
              {resultats.slice(0, 40).map((s, i) => (
                <Fragment key={s.id}>
                {/* Deux courts repères quand le libellé a fait remonter des scènes, ou qu'un autre chapitre est ouvert */}
                {mots.length === 0 && i === 0 && proposees.length > 0 ? <li role="presentation" className="cx-liste__groupe">Proposées d’après l’action</li> : null}
                {mots.length === 0 && i === proposees.length && (proposees.length > 0 || chapitre !== lieu.chapitreId) ? (
                  <li role="presentation" className="cx-liste__groupe">
                    {chapitre === lieu.chapitreId ? "Ce chapitre" : livre.chapitres.find((c) => c.id === chapitre)?.titre}
                  </li>
                ) : null}
                <li role="option" aria-selected={s.id === choisie?.id}>
                  <button type="button" tabIndex={-1} className={s.id === choisie?.id ? "est-choisie" : undefined} onClick={() => { setSurligne(i); valider({ cible: s.id }); }} onMouseEnter={() => setSurligne(i)}>
                    <span className="cx-liste__titre">
                      {s.titre ?? <span className="sans-consigne">{adulte ? `${referenceScene(s.reference)}, sans titre` : "sans titre"}</span>}
                      {s.id === actuelle ? <small> · destination actuelle</small> : null}
                      {extraits[s.id] && mots.length ? <small className="cx-liste__extrait">{extraits[s.id]}</small> : null}
                      {/* Hors du chapitre : une flèche qui sort, et le nom du chapitre */}
                      {s.chapitreId === lieu.chapitreId ? null : (
                        <small className="cx-liste__ailleurs" title={`Dans un autre chapitre : ${s.chapitre}. Le choix sera un raccord.`}>
                          <Icone nom="sortie" />
                          {s.chapitre}
                        </small>
                      )}
                    </span>
                    <span className="cx-liste__ou">

                      {livre.numeros[s.id] ? <span className="cx-liste__n">n° {livre.numeros[s.id]}</span> : null}
                    </span>
                  </button>
                </li>
                </Fragment>
              ))}
            </ul>
          )}
        </>
      ) : (
        <div className="cx-nouvelle">
          <label className="champ champ--plein">
            <span>Titre de la nouvelle scène</span>
            <input
              ref={champTitre}
              className="pchamp"
              type="text"
              maxLength={120}
              value={titre ?? libelle}
              onChange={(e) => setTitre(e.target.value)}
              onKeyDown={(e) => {
                if (e.key !== "Enter") return;
                e.preventDefault();
                e.stopPropagation();
                void creerLaScene();
              }}
            />
          </label>
          {/* Un raccord vers un autre chapitre est l'exception : il ne se montre que demandé (F06.1) */}
          {adulte && livre.chapitres.length > 1 && ailleurs ? (
            <label className="champ champ--plein">
              <span>Dans le chapitre</span>
              <select className="pchamp" value={ou} onChange={(e) => setOu(e.target.value)}>
                {livre.chapitres.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.titre}
                    {c.id === lieu.chapitreId ? " (ce chapitre)" : ""}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <p className="cx__cmd">
            <button type="button" className="btn btn--primaire" disabled={attente} aria-busy={attente || undefined} onClick={() => void creerLaScene()}>
              {creer ?? "Créer la scène"}
            </button>
            {adulte && livre.chapitres.length > 1 && !ailleurs ? (
              <button type="button" className="lien cx-discret" onClick={() => setAilleurs(true)}>
                Dans un autre chapitre…
              </button>
            ) : null}
          </p>
        </div>
      )}
      {erreur ? (
        <p className="erreur" role="alert">
          {erreur}
        </p>
      ) : null}
      {seulementExistante || sansPlusTard ? null : (
        <p className="cx-autre">
          <button type="button" className="lien cx-discret" onClick={() => valider({ cible: null })}>
            Décider plus tard
          </button>
        </p>
      )}
    </fieldset>
  );
}

function Cadre({ titre, icone = "choix", onFermer, children, pied }: { titre: string; icone?: NomIcone; onFermer: () => void; children: ReactNode; pied?: ReactNode }) {
  return (
    <section
      className="cx"
      aria-label={titre}
      onKeyDown={(e) => {
        if (e.key !== "Escape") return;
        e.preventDefault();
        e.stopPropagation();
        onFermer();
      }}
    >
      <header className="cx__tete">
        <Icone nom={icone} />
        <h3>{titre}</h3>
        <button type="button" className="btn btn--discret cx__fermer" onClick={onFermer} aria-label="Fermer la fiche">
          <Icone nom="fermer" />
        </button>
      </header>
      <div className="cx__corps">{children}</div>
      {pied ? <footer className="cx__pied">{pied}</footer> : null}
    </section>
  );
}

/**
 * Créer un choix : une seule question d'abord, « Ce que fait le lecteur » ; la destination se
 * demande dès qu'il y a un libellé. La phrase se compose pendant la saisie, à sa place dans le
 * texte. Le lien caché, rare, est un lien discret au bas de la fiche, pour l'adulte seul (F05-AC27).
 */
export function FicheNouveauChoix({
  services, onCreer, onCreerLiaison, onApercu, onFermer,
}: {
  services: Services; onCreer: (choix: Choix, creee?: SceneCreee) => void;
  /** Créer une liaison cachée, son numéro déjà fixé (F05.1) */
  onCreerLiaison: (liaison: Liaison, numero: number | null) => void;
  /** Ce que la copie montre dans le texte ; rien pour un lien caché, qui n'y ajoute pas de phrase */
  onApercu: (apercu: ApercuDeChoix | null) => void;
  onFermer: () => void;
}) {
  const { livre, droits, pourEleve } = useCopie();
  const idLibelle = useId();
  const [forme, setForme] = useState<"phrase" | "cache">("phrase");
  const [libelle, setLibelle] = useState("");
  const [construction] = useState(() => tirerConstruction(constructionsUtiles(livre.formule, livre.constructions)));
  const champ = useRef<HTMLInputElement>(null);
  const [versDestination, setVersDestination] = useState(false);
  const propre = libelle.trim();
  useEffect(() => {
    if (forme === "phrase") champ.current?.focus();
  }, [forme]);
  useEffect(() => {
    onApercu(forme === "cache" ? null : { libelle: propre, construction });
  }, [onApercu, forme, propre, construction]);
  useEffect(() => () => onApercu(null), [onApercu]);

  if (forme === "cache") {
    return (
      <Cadre titre="Nouveau lien caché" icone="cle" onFermer={onFermer}>
        <CreerLienCache services={services} onCreer={onCreerLiaison} />
        <p className="cx-autre">
          <button type="button" className="lien cx-discret" onClick={() => setForme("phrase")}>
            Retour au choix
          </button>
        </p>
      </Cadre>
    );
  }
  return (
    <Cadre titre="Nouveau choix" onFermer={onFermer}>
      <div className="champ champ--plein">
        <span className="cx-question">
          <label htmlFor={idLibelle}>Ce que fait le lecteur</label>
          <Bulle question="Que faut-il écrire ici ?">
            Une action, de préférence : « Prendre la clé », « Faire demi-tour ». La phrase du choix s’écrit toute seule dans le texte ;{" "}
            {pourEleve ? "tu pourras" : "vous pourrez"} la personnaliser ensuite.
          </Bulle>
        </span>
        <input
          id={idLibelle}
          ref={champ}
          className="pchamp"
          type="text"
          maxLength={200}
          value={libelle}
          placeholder={`Par exemple : ${LIBELLE_EXEMPLE}`}
          onChange={(e) => setLibelle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key !== "Enter") return;
            e.preventDefault();
            e.stopPropagation();
            if (propre) setVersDestination(true);
          }}
        />
      </div>
      {propre ? (
        <ChoisirDestination
          key={String(versDestination)}
          libelle={libelle}
          services={services}
          focus={versDestination}
          creer="Créer le choix et la scène"
          valider={({ cible, creee }) => onCreer({ type: "choix", id: nouvelId(), auto: true, libelle: propre, construction, cible, children: [{ text: "" }] }, creee)}
        />
      ) : null}
      {droits.role === "adulte" && services.fixerNumero ? (
        <p className="cx-autre">
          <button type="button" className="lien cx-discret" onClick={() => setForme("cache")}>
            <Icone nom="cle" />
            Lien caché (énigme)…
          </button>
          <Bulle question="Qu’est-ce qu’un lien caché ?">
            Le lecteur trouve lui-même où poursuivre, en résolvant une énigme que vous écrivez dans le texte. Aucune phrase de choix ne s’y ajoute.
          </Bulle>
        </p>
      ) : null}
    </Cadre>
  );
}

/**
 * Créer une liaison cachée (F05.1) : la scène où mène l'énigme, puis le numéro qu'elle doit
 * garder — celui qu'elle porte, ou celui que donne l'énigme. Rien ne s'ajoute au récit.
 */
function CreerLienCache({ services, onCreer }: { services: Services; onCreer: (liaison: Liaison, numero: number | null) => void }) {
  const { livre } = useCopie();
  const [cible, setCible] = useState<string | null>(null);
  const [lu, setLu] = useState<{ pour: string; numero: number | null; total: number } | null>(null);
  const [saisie, setSaisie] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [attente, setAttente] = useState(false);
  const scene = livre.scenes.find((s) => s.id === cible);
  const nom = nomDeDestination(scene, false);
  const estDepart = cible !== null && cible === livre.depart;
  const dejaFixe = cible ? livre.fixes[cible] : undefined;

  useEffect(() => {
    if (!cible || !services.numeroDe) return;
    let actif = true;
    void services.numeroDe(cible).then((fait) => {
      if (!actif) return;
      if (fait.ok) setLu({ pour: cible, numero: fait.numero, total: fait.total });
      else setErreur(fait.erreur);
    });
    return () => {
      actif = false;
    };
  }, [cible, services]);

  if (!cible) {
    return (
      <>
        <ChoisirDestination libelle="" services={services} seulementExistante focus valider={({ cible: choisie }) => setCible(choisie)} />
      </>
    );
  }
  const numero = lu?.pour === cible ? lu.numero : null;
  const voulu = Number.parseInt(saisie, 10);
  const creer = async (n: number | null) => {
    setAttente(true);
    setErreur(null);
    const fait = await services.fixerNumero!(cible, n);
    setAttente(false);
    if (!fait.ok) return setErreur(fait.erreur);
    onCreer({ type: "liaison", id: nouvelId(), cible, children: [{ text: "" }] }, fait.numero);
  };
  return (
    <div className="cx-numero">
      <p className="cx-titre">Le numéro que doit donner l’énigme</p>
      {lu?.pour !== cible && !erreur ? <p role="status">Un instant…</p> : null}
      {lu?.pour === cible ? (
        <>
          <p>
            {numero ? `${nom} porte le n° ${numero}.` : `${nom} n’a pas encore de numéro : elle est hors du livre.`}{" "}
            {estDepart ? "C’est le départ du livre : il porte toujours le n° 1." : dejaFixe ? "Ce numéro est déjà fixé." : numero ? "Il sera fixé : le passage le gardera, même si d’autres changent de place." : ""}
          </p>
          <p className="cx__cmd">
            <button type="button" className="btn btn--primaire" disabled={attente} aria-busy={attente || undefined} onClick={() => void creer(null)}>
              Créer le lien caché
            </button>
            <button type="button" className="lien" onClick={() => { setCible(null); setErreur(null); setSaisie(""); }}>
              Changer de scène
            </button>
          </p>
          {estDepart ? null : (
            <form
              className="fiche-numero__autre"
              onSubmit={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (Number.isInteger(voulu) && voulu >= 1) void creer(voulu);
              }}
            >
              <label className="champ">
                <span>Ou le numéro que donne votre énigme</span>
                <input className="pchamp" type="text" inputMode="numeric" pattern="[0-9]*" maxLength={4} value={saisie} onChange={(e) => setSaisie(e.target.value.replace(/\D/g, ""))} />
              </label>
              <button type="submit" className="btn" disabled={attente || !Number.isInteger(voulu) || voulu < 1}>
                Créer avec ce numéro
              </button>
            </form>
          )}
          {Number.isInteger(voulu) && voulu > lu.total ? (
            <p className="cx-note cx-note--avert">
              <Icone nom="alerte" />
              <span>
                Le livre ne compte que {lu.total} passage{lu.total > 1 ? "s" : ""} pour l’instant : il faudra qu’il atteigne {voulu} passages avant le PDF définitif.
              </span>
            </p>
          ) : null}
        </>
      ) : null}
      {erreur ? (
        <p className="erreur" role="alert">
          {erreur}
        </p>
      ) : null}
    </div>
  );
}

export type GestesDeChoix = {
  /** Change des propriétés du bloc, en un seul geste annulable */
  regler: (valeurs: Record<string, unknown>) => void;
  reglerRenvoi: (renvoi: string, valeurs: Record<string, unknown>) => void;
  /** Écrire la phrase : le texte autour de ses numéros. Une phrase automatique devient une phrase modifiée */
  ecrire: (textes: string[]) => void;
  /** La flèche ronde : une autre tournure pour une phrase automatique ; pour une phrase modifiée, le retour à l'automatique */
  automatiser: () => void;
  /** Une destination de plus : son numéro s'ajoute à la fin de la phrase */
  ajouterDestination: (destination: Destination) => void;
  retirerRenvoi: (renvoi: string) => void;
  /** Les destinations dans un nouvel ordre : les numéros de la phrase, de gauche à droite, les prennent une à une */
  ordonner: (cibles: (string | null)[]) => void;
  supprimer: () => void;
  /** « Cacher ce choix (énigme) » : la phrase part, le lien reste, le numéro est fixé. Adulte seul (F05-AC26) */
  cacher?: () => void;
};

/** Le texte d'un champ où l'on écrit : sans retour à la ligne ni espace insécable posée par le navigateur. */
const lu = (el: Element): string => (el.textContent ?? "").replace(/[\n\r ]/g, " ");

/**
 * La phrase d'un choix, écrite dans le panneau (F05.2, 11 octobre 2026) : du texte autour de
 * ses numéros, qui sont d'un seul bloc et ne s'effacent pas d'ici — une destination se retire
 * dans la liste. Ce qu'on tape se lit aussitôt dans le texte de la scène.
 */
function ChampDePhrase({
  bloc, survol, lecture, onEcrire,
}: { bloc: Choix; survol: string | null; lecture?: boolean; onEcrire: (textes: string[]) => void }) {
  const { livre } = useCopie();
  const boite = useRef<HTMLDivElement>(null);
  // Le texte, puis un numéro, puis le texte… : toujours un texte de plus que de numéros
  const { textes, puces } = useMemo(() => {
    const t: string[] = [""];
    const p: Exclude<Morceau, { texte: string }>[] = [];
    for (const m of morceauxDe(bloc, livre.formule)) {
      if ("texte" in m) t[t.length - 1] += m.texte;
      else {
        p.push(m);
        t.push("");
      }
    }
    return { textes: t, puces: p };
  }, [bloc, livre.formule]);
  const champs = (): HTMLElement[] => [...(boite.current?.querySelectorAll<HTMLElement>("[data-texte]") ?? [])];

  // Le texte ne se réécrit à l'écran que s'il a changé ailleurs : le curseur de qui tape ne bouge pas
  useLayoutEffect(() => {
    champs().forEach((c, k) => {
      if (lu(c) !== (textes[k] ?? "")) c.textContent = textes[k] ?? "";
    });
  });

  const poser = (champ: HTMLElement | undefined, fin: boolean) => {
    if (!champ) return;
    champ.focus();
    const selection = window.getSelection();
    const plage = document.createRange();
    plage.selectNodeContents(champ);
    plage.collapse(!fin);
    selection?.removeAllRanges();
    selection?.addRange(plage);
  };
  const dire = () => {
    const suite = champs().map(lu);
    if (suite.some((t, k) => t !== textes[k])) onEcrire(suite);
  };

  return (
    <div
      className={`cx-phrase${lecture ? " cx-phrase--lue" : ""}`}
      ref={boite}
      role="group"
      aria-label="La phrase"
      lang="fr"
      // Un clic à côté du texte pose le curseur à la fin de la phrase
      onMouseDown={(ev) => {
        if (ev.target !== ev.currentTarget || lecture) return;
        ev.preventDefault();
        const tous = champs();
        poser(tous[tous.length - 1], true);
      }}
    >
      {textes.map((_, k) => (
        <Fragment key={k}>
          <span
            data-texte={k}
            className="cx-phrase__texte recit"
            role="textbox"
            aria-label={textes.length > 1 ? `La phrase, partie ${k + 1} sur ${textes.length}` : "La phrase"}
            contentEditable={!lecture}
            suppressContentEditableWarning
            spellCheck
            onInput={dire}
            onKeyDown={(ev) => {
              const selection = window.getSelection();
              const tous = champs();
              const debut = !!selection && selection.isCollapsed && selection.anchorOffset === 0 && (selection.anchorNode === ev.currentTarget || selection.anchorNode === ev.currentTarget.firstChild);
              const longueur = lu(ev.currentTarget).length;
              const bout = !!selection && selection.isCollapsed && (longueur === 0 || (selection.anchorNode !== ev.currentTarget && selection.anchorOffset === (selection.anchorNode?.textContent ?? "").length && selection.anchorNode === ev.currentTarget.lastChild));
              // Une seule ligne ; ni gras ni italique dans une phrase de choix
              if (ev.key === "Enter" || ((ev.metaKey || ev.ctrlKey) && ["b", "i", "u"].includes(ev.key.toLowerCase()))) return ev.preventDefault();
              // Les flèches passent d'un texte à l'autre par-dessus le numéro, qui ne s'efface pas d'ici
              if ((ev.key === "ArrowLeft" || ev.key === "Backspace") && debut && (longueur === 0 || selection?.anchorOffset === 0) && k > 0) {
                ev.preventDefault();
                poser(tous[k - 1], true);
              } else if ((ev.key === "ArrowRight" || ev.key === "Delete") && bout && k < tous.length - 1) {
                ev.preventDefault();
                poser(tous[k + 1], false);
              }
            }}
            onPaste={(ev) => {
              // Du texte simple, sur une ligne
              ev.preventDefault();
              const colle = ev.clipboardData.getData("text/plain").replace(/\s+/g, " ");
              const selection = window.getSelection();
              if (!colle || !selection?.rangeCount) return;
              selection.deleteFromDocument();
              selection.getRangeAt(0).insertNode(document.createTextNode(colle));
              selection.collapseToEnd();
              ev.currentTarget.normalize();
              dire();
            }}
            onDrop={(ev) => ev.preventDefault()}
          />
          {k < puces.length ? (
            "image" in puces[k] ? (
              // eslint-disable-next-line @next/next/no-img-element -- servie par l'application, qui vérifie qui peut la voir
              <img className="symbole" src={`/images/${(puces[k] as { image: string }).image}?v=1`} alt={(puces[k] as { alt?: string }).alt ?? ""} draggable={false} />
            ) : (
              <NumeroDePhrase renvoi={puces[k] as { renvoi: string; cible: string | null }} survole={survol === (puces[k] as { renvoi: string }).renvoi} />
            )
          ) : null}
        </Fragment>
      ))}
    </div>
  );
}

function NumeroDePhrase({ renvoi, survole }: { renvoi: { renvoi: string; cible: string | null }; survole: boolean }) {
  const { livre } = useCopie();
  const n = renvoi.cible ? livre.numeros[renvoi.cible] : undefined;
  return (
    <span className={`renvoi-copie${n ? "" : " renvoi-copie--vide"}${survole ? " est-survole" : ""}`} contentEditable={false} aria-label={n ? `numéro ${n}` : "numéro à venir"} role="img">
      {n ?? null}
    </span>
  );
}

/** Une destination dans la liste : son numéro, son nom sur une ligne, ses commandes dessous. */
function LigneDeDestination({
  renvoi, plusieurs, nom, ouverte, onSurvol, onChanger, onRetirer,
}: {
  renvoi: { id: string; cible: string | null }; plusieurs: boolean; nom: ReactNode; ouverte: boolean;
  onSurvol: (id: string | null) => void; onChanger: () => void; onRetirer: () => void;
}) {
  const { livre } = useCopie();
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id: renvoi.id, disabled: !plusieurs });
  return (
    <li
      ref={setNodeRef}
      className={`cx-dest${isDragging ? " est-tiree" : ""}`}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      onMouseEnter={() => onSurvol(renvoi.id)}
      onMouseLeave={() => onSurvol(null)}
    >
      {plusieurs ? <Prise nom="cette destination" ref={setActivatorNodeRef} {...attributes} {...listeners} /> : null}
      <span className="cx-dest__n">{renvoi.cible && livre.numeros[renvoi.cible] ? `n° ${livre.numeros[renvoi.cible]}` : "n° …"}</span>
      <span className="cx-dest__nom">{nom}</span>
      <span className="cx-dest__cmd">
        <button type="button" className="btn btn--petit" aria-expanded={ouverte} onClick={onChanger}>
          {renvoi.cible ? "Changer…" : "Choisir…"}
        </button>
        {plusieurs ? (
          <button type="button" className="btn btn--petit" onClick={onRetirer}>
            Retirer
          </button>
        ) : null}
      </span>
    </li>
  );
}

/**
 * Les réglages d'un choix : ce que fait le lecteur, ses destinations, sa phrase. Tout se lit
 * et s'écrit ici ; la phrase du texte suit.
 */
export function FicheReglagesChoix({
  bloc, services, gestes, auClavier, onFermer,
}: {
  bloc: Choix; services: Services; gestes: GestesDeChoix;
  /** Ouverte au clavier : elle prend le curseur, pour se régler et se refermer sans souris (F05-AC39) */
  auClavier?: boolean;
  onFermer: () => void;
}) {
  const { livre, pourEleve } = useCopie();
  const idLibelle = useId();
  const auto = estAuto(bloc);
  const renvois = renvoisDe(bloc);
  const plusieurs = renvois.length > 1;
  const [libelle, setLibelle] = useState(bloc.libelle);
  // « Changer… » : la destination d'un renvoi ; « + » : une destination de plus
  const [change, setChange] = useState<string | "nouvelle" | null>(null);
  const [survol, setSurvol] = useState<string | null>(null);
  const utiles = constructionsUtiles(livre.formule, livre.constructions);
  const champ = useRef<HTMLInputElement>(null);
  const capteurs = useCapteurs();
  useEffect(() => {
    if (auClavier) champ.current?.focus();
  }, [auClavier]);
  const scene = (id: string | null) => livre.scenes.find((s) => s.id === id);
  const nommer = (cible: string | null): ReactNode =>
    cible === null ? (
      <span className="copie__dest-vide">
        <span className="point-regarder" aria-hidden="true" />
        Sans destination
      </span>
    ) : scene(cible) ? (
      nomDeDestination(scene(cible), pourEleve)
    ) : (
      `autre chapitre${livre.ailleurs[cible] ? ` · ${livre.ailleurs[cible]}` : ""}`
    );
  const validerLibelle = () => {
    const propre = libelle.trim();
    if (propre && propre !== bloc.libelle) gestes.regler({ libelle: propre });
    else setLibelle(bloc.libelle);
  };
  // La flèche ronde : une autre tournure, ou le retour à l'automatique ; rien à faire avec plusieurs destinations
  const refaire = auto ? (utiles.length > 1 ? "Autre tournure" : null) : plusieurs ? null : "Remettre la phrase automatique";
  const deplacer = ({ active, over }: DragEndEvent) => {
    const [de, vers] = [renvois.findIndex((r) => r.id === active.id), renvois.findIndex((r) => r.id === over?.id)];
    if (de === -1 || vers === -1 || de === vers) return;
    gestes.ordonner(arrayMove(renvois, de, vers).map((r) => r.cible));
  };

  return (
    <Cadre
      titre="Choix"
      onFermer={onFermer}
      pied={
        <>
          {gestes.cacher && renvois.length === 1 && renvois[0].cible ? (
            <button type="button" className="lien cx-discret" onClick={gestes.cacher}>
              <Icone nom="cle" />
              Cacher ce choix (énigme)
            </button>
          ) : null}
          <button type="button" className="btn btn--danger btn--petit cx__suppr" onClick={gestes.supprimer}>
            <Icone nom="corbeille" />
            Supprimer ce choix
          </button>
        </>
      }
    >
      <div className="champ champ--plein">
        <span className="cx-question">
          <label htmlFor={idLibelle}>Ce que fait le lecteur</label>
          {auto ? null : (
            <Bulle question="À quoi sert ce libellé ?">
              La phrase est modifiée : elle ne le reprend plus. Il sert à nommer ce choix dans les chemins et dans la recherche.
            </Bulle>
          )}
        </span>
        <input
          id={idLibelle}
          ref={champ}
          className="pchamp"
          type="text"
          maxLength={200}
          value={libelle}
          onChange={(e) => setLibelle(e.target.value)}
          onBlur={validerLibelle}
          onKeyDown={(e) => {
            if (e.key !== "Enter") return;
            e.preventDefault();
            e.stopPropagation();
            validerLibelle();
          }}
        />
      </div>

      <div className="cx-dests">
        <p className="cx-titre cx-entete">
          {plusieurs ? "Destinations" : "Destination"}
          <button
            type="button"
            className="cx-rond"
            aria-label="Ajouter une destination"
            title="Ajouter une destination"
            aria-expanded={change === "nouvelle"}
            onClick={() => setChange(change === "nouvelle" ? null : "nouvelle")}
          >
            <Icone nom="plus" />
          </button>
        </p>
        <DndContext sensors={capteurs} collisionDetection={closestCenter} onDragEnd={deplacer}>
          <SortableContext items={renvois.map((r) => r.id)} strategy={verticalListSortingStrategy}>
            <ul>
              {renvois.map((r) => (
                <LigneDeDestination
                  key={r.id}
                  renvoi={r}
                  plusieurs={plusieurs}
                  nom={nommer(r.cible)}
                  ouverte={change === r.id}
                  onSurvol={setSurvol}
                  onChanger={() => setChange(change === r.id ? null : r.id)}
                  onRetirer={() => {
                    setChange(null);
                    gestes.retirerRenvoi(r.id);
                  }}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
        {change ? (
          <ChoisirDestination
            key={change}
            libelle={bloc.libelle}
            services={services}
            focus
            actuelle={change === "nouvelle" ? undefined : renvois.find((r) => r.id === change)?.cible}
            creer={change === "nouvelle" ? "Créer la scène et l’ajouter" : "Créer la scène et y mener"}
            valider={(destination) => {
              if (change === "nouvelle") gestes.ajouterDestination(destination);
              else if (auto) gestes.regler({ cible: destination.cible });
              else gestes.reglerRenvoi(change, { cible: destination.cible });
              setChange(null);
            }}
          />
        ) : null}
      </div>

      <div className="cx-forme">
        <p className="cx-titre cx-entete">
          <span className="cx-question">
            La phrase
            <Bulle question="Comment s’écrit la phrase ?">
              Elle s’écrit toute seule, d’après ce que fait le lecteur et la façon d’annoncer un numéro choisie pour le livre.{" "}
              {pourEleve ? "Tu peux" : "Vous pouvez"} la modifier ici : elle ne suivra plus la formule du livre. La flèche ronde la remet en automatique.
            </Bulle>
            {auto ? null : <span className="cx-etat">modifiée</span>}
          </span>
          <button type="button" className="cx-rond" disabled={!refaire} aria-label={refaire ?? "Phrase automatique"} title={refaire ?? (plusieurs ? "Avec plusieurs destinations, la phrase s’écrit à la main" : undefined)} onClick={gestes.automatiser}>
            <Icone nom="refaire" />
          </button>
        </p>
        <ChampDePhrase bloc={bloc} survol={survol} onEcrire={gestes.ecrire} />
      </div>
    </Cadre>
  );
}

/** Le renvoi d'une phrase personnalisée, avec sa destination. */
export const nouveauRenvoi = (cible: string | null): Renvoi => ({ type: "renvoi", id: nouvelId(), cible, children: [{ text: "" }] });

/** Une phrase automatique devenue personnalisée : le même texte, que l'on peut maintenant écrire (F05-AC22). */
export function enPersonnalisee(bloc: Choix, formule: Parameters<typeof phraseDeChoix>[2]): Choix {
  if (!estAuto(bloc)) return bloc;
  const MARQUE = "\u0001";
  const [avant, apres = ""] = phraseDeChoix(bloc.libelle || "…", MARQUE, formule, bloc.construction).split(MARQUE);
  return { type: "choix", id: bloc.id, libelle: bloc.libelle, children: [{ text: avant }, { ...nouveauRenvoi(bloc.cible), id: nouvelId() }, { text: apres }] };
}

/** La seule destination d'une phrase personnalisée à un renvoi, pour revenir à l'automatique (F05-AC23). */
export const seulRenvoi = (bloc: Choix): Renvoi | null => {
  const renvois = (bloc.children as unknown[]).filter(estRenvoi);
  return renvois.length === 1 ? renvois[0] : null;
};
