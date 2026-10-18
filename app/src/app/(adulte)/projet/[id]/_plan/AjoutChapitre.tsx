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
  const [demandee, setDemandee] = useState(false);
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
    if (!(await creer(c))) {
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
    if (attente) return;
    setErreur(null);
    const ici = suivant();
    if (ici) return livrer(ici);
    setAttente(true);
    setDemandee(true);
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
  return { attente, erreur, reste, demandee, prendre };
}

/**
 * « + Ajouter un chapitre │ ✦ » au bout d'une partie (F13.5) : la carte en pointillé ajoute à la
 * main ; sa bande ✦ fait ajouter par l'IA un chapitre, titre et résumé, à la fin de la partie,
 * sans scène ni élève. Avant la première demande, « Orienter l'IA » s'ouvre sous la partie, le
 * curseur dedans, avec « Proposer un chapitre » (deux clics). Aides éteintes, la carte est simple.
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
  const [orienter, setOrienter] = useState<"avant" | "ouvert" | null>(null);
  const r = useReserveDeChapitres(partie, orientation, onAjouterPropose);

  const ia = () => {
    // La première fois, on oriente d'abord ; ensuite, un clic, un chapitre
    if (!r.demandee && !orientation.trim()) return setOrienter("avant");
    setOrienter(orientation.trim() ? "ouvert" : null);
    void r.prendre();
  };

  return (
    <>
      <li className={`cahier-ajout-place${proposer ? " cahier-ajout-place--double" : ""}`}>
        <button type="button" className="cahier-ajout" disabled={enCours} aria-busy={enCours || undefined} onClick={onAjouter}>
          <Icone nom="plus" />
          <span>Ajouter un chapitre</span>
        </button>
        {proposer ? (
          <button
            type="button"
            className="cahier-ajout__ia"
            onClick={ia}
            disabled={r.attente}
            aria-busy={r.attente || undefined}
            aria-label={`Demander un chapitre à l’IA pour « ${partie.titre} »`}
            title="Demander à l’IA"
          >
            <Icone nom="ia" />
          </button>
        ) : null}
      </li>
      {/* Sous la partie, sur toute la largeur de la grille */}
      {proposer && (orienter || r.attente || r.erreur || r.reste || r.demandee) ? (
        <li className="plan-ia-ligne">
          <NotesChapitres
          orientation={orientation}
          orienter={orienter}
          attente={r.attente}
          erreur={r.erreur}
          reste={r.reste}
          onOrienter={(v) => setOrientation(v)}
          onOuvrir={() => setOrienter("ouvert")}
          onFermer={() => setOrienter(null)}
          onProposer={() => {
            setOrienter(orientation.trim() ? "ouvert" : null);
            void r.prendre();
          }}
          />
        </li>
      ) : null}
    </>
  );
}

/** Sous la partie, sur toute sa largeur : l'orientation, l'attente, l'échec ou les demandes qui restent. */
function NotesChapitres({
  orientation, orienter, attente, erreur, reste, onOrienter, onOuvrir, onFermer, onProposer,
}: {
  orientation: string;
  orienter: "avant" | "ouvert" | null;
  attente: boolean;
  erreur: string | null;
  reste: string | null;
  onOrienter: (v: string) => void;
  onOuvrir: () => void;
  onFermer: () => void;
  onProposer: () => void;
}) {
  const id = useId();
  // Ouvert par le ✦ ou par le lien : le curseur dans le champ, le champ sous les yeux
  const ouvert = orienter !== null;
  useEffect(() => {
    if (!ouvert) return;
    const champ = document.getElementById(id);
    champ?.focus();
    champ?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [ouvert, id]);
  return (
    <div className="plan-ia">
      {orienter ? (
        <div
          className="plan-ia__orienter ix__orienter"
          onKeyDown={(e) => {
            if (e.key !== "Escape" || orientation.trim()) return;
            e.stopPropagation();
            onFermer();
          }}
        >
          <label htmlFor={id}>
            Orienter l’IA <span className="ix__facultatif">facultatif · pour cette partie</span>
          </label>
          <ChampQuiGrandit
            id={id}
            className="pchamp"
            rows={1}
            maxLength={ORIENTATION_MAX}
            value={orientation}
            placeholder="Par exemple : une rencontre au bord de l’eau"
            onChange={(e) => onOrienter(e.target.value)}
          />
          {orienter === "avant" ? (
            <button type="button" className="btn btn--ia" onClick={onProposer}>
              <Icone nom="ia" />
              Proposer un chapitre
            </button>
          ) : null}
        </div>
      ) : null}
      {attente ? (
        <p className="plan-ia__note" role="status">
          <Icone nom="ia" />
          L’IA cherche des chapitres pour cette partie…
        </p>
      ) : erreur ? (
        <p className="plan-ia__note plan-ia__note--erreur" role="alert">
          {erreur}
        </p>
      ) : reste ? (
        <p className="plan-ia__note">{reste}</p>
      ) : null}
      {orienter ? null : (
        <p className="plan-ia__lien">
          <button type="button" className="lien cx-discret" onClick={onOuvrir}>
            Orienter l’IA pour cette partie
          </button>
        </p>
      )}
    </div>
  );
}
