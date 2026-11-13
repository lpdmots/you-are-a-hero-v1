"use client";

import Link from "next/link";
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from "react";
import { Bulle } from "@/composants/Bulle";
import { Icone } from "@/composants/Icone";
import { useMessage } from "@/composants/Messages";
import {
  commencer, feuilleDeDepart, issueDe, revenir, SORTIE, suivantDansLOrdre, suivre, type EtatFeuille, type LivreLu, type Parcours, type PassageLu,
} from "@/domaine/lecture";
import { couleurDeChapitre, referenceScene } from "@/domaine/recit";
import { BarreDeLaFeuille, Feuille, resumeCompteurs, useAuDessusDuClavier } from "./Feuille";
import { basculerDansLaListe, dansLaListe, listeDesObjets } from "@/domaine/inventaire";
import { Passage } from "./Passage";

/**
 * Une lecture, passage après passage (F09.1, F12.1) : le parcours et ses retours, « déjà lu »,
 * la feuille d'aventure et le dé, « Recommencer ». La lecture d'essai y ajoute son bandeau. Sur grand
 * écran, les commandes et le bandeau se tiennent à droite de la page, et la feuille s'y ouvre.
 * Ce qu'elle a fait tient le temps de la page, et d'un aller-retour vers une scène ; « Quitter »
 * l'efface (F09-AC21).
 */

type Garde = { debut: string; parcours: Parcours; deja: string[]; feuille: EtatFeuille; des: number[] | null };

const lireGarde = (cle: string): Garde | null => {
  try {
    const brut = sessionStorage.getItem(cle);
    const g = brut ? (JSON.parse(brut) as Garde) : null;
    return g && Array.isArray(g.parcours?.etapes) && g.parcours.etapes.length ? g : null;
  } catch {
    return null;
  }
};

const teinte = (rang: number): CSSProperties => {
  const c = couleurDeChapitre(rang);
  return { "--dos": c.dos, "--bandeau": c.bandeau, "--teinte": c.teinte } as CSSProperties;
};

/** Le nom d'un passage dans le parcours : son numéro et son titre, sans référence pour l'élève (F09.1). */
export const nomDuPassage = (p: PassageLu, pourEleve: boolean): string =>
  [p.numero ? String(p.numero) : null, !pourEleve && p.reference ? referenceScene(p.reference) : null, p.titre ?? (pourEleve ? "Passage" : null)].filter(Boolean).join(" · ");

/** La largeur où les commandes passent à droite de la page : la page (580 à 680 points), un écart, la colonne. */
const LARGEUR_COTE = 580 + 28 + 288;

/**
 * Les commandes à côté de la page tant que la place le permet : mesuré sur la lecture elle-même, qui
 * partage l'écran avec la colonne de l'adulte, repliée ou non. Une requête de conteneur ferait de la
 * lecture le cadre de la feuille et de la barre basses, posées sur l'écran.
 */
function useCote(racine: RefObject<HTMLDivElement | null>): boolean {
  const [cote, setCote] = useState(false);
  useLayoutEffect(() => {
    const el = racine.current;
    if (!el) return;
    const mesurer = () => {
      const st = getComputedStyle(el);
      setCote(el.clientWidth - parseFloat(st.paddingLeft) - parseFloat(st.paddingRight) >= LARGEUR_COTE);
    };
    mesurer();
    const obs = new ResizeObserver(mesurer);
    obs.observe(el);
    return () => obs.disconnect();
  }, [racine]);
  return cote;
}

export default function Lecture({
  livre, depart, pourEleve, cle, reprendre, titre, sousTitre, aide, quitter, bandeau,
}: {
  livre: LivreLu;
  /** Le premier passage de la lecture */
  depart: string;
  pourEleve: boolean;
  /** Où la page garde la lecture le temps d'un aller-retour */
  cle: string;
  /** Revenue d'une scène : la lecture reprend où elle était */
  reprendre: boolean;
  titre: string;
  sousTitre: string;
  /** Ce que lit l'adulte, derrière un « i » */
  aide?: { question: string; texte: string };
  quitter: string;
  /** Au-dessus du passage : ce que la lecture d'essai en dit à l'adulte */
  bandeau?: (p: PassageLu) => ReactNode;
}) {
  const neuve = (): Garde => ({ debut: depart, parcours: commencer(depart), deja: [], feuille: feuilleDeDepart(livre.feuille), des: null });
  const [g, setG] = useState<Garde>(() => (reprendre && lireGarde(cle)) || neuve());
  const [parcoursOuvert, setParcoursOuvert] = useState(false);
  // La feuille est fermée au départ : elle sert à quelques passages seulement (décidé par le porteur le 14 octobre 2026).
  // Ouverte par « Règles du jeu », c'est ce bouton qui s'allume.
  const [ouvertSur, setOuvertSur] = useState<"feuille" | "regles" | null>(null);
  const feuilleOuverte = ouvertSur !== null;
  const racine = useRef<HTMLDivElement>(null);
  const cote = useCote(racine);
  const aside = useRef<HTMLElement>(null);
  // La liste où se notent les objets nommés par une action (F04-AC44)
  const liste = listeDesObjets(livre.feuille);
  useAuDessusDuClavier(aside, feuilleOuverte);
  const ouvrirFeuille = (versLeDe = false, versLesRegles = false) => {
    setOuvertSur(versLesRegles ? "regles" : "feuille");
    requestAnimationFrame(() => {
      const regles = versLesRegles ? aside.current?.querySelector<HTMLDetailsElement>("details.fa-regles") : null;
      if (regles) regles.open = true;
      // Les règles en haut de la feuille, lisibles d'emblée ; le dé, seulement s'il est caché
      const a = aside.current;
      if (regles && a) {
        const entete = a.querySelector("header")?.offsetHeight ?? 0;
        a.scrollTo({ top: a.scrollTop + regles.getBoundingClientRect().top - a.getBoundingClientRect().top - entete - 8 });
      }
      else if (versLeDe) a?.querySelector<HTMLElement>("#feuille-de")?.scrollIntoView({ block: "nearest" });
      else a?.scrollTo({ top: 0 });
    });
  };
  useEffect(() => {
    if (!feuilleOuverte) return;
    const fermer = (ev: KeyboardEvent) => {
      if (ev.key === "Escape") setOuvertSur(null);
    };
    window.addEventListener("keydown", fermer);
    return () => window.removeEventListener("keydown", fermer);
  }, [feuilleOuverte]);
  const haut = useRef<HTMLDivElement>(null);
  const deja = new Set(g.deja);

  useEffect(() => {
    try {
      sessionStorage.setItem(cle, JSON.stringify(g));
    } catch {
      // Sans stockage, la lecture tient le temps de la page
    }
  }, [cle, g]);
  // Un nouveau passage se lit depuis le haut ; l'ouverture de la page, elle, ne défile pas
  const montre = `${g.parcours.position}/${g.parcours.etapes.length}`;
  const avant = useRef(montre);
  useEffect(() => {
    if (avant.current === montre) return;
    avant.current = montre;
    haut.current?.scrollIntoView({ block: "start" });
    haut.current?.focus({ preventScroll: true });
  }, [montre]);

  const dire = useMessage();
  const id = g.parcours.etapes[g.parcours.position];
  const passage = id === SORTIE ? null : livre.passages[id];
  // La sortie garde la teinte du passage d'où l'on vient : elle ne laisse rien deviner de la suite
  const dernierLu = g.parcours.etapes.slice(0, g.parcours.position + 1).reverse().map((e) => livre.passages[e]).find(Boolean);
  const aller = (vers: string, renvoi?: string) =>
    setG((x) => ({ ...x, parcours: suivre(x.parcours, vers), deja: renvoi && !x.deja.includes(renvoi) ? [...x.deja, renvoi] : x.deja }));
  const versCible = (cible: { sorte: string; id?: string }, renvoi: string) => {
    if (cible.sorte === "passage" && cible.id) aller(cible.id, renvoi);
    else if (cible.sorte === "ailleurs") aller(SORTIE, renvoi);
  };
  // « Recommencer » efface le parcours et la feuille : un message propose de revenir en arrière, le temps de le lire
  const recommencer = () => {
    const avant = g;
    setG((x) => ({ ...x, parcours: commencer(x.debut), feuille: feuilleDeDepart(livre.feuille), des: null }));
    if (avant.parcours.etapes.length > 1) dire({ texte: "La lecture reprend au début.", annuler: () => setG(avant) });
  };
  const precedent = () => setG((x) => ({ ...x, parcours: revenir(x.parcours, x.parcours.position - 1) }));
  const issue = passage ? issueDe(passage, livre.aChoix) : null;
  const suivant = passage && !livre.aChoix ? suivantDansLOrdre(livre, passage.id) : null;
  const nom = (etape: string) => (etape === SORTIE ? "Suite à découvrir" : livre.passages[etape] ? nomDuPassage(livre.passages[etape], pourEleve) : "Passage");

  const feuille = livre.feuille ? (
    <Feuille
      feuille={livre.feuille}
      etat={g.feuille}
      onChange={(feuille) => setG((x) => ({ ...x, feuille }))}
      des={g.des}
      onDes={(des) => setG((x) => ({ ...x, des }))}
      regles={livre.regles}
    />
  ) : null;

  const tete = (
    <div className="lu-tete">
      <div className="lu-tete__nom">
        <h1>
          {titre}
          {aide ? <Bulle question={aide.question}>{aide.texte}</Bulle> : null}
        </h1>
        <p>{sousTitre}</p>
      </div>
      <Link
        className="btn btn--petit btn--discret"
        href={quitter}
        onClick={() => {
          try {
            sessionStorage.removeItem(cle);
          } catch {
            // Rien à effacer
          }
        }}
      >
        <Icone nom="fermer" />
        Quitter
      </Link>
    </div>
  );

  // « Recommencer » vit au pied du parcours : discret, et à la même place partout (révision de novembre 2026)
  const parcours = (
    <div className="lecture__parcours">
      <button type="button" className="lecture__parcours-b" aria-expanded={parcoursOuvert} onClick={() => setParcoursOuvert((o) => !o)}>
        <Icone nom="chemins" />
        Parcours · {g.parcours.etapes.length} passage{g.parcours.etapes.length > 1 ? "s" : ""}
        <Icone nom={parcoursOuvert ? "chevron-haut" : "chevron-bas"} />
      </button>
      {parcoursOuvert ? (
        <div className="lecture__liste">
          <ol className="lecture__etapes" aria-label="Parcours">
            {g.parcours.etapes.map((e, i) => (
              <li key={`${i}-${e}`}>
                <button
                  type="button"
                  aria-current={i === g.parcours.position ? "step" : undefined}
                  onClick={() => {
                    setG((x) => ({ ...x, parcours: revenir(x.parcours, i) }));
                    setParcoursOuvert(false);
                  }}
                >
                  {nom(e)}
                </button>
              </li>
            ))}
          </ol>
          {g.parcours.etapes.length > 1 ? (
            <button
              type="button"
              className="lien lecture__recommencer"
              onClick={() => {
                setParcoursOuvert(false);
                recommencer();
              }}
            >
              <Icone nom="refaire" />
              Recommencer au début
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );

  const outils = (
    <div className="lecture__outils">
      {parcours}
      {livre.feuille && !(cote && feuilleOuverte) ? (
        <button
          type="button"
          className="lecture__parcours-b lecture__feuille-b"
          aria-expanded={ouvertSur === "feuille"}
          aria-controls="feuille-aventure"
          onClick={() => (ouvertSur === "feuille" ? setOuvertSur(null) : ouvrirFeuille())}
        >
          <Icone nom="feuille" />
          Ma feuille
          {resumeCompteurs(livre.feuille, g.feuille) ? <span className="lecture__feuille-resume">· {resumeCompteurs(livre.feuille, g.feuille)}</span> : null}
        </button>
      ) : null}
      {/* Les règles du jeu à portée de main, hors de la feuille aussi : on les referme sans quitter le passage (F04-AC24) */}
      {livre.feuille && livre.regles.trim() && !(cote && feuilleOuverte) ? (
        <button
          type="button"
          className="lecture__parcours-b"
          aria-expanded={ouvertSur === "regles"}
          aria-controls="feuille-aventure"
          onClick={() => (ouvertSur === "regles" ? setOuvertSur(null) : ouvrirFeuille(false, true))}
        >
          <Icone nom="cahier" />
          Règles du jeu
        </button>
      ) : null}
    </div>
  );

  const feuilleOuvrable = feuille ? (
    <aside ref={aside} id="feuille-aventure" className={`lecture__feuille${feuilleOuverte ? " est-ouverte" : ""}`} aria-label="Feuille d’aventure">
      <header>
        <h2 className="recit">Feuille d’aventure</h2>
        <button type="button" className="lien lecture__ranger" onClick={() => setOuvertSur(null)}>
          <Icone nom="fermer" />
          Ranger
        </button>
      </header>
      {feuille}
    </aside>
  ) : null;

  return (
    <div
      ref={racine}
      className={`lecture sur-chapitre${livre.feuille ? " lecture--feuille" : ""}${cote ? " lecture--cote" : ""}`}
      style={teinte(dernierLu?.chapitre.couleur ?? 0)}
    >
      <div className="lecture__corps">
        {/* Grand écran : à droite de la page, en vue pendant la lecture ; la feuille s'y ouvre à la place des
            commandes, sans recouvrir le texte (demandé par le porteur le 13 novembre 2026). Sinon, au-dessus. */}
        <div className="lecture__cote">
          {tete}
          {cote && passage && bandeau ? bandeau(passage) : null}
          {outils}
          {feuilleOuvrable}
        </div>

        <div className="lecture__colonne">
          <div ref={haut} tabIndex={-1} className="lecture__ancre" aria-label={passage ? nomDuPassage(passage, pourEleve) : "Suite à découvrir"} />
          {!cote && passage && bandeau ? bandeau(passage) : null}
          <article className="lu-page">
            {passage ? (
              <>
                {passage.numero ? (
                  <p className="lu-numero-passage" aria-label={`Passage ${passage.numero}`}>
                    {passage.numero}
                  </p>
                ) : null}
                {issue === "vide" ? <p className="lu-issue">Cette scène n’a pas encore de texte.</p> : null}
                <Passage
                  passage={passage}
                  deja={deja}
                  pourEleve={pourEleve}
                  onSuivre={(r) => versCible(r.cible as { sorte: string; id?: string }, r.renvoi)}
                  onEnigme={(e) => versCible(e.cible as { sorte: string; id?: string }, e.id)}
                  // Une action ouvre la feuille ; un second clic la range, comme « Ma feuille »
                  onAction={livre.feuille ? (signe) => (feuilleOuverte ? setOuvertSur(null) : ouvrirFeuille(signe === "de" && livre.feuille!.des > 0)) : undefined}
                  feuilleOuverte={feuilleOuverte}
                  inventaire={
                    liste
                      ? { contient: (nom) => dansLaListe(g.feuille.listes[liste], nom), basculer: (nom) => setG((x) => ({ ...x, feuille: basculerDansLaListe(x.feuille, liste, nom) })) }
                      : undefined
                  }
                />
                {issue === "rien" ? (
                  <p className="lu-issue">
                    <Icone nom="alerte" />
                    Cette scène n’a ni choix ni fin.
                  </p>
                ) : null}
                {issue === "fin" ? (
                  <div className="lu-fin">
                    <p className="lu-fin__marque">{livre.marqueFin}</p>
                    <button type="button" className="btn" onClick={recommencer}>
                      <Icone nom="refaire" />
                      Recommencer
                    </button>
                  </div>
                ) : null}
                {suivant ? (
                  <p className="lu-suite">
                    <button type="button" className="btn" onClick={() => aller(suivant)}>
                      Scène suivante
                      <Icone nom="fleche" />
                    </button>
                  </p>
                ) : null}
              </>
            ) : (
              <div className="lu-sortie">
                <p>La suite se trouve dans un chapitre que tu découvriras plus tard.</p>
                <button type="button" className="btn" onClick={precedent}>
                  <Icone nom="fleche-g" />
                  Revenir au passage précédent
                </button>
              </div>
            )}
          </article>
          {g.parcours.position > 0 && passage ? (
            <p className="lecture__precedent">
              <button type="button" className="lien" onClick={precedent}>
                <Icone nom="fleche-g" />
                Revenir au passage précédent
              </button>
            </p>
          ) : null}
        </div>
      </div>

      {livre.feuille && !cote ? (
        <div className="lecture__barre">
          <BarreDeLaFeuille
            feuille={livre.feuille}
            etat={g.feuille}
            ouverte={feuilleOuverte}
            onFeuille={() => setOuvertSur("feuille")}
            des={g.des}
            onDes={(des) => setG((x) => ({ ...x, des }))}
          />
        </div>
      ) : null}
    </div>
  );
}
