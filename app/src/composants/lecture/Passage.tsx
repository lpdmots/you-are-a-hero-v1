"use client";

import { useState, type ReactNode } from "react";
import { Icone } from "@/composants/Icone";
import type { SigneAction } from "@/domaine/preparation";
import { resoudre, seulRenvoi, type BlocLu, type CibleLue, type EnigmeLue, type MorceauDeChoix, type MotLu, type PassageLu } from "@/domaine/lecture";

/**
 * Un passage tel que le lecteur le lit (F09.1, F12.1) : son texte, ses phrases de choix
 * telles que le livre les imprime, activables, et l'encadré de son énigme. Le même pour la
 * lecture d'essai et le lecteur en ligne ; rien ici ne parle de la base ni de l'éditeur.
 */

/** Une image du livre, servie par l'application, qui vérifie qui peut la voir. */
function ImageDuLivre({ image, alt, className }: { image: string; alt?: string; className?: string }) {
  // eslint-disable-next-line @next/next/no-img-element -- servie par l'application, qui vérifie qui peut la voir
  return <img className={className} src={`/images/${image}?v=1`} alt={alt ?? ""} />;
}

export function Mots({ mots }: { mots: MotLu[] }) {
  return (
    <>
      {mots.map((m, i) => {
        if ("image" in m) return <ImageDuLivre key={i} className="symbole" image={m.image} alt={m.alt} />;
        let n: ReactNode = m.text;
        if (m.bold) n = <strong>{n}</strong>;
        if (m.italic) n = <em>{n}</em>;
        if (m.underline) n = <u>{n}</u>;
        return <span key={i}>{n}</span>;
      })}
    </>
  );
}

/** Ce qu'un renvoi sans suite lisible dit à la place de son numéro (F09-AC17). */
function Manque({ cible, pourEleve }: { cible: CibleLue; pourEleve: boolean }) {
  const mot = pourEleve ? "pas encore de suite" : cible.sorte === "supprimee" ? "scène supprimée" : "à relier";
  return (
    <span className="lu-manque">
      <Icone nom="sablier" />
      {mot}
    </span>
  );
}

const DejaLu = () => (
  <span className="lu-deja">
    <Icone nom="coche" />
    déjà lu
  </span>
);

type Renvoi = Extract<MorceauDeChoix, { renvoi: string }>;
const activable = (c: CibleLue) => c.sorte === "passage" || c.sorte === "ailleurs";

/**
 * Une phrase de choix : à un seul renvoi, elle s'active en entier ; à plusieurs, chaque numéro
 * (F05, F05-AC09). Un renvoi sans suite lisible garde la phrase, avec sa marque, et ne se clique pas.
 */
function PhraseDeChoix({
  bloc, deja, pourEleve, onSuivre,
}: {
  bloc: Extract<BlocLu, { type: "choix" }>; deja: ReadonlySet<string>; pourEleve: boolean; onSuivre: (renvoi: Renvoi) => void;
}) {
  const seul = seulRenvoi(bloc);
  const morceau = (m: MorceauDeChoix, i: number, dedans: boolean) => {
    if ("texte" in m) return <span key={i}>{m.texte}</span>;
    if ("image" in m) return <ImageDuLivre key={i} className="symbole" image={m.image} alt={m.alt} />;
    if (!activable(m.cible)) return <Manque key={i} cible={m.cible} pourEleve={pourEleve} />;
    if (dedans) return <b key={i}>{m.numero}</b>;
    return (
      <button key={i} type="button" className="lu-numero" onClick={() => onSuivre(m)} aria-label={`Aller au ${m.numero}`}>
        {m.numero}
        {deja.has(m.renvoi) ? <span className="vh"> (déjà lu)</span> : null}
      </button>
    );
  };
  if (seul && activable(seul.cible)) {
    return (
      <li>
        <button type="button" className="lu-choix" onClick={() => onSuivre(seul)}>
          <span className="lu-choix__phrase">{bloc.morceaux.map((m, i) => morceau(m, i, true))}</span>
          {deja.has(seul.renvoi) ? <DejaLu /> : null}
          <Icone nom="fleche" />
        </button>
      </li>
    );
  }
  const renvoisLus = bloc.morceaux.filter((m): m is Renvoi => "renvoi" in m && deja.has(m.renvoi));
  return (
    <li>
      <p className="lu-choix lu-choix--fixe">
        <span className="lu-choix__phrase">{bloc.morceaux.map((m, i) => morceau(m, i, false))}</span>
        {renvoisLus.length ? <DejaLu /> : null}
      </p>
    </li>
  );
}

/**
 * L'encadré d'une énigme (F09.1, F12.1) : un numéro à saisir, accepté seulement s'il est celui
 * d'une liaison cachée du passage ; « Passer l'énigme » rejoint la suite prévue, dont l'adulte
 * seul lit le numéro (F09-AC19).
 */
function Enigme({ passage, pourEleve, onSuivre }: { passage: PassageLu; pourEleve: boolean; onSuivre: (e: EnigmeLue) => void }) {
  const [saisie, setSaisie] = useState("");
  const [faux, setFaux] = useState(false);
  const prevue = passage.enigmes[0];
  return (
    <form
      className="lu-enigme"
      onSubmit={(ev) => {
        ev.preventDefault();
        const trouvee = resoudre(passage, saisie);
        if (trouvee && activable(trouvee.cible)) onSuivre(trouvee);
        else setFaux(true);
      }}
    >
      <p className="lu-enigme__titre">
        <Icone nom="cle" />
        Énigme
      </p>
      <div className="lu-enigme__saisie">
        <label className="vh" htmlFor={`enigme-${passage.id}`}>
          Numéro trouvé
        </label>
        <input
          id={`enigme-${passage.id}`}
          className="chiffres"
          type="text"
          inputMode="numeric"
          autoComplete="off"
          placeholder="Numéro trouvé"
          maxLength={4}
          value={saisie}
          aria-invalid={faux || undefined}
          aria-describedby={faux ? `enigme-${passage.id}-faux` : undefined}
          onChange={(ev) => {
            setSaisie(ev.target.value.replace(/\D/g, ""));
            setFaux(false);
          }}
        />
        <button type="submit" className="btn btn--primaire" disabled={!saisie}>
          Y aller
          <Icone nom="fleche" />
        </button>
      </div>
      {faux ? (
        <p className="lu-enigme__faux" id={`enigme-${passage.id}-faux`} role="alert">
          Ce n’est pas ce numéro.
        </p>
      ) : null}
      {prevue ? (
        activable(prevue.cible) ? (
          <p className="lu-enigme__passer">
            <button type="button" className="lien" onClick={() => onSuivre(prevue)}>
              Passer l’énigme
            </button>
            {!pourEleve && prevue.numero ? <span className="lu-enigme__numero">n° {prevue.numero}</span> : null}
          </p>
        ) : (
          <p className="lu-enigme__passer">
            <Manque cible={prevue.cible} pourEleve={pourEleve} />
          </p>
        )
      ) : null}
    </form>
  );
}

export function Passage({
  passage, deja, pourEleve, onSuivre, onEnigme, onAction,
}: {
  passage: PassageLu;
  deja: ReadonlySet<string>;
  pourEleve: boolean;
  onSuivre: (renvoi: Renvoi) => void;
  onEnigme: (e: EnigmeLue) => void;
  /**
   * Le livre a une feuille d'aventure : une action de jeu l'ouvre, sur le dé quand elle le
   * porte. Elle ne fait rien d'autre — c'est le lecteur qui note (F04-AC18).
   */
  onAction?: (signe: SigneAction) => void;
}) {
  const recit = passage.blocs.filter((b) => b.type !== "choix");
  const choix = passage.blocs.filter((b): b is Extract<BlocLu, { type: "choix" }> => b.type === "choix");
  return (
    <>
      {recit.length ? (
        <div className="lu-texte recit">
          {recit.map((b) => {
            if (b.type === "p")
              return (
                <p key={b.id}>
                  <Mots mots={b.mots} />
                </p>
              );
            if (b.type === "action")
              return onAction ? (
                <button key={b.id} type="button" className="lu-action lu-action--feuille" title="Ouvrir ma feuille d’aventure" onClick={() => onAction(b.signe)}>
                  <Icone nom={b.signe} />
                  <span>
                    <Mots mots={b.mots} />
                  </span>
                </button>
              ) : (
                <p key={b.id} className="lu-action">
                  <Icone nom={b.signe} />
                  <span>
                    <Mots mots={b.mots} />
                  </span>
                </p>
              );
            if (b.type === "image")
              return (
                <figure key={b.id} className="lu-image" style={{ width: `${b.page ? 100 : b.largeur}%` }}>
                  <ImageDuLivre image={b.image} alt={b.alt} />
                  {b.legende ? <figcaption>{b.legende}</figcaption> : null}
                </figure>
              );
            return null;
          })}
        </div>
      ) : null}
      {choix.length ? (
        <ul className="lu-choix-liste recit" aria-label="Choix">
          {choix.map((b) => (
            <PhraseDeChoix key={b.id} bloc={b} deja={deja} pourEleve={pourEleve} onSuivre={onSuivre} />
          ))}
        </ul>
      ) : null}
      {passage.enigmes.length ? <Enigme key={passage.id} passage={passage} pourEleve={pourEleve} onSuivre={onEnigme} /> : null}
    </>
  );
}
