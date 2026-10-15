"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from "react";
import type { PDFDocumentProxy } from "pdfjs-dist";
import type { Apercu as DonneesApercu } from "@/serveur/livre/apercu";
import type { BlocPlace } from "@/serveur/livre/dans-la-page";

/**
 * L'aperçu du livre (F11.2) : les pages que le Chromium du serveur a composées, affichées telles
 * quelles par pdf.js — les mêmes sur tout navigateur, iPad compris (ADR 0003). Un clic sur un
 * passage ouvre sa scène ; un clic sur un renvoi suit le choix (F11-AC83). La carte des blocs,
 * rendue par la composition, dit ce qui se trouve sous le clic.
 */

export type ModeApercu = "agrandie" | "double";
const LARGEUR_MM = 148;
const HAUTEUR_MM = 210;
const CLE_MODE = "apercu-mode";

type Charge = { apercu: DonneesApercu; doc: PDFDocumentProxy };
export type SourceApercu = { charge: Charge | null; calcul: boolean; erreur: string | null; calculer: () => Promise<void> };

/**
 * L'aperçu composé, tenu par le Livre : le volet « Aperçu » et la petite double page des
 * réglages lisent le même (étape 6, lot 3). Il se recalcule quand l'empreinte du contenu change ;
 * pendant une saisie, après un court répit, pour ne pas composer à chaque mot.
 */
export function useApercu(projetId: string, empreinte: string, actif: boolean): SourceApercu {
  const [charge, setCharge] = useState<Charge | null>(null);
  const [calcul, setCalcul] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const demande = useRef(0);

  const calculer = useCallback(async () => {
    const n = ++demande.current;
    setCalcul(true);
    setErreur(null);
    try {
      const reponse = await fetch(`/livre/${projetId}/apercu`, { method: "POST" });
      const r = (await reponse.json()) as { ok: true; apercu: DonneesApercu } | { ok: false; erreur: string };
      if (n !== demande.current) return;
      if (!r.ok) {
        setErreur(r.erreur);
        return;
      }
      const pdfjs = await import("pdfjs-dist");
      pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();
      const doc = await pdfjs.getDocument({ url: r.apercu.adresse, isEvalSupported: false }).promise;
      if (n !== demande.current) return void doc.destroy();
      setCharge((avant) => {
        void avant?.doc.destroy();
        return { apercu: r.apercu, doc };
      });
    } catch {
      if (n === demande.current) setErreur("L’aperçu n’a pas pu être calculé.");
    } finally {
      if (n === demande.current) setCalcul(false);
    }
  }, [projetId]);

  // Le contenu a changé depuis l'aperçu montré : il se recalcule, les pages précédentes restant lisibles
  const empreinteMontree = charge?.apercu.empreinte;
  const dejaCharge = charge !== null;
  useEffect(() => {
    if (!actif || empreinteMontree === empreinte) return;
    const minuteur = setTimeout(() => void calculer(), dejaCharge ? 1200 : 0);
    return () => clearTimeout(minuteur);
  }, [actif, empreinte, empreinteMontree, dejaCharge, calculer]);

  return { charge, calcul, erreur, calculer };
}

export function Apercu({
  source, limiteAuRecit, modeParDefaut, choisie, aller, onPassage, onRenvoi, nommer, barre,
}: {
  /** L'aperçu composé, tenu par le Livre */
  source: SourceApercu;
  /** « Relire » et « Vérifier les chemins » : l'aperçu commence au premier passage (F11-AC80) */
  limiteAuRecit: boolean;
  modeParDefaut: ModeApercu;
  /** Le passage dont la scène est ouverte : entouré de canard */
  choisie: string | null;
  /** Placer l'aperçu sur un passage ; le jeton change à chaque demande */
  aller: { sceneId: string; jeton: number } | null;
  onPassage: (sceneId: string) => void;
  onRenvoi: (cible: string, depuis: string) => void;
  /** « n° 12 · S042 » : le nom d'un passage pour un lecteur d'écran */
  nommer: (sceneId: string) => string;
  /** Ce que l'étape ajoute à la barre : le parcours des problèmes */
  barre?: ReactNode;
}) {
  const { charge, calcul, erreur, calculer } = source;
  const [mode, setMode] = useState<ModeApercu>(() => {
    try {
      const garde = window.localStorage.getItem(`${CLE_MODE}-${modeParDefaut}`);
      return garde === "agrandie" || garde === "double" ? garde : modeParDefaut;
    } catch {
      return modeParDefaut;
    }
  });
  const conteneur = useRef<HTMLDivElement>(null);

  const choisirMode = (m: ModeApercu) => {
    setMode(m);
    try {
      window.localStorage.setItem(`${CLE_MODE}-${modeParDefaut}`, m);
    } catch {
      // le choix vaut pour cette visite seulement
    }
  };

  const apercu = charge?.apercu ?? null;
  const premiere = apercu && limiteAuRecit ? Math.max(1, Math.min(...Object.values(apercu.pageDe), apercu.pages)) : 1;
  const folios = apercu ? Array.from({ length: Math.max(0, apercu.pages - premiere + 1) }, (_, i) => premiere + i) : [];
  const parPage = useMemo(() => {
    const m = new Map<number, BlocPlace[]>();
    for (const b of apercu?.carte ?? []) m.set(b.page, [...(m.get(b.page) ?? []), b]);
    return m;
  }, [apercu]);

  // Placer l'aperçu sur un passage demandé
  useEffect(() => {
    if (!aller || !apercu) return;
    const folio = apercu.pageDe[aller.sceneId];
    const page = folio ? conteneur.current?.querySelector<HTMLElement>(`[data-folio="${folio}"]`) : null;
    page?.scrollIntoView({ block: "start", behavior: "smooth" });
  }, [aller, apercu]);

  const etalees = mode === "double" ? doublesPages(folios) : folios.map((f) => [f]);

  return (
    <section className={`apercu apercu--${mode}${calcul && charge ? " apercu--calcul" : ""}`} aria-label="Aperçu du livre">
      <div className="apercu__barre">
        {barre}
        <span className="apercu__etat" role="status">
          {calcul ? "Mise à jour…" : erreur ? erreur : apercu ? `${apercu.passages} passage${apercu.passages > 1 ? "s" : ""} · ${apercu.pages} pages · ${apercu.etat}` : ""}
          {erreur && !calcul ? (
            <button type="button" className="lien" onClick={() => void calculer()}>
              Réessayer
            </button>
          ) : null}
        </span>
        <span className="segments" role="group" aria-label="Présentation de l’aperçu">
          <button type="button" aria-pressed={mode === "agrandie"} onClick={() => choisirMode("agrandie")}>
            Page agrandie
          </button>
          <button type="button" aria-pressed={mode === "double"} onClick={() => choisirMode("double")}>
            Double page
          </button>
        </span>
      </div>
      <div className="apercu__pages" ref={conteneur}>
        {!charge ? <p className="apercu__attente">{erreur ?? "Le livre est mis en pages sur le serveur…"}</p> : null}
        {charge
          ? etalees.map((etalee) => (
              <div className="apercu__etalee" key={etalee.join("-")}>
                {etalee.map((folio, i) =>
                  folio === 0 ? (
                    <div key={`vide-${i}`} className="apercu__page apercu__page--absente" aria-hidden="true" />
                  ) : (
                    <PageDuLivre
                      key={`${folio}-${charge.apercu.empreinte}`}
                      folio={folio}
                      doc={charge.doc}
                      rang={charge.apercu.horsPagination + folio}
                      blocs={parPage.get(folio) ?? []}
                      choisie={choisie}
                      onPassage={onPassage}
                      onRenvoi={onRenvoi}
                      nommer={nommer}
                    />
                  ),
                )}
              </div>
            ))
          : null}
      </div>
    </section>
  );
}

/** Les doubles pages : la page paire à gauche, l'impaire à droite ; une page sans vis-à-vis montré reste seule de son côté. */
function doublesPages(folios: number[]): number[][] {
  const etalees = new Map<number, number[]>();
  for (const f of folios) {
    const e = etalees.get(Math.floor(f / 2)) ?? [0, 0];
    e[f % 2 === 0 ? 0 : 1] = f;
    etalees.set(Math.floor(f / 2), e);
  }
  return [...etalees.values()];
}

const dedans = (b: BlocPlace, x: number, y: number, marge = 0) => x >= b.x - marge && x <= b.x + b.l + marge && y >= b.y - marge && y <= b.y + b.h + marge;

function PageDuLivre({
  folio, doc, rang, blocs, choisie, onPassage, onRenvoi, nommer,
}: {
  folio: number;
  doc: PDFDocumentProxy;
  rang: number;
  blocs: BlocPlace[];
  choisie: string | null;
  onPassage: (sceneId: string) => void;
  onRenvoi: (cible: string, depuis: string) => void;
  nommer: (sceneId: string) => string;
}) {
  const [visible, setVisible] = useState(false);
  const [survol, setSurvol] = useState(false);
  const { boite, toile } = useToile<HTMLDivElement>(doc, rang, visible);

  useEffect(() => {
    const el = boite.current;
    if (!el) return;
    const obs = new IntersectionObserver(([x]) => x.isIntersecting && setVisible(true), { rootMargin: "800px 0px" });
    obs.observe(el);
    return () => obs.disconnect();
  }, [boite]);

  const enMm = (ev: { clientX: number; clientY: number }) => {
    const r = boite.current!.getBoundingClientRect();
    return { x: ((ev.clientX - r.left) / r.width) * LARGEUR_MM, y: ((ev.clientY - r.top) / r.height) * HAUTEUR_MM };
  };
  const sous = (ev: { clientX: number; clientY: number }) => {
    const { x, y } = enMm(ev);
    const renvoi = blocs.find((b) => b.cible && dedans(b, x, y, 0.8));
    if (renvoi) return { renvoi };
    const bloc = blocs.find((b) => !b.cible && dedans(b, x, y));
    return bloc ? { bloc } : null;
  };

  // Le passage ouvert, entouré : un cadre par page, autour de ses blocs
  const siens = choisie ? blocs.filter((b) => b.scene === choisie && !b.cible) : [];
  const cadre = siens.length
    ? {
        x: Math.min(...siens.map((b) => b.x)) - 1.6,
        y: Math.min(...siens.map((b) => b.y)) - 1.6,
        l: Math.max(...siens.map((b) => b.x + b.l)) - Math.min(...siens.map((b) => b.x)) + 3.2,
        h: Math.max(...siens.map((b) => b.y + b.h)) - Math.min(...siens.map((b) => b.y)) + 3.2,
      }
    : null;
  const pc = (v: number, total: number) => `${(v / total) * 100}%`;

  return (
    <div
      ref={boite}
      className={`apercu__page${survol ? " apercu__page--survol" : ""}`}
      data-folio={folio}
      onClick={(ev) => {
        const touche = sous(ev);
        if (touche?.renvoi) onRenvoi(touche.renvoi.cible!, touche.renvoi.scene);
        else if (touche?.bloc) onPassage(touche.bloc.scene);
      }}
      onMouseMove={(ev) => setSurvol(Boolean(sous(ev)))}
      onMouseLeave={() => setSurvol(false)}
    >
      <canvas ref={toile} aria-label={`Page ${folio}`} role="img" />
      {cadre ? <span className="apercu__choisie" style={{ left: pc(cadre.x, LARGEUR_MM), top: pc(cadre.y, HAUTEUR_MM), width: pc(cadre.l, LARGEUR_MM), height: pc(cadre.h, HAUTEUR_MM) }} /> : null}
      {/* Pour le clavier et les lecteurs d'écran : chaque passage de la page s'ouvre aussi par un bouton */}
      <span className="vh">
        {[...new Set(blocs.filter((b) => !b.cible).map((b) => b.scene))].map((s) => (
          <button key={s} type="button" onClick={() => onPassage(s)}>
            Ouvrir {nommer(s)}
          </button>
        ))}
        {blocs.filter((b) => b.cible).map((b, i) => (
          <button key={`${b.cible}-${i}`} type="button" onClick={() => onRenvoi(b.cible!, b.scene)}>
            Depuis {nommer(b.scene).split(" · ")[0]}, aller au {nommer(b.cible!).split(" · ")[0]}
          </button>
        ))}
      </span>
      <span className="apercu__folio">p. {folio}</span>
    </div>
  );
}

/** Dessine une page du PDF dans une toile, à la largeur de sa boîte. */
function useToile<B extends HTMLElement>(doc: PDFDocumentProxy, rang: number, visible: boolean): { boite: RefObject<B | null>; toile: RefObject<HTMLCanvasElement | null> } {
  const boite = useRef<B>(null);
  const toile = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!visible || !toile.current || !boite.current) return;
    let annule = false;
    let tache: { cancel: () => void } | null = null;
    void (async () => {
      const page = await doc.getPage(rang);
      if (annule || !toile.current || !boite.current) return;
      const largeur = boite.current.clientWidth * (window.devicePixelRatio || 1);
      const vue = page.getViewport({ scale: largeur / page.getViewport({ scale: 1 }).width });
      const t = toile.current;
      t.width = Math.round(vue.width);
      t.height = Math.round(vue.height);
      const rendu = page.render({ canvasContext: t.getContext("2d")!, viewport: vue, canvas: t });
      tache = rendu;
      await rendu.promise.catch(() => undefined);
    })();
    return () => {
      annule = true;
      tache?.cancel();
    };
  }, [visible, doc, rang]);
  return { boite, toile };
}

/**
 * La petite double page des réglages (étape 6, 15 octobre 2026) : les deux pages en vis-à-vis
 * autour d'une page du livre, telles que l'aperçu les a composées. Elle suit la saisie : chaque
 * enregistrement change l'empreinte, et l'aperçu se recompose.
 */
export function PetiteDoublePage({ source, folio, legende }: { source: SourceApercu; folio: number | null; legende: string }) {
  const { charge, calcul, erreur } = source;
  const apercu = charge?.apercu ?? null;
  const etalee = apercu && folio ? (folio % 2 === 0 ? [folio, folio + 1] : [folio - 1, folio]).map((f) => (f >= 1 && f <= apercu.pages ? f : 0)) : null;
  return (
    <figure className={`petite-double${calcul && charge ? " petite-double--calcul" : ""}`}>
      <div className="petite-double__pages" aria-hidden={!etalee || undefined}>
        {charge && etalee
          ? etalee.map((f, i) =>
              f ? <PetitePage key={`${f}-${charge.apercu.empreinte}`} doc={charge.doc} rang={charge.apercu.horsPagination + f} folio={f} /> : <span key={`vide-${i}`} className="petite-double__page petite-double__page--absente" />,
            )
          : [0, 1].map((i) => <span key={i} className="petite-double__page petite-double__page--attente" />)}
      </div>
      <figcaption className="petite-double__legende" role="status">
        {calcul ? "Mise à jour…" : erreur ? erreur : !charge ? "Mise en pages sur le serveur…" : folio ? legende : "Page absente du livre"}
      </figcaption>
    </figure>
  );
}

function PetitePage({ doc, rang, folio }: { doc: PDFDocumentProxy; rang: number; folio: number }) {
  const { boite, toile } = useToile<HTMLSpanElement>(doc, rang, true);
  return (
    <span ref={boite} className="petite-double__page">
      <canvas ref={toile} role="img" aria-label={`Page ${folio}`} />
    </span>
  );
}
