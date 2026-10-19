"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ChampQuiGrandit } from "@/composants/ChampQuiGrandit";
import { Icone } from "@/composants/Icone";
import { MentionImageALAjout, useImagesALAjout } from "@/composants/ImagesALAjout";
import { useMessage } from "@/composants/Messages";
import { Panneau } from "@/composants/Panneau";
import { MESSAGES_IA } from "@/domaine/aides-ia";
import { ORIENTATION_MAX } from "@/domaine/preparation";
import { pluriel } from "@/domaine/texte";
import type { ReponsePlan } from "@/serveur/plan-ia";
import { ajouterDesParties, supprimer } from "../../actions-recit";

/** Demande une aide du plan par son adresse (F13.5) ; une panne se dit comme un refus. */
export async function demanderAuPlan(corps: {
  sorte: "parties" | "chapitres" | "resume"; projet?: string; partie?: string; chapitre?: string; orientation?: string; dejaMontres?: string[];
}): Promise<ReponsePlan> {
  try {
    const r = await fetch("/ia/plan", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(corps) });
    if (!r.ok && r.status !== 401 && r.status !== 500) return { ok: false, message: MESSAGES_IA.pasDeReponse };
    return (await r.json()) as ReponsePlan;
  } catch {
    return { ok: false, message: MESSAGES_IA.pasDeReponse };
  }
}

export const ENSEMBLES_PAR_PAGE = 3;

/** Un ensemble proposé : la partie, son premier chapitre et le résumé de ce chapitre (F13-AC15). */
export type EnsembleIdee = { id: string; partie: string; chapitre: string; resume: string; cochee: boolean };

type Etat = {
  /** Ce que montre le panneau : les ensembles cochés, gardés, puis ceux de la page en cours */
  montrees: EnsembleIdee[];
  /** Le reste de la dernière demande, pas encore montré */
  reserve: EnsembleIdee[];
  /** Les titres de parties déjà montrés : une nouvelle demande ne les repropose pas */
  vues: string[];
  /** L'orientation de la dernière demande : si elle change, la réserve est jetée */
  orientationDemandee: string;
  demande: boolean;
  erreur: string | null;
  premiere: boolean;
  reste: string | null;
};
const DEPART: Etat = { montrees: [], reserve: [], vues: [], orientationDemandee: "", demande: false, erreur: null, premiere: true, reste: null };

export const libelleDAjoutParties = (n: number): string => (n === 0 ? "Ajouter" : `Ajouter ${n} partie${pluriel(n)}`);

/**
 * Les idées de parties (F13.5), tenues par la page : refermer le panneau ne perd pas ce qu'une
 * demande a rendu, et le rouvrir montre les mêmes ensembles, sans nouvel appel. Dix ensembles en
 * une demande, montrés trois par trois ; « D'autres idées » montre les suivants, puis redemande en
 * écartant ceux déjà vus. L'orientation est celle de « Grandes étapes », gardée avec le projet.
 */
export function useIdeesDeParties(projetId: string, orientation: string, avantDeDemander?: () => Promise<void>) {
  const [etat, setEtat] = useState<Etat>(DEPART);
  const tenu = useRef(etat);
  const orientationTenue = useRef(orientation);
  useEffect(() => {
    tenu.current = etat;
    orientationTenue.current = orientation;
  });

  const demander = async () => {
    if (tenu.current.demande) return;
    setEtat((e) => ({ ...e, demande: true, erreur: null }));
    await avantDeDemander?.();
    const o = orientationTenue.current;
    const r = await demanderAuPlan({ sorte: "parties", projet: projetId, orientation: o, dejaMontres: tenu.current.vues });
    if (!r.ok || r.sorte !== "parties") return setEtat((e) => ({ ...e, demande: false, erreur: r.ok ? MESSAGES_IA.pasDeReponse : r.message }));
    const recus: EnsembleIdee[] = r.ensembles.map((x) => ({ id: crypto.randomUUID(), ...x, cochee: false }));
    const page = recus.slice(0, ENSEMBLES_PAR_PAGE);
    setEtat((e) => ({
      ...e,
      demande: false,
      premiere: false,
      reste: r.reste,
      orientationDemandee: o,
      montrees: [...e.montrees.filter((x) => x.cochee), ...page],
      reserve: recus.slice(ENSEMBLES_PAR_PAGE),
      vues: [...e.vues, ...page.map((x) => x.partie)],
    }));
  };

  /**
   * « D'autres idées » : les trois suivants de la réserve, sans appel ; une nouvelle demande quand
   * elle est vide, ou quand l'orientation a changé depuis la dernière : ce qui n'a pas été montré
   * est alors jeté (F13, « Orienter l'IA »).
   */
  const autres = () => {
    if (tenu.current.reserve.length === 0 || orientationTenue.current.trim() !== tenu.current.orientationDemandee.trim()) return demander();
    setEtat((e) => {
      const page = e.reserve.slice(0, ENSEMBLES_PAR_PAGE);
      return { ...e, erreur: null, montrees: [...e.montrees.filter((x) => x.cochee), ...page], reserve: e.reserve.slice(ENSEMBLES_PAR_PAGE), vues: [...e.vues, ...page.map((x) => x.partie)] };
    });
  };

  return {
    etat,
    demander,
    autres,
    cocher: (id: string, cochee: boolean) => setEtat((e) => ({ ...e, montrees: e.montrees.map((x) => (x.id === id ? { ...x, cochee } : x)) })),
    /** Une retouche coche l'ensemble : on ne retouche que ce qu'on pense garder */
    modifier: (id: string, valeurs: Partial<Pick<EnsembleIdee, "partie" | "chapitre" | "resume">>) =>
      setEtat((e) => ({ ...e, montrees: e.montrees.map((x) => (x.id === id ? { ...x, ...valeurs, cochee: true } : x)) })),
    /** Les ensembles ajoutés quittent le panneau ; « Annuler » les y remet, cochés */
    retirer: (ids: string[]) => setEtat((e) => ({ ...e, montrees: e.montrees.filter((x) => !ids.includes(x.id)) })),
    remettre: (ensembles: EnsembleIdee[]) =>
      setEtat((e) => ({ ...e, montrees: [...ensembles.map((x) => ({ ...x, cochee: true })), ...e.montrees.filter((x) => !ensembles.some((y) => y.id === x.id))] })),
  };
}

export type IdeesDeParties = ReturnType<typeof useIdeesDeParties>;

/**
 * « Ajouter 2 parties » : les ensembles retenus, à la fin du plan (F13-AC16). Le message dit ce
 * qui est ajouté ; « Annuler » met les parties à la corbeille et remet les ensembles, cochés.
 */
export function useAjouterDesParties(projetId: string, idees: IdeesDeParties, apres: (premiere: string) => void) {
  const dire = useMessage();
  const imagesALAjout = useImagesALAjout();
  const [ajout, setAjout] = useState(false);
  const ajouter = async (choisis: EnsembleIdee[]): Promise<boolean> => {
    if (ajout || !choisis.length) return false;
    setAjout(true);
    const fait = await ajouterDesParties(projetId, choisis.map(({ partie, chapitre, resume }) => ({ partie, chapitre, resume })));
    setAjout(false);
    if (!fait.ok) {
      dire({ texte: fait.erreur });
      return false;
    }
    idees.retirer(choisis.map((x) => x.id));
    apres(fait.parties[0]);
    // Une image par partie, créée d'office d'après le résumé de son premier chapitre (F10.1)
    imagesALAjout("partie", fait.parties);
    const noms = choisis.map((x) => `« ${x.partie} »`);
    dire({
      texte: `${choisis.length > 1 ? `${choisis.length} parties ajoutées` : "1 partie ajoutée"} à la fin du plan : ${noms.length > 1 ? `${noms.slice(0, -1).join(", ")} et ${noms.at(-1)}` : noms[0]}.`,
      annuler: () => {
        void (async () => {
          for (const id of fait.parties) await supprimer("partie", id);
          idees.remettre(choisis);
        })();
      },
    });
    return true;
  };
  return { ajout, ajouter };
}

/** Un ensemble : la case, le titre de la partie, son premier chapitre et le résumé, tout modifiable sur place. */
function LigneEnsemble({ ensemble: x, idees }: { ensemble: EnsembleIdee; idees: IdeesDeParties }) {
  const id = useId();
  return (
    <li className={`ix-idee ipx${x.cochee ? " est-cochee" : ""}`}>
      <input id={`${id}-case`} className="ix-idee__case" type="checkbox" checked={x.cochee} onChange={(e) => idees.cocher(x.id, e.target.checked)} aria-label={`Garder la partie « ${x.partie} »`} />
      <div className="ix-idee__corps">
        <input
          className="ix-libelle"
          type="text"
          maxLength={120}
          value={x.partie}
          aria-label="Titre de la partie"
          onChange={(e) => idees.modifier(x.id, { partie: e.target.value })}
        />
        <p className="ix-dest__tete ipx__chap">
          <span className="ix-dest__sorte">Premier chapitre</span>
        </p>
        <input
          className="ix-titre"
          type="text"
          maxLength={120}
          value={x.chapitre}
          aria-label="Titre du premier chapitre"
          onChange={(e) => idees.modifier(x.id, { chapitre: e.target.value })}
        />
        <ChampQuiGrandit
          className="ix-intention"
          rows={1}
          maxLength={4000}
          value={x.resume}
          aria-label="Résumé du premier chapitre"
          onChange={(e) => idees.modifier(x.id, { resume: e.target.value })}
        />
      </div>
    </li>
  );
}

/**
 * Le panneau des idées de parties (F13.5), le même depuis « Grandes étapes » et « Parties et
 * chapitres ». Avant la première demande, « Orienter l'IA » est ouvert, le curseur dedans, puis
 * « Proposer des parties » : deux clics, l'orientation dès le premier appel. En projection,
 * l'orientation, consigne de l'adulte, ne s'affiche pas.
 */
export function PanneauIdeesDeParties({
  idees, orientation, onOrienter, ajout, onAjouter, onFermer, projection, depuisLEtape,
}: {
  idees: IdeesDeParties;
  orientation: string;
  onOrienter: (v: string) => void;
  ajout: boolean;
  onAjouter: (choisis: EnsembleIdee[]) => void;
  onFermer: () => void;
  projection?: boolean;
  /** Ouvert depuis « Grandes étapes », où le même champ oriente aussi les questions et les idées */
  depuisLEtape?: boolean;
}) {
  const { etat } = idees;
  const idOrienter = useId();
  const [orienter, setOrienter] = useState(false);
  const orienterOuvert = !projection && (orienter || orientation.trim() !== "" || (etat.premiere && !etat.demande));
  const cochees = etat.montrees.filter((x) => x.cochee);
  const pretes = cochees.filter((x) => x.partie.trim() && x.chapitre.trim());
  const nouvelles = !etat.premiere && orientation.trim() !== etat.orientationDemandee.trim();
  // En projection, la première demande part dès l'ouverture : il n'y a rien à orienter devant la classe
  useEffect(() => {
    if (projection && etat.premiere && !etat.demande && !etat.erreur) void idees.demander();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  // Après « D'autres idées », le premier ensemble nouveau vient sous les yeux
  const liste = useRef<HTMLUListElement>(null);
  const vues = useRef(etat.vues.length);
  useEffect(() => {
    if (etat.vues.length === vues.current) return;
    const suite = vues.current > 0;
    vues.current = etat.vues.length;
    if (suite) liste.current?.querySelector(".ix-idee:not(.est-cochee)")?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [etat.vues.length]);
  const premiere = etat.premiere || (etat.erreur !== null && !etat.montrees.length);

  return (
    <Panneau
      titre={
        <span className="ipx__titre">
          <Icone nom="ia" />
          Idées de parties
        </span>
      }
      onFermer={onFermer}
      pied={
        etat.montrees.length ? (
          <>
            <MentionImageALAjout className="ipx__mention" avant={onFermer} />
            <button
              type="button"
              className="btn btn--primaire btn--grand ipx__ajouter"
              disabled={ajout || pretes.length === 0 || pretes.length !== cochees.length}
              aria-busy={ajout || undefined}
              title={cochees.length === 0 ? "Cochez les parties à ajouter" : pretes.length !== cochees.length ? "Une partie cochée n’a pas de titre, ou son chapitre non plus" : undefined}
              onClick={() => onAjouter(pretes)}
            >
              {libelleDAjoutParties(cochees.length)}
            </button>
          </>
        ) : undefined
      }
    >
      <div className="ix ipx" aria-busy={etat.demande || undefined}>
        <div className="ix__tete">
          {etat.montrees.length ? <p className="ix__aide">Cochez celles à ajouter ; un clic sur un texte le retouche. Elles vont à la fin du plan.</p> : <p className="ix__aide">Chaque idée : une partie, son premier chapitre et son résumé.</p>}
          {orienterOuvert || projection ? null : (
            <button type="button" className="lien cx-discret" onClick={() => setOrienter(true)}>
              Orienter l’IA
            </button>
          )}
        </div>
        {orienterOuvert ? (
          <div className="ix__orienter">
            <label htmlFor={idOrienter}>
              Orienter l’IA{" "}
              <span className="ix__facultatif">{depuisLEtape ? "facultatif · le même que pour les questions et les idées" : "facultatif · gardé avec Grandes étapes"}</span>
            </label>
            <ChampQuiGrandit
              id={idOrienter}
              className="pchamp"
              rows={2}
              maxLength={ORIENTATION_MAX}
              data-focus=""
              value={orientation}
              placeholder="Par exemple : un passage sous la mer, une fin au village"
              onChange={(e) => onOrienter(e.target.value)}
            />
          </div>
        ) : null}
        {etat.montrees.length ? (
          <ul className="ix__liste" aria-label="Parties proposées" ref={liste}>
            {etat.montrees.map((x) => (
              <LigneEnsemble key={x.id} ensemble={x} idees={idees} />
            ))}
          </ul>
        ) : null}
        {etat.demande ? (
          <p className="ix__attente" role="status">
            <Icone nom="ia" />
            {etat.premiere ? "L’IA cherche des parties pour ce plan…" : "L’IA cherche d’autres parties…"}
          </p>
        ) : etat.erreur ? (
          <p className="ix__erreur" role="alert">
            {etat.erreur}
          </p>
        ) : etat.reste ? (
          <p className="ix__reste">{etat.reste}</p>
        ) : null}
        {etat.demande ? null : (
          <button type="button" className="btn btn--ia ix__autres" onClick={() => void (premiere ? idees.demander() : idees.autres())}>
            <Icone nom="ia" />
            {premiere ? "Proposer des parties" : nouvelles ? "Nouvelles idées" : "D’autres idées"}
          </button>
        )}
      </div>
    </Panneau>
  );
}
