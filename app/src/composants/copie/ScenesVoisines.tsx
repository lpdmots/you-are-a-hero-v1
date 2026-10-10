"use client";

import Link from "next/link";
import { useState } from "react";
import { Icone } from "@/composants/Icone";
import { TamponScene } from "@/composants/TamponScene";
import { referenceScene } from "@/domaine/recit";
import { lettresLues, Phrase } from "./Blocs";
import type { Livre, Voisine } from "./contexte";

/**
 * Les scènes voisines (F04.3 ; docs/design.md, « Scènes voisines dans la page de scène ») :
 * la fin de la scène d'où arrive le lecteur, avant le texte, et le début de celle où il
 * repart, après. Les extraits prolongent la copie sur le papier grisé des surfaces
 * secondaires ; ils se lisent, sans que le curseur y entre, et ne font partie ni du texte
 * enregistré, ni du livre. Une voisine à la fois : des onglets pour passer de l'une à l'autre.
 */
export function ScenesVoisines({
  sens, voisines, livre, pourEleve, lienDeScene,
}: {
  sens: "avant" | "apres"; voisines: Voisine[]; livre: Livre; pourEleve: boolean;
  /** La page d'une scène voisine que la personne peut ouvrir */
  lienDeScene: (id: string) => string;
}) {
  // La première voisine rédigée est montrée d'abord
  const [choisie, setChoisie] = useState(() => Math.max(0, voisines.findIndex((v) => v.extrait)));
  if (voisines.length === 0) return null;
  const v = voisines[Math.min(choisie, voisines.length - 1)];
  const nom = (x: Voisine): string =>
    x.lisible ? `${pourEleve || x.reference === null ? "" : `${referenceScene(x.reference)} `}${x.titre ?? (pourEleve ? "scène sans titre" : "")}`.trim() : "Autre chapitre";
  const titre = sens === "avant" ? "Juste avant" : "Juste après";

  const outil = (
    <div className="voisine__outil">
      <span className="voisine__sens">{titre}</span>
      {voisines.length > 1 ? (
        <div className="voisine__onglets" role="tablist" aria-label={`${titre} : ${voisines.length} scènes`}>
          {voisines.map((x, i) => (
            <button key={x.id} type="button" role="tab" aria-selected={i === choisie} onClick={() => setChoisie(i)}>
              {nom(x)}
            </button>
          ))}
        </div>
      ) : (
        <span className="voisine__nom">{nom(v)}</span>
      )}
      {v.lisible ? <TamponScene vide={v.vide} /> : <span className="voisine__ailleurs">{v.chapitre}</span>}
      {v.cache ? (
        <span className="repere">
          <Icone nom="cle" />
          lien caché
        </span>
      ) : sens === "apres" && v.libelle ? (
        <span className="voisine__choix">si le lecteur choisit « {v.libelle} »</span>
      ) : null}
      {v.lisible ? (
        <Link className="voisine__ouvrir" href={lienDeScene(v.id)} aria-label={`Ouvrir ${nom(v) || "la scène"}`}>
          Ouvrir
          <Icone nom="fleche" />
        </Link>
      ) : null}
    </div>
  );
  const extrait = v.extrait ? (
    <div className="voisine__extrait recit" lang="fr">
      {sens === "avant" && v.suite ? <p className="voisine__coupe">[…]</p> : null}
      <p>{v.extrait.children.map(lettresLues)}</p>
      {sens === "avant" && v.phrase ? (
        <p className="voisine__phrase">
          <Phrase bloc={v.phrase} livre={livre} formule={livre.formule} />
        </p>
      ) : null}
      {sens === "apres" && v.suite ? <p className="voisine__coupe">[…]</p> : null}
    </div>
  ) : null;

  return (
    <aside className={`voisine voisine--${sens}`} aria-label={titre}>
      {sens === "avant" ? outil : null}
      {extrait}
      {sens === "apres" ? outil : null}
    </aside>
  );
}
