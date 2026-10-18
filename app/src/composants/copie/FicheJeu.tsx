"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Icone } from "@/composants/Icone";
import { Signes } from "@/composants/Signes";
import type { Formule, SigneAction } from "@/domaine/preparation";
import { cle } from "@/domaine/texte";
import { useCopie, type Jeu, type Services } from "./contexte";

/**
 * Objets de l'histoire et formules d'action (F04.2). Ce qui se choisit dans une liste
 * courte s'ouvre au curseur, comme le menu des commandes : la liste des objets, avec son
 * filtre, et celle des formules. Ce qui se saisit — un nouvel objet, une nouvelle formule —
 * s'ouvre dans le panneau de droite, comme tout ce qui a des champs.
 */

/**
 * La ligne surlignée au clavier reste à l'écran : la liste défile jusqu'à elle. Pas quand
 * c'est la souris qui surligne : la liste bougerait sous le pointeur.
 */
export function useLigneVisible(liste: React.RefObject<HTMLElement | null>, choisi: number) {
  const auClavier = useRef(false);
  useEffect(() => {
    if (!auClavier.current) return;
    auClavier.current = false;
    liste.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: "nearest" });
  }, [liste, choisi]);
  return () => {
    auClavier.current = true;
  };
}

/** Les flèches parcourent la liste, Entrée retient la ligne surlignée. */
function useListe(nombre: number, retenir: (i: number) => void, liste: React.RefObject<HTMLElement | null>) {
  const [surligne, setSurligne] = useState(0);
  const choisi = Math.min(surligne, Math.max(0, nombre - 1));
  const suivre = useLigneVisible(liste, choisi);
  return {
    choisi,
    setSurligne,
    auClavier: (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        suivre();
        setSurligne(Math.min(choisi + 1, nombre - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        suivre();
        setSurligne(Math.max(choisi - 1, 0));
      } else if (e.key === "Enter" && nombre > 0) {
        e.preventDefault();
        e.stopPropagation();
        retenir(choisi);
      }
    },
  };
}

const auClavierDeLaListe = (onFermer: () => void) => (e: React.KeyboardEvent) => {
  if (e.key !== "Escape") return;
  e.preventDefault();
  e.stopPropagation();
  onFermer();
};

/**
 * « Objets » : la liste tenue par l'adulte, avec un filtre. L'objet retenu s'écrit dans le
 * texte tel qu'il est noté ; l'élève ne peut ni en ajouter ni en modifier (F04-AC15, AC28).
 */
export function ListeObjets({ jeu, onChoisir, onCreer, onFermer }: { jeu: Jeu; onChoisir: (nom: string) => void; onCreer?: (nom: string) => void; onFermer: () => void }) {
  const { enseignant } = useCopie();
  const [demande, setDemande] = useState("");
  const champ = useRef<HTMLInputElement>(null);
  const bouton = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    (champ.current ?? bouton.current)?.focus();
  }, []);
  const mots = cle(demande).split(" ").filter(Boolean);
  const trouves = useMemo(
    () => jeu.objets.filter((o) => mots.every((m) => cle(`${o.nom} ${o.description}`).includes(m))),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [jeu.objets, demande],
  );
  const lignes = useRef<HTMLUListElement>(null);
  const liste = useListe(trouves.length, (i) => onChoisir(trouves[i].nom), lignes);
  return (
    <div className="pop" role="dialog" aria-label="Objets de l’histoire" onKeyDown={auClavierDeLaListe(onFermer)}>
      {jeu.objets.length === 0 ? (
        <p className="pop__vide">{onCreer ? "Aucun objet dans la liste pour l’instant." : `${enseignant ?? "Ton enseignant(e)"} n’a pas encore noté d’objet.`}</p>
      ) : (
        <>
          <label className="vh" htmlFor="pop-objet">
            Chercher un objet
          </label>
          <input
            id="pop-objet"
            ref={champ}
            className="pchamp pop__filtre"
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
            <p className="pop__vide">Aucun objet ne porte ce nom.</p>
          ) : (
            <ul className="pop__liste" role="listbox" aria-label="Objets" ref={lignes}>
              {trouves.map((o, i) => (
                <li key={o.id} role="option" aria-selected={i === liste.choisi}>
                  <button type="button" tabIndex={-1} onClick={() => onChoisir(o.nom)} onMouseEnter={() => liste.setSurligne(i)}>
                    <span className="pop__nom">{o.nom}</span>
                    {o.description ? <span className="pop__desc">{o.description}</span> : null}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
      <p className="pop__pied">
        {onCreer ? (
          <button type="button" ref={bouton} className="pop__plus" onClick={() => onCreer(demande.trim())}>
            <Icone nom="plus" />
            Créer un nouvel objet
          </button>
        ) : (
          <span>Liste tenue par {enseignant ?? "ton enseignant(e)"}</span>
        )}
      </p>
    </div>
  );
}

/**
 * `/personnage` (F10.2, décidé le 17 octobre 2026) : les personnages de l'histoire, sous leur nom
 * et leurs autres noms ; le nom retenu s'écrit comme du texte ordinaire, comme un objet.
 */
export function ListePersonnages({ jeu, onChoisir, onFermer }: { jeu: Jeu; onChoisir: (nom: string) => void; onFermer: () => void }) {
  const { enseignant, pourEleve } = useCopie();
  const adulte = !pourEleve;
  const [demande, setDemande] = useState("");
  const champ = useRef<HTMLInputElement>(null);
  const vide = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    (champ.current ?? vide.current)?.focus();
  }, []);
  // Chaque nom se propose, les autres noms avec celui du personnage : « le passeur · Maël »
  const noms = useMemo(
    () => (jeu.personnages ?? []).flatMap((p) => [{ cle: `${p.id}`, nom: p.nom, de: null as string | null }, ...p.autresNoms.map((a, i) => ({ cle: `${p.id}-${i}`, nom: a, de: p.nom }))]),
    [jeu.personnages],
  );
  const mots = cle(demande).split(" ").filter(Boolean);
  const trouves = useMemo(
    () => noms.filter((n) => mots.every((m) => cle(`${n.nom} ${n.de ?? ""}`).includes(m))),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [noms, demande],
  );
  const lignes = useRef<HTMLUListElement>(null);
  const liste = useListe(trouves.length, (i) => onChoisir(trouves[i].nom), lignes);
  return (
    <div className="pop" role="dialog" aria-label="Personnages de l’histoire" onKeyDown={auClavierDeLaListe(onFermer)}>
      {noms.length === 0 ? (
        <p className="pop__vide" ref={vide} tabIndex={-1}>
          {adulte ? "Aucun personnage pour l’instant : ils se notent dans la Préparation, étape Personnages." : `${enseignant ?? "Ton enseignant(e)"} n’a pas encore noté de personnage.`}
        </p>
      ) : (
        <>
          <label className="vh" htmlFor="pop-personnage">
            Chercher un personnage
          </label>
          <input
            id="pop-personnage"
            ref={champ}
            className="pchamp pop__filtre"
            type="search"
            autoComplete="off"
            value={demande}
            placeholder="Chercher un personnage"
            onChange={(e) => {
              setDemande(e.target.value);
              liste.setSurligne(0);
            }}
            onKeyDown={liste.auClavier}
          />
          {trouves.length === 0 ? (
            <p className="pop__vide">Aucun personnage ne porte ce nom.</p>
          ) : (
            <ul className="pop__liste" role="listbox" aria-label="Personnages" ref={lignes}>
              {trouves.map((n, i) => (
                <li key={n.cle} role="option" aria-selected={i === liste.choisi} className={n.de ? "pop__autre-nom" : undefined}>
                  <button type="button" tabIndex={-1} onClick={() => onChoisir(n.nom)} onMouseEnter={() => liste.setSurligne(i)}>
                    <span className="pop__nom">{n.nom}</span>
                    {n.de ? <span className="vh"> : {n.de}</span> : null}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}

/**
 * « Action de jeu » : un paragraphe vide, à écrire, ou une formule de la liste (F04-AC27).
 * La formule retenue devient du texte libre, modifiable sur place.
 */
export function ListeFormules({
  jeu, pourUneAction, onApercu, onChoisir, onAjouter, onFermer,
}: {
  jeu: Jeu;
  /** Les formules pour le texte d'une action qui existe déjà : pas de paragraphe vide à proposer */
  pourUneAction: boolean;
  /** La formule surlignée : la copie la montre à sa place dans le texte, en attente, avec son signe */
  onApercu?: (vue: { texte: string; signe: SigneAction }) => void;
  onChoisir: (texte: string, signe: SigneAction) => void;
  onAjouter?: () => void;
  onFermer: () => void;
}) {
  const liste = useRef<HTMLUListElement>(null);
  const bouton = useRef<HTMLButtonElement>(null);
  const lignes: Formule[] = [...(pourUneAction ? [] : [{ id: "vide", texte: "", signe: "crayon" as const }]), ...jeu.formules];
  const { choisi, setSurligne, auClavier } = useListe(lignes.length, (i) => onChoisir(lignes[i].texte, lignes[i].signe), liste);
  useEffect(() => {
    (liste.current ?? bouton.current)?.focus();
  }, []);
  const vue = lignes[choisi];
  useEffect(() => {
    onApercu?.({ texte: vue?.texte ?? "", signe: vue?.signe ?? "crayon" });
  }, [onApercu, vue?.texte, vue?.signe]);
  const titre = pourUneAction ? "Formules d’action" : "Action de jeu";
  return (
    <div className="pop" role="dialog" aria-label={titre} onKeyDown={auClavierDeLaListe(onFermer)}>
      {lignes.length === 0 ? (
        <p className="pop__vide">Aucune formule dans la liste pour l’instant.</p>
      ) : (
        <ul className="pop__liste" role="listbox" aria-label={titre} tabIndex={0} ref={liste} onKeyDown={auClavier}>
          {lignes.map((f, i) => (
            <li key={f.id} role="option" aria-selected={i === choisi}>
              <button type="button" tabIndex={-1} className="pop__ligne" onClick={() => onChoisir(f.texte, f.signe)} onMouseEnter={() => setSurligne(i)}>
                <Icone nom={f.signe} />
                {f.texte ? <span className="pop__formule">{f.texte}</span> : <span className="pop__desc">Paragraphe vide, à écrire</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
      {onAjouter ? (
        <p className="pop__pied">
          <button type="button" ref={bouton} className="pop__plus" onClick={onAjouter}>
            <Icone nom="plus" />
            Ajouter une formule à la liste
          </button>
        </p>
      ) : null}
    </div>
  );
}

function Cadre({ titre, icone, onFermer, children, pied }: { titre: string; icone: "sac" | "crayon"; onFermer: () => void; children: React.ReactNode; pied?: React.ReactNode }) {
  return (
    <section className="cx" aria-label={titre} onKeyDown={auClavierDeLaListe(onFermer)}>
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

/** Un nouvel objet, ajouté à la liste sans quitter la scène, puis écrit dans le texte (F04-AC29). */
export function FicheNouvelObjet({ nom: propose, services, onCree, onFermer }: { nom: string; services: Services; onCree: (nom: string) => void; onFermer: () => void }) {
  const { lieu } = useCopie();
  const [nom, setNom] = useState(propose);
  const [description, setDescription] = useState("");
  const [attente, setAttente] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const creer = async () => {
    if (!services.ajouterObjet || !nom.trim()) return;
    setAttente(true);
    setErreur(null);
    const fait = await services.ajouterObjet(nom, description);
    setAttente(false);
    if (!fait.ok) return setErreur(fait.erreur ?? "L’objet n’a pas pu être ajouté.");
    onCree(nom.replace(/\s+/g, " ").trim());
  };
  return (
    <Cadre
      titre="Nouvel objet"
      icone="sac"
      onFermer={onFermer}
      pied={
        <Link className="lien" href={`/projet/${lieu.projetId}/preparation`}>
          Voir la liste dans la préparation
        </Link>
      }
    >
      <form
        className="cx-ajout"
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          void creer();
        }}
      >
        <label className="champ champ--plein">
          <span>Nom, tel qu’il s’écrit dans une phrase</span>
          <input className="pchamp" type="text" maxLength={60} autoFocus value={nom} placeholder="la clé d’argent" onChange={(e) => setNom(e.target.value)} />
        </label>
        <label className="champ champ--plein">
          <span>Description, facultative</span>
          <input className="pchamp" type="text" maxLength={120} value={description} onChange={(e) => setDescription(e.target.value)} />
        </label>
        <p className="cx__cmd">
          <button type="submit" className="btn btn--primaire" disabled={attente || !nom.trim()} aria-busy={attente || undefined}>
            Créer et écrire dans le texte
          </button>
        </p>
        {erreur ? (
          <p className="erreur" role="alert">
            {erreur}
          </p>
        ) : null}
      </form>
    </Cadre>
  );
}

/** Une nouvelle formule d'action, ajoutée à la liste puis employée aussitôt. */
export function FicheNouvelleFormule({
  services, onApercu, onCree, onFermer,
}: {
  services: Services; onApercu?: (vue: { texte: string; signe: SigneAction }) => void;
  onCree: (texte: string, signe: SigneAction) => void; onFermer: () => void;
}) {
  const [texte, setTexte] = useState("");
  const [signe, setSigne] = useState<SigneAction>("crayon");
  useEffect(() => {
    onApercu?.({ texte: texte.trim(), signe });
  }, [onApercu, texte, signe]);
  const [attente, setAttente] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const creer = async () => {
    if (!services.ajouterFormule || !texte.trim()) return;
    setAttente(true);
    setErreur(null);
    const fait = await services.ajouterFormule(texte, signe);
    setAttente(false);
    if (!fait.ok) return setErreur(fait.erreur ?? "La formule n’a pas pu être ajoutée.");
    onCree(texte.replace(/\s+/g, " ").trim(), signe);
  };
  return (
    <Cadre titre="Nouvelle formule" icone="crayon" onFermer={onFermer}>
      <form
        className="cx-ajout"
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          void creer();
        }}
      >
        <label className="champ champ--plein">
          <span>Formule</span>
          <input className="pchamp" type="text" maxLength={140} autoFocus value={texte} placeholder="Retire un point de volonté à ton héros." onChange={(e) => setTexte(e.target.value)} />
          <span className="cx-aide">Une demande au lecteur qui revient souvent. « … » marque ce qu’on complétera à chaque fois.</span>
        </label>
        <div className="champ champ--plein">
          <span>Signe devant la formule</span>
          <Signes valeur={signe} onChange={setSigne} libelle="Signe devant la formule" />
        </div>
        <p className="cx__cmd">
          <button type="submit" className="btn btn--primaire" disabled={attente || !texte.trim()} aria-busy={attente || undefined}>
            Ajouter et utiliser
          </button>
        </p>
        {erreur ? (
          <p className="erreur" role="alert">
            {erreur}
          </p>
        ) : null}
      </form>
    </Cadre>
  );
}
