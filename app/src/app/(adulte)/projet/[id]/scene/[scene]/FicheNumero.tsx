"use client";

import { useEffect, useRef, useState } from "react";
import { Icone } from "@/composants/Icone";
import { fixerNumero, numeroDeLaScene } from "../../../actions-texte";

/**
 * « Fixer son numéro… » (F11-AC96) : le passage garde le numéro qu'il porte, ou celui que
 * l'adulte écrit — celui que donne une énigme, ou qu'annonce une règle du jeu (« Si tu n'as
 * plus de points de vie, rends-toi au 100 »). Une fiche à filet canard, celui de la décision.
 */
export function FicheNumero({ sceneId, nom, onFixe, onFermer }: { sceneId: string; nom: string; onFixe: (numero: number) => void; onFermer: () => void }) {
  const [lu, setLu] = useState<{ numero: number | null; total: number } | null>(null);
  const [saisie, setSaisie] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [attente, setAttente] = useState(false);
  const titre = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    let actif = true;
    titre.current?.focus();
    void numeroDeLaScene(sceneId).then((fait) => {
      if (!actif) return;
      if (fait.ok) setLu({ numero: fait.numero, total: fait.total });
      else setErreur(fait.erreur);
    });
    return () => {
      actif = false;
    };
  }, [sceneId]);

  const voulu = Number.parseInt(saisie, 10);
  const fixer = async (numero: number) => {
    setAttente(true);
    setErreur(null);
    const fait = await fixerNumero(sceneId, numero);
    setAttente(false);
    if (!fait.ok) return setErreur(fait.erreur);
    onFixe(numero);
  };

  return (
    <section
      className="cx fiche-numero"
      aria-labelledby="fiche-numero-t"
      onKeyDown={(e) => {
        if (e.key === "Escape") onFermer();
      }}
    >
      <header className="cx__tete">
        <Icone nom="cadenas" />
        <h3 id="fiche-numero-t" tabIndex={-1} ref={titre}>
          Fixer le numéro de {nom}
        </h3>
        <button type="button" className="btn btn--discret cx__fermer" onClick={onFermer} aria-label="Fermer la fiche">
          <Icone nom="fermer" />
        </button>
      </header>
      <div className="cx__corps">
        {lu === null && !erreur ? <p role="status">Un instant…</p> : null}
        {lu ? (
          <>
            <p>{lu.numero ? `Ce passage porte le n° ${lu.numero}.` : "Ce passage n’a pas encore de numéro : il est hors du livre."} Fixé, il le gardera, même si d’autres passages changent de place.</p>
            <p className="cx__cmd">
              {lu.numero ? (
                <button type="button" className="btn btn--primaire" disabled={attente} aria-busy={attente || undefined} onClick={() => void fixer(lu.numero!)}>
                  Garder ce numéro
                </button>
              ) : null}
            </p>
            <form
              className="fiche-numero__autre"
              onSubmit={(e) => {
                e.preventDefault();
                if (Number.isInteger(voulu) && voulu >= 1) void fixer(voulu);
              }}
            >
              <label className="champ">
                <span>Ou un autre numéro</span>
                <input className="pchamp" type="text" inputMode="numeric" pattern="[0-9]*" maxLength={4} value={saisie} onChange={(e) => setSaisie(e.target.value.replace(/\D/g, ""))} />
              </label>
              <button type="submit" className="btn" disabled={attente || !Number.isInteger(voulu) || voulu < 1}>
                Fixer ce numéro
              </button>
            </form>
            {Number.isInteger(voulu) && voulu > lu.total ? (
              <p className="cx-note cx-note--avert">
                <Icone nom="alerte" />
                <span>
                  Le livre ne compte que {lu.total} passage{lu.total > 1 ? "s" : ""} pour l’instant. Le numéro sera fixé ; il faudra que le livre atteigne {voulu} passages avant le PDF définitif.
                </span>
              </p>
            ) : null}
          </>
        ) : null}
        {erreur ? (
          <p className="erreur" role="alert">
            {erreur}
          </p>
        ) : null}
      </div>
    </section>
  );
}
