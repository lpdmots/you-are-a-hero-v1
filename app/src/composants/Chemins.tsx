"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import {
  aRegarder, compteARegarder, MOT_DE_MARQUE, ordreDeLecture, type ARegarder, type Chemins as DonneesDesChemins, type EntreeDeChemin, type LienDeChemin,
  type NoeudDeChemin, type SorteARegarder,
} from "@/domaine/chemins";
import { referenceScene } from "@/domaine/recit";
import { Icone } from "./Icone";
import { TamponScene } from "./TamponScene";

/**
 * La vue « Chemins » d'un chapitre (F03.1, « Vue Chemins à reprendre » ; docs/design.md,
 * « Vue Chemins reprise ») : les mêmes scènes que la vue « Scènes », reliées par leurs choix.
 * Rien ne s'y saisit : les chemins se déduisent des textes. Sur un écran large, un schéma de
 * haut en bas, qui ne se charge qu'ici ; sur téléphone, la liste des scènes, chaque choix
 * disant où il mène. En tête, ce qu'il y a « à regarder ».
 */

const ATTENTE = <p className="chemins__attente">Les chemins se dessinent…</p>;
const Schema = dynamic(() => import("./chemins/Schema"), { ssr: false, loading: () => ATTENTE });

// Téléphone ou écran large : on ne le sait que dans le navigateur
const ETROIT = "(max-width: 720px)";
const suivreLaLargeur = (prevenir: () => void) => {
  const media = window.matchMedia(ETROIT);
  media.addEventListener("change", prevenir);
  return () => media.removeEventListener("change", prevenir);
};
const estEtroit = (): boolean | null => window.matchMedia(ETROIT).matches;
const pasEncoreSu = (): boolean | null => null;

export function Chemins({
  noeuds, liens, entrees, designee, pourEleve = false,
}: {
  noeuds: NoeudDeChemin[]; liens: LienDeChemin[]; entrees: EntreeDeChemin[];
  /** La scène où mène le choix qu'on vient de suivre depuis un autre chapitre */
  designee?: string;
  pourEleve?: boolean;
}) {
  const etroit = useSyncExternalStore(suivreLaLargeur, estEtroit, pasEncoreSu);
  const chemins = useMemo<DonneesDesChemins>(() => ({ noeuds, liens, entrees }), [noeuds, liens, entrees]);
  // Un élève ne connaît ni les chemins venus d'autres chapitres ni les liens cachés : on ne lui dit que ses choix
  const regard = useMemo(() => aRegarder(chemins, { scenes: !pourEleve }), [chemins, pourEleve]);
  // Tout ce qui est à regarder, à la suite : on le parcourt comme les occurrences d'un mot dans un texte
  const aVoir = useMemo(() => regard.sortes.flatMap(({ sorte, ou }) => ou.map((id) => ({ sorte, id }))), [regard]);
  const [pas, setPas] = useState<{ rang: number; fois: number } | null>(null);
  const courant = pas ? (aVoir[pas.rang] ?? null) : null;
  const aller = (rang: number) => setPas((avant) => ({ rang: ((rang % aVoir.length) + aVoir.length) % aVoir.length, fois: (avant?.fois ?? 0) + 1 }));
  // Un compte cliqué mène au premier de sa sorte ; cliqué de nouveau, au suivant de la même sorte
  const allerA = (sorte: SorteARegarder) => {
    const rangs = aVoir.flatMap((x, i) => (x.sorte === sorte ? [i] : []));
    const ici = courant?.sorte === sorte && pas ? rangs.indexOf(pas.rang) : -1;
    aller(rangs[(ici + 1) % rangs.length]);
  };

  const tete = regard.sortes.length ? (
    <div className="chemins__regarder">
      <span className="chemins__regarder-mot">
        <span className="point-regarder" aria-hidden="true" />À regarder :
      </span>
      {regard.sortes.map(({ sorte, ou }) => (
        <button key={sorte} type="button" className={`lien${courant?.sorte === sorte ? " est-courant" : ""}`} aria-current={courant?.sorte === sorte || undefined} onClick={() => allerA(sorte)}>
          {compteARegarder(sorte, ou.length)}
        </button>
      ))}
      <span className="chemins__pas" role="group" aria-label="Parcourir ce qui est à regarder">
        <button type="button" className="btn btn--petit" aria-label="Précédent" onClick={() => aller(pas ? pas.rang - 1 : aVoir.length - 1)}>
          <Icone nom="chevron-haut" />
        </button>
        <span className="chemins__compte" aria-live="polite">
          {courant && pas ? `${pas.rang + 1} / ${aVoir.length}` : `– / ${aVoir.length}`}
        </span>
        <button type="button" className="btn btn--petit" aria-label="Suivant" onClick={() => aller(pas ? pas.rang + 1 : 0)}>
          <Icone nom="chevron-bas" />
        </button>
      </span>
    </div>
  ) : (
    <span />
  );
  const montre = courant?.id ?? null;
  const fois = pas?.fois ?? 0;

  return (
    <div className="chemins">
      {etroit === null ? (
        ATTENTE
      ) : etroit ? (
        <Liste chemins={chemins} regard={regard} designee={designee} montre={montre} fois={fois} pourEleve={pourEleve} tete={tete} />
      ) : (
        <Schema chemins={chemins} regard={regard} designee={designee} montre={montre} fois={fois} pourEleve={pourEleve} tete={tete} />
      )}
    </div>
  );
}

/** Sur téléphone : les scènes l'une sous l'autre, dans l'ordre où on les rencontre, chaque choix disant où il mène. */
function Liste({
  chemins, regard, designee, montre, fois, pourEleve, tete,
}: {
  chemins: DonneesDesChemins; regard: ARegarder; designee?: string;
  /** Ce que le parcours de « À regarder » désigne, et le nombre de pas faits : le même élément peut être désigné deux fois */
  montre: string | null; fois: number;
  pourEleve: boolean; tete: ReactNode;
}) {
  const { noeuds, liens, entrees } = chemins;
  const ordre = useMemo(() => ordreDeLecture(noeuds, liens), [noeuds, liens]);
  const liste = useRef<HTMLOListElement>(null);
  const nomDe = (id: string) => {
    const n = noeuds.find((x) => x.id === id);
    return n ? `${pourEleve ? "" : `${referenceScene(n.reference)} `}${n.titre ?? (pourEleve ? "scène sans titre" : "")}`.trim() : "";
  };
  const arriveesDe = (id: string) => liens.filter((l) => l.vers === id && l.de !== id).length + entrees.filter((e) => e.vers === id).length;

  useEffect(() => {
    if (!designee) return;
    liste.current?.querySelector<HTMLElement>(`[data-chemin="${CSS.escape(designee)}"]`)?.scrollIntoView({ block: "center" });
  }, [designee]);
  useEffect(() => {
    if (!montre) return;
    liste.current?.querySelector<HTMLElement>(`[data-chemin="${CSS.escape(montre)}"]`)?.scrollIntoView({ block: "center" });
  }, [montre, fois]);

  return (
    <>
      {regard.sortes.length ? <div className="chemins__tete">{tete}</div> : null}
      <ol className="chemins__liste" ref={liste}>
        {ordre.map((n) => {
          const suites = liens.filter((l) => l.de === n.id);
          const nombre = arriveesDe(n.id);
          const marques = regard.marques.get(n.id) ?? [];
          return (
            <li key={n.id} className={`noeud${designee === n.id ? " est-designe" : ""}`} data-chemin={n.id}>
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
                {marques.includes("rien-n-y-mene") ? (
                  <span className="repere repere--regarder">
                    <span className="point-regarder" aria-hidden="true" />
                    {MOT_DE_MARQUE["rien-n-y-mene"]}
                  </span>
                ) : null}
              </p>
              <div className={`noeud__carte${montre === n.id ? " est-montree" : ""}`}>
                <div className="noeud__tete">
                  {pourEleve ? null : <span className="fiche__ref">{referenceScene(n.reference)}</span>}
                  <TamponScene etat={n.etat} vide={n.vide} />
                </div>
                <p className={`fiche__titre${n.titre ? "" : " fiche__titre--vide"}`}>{n.titre ?? "sans titre"}</p>
                <ul className="noeud__suites">
                  {suites.map((l) => (
                    <li key={l.id} data-chemin={l.id} className={`${l.cache ? "est-cache" : ""}${montre === l.id ? " est-montree" : ""}` || undefined}>
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
                      {l.manque ? (
                        <span className="noeud__manque">
                          <span className="point-regarder" aria-hidden="true" />
                          {l.manque === "sans" ? "Sans destination" : "Scène supprimée"}
                        </span>
                      ) : l.ailleurs ? (
                        l.ailleurs.lien ? (
                          <Link className="noeud__ailleurs" href={l.ailleurs.lien}>
                            <Icone nom="sortie" />
                            {l.ailleurs.chapitre}
                            {l.ailleurs.nom ? ` · ${l.ailleurs.nom}` : ""}
                          </Link>
                        ) : (
                          <span className="noeud__ailleurs">
                            <Icone nom="sortie" />
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
                  {suites.length === 0 && !n.fin && !pourEleve ? (
                    <li className="noeud__sans-suite">
                      {marques.includes("sans-suite") ? <span className="point-regarder" aria-hidden="true" /> : null}
                      {MOT_DE_MARQUE["sans-suite"]}
                    </li>
                  ) : null}
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
    </>
  );
}
