"use client";

import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import { Bulle } from "@/composants/Bulle";
import { Icone, type NomIcone } from "@/composants/Icone";
import { estAuto, estRenvoi, renvoisDe, tirerConstruction, nouvelId, type Choix, type Liaison, type Renvoi } from "@/domaine/copie";
import { constructionsUtiles, phraseDeChoix } from "@/domaine/preparation";
import { referenceScene } from "@/domaine/recit";
import { cle } from "@/domaine/texte";
import { useCopie, type ApercuDeChoix, type SceneConnue, type SceneCreee, type Services } from "./contexte";

/**
 * La fiche d'un choix, ouverte dans le panneau à droite du texte (F05.2 ; docs/design.md,
 * « Panneau des réglages ») : filet canard, celui de la décision. Elle sert à créer un choix
 * — « Ce que fait le lecteur », puis « Où mène ce choix ? » — et à régler un choix existant.
 */

/** Le libellé donné en exemple, dans le champ et dans la phrase en attente du texte. */
export const LIBELLE_EXEMPLE = "Traverser le pont";

type Issue = "existante" | "nouvelle";
export type Destination = { cible: string | null; creee?: SceneCreee };

/** Le nom d'une scène tel que la personne le lit : « S018 Clairière » pour l'adulte, « Clairière » pour l'élève. */
export function nomDeDestination(s: SceneConnue | undefined, pourEleve: boolean): string {
  if (!s) return "";
  if (pourEleve) return s.titre ?? "scène sans titre";
  return `${referenceScene(s.reference)}${s.titre ? ` ${s.titre}` : ""}`;
}

/**
 * « Où mène ce choix ? » (F05.2) : une scène existante ou une nouvelle scène, et rien d'autre
 * à l'écran que ce que l'issue choisie demande. La scène existante se retient d'un clic dans
 * la liste, ou aux flèches puis Entrée (F05-AC39) ; « Décider plus tard » laisse le choix
 * sans destination.
 */
export function ChoisirDestination({
  libelle, services, valider, actuelle, creer, focus, seulementExistante = false,
}: {
  libelle: string; services: Services;
  valider: (destination: Destination) => void;
  actuelle?: string | null;
  /** Ce que dit le bouton d'une nouvelle scène : « Créer le choix et la scène » */
  creer?: string;
  focus?: boolean;
  /** Un lien caché ne mène qu'à une scène qui existe : ni « nouvelle scène » ni « plus tard » */
  seulementExistante?: boolean;
}) {
  const { livre, droits, lieu } = useCopie();
  const adulte = droits.role === "adulte";
  const autres = useMemo(() => livre.scenes.filter((s) => s.id !== lieu.sceneId), [livre.scenes, lieu.sceneId]);
  // Sans autre scène à choisir, il ne reste qu'à en créer une
  const [issue, setIssue] = useState<Issue>(seulementExistante || autres.length > 0 ? "existante" : "nouvelle");
  const [demande, setDemande] = useState("");
  const [surligne, setSurligne] = useState(0);
  const [extraits, setExtraits] = useState<Record<string, string>>({});
  const [titre, setTitre] = useState<string | null>(null);
  const [ou, setOu] = useState(lieu.chapitreId);
  const [ailleurs, setAilleurs] = useState(false);
  const [attente, setAttente] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const champ = useRef<HTMLInputElement>(null);
  const champTitre = useRef<HTMLInputElement>(null);

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
  const resultats = useMemo(() => {
    // Sans demande : les scènes de ce chapitre, ou tout le livre s'il n'en a pas d'autre
    if (mots.length === 0) {
      const ici = autres.filter((s) => s.chapitreId === lieu.chapitreId);
      return ici.length ? ici : autres;
    }
    const parTexte = demande.trim().length >= 2 ? extraits : {};
    return autres.filter((s) => mots.every((m) => cle(`${referenceScene(s.reference)} ${s.titre ?? ""}`).includes(m)) || s.id in parTexte);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autres, demande, extraits, lieu.chapitreId]);
  const choisie = resultats[Math.min(surligne, resultats.length - 1)];

  const creerLaScene = async () => {
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
                setSurligne((n) => Math.min(n + 1, resultats.length - 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setSurligne((n) => Math.max(n - 1, 0));
              } else if (e.key === "Enter") {
                e.preventDefault();
                e.stopPropagation();
                if (choisie) valider({ cible: choisie.id });
              }
            }}
          />
          {resultats.length === 0 ? (
            <p className="cx-aide">Aucune scène trouvée.</p>
          ) : (
            <ul className="cx-liste" role="listbox" aria-label="Scènes">
              {resultats.slice(0, 40).map((s, i) => (
                <li key={s.id} role="option" aria-selected={s.id === choisie?.id}>
                  <button type="button" tabIndex={-1} className={s.id === choisie?.id ? "est-choisie" : undefined} onClick={() => { setSurligne(i); valider({ cible: s.id }); }} onMouseEnter={() => setSurligne(i)}>
                    <span className="fiche__ref">{referenceScene(s.reference)}</span>
                    <span className="cx-liste__titre">
                      {s.titre ?? <span className="sans-consigne">sans titre</span>}
                      {s.id === actuelle ? <small> · destination actuelle</small> : null}
                      {extraits[s.id] && mots.length ? <small className="cx-liste__extrait">{extraits[s.id]}</small> : null}
                    </span>
                    <span className="cx-liste__ou">
                      {s.chapitreId === lieu.chapitreId ? null : <span className="repere">raccord · {s.chapitre}</span>}
                      {livre.numeros[s.id] ? <span className="cx-liste__n">n° {livre.numeros[s.id]}</span> : null}
                    </span>
                  </button>
                </li>
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
      {seulementExistante ? null : (
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
  personnaliser: () => void;
  automatiser: () => void;
  insererRenvoi: (destination: Destination) => void;
  retirerRenvoi: (renvoi: string) => void;
  supprimer: () => void;
  /** « Cacher ce choix (énigme) » : la phrase part, le lien reste, le numéro est fixé. Adulte seul (F05-AC26) */
  cacher?: () => void;
};

/** Les réglages d'un choix existant : libellé, destination, forme de la phrase, suppression. */
export function FicheReglagesChoix({
  bloc, services, gestes, confirmer, auClavier, onFermer,
}: {
  bloc: Choix; services: Services; gestes: GestesDeChoix; confirmer?: "dernier-renvoi";
  /** Ouverte au clavier : elle prend le curseur, pour se régler et se refermer sans souris (F05-AC39) */
  auClavier?: boolean;
  onFermer: () => void;
}) {
  const { livre, pourEleve } = useCopie();
  const auto = estAuto(bloc);
  const renvois = renvoisDe(bloc);
  const [libelle, setLibelle] = useState(bloc.libelle);
  // « Changer… » : la destination d'un renvoi, ou un renvoi de plus à insérer
  const [change, setChange] = useState<string | "nouveau" | null>(null);
  const [aConfirmer, setAConfirmer] = useState<"dernier-renvoi" | "automatique" | null>(confirmer ?? null);
  const utiles = constructionsUtiles(livre.formule, livre.constructions);
  const champ = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (auClavier) champ.current?.focus();
  }, [auClavier]);
  const scene = (id: string | null) => livre.scenes.find((s) => s.id === id);
  const nommer = (cible: string | null): ReactNode =>
    cible === null ? (
      <span className="copie__dest-vide">
        <Icone nom="bloque" />
        Sans destination
      </span>
    ) : scene(cible) ? (
      <b>{nomDeDestination(scene(cible), pourEleve)}</b>
    ) : (
      <b>autre chapitre{livre.ailleurs[cible] ? ` · ${livre.ailleurs[cible]}` : ""}</b>
    );
  const validerLibelle = () => {
    const propre = libelle.trim();
    if (propre && propre !== bloc.libelle) gestes.regler({ libelle: propre });
    else setLibelle(bloc.libelle);
  };

  return (
    <Cadre
      titre="Choix"
      onFermer={onFermer}
      pied={
        <>
          {gestes.cacher && renvois.length === 1 && renvois[0].cible ? (
            <button type="button" className="btn btn--petit" onClick={gestes.cacher}>
              <Icone nom="cle" />
              Cacher ce choix (énigme)
            </button>
          ) : null}
          <button type="button" className="btn btn--danger cx__suppr" onClick={gestes.supprimer}>
            <Icone nom="corbeille" />
            Supprimer ce choix
          </button>
        </>
      }
    >
      <label className="champ champ--plein">
        <span>Ce que fait le lecteur{auto ? "" : <em> · sert aux chemins et à la recherche</em>}</span>
        <input
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
      </label>

      {aConfirmer === "dernier-renvoi" ? (
        <div className="cx-note cx-note--avert" role="alert">
          <Icone nom="alerte" />
          <div>
            <p>C’est le dernier renvoi de cette phrase : sans renvoi, il n’y a plus de choix. Supprimer la phrase entière ?</p>
            <p className="cx__cmd">
              <button type="button" className="btn btn--danger" onClick={gestes.supprimer}>
                Supprimer la phrase
              </button>
              <button type="button" className="btn" onClick={() => setAConfirmer(null)}>
                Garder la phrase
              </button>
            </p>
          </div>
        </div>
      ) : null}

      <div className="cx-renvois">
        <p className="cx-titre">{renvois.length > 1 ? "Destinations" : "Destination"}</p>
        <ul>
          {renvois.map((r) => (
            <li key={r.id}>
              <span className="cx-renvois__n">{r.cible && livre.numeros[r.cible] ? `n° ${livre.numeros[r.cible]}` : "n° …"}</span>
              <span className="cx-renvois__ou">{nommer(r.cible)}</span>
              <button type="button" className="btn btn--petit" aria-expanded={change === r.id} onClick={() => setChange(change === r.id ? null : r.id)}>
                Changer…
              </button>
              {auto ? null : (
                <button
                  type="button"
                  className="btn btn--petit"
                  onClick={() => (renvois.length === 1 ? setAConfirmer("dernier-renvoi") : gestes.retirerRenvoi(r.id))}
                >
                  Retirer ce renvoi
                </button>
              )}
            </li>
          ))}
        </ul>
        {change && change !== "nouveau" ? (
          <ChoisirDestination
            libelle={bloc.libelle}
            services={services}
            focus
            actuelle={renvois.find((r) => r.id === change)?.cible}
            creer="Créer la scène et y mener"
            valider={({ cible }) => {
              if (auto) gestes.regler({ cible });
              else gestes.reglerRenvoi(change, { cible });
              setChange(null);
            }}
          />
        ) : null}
      </div>

      <div className="cx-forme">
        <p className="cx-titre">Phrase</p>
        {auto ? (
          <p className="cx__cmd">
            <span className="cx-aide">Elle s’écrit toute seule, avec la façon d’annoncer un numéro choisie pour le livre.</span>
            {utiles.length > 1 ? (
              <button
                type="button"
                className="btn btn--petit"
                onClick={() => {
                  const autres = utiles.filter((u) => u !== bloc.construction);
                  gestes.regler({ construction: tirerConstruction(autres.length ? autres : utiles) });
                }}
              >
                Régénérer
              </button>
            ) : null}
            <button type="button" className="btn btn--petit" onClick={gestes.personnaliser}>
              Personnaliser
            </button>
          </p>
        ) : (
          <>
            <p className="cx-aide">
              {pourEleve ? "Tu écris" : "Vous écrivez"} la phrase dans le texte, autour de {renvois.length > 1 ? "ses numéros" : "son numéro"}. La formule du livre ne s’y applique plus.
            </p>
            <p className="cx__cmd">
              <button type="button" className="btn btn--petit" aria-expanded={change === "nouveau"} onClick={() => setChange(change === "nouveau" ? null : "nouveau")}>
                Insérer un renvoi à l’endroit du curseur
              </button>
              {renvois.length === 1 ? (
                <button type="button" className="btn btn--petit" onClick={() => setAConfirmer("automatique")}>
                  Revenir à la phrase automatique
                </button>
              ) : null}
            </p>
            {change === "nouveau" ? (
              <ChoisirDestination
                libelle={bloc.libelle}
                services={services}
                focus
                creer="Créer la scène et insérer le renvoi"
                valider={(destination) => {
                  gestes.insererRenvoi(destination);
                  setChange(null);
                }}
              />
            ) : null}
            {aConfirmer === "automatique" ? (
              <div className="cx-note cx-note--avert" role="alert">
                <Icone nom="alerte" />
                <div>
                  <p>
                    Le texte écrit à la main sera remplacé par « {phraseDeChoix(bloc.libelle || "…", "…", livre.formule, "neutre")} ».
                  </p>
                  <p className="cx__cmd">
                    <button
                      type="button"
                      className="btn"
                      onClick={() => {
                        gestes.automatiser();
                        setAConfirmer(null);
                      }}
                    >
                      Revenir à la phrase automatique
                    </button>
                    <button type="button" className="btn" onClick={() => setAConfirmer(null)}>
                      Garder mon texte
                    </button>
                  </p>
                </div>
              </div>
            ) : null}
          </>
        )}
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
