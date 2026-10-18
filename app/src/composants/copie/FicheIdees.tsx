"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ChampQuiGrandit } from "@/composants/ChampQuiGrandit";
import { Icone } from "@/composants/Icone";
import { MESSAGES_IA } from "@/domaine/aides-ia";
import { useCopie, type Services } from "./contexte";
import { ChoisirDestination, nomDeDestination } from "./FicheChoix";
import { avantDePartir } from "./sortie";

/**
 * Les idées de choix de l'IA (F13.3), dans le panneau à droite du texte : trois à la fois,
 * chacune une case, son libellé, une ligne d'intention et sa destination, tout modifiable sur
 * place sans nouvel appel (F13-AC10). Dix idées viennent en une demande ; « D'autres idées »
 * montre les suivantes, puis redemande en écartant celles déjà vues. Rien n'est créé avant le
 * bouton qui dit ce qu'il ajoute (F13-AC08) : les choix s'écrivent alors dans la copie, et les
 * nouvelles scènes se créent comme celles d'un choix fait à la main.
 */

export const IDEES_PAR_PAGE = 3;

export type DestinationIdee = { sorte: "nouvelle"; titre: string; chapitreId: string } | { sorte: "existante"; sceneId: string };
export type Idee = { id: string; libelle: string; intention: string; destination: DestinationIdee; cochee: boolean };

type Etat = {
  /** Ce que montre le panneau : les idées cochées, gardées, puis celles de la page en cours */
  montrees: Idee[];
  /** Le reste de la dernière demande, pas encore montré */
  reserve: Idee[];
  /** Les libellés déjà montrés : une nouvelle demande ne les repropose pas */
  vues: string[];
  orientation: string;
  /** Une demande est partie, et n'a pas encore répondu */
  demande: boolean;
  erreur: string | null;
  /** Aucune demande n'a encore abouti depuis l'ouverture de la page */
  premiere: boolean;
  /** « Encore 8 demandes aujourd'hui. », ou rien */
  reste: string | null;
};

const ETAT_DE_DEPART: Etat = { montrees: [], reserve: [], vues: [], orientation: "", demande: false, erreur: null, premiere: true, reste: null };
const PAS_ENREGISTRE = "Vos dernières modifications ne sont pas encore enregistrées : réessayez dans un instant.";

/** Le libellé du bouton d'ajout : ce qu'il ajoute, en toutes lettres. */
export function libelleDAjout(idees: Pick<Idee, "destination">[]): string {
  const n = idees.length;
  const scenes = idees.filter((i) => i.destination.sorte === "nouvelle").length;
  if (n === 0) return "Ajouter";
  return `Ajouter ${n} choix${scenes ? ` et ${scenes} scène${scenes > 1 ? "s" : ""}` : ""}`;
}

/**
 * L'état des idées, tenu par la copie : refermer le panneau ne perd pas ce qu'une demande a
 * rendu, et le rouvrir montre les mêmes idées, sans nouvel appel.
 */
export function useIdeesDeChoix(demanderIdees: Services["demanderIdees"], chapitreId: string) {
  const [etat, setEtat] = useState<Etat>(ETAT_DE_DEPART);
  // Lu dans les gestes : la demande part avec ce que l'adulte vient de taper
  const tenu = useRef(etat);
  useEffect(() => {
    tenu.current = etat;
  });

  const demander = async () => {
    if (!demanderIdees || tenu.current.demande) return;
    setEtat((e) => ({ ...e, demande: true, erreur: null }));
    if (!(await avantDePartir())) return setEtat((e) => ({ ...e, demande: false, erreur: PAS_ENREGISTRE }));
    const { orientation, vues } = tenu.current;
    let r: Awaited<ReturnType<NonNullable<Services["demanderIdees"]>>>;
    try {
      r = await demanderIdees({ orientation, dejaMontrees: vues });
    } catch {
      r = { ok: false, message: MESSAGES_IA.pasDeReponse };
    }
    if (!r.ok) return setEtat((e) => ({ ...e, demande: false, erreur: r.message }));
    const recues: Idee[] = r.idees.map((i) => ({
      id: crypto.randomUUID(),
      libelle: i.libelle,
      intention: i.intention,
      destination: i.destination.sorte === "nouvelle" ? { sorte: "nouvelle", titre: i.destination.titre, chapitreId } : i.destination,
      cochee: false,
    }));
    const page = recues.slice(0, IDEES_PAR_PAGE);
    setEtat((e) => ({
      ...e,
      demande: false,
      premiere: false,
      reste: r.reste,
      montrees: [...e.montrees.filter((i) => i.cochee), ...page],
      reserve: recues.slice(IDEES_PAR_PAGE),
      vues: [...e.vues, ...page.map((i) => i.libelle)],
    }));
  };

  /** « D'autres idées » : les trois suivantes de la réserve, sans appel ; une nouvelle demande quand elle est vide. */
  const autres = () => {
    if (tenu.current.reserve.length === 0) return demander();
    setEtat((e) => {
      const page = e.reserve.slice(0, IDEES_PAR_PAGE);
      return { ...e, erreur: null, montrees: [...e.montrees.filter((i) => i.cochee), ...page], reserve: e.reserve.slice(IDEES_PAR_PAGE), vues: [...e.vues, ...page.map((i) => i.libelle)] };
    });
  };

  return {
    etat,
    demander,
    autres,
    /** Orienter l'IA : les idées reçues et pas encore montrées sont jetées (F13, « Orienter l'IA ») */
    orienter: (orientation: string) => setEtat((e) => ({ ...e, orientation, reserve: orientation.trim() === e.orientation.trim() ? e.reserve : [] })),
    cocher: (id: string, cochee: boolean) => setEtat((e) => ({ ...e, montrees: e.montrees.map((i) => (i.id === id ? { ...i, cochee } : i)) })),
    /** Une retouche coche l'idée : on ne retouche que ce qu'on pense garder */
    modifier: (id: string, valeurs: Partial<Pick<Idee, "libelle" | "intention" | "destination">>) =>
      setEtat((e) => ({ ...e, montrees: e.montrees.map((i) => (i.id === id ? { ...i, ...valeurs, cochee: true } : i)) })),
    /** Les idées ajoutées quittent le panneau ; « Annuler » les y remet, cochées */
    retirer: (ids: string[]) => setEtat((e) => ({ ...e, montrees: e.montrees.filter((i) => !ids.includes(i.id)) })),
    remettre: (idees: Idee[]) => setEtat((e) => ({ ...e, montrees: [...idees.map((i) => ({ ...i, cochee: true })), ...e.montrees.filter((i) => !idees.some((x) => x.id === i.id))] })),
  };
}

export type IdeesDeChoix = ReturnType<typeof useIdeesDeChoix>;

/** Une idée : la case, le libellé, l'intention, la destination et « Changer ». */
function LigneIdee({ idee, idees, services }: { idee: Idee; idees: IdeesDeChoix; services: Services }) {
  const { livre, lieu } = useCopie();
  const id = useId();
  const [changer, setChanger] = useState(false);
  const d = idee.destination;
  const scene = d.sorte === "existante" ? livre.scenes.find((s) => s.id === d.sceneId) : undefined;
  const ailleurs = d.sorte === "nouvelle" && d.chapitreId !== lieu.chapitreId ? livre.chapitres.find((c) => c.id === d.chapitreId) : undefined;
  return (
    <li className={`ix-idee${idee.cochee ? " est-cochee" : ""}`}>
      <input id={`${id}-case`} className="ix-idee__case" type="checkbox" checked={idee.cochee} onChange={(e) => idees.cocher(idee.id, e.target.checked)} aria-label={`Garder l’idée « ${idee.libelle} »`} />
      <div className="ix-idee__corps">
        <input
          className="ix-libelle"
          type="text"
          maxLength={200}
          value={idee.libelle}
          aria-label="Ce que fait le lecteur"
          onChange={(e) => idees.modifier(idee.id, { libelle: e.target.value })}
        />
        <ChampQuiGrandit
          className="ix-intention"
          rows={1}
          maxLength={600}
          value={idee.intention}
          aria-label="Ce que ce choix fait vivre au lecteur"
          onChange={(e) => idees.modifier(idee.id, { intention: e.target.value })}
        />
        {changer ? (
          <div
            className="ix-changer"
            onKeyDown={(e) => {
              // Échap referme le menu de la destination, pas le panneau
              if (e.key !== "Escape") return;
              e.preventDefault();
              e.stopPropagation();
              setChanger(false);
            }}
          >
            <ChoisirDestination
              libelle={idee.libelle}
              services={services}
              actuelle={d.sorte === "existante" ? d.sceneId : null}
              titreNouvelle={d.sorte === "nouvelle" ? d.titre : undefined}
              chapitreNouvelle={d.sorte === "nouvelle" ? d.chapitreId : undefined}
              issueDeDepart={d.sorte}
              creer="Mener à cette nouvelle scène"
              sansPlusTard
              focus
              differer={({ titre, chapitreId }) => {
                idees.modifier(idee.id, { destination: { sorte: "nouvelle", titre, chapitreId } });
                setChanger(false);
              }}
              valider={({ cible }) => {
                if (cible) idees.modifier(idee.id, { destination: { sorte: "existante", sceneId: cible } });
                setChanger(false);
              }}
            />
            <p className="cx-autre">
              <button type="button" className="lien cx-discret" onClick={() => setChanger(false)}>
                Fermer sans changer
              </button>
            </p>
          </div>
        ) : (
          <div className="ix-dest">
            <p className="ix-dest__tete">
              <Icone nom="fleche" />
              <span className="ix-dest__sorte">{d.sorte === "nouvelle" ? "Nouvelle scène" : "Scène existante"}</span>
              {ailleurs ? <small className="ix-dest__ailleurs">dans {ailleurs.titre}</small> : null}
              {d.sorte === "existante" && livre.numeros[d.sceneId] ? <small className="ix-dest__ailleurs">n° {livre.numeros[d.sceneId]}</small> : null}
              <button type="button" className="lien cx-discret ix-dest__changer" onClick={() => setChanger(true)}>
                Changer
              </button>
            </p>
            {d.sorte === "nouvelle" ? (
              <ChampQuiGrandit
                className="ix-titre"
                rows={1}
                maxLength={120}
                value={d.titre}
                aria-label="Titre de la nouvelle scène"
                // Un titre tient sur une ligne : Entrée ne l'allonge pas
                onKeyDown={(e) => e.key === "Enter" && e.preventDefault()}
                onChange={(e) => idees.modifier(idee.id, { destination: { ...d, titre: e.target.value.replace(/\n/g, " ") } })}
              />
            ) : (
              <p className="ix-dest__scene">{nomDeDestination(scene, false) || "Scène supprimée"}</p>
            )}
          </div>
        )}
      </div>
    </li>
  );
}

/** Le panneau des idées de choix. `onAjouter` ajoute les idées cochées ; la copie dit ensuite ce qu'elle a fait. */
export function FicheIdees({
  idees, services, ajout, onAjouter, onFermer,
}: {
  idees: IdeesDeChoix;
  services: Services;
  /** L'ajout est en cours : les scènes se créent */
  ajout: boolean;
  onAjouter: (choisies: Idee[]) => void;
  onFermer: () => void;
}) {
  const { etat } = idees;
  const idOrienter = useId();
  const [orienter, setOrienter] = useState(() => etat.orientation.trim() !== "");
  // Avant la première demande, le champ est là d'emblée : on oriente l'IA dès le premier appel (18 octobre 2026)
  const orienterOuvert = orienter || etat.orientation.trim() !== "" || (etat.premiere && !etat.demande);
  const cochees = etat.montrees.filter((i) => i.cochee);
  const pretes = cochees.filter((i) => i.libelle.trim() && (i.destination.sorte === "existante" || i.destination.titre.trim()));
  // L'orientation a changé depuis la dernière demande, et la réserve a été jetée : la prochaine idée vient d'une nouvelle demande
  const nouvelles = !etat.premiere && etat.reserve.length === 0 && etat.orientation.trim() !== "";
  // Après « D'autres idées », la première idée nouvelle vient sous les yeux
  const liste = useRef<HTMLUListElement>(null);
  const vues = useRef(etat.vues.length);
  useEffect(() => {
    if (etat.vues.length === vues.current) return;
    const premiere = vues.current > 0;
    vues.current = etat.vues.length;
    if (premiere) liste.current?.querySelector(".ix-idee:not(.est-cochee)")?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [etat.vues.length]);
  return (
    <section
      className="cx cx--ia"
      aria-label="Idées de choix"
      aria-busy={etat.demande || undefined}
      onKeyDown={(e) => {
        if (e.key !== "Escape") return;
        e.preventDefault();
        e.stopPropagation();
        onFermer();
      }}
    >
      <header className="cx__tete">
        <Icone nom="ia" />
        <h3>Idées de choix</h3>
        <button type="button" className="btn btn--discret cx__fermer" onClick={onFermer} aria-label="Fermer les idées de choix">
          <Icone nom="fermer" />
        </button>
      </header>
      <div className="cx__corps ix">
        <div className="ix__tete">
          {etat.montrees.length ? <p className="ix__aide">Cochez celles à ajouter ; un clic sur un texte le retouche.</p> : null}
          {orienterOuvert ? null : (
            <button type="button" className="lien cx-discret" onClick={() => setOrienter(true)}>
              Orienter l’IA
            </button>
          )}
        </div>
        {orienterOuvert ? (
          <div className="ix__orienter">
            <label htmlFor={idOrienter}>
              Orienter l’IA <span className="ix__facultatif">facultatif</span>
            </label>
            <ChampQuiGrandit
              id={idOrienter}
              className="pchamp"
              rows={2}
              maxLength={600}
              autoFocus
              value={etat.orientation}
              placeholder="Par exemple : un choix risqué, une fausse piste, la lanterne"
              onChange={(e) => idees.orienter(e.target.value)}
            />
          </div>
        ) : null}
        {etat.montrees.length ? (
          <>
            <ul className="ix__liste" aria-label="Idées proposées" ref={liste}>
              {etat.montrees.map((i) => (
                <LigneIdee key={i.id} idee={i} idees={idees} services={services} />
              ))}
            </ul>
          </>
        ) : null}
        {etat.demande ? (
          <p className="ix__attente" role="status">
            <Icone nom="ia" />
            {etat.premiere ? "L’IA cherche des idées pour cette scène…" : "L’IA cherche d’autres idées…"}
          </p>
        ) : etat.erreur ? (
          <p className="ix__erreur" role="alert">
            {etat.erreur}
          </p>
        ) : etat.reste ? (
          <p className="ix__reste">{etat.reste}</p>
        ) : null}
        {/* Redemander, ou voir les suivantes : sous la liste, à part de la décision du pied */}
        {etat.demande || (!etat.montrees.length && !etat.erreur && !etat.premiere) ? null : (
          <button type="button" className="btn btn--ia ix__autres" onClick={() => void (etat.premiere || (etat.erreur && !etat.montrees.length) ? idees.demander() : idees.autres())}>
            <Icone nom="ia" />
            {etat.premiere || (etat.erreur && !etat.montrees.length) ? "Proposer des idées" : nouvelles ? "Nouvelles idées" : "D’autres idées"}
          </button>
        )}
      </div>
      {/* Sans idée à cocher, rien à ajouter : le pied attend les idées */}
      {!etat.montrees.length ? null : (
      <footer className="cx__pied">
        <button
          type="button"
          className="btn btn--primaire ix__ajouter"
          disabled={ajout || pretes.length === 0 || pretes.length !== cochees.length}
          aria-busy={ajout || undefined}
          title={cochees.length === 0 ? "Cochez les idées à ajouter" : pretes.length !== cochees.length ? "Une idée cochée n’a pas de libellé ou pas de titre" : undefined}
          onClick={() => onAjouter(pretes)}
        >
          {libelleDAjout(cochees)}
        </button>
      </footer>
      )}
    </section>
  );
}
