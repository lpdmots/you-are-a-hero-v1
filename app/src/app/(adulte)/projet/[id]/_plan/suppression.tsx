"use client";

import { useState, type ReactNode } from "react";
import { enumerer } from "@/composants/copie/noms";
import { Dialogue } from "@/composants/Dialogue";
import { nomPourEleves } from "@/domaine/eleves";
import { referenceScene, travailDans, type ElevePlan, type Plan } from "@/domaine/recit";
import { pluriel } from "@/domaine/texte";

type Sorte = "partie" | "chapitre" | "scene";
type Demande = { nom: string; faits: string[]; faire: () => void };

/**
 * « Supprimer » un élément qui a du texte demande d'abord confirmation : le dialogue dit
 * le nombre de scènes écrites et les élèves qui y ont écrit, et que rien n'est effacé
 * (F03-AC13, AC22). Un élément sans texte se supprime tout de suite, avec « Annuler »
 * dans le message.
 */
export function useConfirmerSuppression({ plan, eleves }: { plan: Plan; eleves: ElevePlan[] }): {
  /** nom : comme il se dit dans une phrase — « La lisière », ou « S015 « Le pont » » */
  demander: (sorte: Sorte, id: string, nom: string, faire: () => void) => void;
  dialogue: ReactNode;
} {
  const [demande, setDemande] = useState<Demande | null>(null);
  return {
    demander: (sorte, id, nom, faire) => {
      const t = travailDans(plan, sorte, id);
      // Sans texte et sans choix qui y mène, rien à annoncer : la suppression part tout de suite
      if (t.ecrites === 0 && t.menentIci.length === 0) return faire();
      const auteurs = t.auteurs.flatMap((a) => {
        const e = eleves.find((x) => x.id === a);
        return e ? [nomPourEleves(e, eleves)] : [];
      });
      const faits: string[] = [];
      if (sorte === "scene") {
        if (t.ecrites) faits.push("Cette scène a un texte.");
      } else if (t.ecrites) {
        const contenu = sorte === "partie" ? `${t.chapitres} chapitre${pluriel(t.chapitres)} et ${t.scenes} scène${pluriel(t.scenes)}` : `${t.scenes} scène${pluriel(t.scenes)}`;
        faits.push(`${contenu}, dont ${t.ecrites} ${t.ecrites > 1 ? "ont un texte" : "a un texte"}.`);
      }
      if (auteurs.length) faits.push(`${enumerer(auteurs)} y ${auteurs.length > 1 ? "ont" : "a"} écrit.`);
      // Le lien affecté est annoncé, et ne sera redirigé vers aucune autre scène (F03-AC13, AC14)
      if (t.menentIci.length) {
        const depuis = enumerer(t.menentIci.map((s) => referenceScene(s.reference)));
        faits.push(`${t.menentIci.length > 1 ? "Des choix y mènent" : "Un choix y mène"}, depuis ${depuis} : ${t.menentIci.length > 1 ? "ils ne seront redirigés" : "il ne sera redirigé"} nulle part.`);
      }
      faits.push("Rien n’est effacé : vous retrouvez tout dans la corbeille du projet.");
      setDemande({ nom, faits, faire });
    },
    dialogue: demande ? (
      <Dialogue
        titre={`Supprimer ${demande.nom} ?`}
        onFermer={() => setDemande(null)}
        boutons={
          <button
            type="button"
            className="btn btn--danger"
            onClick={() => {
              const { faire } = demande;
              setDemande(null);
              faire();
            }}
          >
            Supprimer
          </button>
        }
      >
        <ul className="dialogue__faits">
          {demande.faits.map((f) => (
            <li key={f}>{f}</li>
          ))}
        </ul>
      </Dialogue>
    ) : null,
  };
}
