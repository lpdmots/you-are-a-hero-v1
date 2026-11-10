"use client";

import "@xyflow/react/dist/base.css";
import { applyNodeChanges, BaseEdge, EdgeLabelRenderer, Handle, NodeToolbar, Position, ReactFlow, useStore, type Edge, type EdgeProps, type Node, type NodeChange, type NodeProps } from "@xyflow/react";
import Link from "next/link";
import {
  createContext, useCallback, useContext, useEffect, useEffectEvent, useLayoutEffect, useMemo, useRef, useState,
  type CSSProperties, type PointerEvent, type ReactNode, type RefObject,
} from "react";
import { MOT_DE_MARQUE, type ARegarder, type Chemins, type NoeudDeChemin } from "@/domaine/chemins";
import { Bulle } from "../Bulle";
import { Icone } from "../Icone";
import { TamponScene } from "../TamponScene";
import { aRendreSansMouvement, carteDeReference, figerLaTaille, garderEnPlace } from "./ancrage";
import { BulleDuGeste, PanneauDeScene, type Construire, type Geste } from "./Construire";
import { disposer, texteDeLEtiquette, texteDuLibelle, type Disposition, type Element, type Mesure } from "./disposer";

/**
 * Le schéma des chemins d'un chapitre (F03.1, « Vue Chemins à reprendre ») : les scènes de
 * haut en bas, placées par dagre, dessinées par React Flow. La page défile normalement : le
 * schéma prend toute sa hauteur, et aucune carte ne s'y déplace à la main. Ce fichier et ses
 * deux bibliothèques ne se chargent qu'à l'ouverture de « Chemins », sur un écran large.
 *
 * L'adulte y construit le plan (F03.1, « Construire dans Chemins ») : un « + » sous la carte
 * ajoute une scène, ou relie quand on le tire jusqu'à une autre ; la scène cliquée ouvre son
 * panneau à droite. Après chaque geste le schéma se redispose, et l'écran ne bouge pas : même
 * taille, la carte d'où l'on part à la même place (F03-AC54).
 */

/** Autour du schéma, dans son cadre */
const MARGE = 28;
/** La barre du haut de l'application, qui reste à l'écran */
/**
 * Ce qui reste collé en haut de l'écran au-dessus du schéma : rien sur l'écran large de l'adulte, sa
 * barre mince sur un écran étroit, la barre de l'élève (« --sous-la-barre » de la vue Chemins).
 */
const barre = (): number => {
  const vue = document.querySelector(".chemins");
  const v = vue ? parseFloat(getComputedStyle(vue).getPropertyValue("--sous-la-barre")) : NaN;
  return Number.isFinite(v) ? v : 58;
};
/** La largeur du panneau de la scène cliquée, que la feuille de style reprend (« --panneau-chemin », recit.css) */
const PANNEAU = 304;
/** En dessous, on regarde l'ensemble : les libellés des choix ne se lisent plus et sont masqués */
const LOIN = 0.62;
/** « Tout voir » descend aussi bas qu'il le faut ; les boutons « − » et « + » restent entre deux tailles utiles */
const ZOOM = { toutVoir: 0.05, min: 0.2, lisible: 0.7, max: 1, pas: 0.1 };

type DonneesScene = NoeudDeChemin & { marques: string[]; sansSuite: boolean };
type DonneesTrait = { d: string; texte: string; cache: boolean; remonte: boolean; libelle: Disposition["traits"][number]["libelle"] };
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
}>({
  active: null, choisie: null, survolee: null, voisines: new Set(), loin: false, montre: null,
  construit: false, source: null, cible: null, ouvrirAjout: () => {}, commencerLien: () => {}, choisirChoix: () => {},
});

const classes = (...noms: (string | false | null | undefined)[]): string => noms.filter(Boolean).join(" ");

function CarteScene({ id, data, selected }: NodeProps<NoeudScene>) {
  const vue = useContext(Vue);
  const titre = data.titre ?? "sans titre";
  return (
    <div className={classes("noeud-chemin", vue.source === id && "est-source", data.sansSuite && "attend-une-suite")}>
    <div
      className={classes(
        "carte-chemin", selected && "est-choisie", vue.designee === id && "est-designee", (vue.source === id || vue.cible === id) && "est-reliee",
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
        className={classes("trait-chemin", data.cache && "est-cache", data.remonte && "remonte", touche && "est-actif", efface && "est-efface")}
        markerEnd={`url(#${touche ? "fleche-chemin-active" : data.remonte ? "fleche-chemin-retour" : "fleche-chemin"})`}
      />
      {data.libelle && !vue.loin ? (
        <EdgeLabelRenderer>
          <span
            className={classes("libelle-chemin", data.cache && "est-cache", data.remonte && "remonte", touche && "est-entier", efface && "est-efface", vue.construit && !data.cache && "se-choisit nodrag nopan")}
            onClick={vue.construit && !data.cache ? () => vue.choisirChoix(id, source) : undefined}
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
  rects: Map<string, { x: number; y: number; l: number; h: number }>;
  /** Les places attendues : le schéma est redessiné quand React Flow les a prises */
  signature: string;
};
const signatureDe = (noeuds: { id: string; position: { x: number; y: number } }[]): string => noeuds.map((n) => `${n.id}:${n.position.x},${n.position.y}`).join(";");
const SANS_AJUSTEMENT = { px: 0, py: 0, ax: 0, ay: 0 };
const sansMouvement = (): boolean => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Posé dans le schéma : dès que React Flow a pris les nouvelles places, la carte de référence est
 * ramenée où elle était à l'écran — en faisant défiler, puis, au bout du défilement, en poussant
 * le schéma dans son cadre ou en allongeant le cadre — et les autres glissent vers leur place.
 */
function GarderEnPlace({
  figeRef, cadreRef, toileRef, zoom, ajuste, onAjuste,
}: {
  figeRef: RefObject<Fige | null>; cadreRef: RefObject<HTMLDivElement | null>; toileRef: RefObject<HTMLDivElement | null>; zoom: number;
  ajuste: typeof SANS_AJUSTEMENT; onAjuste: (a: typeof SANS_AJUSTEMENT) => void;
}) {
  const dansLeSchema = useStore((etat) => etat.nodes);
  useLayoutEffect(() => {
    const f = figeRef.current;
    const c = cadreRef.current;
    const t = toileRef.current;
    if (!f || !c || !t || signatureDe(dansLeSchema) !== f.signature) return;
    figeRef.current = null;
    const lire = () =>
      new Map(
        [...c.querySelectorAll<HTMLElement>(".react-flow__node")].map((el) => {
          const r = el.getBoundingClientRect();
          return [el.dataset.id ?? "", { el, x: r.left, y: r.top }] as const;
        }),
      );
    const repere = f.id ? lire().get(f.id) : undefined;
    const avant = f.id ? f.rects.get(f.id) : undefined;
    if (repere && avant) {
      const x = garderEnPlace(repere.x - avant.x, { position: c.scrollLeft, max: c.scrollWidth - c.clientWidth });
      const y = garderEnPlace(repere.y - avant.y, { position: window.scrollY, max: document.documentElement.scrollHeight - window.innerHeight });
      if (x.pousser || x.allonger || y.pousser || y.allonger) {
        const suite = { px: ajuste.px + x.pousser, py: ajuste.py + y.pousser, ax: ajuste.ax + x.allonger, ay: ajuste.ay + y.allonger };
        // Tout de suite dans la page, pour que le défilement ait où aller ; l'état suit, avec les mêmes valeurs
        c.style.paddingLeft = `${suite.px}px`;
        c.style.paddingTop = `${suite.py}px`;
        t.style.width = `${t.offsetWidth + x.allonger}px`;
        t.style.height = `${t.offsetHeight + y.allonger}px`;
        onAjuste(suite);
      }
      c.scrollLeft += x.defiler;
      if (y.defiler) window.scrollTo({ top: window.scrollY + y.defiler, behavior: "instant" });
    }
    if (sansMouvement()) return;
    // Chaque carte part de là où elle était et glisse vers sa place ; une carte nouvelle apparaît
    const doux = { duration: 260, easing: "cubic-bezier(0.2, 0.7, 0.2, 1)" };
    const places = lire();
    let change = places.size !== f.rects.size;
    for (const [id, n] of places) {
      const vieux = f.rects.get(id);
      const dedans = n.el.firstElementChild;
      if (!dedans) continue;
      if (!vieux) {
        change = true;
        dedans.animate([{ opacity: 0, transform: "scale(0.94)" }, { opacity: 1, transform: "scale(1)" }], doux);
      } else if (Math.abs(vieux.x - n.x) + Math.abs(vieux.y - n.y) > 1) {
        change = true;
        dedans.animate([{ transform: `translate(${(vieux.x - n.x) / zoom}px, ${(vieux.y - n.y) / zoom}px)` }, { transform: "translate(0, 0)" }], doux);
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
  chemins, regard, designee, montre, fois, pourEleve, tete, construire,
}: {
  chemins: Chemins; regard: ARegarder; designee?: string;
  /** La scène ou le choix que le parcours de « À regarder » désigne, et le nombre de pas faits */
  montre: string | null; fois: number;
  /** Un élève ne lit pas les liens cachés : on ne lui en parle pas */
  pourEleve: boolean;
  /** La ligne « À regarder », que l'en-tête du schéma place à côté de ses boutons */
  tete: ReactNode;
  /** Les gestes de l'adulte (F03.1, « Construire dans Chemins ») ; sans eux, le schéma se lit seulement */
  construire?: Construire;
}) {
  const cadre = useRef<HTMLDivElement>(null);
  const toile = useRef<HTMLDivElement>(null);
  const enTete = useRef<HTMLDivElement>(null);
  const rail = useRef<HTMLDivElement>(null);
  const plan = useRef<HTMLDivElement>(null);
  const trait = useRef<SVGSVGElement>(null);
  const boutonAjouter = useRef<HTMLButtonElement>(null);
  // Le geste en cours : la bulle ouverte, d'où elle l'a été, et la carte que vise le lien qu'on tire
  const [geste, setGeste] = useState<(Geste & { depuis: "carte" | "panneau"; auClavier?: boolean }) | null>(null);
  const [tire, setTire] = useState<{ de: string; sur: string | null } | null>(null);
  const [designe, setDesigne] = useState<string | null>(null);
  const vientDeTirer = useRef(false);
  // Ce que le schéma a dû pousser ou allonger pour que l'écran ne bouge pas (F03-AC54)
  const [ajuste, setAjuste] = useState(SANS_AJUSTEMENT);
  const fige = useRef<Fige | null>(null);
  const aGarder = useRef<string | null>(null);
  // Ce que la disposition, calculée plus tard, lit de l'écran tel qu'il est à ce moment-là
  const courantRef = useRef<{ noeuds: (NoeudScene | NoeudEtiquette)[]; zoom: number; dessine: boolean }>({ noeuds: [], zoom: 1, dessine: false });
  const [disposition, setDisposition] = useState<Disposition | null>(null);
  const [place, setPlace] = useState({ gauche: 0, largeur: 0, fenetre: 0, barre: 58 });
  const [choisi, setChoisi] = useState<number | null>(null);
  const [noeuds, setNoeuds] = useState<(NoeudScene | NoeudEtiquette)[]>([]);
  const [survolee, setSurvolee] = useState<string | null>(null);
  // Le schéma ne se montre qu'une fois à sa place et à sa taille
  const [dessine, setDessine] = useState(false);
  const ancre = useRef<number | null>(null);

  // La disposition se calcule une fois la police de l'outil chargée : les libellés se mesurent avec elle
  useEffect(() => {
    let vivant = true;
    void document.fonts.ready.then(() => {
      if (!vivant) return;
      const d = disposer(chemins, regard.marques, mesureur());
      const parId = new Map(chemins.noeuds.map((n) => [n.id, n]));
      const etat = courantRef.current;
      const choisie = etat.noeuds.find((n) => n.selected)?.id ?? null;
      const suite = d.elements.map((e) => {
        const p = d.places.get(e.id)!;
        const commun = { id: e.id, position: { x: p.x, y: p.y }, width: p.l, height: p.h, draggable: false, connectable: false, deletable: false };
        if (e.sorte !== "scene") return { ...commun, type: "etiquette" as const, data: { element: e }, selectable: false, focusable: false };
        const n = parId.get(e.id)!;
        return {
          ...commun, type: "scene" as const, selected: e.id === choisie,
          data: { ...n, marques: e.marques.map((m, i) => (i ? MOT_DE_MARQUE[m].toLocaleLowerCase("fr") : MOT_DE_MARQUE[m])), sansSuite: e.marques.includes("sans-suite") },
          ariaLabel: n.titre ?? "Scène sans titre",
        };
      });
      // Le schéma était déjà dessiné : il se redispose sans que l'écran bouge. On retient où est
      // chaque carte, la taille se fige, et la carte de référence retrouvera sa place (F03-AC54).
      const c = cadre.current;
      if (etat.dessine && c) {
        const rects = new Map(
          [...c.querySelectorAll<HTMLElement>(".react-flow__node")].map((el) => {
            const r = el.getBoundingClientRect();
            return [el.dataset.id ?? "", { x: r.left, y: r.top, l: r.width, h: r.height }] as const;
          }),
        );
        const scenes = new Map([...rects].filter(([id]) => parId.has(id) && d.places.has(id)));
        const vu = { x: 0, y: barre(), l: window.innerWidth, h: window.innerHeight - barre() };
        const voulue = aGarder.current && scenes.has(aGarder.current) ? aGarder.current : null;
        fige.current = { id: voulue ?? carteDeReference(scenes, choisie, vu), rects, signature: signatureDe(suite) };
        setChoisi((avant) => figerLaTaille(avant, etat.zoom));
      }
      aGarder.current = null;
      setDisposition(d);
      setNoeuds(suite);
    });
    return () => {
      vivant = false;
    };
  }, [chemins, regard]);

  const traits = useMemo<Trait[]>(() => {
    const parId = new Map(chemins.liens.map((l) => [l.id, l]));
    return (disposition?.traits ?? []).map((t) => {
      const lien = parId.get(t.id);
      return {
        id: t.id, source: t.de, target: t.vers, type: "chemin" as const, focusable: false, selectable: false, reconnectable: false,
        data: { d: t.d, libelle: t.libelle, texte: lien ? texteDuLibelle(lien) : "", cache: lien?.cache ?? false, remonte: t.remonte },
      };
    });
  }, [disposition, chemins.liens]);

  // Le schéma prend toute la largeur de la page, d'un bord à l'autre : celle de la fenêtre, moins la
  // colonne de navigation de l'adulte (F06.5), qui se replie sans que la fenêtre change
  useLayoutEffect(() => {
    const page = cadre.current?.closest("main");
    const mesurer = () => {
      const parent = cadre.current?.parentElement?.parentElement;
      if (!parent) return;
      const bord = page ? page.getBoundingClientRect().left : 0;
      const suite = {
        gauche: Math.round(parent.getBoundingClientRect().left - bord),
        largeur: page ? page.clientWidth : document.documentElement.clientWidth,
        fenetre: window.innerHeight,
        barre: barre(),
      };
      setPlace((avant) => (avant.gauche === suite.gauche && avant.largeur === suite.largeur && avant.fenetre === suite.fenetre && avant.barre === suite.barre ? avant : suite));
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
  /** La taille lisible : le schéma tient dans la largeur, sans descendre sous une taille où les titres se lisent */
  const lisible = l && place.largeur ? Math.floor(borner((place.largeur - 2 * MARGE) / l, ZOOM.lisible, ZOOM.max) * 100) / 100 : 1;
  const zoom = choisi ?? lisible;
  const loin = zoom < LOIN;
  const largeurToile = Math.max(place.largeur, Math.ceil(l * zoom + 2 * MARGE));
  const hauteurToile = Math.ceil(h * zoom + 2 * MARGE);
  // Là où l'adulte construit, un schéma qui tient à gauche du panneau s'y centre : le panneau, en s'ouvrant, ne couvre rien et rien ne bouge
  const largeurUtile = construire && l * zoom + 2 * MARGE <= place.largeur - PANNEAU - 24 ? place.largeur - PANNEAU - 24 : largeurToile;
  useEffect(() => {
    courantRef.current = { noeuds, zoom, dessine: dessine && disposition !== null };
  });

  // Changer de taille garde à l'écran ce qu'on regardait
  const hautDuSchema = () => (toile.current ? toile.current.getBoundingClientRect().top + window.scrollY + MARGE : 0);
  const changer = (suite: number | null) => {
    const haut = hautDuSchema();
    const milieu = window.scrollY + window.innerHeight / 2;
    ancre.current = milieu > haut && window.scrollY + barre() > haut - MARGE ? (milieu - haut) / zoom : null;
    // Le schéma retrouve sa place dans son cadre : ce qu'un geste avait poussé ou allongé n'a plus lieu d'être
    setAjuste(SANS_AJUSTEMENT);
    setChoisi(suite === null ? null : arrondir(borner(suite, ZOOM.min, ZOOM.max)));
  };
  useLayoutEffect(() => {
    if (ancre.current === null) return;
    window.scrollTo({ top: hautDuSchema() + ancre.current * zoom - window.innerHeight / 2 });
    ancre.current = null;
  }, [zoom]);

  const hauteurDeLEnTete = () => enTete.current?.getBoundingClientRect().height ?? 0;
  const toutVoir = () => {
    const tete = hauteurDeLEnTete();
    const hauteur = window.innerHeight - barre() - tete - 2 * MARGE - 8;
    ancre.current = null;
    setAjuste(SANS_AJUSTEMENT);
    setChoisi(Math.floor(borner(Math.min((place.largeur - 2 * MARGE) / l, hauteur / h), ZOOM.toutVoir, ZOOM.max) * 100) / 100);
    // Le haut du schéma vient sous la barre et son en-tête : on le voit alors d'un seul regard
    setTimeout(() => {
      if (cadre.current) window.scrollTo({ top: cadre.current.getBoundingClientRect().top + window.scrollY - barre() - tete });
    }, 0);
  };

  // La scène où mène le choix suivi depuis un autre chapitre vient au milieu de l'écran (F03-AC25)
  const pret = disposition !== null && noeuds.length > 0;
  useEffect(() => {
    if (!pret || !designee) return;
    const attente = requestAnimationFrame(() => cadre.current?.querySelector(`[data-chemin="${CSS.escape(designee)}"]`)?.scrollIntoView({ block: "center", inline: "center" }));
    return () => cancelAnimationFrame(attente);
  }, [pret, designee]);

  // Ce que « À regarder » désigne est choisi comme par un clic, et vient au milieu de l'écran.
  // Pour un choix : la scène d'où il part est choisie, et l'on se place entre elle et le bout de sa flèche.
  const montrer = useEffectEvent((id: string) => {
    const c = cadre.current;
    if (!c || !disposition) return;
    const trait = disposition.traits.find((t) => t.id === id);
    const carte = trait ? trait.de : id;
    setNoeuds((avant) => avant.map((n) => (!!n.selected === (n.id === carte) ? n : { ...n, selected: n.id === carte })));
    const places = [disposition.places.get(carte), trait ? disposition.places.get(trait.vers) : undefined].filter((p) => p !== undefined);
    if (!places.length) return;
    const x = places.reduce((somme, p) => somme + p.x + p.l / 2, 0) / places.length;
    const y = places.reduce((somme, p) => somme + p.y + p.h / 2, 0) / places.length;
    const doux = sansMouvement() ? "auto" : "smooth";
    window.scrollTo({ top: hautDuSchema() + y * zoom - (window.innerHeight + barre() + hauteurDeLEnTete()) / 2, behavior: doux });
    c.scrollTo({ left: ajuste.px + (largeurUtile - l * zoom) / 2 + x * zoom - c.clientWidth / 2, behavior: doux });
  });
  useEffect(() => {
    if (!pret || !montre) return;
    const attente = setTimeout(() => montrer(montre), 0);
    return () => clearTimeout(attente);
  }, [pret, montre, fois]);

  const changerNoeuds = useCallback((changements: NodeChange<NoeudScene | NoeudEtiquette>[]) => setNoeuds((avant) => applyNodeChanges(changements, avant)), []);
  const choisie = noeuds.find((n) => n.selected)?.id ?? null;
  const voisines = useMemo(() => new Set(choisie ? traits.flatMap((t) => (t.source === choisie ? [t.target] : t.target === choisie ? [t.source] : [])) : []), [choisie, traits]);

  // ——— Construire (F03.1) : les gestes de l'adulte, à une taille où les cartes se lisent ———
  const construit = !!construire && !loin;
  const choisir = useCallback((id: string | null) => setNoeuds((avant) => avant.map((n) => (!!n.selected === (n.id === id) ? n : { ...n, selected: n.id === id }))), []);
  const suivreLaSource = useCallback(
    // Un panneau est ouvert sur une autre scène : il passe à celle d'où part le geste, dont la suite ne reste pas en retrait
    (id: string) => setNoeuds((avant) => (avant.some((n) => n.selected && n.id !== id) ? avant.map((n) => (!!n.selected === (n.id === id) ? n : { ...n, selected: n.id === id })) : avant)),
    [],
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
   * c'est un clic. Près d'un bord, la page ou le cadre défile : la scène visée peut être plus
   * loin que l'écran. Lâché sur une autre carte du chapitre, le lien demande son libellé.
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
      const haut = barre() + 70;
      const bas = window.innerHeight - 70;
      if (pointeur.y < haut) window.scrollBy(0, -Math.min(22, (haut - pointeur.y) / 3 + 2));
      else if (pointeur.y > bas) window.scrollBy(0, Math.min(22, (pointeur.y - bas) / 3 + 2));
      const bords = c.getBoundingClientRect();
      if (pointeur.x < bords.left + 50) c.scrollLeft -= 12;
      else if (pointeur.x > bords.right - 50) c.scrollLeft += 12;
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
    const ligne = rail.current?.querySelector<HTMLElement>(`[data-choix="${CSS.escape(designe)}"]`);
    ligne?.scrollIntoView({ block: "nearest" });
    const fin = setTimeout(() => setDesigne(null), 1600);
    return () => clearTimeout(fin);
  }, [designe]);

  const sceneChoisie = construire && choisie ? chemins.noeuds.find((n) => n.id === choisie) : undefined;
  // Le panneau tient toujours dans la fenêtre : sous l'en-tête des chemins une fois la page descendue, sinon au haut du schéma
  const panneauOuvert = !!sceneChoisie;
  useLayoutEffect(() => {
    if (!panneauOuvert) return;
    const suivre = () => {
      const p = plan.current?.getBoundingClientRect();
      if (p) rail.current?.style.setProperty("--haut-du-panneau", `${Math.round(Math.max(barre() + hauteurDeLEnTete(), p.top) + 10)}px`);
    };
    suivre();
    window.addEventListener("scroll", suivre, { passive: true });
    window.addEventListener("resize", suivre);
    return () => {
      window.removeEventListener("scroll", suivre);
      window.removeEventListener("resize", suivre);
    };
  }, [panneauOuvert]);
  // La carte cliquée ne reste pas sous le panneau : le cadre se décale juste assez pour la montrer
  useEffect(() => {
    const c = cadre.current;
    const panneau = rail.current?.firstElementChild;
    if (!sceneChoisie || !c || !panneau) return;
    const carte = c.querySelector<HTMLElement>(`.carte-chemin[data-chemin="${CSS.escape(sceneChoisie.id)}"]`)?.getBoundingClientRect();
    const depasse = carte ? carte.right + 20 - panneau.getBoundingClientRect().left : 0;
    if (depasse > 0) c.scrollBy({ left: depasse, behavior: sansMouvement() ? "auto" : "smooth" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sceneChoisie?.id]);

  // ——— Ce qu'un geste a poussé se rend (F03-AC54, précisé le 10 novembre 2026) : la carte reste en
  // place le temps du geste, puis le schéma reprend sa place dans son cadre ———
  const ajusteRef = useRef(ajuste);
  useLayoutEffect(() => {
    ajusteRef.current = ajuste;
  });
  const pousse = ajuste.px > 0 || ajuste.py > 0;
  // Dès qu'on fait défiler : la part de la poussée passée hors de la vue se retire, et le défilement
  // recule d'autant ; rien ne bouge à l'écran
  useEffect(() => {
    const c = cadre.current;
    if (!pousse || !c) return;
    const absorber = () => {
      const a = ajusteRef.current;
      const haut = aRendreSansMouvement(a.py, barre() + hauteurDeLEnTete() - c.getBoundingClientRect().top);
      const gauche = aRendreSansMouvement(a.px, c.scrollLeft);
      if (haut < 1 && gauche < 1) return;
      const suite = { ...a, px: a.px - gauche, py: a.py - haut };
      c.style.paddingTop = `${suite.py}px`;
      c.style.paddingLeft = `${suite.px}px`;
      if (haut >= 1) window.scrollTo({ top: window.scrollY - haut, behavior: "instant" });
      if (gauche >= 1) c.scrollLeft -= gauche;
      ajusteRef.current = suite;
      setAjuste(suite);
    };
    window.addEventListener("scroll", absorber, { passive: true });
    c.addEventListener("scroll", absorber, { passive: true });
    return () => {
      window.removeEventListener("scroll", absorber);
      c.removeEventListener("scroll", absorber);
    };
  }, [pousse]);
  // Le geste fini, le reste se rend en glissant, comme « Recentrer », sans changer la taille : quand
  // le panneau se referme, quand le pointeur quitte le schéma et son panneau, ou quand une bulle se
  // referme alors que le pointeur n'y est plus. Pas tant qu'on travaille au même endroit.
  const enGeste = geste !== null || tire !== null;
  const enGesteRef = useRef(enGeste);
  useLayoutEffect(() => {
    enGesteRef.current = enGeste;
  });
  const dedans = useRef(false);
  const minuteurRendre = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rendre = useCallback(() => {
    if (minuteurRendre.current) clearTimeout(minuteurRendre.current);
    // Après le glissement des cartes du geste
    minuteurRendre.current = setTimeout(() => {
      const c = cadre.current;
      const a = ajusteRef.current;
      if (!c || enGesteRef.current || (a.px === 0 && a.py === 0 && a.ax === 0 && a.ay === 0)) return;
      if (!sansMouvement()) {
        c.dataset.relache = "";
        setTimeout(() => delete c.dataset.relache, 320);
      }
      setAjuste(SANS_AJUSTEMENT);
    }, 350);
  }, []);
  useEffect(() => {
    const p = plan.current;
    if (!p) return;
    const entrer = () => {
      dedans.current = true;
      if (minuteurRendre.current) clearTimeout(minuteurRendre.current);
    };
    const sortir = () => {
      dedans.current = false;
      rendre();
    };
    p.addEventListener("pointerenter", entrer);
    p.addEventListener("pointerleave", sortir);
    return () => {
      p.removeEventListener("pointerenter", entrer);
      p.removeEventListener("pointerleave", sortir);
      if (minuteurRendre.current) clearTimeout(minuteurRendre.current);
    };
  }, [rendre]);
  const avant = useRef({ panneau: panneauOuvert, geste: enGeste });
  useEffect(() => {
    const { panneau, geste: etaitEnGeste } = avant.current;
    avant.current = { panneau: panneauOuvert, geste: enGeste };
    if ((panneau && !panneauOuvert) || (etaitEnGeste && !enGeste && !dedans.current)) rendre();
  }, [panneauOuvert, enGeste, rendre]);

  const source = geste?.de ?? tire?.de ?? null;
  const cible = (geste?.sorte === "lien" ? geste.vers : null) ?? tire?.sur ?? null;
  const enTirant = tire !== null;
  const vue = useMemo(
    // Pendant qu'on tire un lien, la carte survolée ne montre que son cadre : ni ses flèches, ni « Ouvrir »
    () => ({ active: choisie ?? (enTirant ? null : survolee), choisie, survolee: enTirant ? null : survolee, voisines, loin, designee, montre, construit, source, cible, ouvrirAjout, commencerLien, choisirChoix }),
    [choisie, survolee, enTirant, voisines, loin, designee, montre, construit, source, cible, ouvrirAjout, commencerLien, choisirChoix],
  );
  /** Ce près de quoi la bulle se pose : la carte d'où l'on part, celle où le lien arrive, ou le bouton du panneau */
  const repereDuGeste = (): globalThis.Element | null => {
    if (!geste) return null;
    if (geste.depuis === "panneau") return boutonAjouter.current;
    return cadre.current?.querySelector(`.carte-chemin[data-chemin="${CSS.escape(geste.sorte === "lien" ? geste.vers : geste.de)}"]`) ?? null;
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

  return (
    <>
      {/* Son fond va d'un bord à l'autre de la page, comme le schéma, sans passer sur la colonne de l'adulte */}
      <div className="chemins__tete" ref={enTete} style={place.largeur ? ({ "--tete-rognage": `inset(0 ${-place.largeur}px 0 ${-place.gauche}px)` } as CSSProperties) : undefined}>
        {tete}
        <div className="chemins__outils">
          {/* Après un geste, la taille figée peut s'écarter d'un rien de la taille lisible : le lien n'apparaît pas pour si peu */}
          {Math.abs(zoom - lisible) > 0.045 ? (
            <button type="button" className="lien" onClick={() => changer(null)}>
              Taille lisible
            </button>
          ) : ajuste.px || ajuste.py ? (
            // Pour garder une carte en place, un geste a poussé le schéma dans son cadre : un clic le remet au milieu
            <button type="button" className="lien" onClick={() => changer(null)}>
              Recentrer
            </button>
          ) : null}
          <button type="button" className="btn btn--petit" onClick={toutVoir}>
            Tout voir
          </button>
          <button type="button" className="btn btn--petit" aria-label="Réduire" disabled={zoom <= ZOOM.min} onClick={() => changer(Math.max(ZOOM.min, zoom - ZOOM.pas))}>
            −
          </button>
          <button type="button" className="btn btn--petit" aria-label="Agrandir" disabled={zoom >= ZOOM.max} onClick={() => changer(zoom + ZOOM.pas)}>
            +
          </button>
          <Bulle question="Comment lire ces chemins ?">
            Chaque flèche est un choix : elle part de la scène où il s’écrit et porte son libellé. {pourEleve ? "" : "Une flèche en pointillé est un lien caché. "}Une flèche plus sombre, marquée
            d’une petite flèche vers le haut, ramène le lecteur en arrière. Une étiquette nomme un autre chapitre. Cliquer une scène montre ses chemins.
            {construire ? (
              <span>
                Pour construire : le « + » sous une scène ajoute la scène suivante ; tiré jusqu’à une autre scène, il les relie. Une scène cliquée ouvre son titre, sa consigne et ses choix.
              </span>
            ) : null}
          </Bulle>
        </div>
      </div>
      <div
        className="chemins__plan"
        ref={plan}
        style={place.largeur ? { width: place.largeur, marginLeft: -place.gauche } : undefined}
        data-panneau={sceneChoisie ? "" : undefined}
      >
      <div
        className="chemins__cadre"
        ref={cadre}
        style={{ paddingLeft: ajuste.px, paddingTop: ajuste.py, "--zoom-chemins": zoom } as CSSProperties}
        data-zoom={zoom}
        data-loin={loin || undefined}
        data-tire={enTirant || undefined}
      >
        <svg className="chemins__fleches" width="0" height="0" aria-hidden="true">
          <defs>
            {["fleche-chemin", "fleche-chemin-retour", "fleche-chemin-active"].map((id) => (
              <marker key={id} id={id} className={id} viewBox="0 0 10 10" refX="9.2" refY="5" markerWidth="12" markerHeight="12" markerUnits="userSpaceOnUse" orient="auto">
                <path d="M0.6,0.8 L9.6,5 L0.6,9.2 L2.8,5 z" fill="currentColor" />
              </marker>
            ))}
          </defs>
        </svg>
        {pret ? (
          <div className="chemins__toile" ref={toile} style={{ width: largeurToile + ajuste.ax, height: hauteurToile + ajuste.ay }} data-dessine={dessine || undefined}>
            <Vue.Provider value={vue}>
              <ReactFlow
                nodes={noeuds}
                edges={traits}
                nodeTypes={SORTES_DE_NOEUD}
                edgeTypes={SORTES_DE_TRAIT}
                onNodesChange={changerNoeuds}
                onInit={() => setTimeout(() => setDessine(true), 30)}
                onNodeMouseEnter={(_, n) => setSurvolee(n.type === "scene" ? n.id : null)}
                onNodeMouseLeave={() => setSurvolee(null)}
                viewport={{ x: Math.round((largeurUtile - l * zoom) / 2), y: MARGE, zoom }}
                onViewportChange={() => {}}
                minZoom={ZOOM.toutVoir}
                maxZoom={ZOOM.max}
                // Rien ne se déplace ni ne se modifie : la molette et le doigt font défiler la page
                nodesDraggable={false}
                nodesConnectable={false}
                edgesFocusable={false}
                edgesReconnectable={false}
                panOnDrag={false}
                panOnScroll={false}
                zoomOnScroll={false}
                zoomOnPinch={false}
                zoomOnDoubleClick={false}
                preventScrolling={false}
                autoPanOnNodeFocus={false}
                selectionOnDrag={false}
                selectionKeyCode={null}
                multiSelectionKeyCode={null}
                deleteKeyCode={null}
                // Le nom de la bibliothèque, dans un coin, comme ses auteurs le demandent (F14-AC35)
                proOptions={{ hideAttribution: false }}
                ariaLabelConfig={{
                  "node.a11yDescription.default": "Entrée ou Espace : montrer les chemins de cette scène. Échap : ne plus les montrer.",
                  "node.a11yDescription.keyboardDisabled": "Entrée ou Espace : montrer les chemins de cette scène. Échap : ne plus les montrer.",
                }}
              >
                <GarderEnPlace figeRef={fige} cadreRef={cadre} toileRef={toile} zoom={zoom} ajuste={ajuste} onAjuste={setAjuste} />
              </ReactFlow>
            </Vue.Provider>
          </div>
        ) : (
          <p className="chemins__attente">Les chemins se dessinent…</p>
        )}
        {/* La place du panneau : le cadre défile assez loin pour montrer ce qu'il couvre */}
        {/* Pas pour un chapitre qui tient à gauche du panneau : rien n'est dessous, et une barre de défilement surgirait */}
        {sceneChoisie && largeurUtile === largeurToile ? <div className="chemins__reserve" aria-hidden="true" /> : null}
      </div>
      {construire && sceneChoisie ? (
        <div className="chemins__rail" ref={rail}>
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
          />
        </div>
      ) : null}
      </div>
      {/* Le panneau d'une scène prend le coin de la mini-carte : elle revient quand il se referme */}
      {pret && disposition && !sceneChoisie && h * zoom > 2 * (place.fenetre - place.barre) ? (
        <MiniCarte disposition={disposition} zoom={zoom} cadre={cadre} toile={toile} largeurToile={largeurUtile} regard={regard} noeuds={chemins.noeuds} />
      ) : null}
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
          cote={geste.depuis === "panneau" ? "left-start" : "right-start"}
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
 * La mini-carte, quand le chapitre dépasse deux écrans : où l'on est dans le schéma, et un
 * clic pour s'y rendre. Elle suit le défilement de la page, que le schéma ne retient pas. Elle
 * se replie d'un clic, en un petit bouton qui la rouvre : dépliée, elle couvrait un coin du schéma.
 */
function MiniCarte({
  disposition, zoom, cadre, toile, largeurToile, regard, noeuds,
}: {
  disposition: Disposition; zoom: number; cadre: RefObject<HTMLDivElement | null>; toile: RefObject<HTMLDivElement | null>;
  /** La largeur où le schéma se centre, sans ce qu'un geste a pu allonger */
  largeurToile: number;
  regard: ARegarder; noeuds: NoeudDeChemin[];
}) {
  const [vu, setVu] = useState<{ x: number; y: number; l: number; h: number } | null>(null);
  const [repliee, setRepliee] = useState(lireRepliee);
  const plier = (oui: boolean) => {
    setRepliee(oui);
    try {
      localStorage.setItem(CLE_REPLIEE, oui ? "1" : "0");
    } catch {
      // Sans stockage, le repli tient le temps de la page
    }
  };
  const echelle = Math.min(118 / disposition.largeur, 190 / disposition.hauteur);
  useEffect(() => {
    const suivre = () => {
      const c = cadre.current;
      if (!c) return;
      const r = c.getBoundingClientRect();
      // La toile, et non le cadre : un geste a pu la pousser dans son cadre (F03-AC54)
      const t = toile.current?.getBoundingClientRect() ?? r;
      const decalage = (largeurToile - disposition.largeur * zoom) / 2;
      // Hors de l'écran, le schéma n'a pas besoin de sa carte
      if (r.bottom < barre() + 80 || r.top > window.innerHeight - 80) return setVu(null);
      const haut = (barre() - t.top - MARGE) / zoom;
      const gauche = (r.left - t.left - decalage) / zoom;
      setVu({ x: gauche, y: haut, l: c.clientWidth / zoom, h: (window.innerHeight - barre()) / zoom });
    };
    suivre();
    const c = cadre.current;
    window.addEventListener("scroll", suivre, { passive: true });
    window.addEventListener("resize", suivre);
    c?.addEventListener("scroll", suivre, { passive: true });
    return () => {
      window.removeEventListener("scroll", suivre);
      window.removeEventListener("resize", suivre);
      c?.removeEventListener("scroll", suivre);
    };
  }, [cadre, toile, largeurToile, disposition, zoom]);
  if (!vu) return null;
  if (repliee) {
    return (
      <button type="button" className="chemins__carte-ouvrir" onClick={() => plier(false)}>
        <Icone nom="chemins" />
        Mini-carte
      </button>
    );
  }

  const aller = (e: PointerEvent<SVGSVGElement>) => {
    const c = cadre.current;
    if (!c) return;
    const r = e.currentTarget.getBoundingClientRect();
    const y = (e.clientY - r.top) / echelle;
    const x = (e.clientX - r.left) / echelle;
    const t = toile.current?.getBoundingClientRect() ?? c.getBoundingClientRect();
    const hautDuSchema = t.top + window.scrollY + MARGE;
    window.scrollTo({ top: hautDuSchema + y * zoom - (window.innerHeight + barre()) / 2 });
    c.scrollTo({ left: c.scrollLeft + (t.left - c.getBoundingClientRect().left) + (largeurToile - disposition.largeur * zoom) / 2 + x * zoom - c.clientWidth / 2 });
  };
  const parId = new Map(noeuds.map((n) => [n.id, n]));
  const borne = (v: number, max: number) => Math.min(max, Math.max(0, v));
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
