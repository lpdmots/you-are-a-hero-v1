"use client";

import Link from "next/link";
import { useState } from "react";
import { Bulle } from "@/composants/Bulle";
import { Icone } from "@/composants/Icone";
import { immobileDe, numerosDuGroupe, POURQUOI_IMMOBILE } from "@/domaine/ordre";
import { planNumerote } from "@/domaine/numeros";
import type { Plan } from "@/domaine/recit";
import { annulerPlacement, deplacerPassage, reglerNouvellePage } from "../../actions-livre";
import type { Deplacement } from "@/domaine/ordre";

/**
 * « Ce passage dans le livre » (F11.3), au-dessus de la scène ouverte à côté de l'aperçu, au
 * volet « Aperçu » de « Mettre en page » seulement (F11-AC61) : sa place, ses commandes, en
 * une ligne. Chaque action se dit au-dessus de l'aperçu, avec « Annuler » (F11-AC45).
 */
export function CePassage({
  projetId, aChoix, plan, sceneId, numero, page, onFait,
}: {
  projetId: string;
  aChoix: boolean;
  plan: Plan;
  sceneId: string;
  numero: number | null;
  page: number | null;
  /** Ce qui vient d'être fait, et de quoi le défaire */
  onFait: (f: { texte: string; annuler: () => Promise<{ ok: boolean }> }) => void;
}) {
  const scene = plan.parties.flatMap((p) => p.chapitres.flatMap((c) => c.scenes)).find((s) => s.id === sceneId);
  const [nouvellePage, setNouvellePage] = useState(scene?.nouvellePage === true);
  const [cible, setCible] = useState("");
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const numerote = planNumerote(plan);
  const immobile = aChoix ? immobileDe(numerote, sceneId) : null;
  const bornes = aChoix ? numerosDuGroupe(numerote, sceneId) : null;

  const bouger = async (d: Deplacement) => {
    setEnCours(true);
    setErreur(null);
    const r = await deplacerPassage(projetId, sceneId, d);
    setEnCours(false);
    if (!r.ok) return setErreur(r.erreur);
    setCible("");
    onFait({
      texte: `Passé du n° ${r.avant} au n° ${r.apres} · les renvois suivent.`,
      annuler: () => annulerPlacement(projetId, r.annuler),
    });
  };
  const basculer = async (oui: boolean) => {
    setNouvellePage(oui);
    setErreur(null);
    const r = await reglerNouvellePage(sceneId, oui);
    if (!r.ok) {
      setNouvellePage(!oui);
      return setErreur(r.erreur);
    }
    const nom = numero ? `Le n° ${numero}` : "La scène";
    onFait({
      texte: oui ? `${nom} commence sur une nouvelle page.` : `${nom} suit le texte précédent.`,
      annuler: async () => {
        setNouvellePage(!oui);
        return reglerNouvellePage(sceneId, !oui);
      },
    });
  };

  return (
    <section className="ce-passage" aria-label="Ce passage dans le livre">
      <p className="ce-passage__ou">
        {numero ? <b>n° {numero}</b> : <b>Dans le livre</b>}
        {page ? <span> · page {page}</span> : null}
      </p>
      {aChoix ? (
        immobile ? (
          <p className="ce-passage__garde">{POURQUOI_IMMOBILE[immobile]}</p>
        ) : (
          <div className="ce-passage__cmd" role="group" aria-label="Place du passage">
            <button type="button" className="btn btn--petit" disabled={enCours} onClick={() => void bouger({ sorte: "monter" })}>
              <Icone nom="chevron-haut" />
              Monter
            </button>
            <button type="button" className="btn btn--petit" disabled={enCours} onClick={() => void bouger({ sorte: "descendre" })}>
              <Icone nom="chevron-bas" />
              Descendre
            </button>
            <form
              className="ce-passage__apres"
              onSubmit={(ev) => {
                ev.preventDefault();
                const n = Number.parseInt(cible, 10);
                if (Number.isInteger(n)) void bouger({ sorte: "apres", numero: n });
              }}
            >
              <label>
                <span>Placer après le n°</span>
                <input className="pchamp" inputMode="numeric" value={cible} onChange={(ev) => setCible(ev.target.value.replace(/\D/g, "").slice(0, 4))} />
              </label>
              <button type="submit" className="btn btn--petit" disabled={enCours || !cible}>
                Placer
              </button>
              {bornes ? (
                <Bulle question="Où peut-il aller ?">
                  <span>
                    Dans sa partie, du n° {bornes.min} au n° {bornes.max}. Les numéros suivants se décalent, les renvois suivent ; aucune destination ne change.
                  </span>
                </Bulle>
              ) : null}
            </form>
          </div>
        )
      ) : (
        <p className="ce-passage__garde">
          L’ordre des scènes se change dans les{" "}
          <Link className="lien" href={`/projet/${projetId}/plan`}>
            Parties et chapitres
          </Link>
          .
        </p>
      )}
      <label className="inter ce-passage__page">
        <input type="checkbox" role="switch" checked={nouvellePage} onChange={(ev) => void basculer(ev.target.checked)} />
        <span className="inter__piste" aria-hidden="true" />
        <span>Commencer sur une nouvelle page</span>
      </label>
      {erreur ? (
        <p className="erreur" role="alert">
          {erreur}
        </p>
      ) : null}
    </section>
  );
}
