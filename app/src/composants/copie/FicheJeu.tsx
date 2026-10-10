"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Icone } from "@/composants/Icone";
import { cle } from "@/domaine/texte";
import { useCopie, type Jeu, type Services } from "./contexte";

/**
 * Les deux fiches volantes du jeu (F04.2 ; docs/design.md, « Objets, feuille d'aventure,
 * actions de jeu et dé »). « Objets » écrit un nom à l'endroit du curseur, comme du texte
 * ordinaire : c'est une aide à la cohérence des noms. « Action de jeu » crée un paragraphe
 * d'action, vide ou à partir d'une formule : elle porte le filet canard de la décision.
 */

function Cadre({ titre, icone, onFermer, children, pied }: { titre: string; icone: "sac" | "crayon"; onFermer: () => void; children: ReactNode; pied?: ReactNode }) {
  return (
    <section
      className="cx cx--jeu"
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

/** Les flèches parcourent la liste, Entrée retient la ligne surlignée. */
function useListe(nombre: number, retenir: (i: number) => void) {
  const [surligne, setSurligne] = useState(0);
  const choisi = Math.min(surligne, Math.max(0, nombre - 1));
  return {
    choisi,
    setSurligne,
    auClavier: (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSurligne(Math.min(choisi + 1, nombre - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSurligne(Math.max(choisi - 1, 0));
      } else if (e.key === "Enter" && nombre > 0) {
        e.preventDefault();
        e.stopPropagation();
        retenir(choisi);
      }
    },
  };
}

/**
 * « Objets de l'histoire » : la liste tenue par l'adulte, que chacun consulte en écrivant.
 * L'objet retenu s'écrit dans le texte tel qu'il est noté ; l'élève ne peut ni en ajouter ni
 * en modifier (F04-AC15, AC28, AC29).
 */
export function FicheObjets({ jeu, services, onChoisir, onFermer }: { jeu: Jeu; services: Services; onChoisir: (nom: string) => void; onFermer: () => void }) {
  const { pourEleve, enseignant, lieu, droits } = useCopie();
  const [demande, setDemande] = useState("");
  const [ajout, setAjout] = useState<{ nom: string; description: string } | null>(null);
  const [attente, setAttente] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const champ = useRef<HTMLInputElement>(null);
  useEffect(() => {
    champ.current?.focus();
  }, []);
  const mots = cle(demande).split(" ").filter(Boolean);
  const trouves = useMemo(
    () => jeu.objets.filter((o) => mots.every((m) => cle(`${o.nom} ${o.description}`).includes(m))),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [jeu.objets, demande],
  );
  const liste = useListe(trouves.length, (i) => onChoisir(trouves[i].nom));
  const adulte = droits.role === "adulte";

  const ajouter = async () => {
    if (!ajout || !services.ajouterObjet) return;
    setAttente(true);
    setErreur(null);
    const fait = await services.ajouterObjet(ajout.nom, ajout.description);
    setAttente(false);
    if (!fait.ok) return setErreur(fait.erreur ?? "L’objet n’a pas pu être ajouté.");
    setDemande(ajout.nom);
    setAjout(null);
    champ.current?.focus();
  };

  return (
    <Cadre
      titre="Objets de l’histoire"
      icone="sac"
      onFermer={onFermer}
      pied={
        adulte ? (
          <Link className="lien" href={`/projet/${lieu.projetId}/preparation`}>
            Voir la liste dans la préparation
          </Link>
        ) : (
          <span className="cx-aide">Liste tenue par {enseignant ?? "ton enseignant(e)"}</span>
        )
      }
    >
      {jeu.objets.length === 0 ? (
        <p className="cx-aide">{adulte ? "Aucun objet dans la liste pour l’instant." : `${enseignant ?? "Ton enseignant(e)"} n’a pas encore noté d’objet.`}</p>
      ) : (
        <>
          <label className="vh" htmlFor="cx-objet">
            Chercher un objet
          </label>
          <input
            id="cx-objet"
            ref={champ}
            className="pchamp"
            type="search"
            autoComplete="off"
            value={demande}
            placeholder="Chercher un objet"
            onChange={(e) => {
              setDemande(e.target.value);
              liste.setSurligne(0);
            }}
            onKeyDown={liste.auClavier}
          />
          {trouves.length === 0 ? (
            <p className="cx-aide">Aucun objet ne porte ce nom.</p>
          ) : (
            <ul className="cx-liste cx-liste--objets" role="listbox" aria-label="Objets">
              {trouves.map((o, i) => (
                <li key={o.id} role="option" aria-selected={i === liste.choisi}>
                  <button type="button" tabIndex={-1} className={i === liste.choisi ? "est-choisie" : undefined} onClick={() => onChoisir(o.nom)} onMouseEnter={() => liste.setSurligne(i)}>
                    <span className="cx-objet__nom">{o.nom}</span>
                    {o.description ? <span className="cx-objet__desc">{o.description}</span> : null}
                  </button>
                </li>
              ))}
            </ul>
          )}
          <p className="cx-aide">
            Le nom s’écrit dans {pourEleve ? "ton" : "le"} texte tel quel. {pourEleve ? "Corrige" : "Corrigez"} ensuite, s’il le faut : « de la clé », « sa clé ».
          </p>
        </>
      )}
      {adulte && services.ajouterObjet ? (
        ajout ? (
          <form
            className="cx-ajout"
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              void ajouter();
            }}
          >
            <label className="champ">
              <span>Nom, tel qu’il s’écrit dans une phrase</span>
              <input className="pchamp" type="text" maxLength={60} autoFocus value={ajout.nom} placeholder="la clé d’argent" onChange={(e) => setAjout({ ...ajout, nom: e.target.value })} />
            </label>
            <label className="champ">
              <span>Description, facultative</span>
              <input className="pchamp" type="text" maxLength={120} value={ajout.description} onChange={(e) => setAjout({ ...ajout, description: e.target.value })} />
            </label>
            <p className="cx__cmd">
              <button type="submit" className="btn" disabled={attente || !ajout.nom.trim()} aria-busy={attente || undefined}>
                Ajouter à la liste
              </button>
              <button type="button" className="btn btn--discret" onClick={() => setAjout(null)}>
                Annuler
              </button>
            </p>
          </form>
        ) : (
          <p className="cx__cmd">
            <button type="button" className="btn btn--petit" onClick={() => setAjout({ nom: demande.trim(), description: "" })}>
              <Icone nom="plus" />
              Ajouter un objet à la liste
            </button>
          </p>
        )
      ) : null}
      {erreur ? (
        <p className="erreur" role="alert">
          {erreur}
        </p>
      ) : null}
    </Cadre>
  );
}

/**
 * « Action de jeu » : un paragraphe vide, à écrire, ou une formule de la liste (F04-AC27).
 * La formule retenue devient du texte libre, modifiable sur place.
 */
export function FicheAction({
  jeu, services, pourUneAction, onChoisir, onFermer,
}: {
  jeu: Jeu; services: Services;
  /** Les formules pour le texte d'une action qui existe déjà : pas de paragraphe vide à proposer */
  pourUneAction: boolean;
  onChoisir: (texte: string) => void; onFermer: () => void;
}) {
  const { droits } = useCopie();
  const [ajout, setAjout] = useState<string | null>(null);
  const [attente, setAttente] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const liste = useRef<HTMLUListElement>(null);
  const lignes = [...(pourUneAction ? [] : [{ id: "vide", texte: "" }]), ...jeu.formules];
  const { choisi, setSurligne, auClavier } = useListe(lignes.length, (i) => onChoisir(lignes[i].texte));
  useEffect(() => {
    liste.current?.focus();
  }, []);
  const adulte = droits.role === "adulte";

  const ajouter = async () => {
    if (ajout === null || !services.ajouterFormule) return;
    setAttente(true);
    setErreur(null);
    const fait = await services.ajouterFormule(ajout);
    setAttente(false);
    if (!fait.ok) return setErreur(fait.erreur ?? "La formule n’a pas pu être ajoutée.");
    setAjout(null);
    liste.current?.focus();
  };

  return (
    <Cadre titre={pourUneAction ? "Formules d’action" : "Action de jeu"} icone="crayon" onFermer={onFermer} pied={<span className="cx-clavier"><kbd>Entrée</kbd> valide · <kbd>Échap</kbd> ferme</span>}>
      {lignes.length === 0 ? (
        <p className="cx-aide">Aucune formule dans la liste pour l’instant.</p>
      ) : (
        <ul className="cx-liste cx-liste--formules" role="listbox" aria-label="Formules d’action" tabIndex={0} ref={liste} onKeyDown={auClavier}>
          {lignes.map((f, i) => (
            <li key={f.id} role="option" aria-selected={i === choisi}>
              <button type="button" tabIndex={-1} className={i === choisi ? "est-choisie" : undefined} onClick={() => onChoisir(f.texte)} onMouseEnter={() => setSurligne(i)}>
                {f.texte ? <span className="cx-formule">{f.texte}</span> : <span className="cx-formule cx-formule--vide">Paragraphe vide, à écrire</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
      {adulte && services.ajouterFormule ? (
        ajout !== null ? (
          <form
            className="cx-ajout"
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              void ajouter();
            }}
          >
            <label className="champ champ--plein">
              <span>Formule</span>
              <input className="pchamp" type="text" maxLength={140} autoFocus value={ajout} placeholder="Retire un point de volonté à ton héros." onChange={(e) => setAjout(e.target.value)} />
            </label>
            <p className="cx__cmd">
              <button type="submit" className="btn" disabled={attente || !ajout.trim()} aria-busy={attente || undefined}>
                Ajouter à la liste
              </button>
              <button type="button" className="btn btn--discret" onClick={() => setAjout(null)}>
                Annuler
              </button>
            </p>
          </form>
        ) : (
          <p className="cx__cmd">
            <button type="button" className="btn btn--petit" onClick={() => setAjout("")}>
              <Icone nom="plus" />
              Ajouter une formule à la liste
            </button>
          </p>
        )
      ) : null}
      {erreur ? (
        <p className="erreur" role="alert">
          {erreur}
        </p>
      ) : null}
    </Cadre>
  );
}
