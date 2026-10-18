"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useAidesIa } from "@/composants/AidesIa";
import { ChampQuiGrandit } from "@/composants/ChampQuiGrandit";
import { Icone } from "@/composants/Icone";
import { MESSAGES_IA } from "@/domaine/aides-ia";
import { ORIENTATION_MAX } from "@/domaine/preparation";
import type { Partie } from "@/domaine/recit";
import { demanderAuPlan } from "./IdeesDeParties";

type ChapitrePropose = { titre: string; resume: string };
const cle = (t: string) => t.replace(/\s+/g, " ").trim().toLocaleLowerCase("fr");

/**
 * La réserve des chapitres d'une partie (F13.5) : une demande en rend six, livrés un à un à chaque
 * clic, sans nouvel appel. Elle est jetée quand l'orientation de la partie change, ou quand la
 * partie change sans l'IA (un chapitre ajouté, retiré ou renommé à la main).
 */
function useReserveDeChapitres(partie: Partie, orientation: string, creer: (c: ChapitrePropose) => Promise<boolean>) {
  const [attente, setAttente] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [reste, setReste] = useState<string | null>(null);
  // Un chapitre de la réserve est en train de s'ajouter : un second clic n'en ajoute pas deux
  const [ajout, setAjout] = useState(false);
  const reserve = useRef<ChapitrePropose[]>([]);
  const vus = useRef<string[]>([]);
  // Ce que la partie doit contenir après nos propres ajouts : une autre différence vient de la main
  const attendu = useRef<string | null>(null);
  const titres = partie.chapitres.map((c) => cle(c.titre)).join("|");
  useEffect(() => {
    if (attendu.current !== null && attendu.current !== titres) reserve.current = [];
    attendu.current = titres;
  }, [titres]);
  const orientationDemandee = useRef("");
  useEffect(() => {
    if (orientation.trim() !== orientationDemandee.current.trim()) reserve.current = [];
  }, [orientation]);

  const livrer = async (c: ChapitrePropose) => {
    attendu.current = [...partie.chapitres.map((x) => cle(x.titre)), cle(c.titre)].join("|");
    setAjout(true);
    const fait = await creer(c);
    setAjout(false);
    if (!fait) {
      attendu.current = titres;
      setErreur("Le chapitre n’a pas pu être ajouté. Réessayez.");
    }
  };
  const suivant = () => {
    const deja = new Set(partie.chapitres.map((c) => cle(c.titre)));
    const libres = reserve.current.filter((c) => !deja.has(cle(c.titre)));
    reserve.current = libres.slice(1);
    return libres[0] ?? null;
  };

  /** Un clic sur ✦ : le chapitre suivant de la réserve, ou une nouvelle demande quand elle est vide. */
  const prendre = async () => {
    if (attente || ajout) return;
    setErreur(null);
    const ici = suivant();
    if (ici) return livrer(ici);
    setAttente(true);
    orientationDemandee.current = orientation;
    const r = await demanderAuPlan({ sorte: "chapitres", partie: partie.id, orientation, dejaMontres: vus.current });
    if (!r.ok || r.sorte !== "chapitres") {
      setAttente(false);
      return setErreur(r.ok ? MESSAGES_IA.pasDeReponse : r.message);
    }
    setReste(r.reste);
    vus.current = [...vus.current, ...r.chapitres.map((c) => c.titre)].slice(-40);
    reserve.current = r.chapitres;
    const premier = suivant();
    if (premier) await livrer(premier);
    else setErreur(MESSAGES_IA.pasDeReponse);
    setAttente(false);
  };
  return { attente, ajout, erreur, reste, prendre };
}

/**
 * « + Ajouter un chapitre │ ✦ » au bout d'une partie (F13.5) : la carte en pointillé ajoute à la
 * main ; sa bande ✦, au pied, ouvre l'espace de l'IA, qui monte et recouvre la carte : « Orienter
 * l'IA » pour cette partie, et « Proposer un chapitre » à la place du ✦. Tant qu'il est ouvert,
 * chaque clic ajoute un chapitre, titre et résumé, à la fin de la partie, sans scène ni élève ;
 * la croix le referme en gardant l'orientation (retouche du porteur, 18 octobre 2026). Aides
 * éteintes, la carte est simple.
 */
export function AjoutChapitre({
  partie, enCours, onAjouter, onAjouterPropose,
}: {
  partie: Partie;
  enCours: boolean;
  onAjouter: () => void;
  /** Crée le chapitre proposé à la fin de la partie ; faux s'il n'a pas pu l'être */
  onAjouterPropose: (c: ChapitrePropose) => Promise<boolean>;
}) {
  const { proposer } = useAidesIa();
  const [orientation, setOrientation] = useState("");
  const [ouvert, setOuvert] = useState(false);
  const r = useReserveDeChapitres(partie, orientation, onAjouterPropose);
  const id = useId();
  const bouton = useRef<HTMLButtonElement>(null);

  // Ouvert : le curseur dans le champ, la carte entière sous les yeux
  useEffect(() => {
    if (!ouvert) return;
    const champ = document.getElementById(id) as HTMLTextAreaElement | null;
    champ?.focus({ preventScroll: true });
    champ?.closest("li")?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [ouvert, id]);

  const fermer = () => {
    setOuvert(false);
    bouton.current?.focus();
  };

  return (
    <li className={`cahier-ajout-place${proposer ? " cahier-ajout-place--ia" : ""}${ouvert ? " est-ouvert" : ""}`}>
      <button type="button" className="cahier-ajout" disabled={enCours} aria-busy={enCours || undefined} onClick={onAjouter} inert={ouvert || undefined}>
        <Icone nom="plus" />
        <span>Ajouter un chapitre</span>
      </button>
      {proposer ? (
        <div
          className="ajout-ia"
          role={ouvert ? "group" : undefined}
          aria-label={ouvert ? `Proposer un chapitre pour « ${partie.titre} »` : undefined}
          onKeyDown={(e) => {
            if (e.key !== "Escape" || !ouvert) return;
            e.stopPropagation();
            fermer();
          }}
        >
          {ouvert ? (
            <div className="ajout-ia__corps">
              <p className="ajout-ia__tete">
                <label htmlFor={id}>
                  Orienter l’IA <span className="ix__facultatif">facultatif</span>
                </label>
                <button type="button" className="ajout-ia__fermer" onClick={fermer} aria-label="Fermer l’aide de l’IA" title="Fermer">
                  <Icone nom="fermer" />
                </button>
              </p>
              <ChampQuiGrandit
                id={id}
                className="pchamp ajout-ia__champ"
                rows={3}
                maxLength={ORIENTATION_MAX}
                value={orientation}
                placeholder="Pour cette partie, par exemple : une rencontre au bord de l’eau"
                onChange={(e) => setOrientation(e.target.value)}
              />
              {r.erreur ? (
                <p className="ajout-ia__note ajout-ia__note--erreur" role="alert">
                  {r.erreur}
                </p>
              ) : r.reste && !r.attente ? (
                <p className="ajout-ia__note">{r.reste}</p>
              ) : null}
            </div>
          ) : null}
          <button
            ref={bouton}
            type="button"
            className="ajout-ia__bouton"
            onClick={() => (ouvert ? void r.prendre() : setOuvert(true))}
            disabled={r.attente || r.ajout}
            aria-busy={r.attente || r.ajout || undefined}
            aria-label={ouvert ? undefined : `Demander un chapitre à l’IA pour « ${partie.titre} »`}
            title={ouvert ? undefined : "Demander à l’IA"}
          >
            <Icone nom="ia" />
            {ouvert ? <span>{r.attente ? "L’IA cherche…" : "Proposer un chapitre"}</span> : null}
          </button>
        </div>
      ) : null}
    </li>
  );
}
