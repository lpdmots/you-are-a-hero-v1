"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import {
  aRegarder, compteARegarder, MOT_DE_MARQUE, ordreDeLecture, peutConstruire, type ARegarder, type Chemins as DonneesDesChemins, type EntreeDeChemin, type LienDeChemin,
  type NoeudDeChemin, type SorteARegarder,
} from "@/domaine/chemins";
import type { Construire } from "./chemins/Construire";
import { referenceScene } from "@/domaine/recit";
import { Bulle } from "./Bulle";
import { Icone } from "./Icone";
import { TamponScene } from "./TamponScene";
import { nomDuChoix } from "@/domaine/copie";

/**
 * La vue « Chemins » d'un chapitre (F03.1, « Vue Chemins à reprendre » ; docs/design.md,
 * « Vue Chemins reprise ») : les mêmes scènes que la vue « Scènes », reliées par leurs choix.
 * Les chemins se déduisent des textes. Sur un écran large, un schéma de haut en bas dans un
 * cadre qu'on tire (F03.1, « Chemins en atelier »), qui ne se charge qu'ici ; sur téléphone, la
 * liste des scènes, chaque choix disant où il mène. En tête, ce qu'il y a « à regarder ». L'élève
 * et le téléphone lisent sans rien modifier ; sur un écran large, l'adulte y construit le plan
 * (F03.1, « Construire dans Chemins », F03-AC57).
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

/**
 * Le « i » de la vue « Chemins », à côté de la bascule « Scènes / Chemins » : comment lire le
 * schéma, s'y déplacer et, pour l'adulte d'un récit à choix, y construire.
 */
export function AideDesChemins({ pourEleve = false, construit = false }: { pourEleve?: boolean; construit?: boolean }) {
  return (
    <Bulle question="Comment lire ces chemins ?">
      Sous chaque scène, ses choix : un trait part de chacun vers la scène où il mène. {pourEleve ? "" : "Un trait en petits points est un lien caché. "}Un choix qui ramène le lecteur
      en arrière, qui mène dans un autre chapitre ou qui n’a pas encore de destination le dit sous sa phrase.
      <span>Tirer le fond déplace le schéma ; la molette change sa taille.</span>
      {construit ? (
        <span>
          Pour construire : le « + » sous une scène ajoute la scène suivante ; tiré jusqu’à une autre scène, il les relie. Un choix « Sans destination » se tire lui aussi jusqu’à une scène.
          Une scène cliquée ouvre son titre, sa consigne et ses choix.
        </span>
      ) : (
        <span>Cliquer une scène montre ses chemins.</span>
      )}
    </Bulle>
  );
}

export function Chemins({
  noeuds, liens, entrees, designee, pourEleve = false, construire,
}: {
  noeuds: NoeudDeChemin[]; liens: LienDeChemin[]; entrees: EntreeDeChemin[];
  /** La scène où mène le choix qu'on vient de suivre depuis un autre chapitre */
  designee?: string;
  pourEleve?: boolean;
  /** Les gestes de l'adulte en récit à choix : ajouter une scène, relier, titre et consigne, supprimer (F03.1) */
  construire?: Construire;
}) {
  const etroit = useSyncExternalStore(suivreLaLargeur, estEtroit, pasEncoreSu);
  const chemins = useMemo<DonneesDesChemins>(() => ({ noeuds, liens, entrees }), [noeuds, liens, entrees]);
  // Un élève ne connaît ni les chemins venus d'autres chapitres ni les liens cachés : on ne lui dit que ses choix
  const regard = useMemo(() => aRegarder(chemins, { rienNyMene: !pourEleve }), [chemins, pourEleve]);
  // Tout ce qui est à regarder, à la suite : on le parcourt comme les occurrences d'un mot dans un texte
  const aVoir = useMemo(() => regard.sortes.flatMap(({ sorte, ou }) => ou.map((id) => ({ sorte, id }))), [regard]);
  // Le pas retient le cas désigné, pas son rang : un cas réglé — un choix qu'on vient de relier, une scène qui a
  // reçu sa suite — quitte la liste sans que la vue parte d'elle-même vers le suivant
  const [pas, setPas] = useState<{ id: string; fois: number } | null>(null);
  const rang = pas ? aVoir.findIndex((x) => x.id === pas.id) : -1;
  const courant = rang === -1 ? null : aVoir[rang];
  const aller = (vers: number) => setPas((avant) => ({ id: aVoir[((vers % aVoir.length) + aVoir.length) % aVoir.length].id, fois: (avant?.fois ?? 0) + 1 }));
  // Un compte cliqué mène au premier de sa sorte ; cliqué de nouveau, au suivant de la même sorte
  const allerA = (sorte: SorteARegarder) => {
    const rangs = aVoir.flatMap((x, i) => (x.sorte === sorte ? [i] : []));
    const ici = courant?.sorte === sorte ? rangs.indexOf(rang) : -1;
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
        <button type="button" className="btn btn--petit" aria-label="Précédent" onClick={() => aller(courant ? rang - 1 : aVoir.length - 1)}>
          <Icone nom="chevron-haut" />
        </button>
        <button type="button" className="btn btn--petit" aria-label="Suivant" onClick={() => aller(courant ? rang + 1 : 0)}>
          <Icone nom="chevron-bas" />
        </button>
        {/* Après les flèches, qui ne bougent pas ; rien tant qu'aucun cas n'est désigné : « – / 6 » ne disait rien
            (révision de novembre 2026) */}
        <span className="chemins__compte" aria-live="polite">
          {courant ? `${rang + 1} / ${aVoir.length}` : null}
        </span>
      </span>
    </div>
  ) : null;
  const quitterLeCas = useCallback(() => setPas(null), []);
  const montre = courant?.id ?? null;
  const fois = pas?.fois ?? 0;

  return (
    <div className="chemins">
      {etroit === null ? (
        ATTENTE
      ) : etroit ? (
        <Liste chemins={chemins} regard={regard} designee={designee} montre={montre} fois={fois} pourEleve={pourEleve} tete={tete} />
      ) : (
        <Schema
          chemins={chemins} regard={regard} designee={designee} montre={montre} fois={fois} tete={tete} onPlan={quitterLeCas}
          construire={peutConstruire({ adulte: !pourEleve, aChoix: !!construire, etroit }) ? construire : undefined}
        />
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
                          nomDuChoix(l)
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
