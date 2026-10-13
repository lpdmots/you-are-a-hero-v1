"use client";

import { useState, type ReactNode } from "react";
import { Icone } from "@/composants/Icone";
import { heureEnMots, jourCourt, jourEnMots } from "@/domaine/dates";
import type { Etat, SorteDeScene } from "@/domaine/etats";
import { de } from "@/domaine/texte";
import type { Remarque, Remise } from "@/serveur/relecture";

/** Ce que la fiche dit quand la page montre un autre texte que celui de la scène : elle ne décide pas. */
export type TexteLuAilleurs = { phrase: string } | null;

/**
 * Fiche de décision (docs/design.md, « Page de scène reprise après critique ») : elle ne
 * porte que l'étape suivante. « Votre relecture » pour une scène remise ; « Pour le
 * livre » dès qu'elle est validée, prête ou sans élève. Tout autre état se choisit sur le
 * tampon de l'en-tête.
 */
export function FicheDecision({
  sorte, etat, vide, aChoix, qui, derniere, echec, ailleurs, rappel, reprise, occupe, suite,
  onEtat, onReprise, onAnnulerReprise, onPasMaintenant, onTexteDeLaScene,
}: {
  sorte: SorteDeScene; etat: Etat; vide: boolean; aChoix: boolean;
  /** Le prénom de l'élève qui s'occupe de la scène */
  qui: string | null;
  /** La dernière remise : qui, et quand */
  derniere: { par: string | null; le: string } | null;
  /** Les corrections de l'adulte ne sont pas enregistrées : l'état attend (F07-AC65) */
  echec: boolean;
  ailleurs: TexteLuAilleurs;
  /** Les défauts d'écriture à confirmer avant « prête » (F11.1) */
  rappel: string[] | null;
  /** La remarque de reprise est ouverte */
  reprise: boolean;
  occupe: boolean;
  /** Juste après une décision : la scène suivante à valider (F06.5) */
  suite?: ReactNode;
  onEtat: (etat: Etat, options?: { confirme?: boolean }) => void;
  onReprise: (remarque: string) => void;
  onAnnulerReprise: () => void;
  onPasMaintenant: () => void;
  onTexteDeLaScene: () => void;
}) {
  const seul = sorte !== "eleve";
  const pourLivre = seul || etat === "valide" || etat === "prete";
  const ceQuiCompte = aChoix ? "le texte, l’image et les choix" : "le texte et l’image";
  const prete = (
    <button type="button" className="btn btn--primaire btn--large" disabled={occupe} onClick={() => onEtat("prete")}>
      <Icone nom="livre" />
      Prête pour le livre
    </button>
  );

  let corps: ReactNode;
  if (echec) {
    corps = (
      <p className="decision__attente">
        <Icone nom="horloge" />
        Vos corrections ne sont pas enregistrées. L’état se choisira ensuite.
      </p>
    );
  } else if (ailleurs) {
    corps = (
      <>
        <p>
          {ailleurs.phrase} Pour {sorte === "personnel" ? "choisir" : "décider de"} l’état, revenez au texte de la scène.
        </p>
        <button type="button" className="btn btn--large" onClick={onTexteDeLaScene}>
          <Icone nom="fleche-g" />
          Texte de la scène
        </button>
      </>
    );
  } else if (rappel) {
    corps = (
      <>
        <p className="decision__rappel" role="alert">
          <Icone nom="alerte" />
          <span>
            <b>{rappel.join(" ")}</b> La déclarer prête quand même ?
          </span>
        </p>
        <button type="button" className="btn btn--large" disabled={occupe} onClick={() => onEtat("prete", { confirme: true })}>
          Déclarer prête
        </button>
        <button type="button" className="btn btn--discret btn--large" onClick={onPasMaintenant}>
          Pas maintenant
        </button>
      </>
    );
  } else if (reprise) {
    corps = <Reprise qui={qui} occupe={occupe} onDemander={onReprise} onAnnuler={onAnnulerReprise} />;
  } else if (etat === "prete") {
    corps = (
      <>
        <p className="decision__fait">
          <Icone nom="livre" />
          Prête pour le livre.
        </p>
        <p>Vos retouches gardent cet état.</p>
      </>
    );
  } else if (seul) {
    corps = (
      <>
        <p>
          {etat === "valide"
            ? `Le texte est fini. Quand ${aChoix ? "l’image et les choix vous conviennent" : "l’image vous convient"} aussi :`
            : `Quand ${ceQuiCompte} vous conviennent :`}
        </p>
        {prete}
      </>
    );
  } else if (etat === "valider") {
    corps = (
      <>
        <p>
          {derniere ? (
            <>
              <b>{derniere.par ?? "Un élève"}</b> a remis ce texte le {jourEnMots(derniere.le)}. Vous pouvez le corriger vous-même.
            </>
          ) : (
            "Cette scène attend votre relecture. Vous pouvez corriger le texte vous-même."
          )}
        </p>
        <button type="button" className="btn btn--primaire btn--large" disabled={occupe} onClick={() => onEtat("valide")}>
          <Icone nom="coche" />
          Valider le travail élève
        </button>
        <button type="button" className="btn btn--large" disabled={occupe} onClick={() => onEtat("reprendre")}>
          <Icone nom="demi-tour" />
          Demander une reprise…
        </button>
        <p className="decision__aide">Validé : l’élève a fini. Il vous restera à finir la scène pour le livre.</p>
      </>
    );
  } else if (etat === "reprendre") {
    corps = (
      <p className="decision__attente">
        <Icone nom="horloge" />
        En attente d’une nouvelle remise {qui ? de(qui) : "des élèves"}.
      </p>
    );
  } else if (etat === "valide") {
    corps = (
      <>
        <p>
          Validé : {qui ?? "l’élève"} a fini. Quand {ceQuiCompte} vous conviennent :
        </p>
        {prete}
      </>
    );
  } else {
    corps = (
      <p>
        {vide ? "Le texte est vide." : `${qui ?? "L’élève"} n’a pas encore remis ce texte.`} Vous pouvez l’écrire ou le corriger vous-même.
      </p>
    );
  }

  return (
    <section className="carnet-fiche carnet-fiche--decision" aria-labelledby="decision-t">
      <header>
        <Icone nom={pourLivre ? "livre" : "oeil"} />
        <h2 id="decision-t">{pourLivre ? "Pour le livre" : "Votre relecture"}</h2>
      </header>
      <div className="carnet-fiche__corps decision">
        {corps}
        {!echec && !ailleurs && !rappel && !reprise ? suite : null}
      </div>
    </section>
  );
}

/**
 * « Demander une reprise… » : la remarque, facultative (F07.3). Le retour a pu être donné à
 * l'oral ou sur la feuille de l'élève. La saisie repart de rien à chaque demande.
 */
function Reprise({ qui, occupe, onDemander, onAnnuler }: { qui: string | null; occupe: boolean; onDemander: (remarque: string) => void; onAnnuler: () => void }) {
  const [remarque, setRemarque] = useState("");
  return (
    <>
      <label htmlFor="remarque" className="decision__label">
        Remarque{qui ? ` pour ${qui}` : ""} <span>facultative · lisible par les élèves du chapitre</span>
      </label>
      <textarea id="remarque" className="pchamp" rows={5} maxLength={2000} value={remarque} autoFocus onChange={(e) => setRemarque(e.target.value)} />
      <button type="button" className="btn btn--primaire btn--large" disabled={occupe} onClick={() => onDemander(remarque)}>
        <Icone nom="demi-tour" />
        Demander la reprise
      </button>
      <button type="button" className="btn btn--discret btn--large" onClick={onAnnuler}>
        Annuler
      </button>
    </>
  );
}

/** La dernière reprise demandée, tant que la scène est « À reprendre » : ce que les élèves du chapitre lisent (F07.3). */
export function FicheRemarque({ remarque, qui }: { remarque: Remarque; qui: string | null }) {
  return (
    <section className="carnet-fiche carnet-fiche--retour" aria-labelledby="remarque-t">
      <header>
        <Icone nom="demi-tour" />
        <h2 id="remarque-t">Votre remarque{qui ? ` pour ${qui}` : ""}</h2>
        <span className="fiche-tete__fin">{jourCourt(remarque.creeLe)}</span>
      </header>
      <div className="carnet-fiche__corps">
        {remarque.texte ? <p className="remarque__texte">{remarque.texte}</p> : <p className="sans-consigne">Reprise demandée, sans remarque écrite.</p>}
      </div>
    </section>
  );
}

/** Ce qu'un onglet ou une ligne dit d'une remise : « Remis le 29 septembre », avec l'heure quand deux remises sont du même jour. */
export function nomDeRemise(remise: Remise, toutes: Remise[]): string {
  const jour = jourCourt(remise.remisLe);
  const memeJour = toutes.filter((r) => jourCourt(r.remisLe) === jour).length > 1;
  return `Remis le ${jour}${memeJour ? `, ${heureEnMots(remise.remisLe)}` : ""}`;
}

/**
 * « Remises » : ce que les élèves ont remis, la plus récente d'abord, chacune avec la
 * remarque qui a suivi (F07-AC08, AC25). La fiche n'existe que s'il y en a. Une ligne
 * ouvre le texte remis, en lecture.
 */
export function FicheRemises({
  remises, remarques, nomEleve, montree, onVoir,
}: {
  remises: Remise[]; remarques: Remarque[];
  nomEleve: (id: string | null) => string;
  montree: string | null;
  onVoir: (remiseId: string) => void;
}) {
  if (remises.length === 0) return null;
  return (
    <details className="carnet-fiche carnet-fiche--pli">
      <summary>
        <header>
          <Icone nom="papier" />
          <h2>Remises</h2>
          <span className="fiche-tete__fin">{remises.length}</span>
        </header>
      </summary>
      <div className="carnet-fiche__corps">
        <ol className="historique">
          {[...remises].reverse().map((r) => {
            const suivies = remarques.filter((x) => x.remiseId === r.id);
            return (
              <li key={r.id}>
                <button type="button" className="lien" aria-current={montree === r.id ? "true" : undefined} onClick={() => onVoir(r.id)}>
                  {nomDeRemise(r, remises)}
                </button>{" "}
                · {nomEleve(r.eleveId)}
                <p className="historique__date">
                  {jourEnMots(r.remisLe)}, {heureEnMots(r.remisLe)}
                </p>
                {suivies.map((x) => (
                  <p key={x.id} className="historique__retour">
                    <Icone nom="demi-tour" />
                    {x.texte ? (x.texte.length > 90 ? `${x.texte.slice(0, 90).trimEnd()}…` : x.texte) : "Reprise demandée, sans remarque."}
                  </p>
                ))}
              </li>
            );
          })}
        </ol>
      </div>
    </details>
  );
}
