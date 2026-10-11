"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Icone } from "@/composants/Icone";
import { estAuto, estRenvoi, renvoisDe, tirerConstruction, nouvelId, type Choix, type Liaison, type Renvoi } from "@/domaine/copie";
import { constructionsUtiles, phraseDeChoix } from "@/domaine/preparation";
import { referenceScene } from "@/domaine/recit";
import { cle } from "@/domaine/texte";
import { useCopie, type SceneConnue, type SceneCreee, type Services } from "./contexte";

/**
 * La fiche d'un choix, ouverte dans le panneau à droite du texte (F05.2 ; docs/design.md,
 * « Panneau des réglages ») : filet canard, celui de la décision. Elle sert à créer un choix
 * — « Ce que fait le lecteur », puis « Où mène ce choix ? » — et à régler un choix existant.
 */

type Issue = "existante" | "nouvelle" | "plus-tard";
export type Destination = { cible: string | null; creee?: SceneCreee };

/** Le nom d'une scène tel que la personne le lit : « S018 Clairière » pour l'adulte, « Clairière » pour l'élève. */
export function nomDeDestination(s: SceneConnue | undefined, pourEleve: boolean): string {
  if (!s) return "";
  if (pourEleve) return s.titre ?? "scène sans titre";
  return `${referenceScene(s.reference)}${s.titre ? ` ${s.titre}` : ""}`;
}

/**
 * « Où mène ce choix ? » : une scène existante, cherchée par son titre ou son texte ; une
 * nouvelle scène ; ou une destination à décider plus tard (F05.2). Au clavier : les flèches
 * parcourent la liste, Entrée valide (F05-AC39).
 */
export function ChoisirDestination({
  libelle, services, valider, actuelle, deplus, focus, seulementExistante = false,
}: {
  libelle: string; services: Services;
  /** Reçoit la destination retenue ; rend faux si elle n'a pas pu l'être */
  valider: (destination: Destination) => void;
  actuelle?: string | null;
  /** Le bouton qui valide dit ce qu'il fera : « Créer le choix », « Changer la destination » */
  deplus: { verbe: string; sansScene: boolean };
  focus?: boolean;
  /** Un lien caché ne mène qu'à une scène qui existe : ni « nouvelle scène » ni « plus tard » */
  seulementExistante?: boolean;
}) {
  const { livre, droits, lieu, pourEleve } = useCopie();
  const [issue, setIssue] = useState<Issue>("existante");
  const [demande, setDemande] = useState("");
  const [chapitre, setChapitre] = useState<string>("");
  const [surligne, setSurligne] = useState(0);
  const [extraits, setExtraits] = useState<Record<string, string>>({});
  const [titre, setTitre] = useState<string | null>(null);
  const [ou, setOu] = useState(lieu.chapitreId);
  const [attente, setAttente] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const champ = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (focus) champ.current?.focus();
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
    const parTexte = demande.trim().length >= 2 ? extraits : {};
    return livre.scenes.filter((s) => {
      if (s.id === lieu.sceneId) return false;
      if (chapitre && s.chapitreId !== chapitre) return false;
      if (mots.length === 0) return chapitre ? true : s.chapitreId === lieu.chapitreId;
      const ou = cle(`${referenceScene(s.reference)} ${s.titre ?? ""}`);
      return mots.every((m) => ou.includes(m)) || s.id in parTexte;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [livre.scenes, demande, chapitre, extraits, lieu.sceneId, lieu.chapitreId]);
  const choisie = resultats[Math.min(surligne, resultats.length - 1)];

  const creer = async () => {
    setAttente(true);
    setErreur(null);
    const fait = await services.creerScene(ou, (titre ?? libelle).trim());
    setAttente(false);
    if (!fait.ok) return setErreur(fait.erreur);
    valider({ cible: fait.scene.id, creee: fait.scene });
  };
  const confirmer = () => {
    if (issue === "plus-tard") return valider({ cible: null });
    if (issue === "nouvelle") return void creer();
    if (choisie) valider({ cible: choisie.id });
  };

  return (
    <fieldset className="cx-issues">
      <legend>{seulementExistante ? "Où mène ce lien caché ?" : "Où mène ce choix ?"}</legend>
      {seulementExistante ? null : (
        <div className="cx-seg" role="radiogroup" aria-label="Où mène ce choix ?">
          {(
            [
              ["existante", "Scène existante"],
              ["nouvelle", "Nouvelle scène"],
              ["plus-tard", "À décider plus tard"],
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
          <div className="cx-recherche">
            <label className="vh" htmlFor="cx-demande">
              Chercher une scène
            </label>
            <input
              id="cx-demande"
              ref={champ}
              className="pchamp"
              type="search"
              value={demande}
              autoComplete="off"
              placeholder={droits.role === "adulte" ? "Chercher dans les titres et les textes" : "Chercher dans ton chapitre"}
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
                  confirmer();
                }
              }}
            />
            {droits.role === "adulte" && livre.chapitres.length > 1 ? (
              <>
                <label className="vh" htmlFor="cx-chapitre">
                  Chapitre
                </label>
                <select id="cx-chapitre" className="pchamp" value={chapitre} onChange={(e) => { setChapitre(e.target.value); setSurligne(0); }}>
                  <option value="">{mots.length ? "Tous les chapitres" : "Ce chapitre"}</option>
                  {livre.chapitres.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.titre}
                    </option>
                  ))}
                </select>
              </>
            ) : null}
          </div>
          {droits.role !== "adulte" ? <p className="cx-aide">Tu choisis parmi les scènes de ton chapitre.</p> : null}
          {resultats.length === 0 ? (
            <p className="cx-aide">Aucune scène trouvée.{seulementExistante ? "" : ` ${pourEleve ? "Tu peux" : "Vous pouvez"} en créer une : « Nouvelle scène ».`}</p>
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
      ) : null}

      {issue === "nouvelle" ? (
        <div className="cx-nouvelle">
          <label className="champ champ--plein">
            <span>Titre de la nouvelle scène</span>
            <input
              className="pchamp"
              type="text"
              maxLength={120}
              value={titre ?? libelle}
              onChange={(e) => setTitre(e.target.value)}
              onKeyDown={(e) => {
                if (e.key !== "Enter") return;
                e.preventDefault();
                e.stopPropagation();
                confirmer();
              }}
            />
          </label>
          {droits.role === "adulte" && livre.chapitres.length > 1 ? (
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
          <p className="cx-aide">
            La scène est créée vide{ou !== lieu.chapitreId ? ", dans un autre chapitre : c’est un raccord" : ""}. {pourEleve ? "Tu restes" : "Vous restez"} dans cette scène.
          </p>
        </div>
      ) : null}

      {issue === "plus-tard" ? (
        <p className="cx-note cx-note--bloque">
          <Icone nom="bloque" />
          <span>
            Sans destination, ce choix <b>bloquera le PDF définitif</b>. {pourEleve ? "Tu pourras" : "Vous pourrez"} la choisir plus tard, depuis la phrase.
          </span>
        </p>
      ) : null}
      {erreur ? (
        <p className="erreur" role="alert">
          {erreur}
        </p>
      ) : null}
      <p className="cx__cmd">
        <button
          type="button"
          className="btn btn--primaire"
          disabled={attente || (issue === "existante" && !choisie)}
          aria-busy={attente || undefined}
          onClick={confirmer}
        >
          {issue === "nouvelle" ? `${deplus.verbe} et la scène` : issue === "plus-tard" && deplus.sansScene ? `${deplus.verbe} sans destination` : deplus.verbe}
        </button>
      </p>
    </fieldset>
  );
}

function Cadre({ titre, onFermer, children, pied }: { titre: string; onFermer: () => void; children: ReactNode; pied?: ReactNode }) {
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
        <Icone nom="choix" />
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

/** Créer un choix : libellé, puis destination. La phrase se compose au-dessus pendant la saisie. */
export function FicheNouveauChoix({
  services, onCreer, onCreerLiaison, onFermer,
}: {
  services: Services; onCreer: (choix: Choix, creee?: SceneCreee) => void;
  /** Créer une liaison cachée, son numéro déjà fixé (F05.1) */
  onCreerLiaison: (liaison: Liaison, numero: number | null) => void;
  onFermer: () => void;
}) {
  const { livre, pourEleve, droits } = useCopie();
  // « Lien caché (énigme) » : une forme de plus, pour l'adulte seul (F05-AC27)
  const [forme, setForme] = useState<"phrase" | "cache">("phrase");
  const [libelle, setLibelle] = useState("");
  const [construction] = useState(() => tirerConstruction(constructionsUtiles(livre.formule, livre.constructions)));
  const champ = useRef<HTMLInputElement>(null);
  const [versDestination, setVersDestination] = useState(false);
  useEffect(() => {
    champ.current?.focus();
  }, []);

  return (
    <Cadre titre="Nouveau choix" onFermer={onFermer} pied={<span className="cx-clavier"><kbd>Entrée</kbd> valide · <kbd>Échap</kbd> ferme</span>}>
      {droits.role === "adulte" && services.fixerNumero ? (
        <div className="cx-seg cx-seg--forme" role="radiogroup" aria-label="Forme du choix">
          {(
            [
              ["phrase", "Phrase de choix"],
              ["cache", "Lien caché (énigme)"],
            ] as const
          ).map(([valeur, nom]) => (
            <label key={valeur}>
              <input type="radio" name="forme" checked={forme === valeur} onChange={() => setForme(valeur)} />
              <span>{nom}</span>
            </label>
          ))}
        </div>
      ) : null}
      {forme === "cache" ? <CreerLienCache services={services} onCreer={onCreerLiaison} /> : <>
      <p className="phrase-choix phrase-choix--apercu" aria-hidden="true">
        <span className="recit">{libelle.trim() ? phraseDeChoix(libelle.trim(), "…", livre.formule, construction) : <span className="cx-fantome">La phrase du choix se compose ici.</span>}</span>
      </p>
      <label className="champ champ--plein">
        <span>Ce que fait le lecteur</span>
        <input
          ref={champ}
          className="pchamp"
          type="text"
          maxLength={200}
          value={libelle}
          placeholder="Par exemple : Traverser le pont"
          onChange={(e) => setLibelle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key !== "Enter") return;
            e.preventDefault();
            e.stopPropagation();
            if (libelle.trim()) setVersDestination(true);
          }}
        />
        <span className="cx-aide">De préférence une action : « Prendre la clé », « Faire demi-tour ».</span>
      </label>
      <ChoisirDestination
        key={String(versDestination)}
        libelle={libelle}
        services={services}
        focus={versDestination}
        deplus={{ verbe: "Créer le choix", sansScene: true }}
        valider={({ cible, creee }) => {
          if (!libelle.trim()) return champ.current?.focus();
          onCreer({ type: "choix", id: nouvelId(), auto: true, libelle: libelle.trim(), construction, cible, children: [{ text: "" }] }, creee);
        }}
      />
      {pourEleve ? null : <p className="cx-aide">La phrase s’écrit toute seule ; vous pourrez la personnaliser ensuite.</p>}
      </>}
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
        <p className="cx-aide">Le lecteur trouve lui-même où poursuivre, en résolvant une énigme : aucune phrase ne s’ajoute au texte.</p>
        <ChoisirDestination libelle="" services={services} seulementExistante focus deplus={{ verbe: "Choisir cette scène", sansScene: false }} valider={({ cible: choisie }) => setCible(choisie)} />
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
            deplus={{ verbe: "Changer la destination", sansScene: false }}
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
                deplus={{ verbe: "Insérer le renvoi", sansScene: true }}
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
