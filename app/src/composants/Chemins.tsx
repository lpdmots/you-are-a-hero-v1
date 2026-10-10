"use client";

import Link from "next/link";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { chapitresDe, departDe, nomScene, referenceScene, type Plan } from "@/domaine/recit";
import { Icone } from "./Icone";
import { TamponScene } from "./TamponScene";

/**
 * La vue « Chemins » d'un chapitre (F03.1 ; docs/design.md, « Organisation du récit reprise
 * après critique ») : les mêmes scènes que la vue « Scènes », reliées par leurs choix. Rien
 * ne s'y saisit : les chemins se déduisent des textes. Chaque lien part de la ligne du
 * choix qui le propose ; le départ, les fins et « sans suite » se lisent en mots.
 */

export type NoeudDeChemin = {
  id: string; reference: number; titre: string | null; vide: boolean; depart: boolean; fin: boolean;
  /** La page de la scène */
  lien: string;
};
export type LienDeChemin = {
  id: string; de: string; libelle: string;
  /** Liaison cachée par énigme : une suite du récit, sans phrase dans le texte (F05.1) */
  cache: boolean;
  /** La scène d'arrivée, si elle est dans ce chapitre */
  vers: string | null;
  /** Vers un autre chapitre : son titre, et la scène visée si la personne peut la nommer (F03-AC25) */
  ailleurs?: { chapitre: string; nom?: string; lien?: string };
  /** Sans destination encore, ou vers une scène supprimée */
  manque?: "sans" | "supprimee";
};
/** Un choix d'un autre chapitre qui mène à une scène de celui-ci */
export type EntreeDeChemin = { vers: string; chapitre: string; lien?: string };

/** Les scènes rangées par distance à l'entrée du chapitre : une colonne par pas. */
export function colonnesDe(noeuds: NoeudDeChemin[], liens: LienDeChemin[]): NoeudDeChemin[][] {
  const ici = new Set(noeuds.map((n) => n.id));
  const suites = new Map<string, string[]>();
  const arrivees = new Map<string, number>();
  for (const l of liens) {
    if (!l.vers || !ici.has(l.vers) || !ici.has(l.de) || l.vers === l.de) continue;
    suites.set(l.de, [...(suites.get(l.de) ?? []), l.vers]);
    arrivees.set(l.vers, (arrivees.get(l.vers) ?? 0) + 1);
  }
  const rang = new Map<string, number>();
  const parcourir = (racine: string) => {
    const file: [string, number][] = [[racine, 0]];
    while (file.length) {
      const [id, n] = file.shift()!;
      if (rang.has(id)) continue;
      rang.set(id, n);
      for (const suite of suites.get(id) ?? []) file.push([suite, n + 1]);
    }
  };
  // D'abord le départ et les scènes où rien du chapitre ne mène, dans l'ordre du plan ; puis ce qui reste
  for (const n of noeuds) if (n.depart) parcourir(n.id);
  for (const n of noeuds) if (!arrivees.has(n.id)) parcourir(n.id);
  for (const n of noeuds) parcourir(n.id);
  const colonnes: NoeudDeChemin[][] = [];
  for (const n of noeuds) (colonnes[rang.get(n.id)!] ??= []).push(n);
  return colonnes.filter(Boolean);
}

type Trait = { id: string; d: string; cache: boolean };

export function Chemins({
  noeuds, liens, entrees, designee, pourEleve = false,
}: {
  noeuds: NoeudDeChemin[]; liens: LienDeChemin[]; entrees: EntreeDeChemin[];
  /** La scène où mène le choix qu'on vient de suivre depuis un autre chapitre */
  designee?: string;
  pourEleve?: boolean;
}) {
  const colonnes = useMemo(() => colonnesDe(noeuds, liens), [noeuds, liens]);
  const toile = useRef<HTMLDivElement>(null);
  const cadre = useRef<HTMLDivElement>(null);
  const [traits, setTraits] = useState<Trait[]>([]);
  const [taille, setTaille] = useState({ l: 0, h: 0 });
  const [echelle, setEchelle] = useState(1);
  const nomDe = (id: string) => {
    const n = noeuds.find((x) => x.id === id);
    return n ? `${pourEleve ? "" : `${referenceScene(n.reference)} `}${n.titre ?? (pourEleve ? "scène sans titre" : "")}`.trim() : "";
  };
  const arriveesDe = (id: string) => liens.filter((l) => l.vers === id && l.de !== id).length + entrees.filter((e) => e.vers === id).length;

  // Les traits se tracent d'après la place réelle des cartes : de la ligne du choix à la scène d'arrivée
  useLayoutEffect(() => {
    const zone = toile.current;
    if (!zone) return;
    const tracer = () => {
      const origine = zone.getBoundingClientRect();
      const k = echelle || 1;
      const suite: Trait[] = [];
      for (const l of liens) {
        if (!l.vers) continue;
        const depart = zone.querySelector<HTMLElement>(`[data-lien="${l.id}"]`);
        const arrivee = zone.querySelector<HTMLElement>(`[data-noeud="${l.vers}"] .noeud__carte`);
        if (!depart || !arrivee) continue;
        const a = depart.getBoundingClientRect();
        const b = arrivee.getBoundingClientRect();
        const versLArriere = b.left <= a.left;
        const x1 = ((versLArriere ? a.left : a.right) - origine.left) / k;
        const y1 = (a.top + a.height / 2 - origine.top) / k;
        const x2 = ((versLArriere ? b.right : b.left) - origine.left) / k;
        const y2 = (b.top + 24 - origine.top) / k;
        const pousse = Math.max(40, Math.abs(x2 - x1) / 2) * (versLArriere ? -1 : 1);
        suite.push({ id: l.id, cache: l.cache, d: `M${x1},${y1} C${x1 + pousse},${y1} ${x2 - pousse},${y2} ${x2},${y2}` });
      }
      setTraits((avant) => (avant.length === suite.length && avant.every((t, i) => t.d === suite[i].d) ? avant : suite));
      setTaille((avant) => (avant.l === zone.scrollWidth && avant.h === zone.scrollHeight ? avant : { l: zone.scrollWidth, h: zone.scrollHeight }));
    };
    tracer();
    const veille = new ResizeObserver(tracer);
    veille.observe(zone);
    return () => veille.disconnect();
  }, [liens, colonnes, echelle]);

  useEffect(() => {
    if (!designee) return;
    toile.current?.querySelector<HTMLElement>(`[data-noeud="${designee}"]`)?.scrollIntoView({ block: "center", inline: "center" });
  }, [designee]);

  const toutVoir = () => {
    const large = toile.current?.scrollWidth ?? 0;
    const place = cadre.current?.clientWidth ?? 0;
    setEchelle(large && place ? Math.min(1, Math.max(0.3, (place - 8) / large)) : 1);
  };

  return (
    <div className="chemins">
      <div className="chemins__outils">
        <button type="button" className="btn btn--petit" onClick={toutVoir}>
          Tout voir
        </button>
        <button type="button" className="btn btn--petit" aria-label="Réduire" onClick={() => setEchelle((e) => Math.max(0.3, Math.round((e - 0.1) * 10) / 10))}>
          −
        </button>
        <button type="button" className="btn btn--petit" aria-label="Agrandir" onClick={() => setEchelle((e) => Math.min(1, Math.round((e + 0.1) * 10) / 10))}>
          +
        </button>
        {echelle < 1 ? (
          <button type="button" className="lien" onClick={() => setEchelle(1)}>
            Taille lisible
          </button>
        ) : null}
      </div>
      <div className="chemins__cadre" ref={cadre} style={{ height: echelle < 1 && taille.h ? taille.h * echelle + 8 : undefined }}>
        <div className="chemins__toile" ref={toile} style={echelle < 1 ? { transform: `scale(${echelle})`, transformOrigin: "0 0" } : undefined}>
          <svg className="chemins__traits" width={taille.l} height={taille.h} aria-hidden="true">
            <defs>
              <marker id="chemin-fleche" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                <path d="M1,1 L9,5 L1,9" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </marker>
            </defs>
            {traits.map((t) => (
              <path key={t.id} d={t.d} className={t.cache ? "est-cache" : undefined} markerEnd="url(#chemin-fleche)" />
            ))}
          </svg>
          {colonnes.map((colonne, i) => (
            <ol key={i} className="chemins__colonne">
              {colonne.map((n) => {
                const suites = liens.filter((l) => l.de === n.id);
                const nombre = arriveesDe(n.id);
                return (
                  <li key={n.id} className={`noeud${designee === n.id ? " est-designe" : ""}`} data-noeud={n.id}>
                    <p className="noeud__dessus">
                      {n.depart ? (
                        <span className="repere repere--depart">
                          <Icone nom="drapeau" />
                          Départ du livre
                        </span>
                      ) : null}
                      {n.fin ? (
                        <span className="repere repere--fin">
                          <Icone nom="fin" />
                          Fin de l’histoire
                        </span>
                      ) : null}
                      {nombre > 1 ? <span className="repere">{nombre} chemins se rejoignent</span> : null}
                      {entrees
                        .filter((e) => e.vers === n.id)
                        .map((e, k) =>
                          e.lien ? (
                            <Link key={k} className="repere repere--ailleurs" href={e.lien}>
                              depuis {e.chapitre}
                            </Link>
                          ) : (
                            <span key={k} className="repere">
                              depuis {e.chapitre}
                            </span>
                          ),
                        )}
                    </p>
                    <div className="noeud__carte">
                      <div className="noeud__tete">
                        {pourEleve ? null : <span className="fiche__ref">{referenceScene(n.reference)}</span>}
                        <TamponScene vide={n.vide} />
                      </div>
                      <p className={`fiche__titre${n.titre ? "" : " fiche__titre--vide"}`}>{n.titre ?? "sans titre"}</p>
                      <ul className="noeud__suites">
                        {suites.map((l) => (
                          <li key={l.id} data-lien={l.id} className={l.cache ? "est-cache" : undefined}>
                            <span className="noeud__libelle">
                              {l.cache ? (
                                <>
                                  <Icone nom="cle" />
                                  Lien caché
                                </>
                              ) : (
                                l.libelle || "Choix sans libellé"
                              )}
                            </span>
                            {l.manque === "sans" ? (
                              <span className="copie__dest-vide">
                                <Icone nom="bloque" />
                                Sans destination
                              </span>
                            ) : l.manque === "supprimee" ? (
                              <span className="copie__dest-vide">scène supprimée</span>
                            ) : l.ailleurs ? (
                              l.ailleurs.lien ? (
                                <Link className="noeud__ailleurs" href={l.ailleurs.lien}>
                                  <Icone nom="fleche" />
                                  {l.ailleurs.chapitre}
                                  {l.ailleurs.nom ? ` · ${l.ailleurs.nom}` : ""}
                                </Link>
                              ) : (
                                <span className="noeud__ailleurs">
                                  <Icone nom="fleche" />
                                  autre chapitre · {l.ailleurs.chapitre}
                                </span>
                              )
                            ) : l.vers ? (
                              <span className="noeud__vers">
                                <Icone nom="fleche" />
                                {nomDe(l.vers)}
                              </span>
                            ) : null}
                          </li>
                        ))}
                        {suites.length === 0 && !n.fin ? <li className="noeud__sans-suite">Sans suite</li> : null}
                      </ul>
                      <Link className="noeud__ouvrir" href={n.lien} aria-label={`Ouvrir ${pourEleve ? (n.titre ?? "la scène") : referenceScene(n.reference)}`}>
                        Ouvrir
                        <Icone nom="fleche" />
                      </Link>
                    </div>
                  </li>
                );
              })}
            </ol>
          ))}
        </div>
      </div>
    </div>
  );
}


/** Les chemins d'un chapitre tels que l'adulte les lit, d'après le plan et ses liens. */
export function cheminsDuPlan(plan: Plan, chapitreId: string, projetId: string): { noeuds: NoeudDeChemin[]; liens: LienDeChemin[]; entrees: EntreeDeChemin[] } {
  const chapitres = chapitresDe(plan);
  const chapitre = chapitres.find((c) => c.id === chapitreId);
  if (!chapitre) return { noeuds: [], liens: [], entrees: [] };
  const depart = departDe(plan);
  const ou = new Map(chapitres.flatMap((c) => c.scenes.map((s) => [s.id, { scene: s, chapitre: c }] as const)));
  const ici = new Set(chapitre.scenes.map((s) => s.id));
  const vueChemins = (c: string, scene?: string) => `/projet/${projetId}/chapitre/${c}?vue=chemins${scene ? `&scene=${scene}` : ""}`;
  return {
    noeuds: chapitre.scenes.map((s) => ({
      id: s.id, reference: s.reference, titre: s.titre, vide: s.texteVide, depart: depart?.id === s.id, fin: s.fin,
      lien: `/projet/${projetId}/scene/${s.id}?de=chemins`,
    })),
    liens: plan.liens
      .filter((l) => ici.has(l.sceneId))
      .map((l): LienDeChemin => {
        const base = { id: l.renvoiId, de: l.sceneId, libelle: l.libelle, cache: l.cache };
        if (!l.cibleId) return { ...base, vers: null, manque: "sans" };
        const cible = ou.get(l.cibleId);
        // Une destination partie dans la corbeille n'est redirigée nulle part : le choix le dit (F03-AC14)
        if (!cible) return { ...base, vers: null, manque: "supprimee" };
        if (cible.chapitre.id === chapitreId) return { ...base, vers: l.cibleId };
        return { ...base, vers: null, ailleurs: { chapitre: cible.chapitre.titre, nom: nomScene(cible.scene), lien: vueChemins(cible.chapitre.id, cible.scene.id) } };
      }),
    entrees: plan.liens.flatMap((l) => {
      const origine = ou.get(l.sceneId);
      return l.cibleId && ici.has(l.cibleId) && origine && origine.chapitre.id !== chapitreId
        ? [{ vers: l.cibleId, chapitre: origine.chapitre.titre, lien: vueChemins(origine.chapitre.id, origine.scene.id) }]
        : [];
    }),
  };
}
