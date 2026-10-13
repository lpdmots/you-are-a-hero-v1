"use client";

import { useState } from "react";
import { Bulle } from "@/composants/Bulle";
import { Classement, type MarcheNommee } from "@/composants/Encouragements";
import { useMessage } from "@/composants/Messages";
import { nomPourEleves } from "@/domaine/eleves";
import { CATEGORIES, classement, premieres, suite, type Marche, type Totaux } from "@/domaine/encouragements";
import type { ElevePlan } from "@/domaine/recit";
import { montrerClassement } from "../../actions-encouragements";

/**
 * Le classement des encouragements, dans la vue « Élèves » du Suivi (F07.5) : les trois
 * meilleurs totaux de chaque catégorie, que les élèves le voient ou non ; « Voir la suite »
 * déroule le classement entier, sans les élèves qui n'ont aucun tampon. L'interrupteur
 * montre aux élèves les trois premiers et leur propre total, rien de plus.
 */
export function ClassementDuSuivi({
  projetId, eleves, totaux, montre: recu,
}: {
  projetId: string; eleves: ElevePlan[]; totaux: ReadonlyMap<string, Totaux>; montre: boolean;
}) {
  const dire = useMessage();
  const [montre, setMontre] = useState(recu);
  const [enCours, setEnCours] = useState(false);
  const [entier, setEntier] = useState(false);
  const eleve = new Map(eleves.map((e) => [e.id, e]));
  const prenom = (id: string) => eleve.get(id)?.prenom ?? "";
  const nommer = (marches: Marche[]): MarcheNommee[] =>
    marches.map((m) => ({ total: m.total, noms: m.eleves.flatMap((id) => (eleve.has(id) ? [{ nom: nomPourEleves(eleve.get(id)!, eleves) }] : [])) }));
  const parCategorie = CATEGORIES.map((c) => ({ categorie: c, marches: classement(totaux, c, prenom) }));
  const ilYAUneSuite = parCategorie.some((c) => suite(c.marches).length > 0);
  const vide = parCategorie.every((c) => c.marches.length === 0);

  const regler = async (voulu: boolean) => {
    setMontre(voulu);
    setEnCours(true);
    const fait = await montrerClassement(projetId, voulu);
    setEnCours(false);
    if (!fait.ok) {
      setMontre(!voulu);
      dire({ texte: fait.erreur });
    }
  };

  return (
    <section className="suivi-classement" aria-labelledby="classement-t">
      <div className="suivi-classement__tete">
        <h2 id="classement-t">Classement des encouragements</h2>
        <label className="inter">
          <input type="checkbox" role="switch" checked={montre} disabled={enCours} onChange={(e) => void regler(e.target.checked)} />
          <span className="inter__piste" aria-hidden="true" />
          <span>Montrer le classement aux élèves</span>
        </label>
        <Bulle question="Que voient les élèves ?">
          <span>Chaque élève voit ses propres encouragements, jamais ceux d’un camarade.</span>
          <span>Si vous montrez le classement, il voit aussi, dans « Mon travail », les trois premiers de chaque catégorie et son propre total. Jamais la suite.</span>
          <span>Un élève sans encouragement y lit quand même les prénoms des premiers.</span>
        </Bulle>
      </div>
      {vide ? (
        <p className="suivi-classement__vide">Aucun encouragement donné pour l’instant. Ils se donnent sur la page d’une scène.</p>
      ) : (
        <Classement colonnes={parCategorie.map((c) => ({ categorie: c.categorie, marches: nommer(premieres(c.marches)), suite: entier ? nommer(suite(c.marches)) : [] }))} />
      )}
      {ilYAUneSuite ? (
        <p className="suivi-classement__suite">
          <button type="button" className="lien" aria-expanded={entier} onClick={() => setEntier((v) => !v)}>
            {entier ? "Revenir aux trois premiers" : "Voir la suite"}
          </button>
          {entier ? <span>La suite, en gris, n’est montrée qu’à vous.</span> : null}
        </p>
      ) : null}
    </section>
  );
}
