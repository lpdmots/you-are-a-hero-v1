"use client";

import { useState } from "react";
import { TexteLu } from "@/composants/copie/Blocs";
import type { Livre } from "@/composants/copie/contexte";
import { Icone } from "@/composants/Icone";
import type { Texte } from "@/domaine/copie";
import { heureEnMots, jourEnMots } from "@/domaine/dates";
import { de, majuscule } from "@/domaine/texte";

/** Ce que l'élève lit d'une reprise demandée : la remarque, et le texte qu'il avait remis (F07.3). */
export type RemarqueLue = { texte: string; le: string };
export type TexteRemis = {
  /** « Bilal », ou rien quand c'est l'élève lui-même */
  par: string | null;
  le: string;
  texte: Texte;
};

/**
 * La remarque montrée seule, en grand, à la première ouverture d'une scène à reprendre,
 * pour l'élève qui s'en occupe (F07.3, idée du porteur, à l'essai). « J'ai lu, j'écris »
 * la range à côté du texte ; elle ne revient pas.
 */
export function RemarqueEnGrand({ prof, remarque, occupe, onLu }: { prof: string; remarque: RemarqueLue; occupe: boolean; onLu: () => void }) {
  return (
    <section className="retour-grand" aria-labelledby="t-remarque">
      <header>
        <Icone nom="demi-tour" />
        <h2 id="t-remarque">{majuscule(prof)} te demande de reprendre ton texte</h2>
      </header>
      {remarque.texte ? (
        <p className="retour-grand__texte">{remarque.texte}</p>
      ) : (
        <p className="retour-grand__texte retour-grand__texte--sans">Pas de remarque écrite. Si tu ne sais pas quoi changer, demande à {prof}.</p>
      )}
      <button type="button" className="btn btn--primaire btn--grand" disabled={occupe} aria-busy={occupe || undefined} onClick={onLu}>
        J’ai lu, j’écris
        <Icone nom="fleche" />
      </button>
    </section>
  );
}

/**
 * « Remarque de Mme Laurent », à côté du texte : pendant la reprise, à la place de la
 * consigne ; après une nouvelle remise, repliée, pour vérifier qu'on y a répondu. Tout
 * élève du chapitre la lit ; elle dit à qui la reprise est signalée (F07-AC16).
 */
export function FicheRemarque({
  prof, remarque, pour, remis, replie, livre,
}: {
  prof: string; remarque: RemarqueLue;
  /** À qui la reprise est signalée : « toi », le prénom d'un camarade, ou personne */
  pour: { moi: true } | { moi: false; prenom: string } | null;
  /** Le texte remis avant cette remarque, que l'élève peut relire */
  remis: TexteRemis | null;
  replie?: boolean;
  livre: Livre;
}) {
  const [ouvert, setOuvert] = useState(false);
  const corps = (
    <div className="carnet-fiche__corps">
      {remarque.texte ? <p className="remarque__texte">{remarque.texte}</p> : <p className="sans-consigne">Reprise demandée, sans remarque écrite.</p>}
      <p className="retour__meta">
        {jourEnMots(remarque.le)}
        {pour ? ` · pour ${pour.moi ? "toi" : pour.prenom}` : ""}
      </p>
      {replie ? null : (
        <>
          {pour && !pour.moi ? <p className="retour__meta">Tu peux lire cette remarque ; c’est {pour.prenom} qui s’occupe de la reprise.</p> : null}
          <p className="retour__meta">Si tu hésites, demande une explication en classe.</p>
          {remis ? (
            <>
              <button type="button" className="btn btn--petit" aria-expanded={ouvert} onClick={() => setOuvert((o) => !o)}>
                <Icone nom="papier" />
                {ouvert ? "Masquer" : "Voir"} {remis.par ? `le texte ${de(remis.par)}` : "mon texte"} du {jourEnMots(remis.le)}
              </button>
              {ouvert ? (
                <div className="remise-apercu">
                  <p className="remise-apercu__tete">
                    Remis {remis.par ? `par ${remis.par} ` : ""}le {jourEnMots(remis.le)}, {heureEnMots(remis.le)}
                  </p>
                  <TexteLu texte={remis.texte} libelle={`Texte remis le ${jourEnMots(remis.le)}`} livre={livre} pourEleve />
                </div>
              ) : null}
            </>
          ) : null}
        </>
      )}
    </div>
  );
  if (replie) {
    return (
      <details className="carnet-fiche carnet-fiche--pli carnet-fiche--retour">
        <summary>
          <header>
            <Icone nom="demi-tour" />
            <h2>Remarque de {prof}</h2>
          </header>
        </summary>
        {corps}
      </details>
    );
  }
  return (
    <section className="carnet-fiche carnet-fiche--retour" aria-labelledby="remarque-t">
      <header>
        <Icone nom="demi-tour" />
        <h2 id="remarque-t">Remarque de {prof}</h2>
      </header>
      {corps}
    </section>
  );
}
