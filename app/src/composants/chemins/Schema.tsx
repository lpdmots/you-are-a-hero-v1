"use client";

import "@xyflow/react/dist/base.css";
import { applyNodeChanges, BaseEdge, EdgeLabelRenderer, Handle, NodeToolbar, Position, ReactFlow, type Edge, type EdgeProps, type Node, type NodeChange, type NodeProps } from "@xyflow/react";
import Link from "next/link";
import { createContext, useCallback, useContext, useEffect, useEffectEvent, useLayoutEffect, useMemo, useRef, useState, type PointerEvent, type ReactNode, type RefObject } from "react";
import { MOT_DE_MARQUE, type ARegarder, type Chemins, type NoeudDeChemin } from "@/domaine/chemins";
import { Bulle } from "../Bulle";
import { Icone } from "../Icone";
import { TamponScene } from "../TamponScene";
import { disposer, texteDeLEtiquette, texteDuLibelle, type Disposition, type Element, type Mesure } from "./disposer";

/**
 * Le schéma des chemins d'un chapitre (F03.1, « Vue Chemins à reprendre ») : les scènes de
 * haut en bas, placées par dagre, dessinées par React Flow. La page défile normalement : le
 * schéma prend toute sa hauteur, et rien ne s'y déplace ni ne s'y modifie. Ce fichier et ses
 * deux bibliothèques ne se chargent qu'à l'ouverture de « Chemins », sur un écran large.
 */

/** Autour du schéma, dans son cadre */
const MARGE = 28;
/** La barre du haut de l'application, qui reste à l'écran */
const BARRE = 58;
/** En dessous, on regarde l'ensemble : les libellés des choix ne se lisent plus et sont masqués */
const LOIN = 0.62;
/** « Tout voir » descend aussi bas qu'il le faut ; les boutons « − » et « + » restent entre deux tailles utiles */
const ZOOM = { toutVoir: 0.05, min: 0.2, lisible: 0.7, max: 1, pas: 0.1 };

type DonneesScene = NoeudDeChemin & { marques: string[] };
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
}>({ active: null, choisie: null, survolee: null, voisines: new Set(), loin: false, montre: null });

const classes = (...noms: (string | false | null | undefined)[]): string => noms.filter(Boolean).join(" ");

function CarteScene({ id, data, selected }: NodeProps<NoeudScene>) {
  const vue = useContext(Vue);
  const titre = data.titre ?? "sans titre";
  return (
    <div
      className={classes("carte-chemin", selected && "est-choisie", vue.designee === id && "est-designee", vue.choisie && vue.choisie !== id && !vue.voisines.has(id) && "est-en-retrait")}
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

function TraitDeChemin({ source, target, data }: EdgeProps<Trait>) {
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
            className={classes("libelle-chemin", data.cache && "est-cache", data.remonte && "remonte", touche && "est-entier", efface && "est-efface")}
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

export default function Schema({
  chemins, regard, designee, montre, fois, pourEleve, tete,
}: {
  chemins: Chemins; regard: ARegarder; designee?: string;
  /** La scène ou le choix que le parcours de « À regarder » désigne, et le nombre de pas faits */
  montre: string | null; fois: number;
  /** Un élève ne lit pas les liens cachés : on ne lui en parle pas */
  pourEleve: boolean;
  /** La ligne « À regarder », que l'en-tête du schéma place à côté de ses boutons */
  tete: ReactNode;
}) {
  const cadre = useRef<HTMLDivElement>(null);
  const [disposition, setDisposition] = useState<Disposition | null>(null);
  const [place, setPlace] = useState({ gauche: 0, largeur: 0, fenetre: 0 });
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
      setDisposition(d);
      setNoeuds(
        d.elements.map((e) => {
          const p = d.places.get(e.id)!;
          const commun = { id: e.id, position: { x: p.x, y: p.y }, width: p.l, height: p.h, draggable: false, connectable: false, deletable: false };
          if (e.sorte !== "scene") return { ...commun, type: "etiquette" as const, data: { element: e }, selectable: false, focusable: false };
          const n = parId.get(e.id)!;
          return { ...commun, type: "scene" as const, data: { ...n, marques: e.marques.map((m, i) => (i ? MOT_DE_MARQUE[m].toLocaleLowerCase("fr") : MOT_DE_MARQUE[m])) }, ariaLabel: n.titre ?? "Scène sans titre" };
        }),
      );
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

  // Le schéma prend toute la largeur de la fenêtre, d'un bord à l'autre
  useLayoutEffect(() => {
    const mesurer = () => {
      const parent = cadre.current?.parentElement;
      if (!parent) return;
      const suite = { gauche: Math.round(parent.getBoundingClientRect().left), largeur: document.documentElement.clientWidth, fenetre: window.innerHeight };
      setPlace((avant) => (avant.gauche === suite.gauche && avant.largeur === suite.largeur && avant.fenetre === suite.fenetre ? avant : suite));
    };
    mesurer();
    window.addEventListener("resize", mesurer);
    return () => window.removeEventListener("resize", mesurer);
  }, []);

  const l = disposition?.largeur ?? 0;
  const h = disposition?.hauteur ?? 0;
  /** La taille lisible : le schéma tient dans la largeur, sans descendre sous une taille où les titres se lisent */
  const lisible = l && place.largeur ? Math.floor(borner((place.largeur - 2 * MARGE) / l, ZOOM.lisible, ZOOM.max) * 100) / 100 : 1;
  const zoom = choisi ?? lisible;
  const loin = zoom < LOIN;
  const largeurToile = Math.max(place.largeur, Math.ceil(l * zoom + 2 * MARGE));
  const hauteurToile = Math.ceil(h * zoom + 2 * MARGE);

  // Changer de taille garde à l'écran ce qu'on regardait
  const hautDuSchema = () => (cadre.current ? cadre.current.getBoundingClientRect().top + window.scrollY + MARGE : 0);
  const changer = (suite: number | null) => {
    const haut = hautDuSchema();
    const milieu = window.scrollY + window.innerHeight / 2;
    ancre.current = milieu > haut && window.scrollY + BARRE > haut - MARGE ? (milieu - haut) / zoom : null;
    setChoisi(suite === null ? null : arrondir(borner(suite, ZOOM.min, ZOOM.max)));
  };
  useLayoutEffect(() => {
    if (ancre.current === null) return;
    window.scrollTo({ top: hautDuSchema() + ancre.current * zoom - window.innerHeight / 2 });
    ancre.current = null;
  }, [zoom]);

  const toutVoir = () => {
    const enTete = cadre.current?.previousElementSibling?.getBoundingClientRect().height ?? 0;
    const hauteur = window.innerHeight - BARRE - enTete - 2 * MARGE - 8;
    ancre.current = null;
    setChoisi(Math.floor(borner(Math.min((place.largeur - 2 * MARGE) / l, hauteur / h), ZOOM.toutVoir, ZOOM.max) * 100) / 100);
    // Le haut du schéma vient sous la barre et son en-tête : on le voit alors d'un seul regard
    setTimeout(() => {
      if (cadre.current) window.scrollTo({ top: cadre.current.getBoundingClientRect().top + window.scrollY - BARRE - enTete });
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
    const enTete = c.previousElementSibling?.getBoundingClientRect().height ?? 0;
    const doux = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
    window.scrollTo({ top: c.getBoundingClientRect().top + window.scrollY + MARGE + y * zoom - (window.innerHeight + BARRE + enTete) / 2, behavior: doux });
    c.scrollTo({ left: (largeurToile - l * zoom) / 2 + x * zoom - c.clientWidth / 2, behavior: doux });
  });
  useEffect(() => {
    if (!pret || !montre) return;
    const attente = setTimeout(() => montrer(montre), 0);
    return () => clearTimeout(attente);
  }, [pret, montre, fois]);

  const changerNoeuds = useCallback((changements: NodeChange<NoeudScene | NoeudEtiquette>[]) => setNoeuds((avant) => applyNodeChanges(changements, avant)), []);
  const choisie = noeuds.find((n) => n.selected)?.id ?? null;
  const voisines = useMemo(() => new Set(choisie ? traits.flatMap((t) => (t.source === choisie ? [t.target] : t.target === choisie ? [t.source] : [])) : []), [choisie, traits]);
  const vue = useMemo(() => ({ active: choisie ?? survolee, choisie, survolee, voisines, loin, designee, montre }), [choisie, survolee, voisines, loin, designee, montre]);

  return (
    <>
      <div className="chemins__tete">
        {tete}
        <div className="chemins__outils">
          {zoom !== lisible ? (
            <button type="button" className="lien" onClick={() => changer(null)}>
              Taille lisible
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
          </Bulle>
        </div>
      </div>
      <div className="chemins__cadre" ref={cadre} style={place.largeur ? { width: place.largeur, marginLeft: -place.gauche } : undefined} data-zoom={zoom} data-loin={loin || undefined}>
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
          <div className="chemins__toile" style={{ width: largeurToile, height: hauteurToile }} data-dessine={dessine || undefined}>
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
                viewport={{ x: Math.round((largeurToile - l * zoom) / 2), y: MARGE, zoom }}
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
                proOptions={{ hideAttribution: true }}
                ariaLabelConfig={{
                  "node.a11yDescription.default": "Entrée ou Espace : montrer les chemins de cette scène. Échap : ne plus les montrer.",
                  "node.a11yDescription.keyboardDisabled": "Entrée ou Espace : montrer les chemins de cette scène. Échap : ne plus les montrer.",
                }}
              />
            </Vue.Provider>
          </div>
        ) : (
          <p className="chemins__attente">Les chemins se dessinent…</p>
        )}
      </div>
      {pret && disposition && h * zoom > 2 * (place.fenetre - BARRE) ? <MiniCarte disposition={disposition} zoom={zoom} cadre={cadre} regard={regard} noeuds={chemins.noeuds} /> : null}
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
  disposition, zoom, cadre, regard, noeuds,
}: {
  disposition: Disposition; zoom: number; cadre: RefObject<HTMLDivElement | null>; regard: ARegarder; noeuds: NoeudDeChemin[];
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
      const toile = c.querySelector<HTMLElement>(".chemins__toile");
      const decalage = toile ? (toile.clientWidth - disposition.largeur * zoom) / 2 : MARGE;
      // Hors de l'écran, le schéma n'a pas besoin de sa carte
      if (r.bottom < BARRE + 80 || r.top > window.innerHeight - 80) return setVu(null);
      const haut = (BARRE - r.top - MARGE) / zoom;
      const gauche = (c.scrollLeft - decalage) / zoom;
      setVu({ x: gauche, y: haut, l: c.clientWidth / zoom, h: (window.innerHeight - BARRE) / zoom });
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
  }, [cadre, disposition, zoom]);
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
    const hautDuSchema = c.getBoundingClientRect().top + window.scrollY + MARGE;
    window.scrollTo({ top: hautDuSchema + y * zoom - (window.innerHeight + BARRE) / 2 });
    c.scrollTo({ left: x * zoom - c.clientWidth / 2 });
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
