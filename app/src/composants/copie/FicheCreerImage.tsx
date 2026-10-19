"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Agrandissable } from "@/composants/Agrandissable";
import { useAidesIa } from "@/composants/AidesIa";
import { ChampQuiGrandit } from "@/composants/ChampQuiGrandit";
import { Icone } from "@/composants/Icone";
import { Menu } from "@/composants/Menu";
import { useMessage } from "@/composants/Messages";
import { qualiteDeLImage } from "@/domaine/aides-ia";
import {
  CADRAGES, DESCRIPTION_IMAGE_MAX, IDEE_MAX, NOMS_DES_CADRAGES, REFERENCES_MAX, badgesDOffice, type Cadrage, type Candidat,
} from "@/domaine/illustration";
import { ALT_MAX } from "@/domaine/copie";
import type { DemandeImageLue, OuvertureImage, ServicesImage } from "./contexte";
import { enumerer } from "./noms";

/**
 * Créer l'image d'une scène (F10.2 ; docs/design.md, « Étape 8 construite », lot 8), dans le
 * panneau à droite du texte, depuis « Ajouter une image ». De haut en bas : « Ce que montre
 * l'image » (l'idée de l'élève s'il en a écrit une), le cadrage sur quatre cadres dessinés, les
 * badges des personnages et des objets nommés dans le texte, retirés d'un clic et ajoutés par
 * « + », puis la description proposée par l'IA, modifiable. Au pied, « ✦ Créer l'image », faite
 * avec les portraits des badges, et « Copier le prompt » pour un outil externe, qui marche sans IA.
 * L'image gardée se pose au curseur, comme une image importée.
 */

/** Les proportions dessinées de chaque cadre : la pleine page en hauteur, puis trois en largeur. */
const PROPORTIONS: Record<Cadrage, string> = { "pleine-page": "2 / 3", "3:2": "3 / 2", "16:9": "16 / 9", carre: "1 / 1" };

export function FicheCreerImage({
  services, texte, apres, onPoser, onRemplacer, onRetour, onFermer,
}: {
  services: ServicesImage;
  /** Le récit de la scène, tel que la copie le tient : les badges s'y cherchent */
  texte: string;
  /** L'image gardée, son cadrage, et ce qu'on en lit à voix haute : l'idée de départ */
  /** Le bloc du curseur à la demande : l'image se posera après lui */
  apres: string | null;
  onPoser: (image: string, cadrage: Cadrage, alt: string, apresBloc: string | null, detouree: boolean) => void;
  /** La proposition qui restait prend la place de l'image déjà posée d'elle-même */
  onRemplacer: (ancienne: string, image: string) => void;
  /** « Importer ou choisir » : revenir à la première fiche */
  onRetour: () => void;
  onFermer: () => void;
}) {
  const dire = useMessage();
  const reglages = useAidesIa();
  const id = useId();
  const [ouverture, setOuverture] = useState<OuvertureImage | null>(null);
  const [perdue, setPerdue] = useState(false);
  const [idee, setIdee] = useState("");
  const [description, setDescription] = useState("");
  // Un seul champ : l'idée, puis la description proposée par l'IA qui la remplace, l'idée restant gardée
  const [decrit, setDecrit] = useState(false);
  const attenteVue = useRef<HTMLDivElement>(null);
  const propositionsVues = useRef<HTMLDivElement>(null);
  const [cadrage, setCadrage] = useState<Cadrage>("3:2");
  const [detouree, setDetouree] = useState(false);
  // « Copier le prompt » : le signe devient une coche un instant, comme pour un texte copié
  const [copie, setCopie] = useState(false);
  const [badges, setBadges] = useState<string[]>([]);
  const [attente, setAttente] = useState<"" | "description" | "image" | "prompt">("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [reste, setReste] = useState<string | null>(null);
  // La demande de l'image : en route, puis prête ; elle survit au panneau refermé et à la page quittée
  const [demande, setDemande] = useState<DemandeImageLue | null>(null);
  const [garde, setGarde] = useState<string | null>(null);
  const notes = useRef({ idee: "", description: "" });
  const enRoute = demande?.etat === "en_route";
  const propositions = demande?.etat === "prete" ? demande.propositions : null;

  useEffect(() => {
    let vivant = true;
    void services.ouvrir().then((o) => {
      if (!vivant) return;
      if (!o) return setPerdue(true);
      setOuverture(o);
      setIdee(o.idee);
      setDescription(o.description);
      setDecrit(o.description.trim() !== "");
      notes.current = { idee: o.idee, description: o.description };
      setBadges(badgesDOffice(texte, o.idee, o.candidats, o.herosAbsent));
      setDemande(o.demande);
      if (o.demande?.cadrage) setCadrage(o.demande.cadrage);
      if (o.demande?.detouree) setDetouree(true);
    });
    return () => {
      vivant = false;
    };
    // Une seule fois, à l'ouverture : les badges d'office s'y calculent, l'adulte les règle ensuite.
    // La page redonne ses services à chaque affichage : ils font la même chose
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // L'attente puis les propositions viennent sous les yeux, même au bas d'un panneau long
  useEffect(() => {
    if (enRoute) attenteVue.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [enRoute]);
  useEffect(() => {
    if (propositions?.length) propositionsVues.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [propositions]);

  // Tant qu'elle est en route, la demande se relit ; le panneau peut se refermer, elle continue
  const suivie = enRoute ? demande.id : null;
  useEffect(() => {
    if (!suivie) return;
    const minuterie = setInterval(() => {
      void services.suivre(suivie).then((d) => {
        if (!d || d.etat === "en_route") return;
        if (d.etat === "echec") {
          setDemande(null);
          setErreur(d.message ?? "L’image n’a pas pu être créée. Rien n’a changé.");
        } else setDemande(d);
      });
    }, 2500);
    return () => clearInterval(minuterie);
  }, [suivie]); // eslint-disable-line react-hooks/exhaustive-deps

  /** L'idée et la description s'enregistrent avant toute demande : le serveur les relit. */
  const enregistrer = async () => {
    const note: { idee?: string; description?: string } = {};
    if (idee.trim() !== notes.current.idee.trim()) note.idee = idee;
    if (description.trim() !== notes.current.description.trim()) note.description = description;
    if (!Object.keys(note).length) return true;
    const fait = await services.noter(note);
    if (fait.ok) notes.current = { idee: note.idee ?? notes.current.idee, description: note.description ?? notes.current.description };
    return fait.ok;
  };

  const demandeDeScene = () => ({ cadrage, badges, detouree });
  const candidats = ouverture?.candidats ?? [];
  const retenus = badges.flatMap((b) => candidats.filter((c) => c.id === b));
  const ajoutables = candidats.filter((c) => !badges.includes(c.id));
  const decrite = (decrit && description.trim() !== "") || idee.trim() !== "";
  const champ = decrit ? description : idee;
  const qualite = qualiteDeLImage(reglages.qualite, cadrage);
  const joints = retenus.filter((r) => r.referenceId).length;

  const proposer = async () => {
    setErreur(null);
    setAttente("description");
    if (!(await enregistrer())) {
      setAttente("");
      return setErreur("L’idée n’a pas pu être enregistrée. Réessayez.");
    }
    const r = await services.proposer(demandeDeScene());
    setAttente("");
    if (!r.ok) return setErreur(r.message);
    const avant = description;
    const avantDecrit = decrit;
    setDescription(r.description);
    setDecrit(true);
    await services.noter({ description: r.description });
    notes.current.description = r.description;
    setReste(r.reste);
    dire({
      texte: avantDecrit ? "Description remplacée." : "Description proposée : l’idée de départ reste gardée.",
      annuler: () => {
        setDescription(avant);
        setDecrit(avantDecrit);
        notes.current.description = avant;
        void services.noter({ description: avant });
      },
    });
  };

  const alt = () => (idee.trim() || description.trim()).slice(0, ALT_MAX);
  const creer = async () => {
    if (demande?.etat === "prete") await services.fermer(demande.id);
    setDemande(null);
    setErreur(null);
    setAttente("image");
    if (!(await enregistrer())) {
      setAttente("");
      return setErreur("La description n’a pas pu être enregistrée. Réessayez.");
    }
    const r = await services.creer({ ...demandeDeScene(), apresBloc: apres, alt: alt() });
    setAttente("");
    if (!r.ok) return setErreur(r.message);
    setDemande({ id: r.demande, etat: "en_route", propositions: [], imagePosee: null, message: null, apresBloc: apres, cadrage, detouree, alt: alt() });
  };

  const copier = async () => {
    setErreur(null);
    setAttente("prompt");
    await enregistrer();
    const r = await services.prompt(demandeDeScene());
    setAttente("");
    if (!r.ok) return setErreur(r.erreur);
    try {
      await navigator.clipboard.writeText(r.prompt);
      setCopie(true);
      setTimeout(() => setCopie(false), 1800);
      dire({ texte: "Prompt copié : la description, les personnages et le style du projet." });
    } catch {
      setErreur("Le prompt n’a pas pu être copié. Réessayez.");
    }
  };

  /** L'image gardée se pose après le bloc où elle avait été demandée */
  const garder = async (proposition: string) => {
    if (!demande) return;
    setGarde(proposition);
    setErreur(null);
    const fait = await services.garder(proposition);
    if (!fait.ok) {
      setGarde(null);
      return setErreur(fait.erreur);
    }
    await services.fermer(demande.id);
    setGarde(null);
    setDemande(null);
    if (demande.imagePosee) onRemplacer(demande.imagePosee, fait.id);
    else onPoser(fait.id, demande.cadrage ?? cadrage, demande.alt || alt(), demande.apresBloc, demande.detouree);
  };
  const laisser = async () => {
    if (!demande) return;
    await services.fermer(demande.id);
    setDemande(null);
  };

  const occupe = attente !== "" || garde !== null || enRoute;

  return (
    <section
      className="cx cx--image cx--creer"
      aria-label="Créer une image"
      onKeyDown={(e) => {
        if (e.key !== "Escape") return;
        e.preventDefault();
        e.stopPropagation();
        onFermer();
      }}
    >
      <header className="cx__tete">
        <Icone nom={services.ia ? "ia" : "image"} />
        <h3>{services.ia ? "Créer une image" : "Prompt d’une image"}</h3>
        <button type="button" className="btn btn--discret cx__fermer" onClick={onFermer} aria-label="Fermer la fiche">
          <Icone nom="fermer" />
        </button>
      </header>
      <div className="cx__corps ci">
        <button type="button" className="lien cx-discret ci__retour" onClick={onRetour}>
          <Icone nom="chevron" />
          Importer ou choisir une image
        </button>
        {perdue ? (
          <p className="erreur" role="alert">
            Cette scène n’existe plus.
          </p>
        ) : !ouverture ? (
          <p className="cx-aide" role="status">
            Ouverture…
          </p>
        ) : (
          <>
            <div className="ci__champ">
              <p className="ci__libelle">
                <label htmlFor={`${id}-ce`}>Ce que montre l’image</label>
                {services.ia ? (
                  <button
                    type="button"
                    className="btn btn--ia ci__ia"
                    disabled={occupe}
                    aria-busy={attente === "description" || undefined}
                    onClick={() => void proposer()}
                    aria-label={decrit ? "Proposer une autre description avec l’IA" : "Proposer la description avec l’IA"}
                    title="Demander à l’IA"
                  >
                    <Icone nom="ia" />
                  </button>
                ) : null}
              </p>
              <span className={`ci__zone${attente === "description" ? " ci__zone--reflechit" : ""}`}>
                <ChampQuiGrandit
                  id={`${id}-ce`}
                  className={`pchamp${decrit ? " ci__decrit" : ""}`}
                  rows={decrit ? 4 : 2}
                  maxLength={decrit ? DESCRIPTION_IMAGE_MAX : IDEE_MAX}
                  value={attente === "description" ? "" : champ}
                  readOnly={attente === "description"}
                  data-focus=""
                  placeholder={attente === "description" ? "" : "Un lieu, un moment, un détail"}
                  onChange={(e) => (decrit ? setDescription(e.target.value) : setIdee(e.target.value))}
                  onBlur={() => void enregistrer()}
                />
                {attente === "description" ? (
                  <span className="ci__points" role="status" aria-label="L’IA décrit l’image">
                    <i />
                    <i />
                    <i />
                  </span>
                ) : null}
                {/* Copier le prompt entier, comme on copie un texte : le petit signe au coin du champ */}
                <button
                  type="button"
                  className="ci__copier"
                  disabled={occupe || !decrite}
                  onClick={() => void copier()}
                  aria-label="Copier le prompt, pour un autre outil d’images"
                  title={decrite ? "Copier le prompt" : "Décrivez d’abord ce que montre l’image"}
                >
                  <Icone nom={copie ? "coche" : "copier"} />
                </button>
              </span>
              {decrit && idee.trim() ? (
                <button
                  type="button"
                  className="lien cx-discret ci__revenir"
                  onClick={() => {
                    setDecrit(false);
                    setDescription("");
                    void services.noter({ description: "" }).then(() => (notes.current.description = ""));
                  }}
                >
                  Revenir à l’idée de départ
                </button>
              ) : null}
            </div>

            <fieldset className="ci__cadrages">
              <legend>Cadrage</legend>
              <div className="ci__cadres" role="radiogroup" aria-label="Cadrage">
                {CADRAGES.map((c) => (
                  <label key={c} className="ci__cadre">
                    <input type="radio" name={`${id}-cadrage`} checked={cadrage === c} onChange={() => setCadrage(c)} />
                    <span className="ci__dessin" aria-hidden="true">
                      <i className={detouree ? "ci__damier" : undefined} style={{ aspectRatio: PROPORTIONS[c] }} />
                    </span>
                    <span className="ci__nom">{NOMS_DES_CADRAGES[c]}</span>
                  </label>
                ))}
              </div>
              {services.ia ? (
                <p className="cx-aide">
                  {qualite === "haute" ? "Haute qualité" : "Qualité normale"}
                  {reglages.qualite === "auto" ? " (automatique)" : ""}
                  {qualite === "haute" ? " : environ quatre fois plus chère." : "."}
                </p>
              ) : null}
              <label className="ci__detouree">
                <input className="case" type="checkbox" checked={detouree} onChange={(e) => setDetouree(e.target.checked)} />
                {/* Le nom et sa précision sur une même ligne de base : une seule phrase */}
                <span>
                  <b>Détourée</b> <span className="ci__detouree-aide">· le sujet seul, sur fond transparent</span>
                </span>
              </label>
            </fieldset>

            <div className="ci__badges" role="group" aria-labelledby={`${id}-badges`}>
              <p className="cx-titre" id={`${id}-badges`}>
                Dans l’image
              </p>
              <ul>
                {retenus.map((r) => (
                  <li key={r.id}>
                    <Badge candidat={r} />
                    <button type="button" className="ci__retirer" onClick={() => setBadges((b) => b.filter((x) => x !== r.id))} aria-label={`Retirer ${r.nom} de l’image`} title="Retirer">
                      <Icone nom="fermer" />
                    </button>
                  </li>
                ))}
                {ajoutables.length ? (
                  <li className={`ci__ajout${retenus.length ? "" : " ci__ajout--mots"}`}>
                    <Menu
                      libelle="Ajouter un personnage ou un objet à l’image"
                      bouton={
                        retenus.length ? (
                          <Icone nom="plus" />
                        ) : (
                          <>
                            <Icone nom="plus" />
                            Personnage ou objet
                          </>
                        )
                      }
                      agauche
                      fixe
                    >
                      {(fermer) =>
                        ajoutables.map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => {
                              fermer();
                              setBadges((b) => [...b, c.id]);
                            }}
                          >
                            <Badge candidat={c} />
                          </button>
                        ))
                      }
                    </Menu>
                  </li>
                ) : null}
              </ul>
              {!candidats.length ? <p className="cx-aide">Les personnages et les objets de la Préparation se proposent ici.</p> : null}
              {ouverture.herosNonDessines.length ? (
                <p className="cx-aide">
                  {enumerer(ouverture.herosNonDessines)} {ouverture.herosNonDessines.length > 1 ? "ne sont pas dessinés" : "n’est pas dessiné"} : au plus des mains (réglages du projet).
                </p>
              ) : null}
              {services.ia && joints > REFERENCES_MAX ? <p className="cx-aide">Les {REFERENCES_MAX} premiers portraits seulement sont joints à l’image.</p> : null}
            </div>

            {enRoute || attente === "image" ? (
              <div className="ci__dessine" role="status" aria-label="L’IA dessine l’image" ref={attenteVue}>
                <span className="ci__attente" style={{ aspectRatio: PROPORTIONS[demande?.cadrage ?? cadrage] }}>
                  <Icone nom="ia" />
                </span>
                <span className="cx-aide">
                  L’IA dessine… {qualite === "haute" ? "Une minute environ." : "Une demi-minute environ."}
                  <br />
                  Vous pouvez continuer : l’image vous attendra dans cette scène.
                </span>
              </div>
            ) : null}

            {propositions ? (
              <div className="ia-propose ci__propositions" role="group" aria-labelledby={`${id}-props`} ref={propositionsVues}>
                <p className="ia-propose__tete" id={`${id}-props`}>
                  <Icone nom="ia" />
                  {demande?.imagePosee ? (
                    <>
                      Une autre proposition <span>· la première est posée dans le texte</span>
                    </>
                  ) : (
                    <>
                      {propositions.length > 1 ? "Deux propositions" : "Proposition"}{" "}
                      <span>· {propositions.length > 1 ? "gardez celle qui convient" : "gardez-la ou laissez-la"}</span>
                    </>
                  )}
                </p>
                <ul>
                  {propositions.map((pr, i) => (
                    <li key={pr}>
                      <Agrandissable src={services.adresse(pr)} nom={`Proposition ${i + 1}`} fichier={`Proposition ${i + 1}.jpg`}>
                        {/* eslint-disable-next-line @next/next/no-img-element -- image créée, en attente, servie par l'application */}
                        <img src={services.adresse(pr)} alt={`Proposition ${i + 1}`} style={{ aspectRatio: PROPORTIONS[demande?.cadrage ?? cadrage] }} draggable={false} />
                      </Agrandissable>
                      <button type="button" className="btn btn--petit" disabled={garde !== null} aria-busy={garde === pr || undefined} onClick={() => void garder(pr)}>
                        <Icone nom="coche" />
                        {demande?.imagePosee ? "Mettre celle-ci à la place" : propositions.length > 1 ? "Garder celle-ci" : "Garder"}
                      </button>
                    </li>
                  ))}
                </ul>
                <span className="ia-propose__gestes">
                  <button
                    type="button"
                    className="btn btn--petit btn--discret"
                    disabled={garde !== null}
                    onClick={() => void laisser()}
                  >
                    Laisser
                  </button>
                </span>
              </div>
            ) : null}

            {erreur ? (
              <p className="erreur" role="alert">
                {erreur}
              </p>
            ) : null}
          </>
        )}
      </div>
      {ouverture ? (
        <footer className="cx__pied ci__pied">
          {services.ia ? (
            <button type="button" className="btn btn--primaire" disabled={occupe || !decrite} aria-busy={attente === "image" || enRoute || undefined} onClick={() => void creer()}>
              <Icone nom="ia" />
              {propositions ? "En créer d’autres" : "Créer l’image"}
            </button>
          ) : null}
          {!decrite ? (
            <p className="cx-aide ci__raison">{services.ia ? "Décrivez ce que montre l’image, ou faites-la proposer (✦)." : "Décrivez ce que montre l’image, puis copiez le prompt (au coin du champ)."}</p>
          ) : reste ? (
            <p className="cx-aide ci__raison">{reste}</p>
          ) : null}
        </footer>
      ) : null}
    </section>
  );
}

/** Un badge : la vignette du portrait ou de l'image de référence, ou un rond vide, et le nom. */
function Badge({ candidat: c }: { candidat: Candidat }) {
  return (
    <span className="ci__badge" title={c.referenceId ? undefined : c.sorte === "personnage" ? "Sans portrait : sa fiche seule" : "Sans image : sa fiche seule"}>
      <span className={`ci__vignette${c.referenceId ? "" : " ci__vignette--vide"}`} aria-hidden="true">
        {c.referenceId ? (
          // eslint-disable-next-line @next/next/no-img-element -- images servies par l'application, déjà réduites
          <img src={`/images/${c.referenceId}?v=1`} alt="" loading="lazy" />
        ) : (
          <Icone nom={c.sorte === "personnage" ? "personnage" : "sac"} />
        )}
      </span>
      {c.nom}
      {c.heros ? <span className="ci__heros">héros</span> : null}
    </span>
  );
}
