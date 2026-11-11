"use client";

import "@xyflow/react/dist/base.css";
import {
  applyNodeChanges, BaseEdge, EdgeLabelRenderer, Handle, NodeToolbar, Position, ReactFlow, useReactFlow, useStore,
  type Edge, type EdgeProps, type Node, type NodeChange, type NodeProps, type ReactFlowInstance,
} from "@xyflow/react";
import Link from "next/link";
import {
  createContext, useCallback, useContext, useEffect, useEffectEvent, useLayoutEffect, useMemo, useRef, useState,
  type CSSProperties, type PointerEvent, type ReactNode, type RefObject,
} from "react";
import { cheminsAvecLeBloc, idPropose, resteAReprendre } from "@/domaine/bloc-de-scenes";
import { MOT_DE_MARQUE, type ARegarder, type Chemins, type NoeudDeChemin } from "@/domaine/chemins";
import { useAidesIa } from "../AidesIa";
import { replierLaColonnePourUnTemps } from "../EspaceAdulte";
import { Icone } from "../Icone";
import { TamponScene } from "../TamponScene";
import {
  carteDeReference, centrerSur, changerDeTaille, decalerLaVue, englober, montrerLaBoite, partVue, retenirLeSchema, sansVideInutile, suivreLeCadre, tailleLisible, tailleQuiMontre, vueDeDepart, vueDEnsemble,
  type Boite, type Cadre, type Vue as VueDuSchema,
} from "./ancrage";
import { PanneauDuBloc, useEtatDuBloc } from "./Bloc";
import { BulleDuGeste, PanneauDeScene, type Construire, type Geste } from "./Construire";
import { disposer, texteDeLEtiquette, texteDuLibelle, type Disposition, type Element, type Mesure } from "./disposer";

/**
 * Le schéma des chemins d'un chapitre (F03.1, « Vue Chemins à reprendre », puis « Chemins en
 * atelier », 11 novembre 2026) : les scènes de haut en bas, placées par dagre, dessinées par React
 * Flow, dans un cadre qui remplit la hauteur de la fenêtre. La page ne défile plus : on tire le fond
 * pour se déplacer, la molette et deux doigts font de même, Ctrl + molette et le pincement changent
 * la taille. Aucune carte ne se déplace à la main. Ce fichier et ses deux bibliothèques ne se
 * chargent qu'à l'ouverture de « Chemins », sur un écran large.
 *
 * L'adulte y construit le plan (F03.1, « Construire dans Chemins ») : un « + » sous la carte
 * ajoute une scène, ou relie quand on le tire jusqu'à une autre. Deux états : le plan, schéma sur
 * toute la largeur ; le travail, dès qu'une carte est cliquée ou que « ✦ Construire avec l'IA » est
 * demandé — la colonne de navigation se replie, le schéma rétrécit et glisse jusqu'à la scène, et
 * l'espace de travail s'ouvre à droite, à côté du schéma. Après chaque geste le schéma se
 * redispose, et l'écran ne bouge pas : même taille, la carte d'où l'on part au même point (F03-AC54).
 */

/** Autour du schéma, dans son cadre */
const MARGE = 28;
/** En dessous, on regarde l'ensemble : les libellés des choix ne se lisent plus et sont masqués */
const LOIN = 0.62;
/** « Tout voir » descend aussi bas qu'il le faut ; les boutons « − » et « + » restent entre deux tailles utiles */
const ZOOM = { toutVoir: 0.05, min: 0.2, lisible: 0.7, max: 1, pas: 0.1 };
/** Où une scène cliquée se pose de haut en bas : un peu au-dessus du milieu, sa suite se construit dessous */
const HAUTEUR_DE_LA_SCENE = 0.42;
/** La largeur du cadre en dessous de laquelle la mini-carte ne s'affiche pas */
const MINI_CARTE_DES = 600;
/** Le temps d'un glissement de la vue */
const GLISSE = 320;

type DonneesScene = NoeudDeChemin & { marques: string[]; sansSuite: boolean };
type DonneesTrait = { d: string; texte: string; cache: boolean; remonte: boolean; libelle: Disposition["traits"][number]["libelle"]; propose?: boolean };
type NoeudScene = Node<DonneesScene, "scene">;
type NoeudEtiquette = Node<{ element: Element }, "etiquette">;
type Trait = Edge<DonneesTrait, "chemin">;

/** Ce que les cartes et les traits ont besoin de savoir de la vue, sans être redessinés tous à chaque geste */
const Vue = createContext<{
  active: string | null; choisie: string | null; survolee: string | null;
  /** Les scènes et les étiquettes qu'un chemin relie à la scène choisie : elles restent nettes avec elle */
  voisines: Set<string>;
  loin: boolean; designee?: string; montre: string | null;
  /** L'adulte construit ici, à une taille où les cartes se lisent : chaque carte offre son « + » */
  construit: boolean;
  /** La carte d'où part le geste en cours, et celle où arrive le lien qu'on tire */
  source: string | null; cible: string | null;
  /** `auClavier` : le curseur reviendra sur le « + » une fois la bulle refermée, pour enchaîner */
  ouvrirAjout: (id: string, auClavier: boolean) => void;
  commencerLien: (id: string, e: PointerEvent<HTMLButtonElement>) => void;
  /** Le libellé d'un choix, cliqué : sa scène d'origine est choisie, et sa ligne désignée dans le panneau */
  choisirChoix: (lienId: string, de: string) => void;
  /** La scène proposée par le bloc dont la ligne est ouverte dans le panneau, et le geste qui l'ouvre (F13.7) */
  ouverteDuBloc: string | null;
  ouvrirDuBloc: (cle: string) => void;
  /** Il reste à construire : les scènes qu'on vient d'ajouter sont cerclées, on clique celle d'où continuer (F13-AC40) */
  candidates: Set<string>;
}>({
  active: null, choisie: null, survolee: null, voisines: new Set(), loin: false, montre: null,
  construit: false, source: null, cible: null, ouvrirAjout: () => {}, commencerLien: () => {}, choisirChoix: () => {},
  ouverteDuBloc: null, ouvrirDuBloc: () => {}, candidates: new Set(),
});

const classes = (...noms: (string | false | null | undefined)[]): string => noms.filter(Boolean).join(" ");

function CarteScene({ id, data, selected }: NodeProps<NoeudScene>) {
  const vue = useContext(Vue);
  const titre = data.titre ?? "sans titre";
  if (data.propose) {
    const cle = data.propose.cle;
    // Une scène que l'IA propose, pas encore ajoutée : en pointillé ; cliquée, sa ligne s'ouvre dans le panneau
    return (
      <div className="noeud-chemin">
        <button
          type="button"
          className={classes("carte-chemin carte-chemin--proposee nodrag nopan", vue.ouverteDuBloc === cle && "est-ouverte")}
          data-chemin={id}
          aria-label={`Scène proposée : ${titre}. Retoucher dans le panneau`}
          onClick={(e) => {
            e.stopPropagation();
            vue.ouvrirDuBloc(cle);
          }}
        >
          <Handle type="target" position={Position.Top} isConnectable={false} />
          <span className={classes("carte-chemin__titre", !data.titre && "carte-chemin__titre--vide")}>{titre}</span>
          <span className={classes("carte-chemin__pied carte-chemin__pied--proposee", data.propose.inventee && "est-imaginee")}>
            <Icone nom="ia" />
            {data.propose.inventee ? "Imaginée, à vérifier" : "Proposée"}
          </span>
          <Handle type="source" position={Position.Bottom} isConnectable={false} />
        </button>
      </div>
    );
  }
  return (
    <div className={classes("noeud-chemin", vue.source === id && "est-source", data.sansSuite && "attend-une-suite")}>
    <div
      className={classes(
        "carte-chemin", selected && "est-choisie", vue.candidates.has(id) && "est-candidate", vue.designee === id && "est-designee", (vue.source === id || vue.cible === id) && "est-reliee",
        vue.choisie && vue.choisie !== id && !vue.voisines.has(id) && vue.source !== id && vue.cible !== id && "est-en-retrait",
      )}
      data-chemin={id}
    >
      <Handle type="target" position={Position.Top} isConnectable={false} />
      {data.depart || data.fin ? (
        <p className={`carte-chemin__bande carte-chemin__bande--${data.depart ? "depart" : "fin"}`}>
          <Icone nom={data.depart ? "drapeau" : "fin"} />
          {data.depart ? `Départ du livre${data.fin ? " · fin" : ""}` : "Fin de l’histoire"}
        </p>
      ) : null}
      <p className={classes("carte-chemin__titre", !data.titre && "carte-chemin__titre--vide")}>{titre}</p>
      <div className="carte-chemin__pied">
        <TamponScene etat={data.etat} vide={data.vide} />
        <Link className="carte-chemin__ouvrir nodrag nopan" href={data.lien} aria-label={`Ouvrir ${titre}`}>
          Ouvrir
          <Icone nom="fleche" />
        </Link>
      </div>
      {data.marques.length ? (
        <p className="carte-chemin__bande carte-chemin__bande--regarder">
          <span className="point-regarder" aria-hidden="true" />
          {data.marques.join(" · ")}
        </p>
      ) : null}
      <Handle type="source" position={Position.Bottom} isConnectable={false} />
      {/* De loin, le titre ne se lit plus sur la carte : une bulle à taille réelle le donne */}
      <NodeToolbar isVisible={vue.loin && (selected || vue.survolee === id)} position={Position.Top} offset={8}>
        <span className="bulle-chemin">
          <b>{titre}</b>
          {selected ? (
            <Link href={data.lien}>
              Ouvrir
              <Icone nom="fleche" />
            </Link>
          ) : null}
        </span>
      </NodeToolbar>
    </div>
    {/* Un seul signe, deux gestes : cliqué, il ajoute une scène ; tiré jusqu'à une autre carte, il relie */}
    {vue.construit ? (
      <button
        type="button"
        className="plus-chemin nodrag nopan"
        data-de={id}
        aria-label={`Ajouter une suite à « ${titre} »`}
        title="Ajouter une scène, ou tirer jusqu’à une scène pour relier"
        onPointerDown={(e) => {
          e.stopPropagation();
          vue.commencerLien(id, e);
        }}
        onClick={(e) => {
          e.stopPropagation();
          vue.ouvrirAjout(id, e.detail === 0);
        }}
      >
        <Icone nom="plus" />
      </button>
    ) : null}
    </div>
  );
}

function Etiquette({ data }: NodeProps<NoeudEtiquette>) {
  const vue = useContext(Vue);
  const e = data.element;
  const texte = texteDeLEtiquette(e);
  const contenu = (
    <>
      {e.sorte === "manque" ? <span className="point-regarder" aria-hidden="true" /> : <Icone nom={e.sorte === "entree" ? "entree" : "sortie"} />}
      <span>{texte}</span>
    </>
  );
  const lien = e.sorte === "sortie" || e.sorte === "entree" ? e.lien : undefined;
  const montre = e.sorte === "manque" && vue.montre === e.lienId;
  const aide =
    e.sorte === "sortie"
      ? lien
        ? `Voir les chemins de « ${e.chapitre} »${e.nom ? `, où mène ce choix : ${e.nom}` : ""}`
        : `Ce choix mène à un autre chapitre : ${e.chapitre}`
      : e.sorte === "entree" && lien
        ? `Voir les chemins de « ${e.chapitre} », d’où vient ce choix`
        : undefined;
  return (
    <div className={classes("etiquette-chemin", `etiquette-chemin--${e.sorte}`, montre && "est-montree", vue.choisie && !vue.voisines.has(e.id) && "est-en-retrait")} data-chemin={e.sorte === "manque" ? e.lienId : e.id}>
      <Handle type="target" position={Position.Top} isConnectable={false} />
      {lien ? (
        <Link className="nodrag nopan" href={lien} title={aide}>
          {contenu}
        </Link>
      ) : (
        <span title={aide}>{contenu}</span>
      )}
      <Handle type="source" position={Position.Bottom} isConnectable={false} />
    </div>
  );
}

function TraitDeChemin({ id, source, target, data }: EdgeProps<Trait>) {
  const vue = useContext(Vue);
  if (!data) return null;
  const touche = vue.active !== null && (source === vue.active || target === vue.active);
  const efface = vue.choisie !== null && !touche;
  return (
    <>
      <BaseEdge
        path={data.d}
        interactionWidth={0}
        className={classes("trait-chemin", data.cache && "est-cache", data.propose && "est-propose", data.remonte && "remonte", touche && "est-actif", efface && !data.propose && "est-efface")}
        markerEnd={`url(#${data.propose ? "fleche-chemin-proposee" : touche ? "fleche-chemin-active" : data.remonte ? "fleche-chemin-retour" : "fleche-chemin"})`}
      />
      {data.libelle && !vue.loin ? (
        <EdgeLabelRenderer>
          <span
            className={classes("libelle-chemin", data.cache && "est-cache", data.propose && "est-propose", data.remonte && "remonte", touche && !data.propose && "est-entier", efface && !data.propose && "est-efface", vue.construit && !data.cache && !data.propose && "se-choisit nodrag nopan")}
            onClick={vue.construit && !data.cache && !data.propose ? () => vue.choisirChoix(id, source) : undefined}
            // En entier, le libellé garde sa largeur et gagne en hauteur : il ne recouvre pas ses voisins
            style={{ transform: `translate(-50%, -50%) translate(${data.libelle.x}px, ${data.libelle.y}px)`, width: data.libelle.l, ...(touche ? { minHeight: data.libelle.h } : { height: data.libelle.h }) }}
            title={touche ? undefined : data.remonte ? `Retour en arrière : ${data.texte}` : data.texte}
          >
            {/* Un retour en arrière porte une petite flèche vers le haut, posée sur le bord : elle ne prend pas la place du texte */}
            {data.remonte ? (
              <b className="libelle-chemin__retour" aria-hidden="true">
                <Icone nom="fleche-haut" />
              </b>
            ) : null}
            {data.cache ? <Icone nom="cle" /> : null}
            <span>{data.texte}</span>
          </span>
        </EdgeLabelRenderer>
      ) : null}
    </>
  );
}

const SORTES_DE_NOEUD = { scene: CarteScene, etiquette: Etiquette };
const SORTES_DE_TRAIT = { chemin: TraitDeChemin };
const borner = (v: number, min: number, max: number): number => Math.min(max, Math.max(min, v));
const arrondir = (z: number): number => Math.round(z * 100) / 100;

/** La largeur d'un texte, mesurée avec la police de l'outil. */
function mesureur(): Mesure {
  const toile = document.createElement("canvas").getContext("2d");
  const police = getComputedStyle(document.body).fontFamily;
  return (texte, sorte) => {
    if (!toile) return texte.length * 6.4;
    toile.font = `${sorte === "libelle" ? "600 11.5px" : "700 12px"} ${police}`;
    return toile.measureText(texte).width;
  };
}

/** Ce qu'on retient du schéma juste avant qu'il se redispose, pour que l'écran ne bouge pas (F03-AC54). */
type Fige = {
  /** La carte qui garde sa place : celle d'où part le geste, sinon la carte cliquée, sinon la plus proche du milieu */
  id: string | null;
  /** Où était chaque carte à l'écran */
  rects: Map<string, Boite>;
  /** Les places attendues : le schéma est redessiné quand React Flow les a prises */
  signature: string;
};
const signatureDe = (noeuds: { id: string; position: { x: number; y: number } }[]): string => noeuds.map((n) => `${n.id}:${n.position.x},${n.position.y}`).join(";");
const sansMouvement = (): boolean => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Posé dans le schéma : dès que React Flow a pris les nouvelles places, la vue se décale pour que
 * la carte de référence reste où elle était dans le cadre, et les autres glissent vers leur place.
 */
function GarderEnPlace({ figeRef, cadreRef }: { figeRef: RefObject<Fige | null>; cadreRef: RefObject<HTMLDivElement | null> }) {
  const dansLeSchema = useStore((etat) => etat.nodes);
  const flux = useReactFlow();
  useLayoutEffect(() => {
    const f = figeRef.current;
    const c = cadreRef.current;
    if (!f || !c || signatureDe(dansLeSchema) !== f.signature) return;
    figeRef.current = null;
    const places = new Map(
      [...c.querySelectorAll<HTMLElement>(".react-flow__node")].map((el) => {
        const r = el.getBoundingClientRect();
        return [el.dataset.id ?? "", { el, x: r.left, y: r.top }] as const;
      }),
    );
    const repere = f.id ? places.get(f.id) : undefined;
    const avant = f.id ? f.rects.get(f.id) : undefined;
    // De combien la carte de référence s'est déplacée à l'écran : la vue se décale d'autant, dans l'autre sens
    const ecart = repere && avant ? { x: repere.x - avant.x, y: repere.y - avant.y } : { x: 0, y: 0 };
    const vue = flux.getViewport();
    if (ecart.x || ecart.y) void flux.setViewport(decalerLaVue(vue, ecart));
    if (sansMouvement()) return;
    // Chaque carte part de là où elle était et glisse vers sa place ; une carte nouvelle apparaît
    const doux = { duration: 260, easing: "cubic-bezier(0.2, 0.7, 0.2, 1)" };
    let change = places.size !== f.rects.size;
    for (const [id, n] of places) {
      const vieux = f.rects.get(id);
      const dedans = n.el.firstElementChild;
      if (!dedans) continue;
      // Sa place une fois la vue décalée
      const [x, y] = [n.x - ecart.x, n.y - ecart.y];
      if (!vieux) {
        change = true;
        dedans.animate([{ opacity: 0, transform: "scale(0.94)" }, { opacity: 1, transform: "scale(1)" }], doux);
      } else if (Math.abs(vieux.x - x) + Math.abs(vieux.y - y) > 1) {
        change = true;
        dedans.animate([{ transform: `translate(${(vieux.x - x) / vue.zoom}px, ${(vieux.y - y) / vue.zoom}px)` }, { transform: "translate(0, 0)" }], doux);
      }
    }
    // Les flèches ne glissent pas : elles reviennent une fois les cartes presque arrivées. Rien n'a
    // bougé (un titre, une consigne) : rien ne clignote.
    if (!change) return;
    for (const calque of c.querySelectorAll(".react-flow__edges, .react-flow__edgelabel-renderer")) {
      calque.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200, delay: 120, fill: "backwards", easing: "ease-out" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dansLeSchema]);
  return null;
}

export default function Schema({
  chemins, regard, designee, montre, fois, tete, construire,
}: {
  chemins: Chemins; regard: ARegarder; designee?: string;
  /** La scène ou le choix que le parcours de « À regarder » désigne, et le nombre de pas faits */
  montre: string | null; fois: number;
  /** La ligne « À regarder », au-dessus du cadre ; rien quand il n'y a rien à regarder */
  tete: ReactNode;
  /** Les gestes de l'adulte (F03.1, « Construire dans Chemins ») ; sans eux, le schéma se lit seulement */
  construire?: Construire;
}) {
  const cadre = useRef<HTMLDivElement>(null);
  const plan = useRef<HTMLDivElement>(null);
  const espace = useRef<HTMLDivElement>(null);
  const trait = useRef<SVGSVGElement>(null);
  const boutonAjouter = useRef<HTMLButtonElement>(null);
  // Le geste en cours : la bulle ouverte, d'où elle l'a été, et la carte que vise le lien qu'on tire
  const [geste, setGeste] = useState<(Geste & { depuis: "carte" | "panneau"; auClavier?: boolean }) | null>(null);
  const [tire, setTire] = useState<{ de: string; sur: string | null } | null>(null);
  const [designe, setDesigne] = useState<string | null>(null);
  const vientDeTirer = useRef(false);
  const fige = useRef<Fige | null>(null);
  const aGarder = useRef<string | null>(null);
  // Ce que la disposition, calculée plus tard, lit de l'écran tel qu'il est à ce moment-là
  const courantRef = useRef<{ noeuds: (NoeudScene | NoeudEtiquette)[]; dessine: boolean }>({ noeuds: [], dessine: false });
  const [disposition, setDisposition] = useState<Disposition | null>(null);
  // Où le plan se place dans la page : d'un bord à l'autre, et de son haut jusqu'au bas de la fenêtre
  const [place, setPlace] = useState({ gauche: 0, largeur: 0, haut: 0 });
  const [noeuds, setNoeuds] = useState<(NoeudScene | NoeudEtiquette)[]>([]);
  const [survolee, setSurvolee] = useState<string | null>(null);
  // Le schéma ne se montre qu'une fois à sa place et à sa taille
  const [dessine, setDessine] = useState(false);
  // La vue du schéma dans son cadre : React Flow la tient, on la tire ; ici, sa taille et celle du cadre
  const flux = useRef<ReactFlowInstance<NoeudScene | NoeudEtiquette, Trait> | null>(null);
  const [fluxPret, setFluxPret] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [taille, setTaille] = useState<Cadre>({ l: 0, h: 0 });
  const placee = useRef(false);

  // ——— Le bloc de scènes (F13.7) : l'état du panneau et la proposition, gardés tant que la page reste ouverte ———
  const aides = useAidesIa();
  const services = construire?.bloc && aides.proposer ? construire.bloc : undefined;
  const [bloc, setBlocBrut] = useEtatDuBloc(services?.chapitreId, !!services?.auDepart);
  const blocOuvert = !!services && bloc.ouvert;
  const [ouverteDuBloc, setOuverteDuBloc] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<Set<string>>(new Set());
  // La proposition qui change redessine le schéma : la scène d'origine garde sa place à l'écran (F03-AC54)
  const aCadrer = useRef(false);
  const setBloc: typeof setBlocBrut = (suite) =>
    setBlocBrut((avant) => {
      const e = typeof suite === "function" ? suite(avant) : suite;
      if (e.proposition !== avant.proposition) {
        aGarder.current = e.origine ?? avant.origine;
        aCadrer.current = e.proposition !== null;
      }
      // Le panneau s'ouvre sur une proposition gardée : elle revient en vue
      if (e.ouvert && !avant.ouvert && e.proposition) aCadrer.current = true;
      return e;
    });
  const vus = useMemo(() => (blocOuvert ? cheminsAvecLeBloc(chemins, bloc.proposition) : chemins), [blocOuvert, chemins, bloc.proposition]);

  // La disposition se calcule une fois la police de l'outil chargée : les libellés se mesurent avec elle
  useEffect(() => {
    let vivant = true;
    void document.fonts.ready.then(() => {
      if (!vivant) return;
      const d = disposer(vus, regard.marques, mesureur());
      const parId = new Map(vus.noeuds.map((n) => [n.id, n]));
      const etat = courantRef.current;
      const choisie = etat.noeuds.find((n) => n.selected)?.id ?? null;
      const suite = d.elements.map((e) => {
        const p = d.places.get(e.id)!;
        const commun = { id: e.id, position: { x: p.x, y: p.y }, width: p.l, height: p.h, draggable: false, connectable: false, deletable: false };
        if (e.sorte !== "scene") return { ...commun, type: "etiquette" as const, data: { element: e }, selectable: false, focusable: false };
        const n = parId.get(e.id)!;
        // Une scène proposée ne se choisit pas comme les autres : elle ouvre sa ligne dans le panneau du bloc
        if (n.propose) return { ...commun, type: "scene" as const, selectable: false, focusable: false, data: { ...n, marques: [], sansSuite: false } };
        return {
          ...commun, type: "scene" as const, selected: e.id === choisie,
          data: { ...n, marques: e.marques.map((m, i) => (i ? MOT_DE_MARQUE[m].toLocaleLowerCase("fr") : MOT_DE_MARQUE[m])), sansSuite: e.marques.includes("sans-suite") },
          ariaLabel: n.titre ?? "Scène sans titre",
        };
      });
      // Le schéma était déjà dessiné : il se redispose sans que l'écran bouge. On retient où est
      // chaque carte, et la carte de référence restera au même point du cadre (F03-AC54).
      const c = cadre.current;
      if (etat.dessine && c) {
        const rects = new Map(
          [...c.querySelectorAll<HTMLElement>(".react-flow__node")].map((el) => {
            const r = el.getBoundingClientRect();
            return [el.dataset.id ?? "", { x: r.left, y: r.top, l: r.width, h: r.height }] as const;
          }),
        );
        const scenes = new Map([...rects].filter(([id]) => parId.has(id) && d.places.has(id)));
        const bords = c.getBoundingClientRect();
        const vu = { x: bords.left, y: bords.top, l: bords.width, h: bords.height };
        const voulue = aGarder.current && scenes.has(aGarder.current) ? aGarder.current : null;
        fige.current = { id: voulue ?? carteDeReference(scenes, choisie, vu), rects, signature: signatureDe(suite) };
      }
      aGarder.current = null;
      setDisposition(d);
      setNoeuds(suite);
    });
    return () => {
      vivant = false;
    };
  }, [vus, regard]);

  const traits = useMemo<Trait[]>(() => {
    const parId = new Map(vus.liens.map((l) => [l.id, l]));
    return (disposition?.traits ?? []).map((t) => {
      const lien = parId.get(t.id);
      return {
        id: t.id, source: t.de, target: t.vers, type: "chemin" as const, focusable: false, selectable: false, reconnectable: false,
        data: { d: t.d, libelle: t.libelle, texte: lien ? texteDuLibelle(lien) : "", cache: lien?.cache ?? false, remonte: t.remonte, propose: lien?.propose },
      };
    });
  }, [disposition, vus.liens]);

  // Le plan va d'un bord à l'autre de la page — la fenêtre moins la colonne de navigation de l'adulte
  // (F06.5) — et de son haut jusqu'au bas de la fenêtre : la page ne défile plus dans « Chemins »
  useLayoutEffect(() => {
    const page = plan.current?.closest("main");
    const mesurer = () => {
      const p = plan.current;
      const parent = p?.parentElement;
      if (!p || !parent) return;
      const bord = page ? page.getBoundingClientRect().left : 0;
      const suite = {
        gauche: Math.round(parent.getBoundingClientRect().left - bord),
        largeur: page ? page.clientWidth : document.documentElement.clientWidth,
        haut: Math.round(p.getBoundingClientRect().top + window.scrollY),
      };
      setPlace((avant) => (avant.gauche === suite.gauche && avant.largeur === suite.largeur && avant.haut === suite.haut ? avant : suite));
    };
    mesurer();
    window.addEventListener("resize", mesurer);
    const suivi = page ? new ResizeObserver(mesurer) : null;
    if (page) suivi?.observe(page);
    return () => {
      window.removeEventListener("resize", mesurer);
      suivi?.disconnect();
    };
  }, []);

  const l = disposition?.largeur ?? 0;
  const h = disposition?.hauteur ?? 0;
  /** La taille lisible : le schéma tient dans la largeur du cadre, sans descendre sous une taille où les titres se lisent */
  const lisible = tailleLisible(l, taille, MARGE, { min: ZOOM.lisible, max: ZOOM.max });
  const loin = zoom < LOIN;
  const pret = disposition !== null && noeuds.length > 0;
  useEffect(() => {
    courantRef.current = { noeuds, dessine: dessine && disposition !== null };
  });

  // ——— La vue : ce qui la déplace sans la main de l'utilisateur glisse, sauf pour qui a demandé moins de mouvement ———
  // Le but vers lequel la vue glisse : il tient le temps que le cadre finisse de changer de largeur
  const but = useRef<{ boite: Boite; hauteur: number; zoom: number } | null>(null);
  const finDuBut = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scenePourLaTaille = useRef<string | null>(null);
  const cadreIci = (): Cadre | null => {
    const r = cadre.current?.getBoundingClientRect();
    return r && r.width && r.height ? { l: r.width, h: r.height } : null;
  };
  // En ligne droite : sans cela, la vue recule puis revient pendant le trajet, comme un survol, et la taille bouge
  const allerA = (vue: VueDuSchema, duree = GLISSE) => void flux.current?.setViewport(vue, { duration: sansMouvement() ? 0 : duree, interpolate: "linear" });
  // Changer de taille garde au milieu du cadre ce qu'on regardait
  const changer = (suite: number) => {
    const cad = cadreIci();
    if (!flux.current || !cad) return;
    but.current = null;
    const z = arrondir(borner(suite, ZOOM.min, ZOOM.max));
    // Une scène est ouverte dans l'espace de travail : c'est autour d'elle que la taille change, elle reste en vue
    const ouverte = scenePourLaTaille.current ? disposition?.places.get(scenePourLaTaille.current) : undefined;
    allerA(ouverte ? centrerSur(ouverte, cad, z, HAUTEUR_DE_LA_SCENE) : changerDeTaille(flux.current.getViewport(), cad, z), 180);
  };
  const toutVoir = () => {
    const cad = cadreIci();
    but.current = null;
    if (cad && l && h) allerA(vueDEnsemble({ l, h }, cad, MARGE, { min: ZOOM.toutVoir, max: ZOOM.max }));
  };

  // À l'ouverture : la taille lisible, le schéma au milieu de la largeur ; ou la scène où mène le
  // choix qu'on vient de suivre depuis un autre chapitre, au milieu du cadre (F03-AC25)
  const placer = useEffectEvent(() => {
    const cad = cadreIci();
    if (!flux.current || !disposition || !cad || placee.current) return;
    const z = tailleLisible(disposition.largeur, cad, MARGE, { min: ZOOM.lisible, max: ZOOM.max });
    const visee = designee ? disposition.places.get(designee) : undefined;
    void flux.current.setViewport(visee ? centrerSur(visee, cad, z) : vueDeDepart({ l: disposition.largeur, h: disposition.hauteur }, cad, MARGE, z));
    placee.current = true;
    setZoom(z);
    setTimeout(() => setDessine(true), 30);
  });
  useEffect(() => {
    if (pret && fluxPret) placer();
  }, [pret, fluxPret]);

  const glisser = useEffectEvent(() => {
    const cad = cadreIci();
    if (!but.current || !flux.current || !cad) return;
    const vers = centrerSur(but.current.boite, cad, but.current.zoom, but.current.hauteur);
    // Sans montrer de vide pour rien : la première scène d'un chapitre ne descend pas au milieu du cadre
    allerA(disposition ? sansVideInutile(vers, { l: disposition.largeur, h: disposition.hauteur }, cad, MARGE) : vers);
  });
  const viser = useEffectEvent((boite: Boite, hauteur: number) => {
    // La taille est celle qu'on a en partant : un glissement repris en route ne la change pas
    but.current = { boite, hauteur, zoom: but.current?.zoom ?? flux.current?.getZoom() ?? 1 };
    if (finDuBut.current) clearTimeout(finDuBut.current);
    finDuBut.current = setTimeout(() => (but.current = null), GLISSE + 300);
    glisser();
  });
  // Le cadre change de place ou de largeur (la colonne se replie, l'espace de travail s'ouvre) : les
  // cartes restent d'abord où elles étaient à l'écran, puis la vue glisse vers son but. Une seule fois.
  const dernier = useRef<{ x: number; y: number } | null>(null);
  useLayoutEffect(() => {
    const c = cadre.current;
    if (!c) return;
    const suivre = () => {
      const r = c.getBoundingClientRect();
      const ici = { x: r.left + window.scrollX, y: r.top + window.scrollY };
      const avant = dernier.current;
      dernier.current = ici;
      setTaille((t) => (t.l === r.width && t.h === r.height ? t : { l: r.width, h: r.height }));
      if (!avant || !flux.current || !placee.current) return;
      if (avant.x !== ici.x || avant.y !== ici.y) void flux.current.setViewport(suivreLeCadre(flux.current.getViewport(), avant, ici));
      glisser();
    };
    suivre();
    const suivi = new ResizeObserver(suivre);
    suivi.observe(c);
    return () => suivi.disconnect();
  }, []);

  const changerNoeuds = useCallback((changements: NodeChange<NoeudScene | NoeudEtiquette>[]) => setNoeuds((avant) => applyNodeChanges(changements, avant)), []);
  const choisie = noeuds.find((n) => n.selected)?.id ?? null;
  const voisines = useMemo(() => new Set(choisie ? traits.flatMap((t) => (t.source === choisie ? [t.target] : t.target === choisie ? [t.source] : [])) : []), [choisie, traits]);
  const choisir = useCallback((id: string | null) => setNoeuds((avant) => avant.map((n) => (!!n.selected === (n.id === id) ? n : { ...n, selected: n.id === id }))), []);

  // ——— Deux états (F03.1, « Chemins en atelier ») : le plan ; le travail, dès qu'une scène est cliquée
  // ou que le bloc est demandé. La colonne de navigation se replie pour ce temps-là, et revient comme elle était.
  const sceneChoisie = construire && choisie ? chemins.noeuds.find((n) => n.id === choisie) : undefined;
  const travail = !!sceneChoisie || blocOuvert;
  useEffect(() => {
    scenePourLaTaille.current = sceneChoisie && !blocOuvert ? sceneChoisie.id : null;
  });
  useEffect(() => {
    replierLaColonnePourUnTemps(travail);
    return () => replierLaColonnePourUnTemps(false);
  }, [travail]);
  // Le passage d'un état à l'autre glisse, une seule fois : ce qui était au milieu du cadre y reste, dans
  // le cadre rétréci comme dans le cadre élargi. Une scène cliquée a son propre but : elle vient au milieu.
  const etaitAuTravail = useRef(false);
  useLayoutEffect(() => {
    const avant = etaitAuTravail.current;
    etaitAuTravail.current = travail;
    // Ici, `taille` est encore celle du cadre d'avant : il n'a pas fini de changer de largeur
    if (avant === travail || !flux.current || !placee.current || !taille.l) return;
    if (travail && sceneChoisie && !blocOuvert) return;
    const v = flux.current.getViewport();
    viser({ x: (taille.l / 2 - v.x) / v.zoom, y: (taille.h / 2 - v.y) / v.zoom, l: 0, h: 0 }, 0.5);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [travail]);
  // La scène cliquée vient au milieu du schéma, un peu au-dessus : la vue glisse jusqu'à elle. Pas
  // quand c'est un geste qui l'a choisie (le « + » d'une autre carte) : sa bulle s'ouvre où l'on a cliqué.
  const sansGlisser = useRef(false);
  const dejaChoisie = useRef<string | null>(null);
  useEffect(() => {
    const avant = dejaChoisie.current;
    dejaChoisie.current = choisie;
    if (!construire || !choisie || choisie === avant) return;
    if (sansGlisser.current) {
      sansGlisser.current = false;
      return;
    }
    const p = disposition?.places.get(choisie);
    if (p) viser(p, HAUTEUR_DE_LA_SCENE);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [choisie]);

  // La scène où mène un choix suivi sans quitter la page vient au milieu du cadre (F03-AC25)
  useEffect(() => {
    const p = designee && placee.current ? disposition?.places.get(designee) : undefined;
    if (p) viser(p, 0.5);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [designee]);

  // Ce que « À regarder » désigne est choisi comme par un clic, et vient au milieu du cadre.
  // Pour un choix : la scène d'où il part est choisie, et l'on se place entre elle et le bout de sa flèche.
  const montrer = useEffectEvent((id: string) => {
    if (!disposition) return;
    const fleche = disposition.traits.find((t) => t.id === id);
    const carte = fleche ? fleche.de : id;
    const boite = englober([disposition.places.get(carte), fleche ? disposition.places.get(fleche.vers) : undefined].filter((p) => p !== undefined));
    if (!boite) return;
    if (construire && choisie !== carte) sansGlisser.current = true;
    choisir(carte);
    viser({ x: boite.x + boite.l / 2, y: boite.y + boite.h / 2, l: 0, h: 0 }, 0.5);
  });
  useEffect(() => {
    if (!pret || !montre) return;
    const attente = setTimeout(() => montrer(montre), 0);
    return () => clearTimeout(attente);
  }, [pret, montre, fois]);

  // ——— Construire (F03.1) : les gestes de l'adulte, à une taille où les cartes se lisent ; pas pendant un bloc ———
  const construit = !!construire && !loin && !blocOuvert;
  const suivreLaSource = useCallback(
    // Un panneau est ouvert sur une autre scène : il passe à celle d'où part le geste, dont la suite ne reste pas en retrait
    (id: string) => {
      if (!courantRef.current.noeuds.some((n) => n.selected && n.id !== id)) return;
      sansGlisser.current = true;
      choisir(id);
    },
    [choisir],
  );
  const ouvrirAjout = useCallback(
    (id: string, auClavier: boolean) => {
      // Le clic qui suit un lien tiré puis relâché sur son propre « + » n'ouvre rien
      if (vientDeTirer.current) return;
      suivreLaSource(id);
      setGeste((avant) => (avant?.sorte === "ajout" && avant.de === id && avant.depuis === "carte" ? null : { sorte: "ajout", de: id, depuis: "carte", auClavier }));
    },
    [suivreLaSource],
  );

  const carteSous = (x: number, y: number, sauf: string): string | null => {
    for (const el of document.elementsFromPoint(x, y)) {
      const carte = el.closest<HTMLElement>(".carte-chemin[data-chemin]");
      if (carte && cadre.current?.contains(carte)) return carte.dataset.chemin === sauf ? null : (carte.dataset.chemin ?? null);
    }
    return null;
  };
  /**
   * Tirer un lien depuis le « + » d'une carte (F03-AC53). Tant que le pointeur n'a pas bougé,
   * c'est un clic. Près d'un bord du cadre, la vue se décale : la scène visée peut être plus
   * loin que ce qu'on voit. Lâché sur une autre carte du chapitre, le lien demande son libellé.
   */
  const commencerLien = useCallback((de: string, e: PointerEvent<HTMLButtonElement>) => {
    if (e.button !== 0) return;
    const depart = { x: e.clientX, y: e.clientY };
    let pointeur = depart;
    let actif = false;
    let boucle = 0;
    let sur: string | null = null;
    const dessiner = () => {
      const c = cadre.current;
      const svg = trait.current;
      const origine = c?.querySelector<HTMLElement>(`.carte-chemin[data-chemin="${CSS.escape(de)}"]`)?.getBoundingClientRect();
      if (!c || !svg || !origine) return;
      // Près d'un bord du cadre, la vue se décale : la scène visée peut être hors de ce qu'on voit
      const bords = c.getBoundingClientRect();
      const dy = pointeur.y < bords.top + 60 ? Math.min(22, (bords.top + 60 - pointeur.y) / 3 + 2) : pointeur.y > bords.bottom - 60 ? -Math.min(22, (pointeur.y - bords.bottom + 60) / 3 + 2) : 0;
      const dx = pointeur.x < bords.left + 50 ? 12 : pointeur.x > bords.right - 50 ? -12 : 0;
      if ((dx || dy) && flux.current) {
        const v = flux.current.getViewport();
        void flux.current.setViewport({ x: v.x + dx, y: v.y + dy, zoom: v.zoom });
      }
      const visee = carteSous(pointeur.x, pointeur.y, de);
      if (visee !== sur) {
        sur = visee;
        setTire({ de, sur });
      }
      // Le trait part du bas de la carte ; il s'accroche au haut de la carte visée
      const arrivee = sur ? c.querySelector<HTMLElement>(`.carte-chemin[data-chemin="${CSS.escape(sur)}"]`)?.getBoundingClientRect() : undefined;
      const [x1, y1] = [origine.left + origine.width / 2, origine.bottom];
      const [x2, y2] = arrivee ? [arrivee.left + arrivee.width / 2, arrivee.top - 3] : [pointeur.x, pointeur.y];
      const pli = Math.max(24, Math.abs(y2 - y1) / 2);
      svg.querySelector("path")?.setAttribute("d", `M${x1},${y1} C${x1},${y1 + pli} ${x2},${y2 - pli} ${x2},${y2}`);
      boucle = requestAnimationFrame(dessiner);
    };
    const finir = (fin: globalThis.PointerEvent | null) => {
      window.removeEventListener("pointermove", bouger);
      window.removeEventListener("pointerup", lacher);
      window.removeEventListener("pointercancel", annuler);
      document.removeEventListener("keydown", touche, true);
      cancelAnimationFrame(boucle);
      if (!actif) return;
      if (trait.current) trait.current.style.display = "none";
      setTire(null);
      vientDeTirer.current = true;
      setTimeout(() => (vientDeTirer.current = false), 0);
      const vers = fin ? carteSous(fin.clientX, fin.clientY, de) : null;
      if (vers) setGeste({ sorte: "lien", de, vers, depuis: "carte" });
    };
    const lacher = (fin: globalThis.PointerEvent) => finir(fin);
    const annuler = () => finir(null);
    const touche = (clavier: KeyboardEvent) => {
      if (clavier.key !== "Escape") return;
      clavier.stopPropagation();
      finir(null);
    };
    const bouger = (suite: globalThis.PointerEvent) => {
      pointeur = { x: suite.clientX, y: suite.clientY };
      if (actif || Math.hypot(pointeur.x - depart.x, pointeur.y - depart.y) < 6) return;
      actif = true;
      setGeste(null);
      suivreLaSource(de);
      setTire({ de, sur: null });
      if (trait.current) trait.current.style.display = "block";
      boucle = requestAnimationFrame(dessiner);
    };
    window.addEventListener("pointermove", bouger);
    window.addEventListener("pointerup", lacher);
    window.addEventListener("pointercancel", annuler);
    document.addEventListener("keydown", touche, true);
  }, [suivreLaSource]);
  // Le lien qu'on vient de tirer reste dessiné, en pointillé, tant que la bulle demande son libellé
  const lienEnAttente = geste?.sorte === "lien" ? `${geste.de}>${geste.vers}` : null;
  useEffect(() => {
    const svg = trait.current;
    const c = cadre.current;
    if (!lienEnAttente || !svg || !c) return;
    const [de, vers] = lienEnAttente.split(">");
    let boucle = 0;
    const dessiner = () => {
      const a = c.querySelector<HTMLElement>(`.carte-chemin[data-chemin="${CSS.escape(de)}"]`)?.getBoundingClientRect();
      const b = c.querySelector<HTMLElement>(`.carte-chemin[data-chemin="${CSS.escape(vers)}"]`)?.getBoundingClientRect();
      if (a && b) {
        const [x1, y1, x2, y2] = [a.left + a.width / 2, a.bottom, b.left + b.width / 2, b.top - 3];
        const pli = Math.max(24, Math.abs(y2 - y1) / 2);
        svg.querySelector("path")?.setAttribute("d", `M${x1},${y1} C${x1},${y1 + pli} ${x2},${y2 - pli} ${x2},${y2}`);
      }
      boucle = requestAnimationFrame(dessiner);
    };
    svg.style.display = "block";
    dessiner();
    return () => {
      cancelAnimationFrame(boucle);
      svg.style.display = "none";
    };
  }, [lienEnAttente]);
  const choisirChoix = useCallback(
    (lienId: string, de: string) => {
      choisir(de);
      setDesigne(lienId);
    },
    [choisir],
  );
  // La ligne du choix désigné se montre un instant dans le panneau
  useEffect(() => {
    if (!designe) return;
    const ligne = espace.current?.querySelector<HTMLElement>(`[data-choix="${CSS.escape(designe)}"]`);
    ligne?.scrollIntoView({ block: "nearest" });
    const fin = setTimeout(() => setDesigne(null), 1600);
    return () => clearTimeout(fin);
  }, [designe]);

  // Le bloc ouvert : une carte cliquée devient la scène d'où il part, tant que rien n'est proposé
  useEffect(() => {
    if (!blocOuvert || !choisie || bloc.proposition || choisie === bloc.origine) return;
    setBloc((e) => ({ ...e, origine: choisie }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blocOuvert, choisie]);

  // Échap ramène au plan : il referme le bloc, sinon le panneau de la scène. Une bulle ou un dialogue
  // ouverts prennent la touche avant lui.
  const fermerLeBloc = () => {
    setOuverteDuBloc(null);
    setBloc((e) => ({ ...e, ouvert: false }));
    if (!chemins.noeuds.length) services?.quitter?.();
  };
  const revenirAuPlan = useEffectEvent(() => {
    if (blocOuvert) fermerLeBloc();
    else choisir(null);
  });
  const gesteOuvert = geste !== null || tire !== null;
  useEffect(() => {
    if (!travail || gesteOuvert) return;
    const touche = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || e.defaultPrevented || document.querySelector("dialog[open], [aria-modal='true']")) return;
      revenirAuPlan();
    };
    document.addEventListener("keydown", touche);
    return () => document.removeEventListener("keydown", touche);
  }, [travail, gesteOuvert]);


  const source = geste?.de ?? tire?.de ?? (blocOuvert ? bloc.origine : null);
  const cible = (geste?.sorte === "lien" ? geste.vers : null) ?? tire?.sur ?? null;
  const enTirant = tire !== null;
  const vue = useMemo(
    // Pendant qu'on tire un lien, la carte survolée ne montre que son cadre : ni ses flèches, ni « Ouvrir »
    () => ({
      // Pendant un bloc, la vue ne met en retrait rien de ce qu'il dessine : l'origine et ses scènes restent nettes
      active: blocOuvert ? null : (choisie ?? (enTirant ? null : survolee)), choisie: blocOuvert ? null : choisie, survolee: enTirant ? null : survolee,
      voisines, loin, designee, montre, construit, source, cible, ouvrirAjout, commencerLien, choisirChoix, ouverteDuBloc, ouvrirDuBloc: setOuverteDuBloc,
      candidates: blocOuvert && !bloc.origine ? candidates : new Set<string>(),
    }),
    [choisie, survolee, enTirant, voisines, loin, designee, montre, construit, source, cible, ouvrirAjout, commencerLien, choisirChoix, blocOuvert, ouverteDuBloc, candidates, bloc.origine],
  );
  // ——— Le bloc ajouté (F13-AC38) : la proposition reste dessinée jusqu'à ce que ses scènes soient dans le
  // chapitre, puis le pointillé laisse place aux vraies cartes, la scène d'origine à la même place ———
  const attendus = useRef<string[] | null>(null);
  const finirLeBloc = () => {
    if (resteAReprendre(bloc.proposition?.reste)) setCandidates(new Set(attendus.current ?? []));
    attendus.current = null;
    setOuverteDuBloc(null);
    // Avec un reste à construire, on clique la scène d'où continuer : aucune n'est choisie d'avance
    if (resteAReprendre(bloc.proposition?.reste)) choisir(null);
    setBloc((e) => {
      // Une demande trop large a laissé un reste : il revient dans le champ, on clique la scène d'où continuer (F13-AC40)
      const reste = resteAReprendre(e.proposition?.reste);
      return reste
        ? { ...e, proposition: null, demandee: "", prendre: false, reponses: {}, origine: null, demande: reste }
        : { ...e, proposition: null, demandee: "", prendre: false, reponses: {}, demande: "", ouvert: false };
    });
  };
  const ajouterLeBloc: NonNullable<Construire["bloc"]>["ajouter"] = async (p, prendre) => {
    if (!services) return { ok: false, erreur: "" };
    const fait = await services.ajouter(p, prendre);
    if (!fait.ok) return fait;
    attendus.current = fait.scenes;
    if (fait.scenes.every((id) => chemins.noeuds.some((n) => n.id === id))) finirLeBloc();
    return fait;
  };
  useEffect(() => {
    const a = attendus.current;
    if (a && a.every((id) => chemins.noeuds.some((n) => n.id === id))) finirLeBloc();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chemins]);


  // ——— La proposition dessinée tient entière dans le cadre, à gauche de l'espace de travail (F13.7) :
  // la vue bouge juste assez ; si le bloc est plus grand que le cadre, le schéma se réduit, sans
  // descendre sous la taille où les libellés se lisent ———
  useEffect(() => {
    if (!aCadrer.current || !blocOuvert || !disposition) return;
    // Après que la scène d'origine a été tenue en place et que les cartes ont glissé (F03-AC54)
    const attente = setTimeout(() => {
      const cad = cadreIci();
      const propose = bloc.proposition;
      if (!flux.current || !cad || !propose) return;
      // Le bloc entier : ses scènes, la scène d'origine, et les scènes du chapitre qu'un de ses chemins rejoint
      const rejointes = propose.choix.map((x) => x.vers).filter((v) => !propose.scenes.some((sc) => sc.cle === v));
      const boite = englober([...propose.scenes.map((sc) => idPropose(sc.cle)), bloc.origine, ...rejointes].flatMap((id) => (id ? [disposition.places.get(id)] : [])).filter((p) => p !== undefined));
      if (!boite) return;
      aCadrer.current = false;
      const marge = { x: 24, y: 28 };
      const vue = flux.current.getViewport();
      // Les boutons de taille et la mini-carte occupent le coin bas droit : le bloc se cadre au-dessus d'eux quand il y tient
      const coin = cadre.current?.querySelector(".chemins__coin")?.getBoundingClientRect().height ?? 0;
      const auDessus = { l: cad.l, h: cad.h - coin - 14 };
      const ou = coin && boite.h * vue.zoom + 2 * marge.y <= auDessus.h ? auDessus : cad;
      const z = tailleQuiMontre(boite, ou, vue.zoom, marge, LOIN);
      allerA(montrerLaBoite(z === vue.zoom ? vue : changerDeTaille(vue, cad, z), boite, ou, marge));
    }, GLISSE);
    return () => clearTimeout(attente);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [noeuds, blocOuvert, bloc.origine, taille.l]);

  /** Ce près de quoi la bulle se pose : la carte d'où l'on part, celle où le lien arrive, ou le bouton du panneau */
  const repereDuGeste = (): globalThis.Element | null => {
    if (!geste) return null;
    // Depuis le panneau aussi, la bulle se pose près de la carte, dans le schéma : elle ne couvre pas « Ses choix »
    return cadre.current?.querySelector(`.carte-chemin[data-chemin="${CSS.escape(geste.sorte === "lien" ? geste.vers : geste.de)}"]`) ?? (geste.depuis === "panneau" ? boutonAjouter.current : null);
  };
  const fermerGeste = () => {
    const avant = geste;
    setGeste(null);
    // Au clavier, le curseur revient d'où l'on est parti : on enchaîne un second choix. À la souris, le « + » ne reste pas allumé
    requestAnimationFrame(() => {
      const retour = avant?.depuis === "panneau" ? boutonAjouter.current : avant?.auClavier ? cadre.current?.querySelector<HTMLElement>(`.plus-chemin[data-de="${CSS.escape(avant.de)}"]`) : null;
      if (retour) retour.focus({ preventScroll: true });
      else if (document.activeElement instanceof HTMLElement && document.activeElement !== document.body) document.activeElement.blur();
    });
  };

  const ouvrirLeBloc = (origine: string | null) => {
    setGeste(null);
    // La proposition gardée ne revient que pour la scène d'où elle part ; la demande, elle, reste
    setBloc((e) => ({ ...e, ouvert: true, origine, ...(origine && e.origine === origine ? {} : { proposition: null, demandee: "", prendre: false, reponses: {} }) }));
  };

  return (
    <>
      {tete ? <div className="chemins__tete">{tete}</div> : null}
      <div
        className="chemins__plan"
        ref={plan}
        style={{ ...(place.largeur ? { width: place.largeur, marginLeft: -place.gauche } : {}), ...(place.haut ? { "--haut-du-plan": `${place.haut}px` } : {}) } as CSSProperties}
        data-travail={travail ? "" : undefined}
      >
        <div className="chemins__cadre" ref={cadre} style={{ "--zoom-chemins": zoom } as CSSProperties} data-zoom={zoom} data-loin={loin || undefined} data-tire={enTirant || undefined}>
          <svg className="chemins__fleches" width="0" height="0" aria-hidden="true">
            <defs>
              {["fleche-chemin", "fleche-chemin-retour", "fleche-chemin-active", "fleche-chemin-proposee"].map((id) => (
                <marker key={id} id={id} className={id} viewBox="0 0 10 10" refX="9.2" refY="5" markerWidth="12" markerHeight="12" markerUnits="userSpaceOnUse" orient="auto">
                  <path d="M0.6,0.8 L9.6,5 L0.6,9.2 L2.8,5 z" fill="currentColor" />
                </marker>
              ))}
            </defs>
          </svg>
          {pret ? (
            <div className="chemins__toile" data-dessine={dessine || undefined}>
              <Vue.Provider value={vue}>
                <ReactFlow
                  nodes={noeuds}
                  edges={traits}
                  nodeTypes={SORTES_DE_NOEUD}
                  edgeTypes={SORTES_DE_TRAIT}
                  onNodesChange={changerNoeuds}
                  onInit={(instance) => {
                    flux.current = instance;
                    placee.current = false;
                    setFluxPret((n) => n + 1);
                  }}
                  onNodeMouseEnter={(_, n) => setSurvolee(n.type === "scene" ? n.id : null)}
                  onNodeMouseLeave={() => setSurvolee(null)}
                  onMove={(_, v) => setZoom((z) => (Math.abs(z - v.zoom) < 0.005 ? z : arrondir(v.zoom)))}
                  // On ne perd pas le schéma en le tirant : il en reste toujours un morceau dans le cadre
                  onMoveEnd={(e, v) => {
                    const cad = cadreIci();
                    if (!e || !cad || !l || !h) return;
                    const retenue = retenirLeSchema(v, { l, h }, cad);
                    if (retenue !== v) allerA(retenue, 220);
                  }}
                  defaultViewport={{ x: 0, y: MARGE, zoom: 1 }}
                  minZoom={ZOOM.toutVoir}
                  maxZoom={ZOOM.max}
                  // Un cadre qu'on tire (F03.1, « Chemins en atelier ») : le fond se tire, la molette et deux
                  // doigts déplacent, Ctrl + molette et le pincement changent la taille. Les cartes, elles, ne
                  // se déplacent pas : leur place est calculée.
                  panOnDrag
                  panOnScroll
                  zoomOnScroll={false}
                  zoomOnPinch
                  zoomOnDoubleClick={false}
                  paneClickDistance={4}
                  nodesDraggable={false}
                  nodesConnectable={false}
                  edgesFocusable={false}
                  edgesReconnectable={false}
                  // Au clavier, la carte qui prend le curseur vient dans le cadre
                  selectionOnDrag={false}
                  selectionKeyCode={null}
                  multiSelectionKeyCode={null}
                  deleteKeyCode={null}
                  // Le nom de la bibliothèque, dans un coin, comme ses auteurs le demandent (F14-AC35)
                  proOptions={{ hideAttribution: false }}
                  attributionPosition="bottom-left"
                  ariaLabelConfig={{
                    "node.a11yDescription.default": construire
                      ? "Entrée ou Espace : ouvrir le titre, la consigne et les choix de cette scène. Échap : revenir au plan."
                      : "Entrée ou Espace : montrer les chemins de cette scène. Échap : ne plus les montrer.",
                    "node.a11yDescription.keyboardDisabled": "Entrée ou Espace : montrer les chemins de cette scène. Échap : ne plus les montrer.",
                  }}
                >
                  <GarderEnPlace figeRef={fige} cadreRef={cadre} />
                  {/* Les commandes sur le cadre, comme sur une carte routière : la taille en bas à droite, au-dessus de la mini-carte */}
                  <div className="chemins__coin nopan nodrag nowheel">
                    <div className="chemins__taille" role="group" aria-label="Taille du schéma">
                      {zoom < lisible - 0.045 ? (
                        <button type="button" className="btn btn--petit" onClick={() => changer(lisible)}>
                          Taille lisible
                        </button>
                      ) : (
                        <button type="button" className="btn btn--petit" onClick={toutVoir}>
                          Tout voir
                        </button>
                      )}
                      <button type="button" className="btn btn--petit" aria-label="Réduire" disabled={zoom <= ZOOM.min} onClick={() => changer(zoom - ZOOM.pas)}>
                        −
                      </button>
                      <button type="button" className="btn btn--petit" aria-label="Agrandir" disabled={zoom >= ZOOM.max} onClick={() => changer(zoom + ZOOM.pas)}>
                        +
                      </button>
                    </div>
                    {/* La mini-carte, au plan, dès que le schéma dépasse du cadre : où l'on est, et un clic pour s'y rendre. Pas
                        au travail ni dans un cadre étroit : elle couvrirait les cartes voisines de la scène ouverte */}
                    {disposition && !travail && taille.l >= MINI_CARTE_DES && (l * zoom + MARGE > taille.l || h * zoom + MARGE > taille.h) ? <MiniCarte disposition={disposition} regard={regard} noeuds={chemins.noeuds} /> : null}
                  </div>
                </ReactFlow>
              </Vue.Provider>
            </div>
          ) : vus.noeuds.length === 0 ? (
            // Un chapitre encore vide, le bloc ouvert : sa proposition se dessinera ici (F13.7)
            <p className="chemins__attente chemins__attente--bloc">La proposition de l’IA se dessinera ici.</p>
          ) : (
            <p className="chemins__attente">Les chemins se dessinent…</p>
          )}
          {/* Le bloc de scènes (F13.7), en vue dès l'état « plan », en haut à droite du cadre : on clique ensuite la scène
              d'où continuer. En état « travail », le panneau de la scène porte le même bouton. */}
          {services && !travail && vus.noeuds.length ? (
            <button type="button" className="btn btn--petit btn--ia chemins__ia" onClick={() => ouvrirLeBloc(null)}>
              <Icone nom="ia" />
              Construire avec l’IA
            </button>
          ) : null}
        </div>
        {/* L'espace de travail, à côté du schéma et non par-dessus : le panneau de la scène, ou celui du bloc */}
        {construire && travail ? (
          <div className="chemins__espace" ref={espace}>
            {services && blocOuvert ? (
              <PanneauDuBloc
                etat={bloc}
                setEtat={setBloc}
                chemins={chemins}
                services={{ ...services, ajouter: ajouterLeBloc }}
                deClasse={construire.deClasse}
                ouverte={ouverteDuBloc}
                onOuvrir={setOuverteDuBloc}
                ordre={(id) => disposition?.places.get(bloc.proposition?.scenes.some((x) => x.cle === id) ? idPropose(id) : id)?.x ?? 0}
                onFermer={fermerLeBloc}
              />
            ) : sceneChoisie ? (
              <PanneauDeScene
                key={sceneChoisie.id}
                scene={sceneChoisie}
                chemins={chemins}
                construire={{
                  ...construire,
                  // Le schéma se redispose après chaque geste : la scène du panneau garde sa place à l'écran
                  supprimerChoix: (lien) => {
                    aGarder.current = lien.de;
                    return construire.supprimerChoix(lien);
                  },
                }}
                designe={designe}
                boutonAjouter={boutonAjouter}
                onAjouter={() => setGeste((avant) => (avant?.depuis === "panneau" ? null : { sorte: "ajout", de: sceneChoisie.id, depuis: "panneau" }))}
                onFermer={() => choisir(null)}
                onConstruireLaSuite={services ? () => ouvrirLeBloc(sceneChoisie.id) : undefined}
              />
            ) : null}
          </div>
        ) : null}
      </div>
      {construire ? (
        // Le lien qu'on tire, par-dessus la page : il suit le pointeur d'une carte à l'autre
        <svg className="chemins__tire" ref={trait} aria-hidden="true" style={{ display: "none" }}>
          <path markerEnd="url(#fleche-chemin-active)" />
        </svg>
      ) : null}
      {construire && geste ? (
        <BulleDuGeste
          key={`${geste.sorte}:${geste.de}:${geste.sorte === "lien" ? geste.vers : geste.depuis}`}
          geste={geste}
          chemins={chemins}
          repere={repereDuGeste}
          // Au travail, à gauche de la carte : à droite, la bulle mordrait sur l'espace de travail
          cote={travail ? "left-start" : "right-start"}
          construire={construire}
          avant={(de) => (aGarder.current = de)}
          onFermer={fermerGeste}
        />
      ) : null}
    </>
  );
}

/** La mini-carte repliée le reste sur ce poste, d'un chapitre à l'autre (F03.1, 14 octobre 2026). */
const CLE_REPLIEE = "chemins-mini-carte-repliee";
const lireRepliee = (): boolean => {
  try {
    return localStorage.getItem(CLE_REPLIEE) === "1";
  } catch {
    return false;
  }
};

/**
 * La mini-carte, dès que le schéma dépasse de son cadre : ce qu'on en voit, et un clic ou un glissé
 * pour s'y rendre. Posée dans le schéma, elle suit sa vue pendant qu'on le tire. Elle se replie
 * d'un clic, en un petit bouton qui la rouvre.
 */
function MiniCarte({ disposition, regard, noeuds }: { disposition: Disposition; regard: ARegarder; noeuds: NoeudDeChemin[] }) {
  const flux = useReactFlow();
  const [x, y, zoom] = useStore((etat) => etat.transform);
  const largeur = useStore((etat) => etat.width);
  const hauteur = useStore((etat) => etat.height);
  const [repliee, setRepliee] = useState(lireRepliee);
  const plier = (oui: boolean) => {
    setRepliee(oui);
    try {
      localStorage.setItem(CLE_REPLIEE, oui ? "1" : "0");
    } catch {
      // Sans stockage, le repli tient le temps de la page
    }
  };
  if (repliee) {
    return (
      <button type="button" className="chemins__carte-ouvrir" onClick={() => plier(false)}>
        <Icone nom="chemins" />
        Mini-carte
      </button>
    );
  }

  const echelle = Math.min(120 / disposition.largeur, 132 / disposition.hauteur);
  const aller = (e: PointerEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    void flux.setViewport(centrerSur({ x: (e.clientX - r.left) / echelle, y: (e.clientY - r.top) / echelle, l: 0, h: 0 }, { l: largeur, h: hauteur }, zoom));
  };
  const parId = new Map(noeuds.map((n) => [n.id, n]));
  const borne = (v: number, max: number) => Math.min(max, Math.max(0, v));
  const vu = partVue({ x, y, zoom }, { l: largeur, h: hauteur });
  const x1 = borne(vu.x, disposition.largeur);
  const y1 = borne(vu.y, disposition.hauteur);
  const x2 = borne(vu.x + vu.l, disposition.largeur);
  const y2 = borne(vu.y + vu.h, disposition.hauteur);
  return (
    <div className="chemins__carte">
      <button type="button" className="chemins__carte-replier" aria-label="Replier la mini-carte" title="Replier la mini-carte" onClick={() => plier(true)}>
        <Icone nom="fermer" />
      </button>
      <svg
        role="img"
        aria-label="Mini-carte du chapitre : cliquer pour s’y rendre"
        width={Math.ceil(disposition.largeur * echelle)}
        height={Math.ceil(disposition.hauteur * echelle)}
        viewBox={`0 0 ${disposition.largeur} ${disposition.hauteur}`}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          aller(e);
        }}
        onPointerMove={(e) => {
          if (e.buttons === 1) aller(e);
        }}
      >
        {disposition.elements.map((e) => {
          const p = disposition.places.get(e.id)!;
          const n = parId.get(e.id);
          const sorte = e.sorte !== "scene" ? (e.sorte === "manque" ? "regarder" : "etiquette") : regard.marques.has(e.id) ? "regarder" : n?.depart ? "depart" : n?.fin ? "fin" : "scene";
          return <rect key={e.id} className={`chemins__carte-${sorte}`} x={p.x} y={p.y} width={p.l} height={p.h} rx={10} />;
        })}
        <rect className="chemins__carte-vu" x={x1} y={y1} width={Math.max(0, x2 - x1)} height={Math.max(0, y2 - y1)} rx={12} />
      </svg>
    </div>
  );
}
