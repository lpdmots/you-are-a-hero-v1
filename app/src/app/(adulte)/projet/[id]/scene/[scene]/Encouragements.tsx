"use client";

import { useState } from "react";
import { SigneEncouragement, TamponEncouragement } from "@/composants/Encouragements";
import { CATEGORIES, NOM_CATEGORIE, type Categorie, type Encouragement, type SansTampon } from "@/domaine/encouragements";

const PERSONNE: Record<SansTampon, string> = {
  "sans-eleve": "Aucun élève ne s’occupe de cette scène.",
  enseignant: "Aucun élève ne s’occupe de cette scène : elle est à votre nom.",
  "texte-vide": "Pas encore de texte à encourager.",
};

/**
 * « Encouragements pour Bilal » (F07.5) : trois tampons, « Effort », « Fine plume »,
 * « Créativité ». Un clic donne, un second retire, sans confirmation, à tout moment dès que
 * la scène a un élève et un texte. Le tampon va à l'élève qui s'occupe de la scène et lui
 * reste : ceux d'un élève d'avant se lisent dessous, « Effort, pour Alice » (F07-AC78).
 */
export function FicheEncouragements({
  eleve, raison, donnes, nomEleve, enCours, onEncourager,
}: {
  /** L'élève qui s'occupe de la scène : son identifiant et son prénom */
  eleve: { id: string; nom: string } | null;
  /** Pourquoi il n'y a personne à encourager ; rien quand les tampons se donnent (F07-AC79) */
  raison: SansTampon | null;
  donnes: Encouragement[];
  nomEleve: (id: string) => string;
  /** Le tampon dont la base n'a pas encore répondu */
  enCours: Categorie | null;
  onEncourager: (categorie: Categorie, donner: boolean) => void;
}) {
  // L'appui du tampon ne se joue que pour celui qu'on vient de poser, pas à chaque ouverture de la page
  const [pose, setPose] = useState<Categorie | null>(null);
  const aLui = new Set(donnes.filter((d) => d.eleveId === eleve?.id).map((d) => d.categorie));
  const anciens = donnes.filter((d) => d.eleveId !== eleve?.id);
  const personne = raison === "sans-eleve" || raison === "enseignant" || !eleve;
  return (
    <section className="carnet-fiche carnet-fiche--encre" aria-labelledby="encouragements-t">
      <header>
        <h2 id="encouragements-t">{personne ? "Encouragements" : `Encouragements pour ${eleve.nom}`}</h2>
      </header>
      <div className="carnet-fiche__corps">
        {raison && !(raison === "texte-vide" && aLui.size) ? (
          <p className="decision__aide">{PERSONNE[raison]}</p>
        ) : null}
        {/* Un tampon déjà donné se retire toujours, même si le texte a été vidé depuis */}
        {!personne && (!raison || aLui.size) ? (
          <div className="encourager" role="group" aria-labelledby="encouragements-t">
            {CATEGORIES.map((c) => {
              const donne = aLui.has(c);
              return (
                <button
                  key={c}
                  type="button"
                  aria-pressed={donne}
                  // Pendant l'envoi, le bouton reste là où est le clavier : il ignore seulement le clic
                  aria-disabled={enCours !== null || undefined}
                  disabled={!donne && raison !== null}
                  data-pose={pose === c && donne ? "" : undefined}
                  onClick={() => {
                    if (enCours !== null) return;
                    setPose(donne ? null : c);
                    onEncourager(c, !donne);
                  }}
                >
                  <TamponEncouragement categorie={c} taille="m" pale={!donne} />
                  {NOM_CATEGORIE[c]}
                </button>
              );
            })}
          </div>
        ) : null}
        {anciens.length ? (
          <ul className="encres-anciennes" aria-label="Encouragements déjà donnés sur cette scène">
            {anciens.map((a) => (
              <li key={`${a.eleveId}-${a.categorie}`}>
                <SigneEncouragement categorie={a.categorie} />
                {NOM_CATEGORIE[a.categorie]}, pour {nomEleve(a.eleveId)}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  );
}
